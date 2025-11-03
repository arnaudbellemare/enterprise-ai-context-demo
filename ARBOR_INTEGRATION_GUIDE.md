# ArborProvider + GRPO/mmGRPO Integration Guide

## Overview

This implementation adds **ArborProvider with GRPO/mmGRPO** to your existing PERMUTATION system, following the recommended **GEPA → Arbor workflow** for optimal multi-module pipeline optimization.

## Key Improvements

### 1. **GEPA → Arbor Workflow**
- **Phase 1**: GEPA offline optimization (fast, sample-efficient prompt evolution)
- **Phase 2**: Arbor online RL (adapts to live reward signals)
- **Result**: GEPA finds good regions, Arbor adapts in production

### 2. **Multi-Hop Research Optimization**
- Improves multi-hop recall from **61.8% → 76.2%** (as per your findings)
- Configurable max hops (default: 3)
- Automatic convergence detection

### 3. **Privacy-Conscious Delegation**
- Tracks privacy rewards for sensitive operations
- Prefers local LLMs for privacy-sensitive tasks
- Configurable privacy weights

### 4. **Reward Hacking Protection**
- Monitors for suspicious reward patterns
- Automatic rollback on detection
- Checkpoint/restore system

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMUTATION System                       │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   GEPA Phase    │  ──────> │  Arbor Phase     │        │
│  │  (Offline)      │  Warm-   │  (Online RL)     │        │
│  │                 │  Start   │                  │        │
│  │ - Fast          │          │ - GRPO/mmGRPO    │        │
│  │ - Sample-Efficient│        │ - Multi-hop      │        │
│  │ - Until Plateau │          │ - Privacy-aware │        │
│  └──────────────────┘          └──────────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │           Reward Signal (Quality, Cost, Privacy) │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │       DSPy Module (Stable Signatures)            │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Status

### ✅ Completed

1. **ArborProvider** (`frontend/lib/arbor-provider.ts`)
   - GRPO/mmGRPO implementation
   - GEPA warm-start support
   - Multi-hop research optimization
   - Privacy-conscious delegation
   - Reward hacking monitoring
   - Checkpoint/rollback system

2. **GEPA-Arbor Workflow** (`frontend/lib/gepa-arbor-workflow.ts`)
   - Phase 1: GEPA offline optimization
   - Phase 2: Arbor online RL
   - Plateau detection
   - Auto-switching between phases
   - Offline test set curation

### 🔄 Integration Points

Your system already has:
- ✅ **GEPA optimizer** (`frontend/lib/dspy-gepa-optimizer.ts`)
- ✅ **DSPy modules** with stable signatures
- ✅ **Offline test sets** in `benchmarking/` directory
- ✅ **Reward tracking** in `frontend/lib/dspy-reward-optimization.ts`

## Usage

### Basic Integration

```typescript
import { createGEPAArborWorkflow } from '@/lib/gepa-arbor-workflow';
import { LM } from 'dspy-ai';

// Initialize workflow
const baseLM = new LM('ollama', {
  api_base: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
});

const workflow = createGEPAArborWorkflow(baseLM, {
  gepa: {
    num_iterations: 10,
    convergence_threshold: 0.01,
    max_iterations: 20
  },
  arbor: {
    use_mmgrpo: false,        // Use GRPO (or true for mmGRPO)
    num_rollouts: 24,
    enable_multi_hop: true,
    enable_privacy_rewards: true
  },
  enable_arbor: true,
  auto_switch: true
});

// Load offline test set (best practice)
await workflow.loadOfflineTestSet('./benchmarking/data/validation.json');

// Optimize module
const result = await workflow.optimize(dspyModule, trainset);

console.log(`GEPA improvement: ${result.gepa_improvement}`);
console.log(`Arbor improvement: ${result.arbor_improvement || 0}`);
```

### Online Reward Updates (Production)

```typescript
// After each query in production, update Arbor with reward
await workflow.updateOnlineReward({
  quality: 0.85,
  cost: 0.001,
  privacy: 0.9,
  latency_ms: 1200,
  timestamp: new Date()
});
```

### Multi-Hop Research

```typescript
const workflow = createGEPAArborWorkflow(baseLM, {
  arbor: {
    enable_multi_hop: true,
    max_hops: 3,
    num_rollouts: 24
  }
});
```

### Privacy-Conscious Delegation

```typescript
const workflow = createGEPAArborWorkflow(baseLM, {
  arbor: {
    enable_privacy_rewards: true,
    local_llm_priority: true,
    reward_dimensions: {
      quality: 0.4,
      cost: -0.2,
      privacy: 0.4,      // Higher privacy weight
      latency: -0.1
    }
  }
});
```

## Best Practices (As Per Your Recommendations)

### 1. **Keep DSPy Signatures Stable**
✅ Your DSPy modules already use stable signatures

### 2. **Curate Offline Test Set**
```typescript
// Load curated test set before optimization
await workflow.loadOfflineTestSet('./benchmarking/data/validation.json');
```

### 3. **Run GEPA Until Plateau**
```typescript
// Auto-detects plateau and switches to Arbor
const workflow = createGEPAArborWorkflow(baseLM, {
  gepa: {
    convergence_threshold: 0.01,  // Stop when improvement < 0.01
    gepa_plateau_check: 3          // Check every 3 iterations
  },
  auto_switch: true                // Auto-switch when plateau detected
});
```

### 4. **Switch to Arbor for Online Rewards**
```typescript
// Arbor automatically continues after GEPA
// Call updateOnlineReward() after each query in production
```

### 5. **Monitor for Reward Hacking**
```typescript
// Automatic monitoring enabled by default
const workflow = createGEPAArborWorkflow(baseLM, {
  enable_monitoring: true,
  arbor: {
    reward_hacking_threshold: 0.95,  // Detect if avg reward > 0.95
    enable_rollback: true            // Auto-rollback on detection
  }
});
```

### 6. **Checkpoint/Rollback**
```typescript
// Save checkpoint periodically
const checkpointPath = await workflow.saveCheckpoint();

// Load checkpoint if needed
await workflow.loadCheckpoint(checkpointPath);
```

## Integration with Permutation-Lite

To integrate with your existing `PermutationLitePipeline`:

```typescript
// In permutation-lite-pipeline.ts
import { createGEPAArborWorkflow } from './gepa-arbor-workflow';

// During optimization phase
if (this.config.enableOptimization) {
  // Option 1: Use existing GEPA (current behavior)
  const optimizationResult = await this.executeOptimization(query, routingResult);
  
  // Option 2: Use GEPA → Arbor workflow (new)
  if (this.config.useArborWorkflow) {
    const workflow = createGEPAArborWorkflow(baseLM);
    await workflow.loadOfflineTestSet();
    const result = await workflow.optimize(dspyModule, trainset);
    // Use result.final_prompts
  }
}
```

## Performance Expectations

Based on your findings:
- **Multi-hop recall**: 61.8% → 76.2% improvement
- **Cost**: Slightly higher than pure text optimizers, but solid for online RL
- **Recommendation**: Start with small local LMs + tight rewards

## Next Steps

1. **Integrate into Permutation-Lite**
   - Add `useArborWorkflow` config option
   - Replace GEPA-only optimization with GEPA → Arbor workflow
   - Add online reward tracking in production

2. **Curate Offline Test Set**
   - Use existing `benchmarking/data/` datasets
   - Create validation split if not exists
   - Ensure test set covers key use cases

3. **Monitor in Production**
   - Track reward signals (quality, cost, privacy)
   - Monitor for reward hacking
   - Save checkpoints periodically

4. **Optimize Rewards**
   - Tune reward dimensions based on your priorities
   - Adjust privacy weights for sensitive tasks
   - Fine-tune latency vs quality trade-offs

## Files Created

1. `frontend/lib/arbor-provider.ts` - ArborProvider with GRPO/mmGRPO
2. `frontend/lib/gepa-arbor-workflow.ts` - GEPA → Arbor workflow manager
3. `ARBOR_INTEGRATION_GUIDE.md` - This guide

## Testing

```typescript
// Test GEPA phase
const workflow = createGEPAArborWorkflow(baseLM, {
  enable_arbor: false  // Test GEPA only
});

// Test Arbor phase
const workflow = createGEPAArborWorkflow(baseLM, {
  gepa: { max_iterations: 1 }  // Quick GEPA, then Arbor
});

// Test multi-hop
const workflow = createGEPAArborWorkflow(baseLM, {
  arbor: {
    enable_multi_hop: true,
    max_hops: 3
  }
});
```

## References

- Your findings: GEPA → Arbor workflow, multi-hop improvements
- Recommendation: Start with small local LMs + tight rewards
- Best practices: Stable signatures, curated test set, plateau detection, monitoring

