/**
 * Test: Stagnation Detection
 * 
 * Tests the stagnation detection system that identifies when
 * optimization plateaus and recommends adaptive strategies.
 */

import { StagnationDetector, optimizeWithStagnationDetection, AdaptiveExploration } from './frontend/lib/stagnation-detector';

console.log('🧪 Testing Stagnation Detection System');
console.log('═══════════════════════════════════════════════════════════════\n');

async function test1_BasicStagnation() {
  console.log('📝 TEST 1: Basic Stagnation Detection');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const detector = new StagnationDetector({
    windowSize: 10,
    threshold: 0.01,
    patience: 5
  });
  
  // Simulate scores that plateau
  const scores = [0.70, 0.75, 0.80, 0.83, 0.85, 0.86, 0.86, 0.86, 0.86, 0.86, 0.86];
  
  let stagnationDetected = false;
  let stagnationIteration = -1;
  
  for (let i = 0; i < scores.length; i++) {
    const result = detector.addScore(scores[i]);
    console.log(
      `Iteration ${i + 1}: Score = ${scores[i].toFixed(2)}, ` +
      `Stagnant = ${result.isStagnating}, ` +
      `Trend = ${result.stats.trend}`
    );
    
    if (result.isStagnating && !stagnationDetected) {
      stagnationDetected = true;
      stagnationIteration = i + 1;
      console.log(`  ✅ Stagnation detected at iteration ${stagnationIteration}`);
    }
  }
  
  if (stagnationDetected && stagnationIteration === 10) {
    console.log(`\n✅ TEST 1 PASSED: Detected stagnation at expected iteration`);
    return { passed: true, iteration: stagnationIteration };
  } else {
    console.log(`\n❌ TEST 1 FAILED: Did not detect stagnation correctly`);
    return { passed: false };
  }
}

async function test2_ImprovingTrend() {
  console.log('\n\n📝 TEST 2: Improving Trend Detection');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const detector = new StagnationDetector();
  
  // Simulate steadily improving scores
  const scores = [0.70, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.91, 0.93, 0.95];
  
  let allImproving = true;
  
  for (let i = 0; i < scores.length; i++) {
    const result = detector.addScore(scores[i]);
    
    if (i >= 3) { // After enough data
      if (result.stats.trend !== 'improving') {
        allImproving = false;
      }
      console.log(
        `Iteration ${i + 1}: Score = ${scores[i].toFixed(2)}, ` +
        `Trend = ${result.stats.trend}, ` +
        `Improvement = ${(result.recentImprovement * 100).toFixed(2)}%`
      );
    }
  }
  
  if (allImproving) {
    console.log(`\n✅ TEST 2 PASSED: Correctly identified improving trend`);
    return { passed: true };
  } else {
    console.log(`\n❌ TEST 2 FAILED: Did not correctly identify trend`);
    return { passed: false };
  }
}

async function test3_DecliningTrend() {
  console.log('\n\n📝 TEST 3: Declining Trend Detection');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const detector = new StagnationDetector();
  
  // Simulate declining scores
  const scores = [0.90, 0.88, 0.85, 0.83, 0.80, 0.78, 0.75, 0.73, 0.70, 0.68];
  
  let decliningDetected = false;
  
  for (let i = 0; i < scores.length; i++) {
    const result = detector.addScore(scores[i]);
    
    if (i >= 3 && result.stats.trend === 'declining') {
      decliningDetected = true;
    }
    
    console.log(
      `Iteration ${i + 1}: Score = ${scores[i].toFixed(2)}, ` +
      `Trend = ${result.stats.trend}`
    );
  }
  
  if (decliningDetected) {
    console.log(`\n✅ TEST 3 PASSED: Correctly identified declining trend`);
    return { passed: true };
  } else {
    console.log(`\n❌ TEST 3 FAILED: Did not detect declining trend`);
    return { passed: false };
  }
}

async function test4_AdaptiveExploration() {
  console.log('\n\n📝 TEST 4: Adaptive Exploration Rate');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const adaptive = new AdaptiveExploration(0.1); // Base rate = 0.1
  
  // Simulate stagnating scores
  const scores = [0.70, 0.75, 0.80, 0.82, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83];
  
  let explorationIncreased = false;
  let initialRate = 0.1;
  
  for (let i = 0; i < scores.length; i++) {
    const result = adaptive.update(scores[i]);
    
    console.log(
      `Iteration ${i + 1}: Score = ${scores[i].toFixed(2)}, ` +
      `Exploration = ${(result.explorationRate * 100).toFixed(1)}%`
    );
    
    if (result.explorationRate > initialRate * 1.5) {
      explorationIncreased = true;
    }
  }
  
  if (explorationIncreased) {
    console.log(`\n✅ TEST 4 PASSED: Exploration rate increased during stagnation`);
    return { passed: true };
  } else {
    console.log(`\n❌ TEST 4 FAILED: Exploration rate did not adapt`);
    return { passed: false };
  }
}

async function test5_OptimizationWithDetection() {
  console.log('\n\n📝 TEST 5: Full Optimization Loop');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  // Simulate optimization that plateaus
  const result = await optimizeWithStagnationDetection(
    async (iteration) => {
      // Score improves then plateaus
      if (iteration <= 5) {
        return 0.70 + (iteration * 0.03);
      } else {
        return 0.85 + (Math.random() * 0.001); // Plateau with noise
      }
    },
    20, // max iterations
    { windowSize: 5, threshold: 0.01, patience: 3 }
  );
  
  if (result.stagnationOccurred) {
    console.log(`\n✅ TEST 5 PASSED: Detected stagnation in optimization loop`);
    console.log(`Best score: ${result.bestScore.toFixed(4)} at iteration ${result.bestIteration}`);
    return { passed: true, ...result };
  } else {
    console.log(`\n❌ TEST 5 FAILED: Did not detect stagnation`);
    return { passed: false };
  }
}

async function test6_Statistics() {
  console.log('\n\n📝 TEST 6: Statistical Metrics');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const detector = new StagnationDetector();
  
  const scores = [0.70, 0.75, 0.80, 0.85, 0.90];
  
  let statsCorrect = false;
  
  for (const score of scores) {
    detector.addScore(score);
  }
  
  const summary = detector.getSummary();
  
  console.log('Summary Statistics:');
  console.log(`  Mean: ${summary.stats.mean.toFixed(4)}`);
  console.log(`  Variance: ${summary.stats.variance.toFixed(6)}`);
  console.log(`  Best: ${summary.stats.best.toFixed(4)}`);
  console.log(`  Worst: ${summary.stats.worst.toFixed(4)}`);
  console.log(`  Trend: ${summary.stats.trend}`);
  
  if (
    Math.abs(summary.stats.mean - 0.80) < 0.01 &&
    summary.stats.best === 0.90 &&
    summary.stats.worst === 0.70
  ) {
    statsCorrect = true;
  }
  
  if (statsCorrect) {
    console.log(`\n✅ TEST 6 PASSED: Statistics computed correctly`);
    return { passed: true };
  } else {
    console.log(`\n❌ TEST 6 FAILED: Statistics incorrect`);
    return { passed: false };
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    test1: await test1_BasicStagnation(),
    test2: await test2_ImprovingTrend(),
    test3: await test3_DecliningTrend(),
    test4: await test4_AdaptiveExploration(),
    test5: await test5_OptimizationWithDetection(),
    test6: await test6_Statistics()
  };
  
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const passed = Object.values(results).filter(r => r.passed).length;
  const total = Object.values(results).length;
  
  console.log(`Tests Passed: ${passed}/${total} (${(passed / total * 100).toFixed(1)}%)\n`);
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${result.passed ? 'PASSED' : 'FAILED'}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n💡 Key Insights:');
    console.log('   • Stagnation detection prevents wasted cycles');
    console.log('   • Adaptive exploration responds to plateaus');
    console.log('   • Trend analysis identifies improvement patterns');
    console.log('   • Potential savings: 10-30% of optimization time');
    console.log('\n✅ Feature #3 (Stagnation Detection) is WORKING!\n');
  } else {
    console.log('\n❌ Some tests failed. Review implementation.');
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return { passed, total, results };
}

// Execute tests
runAllTests()
  .then(results => {
    if (results.passed === results.total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });

