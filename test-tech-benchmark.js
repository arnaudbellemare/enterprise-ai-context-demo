#!/usr/bin/env node

/**
 * Test Tech Stack Benchmark API
 * Run with: node test-tech-benchmark.js
 */

const http = require('http');

console.log('🧪 Testing Tech Stack Benchmark API...\n');

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/benchmark/tech-stack',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`✅ Response Status: ${res.statusCode}\n`);
    
    try {
      const result = JSON.parse(data);
      
      console.log('📊 BENCHMARK RESULTS:\n');
      console.log('=' .repeat(80));
      
      // Display results
      if (result.results) {
        console.log('\n🎯 COMPONENT SCORES:\n');
        result.results
          .sort((a, b) => b.overall_score - a.overall_score)
          .forEach((comp, idx) => {
            const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
            console.log(`${emoji} ${comp.component}`);
            console.log(`   Overall Score: ${comp.overall_score.toFixed(2)}`);
            console.log(`   OCR: ${comp.ocr_accuracy}% | IRT: ${(comp.irt_score * 100).toFixed(1)}% | Accuracy: ${comp.accuracy}%`);
            console.log(`   Latency: ${comp.latency_ms.toFixed(2)}ms | Cost: $${comp.cost.toFixed(4)}`);
            console.log('');
          });
      }
      
      // Display summary
      if (result.summary) {
        console.log('=' .repeat(80));
        console.log('\n🏆 BEST PERFORMERS:\n');
        console.log(`   Best Overall: ${result.summary.best_overall}`);
        console.log(`   Best OCR: ${result.summary.best_ocr}`);
        console.log(`   Best IRT: ${result.summary.best_irt}`);
        console.log(`   Best Optimization: ${result.summary.best_optimization}`);
        console.log(`   Best Accuracy: ${result.summary.best_accuracy}`);
        console.log(`   Best Latency: ${result.summary.best_latency}`);
        console.log('');
      }
      
      // Check for zeros
      const hasZeros = result.results && result.results.some(r => r.overall_score === 0);
      if (hasZeros) {
        console.log('⚠️  WARNING: Some components still have 0.00 scores!');
        const zeroComponents = result.results.filter(r => r.overall_score === 0);
        zeroComponents.forEach(comp => {
          console.log(`   - ${comp.component}`);
        });
      } else {
        console.log('✅ SUCCESS: All components have real scores!');
      }
      
      console.log('\n' + '='.repeat(80));
      
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure the dev server is running on port 3005:');
  console.log('   cd frontend && npm run dev');
});

req.end();

