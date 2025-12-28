-- Email Classification System Tables
-- Phase 1: Persistent storage with embedding-based retrieval

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Table: email_labeled_examples
-- Purpose: Store labeled email examples with embeddings for semantic search
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_labeled_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_text TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  embedding VECTOR(768), -- Ollama nomic-embed-text embedding dimension
  entities JSONB DEFAULT '{}'::jsonb,
  user_id TEXT,
  source TEXT DEFAULT 'manual', -- 'manual', 'auto-labeled', 'corrected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_labeled_examples_template
  ON email_labeled_examples(template_id);

CREATE INDEX IF NOT EXISTS idx_email_labeled_examples_user
  ON email_labeled_examples(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_labeled_examples_created
  ON email_labeled_examples(created_at DESC);

-- Vector similarity index (IVFFlat for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_email_labeled_examples_embedding
  ON email_labeled_examples
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- Table: email_labeling_queue
-- Purpose: Active learning queue for prioritized labeling
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_labeling_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_text TEXT NOT NULL,
  email_hash TEXT UNIQUE NOT NULL, -- SHA256 hash to prevent duplicates
  predicted_template_id TEXT,
  predicted_template_name TEXT,
  confidence FLOAT,
  uncertainty FLOAT, -- 1 - confidence
  diversity FLOAT, -- Distance from existing examples
  priority FLOAT, -- Combined score for ranking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'labeled', 'skipped', 'archived')),
  labeled_by TEXT,
  labeled_template_id TEXT,
  labeled_template_name TEXT,
  labeled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_labeling_queue_status
  ON email_labeling_queue(status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_labeling_queue_priority
  ON email_labeling_queue(priority DESC, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_labeling_queue_hash
  ON email_labeling_queue(email_hash);

-- ============================================================================
-- Table: email_classification_metrics
-- Purpose: Track classification performance and user feedback
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_classification_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT NOT NULL,
  predicted_template_id TEXT NOT NULL,
  predicted_template_name TEXT NOT NULL,
  predicted_confidence FLOAT NOT NULL,
  actual_template_id TEXT,
  actual_template_name TEXT,
  correct BOOLEAN,
  user_feedback TEXT,
  feedback_type TEXT CHECK (feedback_type IN ('correct', 'incorrect', 'unsure')),
  classification_method TEXT, -- 'rule-based', 'llm', 'hybrid'
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_classification_metrics_created
  ON email_classification_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_classification_metrics_correct
  ON email_classification_metrics(correct)
  WHERE correct IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_classification_metrics_template
  ON email_classification_metrics(predicted_template_id);

-- ============================================================================
-- Table: email_confidence_calibration
-- Purpose: Store calibration data for confidence score adjustment
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_confidence_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predicted_confidence FLOAT NOT NULL CHECK (predicted_confidence >= 0 AND predicted_confidence <= 1),
  actual_correct BOOLEAN NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for calibration queries
CREATE INDEX IF NOT EXISTS idx_email_confidence_calibration_template
  ON email_confidence_calibration(template_id, created_at DESC);

-- ============================================================================
-- Functions: Vector similarity search
-- ============================================================================

-- Function: Find similar email examples using cosine similarity
CREATE OR REPLACE FUNCTION match_email_examples(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 15,
  template_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email_text TEXT,
  template_id TEXT,
  template_name TEXT,
  confidence FLOAT,
  entities JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.email_text,
    e.template_id,
    e.template_name,
    e.confidence,
    e.entities,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM email_labeled_examples e
  WHERE
    (template_filter IS NULL OR e.template_id = template_filter)
    AND e.embedding IS NOT NULL
    AND (1 - (e.embedding <=> query_embedding)) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: Get diverse examples across templates
CREATE OR REPLACE FUNCTION get_diverse_examples(
  query_embedding VECTOR(768),
  examples_per_template INT DEFAULT 3,
  template_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email_text TEXT,
  template_id TEXT,
  template_name TEXT,
  confidence FLOAT,
  entities JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_examples AS (
    SELECT
      e.id,
      e.email_text,
      e.template_id,
      e.template_name,
      e.confidence,
      e.entities,
      1 - (e.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (
        PARTITION BY e.template_id
        ORDER BY e.embedding <=> query_embedding
      ) AS rank
    FROM email_labeled_examples e
    WHERE
      (template_ids IS NULL OR e.template_id = ANY(template_ids))
      AND e.embedding IS NOT NULL
  )
  SELECT
    r.id,
    r.email_text,
    r.template_id,
    r.template_name,
    r.confidence,
    r.entities,
    r.similarity
  FROM ranked_examples r
  WHERE r.rank <= examples_per_template
  ORDER BY r.similarity DESC;
END;
$$;

-- ============================================================================
-- Triggers: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_labeled_examples_updated_at
  BEFORE UPDATE ON email_labeled_examples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Calculate classification accuracy by template
CREATE OR REPLACE FUNCTION get_classification_accuracy(
  template_filter TEXT DEFAULT NULL,
  days_back INT DEFAULT 30
)
RETURNS TABLE (
  template_id TEXT,
  template_name TEXT,
  total_count BIGINT,
  correct_count BIGINT,
  accuracy FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.predicted_template_id,
    m.predicted_template_name,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE m.correct = TRUE) AS correct_count,
    (COUNT(*) FILTER (WHERE m.correct = TRUE)::FLOAT / COUNT(*)::FLOAT) AS accuracy
  FROM email_classification_metrics m
  WHERE
    m.correct IS NOT NULL
    AND m.created_at > NOW() - INTERVAL '1 day' * days_back
    AND (template_filter IS NULL OR m.predicted_template_id = template_filter)
  GROUP BY m.predicted_template_id, m.predicted_template_name
  ORDER BY accuracy DESC;
END;
$$;

-- Function: Get next labeling candidates
CREATE OR REPLACE FUNCTION get_next_labeling_candidates(
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  email_text TEXT,
  predicted_template_name TEXT,
  confidence FLOAT,
  priority FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.email_text,
    q.predicted_template_name,
    q.confidence,
    q.priority,
    q.created_at
  FROM email_labeling_queue q
  WHERE q.status = 'pending'
  ORDER BY q.priority DESC, q.created_at ASC
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE email_labeled_examples IS 'Stores labeled email examples with embeddings for semantic similarity search';
COMMENT ON TABLE email_labeling_queue IS 'Active learning queue for intelligent sample selection';
COMMENT ON TABLE email_classification_metrics IS 'Tracks classification performance and user feedback';
COMMENT ON TABLE email_confidence_calibration IS 'Calibration data for confidence score adjustment';

COMMENT ON FUNCTION match_email_examples IS 'Find similar emails using vector similarity search';
COMMENT ON FUNCTION get_diverse_examples IS 'Get diverse examples across multiple templates';
COMMENT ON FUNCTION get_classification_accuracy IS 'Calculate classification accuracy metrics by template';
COMMENT ON FUNCTION get_next_labeling_candidates IS 'Get next batch of emails to label based on priority';

-- ============================================================================
-- Grant permissions (adjust as needed)
-- ============================================================================

-- Grant access to authenticated users
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
