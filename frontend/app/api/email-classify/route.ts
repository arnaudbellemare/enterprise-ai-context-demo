/**
 * Email Classification API
 * Classifies emails into property management templates
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  classifyEmailRuleBased,
  classifyEmailHybrid,
  classifyEmailWithLLM,
  EMAIL_TEMPLATES,
  EmailClassification,
  FewShotExample
} from '../../../lib/email-template-classifier';
import { TeacherStudentSystem } from '../../../lib/teacher-student-system';
import { getExamples } from '../../../lib/email-examples-store';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const {
      email,
      method = 'hybrid', // 'rule-based' | 'llm' | 'hybrid'
      useFewShot = true,
      userId
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email text is required' },
        { status: 400 }
      );
    }

    // Get few-shot examples from shared store
    const examples = useFewShot ? getExamples(userId, undefined, 10) : [];

    let classification: EmailClassification;

    // Choose classification method
    if (method === 'rule-based') {
      classification = classifyEmailRuleBased(email);
    } else if (method === 'llm') {
      // Initialize LLM provider (Teacher-Student system)
      try {
        const teacherStudent = new TeacherStudentSystem();
        const llmProvider = {
          generate: async (prompt: string) => {
            try {
              const result = await teacherStudent.processQuery(prompt, 'general');
              // Extract answer from teacher or student response
              const answer = result?.teacher_response?.answer || 
                           result?.student_response?.answer || 
                           (typeof result === 'string' ? result : '');
              return answer || '';
            } catch (error: any) {
              console.error('TeacherStudentSystem error:', error.message || error);
              throw error;
            }
          }
        };

        classification = await classifyEmailWithLLM(email, examples, llmProvider);
      } catch (error: any) {
        console.error('LLM classification failed, falling back to rule-based:', error.message || error);
        // Fallback to rule-based if LLM fails
        classification = classifyEmailRuleBased(email);
      }
    } else {
      // Hybrid: rule-based first, LLM if confidence low
      try {
        const teacherStudent = new TeacherStudentSystem();
        const llmProvider = {
          generate: async (prompt: string) => {
            try {
              const result = await teacherStudent.processQuery(prompt, 'general');
              const answer = result?.teacher_response?.answer || 
                           result?.student_response?.answer || 
                           (typeof result === 'string' ? result : '');
              return answer || '';
            } catch (error: any) {
              console.error('TeacherStudentSystem error:', error.message || error);
              return ''; // Return empty string to trigger fallback
            }
          }
        };

        classification = await classifyEmailHybrid(email, examples, llmProvider);
      } catch (error: any) {
        console.error('Hybrid classification failed, using rule-based:', error.message || error);
        // Fallback to rule-based if hybrid fails
        classification = classifyEmailRuleBased(email);
      }
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      classification: {
        template: {
          id: classification.template.id,
          name: classification.template.name,
          description: classification.template.description,
          priority: classification.template.priority
        },
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        entities: classification.extractedEntities
      },
      metadata: {
        method,
        useFewShot,
        processingTimeMs: processingTime,
        availableTemplates: EMAIL_TEMPLATES.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description
        }))
      }
    });

  } catch (error: any) {
    console.error('Email classification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to classify email'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: List available templates
 */
export async function GET() {
  const { getExamples } = await import('../../../lib/email-examples-store');
  return NextResponse.json({
    templates: EMAIL_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      keywords: t.keywords.slice(0, 5), // Show first 5 keywords
      priority: t.priority
    })),
    fewShotExamplesCount: getExamples().length
  });
}

