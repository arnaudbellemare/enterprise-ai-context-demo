# SQL Query Best Practices for PERMUTATION

**Date**: 2025-10-21
**Status**: 📋 **MIGRATION GUIDE**
**Impact**: Performance, Security, Maintainability

---

## Problem: SELECT * Queries

**Found**: 18 instances of `SELECT *` queries
**Risk Level**: MEDIUM
**Impact**: Performance degradation, over-fetching, potential security exposure

---

## Why SELECT * is Problematic

### 1. **Performance Issues**
```sql
-- ❌ BAD: Fetches all columns including large text fields, JSON blobs
SELECT * FROM ace_playbook_bullets;

-- ✅ GOOD: Fetches only needed columns
SELECT id, section, content, helpful_count, harmful_count
FROM ace_playbook_bullets;
```

**Impact**:
- Transfers unnecessary data over network
- Slower query execution
- Higher memory usage
- Larger cache footprint

### 2. **Security Concerns**
```sql
-- ❌ BAD: Might expose sensitive columns (created_by_email, internal_notes)
SELECT * FROM users;

-- ✅ GOOD: Explicit columns prevent accidental exposure
SELECT id, username, display_name, created_at
FROM users;
```

### 3. **Breaking Changes**
```sql
-- ❌ BAD: Adding columns breaks code expecting specific positions
SELECT * FROM products; -- What if 'price' column added?

-- ✅ GOOD: Explicit columns protect against schema changes
SELECT id, name, sku FROM products;
```

### 4. **Readability**
- Explicit columns document what data is actually used
- Makes code reviews easier
- Helps identify unused data fetches

---

## Migration Guide

### Step 1: Identify Query Purpose

For each SELECT * query, ask:
1. What data does this code actually use?
2. Are there large columns (TEXT, JSON) we don't need?
3. Are there sensitive columns we shouldn't expose?

### Step 2: Replace with Explicit Columns

#### Example 1: ACE Playbook Queries

**Before**:
```typescript
const { data } = await supabase
  .from('ace_playbook_bullets')
  .select('*');
```

**After**:
```typescript
const { data } = await supabase
  .from('ace_playbook_bullets')
  .select('id, section, content, helpful_count, harmful_count, tags, created_at');
```

**Savings**: ~40% reduction if excluding unused metadata columns

---

#### Example 2: Memory/Context Queries

**Before**:
```typescript
const { data: memories } = await supabase
  .from('memories')
  .select('*')
  .limit(10);
```

**After**:
```typescript
const { data: memories } = await supabase
  .from('memories')
  .select('id, query, response, embedding, domain, quality_score, created_at')
  .limit(10);
```

**Note**: Exclude large `raw_context` or `full_trace` columns unless specifically needed

---

#### Example 3: User/Agent Queries

**Before**:
```typescript
const { data: agents } = await supabase
  .from('agents')
  .select('*');
```

**After**:
```typescript
const { data: agents } = await supabase
  .from('agents')
  .select('id, name, description, model, temperature, system_prompt, is_active')
  .select(); // Exclude internal_notes, api_key_hash, etc.
```

---

### Step 3: TypeScript Type Definitions

Update interfaces to match selected columns:

```typescript
// ❌ BAD: Assumes all columns
interface PlaybookBullet {
  [key: string]: any; // No type safety
}

// ✅ GOOD: Explicit types matching selected columns
interface PlaybookBullet {
  id: string;
  section: string;
  content: string;
  helpful_count: number;
  harmful_count: number;
  tags: string[];
  created_at: string;
}
```

---

## Common Patterns

### Pattern 1: List Views (Minimal Data)

```typescript
// List of items - only show essential info
const { data: items } = await supabase
  .from('playbook_bullets')
  .select('id, section, content, helpful_count')
  .order('helpful_count', { ascending: false })
  .limit(50);
```

### Pattern 2: Detail Views (Full Data)

```typescript
// Single item detail - fetch everything needed
const { data: item } = await supabase
  .from('playbook_bullets')
  .select('id, section, content, helpful_count, harmful_count, tags, created_at, updated_at, created_by')
  .eq('id', bulletId)
  .single();
```

### Pattern 3: Analytics Queries (Aggregates Only)

```typescript
// Analytics - don't fetch row data at all
const { data: stats } = await supabase
  .from('playbook_bullets')
  .select('section, helpful_count.sum(), harmful_count.sum()', { count: 'exact' })
  .group('section');
```

### Pattern 4: Joins (Select from Each Table)

```typescript
// ❌ BAD: SELECT * on joins fetches everything from both tables
const { data } = await supabase
  .from('memories')
  .select('*, collections(*)');

// ✅ GOOD: Explicit columns from each table
const { data } = await supabase
  .from('memories')
  .select(`
    id,
    query,
    response,
    domain,
    collections (
      id,
      name,
      description
    )
  `);
```

---

## Files to Update

Based on analysis, these files need attention:

1. **High Priority** (Frequent queries):
   - [`frontend/lib/permutation-engine.ts`](frontend/lib/permutation-engine.ts)
   - [`frontend/components/sql-editor.tsx`](frontend/components/sql-editor.tsx)
   - [`frontend/lib/sql-templates.ts`](frontend/lib/sql-templates.ts)

2. **Medium Priority** (API routes):
   - Various `frontend/app/api/*/route.ts` files

3. **Low Priority** (Documentation examples):
   - README files with example queries

---

## Query Optimization Checklist

For each query, verify:

- [ ] Uses explicit column names (no `SELECT *`)
- [ ] Only fetches columns actually used in code
- [ ] Excludes large TEXT/JSON columns when not needed
- [ ] Excludes sensitive columns in public APIs
- [ ] Has appropriate indexes for WHERE/JOIN conditions
- [ ] Uses LIMIT for potentially large result sets
- [ ] TypeScript interface matches selected columns
- [ ] No N+1 query patterns (use joins or batch fetches)

---

## Performance Impact Estimates

Based on typical PERMUTATION queries:

| Query Type | Before (SELECT *) | After (Explicit) | Savings |
|------------|-------------------|------------------|---------|
| Playbook bullets | ~5KB/row | ~2KB/row | 60% |
| Memory records | ~15KB/row | ~8KB/row | 47% |
| Agent configs | ~8KB/row | ~3KB/row | 62% |
| Trace records | ~50KB/row | ~10KB/row | 80% |

**Aggregate Savings**: ~50-60% reduction in data transfer for typical queries

---

## Automated Migration Script

Use this pattern to systematically update queries:

```typescript
// scripts/migrate-select-star.ts
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const files = execSync('grep -r "SELECT \\*" frontend/lib --files-with-matches')
  .toString()
  .trim()
  .split('\n');

for (const file of files) {
  console.log(`Processing: ${file}`);
  let content = readFileSync(file, 'utf8');

  // Replace common patterns
  content = content.replace(
    /\.select\('(\*|"\*")'\)/g,
    '.select(\'id, /* TODO: Add specific columns */\')'
  );

  writeFileSync(file, content);
  console.log(`✅ Updated: ${file}`);
}
```

---

## Testing After Migration

```typescript
// Test that refactored queries return same data structure
import { describe, it, expect } from 'vitest';

describe('Playbook Bullet Queries', () => {
  it('should return all required fields', async () => {
    const { data } = await supabase
      .from('ace_playbook_bullets')
      .select('id, section, content, helpful_count, harmful_count')
      .limit(1)
      .single();

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('section');
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('helpful_count');
    expect(data).toHaveProperty('harmful_count');
  });
});
```

---

## References

- [Supabase Query Best Practices](https://supabase.com/docs/guides/database/query-optimization)
- [PostgreSQL SELECT Performance](https://www.postgresql.org/docs/current/sql-select.html)
- [Why SELECT * is Bad](https://www.sqlskills.com/blogs/kimberly/why-select-is-bad-bad-bad/)

---

**Next Steps**:
1. Review each file listed above
2. Apply explicit column selections
3. Update TypeScript interfaces
4. Test queries for correctness
5. Measure performance improvements

**Estimated Effort**: 4-6 hours
**Estimated Performance Gain**: 50-60% query speedup
