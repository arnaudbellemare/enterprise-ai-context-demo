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
CREATE POLICY IF NOT EXISTS "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can manage their own collections" ON collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can manage their own memories" ON memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can manage their own documents" ON documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can manage their own document chunks" ON document_chunks FOR ALL USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = document_chunks.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "Users can view their own query history" ON query_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own query history" ON query_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view their own context items" ON context_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own context items" ON context_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view their own sessions" ON ai_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own sessions" ON ai_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Public metrics are viewable" ON metrics FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert metrics" ON metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Public knowledge base is viewable" ON knowledge_base FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert knowledge" ON knowledge_base FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Public embeddings are viewable" ON vector_embeddings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert embeddings" ON vector_embeddings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Users can view their own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

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

-- Insert some sample data for testing
INSERT INTO users (id, email, username) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'testuser')
ON CONFLICT (email) DO NOTHING;

INSERT INTO collections (id, user_id, name, description) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'properties', 'Real estate property database')
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO memories (id, user_id, collection_id, content, source, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Luxury condo in Miami Beach - 2BR/2BA, 1,200 sq ft, ocean view, $1.2M', 'manual', '{"type": "property", "location": "Miami Beach", "price": 1200000}'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Penthouse in Brickell - 3BR/3BA, 2,000 sq ft, city view, $2.5M', 'manual', '{"type": "property", "location": "Brickell", "price": 2500000}'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Market trend: Miami luxury real estate up 15% year-over-year', 'market_research', '{"type": "trend", "market": "Miami", "change": "+15%"}')
ON CONFLICT (id) DO NOTHING;
