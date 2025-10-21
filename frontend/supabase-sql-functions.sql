-- Supabase SQL Functions for SQL Editor
-- Run these in your Supabase SQL editor to enable the SQL editor functionality

-- Function to execute SQL queries safely
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    query_type TEXT;
BEGIN
    -- Get the first word to determine query type
    query_type := UPPER(TRIM(SPLIT_PART(sql_query, ' ', 1)));
    
    -- Basic security checks
    IF query_type IN ('DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE', 'DELETE') THEN
        -- For safety, we'll use a more restrictive approach
        -- You might want to adjust this based on your needs
        RAISE EXCEPTION 'Direct execution of % queries is not allowed. Use Supabase client methods instead.', query_type;
    END IF;
    
    -- For SELECT queries, use dynamic SQL
    IF query_type = 'SELECT' THEN
        EXECUTE format('SELECT json_agg(t) FROM (%s) t', sql_query) INTO result;
        RETURN COALESCE(result, '[]'::json);
    ELSE
        RAISE EXCEPTION 'Only SELECT queries are supported by this function';
    END IF;
END;
$$;

-- Function to get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE (
    index_name TEXT,
    column_name TEXT,
    is_unique BOOLEAN,
    index_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexname::TEXT,
        a.attname::TEXT,
        i.indexdef LIKE '%UNIQUE%',
        CASE 
            WHEN i.indexdef LIKE '%btree%' THEN 'btree'
            WHEN i.indexdef LIKE '%hash%' THEN 'hash'
            WHEN i.indexdef LIKE '%gin%' THEN 'gin'
            WHEN i.indexdef LIKE '%gist%' THEN 'gist'
            ELSE 'other'
        END::TEXT
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_index ix ON ix.indexrelid = c.oid
    JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ANY(ix.indkey)
    WHERE i.tablename = table_name
    AND i.schemaname = 'public';
END;
$$;

-- Function to get table foreign keys
CREATE OR REPLACE FUNCTION get_table_foreign_keys(table_name TEXT)
RETURNS TABLE (
    constraint_name TEXT,
    column_name TEXT,
    foreign_table_name TEXT,
    foreign_column_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.constraint_name::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT,
        ccu.column_name::TEXT
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = table_name
    AND tc.table_schema = 'public';
END;
$$;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats(table_name TEXT)
RETURNS TABLE (
    total_rows BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    row_count BIGINT;
    table_size_bytes BIGINT;
    index_size_bytes BIGINT;
    total_size_bytes BIGINT;
BEGIN
    -- Get row count
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
    
    -- Get table size
    SELECT pg_total_relation_size(format('%I', table_name)) INTO total_size_bytes;
    SELECT pg_relation_size(format('%I', table_name)) INTO table_size_bytes;
    SELECT total_size_bytes - table_size_bytes INTO index_size_bytes;
    
    RETURN QUERY SELECT 
        row_count,
        pg_size_pretty(table_size_bytes)::TEXT,
        pg_size_pretty(index_size_bytes)::TEXT,
        pg_size_pretty(total_size_bytes)::TEXT;
END;
$$;

-- Function to explain query execution plan
CREATE OR REPLACE FUNCTION explain_query(sql_query TEXT)
RETURNS TABLE (
    plan_line TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('EXPLAIN (FORMAT JSON, ANALYZE) %s', sql_query);
END;
$$;

-- Function to validate SQL syntax
CREATE OR REPLACE FUNCTION validate_sql_syntax(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    BEGIN
        -- Try to parse the query
        PERFORM pg_parse_sql(sql_query);
        
        result := json_build_object(
            'valid', true,
            'error', null
        );
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'valid', false,
            'error', SQLERRM
        );
    END;
    
    RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_foreign_keys(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION explain_query(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_sql_syntax(TEXT) TO authenticated;

-- Create a view for easy access to table information
CREATE OR REPLACE VIEW table_info_view AS
SELECT 
    t.table_name,
    t.table_type,
    t.table_schema,
    CASE 
        WHEN t.table_type = 'BASE TABLE' THEN 'Table'
        WHEN t.table_type = 'VIEW' THEN 'View'
        ELSE t.table_type
    END as display_type,
    COALESCE(
        (SELECT COUNT(*) 
         FROM information_schema.columns c 
         WHERE c.table_name = t.table_name 
         AND c.table_schema = t.table_schema), 
        0
    ) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- Grant access to the view
GRANT SELECT ON table_info_view TO authenticated;

-- Create a more comprehensive table details view
CREATE OR REPLACE VIEW detailed_table_info AS
SELECT 
    t.table_name,
    t.table_type,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.ordinal_position,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN true
        ELSE false
    END as is_primary_key,
    CASE 
        WHEN fk.column_name IS NOT NULL THEN true
        ELSE false
    END as is_foreign_key
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku 
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON t.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku 
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON t.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- Grant access to the detailed view
GRANT SELECT ON detailed_table_info TO authenticated;
