/**
 * Email OAuth Token Manager
 * Handles token storage, retrieval, and automatic refresh
 *
 * AUTHENTICATE ONCE, WORKS FOREVER!
 */

import { supabase } from './supabase';

export interface EmailAccount {
  id: string;
  userId: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  connectedAt: Date;
  lastSync: Date | null;
  isActive: boolean;
}

export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/**
 * Save or update email account with OAuth tokens
 */
export async function saveEmailAccount(
  userId: string,
  provider: 'gmail' | 'outlook' | 'imap',
  email: string,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number = 3600 // Default: 1 hour
): Promise<EmailAccount> {
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  try {
    const { data, error } = await supabase
      .from('email_accounts')
      .upsert({
        user_id: userId,
        provider,
        email,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expiry: tokenExpiry.toISOString(),
        last_refresh: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'user_id,email,provider'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Check if error message contains HTML (indicates Supabase is down)
      if (error.message?.includes('<!DOCTYPE') || error.message?.includes('<html') || error.message?.includes('Cloudflare')) {
        throw new Error('Supabase server is currently unavailable. Please try again in a few minutes.');
      }
      
      throw new Error(`Failed to save email account: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
    }

    if (!data) {
      throw new Error('No data returned from Supabase');
    }

    return mapDbToAccount(data);
  } catch (error: any) {
    // Check if it's a network/fetch error or HTML response
    const errorMessage = error.message || String(error);
    
    if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('<html') || errorMessage.includes('Cloudflare') || errorMessage.includes('521')) {
      throw new Error('Supabase server is currently unavailable. Please try again in a few minutes.');
    }
    
    if (errorMessage.includes('fetch') || error.cause?.code === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
      throw new Error(`Cannot connect to Supabase. Please check your Supabase configuration and ensure the service is accessible.`);
    }
    
    // Truncate very long error messages
    if (errorMessage.length > 200) {
      throw new Error(`Failed to save email account: ${errorMessage.substring(0, 200)}...`);
    }
    
    throw error;
  }
}

/**
 * Get email account by ID or email
 */
export async function getEmailAccount(
  accountId?: string,
  userId?: string,
  email?: string
): Promise<EmailAccount | null> {
  try {
    let query = supabase.from('email_accounts').select('*');

    if (accountId) {
      query = query.eq('id', accountId);
    } else if (userId && email) {
      query = query.eq('user_id', userId).eq('email', email);
    } else {
      throw new Error('Either accountId or (userId + email) required');
    }

    const { data, error } = await query.eq('is_active', true).single();

    if (error || !data) {
      return null;
    }

    return mapDbToAccount(data);
  } catch (error: any) {
    console.error('Error getting email account:', error);
    return null;
  }
}

/**
 * Get all email accounts for a user
 */
export async function getUserEmailAccounts(userId: string): Promise<EmailAccount[]> {
  try {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to get email accounts: ${error.message}`);
    }

    return (data || []).map(mapDbToAccount);
  } catch (error: any) {
    if (error.message?.includes('fetch') || error.cause?.code === 'ECONNREFUSED') {
      console.error('Cannot connect to Supabase:', error);
      return [];
    }
    throw error;
  }
}

/**
 * Refresh Gmail access token using refresh token
 */
export async function refreshGmailToken(
  accountId: string
): Promise<string> {
  // Get current account
  const account = await getEmailAccount(accountId);
  if (!account) {
    throw new Error('Email account not found');
  }

  if (account.provider !== 'gmail') {
    throw new Error('Only Gmail accounts can be refreshed');
  }

  if (!account.refreshToken) {
    throw new Error('No refresh token available. Re-authenticate required.');
  }

  // Refresh the token
  const clientId = process.env.GMAIL_CLIENT_ID!;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET!;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const tokens: GmailTokens = await response.json();

  // Update account with new token
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

  const { error: updateError } = await supabase
    .from('email_accounts')
    .update({
      access_token: tokens.access_token,
      token_expiry: tokenExpiry.toISOString(),
      last_refresh: new Date().toISOString()
    })
    .eq('id', accountId);

  if (updateError) {
    throw new Error(`Failed to update token: ${updateError.message}`);
  }

  console.log(`[Token Manager] Refreshed token for account ${accountId}`);

  return tokens.access_token;
}

/**
 * Refresh Outlook/Microsoft access token using refresh token
 */
export async function refreshOutlookToken(
  accountId: string
): Promise<string> {
  // Get current account
  const account = await getEmailAccount(accountId);
  if (!account) {
    throw new Error('Email account not found');
  }

  if (account.provider !== 'outlook') {
    throw new Error('Only Outlook accounts can be refreshed with this method');
  }

  if (!account.refreshToken) {
    throw new Error('No refresh token available. Re-authenticate required.');
  }

  // Refresh the token
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  
  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Microsoft OAuth credentials not configured. Please set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_TENANT_ID in environment variables.');
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.refreshToken,
        grant_type: 'refresh_token',
        scope: 'openid profile email offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read'
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to refresh Outlook token: ${errorText}`;
    
    // Parse error if it's JSON
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error_description) {
        errorMessage = `${errorJson.error}: ${errorJson.error_description}`;
        
        // Provide specific guidance
        if (errorJson.error === 'invalid_grant') {
          errorMessage += '. The refresh token may be expired or revoked. Please reconnect your account.';
        } else if (errorJson.error === 'invalid_client') {
          errorMessage += '. Invalid client credentials. Please check your Azure App Registration.';
        }
      }
    } catch {
      // Not JSON, use as-is
    }
    
    throw new Error(errorMessage);
  }

  const tokens: any = await response.json();
  
  if (!tokens.access_token) {
    throw new Error('Microsoft did not return a new access token during refresh.');
  }

  // Update account with new token
  const tokenExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

  const updateData: any = {
    access_token: tokens.access_token,
    token_expiry: tokenExpiry.toISOString(),
    last_refresh: new Date().toISOString()
  };
  
  // Microsoft sometimes returns a new refresh token - use it if available
  if (tokens.refresh_token) {
    updateData.refresh_token = tokens.refresh_token;
    console.log(`[Token Manager] Received new refresh token for account ${accountId}`);
  } else {
    // Keep existing refresh token if Microsoft didn't return a new one
    updateData.refresh_token = account.refreshToken;
  }

  const { error: updateError } = await supabase
    .from('email_accounts')
    .update(updateData)
    .eq('id', accountId);

  if (updateError) {
    throw new Error(`Failed to update token: ${updateError.message}`);
  }

  console.log(`[Token Manager] Refreshed Outlook token for account ${accountId}`);

  return tokens.access_token;
}

/**
 * Get valid access token (automatically refreshes if expired)
 * THIS IS THE MAGIC - AUTOMATIC REFRESH!
 */
export async function getValidAccessToken(
  accountId: string
): Promise<string> {
  const account = await getEmailAccount(accountId);
  if (!account) {
    throw new Error(`Email account not found: ${accountId}`);
  }

  if (!account.accessToken) {
    throw new Error(`No access token available for account ${accountId}. Please reconnect your email account.`);
  }

  // Check if token is expired or expires soon (within 5 minutes)
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer

  if (account.tokenExpiry && account.tokenExpiry <= expiryBuffer) {
    console.log(`[Token Manager] Token expired or expiring soon for account ${accountId}, refreshing...`);

    if (account.provider === 'gmail') {
      if (!account.refreshToken) {
        throw new Error(`No refresh token available for Gmail account ${accountId}. Please reconnect your account.`);
      }
      return await refreshGmailToken(accountId);
    } else if (account.provider === 'outlook') {
      if (!account.refreshToken) {
        throw new Error(`No refresh token available for Outlook account ${accountId}. Please reconnect your account.`);
      }
      return await refreshOutlookToken(accountId);
    }
  }

  return account.accessToken;
}

/**
 * Update last sync time
 */
export async function updateLastSync(accountId: string): Promise<void> {
  await supabase
    .from('email_accounts')
    .update({
      last_sync: new Date().toISOString()
    })
    .eq('id', accountId);
}

/**
 * Deactivate (disconnect) email account
 */
export async function disconnectEmailAccount(
  accountId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('email_accounts')
    .update({ is_active: false })
    .eq('id', accountId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to disconnect account: ${error.message}`);
  }
}

/**
 * Map database row to EmailAccount type
 */
function mapDbToAccount(data: any): EmailAccount {
  return {
    id: data.id,
    userId: data.user_id,
    provider: data.provider,
    email: data.email,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiry: data.token_expiry ? new Date(data.token_expiry) : null,
    connectedAt: new Date(data.connected_at),
    lastSync: data.last_sync ? new Date(data.last_sync) : null,
    isActive: data.is_active
  };
}
