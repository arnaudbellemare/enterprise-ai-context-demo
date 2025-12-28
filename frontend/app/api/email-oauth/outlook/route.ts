/**
 * Microsoft Outlook OAuth Flow
 * Generates OAuth URL and handles callback
 * AUTHENTICATE ONCE, WORKS FOREVER!
 */

import { NextRequest, NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/email-oauth/outlook/callback';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'auth') {
    // Generate Microsoft OAuth URL
    if (!MICROSOFT_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Microsoft OAuth not configured. Set MICROSOFT_CLIENT_ID in environment variables.' },
        { status: 400 }
      );
    }

    const scope = 'openid profile email offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read';
    
    // Build OAuth URL with prompt=consent to ensure refresh token
    const authUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?` +
      `client_id=${MICROSOFT_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scope)}&` +
      `prompt=consent&` + // Force consent screen to get refresh token
      `access_type=offline`; // Request offline access (refresh token)
    
    console.log('[Outlook OAuth] Generated auth URL with prompt=consent and access_type=offline');

    return NextResponse.json({
      authUrl,
      instructions: 'Open this URL in your browser to authorize Outlook access'
    });
  }

  if (action === 'callback') {
    // DEBUG: Log immediately when callback is called
    console.log('=== OAUTH CALLBACK STARTED ===');
    console.log('[OAuth Callback] Timestamp:', new Date().toISOString());
    console.log('[OAuth Callback] Environment variables check:');
    console.log('  - MICROSOFT_CLIENT_ID:', MICROSOFT_CLIENT_ID || 'MISSING');
    console.log('  - MICROSOFT_CLIENT_SECRET:', MICROSOFT_CLIENT_SECRET
      ? `LENGTH=${MICROSOFT_CLIENT_SECRET.length} | STARTS="${MICROSOFT_CLIENT_SECRET.substring(0, 10)}" | ENDS="...${MICROSOFT_CLIENT_SECRET.substring(MICROSOFT_CLIENT_SECRET.length - 10)}"`
      : 'MISSING');
    console.log('  - MICROSOFT_TENANT_ID:', MICROSOFT_TENANT_ID || 'MISSING');
    console.log('  - MICROSOFT_REDIRECT_URI:', MICROSOFT_REDIRECT_URI);

    // Handle OAuth callback
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[OAuth Callback] Request params:');
    console.log('  - code:', code ? `${code.substring(0, 20)}...` : 'MISSING');
    console.log('  - error:', error || 'none');
    console.log('  - error_description:', errorDescription || 'none');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-responder?error=${error}&error_description=${encodeURIComponent(errorDescription || '')}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-responder?error=no_code`
      );
    }

    // Exchange code for tokens
    try {
      // DEBUG: Log what we're sending (mask secret)
      console.log('[OAuth Debug] client_id:', MICROSOFT_CLIENT_ID);
      console.log('[OAuth Debug] client_secret FIRST 20 CHARS:', MICROSOFT_CLIENT_SECRET ? MICROSOFT_CLIENT_SECRET.substring(0, 20) : 'MISSING');
      console.log('[OAuth Debug] client_secret LENGTH:', MICROSOFT_CLIENT_SECRET?.length);
      console.log('[OAuth Debug] tenant_id:', MICROSOFT_TENANT_ID);

      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID!,
            client_secret: MICROSOFT_CLIENT_SECRET || '',
            code,
            redirect_uri: MICROSOFT_REDIRECT_URI,
            grant_type: 'authorization_code',
            scope: 'openid profile email offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read'
          })
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to exchange code for tokens: ${errorText}`);
      }

      const tokens = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info from Microsoft Graph');
      }

      const userInfo = await userResponse.json();
      const userEmail = userInfo.mail || userInfo.userPrincipalName;

      // SAVE TOKENS PERMANENTLY TO DATABASE
      const { saveEmailAccount } = await import('../../../../lib/email-token-manager');

      const account = await saveEmailAccount(
        'default', // userId - replace with actual user ID from session
        'outlook',
        userEmail,
        tokens.access_token,
        tokens.refresh_token || null,
        tokens.expires_in || 3600
      );

      console.log(`[Outlook OAuth] Saved account ${account.id} for ${account.email}`);

      // Redirect to email inbox with success (NO TOKENS IN URL!)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-inbox?` +
        `outlook_connected=true&` +
        `account_id=${account.id}&` +
        `email=${encodeURIComponent(userEmail)}`
      );
    } catch (error: any) {
      console.error('[Outlook OAuth] Error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-responder?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
