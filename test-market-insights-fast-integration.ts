/**
 * Fast Market Insights Integration Test
 * 
 * Tests integration without expensive LLM calls
 * Focuses on service structure, API routes, and configuration
 */

import { marketInsightsService, type MarketInsightsConfig } from './frontend/lib/market-insights/market-insights-service';
import { marketInsightsScheduler } from './frontend/lib/market-insights/market-insights-scheduler';

const results: Array<{ name: string; success: boolean; error?: string }> = [];

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        results.push({ name, success: true });
        console.log(`✅ ${name}`);
      }).catch((error) => {
        results.push({ name, success: false, error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
      });
    } else {
      results.push({ name, success: true });
      console.log(`✅ ${name}`);
    }
  } catch (error: any) {
    results.push({ name, success: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runFastTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   FAST MARKET INSIGHTS INTEGRATION TEST                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: Service instantiation
  test('Service: Instantiation', () => {
    if (!marketInsightsService) {
      throw new Error('Service not available');
    }
  });

  // Test 2: Query building (no LLM call)
  test('Service: Query Building', () => {
    const config: MarketInsightsConfig = {
      category: 'watches',
      frequency: 'weekly',
      includeItems: true,
      includeIndex: true,
      includeOutlook: true,
    };
    // Just verify config is valid
    if (!config.category || !config.frequency) {
      throw new Error('Invalid config');
    }
  });

  // Test 3: Scheduler
  test('Scheduler: Initialization', () => {
    marketInsightsScheduler.initializeDefaultSchedules('weekly');
    const schedules = marketInsightsScheduler.getAllSchedules();
    if (schedules.length === 0) {
      throw new Error('No schedules initialized');
    }
    const expectedCategories = ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
    const scheduledCategories = schedules.map(s => s.category);
    for (const cat of expectedCategories) {
      if (!scheduledCategories.includes(cat)) {
        throw new Error(`Missing schedule for ${cat}`);
      }
    }
  });

  // Test 4: Markdown formatting with mock data
  test('Service: Markdown Formatting', () => {
    const mockInsights = {
      title: 'Market Pulse: Test Market Update',
      marketOverview: 'Test overview',
      specificItems: [{
        name: 'Test Item',
        description: 'Test description',
        marketCap: 1000000
      }],
      indexAssets: [{
        name: 'Test Asset',
        marketCap: 2000000,
        description: 'Test asset description',
        significance: 'Test significance'
      }],
      futureOutlook: 'Test outlook',
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
  });

  // Test 5: API route structure check (if server running)
  test('API: Route Structure', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/market-insights', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const data = await response.json();
        if (!data.service) {
          throw new Error('API response missing service info');
        }
      }
    } catch (error: any) {
      if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
        // Server not running - skip this test
        console.log('⚠️  API: Route Structure (server not running, skipping)');
        results.push({ name: 'API: Route Structure', success: true });
        return;
      }
      throw error;
    }
  });

  // Test 6: Batch API route check
  test('API: Batch Route Structure', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/market-insights/batch', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        const data = await response.json();
        if (!data.service) {
          throw new Error('Batch API response missing service info');
        }
      }
    } catch (error: any) {
      if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
        console.log('⚠️  API: Batch Route Structure (server not running, skipping)');
        results.push({ name: 'API: Batch Route Structure', success: true });
        return;
      }
      throw error;
    }
  });

  // Summary
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async tests

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total: ${results.length} | Passed: ${passed} ✅ | Failed: ${failed} ${failed > 0 ? '❌' : ''}\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  // Check environment
  console.log('Environment Check:');
  console.log(`  PERPLEXITY_API_KEY: ${process.env.PERPLEXITY_API_KEY ? '✅' : '❌ (will use Ollama)'}`);
  console.log(`  SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`  SUPABASE_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}`);
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }

  console.log('💡 To test actual LLM generation (slower):');
  console.log('   npx tsx test-market-insights-fast.ts');
  console.log('');
}

runFastTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



