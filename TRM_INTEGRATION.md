# TRM Integration in Permutation System

## Overview

The TRM (Tiny Recursive Model) implementation is integrated into the permutation system at multiple layers:

1. **RAG Pipeline Layer** - Uses TRM for document reranking and answer verification
2. **Permutation Engine Layer** - Uses TRM for recursive reasoning and verification
3. **Training Layer** - New TRM trainer for learning optimal halting and verification patterns

---

## Current Integration Points

### 1. RAG Pipeline Integration

**File**: `frontend/lib/rag/document-reranker.ts`
**Usage**: TRM verification scores blended into document ranking

```typescript
// When trmEnabled=true, TRM verifies top documents
if (trmEnabled && trmWeight > 0 && documents.length > 0) {
  const trm = new TRMAdapter();
  const verify = await trm.verify(query, topKText, ordered[0]?.content || '');
  const trmScore = verify.score; // 0..1
  item.score = (1 - trmWeight) * item.scoreBase + trmWeight * trmScore;
}
```

**Configuration**:
- `trmEnabled: boolean` - Enable TRM scoring in reranking
- `trmWeight: number` (0..1) - Weight for TRM score vs base ranking

---

**File**: `frontend/lib/rag/answer-generator.ts`
**Usage**: TRM verification/improvement after LLM generation

```typescript
// Optional TRM verification/improvement pass
if (useTRMVerification) {
  const trm = new TRMAdapter({ maxSteps: trmMaxSteps, minScore: trmMinScore });
  const verify = await trm.verify(query, context, bestAnswer);
  if (verify.score < trmMinScore) {
    const improved = await trm.improve(query, context, bestAnswer);
    bestAnswer = improved.answer;
  }
}
```

**Configuration**:
- `useTRMVerification: boolean` - Enable TRM verification
- `trmMinScore: number` (0..1) - Minimum acceptable score
- `trmMaxSteps: number` - Max recursive improvement steps

---

### 2. Permutation Engine Integration

**File**: `frontend/lib/permutation-engine.ts`
**Usage**: TRM recursive reasoning in main execution flow

```typescript
// STEP 9: TRM Recursive Reasoning + Verification
if (this.config.enableTRM) {
  trmResult = await this.applyTRM(query, swirlSteps);
  // Returns: { iterations, verified, confidence, answer }
}
```

**Method**: `applyTRM(query, steps)`
- Uses `createRVS()` from `./trm` module
- Performs recursive refinement with adaptive computation
- Returns verified answer with confidence score

**Configuration**:
- `enableTRM: boolean` - Enable TRM in permutation engine
- Default: `true` (fast verification mode)

---

### 3. Complete RAG Pipeline Integration

**File**: `frontend/lib/rag/complete-rag-pipeline.ts`
**Usage**: Full GEPA RAG pipeline with TRM verification

The complete pipeline automatically uses TRM when:
- Reranking is enabled with `trmEnabled: true`
- Answer generation has `useTRMVerification: true`

---

## New TRM Training Integration

### Training System

**File**: `frontend/lib/rag/trm-trainer.ts`
**Features**:
- Deep supervision training loop
- Learned halting via `q_hat` (binary cross-entropy)
- Recursive state updates `(y, z)` through `deep_recursion(x, y, z)`
- Gradient-based optimization (TensorFlow.js)
- Exponential moving average for stability

### Trained Adapter

**File**: `frontend/lib/rag/trm-trained-adapter.ts`
**Usage**: Drop-in replacement for `TRMAdapter` using trained model

```typescript
import { TRMTrainedAdapter } from './trm-trained-adapter';

// Initialize with trained model
const trm = new TRMTrainedAdapter(
  { maxSteps: 3, minScore: 0.6 },
  trainingConfig,  // TRMTrainingConfig
  embeddingFn      // Optional: (text: string) => Promise<number[]>
);

// Load trained weights
await trm.initialize('path/to/trained/model');

// Use same API as TRMAdapter
const verify = await trm.տverify(query, context, answer);
const improved = await trm.improve(query, context, answer);
```

---

## Integration Path

### Step 1: Train TRM Model

```typescript
import { TRMTrainer, TRMTrainingConfig } from './frontend/lib/rag/trm-trainer';
import * as tf from '@tensorflow/tfjs-node';

const config통 TRMTrainingConfig = {
  embeddingDim: 128,
  hiddenDim: 64,
  outputDim: 10,
  numSupervisionSteps: 5,
  learningRate: 0.001
};

const trainer = new TRMTrainer(config);

// Training loop
for (const batch of trainingData) {
  const metrics = await trainer.trainStep(batch.x, batch.y_true, config.numSupervisionSteps);
  // Metrics include: loss, haltingLoss, predictionLoss, avgQHat
}

// Save trained model
await trainer.save('./models/trm-trained');
```

### Step 2: Use Trained TRM in RAG Pipeline

**Update**: `frontend/lib/rag/document-reranker.ts`

```typescript
import { TRMTrainedAdapter } from './trm-trained-adapter';

// Replace TRMAdapter with TRMTrainedAdapter
const trm = config.trmTrainedModelPath
  ? await TRMTrainedAdapter.fromSaved(config.trmTrainedModelPath)
  : new TRMAdapter();
```

**Update**: `frontend/lib/rag/answer-generator.ts`

```typescript
import { TRMTrainedAdapter } from './trm-trained-adapter';

// Use trained TRM if available
const trm = config.useTrainedTRM
  ? await TRMTrainedAdapter.fromSaved(config.trmModelPath)
  : new TRMAdapter({ maxSteps: trmMaxSteps, minScore: trmMinScore });
```

### Step 3: Update Permutation Engine

**Update**: `frontend/lib/permutation-engine.ts`

```typescript
// In applyTRM method, optionally use trained TRM
if (this.config.useTrainedTRM && this.config.trmModelPath) {
  const trainedTRM = await TRMTrainedAdapter.fromSaved(this.config.trmModelPath);
  // Use trained TRM for verification in recursive steps
}
```

---

## Configuration Options

### Permutation Engine Config

```typescript
const config: PermutationConfig = {
 数据库中  enableTRM: true,              // Enable TRM reasoning
  useTrainedTRM: false,           // Use trained model (new)
  trmModelPath: './models/trm',   // Path to trained model (new)
  // ... other config
};
```

### RAG Pipeline Config

```typescript
const config = {
  reranking: {
    enabled: true,
    trmEnabled: true,           // Enable TRM scoring
    trmWeight: 0.3,             // Weight for TRM score
    useTrainedTRM: false,       // Use trained model (new)
    trmModelPath: './models/trm' // Path to trained model (new)
  },
  answerGeneration: {
    useTRMVerification: true,
    trmMinScore: 0.6,
    trmMaxSteps: 2,
    useTrainedTRM: false,       // Use trained model (new)
    trmModelPath: './models/trm' // Path to trained model (new)
  }
};
```

---

## Testing Integration

### Test Training

```bash
npx tsx test-trm-training.ts
```

### Test in RAG Pipeline

```typescript
// In test-permutation-legal.ts or similar
const pipeline = new RAGPipeline(vectorStore, MODEL);
const result = await pipeline.execute(complexQuery, {
  reranking: { trmEnabled: true, useTrainedTRM: true },
  answerGeneration: { useTRMVerification: true, useTrainedTRM: true }
});
```

---

## Architecture Flow

```
User Query
    ↓
Permutation Engine
    ├─→ ACE Framework (context engineering)
    ├─→ SWiRL (multi-step reasoning)
    └─→ TRM (recursive verification) ← NEW TRAINED TRM
            ↓
        RAG Pipeline
            ├─→ Query Reformulation
            ├─→ Document Retrieval
            ├─→ Document Reranking ← TRM Scoring
            ├─→ Context Synthesis
            └─→ Answer Generation ← TRM Verification/Improvement
                    ↓
                Final Answer (TRM-verified)
```

---

## Benefits of Trained TRM

1. **Learned Halting** - Model learns when to stop recursion (via `q_hat`)
2. **Better Verification** - Training improves faithfulness/relevance scoring
3. **Faster Inference** - Early stopping reduces unnecessary steps
4. **Domain Adaptation** - Can be fine-tuned on domain-specific data
5. **Consistency** - EMA weights provide stable predictions

---

## Next Steps

1. **Train on Domain Data** - Collect legal/insurance queries and train TRM
2. **Integrate Trained Model** - Update RAG pipeline to use trained TRM
3. **Benchmark Performance** - Compare trained vs heuristic TRM
4. **Fine-tuning** - Continue training on production queries
5. **A/B Testing** - Compare trained TRM in production

---

## Files Modified for Full Integration

1. `frontend/lib/rag/document-reranker.ts` - Add trained TRM option
2. `frontend/lib/rag/answer-generator.ts` - Add trained TRM option
3. `frontend/lib/rag/complete-rag-pipeline.ts` - Pass trained TRM config
4. `frontend/lib/permutation-engine.ts` - Optionally use trained TRM
5. `frontend/app/api/rag/gepa/execute/route.ts` - Accept trained TRM config

