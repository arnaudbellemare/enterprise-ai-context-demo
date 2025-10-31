# Quick Test Guide

## Why Tests Are Slow

The comparative test runs **7 queries × 4 approaches** = **28 total test runs**:
1. **Baseline** (Current System): ~30s-2min per query
2. **SRL-Enhanced**: ~20s-1min per query (for multi-step)
3. **nanoEBM-Enhanced**: ~10s-30s per query (for refinement/verification)
4. **Combined**: ~30s-2min per query

**Total time**: ~7-15 minutes for all queries.

---

## Quick Test Mode

Run only the first **2 queries** with selective approach testing:

```bash
npx tsx test-comparative-srl-ebm.ts --quick
```

Or use `-q`:
```bash
npx tsx test-comparative-srl-ebm.ts -q
```

### What Quick Mode Does:
- ✅ Tests only first 2 queries (instead of 7)
- ✅ Skips SRL for non-multi-step queries
- ✅ Skips EBM for non-refinement queries
- ✅ Reduced timeouts (30s-2min instead of 1min-5min)

**Quick mode time**: ~2-4 minutes total.

---

## Full Test Mode

Run all queries with all approaches:

```bash
npx tsx test-comparative-srl-ebm.ts
```

**Full mode time**: ~7-15 minutes total.

---

## Optimizations Made

1. **Reduced Timeouts**:
   - Very High: 5min → 2min
   - High: 3min → 1.5min
   - Medium: 2min → 1min
   - Low: 1min → 30s

2. **Selective Testing**:
   - SRL only for multi-step queries
   - EBM only for refinement/verification queries
   - Combined only when both apply

3. **Quick Mode**:
   - Only 2 queries instead of 7
   - Faster iteration during development

---

## Recommendation

**Use Quick Mode** (`--quick`) for:
- ✅ Development/testing
- ✅ Quick validation
- ✅ CI/CD checks

**Use Full Mode** for:
- ✅ Final validation before release
- ✅ Comprehensive benchmarking
- ✅ Performance analysis

