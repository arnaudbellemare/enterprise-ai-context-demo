-- Optimization System Tables
-- Real implementation of optimization logging and tracking

-- Optimization logs table
CREATE TABLE IF NOT EXISTS optimization_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    optimization_result JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    total_latency INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    domain TEXT,
    task_type TEXT,
    priority TEXT,
    success BOOLEAN DEFAULT false,
    errors TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component performance tracking
CREATE TABLE IF NOT EXISTS component_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_name TEXT NOT NULL,
    accuracy DECIMAL(5,2),
    latency_ms INTEGER,
    cost DECIMAL(10,6),
    success_rate DECIMAL(5,2),
    test_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(component_name)
);

-- Smart routing decisions
CREATE TABLE IF NOT EXISTS routing_decisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    primary_component TEXT NOT NULL,
    fallback_component TEXT,
    reasoning TEXT,
    estimated_cost DECIMAL(10,6),
    estimated_latency_ms INTEGER,
    actual_cost DECIMAL(10,6),
    actual_latency_ms INTEGER,
    success BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Cache performance tracking
CREATE TABLE IF NOT EXISTS cache_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT NOT NULL,
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    avg_latency_ms DECIMAL(8,2),
    cost_saved DECIMAL(10,6) DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parallel execution tracking
CREATE TABLE IF NOT EXISTS parallel_execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    total_tasks INTEGER DEFAULT 0,
    successful_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    total_latency_ms INTEGER DEFAULT 0,
    parallel_efficiency DECIMAL(5,2),
    cost_savings DECIMAL(10,6) DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_optimization_logs_timestamp ON optimization_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_domain ON optimization_logs(domain);
CREATE INDEX IF NOT EXISTS idx_optimization_logs_success ON optimization_logs(success);

CREATE INDEX IF NOT EXISTS idx_component_performance_name ON component_performance(component_name);
CREATE INDEX IF NOT EXISTS idx_component_performance_updated ON component_performance(last_updated);

CREATE INDEX IF NOT EXISTS idx_routing_decisions_timestamp ON routing_decisions(timestamp);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_task_type ON routing_decisions(task_type);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_success ON routing_decisions(success);

CREATE INDEX IF NOT EXISTS idx_cache_performance_key ON cache_performance(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_performance_accessed ON cache_performance(last_accessed);

CREATE INDEX IF NOT EXISTS idx_parallel_execution_timestamp ON parallel_execution_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_parallel_execution_session ON parallel_execution_logs(session_id);

-- Insert initial component performance data (will be updated by real benchmarks)
INSERT INTO component_performance (component_name, accuracy, latency_ms, cost, success_rate, test_count) VALUES
('ACE Framework', 0, 0, 0, 0, 0),
('TRM (Tiny Recursion Model)', 0, 0, 0, 0, 0),
('Teacher Model (Perplexity)', 0, 0, 0, 0, 0),
('KV Cache', 0, 0, 0, 0, 0),
('Synthesis Agent (Merger)', 0, 0, 0, 0, 0),
('SWiRL (Step-Wise RL)', 0, 0, 0, 0, 0),
('Multi-Query Expansion', 0, 0, 0, 0, 0),
('LoRA (Low-Rank Adaptation)', 0, 0, 0, 0, 0),
('DSPy Optimization', 0, 0, 0, 0, 0),
('IRT (Item Response Theory)', 0, 0, 0, 0, 0)
ON CONFLICT (component_name) DO NOTHING;

-- Create a view for optimization dashboard
CREATE OR REPLACE VIEW optimization_dashboard AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as total_queries,
    COUNT(*) FILTER (WHERE success = true) as successful_queries,
    AVG(total_latency) as avg_latency_ms,
    AVG(total_cost) as avg_cost,
    SUM(cache_hits) as total_cache_hits,
    SUM(cache_misses) as total_cache_misses,
    ROUND(SUM(cache_hits)::DECIMAL / NULLIF(SUM(cache_hits + cache_misses), 0) * 100, 2) as cache_hit_rate
FROM optimization_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Create a view for component performance summary
CREATE OR REPLACE VIEW component_performance_summary AS
SELECT 
    component_name,
    accuracy,
    latency_ms,
    cost,
    success_rate,
    test_count,
    last_updated,
    CASE 
        WHEN accuracy >= 90 THEN 'Excellent'
        WHEN accuracy >= 80 THEN 'Good'
        WHEN accuracy >= 70 THEN 'Fair'
        ELSE 'Poor'
    END as performance_rating
FROM component_performance
ORDER BY accuracy DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON optimization_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON component_performance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON routing_decisions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON cache_performance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON parallel_execution_logs TO authenticated;
GRANT SELECT ON optimization_dashboard TO authenticated;
GRANT SELECT ON component_performance_summary TO authenticated;
