# ACE Framework Consolidation Plan

**Date**: 2025-01-15  
**Status**: 📋 Documentation Complete - Implementation Pending

## Problem

Multiple ACE framework implementations exist across the codebase, causing confusion about which one to use:

1. `ace-framework.ts` - Main implementation (670 lines)
2. `ace-framework-optimized.ts` - Optimized variant
3. `ace-optimized.ts` - Another optimized variant
4. `ace-framework-full.ts` - Full-featured variant
5. `ace-enhanced-framework.ts` - Enhanced variant
6. `ace/` directory - Modular implementation
7. Various other ACE-related files

## Current Usage Analysis

**Primary Implementation**: `ace-framework.ts` appears to be the main implementation used in:
- `permutation-lite-pipeline.ts`
- `unified-permutation-pipeline.ts`

**Recommendation**: Consolidate to use `ace-framework.ts` as the canonical implementation, with the `ace/` directory as the modular components.

## Consolidation Strategy

### Phase 1: Documentation (Immediate)
✅ Create this consolidation document
- Document which files are deprecated
- Mark canonical implementation
- Add migration notes

### Phase 2: Deprecation Warnings (Short-term)
- Add deprecation comments to duplicate implementations
- Update imports to use canonical version
- Add console warnings for deprecated usage

### Phase 3: Removal (Long-term)
- Remove duplicate implementations after migration period
- Keep only canonical `ace-framework.ts` and `ace/` directory

## Canonical Implementation

**Use**: `frontend/lib/ace-framework.ts`

**Alternative Modular Version**: `frontend/lib/ace/` directory (if modular approach preferred)

## Migration Guide

For files using duplicate implementations:

```typescript
// ❌ Old (deprecated)
import { ACEFramework } from './ace-framework-optimized';
import { ACEFramework } from './ace-optimized';
import { ACEFramework } from './ace-framework-full';

// ✅ New (canonical)
import { ACEFramework } from './ace-framework';
```

## Files to Deprecate

1. `ace-framework-optimized.ts` → Use `ace-framework.ts`
2. `ace-optimized.ts` → Use `ace-framework.ts`
3. `ace-framework-full.ts` → Use `ace-framework.ts`
4. `ace-enhanced-framework.ts` → Use `ace-framework.ts`

## Next Steps

1. Audit all imports to identify which files use which implementation
2. Create migration script to update imports
3. Add deprecation warnings
4. Schedule removal after 1-month migration period

