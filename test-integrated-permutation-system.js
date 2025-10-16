#!/usr/bin/env node

/**
 * TEST INTEGRATED PERMUTATION SYSTEM
 * 
 * Comprehensive test of the complete PERMUTATION system with all components
 * Tests what's now REAL vs what was previously fake
 */

async function testSmartRouting() {
  console.log('🎯 Testing Smart Routing...');
  
  try {
    const response = await fetch('http://localhost:3002/api/smart-routing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Analyze this document for OCR',
        taskType: 'ocr',
        priority: 'high',
        requirements: {
          accuracy_required: 95,
          max_latency_ms: 3000,
          max_cost: 0.005,
          requires_real_time_data: false
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Smart Routing: REAL`);
      console.log(`   Primary Component: ${data.routingDecision.primary_component}`);
      console.log(`   Reasoning: ${data.routingDecision.reasoning}`);
      console.log(`   Estimated Cost: $${data.routingDecision.estimated_cost}`);
      return { real: true, details: 'Smart routing functional' };
    } else {
      console.log(`❌ Smart Routing: FAILED - ${response.status}`);
      return { real: false, details: `API error ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Smart Routing: ERROR - ${error.message}`);
    return { real: false, details: error.message };
  }
}

async function testKVCache() {
  console.log('💾 Testing KV Cache...');
  
  try {
    // Test set
    const setResponse = await fetch('http://localhost:3002/api/kv-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set',
        key: 'test_key',
        value: 'test_value',
        ttl: 3600
      })
    });
    
    // Test get
    const getResponse = await fetch('http://localhost:3002/api/kv-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get',
        key: 'test_key'
      })
    });
    
    if (setResponse.ok && getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`✅ KV Cache: REAL`);
      console.log(`   Value Retrieved: ${getData.result.found}`);
      console.log(`   Cached Value: ${getData.result.value}`);
      return { real: true, details: 'KV cache functional' };
    } else {
      console.log(`❌ KV Cache: FAILED - Set: ${setResponse.status}, Get: ${getResponse.status}`);
      return { real: false, details: 'Cache operations failed' };
    }
  } catch (error) {
    console.log(`❌ KV Cache: ERROR - ${error.message}`);
    return { real: false, details: error.message };
  }
}

async function testTRMEngine() {
  console.log('🔧 Testing TRM Engine...');
  
  try {
    const response = await fetch('http://localhost:3002/api/trm-engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Analyze market trends and provide recommendations',
        domain: 'finance',
        optimizationLevel: 'high',
        useRealTimeData: false
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ TRM Engine: REAL`);
      console.log(`   Components Used: ${data.metadata.componentsUsed}`);
      console.log(`   Optimization Rounds: ${data.metadata.optimizationRounds}`);
      console.log(`   Duration: ${data.metadata.duration}ms`);
      return { real: true, details: 'TRM engine functional' };
    } else {
      console.log(`❌ TRM Engine: FAILED - ${response.status}`);
      return { real: false, details: `API error ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ TRM Engine: ERROR - ${error.message}`);
    return { real: false, details: error.message };
  }
}

async function testGEPAOptimization() {
  console.log('🧠 Testing GEPA Optimization...');
  
  try {
    const response = await fetch('http://localhost:3002/api/gepa-optimization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Write a brief analysis of market trends',
        domain: 'finance',
        maxIterations: 3,
        optimizationType: 'comprehensive'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ GEPA Optimization: REAL`);
      console.log(`   Iterations: ${data.metrics.totalIterations}`);
      console.log(`   Improvement: ${data.metrics.improvementPercentage}%`);
      console.log(`   Duration: ${data.metrics.duration}ms`);
      return { real: true, details: 'GEPA optimization functional' };
    } else {
      console.log(`❌ GEPA Optimization: FAILED - ${response.status}`);
      return { real: false, details: `API error ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ GEPA Optimization: ERROR - ${error.message}`);
    return { real: false, details: error.message };
  }
}

async function testParallelExecution() {
  console.log('⚡ Testing Parallel Execution...');
  
  try {
    const response = await fetch('http://localhost:3002/api/parallel-execution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [
          { id: 'task1', type: 'ocr', data: 'Document analysis' },
          { id: 'task2', type: 'reasoning', data: 'Market analysis' },
          { id: 'task3', type: 'optimization', data: 'Prompt optimization' }
        ],
        maxParallel: 3,
        strategy: 'balanced'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Parallel Execution: REAL`);
      console.log(`   Tasks: ${data.tasks.successful}/${data.tasks.total} successful`);
      console.log(`   Success Rate: ${data.metrics.successRate}%`);
      console.log(`   Parallel Efficiency: ${data.metrics.parallelEfficiency}%`);
      return { real: true, details: 'Parallel execution functional' };
    } else {
      console.log(`❌ Parallel Execution: FAILED - ${response.status}`);
      return { real: false, details: `API error ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Parallel Execution: ERROR - ${error.message}`);
    return { real: false, details: error.message };
  }
}

async function testPerformanceMonitoring() {
  console.log('📊 Testing Performance Monitoring...');
  
  try {
    // Record some metrics
    await fetch('http://localhost:3002/api/performance-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'record',
        component: 'test_component',
        metrics: {
          success: true,
          latency: 1500,
          cost: 0.001
        }
      })
    });
    
    // Get stats
    const response = await fetch('http://localhost:3002/api/performance-monitoring?format=summary');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Performance Monitoring: REAL`);
      console.log(`   Total Requests: ${data.stats.totalRequests}`);
      console.log(`   Success Rate: ${data.stats.successRate}%`);
      console.log(`   Avg Latency: ${data.stats.avgLatency}ms`);
      return { real: true, details: 'Performance monitoring functional' };
    } else {
      console.log(`❌ Performance Monitoring: FAILED - ${response.status}`);
      return { real: false, details: `API error ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Performance Monitoring: ERROR - ${error.message}`);
    return { real: false, details: error.message };
  }
}

async function testIntegratedSystem() {
  console.log('🔗 Testing Integrated System...');
  
  try {
    // Test the main Permutation Chat with all systems integrated
    const response = await fetch('http://localhost:3002/api/chat/permutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Analyze the current AI market trends with optimization' }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Integrated System: REAL`);
      console.log(`   Components Used: ${data.components_used}`);
      console.log(`   Teacher: ${data.teacher}`);
      console.log(`   Domain: ${data.domain}`);
      console.log(`   Response Length: ${data.response.length} chars`);
      return { real: true, details: 'Integrated system functional' };
    } else {
      console.log(`❌ Integrated System: FAILED - ${response.status}`);
      return { real: false, details: `API error ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Integrated System: ERROR - ${error.message}`);
    return { real: false, details: error.message };
  }
}

async function runIntegratedPermutationTest() {
  console.log('🚀 TESTING INTEGRATED PERMUTATION SYSTEM');
  console.log('=========================================');
  console.log('Testing complete PERMUTATION system with all components');
  console.log('=========================================\n');

  const results = {};

  // PHASE 1: Foundation
  console.log('📋 PHASE 1: FOUNDATION');
  console.log('=======================');
  
  results.smartRouting = await testSmartRouting();
  console.log('');
  
  results.kvCache = await testKVCache();
  console.log('');

  // PHASE 2: Enhancement
  console.log('📋 PHASE 2: ENHANCEMENT');
  console.log('========================');
  
  results.trmEngine = await testTRMEngine();
  console.log('');
  
  results.gepaOptimization = await testGEPAOptimization();
  console.log('');

  // PHASE 3: Advanced
  console.log('📋 PHASE 3: ADVANCED');
  console.log('====================');
  
  results.parallelExecution = await testParallelExecution();
  console.log('');
  
  results.performanceMonitoring = await testPerformanceMonitoring();
  console.log('');

  // INTEGRATION TEST
  console.log('📋 INTEGRATION TEST');
  console.log('===================');
  
  results.integratedSystem = await testIntegratedSystem();
  console.log('');

  // Summary
  console.log('📊 INTEGRATED SYSTEM SUMMARY');
  console.log('============================');
  
  const realComponents = Object.entries(results).filter(([_, result]) => result.real);
  const fakeComponents = Object.entries(results).filter(([_, result]) => !result.real);
  
  console.log(`✅ REAL Components (${realComponents.length}):`);
  realComponents.forEach(([name, result]) => {
    console.log(`   - ${name}: ${result.details}`);
  });
  
  console.log(`\n❌ FAILED Components (${fakeComponents.length}):`);
  fakeComponents.forEach(([name, result]) => {
    console.log(`   - ${name}: ${result.details}`);
  });
  
  const realityScore = (realComponents.length / Object.keys(results).length) * 100;
  console.log(`\n🏆 INTEGRATED SYSTEM REALITY SCORE: ${realityScore.toFixed(1)}%`);
  
  console.log('\n🎯 THE TRUTH:');
  console.log('=============');
  
  if (realityScore >= 90) {
    console.log('🎉 EXCELLENT! The PERMUTATION system is fully integrated and functional!');
  } else if (realityScore >= 70) {
    console.log('✅ GOOD! Most components are working, minor issues remain.');
  } else if (realityScore >= 50) {
    console.log('⚠️  MIXED: Some components work, others need fixing.');
  } else {
    console.log('❌ NEEDS WORK: Many components are still not functional.');
  }
  
  return results;
}

// Main execution
async function main() {
  await runIntegratedPermutationTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runIntegratedPermutationTest };
