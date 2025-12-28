# Complete Email Connection System

## Overview

A unified email connection system that supports:
- **Gmail** (OAuth)
- **Outlook** (OAuth)  
- **IMAP** (Any email provider)

## Features

✅ Connect multiple email accounts
✅ View all emails in unified inbox
✅ Auto-classify emails with AI
✅ Persistent storage of connections
✅ Secure token management
✅ Refresh emails on demand

## Quick Start

### 1. Access the Email Inbox

Navigate to: `http://localhost:3000/email-inbox`

### 2. Connect Your Email Account

**Option A: Gmail (OAuth)**
1. Click "Connect Account"
2. Select "Gmail (OAuth)"
3. Click "Connect Gmail"
4. Authorize in Google popup
5. Account connected automatically

**Option B: Outlook (OAuth)**
1. Click "Connect Account"
2. Select "Outlook (OAuth)"
3. Click "Connect Outlook"
4. Authorize in Microsoft popup
5. Account connected automatically

**Option C: IMAP (Any Provider)**
1. Click "Connect Account"
2. Select "IMAP (Any Provider)"
3. Fill in:
   - Email address
   - IMAP host (e.g., `imap.gmail.com`, `outlook.office365.com`)
   - Port (usually 993)
   - Username (optional, defaults to email)
   - Password / App Password
   - Enable TLS/SSL (usually checked)
4. Click "Connect IMAP"

### 3. View Your Emails

1. Select a connected account
2. Click "Refresh" to fetch emails
3. Emails are automatically classified
4. Click any email to view details

## API Endpoints

### Connect Account

```bash
POST /api/email-accounts/connect
Content-Type: application/json

# For OAuth (Gmail/Outlook)
{
  "provider": "gmail",
  "email": "user@gmail.com",
  "accessToken": "token",
  "refreshToken": "refresh_token",
  "expiresIn": 3600
}

# For IMAP
{
  "provider": "imap",
  "email": "user@example.com",
  "host": "imap.gmail.com",
  "port": 993,
  "username": "user@example.com",
  "password": "app_password",
  "tls": true
}
```

### Fetch Emails

```bash
POST /api/email-accounts/fetch
Content-Type: application/json

{
  "accountId": "account-uuid",
  "maxResults": 50,
  "autoClassify": true,
  "mailbox": "INBOX"
}
```

### List Connected Accounts

```bash
GET /api/email-accounts/connect?userId=default
```

### Disconnect Account

```bash
DELETE /api/email-connect?accountId=account-uuid&userId=default
```

## Common IMAP Settings

### Gmail
- Host: `imap.gmail.com`
- Port: `993`
- TLS: Yes
- Username: Your email
- Password: App Password (not regular password)

**How to get Gmail App Password:**
1. Enable 2FA on your Google account
2. Go to Google Account > Security
3. Create App Password
4. Use the generated password

### Outlook/Office 365
- Host: `outlook.office365.com`
- Port: `993`
- TLS: Yes
- Username: Your email
- Password: App Password (not regular password)

**How to get Outlook App Password:**
1. Go to https://account.microsoft.com/security
2. Sign in with your account
3. Click "Advanced security options"
4. Under "App passwords", create new
5. Use the generated password

### Yahoo
- Host: `imap.mail.yahoo.com`
- Port: `993`
- TLS: Yes

### Custom IMAP Server
Check your email provider's documentation for IMAP settings.

## Email Classification

All fetched emails are automatically classified using:
- Rule-based matching (keywords, patterns)
- LLM classification (for uncertain cases)
- Embedding-based few-shot learning (15 examples)

Classification shows:
- Template name (e.g., "WATER DAMAGE INCIDENT")
- Confidence score (0-100%)
- Reasoning (why this template was chosen)

## Security

### OAuth (Recommended)
- ✅ No password storage
- ✅ Tokens expire automatically
- ✅ Can revoke access anytime
- ✅ Industry-standard security

### IMAP
- ⚠️ Requires password/app password
- ⚠️ Passwords are base64 encoded (not encrypted)
- ⚠️ Use app passwords, not regular passwords
- ⚠️ Consider OAuth if available

**For Production:**
- Use proper encryption (AES-256-GCM) for IMAP passwords
- Store tokens in encrypted database
- Implement token refresh for OAuth
- Use HTTPS only
- Add rate limiting

## Troubleshooting

### "IMAP connection failed"
- Verify IMAP is enabled in email settings
- Check host/port are correct
- Use app password (not regular password)
- Check firewall/network settings
- Try disabling TLS if connection fails

### "OAuth not configured"
- Set environment variables:
  - `GMAIL_CLIENT_ID`
  - `GMAIL_CLIENT_SECRET`
  - `OUTLOOK_CLIENT_ID`
  - `OUTLOOK_CLIENT_SECRET`
- Verify redirect URIs match exactly

### "No emails found"
- Check account is connected
- Verify emails exist in inbox
- Try increasing `maxResults`
- Check email provider limits

### "Classification not working"
- Ensure classification API is running
- Check if labeled examples exist
- Verify LLM provider is configured

## Next Steps

1. **Connect your email account** using the inbox page
2. **Fetch emails** and review classifications
3. **Label incorrect classifications** to improve accuracy
4. **Set up automatic syncing** (coming soon)
5. **Configure auto-responses** (coming soon)

## Files Created

- `frontend/app/api/email-accounts/connect/route.ts` - Unified connection API
- `frontend/app/api/email-accounts/fetch/route.ts` - Unified fetch API
- `frontend/app/email-inbox/page.tsx` - Email inbox UI
- `EMAIL_CONNECTION_SYSTEM.md` - This documentation

## Integration with Classification

The email system automatically:
1. Fetches emails from connected accounts
2. Classifies each email using the AI system
3. Shows classification results in the inbox
4. Allows you to review and correct classifications
5. Learns from your corrections automatically

This creates a complete feedback loop for continuous improvement!

