// Comprehensive Feature Test
const BASE_URL = 'http://localhost:3000';

const tests = {
  passed: [],
  failed: [],
  warnings: []
};

async function test(name, fn) {
  try {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`🧪 Testing: ${name}`);
    console.log('─'.repeat(70));
    await fn();
    tests.passed.push(name);
    console.log(`✅ ${name} PASSED`);
  } catch (error) {
    tests.failed.push({ name, error: error.message });
    console.log(`❌ ${name} FAILED: ${error.message}`);
  }
}

async function testAPI(endpoint, body, expectedFields = []) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  console.log(`   Status: ${response.status}`);
  console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
  
  if (response.status !== 200) {
    throw new Error(`API returned ${response.status}: ${JSON.stringify(data).substring(0, 200)}`);
  }
  
  for (const field of expectedFields) {
    if (!(field in data)) {
      throw new Error(`Missing expected field: ${field}`);
    }
  }
  
  return data;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 1: HYBRID AGENT ROUTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await test('Hybrid Agent Routing - Keyword Match', async () => {
  const data = await testAPI('/api/agents', {
    userRequest: 'Analyze market trends',
    strategy: 'keyword'
  }, ['success', 'routing', 'workflow']);
  
  console.log(`   Routing method: ${data.routing.method}`);
  console.log(`   Workflow nodes: ${data.workflow.nodes.length}`);
  
  if (data.routing.method !== 'keyword') {
    throw new Error('Expected keyword routing');
  }
});

await test('Hybrid Agent Routing - LLM Fallback', async () => {
  const data = await testAPI('/api/agents', {
    userRequest: 'Help me understand quantum computing applications in finance',
    strategy: 'llm'
  }, ['success', 'routing', 'workflow']);
  
  console.log(`   Routing method: ${data.routing.method}`);
  console.log(`   Reasoning: ${data.routing.reasoning.substring(0, 100)}...`);
  
  if (data.routing.method !== 'llm') {
    throw new Error('Expected LLM routing');
  }
});

await test('Hybrid Agent Routing - Auto Strategy', async () => {
  const data = await testAPI('/api/agents', {
    userRequest: 'Create investment analysis workflow',
    strategy: 'auto'
  }, ['success', 'routing', 'workflow']);
  
  console.log(`   Auto selected: ${data.routing.method}`);
  console.log(`   Confidence: ${data.routing.confidence}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 2: GEPA OPTIMIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await test('GEPA Prompt Optimization', async () => {
  const data = await testAPI('/api/gepa/optimize', {
    query: 'Analyze real estate market trends',
    context: 'Miami luxury real estate market data from 2024',
    industry: 'real_estate',
    useRealGEPA: false
  }, ['optimizedPrompt']);
  
  console.log(`   Original: "Analyze real estate market trends"`);
  console.log(`   Optimized: "${data.optimizedPrompt.substring(0, 80)}..."`);
  
  if (data.optimizedPrompt === 'Analyze real estate market trends') {
    throw new Error('GEPA did not modify the prompt');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 3: ARCMEMO LEARNING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await test('ArcMemo - Concept Retrieval', async () => {
  const data = await testAPI('/api/arcmemo', {
    action: 'retrieve',
    query: {
      userRequest: 'real estate investment analysis',
      domain: 'real_estate'
    }
  }, ['success', 'concepts']);
  
  console.log(`   Retrieved concepts: ${data.concepts.length}`);
  if (data.concepts.length > 0) {
    console.log(`   Sample concept: "${data.concepts[0].concept.substring(0, 60)}..."`);
  }
});

await test('ArcMemo - Concept Abstraction', async () => {
  const data = await testAPI('/api/arcmemo', {
    action: 'abstract',
    workflow: {
      name: 'Test Real Estate Workflow',
      domain: 'real_estate',
      nodes: [{ id: '1', label: 'Market Research', role: 'Researcher' }],
      results: { '1': 'Miami real estate market is showing growth in Q4 2024' },
      userQuery: 'Analyze Miami real estate',
      success: true
    }
  }, ['success', 'concepts']);
  
  console.log(`   Abstracted concepts: ${data.concepts.length}`);
  if (data.concepts.length > 0) {
    console.log(`   New concept: "${data.concepts[0].concept}"`);
    console.log(`   Abstraction level: ${data.concepts[0].abstractionLevel}`);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 4: AX DSPY MODULES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await test('Ax DSPy - Market Research Analyzer', async () => {
  const data = await testAPI('/api/ax-dspy', {
    moduleName: 'market_research_analyzer',
    inputs: {
      marketData: 'Miami luxury real estate showing 15% YoY growth in Q4 2024',
      industry: 'Real Estate'
    },
    provider: 'ollama',
    optimize: true
  }, ['success']);
  
  console.log(`   Module: ${data.moduleName || 'unknown'}`);
  console.log(`   Success: ${data.success}`);
  if (data.outputs) {
    console.log(`   Output keys: ${Object.keys(data.outputs).join(', ')}`);
  }
});

await test('Ax DSPy - Real Estate Agent', async () => {
  const data = await testAPI('/api/ax-dspy', {
    moduleName: 'real_estate_agent',
    inputs: {
      propertyData: '$2M condo, 2000 sqft, waterfront, Miami Beach',
      location: 'Miami Beach',
      investmentType: 'buy'
    },
    provider: 'ollama',
    optimize: false
  }, ['success']);
  
  console.log(`   Success: ${data.success}`);
});

await test('Ax DSPy - Financial Analyst', async () => {
  const data = await testAPI('/api/ax-dspy', {
    moduleName: 'financial_analyst',
    inputs: {
      financialData: 'Revenue: $1M, Expenses: $600K, Net: $400K',
      analysisType: 'profitability'
    },
    provider: 'ollama',
    optimize: false
  }, ['success']);
  
  console.log(`   Success: ${data.success}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 5: COST OPTIMIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await test('Model Router - Task Analysis', async () => {
  const data = await testAPI('/api/model-router', {
    task: 'Analyze financial statements and provide investment recommendations',
    complexity: 'high',
    requiresWebSearch: false
  });
  
  if (data.selectedModel) {
    console.log(`   Selected model: ${data.selectedModel.name}`);
    console.log(`   Cost tier: ${data.selectedModel.tier}`);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 6: OTHER INTEGRATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
await test('CEL Expression Execution', async () => {
  const data = await testAPI('/api/cel/execute', {
    expression: '2 + 2',
    context: {}
  }, ['result']);
  
  console.log(`   Expression: 2 + 2`);
  console.log(`   Result: ${data.result}`);
  
  if (data.result !== 4) {
    throw new Error(`Expected 4, got ${data.result}`);
  }
});

await test('Context Assembly', async () => {
  const data = await testAPI('/api/context/assemble', {
    documents: [
      { content: 'Miami real estate market data' },
      { content: 'Investment opportunity analysis' }
    ],
    query: 'Analyze investment opportunities'
  });
  
  console.log(`   Assembled context length: ${data.context?.length || 0}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINAL SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n' + '═'.repeat(70));
console.log('📊 COMPREHENSIVE TEST RESULTS');
console.log('═'.repeat(70));
console.log(`✅ Passed:  ${tests.passed.length}`);
console.log(`❌ Failed:  ${tests.failed.length}`);
console.log(`⚠️  Warnings: ${tests.warnings.length}`);

if (tests.passed.length > 0) {
  console.log('\n✅ Passing Tests:');
  tests.passed.forEach(t => console.log(`   • ${t}`));
}

if (tests.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  tests.failed.forEach(t => console.log(`   • ${t.name}: ${t.error}`));
}

const total = tests.passed.length + tests.failed.length;
const successRate = (tests.passed.length / total * 100).toFixed(1);

console.log(`\n📈 Success Rate: ${successRate}%`);
console.log('═'.repeat(70));

if (tests.failed.length === 0) {
  console.log('\n🎉 ALL TESTS PASSED! System is production-ready!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${tests.failed.length} test(s) need attention.\n`);
  process.exit(1);
}
