/**
 * Test: Explicit Requirement Tracking
 * 
 * Tests the requirement tracking system that stops optimization
 * when all MUST requirements are satisfied, saving computational resources.
 * 
 * Expected improvement: 20-40% cost savings by stopping early
 */

import { RequirementTracker, trackLoRARequirements, trackOptimization } from './frontend/lib/requirement-tracker';

console.log('🧪 Testing Requirement Tracking System');
console.log('═══════════════════════════════════════════════════════════════\n');

async function test1_BasicTracking() {
  console.log('📝 TEST 1: Basic Requirement Tracking');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const tracker = new RequirementTracker();
  
  // Create requirements
  const reqId = await tracker.createRequirementSet('test_basic', [
    { metric: 'accuracy', target: 0.90, priority: 'must', tolerance: 0.02, direction: 'higher' },
    { metric: 'latency', target: 2.0, priority: 'must', tolerance: 0.1, direction: 'lower' }
  ]);
  
  // Simulate 10 iterations
  for (let i = 1; i <= 10; i++) {
    const currentValues = {
      accuracy: 0.70 + (i * 0.025),
      latency: 3.0 - (i * 0.12)
    };
    
    console.log(`\nIteration ${i}:`);
    const result = await tracker.updateRequirements(reqId, currentValues);
    
    if (result.shouldStop) {
      console.log(`✅ TEST 1 PASSED: Stopped at iteration ${i} (saved ${10 - i} iterations)`);
      return { passed: true, savedIterations: 10 - i };
    }
  }
  
  console.log('❌ TEST 1 FAILED: Did not stop within 10 iterations');
  return { passed: false, savedIterations: 0 };
}

async function test2_LoRATracking() {
  console.log('\n\n📝 TEST 2: LoRA Training with Requirements');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const tracker = await trackLoRARequirements('test_domain');
  
  const sets = tracker.listSets();
  const report = tracker.getReport(sets[0].id);
  
  if (report && report.allSatisfied) {
    console.log('✅ TEST 2 PASSED: LoRA training requirements satisfied');
    return { passed: true, finalSatisfactionRate: report.satisfactionRate };
  } else {
    console.log('❌ TEST 2 FAILED: Requirements not satisfied');
    return { passed: false, finalSatisfactionRate: report?.satisfactionRate || 0 };
  }
}

async function test3_MultipleRequirements() {
  console.log('\n\n📝 TEST 3: Multiple Requirement Priorities');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const tracker = new RequirementTracker();
  
  const reqId = await tracker.createRequirementSet('test_multi', [
    { metric: 'accuracy', target: 0.95, priority: 'must', tolerance: 0.02, direction: 'higher' },
    { metric: 'latency', target: 1.5, priority: 'must', tolerance: 0.1, direction: 'lower' },
    { metric: 'cost', target: 0.005, priority: 'should', tolerance: 0.2, direction: 'lower' },
    { metric: 'f1_score', target: 0.90, priority: 'nice', tolerance: 0.05, direction: 'higher' }
  ]);
  
  // Test with only MUST requirements satisfied
  const result1 = await tracker.updateRequirements(reqId, {
    accuracy: 0.95,
    latency: 1.4,
    cost: 0.010,  // SHOULD not satisfied
    f1_score: 0.85 // NICE not satisfied
  });
  
  if (result1.shouldStop && result1.allSatisfied) {
    console.log('✅ TEST 3 PASSED: Stops when MUST requirements satisfied (even if SHOULD/NICE are not)');
    return { passed: true };
  } else {
    console.log('❌ TEST 3 FAILED: Should stop when MUST requirements are satisfied');
    return { passed: false };
  }
}

async function test4_OptimizationFunction() {
  console.log('\n\n📝 TEST 4: Generic Optimization with Tracking');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  let iterationCount = 0;
  
  const result = await trackOptimization(
    'test_optimization',
    [
      { metric: 'score', target: 0.85, priority: 'must', tolerance: 0.02, direction: 'higher' }
    ],
    async (iteration) => {
      iterationCount = iteration;
      // Simulate score improvement
      return { score: 0.60 + (iteration * 0.03) };
    },
    50 // max iterations
  );
  
  if (result.stopped && result.savedIterations > 0) {
    console.log(`✅ TEST 4 PASSED: Stopped at iteration ${result.iteration}, saved ${result.savedIterations} iterations`);
    return { passed: true, ...result };
  } else {
    console.log('❌ TEST 4 FAILED: Did not stop early');
    return { passed: false };
  }
}

async function test5_HistoryTracking() {
  console.log('\n\n📝 TEST 5: History Tracking');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const tracker = new RequirementTracker();
  
  const reqId = await tracker.createRequirementSet('test_history', [
    { metric: 'accuracy', target: 0.90, priority: 'must', direction: 'higher' }
  ]);
  
  // Update 5 times
  for (let i = 1; i <= 5; i++) {
    await tracker.updateRequirements(reqId, { accuracy: 0.70 + (i * 0.05) });
  }
  
  const history = tracker.getHistory(reqId);
  
  if (history && history.length === 5) {
    console.log(`✅ TEST 5 PASSED: History has ${history.length} entries`);
    console.log('History:', history.map((h, i) => 
      `Iteration ${i + 1}: ${(h.satisfactionRate * 100).toFixed(1)}%`
    ).join(', '));
    return { passed: true, historyLength: history.length };
  } else {
    console.log('❌ TEST 5 FAILED: History tracking not working');
    return { passed: false };
  }
}

async function test6_ExportReport() {
  console.log('\n\n📝 TEST 6: Export Report');
  console.log('─────────────────────────────────────────────────────────────\n');
  
  const tracker = new RequirementTracker();
  
  const reqId = await tracker.createRequirementSet('test_export', [
    { metric: 'accuracy', target: 0.90, priority: 'must', direction: 'higher' }
  ]);
  
  await tracker.updateRequirements(reqId, { accuracy: 0.92 });
  
  const report = tracker.exportReport(reqId);
  const parsed = JSON.parse(report);
  
  if (parsed.name === 'test_export' && parsed.satisfactionRate === 1.0) {
    console.log('✅ TEST 6 PASSED: Report exported successfully');
    console.log('Report sample:', JSON.stringify(parsed, null, 2).substring(0, 300) + '...');
    return { passed: true };
  } else {
    console.log('❌ TEST 6 FAILED: Report export failed');
    return { passed: false };
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    test1: await test1_BasicTracking(),
    test2: await test2_LoRATracking(),
    test3: await test3_MultipleRequirements(),
    test4: await test4_OptimizationFunction(),
    test5: await test5_HistoryTracking(),
    test6: await test6_ExportReport()
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
    console.log('   • Requirement tracking stops optimization early');
    console.log(`   • Saved ${results.test1.savedIterations} iterations in test 1`);
    console.log(`   • Saved ${results.test4.savedIterations} iterations in test 4`);
    console.log('   • Total potential savings: 20-40% of compute costs');
    console.log('\n✅ Feature #1 (Explicit Requirement Tracking) is WORKING!\n');
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

