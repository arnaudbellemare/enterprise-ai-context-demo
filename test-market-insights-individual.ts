/**
 * Individual Component Tests for Market Insights
 * Tests each piece separately to identify what's working and what's broken
 */

import { marketInsightsService } from './frontend/lib/market-insights/market-insights-service';
import { callPerplexityWithRateLimiting } from './frontend/lib/brain-skills/llm-helpers';

const TEST_TIMEOUT = 60000; // 60 seconds max per test

async function testWithTimeout<T>(name: string, fn: () => Promise<T>, timeoutMs: number = TEST_TIMEOUT): Promise<T> {
  console.log(`\n🧪 Testing: ${name}`);
  const startTime = Date.now();
  
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(`Test "${name}" timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    const duration = Date.now() - startTime;
    console.log(`✅ ${name} - PASSED (${(duration / 1000).toFixed(1)}s)`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${name} - FAILED (${(duration / 1000).toFixed(1)}s)`);
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.error(`   Error: ${String(error)}`);
    }
    throw error;
  }
}

async function testOllamaConnection() {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }
    
    const data = await response.json();
    const models = data.models || [];
    console.log(`   Found ${models.length} Ollama models`);
    if (models.length > 0) {
      console.log(`   Models: ${models.map((m: any) => m.name).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`Ollama not accessible at ${ollamaUrl}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testPerplexityKey() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    throw new Error('PERPLEXITY_API_KEY not set in environment');
  }
  if (!key.startsWith('pplx-')) {
    throw new Error('PERPLEXITY_API_KEY format looks invalid (should start with pplx-)');
  }
  console.log(`   Perplexity API key found (${key.substring(0, 10)}...)`);
  return true;
}

async function testSimpleLLMCall() {
  const messages = [
    {
      role: 'system' as const,
      content: 'You are a helpful assistant. Respond briefly.'
    },
    {
      role: 'user' as const,
      content: 'Say "test successful" and nothing else.'
    }
  ];
  
  const result = await callPerplexityWithRateLimiting(messages, {
    temperature: 0.7,
    maxTokens: 50,
    timeout: 30000
  });
  
  if (!result.content) {
    throw new Error('LLM call returned empty content');
  }
  
  if (result.provider === 'error') {
    throw new Error(`LLM call failed: ${result.content}`);
  }
  
  console.log(`   Provider: ${result.provider}`);
  console.log(`   Response: ${result.content.substring(0, 100)}...`);
  
  return result;
}

async function testMarketInsightsQueryBuilding() {
  const config = {
    category: 'watches' as const,
    frequency: 'weekly' as const,
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2,
    maxIndexAssets: 3
  };
  
  // Access private method via any cast (testing only)
  const service = marketInsightsService as any;
  const query = service.buildMarketInsightsQuery(config);
  
  if (!query || typeof query !== 'string') {
    throw new Error('Query building returned invalid result');
  }
  
  if (query.length < 100) {
    throw new Error('Query seems too short');
  }
  
  console.log(`   Query length: ${query.length} chars`);
  console.log(`   Query preview: ${query.substring(0, 150)}...`);
  
  return query;
}

async function testMarketInsightsGeneration() {
  const config = {
    category: 'watches' as const,
    frequency: 'weekly' as const,
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2,
    maxIndexAssets: 3
  };
  
  const insights = await marketInsightsService.generateMarketInsights(config);
  
  if (!insights.title) {
    throw new Error('Insights missing title');
  }
  
  if (!insights.marketOverview) {
    throw new Error('Insights missing market overview');
  }
  
  if (insights.marketOverview.length < 50) {
    throw new Error('Market overview seems too short');
  }
  
  console.log(`   Title: ${insights.title}`);
  console.log(`   Overview length: ${insights.marketOverview.length} chars`);
  console.log(`   Items: ${insights.specificItems?.length || 0}`);
  console.log(`   Index assets: ${insights.indexAssets?.length || 0}`);
  console.log(`   Has outlook: ${!!insights.futureOutlook}`);
  
  return insights;
}

async function testMarkdownFormatting() {
  const mockInsights = {
    title: 'Market Pulse: Test Market Update',
    marketOverview: 'This is a test market overview with some content to verify formatting works correctly.',
    specificItems: [
      {
        name: 'Test Item 1',
        description: 'Description for test item 1',
        marketCap: 1000000
      }
    ],
    indexAssets: [
      {
        name: 'Test Asset 1',
        marketCap: 2000000,
        description: 'Description for test asset',
        significance: 'Significant test asset'
      }
    ],
    futureOutlook: 'Test future outlook content',
    metadata: {
      category: 'watches' as const,
      frequency: 'weekly',
      generatedAt: new Date().toISOString(),
      dataSources: ['test'],
      confidence: 0.85
    }
  };
  
  const markdown = marketInsightsService.formatAsMarkdown(mockInsights);
  
  if (!markdown.includes('Market Pulse')) {
    throw new Error('Markdown missing title');
  }
  
  if (!markdown.includes('Test Item 1')) {
    throw new Error('Markdown missing items');
  }
  
  console.log(`   Markdown length: ${markdown.length} chars`);
  console.log(`   Markdown preview:\n${markdown.substring(0, 300)}...`);
  
  return markdown;
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   MARKET INSIGHTS INDIVIDUAL COMPONENT TESTS             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];
  
  // Test 1: Ollama Connection
  try {
    await testWithTimeout('Ollama Connection', testOllamaConnection, 10000);
    results.push({ name: 'Ollama Connection', passed: true });
  } catch (error) {
    results.push({ 
      name: 'Ollama Connection', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  // Test 2: Perplexity API Key
  try {
    await testWithTimeout('Perplexity API Key', testPerplexityKey, 1000);
    results.push({ name: 'Perplexity API Key', passed: true });
  } catch (error) {
    results.push({ 
      name: 'Perplexity API Key', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  // Test 3: Simple LLM Call
  try {
    await testWithTimeout('Simple LLM Call', testSimpleLLMCall, 60000);
    results.push({ name: 'Simple LLM Call', passed: true });
  } catch (error) {
    results.push({ 
      name: 'Simple LLM Call', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  // Test 4: Query Building
  try {
    await testWithTimeout('Market Insights Query Building', testMarketInsightsQueryBuilding, 5000);
    results.push({ name: 'Market Insights Query Building', passed: true });
  } catch (error) {
    results.push({ 
      name: 'Market Insights Query Building', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  // Test 5: Markdown Formatting
  try {
    await testWithTimeout('Markdown Formatting', testMarkdownFormatting, 5000);
    results.push({ name: 'Markdown Formatting', passed: true });
  } catch (error) {
    results.push({ 
      name: 'Markdown Formatting', 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
  
  // Test 6: Full Market Insights Generation (only if LLM works)
  const llmWorks = results.find(r => r.name === 'Simple LLM Call')?.passed;
  if (llmWorks) {
    try {
      await testWithTimeout('Full Market Insights Generation', testMarketInsightsGeneration, 180000);
      results.push({ name: 'Full Market Insights Generation', passed: true });
    } catch (error) {
      results.push({ 
        name: 'Full Market Insights Generation', 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  } else {
    console.log('\n⚠️  Skipping Full Market Insights Generation (LLM not working)');
    results.push({ name: 'Full Market Insights Generation', passed: false, error: 'Skipped - LLM not working' });
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}\n`);
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`);
      if (r.error) {
        console.log(`     ${r.error}`);
      }
    });
    console.log('');
  }
  
  // Detailed results
  console.log('Detailed Results:');
  results.forEach((r, idx) => {
    const status = r.passed ? '✅' : '❌';
    console.log(`  ${idx + 1}. ${status} ${r.name}`);
  });
  
  console.log('');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});


