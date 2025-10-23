-- WALT Discovered Tools System
-- Migration: 014_walt_discovered_tools.sql
-- Description: Storage and management for WALT-discovered tools with semantic search

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Walt Discovered Tools Table
CREATE TABLE IF NOT EXISTS walt_discovered_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tool identification
  tool_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,

  -- Tool definition (full WALT JSON)
  tool_definition JSONB NOT NULL,

  -- Source information
  source_url TEXT NOT NULL,
  domain TEXT[] NOT NULL,
  discovered_by TEXT DEFAULT 'walt-orchestrator',

  -- Quality metrics
  quality_score FLOAT NOT NULL DEFAULT 0.0 CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
  success_rate FLOAT NOT NULL DEFAULT 0.0 CHECK (success_rate >= 0.0 AND success_rate <= 1.0),
  total_executions INT NOT NULL DEFAULT 0,
  successful_executions INT NOT NULL DEFAULT 0,
  failed_executions INT NOT NULL DEFAULT 0,

  -- Performance metrics
  avg_execution_time_ms FLOAT DEFAULT 0.0,
  min_execution_time_ms FLOAT,
  max_execution_time_ms FLOAT,
  p95_execution_time_ms FLOAT,

  -- Cost tracking
  total_cost FLOAT NOT NULL DEFAULT 0.0,
  avg_cost_per_execution FLOAT DEFAULT 0.0,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  last_successful_at TIMESTAMPTZ,
  last_failed_at TIMESTAMPTZ,
  usage_count INT NOT NULL DEFAULT 0,

  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Semantic search
  embedding vector(1536),  -- OpenAI ada-002 embedding dimension

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Validation
  is_validated BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'failed', 'testing'))
);

-- Indexes for walt_discovered_tools
CREATE INDEX IF NOT EXISTS idx_walt_tools_tool_name ON walt_discovered_tools(tool_name);
CREATE INDEX IF NOT EXISTS idx_walt_tools_domain ON walt_discovered_tools USING GIN(domain);
CREATE INDEX IF NOT EXISTS idx_walt_tools_quality ON walt_discovered_tools(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_walt_tools_success_rate ON walt_discovered_tools(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_walt_tools_usage ON walt_discovered_tools(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_walt_tools_discovered_at ON walt_discovered_tools(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_walt_tools_last_used ON walt_discovered_tools(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_walt_tools_status ON walt_discovered_tools(status);
CREATE INDEX IF NOT EXISTS idx_walt_tools_source_url ON walt_discovered_tools(source_url);

-- Vector similarity search index (using ivfflat)
CREATE INDEX IF NOT EXISTS idx_walt_tools_embedding
  ON walt_discovered_tools
  USING ivfflat(embedding vector_cosine_ops)
  WITH (lists = 100);

-- Tool Execution History Table
CREATE TABLE IF NOT EXISTS walt_tool_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tool reference
  tool_id UUID NOT NULL REFERENCES walt_discovered_tools(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,

  -- Execution details
  parameters JSONB NOT NULL,
  result JSONB,

  -- Performance
  execution_time_ms FLOAT NOT NULL,
  cost FLOAT NOT NULL DEFAULT 0.0,

  -- Status
  success BOOLEAN NOT NULL,
  error TEXT,
  error_type TEXT,

  -- Context
  query TEXT,
  domain TEXT,
  user_id TEXT,
  session_id TEXT,

  -- Timestamp
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for walt_tool_executions
CREATE INDEX IF NOT EXISTS idx_walt_executions_tool_id ON walt_tool_executions(tool_id);
CREATE INDEX IF NOT EXISTS idx_walt_executions_tool_name ON walt_tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_walt_executions_executed_at ON walt_tool_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_walt_executions_success ON walt_tool_executions(success);
CREATE INDEX IF NOT EXISTS idx_walt_executions_domain ON walt_tool_executions(domain);
CREATE INDEX IF NOT EXISTS idx_walt_executions_session ON walt_tool_executions(session_id);

-- Tool Usage Patterns Table (for ACE learning)
CREATE TABLE IF NOT EXISTS walt_tool_usage_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tool reference
  tool_id UUID NOT NULL REFERENCES walt_discovered_tools(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,

  -- Pattern details
  pattern_type TEXT NOT NULL, -- 'success', 'failure', 'optimization'
  pattern_description TEXT NOT NULL,

  -- Context
  query_pattern TEXT,
  domain TEXT,
  parameters_pattern JSONB,

  -- Learning
  confidence FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  evidence_count INT NOT NULL DEFAULT 1,

  -- ACE integration
  ace_playbook_bullet_id UUID, -- Reference to ace_playbook_bullets if exists

  -- Timestamps
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for walt_tool_usage_patterns
CREATE INDEX IF NOT EXISTS idx_walt_patterns_tool_id ON walt_tool_usage_patterns(tool_id);
CREATE INDEX IF NOT EXISTS idx_walt_patterns_type ON walt_tool_usage_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_walt_patterns_domain ON walt_tool_usage_patterns(domain);
CREATE INDEX IF NOT EXISTS idx_walt_patterns_confidence ON walt_tool_usage_patterns(confidence DESC);

-- Update ace_playbook_bullets to support WALT tools (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ace_playbook_bullets') THEN
    -- Add walt_tool_name column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ace_playbook_bullets'
      AND column_name = 'walt_tool_name'
    ) THEN
      ALTER TABLE ace_playbook_bullets ADD COLUMN walt_tool_name TEXT;
      CREATE INDEX IF NOT EXISTS idx_ace_bullets_walt ON ace_playbook_bullets(walt_tool_name);
    END IF;
  END IF;
END $$;

-- Function to update tool metrics
CREATE OR REPLACE FUNCTION update_walt_tool_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE walt_discovered_tools
  SET
    total_executions = total_executions + 1,
    successful_executions = CASE WHEN NEW.success THEN successful_executions + 1 ELSE successful_executions END,
    failed_executions = CASE WHEN NOT NEW.success THEN failed_executions + 1 ELSE failed_executions END,
    success_rate = CASE
      WHEN total_executions + 1 > 0
      THEN (successful_executions + CASE WHEN NEW.success THEN 1 ELSE 0 END)::FLOAT / (total_executions + 1)
      ELSE 0.0
    END,
    avg_execution_time_ms = (
      (avg_execution_time_ms * total_executions + NEW.execution_time_ms) / (total_executions + 1)
    ),
    min_execution_time_ms = LEAST(COALESCE(min_execution_time_ms, NEW.execution_time_ms), NEW.execution_time_ms),
    max_execution_time_ms = GREATEST(COALESCE(max_execution_time_ms, NEW.execution_time_ms), NEW.execution_time_ms),
    total_cost = total_cost + NEW.cost,
    avg_cost_per_execution = (total_cost + NEW.cost) / (total_executions + 1),
    last_used_at = NEW.executed_at,
    last_successful_at = CASE WHEN NEW.success THEN NEW.executed_at ELSE last_successful_at END,
    last_failed_at = CASE WHEN NOT NEW.success THEN NEW.executed_at ELSE last_failed_at END,
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = NEW.tool_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics on execution
DROP TRIGGER IF EXISTS walt_tool_execution_metrics_trigger ON walt_tool_executions;
CREATE TRIGGER walt_tool_execution_metrics_trigger
  AFTER INSERT ON walt_tool_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_walt_tool_metrics();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_walt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS walt_tools_updated_at_trigger ON walt_discovered_tools;
CREATE TRIGGER walt_tools_updated_at_trigger
  BEFORE UPDATE ON walt_discovered_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_walt_updated_at();

-- Function for semantic tool search
CREATE OR REPLACE FUNCTION search_walt_tools_by_embedding(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_domain TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tool_name TEXT,
  display_name TEXT,
  source_url TEXT,
  domain TEXT[],
  quality_score FLOAT,
  success_rate FLOAT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.tool_name,
    t.display_name,
    t.source_url,
    t.domain,
    t.quality_score,
    t.success_rate,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM walt_discovered_tools t
  WHERE
    t.status = 'active'
    AND t.embedding IS NOT NULL
    AND (1 - (t.embedding <=> query_embedding)) >= match_threshold
    AND (filter_domain IS NULL OR t.domain && filter_domain)
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get tool recommendations
CREATE OR REPLACE FUNCTION get_walt_tool_recommendations(
  p_domain TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  tool_name TEXT,
  display_name TEXT,
  quality_score FLOAT,
  success_rate FLOAT,
  usage_count INT,
  recommendation_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.tool_name,
    t.display_name,
    t.quality_score,
    t.success_rate,
    t.usage_count,
    -- Recommendation score: weighted combination of quality, success rate, and usage
    (t.quality_score * 0.4 + t.success_rate * 0.4 +
     LEAST(t.usage_count / 100.0, 1.0) * 0.2) AS recommendation_score
  FROM walt_discovered_tools t
  WHERE
    t.status = 'active'
    AND p_domain = ANY(t.domain)
  ORDER BY recommendation_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old execution history
CREATE OR REPLACE FUNCTION cleanup_old_walt_executions(
  retention_days INT DEFAULT 30
)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM walt_tool_executions
  WHERE executed_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE walt_discovered_tools IS 'Storage for WALT-discovered tools with quality metrics and semantic search';
COMMENT ON TABLE walt_tool_executions IS 'Execution history for WALT tools with performance tracking';
COMMENT ON TABLE walt_tool_usage_patterns IS 'Learned usage patterns for ACE framework integration';
COMMENT ON FUNCTION search_walt_tools_by_embedding IS 'Semantic search for tools using embedding similarity';
COMMENT ON FUNCTION get_walt_tool_recommendations IS 'Get recommended tools for a domain based on quality and usage';
COMMENT ON FUNCTION cleanup_old_walt_executions IS 'Clean up old execution history beyond retention period';

-- Grant permissions (adjust as needed for your setup)
-- These are examples - modify based on your security requirements
-- GRANT SELECT, INSERT, UPDATE ON walt_discovered_tools TO authenticated;
-- GRANT SELECT ON walt_tool_executions TO authenticated;
-- GRANT SELECT ON walt_tool_usage_patterns TO authenticated;
