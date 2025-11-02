# How Permutation System Knows What Configuration to Use

## Overview

The permutation system uses **IRT (Item Response Theory) difficulty** to route queries to different components (ACE, SWiRL, RVS) based on **thresholds**. These thresholds can come from three sources:

1. **Self-Improving Optimizer** (HGM/DGM) - Optimized via evolution
2. **Default Values** - Hardcoded defaults from testing
3. **Custom Override** - Manually specified

---

## Routing Logic

The permutation system uses this logic:

```typescript
// 1. Calculate IRT difficulty for query
const irtDifficulty = calculateIRT(query);

// 2. Route based on thresholds
if (irtDifficulty > aceThreshold) {
  // Use ACE for context enhancement
  activateACE();
}

if (irtDifficulty > swirlThreshold) {
  // Use SWiRL for multi-step reasoning
  activateSWiRL();
}

if (irtDifficulty > rvsThreshold) {
  // Use RVS for verification
  activateRVS();
}
```

**Current Implementation** (`unified-permutation-pipeline.ts`):
```typescript
const aceThreshold = this.config.aceThreshold ?? 0.5;
if (this.config.enableACE && irtDifficulty > aceThreshold) {
  // Activate ACE
}

const swirlThreshold = this.config.swirlThreshold ?? 0.7;
if (this.config.enableSWiRL && irtDifficulty > swirlThreshold) {
  // Activate SWiRL
}

const rvsThreshold = this.config.rvsThreshold ?? 0.3;
if (this.config.enableRVS && irtDifficulty > rvsThreshold) {
  // Activate RVS
}
```

---

## Configuration Sources

### 1. Default Configuration (Current)

**Location**: `unified-permutation-pipeline.ts` constructor

```typescript
{
  aceThreshold: 0.5,      // From testing
  swirlThreshold: 0.7,   // From testing
  rvsThreshold: 0.3,     // From testing
  optimizationMode: 'balanced',
}
```

**When used**: Always (as fallback)

### 2. Optimized Configuration (NEW)

**Location**: `optimized-permutation-adapter.ts`

```typescript
import { optimizedPermutationAdapter } from './frontend/lib/optimized-permutation-adapter';

// Get optimized config from self-improving optimizer
const config = optimizedPermutationAdapter.getOptimalConfig('optimizer');
```

**When used**: When self-improving optimizer has evaluated candidates

**How it works**:
1. Self-improving optimizer evolves parameter configurations
2. Evaluates on test queries
3. Selects best candidate by CMP score
4. Exports optimized thresholds via `exportBestPermutationConfig()`
5. Adapter uses these optimized thresholds

### 3. Custom Configuration

**Location**: User-provided config object

```typescript
const customConfig = {
  aceThreshold: 0.6,
  swirlThreshold: 0.8,
  optimizationMode: 'quality',
};

await executeUnifiedPipeline(query, domain, context, customConfig);
```

**When used**: When user explicitly provides config

---

## Using the Optimized Adapter

### Basic Usage

```typescript
import { executePermutationWithOptimalConfig } from './frontend/lib/optimized-permutation-adapter';

// Automatically uses optimized config if available
const result = await executePermutationWithOptimalConfig(
  query,
  domain,
  context,
  'optimizer'  // or 'default' or 'custom'
);
```

### Advanced Usage

```typescript
import { optimizedPermutationAdapter } from './frontend/lib/optimized-permutation-adapter';

// Check if optimized config available
if (optimizedPermutationAdapter.hasOptimizedConfig()) {
  console.log('✅ Using optimized configuration');
} else {
  console.log('ℹ️ Using default configuration');
}

// Get configuration explanation
const explanation = optimizedPermutationAdapter.getConfigExplanation('optimizer');
console.log(explanation);

// Compare default vs optimized
const comparison = optimizedPermutationAdapter.compareConfigs();
console.log('Differences:', comparison.differences);
```

---

## Configuration Priority

When multiple sources are available, priority is:

1. **Custom Config** (if explicitly provided)
2. **Optimized Config** (from self-improving optimizer)
3. **Default Config** (hardcoded fallback)

**Example**:
```typescript
// Priority 1: Custom (if provided)
const result1 = await executeUnifiedPipeline(query, domain, context, {
  aceThreshold: 0.6,  // Overrides everything
});

// Priority 2: Optimized (if available)
const result2 = await executePermutationWithOptimalConfig(
  query, domain, context, 'optimizer'
);

// Priority 3: Default (fallback)
const result3 = await executeUnifiedPipeline(query, domain, context);
```

---

## How Thresholds Are Optimized

### Step 1: Initialize Optimizer

```typescript
const optimizer = new SelfImprovingOptimizer({
  // ... config
});

const baselineId = optimizer.initializeBaseline(
  {},  // Delta rule config
  {    // Permutation config
    aceThreshold: 0.5,
    swirlThreshold: 0.7,
    rvsThreshold: 0.3,
  }
);
```

### Step 2: Evolve and Evaluate

```typescript
// Evolve for multiple generations
for (let gen = 1; gen <= 5; gen++) {
  await optimizer.evolveGeneration();
  
  // Evaluate candidates
  const newIds = optimizer.getAllCandidatesSortedByCMP()
    .filter(c => c.generation === gen)
    .map(c => c.id);
  
  await Promise.all(
    newIds.map(id => optimizer.evaluateCandidate(id, testQueries, evaluator))
  );
}
```

### Step 3: Export Best Config

```typescript
// Get best configuration
const bestConfig = optimizer.exportBestPermutationConfig();
// Returns: { aceThreshold, swirlThreshold, rvsThreshold, optimizationMode }
```

### Step 4: Use in Permutation Pipeline

```typescript
// Option A: Use adapter (automatic)
await executePermutationWithOptimalConfig(query, domain, context);

// Option B: Manual
const optimizedConfig = optimizer.exportBestPermutationConfig();
await executeUnifiedPipeline(query, domain, context, optimizedConfig);
```

---

## What Gets Optimized

The self-improving optimizer evolves these parameters:

### Permutation Parameters

- **`aceThreshold`** (0.1 - 0.9): When to activate ACE
- **`swirlThreshold`** (0.1 - 0.9): When to activate SWiRL
- **`rvsThreshold`** (0.1 - 0.9): When to activate RVS
- **`optimizationMode`**: 'quality' | 'speed' | 'balanced'

### Delta Rule Parameters (separate)

- **`residualClipValue`**: Residual learning parameter
- **`stabilityThreshold`**: Stability mechanism
- **`gatingStrategy`**: Gating approach
- **`enableResidual`**: Enable residual learning
- **`adaptiveBeta`**: Enable adaptive β_t

---

## Example: Full Workflow

```typescript
// 1. Run optimization (one time, or periodically)
const optimizer = new SelfImprovingOptimizer();
optimizer.initializeBaseline({}, {});
// ... evolve and evaluate ...

// 2. Use optimized config in production
import { optimizedPermutationAdapter } from './frontend/lib/optimized-permutation-adapter';

async function handleQuery(query: string) {
  // Automatically uses best config from optimizer
  const result = await optimizedPermutationAdapter.executeWithOptimalConfig(
    query,
    undefined,  // domain (auto-detect)
    undefined,  // context
    'optimizer' // source
  );
  
  return result;
}

// 3. Check what config was used
const explanation = optimizedPermutationAdapter.getConfigExplanation();
console.log(explanation);
```

---

## Integration with API

### Current API

```typescript
// frontend/app/api/unified-pipeline/route.ts
const result = await executeUnifiedPipeline(query, domain, context, config);
```

### Enhanced API (with auto-optimization)

```typescript
import { executePermutationWithOptimalConfig } from '../../../lib/optimized-permutation-adapter';

// In API route
const result = await executePermutationWithOptimalConfig(
  query,
  domain,
  context,
  'optimizer'  // Automatically uses best config
);
```

---

## Monitoring

### Check Config Status

```typescript
const adapter = optimizedPermutationAdapter;

// Has optimized config?
if (adapter.hasOptimizedConfig()) {
  console.log('✅ Using optimized thresholds');
} else {
  console.log('ℹ️ Using default thresholds');
}

// Get comparison
const comparison = adapter.compareConfigs();
if (Object.keys(comparison.differences).length > 0) {
  console.log('📊 Configuration differences:', comparison.differences);
}
```

---

## Summary

**How the permutation system knows what to use**:

1. **Calculate IRT difficulty** for the query
2. **Get thresholds** from:
   - Custom config (if provided) → Priority 1
   - Optimized config (from optimizer) → Priority 2
   - Default config (hardcoded) → Priority 3
3. **Route based on thresholds**:
   - `difficulty > aceThreshold` → Use ACE
   - `difficulty > swirlThreshold` → Use SWiRL
   - `difficulty > rvsThreshold` → Use RVS
4. **Execute** with selected components

The **`OptimizedPermutationAdapter`** bridges the gap between the self-improving optimizer and the permutation pipeline, automatically applying optimized configurations when available.

