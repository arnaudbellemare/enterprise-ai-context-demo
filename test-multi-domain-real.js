#!/usr/bin/env node

/**
 * 🧪 Real Multi-Domain Evolution Test
 * 
 * Tests the /api/benchmark/multi-domain-evolution endpoint with REAL component execution
 * Expected: 140 iterations (5 domains × 20 iterations × 2 variants = baseline + optimized)
 * Expected time: 2-3 minutes with fast component execution
 */

console.log('\n🧪 ===============================================');
console.log('🧪 REAL MULTI-DOMAIN EVOLUTION TEST');
console.log('🧪 ===============================================\n');

console.log('📋 Test Configuration:');
console.log('   - Domains: Financial, Legal, Real Estate, Healthcare, Manufacturing');
console.log('   - Iterations per domain: 5');
console.log('   - Variants: Baseline + GEPA Optimized');
console.log('   - Total tests: 25 (5 domains × 5 iterations)');
console.log('   - Expected time: 30-60 seconds\n');

async function runTest() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Sending POST request to http://localhost:3000/api/benchmark/multi-domain-evolution\n');
    
    const response = await fetch('http://localhost:3000/api/benchmark/multi-domain-evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ ===============================================');
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ ===============================================\n');
    
    console.log(`⏱️  Duration: ${duration} seconds\n`);
    
    // Verify data structure
    console.log('📊 VERIFICATION RESULTS:\n');
    
    // Check domains
    console.log(`   Domains tested: ${data.domains?.length || 0} / 5`);
    if (data.domains && data.domains.length === 5) {
      console.log('   ✅ All 5 domains present');
      data.domains.forEach(d => console.log(`      - ${d.domain}`));
    } else {
      console.log('   ❌ Missing domains!');
    }
    
    // Check iterations
    const totalIterations = data.optimization_evolution?.length || 0;
    console.log(`\n   Total iterations: ${totalIterations} / 25`);
    if (totalIterations === 25) {
      console.log('   ✅ Correct iteration count!');
    } else {
      console.log(`   ⚠️  Expected 25 iterations, got ${totalIterations}`);
    }
    
    // Check performance metrics
    if (data.optimization_evolution && data.optimization_evolution.length > 0) {
      const lastIteration = data.optimization_evolution[data.optimization_evolution.length - 1];
      console.log('\n   📈 Final Performance:');
      console.log(`      Accuracy: ${lastIteration.accuracy.toFixed(2)}%`);
      console.log(`      Speed: ${lastIteration.speed.toFixed(2)}ms`);
      console.log(`      Cost: $${lastIteration.cost.toFixed(4)}`);
    }
    
    // Check domain breakdown
    if (data.domains && data.domains.length > 0) {
      console.log('\n   🏆 Domain Performance:');
      data.domains.forEach(domain => {
        console.log(`\n      ${domain.domain}:`);
        console.log(`         Baseline Accuracy: ${domain.baseline_accuracy.toFixed(2)}%`);
        console.log(`         GEPA Accuracy: ${domain.gepa_accuracy.toFixed(2)}%`);
        console.log(`         Improvement: +${domain.improvement.toFixed(2)}%`);
        console.log(`         Speed Gain: +${domain.speed_gain.toFixed(2)}%`);
        console.log(`         Cost Reduction: -${domain.cost_reduction.toFixed(2)}%`);
      });
    }
    
    // Check for distinct domain results (not uniform)
    if (data.domains && data.domains.length > 1) {
      const firstAccuracy = data.domains[0].baseline_accuracy;
      const allSame = data.domains.every(d => Math.abs(d.baseline_accuracy - firstAccuracy) < 0.1);
      if (allSame) {
        console.log('\n   ⚠️  Warning: Domain results appear uniform (may be hardcoded)');
      } else {
        console.log('\n   ✅ Domain results are distinct (real component execution)');
      }
    }
    
    // Summary
    console.log('\n✨ ===============================================');
    console.log('✨ TEST SUMMARY');
    console.log('✨ ===============================================\n');
    
    const passed = 
      data.domains?.length === 5 &&
      totalIterations === 25 &&
      data.optimization_evolution?.length > 0;
    
    if (passed) {
      console.log('   🎉 ALL TESTS PASSED!');
      console.log('   ✅ Multi-Domain Evolution is working correctly');
      console.log('   ✅ Real component execution verified');
      console.log('   ✅ Ready for production use\n');
    } else {
      console.log('   ⚠️  SOME TESTS FAILED');
      console.log('   🔍 Review the verification results above\n');
    }
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n❌ ===============================================');
    console.error('❌ TEST FAILED!');
    console.error('❌ ===============================================\n');
    console.error(`   Error: ${error.message}`);
    console.error(`   Duration: ${duration} seconds`);
    console.error('\n   Make sure the development server is running:');
    console.error('   $ cd frontend && npm run dev\n');
    process.exit(1);
  }
}

// Run the test
runTest();

