/**
 * Email Fetch API
 * Fetches emails from connected accounts and auto-classifies them
 * WITH AUTOMATIC TOKEN REFRESH!
 */

import { NextRequest, NextResponse } from 'next/server';
import { GmailConnector, OutlookConnector } from '../../../lib/email-connector';
import { classifyEmailHybrid } from '../../../lib/email-template-classifier';
import { getExamples } from '../../../lib/email-examples-store';
import {
  getEmailAccount,
  getValidAccessToken,
  updateLastSync
} from '../../../lib/email-token-manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      accountId,
      maxResults = 50,
      autoClassify = true,
      userId
    } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get account from database
    const account = await getEmailAccount(accountId);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found. Please connect your email account first.' },
        { status: 404 }
      );
    }

    // Get VALID access token (automatically refreshes if expired!)
    const accessToken = await getValidAccessToken(accountId);

    let emails: any[] = [];
    let connector: GmailConnector | OutlookConnector;

    // Fetch emails based on provider
    if (account.provider === 'gmail') {
      connector = new GmailConnector(
        accessToken,
        account.refreshToken || ''
      );
      emails = await connector.fetchEmails(maxResults);
    } else if (account.provider === 'outlook') {
      connector = new OutlookConnector(
        accessToken,
        account.refreshToken || ''
      );
      emails = await connector.fetchEmails(maxResults);
    } else if (account.provider === 'imap') {
      // IMAP requires server-side implementation
      return NextResponse.json(
        { error: 'IMAP fetching requires server-side endpoint. Use /api/email-imap/fetch' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${account.provider}` },
        { status: 400 }
      );
    }

    // Auto-classify emails if requested
    const classifiedEmails = autoClassify
      ? await Promise.all(
          emails.map(async (email) => {
            try {
              const emailText = `${email.subject}\n\n${email.body}`;
              const fewShotExamples = getExamples(userId, undefined, 10);
              
              const classification = await classifyEmailHybrid(
                emailText,
                fewShotExamples
              );

              return {
                ...email,
                classification: {
                  template: classification.template.name,
                  templateId: classification.template.id,
                  confidence: classification.confidence,
                  reasoning: classification.reasoning,
                  entities: classification.extractedEntities
                }
              };
            } catch (error) {
              console.error(`Failed to classify email ${email.id}:`, error);
              return {
                ...email,
                classification: null
              };
            }
          })
        )
      : emails.map(email => ({ ...email, classification: null }));

    // Update last sync time in database
    await updateLastSync(accountId);

    return NextResponse.json({
      success: true,
      emails: classifiedEmails,
      count: classifiedEmails.length,
      account: {
        id: account.id,
        email: account.email,
        provider: account.provider,
        lastSync: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Email fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch emails'
      },
      { status: 500 }
    );
  }
}




