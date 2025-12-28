/**
 * Unified Email Fetch API
 * Fetches emails from any connected account (Gmail, Outlook, IMAP)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailAccount, getValidAccessToken } from '../../../../lib/email-token-manager';
import { GmailConnector, OutlookConnector } from '../../../../lib/email-connector';
import * as crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountId, maxResults = 50, mailbox = 'INBOX', fetchAll = false } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const account = await getEmailAccount(accountId);
    if (!account) {
      console.error(`[Email Fetch] Account not found: ${accountId}`);
      return NextResponse.json(
        { error: 'Account not found. Please connect your email account first.' },
        { status: 404 }
      );
    }

    console.log(`[Email Fetch] Found account: ${account.email} (${account.provider}), hasAccessToken: ${!!account.accessToken}, hasRefreshToken: ${!!account.refreshToken}`);

    // Get valid access token (automatically refreshes if expired)
    let accessToken: string;
    try {
      console.log(`[Email Fetch] Getting access token for account ${accountId} (provider: ${account.provider})`);
      
      if (!account.accessToken) {
        throw new Error('No access token stored in database. Please reconnect your email account.');
      }
      
      accessToken = await getValidAccessToken(accountId);
      console.log(`[Email Fetch] Got access token: ${accessToken.substring(0, 20)}...`);
    } catch (tokenError: any) {
      console.error('[Email Fetch] Token refresh failed:', {
        error: tokenError.message,
        stack: tokenError.stack,
        accountId,
        provider: account.provider,
        hasAccessToken: !!account.accessToken,
        hasRefreshToken: !!account.refreshToken,
        tokenExpiry: account.tokenExpiry?.toISOString()
      });
      // Provide more specific error messages
      let errorMessage = 'Failed to get valid access token';
      let suggestion = 'Please reconnect your email account';
      
      if (!account.refreshToken) {
        errorMessage = 'No refresh token available';
        suggestion = 'Your account was connected without a refresh token. Please disconnect and reconnect your account to get a refresh token.';
      } else if (tokenError.message.includes('refresh')) {
        errorMessage = 'Token refresh failed';
        suggestion = 'Unable to refresh your access token. The refresh token may be invalid. Please disconnect and reconnect your account.';
      } else if (tokenError.message.includes('No access token')) {
        errorMessage = 'No access token stored';
        suggestion = 'Your account connection is incomplete. Please disconnect and reconnect your account.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: tokenError.message,
          suggestion: suggestion,
          debug: {
            hasAccessToken: !!account.accessToken,
            hasRefreshToken: !!account.refreshToken,
            tokenExpiry: account.tokenExpiry?.toISOString(),
            isExpired: account.tokenExpiry ? account.tokenExpiry <= new Date() : null
          }
        },
        { status: 401 }
      );
    }

    let emails: any[] = [];

    // Fetch emails based on provider
    if (account.provider === 'gmail') {
      console.log('[Email Fetch] Fetching emails from Gmail...', fetchAll ? '(fetching all)' : `(limit: ${maxResults})`);
      const connector = new GmailConnector(accessToken);
      const fetchedEmails = await connector.fetchEmails(maxResults, undefined, fetchAll);
      // Convert to unified format and filter out deleted emails
      emails = fetchedEmails
        .filter(email => {
          // Exclude emails in TRASH
          const labels = email.labels || [];
          return !labels.includes('TRASH') && !labels.includes('DELETED');
        })
        .map(email => {
          const bodyText = email.body || '';
          const htmlText = email.htmlBody || '';
          const snippetText = bodyText || htmlText || '';
          
          return {
            id: email.id,
            subject: email.subject || '(No Subject)',
            from: email.from || 'Unknown',
            to: Array.isArray(email.to) ? email.to.join(', ') : (email.to || ''),
            date: email.date || new Date().toISOString(),
            body: bodyText,
            html: htmlText,
            snippet: snippetText.substring(0, 200),
            isUnread: email.labels?.includes('UNREAD') || false,
            attachments: email.attachments || []
          };
        });
    } else if (account.provider === 'outlook') {
      console.log('[Email Fetch] Fetching emails from Outlook...', fetchAll ? '(fetching all)' : `(limit: ${maxResults})`);
      try {
        const connector = new OutlookConnector(accessToken);
        
        // If emailIds provided, fetch only those specific emails (for background classification)
        if (emailIds && Array.isArray(emailIds) && emailIds.length > 0) {
          fetchedEmails = await connector.fetchEmailsByIds(emailIds);
        } else {
          fetchedEmails = await connector.fetchEmails(maxResults, undefined, fetchAll);
        }
        console.log(`[Email Fetch] Successfully fetched ${fetchedEmails.length} emails from Outlook`);
        // Convert to unified format
        // Note: Already filtered by fetching from Inbox folder (excludes DeletedItems)
        emails = fetchedEmails.map(email => {
            const bodyText = email.body || '';
            const htmlText = email.htmlBody || '';
            const snippetText = bodyText || htmlText || '';
            
            return {
              id: email.id,
              subject: email.subject || '(No Subject)',
              from: email.from || 'Unknown',
              to: Array.isArray(email.to) ? email.to.join(', ') : (email.to || ''),
              date: email.date || new Date().toISOString(),
              body: bodyText,
              html: htmlText,
              snippet: snippetText.substring(0, 200),
              isUnread: !email.labels?.includes('READ'),
              attachments: email.attachments || []
            };
          });
      } catch (outlookError: any) {
        console.error('[Email Fetch] Outlook fetch failed:', {
          error: outlookError.message,
          stack: outlookError.stack,
          accountId,
          accessTokenPrefix: accessToken.substring(0, 20)
        });
        throw outlookError;
      }
    } else if (account.provider === 'imap') {
      emails = await fetchEmailsViaIMAP(account, maxResults, mailbox);
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${account.provider}` },
        { status: 400 }
      );
    }

    // Auto-classify emails if requested (defer classification for faster initial load)
    let classifiedEmails = emails;
    if (body.autoClassify !== false) {
      try {
        const { classifyEmailHybrid } = await import('../../../../lib/email-template-classifier');
        
        // Classify in parallel batches for speed (20 at a time)
        const classificationBatchSize = 20;
        const classificationBatches: any[] = [];
        
        for (let i = 0; i < emails.length; i += classificationBatchSize) {
          const batch = emails.slice(i, i + classificationBatchSize);
          const batchPromises = batch.map(async (email) => {
            try {
              const emailText = `${email.subject || ''}\n\n${email.body || email.text || ''}`;
              const classification = await classifyEmailHybrid(emailText);
              
              return {
                ...email,
                classification: {
                  template: classification.template.name,
                  templateId: classification.template.id,
                  confidence: classification.confidence,
                  reasoning: classification.reasoning
                }
              };
            } catch (error) {
              console.error(`Failed to classify email ${email.id}:`, error);
              return { ...email, classification: null };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          classificationBatches.push(...batchResults);
        }
        
        classifiedEmails = classificationBatches;
      } catch (error) {
        console.warn('Auto-classification failed, returning emails without classification:', error);
      }
    }

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
    console.error('[Email Fetch] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // Check if it's an authorization error
    if (error.message?.includes('Unauthorized') || error.message?.includes('401') || error.message?.includes('access token')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          details: error.message,
          suggestion: 'Your access token may have expired or is invalid. Please reconnect your email account to get a new token.'
        },
        { status: 401 }
      );
    }
    
    // Check if it's a token refresh error
    if (error.message?.includes('refresh') || error.message?.includes('No refresh token')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token refresh failed',
          details: error.message,
          suggestion: 'Your account needs to be reconnected. Please disconnect and reconnect your email account.'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch emails',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch emails via IMAP
 */
async function fetchEmailsViaIMAP(
  account: any,
  maxResults: number,
  mailbox: string
): Promise<any[]> {
  try {
    const Imap = (await import('imap')).default;
    const { simpleParser } = await import('mailparser');
    
    const config = JSON.parse(account.accessToken);
    const password = decryptPassword(config.password);

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: config.username || account.email,
        password: password,
        host: config.host,
        port: config.port || 993,
        tls: config.tls !== false,
        tlsOptions: { rejectUnauthorized: false }
      });

      const emails: any[] = [];

      imap.once('ready', () => {
        imap.openBox(mailbox, true, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          const totalMessages = box.messages.total;
          const start = Math.max(1, totalMessages - maxResults + 1);
          const fetchRange = `${start}:${totalMessages}`;

          const fetch = imap.seq.fetch(fetchRange, {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  return;
                }

                emails.push({
                  id: parsed.messageId || `msg-${seqno}`,
                  subject: parsed.subject || '(No Subject)',
                  from: parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown',
                  to: parsed.to?.text || parsed.to?.value?.[0]?.address || account.email,
                  date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                  body: parsed.text || '',
                  html: parsed.html || '',
                  snippet: (parsed.text || parsed.html || '').substring(0, 200),
                  labels: [mailbox],
                  isUnread: !parsed.flags?.includes('\\Seen'),
                  attachments: parsed.attachments?.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: att.size
                  })) || []
                });
              });
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails.reverse()); // Most recent first
          });
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  } catch (error: any) {
    throw new Error(`IMAP fetch failed: ${error.message}`);
  }
}

/**
 * Decrypt password
 */
function decryptPassword(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

