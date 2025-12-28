/**
 * Debug Email Account Status
 * Shows detailed information about an email account and its tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailAccount, getValidAccessToken } from '../../../../lib/email-token-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId query parameter is required' },
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

    // Check token status
    let tokenStatus: any = {
      hasAccessToken: !!account.accessToken,
      hasRefreshToken: !!account.refreshToken,
      tokenExpiry: account.tokenExpiry?.toISOString() || null,
      isExpired: account.tokenExpiry ? account.tokenExpiry <= new Date() : null,
      expiresIn: account.tokenExpiry 
        ? Math.max(0, Math.floor((account.tokenExpiry.getTime() - Date.now()) / 1000))
        : null
    };

    // Try to get valid token
    let validTokenTest: any = null;
    try {
      const validToken = await getValidAccessToken(accountId);
      tokenStatus.validTokenTest = 'success';
      tokenStatus.validTokenPrefix = validToken.substring(0, 20) + '...';
    } catch (error: any) {
      tokenStatus.validTokenTest = 'failed';
      tokenStatus.validTokenError = error.message;
    }

    // Test token with actual API call
    let apiTest: any = null;
    if (account.provider === 'outlook' && account.accessToken) {
      try {
        const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        apiTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok
        };

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          apiTest.error = errorText.substring(0, 500);
        } else {
          const userData = await testResponse.json();
          apiTest.userEmail = userData.mail || userData.userPrincipalName;
        }
      } catch (error: any) {
        apiTest = {
          error: error.message
        };
      }
    }

    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        provider: account.provider,
        userId: account.userId,
        connectedAt: account.connectedAt.toISOString(),
        lastSync: account.lastSync?.toISOString() || null,
        isActive: account.isActive
      },
      tokenStatus,
      apiTest
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

