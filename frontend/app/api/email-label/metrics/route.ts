/**
 * Email Classification Metrics API
 *
 * Provides endpoints for:
 * - Classification accuracy by template
 * - Performance trends over time
 * - Confidence calibration analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getClassificationAccuracy,
  getCalibrationData
} from '../../../../lib/email-classification/supabase-storage';
import { supabase } from '../../../../lib/supabase';

/**
 * GET: Get classification metrics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('templateId') || undefined;
    const daysBack = parseInt(searchParams.get('daysBack') || '30');
    const metricType = searchParams.get('type') || 'accuracy';

    if (metricType === 'accuracy') {
      // Get classification accuracy by template
      const accuracy = await getClassificationAccuracy(templateId, daysBack);

      return NextResponse.json({
        success: true,
        metricType: 'accuracy',
        data: accuracy,
        filters: {
          templateId: templateId || 'all',
          daysBack
        }
      });
    }

    if (metricType === 'calibration') {
      // Get confidence calibration data
      const calibrationData = await getCalibrationData(templateId, 500);

      // Calculate calibration metrics
      const buckets = [
        { min: 0.0, max: 0.2, predicted: 0.1, actual: 0, count: 0 },
        { min: 0.2, max: 0.4, predicted: 0.3, actual: 0, count: 0 },
        { min: 0.4, max: 0.6, predicted: 0.5, actual: 0, count: 0 },
        { min: 0.6, max: 0.8, predicted: 0.7, actual: 0, count: 0 },
        { min: 0.8, max: 1.0, predicted: 0.9, actual: 0, count: 0 }
      ];

      calibrationData.forEach(item => {
        const bucket = buckets.find(
          b => item.predicted_confidence >= b.min &&
               item.predicted_confidence < b.max
        );

        if (bucket) {
          bucket.count++;
          bucket.actual += item.actual_correct ? 1 : 0;
        }
      });

      // Calculate actual accuracy per bucket
      buckets.forEach(bucket => {
        if (bucket.count > 0) {
          bucket.actual = bucket.actual / bucket.count;
        }
      });

      // Calculate Expected Calibration Error (ECE)
      let ece = 0;
      let totalSamples = calibrationData.length;
      buckets.forEach(bucket => {
        if (bucket.count > 0) {
          ece += (bucket.count / totalSamples) *
                 Math.abs(bucket.predicted - bucket.actual);
        }
      });

      return NextResponse.json({
        success: true,
        metricType: 'calibration',
        data: {
          buckets,
          ece: ece.toFixed(4),
          totalSamples,
          interpretation: ece < 0.05 ? 'Well-calibrated' :
                         ece < 0.1 ? 'Moderately calibrated' :
                         'Poorly calibrated - consider temperature scaling'
        },
        filters: {
          templateId: templateId || 'all',
          sampleLimit: 500
        }
      });
    }

    if (metricType === 'performance') {
      // Get performance metrics (processing time, method distribution)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const { data: metrics, error } = await supabase
        .from('email_classification_metrics')
        .select('classification_method, processing_time_ms, predicted_confidence, created_at')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw error;
      }

      // Calculate performance statistics
      const methodCounts: Record<string, number> = {};
      const processingTimes: number[] = [];
      const confidenceScores: number[] = [];

      (metrics || []).forEach(m => {
        methodCounts[m.classification_method] =
          (methodCounts[m.classification_method] || 0) + 1;

        if (m.processing_time_ms) {
          processingTimes.push(m.processing_time_ms);
        }

        if (m.predicted_confidence) {
          confidenceScores.push(m.predicted_confidence);
        }
      });

      // Calculate p50, p95, p99 latencies
      processingTimes.sort((a, b) => a - b);
      const p50 = processingTimes[Math.floor(processingTimes.length * 0.5)] || 0;
      const p95 = processingTimes[Math.floor(processingTimes.length * 0.95)] || 0;
      const p99 = processingTimes[Math.floor(processingTimes.length * 0.99)] || 0;

      // Average confidence
      const avgConfidence = confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

      return NextResponse.json({
        success: true,
        metricType: 'performance',
        data: {
          methodDistribution: methodCounts,
          latency: {
            p50: p50.toFixed(0),
            p95: p95.toFixed(0),
            p99: p99.toFixed(0),
            unit: 'ms'
          },
          avgConfidence: avgConfidence.toFixed(3),
          totalQueries: (metrics || []).length
        },
        filters: {
          daysBack,
          sampleLimit: 1000
        }
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Unknown metric type: ${metricType}. Valid types: accuracy, calibration, performance`
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch metrics'
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Track user feedback on classifications
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      emailHash,
      predictedTemplateId,
      predictedTemplateName,
      predictedConfidence,
      actualTemplateId,
      actualTemplateName,
      correct,
      userFeedback,
      feedbackType
    } = body;

    if (!emailHash || !predictedTemplateId || predictedConfidence === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'emailHash, predictedTemplateId, and predictedConfidence are required'
        },
        { status: 400 }
      );
    }

    // Update existing metric with user feedback
    const { error: updateError } = await supabase
      .from('email_classification_metrics')
      .update({
        actual_template_id: actualTemplateId,
        actual_template_name: actualTemplateName,
        correct,
        user_feedback: userFeedback,
        feedback_type: feedbackType,
        updated_at: new Date().toISOString()
      })
      .eq('email_hash', emailHash)
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.warn('Failed to update metric, creating new entry');

      // If update fails, insert as new metric
      const { error: insertError } = await supabase
        .from('email_classification_metrics')
        .insert({
          email_hash: emailHash,
          predicted_template_id: predictedTemplateId,
          predicted_template_name: predictedTemplateName,
          predicted_confidence: predictedConfidence,
          actual_template_id: actualTemplateId,
          actual_template_name: actualTemplateName,
          correct,
          user_feedback: userFeedback,
          feedback_type: feedbackType,
          classification_method: 'hybrid'
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Store calibration data
    if (correct !== undefined && actualTemplateId) {
      await supabase
        .from('email_confidence_calibration')
        .insert({
          predicted_confidence: predictedConfidence,
          actual_correct: correct,
          template_id: actualTemplateId
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error: any) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to record feedback'
      },
      { status: 500 }
    );
  }
}
