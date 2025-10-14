-- PERMUTATION Complete Database Schema
-- All tables for full system integration

-- ============================================
-- 1. ACE PLAYBOOK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ace_playbook (
  id BIGSERIAL PRIMARY KEY,
  bullet_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  harmful_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  sections JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ace_playbook_bullet_id ON ace_playbook(bullet_id);
CREATE INDEX IF NOT EXISTS idx_ace_playbook_helpful ON ace_playbook(helpful_count DESC);
CREATE INDEX IF NOT EXISTS idx_ace_playbook_tags ON ace_playbook USING GIN(tags);

-- ============================================
-- 2. REASONING BANK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reasoning_bank (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  domain TEXT NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  embedding VECTOR(1536), -- For similarity search
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_reasoning_bank_embedding ON reasoning_bank 
USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_reasoning_bank_domain ON reasoning_bank(domain);
CREATE INDEX IF NOT EXISTS idx_reasoning_bank_success ON reasoning_bank(success_count DESC);

-- ============================================
-- 3. FINANCIAL DATA TABLE (for SQL queries)
-- ============================================
CREATE TABLE IF NOT EXISTS financial_data (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  symbol TEXT NOT NULL,
  price DECIMAL(10, 2),
  volume BIGINT,
  market_cap DECIMAL(15, 2),
  change_percent DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_data_symbol ON financial_data(symbol);
CREATE INDEX IF NOT EXISTS idx_financial_data_date ON financial_data(date DESC);

-- ============================================
-- 4. REAL ESTATE DATA TABLE (for SQL queries)
-- ============================================
CREATE TABLE IF NOT EXISTS real_estate (
  id BIGSERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  price DECIMAL(12, 2),
  sqft INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  year_built INTEGER,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_real_estate_price ON real_estate(price);
CREATE INDEX IF NOT EXISTS idx_real_estate_city ON real_estate(city);

-- ============================================
-- 5. EXECUTION HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS execution_history (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  domain TEXT,
  components_used TEXT[],
  duration_ms INTEGER,
  cost_usd DECIMAL(8, 4),
  quality_score DECIMAL(3, 2),
  irt_difficulty DECIMAL(3, 2),
  teacher_calls INTEGER DEFAULT 0,
  student_calls INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_history_domain ON execution_history(domain);
CREATE INDEX IF NOT EXISTS idx_execution_history_created ON execution_history(created_at DESC);

-- ============================================
-- 6. SAFE SQL EXECUTION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION execute_safe_sql(
  sql_query TEXT,
  query_domain TEXT DEFAULT 'general'
)
RETURNS SETOF JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow SELECT queries
  IF UPPER(TRIM(sql_query)) NOT LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Execute the query and return results as JSON
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- ============================================
-- 7. INSERT SAMPLE DATA
-- ============================================

-- Sample financial data
INSERT INTO financial_data (date, symbol, price, volume, market_cap, change_percent)
VALUES
  (CURRENT_DATE, 'SPY', 450.25, 75000000, 400000000000, 2.1),
  (CURRENT_DATE, 'QQQ', 385.50, 45000000, 180000000000, 1.8),
  (CURRENT_DATE, 'BTC', 67000.00, 25000000000, 1300000000000, 3.5),
  (CURRENT_DATE, 'ETH', 3200.00, 15000000000, 380000000000, 2.8),
  (CURRENT_DATE - 1, 'SPY', 441.00, 72000000, 392000000000, -0.5),
  (CURRENT_DATE - 1, 'QQQ', 378.75, 43000000, 176000000000, 0.3)
ON CONFLICT DO NOTHING;

-- Sample real estate data
INSERT INTO real_estate (address, price, sqft, bedrooms, bathrooms, year_built, city, state, zip_code)
VALUES
  ('123 Main St', 450000, 2000, 3, 2.5, 2010, 'San Francisco', 'CA', '94102'),
  ('456 Oak Ave', 625000, 2800, 4, 3.0, 2015, 'San Francisco', 'CA', '94103'),
  ('789 Pine Rd', 385000, 1800, 3, 2.0, 2008, 'Oakland', 'CA', '94601'),
  ('321 Elm St', 550000, 2200, 3, 2.5, 2012, 'Berkeley', 'CA', '94704'),
  ('654 Maple Dr', 725000, 3200, 4, 3.5, 2018, 'Palo Alto', 'CA', '94301')
ON CONFLICT DO NOTHING;

-- Sample ACE playbook bullets
INSERT INTO ace_playbook (bullet_id, content, helpful_count, harmful_count, tags)
VALUES
  ('ace-001', 'Always verify information from multiple sources before making claims', 5, 0, ARRAY['verification', 'accuracy']),
  ('ace-002', 'Break down complex queries into smaller, manageable sub-questions', 8, 1, ARRAY['reasoning', 'decomposition']),
  ('ace-003', 'Use domain-specific terminology when available for better accuracy', 6, 0, ARRAY['domain_knowledge', 'terminology']),
  ('ace-004', 'Check for recent news or updates when answering time-sensitive queries', 7, 0, ARRAY['real_time', 'news']),
  ('ace-005', 'Consider multiple perspectives when analyzing controversial topics', 4, 0, ARRAY['analysis', 'perspective'])
ON CONFLICT (bullet_id) DO NOTHING;

-- Sample ReasoningBank memories
INSERT INTO reasoning_bank (content, domain, success_count, failure_count)
VALUES
  ('Multi-source validation works best for financial predictions', 'financial', 15, 2),
  ('Users appreciate step-by-step breakdowns for complex calculations', 'general', 20, 1),
  ('Include confidence metrics for transparency in predictions', 'general', 18, 0),
  ('Always check multiple exchanges for crypto price validation', 'crypto', 12, 1),
  ('Real estate queries benefit from local market context', 'real_estate', 10, 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY (Optional)
-- ============================================
ALTER TABLE ace_playbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust based on your security needs)
CREATE POLICY IF NOT EXISTS "Allow public read" ON ace_playbook
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read" ON reasoning_bank
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read" ON financial_data
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read" ON real_estate
  FOR SELECT USING (true);

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON ace_playbook TO authenticated;
GRANT INSERT, UPDATE ON reasoning_bank TO authenticated;
GRANT INSERT ON execution_history TO authenticated;

-- Done!
SELECT 'PERMUTATION database schema created successfully!' AS message;

