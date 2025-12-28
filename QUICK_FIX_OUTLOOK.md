# Quick Fix: Outlook Connection

## The Problem
"Failed to save email account: TypeError: fetch failed"

This means the `email_accounts` table doesn't exist in your Supabase database.

## The Solution (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/ofvbywlqztkgugrkibcp
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Run This SQL

Copy and paste this entire SQL script:

```sql
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default',
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'imap')),
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

CREATE OR REPLACE FUNCTION update_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_accounts_updated_at ON email_accounts;
CREATE TRIGGER email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_accounts_updated_at();
```

### Step 3: Click "Run" (or press Cmd+Enter)

You should see: ✅ Success. No rows returned

### Step 4: Restart Your Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 5: Connect Outlook Again

1. Go to: `http://localhost:3000/email-inbox`
2. Click **"Connect Account"**
3. Select **"Outlook (OAuth)"**
4. Click **"Connect Outlook"**
5. Sign in and authorize

## Verify It Worked

After connecting, you should see:
- ✅ Your Outlook email address in the connected accounts list
- ✅ "Refresh" button to fetch emails
- ✅ No error messages

## Test Database Connection

Visit: `http://localhost:3000/api/email-accounts/check-db`

Should return:
```json
{
  "success": true,
  "message": "Database is properly configured"
}
```

## That's It!

Your Outlook account should now connect successfully. The table is created once and will persist all your email connections.

