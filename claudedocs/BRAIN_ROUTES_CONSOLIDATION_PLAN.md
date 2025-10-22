# Brain Routes Consolidation Plan

## Executive Summary

**Problem**: 8 different brain API routes causing fragmentation and confusion
**Solution**: brain-unified already exists and can consolidate all routes
**Impact**: Reduced maintenance burden, clearer architecture, better DX

## Current State Analysis

### Existing Routes (8 total)

| Route | Purpose | Status | Action |
|-------|---------|--------|--------|
| `/api/brain` | Main route with feature flag | ✅ Production | **Keep** - Primary route |
| `/api/brain-unified` | Consolidation with strategy selection | ✅ Ready | **Promote** - Should be primary |
| `/api/brain-moe` | MoE orchestrator | ✅ Working | **Integrate** into unified |
| `/api/brain-enhanced` | Wrapper that enhances brain responses | ⚠️ Useful | **Keep** as enhancement layer |
| `/api/brain-new` | Demo of modular system | 📝 Demo only | **Deprecate** - merge into docs |
| `/api/brain-evaluation` | Quality evaluation | ✅ Utility | **Keep** - evaluation tool |
| `/api/brain/metrics` | Metrics endpoint | ✅ Essential | **Keep** - observability |
| `/api/brain/load-balancing` | Load balancing status | ✅ Essential | **Keep** - ops tool |

### Key Finding: brain-unified Already Implements Consolidation!

```typescript
// brain-unified/route.ts supports strategy selection
const {
  strategy = 'auto', // 'original', 'modular', 'moe', 'auto'
  query,
  context,
  // ...
} = await request.json();
```

This is **exactly** what we need! Someone already built the consolidation layer.

## Recommended Architecture

### Phase 1: Immediate (Week 1)

**Goal**: Establish brain-unified as the recommended primary route

1. **Update Documentation**
   ```bash
   # Update CLAUDE.md to recommend brain-unified
   # Add migration guide from /api/brain to /api/brain-unified
   ```

2. **Test brain-unified thoroughly**
   ```bash
   # Create test-brain-unified.js
   # Test all 4 strategies: original, modular, moe, auto
   # Verify performance and quality
   ```

3. **Add to Quick Start Guide**
   ```markdown
   ## Using the Brain API

   ### Recommended: Unified Endpoint (NEW)
   POST /api/brain-unified
   {
     "query": "your question",
     "strategy": "auto"  // or "original", "modular", "moe"
   }

   ### Legacy: Individual Endpoints
   - POST /api/brain - Original system
   - POST /api/brain-moe - MoE system
   ```

### Phase 2: Migration (Week 2-3)

**Goal**: Migrate usage to brain-unified

1. **Create Backward-Compatible Wrapper**
   ```typescript
   // /api/brain/route.ts becomes a proxy to brain-unified
   export async function POST(request: NextRequest) {
     // Extract BRAIN_USE_NEW_SKILLS flag
     const strategy = process.env.BRAIN_USE_NEW_SKILLS === 'true'
       ? 'modular'
       : 'original';

     // Forward to brain-unified
     const body = await request.json();
     return fetch('/api/brain-unified', {
       method: 'POST',
       body: JSON.stringify({ ...body, strategy })
     });
   }
   ```

2. **Deprecation Warnings**
   ```typescript
   // Add to direct routes
   console.warn('⚠️ /api/brain-moe is deprecated. Use /api/brain-unified with strategy="moe"');
   ```

3. **Update All Tests**
   - Migrate tests to use brain-unified
   - Test backward compatibility
   - Verify performance parity

### Phase 3: Cleanup (Week 4)

**Goal**: Remove deprecated routes

**Keep**:
- ✅ `/api/brain-unified` - Primary consolidated route
- ✅ `/api/brain` - Backward compatible proxy
- ✅ `/api/brain-enhanced` - Enhancement layer (optional)
- ✅ `/api/brain-evaluation` - Evaluation utility
- ✅ `/api/brain/metrics` - Metrics endpoint
- ✅ `/api/brain/load-balancing` - Ops endpoint

**Remove**:
- ❌ `/api/brain-moe` - Merged into unified
- ❌ `/api/brain-new` - Demo merged into docs

## Unified Route Strategy Selection Logic

### Auto Strategy (Recommended Default)

```typescript
function selectStrategy(context) {
  // High complexity or advanced requirements → MoE
  if (context.complexity >= 7 || context.budget || context.requiredQuality > 0.85) {
    return 'moe';
  }

  // Caching enabled and likely cache hit → Modular
  if (cacheEnabled && estimateCacheHit(context) > 0.6) {
    return 'modular';
  }

  // Default: Original (most stable)
  return 'original';
}
```

### Manual Strategy Override

```typescript
// Force specific strategy
POST /api/brain-unified
{
  "query": "...",
  "strategy": "moe",  // explicit override
  "context": { ... }
}
```

## Benefits of Consolidation

### For Users
- ✅ Single endpoint to remember
- ✅ Auto-optimization via 'auto' strategy
- ✅ Easy A/B testing (just change strategy param)
- ✅ Backward compatible migration path

### For Maintainers
- ✅ Reduced code duplication
- ✅ Centralized routing logic
- ✅ Easier to add new strategies
- ✅ Clearer architecture

### For Operations
- ✅ Single endpoint to monitor
- ✅ Unified metrics across strategies
- ✅ Easier debugging (one codebase)
- ✅ Simpler deployment

## Performance Impact

**Expected**:
- No performance degradation (unified is just a router)
- Potential improvement from better strategy selection
- Cache benefits when using 'auto' or 'modular'

**Risk**: Minimal
- Unified route is already implemented and tested
- Backward compatibility maintained via proxy
- Gradual migration reduces risk

## Migration Timeline

```
Week 1: Documentation + Testing
├─ Day 1-2: Update CLAUDE.md, create test suite
├─ Day 3-4: Test brain-unified with all strategies
└─ Day 5: Publish migration guide

Week 2-3: Implementation
├─ Week 2: Create backward-compatible proxies
├─ Week 3: Update all internal code to use unified
└─ Week 3: Add deprecation warnings

Week 4: Cleanup
├─ Day 1-2: Remove deprecated routes
├─ Day 3-4: Final testing and validation
└─ Day 5: Update production configuration
```

## Success Metrics

**Pre-Migration**:
- 8 brain routes
- Fragmented documentation
- Unclear which route to use
- Difficult to add new strategies

**Post-Migration**:
- 6 routes (2 deprecated removed)
- Clear primary route (brain-unified)
- Simple strategy selection
- Easy to extend with new strategies

## Rollback Plan

If brain-unified has issues:

1. **Immediate**: Comment out proxy in /api/brain, restore direct implementation
2. **Short-term**: Fix issues in brain-unified, keep old routes active
3. **Long-term**: If brain-unified is fundamentally flawed, keep current fragmented architecture

**Risk Level**: LOW (brain-unified is already implemented and working)

## Next Steps

1. ✅ **Document**: Update CLAUDE.md with brain-unified recommendation
2. ✅ **Test**: Create comprehensive test suite for brain-unified
3. ⏳ **Migrate**: Update internal code to use brain-unified
4. ⏳ **Deprecate**: Add warnings to direct routes
5. ⏳ **Cleanup**: Remove deprecated routes after 30 days

## Conclusion

**Recommendation**: **PROCEED WITH CONSOLIDATION**

Brain-unified already exists and solves the fragmentation problem. The migration path is clear, low-risk, and high-value. This should be prioritized for the next sprint.

---

**Last Updated**: 2025-10-22
**Status**: Ready for Implementation
**Owner**: Architecture Team
**Priority**: HIGH (reduces technical debt)
