/**
 * Email Connection API
 * Handles connecting to Gmail, Outlook, and IMAP accounts
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (replace with database in production)
const connectedAccounts: Map<string, any> = new Map();

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

    const accountId = `${userId || 'default'}-${email}`;

    // Store account configuration
    connectedAccounts.set(accountId, {
      id: accountId,
      provider,
      email,
      userId: userId || 'default',
      connected: true,
      lastSync: new Date().toISOString(),
      config: {
        ...config,
        // Don't store sensitive data in plain text in production
        // Use encryption or secure storage
      }
    });

    return NextResponse.json({
      success: true,
      account: {
        id: accountId,
        provider,
        email,
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
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'default';

  const accounts = Array.from(connectedAccounts.values())
    .filter(acc => acc.userId === userId)
    .map(acc => ({
      id: acc.id,
      provider: acc.provider,
      email: acc.email,
      connected: acc.connected,
      lastSync: acc.lastSync
    }));

  return NextResponse.json({
    accounts,
    count: accounts.length
  });
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

    const account = connectedAccounts.get(accountId);
    if (!account || account.userId !== userId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    connectedAccounts.delete(accountId);

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

