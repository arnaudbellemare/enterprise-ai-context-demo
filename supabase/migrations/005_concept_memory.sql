-- =====================================================
-- ARCMEMO: Concept-Level Memory System
-- Stores abstract, reusable insights from workflow executions
-- =====================================================

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create concept_memory table
CREATE TABLE IF NOT EXISTS concept_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core concept data
  concept TEXT NOT NULL,
  domain TEXT NOT NULL,
  abstraction_level TEXT CHECK (abstraction_level IN ('specific', 'general', 'universal')) DEFAULT 'general',
  
  -- Performance tracking
  source_workflows JSONB DEFAULT '[]'::jsonb,
  application_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 1.0,
  
  -- Semantic search
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  
  -- Metadata
  key_triggers TEXT[] DEFAULT '{}',
  related_concepts UUID[] DEFAULT '{}',
  examples TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_concept_memory_domain ON concept_memory(domain);
CREATE INDEX IF NOT EXISTS idx_concept_memory_abstraction ON concept_memory(abstraction_level);
CREATE INDEX IF NOT EXISTS idx_concept_memory_success_rate ON concept_memory(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_concept_memory_last_used ON concept_memory(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_concept_memory_triggers ON concept_memory USING gin(key_triggers);

-- Create vector index for semantic search (HNSW for speed)
CREATE INDEX IF NOT EXISTS idx_concept_memory_embedding ON concept_memory 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Enable Row Level Security
ALTER TABLE concept_memory ENABLE ROW LEVEL SECURITY;

-- Policies for concept memory (allow all for demo - tighten in production)
DROP POLICY IF EXISTS "Allow anyone to read concepts" ON concept_memory;
CREATE POLICY "Allow anyone to read concepts" ON concept_memory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to insert concepts" ON concept_memory;
CREATE POLICY "Allow anyone to insert concepts" ON concept_memory
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anyone to update concepts" ON concept_memory;
CREATE POLICY "Allow anyone to update concepts" ON concept_memory
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anyone to delete concepts" ON concept_memory;
CREATE POLICY "Allow anyone to delete concepts" ON concept_memory
  FOR DELETE USING (true);

-- =====================================================
-- VECTOR SEARCH FUNCTION
-- Match concepts by semantic similarity
-- =====================================================

CREATE OR REPLACE FUNCTION match_concepts(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_domain TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  concept TEXT,
  domain TEXT,
  abstraction_level TEXT,
  application_count INT,
  success_rate FLOAT,
  similarity FLOAT,
  key_triggers TEXT[],
  examples TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.concept,
    cm.domain,
    cm.abstraction_level,
    cm.application_count,
    cm.success_rate,
    1 - (cm.embedding <=> query_embedding) AS similarity,
    cm.key_triggers,
    cm.examples
  FROM concept_memory cm
  WHERE 
    (filter_domain IS NULL OR cm.domain = filter_domain OR cm.abstraction_level IN ('general', 'universal'))
    AND (1 - (cm.embedding <=> query_embedding)) > match_threshold
  ORDER BY 
    similarity DESC,
    cm.success_rate DESC,
    cm.application_count DESC
  LIMIT match_count;
END;
$$;

-- =====================================================
-- CLEANUP FUNCTION
-- Remove low-performing concepts
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_low_performing_concepts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete concepts with >10 applications and <30% success rate
  DELETE FROM concept_memory
  WHERE application_count > 10
    AND success_rate < 0.3;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- MEMORY STATISTICS VIEW
-- Quick overview of memory system performance
-- =====================================================

CREATE OR REPLACE VIEW concept_memory_stats AS
SELECT
  COUNT(*) AS total_concepts,
  COUNT(*) FILTER (WHERE abstraction_level = 'specific') AS specific_concepts,
  COUNT(*) FILTER (WHERE abstraction_level = 'general') AS general_concepts,
  COUNT(*) FILTER (WHERE abstraction_level = 'universal') AS universal_concepts,
  SUM(application_count) AS total_applications,
  ROUND(AVG(success_rate)::numeric, 3) AS avg_success_rate,
  COUNT(DISTINCT domain) AS unique_domains,
  MAX(last_used) AS most_recent_use
FROM concept_memory;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE concept_memory IS 'ArcMemo: Stores abstract, reusable concepts learned from workflow executions';
COMMENT ON COLUMN concept_memory.concept IS 'Natural language description of the learned concept';
COMMENT ON COLUMN concept_memory.abstraction_level IS 'How broadly applicable: specific (domain-only), general (cross-domain), universal (all workflows)';
COMMENT ON COLUMN concept_memory.embedding IS 'Vector embedding for semantic similarity search (OpenAI text-embedding-3-small)';
COMMENT ON COLUMN concept_memory.success_rate IS 'Percentage of times this concept led to successful outcomes';
COMMENT ON FUNCTION match_concepts IS 'Semantic search for relevant concepts using vector similarity';

