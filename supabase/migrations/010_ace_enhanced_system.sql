-- Enhanced ACE System Tables
-- Inspired by: https://github.com/jmanhype/ace-playbook

-- Create ace_insights table for reflection data
CREATE TABLE IF NOT EXISTS ace_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    domain TEXT NOT NULL,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('helpful', 'harmful', 'neutral')),
    insight_text TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.5,
    components_used TEXT[] DEFAULT '{}',
    execution_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    helpful_count INTEGER DEFAULT 0,
    harmful_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0
);

-- Create ace_playbook_bullets table for curated content
CREATE TABLE IF NOT EXISTS ace_playbook_bullets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    domain TEXT NOT NULL,
    helpful_count INTEGER DEFAULT 0,
    harmful_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    embedding VECTOR(384), -- For semantic similarity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ace_insights_domain ON ace_insights(domain);
CREATE INDEX IF NOT EXISTS idx_ace_insights_type ON ace_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ace_insights_created_at ON ace_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ace_playbook_bullets_domain ON ace_playbook_bullets(domain);
CREATE INDEX IF NOT EXISTS idx_ace_playbook_bullets_usage ON ace_playbook_bullets(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_ace_playbook_bullets_helpful ON ace_playbook_bullets(helpful_count DESC);

-- Create vector index for semantic similarity (if pgvector is available)
-- CREATE INDEX IF NOT EXISTS idx_ace_playbook_bullets_embedding ON ace_playbook_bullets USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create function to increment counters
CREATE OR REPLACE FUNCTION increment_counter(
    table_name TEXT,
    column_name TEXT,
    row_id UUID
) RETURNS INTEGER AS $$
DECLARE
    new_value INTEGER;
BEGIN
    EXECUTE format('UPDATE %I SET %I = %I + 1 WHERE id = $1 RETURNING %I', 
                   table_name, column_name, column_name, column_name) 
    USING row_id INTO new_value;
    RETURN new_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to get playbook stats
CREATE OR REPLACE FUNCTION get_playbook_stats(target_domain TEXT DEFAULT NULL)
RETURNS TABLE(
    total_bullets BIGINT,
    helpful_bullets BIGINT,
    harmful_bullets BIGINT,
    neutral_bullets BIGINT,
    total_usage BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_bullets,
        COUNT(*) FILTER (WHERE helpful_count > 0) as helpful_bullets,
        COUNT(*) FILTER (WHERE harmful_count > 0) as harmful_bullets,
        COUNT(*) FILTER (WHERE neutral_count > 0) as neutral_bullets,
        COALESCE(SUM(usage_count), 0) as total_usage
    FROM ace_playbook_bullets
    WHERE (target_domain IS NULL OR domain = target_domain);
END;
$$ LANGUAGE plpgsql;

-- Create function to get top insights
CREATE OR REPLACE FUNCTION get_top_insights(
    target_domain TEXT DEFAULT NULL,
    insight_type_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    query TEXT,
    domain TEXT,
    insight_type TEXT,
    insight_text TEXT,
    confidence DECIMAL,
    helpful_count INTEGER,
    harmful_count INTEGER,
    neutral_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.query,
        i.domain,
        i.insight_type,
        i.insight_text,
        i.confidence,
        i.helpful_count,
        i.harmful_count,
        i.neutral_count,
        i.created_at
    FROM ace_insights i
    WHERE (target_domain IS NULL OR i.domain = target_domain)
      AND (insight_type_filter IS NULL OR i.insight_type = insight_type_filter)
    ORDER BY 
        (i.helpful_count - i.harmful_count) DESC,
        i.confidence DESC,
        i.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO ace_playbook_bullets (content, domain, helpful_count, usage_count) VALUES
('Always verify data accuracy before making decisions', 'general', 5, 10),
('Use parallel processing for better performance', 'technology', 8, 15),
('Cache frequently accessed data to reduce latency', 'technology', 12, 25),
('Consider multiple perspectives in complex problems', 'general', 6, 12),
('Document assumptions and constraints clearly', 'general', 4, 8)
ON CONFLICT DO NOTHING;

INSERT INTO ace_insights (query, domain, insight_type, insight_text, confidence, helpful_count) VALUES
('What is 2+2?', 'general', 'helpful', 'Simple arithmetic questions benefit from direct answers', 0.9, 3),
('How to optimize database queries?', 'technology', 'helpful', 'Indexing and query optimization are crucial for performance', 0.8, 5),
('Complex financial analysis', 'financial', 'neutral', 'Multiple data sources needed for comprehensive analysis', 0.7, 2)
ON CONFLICT DO NOTHING;

-- Create view for playbook analytics
CREATE OR REPLACE VIEW playbook_analytics AS
SELECT 
    domain,
    COUNT(*) as total_bullets,
    COUNT(*) FILTER (WHERE helpful_count > 0) as helpful_bullets,
    COUNT(*) FILTER (WHERE harmful_count > 0) as harmful_bullets,
    COUNT(*) FILTER (WHERE neutral_count > 0) as neutral_bullets,
    COALESCE(SUM(usage_count), 0) as total_usage,
    COALESCE(AVG(usage_count), 0) as avg_usage,
    MAX(updated_at) as last_updated
FROM ace_playbook_bullets
GROUP BY domain
ORDER BY total_usage DESC;

-- Create view for insight analytics
CREATE OR REPLACE VIEW insight_analytics AS
SELECT 
    domain,
    insight_type,
    COUNT(*) as total_insights,
    COALESCE(AVG(confidence), 0) as avg_confidence,
    COALESCE(SUM(helpful_count), 0) as total_helpful,
    COALESCE(SUM(harmful_count), 0) as total_harmful,
    COALESCE(SUM(neutral_count), 0) as total_neutral,
    MAX(created_at) as last_insight
FROM ace_insights
GROUP BY domain, insight_type
ORDER BY domain, insight_type;
