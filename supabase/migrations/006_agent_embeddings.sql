-- Agent Embeddings for Semantic Routing
-- Pre-computed embeddings of agent capabilities for instant routing

CREATE TABLE IF NOT EXISTS agent_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT UNIQUE NOT NULL,
  agent_name TEXT NOT NULL,
  capabilities TEXT[] NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small
  model_preference TEXT DEFAULT 'local',
  estimated_cost FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_embeddings_agent_key ON agent_embeddings(agent_key);

-- Enable Row Level Security
ALTER TABLE agent_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow anyone to read agent embeddings" ON agent_embeddings;
CREATE POLICY "Allow anyone to read agent embeddings" ON agent_embeddings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to insert agent embeddings" ON agent_embeddings;
CREATE POLICY "Allow anyone to insert agent embeddings" ON agent_embeddings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anyone to update agent embeddings" ON agent_embeddings;
CREATE POLICY "Allow anyone to update agent embeddings" ON agent_embeddings
  FOR UPDATE USING (true);

-- Semantic routing function using pgvector
CREATE OR REPLACE FUNCTION match_agents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  agent_key TEXT,
  agent_name TEXT,
  capabilities TEXT[],
  model_preference TEXT,
  estimated_cost FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    agent_embeddings.agent_key,
    agent_embeddings.agent_name,
    agent_embeddings.capabilities,
    agent_embeddings.model_preference,
    agent_embeddings.estimated_cost,
    1 - (agent_embeddings.embedding <=> query_embedding) AS similarity
  FROM agent_embeddings
  WHERE 1 - (agent_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY agent_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE agent_embeddings IS 'Pre-computed agent capability embeddings for semantic routing';
COMMENT ON FUNCTION match_agents IS 'Find best matching agents using vector similarity (cosine distance)';

