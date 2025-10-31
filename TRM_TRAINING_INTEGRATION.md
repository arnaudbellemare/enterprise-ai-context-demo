# TRM Training Integration in Permutation System

## Current State: TRM Already Integrated

TRM is **already integrated** into the permutation system at multiple layers using the heuristic-based `TRMAdapter`. The new TRM training implementation adds **learned halting and verification** on top of the existing integration.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PERMUTATION ENGINE                        │
│  (frontend/lib/permutation-engine.ts)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ STEP 9: TRM Recursive Reasoning                      │  │
│  │   → applyTRM(query, steps)                           │  │
│  │   → Uses createRVS() from ./trm.ts                   │  │
│  │   → Returns: { iterations, verified, confidence }    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   RAG PIPELINE                              │
│  (frontend/lib/rag/complete-rag-pipeline.ts)               │
│                                                             │
│  ┌──────────────────────┐  ┌────────────────────────────┐ │
│  │ Document Reranker    │  │ Answer Generator           │ │
│  │                      │  │                            │ │
│  │ Uses TRMAdapter for: │  │ Uses TRMAdapter for:       │ │
│  │ - Document scoring   │  │ - Answer verification      │ │
│  │ - Ranking refinement │  │ - Answer improvement       │ │
│  └──────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              TRM IMPLEMENTATIONS                            │
│                                                             │
│  ┌──────────────────────┐  ┌────────────────────────────┐ │
│  │ TRMAdapter           │  │ TRMTrainer (NEW)           │ │
│  │ (Heuristic-based)    │  │ (Deep supervision +        │ │
│  │                      │  │  Learned halting)          │ │
│  │ - verify()           │  │                            │ │
│  │ - improve()          │  │ - trainStep()              │ │
│  │                      │  │ - deepRecursion()          │ │
│  │                      │  │ - q_hat halting            │ │
│  └──────────────────────┘  └────────────────────────────┘ │
│                              ↓                             │
│                   ┌──────────────────────┐                 │
│                   │ TRMTrainedAdapter    │                 │
│                   │ (NEW - uses trained) │                 │
│                   │                      │                 │
│                   │ - verify()           │                 │
│                   │ - improve()          │                 │
│                   └──────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Integration Points

### 1. Permutation Engine (`frontend/lib/permutation-engine.ts`)

**Location**: Lines 419-437, 1547-1586

```typescript
// STEP 9: TRM Recursive Reasoning + Verification
if (this.config.enableTRM) {
  trmResult = await this.applyTRM(query, swirlSteps);
  // Returns: { iterations, verified, confidence, answer }
}
```

**Current Implementation**:
- Uses `createRVS()` from `./trm.ts`
- Performs recursive refinement
- Returns verification results

**What We Can Add**:
```typescript
// Optionally use trained TRM for verification
if (this.config.useTrainedTRM) {
  const trainedTRM = new TRMTrainedAdapter();
  await trainedTRM.initialize(this.config.trmModelPath);
  // Use trained TRM in recursive steps
}
```

---

### 2. Document Reranker (`frontend/lib/rag/document-reranker.ts`)

**Location**: Lines 425-459

```typescript
// Current: Uses heuristic TRMAdapter
const trm = new TRMAdapter();
const verify = await trm.verify(query, topKText, ordered[0]?.content || '');
const trmScore = verify.score; // 0..1
item.score = (1 - trmWeight) * item.scoreBase + trmWeight * trmScore;
```

**How to Use Trained TRM**:
```typescript
import { TRMTrainedAdapter } from './trm-trained-adapter';

// In rerank method
const trm = config.useTrainedTRM && config.trmModelPath
  ? await (async () => {
      const adapter = new TRMTrainedAdapter();
      await adapter.initialize(config.trmModelPath);
      return adapter;
    })()
  : new TRMAdapter();

const verify = await trm.verify(query, topKText, docClontent);
```

---

### 3. Answer Generator (`frontend/lib/rag/answer-generator.ts`)

**Location**: Lines 299-311

```typescript
// Current: Uses heuristic TRMAdapter
if (useTRMVerification) {
  const trm = new TRMAdapter({ maxSteps: trmMaxSteps, minScore: trmMinScore });
  const verify = await trm.verify(query, context, bestAnswer);
  if (verify.score < trmMinScore) {
    const improved = await trm.improve(query, context, bestAnswer);
    bestAnswer = improved.answer;
  }
}
```

**How to Use Trained TRM**:
```typescript
import { TRMTrainedAdapter } from './trm-trained-adapter';

// In generate method
const trm = config.useTrainedTRM && config.trmModelPath
  ? await (async () => {
      const adapter = new TRMTrainedAdapter(
        { maxSteps: trmMaxSteps, minScore: trmMinScore }
      );
      await adapter.initialize(config.trmModelPath);
      return adapter;
    })()
  : new TRMAdapter({ maxSteps: trmMaxSteps, minScore: trmMinScore });

const verify = await trm.verify(query, context, bestAnswer);
```

---

### 4. Complete RAG Pipeline (`frontend/lib/rag/complete-rag-pipeline.ts`)

**Location**: Config passed to reranker and answer generator

```typescript
// Current config structure
const config = {
  reranking: {
    enabled: true,
    trmEnabled: true,
    trmWeight: 0.3
  },
  answerGeneration: {
    useTRMVerification: true,
    trmMinScore: 0.6,
    trmMaxSteps: 2
  }
};
```

**Enhanced Config** (to add):
```typescript
const config = {
  reranking: {
    enabled: true,
    trmEnabled: true,
    trmWeight: 0.3,
    useTrainedTRM: true,        // NEW
    trmModelPath: './models/trm' // NEW
  },
  answerGeneration: {
    useTRMVerification: true,
    trmMinScore: 0.6,
    trmMaxSteps: 2,
    useTrainedTRM: true,        // NEW
    trmModelPath: './models/trm' // NEW
  }
};
```

---

## Integration Steps

### Step 1: Train TRM Model

```bash
# Create training script
npx tsx scripts/train-trm-model.ts
```

```typescript
// scripts/train-trm-model.ts
import { TRMTrainer, TRMTrainingConfig } from '../frontend/lib/rag/trm-trainer';
import * as tf from '@tensorflow/tfjs-node';

const config: TRMTrainingConfig = {
  embeddingDim: 128,
  hiddenDim: 64,
  outputDim: 10,
  numSupervisionSteps: 5,
  learningRate: 0.001
};

const trainer = new TRMTrainer(config);

// Load training data (legal/insurance queries)
const trainingData = loadTrainingData();

// Train
for (const batch of trainingData) {
  const metrics = await trainer.trainStep(
    tf.tensor(batch.x),
    tf.tensor(batch.y_true),
    config.numSupervisionSteps
  );
}

// Save
await trainer.save('./models/trm-trained');
```

---

### Step 2: Update RAG Components to Accept Trained TRM

**File**: `frontend/lib/rag/document-reranker.ts`

Add config option:
```typescript
export interface RerankingConfig {
  // ... existing
  trmEnabled?: boolean;
  trmWeight?: number;
  useTrainedTRM?: boolean;  // NEW
  trmModelPath?: string;     // NEW
}
```

Update rerank method:
```typescript
async rerank(query: string, documents: Document[], config: RerankingConfig = {}) {
  const {
    trmEnabled = false,
    trmWeight = 0.3,
    useTrainedTRM = false,    // NEW
    trmModelPath,              // NEW
  } = config;

  // ... existing code ...

  if (trmWeight > 0 && documents.length > 0) {
    const trm = useTrainedTRM && trmModelPath
      ? await (async () => {
          const adapter = new TRMTrainedAdapter();
          await adapter.initialize(trmModelPath);
          return adapter;
        })()
      : new TRMAdapter();

    const verify = await trm.verify(query, topKText, ordered[0]?.content || '');
    // ... rest of scoring
  }
}
```

**File**: `frontend/lib/rag/answer-generator.ts`

Similar updates to support trained TRM.

---

### Step 3: Update Permutation Engine Config

**File**: `frontend/lib/permutation-engine.ts`

```typescript
export interface PermutationConfig {
  // ... existing
  enableTRM: boolean;
  useTrainedTRM?: boolean;  // NEW
  trmModelPath?: string;     // NEW
}
```

Update `applyTRM` method:
```typescript
private async applyTRM(query: string, steps: any[]): Promise<any> {
  // Optionally use trained TRM
  if (this.config.useTrainedTRM && this.config.trmModelPath) {
    const trainedTRM = new TRMTrainedAdapter();
    await trainedTRM.initialize(this.config.trmModelPath);
    // Use trained TRM for verification in recursive steps
    // (requires extending TRMTrainedAdapter to work with RVS-style steps)
  }

  // Existing RVS-based implementation
  const { createRVS } = await import('./trm');
  const trm = createRVS({ /* config */ });
  // ... rest of implementation
}
```

---

### Step 4: Update API Routes

**File**: `frontend/app/api/rag/gepa/execute/route.ts`

```typescript
// Accept trained TRM config
const { query, useTrainedTRM, trmModelPath } = await request.json();

const pipeline = new RAGPipeline(vectorStore, ragModel);
const result = await pipeline.execute(query, {
  reranking: {
    trmEnabled: true,
    useTrainedTRM: useTrainedTRM || false,
    trmModelPath: trmModelPath || undefined
  },
  answerGeneration: {
    useTRMVerification: true,
    useTrainedTRM: useTrainedTRM || false,
    trmModelPath: trmModelPath || undefined
  }
});
```

---

## Usage Example

### Current Usage (Heuristic TRM)

```typescript
const engine = new PermutationEngine({
  enableTRM: true,  // Uses heuristic TRMAdapter
  // ... other config
});

const result = await engine.execute(query, domain);
```

### Enhanced Usage (Trained TRM)

```typescript
const engine = new PermutationEngine({
  enableTRM: true,
  useTrainedTRM: true,              // NEW
  trmModelPath: './models/trm-trained', // NEW
  // ... other config
});

const result = await engine.execute(query, domain);
```

---

## Benefits

1. **Learned Halting**: Model learns optimal stopping points (q_hat)
2. **Better Verification**: Training improves faithfulness/relevance scoring
3. **Faster Inference**: Early stopping reduces unnecessary computation
4. **Domain Adaptation**: Can fine-tune on legal/insurance data
5. **Consistency**: EMA weights provide stable predictions

---

## Migration Path

1. **Phase 1**: Train TRM on sample data (current)
2. **Phase 2**: Add config options for trained TRM (new)
3. **Phase 3**: Update RAG components to use trained TRM (new)
4. **Phase 4**: A/B test heuristic vs trained TRM
5. **Phase 5**: Roll out trained TRM to production

---

## Files to Modify

- [ ] `frontend/lib/rag/document-reranker.ts` - Add trained TRM support
- [ ] `frontend/lib/rag/answer-generator.ts` - Add trained TRM support
- [ ] `frontend/lib/rag/complete-rag-pipeline.ts` - Pass trained TRM config
- [ ] `frontend/lib/permutation-engine.ts` - Add trained TRM config
- [ ] `frontend/app/api/rag/gepa/execute/route.ts` - Accept trained TRM params
- [ ] Create `scripts/train-trm-model.ts` - Training script
- [ ] Update tests to support trained TRM

---

## Summary

**Current State**: TRM is integrated using heuristic-based `TRMAdapter` in:
- Permutation Engine (recursive reasoning)
- Document Reranker (scoring)
- Answer Generator (verification)

**New Addition**: TRM training system adds:
- Deep supervision training
- Learned halting (q_hat)
- Gradient-based optimization
- Trained adapter for inference

**Next Steps**: Wire trained TRM into existing integration points by:
1. Adding config flags (`useTrainedTRM`, `trmModelPath`)
2. Updating components to load trained models
3. Maintaining backward compatibility with heuristic TRM

