/**
 * Email Connector Service
 * Supports Gmail API, Outlook API, and IMAP
 */

export interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  name?: string;
  connected: boolean;
  lastSync?: string;
  config?: {
    // Gmail/Outlook OAuth
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    // IMAP
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    useSSL?: boolean;
  };
}

export interface EmailMessage {
  id: string;
  threadId?: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  date: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  labels?: string[];
}

export interface EmailSyncResult {
  success: boolean;
  emails: EmailMessage[];
  count: number;
  error?: string;
}

/**
 * Gmail API Connector
 */
export class GmailConnector {
  private accessToken: string;
  private refreshToken?: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async fetchEmails(maxResults: number = 50, query?: string, fetchAll: boolean = false): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];

    try {
      // Build query to exclude deleted/trash emails
      const excludeDeleted = '-in:trash -is:deleted';
      const finalQuery = query 
        ? `${query} ${excludeDeleted}` 
        : excludeDeleted;
      
      let pageToken: string | undefined = undefined;
      const batchSize = fetchAll ? 500 : maxResults;
      let totalFetched = 0;
      const maxTotal = fetchAll ? 10000 : maxResults; // Safety limit for fetchAll

      do {
        // List messages with pagination
        let listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${Math.min(batchSize, maxTotal - totalFetched)}`;
        if (finalQuery) {
          listUrl += `&q=${encodeURIComponent(finalQuery)}`;
        }
        if (pageToken) {
          listUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
        }
        
        const listResponse = await fetch(listUrl, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!listResponse.ok) {
          throw new Error(`Gmail API error: ${listResponse.statusText}`);
        }

        const listData = await listResponse.json();
        const messageIds = listData.messages?.map((m: any) => m.id) || [];
        pageToken = listData.nextPageToken;

        // Fetch full message details
        for (const messageId of messageIds) {
          try {
            const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
            const messageResponse = await fetch(messageUrl, {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (messageResponse.ok) {
              const messageData = await messageResponse.json();
              const email = this.parseGmailMessage(messageData);
              messages.push(email);
              totalFetched++;
            }
          } catch (error) {
            console.error(`Failed to fetch message ${messageId}:`, error);
          }
        }

        // Stop if we've reached the limit or no more pages
        if (!fetchAll || totalFetched >= maxTotal || !pageToken) {
          break;
        }
      } while (pageToken && totalFetched < maxTotal);

      return messages;
    } catch (error: any) {
      throw new Error(`Gmail fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch specific emails by IDs (for background classification)
   */
  async fetchEmailsByIds(messageIds: string[]): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];
    
    // Fetch in parallel batches (20 at a time)
    const batchSize = 20;
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (messageId: string) => {
        try {
          const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
          const messageResponse = await fetch(messageUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (messageResponse.ok) {
            const messageData = await messageResponse.json();
            return this.parseGmailMessage(messageData);
          }
        } catch (error) {
          console.error(`Failed to fetch message ${messageId}:`, error);
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      const validEmails = batchResults.filter(email => email !== null) as EmailMessage[];
      messages.push(...validEmails);
    }

    return messages;
  }

  private parseGmailMessage(messageData: any): EmailMessage {
    const headers = messageData.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name)?.value || '';

    const body = this.extractBody(messageData.payload);
    
    return {
      id: messageData.id,
      threadId: messageData.threadId,
      from: getHeader('from'),
      to: getHeader('to')?.split(',').map((e: string) => e.trim()) || [],
      cc: getHeader('cc')?.split(',').map((e: string) => e.trim()) || [],
      subject: getHeader('subject'),
      body: body.text || '',
      htmlBody: body.html,
      date: getHeader('date'),
      labels: messageData.labelIds || []
    };
  }

  private extractBody(payload: any): { text?: string; html?: string } {
    let text = '';
    let html = '';

    // Base64 decode helper (works in browser)
    const decodeBase64 = (str: string): string => {
      try {
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        return '';
      }
    };

    if (payload.body?.data) {
      text = decodeBase64(payload.body.data);
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          text = decodeBase64(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          html = decodeBase64(part.body.data);
        }
      }
    }

    return { text, html };
  }

  async refreshAccessToken(clientId: string, clientSecret: string): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }
}

/**
 * Outlook/Microsoft 365 Connector
 */
export class OutlookConnector {
  private accessToken: string;
  private refreshToken?: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async fetchEmails(maxResults: number = 50, filter?: string, fetchAll: boolean = false): Promise<EmailMessage[]> {
    try {
      // Fetch from Inbox only (excludes DeletedItems folder automatically)
      // Note: Microsoft Graph API doesn't support isDeleted filter on messages
      // Instead, we fetch from Inbox folder which excludes deleted items
      const allMessages: EmailMessage[] = [];
      let skip = 0;
      const pageSize = fetchAll ? 500 : maxResults;
      const maxTotal = fetchAll ? 10000 : maxResults; // Safety limit for fetchAll

      while (skip < maxTotal) {
        const filterParam = filter ? `&$filter=${encodeURIComponent(filter)}` : '';
        const url = `https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=${Math.min(pageSize, maxTotal - skip)}&$skip=${skip}&$orderby=receivedDateTime desc${filterParam}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          let errorMessage = `Outlook API error: ${response.status} ${response.statusText}`;
          let errorDetails: any = null;
          
          // Try to get detailed error from response
          try {
            const errorText = await response.text();
            errorDetails = errorText;
            
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error) {
                errorMessage = `Outlook API error: ${errorData.error.code || 'Unknown'} - ${errorData.error.message || response.statusText}`;
                errorDetails = errorData;
              }
            } catch {
              // Not JSON, use text as-is
            }
          } catch {
            // If response isn't readable, use status text
          }
          
          console.error('[Outlook Connector] API Error:', {
            status: response.status,
            statusText: response.statusText,
            errorDetails,
            tokenPrefix: this.accessToken.substring(0, 20) + '...'
          });
          
          // Provide specific guidance for common errors
          if (response.status === 401) {
            errorMessage += '. Your access token may have expired or is invalid.';
            if (errorDetails?.error?.code === 'InvalidAuthenticationToken') {
              errorMessage += ' The token is invalid. Please reconnect your Outlook account.';
            } else {
              errorMessage += ' Please reconnect your Outlook account.';
            }
          } else if (response.status === 403) {
            errorMessage += '. Insufficient permissions. Please ensure Mail.Read permission is granted in Azure Portal.';
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const pageMessages = (data.value || []).map((msg: any) => this.parseOutlookMessage(msg));
        allMessages.push(...pageMessages);

        // Stop if we got fewer messages than requested (last page) or reached limit
        if (pageMessages.length < pageSize || allMessages.length >= maxTotal || !data['@odata.nextLink']) {
          break;
        }

        skip += pageSize;
      }

      return allMessages;
    } catch (error: any) {
      throw new Error(`Outlook fetch failed: ${error.message}`);
    }
  }

  private parseOutlookMessage(msg: any): EmailMessage {
    const fromAddress = msg.from?.emailAddress?.address || msg.from?.emailAddress?.name || 'Unknown';
    const fromName = msg.from?.emailAddress?.name;
    const fromDisplay = fromName ? `${fromName} <${fromAddress}>` : fromAddress;
    
    // Extract text from HTML if needed
    let textBody = msg.body?.content || '';
    if (msg.body?.contentType === 'html' && textBody) {
      // Simple HTML stripping (in production, use proper HTML parser)
      textBody = textBody.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    }

    // Safely extract recipients
    const toRecipients = (msg.toRecipients || []).map((r: any) => {
      return r?.emailAddress?.address || r?.emailAddress?.name || '';
    }).filter(Boolean);
    
    const ccRecipients = (msg.ccRecipients || []).map((r: any) => {
      return r?.emailAddress?.address || r?.emailAddress?.name || '';
    }).filter(Boolean);

    return {
      id: msg.id || `msg-${Date.now()}-${Math.random()}`,
      from: fromDisplay,
      to: toRecipients,
      cc: ccRecipients,
      subject: msg.subject || '(No Subject)',
      body: textBody || '',
      htmlBody: msg.body?.contentType === 'html' ? (msg.body.content || '') : undefined,
      date: msg.receivedDateTime || msg.sentDateTime || new Date().toISOString(),
      attachments: msg.hasAttachments ? [] : undefined, // Would need separate API call
      labels: msg.isRead ? ['READ'] : ['UNREAD']
    };
  }
}

/**
 * IMAP Connector (for any email provider)
 */
export class IMAPConnector {
  private config: {
    host: string;
    port: number;
    username: string;
    password: string;
    useSSL: boolean;
  };

  constructor(config: {
    host: string;
    port: number;
    username: string;
    password: string;
    useSSL: boolean;
  }) {
    this.config = config;
  }

  async fetchEmails(maxResults: number = 50): Promise<EmailMessage[]> {
    // IMAP requires server-side implementation
    // This would be handled by a backend API endpoint
    throw new Error('IMAP connector requires server-side implementation. Use /api/email-imap/fetch endpoint.');
  }
}

/**
 * Unified Email Connector
 */
export class EmailConnector {
  static async connectGmail(accessToken: string, refreshToken?: string): Promise<GmailConnector> {
    return new GmailConnector(accessToken, refreshToken);
  }

  static async connectOutlook(accessToken: string, refreshToken?: string): Promise<OutlookConnector> {
    return new OutlookConnector(accessToken, refreshToken);
  }

  static async connectIMAP(config: {
    host: string;
    port: number;
    username: string;
    password: string;
    useSSL: boolean;
  }): Promise<IMAPConnector> {
    return new IMAPConnector(config);
  }
}

