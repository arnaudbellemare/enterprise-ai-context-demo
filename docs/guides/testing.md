# Testing Guide

How to test and validate PERMUTATION.

## Quick Test

Verify everything works:

```bash
npm test
```

This runs `test-permutation-complete.ts` which validates:
- ✅ Domain detection
- ✅ ACE framework
- ✅ Multi-query generation
- ✅ IRT difficulty calculation
- ✅ ReasoningBank retrieval
- ✅ LoRA configuration
- ✅ DSPy refinement
- ✅ TRM verification

**Expected output**:
```
✅ Domain Detection: PASS
✅ ACE Framework: PASS
✅ Multi-Query: PASS (60 variations)
✅ IRT Assessment: PASS
✅ ReasoningBank: PASS (3 memories)
✅ LoRA Config: PASS
✅ DSPy Refinement: PASS (quality 0.94)
✅ TRM Verification: PASS (92% confidence)

✅ ALL TESTS PASSED (8/8)
```

## Benchmark Test

Run full benchmark suite:

```bash
npm run benchmark
```

This executes the complete system benchmark with:
- 100+ test queries
- IRT-calibrated difficulty
- Statistical significance testing
- Quality, latency, and cost metrics

**Duration**: ~5-10 minutes  
**Output**: `benchmark-results.json`

## Component Tests

### Test Individual Components

```typescript
// test-component.ts
import { PermutationEngine } from './frontend/lib/permutation-engine';

const engine = new PermutationEngine({
  enableACE: true,
  enableDSPy: false,  // Test without DSPy
  // ... other flags
});

const result = await engine.execute("test query", "general");
console.log('Quality:', result.metadata.quality_score);
```

### Test Configurations

```bash
# Test free (Ollama only) configuration
npx tsx examples/custom-config.ts
```

## Research Benchmarks

### GEPA Optimization

Validate GEPA implementation:

```bash
npm run benchmark:gepa
```

**What it tests**:
- Genetic algorithm convergence
- Pareto frontier calculation
- Comparison vs. baseline RL

**Expected**: 35x faster convergence than traditional RL

### OCR-IRT Benchmark

Run standardized benchmark from GEPA paper:

```bash
cd benchmarking
python download_ocr_dataset.py  # One-time download
python ocr_irt_benchmark.py
```

**What it tests**:
- IRT difficulty calibration accuracy
- Cross-domain generalization
- Statistical significance

## Unit Tests (Future)

Currently tests are integration tests. Unit test framework coming:

```bash
# Future
npm run test:unit
```

## Performance Testing

### Latency Test

```typescript
const start = Date.now();
const result = await engine.execute(query, domain);
const latency = Date.now() - start;

console.log(`Latency: ${latency}ms`);
// Target: <3000ms for p95
```

### Cost Test

```typescript
const results = [];
for (let i = 0; i < 100; i++) {
  const result = await engine.execute(queries[i], domain);
  results.push(result.metadata.cost);
}

const avgCost = results.reduce((a, b) => a + b) / results.length;
console.log(`Avg cost per query: $${avgCost}`);
// Target: <$0.008
```

### Quality Test

```typescript
const quality_scores = [];
for (const query of test_queries) {
  const result = await engine.execute(query.text, query.domain);
  const humanScore = await getHumanEvaluation(result.answer);
  quality_scores.push(humanScore);
}

const avgQuality = quality_scores.reduce((a, b) => a + b) / quality_scores.length;
console.log(`Avg quality: ${avgQuality}`);
// Target: >0.90
```

## Continuous Integration

### GitHub Actions (Future)

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run benchmark
```

## Test Data

### Sample Queries

Located in `docs/test-data/`:

```
docs/test-data/
├── financial.json      # 100 financial queries
├── crypto.json         # 100 crypto queries
├── real_estate.json    # 100 real estate queries
├── general.json        # 100 general queries
└── mixed.json          # 100 mixed difficulty queries
```

Format:
```json
{
  "queries": [
    {
      "text": "What is Bitcoin's current price?",
      "domain": "crypto",
      "expected_irt": 0.8,
      "expected_quality": 0.9
    }
  ]
}
```

## Regression Testing

Track quality over time:

```bash
# Run benchmark and save results
npm run benchmark > results-$(date +%Y%m%d).json

# Compare with baseline
npx tsx scripts/compare-results.ts baseline.json results-20250114.json
```

## Debugging Failed Tests

### Enable Verbose Logging

```typescript
const engine = new PermutationEngine({
  // ... config
});

// Add logging
engine.on('step', (step) => {
  console.log(`[${step.component}] ${step.description}`);
});
```

### Check Database Connection

```bash
npx tsx test-supabase-connection.js
```

### Verify API Keys

```bash
# Check .env.local
cat frontend/.env.local

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Perplexity
curl https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY"
```

## Test Coverage Goals

| Component | Coverage | Status |
|-----------|----------|--------|
| Domain Detection | 100% | ✅ |
| ACE Framework | 90% | ✅ |
| IRT Calculation | 100% | ✅ |
| Multi-Query | 80% | ✅ |
| ReasoningBank | 85% | ✅ |
| DSPy Refine | 75% | ⚠️ Needs improvement |
| LoRA | 50% | ⚠️ Config-only |
| SQL Execution | 70% | ⚠️ Needs edge cases |

## Common Issues

### Issue: Tests timeout

**Solution**: Increase timeout in test file:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Issue: API rate limits

**Solution**: Add delays between tests:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Issue: Database not seeded

**Solution**: Run migration:
```bash
cd frontend
supabase db push
```

### Issue: Inconsistent results

**Solution**: Set random seed:
```typescript
Math.random = seedrandom('test-seed-123');
```

## Test Metrics

Track these metrics:
- **Pass Rate**: % of tests passing (target: >95%)
- **Quality Score**: Average quality (target: >0.90)
- **Latency**: p95 latency (target: <3s)
- **Cost**: Average cost per query (target: <$0.008)
- **Coverage**: Code coverage (target: >80%)

## Contributing Tests

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for:
- How to add new test cases
- Benchmark methodology
- Statistical testing requirements

---

**Last Updated**: January 14, 2025

