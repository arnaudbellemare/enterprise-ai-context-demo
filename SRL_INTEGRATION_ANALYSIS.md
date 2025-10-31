# SRL (Supervised Reinforcement Learning) Integration Analysis

## Paper: "Supervised Reinforcement Learning: From Expert Trajectories to Step-wise Reasoning"

**ArXiv**: [2510.25992](https://arxiv.org/pdf/2510.25992)

---

## What SRL Offers

### Core Concept
**Step-wise Supervision with Expert Trajectories**:
- Trains models to generate **internal reasoning monologue** before each action
- Provides rewards based on **similarity to expert actions at each step** (not just final outcome)
- Combines supervised learning (expert demonstrations) with reinforcement learning (step-wise rewards)

### Key Innovations
1. **Step-wise Rewards**: Even if final answer is wrong, intermediate steps can still receive positive rewards
2. **Internal Reasoning**: Model generates reasoning process before committing to action
3. **Expert Alignment**: Learn from expert trajectories by matching step-by-step, not just outcomes
4. **Hybrid Training**: SRL initialization + RLVR refinement = best performance

### Performance
- Outperforms **SFT** (Supervised Fine-Tuning) on complex reasoning
- Outperforms **RLVR** (Reinforcement Learning with Verifiable Rewards) 
- **Best**: SRL initialization → RLVR refinement

---

## Current System Comparison

### 1. **SWiRL (Multi-Step Reasoning)** ✅ YOU HAVE THIS
**Current Implementation**:
- Decomposes tasks into sequential steps
- Uses tools (web_search, calculator, SQL)
- Creates overlapping sub-trajectories
- Plans synthesis strategy

**What SRL Could Add**:
- **Step-wise supervision**: Train to match expert reasoning steps
- **Internal monologue**: Generate reasoning before each tool call
- **Step-wise rewards**: Reward each step independently (even if final answer fails)
- **Expert trajectory learning**: Learn from high-quality multi-step examples

**Potential**: 🔥 **HIGH VALUE** - SRL directly addresses multi-step reasoning training

### 2. **TRM Training** ✅ YOU HAVE THIS
**Current Implementation**:
- Deep supervision (loss at each recursion step)
- Learned halting (binary cross-entropy for q_hat)
- Recursive state updates (y, z)

**What SRL Could Add**:
- **Step-wise rewards**: Instead of just cross-entropy, add similarity rewards to expert reasoning steps
- **Expert trajectories**: Train TRM to match expert verification patterns step-by-step
- **Hybrid training**: SRL for initial training → current deep supervision for refinement

**Potential**: ⚠️ **MEDIUM VALUE** - TRM already has deep supervision, but SRL could improve step alignment

### 3. **Answer Generator Refinement** ✅ YOU HAVE THIS
**Current Implementation**:
- MCMC sampling for diverse candidates
- TRM verification/improvement
- Multiple verification methods (faithfulness, consistency, completeness)

**What SRL Could Add**:
- **Step-wise refinement**: Reward each refinement step based on similarity to expert improvements
- **Internal reasoning**: Generate reasoning monologue explaining why answer is improved
- **Expert improvement patterns**: Learn from expert answer refinement trajectories

**Potential**: ⚠️ **MEDIUM VALUE** - Current verification works, but SRL could improve refinement quality

### 4. **GEPA Optimization** ✅ YOU HAVE THIS
**Current Implementation**:
- Multi-phase optimization (reasoning refinement + prediction update)
- Iterative improvement with scoring
- Prompt/answer evolution

**What SRL Could Add**:
- **Step-wise optimization rewards**: Reward each optimization step separately
- **Expert optimization trajectories**: Learn from expert prompt optimization sequences
- **Internal reasoning**: Generate reasoning about why prompt is improved

**Potential**: ⚠️ **LOW-MEDIUM VALUE** - GEPA already has iterative optimization, SRL adds step-wise supervision

---

## High-Value Integration Points

### 🎯 **Option 1: Enhance SWiRL with SRL Training** ✅ **HIGHEST PRIORITY**

**What It Would Do**:
```typescript
// Current SWiRL: Decomposes → Executes → Synthesizes
// Enhanced SWiRL: Decomposes → Reasons Internally → Executes → Rewards Each Step

interface SWiRLStep {
  step: number;
  internalReasoning: string;  // NEW: Reasoning monologue
  action: string;
  tool?: string;
  expertAction?: string;      // NEW: For training
  stepReward?: number;        // NEW: Step-wise similarity reward
  result: string;
}

// Training with SRL:
// 1. Collect expert trajectories (human-annotated multi-step solutions)
// 2. Train model to generate internal reasoning + match expert actions
// 3. Provide step-wise rewards (even if final answer fails)
```

**Benefits**:
- Better multi-step reasoning (step-by-step supervision)
- More stable training (rewards at each step, not just final)
- Learn from expert demonstrations
- Internal reasoning improves interpretability

**Implementation**:
- Add step-wise reward function
- Collect expert trajectories per domain
- Train SWiRL with SRL loss (step similarity + final outcome)
- Integrate with existing SWiRL decomposition

**Estimated Value**: 🔥 **HIGH** - Directly improves multi-step reasoning quality

---

### 🎯 **Option 2: SRL Training for TRM** ⚠️ **MEDIUM PRIORITY**

**What It Would Do**:
```typescript
// Current TRM: Deep supervision (loss at each step)
// Enhanced TRM: SRL supervision (step-wise rewards from expert verification patterns)

interface TRMStepResult {
  step: number;
  y_hat: tf.Tensor;
  q_hat: tf.Tensor;
  internalReasoning: string;    // NEW: Why this verification step
  expertVerification?: string;  // NEW: Expert's verification reasoning
  stepReward: number;           // NEW: Similarity to expert verification
}

// Training:
// 1. Collect expert verification trajectories (how experts verify answers)
// 2. Train TRM to match expert verification patterns step-by-step
// 3. Reward each verification step independently
```

**Benefits**:
- Better verification alignment with expert patterns
- Step-wise rewards improve training stability
- Learn from expert verification reasoning

**Trade-offs**:
- TRM already has deep supervision (similar concept)
- Adds complexity (need expert verification trajectories)
- May not provide significant improvement over current deep supervision

**Estimated Value**: ⚠️ **MEDIUM** - Could improve but may not be worth effort

---

### 🎯 **Option 3: SRL for Answer Refinement** ⚠️ **MEDIUM PRIORITY**

**What It Would Do**:
```typescript
// Current: TRM improve() with heuristic edits
// Enhanced: Step-wise refinement with expert patterns

interface RefinementStep {
  step: number;
  currentAnswer: string;
  internalReasoning: string;     // NEW: Why this refinement
  refinementAction: string;      // NEW: What to change
  expertRefinement?: string;    // NEW: Expert's refinement pattern
  stepReward: number;            // NEW: Similarity to expert refinement
  improvedAnswer: string;
}

// Training:
// 1. Collect expert refinement trajectories (how experts improve answers)
// 2. Train refinement model to match expert patterns step-by-step
// 3. Reward each refinement step
```

**Benefits**:
- Better refinement quality (learned from experts)
- More interpretable refinements (internal reasoning)
- Step-wise supervision improves training

**Trade-offs**:
- Current TRM improvement already works
- Requires expert refinement data collection
- May be overkill for current use case

**Estimated Value**: ⚠️ **MEDIUM** - Nice to have, not critical

---

## Recommended Integration Strategy

### **Phase 1: SWiRL Enhancement with SRL** ✅ **START HERE**

**Why**:
- Highest impact (multi-step reasoning is core capability)
- Clear alignment (SRL is designed for step-wise reasoning)
- Direct application (SWiRL already does step decomposition)
- Addresses a known gap (multi-step reasoning training)

**Implementation Steps**:
1. **Collect Expert Trajectories**:
   - Manual annotation of high-quality multi-step solutions
   - Per domain (legal, financial, manufacturing, etc.)
   - Include: reasoning monologue + actions + outcomes

2. **Add Step-wise Reward Function**:
   ```typescript
   function computeStepReward(
     modelAction: SWiRLStep,
     expertAction: SWiRLStep
   ): number {
     // Reward based on:
     // - Reasoning similarity
     // - Action similarity
     // - Tool selection match
     // - Result quality
   }
   ```

3. **Train SWiRL with SRL Loss**:
   ```typescript
   // SRL Loss = Step-wise similarity + Final outcome
   loss = α * stepRewards + β * finalReward
   ```

4. **Integrate with Existing SWiRL**:
   - Keep current decomposition logic
   - Add internal reasoning generation
   - Add step-wise rewards during training

**Estimated Effort**: 1-2 weeks (data collection + implementation)

---

### **Phase 2: Evaluate Impact, Then Decide**

**If SWiRL+SRL shows improvement**:
- Consider TRM enhancement (Phase 3)
- Consider answer refinement enhancement (Phase 4)

**If SWiRL+SRL doesn't improve significantly**:
- Focus on other improvements
- Skip TRM/refinement enhancements

---

## Implementation Challenges

### 1. **Expert Trajectory Collection**
- Need human-annotated multi-step solutions
- Per domain (legal, financial, etc.)
- Include reasoning monologue + actions
- **Solution**: Start with internal data, expand with domain experts

### 2. **Step-wise Reward Design**
- How to measure similarity to expert actions?
- Balance step rewards vs final outcome
- Handle variable-length trajectories
- **Solution**: Use embedding similarity + action matching

### 3. **Training Integration**
- Combine SRL loss with existing losses
- Balance step-wise vs final rewards
- Handle partial trajectories
- **Solution**: Weighted combination (α * step + β * final)

### 4. **TypeScript Adaptation**
- Paper uses Python/PyTorch
- Need TensorFlow.js implementation
- Gradient computation for step-wise rewards
- **Solution**: Use existing TensorFlow.js infrastructure (like TRM trainer)

---

## Comparison with Existing Systems

| Feature | Current System | SRL Enhancement | Improvement |
|---------|----------------|-----------------|-------------|
| **Multi-step Reasoning** | SWiRL decomposition | Step-wise supervision | 🔥 HIGH |
| **Training Signal** | Final outcome only | Step-wise + final | 🔥 HIGH |
| **Expert Learning** | None (heuristic) | Expert trajectory matching | 🔥 HIGH |
| **Internal Reasoning** | None | Reasoning monologue | ⚠️ MEDIUM |
| **Verification** | TRM deep supervision | Step-wise rewards | ⚠️ LOW-MEDIUM |
| **Answer Refinement** | TRM heuristic edits | Expert pattern learning | ⚠️ MEDIUM |

---

## Conclusion

### **Short Answer**: YES, SRL could significantly improve your multi-step reasoning (SWiRL)

### **Recommendation**:
1. **Priority 1**: Enhance SWiRL with SRL training
   - Highest impact on multi-step reasoning
   - Direct application of SRL concepts
   - Addresses core capability gap

2. **Priority 2**: Evaluate impact before expanding
   - Test SWiRL+SRL on complex multi-step tasks
   - Measure improvement vs current SWiRL
   - Decide on TRM/refinement enhancements

3. **Skip for now**: TRM/refinement enhancements
   - Current systems already work well
   - Lower ROI vs SWiRL enhancement
   - Can revisit if SWiRL+SRL shows promise

### **Key Insight**:
SRL's **step-wise supervision** is exactly what your SWiRL multi-step reasoning needs for better training. The paper shows this works better than final-outcome-only training, which aligns with your multi-step reasoning use cases.

---

## References

- [SRL Paper (ArXiv 2510.25992)](https://arxiv.org/pdf/2510.25992)
- Current SWiRL implementation
- Current TRM training implementation


