/**
 * Auto-Response Generation API
 * Generates responses for unanswered emails where the last sender is not the user
 * Tracks learning insights from these responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailAccount, getValidAccessToken } from '@/lib/email-token-manager';
import { GmailConnector, OutlookConnector } from '@/lib/email-connector';
import { classifyEmailHybrid, EmailClassification } from '@/lib/email-template-classifier';
import { handleProductionEmail } from '@/lib/email-classification/continuous-learning';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AutoResponseResult {
  emailId: string;
  subject: string;
  from: string;
  generatedResponse: {
    subject: string;
    body: string;
    requiresHumanReview: boolean;
  };
  classification: {
    template: string;
    confidence: number;
  };
  learningInsights: {
    pattern: string;
    confidence: number;
    templateUsed: string;
  };
}

/**
 * Check if email needs a response (last sender is not the user)
 */
function needsResponse(email: any, userEmail: string): boolean {
  // Check if email is unread
  if (!email.isUnread) {
    return false;
  }

  // Check if last sender is NOT the user
  const fromEmail = email.from?.toLowerCase() || '';
  const userEmailLower = userEmail.toLowerCase();
  
  // If the email is FROM the user, it doesn't need a response
  if (fromEmail.includes(userEmailLower)) {
    return false;
  }

  // Check if email is TO the user (needs response)
  const toEmails = (email.to || '').toLowerCase();
  if (toEmails.includes(userEmailLower)) {
    return true;
  }

  // Default: if unread and not from user, it likely needs a response
  return true;
}

/**
 * POST /api/email-accounts/auto-respond
 * Generates responses for unanswered emails
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountId, maxResults = 50, autoSend = false } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const account = await getEmailAccount(accountId);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(accountId);

    // Fetch emails
    let emails: any[] = [];
    if (account.provider === 'gmail') {
      const connector = new GmailConnector(accessToken);
      emails = await connector.fetchEmails(maxResults);
    } else if (account.provider === 'outlook') {
      const connector = new OutlookConnector(accessToken);
      emails = await connector.fetchEmails(maxResults);
    } else {
      return NextResponse.json(
        { error: 'Auto-response only supports Gmail and Outlook' },
        { status: 400 }
      );
    }

    // Filter emails that need responses
    const emailsNeedingResponse = emails.filter(email => 
      needsResponse(email, account.email)
    );

    console.log(`[Auto-Respond] Found ${emailsNeedingResponse.length} emails needing responses out of ${emails.length} total`);

    // Generate responses for each email
    const results: AutoResponseResult[] = [];
    const learningInsights: Array<{
      emailHash: string;
      pattern: string;
      template: string;
      confidence: number;
      responseGenerated: boolean;
    }> = [];

    for (const email of emailsNeedingResponse) {
      try {
        const emailText = `${email.subject || ''}\n\n${email.body || email.htmlBody || ''}`;
        
        // Classify email
        const classification = await classifyEmailHybrid(emailText);
        
        // Generate response by calling the classify-and-respond API internally
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (req.headers.get('origin') || 'http://localhost:3000');
        const responseRes = await fetch(`${baseUrl}/api/email/classify-and-respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: email.from || '',
            to: email.to || account.email,
            subject: email.subject || '',
            body: email.body || email.htmlBody || ''
          })
        });

        if (!responseRes.ok) {
          const errorText = await responseRes.text();
          console.error('[Auto-Respond] Failed to generate response:', errorText);
          throw new Error('Failed to generate response');
        }

        const responseData = await responseRes.json();
        const generatedResponse = responseData.generatedResponse;

        // Track learning insights
        const emailHash = await hashEmail(emailText);
        const pattern = extractPattern(emailText, classification);
        learningInsights.push({
          emailHash,
          pattern,
          template: classification.template.name,
          confidence: classification.confidence,
          responseGenerated: true
        });

        // Store learning data
        await handleProductionEmail(
          {
            from: email.from || '',
            to: email.to || account.email,
            subject: email.subject || '',
            body: email.body || email.htmlBody || ''
          },
          classification
        );

        // Store auto-response record (non-blocking)
        storeAutoResponseRecord({
          accountId,
          emailId: email.id,
          emailHash,
          from: email.from || '',
          subject: email.subject || '',
          classification: classification.template.name,
          templateId: classification.template.id,
          confidence: classification.confidence,
          generatedSubject: generatedResponse.subject,
          generatedBody: generatedResponse.body,
          requiresHumanReview: generatedResponse.requiresHumanReview,
          sent: autoSend && !generatedResponse.requiresHumanReview
        }).catch(err => console.warn('[Auto-Respond] Failed to store record:', err));

        results.push({
          emailId: email.id,
          subject: email.subject || '(No Subject)',
          from: email.from || 'Unknown',
          generatedResponse: {
            subject: generatedResponse.subject,
            body: generatedResponse.body,
            requiresHumanReview: generatedResponse.requiresHumanReview
          },
          classification: {
            template: classification.template.name,
            confidence: classification.confidence
          },
          learningInsights: {
            pattern: extractPattern(emailText, classification),
            confidence: classification.confidence,
            templateUsed: classification.template.name
          }
        });
      } catch (error: any) {
        console.error(`[Auto-Respond] Error processing email ${email.id}:`, error);
        // Continue with other emails
      }
    }

    // Aggregate learning insights
    const aggregatedInsights = aggregateLearningInsights(learningInsights);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalEmails: emails.length,
        emailsNeedingResponse: emailsNeedingResponse.length,
        responsesGenerated: results.length,
        requiresHumanReview: results.filter(r => r.generatedResponse.requiresHumanReview).length,
        autoSendable: results.filter(r => !r.generatedResponse.requiresHumanReview).length
      },
      learningInsights: aggregatedInsights
    });

  } catch (error: any) {
    console.error('[Auto-Respond] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate auto-responses'
      },
      { status: 500 }
    );
  }
}

/**
 * Hash email for deduplication
 */
async function hashEmail(text: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Extract pattern from email for learning
 */
function extractPattern(emailText: string, classification: any): string {
  const lowerText = emailText.toLowerCase();
  
  // Extract key phrases
  const patterns: string[] = [];
  
  if (lowerText.includes('unit') || lowerText.includes('unité')) {
    patterns.push('unit_mention');
  }
  if (lowerText.includes('payment') || lowerText.includes('paiement')) {
    patterns.push('payment_related');
  }
  if (lowerText.includes('maintenance') || lowerText.includes('travaux')) {
    patterns.push('maintenance_related');
  }
  if (lowerText.includes('question') || lowerText.includes('demande')) {
    patterns.push('question_based');
  }
  
  return patterns.join(', ') || 'general_inquiry';
}

/**
 * Store auto-response record in database
 */
async function storeAutoResponseRecord(data: {
  accountId: string;
  emailId: string;
  emailHash: string;
  from: string;
  subject: string;
  classification: string;
  templateId: string;
  confidence: number;
  generatedSubject: string;
  generatedBody: string;
  requiresHumanReview: boolean;
  sent: boolean;
}) {
  try {
    const { error } = await supabase
      .from('email_auto_responses')
      .insert({
        account_id: data.accountId,
        email_id: data.emailId,
        email_hash: data.emailHash,
        from_email: data.from,
        subject: data.subject,
        classification: data.classification,
        template_id: data.templateId,
        confidence: data.confidence,
        generated_subject: data.generatedSubject,
        generated_body: data.generatedBody,
        requires_human_review: data.requiresHumanReview,
        sent: data.sent,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Auto-Respond] Failed to store record:', error);
    }
  } catch (error) {
    console.error('[Auto-Respond] Error storing record:', error);
  }
}

/**
 * Aggregate learning insights from multiple emails
 */
function aggregateLearningInsights(
  insights: Array<{
    pattern: string;
    template: string;
    confidence: number;
    responseGenerated: boolean;
  }>
): {
  commonPatterns: Array<{ pattern: string; count: number; avgConfidence: number }>;
  templateDistribution: Array<{ template: string; count: number }>;
  averageConfidence: number;
  totalProcessed: number;
} {
  const patternCounts = new Map<string, { count: number; totalConfidence: number }>();
  const templateCounts = new Map<string, number>();
  let totalConfidence = 0;

  insights.forEach(insight => {
    // Count patterns
    const patterns = insight.pattern.split(', ');
    patterns.forEach(pattern => {
      const current = patternCounts.get(pattern) || { count: 0, totalConfidence: 0 };
      patternCounts.set(pattern, {
        count: current.count + 1,
        totalConfidence: current.totalConfidence + insight.confidence
      });
    });

    // Count templates
    const current = templateCounts.get(insight.template) || 0;
    templateCounts.set(insight.template, current + 1);

    totalConfidence += insight.confidence;
  });

  const commonPatterns = Array.from(patternCounts.entries())
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      avgConfidence: data.totalConfidence / data.count
    }))
    .sort((a, b) => b.count - a.count);

  const templateDistribution = Array.from(templateCounts.entries())
    .map(([template, count]) => ({ template, count }))
    .sort((a, b) => b.count - a.count);

  return {
    commonPatterns,
    templateDistribution,
    averageConfidence: insights.length > 0 ? totalConfidence / insights.length : 0,
    totalProcessed: insights.length
  };
}

