-- Migration: Vector Search Infrastructure
-- Purpose: Add vector search capabilities for GEPA RAG pipeline
-- Components: documents table, match_documents function, indexes

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table for vector storage
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS documents_metadata_idx
  ON documents
  USING gin (metadata);

CREATE INDEX IF NOT EXISTS documents_content_fts_idx
  ON documents
  USING gin (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS documents_created_at_idx
  ON documents (created_at DESC);

-- Create match_documents function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM documents d
  WHERE
    -- Apply metadata filters if provided
    (filter = '{}'::jsonb OR d.metadata @> filter)
    -- Ensure embedding exists
    AND d.embedding IS NOT NULL
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create helper function for hybrid search scoring
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  semantic_weight float DEFAULT 0.7,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float,
  rank int
)
LANGUAGE plpgsql
AS $$
DECLARE
  rrf_k constant int := 60;
BEGIN
  RETURN QUERY
  WITH semantic_search AS (
    SELECT
      d.id,
      d.content,
      d.metadata,
      1 - (d.embedding <=> query_embedding) as sim,
      ROW_NUMBER() OVER (ORDER BY d.embedding <=> query_embedding) as rank
    FROM documents d
    WHERE
      (filter = '{}'::jsonb OR d.metadata @> filter)
      AND d.embedding IS NOT NULL
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT
      d.id,
      d.content,
      d.metadata,
      ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', query_text)) as sim,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', query_text)) DESC) as rank
    FROM documents d
    WHERE
      (filter = '{}'::jsonb OR d.metadata @> filter)
      AND to_tsvector('english', d.content) @@ plainto_tsquery('english', query_text)
    LIMIT match_count * 2
  ),
  combined AS (
    SELECT
      COALESCE(s.id, k.id) as id,
      COALESCE(s.content, k.content) as content,
      COALESCE(s.metadata, k.metadata) as metadata,
      (
        COALESCE(semantic_weight / (s.rank + rrf_k), 0) +
        COALESCE((1 - semantic_weight) / (k.rank + rrf_k), 0)
      ) as score
    FROM semantic_search s
    FULL OUTER JOIN keyword_search k ON s.id = k.id
  )
  SELECT
    c.id,
    c.content,
    c.metadata,
    c.score as similarity,
    ROW_NUMBER() OVER (ORDER BY c.score DESC)::int as rank
  FROM combined c
  ORDER BY c.score DESC
  LIMIT match_count;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE documents IS 'Vector store for GEPA RAG pipeline documents';
COMMENT ON COLUMN documents.embedding IS 'OpenAI text-embedding-3-small (1536 dimensions)';
COMMENT ON COLUMN documents.metadata IS 'Flexible metadata storage (domain, source, timestamps, etc.)';
COMMENT ON FUNCTION match_documents IS 'Semantic similarity search using cosine distance';
COMMENT ON FUNCTION hybrid_search IS 'Hybrid search combining semantic and keyword with RRF';

-- Grant permissions (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
-- GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
-- GRANT EXECUTE ON FUNCTION hybrid_search TO authenticated;

-- Sample data for testing (optional, comment out for production)
-- INSERT INTO documents (content, metadata) VALUES
--   ('Q4 2024 revenue reached $3.9M, up 23% YoY driven by strong product adoption.', '{"domain": "financial", "year": 2024, "quarter": "Q4"}'::jsonb),
--   ('Gross margin expanded to 68%, up from 64% in Q3 2024.', '{"domain": "financial", "year": 2024, "quarter": "Q4"}'::jsonb),
--   ('New product line launched in Q4 with positive early reception from enterprise customers.', '{"domain": "product", "year": 2024, "quarter": "Q4"}'::jsonb),
--   ('Customer acquisition cost decreased 18% through marketing optimization initiatives.', '{"domain": "marketing", "year": 2024}'::jsonb),
--   ('Retention rate improved to 94%, indicating strong product-market fit.', '{"domain": "product", "year": 2024}'::jsonb);
