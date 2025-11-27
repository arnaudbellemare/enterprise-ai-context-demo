/**
 * Full Market Insights Integration Test
 * 
 * Tests complete market insights integration:
 * 1. Service layer (direct calls)
 * 2. All categories (watches, cars, jewelry, sports, nfts)
 * 3. Batch generation
 * 4. OODA loop integration
 * 5. API routes (if server running)
 */

import { marketInsightsService, type MarketInsightsConfig } from './frontend/lib/market-insights/market-insights-service';
import { generateMarketInsightsWithOODA } from './frontend/lib/market-insights/ooda-market-insights';
import { marketInsightsScheduler } from './frontend/lib/market-insights/market-insights-scheduler';

const API_BASE_URL = 'http://localhost:3000';
const TEST_API_ROUTES = false; // Set to true if server is running

/**
 * Check environment configuration
 */
function checkEnvironment(): { canRun: boolean; issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check Supabase (required)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL not set');
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL in .env.local');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  // Check LLM providers (at least one needed)
  const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
  const hasOllama = process.env.OLLAMA_URL || process.env.OLLAMA_HOST || true; // Ollama always available as fallback
  
  if (!hasPerplexity) {
    recommendations.push('PERPLEXITY_API_KEY not set - will use Ollama fallback (slower)');
    recommendations.push('To use Perplexity: Set PERPLEXITY_API_KEY=pplx-... in .env.local');
    recommendations.push('To use Ollama: Ensure Ollama is running (ollama serve)');
  }

  const canRun = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { canRun, issues, recommendations };
}

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

/**
 * Test API route via HTTP
 */
async function testAPIRoute(endpoint: string, method: string = 'POST', body?: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch failed')) {
      throw new Error('Server not running. Start with: npm run dev');
    }
    throw error;
  }
}

/**
 * Run a test and record results
 */
async function runTest(name: string, testFn: () => Promise<any>): Promise<void> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${name}`);
  console.log('='.repeat(60));

  try {
    const data = await testFn();
    const duration = Date.now() - startTime;
    
    results.push({
      name,
      success: true,
      duration,
      data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : String(data).substring(0, 200)
    });

    console.log(`✅ PASSED (${(duration / 1000).toFixed(1)}s)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    results.push({
      name,
      success: false,
      duration,
      error: errorMessage
    });

    console.log(`❌ FAILED (${(duration / 1000).toFixed(1)}s): ${errorMessage}`);
  }
}

/**
 * Test 1: Service - Single category (watches)
 */
async function testServiceSingleCategory() {
  const insights = await marketInsightsService.generateMarketInsights({
    category: 'watches',
    frequency: 'weekly',
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2,
    maxIndexAssets: 3,
  });

  if (!insights.title || !insights.marketOverview) {
    throw new Error('Missing required fields in insights');
  }

  console.log(`   Title: ${insights.title}`);
  console.log(`   Items: ${insights.specificItems?.length || 0}`);
  console.log(`   Index Assets: ${insights.indexAssets?.length || 0}`);
  console.log(`   Has Outlook: ${!!insights.futureOutlook}`);

  return insights;
}

/**
 * Test 2: Service - All categories sequentially
 */
async function testServiceAllCategories() {
  const categories: Array<'watches' | 'cars' | 'jewelry' | 'sports' | 'nfts'> = 
    ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
  
  const allInsights = [];

  for (const category of categories) {
    console.log(`   Generating insights for ${category}...`);
    const insights = await marketInsightsService.generateMarketInsights({
      category,
      frequency: 'weekly',
      includeItems: true,
      maxItems: 1, // Reduced for speed
    });

    allInsights.push({
      category,
      title: insights.title,
      hasItems: !!insights.specificItems?.length,
    });
  }

  if (allInsights.length !== categories.length) {
    throw new Error(`Expected ${categories.length} insights, got ${allInsights.length}`);
  }

  return allInsights;
}

/**
 * Test 3: Service - Markdown formatting
 */
async function testServiceMarkdownFormatting() {
  const insights = await marketInsightsService.generateMarketInsights({
    category: 'watches',
    frequency: 'weekly',
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2,
    maxIndexAssets: 2,
  });

  const markdown = marketInsightsService.formatAsMarkdown(insights);

  if (!markdown.includes(insights.title)) {
    throw new Error('Markdown missing title');
  }

  if (!markdown.includes(insights.marketOverview)) {
    throw new Error('Markdown missing market overview');
  }

  console.log(`   Markdown length: ${markdown.length} chars`);
  console.log(`   First 200 chars: ${markdown.substring(0, 200)}...`);

  return { markdownLength: markdown.length };
}

/**
 * Test 4: OODA Loop Integration
 */
async function testOODAIntegration() {
  const result = await generateMarketInsightsWithOODA({
    category: 'watches',
    frequency: 'weekly',
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2,
    maxIndexAssets: 2,
  });

  if (!result.insights || !result.oodaCycles) {
    throw new Error('OODA result missing insights or cycles');
  }

  if (result.oodaCycles.length === 0) {
    throw new Error('No OODA cycles executed');
  }

  console.log(`   OODA Cycles: ${result.oodaCycles.length}`);
  console.log(`   Insights Title: ${result.insights.title}`);
  
  result.oodaCycles.forEach((cycle, idx) => {
    console.log(`   Cycle ${idx + 1}:`);
    console.log(`     Observed: ${cycle.observation.sources.length} sources`);
    console.log(`     Patterns: ${cycle.orientation.patterns.length}`);
    console.log(`     Action: ${cycle.action.executed ? 'executed' : 'failed'}`);
  });

  return {
    cycles: result.oodaCycles.length,
    insightsTitle: result.insights.title,
  };
}

/**
 * Test 5: Scheduler initialization
 */
async function testScheduler() {
  marketInsightsScheduler.initializeDefaultSchedules('weekly');
  const schedules = marketInsightsScheduler.getAllSchedules();

  if (schedules.length === 0) {
    throw new Error('No schedules initialized');
  }

  const expectedCategories = ['watches', 'cars', 'jewelry', 'sports', 'nfts'];
  const scheduledCategories = schedules.map(s => s.category);
  
  for (const category of expectedCategories) {
    if (!scheduledCategories.includes(category)) {
      throw new Error(`Missing schedule for category: ${category}`);
    }
  }

  console.log(`   Schedules: ${schedules.length}`);
  schedules.forEach(s => {
    console.log(`     ${s.category}: ${s.frequency} (enabled: ${s.enabled})`);
  });

  return { scheduleCount: schedules.length };
}

/**
 * Test 6: API Route - Single category (if server running)
 */
async function testAPISingleCategory() {
  if (!TEST_API_ROUTES) {
    throw new Error('API route testing disabled (server may not be running)');
  }

  const response = await testAPIRoute('/api/market-insights', 'POST', {
    category: 'watches',
    frequency: 'weekly',
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2,
    maxIndexAssets: 2,
  });

  if (!response.success) {
    throw new Error(`API returned error: ${response.error}`);
  }

  if (!response.data?.insights) {
    throw new Error('API response missing insights');
  }

  console.log(`   API Response: success`);
  console.log(`   Processing Time: ${response.metadata?.processingTime}ms`);
  console.log(`   Title: ${response.data.insights.title}`);

  return response;
}

/**
 * Test 7: API Route - Batch generation (if server running)
 */
async function testAPIBatchGeneration() {
  if (!TEST_API_ROUTES) {
    throw new Error('API route testing disabled (server may not be running)');
  }

  const response = await testAPIRoute('/api/market-insights/batch', 'POST', {
    frequency: 'weekly',
    categories: ['watches', 'cars'],
    includeItems: true,
    maxItems: 1,
  });

  if (!response.success) {
    throw new Error(`Batch API returned error: ${response.error}`);
  }

  if (!response.summary || response.summary.successful === 0) {
    throw new Error('Batch generation failed for all categories');
  }

  console.log(`   Total: ${response.summary.total}`);
  console.log(`   Successful: ${response.summary.successful}`);
  console.log(`   Failed: ${response.summary.failed}`);
  console.log(`   Processing Time: ${response.summary.processingTime}ms`);

  return response;
}

/**
 * Test 8: API Route - GET endpoint (if server running)
 */
async function testAPIGetEndpoint() {
  if (!TEST_API_ROUTES) {
    throw new Error('API route testing disabled (server may not be running)');
  }

  // Test documentation endpoint
  const docResponse = await testAPIRoute('/api/market-insights', 'GET');
  
  if (!docResponse.service || !docResponse.endpoints) {
    throw new Error('GET endpoint missing documentation');
  }

  console.log(`   Service: ${docResponse.service}`);
  console.log(`   Version: ${docResponse.version}`);

  // Test quick generation endpoint
  const genResponse = await testAPIRoute('/api/market-insights?category=watches&frequency=weekly', 'GET');
  
  if (!genResponse.success || !genResponse.data?.insights) {
    throw new Error('GET generation endpoint failed');
  }

  console.log(`   Quick Generation: success`);

  return { docResponse, genResponse };
}

/**
 * Test Ollama availability
 */
async function testOllamaAvailability(): Promise<boolean> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_HOST || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Main test runner
 */
async function runFullIntegrationTest() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   MARKET INSIGHTS FULL INTEGRATION TEST                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Check environment
  console.log('🔍 Checking Environment Configuration...\n');
  const envCheck = checkEnvironment();
  
  console.log('Environment Variables:');
  console.log(`  PERPLEXITY_API_KEY: ${process.env.PERPLEXITY_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`  OLLAMA_URL/HOST: ${process.env.OLLAMA_URL || process.env.OLLAMA_HOST || 'Using default (http://localhost:11434)'}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log('');

  if (!envCheck.canRun) {
    console.log('❌ Cannot run tests - missing required configuration:\n');
    envCheck.issues.forEach(issue => console.log(`  ❌ ${issue}`));
    console.log('\n💡 Recommendations:');
    envCheck.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('\n');
    process.exit(1);
  }

  // Check Ollama availability
  console.log('🔍 Checking Ollama availability...');
  const ollamaAvailable = await testOllamaAvailability();
  if (ollamaAvailable) {
    console.log('  ✅ Ollama is running and available\n');
  } else {
    console.log('  ⚠️  Ollama not available (will fail if Perplexity also unavailable)');
    console.log('     Start Ollama with: ollama serve\n');
  }

  if (!process.env.PERPLEXITY_API_KEY && !ollamaAvailable) {
    console.log('❌ No LLM provider available!');
    console.log('   Options:');
    console.log('   1. Set PERPLEXITY_API_KEY in .env.local');
    console.log('   2. Start Ollama: ollama serve');
    console.log('\n');
    process.exit(1);
  }

  // Core service tests
  await runTest('Service: Single Category (Watches)', testServiceSingleCategory);
  await runTest('Service: All Categories Sequential', testServiceAllCategories);
  await runTest('Service: Markdown Formatting', testServiceMarkdownFormatting);
  await runTest('OODA Loop Integration', testOODAIntegration);
  await runTest('Scheduler Initialization', testScheduler);

  // API route tests (if enabled)
  if (TEST_API_ROUTES) {
    await runTest('API Route: Single Category', testAPISingleCategory);
    await runTest('API Route: Batch Generation', testAPIBatchGeneration);
    await runTest('API Route: GET Endpoint', testAPIGetEndpoint);
  } else {
    console.log('\n⚠️  API route tests skipped (set TEST_API_ROUTES=true to enable)');
    console.log('   Start server with: npm run dev');
  }

  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log('');

  if (failedTests > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  // Detailed results
  console.log('Detailed Results:');
  results.forEach((r, idx) => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${idx + 1}. ${status} ${r.name} (${(r.duration / 1000).toFixed(1)}s)`);
    if (r.error) {
      console.log(`     Error: ${r.error}`);
    }
  });

  console.log('\n');

  // Exit with error code if any tests failed
  if (failedTests > 0) {
    process.exit(1);
  }
}

// Run tests
runFullIntegrationTest().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

