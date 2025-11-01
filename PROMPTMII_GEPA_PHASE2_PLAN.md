# PromptMII+GEPA Phase 2 Integration Plan

**Date**: January 27, 2025  
**Goal**: Integrate compound optimizer into ACE, SWiRL, TRM, and RAG with minimal invasive changes

---

## Strategy: Wrapper-Based Integration

Instead of modifying core framework internals (high risk, high complexity), we'll create **wrapper functions** that:
1. Intercept prompts before they're sent to LLMs
2. Apply PromptMII+GEPA optimization
3. Use optimized prompts while maintaining compatibility

---

## Architecture

```
Original Component (ACE/SWiRL/TRM/RAG)
    ↓
Wrapper Function
    ↓
PromptMII+GEPA Optimizer
    ↓
Optimized Prompt
    ↓
Original Component (uses optimized prompt)
```

---

## Integration Points

### 1. ACE Framework

**Current**: Hardcoded prompts in `generateReasoning`, `generateActions`

**Approach**: Create `EnhancedACEGenerator` that wraps existing `ACEGenerator`

**Files**:
- `frontend/lib/ace-promptmii-gepa-integration.ts` (wrapper)
- Modify ACE calls in `frontend/app/api/arena/execute-ace/*/route.ts`

**Prompts to Optimize**:
- Reasoning generation
- Action generation
- Reflection analysis

---

### 2. SWiRL Decomposer

**Current**: Direct LLM calls in `decompose()`, `generateTrajectory()`

**Approach**: Intercept `SWiRLDecomposer.decompose()` calls

**Files**:
- `frontend/lib/swirl-promptmii-gepa-integration.ts` (wrapper)
- Modify SWiRL calls in `frontend/app/api/arena/execute-swirl-trm-full/route.ts`

**Prompts to Optimize**:
- Task decomposition prompts
- Synthesis plan generation

---

### 3. TRM Verification

**Current**: Adaptive redo loop in `adaptive-redo-loop.ts`

**Approach**: Wrap `AdaptiveRedoLoop.executeWithACT()`

**Files**:
- `frontend/lib/trm-promptmii-gepa-integration.ts` (wrapper)
- Modify TRM calls in `frontend/app/api/arena/execute-trm-adaptive/route.ts`

**Prompts to Optimize**:
- Verification prompts
- Multi-scale reasoning prompts

---

### 4. RAG Pipeline

**Current**: Evolved prompts from GEPA in `gepa-evolved-prompts.ts`

**Approach**: Apply PromptMII on top of GEPA-evolved prompts

**Files**:
- `frontend/lib/rag/rag-promptmii-gepa-integration.ts` (wrapper)
- Modify RAG calls in `frontend/app/api/brain/route.ts`

**Prompts to Optimize**:
- Query expansion prompts
- Contextual retrieval prompts

---

## Implementation Steps

### Phase 2.1: SWiRL Integration (First, simplest)

**Why**: SWiRL has clearest prompt patterns

**Steps**:
1. Create wrapper for `SWiRLDecomposer`
2. Add optimization flag to config
3. Test with single query
4. Benchmark improvement

**Files**:
- `frontend/lib/swirl-promptmii-gepa-integration.ts`
- Modify `execute-swirl-trm-full/route.ts`

---

### Phase 2.2: TRM Integration

**Why**: TRM has structured reasoning prompts

**Steps**:
1. Create wrapper for `AdaptiveRedoLoop`
2. Add optimization to verification layer
3. Test with validation queries
4. Benchmark quality improvement

**Files**:
- `frontend/lib/trm-promptmii-gepa-integration.ts`
- Modify `execute-trm-adaptive/route.ts`

---

### Phase 2.3: ACE Integration

**Why**: ACE has multiple prompt types

**Steps**:
1. Create wrapper for `ACEGenerator`
2. Optimize reasoning and action prompts
3. Test with complex queries
4. Benchmark efficiency gains

**Files**:
- `frontend/lib/ace-promptmii-gepa-integration.ts`
- Modify ACE execution routes

---

### Phase 2.4: RAG Integration

**Why**: Already has GEPA, add PromptMII layer

**Steps**:
1. Enhance RAG pipeline to apply PromptMII
2. Test with retrieval queries
3. Benchmark token/cost reduction

**Files**:
- `frontend/lib/rag/rag-promptmii-gepa-integration.ts`
- Modify RAG pipeline calls

---

## Benchmarking Strategy

### Test Suite

**Location**: `test-promptmii-gepa-phase2.ts`

**Test Cases**:
1. SWiRL: Complex multi-step decomposition
2. TRM: Verification of reasoning chains
3. ACE: Context engineering with playbook
4. RAG: Document retrieval and synthesis

**Metrics**:
- Token reduction
- Quality improvement
- Cost savings
- Latency impact

---

## Risk Mitigation

### Performance

**Risk**: Optimization adds latency

**Mitigation**: Use cached optimizations, only optimize if significant improvement

**Threshold**: Only apply if >10% token reduction or >5% quality improvement

---

### Compatibility

**Risk**: Wrapper breaks existing functionality

**Mitigation**: Graceful fallback to original prompts

**Pattern**: Try-Catch with original as fallback

---

### Testing

**Risk**: Insufficient test coverage

**Mitigation**: Unit tests for each wrapper, integration tests for full flow

**Files**: `test-promptmii-gepa-phase2-integration.ts`

---

## Timeline

**Week 1**: SWiRL + TRM integration (simpler)  
**Week 2**: ACE + RAG integration (complex)  
**Week 3**: Benchmarking + documentation

---

## Success Criteria

1. ✅ All 4 components integrated
2. ✅ >35% average token reduction
3. ✅ >20% average quality improvement
4. ✅ <5% latency increase
5. ✅ 100% backward compatibility
6. ✅ Full test suite passing

