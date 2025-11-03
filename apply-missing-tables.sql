-- Apply Missing Tables Migration
-- Run this script in your Supabase SQL editor to create the missing tables
-- Based on migrations 018 and 019

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

-- Vector similarity search index (create conditionally since it needs data first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_reasoning_memory_embedding'
  ) THEN
    CREATE INDEX idx_reasoning_memory_embedding ON reasoning_memory_items 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- GIN index for array columns
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
-- 3. TOOL PRIMITIVES TABLE (Alita-G Inspired)
-- ============================================
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
  embedding vector(1536), -- OpenAI text-embedding-3-small
  
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

-- Vector similarity search index (create conditionally)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tool_primitives_embedding'
  ) THEN
    CREATE INDEX idx_tool_primitives_embedding
    ON tool_primitives
    USING ivfflat(embedding vector_cosine_ops)
    WITH (lists = 100);
  END IF;
END $$;

-- ============================================
-- 4. UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_reasoning_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reasoning_memory_updated_at ON reasoning_memory_items;
CREATE TRIGGER trigger_reasoning_memory_updated_at
  BEFORE UPDATE ON reasoning_memory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_reasoning_memory_updated_at();

DROP TRIGGER IF EXISTS trigger_reasoning_experiences_updated_at ON reasoning_experiences;
CREATE TRIGGER trigger_reasoning_experiences_updated_at
  BEFORE UPDATE ON reasoning_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_reasoning_memory_updated_at();

CREATE OR REPLACE FUNCTION update_tool_primitives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tool_primitives_updated_at ON tool_primitives;
CREATE TRIGGER trigger_update_tool_primitives_updated_at
  BEFORE UPDATE ON tool_primitives
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_primitives_updated_at();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created missing tables:';
  RAISE NOTICE '   - reasoning_memory_items';
  RAISE NOTICE '   - reasoning_experiences';
  RAISE NOTICE '   - tool_primitives';
END $$;
