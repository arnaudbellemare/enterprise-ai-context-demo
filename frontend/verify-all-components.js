#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

async function testComponent(endpoint, data, description) {
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

async function runComprehensiveTests() {
  console.log('🚀 COMPREHENSIVE PERMUTATION SYSTEM VERIFICATION');
  console.log('================================================');

  // Test all 8 core components
  const teacherStudent = await testComponent('/api/real-cost-optimization', {
    query: 'Analyze quantum computing impact',
    context: { userTier: 'enterprise' },
    requirements: { minQuality: 0.9 }
  }, 'Teacher-Student Pattern (Cost Optimization)');

  const trm = await testComponent('/api/real-multiphase-trm', {
    query: 'Analyze AI trends',
    domain: 'technology',
    maxIterations: 2
  }, 'Multi-Phase TRM Engine');

  const synthesis = await testComponent('/api/real-multistrategy-synthesis', {
    sources: ['AI transforms business', 'ML improves efficiency'],
    strategy: 'hierarchical',
    domain: 'technology'
  }, 'Multi-Strategy Synthesis');

  const gepa = await testComponent('/api/gepa-optimization', {
    prompt: 'Analyze AI impact',
    domain: 'technology',
    iterations: 2
  }, 'GEPA Optimization');

  const routing = await testComponent('/api/smart-routing', {
    query: 'Comprehensive quantum analysis',
    taskType: 'analysis',
    priority: 'high'
  }, 'Smart Routing');

  const monitoring = await testComponent('/api/performance-monitoring', {
    action: 'record',
    metrics: { component: 'TRM', duration: 2000, cost: 0.001 }
  }, 'Performance Monitoring');

  const scaling = await testComponent('/api/dynamic-scaling', {
    action: 'record_metrics',
    metrics: { cpu_usage: 70, memory_usage: 60 }
  }, 'Dynamic Scaling');

  const reward = await testComponent('/api/dspy-reward-optimization', {
    taskType: 'analysis',
    basePrompt: 'Analyze AI impact',
    rewardDimensions: ['accuracy', 'completeness'],
    sampleInput: 'What are AI benefits?',
    sampleOutput: 'AI provides automation and insights.',
    iterations: 2
  }, 'DSPy Reward Optimization');

  const integration = await testComponent('/api/chat/permutation', {
    message: 'Comprehensive quantum computing analysis'
  }, 'Complete Integration');

  // Summary
  console.log('\n📊 VERIFICATION RESULTS');
  console.log('========================');
  
  const tests = [
    { name: 'Teacher-Student Pattern', result: teacherStudent },
    { name: 'Multi-Phase TRM', result: trm },
    { name: 'Multi-Strategy Synthesis', result: synthesis },
    { name: 'GEPA Optimization', result: gepa },
    { name: 'Smart Routing', result: routing },
    { name: 'Performance Monitoring', result: monitoring },
    { name: 'Dynamic Scaling', result: scaling },
    { name: 'DSPy Reward Optimization', result: reward },
    { name: 'Complete Integration', result: integration }
  ];

  tests.forEach(test => {
    const status = test.result.success ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${test.result.success ? 'WORKING' : 'FAILED'}`);
  });

  const successCount = tests.filter(t => t.result.success).length;
  const successRate = (successCount / tests.length * 100).toFixed(1);
  
  console.log(`\n🎯 Success Rate: ${successRate}% (${successCount}/${tests.length})`);
  
  if (successRate >= 90) {
    console.log('\n🎉 ALL PERMUTATION COMPONENTS ARE TRULY WORKING!');
  } else if (successRate >= 70) {
    console.log('\n⚠️ MOST COMPONENTS WORKING - Some issues detected');
  } else {
    console.log('\n🚨 SIGNIFICANT ISSUES DETECTED');
  }
}

runComprehensiveTests().catch(console.error);
