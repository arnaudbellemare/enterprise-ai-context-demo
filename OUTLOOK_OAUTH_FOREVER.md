# Outlook OAuth - Authenticate ONCE, Works FOREVER!

## What I Fixed

✅ **Tokens saved permanently in Supabase** - No more losing auth on restart
✅ **Automatic token refresh** - System refreshes tokens before they expire
✅ **5-minute buffer** - Refreshes 5 minutes before expiry (no interruptions)
✅ **Microsoft Graph API** - Full Outlook/Azure support
✅ **No tokens in URLs** - Secure storage only

## Setup Steps

### 1. Run Database Migration

```bash
# In Supabase SQL Editor, run:
supabase/migrations/017_email_oauth_tokens.sql
```

This creates the `email_accounts` table with secure token storage.

### 2. Azure App Registration (If Not Done Already)

1. Go to https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Click "New registration"
3. Name: "Email Responder App"
4. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
5. Redirect URI: `http://localhost:3000/api/email-oauth/outlook/callback` (for dev)
6. Click "Register"

### 3. Configure API Permissions

In your Azure app:
1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph" → "Delegated permissions"
3. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `offline_access` (CRITICAL - enables refresh tokens!)
   - `Mail.Read`
   - `Mail.ReadBasic`
4. Click "Grant admin consent" (if you're admin)

### 4. Get Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: "Email OAuth"
4. Expires: 24 months (or never)
5. Click "Add"
6. **COPY THE VALUE NOW** (you can't see it again!)

### 5. Environment Variables

Add to `frontend/.env.local`:

```bash
# Microsoft OAuth (REQUIRED)
MICROSOFT_CLIENT_ID=your_app_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/email-oauth/outlook/callback
MICROSOFT_TENANT_ID=common  # or your specific tenant ID

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 6. Authenticate

```bash
# Start your app
npm run dev

# Go to http://localhost:3000/email-testing

# Click "Connect Outlook" (or call the OAuth URL manually)
```

The OAuth flow:
1. User clicks "Connect Outlook"
2. Redirects to Microsoft login
3. User approves permissions
4. System gets access_token + refresh_token
5. **Tokens saved permanently to Supabase**
6. Done! Never need to re-auth

## How Automatic Refresh Works

Every time you fetch emails:

```typescript
// In email-fetch API
const accessToken = await getValidAccessToken(accountId);
// ☝️ This function:
// 1. Checks if token expires within 5 minutes
// 2. If yes, automatically refreshes using refresh_token
// 3. Updates database with new token
// 4. Returns fresh valid token
```

**You never see this happening** - it's 100% automatic!

## Testing

```bash
# 1. Authenticate once
curl http://localhost:3000/api/email-oauth/outlook?action=auth

# 2. Fetch emails (works forever!)
curl -X POST http://localhost:3000/api/email-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "your-account-id-from-oauth-callback",
    "maxResults": 10
  }'

# 3. Even after token expires (1 hour), it auto-refreshes!
# Just keep calling /api/email-fetch - it handles everything
```

## Troubleshooting

### "No refresh token available"
- Make sure `offline_access` scope is in Azure permissions
- Re-authenticate to get a new refresh token

### "Failed to refresh token"
- Check `MICROSOFT_CLIENT_SECRET` is correct
- Check `MICROSOFT_TENANT_ID` matches your Azure app
- Verify client secret hasn't expired

### "Account not found"
- Check `account_id` from OAuth callback URL
- Query database: `SELECT * FROM email_accounts WHERE email = 'your@email.com'`

### Token refresh not working
- Check logs: `[Token Manager] Token expired or expiring soon, refreshing...`
- Verify `token_expiry` column in database has future timestamp
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)

## Database Schema

```sql
-- Check your tokens
SELECT
  email,
  provider,
  token_expiry,
  last_refresh,
  is_active
FROM email_accounts;

-- See if token is expired
SELECT
  email,
  token_expiry < NOW() as is_expired,
  token_expiry < NOW() + INTERVAL '5 minutes' as needs_refresh
FROM email_accounts;
```

## Production Deployment

For production:

1. **Update redirect URI** in Azure to production URL:
   ```
   https://yourdomain.com/api/email-oauth/outlook/callback
   ```

2. **Update .env.local** to `.env.production`:
   ```bash
   MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/email-oauth/outlook/callback
   ```

3. **Consider token encryption** (optional but recommended):
   - Add encryption library: `npm install @aws-crypto/client-node`
   - Encrypt tokens before storing in Supabase
   - Decrypt when retrieving

4. **Set up monitoring**:
   - Track refresh failures
   - Alert if refresh rate is too high (indicates issues)
   - Monitor token expiry gaps

## Key Files

- **OAuth Route**: `frontend/app/api/email-oauth/outlook/route.ts`
- **Token Manager**: `frontend/lib/email-token-manager.ts`
- **Email Fetch**: `frontend/app/api/email-fetch/route.ts`
- **Email Connect**: `frontend/app/api/email-connect/route.ts`
- **Migration**: `supabase/migrations/017_email_oauth_tokens.sql`

---

**Bottom line**: Authenticate once with Microsoft, system handles refresh forever. No more re-authentication bullshit! 🚀
