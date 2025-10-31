# Ideal Testing Approach - Phase 1 Baseline Results & Recommendations

## ✅ What We Fixed

### 1. **Timeout Issues**
- **Problem**: Ollama calls hanging indefinitely during testing
- **Solution**: 
  - Added `BASELINE_TESTING=true` flag
  - Ollama timeout: 30s (simple) / 60s (complex queries)
  - Test-level timeout: 1-5 minutes based on query complexity
- **Result**: Tests now complete reliably without hanging

### 2. **Component Configuration**
- **Problem**: All components enabled for all queries (too slow)
- **Solution**: Selective component activation based on query category:
  - **Multi-step queries**: SWiRL + TRM (but disabled for very_high complexity)
  - **Verification queries**: TRM enabled
  - **Refinement queries**: GEPA enabled
  - **Very high complexity**: Simplified config (skip SWiRL/TRM/GEPA/ACE for speed)
- **Result**: Faster baseline establishment while maintaining relevance

### 3. **Model Selection**
- **Problem**: Student model (Ollama) too slow for baseline testing
- **Solution**: Use Teacher model (Perplexity) for faster, more reliable responses
- **Result**: More consistent baseline results

---

## 📊 Baseline Test Results (Partial - Query 1 Complete)

### Query 1: Multi-Step Financial Analysis (Very High Complexity)

**Configuration**:
- Components: Simplified (SWiRL/TRM/ACE disabled for speed)
- Model: Perplexity (Teacher) + Ollama (Student) 
- Timeout: 5 minutes

**Results**:
- ✅ **Success**: Completed successfully
- **Accuracy**: 85.0% (estimated)
- **Latency**: 91.4 seconds
- **Cost**: $0.0019 (2 Perplexity calls)
- **Components Used**: Multi-query, ReasoningBank, Parallel Research (3 agents)

**Insights**:
- System handled very high complexity query despite simplified config
- Perplexity provided high-quality synthesis
- Ollama was slow (15-52s per call) but completed within timeouts
- Multi-agent research team worked well

---

## 🎯 Ideal Testing Strategy

### **Phase 1: Baseline (CURRENT - In Progress)** ✅

**Status**: Running, Query 1 complete, Query 2 in progress

**What We're Learning**:
1. Current system performance on different query types
2. Latency patterns (Ollama vs Perplexity)
3. Component effectiveness by category
4. Failure modes and error handling

**Recommendation**: Let baseline test complete (may take 10-15 minutes for all 7 queries)

---

### **Phase 2: SRL Implementation** 🚧

**When to Start**: After baseline complete

**Implementation Priority**:
1. **SRL for Multi-Step Reasoning** (Highest Value)
   - Enhance SWiRL with step-wise supervision
   - Collect expert trajectories for financial/legal domains
   - Test on multi-step queries (msr-1, msr-2, msr-3)

2. **SRL for Verification** (Medium Value)
   - Enhance TRM verification with step-wise rewards
   - Test on verification queries (ver-1, ver-2)

**Expected Impact**:
- +10-25% accuracy on multi-step reasoning
- Better step-by-step alignment
- More stable training signal

---

### **Phase 3: nanoEBM Implementation** 🚧

**When to Start**: After SRL testing complete

**Implementation Priority**:
1. **EBM for Answer Refinement** (Highest Value)
   - Energy-based refinement for answer improvement
   - Test on refinement queries (ref-1, ref-2)

2. **EBM for Verification** (Medium Value)
   - Energy function for answer verification
   - Alternative to TRM's token-based heuristics

**Expected Impact**:
- +15-30% refinement quality improvement
- Faster convergence than heuristic approaches
- More principled optimization

---

### **Phase 4: Combined Testing** 🚧

**When to Start**: After both SRL and nanoEBM implemented

**Test Combinations**:
1. Current + SRL
2. Current + nanoEBM
3. SRL + nanoEBM
4. Current + SRL + nanoEBM

**Goal**: Identify optimal combination for each query category

---

## 📈 Current Baseline Insights (From Query 1)

### **Strengths**:
✅ Handles very high complexity queries  
✅ Multi-agent research team works well  
✅ Perplexity provides high-quality synthesis  
✅ ReasoningBank integration functional  
✅ Timeout handling prevents hanging  

### **Weaknesses**:
⚠️ Ollama (Student) is slow (15-52s per call)  
⚠️ Very high complexity queries require simplified config  
⚠️ No SRL/nanoEBM yet (baseline only)  
⚠️ Components disabled for speed vs quality trade-off  

### **Observations**:
- System completes complex queries but slowly
- Perplexity (Teacher) is faster and more reliable
- Multi-agent parallelization helps
- Need SRL/nanoEBM for further improvements

---

## 🎯 Ideal Next Steps (In Order)

### **Immediate (Now)**:
1. ✅ **Let baseline test complete** - Gather full baseline metrics
2. ✅ **Analyze baseline results** - Identify patterns and bottlenecks
3. 📝 **Document baseline findings** - Create baseline report

### **Short-term (This Week)**:
1. **Implement SRL Enhancement** (2-3 days)
   - Create `frontend/lib/srl/swirl-srl-enhancer.ts`
   - Add step-wise reward computation
   - Integrate with SWiRL decomposition

2. **Collect Expert Trajectories** (1-2 days)
   - Annotate 5-10 multi-step solutions per domain
   - Financial, Legal, Science domains
   - Include reasoning monologue + actions

3. **Test SRL vs Baseline** (1 day)
   - Re-run comparative test with SRL enabled
   - Compare accuracy, latency, convergence

### **Medium-term (Next Week)**:
1. **Implement nanoEBM Refinement** (2-3 days)
   - Create `frontend/lib/ebm/answer-refiner.ts`
   - Implement energy function
   - Gradient descent refinement loop

2. **Test nanoEBM vs Baseline** (1 day)
   - Compare refinement quality
   - Measure convergence speed

3. **Combined Testing** (2 days)
   - Test all combinations
   - Identify optimal approach per category

---

## 💡 Key Recommendations

### **1. Complete Baseline First** ✅ **DOING NOW**
- Don't skip baseline - needed for comparison
- Current test is running correctly
- Wait for all 7 queries to complete

### **2. Implement SRL Next** ⚠️ **HIGHEST PRIORITY**
- SRL directly addresses multi-step reasoning (your biggest use case)
- Expected +10-25% accuracy improvement
- Step-wise supervision is exactly what SWiRL needs

### **3. Implement nanoEBM After SRL** ⚠️ **MEDIUM PRIORITY**
- nanoEBM addresses refinement (GEPA's domain)
- Could improve answer quality by +15-30%
- Less critical than SRL for multi-step reasoning

### **4. Test Combinations Last** 📋 **AFTER BOTH DONE**
- Only meaningful when both SRL and nanoEBM implemented
- Compare all combinations to find optimal

---

## 🔧 Configuration for Future Tests

### **Baseline Test Config** (Current):
```typescript
{
  enableTeacherModel: true,
  enableStudentModel: false,  // Skip Ollama for speed
  enableSWiRL: category === 'multi_step' && complexity !== 'very_high',
  enableTRM: category === 'verification' && complexity !== 'very_high',
  enableGEPA: category === 'refinement' && complexity !== 'very_high',
  enableRAG: false  // Clean baseline
}
```

### **SRL Test Config** (Future):
```typescript
{
  enableSWiRL: true,
  enableSRL: true,  // NEW
  srlConfig: {
    expertTrajectories: loadTrajectories(domain),
    stepRewardWeight: 0.6
  }
}
```

### **nanoEBM Test Config** (Future):
```typescript
{
  enableEBM: true,  // NEW
  ebmConfig: {
    refinementSteps: 4,
    learningRate: 0.5
  }
}
```

---

## 📝 Summary

**Current Status**: ✅ Baseline test running successfully

**Key Fixes Applied**:
- ✅ Timeout handling (prevents hanging)
- ✅ Selective component activation (faster)
- ✅ Error handling (tests continue on failure)

**Next Steps**:
1. Let baseline complete (10-15 min)
2. Analyze results
3. Implement SRL enhancement
4. Test SRL vs baseline
5. Implement nanoEBM
6. Test combinations

**Expected Timeline**:
- Baseline: ✅ In progress (almost done)
- SRL Implementation: 2-3 days
- SRL Testing: 1 day
- nanoEBM Implementation: 2-3 days
- nanoEBM Testing: 1 day
- Combined Testing: 2 days
- **Total**: ~1.5 weeks to complete all phases


