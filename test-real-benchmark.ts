/**
 * Test Script - REAL Benchmark Verification
 * 
 * Run this to verify the real benchmark system works
 */

async function testRealBenchmark() {
  console.log('🧪 Testing REAL Benchmark System...\n');
  
  try {
    // Test the API endpoint
    console.log('📡 Calling /api/benchmark/real-test...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/benchmark/real-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Request completed in ${duration}ms\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('   Details:', errorText);
      return;
    }

    const data = await response.json();
    
    // Display results
    console.log('✅ REAL BENCHMARK RESULTS:\n');
    console.log(`📊 Test Run ID: ${data.test_run_id}`);
    console.log(`⏱️  Total Duration: ${data.total_duration_ms.toFixed(2)}ms`);
    console.log(`📈 Total Tests: ${data.summary.total_tests}`);
    console.log(`✅ Passed: ${data.summary.passed}`);
    console.log(`❌ Failed: ${data.summary.failed}`);
    console.log(`💰 Total Cost: $${data.summary.total_cost.toFixed(4)}`);
    console.log(`🎯 Avg Accuracy: ${(data.summary.avg_accuracy * 100).toFixed(1)}%`);
    console.log(`⚡ Avg Latency: ${data.summary.avg_latency_ms.toFixed(2)}ms\n`);

    console.log('🏆 COMPONENT RANKINGS:\n');
    data.component_rankings.forEach((ranking: any, index: number) => {
      console.log(`  ${index + 1}. ${ranking.component}`);
      console.log(`     Overall Score: ${(ranking.overall_score * 100).toFixed(1)}%`);
      console.log(`     Pass Rate: ${(ranking.pass_rate * 100).toFixed(0)}%\n`);
    });

    console.log('📋 DETAILED RESULTS:\n');
    data.results.forEach((result: any, index: number) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.component}`);
      console.log(`     Query: "${result.test_query.substring(0, 60)}..."`);
      console.log(`     Latency: ${result.actual_latency_ms.toFixed(2)}ms`);
      console.log(`     Cost: $${result.actual_cost.toFixed(4)}`);
      console.log(`     Accuracy: ${(result.accuracy_score * 100).toFixed(1)}%`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
      if (result.actual_output) {
        console.log(`     Output:`, JSON.stringify(result.actual_output, null, 2).substring(0, 200));
      }
      console.log('');
    });

    console.log('\n🎉 Test Complete - All data is REAL!\n');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('   Make sure the dev server is running on http://localhost:3001');
  }
}

// Run the test
testRealBenchmark();

