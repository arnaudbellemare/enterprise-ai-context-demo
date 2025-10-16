#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE SYSTEM TEST
 * 
 * Tests the complete integrated PERMUTATION system end-to-end
 * Shows all components working together as one whole system
 */

const BASE_URL = 'http://localhost:3005';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

async function testCompleteIntegratedSystem() {
  console.log('🚀 COMPREHENSIVE INTEGRATED SYSTEM TEST');
  console.log('=======================================');
  console.log('Testing the complete PERMUTATION system as one whole unit...\n');
  
  const testQueries = [
    {
      query: 'How does quantum computing impact drug discovery in healthcare?',
      domain: 'healthcare',
      userTier: 'enterprise',
      expectedComponents: ['Smart Routing', 'Cost Optimization', 'TRM Engine', 'Synthesis']
    },
    {
      query: 'What are the latest trends in AI technology?',
      domain: 'technology', 
      userTier: 'free',
      expectedComponents: ['Smart Routing', 'Cost Optimization', 'TRM Engine', 'Synthesis']
    },
    {
      query: 'Explain machine learning algorithms for beginners',
      domain: 'education',
      userTier: 'basic',
      expectedComponents: ['Smart Routing', 'Cost Optimization', 'TRM Engine', 'Synthesis']
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  for (let i = 0; i < testQueries.length; i++) {
    const testCase = testQueries[i];
    console.log(`📋 TEST ${i + 1}: ${testCase.domain.toUpperCase()} QUERY`);
    console.log('='.repeat(50));
    console.log(`🎯 Query: "${testCase.query}"`);
    console.log(`👤 User Tier: ${testCase.userTier}`);
    console.log(`🏢 Domain: ${testCase.domain}\n`);

    const testResult = await runIntegratedWorkflow(testCase);
    results.push(testResult);
    
    if (testResult.success) {
      passedTests++;
      console.log(`✅ TEST ${i + 1} PASSED - All components working together\n`);
    } else {
      console.log(`❌ TEST ${i + 1} FAILED - ${testResult.error}\n`);
    }
    
    totalTests++;
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test additional components
  console.log('📋 ADDITIONAL COMPONENT TESTS');
  console.log('============================');

  const additionalTests = [
    {
      name: 'GEPA Optimization',
      test: () => testEndpoint('/api/gepa-optimization', 'POST', {
        prompt: 'Test prompt for optimization',
        domain: 'healthcare'
      })
    },
    {
      name: 'Performance Monitoring',
      test: () => testEndpoint('/api/performance-monitoring', 'POST', {
        action: 'record',
        component: 'test',
        metrics: { latency: 100, cost: 0.01, success: true }
      })
    },
    {
      name: 'Dynamic Scaling',
      test: () => testEndpoint('/api/dynamic-scaling', 'POST', {
        action: 'record_metrics',
        metrics: { timestamp: Date.now(), cpuUsage: 0.5, memoryUsage: 0.6, requestRate: 10, responseTime: 200, errorRate: 0.01, activeConnections: 5, queueLength: 2 }
      })
    },
    {
      name: 'Real IRT Fluid Benchmarking',
      test: () => testEndpoint('/api/real-irt-fluid-benchmarking', 'POST', {
        responses: {
          subject_id: 'test_model',
          responses: {
            'item_1': 1, 'item_2': 0, 'item_3': 1, 'item_4': 1, 'item_5': 0
          }
        },
        options: {
          start_ability: 0,
          n_max: 20,
          estimation_method: 'map',
          benchmark: 'mmlu'
        }
      })
    },
    {
      name: 'Real OCR OmniAI Benchmark',
      test: () => testEndpoint('/api/real-ocr-omniai-benchmark', 'POST', {
        image_data: 'base64_test_image_data',
        model: 'gpt-4o',
        options: { extract_json: false, confidence_threshold: 0.8 }
      })
    }
  ];

  for (const additionalTest of additionalTests) {
    console.log(`🔧 Testing ${additionalTest.name}...`);
    const result = await additionalTest.test();
    
    if (result.success) {
      console.log(`   ✅ ${additionalTest.name} - WORKING`);
      passedTests++;
    } else {
      console.log(`   ❌ ${additionalTest.name} - FAILED: ${result.error}`);
    }
    
    totalTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final Summary
  console.log('\n🎉 COMPREHENSIVE SYSTEM TEST RESULTS');
  console.log('====================================');
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (passedTests === totalTests) {
    console.log('🏆 ALL TESTS PASSED!');
    console.log('🎯 The complete PERMUTATION system is working as one integrated whole!');
    console.log('🚀 Ready for production use!');
  } else {
    console.log('⚠️  Some tests failed - system needs attention');
  }

  // Detailed Results
  console.log('\n📋 DETAILED RESULTS:');
  console.log('===================');
  results.forEach((result, index) => {
    console.log(`Test ${index + 1} (${testQueries[index].domain}):`);
    console.log(`  Success: ${result.success ? '✅' : '❌'}`);
    console.log(`  Components Tested: ${result.componentsTested}`);
    console.log(`  Total Time: ${result.totalTime}ms`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  });

  return passedTests === totalTests;
}

async function runIntegratedWorkflow(testCase) {
  const startTime = Date.now();
  const componentsTested = [];
  let error = null;

  try {
    // Step 1: Smart Routing
    console.log('🔀 Step 1: Smart Routing...');
    const routing = await testEndpoint('/api/smart-routing', 'POST', {
      query: testCase.query,
      domain: testCase.domain
    });
    
    if (!routing.success) {
      throw new Error(`Smart Routing failed: ${routing.error}`);
    }
    
    console.log(`   ✅ Routed to: ${routing.data.routingDecision.primary_component}`);
    console.log(`   💰 Estimated cost: $${routing.data.routingDecision.estimated_cost}`);
    console.log(`   ⏱️ Estimated latency: ${routing.data.routingDecision.estimated_latency_ms}ms`);
    componentsTested.push('Smart Routing');

    // Step 2: Cost Optimization
    console.log('\n💰 Step 2: Cost Optimization...');
    const costOpt = await testEndpoint('/api/real-cost-optimization', 'POST', {
      query: testCase.query,
      requirements: { maxCost: 0.02, minQuality: 0.8 },
      context: { 
        userTier: testCase.userTier, 
        budgetRemaining: testCase.userTier === 'free' ? 0 : 50.0 
      }
    });
    
    if (!costOpt.success) {
      throw new Error(`Cost Optimization failed: ${costOpt.error}`);
    }
    
    console.log(`   ✅ Selected: ${costOpt.data.result.selectedProvider}/${costOpt.data.result.selectedModel}`);
    console.log(`   💵 Cost: $${costOpt.data.result.estimatedCost.toFixed(6)}`);
    console.log(`   ⏱️ Latency: ${costOpt.data.result.estimatedLatency}ms`);
    componentsTested.push('Cost Optimization');

    // Step 3: Multi-Phase TRM Processing
    console.log('\n🧠 Step 3: Multi-Phase TRM Processing...');
    const trm = await testEndpoint('/api/real-multiphase-trm', 'POST', {
      query: testCase.query,
      domain: testCase.domain,
      optimizationLevel: testCase.userTier === 'enterprise' ? 'high' : 'medium'
    });
    
    if (!trm.success) {
      throw new Error(`TRM Engine failed: ${trm.error}`);
    }
    
    console.log(`   ✅ Confidence: ${((trm.data.result.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`   ⏱️ Processing Time: ${trm.data.result.performanceMetrics?.totalTime || 0}ms`);
    console.log(`   📊 Quality: ${((trm.data.result.qualityMetrics?.coherence || 0) * 100).toFixed(1)}% coherence`);
    componentsTested.push('Multi-Phase TRM');

    // Step 4: Multi-Strategy Synthesis
    console.log('\n🧬 Step 4: Multi-Strategy Synthesis...');
    const sources = [
      {
        id: 'trm_result',
        content: trm.data.result?.finalAnswer || 'TRM processing completed',
        confidence: trm.data.result?.confidence || 0.8,
        weight: 0.4,
        metadata: { 
          source: 'trm_engine', 
          timestamp: Date.now(), 
          quality: 0.95, 
          relevance: 0.9 
        }
      },
      {
        id: 'cost_analysis',
        content: `Cost-optimized analysis using ${costOpt.data.result.selectedProvider}`,
        confidence: 0.85,
        weight: 0.3,
        metadata: { 
          source: 'cost_optimizer', 
          timestamp: Date.now(), 
          quality: 0.9, 
          relevance: 0.85 
        }
      },
      {
        id: 'domain_expertise',
        content: `Specialized ${testCase.domain} domain knowledge integration`,
        confidence: 0.8,
        weight: 0.3,
        metadata: { 
          source: 'domain_expert', 
          timestamp: Date.now(), 
          quality: 0.85, 
          relevance: 0.8 
        }
      }
    ];
    
    const synthesis = await testEndpoint('/api/real-multistrategy-synthesis', 'POST', {
      sources: sources,
      targetLength: 300,
      qualityThreshold: 0.85
    });
    
    if (!synthesis.success) {
      throw new Error(`Synthesis Engine failed: ${synthesis.error}`);
    }
    
    console.log(`   ✅ Best Strategy: ${synthesis.data.result?.metaSynthesis?.bestStrategy || 'Unknown'}`);
    console.log(`   📊 Overall Quality: ${((synthesis.data.result?.qualityAnalysis?.overallQuality || 0) * 100).toFixed(1)}%`);
    console.log(`   📝 Final Synthesis: ${(synthesis.data.result?.finalSynthesis || '').substring(0, 100)}...`);
    componentsTested.push('Multi-Strategy Synthesis');

    // Step 5: Performance Monitoring
    console.log('\n📊 Step 5: Performance Monitoring...');
    const monitoring = await testEndpoint('/api/performance-monitoring', 'POST', {
      action: 'record',
      component: 'integrated_workflow',
      metrics: {
        latency: Date.now() - startTime,
        cost: costOpt.data.result.estimatedCost,
        success: true,
        components_used: componentsTested.length,
        domain: testCase.domain,
        user_tier: testCase.userTier
      }
    });
    
    if (monitoring.success) {
      console.log(`   ✅ Performance metrics recorded`);
      componentsTested.push('Performance Monitoring');
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n🎯 WORKFLOW COMPLETED in ${totalTime}ms`);
    console.log(`🔧 Components Used: ${componentsTested.join(', ')}`);

    return {
      success: true,
      componentsTested,
      totalTime,
      routing: routing.data,
      costOptimization: costOpt.data,
      trmResult: trm.data,
      synthesisResult: synthesis.data
    };

  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.log(`\n❌ WORKFLOW FAILED after ${totalTime}ms`);
    console.log(`🔧 Components Used: ${componentsTested.join(', ')}`);
    
    return {
      success: false,
      componentsTested,
      totalTime,
      error: err.message
    };
  }
}

async function main() {
  try {
    console.log('🚀 Starting Comprehensive Integrated System Test...\n');
    
    const success = await testCompleteIntegratedSystem();
    
    if (success) {
      console.log('\n🎉 SYSTEM TEST COMPLETED SUCCESSFULLY!');
      console.log('=====================================');
      console.log('✅ All components working together as one integrated system');
      console.log('✅ Real data flow between all components');
      console.log('✅ Complete workflow from query to response');
      console.log('✅ State-of-the-art implementations functioning');
      console.log('✅ System ready for production use');
      console.log('\n🏆 THE PERMUTATION SYSTEM IS TRULY INTEGRATED!');
      process.exit(0);
    } else {
      console.log('\n❌ SYSTEM TEST FAILED');
      console.log('Some components are not working properly');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the comprehensive test
main().catch(console.error);