-- Quick check of your current database state
-- (Run this FIRST if you want to see what exists)

-- 1. Check existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check existing extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pgcrypto', 'vector', 'uuid-ossp');

-- 3. Check if collections table exists and has data
SELECT COUNT(*) as collections_count FROM collections;

-- 4. Check if memories table exists and has data
SELECT COUNT(*) as memories_count FROM memories;
