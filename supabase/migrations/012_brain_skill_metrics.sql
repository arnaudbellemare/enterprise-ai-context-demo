-- Brain Skill Metrics Table
-- Tracks performance metrics for all brain skills

CREATE TABLE IF NOT EXISTS brain_skill_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Skill identification
  skill_name TEXT NOT NULL,
  query_hash TEXT,
  domain TEXT,

  -- Performance metrics
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  cost DECIMAL(10, 6),
  quality_score DECIMAL(5, 4),
  cache_hit BOOLEAN DEFAULT false,

  -- Timestamps
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_brain_skill_metrics_skill_name ON brain_skill_metrics(skill_name);
CREATE INDEX IF NOT EXISTS idx_brain_skill_metrics_activated_at ON brain_skill_metrics(activated_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_skill_metrics_query_hash ON brain_skill_metrics(query_hash);
CREATE INDEX IF NOT EXISTS idx_brain_skill_metrics_domain ON brain_skill_metrics(domain);
CREATE INDEX IF NOT EXISTS idx_brain_skill_metrics_success ON brain_skill_metrics(success);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_brain_skill_metrics_analytics
  ON brain_skill_metrics(skill_name, activated_at DESC, success);

-- Enable Row Level Security (RLS)
ALTER TABLE brain_skill_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON brain_skill_metrics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow read for anonymous users (for public dashboards)
CREATE POLICY "Allow read for anonymous users"
  ON brain_skill_metrics
  FOR SELECT
  TO anon
  USING (true);

-- Function to get skill analytics
CREATE OR REPLACE FUNCTION get_brain_skill_analytics(
  p_skill_name TEXT DEFAULT NULL,
  p_hours_ago INTEGER DEFAULT 24
)
RETURNS TABLE (
  skill_name TEXT,
  total_executions BIGINT,
  success_rate DECIMAL,
  avg_execution_time DECIMAL,
  total_cost DECIMAL,
  avg_quality_score DECIMAL,
  cache_hit_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bsm.skill_name,
    COUNT(*) AS total_executions,
    ROUND(AVG(CASE WHEN bsm.success THEN 1 ELSE 0 END), 4) AS success_rate,
    ROUND(AVG(bsm.execution_time_ms), 2) AS avg_execution_time,
    ROUND(SUM(COALESCE(bsm.cost, 0)), 6) AS total_cost,
    ROUND(AVG(COALESCE(bsm.quality_score, 0)), 4) AS avg_quality_score,
    ROUND(AVG(CASE WHEN bsm.cache_hit THEN 1 ELSE 0 END), 4) AS cache_hit_rate
  FROM brain_skill_metrics bsm
  WHERE
    (p_skill_name IS NULL OR bsm.skill_name = p_skill_name)
    AND bsm.activated_at >= NOW() - (p_hours_ago || ' hours')::INTERVAL
  GROUP BY bsm.skill_name
  ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old metrics
CREATE OR REPLACE FUNCTION cleanup_old_brain_metrics(p_days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM brain_skill_metrics
  WHERE activated_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for quick analytics
CREATE OR REPLACE VIEW brain_skill_metrics_summary AS
SELECT
  skill_name,
  COUNT(*) AS total_executions,
  ROUND(AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100, 2) AS success_rate_pct,
  ROUND(AVG(execution_time_ms), 2) AS avg_execution_time_ms,
  ROUND(SUM(COALESCE(cost, 0)), 6) AS total_cost,
  ROUND(AVG(COALESCE(quality_score, 0)), 4) AS avg_quality_score,
  ROUND(AVG(CASE WHEN cache_hit THEN 1 ELSE 0 END) * 100, 2) AS cache_hit_rate_pct,
  MAX(activated_at) AS last_used_at,
  COUNT(DISTINCT domain) AS domains_count
FROM brain_skill_metrics
WHERE activated_at >= NOW() - INTERVAL '24 hours'
GROUP BY skill_name
ORDER BY total_executions DESC;

COMMENT ON TABLE brain_skill_metrics IS 'Performance metrics for brain skills execution';
COMMENT ON VIEW brain_skill_metrics_summary IS 'Aggregated metrics for brain skills (last 24 hours)';
