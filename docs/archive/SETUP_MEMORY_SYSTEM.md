# 🚀 Memory System Setup Guide

Quick setup instructions to get the memory system running.

## Prerequisites

- Supabase project
- OpenAI API key
- Anthropic API key (optional, for Claude models)
- Node.js 18+ and npm

## Step 1: Install Dependencies

```bash
cd frontend
npm install openai @anthropic-ai/sdk
```

## Step 2: Set Up Environment Variables

Create or update `.env.local` in the `frontend` directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI (required for embeddings)
OPENAI_API_KEY=your-openai-api-key

# Anthropic (optional, for Claude models)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Perplexity (optional, for web search)
PERPLEXITY_API_KEY=your-perplexity-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Run Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### Option B: Manual SQL Execution

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/002_vector_memory_system.sql`
4. Paste and run it in the SQL Editor

## Step 4: Enable pgvector Extension

In Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 5: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `documents`
3. Set up storage policies:

```sql
-- Allow users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own documents
CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 6: Deploy Supabase Edge Function

```bash
# Set environment variables for edge function
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy the ingest-document function
supabase functions deploy ingest-document
```

## Step 7: Test the System

### Test 1: Add a Memory

```bash
curl -X POST http://localhost:3000/api/memories/add \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog",
    "collection": "test",
    "userId": "test-user-id"
  }'
```

Expected response:
```json
{
  "success": true,
  "resource_id": "uuid-here",
  "collection": "test",
  "status": "ready"
}
```

### Test 2: Search Memories

```bash
curl -X POST http://localhost:3000/api/memories/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "quick fox",
    "sources": ["vault"],
    "options": {
      "vault": {
        "collection": "test"
      }
    },
    "userId": "test-user-id"
  }'
```

### Test 3: Generate Answer

```bash
curl -X POST http://localhost:3000/api/memories/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what animal is mentioned?",
    "sources": ["vault"],
    "answer": true,
    "userId": "test-user-id"
  }'
```

## Step 8: Verify Database

Check that tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('collections', 'memories', 'documents', 'document_chunks', 'query_history');
```

Check pgvector extension:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## Troubleshooting

### Issue: "vector type does not exist"
**Solution:** Make sure pgvector extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "relation 'collections' does not exist"
**Solution:** Run the migration again:
```bash
supabase db push
```

### Issue: "OpenAI API error"
**Solution:** 
1. Check that OPENAI_API_KEY is set correctly
2. Verify your OpenAI account has credits
3. Check API key permissions

### Issue: "Storage bucket not found"
**Solution:**
1. Create the `documents` bucket in Supabase Dashboard
2. Set up storage policies (see Step 5)

### Issue: "Edge function error"
**Solution:**
1. Check edge function logs: `supabase functions logs ingest-document`
2. Verify environment variables are set
3. Redeploy: `supabase functions deploy ingest-document`

## Next Steps

1. **Read the Documentation**
   - Check out `MEMORY_SYSTEM_GUIDE.md` for full API reference
   - See `MEMORY_EXAMPLES.md` for usage examples

2. **Try the SDK**
   ```typescript
   import { addMemory, searchMemories } from '@/lib/memory-client';
   
   // Add a memory
   await addMemory({
     text: "Your content",
     collection: "my-collection",
     userId: user.id
   });
   
   // Search
   const results = await searchMemories({
     query: "search query",
     sources: ["vault"],
     answer: true,
     userId: user.id
   });
   ```

3. **Integrate with Your App**
   - Use the React hooks from `MEMORY_EXAMPLES.md`
   - Connect with your existing GEPA/AX stack
   - Build intelligent memory-powered features

## Production Deployment

### Vercel Environment Variables

Add these to your Vercel project:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Supabase Production Setup

1. Enable pgvector in production
2. Run migrations
3. Deploy edge functions
4. Set up storage bucket
5. Configure RLS policies

## Cost Estimates

### OpenAI Embeddings
- Model: `text-embedding-3-small`
- Cost: $0.02 / 1M tokens (~$0.00002 per embedding)
- Example: 10,000 documents @ 500 tokens each = $0.10

### Claude API (Answer Generation)
- Haiku: $0.25 / 1M input tokens, $1.25 / 1M output tokens
- Sonnet: $3 / 1M input tokens, $15 / 1M output tokens
- Example: 1,000 queries with Haiku = ~$0.50

### Supabase
- Free tier: 500MB database, 1GB storage
- Pro tier: $25/month (8GB database, 100GB storage)

### Total Estimated Cost
- Small app (1,000 queries/month): ~$1-2/month
- Medium app (10,000 queries/month): ~$10-20/month
- Large app (100,000 queries/month): ~$100-200/month

## Support

If you run into issues:

1. Check the troubleshooting section above
2. Review the error messages in the console
3. Check Supabase logs for database/function errors
4. Verify all environment variables are set correctly

---

**🎉 You're ready to build intelligent memory-powered applications!**

