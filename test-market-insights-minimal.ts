/**
 * MINIMAL Market Insights Test - No Heavy Imports
 * Tests only what we need without importing heavy dependencies
 */

console.log('Starting minimal test...\n');

// Test 1: Check Ollama
async function testOllama() {
  console.log('1. Testing Ollama connection...');
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    console.log(`   ✅ Ollama connected - ${data.models?.length || 0} models`);
    return true;
  } catch (error) {
    console.log(`   ❌ Ollama failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Test 2: Check Perplexity key
function testPerplexityKey() {
  console.log('2. Testing Perplexity API key...');
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    console.log('   ❌ PERPLEXITY_API_KEY not set');
    return false;
  }
  if (!key.startsWith('pplx-')) {
    console.log('   ⚠️  Key format looks wrong');
    return false;
  }
  console.log(`   ✅ Perplexity key found`);
  return true;
}

// Test 3: Simple LLM call without heavy imports
async function testSimpleLLM() {
  console.log('3. Testing simple LLM call...');
  
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [
          { role: 'user', content: 'Say "test" and nothing else.' }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 10
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.message?.content || '';
    console.log(`   ✅ LLM responded: ${content.substring(0, 50)}`);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.log(`   ❌ LLM call failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Test 4: Import market insights service (this might hang)
async function testImportService() {
  console.log('4. Testing market insights service import...');
  const startTime = Date.now();
  
  try {
    // Dynamic import with timeout
    const importPromise = import('./frontend/lib/market-insights/market-insights-service');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Import timeout after 10s')), 10000)
    );
    
    const module = await Promise.race([importPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (!module.marketInsightsService) {
      throw new Error('Service not exported');
    }
    
    console.log(`   ✅ Service imported in ${(duration / 1000).toFixed(1)}s`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Import failed after ${(duration / 1000).toFixed(1)}s: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Test 5: Generate insights (only if everything else works)
async function testGenerateInsights() {
  console.log('5. Testing market insights generation...');
  
  try {
    const { marketInsightsService } = await import('./frontend/lib/market-insights/market-insights-service');
    
    const config = {
      category: 'watches' as const,
      frequency: 'weekly' as const,
      includeItems: true,
      maxItems: 1,
    };
    
    const startTime = Date.now();
    
    // Add timeout
    const generatePromise = marketInsightsService.generateMarketInsights(config);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Generation timeout after 3 minutes')), 180000)
    );
    
    const insights = await Promise.race([generatePromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (!insights.title || !insights.marketOverview) {
      throw new Error('Invalid insights structure');
    }
    
    console.log(`   ✅ Generated insights in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Title: ${insights.title}`);
    console.log(`   Overview: ${insights.marketOverview.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.log(`   ❌ Generation failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   MINIMAL MARKET INSIGHTS TEST                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const results: boolean[] = [];
  
  results.push(await testOllama());
  results.push(testPerplexityKey());
  
  if (results[0]) { // Only test LLM if Ollama works
    results.push(await testSimpleLLM());
  } else {
    console.log('   ⏭️  Skipping LLM test (Ollama not available)');
    results.push(false);
  }
  
  results.push(await testImportService());
  
  if (results.every(r => r)) { // Only generate if everything works
    results.push(await testGenerateInsights());
  } else {
    console.log('   ⏭️  Skipping generation test (prerequisites failed)');
    results.push(false);
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   RESULTS                                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Tests passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run with overall timeout
const overallTimeout = setTimeout(() => {
  console.error('\n❌ Overall test timeout after 5 minutes');
  process.exit(1);
}, 300000);

runTests()
  .then(() => {
    clearTimeout(overallTimeout);
  })
  .catch(error => {
    clearTimeout(overallTimeout);
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });


