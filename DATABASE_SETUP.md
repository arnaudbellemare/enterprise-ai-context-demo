# Database Setup for Workflow System

## Overview
This guide will help you set up the Supabase database with the correct schema for the workflow system to work with real data instead of mock data.

## Prerequisites
- ✅ Supabase project created
- ✅ Database credentials configured in `.env.local`
- ✅ Vector extension enabled in Supabase

## Step 1: Enable Vector Extension

1. Go to your Supabase dashboard
2. Navigate to **Database** → **Extensions**
3. Find **vector** and click **Enable**
4. Wait for it to be enabled (this may take a few minutes)

## Step 2: Run Database Migration

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/003_workflow_memory_system.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

### Option B: Using psql (Advanced)

```bash
# Connect to your Supabase database
psql "postgres://postgres.ofvbywlqztkgugrkibcp:2B6CrtZ0kQ2vf1ty@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Run the migration
\i supabase/migrations/003_workflow_memory_system.sql
```

## Step 3: Verify Setup

Run this query in the SQL Editor to verify everything is set up correctly:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('memories', 'collections', 'documents', 'users');

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'match_memories';

-- Check sample data
SELECT COUNT(*) as memory_count FROM memories;
SELECT COUNT(*) as collection_count FROM collections;
```

## What This Migration Creates

### Core Tables
- **`memories`** - Stores memory items with vector embeddings for AI search
- **`collections`** - Organizes memories into logical groups
- **`documents`** - Manages uploaded documents
- **`document_chunks`** - Stores processed document pieces
- **`query_history`** - Tracks search queries and results

### Key Functions
- **`match_memories()`** - The function your workflow API calls for vector search
- **`match_embeddings()`** - General vector similarity search
- **`match_knowledge()`** - Knowledge base search

### Sample Data
- Test user account
- "properties" collection for real estate data
- Sample property records for testing

## Testing the Workflow

After running the migration:

1. **Go to** http://localhost:3000/workflow
2. **Click** "Load Example"
3. **Turn OFF Demo Mode**
4. **Click Execute**

The workflow should now:
- ✅ Use **real Supabase data** for Property Database
- ✅ Use **real context assembly** (if Edge Functions are deployed)
- ✅ Use **mock data** for Market Research (until Perplexity is configured)
- ✅ Use **real AI analysis** with OpenRouter

## Next Steps

### To Enable Real Market Research:
1. Get a Perplexity API key
2. Update `PERPLEXITY_API_KEY` in `.env.local`
3. Restart the server

### To Enable Real Context Assembly:
1. Deploy the Edge Functions to Supabase
2. The context assembly will automatically use real data

### To Add More Property Data:
```sql
INSERT INTO memories (user_id, collection_id, content, source, metadata) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'Your property description here',
    'manual',
    '{"type": "property", "location": "Miami", "price": 1500000}'
);
```

## Troubleshooting

### "Vector extension not found"
- Make sure you enabled the vector extension in Supabase
- Wait a few minutes for it to fully activate

### "Function match_memories does not exist"
- Re-run the migration script
- Check that the function was created successfully

### "Permission denied"
- Make sure your Supabase credentials are correct
- Check that RLS policies are set up properly

### Still getting mock data
- Restart your Next.js server after updating environment variables
- Check the browser console for error messages
- Verify the database connection is working

## Support

If you encounter issues:
1. Check the terminal logs for error messages
2. Verify your Supabase credentials in `.env.local`
3. Make sure all required tables and functions exist
4. Test individual API endpoints to isolate the issue
