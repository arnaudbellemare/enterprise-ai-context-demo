/**
 * Active Learning API for Email Classification
 *
 * Provides endpoints for:
 * - Getting next labeling candidates (uncertainty sampling + diversity)
 * - Submitting labels for uncertain examples
 * - Tracking labeling progress
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNextLabelingCandidates,
  markCandidateLabeled,
  storeLabeledExample
} from '../../../../lib/email-classification/supabase-storage';
import { EMAIL_TEMPLATES } from '../../../../lib/email-template-classifier';

/**
 * GET: Get next candidates for labeling (active learning)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get candidates sorted by priority (uncertainty + diversity)
    const candidates = await getNextLabelingCandidates(limit);

    return NextResponse.json({
      success: true,
      candidates,
      count: candidates.length,
      metadata: {
        priority_formula: '0.6 * uncertainty + 0.4 * diversity',
        confidence_range: '0.4 - 0.75 (uncertain but not random guesses)'
      }
    });
  } catch (error: any) {
    console.error('Error fetching labeling candidates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch labeling candidates'
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Submit label for a candidate
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidateId,
      labeledTemplateId,
      labeledTemplateName,
      labeledBy,
      emailText,
      confidence = 1.0
    } = body;

    if (!candidateId || !labeledTemplateId || !labeledTemplateName) {
      return NextResponse.json(
        {
          success: false,
          error: 'candidateId, labeledTemplateId, and labeledTemplateName are required'
        },
        { status: 400 }
      );
    }

    // Verify template exists
    const template = EMAIL_TEMPLATES.find(t => t.id === labeledTemplateId);
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: `Template ${labeledTemplateId} not found`
        },
        { status: 400 }
      );
    }

    // Store as labeled example
    if (emailText) {
      const storeResult = await storeLabeledExample({
        email: emailText,
        template: labeledTemplateName,
        templateId: labeledTemplateId,
        entities: {}, // Could extract entities here if needed
        confidence,
        userId: labeledBy,
        source: 'corrected' // This is a human correction
      });

      if (!storeResult.success) {
        console.warn('Failed to store labeled example:', storeResult.error);
      }
    }

    // Mark candidate as labeled in queue
    const markResult = await markCandidateLabeled(
      candidateId,
      labeledTemplateId,
      labeledTemplateName,
      labeledBy
    );

    if (!markResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: markResult.error || 'Failed to mark candidate as labeled'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate labeled successfully',
      candidateId,
      labeledTemplate: labeledTemplateName
    });
  } catch (error: any) {
    console.error('Error labeling candidate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to label candidate'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: Bulk label candidates
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { labels, labeledBy } = body;

    if (!Array.isArray(labels) || labels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'labels array is required and must not be empty'
        },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each label
    for (const label of labels) {
      const {
        candidateId,
        labeledTemplateId,
        labeledTemplateName,
        emailText
      } = label;

      try {
        // Store labeled example
        if (emailText) {
          await storeLabeledExample({
            email: emailText,
            template: labeledTemplateName,
            templateId: labeledTemplateId,
            entities: {},
            confidence: 1.0,
            userId: labeledBy,
            source: 'corrected'
          });
        }

        // Mark as labeled
        const markResult = await markCandidateLabeled(
          candidateId,
          labeledTemplateId,
          labeledTemplateName,
          labeledBy
        );

        if (markResult.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(
            `Candidate ${candidateId}: ${markResult.error}`
          );
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(
          `Candidate ${candidateId}: ${error.message || 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      successCount: results.success,
      failedCount: results.failed,
      errors: results.errors,
      total: labels.length
    });
  } catch (error: any) {
    console.error('Error bulk labeling candidates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to bulk label candidates'
      },
      { status: 500 }
    );
  }
}
