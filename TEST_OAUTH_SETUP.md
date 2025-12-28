# Testing Your OAuth Setup

## Quick Test Checklist

After completing setup (migration + .env.local + server restart), follow these steps:

### Step 1: Test OAuth URL Generation

```bash
node test-outlook-oauth-setup.js
```

**Expected Output:**
```
✅ OAuth URL generated successfully
   URL: https://login.microsoftonline.com/083236bf-8a33-410c-8ebf-d5bc09b53f12...
```

### Step 2: Complete OAuth Flow

1. Open the auth URL in your browser (or go to: `http://localhost:3000/api/email-oauth/outlook?action=auth`)
2. Login with your Microsoft/Outlook account
3. Approve the permissions (Mail.Read, offline_access, etc.)
4. You'll be redirected to: `http://localhost:3000/email-testing?outlook_connected=true&account_id=XXX&email=your@email.com`
5. **Copy the `account_id` from the URL** (the XXX part)

### Step 3: Test Email Fetching

```bash
node test-email-fetch.js <paste-account-id-here>
```

**Expected Output:**
```
✅ Found 1 connected account(s):
   - your@email.com (outlook) [active]

✅ Fetched 5 emails successfully
   Account: your@email.com
   Provider: outlook

   Sample emails:
   1. Your email subject
      From: sender@example.com
      Date: 2025-01-23T...
```

### Step 4: Verify Tokens in Database

Go to Supabase → Table Editor → `email_accounts` and you should see:
- Your email address
- `access_token` (long JWT string)
- `refresh_token` (long JWT string)
- `token_expiry` (timestamp ~1 hour from now)
- `is_active` = true

## What Happens Now?

✅ **Your tokens are saved permanently in Supabase**
✅ **System automatically refreshes tokens 5 minutes before expiry**
✅ **You never need to re-authenticate**

Every time you call `/api/email-fetch`:
1. System checks if token expires within 5 minutes
2. If yes, automatically refreshes using refresh_token
3. Updates database with new access_token and expiry
4. Fetches your emails seamlessly

## Troubleshooting

### "Account not found"
- Make sure you copied the `account_id` correctly from the OAuth callback URL
- Check Supabase `email_accounts` table to see if account was saved

### "Unauthorized" error
- Verify `SUPABASE_SERVICE_ROLE_KEY` in .env.local is correct (starts with `eyJ...`)
- Check Supabase dashboard → Settings → API for the service_role key

### "Failed to refresh token"
- Verify `MICROSOFT_CLIENT_SECRET` is correct
- Ensure `offline_access` permission is granted in Azure
- Check Azure app redirect URI matches: `http://localhost:3000/api/email-oauth/outlook/callback`

### "No refresh token available"
- Re-authenticate with OAuth flow
- Make sure Azure app has `offline_access` in API permissions
- Ensure OAuth URL includes `prompt=consent` (already included in code)

## Manual Testing

### Check if OAuth endpoint works:
```bash
curl http://localhost:3000/api/email-oauth/outlook?action=auth
```

Should return JSON with `authUrl`.

### Check connected accounts:
```bash
curl http://localhost:3000/api/email-connect?userId=default
```

Should return JSON with `accounts` array.

### Fetch emails manually:
```bash
curl -X POST http://localhost:3000/api/email-fetch \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "your-account-id",
    "maxResults": 5,
    "autoClassify": false
  }'
```

Should return JSON with `emails` array.

## Success Criteria

✅ OAuth URL generates successfully
✅ Microsoft login and consent works
✅ Tokens saved to database (visible in Supabase)
✅ Email fetch works with saved tokens
✅ Token refresh happens automatically (test by waiting 55+ minutes and fetching again)
✅ No re-authentication required ever again!

---

**Bottom line**: Authenticate once, works forever with automatic token refresh! 🚀
