# PromptMII + GEPA Integration Strategy

**Date**: January 27, 2025  
**Status**: Strategic Integration Plan  
**Goal**: Compound optimization gains through sequential PromptMII → GEPA pipeline

---

## Executive Summary

**PromptMII** (3-13× token reduction) + **GEPA** (detailed quality optimization) creates a two-stage optimization pipeline that delivers both **efficiency AND quality**.

---

## The Compound Advantage

### Why PromptMII + GEPA Works

**PromptMII First**: Token efficiency
- Reduces prompt from ~100 tokens → ~10 tokens (90% reduction)
- Extracts core instruction
- Removes redundancy

**GEPA Second**: Quality enhancement
- Takes PromptMII's efficient instruction
- Adds task-specific detail
- Optimizes for performance

**Result**: Optimal balance of efficiency + quality

---

## Understanding Reflection LLM in GEPA

### GEPA's Reflection Mechanism

**What is reflection_lm**:
> GEPA can work with any reflection_lm, which rewrites the current prompt and uses Pareto-based selection to try new data points.

**How it Works**:
1. Start with current prompt
2. Reflection LLM generates variations
3. Pareto-based selection (multi-objective optimization)
4. Test on new data points
5. Iterate

**Our Implementation**:
```typescript
class GEPAReflectiveOptimizer {
  async optimize(
    systemModules: Record<string, string>,
    trainingData: any[],
    options: { 
      budget: number;
      minibatch_size: number; 
      pareto_set_size: number;
      reflection_lm?: string  // ← Can use any LLM for reflection
    }
  ): Promise<Record<string, string>>
}
```

**Key Insight**: Reflection LLM can be any model optimized for instruction understanding and generation.

---

## Integration Architecture

### Two-Stage Pipeline

```
Stage 1: PromptMII (Token Efficiency)
   ↓
Input: 100-token prompt
   ↓
PromptMII: Extract core instruction
   ↓
Output: 10-token optimized instruction (90% reduction)
   ↓
Stage 2: GEPA (Quality Enhancement)
   ↓
Input: PromptMII's 10-token instruction
   ↓
GEPA Reflection LLM: Add task-specific detail
   ↓
Pareto Selection: Quality vs token balance
   ↓
Output: 20-30 token instruction (optimal balance)
   ↓
Result: 70-80% token reduction + quality improvement
```

---

## Implementation Strategy

### Option 1: Sequential Optimization

**Workflow**:
1. Generate initial prompt (manual or template)
2. Apply PromptMII → token efficiency
3. Apply GEPA → quality enhancement
4. Return final optimized prompt

**Code**:
```typescript
async function optimizeWithPromptMIIAndGEPA(
  initialPrompt: string,
  domain: string,
  taskType: string
): Promise<OptimizedPrompt> {
  
  // Stage 1: PromptMII for token efficiency
  const promptMII = new FullPromptMII();
  const efficientPrompt = await promptMII.generateInstruction(
    initialPrompt,
    domain,
    taskType
  );
  
  console.log(`✅ PromptMII: ${efficientPrompt.tokenReductionPercent}% token reduction`);
  
  // Stage 2: GEPA for quality enhancement
  const gepaOptimizer = new GEPAReflectiveOptimizer(llmClient);
  const qualityPrompt = await gepaOptimizer.optimize(
    { instruction: efficientPrompt.optimizedInstruction },
    trainingData,
    {
      budget: 30,
      minibatch_size: 1,
      pareto_set_size: 5,
      reflection_lm: 'gpt-4o-mini'  // ← Use GPT-4 for reflection
    }
  );
  
  console.log(`✅ GEPA: Quality +${qualityPrompt.improvement}%`);
  
  return {
    original: initialPrompt,
    efficient: efficientPrompt.optimizedInstruction,
    final: qualityPrompt,
    totalTokenReduction: calculateReduction(initialPrompt, qualityPrompt),
    qualityImprovement: qualityPrompt.improvement
  };
}
```

---

### Option 2: GEPA with PromptMII as Reflection LLM

**Concept**: Use PromptMII itself as the reflection LLM for GEPA

**Why This Works**:
- PromptMII is optimized for instruction generation
- Has meta-learning capabilities
- Understands efficiency/quality trade-offs

**Implementation**:
```typescript
class PromptMIIReflectionLM implements ReflectionLLM {
  constructor(private promptMII: FullPromptMII) {}
  
  async reflect(
    currentPrompt: string,
    context: ReflectionContext
  ): Promise<PromptVariation[]> {
    
    // Use PromptMII to generate variations
    const variations = await this.promptMII.generateInstruction(
      currentPrompt,
      context.domain,
      context.taskType
    );
    
    // Generate multiple variations
    return [
      variations.optimizedInstruction,
      await this.promptMII.generateInstruction(
        currentPrompt + ' [EXPANDED]',
        context.domain,
        context.taskType
      ).then(r => r.optimizedInstruction),
      await this.promptMII.generateInstruction(
        currentPrompt + ' [FOCUSED]',
        context.domain,
        context.taskType
      ).then(r => r.optimizedInstruction)
    ];
  }
}

// Use in GEPA
const gepaOptimizer = new GEPAReflectiveOptimizer(
  llmClient,
  new PromptMIIReflectionLM(promptMII)
);

const result = await gepaOptimizer.optimize(systemModules, trainingData);
```

---

### Option 3: Iterative Refinement

**Workflow**:
1. PromptMII → efficient base
2. GEPA → quality enhancement
3. PromptMII → re-compress while maintaining quality
4. Repeat until convergence

**Code**:
```typescript
async function iterativeOptimization(
  initialPrompt: string,
  maxIterations: number = 3
): Promise<OptimizedPrompt> {
  
  let currentPrompt = initialPrompt;
  let bestQuality = 0;
  let bestTokens = Infinity;
  let iteration = 0;
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Stage 1: PromptMII (efficiency)
    const efficient = await promptMII.generateInstruction(currentPrompt);
    
    // Stage 2: GEPA (quality)
    const quality = await gepaOptimizer.optimize({ instruction: efficient });
    
    // Evaluate Pareto frontier
    const qualityScore = evaluateQuality(quality);
    const tokenCount = countTokens(quality);
    
    // Keep if better on Pareto frontier
    if (qualityScore > bestQuality || tokenCount < bestTokens) {
      currentPrompt = quality;
      bestQuality = qualityScore;
      bestTokens = tokenCount;
    } else {
      // No improvement, terminate
      break;
    }
  }
  
  return {
    original: initialPrompt,
    final: currentPrompt,
    iterations: iteration,
    quality: bestQuality,
    tokenReduction: (initialPrompt.length - currentPrompt.length) / initialPrompt.length
  };
}
```

---

## Expected Gains

### Compound Optimization Metrics

**Token Efficiency**:
- PromptMII alone: 3-13× reduction (90-92% fewer tokens)
- GEPA alone: 1× (maintains or increases tokens)
- **PromptMII + GEPA**: 70-80% reduction (maintains efficiency, adds quality)

**Quality Improvement**:
- PromptMII alone: 100% quality (same or better)
- GEPA alone: +10-50% improvement
- **PromptMII + GEPA**: +15-60% improvement (efficient base + detailed enhancements)

**Cost Savings**:
```
Before: 100 tokens × $0.001/token = $0.10 per query
After:  20 tokens × $0.001/token = $0.02 per query
Savings: 80% cost reduction
```

**Speed**:
```
Before: 2.0s (large prompt)
After:  0.8s (efficient + optimized prompt)
Speed: 2.5× faster
```

---

## Integration Points in PERMUTATION

### Where to Apply PromptMII + GEPA

**Layer 1: ACE Framework**
```typescript
// Optimize ACE bullets
const optimizedBullets = await optimizeWithPromptMIIAndGEPA(
  aceBullet,
  'context_engineering',
  'strategy_generation'
);
```

**Layer 2: RAG Prompts**
```typescript
// Optimize RAG reformulation prompts
const evolvedPrompts = await gepaOptimizer.evolve(
  promptMII.generateInstruction(basePrompt),
  trainingData
);
```

**Layer 3: TRM Verification**
```typescript
// Optimize verification instructions
const verificationPrompt = await optimizeWithPromptMIIAndGEPA(
  trmVerificationPrompt,
  'verification',
  'quality_check'
);
```

**Layer 4: SWiRL Decomposition**
```typescript
// Optimize decomposition instructions
const decompositionPrompt = await optimizeWithPromptMIIAndGEPA(
  swirlInstruction,
  'reasoning',
  'task_decomposition'
);
```

---

## Implementation Plan

### Phase 1: Basic Integration (Week 1)

**Goal**: Working PromptMII + GEPA pipeline

**Tasks**:
1. Create `PromptMIIGEPAOptimizer` class
2. Implement sequential optimization
3. Add tests for basic workflow
4. Benchmark against standalone optimizers

**Files**:
- `frontend/lib/promptmii-gepa-optimizer.ts` (NEW)
- `frontend/app/api/optimization/promptmii-gepa/route.ts` (NEW)

---

### Phase 2: Reflection LLM Integration (Week 2)

**Goal**: Use PromptMII as reflection LLM in GEPA

**Tasks**:
1. Implement `PromptMIIReflectionLM` interface
2. Integrate with GEPA optimizer
3. Add multi-objective evaluation
4. Optimize reflection prompt generation

**Files**:
- `frontend/lib/promptmii-reflection-lm.ts` (NEW)
- Update `frontend/lib/gepa-optimizer.ts`

---

### Phase 3: Iterative Refinement (Week 3)

**Goal**: Iterative optimization loop

**Tasks**:
1. Implement convergence detection
2. Add early stopping criteria
3. Pareto frontier tracking
4. Performance monitoring

**Files**:
- Update `frontend/lib/promptmii-gepa-optimizer.ts`

---

### Phase 4: Production Integration (Week 4)

**Goal**: Deploy to all PERMUTATION components

**Tasks**:
1. Integrate with ACE, RAG, TRM, SWiRL
2. Add caching for optimized prompts
3. Monitor performance in production
4. A/B testing framework

**Files**:
- Update `frontend/lib/permutation-engine.ts`
- Update `frontend/lib/unified-permutation-pipeline.ts`

---

## Code Examples

### Example 1: Basic Integration

```typescript
import { FullPromptMII } from './promptmii-full';
import { GEPAReflectiveOptimizer } from './gepa-optimizer';

class PromptMIIGEPAOptimizer {
  private promptMII: FullPromptMII;
  private gepaOptimizer: GEPAReflectiveOptimizer;
  
  constructor() {
    this.promptMII = new FullPromptMII();
    this.gepaOptimizer = new GEPAReflectiveOptimizer(llmClient);
  }
  
  async optimize(
    initialPrompt: string,
    domain: string,
    taskType: string,
    trainingData: any[]
  ): Promise<OptimizationResult> {
    
    // Stage 1: PromptMII for efficiency
    const efficientResult = await this.promptMII.generateInstruction(
      initialPrompt,
      domain,
      taskType
    );
    
    console.log(`📉 Token reduction: ${efficientResult.tokenReductionPercent.toFixed(1)}%`);
    
    // Stage 2: GEPA for quality
    const qualityResult = await this.gepaOptimizer.optimize(
      { instruction: efficientResult.optimizedInstruction },
      trainingData,
      {
        budget: 30,
        reflection_lm: 'gpt-4o-mini'
      }
    );
    
    console.log(`📈 Quality improvement: ${qualityResult.improvement.toFixed(1)}%`);
    
    return {
      original: initialPrompt,
      promptMIIResult: efficientResult,
      gepaResult: qualityResult,
      finalPrompt: qualityResult.instruction,
      totalTokenReduction: calculateTotalReduction(initialPrompt, qualityResult),
      combinedImprovement: calculateCombinedImprovement(efficientResult, qualityResult)
    };
  }
}
```

---

### Example 2: PromptMII as Reflection LLM

```typescript
class PromptMIIReflectionLLM implements ReflectionLLM {
  constructor(private promptMII: FullPromptMII) {}
  
  async reflect(
    currentPrompt: string,
    context: ReflectionContext,
    numVariations: number = 3
  ): Promise<PromptVariation[]> {
    
    const variations: PromptVariation[] = [];
    
    for (let i = 0; i < numVariations; i++) {
      const result = await this.promptMII.generateInstruction(
        currentPrompt,
        context.domain,
        context.taskType
      );
      
      variations.push({
        prompt: result.optimizedInstruction,
        metadata: {
          tokenCount: result.tokenReduction,
          quality: result.performanceImprovement,
          variationType: this.getVariationType(i)
        }
      });
    }
    
    return variations;
  }
  
  private getVariationType(index: number): string {
    const types = ['compressed', 'expanded', 'balanced', 'focused'];
    return types[index % types.length];
  }
}

// Use with GEPA
const gepaOptimizer = new GEPAReflectiveOptimizer(
  llmClient,
  new PromptMIIReflectionLLM(promptMII)
);
```

---

### Example 3: Iterative Refinement

```typescript
async function iterativeOptimization(
  initialPrompt: string,
  domain: string,
  maxIterations: number = 3,
  convergenceThreshold: number = 0.001
): Promise<OptimizationResult> {
  
  const optimizer = new PromptMIIGEPAOptimizer();
  
  let currentPrompt = initialPrompt;
  let bestScore = 0;
  let iteration = 0;
  const history: IterationResult[] = [];
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Run PromptMII + GEPA
    const result = await optimizer.optimize(currentPrompt, domain);
    
    // Calculate composite score (quality × efficiency)
    const quality = result.gepaResult.improvement;
    const efficiency = 1 - (result.totalTokenReduction / initialPrompt.length);
    const compositeScore = quality * efficiency;
    
    history.push({
      iteration,
      prompt: result.finalPrompt,
      quality,
      efficiency,
      compositeScore,
      tokenReduction: result.totalTokenReduction
    });
    
    // Check for convergence
    if (iteration > 1) {
      const scoreDelta = Math.abs(compositeScore - bestScore);
      if (scoreDelta < convergenceThreshold) {
        console.log(`✓ Converged at iteration ${iteration}`);
        break;
      }
    }
    
    // Update if better
    if (compositeScore > bestScore) {
      bestScore = compositeScore;
      currentPrompt = result.finalPrompt;
    }
  }
  
  return {
    initialPrompt,
    finalPrompt: currentPrompt,
    iterations: iteration,
    history,
    bestScore
  };
}
```

---

## Expected Performance

### Metrics Comparison

| Metric | PromptMII | GEPA | PromptMII + GEPA |
|--------|-----------|------|------------------|
| **Token Reduction** | 3-13× | 0× | 3-8× |
| **Quality Improvement** | 100% | +10-50% | +15-60% |
| **Cost Savings** | 90% | 0% | 70-80% |
| **Speed Gain** | 1× | 1× | 1× (prompt only) |
| **Combined Benefit** | High efficiency | High quality | **Best of both** |

---

## Future Enhancements

### ReAct + PromptMII + GEPA

**Next Frontier**: Three-stage optimization

1. **PromptMII**: Generate core instruction
2. **GEPA**: Add task-specific detail
3. **ReAct**: Add reasoning + acting patterns

**Expected Gain**: +20-70% quality with 60-70% token reduction

---

## Conclusion

**PromptMII + GEPA creates compound optimization gains**:
- ✅ Efficiency from PromptMII
- ✅ Quality from GEPA
- ✅ Balance through Pareto optimization
- ✅ Production-ready integration path

**Next Step**: Implement Phase 1 integration and measure actual gains.


