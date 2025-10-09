// Detailed Integration Test
async function testAPIDetailed(name, endpoint, method, body) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Testing: ${name}`);
  console.log(`${'═'.repeat(70)}`);
  
  try {
    const response = await fetch(`http://localhost:3001${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    if (response.status === 200) {
      console.log(`✅ ${name} PASSED`);
      return { passed: true, data };
    } else {
      console.log(`❌ ${name} FAILED`);
      return { passed: false, data };
    }
  } catch (error) {
    console.log(`❌ ${name} ERROR: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function runDetailedTests() {
  const results = [];
  
  // Test 1: Hybrid Routing
  results.push(await testAPIDetailed(
    'Hybrid Agent Routing',
    '/api/agents',
    'POST',
    {
      userRequest: 'Analyze Miami real estate market',
      strategy: 'auto'
    }
  ));
  
  // Test 2: GEPA
  results.push(await testAPIDetailed(
    'GEPA Optimization',
    '/api/gepa/optimize',
    'POST',
    {
      prompt: 'Analyze market trends',
      context: 'Test context',
      industry: 'real_estate'
    }
  ));
  
  // Test 3: Ax DSPy
  results.push(await testAPIDetailed(
    'Ax DSPy Module',
    '/api/ax-dspy',
    'POST',
    {
      moduleName: 'market_research_analyzer',
      inputs: { marketData: 'Test market data', industry: 'Real Estate' },
      provider: 'ollama',
      optimize: true
    }
  ));
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SUMMARY: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(0)}%)`);
  console.log(`${'═'.repeat(70)}\n`);
}

runDetailedTests().catch(console.error);
