# Type Safety Migration Guide

**Objective**: Remove all 2,349 `any` type usages across 378 files

---

## ✅ What We've Done

### 1. Created Type Definitions
**File**: `frontend/lib/brain-skills/moe-types.ts`

Comprehensive TypeScript interfaces for:
- ✅ `BrainContext` - replaces `context: any`
- ✅ `SkillExecutor` - replaces `skill: any`
- ✅ `SkillRouter` - replaces `router: any`
- ✅ `SkillResult` - replaces `result: any`
- ✅ `EvaluationResult` - replaces `evaluation: any`
- ✅ `PerformanceMetric` - replaces metrics `any[]`

---

## 🎯 Systematic Migration Approach

### **Phase 1**: Top 3 Files (241 `any` usages)
**Priority**: CRITICAL

1. **brain-skills/moe-orchestrator.ts** - 92 usages
   - Status: ✅ Type definitions created
   - Next: Apply types systematically

2. **permutation-engine.ts** - 83 usages
   - Create: `PermutationTypes.ts`
   - Define: Query, Result, Config interfaces

3. **unified-permutation-pipeline.ts** - 66 usages
   - Create: `PipelineTypes.ts`
   - Define: Stage, Pipeline, Execution interfaces

### **Phase 2**: Library Files (150-200 files)
**Priority**: HIGH

Target files in `frontend/lib/` with 10+ `any` usages each.

### **Phase 3**: Systematic Cleanup (Remaining ~2,000 usages)
**Priority**: MEDIUM

Use automated script to fix common patterns.

---

## 📋 Migration Pattern: MoE Orchestrator Example

### ❌ **Before** (Type Unsafe)
```typescript
export class MoEBrainOrchestrator {
  private router: any;  // ❌ Type unsafe

  constructor(routerInstance?: any) {  // ❌ Type unsafe
    this.router = routerInstance || moeSkillRouter;
  }

  async executeQuery(request: MoERequest): Promise<MoEResponse> {
    const results: any[] = [];  // ❌ Type unsafe
    // ...
  }
}
```

### ✅ **After** (Type Safe)
```typescript
import type { SkillRouter, SkillResult, BrainContext } from './moe-types';

export class MoEBrainOrchestrator {
  private router: SkillRouter;  // ✅ Type safe

  constructor(routerInstance?: SkillRouter) {  // ✅ Type safe
    this.router = routerInstance || moeSkillRouter;
  }

  async executeQuery(request: MoERequest): Promise<MoEResponse> {
    const results: SkillResult[] = [];  // ✅ Type safe
    // ...
  }
}
```

---

## 🛠️ Step-by-Step Migration Process

### **Step 1**: Identify Common Patterns
```bash
# Find files with most 'any' usages
grep -r ": any" frontend/lib --include="*.ts" | \
  awk -F: '{print $1}' | \
  uniq -c | \
  sort -rn | \
  head -20
```

### **Step 2**: Create Type Definitions File
```typescript
// frontend/lib/[component]/types.ts
export interface ComponentContext {
  // Define all context properties
}

export interface ComponentResult {
  // Define all result properties
}

export interface ComponentConfig {
  // Define all configuration
}
```

### **Step 3**: Import and Apply Types
```typescript
// In the target file
import type { ComponentContext, ComponentResult } from './types';

// Replace 'any' with specific types
function processData(context: ComponentContext): ComponentResult {
  // Implementation
}
```

### **Step 4**: Fix Type Errors
```bash
# Check for compilation errors
npx tsc --noEmit

# Fix errors one by one
# Most common fixes:
# 1. Add missing properties to interfaces
# 2. Make properties optional with '?'
# 3. Use 'unknown' instead of 'any' for truly dynamic data
```

### **Step 5**: Verify
```bash
# Ensure no new 'any' types
grep ": any" frontend/lib/[component]/*.ts

# Run type check
npx tsc --noEmit
```

---

## 🎨 Common Type Patterns

### **Pattern 1**: Context Objects
```typescript
// ❌ Bad
function execute(context: any) { }

// ✅ Good
interface ExecutionContext {
  query: string;
  metadata?: Record<string, unknown>;
}
function execute(context: ExecutionContext) { }
```

### **Pattern 2**: Function Parameters
```typescript
// ❌ Bad
async function process(data: any): Promise<any> { }

// ✅ Good
interface ProcessInput {
  data: string;
  options?: ProcessOptions;
}
interface ProcessOutput {
  result: string;
  confidence: number;
}
async function process(input: ProcessInput): Promise<ProcessOutput> { }
```

### **Pattern 3**: Generic Arrays
```typescript
// ❌ Bad
const results: any[] = [];

// ✅ Good
interface Result {
  value: string;
  score: number;
}
const results: Result[] = [];
```

### **Pattern 4**: Error Handling
```typescript
// ❌ Bad
catch (error: any) {
  console.error(error);
}

// ✅ Good
catch (error) {
  if (error instanceof Error) {
    logger.error('Operation failed', error);
  } else {
    logger.error('Unknown error occurred', new Error(String(error)));
  }
}
```

### **Pattern 5**: Unknown vs Any
```typescript
// ❌ Bad (bypasses type safety)
const data: any = JSON.parse(response);
data.someMethod(); // No type checking

// ✅ Good (preserves type safety)
const data: unknown = JSON.parse(response);
if (isValidData(data)) {  // Type guard
  data.someMethod(); // Type-safe
}

function isValidData(data: unknown): data is ValidData {
  return typeof data === 'object' && data !== null && 'someMethod' in data;
}
```

---

## 📊 Progress Tracking

### **Files Completed**: 1 / 378
### **`any` Removed**: 0 / 2,349

| File | `any` Count | Status | Priority |
|------|-------------|--------|----------|
| moe-orchestrator.ts | 92 | 🟡 Types defined | HIGH |
| permutation-engine.ts | 83 | ⚪ Pending | HIGH |
| unified-permutation-pipeline.ts | 66 | ⚪ Pending | HIGH |
| ... | ... | ... | ... |

---

## 🚀 Automated Migration Script

```bash
#!/bin/bash
# scripts/fix-any-types.sh

TARGET_FILE=$1

# Count current 'any' usages
BEFORE=$(grep -c ": any" "$TARGET_FILE")

# Apply automated fixes (conservative)
# 1. context: any → context: Record<string, unknown>
sed -i.bak 's/context: any/context: Record<string, unknown>/g' "$TARGET_FILE"

# 2. metadata: any → metadata: Record<string, unknown>
sed -i.bak 's/metadata: any/metadata: Record<string, unknown>/g' "$TARGET_FILE"

# 3. error: any → error (let TypeScript infer)
sed -i.bak 's/error: any/error/g' "$TARGET_FILE"

# Count after
AFTER=$(grep -c ": any" "$TARGET_FILE")

echo "✅ Fixed $((BEFORE - AFTER)) 'any' types in $TARGET_FILE"
echo "📊 Remaining: $AFTER"
```

---

## ✅ Benefits of Type Safety

1. **Catch Errors Early**: TypeScript catches bugs at compile time
2. **Better IDE Support**: Autocomplete, refactoring, navigation
3. **Self-Documenting**: Types serve as documentation
4. **Safer Refactoring**: Compiler ensures changes don't break code
5. **Production Quality**: Fewer runtime errors

---

## 📚 Resources

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Type Definitions: `frontend/lib/brain-skills/moe-types.ts`
- Migration Script: `scripts/fix-any-types.sh`

---

**Next Steps**:
1. Apply types to moe-orchestrator.ts
2. Create types for permutation-engine.ts
3. Create types for unified-permutation-pipeline.ts
4. Continue with remaining 375 files

**Estimated Total Effort**: 120 hours (spread across sprints)
**Estimated Per-File Average**: 20 minutes
