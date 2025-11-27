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

  async fetchEmails(maxResults: number = 50, query?: string): Promise<EmailMessage[]> {
    const messages: EmailMessage[] = [];

    try {
      // List messages
      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
      
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

      // Fetch full message details
      for (const messageId of messageIds.slice(0, maxResults)) {
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
          }
        } catch (error) {
          console.error(`Failed to fetch message ${messageId}:`, error);
        }
      }

      return messages;
    } catch (error: any) {
      throw new Error(`Gmail fetch failed: ${error.message}`);
    }
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

  async fetchEmails(maxResults: number = 50, filter?: string): Promise<EmailMessage[]> {
    try {
      const filterParam = filter ? `&$filter=${encodeURIComponent(filter)}` : '';
      const url = `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc${filterParam}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.value || []).map((msg: any) => this.parseOutlookMessage(msg));
    } catch (error: any) {
      throw new Error(`Outlook fetch failed: ${error.message}`);
    }
  }

  private parseOutlookMessage(msg: any): EmailMessage {
    return {
      id: msg.id,
      from: msg.from?.emailAddress?.address || '',
      to: msg.toRecipients?.map((r: any) => r.emailAddress.address) || [],
      cc: msg.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
      subject: msg.subject || '',
      body: msg.body?.content || '',
      htmlBody: msg.body?.contentType === 'html' ? msg.body.content : undefined,
      date: msg.receivedDateTime,
      attachments: msg.hasAttachments ? [] : undefined // Would need separate API call
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

