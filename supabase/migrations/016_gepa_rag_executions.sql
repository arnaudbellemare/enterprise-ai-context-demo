-- GEPA RAG Execution Logging Table
--
-- Tracks all GEPA RAG pipeline executions for monitoring and analysis.

CREATE TABLE gepa_rag_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  answer text NOT NULL,

  -- Performance metrics
  latency integer NOT NULL,  -- milliseconds
  cost decimal(10, 6) NOT NULL,  -- dollars

  -- Quality metrics
  confidence decimal(4, 3),
  faithful boolean,
  consistent boolean,
  complete boolean,

  -- Retrieval metrics
  num_docs integer,
  num_reformulations integer,
  context_length integer,
  answer_length integer,

  -- Delta Rule state
  topic_shift decimal(4, 3),
  alpha_value decimal(4, 3),
  beta_value decimal(4, 3),

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  -- Indexes
  INDEX idx_gepa_rag_executions_created_at ON gepa_rag_executions (created_at DESC),
  INDEX idx_gepa_rag_executions_latency ON gepa_rag_executions (latency),
  INDEX idx_gepa_rag_executions_confidence ON gepa_rag_executions (confidence DESC)
);

-- Enable RLS
ALTER TABLE gepa_rag_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for service role
CREATE POLICY "Allow all for service role" ON gepa_rag_executions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function: Get execution statistics
CREATE OR REPLACE FUNCTION get_gepa_rag_stats(
  time_window_hours integer DEFAULT 24
)
RETURNS TABLE (
  total_executions bigint,
  avg_latency numeric,
  avg_cost numeric,
  avg_confidence numeric,
  faithful_rate numeric,
  avg_topic_shift numeric,
  p50_latency numeric,
  p95_latency numeric,
  p99_latency numeric
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_executions,
    ROUND(AVG(latency), 2) as avg_latency,
    ROUND(AVG(cost), 6) as avg_cost,
    ROUND(AVG(confidence), 3) as avg_confidence,
    ROUND(AVG(CASE WHEN faithful THEN 1.0 ELSE 0.0 END), 3) as faithful_rate,
    ROUND(AVG(topic_shift), 3) as avg_topic_shift,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency) as p50_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency) as p95_latency,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency) as p99_latency
  FROM gepa_rag_executions
  WHERE created_at > now() - (time_window_hours || ' hours')::interval;
END;
$$ LANGUAGE plpgsql;

-- Function: Get top queries by latency
CREATE OR REPLACE FUNCTION get_slow_queries(
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  query text,
  latency integer,
  confidence decimal,
  created_at timestamptz
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.query,
    e.latency,
    e.confidence,
    e.created_at
  FROM gepa_rag_executions e
  ORDER BY e.latency DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get low confidence queries
CREATE OR REPLACE FUNCTION get_low_confidence_queries(
  threshold decimal DEFAULT 0.7,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  query text,
  confidence decimal,
  faithful boolean,
  latency integer,
  created_at timestamptz
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.query,
    e.confidence,
    e.faithful,
    e.latency,
    e.created_at
  FROM gepa_rag_executions e
  WHERE e.confidence < threshold
  ORDER BY e.confidence ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Indexes for common queries
CREATE INDEX idx_gepa_rag_low_confidence
  ON gepa_rag_executions (confidence)
  WHERE confidence < 0.7;

CREATE INDEX idx_gepa_rag_unfaithful
  ON gepa_rag_executions (faithful)
  WHERE faithful = false;

COMMENT ON TABLE gepa_rag_executions IS 'Logs all GEPA RAG pipeline executions for monitoring and analysis';
COMMENT ON FUNCTION get_gepa_rag_stats IS 'Returns aggregate statistics for GEPA RAG executions within a time window';
COMMENT ON FUNCTION get_slow_queries IS 'Returns the slowest queries by latency';
COMMENT ON FUNCTION get_low_confidence_queries IS 'Returns queries with low confidence scores';
