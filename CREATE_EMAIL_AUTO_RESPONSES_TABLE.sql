-- Create table for storing auto-generated email responses
CREATE TABLE IF NOT EXISTS email_auto_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  email_id TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT,
  classification TEXT NOT NULL,
  template_id TEXT NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL,
  generated_subject TEXT NOT NULL,
  generated_body TEXT NOT NULL,
  requires_human_review BOOLEAN DEFAULT false,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  user_feedback TEXT, -- 'helpful', 'not_helpful', 'needs_revision'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_auto_responses_account_id ON email_auto_responses(account_id);
CREATE INDEX IF NOT EXISTS idx_email_auto_responses_email_hash ON email_auto_responses(email_hash);
CREATE INDEX IF NOT EXISTS idx_email_auto_responses_created_at ON email_auto_responses(created_at DESC);

-- Create table for learning insights
CREATE TABLE IF NOT EXISTS email_learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  pattern TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL,
  response_quality TEXT, -- 'good', 'needs_improvement', 'poor'
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for pattern analysis
CREATE INDEX IF NOT EXISTS idx_email_learning_insights_pattern ON email_learning_insights(pattern);
CREATE INDEX IF NOT EXISTS idx_email_learning_insights_template ON email_learning_insights(template_id);

