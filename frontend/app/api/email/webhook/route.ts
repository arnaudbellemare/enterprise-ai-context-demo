import { NextRequest, NextResponse } from 'next/server';
import { classifyEmailHybrid } from '@/lib/email-template-classifier';

/**
 * Email Webhook Receiver
 * 
 * Receives emails from email service providers (SendGrid, Mailgun, etc.)
 * and processes them automatically
 */

interface WebhookEmail {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

/**
 * POST /api/email/webhook
 * 
 * Webhook endpoint for email service providers
 * Supports SendGrid, Mailgun, and generic webhook formats
 */
export async function POST(req: NextRequest) {
  try {
    // Check webhook authentication if configured
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    const body = await req.json();
    
    // Parse email data based on provider format
    let emailData: WebhookEmail;
    
    // SendGrid format
    if (body.from && body.text) {
      emailData = {
        from: body.from,
        to: body.to || body.recipient,
        subject: body.subject || '',
        text: body.text,
        html: body.html,
        headers: body.headers,
      };
    }
    // Mailgun format
    else if (body['sender'] || body['from']) {
      emailData = {
        from: body['sender'] || body['from'],
        to: body['recipient'] || body['to'],
        subject: body.subject || body['subject'] || '',
        text: body['body-plain'] || body.text,
        html: body['body-html'] || body.html,
        headers: body.headers,
      };
    }
    // Generic format
    else {
      emailData = {
        from: body.from || body.email || '',
        to: body.to || '',
        subject: body.subject || '',
        text: body.text || body.body || '',
        html: body.html,
        headers: body.headers,
      };
    }
    
    if (!emailData.from || !emailData.text) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Process email: classify and generate response
    const emailText = `${emailData.subject}\n\n${emailData.text}`;
    const classification = await classifyEmailHybrid(emailText);
    
    // Auto-respond if confidence is high enough and not requiring human review
    const shouldAutoRespond = classification.confidence > 0.75 && 
                              classification.template.priority < 10; // Don't auto-respond to critical issues
    
    if (shouldAutoRespond) {
      // Call the classify-and-respond endpoint internally
      const responseUrl = new URL('/api/email/classify-and-respond', req.url);
      const responseRes = await fetch(responseUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.text,
          html: emailData.html,
        }),
      });
      
      if (responseRes.ok) {
        const responseData = await responseRes.json();
        
        // Send the generated response
        const sendUrl = new URL('/api/email/send', req.url);
        await fetch(sendUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: emailData.from,
            from: process.env.EMAIL_FROM || emailData.to,
            subject: responseData.generatedResponse.subject,
            body: responseData.generatedResponse.body,
            html: responseData.generatedResponse.body.replace(/\n/g, '<br>'),
            replyTo: emailData.to,
          }),
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      classification: {
        template: classification.template.name,
        confidence: classification.confidence,
      },
      autoResponded: shouldAutoRespond,
    });
    
  } catch (error: any) {
    console.error('Email webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

