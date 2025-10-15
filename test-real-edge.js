#!/usr/bin/env node

const http = require('http');

console.log('🔥 Testing REAL EDGE TEST API...');
console.log('==================================================\n');

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/benchmark/real-edge-test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('📡 Calling: POST http://localhost:3005/api/benchmark/real-edge-test\n');
console.log('⏳ This will take 30-60 seconds (real API calls)...\n');

const req = http.request(options, (res) => {
  let data = '';

  console.log(`✅ Response Status: ${res.statusCode}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('==================================================');
      console.log('🎯 REAL EDGE TEST RESULTS');
      console.log('==================================================\n');
      
      if (result.edge_confirmed !== undefined) {
        console.log(`📊 Test Date: ${result.test_date}`);
        console.log(`📈 Total Tests: ${result.total_tests}`);
        console.log(`\n🏆 RESULTS:`);
        console.log(`   PERMUTATION Wins: ${result.permutation_wins}`);
        console.log(`   Baseline Wins: ${result.baseline_wins}`);
        console.log(`   Ties: ${result.ties}`);
        
        console.log(`\n📈 PERFORMANCE:`);
        console.log(`   Avg Accuracy Improvement: ${result.avg_accuracy_improvement > 0 ? '+' : ''}${result.avg_accuracy_improvement}%`);
        console.log(`   Avg Quality Improvement: ${result.avg_quality_improvement > 0 ? '+' : ''}${result.avg_quality_improvement}%`);
        console.log(`   Avg Latency Overhead: ${result.avg_latency_overhead_ms}ms`);
        console.log(`   Avg Cost Overhead: $${result.avg_cost_overhead.toFixed(4)}`);
        
        console.log(`\n🔥 EDGE CONFIRMED: ${result.edge_confirmed ? 'YES ✅' : 'NO ❌'}`);
        
        console.log('\n==================================================');
        console.log('🎯 DETAILED RESULTS:');
        console.log('==================================================\n');
        
        result.results.forEach((test, idx) => {
          console.log(`\n${idx + 1}. ${test.query}`);
          console.log(`   Winner: ${test.winner.toUpperCase()}`);
          console.log(`   Accuracy Improvement: ${test.edge_metrics.accuracy_improvement > 0 ? '+' : ''}${test.edge_metrics.accuracy_improvement.toFixed(1)}%`);
          console.log(`   Quality Improvement: ${test.edge_metrics.quality_improvement > 0 ? '+' : ''}${test.edge_metrics.quality_improvement.toFixed(1)}%`);
          console.log(`   Latency Difference: +${test.edge_metrics.latency_difference_ms.toFixed(0)}ms`);
        });
        
        console.log('\n==================================================');
        console.log('✅ TEST COMPLETE!');
        console.log('==================================================\n');
        
      } else if (result.error) {
        console.log(`❌ ERROR: ${result.error}`);
        console.log(`   Details: ${result.details || 'No details'}`);
      } else {
        console.log('📄 Raw Response:');
        console.log(JSON.stringify(result, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('\n📄 Raw response:');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure the dev server is running:');
  console.log('   cd frontend && npm run dev');
});

req.end();

