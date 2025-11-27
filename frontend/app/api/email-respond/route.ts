/**
 * Email Response Generation API
 * Analyzes email, classifies it, understands context, and generates appropriate response
 */

import { NextRequest, NextResponse } from 'next/server';
import { classifyEmailHybrid } from '../../../lib/email-template-classifier';
import { generateEmailResponse } from '../../../lib/email-response-generator';
import { getExamples } from '../../../lib/email-examples-store';
import { TeacherStudentSystem } from '../../../lib/teacher-student-system';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, // { from, subject, body }
      useLLM = true,
      generateResponse = true,
      userId
    } = body;

    if (!email || !email.body) {
      return NextResponse.json(
        { error: 'Email object with body is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Step 1: Classify the email
    const fewShotExamples = getExamples(userId, undefined, 10);
    let llmProvider: any = null;

    if (useLLM) {
      try {
        const teacherStudent = new TeacherStudentSystem();
        llmProvider = {
          generate: async (prompt: string) => {
            const result = await teacherStudent.processQuery(prompt, 'general');
            return result?.teacher_response?.answer || 
                   result?.student_response?.answer || 
                   (typeof result === 'string' ? result : '');
          }
        };
      } catch (error) {
        console.warn('LLM provider initialization failed');
      }
    }

    const classification = await classifyEmailHybrid(
      email.body,
      fewShotExamples,
      llmProvider
    );

    // Step 2: Analyze context and urgency
    const urgency = determineUrgency(classification, email.body);
    const requiresResponseAction = classification.template.priority >= 7;

    const context = {
      classification,
      extractedEntities: classification.extractedEntities,
      urgency,
      requiresAction: requiresResponseAction
    };

    // Step 3: Generate response if requested
    let generatedResponse = null;
    if (generateResponse) {
      generatedResponse = await generateEmailResponse(
        {
          from: email.from || '',
          subject: email.subject || '',
          body: email.body
        },
        classification,
        context,
        useLLM
      );
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      analysis: {
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
        context: {
          urgency,
          requiresResponseAction,
          suggestedActions: generateResponse && generatedResponse 
            ? generatedResponse.suggestedActions 
            : []
        }
      },
      response: generatedResponse,
      metadata: {
        processingTimeMs: processingTime,
        useLLM,
        language: detectLanguage(email.body)
      }
    });

  } catch (error: any) {
    console.error('Email response generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate email response'
      },
      { status: 500 }
    );
  }
}

/**
 * Determine urgency level
 */
function determineUrgency(
  classification: any,
  emailBody: string
): 'low' | 'medium' | 'high' | 'critical' {
  const body = emailBody.toLowerCase();

  // Critical keywords
  if (body.includes('urgent') || body.includes('asap') || body.includes('immediately') ||
      body.includes('emergency') || body.includes('safety') || body.includes('police')) {
    return 'critical';
  }

  // High priority based on template
  if (classification.template.priority >= 9) {
    return 'high';
  }

  // Medium priority
  if (classification.template.priority >= 7) {
    return 'medium';
  }

  return 'low';
}

/**
 * Detect email language
 */
function detectLanguage(text: string): 'fr' | 'en' {
  const frenchWords = ['bonjour', 'merci', 'déménagement', 'copropriétaire', 'syndicat', 'réunion'];
  const englishWords = ['hello', 'thank', 'moving', 'condo', 'board', 'meeting'];

  const lowerText = text.toLowerCase();
  const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length;
  const englishCount = englishWords.filter(word => lowerText.includes(word)).length;

  return frenchCount > englishCount ? 'fr' : 'en';
}

