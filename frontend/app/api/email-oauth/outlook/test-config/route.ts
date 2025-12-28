/**
 * Test Outlook OAuth Configuration
 * Verifies that all credentials are correctly configured
 */

import { NextRequest, NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/email-oauth/outlook/callback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const config = {
    clientId: MICROSOFT_CLIENT_ID,
    clientIdLength: MICROSOFT_CLIENT_ID?.length || 0,
    tenantId: MICROSOFT_TENANT_ID,
    tenantIdLength: MICROSOFT_TENANT_ID?.length || 0,
    redirectUri: MICROSOFT_REDIRECT_URI,
    clientSecret: {
      exists: !!MICROSOFT_CLIENT_SECRET,
      length: MICROSOFT_CLIENT_SECRET?.length || 0,
      first10: MICROSOFT_CLIENT_SECRET?.substring(0, 10) || 'N/A',
      last10: MICROSOFT_CLIENT_SECRET?.substring(MICROSOFT_CLIENT_SECRET.length - 10) || 'N/A'
    },
    expectedValues: {
      clientId: 'Should be set in environment variables',
      tenantId: 'Should be set in environment variables',
      secretFirst10: 'Should be set in environment variables',
      secretLength: 'Should be 40+ characters'
    },
    matches: {
      clientId: !!MICROSOFT_CLIENT_ID,
      tenantId: !!MICROSOFT_TENANT_ID,
      secretExists: !!MICROSOFT_CLIENT_SECRET,
      secretLength: (MICROSOFT_CLIENT_SECRET?.length || 0) >= 40
    }
  };

  const allMatch = Object.values(config.matches).every(v => v === true);

  return NextResponse.json({
    status: allMatch ? '✅ All credentials match' : '⚠️ Some credentials do not match',
    config,
    oauthUrl: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?` +
      `client_id=${MICROSOFT_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent('openid profile email offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read')}&` +
      `prompt=consent&` +
      `access_type=offline`
  });
}

