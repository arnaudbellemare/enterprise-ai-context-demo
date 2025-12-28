/**
 * IMAP Email Fetch
 * Fetches emails directly from Outlook using IMAP (no OAuth needed!)
 */

import { NextRequest, NextResponse } from 'next/server';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

function getImapConfig(): ImapConfig {
  return {
    user: process.env.IMAP_USER || '',
    password: process.env.IMAP_PASSWORD || '',
    host: process.env.IMAP_HOST || 'outlook.office365.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: process.env.IMAP_TLS === 'true'
  };
}

async function fetchEmailsViaImap(maxResults: number = 50): Promise<any[]> {
  const config = getImapConfig();

  if (!config.user || !config.password) {
    throw new Error('IMAP credentials not configured. Set IMAP_USER and IMAP_PASSWORD in .env.local');
  }

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails: any[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Fetch last N messages
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
                to: parsed.to?.text || '',
                date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                body: parsed.text || parsed.html || '',
                snippet: (parsed.text || parsed.html || '').substring(0, 200),
                labels: ['INBOX'],
                isUnread: !parsed.flags?.includes('\\Seen')
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
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.once('end', () => {
      resolve(emails.reverse()); // Most recent first
    });

    imap.connect();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { maxResults = 50 } = await req.json();

    console.log('📧 Fetching emails via IMAP...');
    const emails = await fetchEmailsViaImap(maxResults);

    console.log(`✅ Fetched ${emails.length} emails from IMAP`);

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
      account: {
        email: process.env.IMAP_USER,
        provider: 'imap',
        lastSync: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ IMAP fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch emails via IMAP'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'IMAP email fetch endpoint. Use POST with { maxResults: number }',
    configured: !!(process.env.IMAP_USER && process.env.IMAP_PASSWORD)
  });
}
