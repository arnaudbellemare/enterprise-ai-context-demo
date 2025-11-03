-- Migration: Update tool_primitives embeddings from 1536 to 384 dimensions
-- Reason: Switching from OpenAI embeddings to local embeddings (Xenova/all-MiniLM-L6-v2)
-- Date: 2025-11-03

-- Step 1: Drop existing vector index (required before changing column type)
DROP INDEX IF EXISTS idx_tool_primitives_embedding;

-- Step 2: Clear existing embeddings (since we're changing dimensions, old embeddings are incompatible)
-- You can also delete them, but clearing is safer - new embeddings will be generated on next tool use
UPDATE tool_primitives 
SET embedding = NULL 
WHERE embedding IS NOT NULL;

-- Step 3: Change column type from vector(1536) to vector(384)
ALTER TABLE tool_primitives 
ALTER COLUMN embedding TYPE vector(384) USING NULL;

-- Step 4: Update the find_similar_tools function to accept 384-dimensional embeddings
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

-- Step 5: Recreate vector index with correct dimensions
CREATE INDEX IF NOT EXISTS idx_tool_primitives_embedding
  ON tool_primitives
  USING ivfflat(embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 6: Verify the changes
DO $$
DECLARE
  embedding_dim INT;
  function_exists BOOLEAN;
BEGIN
  -- Check column type
  SELECT 
    CASE 
      WHEN data_type = 'USER-DEFINED' THEN 
        (SELECT typndims FROM pg_type WHERE oid = (
          SELECT atttypid FROM pg_attribute 
          WHERE attrelid = 'tool_primitives'::regclass 
          AND attname = 'embedding'
        ))
      ELSE NULL
    END INTO embedding_dim
  FROM information_schema.columns
  WHERE table_name = 'tool_primitives' 
  AND column_name = 'embedding';
  
  -- Check function exists
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'find_similar_tools'
  ) INTO function_exists;
  
  RAISE NOTICE 'Migration status:';
  RAISE NOTICE '  - Embedding column dimension: % (should be 384)', COALESCE(embedding_dim::TEXT, 'NULL');
  RAISE NOTICE '  - find_similar_tools function exists: %', function_exists;
END $$;

-- Summary
SELECT 
  'Migration complete!' AS status,
  COUNT(*) AS total_tools,
  COUNT(embedding) AS tools_with_embeddings,
  COUNT(*) - COUNT(embedding) AS tools_needing_embeddings
FROM tool_primitives;

