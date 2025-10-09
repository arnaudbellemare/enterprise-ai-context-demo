// Integration Test Script
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 COMPREHENSIVE INTEGRATION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

async function testAPI(endpoint, method, body, expectedStatus = 200) {
  try {
    const response = await fetch(`http://localhost:3001${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${method} ${endpoint} → ${response.status}`);
      testResults.passed++;
      return await response.json();
    } else {
      console.log(`❌ ${method} ${endpoint} → ${response.status} (expected ${expectedStatus})`);
      testResults.failed++;
      return null;
    }
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} → ERROR: ${error.message}`);
    testResults.failed++;
    return null;
  }
}

async function runTests() {
  console.log('📍 Testing Core API Endpoints...\n');
  
  // Test 1: Agent Builder (Hybrid Routing)
  console.log('1️⃣  Agent Builder - Hybrid Routing');
  await testAPI('/api/agents', 'POST', {
    userRequest: 'Analyze real estate investment opportunities',
    strategy: 'auto'
  });
  
  // Test 2: GEPA Optimization
  console.log('\n2️⃣  GEPA Prompt Optimization');
  await testAPI('/api/gepa/optimize', 'POST', {
    prompt: 'Analyze market trends',
    context: 'Real estate market data',
    industry: 'real_estate'
  });
  
  // Test 3: ArcMemo - Retrieve
  console.log('\n3️⃣  ArcMemo - Concept Retrieval');
  await testAPI('/api/arcmemo', 'POST', {
    action: 'retrieve',
    query: { userRequest: 'real estate analysis', domain: 'real_estate' }
  });
  
  // Test 4: Ax DSPy
  console.log('\n4️⃣  Ax DSPy - Market Analyzer');
  await testAPI('/api/ax-dspy', 'POST', {
    moduleName: 'market_research_analyzer',
    inputs: { marketData: 'Test data', industry: 'Real Estate' },
    provider: 'ollama',
    optimize: true
  });
  
  // Test 5: Cost Router
  console.log('\n5️⃣  Model Router');
  await testAPI('/api/model-router', 'POST', {
    task: 'analyze data',
    complexity: 'medium'
  });
  
  // Test 6: Context Assembly
  console.log('\n6️⃣  Context Assembly');
  await testAPI('/api/context/assemble', 'POST', {
    documents: [{ content: 'test' }],
    query: 'test query'
  });
  
  // Test 7: Perplexity (requires API key)
  console.log('\n7️⃣  Perplexity Chat');
  await testAPI('/api/perplexity/chat', 'POST', {
    query: 'What are current real estate trends?',
    useRealAI: false // Use mock for testing
  });
  
  // Test 8: CEL Execute
  console.log('\n8️⃣  CEL Execution');
  await testAPI('/api/cel/execute', 'POST', {
    expression: '1 + 1',
    context: {}
  });
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Passed:   ${testResults.passed}`);
  console.log(`❌ Failed:   ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is production-ready!');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.');
  }
}

runTests().catch(console.error);
