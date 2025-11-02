-- ReasoningBank Structured Memory Schema
-- Based on "ReasoningBank: Scaling Agent Self-Evolving with Reasoning Memory"
-- Adds structured memory items with title, description, content, createdFrom, abstractionLevel

-- ============================================
-- 1. REASONING MEMORY ITEMS TABLE
-- ============================================
-- This table stores structured memory items extracted from agent trajectories
CREATE TABLE IF NOT EXISTS reasoning_memory_items (
  id BIGSERIAL PRIMARY KEY,
  
  -- ReasoningBank schema (from paper)
  title TEXT NOT NULL,              -- Concise identifier summarizing core strategy
  description TEXT NOT NULL,        -- One-sentence summary
  content TEXT NOT NULL,            -- Distilled reasoning steps, decision rationales
  
  -- Metadata
  domain TEXT NOT NULL,
  created_from TEXT NOT NULL CHECK (created_from IN ('success', 'failure')),
  abstraction_level TEXT NOT NULL DEFAULT 'procedural' 
    CHECK (abstraction_level IN ('procedural', 'adaptive', 'compositional')),
  
  -- Tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3, 2) DEFAULT 0.0 CHECK (success_rate >= 0.0 AND success_rate <= 1.0),
  last_used TIMESTAMPTZ,
  
  -- Relationships (emergent evolution)
  derived_from BIGINT[] DEFAULT '{}',  -- Parent memory item IDs
  evolved_into BIGINT[] DEFAULT '{}',  -- Child memory item IDs
  
  -- Vector embedding for similarity search
  embedding VECTOR(1536),
  
  -- Source experience tracking
  source_task_id TEXT,
  source_query TEXT,
  source_trajectory_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient retrieval
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_domain ON reasoning_memory_items(domain);
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_created_from ON reasoning_memory_items(created_from);
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_abstraction ON reasoning_memory_items(abstraction_level);
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_success_rate ON reasoning_memory_items(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_usage ON reasoning_memory_items(usage_count DESC);

-- Vector similarity search index (ivfflat for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_embedding ON reasoning_memory_items 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- GIN index for array columns (derived_from, evolved_into)
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_derived_from ON reasoning_memory_items 
USING GIN (derived_from);
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_evolved_into ON reasoning_memory_items 
USING GIN (evolved_into);

-- Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_reasoning_memory_title_desc ON reasoning_memory_items 
USING GIN (to_tsvector('english', title || ' ' || description));

-- ============================================
-- 2. EXPERIENCES TABLE (Trajectory Storage)
-- ============================================
-- Stores complete agent trajectories for memory extraction
CREATE TABLE IF NOT EXISTS reasoning_experiences (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT UNIQUE NOT NULL,
  query TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  -- Complete trajectory (JSONB for flexibility)
  trajectory JSONB NOT NULL,
  
  -- Outcome
  success BOOLEAN NOT NULL,
  final_result JSONB,
  
  -- Self-judgment (LLM-as-judge)
  self_judgment JSONB,  -- {success: boolean, reasoning: string, confidence: number}
  
  -- IRT evaluation
  irt_ability DECIMAL(5, 3),
  irt_confidence DECIMAL(5, 3),
  
  -- Memory extraction status
  memories_extracted BOOLEAN DEFAULT FALSE,
  memory_item_ids BIGINT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reasoning_experiences_task_id ON reasoning_experiences(task_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_experiences_domain ON reasoning_experiences(domain);
CREATE INDEX IF NOT EXISTS idx_reasoning_experiences_success ON reasoning_experiences(success);
CREATE INDEX IF NOT EXISTS idx_reasoning_experiences_extracted ON reasoning_experiences(memories_extracted);

-- ============================================
-- 3. UPDATE TRIGGER for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_reasoning_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reasoning_memory_updated_at
  BEFORE UPDATE ON reasoning_memory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_reasoning_memory_updated_at();

CREATE TRIGGER trigger_reasoning_experiences_updated_at
  BEFORE UPDATE ON reasoning_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_reasoning_memory_updated_at();

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to retrieve similar memories by embedding
CREATE OR REPLACE FUNCTION find_similar_memories(
  query_embedding VECTOR(1536),
  target_domain TEXT DEFAULT NULL,
  similarity_threshold DECIMAL DEFAULT 0.7,
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  content TEXT,
  domain TEXT,
  created_from TEXT,
  abstraction_level TEXT,
  similarity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rmi.id,
    rmi.title,
    rmi.description,
    rmi.content,
    rmi.domain,
    rmi.created_from,
    rmi.abstraction_level,
    1 - (rmi.embedding <=> query_embedding) AS similarity
  FROM reasoning_memory_items rmi
  WHERE 
    rmi.embedding IS NOT NULL
    AND (target_domain IS NULL OR rmi.domain = target_domain OR rmi.domain = 'general')
    AND (1 - (rmi.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to update memory usage statistics
CREATE OR REPLACE FUNCTION update_memory_usage(
  memory_id BIGINT,
  was_successful BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE reasoning_memory_items
  SET 
    usage_count = usage_count + 1,
    success_rate = CASE 
      WHEN usage_count = 0 THEN 
        CASE WHEN was_successful THEN 1.0 ELSE 0.0 END
      ELSE 
        (success_rate * usage_count + CASE WHEN was_successful THEN 1.0 ELSE 0.0 END) / (usage_count + 1)
    END,
    last_used = NOW()
  WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE reasoning_memory_items IS 'Structured memory items extracted from agent trajectories using ReasoningBank framework';
COMMENT ON COLUMN reasoning_memory_items.title IS 'Concise identifier summarizing the core strategy or reasoning pattern';
COMMENT ON COLUMN reasoning_memory_items.description IS 'One-sentence summary of the memory item';
COMMENT ON COLUMN reasoning_memory_items.content IS 'Distilled reasoning steps, decision rationales, or operational insights';
COMMENT ON COLUMN reasoning_memory_items.created_from IS 'Whether this memory was extracted from a successful or failed trajectory';
COMMENT ON COLUMN reasoning_memory_items.abstraction_level IS 'Emergent evolution level: procedural → adaptive → compositional';
COMMENT ON COLUMN reasoning_memory_items.derived_from IS 'Array of parent memory item IDs (for evolution tracking)';
COMMENT ON COLUMN reasoning_memory_items.evolved_into IS 'Array of child memory item IDs (for evolution tracking)';

