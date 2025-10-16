#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, data, description) {
  try {
    console.log(`\n🧪 Testing ${description}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ ${description} - SUCCESS`);
      return { success: true, result };
    } else {
      console.log(`   ❌ ${description} - FAILED (${response.status})`);
      return { success: false, error: response.status };
    }
  } catch (error) {
    console.log(`   ❌ ${description} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 PERMUTATION SYSTEM INTEGRATION TEST');
  console.log('=====================================');

  // Test Smart Routing
  const routing = await testEndpoint('/api/smart-routing', {
    query: 'Analyze quantum computing impact on financial markets',
    taskType: 'analysis',
    priority: 'high',
    requirements: {
      accuracy_required: 95,
      requires_real_time_data: true,
      max_latency_ms: 30000,
      max_cost: 0.05
    }
  }, 'Smart Routing');

  // Test TRM Engine
  const trm = await testEndpoint('/api/trm-engine', {
    query: 'Analyze quantum computing impact on financial markets',
    domain: 'finance',
    optimizationLevel: 'high',
    maxIterations: 2
  }, 'TRM Engine');

  // Test Complete Chat Integration
  const chat = await testEndpoint('/api/chat/permutation', {
    message: 'Provide a comprehensive analysis of quantum computing impact on financial markets'
  }, 'Complete Chat Integration');

  // Summary
  console.log('\n📊 INTEGRATION TEST SUMMARY');
  console.log('===========================');
  const tests = [
    { name: 'Smart Routing', result: routing },
    { name: 'TRM Engine', result: trm },
    { name: 'Complete Chat Integration', result: chat }
  ];

  tests.forEach(test => {
    const status = test.result.success ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${test.result.success ? 'WORKING' : 'FAILED'}`);
  });

  const successCount = tests.filter(t => t.result.success).length;
  console.log(`\n🎯 Success Rate: ${(successCount / tests.length * 100).toFixed(1)}% (${successCount}/${tests.length})`);
}

runTests().catch(console.error);
