-- Teacher-Student System Tables
-- This migration creates tables for the Teacher-Student learning system

-- Learning sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    teacher_response JSONB NOT NULL,
    student_response JSONB NOT NULL,
    learning_effectiveness DECIMAL(3,2) NOT NULL,
    domain TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_sessions_domain ON learning_sessions(domain);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_created_at ON learning_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_effectiveness ON learning_sessions(learning_effectiveness);

-- Teacher responses table (for caching and analysis)
CREATE TABLE IF NOT EXISTS teacher_responses (
    id TEXT PRIMARY KEY,
    query_hash TEXT NOT NULL,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    search_queries JSONB DEFAULT '[]',
    confidence DECIMAL(3,2) NOT NULL,
    domain TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_teacher_responses_query_hash ON teacher_responses(query_hash);
CREATE INDEX IF NOT EXISTS idx_teacher_responses_domain ON teacher_responses(domain);
CREATE INDEX IF NOT EXISTS idx_teacher_responses_confidence ON teacher_responses(confidence);

-- Student responses table (for tracking learning progress)
CREATE TABLE IF NOT EXISTS student_responses (
    id TEXT PRIMARY KEY,
    query_hash TEXT NOT NULL,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    learned_from_teacher BOOLEAN NOT NULL DEFAULT FALSE,
    confidence DECIMAL(3,2) NOT NULL,
    domain TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_responses_query_hash ON student_responses(query_hash);
CREATE INDEX IF NOT EXISTS idx_student_responses_domain ON student_responses(domain);
CREATE INDEX IF NOT EXISTS idx_student_responses_learned ON student_responses(learned_from_teacher);

-- Learning progress table (for tracking improvement over time)
CREATE TABLE IF NOT EXISTS learning_progress (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    average_effectiveness DECIMAL(3,2) DEFAULT 0,
    teacher_accuracy DECIMAL(3,2) DEFAULT 0,
    student_confidence DECIMAL(3,2) DEFAULT 0,
    learning_rate DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain, date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_progress_domain_date ON learning_progress(domain, date);

-- Insert some sample data for testing
INSERT INTO learning_sessions (
    id, query, teacher_response, student_response, learning_effectiveness, domain
) VALUES (
    'sample_1',
    'What is machine learning?',
    '{"answer": "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.", "sources": ["https://example.com/ml-guide"], "search_queries": ["machine learning definition"], "confidence": 0.95, "timestamp": "2025-01-27T10:00:00Z", "domain": "technology"}',
    '{"answer": "Machine learning is when computers learn from data to make predictions or decisions.", "learned_from_teacher": true, "confidence": 0.8, "timestamp": "2025-01-27T10:00:00Z", "domain": "technology"}',
    0.85,
    'technology'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO learning_sessions (
    id, query, teacher_response, student_response, learning_effectiveness, domain
) VALUES (
    'sample_2',
    'How do I invest in stocks?',
    '{"answer": "Stock investing involves researching companies, diversifying your portfolio, and understanding market trends. Start with index funds for beginners.", "sources": ["https://example.com/investing-guide"], "search_queries": ["stock investing guide"], "confidence": 0.9, "timestamp": "2025-01-27T10:00:00Z", "domain": "financial"}',
    '{"answer": "To invest in stocks, you need to research companies and diversify your investments.", "learned_from_teacher": true, "confidence": 0.7, "timestamp": "2025-01-27T10:00:00Z", "domain": "financial"}',
    0.8,
    'financial'
) ON CONFLICT (id) DO NOTHING;

-- Create a function to update learning progress
CREATE OR REPLACE FUNCTION update_learning_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert learning progress for the domain and date
    INSERT INTO learning_progress (domain, date, total_sessions, average_effectiveness, teacher_accuracy, student_confidence)
    VALUES (
        NEW.domain,
        CURRENT_DATE,
        1,
        NEW.learning_effectiveness,
        (NEW.teacher_response->>'confidence')::DECIMAL,
        (NEW.student_response->>'confidence')::DECIMAL
    )
    ON CONFLICT (domain, date) DO UPDATE SET
        total_sessions = learning_progress.total_sessions + 1,
        average_effectiveness = (learning_progress.average_effectiveness * learning_progress.total_sessions + NEW.learning_effectiveness) / (learning_progress.total_sessions + 1),
        teacher_accuracy = (learning_progress.teacher_accuracy * learning_progress.total_sessions + (NEW.teacher_response->>'confidence')::DECIMAL) / (learning_progress.total_sessions + 1),
        student_confidence = (learning_progress.student_confidence * learning_progress.total_sessions + (NEW.student_response->>'confidence')::DECIMAL) / (learning_progress.total_sessions + 1),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update learning progress
DROP TRIGGER IF EXISTS trigger_update_learning_progress ON learning_sessions;
CREATE TRIGGER trigger_update_learning_progress
    AFTER INSERT ON learning_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_progress();

-- Create a view for easy access to learning statistics
CREATE OR REPLACE VIEW learning_stats AS
SELECT 
    domain,
    COUNT(*) as total_sessions,
    AVG(learning_effectiveness) as average_effectiveness,
    AVG((teacher_response->>'confidence')::DECIMAL) as teacher_accuracy,
    AVG((student_response->>'confidence')::DECIMAL) as student_confidence,
    COUNT(CASE WHEN (student_response->>'learned_from_teacher')::BOOLEAN THEN 1 END) as sessions_with_learning,
    MAX(created_at) as last_session
FROM learning_sessions
GROUP BY domain;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON learning_sessions TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON teacher_responses TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON student_responses TO authenticated;
-- GRANT SELECT ON learning_progress TO authenticated;
-- GRANT SELECT ON learning_stats TO authenticated;
