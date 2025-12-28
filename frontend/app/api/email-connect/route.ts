/**
 * Email Connection API
 * Handles connecting to Gmail, Outlook, and IMAP accounts
 * NOW WITH PERSISTENT STORAGE!
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserEmailAccounts,
  disconnectEmailAccount,
  saveEmailAccount
} from '../../../lib/email-token-manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, email, config, userId } = body;

    if (!provider || !email) {
      return NextResponse.json(
        { error: 'Provider and email are required' },
        { status: 400 }
      );
    }

    // For OAuth providers, they should use /api/email-oauth/[provider]
    // This endpoint is mainly for IMAP direct connections
    if (provider === 'gmail' || provider === 'outlook') {
      return NextResponse.json(
        {
          error: `Use OAuth flow for ${provider}: /api/email-oauth/${provider}?action=auth`
        },
        { status: 400 }
      );
    }

    // Store IMAP account (if implementing IMAP)
    const account = await saveEmailAccount(
      userId || 'default',
      provider as any,
      email,
      config.accessToken || '',
      config.refreshToken || null,
      3600
    );

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        provider: account.provider,
        email: account.email,
        connected: true
      }
    });

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default';

    const accounts = await getUserEmailAccounts(userId);

    return NextResponse.json({
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
        accounts: [],
        count: 0,
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const userId = searchParams.get('userId') || 'default';

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await disconnectEmailAccount(accountId, userId);

    return NextResponse.json({
      success: true,
      message: 'Account disconnected'
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to disconnect account'
      },
      { status: 500 }
    );
  }
}




