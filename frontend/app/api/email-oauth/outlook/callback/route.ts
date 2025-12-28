/**
 * Microsoft Outlook OAuth Callback Handler
 * Handles the redirect from Microsoft after user approves permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveEmailAccount } from '../../../../../lib/email-token-manager';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/email-oauth/outlook/callback';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID;

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('[OAuth Callback] Request params:');
  console.log('  - code:', code ? `${code.substring(0, 20)}...` : 'MISSING');
  console.log('  - error:', error || 'none');
  console.log('  - error_description:', errorDescription || 'none');

  if (error) {
    console.error('[OAuth Callback] Microsoft returned error:', error, errorDescription);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-inbox?error=${encodeURIComponent(`Microsoft OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`)}`
    );
  }

  if (!code) {
    console.error('[OAuth Callback] No authorization code received');
    console.error('[OAuth Callback] Full URL:', req.url);
    console.error('[OAuth Callback] All search params:', Object.fromEntries(searchParams));
    
    // Check if user cancelled or if there's another issue
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    let errorMessage = 'No authorization code received from Microsoft.\n\n';
    
    if (errorParam) {
      errorMessage += `Microsoft returned error: ${errorParam}`;
      if (errorDescription) {
        errorMessage += `\nDescription: ${errorDescription}`;
      }
      
      // Provide specific guidance for common errors
      if (errorParam === 'access_denied') {
        errorMessage += '\n\nYou cancelled the authorization. Please try again and approve the permissions.';
      } else if (errorParam === 'invalid_client') {
        errorMessage += '\n\nInvalid client ID or secret. Please check your Azure App Registration configuration.';
      } else if (errorParam === 'redirect_uri_mismatch') {
        errorMessage += '\n\nRedirect URI mismatch. Ensure the redirect URI in Azure Portal matches: ' + 
          (process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/email-oauth/outlook/callback');
      }
    } else {
      errorMessage += 'Possible causes:\n';
      errorMessage += '1. You cancelled the Microsoft login\n';
      errorMessage += '2. Redirect URI mismatch in Azure Portal\n';
      errorMessage += '3. Browser blocked the redirect\n\n';
      errorMessage += 'Please check:\n';
      errorMessage += '- Azure Portal → Your App → Authentication → Redirect URIs\n';
      errorMessage += '- Ensure this URI is added: http://localhost:3000/api/email-oauth/outlook/callback';
    }
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-inbox?error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Exchange code for tokens
  try {
    console.log('[OAuth Debug] Exchanging code for tokens...');
    console.log('[OAuth Debug] Using client_id:', MICROSOFT_CLIENT_ID);
    console.log('[OAuth Debug] Using client_secret:', MICROSOFT_CLIENT_SECRET ? `${MICROSOFT_CLIENT_SECRET.substring(0, 10)}...` : 'MISSING');
    console.log('[OAuth Debug] Using tenant_id:', MICROSOFT_TENANT_ID);

    // Ensure we request offline_access to get refresh token
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
      let errorMessage = `Failed to exchange code for tokens: ${errorText}`;
      
      // Parse error if it's JSON
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error_description) {
          errorMessage = `${errorJson.error}: ${errorJson.error_description}`;
        }
      } catch {
        // Not JSON, use as-is
      }
      
      throw new Error(errorMessage);
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange code for tokens: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    
    // Validate token response
    if (!tokens.access_token) {
      throw new Error('Microsoft did not return an access token. Please try again.');
    }
    
    console.log('[Outlook OAuth] Token response:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
      tokenLength: tokens.access_token?.length,
      refreshTokenLength: tokens.refresh_token?.length
    });
    
    // CRITICAL: Check for refresh token
    if (!tokens.refresh_token) {
      console.error('[Outlook OAuth] ❌ CRITICAL ERROR: No refresh token received!');
      console.error('[Outlook OAuth] This means the account will NOT work after token expires.');
      console.error('[Outlook OAuth] Possible causes:');
      console.error('  1. The scope "offline_access" was not included in the request');
      console.error('  2. The user did not grant consent for offline access');
      console.error('  3. The app registration is not configured correctly');
      console.error('[Outlook OAuth] Token response keys:', Object.keys(tokens));
      console.error('[Outlook OAuth] Full token response (masked):', {
        ...tokens,
        access_token: tokens.access_token ? tokens.access_token.substring(0, 20) + '...' : null,
        refresh_token: tokens.refresh_token ? 'EXISTS' : 'MISSING'
      });
      
      // Still save the account but warn the user
      console.warn('[Outlook OAuth] ⚠️ Saving account WITHOUT refresh token - will require re-authentication when token expires');
    } else {
      console.log('[Outlook OAuth] ✅ Refresh token received successfully!');
    }

    // Get user info
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('[Outlook OAuth] Failed to get user info:', errorText);
      throw new Error(`Failed to get user info from Microsoft Graph: ${userResponse.status} ${userResponse.statusText}`);
    }

    const userInfo = await userResponse.json();
    const userEmail = userInfo.mail || userInfo.userPrincipalName;

    // SAVE TOKENS PERMANENTLY TO DATABASE
    try {
      if (!tokens.refresh_token) {
        console.warn('[Outlook OAuth] ⚠️ No refresh token received. Token will expire and require re-authentication.');
      }
      
      const account = await saveEmailAccount(
        'default', // userId - replace with actual user ID from session
        'outlook',
        userEmail,
        tokens.access_token,
        tokens.refresh_token || null,
        tokens.expires_in || 3600
      );

      console.log(`[Outlook OAuth] ✅ Saved account ${account.id} for ${account.email}`);
      console.log(`[Outlook OAuth] Account details:`, {
        id: account.id,
        email: account.email,
        hasAccessToken: !!account.accessToken,
        hasRefreshToken: !!account.refreshToken,
        tokenExpiry: account.tokenExpiry?.toISOString()
      });

      // Redirect to email inbox with success (NO TOKENS IN URL!)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-inbox?` +
        `outlook_connected=true&` +
        `account_id=${account.id}&` +
        `email=${encodeURIComponent(userEmail)}`
      );
    } catch (saveError: any) {
      console.error('[Outlook OAuth] Failed to save account:', saveError);
      
      // Sanitize error message - remove HTML and truncate
      let errorMessage = saveError.message || 'Failed to save account';
      
      // Remove HTML content
      if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html')) {
        errorMessage = 'Supabase server is currently unavailable. Please try again in a few minutes.';
      } else if (errorMessage.length > 150) {
        // Truncate long messages
        errorMessage = errorMessage.substring(0, 150) + '...';
      }
      
      // Still redirect but with sanitized error
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-inbox?` +
        `error=${encodeURIComponent(errorMessage)}&` +
        `email=${encodeURIComponent(userEmail)}`
      );
    }
  } catch (error: any) {
    console.error('[Outlook OAuth] Error:', error);
    
    // Sanitize error message
    let errorMessage = error.message || 'An error occurred during authentication';
    
    // Remove HTML content
    if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html')) {
      errorMessage = 'Supabase server is currently unavailable. Please try again in a few minutes.';
    } else if (errorMessage.length > 150) {
      errorMessage = errorMessage.substring(0, 150) + '...';
    }
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/email-inbox?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
