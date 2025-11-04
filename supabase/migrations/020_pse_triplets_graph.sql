-- Migration: Problem-Solution-Effect Triplets for Graph-Based Pathfinding
-- Based on GAMP framework: Store structured P-S-E triplets extracted during chunk enrichment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Problem-Solution-Effect Triplets table
CREATE TABLE IF NOT EXISTS pse_triplets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to source chunk
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    
    -- P-S-E triplet content
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    effect TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Metadata
    domain TEXT,
    entities TEXT[] DEFAULT ARRAY[]::TEXT[],
    relations TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Graph pathfinding fields
    problem_node_id UUID,
    solution_node_id UUID,
    effect_node_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Graph Nodes table (for pathfinding)
CREATE TABLE IF NOT EXISTS graph_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Node identification
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('problem', 'solution', 'effect', 'entity')),
    
    -- Normalized form (for entity deduplication)
    normalized_label TEXT,
    
    -- Metadata
    domain TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Graph statistics
    in_degree INTEGER DEFAULT 0,
    out_degree INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: same label + type should be same node
    UNIQUE(label, type, domain)
);

-- Graph Edges table (for pathfinding)
CREATE TABLE IF NOT EXISTS graph_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Edge endpoints
    from_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    
    -- Relation type
    relation TEXT NOT NULL, -- 'studied_via', 'causes', 'inhibits', 'produces', etc.
    
    -- Edge properties
    weight FLOAT DEFAULT 1.0,
    confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Source triplet
    triplet_id UUID REFERENCES pse_triplets(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: same edge should not be duplicated
    UNIQUE(from_node_id, to_node_id, relation)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pse_triplets_chunk_id ON pse_triplets(chunk_id);
CREATE INDEX IF NOT EXISTS idx_pse_triplets_document_id ON pse_triplets(document_id);
CREATE INDEX IF NOT EXISTS idx_pse_triplets_domain ON pse_triplets(domain);
CREATE INDEX IF NOT EXISTS idx_pse_triplets_confidence ON pse_triplets(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_pse_triplets_created_at ON pse_triplets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_label ON graph_nodes(label);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_domain ON graph_nodes(domain);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_normalized ON graph_nodes(normalized_label);

CREATE INDEX IF NOT EXISTS idx_graph_edges_from ON graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_to ON graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_relation ON graph_edges(relation);
CREATE INDEX IF NOT EXISTS idx_graph_edges_triplet ON graph_edges(triplet_id);

-- Function to automatically create/update graph nodes when triplets are inserted
CREATE OR REPLACE FUNCTION create_graph_nodes_from_triplet()
RETURNS TRIGGER AS $$
DECLARE
    problem_node UUID;
    solution_node UUID;
    effect_node UUID;
    domain_val TEXT;
BEGIN
    domain_val := COALESCE(NEW.domain, 'general');
    
    -- Create or get problem node
    INSERT INTO graph_nodes (label, type, domain, normalized_label)
    VALUES (NEW.problem, 'problem', domain_val, LOWER(TRIM(NEW.problem)))
    ON CONFLICT (label, type, domain) DO UPDATE
    SET updated_at = NOW()
    RETURNING id INTO problem_node;
    
    SELECT id INTO problem_node FROM graph_nodes 
    WHERE label = NEW.problem AND type = 'problem' AND domain = domain_val;
    
    -- Create or get solution node
    INSERT INTO graph_nodes (label, type, domain, normalized_label)
    VALUES (NEW.solution, 'solution', domain_val, LOWER(TRIM(NEW.solution)))
    ON CONFLICT (label, type, domain) DO UPDATE
    SET updated_at = NOW()
    RETURNING id INTO solution_node;
    
    SELECT id INTO solution_node FROM graph_nodes 
    WHERE label = NEW.solution AND type = 'solution' AND domain = domain_val;
    
    -- Create or get effect node
    INSERT INTO graph_nodes (label, type, domain, normalized_label)
    VALUES (NEW.effect, 'effect', domain_val, LOWER(TRIM(NEW.effect)))
    ON CONFLICT (label, type, domain) DO UPDATE
    SET updated_at = NOW()
    RETURNING id INTO effect_node;
    
    SELECT id INTO effect_node FROM graph_nodes 
    WHERE label = NEW.effect AND type = 'effect' AND domain = domain_val;
    
    -- Update triplet with node IDs
    UPDATE pse_triplets
    SET problem_node_id = problem_node,
        solution_node_id = solution_node,
        effect_node_id = effect_node
    WHERE id = NEW.id;
    
    -- Create edges
    INSERT INTO graph_edges (from_node_id, to_node_id, relation, confidence, triplet_id)
    VALUES 
        (problem_node, solution_node, 'studied_via', NEW.confidence, NEW.id),
        (solution_node, effect_node, 
         CASE 
             WHEN NEW.relations && ARRAY['causes'] THEN 'causes'
             WHEN NEW.relations && ARRAY['inhibits'] THEN 'inhibits'
             ELSE 'produces'
         END,
         NEW.confidence, NEW.id)
    ON CONFLICT (from_node_id, to_node_id, relation) DO UPDATE
    SET confidence = GREATEST(EXCLUDED.confidence, graph_edges.confidence),
        updated_at = NOW();
    
    -- Update node degrees
    UPDATE graph_nodes SET out_degree = out_degree + 1 WHERE id = problem_node;
    UPDATE graph_nodes SET in_degree = in_degree + 1 WHERE id = solution_node;
    UPDATE graph_nodes SET out_degree = out_degree + 1 WHERE id = solution_node;
    UPDATE graph_nodes SET in_degree = in_degree + 1 WHERE id = effect_node;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create graph nodes when triplet is inserted
CREATE TRIGGER trigger_create_graph_nodes
AFTER INSERT ON pse_triplets
FOR EACH ROW
EXECUTE FUNCTION create_graph_nodes_from_triplet();

-- Function to find paths between nodes (BFS-like)
CREATE OR REPLACE FUNCTION find_paths_between_nodes(
    start_node_id UUID,
    end_node_id UUID,
    max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
    path_id INTEGER,
    node_id UUID,
    node_label TEXT,
    node_type TEXT,
    depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE path_search AS (
        -- Start node
        SELECT 
            1 as path_id,
            start_node_id as node_id,
            n.label as node_label,
            n.type as node_type,
            0 as depth,
            ARRAY[start_node_id] as visited
        FROM graph_nodes n
        WHERE n.id = start_node_id
        
        UNION ALL
        
        -- Recursive: find next nodes
        SELECT 
            ps.path_id,
            e.to_node_id as node_id,
            n.label as node_label,
            n.type as node_type,
            ps.depth + 1 as depth,
            ps.visited || e.to_node_id as visited
        FROM path_search ps
        JOIN graph_edges e ON e.from_node_id = ps.node_id
        JOIN graph_nodes n ON n.id = e.to_node_id
        WHERE ps.depth < max_depth
          AND e.to_node_id = ANY(ps.visited) = FALSE  -- Avoid cycles
          AND (end_node_id IS NULL OR e.to_node_id != end_node_id OR ps.depth + 1 <= max_depth)
    )
    SELECT 
        path_id,
        node_id,
        node_label,
        node_type,
        depth
    FROM path_search
    WHERE end_node_id IS NULL OR (node_id = end_node_id AND depth <= max_depth)
    ORDER BY path_id, depth;
END;
$$ LANGUAGE plpgsql;

-- Function to get graph statistics
CREATE OR REPLACE FUNCTION get_graph_statistics(domain_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    total_nodes INTEGER,
    total_edges INTEGER,
    problem_nodes INTEGER,
    solution_nodes INTEGER,
    effect_nodes INTEGER,
    entity_nodes INTEGER,
    average_node_degree NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT n.id)::INTEGER as total_nodes,
        COUNT(DISTINCT e.id)::INTEGER as total_edges,
        COUNT(DISTINCT CASE WHEN n.type = 'problem' THEN n.id END)::INTEGER as problem_nodes,
        COUNT(DISTINCT CASE WHEN n.type = 'solution' THEN n.id END)::INTEGER as solution_nodes,
        COUNT(DISTINCT CASE WHEN n.type = 'effect' THEN n.id END)::INTEGER as effect_nodes,
        COUNT(DISTINCT CASE WHEN n.type = 'entity' THEN n.id END)::INTEGER as entity_nodes,
        CASE 
            WHEN COUNT(DISTINCT n.id) > 0 
            THEN (COUNT(DISTINCT e.id)::NUMERIC / COUNT(DISTINCT n.id)::NUMERIC)
            ELSE 0
        END as average_node_degree
    FROM graph_nodes n
    LEFT JOIN graph_edges e ON e.from_node_id = n.id OR e.to_node_id = n.id
    WHERE domain_filter IS NULL OR n.domain = domain_filter;
END;
$$ LANGUAGE plpgsql;

-- Function to get neighbors of a node
CREATE OR REPLACE FUNCTION get_node_neighbors(node_id_param UUID)
RETURNS TABLE (
    neighbor_id UUID,
    neighbor_label TEXT,
    neighbor_type TEXT,
    relation TEXT,
    edge_confidence FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id as neighbor_id,
        n.label as neighbor_label,
        n.type as neighbor_type,
        e.relation as relation,
        e.confidence as edge_confidence
    FROM graph_edges e
    JOIN graph_nodes n ON (
        (e.from_node_id = node_id_param AND n.id = e.to_node_id) OR
        (e.to_node_id = node_id_param AND n.id = e.from_node_id)
    )
    ORDER BY e.confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- Update document_chunks to include P-S-E metadata
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS pse_triplet_id UUID REFERENCES pse_triplets(id) ON DELETE SET NULL;

-- Index for document_chunks P-S-E lookup
CREATE INDEX IF NOT EXISTS idx_document_chunks_pse_triplet ON document_chunks(pse_triplet_id);

COMMENT ON TABLE pse_triplets IS 'Problem-Solution-Effect triplets extracted from enriched chunks (GAMP framework)';
COMMENT ON TABLE graph_nodes IS 'Graph nodes for knowledge graph pathfinding';
COMMENT ON TABLE graph_edges IS 'Graph edges connecting nodes for pathfinding';
COMMENT ON FUNCTION find_paths_between_nodes IS 'Find paths between two nodes using BFS-like algorithm';
COMMENT ON FUNCTION get_graph_statistics IS 'Get statistics about the knowledge graph';
COMMENT ON FUNCTION get_node_neighbors IS 'Get neighbors of a specific node';

