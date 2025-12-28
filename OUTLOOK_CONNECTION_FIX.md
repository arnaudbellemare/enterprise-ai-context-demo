# Outlook Connection Fix

## Error: "Failed to save email account: TypeError: fetch failed"

This error means Supabase connection is failing. Here's how to fix it:

### Step 1: Verify Database Table Exists

The `email_accounts` table must exist. Run this migration in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this migration:

```sql
-- Email OAuth Token Storage
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default',
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  imap_secure BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,
  last_refresh TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email, provider)
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON email_accounts(is_active);
```

Or use the migration file: `supabase/migrations/017_email_oauth_tokens.sql`

### Step 2: Verify Environment Variables

Check `frontend/.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Test Database Connection

Visit: `http://localhost:3000/api/email-accounts/check-db`

This will tell you:
- ✅ If table exists
- ✅ If you can read/write
- ❌ What's wrong if it fails

### Step 4: Restart Dev Server

After running migration:

```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Try Connecting Again

1. Go to `http://localhost:3000/email-inbox`
2. Click "Connect Account"
3. Select "Outlook (OAuth)"
4. Click "Connect Outlook"

## Common Issues

### "Table does not exist"
- **Fix**: Run migration `017_email_oauth_tokens.sql` in Supabase SQL Editor

### "Cannot connect to Supabase"
- **Fix**: Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- **Fix**: Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- **Fix**: Verify Supabase project is active

### "Unauthorized"
- **Fix**: Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- **Fix**: Check key has service_role permissions

### "fetch failed"
- **Fix**: Check network connectivity
- **Fix**: Verify Supabase URL is accessible
- **Fix**: Check firewall/proxy settings

## Quick Test

Run this to test everything:

```bash
curl http://localhost:3000/api/email-accounts/check-db
```

Should return:
```json
{
  "success": true,
  "message": "Database is properly configured"
}
```

If it fails, the response will tell you exactly what's wrong.

