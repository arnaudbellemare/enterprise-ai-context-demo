-- Cache Metrics History Table
-- Tracks cache performance over time for monitoring and optimization

CREATE TABLE IF NOT EXISTS cache_metrics_history (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cache_size INTEGER NOT NULL,
  max_size INTEGER NOT NULL,
  hit_count INTEGER NOT NULL,
  miss_count INTEGER NOT NULL,
  hit_rate DECIMAL(5, 4) NOT NULL,
  utilization_percent DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_cache_metrics_timestamp ON cache_metrics_history(timestamp DESC);
CREATE INDEX idx_cache_metrics_hit_rate ON cache_metrics_history(hit_rate);
CREATE INDEX idx_cache_metrics_utilization ON cache_metrics_history(utilization_percent);

-- Enable Row Level Security
ALTER TABLE cache_metrics_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read cache metrics"
  ON cache_metrics_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service role to insert
CREATE POLICY "Allow service role to insert cache metrics"
  ON cache_metrics_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Function to clean up old metrics (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_cache_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM cache_metrics_history
  WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$;

-- Create a scheduled job to run cleanup daily
-- Note: This requires pg_cron extension. If not available, run manually:
-- SELECT cron.schedule('cleanup-cache-metrics', '0 0 * * *', 'SELECT cleanup_old_cache_metrics();');

COMMENT ON TABLE cache_metrics_history IS 'Historical cache performance metrics for monitoring and optimization';
COMMENT ON COLUMN cache_metrics_history.hit_rate IS 'Cache hit rate (0.0 to 1.0)';
COMMENT ON COLUMN cache_metrics_history.utilization_percent IS 'Cache utilization percentage (0 to 100)';
