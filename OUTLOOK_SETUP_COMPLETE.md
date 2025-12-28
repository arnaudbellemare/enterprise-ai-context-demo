# Outlook Email Connection - Complete Setup

## ✅ Your Supabase Configuration

Your Supabase credentials are already configured:
- **URL**: `https://ofvbywlqztkgugrkibcp.supabase.co`
- **Service Role Key**: ✅ Set
- **Anon Key**: ✅ Set

## ⚠️ Missing: Database Table

The `email_accounts` table needs to be created. This is a one-time setup.

## Quick Setup (2 minutes)

### Step 1: Create the Table

1. **Open Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/ofvbywlqztkgugrkibcp
   - Click **"SQL Editor"** (left sidebar)
   - Click **"New query"**

2. **Copy this SQL** (or use `CREATE_EMAIL_ACCOUNTS_TABLE.sql`):

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

3. **Click "Run"** (or press Cmd+Enter)

You should see: ✅ **Success. No rows returned**

### Step 2: Verify Table Created

Run this query in SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'email_accounts';
```

Should return: `email_accounts`

### Step 3: Restart Dev Server

```bash
# Stop server (Ctrl+C)
cd frontend
npm run dev
```

### Step 4: Connect Outlook

1. Go to: `http://localhost:3000/email-inbox`
2. Click **"Connect Account"**
3. Select **"Outlook (OAuth)"**
4. Click **"Connect Outlook"**
5. Sign in with your Microsoft account
6. Grant permissions

### Step 5: Verify Connection

After connecting, you should see:
- ✅ Your Outlook email in the connected accounts list
- ✅ "Refresh" button to fetch emails
- ✅ No error messages

## Test Database Connection

Visit: `http://localhost:3000/api/email-accounts/check-db`

Expected response:
```json
{
  "success": true,
  "message": "Database is properly configured",
  "tableExists": true,
  "canRead": true,
  "canWrite": true
}
```

## Troubleshooting

### Still Getting "fetch failed" Error?

1. **Check table exists**:
   ```sql
   SELECT COUNT(*) FROM email_accounts;
   ```
   Should return: `0` (empty table is fine)

2. **Check environment variables**:
   ```bash
   # In frontend/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://ofvbywlqztkgugrkibcp.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart dev server** after any changes

4. **Check browser console** for detailed error messages

### "Table does not exist" Error?

- Run the SQL migration again
- Make sure you're in the correct Supabase project
- Check you have permissions to create tables

## What Happens After Connection

1. **OAuth tokens saved** to `email_accounts` table
2. **Account appears** in connected accounts list
3. **Click "Refresh"** to fetch emails
4. **Emails auto-classified** with AI
5. **All emails accessible** in unified inbox

## Next Steps

After connecting:
- ✅ Fetch emails: Click "Refresh" button
- ✅ View emails: Click any email in the list
- ✅ Review classifications: See template and confidence
- ✅ Label incorrect ones: Improves accuracy over time

Your Outlook connection is now ready!

