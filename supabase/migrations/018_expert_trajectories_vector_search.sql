-- Add vector embedding column to expert_trajectories for semantic search
-- Enables cosine similarity matching instead of keyword matching

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (1536 dimensions for OpenAI text-embedding-3-small)
ALTER TABLE expert_trajectories 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_expert_trajectories_embedding 
ON expert_trajectories 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_expert_trajectories(
  query_embedding vector(1536),
  query_domain TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  query TEXT,
  domain TEXT,
  steps JSONB,
  final_answer TEXT,
  quality DECIMAL,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.id,
    et.query,
    et.domain,
    et.steps,
    et.final_answer,
    et.quality,
    1 - (et.embedding <=> query_embedding) AS similarity
  FROM expert_trajectories et
  WHERE et.domain = query_domain
    AND et.embedding IS NOT NULL
    AND (1 - (et.embedding <=> query_embedding)) >= match_threshold
  ORDER BY et.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comment for documentation
COMMENT ON FUNCTION match_expert_trajectories IS 'Vector similarity search for expert trajectories using pgvector cosine distance';

