# How to Run Supabase Migration

## Quick Steps

### Option 1: Via Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/ofvbywlqztkgugrkibcp
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Paste Migration**
   - Copy all content from: `supabase/migrations/012_brain_skill_metrics.sql`
   - Paste into SQL editor

4. **Run Migration**
   - Click "Run" button (or Cmd/Ctrl + Enter)
   - Should see: "Success. No rows returned"

5. **Verify Tables Created**
   - Go to "Table Editor" in sidebar
   - Should see new table: `brain_skill_metrics`
   - Should see new view: `brain_skill_metrics_summary`

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or run specific migration
supabase migration up
```

### Option 3: Via Direct SQL

```bash
# Using psql
psql "postgres://postgres.ofvbywlqztkgugrkibcp:2B6CrtZ0kQ2vf1ty@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" < supabase/migrations/012_brain_skill_metrics.sql
```

## What This Migration Creates

### 1. Table: `brain_skill_metrics`

Stores performance data for each brain skill execution:
- `skill_name` - Which skill (trm, kimiK2, etc.)
- `execution_time_ms` - How long it took
- `success` - Did it succeed?
- `cost` - API cost
- `quality_score` - Quality rating
- `cache_hit` - Was it cached?
- `domain` - Query domain (legal, tech, etc.)

### 2. Indexes

For fast queries:
- By skill name
- By timestamp
- By domain
- By success/failure
- Composite for analytics

### 3. Functions

**`get_brain_skill_analytics(skill_name, hours_ago)`**
```sql
-- Get analytics for all skills (last 24 hours)
SELECT * FROM get_brain_skill_analytics();

-- Get analytics for specific skill
SELECT * FROM get_brain_skill_analytics('kimiK2', 24);
```

**`cleanup_old_brain_metrics(days_to_keep)`**
```sql
-- Delete metrics older than 30 days
SELECT cleanup_old_brain_metrics(30);
```

### 4. View: `brain_skill_metrics_summary`

Quick analytics view:
```sql
-- See summary of all skills (last 24 hours)
SELECT * FROM brain_skill_metrics_summary;
```

### 5. Security Policies

- Authenticated users: Full access
- Anonymous users: Read-only access

## After Migration Runs

### Test It Works

```bash
# Test the brain API
curl -X POST http://localhost:3000/api/brain \
  -H "Content-Type: application/json" \
  -d '{"query": "Test metrics", "domain": "general"}'

# Check if metrics were recorded (in Supabase Dashboard)
# Table Editor → brain_skill_metrics → Should see 1+ rows
```

### View Metrics

```bash
# Via API
curl http://localhost:3000/api/brain/metrics

# Via Supabase Dashboard
# Table Editor → brain_skill_metrics
```

### Query Analytics

In Supabase SQL Editor:
```sql
-- See all metrics
SELECT * FROM brain_skill_metrics ORDER BY activated_at DESC LIMIT 10;

-- See summary
SELECT * FROM brain_skill_metrics_summary;

-- Get analytics for specific skill
SELECT * FROM get_brain_skill_analytics('kimiK2', 24);

-- Find slowest skills
SELECT skill_name, AVG(execution_time_ms) as avg_time
FROM brain_skill_metrics
GROUP BY skill_name
ORDER BY avg_time DESC;
```

## Troubleshooting

### "relation already exists"

**Solution**: Table already created! You're good to go.

### "permission denied"

**Solution**: Check you're using SERVICE_ROLE_KEY, not ANON_KEY

### "syntax error"

**Solution**: Make sure you copied the ENTIRE file, including all functions

### Migration runs but no data appears

**Check**:
1. Is NEXT_PUBLIC_SUPABASE_URL in .env.local?
2. Is SUPABASE_SERVICE_ROLE_KEY in .env.local?
3. Did you restart the dev server after adding env vars?

## What to Do After Migration

### 1. Run Some Queries

```bash
# Test brain system
node test-brain-final-comparison.js
```

### 2. Check Metrics Were Recorded

In Supabase Dashboard:
- Table Editor → brain_skill_metrics
- Should see rows for each skill that executed

### 3. Analyze Performance

```sql
-- Which skills are used most?
SELECT skill_name, COUNT(*) as usage
FROM brain_skill_metrics
GROUP BY skill_name
ORDER BY usage DESC;

-- Which skills are slowest?
SELECT skill_name, AVG(execution_time_ms) as avg_ms
FROM brain_skill_metrics
WHERE success = true
GROUP BY skill_name
ORDER BY avg_ms DESC;

-- What's the success rate?
SELECT skill_name,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
  ROUND(AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100, 2) as success_rate_pct
FROM brain_skill_metrics
GROUP BY skill_name;
```

## Expected Results

After running brain queries, you should see:

**In brain_skill_metrics table:**
```
skill_name     | execution_time_ms | success | domain
---------------|-------------------|---------|--------
kimiK2         | 8234             | true    | legal
trm            | 5678             | true    | legal
costOptimization| 1234            | true    | legal
```

**In brain_skill_metrics_summary view:**
```
skill_name | total_executions | success_rate_pct | avg_execution_time_ms
-----------|------------------|------------------|----------------------
kimiK2     | 15               | 100.00          | 8234.50
trm        | 15               | 93.33           | 5678.20
```

---

**Ready to run the migration?**
1. Go to: https://supabase.com/dashboard/project/ofvbywlqztkgugrkibcp
2. Click "SQL Editor"
3. Paste the migration SQL
4. Click "Run"
