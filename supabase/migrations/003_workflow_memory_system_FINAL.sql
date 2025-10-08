-- ================================================================================================
-- UNIVERSAL WORKFLOW MEMORY SYSTEM - PRODUCTION-READY MIGRATION
-- ================================================================================================
-- Description: Complete database schema for industry-agnostic AI workflow platform
-- Features: Vector embeddings, RAG, LangStruct, Ax/GEPA optimization, GraphRAG
-- Industries: Real Estate, Healthcare, Finance, Legal, Tech, Retail, Manufacturing, Education, Custom
-- Version: 1.0.0 FINAL
-- ================================================================================================

-- Enable required extensions (pgcrypto is more secure than uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ================================================================================================
-- CORE TABLES
-- ================================================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    roles TEXT[] DEFAULT '{}',
    security_level TEXT DEFAULT 'internal',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections table for organizing memories (universal, industry-agnostic)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Memories table with vector embeddings (main workflow data storage)
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks table (for RAG and LangStruct)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Query history for tracking and optimization
CREATE TABLE IF NOT EXISTS query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER,
    search_type TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI sessions for Ax/GEPA optimization tracking
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    optimization_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- LEGACY TABLES (for backward compatibility)
-- ================================================================================================

-- Vector embeddings table (legacy support)
CREATE TABLE IF NOT EXISTS vector_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base table (legacy support)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- INDEXES (Optimized for production performance)
-- ================================================================================================

-- Vector similarity indexes (IVFFlat with lists=100 for optimal performance)
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS vector_embeddings_embedding_idx ON vector_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Standard indexes for query performance
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS memories_collection_id_idx ON memories(collection_id);
CREATE INDEX IF NOT EXISTS memories_created_at_idx ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);
CREATE INDEX IF NOT EXISTS query_history_user_id_idx ON query_history(user_id);
CREATE INDEX IF NOT EXISTS query_history_created_at_idx ON query_history(created_at DESC);

-- ================================================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using DO block for conditional creation)
DO $$ 
BEGIN
    -- Users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_own') THEN
        CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_own') THEN
        CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Collections policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'collections_all_own') THEN
        CREATE POLICY collections_all_own ON collections FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Memories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'memories' AND policyname = 'memories_all_own') THEN
        CREATE POLICY memories_all_own ON memories FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'documents_all_own') THEN
        CREATE POLICY documents_all_own ON documents FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Query history policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'query_history' AND policyname = 'query_history_all_own') THEN
        CREATE POLICY query_history_all_own ON query_history FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- AI sessions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_sessions' AND policyname = 'ai_sessions_all_own') THEN
        CREATE POLICY ai_sessions_all_own ON ai_sessions FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ================================================================================================
-- FUNCTIONS (Production-optimized vector search)
-- ================================================================================================

-- Main function for workflow API calls (match_memories)
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
    source TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        memories.id,
        memories.content,
        memories.source,
        memories.metadata,
        1 - (memories.embedding <=> query_embedding) AS similarity
    FROM memories
    WHERE 1 - (memories.embedding <=> query_embedding) > match_threshold
        AND (filter_user_id IS NULL OR memories.user_id = filter_user_id)
        AND (filter_collection_id IS NULL OR memories.collection_id = filter_collection_id)
        AND (filter_source IS NULL OR memories.source = filter_source)
    ORDER BY memories.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Legacy function for vector similarity search
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
STABLE
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

-- Legacy function for knowledge base similarity search
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
STABLE
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

-- ================================================================================================
-- SAMPLE DATA (Multi-Industry Examples)
-- ================================================================================================

-- Insert test user
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

-- ================================================================================================
-- MIGRATION COMPLETE
-- ================================================================================================
-- Summary:
-- ✅ All tables created with gen_random_uuid() (secure UUIDs)
-- ✅ Vector indexes optimized with lists=100 (production-ready)
-- ✅ RLS policies enabled for security
-- ✅ Sample data for 8+ industries
-- ✅ Universal templates for custom workflows
-- ✅ All functions ready for workflow API calls
-- 
-- Next Steps:
-- 1. Test vector search: SELECT * FROM match_memories('[0.1, 0.2, ...]'::vector);
-- 2. Add your own data to collections and memories
-- 3. Customize workflows for your specific industry
-- ================================================================================================

