# Apply Migration 018: Vector Search for Expert Trajectories

## Quick Instructions

**Copy and paste this SQL into your Supabase SQL Editor:**

```sql
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
```

## Step-by-Step

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ofvbywlqztkgugrkibcp/sql/new
2. Click "New Query"
3. Paste the SQL above
4. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
5. Verify success - you should see green checkmarks

## What This Does

- **Enables pgvector extension**: PostgreSQL vector similarity extension
- **Adds embedding column**: Stores 1536-dim embeddings for each trajectory
- **Creates IVFFlat index**: Fast similarity search using cosine distance
- **Creates RPC function**: `match_expert_trajectories()` for semantic search

## Benefits

**Before (Keyword Matching):**
- "ROI investment" only matches exact word overlap
- Misses semantic similarity

**After (Vector Similarity):**
- "ROI investment" matches "return on investment" semantically
- Better trajectory matching for SRL

## Verify It Worked

Run this test:
```bash
npx tsx --env-file=frontend/.env.local test-system-integration.ts
```

You should see:
```
✅ Vector Search: AVAILABLE
   Matched: X trajectories
```

## Files Reference

- Migration SQL: `supabase/migrations/018_expert_trajectories_vector_search.sql`
- Implementation: `frontend/lib/srl/swirl-srl-enhancer.ts`
- Test: `test-system-integration.ts`

