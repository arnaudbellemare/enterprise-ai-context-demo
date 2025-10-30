/**
 * Integration Tests for Query Reformulation
 *
 * Tests GEPA RAG Stage 1 (Query Reformulation) with inference sampling.
 *
 * Tests:
 * 1. Basic reformulation with single strategy
 * 2. Multi-strategy reformulation
 * 3. Diversity calculation
 * 4. Quality scoring
 * 5. Deduplication
 * 6. Beta parameter effect
 * 7. Performance and latency
 * 8. Edge cases (empty query, long query)
 */

import {
  QueryReformulator,
  createQueryReformulator,
  reformulateQuery,
  type ReformulationStrategy,
} from './frontend/lib/rag/query-reformulator';

const MODEL = process.env.RAG_MODEL || 'perplexity/sonar-pro';

// ============================================================================
// Helper Functions
// ============================================================================

function assertGreaterThan(value: number, threshold: number, message: string) {
  if (value <= threshold) {
    throw new Error(`${message}: Expected > ${threshold}, got ${value}`);
  }
  console.log(`  ✅ ${message}: ${value} > ${threshold}`);
}

function assertEqual(value: any, expected: any, message: string) {
  if (value !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${value}`);
  }
  console.log(`  ✅ ${message}: ${value} === ${expected}`);
}

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`${message}: Expected true, got false`);
  }
  console.log(`  ✅ ${message}`);
}

// ============================================================================
// Tests
// ============================================================================

async function test1_BasicReformulation() {
  console.log('\n🧪 Test 1: Basic Reformulation (Single Strategy)');

  const reformulator = new QueryReformulator(MODEL);
  const query = 'What was the Q4 revenue for 2024?';

  const result = await reformulator.reformulate(query, {
    numReformulations: 3,
    strategies: ['expansion'],
    includeOriginal: false,
  });

  console.log(`\n  📊 Original: "${query}"`);
  console.log(`  📋 Reformulations:`);
  result.reformulations.forEach((r, i) => {
    console.log(`    [${i + 1}] ${r.strategy}: "${r.query}"`);
    console.log(`        Quality: ${r.quality.toFixed(3)}, Similarity: ${r.similarity.toFixed(3)}`);
  });

  // Assertions
  assertEqual(result.reformulations.length, 3, 'Should generate 3 reformulations');
  assertTrue(result.reformulations.every(r => r.strategy === 'expansion'), 'All should use expansion strategy');
  assertGreaterThan(result.avgQuality, 0.3, 'Average quality should be reasonable');
  assertGreaterThan(2000, result.latency, 'Latency should be < 2s');

  console.log('  ✅ Basic reformulation test passed');
}

async function test2_MultiStrategy() {
  console.log('\n🧪 Test 2: Multi-Strategy Reformulation');

  const reformulator = new QueryReformulator(MODEL);
  const query = 'How does machine learning work?';

  const result = await reformulator.reformulate(query, {
    numReformulations: 5,
    strategies: ['expansion', 'clarification', 'simplification'],
    includeOriginal: false,
  });

  console.log(`\n  📊 Original: "${query}"`);
  console.log(`  📋 Reformulations by strategy:`);

  const byStrategy = result.reformulations.reduce((acc, r) => {
    acc[r.strategy] = (acc[r.strategy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byStrategy).forEach(([strategy, count]) => {
    console.log(`    ${strategy}: ${count}`);
  });

  // Assertions
  assertGreaterThan(result.reformulations.length, 0, 'Should generate reformulations');
  assertEqual(result.strategiesUsed.length, 3, 'Should use 3 strategies');
  assertTrue(
    result.strategiesUsed.includes('expansion'),
    'Should include expansion strategy'
  );

  console.log('  ✅ Multi-strategy test passed');
}

async function test3_DiversityCalculation() {
  console.log('\n🧪 Test 3: Diversity Calculation');

  const reformulator = new QueryReformulator(MODEL);
  const query = 'What are the benefits of exercise?';

  const result = await reformulator.reformulate(query, {
    numReformulations: 5,
    strategies: ['variation', 'expansion', 'clarification'],
    beta: 1.0, // Lower beta = more diversity
  });

  console.log(`\n  📊 Diversity: ${result.diversity.toFixed(3)}`);
  console.log(`  📊 Average Quality: ${result.avgQuality.toFixed(3)}`);
  console.log(`  📋 Samples:`);
  result.reformulations.slice(0, 5).forEach((r, i) => {
    console.log(`    [${i + 1}] "${r.query.substring(0, 60)}..."`);
  });

  // Assertions
  assertGreaterThan(result.diversity, 0.2, 'Should have reasonable diversity');
  assertGreaterThan(result.avgQuality, 0.2, 'Should maintain quality');

  console.log('  ✅ Diversity calculation test passed');
}

async function test4_QualityScoring() {
  console.log('\n🧪 Test 4: Quality Scoring (Beta Parameter)');

  const reformulator = new QueryReformulator(MODEL);
  const query = 'Explain quantum computing';

  // Low beta = more diversity
  const lowBeta = await reformulator.reformulate(query, {
    numReformulations: 5,
    strategies: ['expansion'],
    beta: 1.0,
  });

  // High beta = more quality
  const highBeta = await reformulator.reformulate(query, {
    numReformulations: 5,
    strategies: ['expansion'],
    beta: 2.0,
  });

  console.log(`\n  📊 Low Beta (β=1.0):`);
  console.log(`     Diversity: ${lowBeta.diversity.toFixed(3)}`);
  console.log(`     Avg Quality: ${lowBeta.avgQuality.toFixed(3)}`);

  console.log(`\n  📊 High Beta (β=2.0):`);
  console.log(`     Diversity: ${highBeta.diversity.toFixed(3)}`);
  console.log(`     Avg Quality: ${highBeta.avgQuality.toFixed(3)}`);

  // High beta should have lower diversity but similar/higher quality
  assertTrue(
    highBeta.diversity <= lowBeta.diversity || Math.abs(highBeta.diversity - lowBeta.diversity) < 0.1,
    'High beta should have lower or similar diversity'
  );

  console.log('  ✅ Quality scoring test passed');
}

async function test5_Deduplication() {
  console.log('\n🧪 Test 5: Semantic Deduplication');

  const reformulator = new QueryReformulator(MODEL);
  const query = 'What is AI?';

  const result = await reformulator.reformulate(query, {
    numReformulations: 5,
    strategies: ['variation', 'simplification'],
    dedupThreshold: 0.8, // Aggressive deduplication
  });

  console.log(`\n  📊 Generated ${result.reformulations.length} unique reformulations`);
  console.log(`  📋 Samples:`);
  result.reformulations.forEach((r, i) => {
    console.log(`    [${i + 1}] "${r.query}"`);
    console.log(`        Similarity to original: ${r.similarity.toFixed(3)}`);
  });

  // Assertions
  assertGreaterThan(result.reformulations.length, 0, 'Should have reformulations');
  assertTrue(
    result.reformulations.every(r => r.similarity < 0.95),
    'Reformulations should be sufficiently different from original'
  );

  console.log('  ✅ Deduplication test passed');
}

async function test6_Decomposition() {
  console.log('\n🧪 Test 6: Query Decomposition');

  const reformulator = new QueryReformulator(MODEL);
  const query = 'What were the Q4 2024 revenue and profit margins, and how did they compare to Q3?';

  const result = await reformulator.reformulate(query, {
    numReformulations: 5,
    strategies: ['decomposition'],
    includeOriginal: false,
  });

  console.log(`\n  📊 Original: "${query}"`);
  console.log(`  📋 Sub-queries generated: ${result.reformulations.length}`);
  result.reformulations.forEach((r, i) => {
    console.log(`    [${i + 1}] "${r.query}"`);
  });

  // Assertions
  assertGreaterThan(result.reformulations.length, 1, 'Should generate multiple sub-queries');
  assertTrue(
    result.reformulations.every(r => r.strategy === 'decomposition'),
    'All should use decomposition strategy'
  );

  console.log('  ✅ Decomposition test passed');
}

async function test7_Performance() {
  console.log('\n🧪 Test 7: Performance and Latency');

  const reformulator = new QueryReformulator(MODEL);
  const queries = [
    'What is the capital of France?',
    'Explain the theory of relativity',
    'How do I make a chocolate cake?',
  ];

  let totalLatency = 0;
  let totalReformulations = 0;

  for (const query of queries) {
    const startTime = Date.now();

    const result = await reformulator.reformulate(query, {
      numReformulations: 3,
      strategies: ['expansion', 'clarification'],
    });

    const latency = Date.now() - startTime;
    totalLatency += latency;
    totalReformulations += result.reformulations.length;

    console.log(`\n  Query: "${query}"`);
    console.log(`    Latency: ${latency}ms`);
    console.log(`    Reformulations: ${result.reformulations.length}`);
    console.log(`    Diversity: ${result.diversity.toFixed(3)}`);
  }

  const avgLatency = totalLatency / queries.length;
  const avgReformulations = totalReformulations / queries.length;

  console.log(`\n  📊 Performance Summary:`);
  console.log(`    Average Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`    Average Reformulations: ${avgReformulations.toFixed(1)}`);

  // Assertions
  assertGreaterThan(5000, avgLatency, 'Average latency should be < 5s');
  assertGreaterThan(avgReformulations, 2, 'Should generate multiple reformulations');

  console.log('  ✅ Performance test passed');
}

async function test8_EdgeCases() {
  console.log('\n🧪 Test 8: Edge Cases');

  const reformulator = new QueryReformulator();

  // Short query
  const shortResult = await reformulator.reformulate('What is AI?', {
    numReformulations: 3,
    strategies: ['expansion'],
  });

  console.log(`\n  📊 Short Query:`);
  console.log(`    Reformulations: ${shortResult.reformulations.length}`);
  console.log(`    Diversity: ${shortResult.diversity.toFixed(3)}`);

  assertTrue(shortResult.reformulations.length > 0, 'Should handle short queries');

  // Long query
  const longQuery = 'What were the Q4 2024 financial results including revenue, profit margins, operating expenses, and cash flow, and how did these metrics compare to Q3 2024 and Q4 2023 performance across all business segments?';

  const longResult = await reformulator.reformulate(longQuery, {
    numReformulations: 3,
    strategies: ['simplification', 'decomposition'],
  });

  console.log(`\n  📊 Long Query:`);
  console.log(`    Reformulations: ${longResult.reformulations.length}`);
  console.log(`    Diversity: ${longResult.diversity.toFixed(3)}`);

  assertTrue(longResult.reformulations.length > 0, 'Should handle long queries');

  // Include original
  const withOriginal = await reformulator.reformulate('Test query', {
    numReformulations: 3,
    strategies: ['variation'],
    includeOriginal: true,
  });

  assertTrue(
    withOriginal.reformulations[0].query === 'Test query',
    'Should include original when requested'
  );

  // Exclude original
  const withoutOriginal = await reformulator.reformulate('Test query', {
    numReformulations: 3,
    strategies: ['variation'],
    includeOriginal: false,
  });

  assertTrue(
    withoutOriginal.reformulations[0].query !== 'Test query',
    'Should exclude original when requested'
  );

  console.log('  ✅ Edge cases test passed');
}

async function test9_HelperFunctions() {
  console.log('\n🧪 Test 9: Helper Functions');

  // Test createQueryReformulator
  const reformulator = createQueryReformulator(MODEL, 1.5, 0.9);
  assertTrue(reformulator instanceof QueryReformulator, 'Should create reformulator instance');

  // Test reformulateQuery convenience function
  const result = await reformulateQuery('What is machine learning?', 3, ['expansion']);

  console.log(`\n  📊 Convenience Function Result:`);
  console.log(`    Reformulations: ${result.reformulations.length}`);
  console.log(`    Diversity: ${result.diversity.toFixed(3)}`);

  assertTrue(result.reformulations.length > 0, 'Convenience function should work');
  assertTrue(result.reformulations[0].query === 'What is machine learning?', 'Should include original by default');

  console.log('  ✅ Helper functions test passed');
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('🚀 Starting Query Reformulation Integration Tests\n');
  console.log('='.repeat(80));

  const tests = [
    { name: 'Basic Reformulation', fn: test1_BasicReformulation },
    { name: 'Multi-Strategy', fn: test2_MultiStrategy },
    { name: 'Diversity Calculation', fn: test3_DiversityCalculation },
    { name: 'Quality Scoring', fn: test4_QualityScoring },
    { name: 'Deduplication', fn: test5_Deduplication },
    { name: 'Decomposition', fn: test6_Decomposition },
    { name: 'Performance', fn: test7_Performance },
    { name: 'Edge Cases', fn: test8_EdgeCases },
    { name: 'Helper Functions', fn: test9_HelperFunctions },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      console.error(`\n  ❌ ${test.name} FAILED:`, error);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Results: ${passed}/${tests.length} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
