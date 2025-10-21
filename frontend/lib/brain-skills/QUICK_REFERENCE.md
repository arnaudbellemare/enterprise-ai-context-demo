# Brain Skills - Quick Reference Card

One-page reference for the brain skills system.

## Installation

```bash
# 1. Run database migration
# Execute in Supabase SQL Editor:
supabase/migrations/012_brain_skill_metrics.sql

# 2. That's it! No npm install needed.
```

## Basic Usage

### Execute Skills

```typescript
import { getSkillRegistry } from './lib/brain-skills';

const registry = getSkillRegistry();
const context = { query, domain, complexity: 5, needsReasoning: true };
const results = await registry.executeActivatedSkills(query, context);
```

### Check Cache

```typescript
import { getSkillCache } from './lib/brain-skills';

const cache = getSkillCache();
const stats = cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
```

### View Metrics

```typescript
import { getMetricsTracker } from './lib/brain-skills';

const tracker = getMetricsTracker();
const metrics = await tracker.getAllMetrics(24);
console.log(`Executions: ${metrics.totalExecutions}`);
console.log(`Success: ${(metrics.successRate * 100).toFixed(2)}%`);
```

## API Endpoints

```bash
# Get metrics
curl http://localhost:3000/api/brain/metrics

# Get specific skill metrics
curl http://localhost:3000/api/brain/metrics?skill=kimiK2

# Clear cache
curl -X DELETE "http://localhost:3000/api/brain/metrics?action=clear_cache"

# Cleanup old metrics
curl -X DELETE "http://localhost:3000/api/brain/metrics?action=cleanup_metrics&days=30"
```

## Available Skills

| Skill | Priority | Activates When |
|-------|----------|----------------|
| **ACE** | 1 | `needsContext && domain === 'healthcare'` |
| **Kimi K2** | 1 | `needsAdvancedReasoning \|\| domain === 'legal'` |
| **TRM** | 2 | `complexity > 5 \|\| needsReasoning` |
| **GEPA** | 3 | `needsOptimization && quality < 0.7` |

## Creating a Custom Skill

```typescript
import { BaseSkill, BrainContext, SkillResult } from './brain-skills';

export class MySkill extends BaseSkill {
  name = 'My Skill';
  description = 'Does cool stuff';
  priority = 4;
  cacheEnabled = true;
  cacheTTL = 3600000; // 1 hour

  activation(context: BrainContext): boolean {
    return context.domain === 'finance';
  }

  protected async executeImplementation(
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    const data = await yourFunction(query);
    return this.createSuccessResult(data, {
      processingTime: 1000,
      quality: 0.9
    });
  }
}

// Register
import { getSkillRegistry } from './brain-skills';
getSkillRegistry().register('mySkill', new MySkill());
```

## Common Operations

### Clear Cache
```typescript
getSkillCache().clear();
```

### Invalidate Specific Skill Cache
```typescript
getSkillCache().invalidateSkill('kimiK2');
```

### Force Flush Metrics
```typescript
await getMetricsTracker().flush();
```

### Get Skill-Specific Metrics
```typescript
const metrics = await getMetricsTracker().getSkillMetrics('trm', 24);
```

### List All Skills
```typescript
const registry = getSkillRegistry();
const stats = registry.getStats();
console.log('Skills:', stats.skillNames); // ['trm', 'gepa', 'ace', 'kimiK2']
```

## Performance Tips

1. **Enable caching** - Set `cacheEnabled = true` and appropriate TTL
2. **Set correct priority** - Lower number = higher priority (1-10)
3. **Optimize activation** - Only activate when truly needed
4. **Monitor metrics** - Check for slow/failing skills
5. **Use timeouts** - Prevent hanging requests (default 30s)

## Troubleshooting

### No Skills Activating
```typescript
// Debug activation
const context = analyzeContext(query, domain);
const activated = registry.getActivatedSkills(context);
console.log('Activated:', activated.map(([n]) => n));
// If empty, check activation conditions
```

### Cache Not Working
```typescript
// Check cache stats
const stats = cache.getStats();
if (stats.hitCount === 0) {
  // Cache is enabled but no hits yet
  // Run same query twice to test
}
```

### Metrics Not Saving
```sql
-- Check Supabase table
SELECT * FROM brain_skill_metrics LIMIT 10;

-- If empty, check:
-- 1. Table exists
-- 2. RLS policies
-- 3. SUPABASE_URL env var
```

## File Structure

```
frontend/lib/brain-skills/
├── types.ts              # TypeScript types
├── base-skill.ts         # Base class
├── skill-cache.ts        # Caching
├── skill-metrics.ts      # Metrics
├── skill-registry.ts     # Registry
├── trm-skill.ts          # TRM skill
├── gepa-skill.ts         # GEPA skill
├── ace-skill.ts          # ACE skill
├── kimi-k2-skill.ts      # Kimi K2 skill
└── index.ts              # Exports
```

## Environment Variables

```bash
# Required for metrics
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Optional for Kimi K2
OPENROUTER_API_KEY=your_key
```

## SQL Queries

### View Summary
```sql
SELECT * FROM brain_skill_metrics_summary;
```

### Top Skills
```sql
SELECT skill_name, COUNT(*) as executions
FROM brain_skill_metrics
WHERE activated_at >= NOW() - INTERVAL '24 hours'
GROUP BY skill_name
ORDER BY executions DESC;
```

### Success Rate by Skill
```sql
SELECT
  skill_name,
  ROUND(AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100, 2) as success_rate
FROM brain_skill_metrics
WHERE activated_at >= NOW() - INTERVAL '7 days'
GROUP BY skill_name;
```

### Cache Hit Rate
```sql
SELECT
  ROUND(AVG(CASE WHEN cache_hit THEN 1 ELSE 0 END) * 100, 2) as cache_hit_rate
FROM brain_skill_metrics
WHERE activated_at >= NOW() - INTERVAL '24 hours';
```

## Key Metrics to Watch

- **Hit Rate**: Target 40-60%
- **Success Rate**: Target 95%+
- **Avg Time**: Target < 2000ms
- **Cache Utilization**: Target < 80%

## Links

- Full docs: `frontend/lib/brain-skills/README.md`
- Integration guide: `frontend/lib/brain-skills/INTEGRATION_GUIDE.md`
- Summary: `BRAIN_IMPROVEMENTS_SUMMARY.md`
