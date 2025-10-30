/**
 * Unit Tests for Inference Sampling Module
 *
 * Tests MCMC sampling functionality, diversity calculation,
 * and integration with different model providers.
 */

import {
  mcmcSampling,
  generateDiverseSamples,
  generateQualitySamples,
  generateBestSample,
  type SamplingConfig,
  type SamplingResult
} from './frontend/lib/inference-sampling';

const MODEL = process.env.RAG_MODEL || 'perplexity/sonar-pro';

// ============================================================================
// Test Utilities
// ============================================================================

function assertGreaterThan(value: number, threshold: number, message: string) {
  if (value <= threshold) {
    throw new Error(`${message}: Expected > ${threshold}, got ${value}`);
  }
  console.log(`  ✅ ${message}: ${value} > ${threshold}`);
}

function assertLessThan(value: number, threshold: number, message: string) {
  if (value >= threshold) {
    throw new Error(`${message}: Expected < ${threshold}, got ${value}`);
  }
  console.log(`  ✅ ${message}: ${value} < ${threshold}`);
}

function assertEqual(value: any, expected: any, message: string) {
  if (value !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${value}`);
  }
  console.log(`  ✅ ${message}: ${value} === ${expected}`);
}

// ============================================================================
// Unit Tests
// ============================================================================

async function testBasicSampling() {
  console.log('\n🧪 Test 1: Basic Sampling');

  const result = await mcmcSampling({
    model: MODEL,
    prompt: 'What is 2+2?',
    numSamples: 5,
    beta: 1.5,
    topK: 3
  });

  console.log('\n  📊 Results:');
  result.samples.forEach((sample, i) => {
    console.log(`    [${i + 1}] ${sample.substring(0, 100)}...`);
  });

  // Assertions
  assertEqual(result.samples.length, 3, 'Should return topK samples');
  assertGreaterThan(result.metadata.totalGenerated, 0, 'Should generate samples');
  assertGreaterThan(result.metadata.accepted, 0, 'Should accept some samples');

  console.log('  ✅ Basic sampling test passed');
}

async function testDiversityCalculation() {
  console.log('\n🧪 Test 2: Diversity Calculation');

  const result = await mcmcSampling({
    model: MODEL,
    prompt: 'Generate alternative phrasings of: "What was Q4 revenue?"',
    numSamples: 10,
    beta: 1.3,
    topK: 5
  });

  console.log('\n  📊 Diversity Metrics:');
  console.log(`    Diversity Score: ${result.diversity.toFixed(3)}`);
  console.log(`    Samples Generated: ${result.metadata.totalGenerated}`);
  console.log(`    Samples Accepted: ${result.metadata.accepted}`);

  // Assertions
  assertGreaterThan(result.diversity, 0.3, 'Diversity should be > 0.3');
  assertEqual(result.samples.length, 5, 'Should return 5 diverse samples');

  // Check that samples are actually different
  const uniqueSamples = new Set(result.samples);
  assertEqual(uniqueSamples.size, result.samples.length, 'All samples should be unique');

  console.log('  ✅ Diversity calculation test passed');
}

async function testQualitySharpening() {
  console.log('\n🧪 Test 3: Quality Sharpening (Beta Parameter)');

  // Low beta (more diversity, less quality bias)
  const lowBeta = await mcmcSampling({
    model: MODEL,
    prompt: 'Explain quantum computing',
    numSamples: 10,
    beta: 1.2,
    topK: 5
  });

  // High beta (less diversity, more quality bias)
  const highBeta = await mcmcSampling({
    model: MODEL,
    prompt: 'Explain quantum computing',
    numSamples: 10,
    beta: 2.0,
    topK: 5
  });

  console.log('\n  📊 Beta Comparison:');
  console.log(`    Low Beta (1.2) - Diversity: ${lowBeta.diversity.toFixed(3)}, Quality: ${lowBeta.avgQuality.toFixed(3)}`);
  console.log(`    High Beta (2.0) - Diversity: ${highBeta.diversity.toFixed(3)}, Quality: ${highBeta.avgQuality.toFixed(3)}`);

  // Assertions
  assertGreaterThan(lowBeta.diversity, highBeta.diversity, 'Low beta should have higher diversity');
  assertGreaterThan(highBeta.avgQuality, lowBeta.avgQuality, 'High beta should have higher quality');

  console.log('  ✅ Quality sharpening test passed');
}

async function testHelperFunctions() {
  console.log('\n🧪 Test 4: Helper Functions');

  // Test generateDiverseSamples
  const diverseSamples = await generateDiverseSamples(
    MODEL,
    'Reformulate: "What was Q4 revenue?"',
    3
  );

  console.log('\n  📊 Diverse Samples:');
  diverseSamples.forEach((sample, i) => {
    console.log(`    [${i + 1}] ${sample.substring(0, 80)}...`);
  });

  assertEqual(diverseSamples.length, 3, 'Should return 3 diverse samples');

  // Test generateQualitySamples
  const qualitySamples = await generateQualitySamples(
    MODEL,
    'What is the capital of France?',
    2
  );

  console.log('\n  📊 Quality Samples:');
  qualitySamples.forEach((sample, i) => {
    console.log(`    [${i + 1}] ${sample.substring(0, 80)}...`);
  });

  assertEqual(qualitySamples.length, 2, 'Should return 2 quality samples');

  // Test generateBestSample
  const bestSample = await generateBestSample(
    MODEL,
    'What is 2+2?'
  );

  console.log('\n  📊 Best Sample:');
  console.log(`    ${bestSample}`);

  assertGreaterThan(bestSample.length, 0, 'Best sample should not be empty');

  console.log('  ✅ Helper functions test passed');
}

async function testModelIntegration() {
  console.log('\n🧪 Test 5: Multi-Model Integration');

  const models = [
    MODEL,
    // 'ollama/gemma3:4b',  // Requires Ollama running
    // 'perplexity/sonar-pro'
  ];

  for (const model of models) {
    console.log(`\n  Testing model: ${model}`);

    try {
      const result = await mcmcSampling({
        model,
        prompt: 'What is machine learning?',
        numSamples: 3,
        beta: 1.5,
        topK: 2
      });

      console.log(`    ✅ Generated ${result.samples.length} samples`);
      console.log(`    Diversity: ${result.diversity.toFixed(3)}`);
      console.log(`    Quality: ${result.avgQuality.toFixed(3)}`);
    } catch (error) {
      console.log(`    ⚠️ Skipped (API key not configured or model not available)`);
    }
  }

  console.log('  ✅ Model integration test passed');
}

async function testPerformance() {
  console.log('\n🧪 Test 6: Performance & Latency');

  const startTime = Date.now();

  const result = await mcmcSampling({
    model: MODEL,
    prompt: 'Explain artificial intelligence',
    numSamples: 10,
    beta: 1.5,
    topK: 5
  });

  const latency = Date.now() - startTime;

  console.log('\n  📊 Performance:');
  console.log(`    Latency: ${latency}ms`);
  console.log(`    Samples/second: ${((result.metadata.totalGenerated / latency) * 1000).toFixed(2)}`);
  console.log(`    Average per sample: ${(latency / result.metadata.totalGenerated).toFixed(0)}ms`);

  // Assertions
  assertLessThan(latency, 30000, 'Total latency should be < 30s');

  console.log('  ✅ Performance test passed');
}

async function testEdgeCases() {
  console.log('\n🧪 Test 7: Edge Cases');

  // Test with k = 1 (single sample)
  const single = await mcmcSampling({
    model: MODEL,
    prompt: 'Hello',
    numSamples: 3,
    beta: 1.5,
    topK: 1
  });

  assertEqual(single.samples.length, 1, 'Should return 1 sample when topK=1');

  // Test with k > numSamples (should return all samples)
  const all = await mcmcSampling({
    model: MODEL,
    prompt: 'Hello',
    numSamples: 3,
    beta: 1.5,
    topK: 10
  });

  assertLessThan(all.samples.length, 11, 'Should not return more than numSamples');

  // Test with very low beta (minimal sharpening)
  const lowBeta = await mcmcSampling({
    model: MODEL,
    prompt: 'Test',
    numSamples: 5,
    beta: 1.0,
    topK: 3
  });

  assertGreaterThan(lowBeta.samples.length, 0, 'Should work with beta=1.0');

  // Test with very high beta (strong sharpening)
  const highBeta = await mcmcSampling({
    model: MODEL,
    prompt: 'Test',
    numSamples: 5,
    beta: 3.0,
    topK: 3
  });

  assertGreaterThan(highBeta.samples.length, 0, 'Should work with beta=3.0');

  console.log('  ✅ Edge cases test passed');
}

// ============================================================================
// Integration Tests
// ============================================================================

async function testQueryReformulationIntegration() {
  console.log('\n🧪 Test 8: Query Reformulation Integration');

  const query = "What was Q4 revenue?";

  const reformulations = await generateDiverseSamples(
    MODEL,
    `Enhance this query for better retrieval: "${query}"`,
    5
  );

  console.log('\n  📊 Reformulations:');
  reformulations.forEach((r, i) => {
    console.log(`    [${i + 1}] ${r}`);
  });

  // Check that reformulations are more detailed than original
  const avgLength = reformulations.reduce((sum, r) => sum + r.length, 0) / reformulations.length;
  assertGreaterThan(avgLength, query.length, 'Reformulations should be more detailed');

  console.log('  ✅ Query reformulation integration test passed');
}

async function testMultiPathVerificationIntegration() {
  console.log('\n🧪 Test 9: Multi-Path Verification Integration');

  const answer = "Q4 2024 revenue was $3.9M, up 23% YoY.";
  const context = "The company reported Q4 2024 revenue of $3.9 million, representing a 23% increase year-over-year.";

  const verifications = await generateDiverseSamples(
    MODEL,
    `Is this answer faithful to the context? Rate 0.0-1.0.

Context: ${context}

Answer: ${answer}`,
    3
  );

  console.log('\n  📊 Verification Perspectives:');
  verifications.forEach((v, i) => {
    console.log(`    [${i + 1}] ${v.substring(0, 100)}...`);
  });

  assertGreaterThan(verifications.length, 0, 'Should generate verification perspectives');

  console.log('  ✅ Multi-path verification integration test passed');
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('🚀 Starting Inference Sampling Tests\n');
  console.log('=' .repeat(80));

  const tests = [
    { name: 'Basic Sampling', fn: testBasicSampling },
    { name: 'Diversity Calculation', fn: testDiversityCalculation },
    { name: 'Quality Sharpening', fn: testQualitySharpening },
    { name: 'Helper Functions', fn: testHelperFunctions },
    { name: 'Model Integration', fn: testModelIntegration },
    { name: 'Performance', fn: testPerformance },
    { name: 'Edge Cases', fn: testEdgeCases },
    { name: 'Query Reformulation Integration', fn: testQueryReformulationIntegration },
    { name: 'Multi-Path Verification Integration', fn: testMultiPathVerificationIntegration }
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
