-- Tool Primitives Repository (Alita-G Inspired)
-- Migration: 019_tool_primitives_alita_g.sql
-- Description: Domain-specific tool repositories with retrieval-augmented selection
-- Based on: Alita-G paper (https://arxiv.org/pdf/2510.23601)

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Tool Primitives Table (Alita-G MCP Box equivalent)
CREATE TABLE IF NOT EXISTS tool_primitives (
  id TEXT PRIMARY KEY,
  
  -- Tool identification
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Tool definition
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  use_cases TEXT[] NOT NULL DEFAULT '{}',
  tool_type TEXT NOT NULL DEFAULT 'function' CHECK (tool_type IN ('api', 'function', 'composite', 'mcp')),
  abstraction_level TEXT NOT NULL DEFAULT 'parameterized' CHECK (abstraction_level IN ('concrete', 'parameterized', 'primitive')),
  invocation_pattern TEXT, -- How tool was used in trajectory
  
  -- Domain specialization
  domain TEXT NOT NULL,
  
  -- Success metrics (Alita-G tracks tool effectiveness)
  success_rate FLOAT NOT NULL DEFAULT 0.0 CHECK (success_rate >= 0.0 AND success_rate <= 1.0),
  usage_count INT NOT NULL DEFAULT 0,
  
  -- Relationships (tool evolution tracking)
  derived_from TEXT[] DEFAULT '{}',
  evolved_into TEXT[] DEFAULT '{}',
  
  -- Embedding for retrieval-augmented selection (Alita-G style)
  embedding vector(384), -- Local embeddings (Xenova/all-MiniLM-L6-v2) - 100% local, $0 cost
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for tool_primitives
CREATE INDEX IF NOT EXISTS idx_tool_primitives_name ON tool_primitives(name);
CREATE INDEX IF NOT EXISTS idx_tool_primitives_domain ON tool_primitives(domain);
CREATE INDEX IF NOT EXISTS idx_tool_primitives_success_rate ON tool_primitives(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_tool_primitives_usage_count ON tool_primitives(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tool_primitives_abstraction_level ON tool_primitives(abstraction_level);
CREATE INDEX IF NOT EXISTS idx_tool_primitives_tool_type ON tool_primitives(tool_type);
CREATE INDEX IF NOT EXISTS idx_tool_primitives_created_at ON tool_primitives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_primitives_last_used ON tool_primitives(last_used DESC);

-- Composite index for domain + success rate (common query pattern)
CREATE INDEX IF NOT EXISTS idx_tool_primitives_domain_success 
  ON tool_primitives(domain, success_rate DESC);

-- Vector similarity search index (Alita-G retrieval-augmented selection)
CREATE INDEX IF NOT EXISTS idx_tool_primitives_embedding
  ON tool_primitives
  USING ivfflat(embedding vector_cosine_ops)
  WITH (lists = 100);

-- Tool Execution History (track tool usage in trajectories)
CREATE TABLE IF NOT EXISTS tool_execution_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tool reference
  tool_id TEXT NOT NULL REFERENCES tool_primitives(id) ON DELETE CASCADE,
  
  -- Execution context (from trajectory)
  experience_id TEXT, -- Reference to reasoning_experiences if exists
  task_id TEXT,
  query TEXT,
  domain TEXT,
  
  -- Execution details
  parameters_used JSONB NOT NULL,
  result JSONB,
  success BOOLEAN NOT NULL,
  
  -- Performance
  execution_time_ms FLOAT,
  cost FLOAT DEFAULT 0.0,
  
  -- Timestamp
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for tool_execution_history
CREATE INDEX IF NOT EXISTS idx_tool_exec_history_tool_id ON tool_execution_history(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_exec_history_experience_id ON tool_execution_history(experience_id);
CREATE INDEX IF NOT EXISTS idx_tool_exec_history_domain ON tool_execution_history(domain);
CREATE INDEX IF NOT EXISTS idx_tool_exec_history_executed_at ON tool_execution_history(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_exec_history_success ON tool_execution_history(success);

-- Function: Find similar tools (Alita-G retrieval-augmented selection)
CREATE OR REPLACE FUNCTION find_similar_tools(
  query_embedding vector(384), -- Local embeddings (Xenova/all-MiniLM-L6-v2)
  target_domain TEXT DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  parameters JSONB,
  use_cases TEXT[],
  tool_type TEXT,
  abstraction_level TEXT,
  domain TEXT,
  success_rate FLOAT,
  usage_count INT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.id,
    tp.name,
    tp.description,
    tp.parameters,
    tp.use_cases,
    tp.tool_type,
    tp.abstraction_level,
    tp.domain,
    tp.success_rate,
    tp.usage_count,
    1 - (tp.embedding <=> query_embedding) AS similarity
  FROM tool_primitives tp
  WHERE
    tp.embedding IS NOT NULL
    AND (target_domain IS NULL OR tp.domain = target_domain)
    AND (1 - (tp.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY
    similarity DESC,
    tp.success_rate DESC,
    tp.usage_count DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Update tool metrics after execution
CREATE OR REPLACE FUNCTION update_tool_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tool_primitives
  SET
    usage_count = usage_count + 1,
    success_rate = CASE
      WHEN usage_count + 1 > 0
      THEN ((success_rate * usage_count + CASE WHEN NEW.success THEN 1 ELSE 0 END)::FLOAT / (usage_count + 1))
      ELSE CASE WHEN NEW.success THEN 1.0 ELSE 0.0 END
    END,
    last_used = NEW.executed_at,
    updated_at = NOW()
  WHERE id = NEW.tool_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tool metrics on execution
CREATE TRIGGER trigger_update_tool_metrics
  AFTER INSERT ON tool_execution_history
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_metrics();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tool_primitives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER trigger_update_tool_primitives_updated_at
  BEFORE UPDATE ON tool_primitives
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_primitives_updated_at();

-- Function: Consolidate similar tools (Alita-G tool merging)
CREATE OR REPLACE FUNCTION consolidate_similar_tools(
  tool_id_1 TEXT,
  tool_id_2 TEXT
)
RETURNS TEXT AS $$
DECLARE
  merged_id TEXT;
BEGIN
  -- Merge tool_id_2 into tool_id_1
  UPDATE tool_primitives
  SET
    success_rate = (
      (SELECT success_rate FROM tool_primitives WHERE id = tool_id_1) * 
      (SELECT usage_count FROM tool_primitives WHERE id = tool_id_1) +
      (SELECT success_rate FROM tool_primitives WHERE id = tool_id_2) * 
      (SELECT usage_count FROM tool_primitives WHERE id = tool_id_2)
    ) / (
      (SELECT usage_count FROM tool_primitives WHERE id = tool_id_1) +
      (SELECT usage_count FROM tool_primitives WHERE id = tool_id_2)
    ),
    usage_count = (
      (SELECT usage_count FROM tool_primitives WHERE id = tool_id_1) +
      (SELECT usage_count FROM tool_primitives WHERE id = tool_id_2)
    ),
    use_cases = (
      SELECT ARRAY(
        SELECT DISTINCT unnest(
          (SELECT use_cases FROM tool_primitives WHERE id = tool_id_1) ||
          (SELECT use_cases FROM tool_primitives WHERE id = tool_id_2)
        )
      )
    ),
    evolved_into = ARRAY[tool_id_2] || COALESCE(evolved_into, '{}'),
    updated_at = NOW()
  WHERE id = tool_id_1;
  
  -- Mark tool_id_2 as merged
  UPDATE tool_primitives
  SET
    derived_from = ARRAY[tool_id_1] || COALESCE(derived_from, '{}'),
    updated_at = NOW()
  WHERE id = tool_id_2;
  
  RETURN tool_id_1;
END;
$$ LANGUAGE plpgsql;

