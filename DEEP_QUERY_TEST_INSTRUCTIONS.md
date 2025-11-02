# Deep Query Test Instructions

## Overview

Test the unified pipeline with all optimizations enabled to verify quality, speed, and cost efficiency.

## What's Being Tested

### Optimizations Enabled
- ✅ **ACE Framework** - Agentic Context Engineering
- ✅ **GEPA** - Genetic-Pareto Evolution (with Arbor-inspired 24 rollouts)
- ✅ **IRT** - Difficulty-based routing (optimal thresholds: ACE 0.5, SWiRL 0.7, RVS 0.3)
- ✅ **RVS** - Recursive Verification System
- ✅ **DSPy** - Module optimization (with multi-signature support)
- ✅ **Semiotic Inference** - Deduction, Induction, Abduction
- ✅ **Teacher-Student** - Cost-optimized model routing
- ✅ **SWiRL + SRL** - Multi-step reasoning
- ✅ **EBM** - Energy-based refinement
- ✅ **ReasoningBank** - Memory extraction (automatic)
- ✅ **LLM-as-Judge** - Quality evaluation (automatic)

### Metrics Tracked
- **Quality**: LLM-as-judge score (target: ≥0.7)
- **Speed**: Total execution time (target: <60s)
- **Cost**: Total API costs (target: <$0.10)
- **Components**: Number of components used (target: ≥3)
- **ReasoningBank**: Memory extraction verification
- **Efficiency**: Quality per second, quality per dollar

## How to Run the Test

### Option 1: Direct Script Execution (Recommended)

```bash
npx tsx test-deep-query-with-all-optimizations.ts
```

This will:
1. Execute a complex quantum computing strategy query
2. Show real-time progress
3. Display comprehensive results with all metrics
4. Validate against targets

### Option 2: Via API Endpoint

1. Start the dev server:
```bash
npm run dev
```

2. Call the test endpoint (with auth):
```bash
curl http://localhost:3000/api/test-deep-query
```

### Option 3: Manual Testing

Use the unified pipeline directly in your code:

```typescript
import { unifiedPipeline } from './frontend/lib/unified-permutation-pipeline';

const pipeline = unifiedPipeline;
pipeline.updateConfig({
  enableACE: true,
  enableGEPA: true,
  enableIRT: true,
  enableRVS: true,
  enableDSPy: true,
  enableSemiotic: true,
  enableTeacherStudent: true,
  enableSWiRL: true,
  enableSRL: true,
  enableEBM: true,
  optimizationMode: 'balanced',
  aceThreshold: 0.5,
  swirlThreshold: 0.7,
  rvsThreshold: 0.3
});

const result = await pipeline.execute(
  'Your complex query here...',
  'business'
);

console.log('Quality:', result.metadata.quality_score);
console.log('Time:', result.metadata.performance.total_time_ms);
console.log('Cost:', result.metadata.performance.cost);
```

## Test Query

The test uses a deep/complex query about:
- Hybrid quantum-classical computing architecture
- Financial risk modeling
- Technical architecture decisions
- Business impact analysis
- Risk assessment
- Implementation roadmap

This query is designed to:
- Trigger multiple pipeline components
- Test IRT difficulty routing
- Exercise ReasoningBank memory extraction
- Validate LLM-as-judge evaluation
- Test all optimization features

## Expected Results

### Quality
- **Target**: ≥0.7 (70%)
- **Method**: LLM-as-judge evaluation
- **Criteria**: Relevance, Completeness, Correctness, Clarity

### Speed
- **Target**: <60 seconds
- **Includes**: All pipeline phases
- **Breakdown**: IRT, Semiotic, ACE, DSPy, Teacher-Student, RVS, etc.

### Cost
- **Target**: <$0.10
- **Breakdown**: Teacher calls, student calls, API costs
- **Optimization**: Teacher-Student routing minimizes cost

### Components
- **Expected**: 6-10 components activated
- **Includes**: ACE, GEPA, IRT, RVS, DSPy, Semiotic, Teacher-Student, SWiRL, EBM

## Validation Checklist

After running the test, verify:

- [ ] Quality score ≥ 0.7
- [ ] Total time < 60 seconds
- [ ] Total cost < $0.10
- [ ] At least 3 components used
- [ ] ReasoningBank memories extracted
- [ ] LLM-as-judge evaluation completed
- [ ] Answer is comprehensive and relevant
- [ ] All optimization features logged

## Troubleshooting

### If quality is low (<0.7)
- Check LLM-as-judge logs
- Verify ReasoningBank memories are being used
- Check if EBM refinement is running
- Ensure all components are enabled

### If speed is slow (>60s)
- Check API response times
- Verify teacher-student routing is working
- Check if too many components are activated
- Review IRT thresholds (may be activating expensive components)

### If cost is high (>$0.10)
- Check teacher vs student call balance
- Verify cost optimization is working
- Review component activation thresholds
- Check for unnecessary API calls

## Next Steps After Testing

1. Review the detailed trace for each component
2. Check ReasoningBank memory extraction logs
3. Analyze quality vs speed vs cost trade-offs
4. Adjust thresholds if needed based on results
5. Consider enabling multi-signature optimization for DSPy

## Configuration Options

You can modify the test configuration in `test-deep-query-with-all-optimizations.ts`:

```typescript
// Adjust thresholds
aceThreshold: 0.5,    // Lower = more ACE activation
swirlThreshold: 0.7,  // Lower = more SWiRL activation
rvsThreshold: 0.3,    // Lower = more RVS activation

// Enable/disable components
enableEBM: true,
enableSWiRL: true,
enableSRL: true,

// Optimization mode
optimizationMode: 'balanced' | 'quality' | 'speed'
```

## Understanding the Results

### Quality Score Breakdown
- **Overall Score**: Combined LLM-as-judge + component confidence
- **LLM-as-Judge**: 70% weight (primary evaluation)
- **Component Confidence**: 30% weight (fallback/robustness)

### Performance Breakdown
- **Phase 1**: IRT routing (<1ms)
- **Phase 2**: Semiotic inference (~2ms)
- **Phase 3**: ACE framework (~500-2000ms)
- **Phase 4**: DSPy + GEPA (~1000-3000ms)
- **Phase 5**: Teacher-Student (~2000-5000ms)
- **Phase 6**: SWiRL + SRL (~1000-3000ms)
- **Phase 7**: RVS verification (~500-2000ms)
- **Phase 8**: Synthesis + EBM (~500-2000ms)

### Cost Breakdown
- **Teacher calls**: Perplexity API (~$0.001-0.01 per call)
- **Student calls**: Ollama (free, local)
- **Other APIs**: Minimal if using local models

## Success Criteria

The test passes if:
- ✅ Quality ≥ 0.7
- ✅ Speed < 60s
- ✅ Cost < $0.10
- ✅ Components ≥ 3
- ✅ ReasoningBank working
- ✅ LLM-as-Judge working

All optimizations are working correctly if all validations pass!

