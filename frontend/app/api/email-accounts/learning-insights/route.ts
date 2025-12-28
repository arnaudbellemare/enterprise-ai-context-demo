/**
 * Learning Insights API
 * Provides insights on what the system has learned from auto-responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/email-accounts/learning-insights
 * Get learning insights for an account
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get auto-response statistics
    const { data: autoResponses, error: autoResponseError } = await supabase
      .from('email_auto_responses')
      .select('*')
      .eq('account_id', accountId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (autoResponseError) {
      console.error('[Learning Insights] Error fetching auto-responses:', autoResponseError);
    }

    // Get learning insights
    const { data: insights, error: insightsError } = await supabase
      .from('email_learning_insights')
      .select('*')
      .eq('account_id', accountId)
      .order('usage_count', { ascending: false })
      .limit(50);

    if (insightsError) {
      console.error('[Learning Insights] Error fetching insights:', insightsError);
    }

    // Aggregate statistics
    const stats = {
      totalResponsesGenerated: autoResponses?.length || 0,
      responsesRequiringReview: autoResponses?.filter(r => r.requires_human_review).length || 0,
      responsesSent: autoResponses?.filter(r => r.sent).length || 0,
      averageConfidence: autoResponses && autoResponses.length > 0
        ? autoResponses.reduce((sum, r) => sum + parseFloat(r.confidence), 0) / autoResponses.length
        : 0,
      templateDistribution: {} as Record<string, number>,
      patternDistribution: {} as Record<string, number>,
      confidenceTrend: [] as Array<{ date: string; avgConfidence: number }>
    };

    // Calculate template distribution
    autoResponses?.forEach(response => {
      const template = response.template_id;
      stats.templateDistribution[template] = (stats.templateDistribution[template] || 0) + 1;
    });

    // Calculate pattern distribution from insights
    insights?.forEach(insight => {
      const pattern = insight.pattern;
      stats.patternDistribution[pattern] = (stats.patternDistribution[pattern] || 0) + insight.usage_count;
    });

    // Calculate confidence trend (daily averages)
    const dailyConfidence = new Map<string, { sum: number; count: number }>();
    autoResponses?.forEach(response => {
      const date = new Date(response.created_at).toISOString().split('T')[0];
      const current = dailyConfidence.get(date) || { sum: 0, count: 0 };
      dailyConfidence.set(date, {
        sum: current.sum + parseFloat(response.confidence),
        count: current.count + 1
      });
    });

    stats.confidenceTrend = Array.from(dailyConfidence.entries())
      .map(([date, data]) => ({
        date,
        avgConfidence: data.sum / data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top patterns learned
    const topPatterns = insights
      ?.sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10)
      .map(insight => ({
        pattern: insight.pattern,
        template: insight.template_name,
        usageCount: insight.usage_count,
        averageConfidence: parseFloat(insight.confidence),
        lastUsed: insight.last_used_at
      })) || [];

    return NextResponse.json({
      success: true,
      stats,
      topPatterns,
      recentResponses: autoResponses?.slice(0, 20).map(r => ({
        id: r.id,
        subject: r.subject,
        from: r.from_email,
        classification: r.classification,
        confidence: parseFloat(r.confidence),
        requiresHumanReview: r.requires_human_review,
        sent: r.sent,
        createdAt: r.created_at
      })) || [],
      insights: insights?.map(i => ({
        pattern: i.pattern,
        template: i.template_name,
        usageCount: i.usage_count,
        confidence: parseFloat(i.confidence),
        responseQuality: i.response_quality,
        lastUsed: i.last_used_at
      })) || []
    });

  } catch (error: any) {
    console.error('[Learning Insights] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch learning insights'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-accounts/learning-insights
 * Update learning insights with user feedback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { responseId, feedback, accountId } = body;

    if (!responseId || !feedback || !accountId) {
      return NextResponse.json(
        { error: 'Response ID, feedback, and account ID are required' },
        { status: 400 }
      );
    }

    // Update auto-response record with feedback
    const { error: updateError } = await supabase
      .from('email_auto_responses')
      .update({
        user_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId)
      .eq('account_id', accountId);

    if (updateError) {
      console.error('[Learning Insights] Error updating feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    // Get the response to update insights
    const { data: response } = await supabase
      .from('email_auto_responses')
      .select('template_id, classification, pattern')
      .eq('id', responseId)
      .single();

    if (response) {
      // Update or create learning insight
      const { data: existingInsight } = await supabase
        .from('email_learning_insights')
        .select('*')
        .eq('account_id', accountId)
        .eq('template_id', response.template_id)
        .single();

      if (existingInsight) {
        await supabase
          .from('email_learning_insights')
          .update({
            response_quality: feedback === 'helpful' ? 'good' : feedback === 'not_helpful' ? 'poor' : 'needs_improvement',
            usage_count: existingInsight.usage_count + 1,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInsight.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error: any) {
    console.error('[Learning Insights] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to record feedback'
      },
      { status: 500 }
    );
  }
}

