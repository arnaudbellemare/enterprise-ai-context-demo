# Supabase Setup Guide

## Issue: "Supabase not available" warnings

The ReasoningBank and other components need Supabase credentials to persist data. Currently, you have `POSTGRES_URL` but need the Supabase API keys.

## Required Environment Variables

### Option 1: Extract from Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com/project/ofvbywlqztkgugrkibcp
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL**: `https://ofvbywlqztkgugrkibcp.supabase.co`
   - **Service Role Key** (for server-side): `SUPABASE_SERVICE_ROLE_KEY`
   - **Anon Key** (for client-side): `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option 2: Add to `.env`

Add these to your `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ofvbywlqztkgugrkibcp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note**: The URL can be auto-extracted from `POSTGRES_URL`, but you still need the API keys.

## What Changed

The code now:
1. ✅ Extracts Supabase URL from `POSTGRES_URL` if `NEXT_PUBLIC_SUPABASE_URL` is not set
2. ✅ Checks multiple environment variable names for API keys
3. ✅ Provides clear warnings about what's missing

## What You Need to Do

1. **Get your Supabase API keys** from the dashboard (see Option 1)
2. **Add them to `.env`**:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Your service role key
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Your anon key
   ```
3. **Restart your test/application** to pick up the new env vars

## Verification

After adding the keys, you should see:
```
✅ ReasoningBank: Supabase client initialized
```

Instead of:
```
⚠️ ReasoningBank: Supabase URL not found...
⚠️ ReasoningBank: Supabase API key not found...
```

## Why This Matters

Without Supabase:
- ❌ Memories are only stored in-memory (lost on restart)
- ❌ ReasoningBank experiences aren't persisted
- ❌ Tool synthesis repositories aren't saved
- ❌ Expert trajectories aren't stored

With Supabase:
- ✅ Persistent memory across restarts
- ✅ Vector similarity search for memory retrieval
- ✅ Long-term learning and knowledge accumulation
- ✅ Production-ready data persistence

---

**Quick Fix**: Just add the API keys to `.env` and restart!

