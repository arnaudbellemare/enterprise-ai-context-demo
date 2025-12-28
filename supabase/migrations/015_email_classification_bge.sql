-- Email Classification System with BGE-large Embeddings
-- BGE-large-en-v1.5: 1024 dimensions, beats OpenAI ada-002 by 5.3% on MTEB
-- For use with Ollama BGE-large or similar 1024-dim models

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table: email_labeled_examples
-- Stores labeled email examples with embeddings for few-shot learning
CREATE TABLE IF NOT EXISTS email_labeled_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_text TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  embedding VECTOR(1024), -- ⚠️ BGE-large = 1024 dimensions
  entities JSONB DEFAULT '{}'::jsonb,
  user_id TEXT,
  source TEXT DEFAULT 'manual', -- 'manual' | 'auto-labeled' | 'corrected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_labeling_queue
-- Active learning queue prioritizing uncertain examples for human labeling
CREATE TABLE IF NOT EXISTS email_labeling_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_text TEXT NOT NULL,
  email_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash for deduplication
  predicted_template_id TEXT,
  predicted_template_name TEXT,
  confidence FLOAT,
  uncertainty FLOAT, -- 1 - confidence
  diversity FLOAT, -- How different from existing examples
  priority FLOAT, -- Combined score: 0.6 * uncertainty + 0.4 * diversity
  status TEXT DEFAULT 'pending', -- 'pending' | 'labeled' | 'skipped'
  labeled_template_id TEXT,
  labeled_template_name TEXT,
  labeled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  labeled_at TIMESTAMPTZ
);

-- Table: email_classification_metrics
-- Tracks classification accuracy and performance
CREATE TABLE IF NOT EXISTS email_classification_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT NOT NULL,
  predicted_template_id TEXT NOT NULL,
  predicted_template_name TEXT NOT NULL,
  predicted_confidence FLOAT NOT NULL,
  classification_method TEXT NOT NULL, -- 'rule-based' | 'llm' | 'hybrid'
  processing_time_ms INT,
  actual_template_id TEXT,
  actual_template_name TEXT,
  correct BOOLEAN,
  user_feedback TEXT,
  feedback_type TEXT, -- 'correct' | 'incorrect' | 'partial'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_confidence_calibration
-- Stores calibration data for temperature scaling (Phase 2)
CREATE TABLE IF NOT EXISTS email_confidence_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predicted_confidence FLOAT NOT NULL,
  actual_correct BOOLEAN NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_labeled_examples_template_id
  ON email_labeled_examples(template_id);

CREATE INDEX IF NOT EXISTS idx_email_labeled_examples_created_at
  ON email_labeled_examples(created_at DESC);

-- Vector similarity index (IVFFlat for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_email_labeled_examples_embedding
  ON email_labeled_examples
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_email_labeling_queue_status
  ON email_labeling_queue(status);

CREATE INDEX IF NOT EXISTS idx_email_labeling_queue_priority
  ON email_labeling_queue(priority DESC);

CREATE INDEX IF NOT EXISTS idx_email_classification_metrics_template
  ON email_classification_metrics(predicted_template_id);

CREATE INDEX IF NOT EXISTS idx_email_classification_metrics_created_at
  ON email_classification_metrics(created_at DESC);

-- RPC Function: match_email_examples
-- Vector similarity search for few-shot example selection
CREATE OR REPLACE FUNCTION match_email_examples(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 15,
  template_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email_text TEXT,
  template_id TEXT,
  template_name TEXT,
  entities JSONB,
  confidence FLOAT,
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
    e.entities,
    e.confidence,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM email_labeled_examples e
  WHERE
    (template_filter IS NULL OR e.template_id = template_filter)
    AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RPC Function: get_diverse_examples
-- Retrieves diverse examples across multiple templates
CREATE OR REPLACE FUNCTION get_diverse_examples(
  query_embedding VECTOR(1024),
  examples_per_template INT DEFAULT 2,
  template_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email_text TEXT,
  template_id TEXT,
  template_name TEXT,
  entities JSONB,
  confidence FLOAT,
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
      e.entities,
      e.confidence,
      1 - (e.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (
        PARTITION BY e.template_id
        ORDER BY e.embedding <=> query_embedding
      ) AS rank
    FROM email_labeled_examples e
    WHERE template_ids IS NULL OR e.template_id = ANY(template_ids)
  )
  SELECT
    r.id,
    r.email_text,
    r.template_id,
    r.template_name,
    r.entities,
    r.confidence,
    r.similarity
  FROM ranked_examples r
  WHERE r.rank <= examples_per_template
  ORDER BY r.similarity DESC;
END;
$$;

-- RPC Function: get_next_labeling_candidates
-- Retrieves highest-priority unlabeled examples from active learning queue
CREATE OR REPLACE FUNCTION get_next_labeling_candidates(
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  email_text TEXT,
  predicted_template_id TEXT,
  predicted_template_name TEXT,
  confidence FLOAT,
  uncertainty FLOAT,
  diversity FLOAT,
  priority FLOAT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.email_text,
    q.predicted_template_id,
    q.predicted_template_name,
    q.confidence,
    q.uncertainty,
    q.diversity,
    q.priority,
    q.status,
    q.created_at
  FROM email_labeling_queue q
  WHERE q.status = 'pending'
  ORDER BY q.priority DESC, q.created_at ASC
  LIMIT limit_count;
END;
$$;

-- RPC Function: get_classification_accuracy
-- Calculates per-template classification accuracy
CREATE OR REPLACE FUNCTION get_classification_accuracy(
  template_filter TEXT DEFAULT NULL,
  days_back INT DEFAULT 30
)
RETURNS TABLE (
  template_id TEXT,
  template_name TEXT,
  total_count BIGINT,
  correct_count BIGINT,
  accuracy FLOAT,
  avg_confidence FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.predicted_template_id AS template_id,
    m.predicted_template_name AS template_name,
    COUNT(*) AS total_count,
    SUM(CASE WHEN m.correct = TRUE THEN 1 ELSE 0 END) AS correct_count,
    AVG(CASE WHEN m.correct = TRUE THEN 1.0 ELSE 0.0 END) AS accuracy,
    AVG(m.predicted_confidence) AS avg_confidence
  FROM email_classification_metrics m
  WHERE
    m.correct IS NOT NULL
    AND (template_filter IS NULL OR m.predicted_template_id = template_filter)
    AND m.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY m.predicted_template_id, m.predicted_template_name
  ORDER BY total_count DESC;
END;
$$;

-- Trigger: Update updated_at timestamp
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

CREATE TRIGGER update_email_classification_metrics_updated_at
  BEFORE UPDATE ON email_classification_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE email_labeled_examples IS 'Stores labeled email examples with BGE-large embeddings (1024 dims) for semantic similarity search';
COMMENT ON TABLE email_labeling_queue IS 'Active learning queue prioritizing uncertain examples for human labeling';
COMMENT ON TABLE email_classification_metrics IS 'Tracks classification accuracy, performance, and user feedback';
COMMENT ON TABLE email_confidence_calibration IS 'Calibration data for temperature scaling (future Phase 2 enhancement)';

COMMENT ON FUNCTION match_email_examples IS 'Vector similarity search for few-shot example selection using cosine distance';
COMMENT ON FUNCTION get_diverse_examples IS 'Retrieves diverse examples across templates for balanced few-shot learning';
COMMENT ON FUNCTION get_next_labeling_candidates IS 'Returns highest-priority unlabeled examples from active learning queue';
COMMENT ON FUNCTION get_classification_accuracy IS 'Calculates per-template classification accuracy over time period';
