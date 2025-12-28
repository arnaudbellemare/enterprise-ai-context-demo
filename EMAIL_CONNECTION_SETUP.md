# Email Connection Setup Guide

## Overview

You can connect your email account directly to automatically fetch and classify emails. Two options:

1. **Connect via OAuth** (Gmail/Outlook) - Recommended, secure
2. **Manual Upload** - Paste emails manually

## Option 1: Connect Gmail (OAuth)

### Step 1: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/email-oauth/gmail/callback`
   - Copy Client ID and Client Secret

### Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/email-oauth/gmail/callback
```

### Step 3: Connect Account

1. Go to `http://localhost:3000/email-testing`
2. Click "Connect Email Account"
3. Click "Gmail"
4. Authorize access in Google popup
5. Account will be connected automatically

## Option 2: Connect Outlook (OAuth)

### Step 1: Set Up Microsoft Azure App

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application:
   - Go to "Azure Active Directory" > "App registrations"
   - Click "New registration"
   - Name: "Email Classifier"
   - Redirect URI: `http://localhost:3000/api/email-oauth/outlook/callback`
   - Click "Register"

3. Configure API permissions:
   - Go to "API permissions"
   - Add "Microsoft Graph" > "Mail.Read"
   - Grant admin consent

4. Create client secret:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value

### Step 2: Configure Environment Variables

```bash
OUTLOOK_CLIENT_ID=your-azure-app-id
OUTLOOK_CLIENT_SECRET=your-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/email-oauth/outlook/callback
```

## Option 3: Connect via IMAP (Any Provider)

For providers not supporting OAuth (or for more control):

### Step 1: Get IMAP Settings

Common providers:
- **Gmail**: `imap.gmail.com:993` (SSL)
- **Outlook**: `outlook.office365.com:993` (SSL)
- **Yahoo**: `imap.mail.yahoo.com:993` (SSL)
- **Custom**: Check your email provider's documentation

### Step 2: Create App Password

For Gmail:
1. Enable 2FA
2. Go to Google Account > Security
3. Create App Password
4. Use this password (not your regular password)

### Step 3: Connect via UI

1. Go to `http://localhost:3000/email-testing`
2. Click "Connect Email Account"
3. Click "IMAP"
4. Enter:
   - Email address
   - IMAP host (e.g., `imap.gmail.com`)
   - Port (e.g., `993`)
   - Username (your email)
   - Password (app password)
   - Enable SSL

## Option 4: Manual Upload (No Connection)

If you prefer not to connect:

1. Copy email text from your email client
2. Paste into the text area
3. Click "Classify Email"
4. Review and label if needed

## Using Connected Accounts

### Fetch Emails

1. Select connected account from dropdown
2. Click "Fetch & Classify Emails"
3. System will:
   - Fetch recent emails
   - Auto-classify each email
   - Show results with confidence scores

### Auto-Classification

When emails are fetched, they're automatically classified using:
- Rule-based matching (keywords, patterns)
- LLM classification (if confidence is low)
- Few-shot examples (your labeled emails)

### Review & Label

1. Click on any fetched email to load it
2. Review the classification
3. If incorrect, select correct template
4. Click "Label Email" to improve future classifications

## Security Notes

### OAuth (Recommended)
- ✅ No password storage
- ✅ Tokens expire automatically
- ✅ Can revoke access anytime
- ✅ Secure, industry-standard

### IMAP
- ⚠️ Requires password/app password
- ⚠️ Store securely (encrypted)
- ⚠️ Use app passwords, not regular passwords
- ⚠️ Consider OAuth if available

### Production Deployment

For production:
1. Use environment variables for all credentials
2. Store tokens in encrypted database
3. Implement token refresh
4. Use HTTPS only
5. Add rate limiting

## Troubleshooting

### Gmail OAuth Not Working

- Check redirect URI matches exactly
- Verify Gmail API is enabled
- Check client ID/secret are correct
- Ensure redirect URI is in authorized list

### IMAP Connection Failed

- Verify IMAP is enabled in email settings
- Check host/port are correct
- Use app password (not regular password)
- Check firewall/network settings

### Emails Not Fetching

- Check account is connected
- Verify tokens haven't expired
- Check API quotas/limits
- Review error messages in console

## API Endpoints

### Connect Account
```bash
POST /api/email-connect
{
  "provider": "gmail",
  "email": "user@example.com",
  "config": { ... }
}
```

### Fetch Emails
```bash
POST /api/email-fetch
{
  "accountId": "account-id",
  "maxResults": 50,
  "autoClassify": true
}
```

### Gmail OAuth
```bash
GET /api/email-oauth/gmail?action=auth
# Returns authUrl to redirect user
```

## Next Steps

1. **Connect your email account** (Gmail recommended)
2. **Fetch a few emails** to test
3. **Review classifications** and label incorrect ones
4. **Build up labeled examples** (20-30 per template)
5. **Set up automatic fetching** (coming soon: scheduled sync)




