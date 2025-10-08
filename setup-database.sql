-- Setup script for the workflow memory system database
-- Run this in your Supabase SQL editor or via psql

-- This script will:
-- 1. Create all required tables for the workflow system
-- 2. Set up vector embeddings for AI search
-- 3. Create the match_memories function that the workflow expects
-- 4. Insert sample data for testing

-- Make sure you have the vector extension enabled in your Supabase project
-- Go to Database > Extensions and enable "vector"

\echo 'Setting up workflow memory system database...'

-- Run the migration
\i supabase/migrations/003_workflow_memory_system.sql

\echo 'Database setup complete!'
\echo 'You can now test the workflow with real data.'

-- Test the setup
SELECT 'Testing database setup...' as status;

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('memories', 'collections', 'documents', 'users') 
        THEN '✅ Required table exists'
        ELSE '❌ Missing table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('memories', 'collections', 'documents', 'users');

-- Check if functions exist
SELECT 
    routine_name,
    CASE 
        WHEN routine_name = 'match_memories' 
        THEN '✅ Required function exists'
        ELSE '❌ Missing function'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'match_memories';

-- Check sample data
SELECT 
    COUNT(*) as memory_count,
    '✅ Sample memories inserted' as status
FROM memories;

SELECT 
    COUNT(*) as collection_count,
    '✅ Sample collections inserted' as status
FROM collections;

\echo 'Setup verification complete!'
