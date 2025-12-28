# Outlook Email Connection Setup

## Quick Start

### 1. Set Up Microsoft Azure App

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **"New registration"**
4. Fill in:
   - **Name**: Email Classifier (or any name)
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: 
     - Platform: Web
     - URI: `http://localhost:3000/api/email-oauth/outlook/callback`
5. Click **"Register"**

### 2. Configure API Permissions

1. In your app, go to **"API permissions"**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add these permissions:
   - `Mail.Read` - Read user mail
   - `Mail.Send` - Send mail as user
   - `User.Read` - Sign in and read user profile
   - `offline_access` - Maintain access to data you have given it access to
6. Click **"Add permissions"**
7. Click **"Grant admin consent"** (if you're an admin)

### 3. Create Client Secret

1. Go to **"Certificates & secrets"**
2. Click **"New client secret"**
3. Add description: "Email Classifier Secret"
4. Set expiration (recommend 24 months)
5. Click **"Add"**
6. **IMPORTANT**: Copy the secret value immediately (you won't see it again!)

### 4. Add Environment Variables

Add to `frontend/.env.local`:

```bash
# Microsoft Outlook OAuth
MICROSOFT_CLIENT_ID=your-azure-app-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/email-oauth/outlook/callback

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Connect Your Outlook Account

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:3000/email-inbox`

3. Click **"Connect Account"**

4. Select **"Outlook (OAuth)"**

5. Click **"Connect Outlook"**

6. Sign in with your Microsoft account

7. Grant permissions when prompted

8. You'll be redirected back to the inbox with your account connected!

## What You Get

✅ **Automatic email fetching** from your Outlook inbox
✅ **AI-powered classification** of all emails
✅ **Persistent connection** - tokens stored securely
✅ **Auto-refresh tokens** - connection stays active
✅ **All emails accessible** in one unified inbox

## Troubleshooting

### "Outlook OAuth not configured"
- Check `MICROSOFT_CLIENT_ID` is set in `.env.local`
- Check `MICROSOFT_CLIENT_SECRET` is set
- Restart your dev server after adding env vars

### "Redirect URI mismatch"
- Make sure redirect URI in Azure matches exactly:
  - `http://localhost:3000/api/email-oauth/outlook/callback`
- No trailing slashes
- Must match case exactly

### "Insufficient permissions"
- Make sure you granted admin consent in Azure
- Check permissions include: `Mail.Read`, `Mail.Send`, `User.Read`, `offline_access`

### "Failed to exchange code for tokens"
- Check client secret is correct
- Verify tenant ID is correct (use `common` for personal accounts)
- Check redirect URI matches exactly

### "Account not showing up"
- Check browser console for errors
- Verify tokens were saved to database
- Try refreshing the page
- Check Supabase `email_accounts` table

## Production Deployment

For production, update:

1. **Redirect URI** in Azure:
   - Change to: `https://yourdomain.com/api/email-oauth/outlook/callback`

2. **Environment variables**:
   ```bash
   MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/email-oauth/outlook/callback
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **HTTPS required** - Microsoft requires HTTPS for production OAuth

## Security Notes

- ✅ Tokens stored securely in Supabase database
- ✅ Refresh tokens automatically refresh access tokens
- ✅ No passwords stored - only OAuth tokens
- ✅ Can revoke access anytime from Azure Portal
- ✅ Tokens expire automatically

## Next Steps

After connecting:
1. Click **"Refresh"** to fetch emails
2. Review classifications
3. Label incorrect ones to improve accuracy
4. Set up automatic syncing (coming soon)

