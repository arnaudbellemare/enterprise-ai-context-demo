import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Sending Service
 * 
 * Sends emails using SMTP or email service provider
 * Note: Requires nodemailer package to be installed
 * 
 * To use this route, install: npm install nodemailer @types/nodemailer
 * Or comment out this file if email sending is not needed
 */

interface SendEmailRequest {
  to: string;
  from: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * POST /api/email/send
 * 
 * Sends an email using configured SMTP service
 */
export async function POST(req: NextRequest) {
  try {
    const emailData: SendEmailRequest = await req.json();
    
    if (!emailData.to || !emailData.from || !emailData.subject || !emailData.body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, from, subject, body' },
        { status: 400 }
      );
    }
    
    // Check if email service is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    
    if (!smtpHost || !smtpUser || !smtpPassword) {
      // If SMTP not configured, return the email data for manual sending
      // or use a service like Resend, SendGrid, etc.
      return NextResponse.json({
        success: false,
        error: 'SMTP not configured',
        message: 'Email service not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.',
        emailData // Return the email data so it can be sent manually
      });
    }
    
    // For now, we'll use nodemailer if available, otherwise return email data
    // In production, integrate with Resend, SendGrid, or similar service
    
    try {
      // Dynamic import of nodemailer (install: npm install nodemailer @types/nodemailer)
      // Use dynamic import with error handling to make it optional
      let nodemailer;
      try {
        nodemailer = await import('nodemailer');
      } catch (importError) {
        return NextResponse.json({
          success: false,
          error: 'nodemailer not installed',
          message: 'Please install nodemailer: npm install nodemailer @types/nodemailer',
          emailData,
        });
      }
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: smtpPort === '465', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
      
      const mailOptions = {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        html: emailData.html || emailData.body.replace(/\n/g, '<br>'),
        replyTo: emailData.replyTo || emailData.from,
        cc: emailData.cc,
        bcc: emailData.bcc,
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        response: info.response,
      });
      
    } catch (smtpError: any) {
      // If nodemailer not available or SMTP fails, return email data for manual sending
      console.warn('SMTP sending failed, returning email data:', smtpError.message);
      
      return NextResponse.json({
        success: false,
        error: 'SMTP sending failed',
        message: smtpError.message,
        emailData, // Return email data for manual sending or alternative service
      });
    }
    
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

