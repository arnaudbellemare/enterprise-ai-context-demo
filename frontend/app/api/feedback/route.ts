/**
 * User Feedback API - Collect Human Preferences for Judge Training
 * 
 * Enables human users to mark bullets as helpful/harmful
 * Feeds into Human → Judge → Student pipeline (Phase 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { bullet_id, is_helpful, user_id, comment, context } = await req.json();

    // Validate input
    if (!bullet_id || is_helpful === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: bullet_id, is_helpful' },
        { status: 400 }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Store user feedback
    const { data, error } = await supabase
      .from('user_feedback')
      .insert({
        bullet_id,
        is_helpful,
        user_id: user_id || 'anonymous',
        comment: comment || null,
        context: context || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to store feedback', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ User feedback stored: bullet=${bullet_id}, helpful=${is_helpful}`);

    // Return success with updated counts (we'll aggregate on read)
    return NextResponse.json({
      success: true,
      feedback_id: data.id,
      bullet_id,
      is_helpful,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve feedback statistics for bullets
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bullet_id = searchParams.get('bullet_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Query feedback
    let query = supabase
      .from('user_feedback')
      .select('id, bullet_id, user_id, is_helpful, comment, context, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (bullet_id) {
      query = query.eq('bullet_id', bullet_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve feedback', details: error.message },
        { status: 500 }
      );
    }

    // Aggregate statistics per bullet
    const stats: Record<string, { helpful: number; harmful: number; total: number }> = {};
    
    data.forEach(feedback => {
      if (!stats[feedback.bullet_id]) {
        stats[feedback.bullet_id] = { helpful: 0, harmful: 0, total: 0 };
      }
      
      if (feedback.is_helpful) {
        stats[feedback.bullet_id].helpful++;
      } else {
        stats[feedback.bullet_id].harmful++;
      }
      stats[feedback.bullet_id].total++;
    });

    return NextResponse.json({
      success: true,
      feedback: data,
      stats,
      count: data.length
    });

  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

