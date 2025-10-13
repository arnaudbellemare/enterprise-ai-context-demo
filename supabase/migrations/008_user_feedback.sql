-- User Feedback Table
-- Stores human preferences for training LLM-as-judge
-- Part of Human → Judge → Student pipeline

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bullet_id TEXT NOT NULL,           -- Reference to ACE bullet
  user_id TEXT DEFAULT 'anonymous',   -- User identifier (can be anonymous)
  is_helpful BOOLEAN NOT NULL,        -- True = helpful, False = harmful
  comment TEXT,                       -- Optional user comment
  context JSONB,                      -- Optional context (task, domain, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_bullet 
  ON user_feedback(bullet_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user 
  ON user_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_created 
  ON user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_feedback_helpful 
  ON user_feedback(is_helpful);

-- View for aggregated statistics
CREATE OR REPLACE VIEW user_feedback_stats AS
SELECT 
  bullet_id,
  COUNT(*) AS total_feedback,
  SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END) AS helpful_count,
  SUM(CASE WHEN is_helpful THEN 0 ELSE 1 END) AS harmful_count,
  ROUND(
    SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END)::DECIMAL / COUNT(*),
    3
  ) AS quality_score
FROM user_feedback
GROUP BY bullet_id;

-- Comment
COMMENT ON TABLE user_feedback IS 
  'Human preferences for LLM-as-judge training. Enables Human → Judge → Student pipeline.';

COMMENT ON COLUMN user_feedback.bullet_id IS 
  'Reference to ACE bullet/strategy ID';

COMMENT ON COLUMN user_feedback.is_helpful IS 
  'True if user found bullet helpful, False if harmful/misleading';

COMMENT ON VIEW user_feedback_stats IS 
  'Aggregated statistics per bullet: total feedback, helpful/harmful counts, quality score';

