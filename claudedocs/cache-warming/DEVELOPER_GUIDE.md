# Cache Warming - Developer Guide

**Audience**: Developers integrating cache warming
**Time to Read**: 10 minutes

---

## API Usage

### Warm Cache Endpoint

**POST** `/api/brain/cache/warm`

Populate cache with queries.

**Request**:
```json
{
  "queries": [
    {
      "query": "What is machine learning?",
      "domain": "technology",
      "complexity": 5,
      "skills": ["trm_engine", "ace_framework"]
    }
  ],
  "parallel": true,
  "maxConcurrency": 3,
  "skipExisting": true
}
```

**Response**:
```json
{
  "success": true,
  "queriesWarmed": 8,
  "queriesSkipped": 2,
  "queriesFailed": 0,
  "duration": 95000,
  "cacheStats": {
    "size": 450,
    "maxSize": 1000,
    "hitRate": 0.55,
    "utilizationPercent": 45
  }
}
```

### Check Cache Status

**GET** `/api/brain/cache/warm`

Check current cache state.

**Response**:
```json
{
  "success": true,
  "status": {
    "cacheSize": 450,
    "maxSize": 1000,
    "hitRate": 0.55,
    "utilizationPercent": 45,
    "recommendWarmup": false
  },
  "defaultQueries": [...]
}
```

### Clear Cache

**DELETE** `/api/brain/cache/warm`

Clear all cached entries.

**Response**:
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "entriesRemoved": 450
}
```

### Monitor Cache

**GET** `/api/brain/cache/monitor`

Get real-time metrics and alerts.

**Query Parameters**:
- `history=true` - Include historical data
- `hours=24` - History timeframe (default: 24)

**Response**:
```json
{
  "success": true,
  "current": {
    "metrics": {
      "hitRate": 0.55,
      "utilizationPercent": 45,
      "hitCount": 550,
      "missCount": 450
    },
    "trends": {
      "hitRateTrend": "stable",
      "recommendations": [
        "Cache performing well"
      ]
    },
    "alerts": [
      {
        "level": "info",
        "message": "Cache performing well: 55.0% hit rate"
      }
    ]
  }
}
```

---

## NPM Scripts

```bash
# Standard warming (3 concurrent)
npm run warm-cache

# High-performance (5 concurrent)
npm run warm-cache:parallel

# Sequential (controlled)
npm run warm-cache:sequential

# Run tests
npm run test:cache
```

---

## Programmatic Usage

### From Node.js Script

```typescript
import fetch from 'node-fetch';

async function warmCache() {
  const response = await fetch('http://localhost:3000/api/brain/cache/warm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parallel: true,
      maxConcurrency: 5
    })
  });

  const result = await response.json();
  console.log(`Warmed ${result.queriesWarmed} queries`);
}
```

### From Application Code

```typescript
import { getSkillCache } from '@/lib/brain-skills/skill-cache';

// Get cache instance
const cache = getSkillCache();

// Check cache
const cached = cache.get('skill_name', 'query', context);

// Store in cache
cache.set('skill_name', 'query', result, context);

// Get stats
const stats = cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
```

---

## Custom Queries

### Add Production Queries

Edit: `frontend/app/api/brain/cache/warm/route.ts`

```typescript
const COMMON_QUERIES: WarmingQuery[] = [
  // Your production queries
  {
    query: 'Analyze quarterly financial performance',
    domain: 'business',
    complexity: 7,
    skills: ['advanced_rag', 'quality_evaluation']
  },
  {
    query: 'Review legal compliance for GDPR',
    domain: 'legal',
    complexity: 8,
    skills: ['legal_analysis', 'advanced_rag']
  },
  // ... add more
];
```

### Dynamic Query Loading

```typescript
// Load queries from external source
async function loadProductionQueries(): Promise<WarmingQuery[]> {
  const response = await fetch('https://api.example.com/common-queries');
  return await response.json();
}

// Use in warming
const queries = await loadProductionQueries();
await fetch('/api/brain/cache/warm', {
  method: 'POST',
  body: JSON.stringify({ queries })
});
```

---

## Error Handling

### Validation Errors

```typescript
try {
  await fetch('/api/brain/cache/warm', {
    method: 'POST',
    body: JSON.stringify({ queries: tooManyQueries })
  });
} catch (error) {
  if (error.message.includes('Too many queries')) {
    // Handle validation error
    console.error('Reduce query count to < 50');
  }
}
```

### Network Errors

```typescript
const response = await fetch('/api/brain/cache/warm', {
  method: 'POST',
  signal: AbortSignal.timeout(120000) // 2 minute timeout
}).catch(error => {
  if (error.name === 'AbortError') {
    console.error('Warming timed out');
  }
});
```

---

## Testing

### Unit Tests

```typescript
// test-cache-key-optimizer.test.ts
import { getCacheKeyOptimizer } from '@/lib/brain-skills/cache-key-optimizer';

describe('CacheKeyOptimizer', () => {
  test('normalizes similar queries', () => {
    const optimizer = getCacheKeyOptimizer();
    const key1 = optimizer.generateKey('skill', 'What is AI?');
    const key2 = optimizer.generateKey('skill', 'What is artificial intelligence?');
    expect(key1).toBe(key2); // Synonym matching
  });
});
```

### Integration Tests

```bash
# Run comprehensive test suite
npm run test:cache
```

**Expected Output**:
```
✅ Test 1: Cache Status Endpoint
✅ Test 2: Clear Cache
✅ Test 3: Cache Warming (Parallel)
✅ Test 4: Cache Hit Rate Improvement
✅ Test 5: Cache Monitoring
✅ Test 6: Custom Query Warming
✅ Test 7: Cache Key Optimization

All tests passed! (7/7)
```

---

## Performance Optimization

### Adjust Concurrency

```typescript
// For faster warming (if system can handle it)
await fetch('/api/brain/cache/warm', {
  method: 'POST',
  body: JSON.stringify({
    parallel: true,
    maxConcurrency: 10 // Increase from default 3
  })
});
```

### Selective Warming

```typescript
// Warm only high-priority queries
const highPriorityQueries = queries.filter(q => q.complexity >= 7);

await fetch('/api/brain/cache/warm', {
  method: 'POST',
  body: JSON.stringify({ queries: highPriorityQueries })
});
```

---

## Best Practices

1. **Warm on Startup**: Run `npm run warm-cache` after deployment
2. **Monitor Hit Rates**: Check `/api/brain/cache/monitor` daily
3. **Update Queries**: Review and update COMMON_QUERIES monthly
4. **Test Before Production**: Run `npm run test:cache` before deploy
5. **Log Metrics**: Store metrics for trend analysis

---

## Next Steps

- **Configuration**: See [CONFIGURATION.md](CONFIGURATION.md)
- **Monitoring**: See [MONITORING_GUIDE.md](MONITORING_GUIDE.md)
- **Production**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
