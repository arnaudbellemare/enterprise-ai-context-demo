/**
 * Unified Email Account Connection API
 * Supports: Gmail (OAuth), Outlook (OAuth), IMAP (any provider)
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveEmailAccount, getUserEmailAccounts } from '../../../../lib/email-token-manager';
import * as crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IMAPConnectionRequest {
  provider: 'imap';
  email: string;
  host: string;
  port: number;
  username: string;
  password: string;
  tls: boolean;
  userId?: string;
}

interface OAuthConnectionRequest {
  provider: 'gmail' | 'outlook';
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, userId = 'default' } = body;

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required (gmail, outlook, or imap)' },
        { status: 400 }
      );
    }

    // Handle OAuth providers (Gmail/Outlook)
    if (provider === 'gmail' || provider === 'outlook') {
      const oauthData = body as OAuthConnectionRequest;
      
      if (!oauthData.email || !oauthData.accessToken) {
        return NextResponse.json(
          { error: 'Email and accessToken are required for OAuth providers' },
          { status: 400 }
        );
      }

      const account = await saveEmailAccount(
        userId,
        provider,
        oauthData.email,
        oauthData.accessToken,
        oauthData.refreshToken || null,
        oauthData.expiresIn || 3600
      );

      return NextResponse.json({
        success: true,
        account: {
          id: account.id,
          provider: account.provider,
          email: account.email,
          connected: true,
          connectedAt: account.connectedAt
        }
      });
    }

    // Handle IMAP provider
    if (provider === 'imap') {
      const imapData = body as IMAPConnectionRequest;
      
      if (!imapData.email || !imapData.host || !imapData.password) {
        return NextResponse.json(
          { error: 'Email, host, and password are required for IMAP' },
          { status: 400 }
        );
      }

      // Test IMAP connection first
      const connectionTest = await testIMAPConnection(imapData);
      if (!connectionTest.success) {
        return NextResponse.json(
          { error: `IMAP connection failed: ${connectionTest.error}` },
          { status: 400 }
        );
      }

      // Encrypt password before storing
      const encryptedPassword = encryptPassword(imapData.password);
      
      // Store IMAP account configuration
      // We'll store it as a special format in the token manager
      const accountId = crypto.randomUUID();
      const account = await saveEmailAccount(
        userId,
        'imap',
        imapData.email,
        JSON.stringify({
          host: imapData.host,
          port: imapData.port || 993,
          username: imapData.username || imapData.email,
          password: encryptedPassword,
          tls: imapData.tls !== false
        }),
        null, // No refresh token for IMAP
        0 // No expiration
      );

      return NextResponse.json({
        success: true,
        account: {
          id: account.id,
          provider: 'imap',
          email: imapData.email,
          host: imapData.host,
          connected: true,
          connectedAt: account.connectedAt
        }
      });
    }

    return NextResponse.json(
      { error: `Unsupported provider: ${provider}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Email connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect email account'
      },
      { status: 500 }
    );
  }
}

/**
 * Test IMAP connection before saving
 */
async function testIMAPConnection(config: IMAPConnectionRequest): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamic import for server-side only
    const imapModule = await import('imap');
    const Imap = imapModule.default;
    
    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.username || config.email,
        password: config.password,
        host: config.host,
        port: config.port || 993,
        tls: config.tls !== false,
        tlsOptions: { rejectUnauthorized: false }
      });

      const timeout = setTimeout(() => {
        imap.end();
        resolve({ success: false, error: 'Connection timeout' });
      }, 10000); // 10 second timeout

      imap.once('ready', () => {
        clearTimeout(timeout);
        imap.end();
        resolve({ success: true });
      });

      imap.once('error', (err: Error) => {
        clearTimeout(timeout);
        imap.end();
        resolve({ success: false, error: err.message });
      });

      imap.connect();
    });
  } catch (error: any) {
    return { success: false, error: error.message || 'IMAP test failed' };
  }
}

/**
 * Simple password encryption (in production, use proper encryption)
 */
function encryptPassword(password: string): string {
  // In production, use proper encryption like AES-256-GCM
  // For now, base64 encode (NOT secure, but better than plain text)
  return Buffer.from(password).toString('base64');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default';

    const accounts = await getUserEmailAccounts(userId);

    return NextResponse.json({
      success: true,
      accounts: accounts.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        email: acc.email,
        connected: acc.isActive,
        lastSync: acc.lastSync,
        connectedAt: acc.connectedAt
      })),
      count: accounts.length
    });
  } catch (error: any) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      {
        success: false,
        accounts: [],
        count: 0,
        error: error.message
      },
      { status: 500 }
    );
  }
}

