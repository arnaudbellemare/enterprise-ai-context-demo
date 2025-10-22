# Cache Warming - Troubleshooting

**Audience**: All users
**Time to Read**: 5 minutes

---

## Quick Fixes

### Issue: Cache Not Warming

**Symptoms**: `npm run warm-cache` completes with 0 queries warmed

**Solution**:
```bash
# 1. Check server is running
curl http://localhost:3000/api/health

# 2. Enable new skills system
export BRAIN_USE_NEW_SKILLS=true
npm run dev

# 3. Try warming again
npm run warm-cache
```

### Issue: Low Hit Rate (< 30%)

**Symptoms**: `/api/brain/cache/monitor` shows low hit rate

**Solution**:
```bash
# Run parallel warming
npm run warm-cache:parallel

# Add production queries
# Edit: frontend/app/api/brain/cache/warm/route.ts
# Add your actual production queries to COMMON_QUERIES
```

### Issue: Cache Full (Utilization > 90%)

**Symptoms**: Warning alert about high utilization

**Solution**:
```typescript
// Increase cache size
// frontend/lib/brain-skills/skill-cache.ts
maxSize: 2000  // from 1000

// OR reduce TTL
defaultTTL: 1800000  // 30 minutes instead of 1 hour
```

---

## Common Errors

### Error: "Failed to warm cache: Network timeout"

**Cause**: Queries taking too long

**Solution**:
```bash
# Reduce concurrency
npm run warm-cache:sequential

# OR increase timeout in route handler
# frontend/app/api/brain/cache/warm/route.ts
```

### Error: "Too many queries: 55 (max: 50)"

**Cause**: Input validation limit

**Solution**:
```typescript
// Increase limit
// frontend/app/api/brain/cache/warm/route.ts
const VALIDATION: QueryValidation = {
  maxQueries: 100,  // from 50
  // ...
};
```

### Error: "Missing required API key: OPENAI_API_KEY"

**Cause**: Environment variables not set

**Solution**:
```bash
# Check .env.local
cat frontend/.env.local

# Add missing keys
echo "OPENAI_API_KEY=sk-..." >> frontend/.env.local
echo "PERPLEXITY_API_KEY=pplx-..." >> frontend/.env.local

# Restart server
npm run dev
```

---

## Performance Issues

### Slow Warming (> 5 minutes for 10 queries)

**Diagnosis**:
```bash
# Check query complexity
curl http://localhost:3000/api/brain/cache/warm | jq '.defaultQueries[].complexity'
```

**Solution**:
```bash
# Increase concurrency
npx tsx scripts/warm-cache.ts --concurrency=5

# OR remove high-complexity queries
# Edit COMMON_QUERIES, remove queries with complexity > 7
```

### High Memory Usage

**Diagnosis**:
```bash
# Check cache size
curl -s http://localhost:3000/api/brain/cache/monitor | jq '.current.metrics.cacheSize'
```

**Solution**:
```typescript
// Reduce cache size
maxSize: 500  // from 1000

// OR enable aggressive cleanup
defaultTTL: 1800000  // 30 minutes
```

---

## Monitoring Issues

### Metrics Not Updating

**Diagnosis**:
```bash
# Check database connection
curl -X POST http://localhost:3000/api/brain/cache/monitor

# Check Supabase connection
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Solution**:
```bash
# Verify environment variables
cat frontend/.env.local | grep SUPABASE

# Run migration if needed
# In Supabase SQL Editor:
# Execute: supabase/migrations/013_cache_metrics_history.sql
```

### Historical Data Missing

**Diagnosis**:
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM cache_metrics_history;
```

**Solution**:
```bash
# Manually store metrics
curl -X POST http://localhost:3000/api/brain/cache/monitor

# Set up automated collection
# Add to cron:
# */30 * * * * curl -X POST http://localhost:3000/api/brain/cache/monitor
```

---

## Cache Behavior Issues

### Queries Not Caching

**Diagnosis**:
```bash
# Check if cache is enabled
echo $BRAIN_USE_NEW_SKILLS  # Should be "true"

# Test with specific query
curl -X POST http://localhost:3000/api/brain \
  -H "Content-Type: application/json" \
  -d '{"query": "What is machine learning?", "domain": "technology"}'

# Check if cached
curl http://localhost:3000/api/brain/cache/monitor | jq '.current.metrics.hitCount'
```

**Solution**:
```bash
# Ensure cache is enabled
export BRAIN_USE_NEW_SKILLS=true

# Restart server
npm run dev

# Warm cache
npm run warm-cache
```

### Similar Queries Not Matching

**Diagnosis**:
```typescript
// Test normalization
import { compareQueries } from '@/lib/brain-skills/cache-key-optimizer';

console.log(compareQueries(
  'What is AI?',
  'What is artificial intelligence?'
));
// Should show high similarity
```

**Solution**:
```typescript
// Lower similarity threshold
// frontend/lib/brain-skills/cache-key-optimizer.ts
minSimilarityThreshold: 0.80  // from 0.85
```

---

## Database Issues

### Migration Fails

**Error**: Table already exists

**Solution**:
```sql
-- In Supabase SQL Editor
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'cache_metrics_history';

-- If exists, skip migration
-- If not, run full migration
```

### Table Full / Disk Space

**Diagnosis**:
```sql
SELECT
  pg_size_pretty(pg_total_relation_size('cache_metrics_history')) as size,
  COUNT(*) as rows
FROM cache_metrics_history;
```

**Solution**:
```sql
-- Run cleanup
SELECT cleanup_old_cache_metrics();

-- OR manually delete old entries
DELETE FROM cache_metrics_history
WHERE timestamp < NOW() - INTERVAL '7 days';
```

---

## Debugging Tools

### Enable Verbose Logging

```bash
# Run with verbose output
npx tsx scripts/warm-cache.ts --verbose
```

### Inspect Cache Contents

```typescript
// frontend/lib/brain-skills/skill-cache.ts
// Add temporary debug method:
getContents(): Map<string, SkillCacheEntry> {
  return this.cache;
}

// Use in console:
const cache = getSkillCache();
console.log(Array.from(cache.getContents().keys()));
```

### Test Cache Key Generation

```typescript
import { testNormalization, compareQueries } from '@/lib/brain-skills/cache-key-optimizer';

// Test normalization
const result = testNormalization('What is machine learning?');
console.log(result);
// {
//   original: 'What is machine learning?',
//   normalized: 'learning machine',
//   words: ['learning', 'machine'],
//   removedStopwords: 2
// }

// Compare queries
const comparison = compareQueries(
  'What is AI?',
  'What is artificial intelligence?'
);
console.log(comparison);
// {
//   similarity: 1.0,
//   areSimilar: true,
//   normalized1: 'artificial intelligence',
//   normalized2: 'artificial intelligence'
// }
```

---

## Getting Help

### Check Logs

```bash
# Server logs
tail -f /var/log/app.log | grep -i cache

# Or in development
# Check terminal where `npm run dev` is running
```

### Collect Diagnostics

```bash
#!/bin/bash
# diagnostics.sh

echo "=== Cache Diagnostics ==="
echo "Date: $(date)"
echo

echo "Environment:"
echo "BRAIN_USE_NEW_SKILLS=$BRAIN_USE_NEW_SKILLS"
echo

echo "Cache Status:"
curl -s http://localhost:3000/api/brain/cache/warm | jq .
echo

echo "Metrics:"
curl -s http://localhost:3000/api/brain/cache/monitor | jq .current
echo

echo "Database:"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM cache_metrics_history;" 2>&1
```

### Contact Support

Include in your report:
1. Output of `diagnostics.sh`
2. Relevant error messages
3. Steps to reproduce
4. Expected vs actual behavior

---

## Prevention

### Health Checks

```bash
# Add to monitoring
curl http://localhost:3000/api/brain/cache/monitor | jq '.current.alerts'

# Alert if critical
if [ $(jq '.current.alerts[] | select(.level=="critical")' | wc -l) -gt 0 ]; then
  echo "ALERT: Critical cache issue"
  npm run warm-cache:parallel
fi
```

### Regular Maintenance

```bash
# Daily
npm run test:cache  # Run tests

# Weekly
# Review hit rates and adjust warming queries

# Monthly
# Clean up old metrics
# Review and update COMMON_QUERIES
```

---

## Still Stuck?

1. **Check Documentation**: [README.md](README.md) for overview
2. **Review API**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for usage
3. **Monitor System**: [MONITORING_GUIDE.md](MONITORING_GUIDE.md) for metrics
4. **Review Code**: Full implementation in [CACHE_WARMING_IMPLEMENTATION.md](../CACHE_WARMING_IMPLEMENTATION.md)
