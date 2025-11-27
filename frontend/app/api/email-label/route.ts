/**
 * Email Labeling API
 * For testing and training: Label emails with correct templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { FewShotExample, EMAIL_TEMPLATES } from '../../../lib/email-template-classifier';
import { extractPropertyManagementEntities } from '../../../lib/email-template-classifier';
import {
  getExamples,
  addExample,
  updateExample,
  deleteExample,
  clearExamples,
  getAllExamples
} from '../../../lib/email-examples-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      templateId,
      confidence = 1.0,
      userId,
      action = 'add' // 'add' | 'update' | 'delete'
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email text is required' },
        { status: 400 }
      );
    }

    if (action === 'add' || action === 'update') {
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required for add/update' },
          { status: 400 }
        );
      }

      const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Template ${templateId} not found` },
          { status: 400 }
        );
      }

      // Extract entities
      const entities = extractPropertyManagementEntities(email);

      const example: FewShotExample & { userId?: string; timestamp: string } = {
        email,
        template: template.name,
        entities,
        confidence,
        userId,
        timestamp: new Date().toISOString()
      };

      if (action === 'update') {
        // Update existing example
        const updated = updateExample(email, example, userId);
        if (!updated) {
          return NextResponse.json(
            { error: 'Example not found for update' },
            { status: 404 }
          );
        }
      } else {
        // Add new example
        addExample(example);
      }

      return NextResponse.json({
        success: true,
        action,
        example: {
          email: email.substring(0, 100) + '...',
          template: template.name,
          entities,
          confidence,
          timestamp: example.timestamp
        },
        totalExamples: getAllExamples().length
      });
    }

    if (action === 'delete') {
      const deleted = deleteExample(email, userId);

      return NextResponse.json({
        success: true,
        action: 'delete',
        deleted,
        totalExamples: getAllExamples().length
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Email labeling error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to label email'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: List labeled examples
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || undefined;
  const templateId = searchParams.get('templateId') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');

  // Get examples from shared store
  const templateName = templateId 
    ? EMAIL_TEMPLATES.find(t => t.id === templateId)?.name 
    : undefined;
  
  const examples = getExamples(userId, templateName, limit);
  const allExamples = getAllExamples();

  return NextResponse.json({
    examples: examples.map(ex => ({
      email: ex.email.substring(0, 200) + (ex.email.length > 200 ? '...' : ''),
      template: ex.template,
      entities: ex.entities,
      confidence: ex.confidence,
      userId: ex.userId
    })),
    total: allExamples.length,
    filtered: examples.length
  });
}

/**
 * Export labeled examples for training
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'export', userId } = body;

    if (action === 'export') {
      const examples = getExamples(userId);

      return NextResponse.json({
        success: true,
        examples: examples.map(ex => ({
          email: ex.email,
          template: ex.template,
          entities: ex.entities,
          confidence: ex.confidence
        })),
        count: examples.length,
        format: 'few-shot-training'
      });
    }

    if (action === 'clear') {
      const cleared = clearExamples(userId);

      return NextResponse.json({
        success: true,
        cleared,
        remaining: getAllExamples().length
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export examples'
      },
      { status: 500 }
    );
  }
}

