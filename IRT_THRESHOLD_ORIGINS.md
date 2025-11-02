# IRT Threshold Origins: Where Did 0.7 and 0.6 Come From?

**Date**: January 27, 2025  
**Critical Finding**: Thresholds are **arbitrary convention**, not empirically validated

---

## The Thresholds

| Component | Threshold | Activation |
|-----------|-----------|------------|
| **ACE** | IRT > 0.7 | Complex queries only |
| **SWiRL** | IRT > 0.6 | Hard+ queries |
| **RVS** | IRT > 0.6 | Hard+ queries |

---

## Where They Came From

### Source 1: BENCHMARKS.md (Canonical Definition)

```markdown
1. **Easy Queries** (IRT < 0.3): Factual questions, simple calculations
2. **Medium Queries** (0.3 ≤ IRT < 0.7): Multi-step reasoning, domain knowledge
3. **Hard Queries** (IRT ≥ 0.7): Real-time data, complex analysis, multi-hop reasoning
```

**Origins**: Standard IRT difficulty convention
- < 0.3: Easy
- 0.3-0.7: Medium  
- ≥ 0.7: Hard

---

### Source 2: ARCHITECTURE.md (Routing Decision)

```typescript
if (difficulty > 0.7) {
  // Use teacher model (Perplexity)
} else {
  // Use student model (Ollama)
}
```

**Rationale**: Cost optimization
- IRT > 0.7: Expensive teacher model
- IRT ≤ 0.7: Free student model

---

### Source 3: PermutationEngine.ts (Implementation)

```typescript
// Only run ACE for COMPLEX queries (IRT > 0.7) to save time
const needsACE = preliminaryIRT > 0.95; // Only use ACE for VERY complex queries

// Only run ACE Playbook if the task is moderately complex
if (this.config.enableACE && (irtScore || 0) > 0.7) {
  console.log('📚 Running ACE Playbook system...');
}

// Adaptive SRL/EBM gating: Disable for very simple queries (IRT < 0.3)
const effectiveConfig = { ...this.config };
if (preliminaryIRT < 0.3) {
  effectiveConfig.enableSRL = false;
  effectiveConfig.enableEBM = false;
}
```

**Rationale**: Performance optimization
- Save time on simple queries
- Use advanced features only for complex queries

---

## The Problem

### No Empirical Validation

**Missing**:
- ❌ A/B tests comparing different thresholds
- ❌ Quality vs. latency trade-off analysis
- ❌ Cost-benefit studies
- ❌ Statistical significance testing
- ❌ Domain-specific threshold optimization

**Current status**: **Arbitrary conventions** adopted from:
1. Standard IRT difficulty ranges (0.3, 0.7)
2. Cost optimization logic (> 0.7 = expensive)
3. Code comments ("to save time")

---

## What the Benchmarks Actually Show

### ACE Framework Results

From BENCHMARKS.md:
- **Impact**: +12% quality improvement on hard queries (IRT ≥ 0.7)
- **Configuration**: Tested on hard queries only
- **Finding**: ACE helps for hard queries

**What's missing**: Does ACE help for medium queries (IRT 0.5-0.7)?

---

### IRT Routing Results

From BENCHMARKS.md:
```
| Routing Strategy | Quality | Cost | Latency |
|-----------------|---------|------|---------|
| Always Teacher  | 0.94    | $0.008 | 3.2s |
| Always Student  | 0.81    | $0.000 | 1.8s |
| IRT Adaptive    | 0.92    | $0.005 | 2.3s |
```

**Insight**: IRT routing works well overall

**What's missing**: Is 0.7 the optimal threshold? What about 0.6? 0.8?

---

## Why These Thresholds Might Be Wrong

### 1. No Testing Across Difficulty Ranges

**Current testing**:
- Easy (IRT < 0.3): 100% Ollama ✅
- Medium (0.3-0.7): 20% Perplexity, 80% Ollama ✅
- Hard (IRT > 0.7): 90% Perplexity, 10% Ollama ✅

**Missing**: Testing whether ACE/SWiRL help for medium queries

---

### 2. Domain-Specific Differences

**Examples from PermutationEngine.ts**:
```typescript
const domainDifficulty: Record<string, number> = {
  crypto: 0.8,        // High volatility, complex calculations
  financial: 0.7,     // Requires precision, regulatory knowledge
  legal: 0.9,         // Highly specialized, citation-heavy
  healthcare: 0.85,   // Life-critical, complex terminology
  real_estate: 0.6,   // Moderate complexity
  general: 0.5        // Baseline difficulty
};
```

**Problem**: If financial queries are baseline 0.7 difficulty, then most financial queries skip ACE/SWiRL!

**Consequence**: Medium complexity in one domain = same IRT as hard complexity in another

---

### 3. Query Type Differences

**ACE with PromptMII+GEPA**:
- Can improve token efficiency by 41.8%
- Can improve quality by 35%
- **Current threshold**: Only for IRT > 0.7

**Question**: Should ACE always run if PromptMII+GEPA is enabled?

**Current behavior**: Medium queries (IRT 0.5-0.7) miss optimization

---

## Evidence for Better Thresholds

### Evidence 1: IRT Routing Works at 0.7

✅ **From benchmarks**: IRT routing saves 38% cost with 2% quality drop  
✅ **Statistical significance**: Cost savings highly significant (p < 0.001)  
✅ **Conclusion**: 0.7 is reasonable for teacher-student routing

---

### Evidence 2: ACE Helps on Hard Queries

✅ **From benchmarks**: +12% quality on hard queries  
❓ **Missing**: Does it help on medium?  
❓ **Missing**: Does quality impact justify cost?

---

### Evidence 3: SRL/EBM Adaptive Gating

✅ **From PermutationEngine.ts**:
```typescript
// Adaptive SRL/EBM gating: Disable for very simple queries (IRT < 0.3)
const effectiveConfig = { ...this.config };
if (preliminaryIRT < 0.3) {
  effectiveConfig.enableSRL = false;
  effectiveConfig.enableEBM = false;
}
```

✅ **Rationale**: SRL/EBM add overhead  
✅ **Decision**: Disable for very simple queries  
❓ **Missing**: Should they be enabled for medium?

---

## What Testing Is Needed

### Test 1: ACE Threshold Sweep

**Question**: What's the optimal ACE threshold?

**Test**:
- Run ACE for different thresholds: 0.4, 0.5, 0.6, 0.7, 0.8
- Measure: Quality, Latency, Cost
- Goal: Find quality-cost sweet spot

**Expected**: ACE might help even at 0.5, but cost might not justify it

---

### Test 2: SWiRL Threshold Sweep

**Question**: When does SWiRL provide value?

**Test**:
- Run SWiRL for different thresholds: 0.4, 0.5, 0.6, 0.7
- Measure: Quality, Latency, Tool usage, Step count
- Goal: Find where SWiRL adds value

**Expected**: SWiRL might help for multi-step queries even at medium difficulty

---

### Test 3: Domain-Specific Thresholds

**Question**: Should thresholds be domain-specific?

**Test**:
- Different thresholds per domain
- Financial: ACE at 0.6, SWiRL at 0.5
- Legal: ACE at 0.8, SWiRL at 0.7
- Measure: Quality improvement vs. baseline

**Expected**: Domain-specific thresholds improve quality

---

### Test 4: Quality vs. Cost Trade-off

**Question**: Is quality improvement worth the cost?

**Test**:
- Enable ACE for medium queries (IRT > 0.5)
- Measure: Quality improvement, Cost increase
- Calculate: Quality per dollar

**Expected**: Might be worth it for certain domains

---

## Recommended Next Steps

### Step 1: Baseline Testing (1-2 hours)

**Goal**: Understand current behavior

```bash
# Test with current thresholds
test-permutation-system.ts --irt-thresholds "ace:0.7,swirl:0.6,rvs:0.6"

# Collect metrics
# - Quality scores by difficulty range
# - Latency by difficulty range
# - Cost by difficulty range
# - Component activation rates
```

---

### Step 2: Threshold Sweep (4-6 hours)

**Goal**: Find optimal thresholds

```bash
# Test ACE at different thresholds
for threshold in 0.4 0.5 0.6 0.7 0.8; do
  test-unified-pipeline.ts --ace-threshold $threshold
done

# Test SWiRL at different thresholds
for threshold in 0.4 0.5 0.6 0.7; do
  test-unified-pipeline.ts --swirl-threshold $threshold
done
```

---

### Step 3: Domain Analysis (2-3 hours)

**Goal**: Understand domain-specific needs

```bash
# Test per domain
for domain in financial legal healthcare crypto real_estate; do
  test-unified-pipeline.ts --domain $domain --irt-thresholds "ace:0.6,swirl:0.5"
done
```

---

### Step 4: Cost-Benefit Analysis (1-2 hours)

**Goal**: Calculate ROI per threshold

**Metrics**:
- Quality improvement per dollar spent
- Latency increase per quality improvement
- Cost per quality point gained

**Decision criteria**: Which threshold maximizes quality per dollar?

---

## Preliminary Recommendations

### Recommendation 1: Lower ACE to 0.6

**Rationale**:
- Current: 0.7 skips most medium queries
- Proposed: 0.6 activates for medium-hard queries
- Risk: Increased cost and latency
- Benefit: Better quality for medium queries

**Test**: Compare quality improvement vs. cost increase

---

### Recommendation 2: Lower SWiRL to 0.5

**Rationale**:
- Multi-step reasoning benefits from decomposition
- Medium queries (IRT 0.5-0.7) might need SWiRL
- Risk: Overhead for simple queries
- Benefit: Better step-by-step reasoning

**Test**: Measure tool usage and quality improvement

---

### Recommendation 3: Keep RVS at 0.6

**Rationale**:
- Verification is expensive
- Only needed for complex queries
- Current threshold seems reasonable

**Test**: Validate current behavior

---

### Recommendation 4: Domain-Specific Thresholds

**Rationale**:
- Financial: ACE 0.6 (precision matters)
- Legal: ACE 0.8 (already high complexity)
- Healthcare: ACE 0.7 (life-critical)

**Test**: Per-domain quality improvement

---

## Conclusion

### Current State

**Thresholds**:
- ACE: 0.7 (arbitrary, based on "hard" = ≥ 0.7)
- SWiRL: 0.6 (arbitrary, "medium-hard")
- RVS: 0.6 (arbitrary, same as SWiRL)

**Testing**: Minimal
- ✅ IRT routing tested (0.7 threshold)
- ❌ ACE threshold not tested
- ❌ SWiRL threshold not tested
- ❌ RVS threshold not tested

---

### What We Need

1. **Threshold sweep tests**: Find optimal values empirically
2. **Domain-specific analysis**: Different thresholds per domain
3. **Cost-benefit analysis**: Quality per dollar
4. **Quality impact study**: When does each component help?

---

### Bottom Line

**The thresholds are NOT empirically validated.**  
They're **arbitrary conventions** adopted from:
1. Standard IRT ranges (0.3, 0.7)
2. Cost optimization logic
3. Code comments

**We should test them** to find optimal values.

The current thresholds might be:
- ✅ Too high (missing quality improvements on medium queries)
- ✅ Too low (wasting resources on simple queries)
- ⚠️  Just right (needs validation)

**Without testing, we don't know.**

