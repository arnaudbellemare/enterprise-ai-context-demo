# Quick IMAP Setup for info@gestionvelora.com

## Step 1: Get App Password from Microsoft

Since info@gestionvelora.com is a Microsoft 365 account, you need an app password:

1. Go to: https://account.microsoft.com/security
2. Sign in with **info@gestionvelora.com**
3. Click **"Advanced security options"**
4. Under **"App passwords"**, click **"Create a new app password"**
5. Copy the generated password (looks like: `abcd-efgh-ijkl-mnop`)

## Step 2: Add to .env.local

Edit `frontend/.env.local` and add:

```bash
# IMAP Configuration for info@gestionvelora.com
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
IMAP_USER=info@gestionvelora.com
IMAP_PASSWORD=abcd-efgh-ijkl-mnop
IMAP_TLS=true
IMAP_MAILBOX=INBOX

# Email sending (for auto-replies)
EMAIL_FROM=info@gestionvelora.com
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=info@gestionvelora.com
SMTP_PASSWORD=abcd-efgh-ijkl-mnop
SMTP_SECURE=false

# Polling interval (check for new emails every 60 seconds)
EMAIL_POLL_INTERVAL_MS=60000
```

**Replace** `abcd-efgh-ijkl-mnop` with the actual app password from Step 1.

## Step 3: Test Connection

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/email-responder

3. Click **"Test Connection"** or **"Connect via IMAP"**

4. If successful, you'll see: ✅ Connected to info@gestionvelora.com

## What This Enables

✅ **Auto-fetch emails** from info@gestionvelora.com every 60 seconds
✅ **Classify emails** into 23 property management templates
✅ **Generate draft responses** using AI
✅ **Send auto-replies** (if you enable that feature)

## Troubleshooting

### Error: "Authentication failed"
- **Solution**: Make sure you're using the **app password**, not your regular password

### Error: "Connection timeout"
- **Solution**: Check if your firewall/network allows IMAP connections (port 993)

### Error: "Mailbox does not exist"
- **Solution**: Change `IMAP_MAILBOX=INBOX` to `IMAP_MAILBOX=Inbox` (case sensitive)

## Security Note

⚠️ **App passwords** bypass 2FA, so:
- Use OAuth (Option 1) for production systems
- Use IMAP (Option 2) for development/testing only
- Rotate app passwords every 90 days
