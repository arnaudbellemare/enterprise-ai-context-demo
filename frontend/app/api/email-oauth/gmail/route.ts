/**
 * Gmail OAuth Flow
 * Generates OAuth URL and handles callback
 */

import { NextRequest, NextResponse } from 'next/server';

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/email-oauth/gmail/callback';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'auth') {
    // Generate OAuth URL
    if (!GMAIL_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Gmail OAuth not configured. Set GMAIL_CLIENT_ID in environment variables.' },
        { status: 400 }
      );
    }

    const scope = 'https://www.googleapis.com/auth/gmail.readonly';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GMAIL_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(GMAIL_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return NextResponse.json({
      authUrl,
      instructions: 'Open this URL in your browser to authorize Gmail access'
    });
  }

  if (action === 'callback') {
    // Handle OAuth callback
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-testing?error=${error}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-testing?error=no_code`
      );
    }

    // Exchange code for tokens
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GMAIL_CLIENT_ID!,
          client_secret: GMAIL_CLIENT_SECRET || '',
          code,
          redirect_uri: GMAIL_REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const tokens = await tokenResponse.json();

      // Get user email
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      const userInfo = await userResponse.json();

      // Redirect to frontend with tokens (in production, store securely)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-testing?` +
        `gmail_connected=true&` +
        `email=${userInfo.email}&` +
        `access_token=${tokens.access_token}&` +
        `refresh_token=${tokens.refresh_token || ''}`
      );
    } catch (error: any) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-testing?error=${error.message}`
      );
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

