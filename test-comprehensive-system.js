#!/usr/bin/env node

/**
 * 🔥 COMPREHENSIVE SYSTEM TEST
 * Tests ALL 11 components to verify they're actually working
 */

const testQueries = [
  {
    query: "What's the current Bitcoin price and should I invest?",
    domain: "crypto",
    expectedComponents: ["domain_detection", "teacher_model", "multi_query", "irt", "lora", "synthesis"]
  },
  {
    query: "Calculate 15% ROI on $10,000 investment over 3 years",
    domain: "financial", 
    expectedComponents: ["domain_detection", "irt", "swirl", "synthesis"]
  },
  {
    query: "What are the latest trends in AI and machine learning?",
    domain: "general",
    expectedComponents: ["teacher_model", "multi_query", "reasoning_bank", "synthesis"]
  }
];

async function testComponent(componentName, testFunction) {
  console.log(`\n🧪 Testing ${componentName}...`);
  try {
    const start = Date.now();
    const result = await testFunction();
    const duration = Date.now() - start;
    
    if (result && result !== null && result !== undefined) {
      console.log(`✅ ${componentName}: WORKING (${duration}ms)`);
      return { component: componentName, status: 'working', duration, result };
    } else {
      console.log(`❌ ${componentName}: FAILED - No result`);
      return { component: componentName, status: 'failed', duration, error: 'No result' };
    }
  } catch (error) {
    console.log(`❌ ${componentName}: ERROR - ${error.message}`);
    return { component: componentName, status: 'error', duration: 0, error: error.message };
  }
}

async function testDomainDetection() {
  const { detectDomain } = await import('./frontend/lib/domain-detector.js');
  const result = await detectDomain("Bitcoin price analysis");
  return result === 'crypto';
}

async function testIRT() {
  const { calculateIRTWithDetails } = await import('./frontend/lib/irt-calculator.js');
  const result = await calculateIRTWithDetails("Complex financial calculation", "financial");
  return result && result.difficulty > 0 && result.expectedAccuracy > 0;
}

async function testLoRA() {
  const { getLoRAParameters } = await import('./frontend/lib/lora-parameters.js');
  const result = await getLoRAParameters("Bitcoin analysis");
  return result && result.rank && result.alpha && result.domain_detected;
}

async function testMultiQuery() {
  const { createMultiQueryExpansion } = await import('./frontend/lib/multi-query-expansion.js');
  const mqe = createMultiQueryExpansion();
  const result = await mqe.expandQuery("Bitcoin price");
  return result && result.length > 5;
}

async function testSWiRL() {
  const { createSWiRLDecomposer } = await import('./frontend/lib/swirl-decomposer.js');
  const swirl = createSWiRLDecomposer();
  const result = await swirl.decompose("Calculate ROI");
  return result && result.length > 0;
}

async function testTeacherModel() {
  // Test if Perplexity API is configured
  const response = await fetch('http://localhost:3000/api/chat/permutation-streaming', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      messages: [{ role: 'user', content: 'What is Bitcoin?' }]
    })
  });
  
  if (response.ok) {
    const reader = response.body.getReader();
    let hasData = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      hasData = true;
      break; // Just check if we get any data
    }
    return hasData;
  }
  return false;
}

async function testKVCache() {
  const { getAdvancedCache } = await import('./frontend/lib/advanced-cache-system.js');
  const cache = getAdvancedCache();
  
  // Test set/get
  await cache.set('test_key', 'test_value', 60);
  const result = await cache.get('test_key');
  return result === 'test_value';
}

async function testACEFramework() {
  const { ACEFramework } = await import('./frontend/lib/ace-framework.js');
  const { ACELLMClient } = await import('./frontend/lib/ace-llm-client.js');
  
  const llmClient = new ACELLMClient();
  const ace = new ACEFramework(llmClient, { bullets: [], sections: {}, stats: { total_bullets: 0, helpful_bullets: 0, harmful_bullets: 0, last_updated: new Date() } });
  
  const result = await ace.processQuery("Test query");
  return result && result.trace && result.reflection;
}

async function testDSPyOptimization() {
  const { getAdaptivePromptSystem } = await import('./frontend/lib/adaptive-prompt-system.js');
  const adaptivePrompts = getAdaptivePromptSystem();
  
  const result = await adaptivePrompts.getAdaptivePrompt("Test query", {
    task_type: 'analytical',
    difficulty: 0.7,
    domain: 'general',
    previous_attempts: 0
  });
  
  return result && result.template_used && result.adapted_prompt;
}

async function testTRM() {
  const { createTRM } = await import('./frontend/lib/trm.js');
  const trm = createTRM();
  
  const result = await trm.processQuery("Test query", [
    { step: 1, action: 'analyze', tool: 'parse' },
    { step: 2, action: 'synthesize', tool: 'generate' }
  ]);
  
  return result && result.answer && result.iterations > 0;
}

async function testReasoningBank() {
  const { ReasoningBank } = await import('./frontend/lib/reasoning-bank.js');
  const bank = new ReasoningBank();
  
  const result = await bank.retrieveSimilar("Test query", "general");
  return Array.isArray(result);
}

async function testSynthesisAgent() {
  const { SynthesisAgent } = await import('./frontend/lib/synthesis-agent.js');
  const agent = new SynthesisAgent();
  
  const result = await agent.synthesize({
    teacherData: { text: "Teacher response" },
    studentData: { text: "Student response" },
    context: { domain: "general" }
  });
  
  return result && result.synthesis && result.confidence > 0;
}

async function runComprehensiveTest() {
  console.log('🔥 ===============================================');
  console.log('🔥 COMPREHENSIVE SYSTEM TEST - ALL 11 COMPONENTS');
  console.log('🔥 ===============================================\n');

  const tests = [
    { name: 'Domain Detection', test: testDomainDetection },
    { name: 'IRT Calculator', test: testIRT },
    { name: 'LoRA Parameters', test: testLoRA },
    { name: 'Multi-Query Expansion', test: testMultiQuery },
    { name: 'SWiRL Decomposition', test: testSWiRL },
    { name: 'Teacher Model (Perplexity)', test: testTeacherModel },
    { name: 'KV Cache', test: testKVCache },
    { name: 'ACE Framework', test: testACEFramework },
    { name: 'DSPy Optimization', test: testDSPyOptimization },
    { name: 'TRM (Tiny Recursive Model)', test: testTRM },
    { name: 'ReasoningBank', test: testReasoningBank },
    { name: 'Synthesis Agent', test: testSynthesisAgent }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testComponent(test.name, test.test);
    results.push(result);
  }

  // Summary
  console.log('\n📊 ===============================================');
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('📊 ===============================================');
  
  const working = results.filter(r => r.status === 'working').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`\n✅ Working: ${working}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`🚨 Errors: ${errors}/${results.length}`);
  
  if (failed > 0 || errors > 0) {
    console.log('\n🚨 FAILED/ERROR COMPONENTS:');
    results.filter(r => r.status !== 'working').forEach(r => {
      console.log(`   ${r.component}: ${r.status} - ${r.error || 'No result'}`);
    });
  }
  
  console.log('\n🎯 SYSTEM STATUS:');
  if (working >= 10) {
    console.log('🔥 EXCELLENT - System is well-built and leveraging all tech stack!');
  } else if (working >= 7) {
    console.log('⚠️ GOOD - Most components working, some issues to fix');
  } else {
    console.log('❌ POOR - System needs significant work to be production-ready');
  }
  
  return results;
}

// Run the test
runComprehensiveTest().catch(console.error);
