-- Email OAuth Token Storage
-- Stores OAuth tokens securely with automatic refresh

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default',
  provider TEXT NOT NULL, -- 'gmail', 'outlook', 'imap'
  email TEXT NOT NULL,

  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,

  -- IMAP credentials (for IMAP provider)
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  imap_secure BOOLEAN DEFAULT true,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,
  last_refresh TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per user
  UNIQUE(user_id, email, provider)
);

-- Index for fast lookups
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_email ON email_accounts(email);
CREATE INDEX idx_email_accounts_active ON email_accounts(is_active);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_accounts_updated_at();

-- Comments
COMMENT ON TABLE email_accounts IS 'Stores email account OAuth tokens and credentials';
COMMENT ON COLUMN email_accounts.access_token IS 'OAuth access token (encrypt in production)';
COMMENT ON COLUMN email_accounts.refresh_token IS 'OAuth refresh token (encrypt in production)';
COMMENT ON COLUMN email_accounts.token_expiry IS 'When the access token expires';
