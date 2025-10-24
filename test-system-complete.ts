/**
 * Comprehensive System Test Suite
 * Tests all major components: Brain API, Rate Limiting, WALT, Infrastructure
 */

import { createLogger } from './frontend/lib/walt/logger';
import { validateDiscoveryUrl, validateToolParameters } from './frontend/lib/walt/validation';
import { discoveryCache } from './frontend/lib/walt/cache-manager';
import { estimateToolExecutionCost } from './frontend/lib/walt/cost-calculator';

const logger = createLogger('SystemTest', 'info');

interface TestResult {
  component: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(component: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ component, test, status, message, details });
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} [${component}] ${test}: ${message}`);
}

// =============================================================================
// TEST 1: Brain API Basic Functionality
// =============================================================================
async function testBrainAPI() {
  console.log('\n🧠 Testing Brain API...');

  try {
    const response = await fetch('http://localhost:3000/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is 2+2?',
        domain: 'math'
      })
    });

    if (response.ok) {
      const data = await response.json();
      addResult('Brain API', 'Basic Query', 'PASS', 'API responded successfully', {
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0
      });
    } else {
      addResult('Brain API', 'Basic Query', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    addResult('Brain API', 'Basic Query', 'FAIL', `Error: ${error.message}`);
  }
}

// =============================================================================
// TEST 2: Rate Limiting Infrastructure
// =============================================================================
async function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...');

  // Test 2.1: Check if rate limiter infrastructure exists
  try {
    const { apiRateLimiter } = await import('./frontend/lib/api-rate-limiter');
    addResult('Rate Limiting', 'Infrastructure Exists', 'PASS', 'api-rate-limiter.ts found and imported');
  } catch (error) {
    addResult('Rate Limiting', 'Infrastructure Exists', 'FAIL', 'api-rate-limiter.ts not found');
    return;
  }

  // Test 2.2: Check if wrapper exists
  try {
    await import('./frontend/lib/brain-skills/llm-helpers');
    addResult('Rate Limiting', 'Wrapper Exists', 'PASS', 'llm-helpers.ts wrapper found');
  } catch (error) {
    addResult('Rate Limiting', 'Wrapper Exists', 'FAIL', 'llm-helpers.ts not found');
  }

  // Test 2.3: Check if test endpoint works
  try {
    const response = await fetch('http://localhost:3000/api/test-rate-limit');
    if (response.ok) {
      const data = await response.json();
      addResult('Rate Limiting', 'Test Endpoint', 'PASS', 'Rate limiter stats endpoint working', data.stats);
    } else {
      addResult('Rate Limiting', 'Test Endpoint', 'FAIL', `HTTP ${response.status}`);
    }
  } catch (error) {
    addResult('Rate Limiting', 'Test Endpoint', 'WARN', 'Test endpoint not responding (server may not be running)');
  }

  // Test 2.4: Check if moe-orchestrator uses rate limiting
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile('./frontend/lib/brain-skills/moe-orchestrator.ts', 'utf-8');

    const usesWrapper = content.includes('callPerplexityWithRateLimiting') ||
                       content.includes('from \'./llm-helpers\'');
    const hasDirectFetch = content.includes('fetch(\'https://api.perplexity.ai');

    if (usesWrapper && !hasDirectFetch) {
      addResult('Rate Limiting', 'MoE Integration', 'PASS', 'moe-orchestrator.ts uses rate-limited wrapper');
    } else if (!usesWrapper && hasDirectFetch) {
      addResult('Rate Limiting', 'MoE Integration', 'FAIL', 'moe-orchestrator.ts still has direct fetch calls', {
        directFetchCount: (content.match(/fetch\('https:\/\/api\.perplexity\.ai/g) || []).length
      });
    } else if (usesWrapper && hasDirectFetch) {
      addResult('Rate Limiting', 'MoE Integration', 'WARN', 'Partial migration - both wrapper and direct calls found');
    }
  } catch (error) {
    addResult('Rate Limiting', 'MoE Integration', 'FAIL', `Cannot check moe-orchestrator.ts: ${error.message}`);
  }
}

// =============================================================================
// TEST 3: WALT Components
// =============================================================================
async function testWALT() {
  console.log('\n🔧 Testing WALT Components...');

  // Test 3.1: Logger
  try {
    const testLogger = createLogger('TestComponent', 'debug');
    testLogger.info('Test message', { test: true });
    addResult('WALT', 'Logger', 'PASS', 'Logger creates instances and logs messages');
  } catch (error) {
    addResult('WALT', 'Logger', 'FAIL', `Logger error: ${error.message}`);
  }

  // Test 3.2: Validation
  try {
    // Should pass
    validateDiscoveryUrl('https://example.com');

    // Should fail - localhost
    try {
      validateDiscoveryUrl('http://localhost:3000');
      addResult('WALT', 'Validation SSRF', 'FAIL', 'Localhost validation should have thrown error');
    } catch {
      addResult('WALT', 'Validation SSRF', 'PASS', 'Correctly blocks localhost access');
    }

    // Should fail - private IP
    try {
      validateDiscoveryUrl('http://192.168.1.1');
      addResult('WALT', 'Validation Private IP', 'FAIL', 'Private IP validation should have thrown error');
    } catch {
      addResult('WALT', 'Validation Private IP', 'PASS', 'Correctly blocks private IP ranges');
    }
  } catch (error) {
    addResult('WALT', 'Validation', 'FAIL', `Validation error: ${error.message}`);
  }

  // Test 3.3: Cache Manager
  try {
    discoveryCache.set('test-key', { test: 'data', timestamp: Date.now() });
    const cached = discoveryCache.get('test-key');

    if (cached && cached.test === 'data') {
      const stats = discoveryCache.getStats();
      addResult('WALT', 'Cache Manager', 'PASS', 'Cache stores and retrieves data', {
        hits: stats.hits,
        misses: stats.misses,
        size: stats.size
      });
    } else {
      addResult('WALT', 'Cache Manager', 'FAIL', 'Cache did not return expected data');
    }
  } catch (error) {
    addResult('WALT', 'Cache Manager', 'FAIL', `Cache error: ${error.message}`);
  }

  // Test 3.4: Cost Calculator
  try {
    const cost = estimateToolExecutionCost({
      executionTimeMs: 5000,
      discoveryMethod: 'python',
      inputTokens: 1000,
      outputTokens: 500,
      model: 'gpt-4o'
    });

    if (cost.total_cost > 0 && cost.llm_cost > 0 && cost.browser_cost > 0) {
      addResult('WALT', 'Cost Calculator', 'PASS', 'Cost calculation working', {
        llm_cost: cost.llm_cost,
        browser_cost: cost.browser_cost,
        total_cost: cost.total_cost
      });
    } else {
      addResult('WALT', 'Cost Calculator', 'FAIL', 'Cost calculation returned zero or negative values');
    }
  } catch (error) {
    addResult('WALT', 'Cost Calculator', 'FAIL', `Cost calculator error: ${error.message}`);
  }

  // Test 3.5: Error Classes
  try {
    const { WALTValidationError, WALTRedisError, isWALTError } = await import('./frontend/lib/walt/errors');

    const validationError = new WALTValidationError('Test validation error', { test: true });
    const redisError = new WALTRedisError('Test redis error');

    if (isWALTError(validationError) && isWALTError(redisError)) {
      addResult('WALT', 'Error Classes', 'PASS', 'Error classes and type guards working');
    } else {
      addResult('WALT', 'Error Classes', 'FAIL', 'Type guards not working correctly');
    }
  } catch (error) {
    addResult('WALT', 'Error Classes', 'FAIL', `Error classes error: ${error.message}`);
  }
}

// =============================================================================
// TEST 4: Redis Queue (if Redis is running)
// =============================================================================
async function testRedisQueue() {
  console.log('\n🔴 Testing Redis Queue...');

  try {
    const { RedisWALTClient } = await import('./frontend/lib/walt/redis-queue-client');
    const client = new RedisWALTClient({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      queueName: 'walt:discovery:test',
      resultChannel: 'walt:results:test',
      jobTimeout: 30000
    });

    await client.connect();
    addResult('Redis Queue', 'Connection', 'PASS', 'Successfully connected to Redis');

    // Test job submission
    const jobId = await client.submitDiscoveryJob({
      url: 'https://example.com',
      jobId: `test-${Date.now()}`,
      timeout: 30000,
      options: {}
    });

    addResult('Redis Queue', 'Job Submission', 'PASS', 'Job submitted successfully', { jobId });

    await client.disconnect();

  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      addResult('Redis Queue', 'Connection', 'WARN', 'Redis not running (this is optional)', { error: error.message });
    } else {
      addResult('Redis Queue', 'Connection', 'FAIL', `Redis error: ${error.message}`);
    }
  }
}

// =============================================================================
// TEST 5: Environment Variables
// =============================================================================
async function testEnvironment() {
  console.log('\n🔐 Testing Environment Configuration...');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const optionalVars = [
    'PERPLEXITY_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'OLLAMA_HOST',
    'REDIS_URL'
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult('Environment', varName, 'PASS', 'Required variable set');
    } else {
      addResult('Environment', varName, 'FAIL', 'Required variable missing');
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addResult('Environment', varName, 'PASS', 'Optional variable set');
    } else {
      addResult('Environment', varName, 'WARN', 'Optional variable not set');
    }
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        PERMUTATION System Comprehensive Test Suite         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await testEnvironment();
  await testBrainAPI();
  await testRateLimiting();
  await testWALT();
  await testRedisQueue();

  // Print Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  const total = results.length;

  console.log(`✅ PASSED:   ${passed}/${total}`);
  console.log(`❌ FAILED:   ${failed}/${total}`);
  console.log(`⚠️  WARNINGS: ${warnings}/${total}\n`);

  // Group by component
  const byComponent = results.reduce((acc, r) => {
    if (!acc[r.component]) acc[r.component] = [];
    acc[r.component].push(r);
    return acc;
  }, {} as Record<string, TestResult[]>);

  for (const [component, tests] of Object.entries(byComponent)) {
    const componentPassed = tests.filter(t => t.status === 'PASS').length;
    const componentTotal = tests.length;
    const emoji = componentPassed === componentTotal ? '✅' :
                 componentPassed > componentTotal / 2 ? '⚠️' : '❌';

    console.log(`${emoji} ${component}: ${componentPassed}/${componentTotal} passed`);

    for (const test of tests) {
      const statusEmoji = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`   ${statusEmoji} ${test.test}: ${test.message}`);
      if (test.details && test.status === 'FAIL') {
        console.log(`      Details: ${JSON.stringify(test.details, null, 2)}`);
      }
    }
    console.log('');
  }

  // Critical Issues
  const criticalIssues = results.filter(r =>
    r.status === 'FAIL' &&
    (r.component === 'Environment' || r.test.includes('Integration'))
  );

  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES FOUND:\n');
    for (const issue of criticalIssues) {
      console.log(`   ❌ ${issue.component} - ${issue.test}: ${issue.message}`);
      if (issue.details) {
        console.log(`      ${JSON.stringify(issue.details, null, 2)}`);
      }
    }
    console.log('');
  }

  // Save results to file
  const fs = await import('fs/promises');
  const reportPath = './test-system-results.json';
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed, warnings },
    results,
    criticalIssues
  }, null, 2));

  console.log(`📄 Detailed results saved to: ${reportPath}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
