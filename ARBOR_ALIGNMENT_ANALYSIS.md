# ArborProvider Alignment with Modern ML Best Practices

## Recommended Architecture Principles

Your principles align with modern research recommendations:

1. ✅ **Joint-embedding architectures** (not probabilistic)
2. ✅ **Energy-based models** (EBM) (not probabilistic)
3. ⚠️ **Regularized methods** (not contrastive) - **Partially implemented**
4. ❌ **Model-predictive control** (not RL) - **ArborProvider violates this**
5. ✅ **Use RL only when planning fails** - **ArborProvider doesn't do this**

## Current State Analysis

### ✅ What You Already Have (Good Alignment)

1. **Energy-Based Models (EBM)**
   - ✅ `frontend/lib/ebm/answer-refiner-simple.ts` - Energy-based answer refinement
   - ✅ Used in unified pipeline (`enableEBM` option)
   - ✅ Aligns with "abandon probabilistic models in favor of energy-based models"

2. **Planning/Model-Predictive Control Components**
   - ✅ IRT (Item Response Theory) - Predicts query difficulty
   - ✅ Routing system - Plans which components to use
   - ✅ RVS (Recursive Verification System) - Plans verification steps
   - ✅ SWiRL - Has planning elements

### ❌ What ArborProvider Does Wrong

**ArborProvider currently:**
- ❌ Uses RL (GRPO/mmGRPO) **directly** without planning first
- ❌ Doesn't check if planning/model-predictive control works first
- ❌ Violates: "Use RL only when planning doesn't yield predicted outcome"

### ⚠️ What Needs Refactoring

1. **Contrastive Methods Still Used**
   - `frontend/lib/self-improving-judge.ts` - Uses contrastive learning
   - `frontend/lib/arcmemo-reasoning-bank.ts` - Uses contrastive signals
   - Should switch to regularized methods

2. **ArborProvider Should:**
   - Use **model-predictive control** (planning with EBM critic) FIRST
   - Only use RL when planning predictions don't match outcomes
   - Adjust world model or critic, not directly optimize policy

## Proposed Refactored Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PLANNING FIRST                          │
│                                                             │
│  1. Model-Predictive Control (MPC)                         │
│     ├─ EBM Critic (predict outcome)                       │
│     ├─ Planning: Predict quality/cost/privacy              │
│     └─ Execute planned action                             │
│                                                             │
│  2. Check: Did prediction match outcome?                   │
│     ├─ ✅ YES → Continue with MPC                          │
│     └─ ❌ NO → Use RL to adjust world model/critic         │
│                                                             │
│  3. RL Adjustment (Only when needed)                       │
│     ├─ Update EBM critic (world model)                     │
│     ├─ Adjust predictions                                  │
│     └─ Go back to step 1 (planning)                       │
│                                                             │
│  ❌ NOT: Direct RL policy optimization                     │
└─────────────────────────────────────────────────────────────┘
```

## Refactored ArborProvider Architecture

### Phase 1: Planning with EBM Critic (Model-Predictive Control)

```typescript
// 1. Use EBM to predict outcome (energy-based critic)
const predictedOutcome = await ebmCritic.predict({
  query,
  proposedPrompt,
  context
});

// 2. Execute planned action
const actualOutcome = await executeWithPrompt(proposedPrompt);

// 3. Compare prediction vs reality
const predictionError = calculateError(predictedOutcome, actualOutcome);

if (predictionError < threshold) {
  // ✅ Planning worked! Continue with MPC
  return { success: true, usedRL: false };
}
```

### Phase 2: RL Adjustment (Only When Planning Fails)

```typescript
// Planning failed → Use RL to improve world model
if (predictionError > threshold) {
  // Update EBM critic (world model) using RL
  await updateWorldModelWithRL({
    predicted: predictedOutcome,
    actual: actualOutcome,
    error: predictionError
  });
  
  // Now go back to planning (not continue with RL)
  return { success: false, usedRL: true, retryWithPlanning: true };
}
```

## Implementation Plan

### Step 1: Refactor ArborProvider to Use MPC First

**Current (Wrong):**
```typescript
// ArborProvider directly uses RL
await this.performOnlineUpdate(); // GRPO/mmGRPO
```

**Refactored (Correct):**
```typescript
// 1. Planning phase (EBM critic)
const predictedReward = await this.ebmCritic.predictReward(query, prompt);

// 2. Execute planned action
const actualReward = await this.executeWithPrompt(prompt);

// 3. Check if prediction matched
if (this.predictionMatched(predictedReward, actualReward)) {
  // ✅ Planning works - continue with MPC
  return;
}

// 4. Planning failed - use RL to adjust critic (not policy)
await this.adjustCriticWithRL(predictedReward, actualReward);
```

### Step 2: Replace Contrastive with Regularized Methods

**Current (Wrong):**
```typescript
// contrastive learning
const contrastiveExamples = await this.createContrastiveExamples(...);
```

**Refactored (Correct):**
```typescript
// Regularized learning (e.g., L2 regularization on embeddings)
const regularizedLoss = baseLoss + lambda * L2Norm(embeddings);
```

### Step 3: Use Joint-Embedding Architectures

**Current:**
- Separate embeddings for query and context

**Improved:**
- Joint embeddings that capture query-context relationships
- Energy-based scoring of joint embeddings (not probabilistic)

## Alignment Checklist

| Principle | Current | Target | Status |
|-----------|---------|--------|--------|
| Joint-embedding | ❌ Separate | ✅ Joint | **Needs work** |
| Energy-based models | ✅ EBM exists | ✅ Use for critic | **Aligns** |
| Regularized methods | ⚠️ Some contrastive | ✅ All regularized | **Needs refactor** |
| Model-predictive control | ❌ No MPC | ✅ MPC first | **Needs implementation** |
| RL only when planning fails | ❌ RL first | ✅ RL fallback | **Needs refactor** |

## Recommended Next Steps

1. **Refactor ArborProvider** to use MPC-first approach
   - Add EBM critic for outcome prediction
   - Use planning/model-predictive control before RL
   - Only use RL to adjust critic when planning fails

2. **Replace contrastive methods** with regularized methods
   - Update `self-improving-judge.ts`
   - Update `arcmemo-reasoning-bank.ts`

3. **Add joint-embedding architectures**
   - Create joint query-context embeddings
   - Use energy-based scoring (not probabilistic)

4. **Integrate EBM critic** into ArborProvider
   - Use existing `EBMAnswerRefiner` as critic
   - Predict rewards before execution
   - Compare predictions to actual outcomes

## Conclusion

**Current ArborProvider:** ❌ Violates principles (RL-first approach)

**Refactored ArborProvider:** ✅ Aligns with principles (MPC-first, RL only when planning fails)

**Action Required:** Refactor ArborProvider to use model-predictive control with EBM critic first, then RL only to adjust world model when predictions don't match outcomes.

