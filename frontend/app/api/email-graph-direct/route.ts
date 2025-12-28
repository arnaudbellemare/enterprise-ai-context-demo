/**
 * Direct Microsoft Graph API Access
 * Use a manually-obtained access token from Graph Explorer
 * https://developer.microsoft.com/en-us/graph/graph-explorer
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { accessToken, maxResults = 50 } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required. Get one from https://developer.microsoft.com/en-us/graph/graph-explorer' },
        { status: 400 }
      );
    }

    console.log('📧 Fetching emails via Microsoft Graph API...');

    // Fetch emails
    const emailsResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$select=id,subject,from,receivedDateTime,bodyPreview,body,isRead`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!emailsResponse.ok) {
      const error = await emailsResponse.text();
      console.error('❌ Graph API error:', error);

      if (error.includes('InvalidAuthenticationToken')) {
        return NextResponse.json(
          {
            error: 'Token expired or invalid',
            message: 'Get a fresh token from https://developer.microsoft.com/en-us/graph/graph-explorer'
          },
          { status: 401 }
        );
      }

      throw new Error(`Graph API error: ${error}`);
    }

    const data = await emailsResponse.json();
    const emails = (data.value || []).map((email: any) => ({
      id: email.id,
      subject: email.subject || '(No Subject)',
      from: email.from?.emailAddress?.address || 'Unknown',
      fromName: email.from?.emailAddress?.name || '',
      date: email.receivedDateTime,
      snippet: email.bodyPreview || '',
      body: email.body?.content || email.bodyPreview || '',
      isUnread: !email.isRead
    }));

    console.log(`✅ Fetched ${emails.length} emails`);

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
      account: {
        provider: 'outlook-graph',
        lastSync: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Email fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch emails'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct Microsoft Graph API access',
    instructions: [
      '1. Go to https://developer.microsoft.com/en-us/graph/graph-explorer',
      '2. Sign in with info@gestionvelora.com',
      '3. Click "Access token" to copy your token',
      '4. POST to this endpoint with { "accessToken": "YOUR_TOKEN" }'
    ],
    example: {
      method: 'POST',
      body: {
        accessToken: 'eyJ0eXAi...',
        maxResults: 50
      }
    }
  });
}
