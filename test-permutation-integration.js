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
      console.log(`   📊 Response keys: ${Object.keys(result).join(', ')}`);
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

  // Test 1: Smart Routing
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

  // Test 2: TRM Engine
  const trm = await testEndpoint('/api/trm-engine', {
    query: 'Analyze quantum computing impact on financial markets',
    domain: 'finance',
    optimizationLevel: 'high',
    maxIterations: 3
  }, 'TRM Engine');

  // Test 3: GEPA Optimization
  const gepa = await testEndpoint('/api/gepa-optimization', {
    prompt: 'Analyze the latest trends in AI technology',
    domain: 'technology',
    iterations: 3
  }, 'GEPA Optimization');

  // Test 4: Performance Monitoring
  const monitoring = await testEndpoint('/api/performance-monitoring', {
    action: 'record',
    metrics: {
      component: 'TRM Engine',
      duration: 2500,
      cost: 0.001,
      quality: 0.95,
      tokens: 1500
    }
  }, 'Performance Monitoring');

  // Test 5: Dynamic Scaling
  const scaling = await testEndpoint('/api/dynamic-scaling', {
    action: 'record_metrics',
    metrics: {
      cpu_usage: 75,
      memory_usage: 60,
      response_time: 2500,
      error_rate: 0.02,
      throughput: 100
    }
  }, 'Dynamic Scaling');

  // Test 6: DSPy Reward Optimization
  const reward = await testEndpoint('/api/dspy-reward-optimization', {
    taskType: 'analysis',
    basePrompt: 'Analyze the impact of AI on business',
    rewardDimensions: ['accuracy', 'completeness', 'clarity'],
    sampleInput: 'What are the benefits of AI in business?',
    sampleOutput: 'AI provides numerous benefits including automation, insights, and efficiency.',
    iterations: 2
  }, 'DSPy Reward Optimization');

  // Test 7: Complete Chat Integration
  const chat = await testEndpoint('/api/chat/permutation', {
    message: 'Provide a comprehensive analysis of quantum computing impact on financial markets with real-time data'
  }, 'Complete Chat Integration');

  // Summary
  console.log('\n📊 INTEGRATION TEST SUMMARY');
  console.log('===========================');
  const tests = [
    { name: 'Smart Routing', result: routing },
    { name: 'TRM Engine', result: trm },
    { name: 'GEPA Optimization', result: gepa },
    { name: 'Performance Monitoring', result: monitoring },
    { name: 'Dynamic Scaling', result: scaling },
    { name: 'DSPy Reward Optimization', result: reward },
    { name: 'Complete Chat Integration', result: chat }
  ];

  tests.forEach(test => {
    const status = test.result.success ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${test.result.success ? 'WORKING' : 'FAILED'}`);
  });

  const successCount = tests.filter(t => t.result.success).length;
  const totalCount = tests.length;
  const successRate = (successCount / totalCount * 100).toFixed(1);
  
  console.log(`\n🎯 Overall Success Rate: ${successRate}% (${successCount}/${totalCount})`);
  
  if (successRate >= 85) {
    console.log('🎉 PERMUTATION SYSTEM IS FULLY INTEGRATED AND WORKING!');
  } else if (successRate >= 70) {
    console.log('⚠️ PERMUTATION SYSTEM IS MOSTLY WORKING - Minor issues detected');
  } else {
    console.log('🚨 PERMUTATION SYSTEM HAS SIGNIFICANT ISSUES - Needs attention');
  }
}

runTests().catch(console.error);
