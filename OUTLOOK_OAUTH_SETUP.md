# Outlook OAuth Configuration - Persistent Setup

This document ensures your Outlook email connection works reliably every time.

## ✅ Configured Credentials

These are saved in `frontend/.env.local`:

```env
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_TENANT_ID=your_tenant_id_here
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/email-oauth/outlook/callback
```

## 🔧 Azure Portal Configuration

### Required Settings:

1. **Redirect URI** (Must match exactly):
   - Platform: Web
   - URI: `http://localhost:3000/api/email-oauth/outlook/callback`

2. **API Permissions** (Must be granted):
   - `Mail.Read` - Read mail
   - `Mail.Send` - Send mail
   - `User.Read` - Read user profile
   - `offline_access` - Refresh tokens (CRITICAL)

3. **Client Secret**:
   - Create a new secret in Azure Portal
   - Copy the secret value to `MICROSOFT_CLIENT_SECRET` in `.env.local`
   - Ensure it's active and not expired

## 🔄 How It Works

1. **OAuth Flow** (`/api/email-oauth/outlook`):
   - Requests `offline_access` scope to get refresh tokens
   - Uses `prompt=consent` to force consent screen
   - Uses `access_type=offline` to request refresh token

2. **Token Storage** (`/api/email-oauth/outlook/callback`):
   - Saves access token and refresh token to Supabase
   - Stores token expiry time
   - Logs if refresh token is missing (shouldn't happen)

3. **Automatic Token Refresh** (`/lib/email-token-manager.ts`):
   - Checks token expiry before each API call
   - Automatically refreshes if token expires within 5 minutes
   - Updates database with new token

4. **Email Fetching** (`/api/email-accounts/fetch`):
   - Uses `getValidAccessToken()` which auto-refreshes
   - Handles errors gracefully with helpful messages

## 📝 Code Locations

- **OAuth Initiation**: `frontend/app/api/email-oauth/outlook/route.ts`
- **OAuth Callback**: `frontend/app/api/email-oauth/outlook/callback/route.ts`
- **Token Management**: `frontend/lib/email-token-manager.ts`
- **Email Fetching**: `frontend/app/api/email-accounts/fetch/route.ts`
- **Email Connector**: `frontend/lib/email-connector.ts`

## ✅ Verification Checklist

After connecting, verify:

1. ✅ Account appears in `/email-inbox`
2. ✅ Debug page (`/email-debug`) shows:
   - Has Refresh Token: Yes
   - Token Valid Test: Success
   - Microsoft Graph API Test: 200 OK
3. ✅ Can fetch emails without errors
4. ✅ Server logs show refresh token received

## 🔍 Troubleshooting

### "No refresh token received"
- Check Azure Portal → API Permissions → Ensure `offline_access` is granted
- Verify OAuth URL includes `prompt=consent` and `access_type=offline`
- Check server logs for token response

### "Unauthorized" when fetching emails
- Check token expiry in debug page
- Verify refresh token exists
- Check server logs for token refresh errors

### "Invalid client secret"
- Verify secret in `.env.local` matches Azure Portal
- Check if secret expired (create new one if needed)
- Restart server after updating `.env.local`

## 🚀 Next Steps

1. **Production**: Update redirect URI to production URL
2. **Security**: Move secrets to environment variables (not hardcoded)
3. **Monitoring**: Add logging for token refresh events
4. **Error Handling**: Set up alerts for failed token refreshes

## 📌 Important Notes

- **Refresh tokens don't expire** (unless revoked)
- **Access tokens expire in ~1 hour** (auto-refreshed)
- **Reconnection only needed if**:
  - Refresh token is revoked
  - Azure app registration changes
  - User revokes permissions

---

**Last Updated**: 2025-12-27
**Status**: ✅ Working and Persistent

