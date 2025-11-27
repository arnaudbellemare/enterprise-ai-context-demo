/**
 * Batch Email Classification API
 * Classifies multiple emails at once and learns from high-confidence classifications
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  classifyEmailRuleBased,
  classifyEmailHybrid,
  classifyEmailWithLLM,
  EMAIL_TEMPLATES,
  EmailClassification
} from '../../../lib/email-template-classifier';
import { TeacherStudentSystem } from '../../../lib/teacher-student-system';
import { getExamples, addExample } from '../../../lib/email-examples-store';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  // Declare variables outside try block for catch access
  const classifications: Array<{
    emailId?: string;
    emailText: string;
    classification: EmailClassification;
    learned: boolean;
  }> = [];
  const learnedCount = { count: 0 };
  
  try {
    const body = await req.json();
    const {
      emails, // Array of email objects: [{ text: "...", id: "..." }, ...]
      method = 'hybrid',
      useFewShot = true,
      autoLearn = true, // Automatically learn from high-confidence classifications
      minConfidenceForLearning = 0.8, // Only learn from high-confidence classifications
      userId
    } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Get few-shot examples
    const examples = useFewShot ? getExamples(userId, undefined, 10) : [];

    // Initialize LLM provider if needed
    let llmProvider: any = null;
    if (method === 'llm' || method === 'hybrid') {
      try {
        const teacherStudent = new TeacherStudentSystem();
        llmProvider = {
          generate: async (prompt: string) => {
            try {
              const result = await teacherStudent.processQuery(prompt, 'general');
              return result?.teacher_response?.answer || 
                     result?.student_response?.answer || 
                     (typeof result === 'string' ? result : '');
            } catch (error: any) {
              console.error('TeacherStudentSystem error:', error.message || error);
              return '';
            }
          }
        };
      } catch (error) {
        console.warn('LLM provider initialization failed, using rule-based only');
      }
    }

    for (const email of emails) {
      const emailText = typeof email === 'string' ? email : email.text || email.body || email.content || '';
      const emailId = typeof email === 'object' ? (email.id || email.messageId) : undefined;

      if (!emailText.trim()) {
        classifications.push({
          emailId,
          emailText: '',
          classification: {
            template: EMAIL_TEMPLATES[0],
            confidence: 0,
            reasoning: 'Empty email text',
            extractedEntities: {
              dates: [],
              amounts: [],
              locations: [],
              people: [],
              documents: [],
              phoneNumbers: []
            }
          },
          learned: false
        });
        continue;
      }

      try {
        let classification: EmailClassification;

        if (method === 'rule-based') {
          classification = classifyEmailRuleBased(emailText);
        } else if (method === 'llm' && llmProvider) {
          classification = await classifyEmailWithLLM(emailText, examples, llmProvider);
        } else {
          // Hybrid
          classification = await classifyEmailHybrid(emailText, examples, llmProvider);
        }

        // Auto-learn from high-confidence classifications
        let learned = false;
        if (autoLearn && classification.confidence >= minConfidenceForLearning) {
          try {
            addExample({
              email: emailText,
              template: classification.template.name,
              entities: classification.extractedEntities,
              confidence: classification.confidence,
              userId
            });
            learned = true;
            learnedCount.count++;
          } catch (error) {
            console.error('Failed to learn from email:', error);
          }
        }

        classifications.push({
          emailId,
          emailText: emailText.substring(0, 100) + (emailText.length > 100 ? '...' : ''),
          classification,
          learned
        });
      } catch (error: any) {
        // Fallback to rule-based on error
        const fallbackClassification = classifyEmailRuleBased(emailText);
        classifications.push({
          emailId,
          emailText: emailText.substring(0, 100) + '...',
          classification: fallbackClassification,
          learned: false
        });
      }
    }

    const processingTime = Date.now() - startTime;

    // Calculate statistics
    const stats = {
      total: classifications.length,
      highConfidence: classifications.filter(c => c.classification.confidence >= 0.8).length,
      mediumConfidence: classifications.filter(c => c.classification.confidence >= 0.5 && c.classification.confidence < 0.8).length,
      lowConfidence: classifications.filter(c => c.classification.confidence < 0.5).length,
      learned: learnedCount.count,
      templateDistribution: EMAIL_TEMPLATES.map(template => ({
        template: template.name,
        count: classifications.filter(c => c.classification.template.id === template.id).length
      }))
    };

    return NextResponse.json({
      success: true,
      classifications: classifications.map(c => ({
        emailId: c.emailId,
        emailPreview: c.emailText,
        template: {
          id: c.classification.template.id,
          name: c.classification.template.name,
          description: c.classification.template.description,
          priority: c.classification.template.priority
        },
        confidence: c.classification.confidence,
        reasoning: c.classification.reasoning,
        entities: c.classification.extractedEntities,
        learned: c.learned
      })),
      stats,
      metadata: {
        method,
        useFewShot,
        autoLearn,
        minConfidenceForLearning,
        processingTimeMs: processingTime,
        avgTimePerEmail: Math.round(processingTime / classifications.length),
        totalExamplesAfter: getExamples(userId).length
      }
    });

  } catch (error: any) {
    console.error('Batch email classification error:', error);
    
    // Try to return partial results if we have any classifications
    if (classifications && classifications.length > 0) {
      return NextResponse.json({
        success: true,
        classifications: classifications.map(c => ({
          emailId: c.emailId,
          emailPreview: c.emailText,
          template: {
            id: c.classification.template.id,
            name: c.classification.template.name,
            description: c.classification.template.description,
            priority: c.classification.template.priority
          },
          confidence: c.classification.confidence,
          reasoning: c.classification.reasoning,
          entities: c.classification.extractedEntities,
          learned: c.learned
        })),
        stats: {
          total: classifications.length,
          highConfidence: classifications.filter(c => c.classification.confidence >= 0.8).length,
          mediumConfidence: classifications.filter(c => c.classification.confidence >= 0.5 && c.classification.confidence < 0.8).length,
          lowConfidence: classifications.filter(c => c.classification.confidence < 0.5).length,
          learned: learnedCount.count,
          templateDistribution: EMAIL_TEMPLATES.map(template => ({
            template: template.name,
            count: classifications.filter(c => c.classification.template.id === template.id).length
          }))
        },
        metadata: {
          method: 'hybrid',
          useFewShot: true,
          autoLearn: true,
          minConfidenceForLearning: 0.8,
          processingTimeMs: Date.now() - startTime,
          error: error.message || 'Some emails failed to classify',
          partial: true
        }
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to classify emails',
        details: error.stack || error.toString()
      },
      { status: 500 }
    );
  }
}

