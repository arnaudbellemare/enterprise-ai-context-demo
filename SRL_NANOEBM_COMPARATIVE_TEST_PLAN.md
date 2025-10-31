# SRL & nanoEBM Comparative Testing Plan

## Testing Philosophy

Test SRL, nanoEBM, and current system (TRM + GEPA) **side-by-side** on the same tasks to determine:
1. **Which performs best** for different use cases
2. **Where each approach excels**
3. **Whether integration beats individual approaches**
4. **Optimal combination strategy**

---

## Test Scenarios

### Scenario 1: Multi-Step Reasoning (SWiRL's Domain)

**Task**: Complex multi-step financial analysis

**Query**: "Calculate Bitcoin ROI 2020-2024 vs S&P 500, adjust for inflation, and explain which was better for a tax-advantaged account."

**Steps Required**:
1. Retrieve Bitcoin price data (2020-2024)
2. Retrieve S&P 500 data (2020-2024)
3. Calculate ROI for both
4. Adjust for inflation
5. Account for tax implications
6. Synthesize comparison

**Test Approaches**:

#### A. Current System (SWiRL + TRM)
```typescript
// Current: SWiRL decomposition + TRM verification per step
const result = await permutationEngine.execute(query, {
  enableSWiRL: true,
  enableTRM: true,
  swirlConfig: { maxSteps: 6 },
  trmConfig: { maxSteps: 2, minScore: 0.6 }
});
```

**Expected Behavior**:
- SWiRL breaks into 6 steps
- Each step verified by TRM
- Recursive improvement if quality low

#### B. SRL-Enhanced SWiRL
```typescript
// Enhanced: SWiRL with step-wise supervision
const result = await permutationEngine.execute(query, {
  enableSWiRL: true,
  enableSRL: true,  // NEW
  srlConfig: {
    expertTrajectories: loadExpertTrajectories('financial_analysis'),
    stepRewardWeight: 0.6,
    finalRewardWeight: 0.4
  }
});
```

**Expected Behavior**:
- SWiRL breaks into 6 steps
- Each step rewarded based on similarity to expert actions
- Internal reasoning monologue generated
- Step-wise learning signal

#### C. nanoEBM Refinement
```typescript
// Alternative: SWiRL + nanoEBM energy-based refinement
const result = await permutationEngine.execute(query, {
  enableSWiRL: true,
  enableEBM: true,  // NEW
  ebmConfig: {
    refinementSteps: 3,
    energyFunction: 'financial_analysis',
    learningRate: 0.5
  }
});
```

**Expected Behavior**:
- SWiRL generates initial answer
- EBM refines via gradient descent on energy function
- Low energy = better answer
- Iterative improvement

---

### Scenario 2: Answer Verification (TRM's Domain)

**Task**: Verify faithfulness of generated answer

**Query**: "Based on this insurance policy document, what is the premium for a 35-year-old with no pre-existing conditions?"

**Context**: Insurance policy document (2000 words)

**Answer to Verify**: "The premium is $150/month with a $500 deductible."

**Test Approaches**:

#### A. Current TRM Verification
```typescript
const trm = new TRMAdapter({ maxSteps: 3, minScore: 0.6 });
const verify = await trm.verify(query, context, answer);
const improved = await trm.improve(query, context, answer);
```

**Metrics**:
- Faithfulness score (token overlap)
- Relevance score (query-answer alignment)
- Coverage score (answer completeness)

#### B. SRL-Enhanced Verification
```typescript
const srlVerifier = new SRLVerifier({
  expertVerificationPatterns: loadExpertPatterns('insurance'),
  stepRewardWeight: 0.7
});
const verify = await srlVerifier.verify(query, context, answer);
```

**Metrics**:
- Step-wise similarity to expert verification
- Internal reasoning quality
- Alignment with expert patterns

#### C. nanoEBM Verification
```typescript
const ebmVerifier = new EBMVerifier({
  energyFunction: 'answer_verification',
  refinementSteps: 4
});
const verify = await ebmVerifier.refine(query, context, answer);
```

**Metrics**:
- Energy reduction (lower = better)
- Refinement stability (convergence)
- Final energy score

---

### Scenario 3: Answer Refinement (GEPA's Domain)

**Task**: Improve answer quality iteratively

**Query**: "Analyze market trends for electric vehicles in 2024"

**Initial Answer**: "EV market is growing." (Low quality)

**Test Approaches**:

#### A. Current GEPA Optimization
```typescript
const gepa = new GEPAReflectiveOptimizer(llmClient);
const optimized = await gepa.optimize(query, initialAnswer, {
  maxIterations: 5,
  reasoningSteps: 3,
  predictionSteps: 2
});
```

**Metrics**:
- Quality improvement per iteration
- Convergence speed
- Final quality score

#### B. SRL-Enhanced Refinement
```typescript
const srlRefiner = new SRLRefiner({
  expertRefinementTrajectories: loadExpertTrajectories('market_analysis'),
  stepRewardWeight: 0.8
});
const refined = await srlRefiner.refine(query, initialAnswer);
```

**Metrics**:
- Step-wise alignment with expert refinements
- Internal reasoning quality
- Pattern matching to expert improvements

#### C. nanoEBM Refinement
```typescript
const ebmRefiner = new EBMRefiner({
  energyFunction: 'answer_quality',
  refinementSteps: 4,
  temperature: 0.8
});
const refined = await ebmRefiner.refine(query, initialAnswer);
```

**Metrics**:
- Energy reduction trajectory
- Answer quality improvement
- Convergence behavior

---

## Evaluation Metrics

### 1. **Accuracy Metrics**
- **Correctness**: % of correct facts/claims
- **Faithfulness**: % of answer supported by context
- **Completeness**: % of query aspects addressed
- **Relevance**: Alignment with query intent

### 2. **Quality Metrics**
- **Coherence**: Answer logical flow
- **Clarity**: Answer readability
- **Depth**: Answer detail level
- **Precision**: Answer specificity

### 3. **Efficiency Metrics**
- **Latency**: Time to generate/refine
- **Cost**: API calls, compute resources
- **Iterations**: Number of refinement steps
- **Convergence**: How quickly quality stabilizes

### 4. **Training Metrics** (for SRL/EBM)
- **Step Reward Quality**: Average step-wise rewards
- **Energy Reduction**: Energy function improvement
- **Expert Alignment**: Similarity to expert patterns
- **Learning Stability**: Training consistency

---

## Test Implementation Plan

### Phase 1: Baseline Testing (Week 1)

**Goal**: Establish current system performance

```typescript
// test-baseline-comparison.ts
import { PermutationEngine } from './permutation-engine';
import { SWiRLDecomposer } from './swirl-decomposer';
import { TRMAdapter } from './trm-adapter';
import { GEPAReflectiveOptimizer } from './gepa-optimizer';

async function testBaseline(queries: TestQuery[]) {
  const results = [];
  
  for (const query of queries) {
    // Current System
    const current = await testCurrentSystem(query);
    results.push({
      approach: 'current',
      query: query.text,
      ...current.metrics
    });
  }
  
  return results;
}
```

**Deliverables**:
- Baseline metrics for all scenarios
- Performance benchmarks
- Quality scores

---

### Phase 2: SRL Implementation & Testing (Week 2)

**Goal**: Implement SRL for SWiRL and test

```typescript
// frontend/lib/srl/swirl-srl-enhancer.ts
export class SWiRLSRLEnhancer {
  private expertTrajectories: Map<string, ExpertTrajectory[]>;
  
  async enhanceWithSRL(
    decomposition: SWiRLDecomposition,
    expertTrajectories: ExpertTrajectory[]
  ): Promise<SRLEnhancedDecomposition> {
    // For each step:
    // 1. Generate internal reasoning monologue
    // 2. Compute step-wise reward (similarity to expert)
    // 3. Apply reward to improve step
    // 4. Continue to next step
  }
  
  private computeStepReward(
    modelStep: SWiRLStep,
    expertStep: ExpertStep
  ): number {
    // Reward based on:
    // - Reasoning similarity
    // - Action similarity
    // - Tool selection match
    // - Result quality
  }
}
```

**Test Cases**:
```typescript
// test-srl-enhancement.ts
async function testSRL() {
  const srlEnhancer = new SWiRLSRLEnhancer();
  
  // Load expert trajectories
  const trajectories = await loadExpertTrajectories('financial_analysis');
  
  // Test with SRL
  const result = await testWithSRL(testQueries, trajectories);
  
  // Compare with baseline
  const comparison = compareResults(baselineResults, result);
  
  return {
    improvement: comparison.improvement,
    metrics: comparison.metrics,
    bestUseCases: comparison.bestUseCases
  };
}
```

---

### Phase 3: nanoEBM Implementation & Testing (Week 3)

**Goal**: Implement nanoEBM for answer refinement and test

```typescript
// frontend/lib/ebm/answer-refiner.ts
import * as tf from '@tensorflow/tfjs-node';

export class EBMAnswerRefiner {
  private energyModel: tf.LayersModel;
  
  async refine(
    query: string,
    context: string,
    initialAnswer: string,
    config: EBMConfig
  ): Promise<EBMRefinementResult> {
    let x = this.embedAnswer(initialAnswer);
    const energyHistory: number[] = [];
    
    for (let step = 0; step < config.refinementSteps; step++) {
      // Compute energy gradient
      const energy = await this.computeEnergy(x, query, context);
      const gradient = tf.grad(y => this.computeEnergy(y, query, context))(x);
      
      // Update: x = x - α * ∇E(x) + noise
      const stepSize = config.learningRate;
      const noise = tf.randomNormal(x.shape, 0, config.noiseScale);
      x = tf.sub(x, tf.mul(stepSize, gradient));
      x = tf.add(x, noise);
      
      energyHistory.push(await energy.data());
      
      // Early stopping if converged
      if (step > 0 && Math.abs(energyHistory[step] - energyHistory[step-1]) < 0.001) {
        break;
      }
    }
    
    const refinedAnswer = this.decodeEmbedding(x);
    return {
      answer: refinedAnswer,
      energyHistory,
      improvement: energyHistory[0] - energyHistory[energyHistory.length - 1]
    };
  }
  
  private async computeEnergy(
    answerEmbedding: tf.Tensor,
    query: string,
    context: string
  ): Promise<tf.Tensor> {
    // Energy function: E(x) = f(query, context, answer)
    // Low energy = good answer
    const queryEmbedding = await this.embedQuery(query);
    const contextEmbedding = await this.embedContext(context);
    
    // Combined representation
    const combined = tf.concat([queryEmbedding, contextEmbedding, answerEmbedding], 1);
    
    // Energy network prediction
    const energy = this.energyModel.predict(combined) as tf.Tensor;
    return energy;
  }
}
```

**Test Cases**:
```typescript
// test-ebm-refinement.ts
async function testEBM() {
  const ebmRefiner = new EBMAnswerRefiner();
  
  // Test refinement
  const result = await testWithEBM(testQueries, {
    refinementSteps: 4,
    learningRate: 0.5,
    energyFunction: 'answer_quality'
  });
  
  // Compare with baseline
  const comparison = compareResults(baselineResults, result);
  
  return {
    improvement: comparison.improvement,
    metrics: comparison.metrics,
    bestUseCases: comparison.bestUseCases
  };
}
```

---

### Phase 4: Combined Approaches Testing (Week 4)

**Goal**: Test combinations of approaches

#### Combination 1: SWiRL + SRL + TRM
```typescript
const result = await permutationEngine.execute(query, {
  enableSWiRL: true,
  enableSRL: true,      // Step-wise supervision
  enableTRM: true,       // Verification
  swirlConfig: { maxSteps: 6 },
  srlConfig: { stepRewardWeight: 0.6 },
  trmConfig: { maxSteps: 2 }
});
```

#### Combination 2: SWiRL + nanoEBM + TRM
```typescript
const result = await permutationEngine.execute(query, {
  enableSWiRL: true,
  enableEBM: true,       // Energy-based refinement
  enableTRM: true,       // Verification
  swirlConfig: { maxSteps: 6 },
  ebmConfig: { refinementSteps: 3 },
  trmConfig: { maxSteps: 2 }
});
```

#### Combination 3: SRL + nanoEBM (Hybrid)
```typescript
const result = await permutationEngine.execute(query, {
  enableSRL: true,       // Step-wise supervision
  enableEBM: true,       // Energy-based refinement
  srlConfig: { stepRewardWeight: 0.5 },
  ebmConfig: { refinementSteps: 4 }
});
```

---

## Comparative Test Suite

```typescript
// test-comparative-srl-ebm.ts
import { PermutationEngine } from './permutation-engine';
import { SWiRLSRLEnhancer } from './srl/swirl-srl-enhancer';
import { EBMAnswerRefiner } from './ebm/answer-refiner';

interface ComparativeTestResult {
  approach: 'current' | 'srl' | 'ebm' | 'srl+ebm';
  query: string;
  metrics: {
    accuracy: number;
    faithfulness: number;
    completeness: number;
    latency: number;
    cost: number;
    iterations: number;
  };
  details: any;
}

async function runComparativeTests(
  testQueries: TestQuery[]
): Promise<ComparativeTestResult[]> {
  const results: ComparativeTestResult[] = [];
  
  for (const query of testQueries) {
    // 1. Current System
    const current = await testCurrentSystem(query);
    results.push({
      approach: 'current',
      query: query.text,
      ...current
    });
    
    // 2. SRL-Enhanced
    const srl = await testWithSRL(query);
    results.push({
      approach: 'srl',
      query: query.text,
      ...srl
    });
    
    // 3. nanoEBM-Enhanced
    const ebm = await testWithEBM(query);
    results.push({
      approach: 'ebm',
      query: query.text,
      ...ebm
    });
    
    // 4. Combined
    const combined = await testWithSRLAndEBM(query);
    results.push({
      approach: 'srl+ebm',
      query: query.text,
      ...combined
    });
  }
  
  return results;
}

async function analyzeResults(
  results: ComparativeTestResult[]
): Promise<AnalysisReport> {
  // Group by approach
  const byApproach = groupBy(results, 'approach');
  
  // Compute averages
  const averages = {
    current: computeAverage(byApproach.current),
    srl: computeAverage(byApproach.srl),
    ebm: computeAverage(byApproach.ebm),
    'srl+ebm': computeAverage(byApproach['srl+ebm'])
  };
  
  // Identify best approach per metric
  const bestApproach = {
    accuracy: findBest(averages, 'metrics.accuracy'),
    faithfulness: findBest(averages, 'metrics.faithfulness'),
    latency: findBest(averages, 'metrics.latency', 'min'),
    cost: findBest(averages, 'metrics.cost', 'min')
  };
  
  // Identify best use cases per approach
  const useCases = {
    current: identifyBestUseCases(byApproach.current),
    srl: identifyBestUseCases(byApproach.srl),
    ebm: identifyBestUseCases(byApproach.ebm),
    'srl+ebm': identifyBestUseCases(byApproach['srl+ebm'])
  };
  
  return {
    averages,
    bestApproach,
    useCases,
    recommendations: generateRecommendations(averages, useCases)
  };
}
```

---

## Expected Outcomes

### Hypothesis 1: SRL > Current for Multi-Step Reasoning
- **Why**: Step-wise supervision provides better training signal
- **Test**: Compare SWiRL vs SWiRL+SRL on multi-step tasks
- **Metric**: Accuracy, step correctness

### Hypothesis 2: nanoEBM > Current for Answer Refinement
- **Why**: Energy-based optimization more stable than heuristics
- **Test**: Compare TRM improvement vs EBM refinement
- **Metric**: Quality improvement, convergence speed

### Hypothesis 3: SRL + EBM > Individual Approaches
- **Why**: SRL for step-wise, EBM for refinement = complementary
- **Test**: Compare all combinations
- **Metric**: Overall quality, efficiency

---

## Success Criteria

### Minimum Viable Improvement
- **SRL**: +10% accuracy on multi-step reasoning tasks
- **nanoEBM**: +15% quality improvement on refinement tasks
- **Combined**: +20% overall quality vs current system

### Ideal Outcome
- **SRL**: +25% accuracy, -20% latency on multi-step tasks
- **nanoEBM**: +30% refinement quality, faster convergence
- **Combined**: +35% overall quality, maintain efficiency

---

## Implementation Roadmap

### Week 1: Baseline + SRL Implementation
- [ ] Run baseline tests on current system
- [ ] Implement SWiRL SRL enhancer
- [ ] Create expert trajectory collection system
- [ ] Test SRL on multi-step reasoning scenarios

### Week 2: SRL Testing + nanoEBM Implementation
- [ ] Complete SRL comparative tests
- [ ] Implement EBM answer refiner
- [ ] Train/configure energy function
- [ ] Test EBM on refinement scenarios

### Week 3: nanoEBM Testing + Combination
- [ ] Complete EBM comparative tests
- [ ] Implement combined approaches
- [ ] Test all combinations
- [ ] Analyze results

### Week 4: Integration + Production
- [ ] Integrate best approach into Permutation Engine
- [ ] Create configuration system
- [ ] Add to adaptive workflow orchestrator
- [ ] Deploy and monitor

---

## Next Steps

1. **Create Test Suite**: `test-comparative-srl-ebm.ts`
2. **Implement SRL Enhancer**: `frontend/lib/srl/swirl-srl-enhancer.ts`
3. **Implement EBM Refiner**: `frontend/lib/ebm/answer-refiner.ts`
4. **Collect Expert Trajectories**: Annotate multi-step solutions
5. **Run Comparative Tests**: Execute all scenarios

**Ready to start implementing the comparative test framework?**


