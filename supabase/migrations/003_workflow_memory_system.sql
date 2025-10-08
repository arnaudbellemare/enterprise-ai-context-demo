-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table (keep existing)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    roles TEXT[] DEFAULT '{}',
    security_level TEXT DEFAULT 'internal',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections table for organizing memories
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Memories table with vector embeddings (this is what the workflow expects)
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    source TEXT DEFAULT 'manual',
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table for document processing pipeline
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks table for processed document pieces
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query history table for tracking searches
CREATE TABLE IF NOT EXISTS query_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    sources TEXT[] DEFAULT '{}',
    processing_time INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keep existing tables for backward compatibility
CREATE TABLE IF NOT EXISTS context_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id TEXT,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    relevance_score FLOAT DEFAULT 0.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_name TEXT,
    context_data JSONB DEFAULT '{}',
    gepa_optimizations JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    value FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',
    source TEXT,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vector_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_collection_id ON memories(collection_id);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_context_items_user_id ON context_items(user_id);
CREATE INDEX IF NOT EXISTS idx_context_items_session_id ON context_items(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding ON vector_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    -- Users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own data') THEN
        CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
        CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Collections policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can manage their own collections') THEN
        CREATE POLICY "Users can manage their own collections" ON collections FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Memories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memories' AND policyname = 'Users can manage their own memories') THEN
        CREATE POLICY "Users can manage their own memories" ON memories FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can manage their own documents') THEN
        CREATE POLICY "Users can manage their own documents" ON documents FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Document chunks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_chunks' AND policyname = 'Users can manage their own document chunks') THEN
        CREATE POLICY "Users can manage their own document chunks" ON document_chunks FOR ALL USING (
            EXISTS (SELECT 1 FROM documents WHERE documents.id = document_chunks.document_id AND documents.user_id = auth.uid())
        );
    END IF;

    -- Query history policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'query_history' AND policyname = 'Users can view their own query history') THEN
        CREATE POLICY "Users can view their own query history" ON query_history FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'query_history' AND policyname = 'Users can insert their own query history') THEN
        CREATE POLICY "Users can insert their own query history" ON query_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Context items policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'context_items' AND policyname = 'Users can view their own context items') THEN
        CREATE POLICY "Users can view their own context items" ON context_items FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'context_items' AND policyname = 'Users can insert their own context items') THEN
        CREATE POLICY "Users can insert their own context items" ON context_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- AI sessions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_sessions' AND policyname = 'Users can view their own sessions') THEN
        CREATE POLICY "Users can view their own sessions" ON ai_sessions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_sessions' AND policyname = 'Users can insert their own sessions') THEN
        CREATE POLICY "Users can insert their own sessions" ON ai_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Metrics policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metrics' AND policyname = 'Public metrics are viewable') THEN
        CREATE POLICY "Public metrics are viewable" ON metrics FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metrics' AND policyname = 'Authenticated users can insert metrics') THEN
        CREATE POLICY "Authenticated users can insert metrics" ON metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Knowledge base policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base' AND policyname = 'Public knowledge base is viewable') THEN
        CREATE POLICY "Public knowledge base is viewable" ON knowledge_base FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base' AND policyname = 'Authenticated users can insert knowledge') THEN
        CREATE POLICY "Authenticated users can insert knowledge" ON knowledge_base FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Vector embeddings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vector_embeddings' AND policyname = 'Public embeddings are viewable') THEN
        CREATE POLICY "Public embeddings are viewable" ON vector_embeddings FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vector_embeddings' AND policyname = 'Authenticated users can insert embeddings') THEN
        CREATE POLICY "Authenticated users can insert embeddings" ON vector_embeddings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Audit logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Users can view their own audit logs') THEN
        CREATE POLICY "Users can view their own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'System can insert audit logs') THEN
        CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Create the match_memories function that the workflow API expects
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_user_id UUID DEFAULT NULL,
    filter_collection_id UUID DEFAULT NULL,
    filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT
        memories.id,
        memories.content,
        memories.metadata,
        1 - (memories.embedding <=> query_embedding) AS similarity
    FROM memories
    WHERE 
        1 - (memories.embedding <=> query_embedding) > match_threshold
        AND (filter_user_id IS NULL OR memories.user_id = filter_user_id)
        AND (filter_collection_id IS NULL OR memories.collection_id = filter_collection_id)
        AND (filter_source IS NULL OR memories.source = filter_source)
    ORDER BY memories.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create function for vector similarity search (keep existing)
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT
        vector_embeddings.id,
        vector_embeddings.content,
        vector_embeddings.metadata,
        1 - (vector_embeddings.embedding <=> query_embedding) AS similarity
    FROM vector_embeddings
    WHERE 1 - (vector_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY vector_embeddings.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create function for knowledge base similarity search (keep existing)
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    source TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT
        knowledge_base.id,
        knowledge_base.title,
        knowledge_base.content,
        knowledge_base.source,
        knowledge_base.metadata,
        1 - (knowledge_base.embedding <=> query_embedding) AS similarity
    FROM knowledge_base
    WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
    ORDER BY knowledge_base.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Insert sample data for testing (UNIVERSAL SYSTEM - Works for ANY Industry)
INSERT INTO users (id, email, username) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'testuser')
ON CONFLICT (email) DO NOTHING;

-- Create UNIVERSAL collections that work for ANY industry workflow
INSERT INTO collections (id, user_id, name, description, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Web Research', 'Live data from internet search (any topic)', '{"type": "research", "source": "perplexity", "flexibility": "universal", "industries": ["real_estate", "healthcare", "finance", "tech", "legal", "retail", "any"]}'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Internal Database', 'Your proprietary data and records (any format)', '{"type": "database", "source": "internal", "flexibility": "universal", "data_types": ["structured", "unstructured", "documents", "metrics", "any"]}'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'Analysis & Insights', 'Consolidated analysis from multiple sources', '{"type": "analysis", "source": "ai_consolidated", "flexibility": "universal", "methods": ["statistical", "qualitative", "predictive", "descriptive", "any"]}'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 'Final Reports', 'Generated reports and recommendations', '{"type": "reports", "source": "ai_generated", "flexibility": "universal", "formats": ["executive_summary", "technical", "presentation", "dashboard", "any"]}'),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440000', 'Industry Templates', 'Pre-built templates for common industries', '{"type": "templates", "source": "system", "available": ["real_estate", "healthcare", "legal", "finance", "tech", "retail", "custom"]}')
ON CONFLICT (user_id, name) DO NOTHING;

-- Insert MULTI-INDUSTRY sample data (demonstrates universal flexibility)
INSERT INTO memories (id, user_id, collection_id, content, source, metadata) VALUES 

-- REAL ESTATE EXAMPLE (Industry 1)
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Miami luxury condo market shows 15.2% YoY growth in Q4 2024, driven by international buyers and limited inventory', 'perplexity', '{"industry": "real_estate", "type": "market_data", "location": "miami", "metric": "growth_rate", "value": "15.2%", "source": "web_search"}'),

-- HEALTHCARE EXAMPLE (Industry 2)
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'AI-powered diagnostic tools show 23% improvement in early cancer detection, FDA approval pending Q1 2025', 'perplexity', '{"industry": "healthcare", "type": "medical_tech", "improvement": "23%", "regulatory_status": "pending_approval", "source": "web_search"}'),

-- FINANCE/FINTECH EXAMPLE (Industry 3)
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Global cryptocurrency adoption reaches 420M users, institutional investment up 68% year-over-year', 'perplexity', '{"industry": "finance", "type": "crypto_trends", "user_base": "420M", "institutional_growth": "68%", "source": "web_search"}'),

-- TECHNOLOGY/AI EXAMPLE (Industry 4)
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Enterprise AI adoption accelerates: 73% of Fortune 500 companies now using LLMs for operations, productivity gains average 31%', 'perplexity', '{"industry": "technology", "type": "ai_adoption", "adoption_rate": "73%", "productivity_gain": "31%", "target": "fortune_500", "source": "web_search"}'),

-- LEGAL/COMPLIANCE EXAMPLE (Industry 5)
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'New EU AI Act regulations require compliance by Aug 2025, affecting 15K+ companies, legal tech solutions in high demand', 'perplexity', '{"industry": "legal", "type": "regulatory_compliance", "deadline": "2025-08", "affected_companies": "15000+", "demand": "high", "source": "web_search"}'),

-- RETAIL/E-COMMERCE EXAMPLE (Industry 6)
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', 'Holiday e-commerce sales surge 19% globally, AI personalization drives 42% of conversions, mobile commerce dominates', 'perplexity', '{"industry": "retail", "type": "ecommerce_trends", "sales_growth": "19%", "ai_conversion": "42%", "channel": "mobile", "source": "web_search"}'),

-- MANUFACTURING/SUPPLY CHAIN EXAMPLE (Industry 7)
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', 'AI-driven supply chain optimization reduces costs 27%, predictive maintenance prevents 89% of critical failures', 'perplexity', '{"industry": "manufacturing", "type": "supply_chain", "cost_reduction": "27%", "failure_prevention": "89%", "technology": "predictive_ai", "source": "web_search"}'),

-- EDUCATION/EDTECH EXAMPLE (Industry 8)
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', 'AI tutoring platforms show 34% better learning outcomes, personalized education reaches 12M students globally', 'perplexity', '{"industry": "education", "type": "edtech", "improvement": "34%", "student_reach": "12M", "method": "personalized_ai", "source": "web_search"}'),

-- CONSOLIDATED ANALYSIS EXAMPLES (Multi-Industry)
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440006', 'Cross-industry AI adoption analysis: Average ROI of 156%, implementation time reduced from 18 to 6 months with modern tools', 'ai_analysis', '{"type": "cross_industry_analysis", "avg_roi": "156%", "implementation_reduction": "67%", "trend": "accelerating", "source": "consolidated"}'),

-- UNIVERSAL REPORT TEMPLATE (Works for ANY industry)
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440007', 'EXECUTIVE SUMMARY TEMPLATE: [Industry] shows [metric]% growth driven by [key_factors]. Recommended actions: [recommendations]. Projected ROI: [roi]% over [timeframe] months', 'system_template', '{"type": "executive_summary_template", "flexibility": "universal", "customizable_fields": ["industry", "metric", "key_factors", "recommendations", "roi", "timeframe"], "source": "ai_generated"}'),

-- INDUSTRY TEMPLATE CATALOG
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440019', 'Real Estate Analysis Template: Market Research → Property Database → Competitive Analysis → Investment Recommendations', 'system_template', '{"template": "real_estate", "nodes": ["market_research", "property_db", "comp_analysis", "recommendations"], "customizable": true}'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440019', 'Healthcare Workflow Template: Medical Research → Patient Data → Clinical Analysis → Treatment Recommendations', 'system_template', '{"template": "healthcare", "nodes": ["medical_research", "patient_db", "clinical_analysis", "treatment_plan"], "customizable": true, "compliance": ["HIPAA", "GDPR"]}'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440019', 'Financial Analysis Template: Market Data → Portfolio Analysis → Risk Assessment → Investment Strategy', 'system_template', '{"template": "finance", "nodes": ["market_data", "portfolio_analysis", "risk_assessment", "strategy"], "customizable": true, "compliance": ["SEC", "FINRA"]}'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440019', 'Legal Research Template: Case Law Search → Document Analysis → Compliance Check → Legal Brief Generation', 'system_template', '{"template": "legal", "nodes": ["case_law", "doc_analysis", "compliance", "brief_gen"], "customizable": true, "jurisdictions": ["US", "EU", "UK", "custom"]}'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440019', 'Custom Industry Template: [Web Research] → [Your Database] → [Analysis] → [Final Report] - Fully adaptable to ANY use case', 'system_template', '{"template": "custom", "nodes": ["web_search", "internal_db", "analysis", "report"], "customizable": true, "industries": ["any"], "note": "Start here for any industry not listed"}')
ON CONFLICT (id) DO NOTHING;
