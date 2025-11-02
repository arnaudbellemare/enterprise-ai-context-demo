# IRT Threshold Testing Guide

**Goal**: Empirically validate and optimize IRT activation thresholds for ACE, SWiRL, and RVS

---

## Current Thresholds

| Component | Current | Status |
|-----------|---------|--------|
| **ACE** | 0.7 | Not validated |
| **SWiRL** | 0.6 | Not validated |
| **RVS** | 0.6 | Not validated |

---

## Prerequisites

**Before starting**: Need to add threshold configurability to `UnifiedPermutationPipeline`

### Required Changes

**File**: `frontend/lib/unified-permutation-pipeline.ts`

```typescript
export interface UnifiedPipelineConfig {
  // ... existing config
  aceThreshold?: number;    // NEW: Default 0.7
  swirlThreshold?: number;  // NEW: Default 0.6
  rvsThreshold?: number;    // NEW: Default 0.6
}

// In constructor:
this.config = {
  aceThreshold: 0.7,
  swirlThreshold: 0.6,
  rvsThreshold: 0.6,
  ...config
};

// In execute method, replace hardcoded thresholds:
// OLD: if (this.config.enableACE && irtDifficulty > 0.7)
// NEW: if (this.config.enableACE && irtDifficulty > (this.config.aceThreshold ?? 0.7))
```

---

## Test Design

### 1. Test Queries (IRT-Calibrated)

**Easy Queries** (IRT < 0.3):
- "What is the capital of France?"
- "Calculate 5 * 7"
- "List the primary colors"

**Medium Queries** (IRT 0.3-0.7):
- "Analyze the impact of interest rate changes on a diversified portfolio"
- "Explain the difference between stocks and bonds"
- "What are the main components of a typical insurance policy?"

**Hard Queries** (IRT > 0.7):
- Complex multi-part art valuation query (like our test)
- Legal contract analysis with 7+ requirements
- Medical diagnosis with differential analysis

### 2. Threshold Ranges to Test

**ACE Thresholds**: 0.4, 0.5, 0.6, 0.7, 0.8, 0.9

**SWiRL Thresholds**: 0.3, 0.4, 0.5, 0.6, 0.7

**RVS Thresholds**: 0.3, 0.4, 0.5, 0.6, 0.7

**Total combinations**: 6 × 5 × 5 = 150 configurations

---

## Step 1: Baseline Testing

### Run Current Configuration

```bash
cd frontend
npm run dev &

# Test each difficulty level
tsx test-baseline-thresholds.ts
```

**Expected output**: Quality, latency, cost for current thresholds (0.7, 0.6, 0.6)

**Baseline metrics**:
- Easy queries: 5 components active
- Medium queries: 5 components active  
- Hard queries: 8-9 components active

---

## Step 2: Individual Component Sweeps

### Test 1: ACE Threshold Sweep

**Goal**: Find optimal ACE activation threshold

```bash
# Test ACE at different thresholds while keeping SWiRL/RVS fixed at 0.6
for threshold in 0.4 0.5 0.6 0.7 0.8 0.9; do
  tsx test-threshold.ts --component ACE --threshold $threshold --swirl 0.6 --rvs 0.6
done
```

**Measure**:
- Quality score for easy/medium/hard queries
- Latency for each difficulty level
- Cost per query
- Component activation rate

**Analysis**:
- When does ACE improve quality for medium queries?
- What's the quality/cost tradeoff?
- Is there a sweet spot?

---

### Test 2: SWiRL Threshold Sweep

**Goal**: Find optimal SWiRL activation threshold

```bash
# Test SWiRL at different thresholds
for threshold in 0.3 0.4 0.5 0.6 0.7; do
  tsx test-threshold.ts --component SWiRL --threshold $threshold --ace 0.7 --rvs 0.6
done
```

**Measure**:
- Multi-step decomposition quality
- Tool usage frequency
- Average reward from SRL
- Step count

**Analysis**:
- When does SWiRL add value for medium queries?
- What's the step decomposition quality?
- Does SRL improve reasoning?

---

### Test 3: RVS Threshold Sweep

**Goal**: Find optimal RVS activation threshold

```bash
# Test RVS at different thresholds
for threshold in 0.3 0.4 0.5 0.6 0.7; do
  tsx test-threshold.ts --component RVS --threshold $threshold --ace 0.7 --swirl 0.6
done
```

**Measure**:
- Verification accuracy
- False positive/negative rates
- Iteration count
- Quality improvement from verification

**Analysis**:
- When does RVS catch errors that matter?
- What's the verification overhead?
- Is recursive verification needed for medium?

---

## Step 3: Combined Optimization

### Test All Combinations

**Goal**: Find globally optimal threshold combination

```bash
# Grid search across all combinations
python scripts/grid-search-thresholds.py --config grid-search.json
```

**Strategy**: Test top 10 combinations from individual sweeps

**Measure**: 
- Overall quality across all difficulty levels
- Average latency
- Total cost per 100 queries
- Component activation efficiency

---

## Step 4: Domain-Specific Analysis

### Test Per Domain

```bash
for domain in financial legal healthcare crypto; do
  tsx test-domain-thresholds.ts --domain $domain --thresholds "ace:0.6,swirl:0.5,rvs:0.6"
done
```

**Goal**: Determine if thresholds should vary by domain

**Hypothesis**:
- Financial: Lower thresholds (precision matters)
- Legal: Higher thresholds (already complex)
- Healthcare: Medium thresholds (balanced)
- Crypto: Lower thresholds (real-time data)

---

## Expected Results

### Current Thresholds (0.7, 0.6, 0.6)

**Easy Queries**:
- ACE: Not activated
- SWiRL: Not activated  
- RVS: Not activated
- Quality: Baseline only

**Medium Queries**:
- ACE: Not activated (IRT < 0.7)
- SWiRL: Not activated (IRT < 0.6)
- RVS: Not activated
- Quality: Missing potential improvements

**Hard Queries**:
- ACE: Activated ✅
- SWiRL: Activated ✅
- RVS: Activated ✅
- Quality: Full capability

---

### Hypothetical Optimal Thresholds (0.6, 0.5, 0.6)

**Easy Queries**:
- Same as current

**Medium Queries**:
- ACE: Activated ✅ (+potential quality gain)
- SWiRL: Activated ✅ (+multi-step reasoning)
- RVS: Not activated (likely OK)
- Quality: Better than current

**Hard Queries**:
- Same as current

**Tradeoff**: Better quality for medium, but higher cost/latency

---

## Analysis Framework

### Quality Impact

```python
def calculate_quality_impact(results):
    """Measure quality improvement from threshold changes"""
    baseline = results['current']
    optimal = results['optimal']
    
    quality_gain = optimal.quality - baseline.quality
    cost_increase = optimal.cost - baseline.cost
    
    roi = quality_gain / cost_increase if cost_increase > 0 else float('inf')
    
    return {
        'quality_gain': quality_gain,
        'cost_increase': cost_increase,
        'roi': roi,
        'recommendation': 'change' if roi > threshold else 'keep_current'
    }
```

---

### Cost-Benefit Analysis

**Decision criteria**:
1. Quality improvement > 3% → Worth considering
2. Cost increase < 20% → Acceptable tradeoff
3. Latency increase < 500ms → Within acceptable range
4. ROI > 0.5 → Strong recommendation

---

## Reporting

### Generate Report

```bash
tsx generate-threshold-report.ts --results-dir results/
```

**Output**: `THRESHOLD_OPTIMIZATION_REPORT.md`

**Contents**:
1. Executive summary (recommendations)
2. Component-by-component analysis
3. Quality/latency/cost tradeoffs
4. Domain-specific findings
5. Statistical significance tests
6. Production recommendations

---

## Implementation Priority

### Phase 1: Infrastructure (2-3 hours)

1. ✅ Add threshold config to `UnifiedPipelineConfig`
2. ✅ Update pipeline to use configurable thresholds
3. ✅ Create test harness
4. ✅ Implement baseline collection

---

### Phase 2: Individual Sweeps (4-6 hours)

1. ✅ Run ACE threshold sweep
2. ✅ Run SWiRL threshold sweep
3. ✅ Run RVS threshold sweep
4. ✅ Analyze results per component

---

### Phase 3: Combined Optimization (2-3 hours)

1. ✅ Grid search top combinations
2. ✅ Validate findings
3. ✅ Calculate ROI

---

### Phase 4: Domain Analysis (2-3 hours)

1. ✅ Test per domain
2. ✅ Compare domain-specific vs. global thresholds
3. ✅ Document findings

---

### Phase 5: Production Deployment (1-2 hours)

1. ✅ Update production configs
2. ✅ Deploy with new thresholds
3. ✅ Monitor in production
4. ✅ Document changes

---

## Success Criteria

### Test is Successful If

1. ✅ Found thresholds that improve quality for medium queries
2. ✅ Quantified quality/cost tradeoffs
3. ✅ Documented optimal thresholds per domain
4. ✅ Validated with statistical significance
5. ✅ ROI justifies deployment

### Test Results Need

1. **Statistical validation**: p < 0.05 for claimed improvements
2. **Sample size**: Minimum 30 queries per difficulty level
3. **Reproducibility**: Tests documented and repeatable
4. **Metrics**: Quality, latency, cost measured for all configurations

---

## Next Steps

**Immediate**:
1. Add threshold configurability to `UnifiedPermutationPipeline`
2. Create test harness
3. Run baseline collection

**Short-term**:
4. Run individual component sweeps
5. Analyze results
6. Generate recommendations

**Medium-term**:
7. Combined optimization
8. Domain analysis
9. Production deployment

---

## Conclusion

**Current thresholds are arbitrary and need validation.**

**Testing will reveal**:
- Optimal thresholds for quality/cost tradeoffs
- Domain-specific requirements
- Component interaction effects
- Production deployment recommendations

**Expected outcome**: Better thresholds that improve quality for medium queries while controlling cost/latency.

