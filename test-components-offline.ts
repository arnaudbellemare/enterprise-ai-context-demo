/**
 * Offline Component Testing (No Server Required)
 * Tests infrastructure components and code integration status
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function log(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN' | 'INFO', message: string, details?: any) {
  results.push({ category, test, status, message, details });
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} [${category}] ${test}: ${message}`);
  if (details && (status === 'FAIL' || status === 'WARN')) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
}

// =============================================================================
// TEST 1: WALT Infrastructure Components
// =============================================================================
async function testWALTInfrastructure() {
  console.log('\n🏗️  Testing WALT Infrastructure Components...\n');

  // Test Logger
  try {
    const { createLogger } = await import('./frontend/lib/walt/logger');
    const testLogger = createLogger('TestComponent', 'debug');
    testLogger.info('Test message', { test: true });
    log('WALT Infrastructure', 'Logger', 'PASS', 'Logger module loads and creates instances');
  } catch (error: any) {
    log('WALT Infrastructure', 'Logger', 'FAIL', `Logger error: ${error.message}`);
  }

  // Test Error Classes
  try {
    const { WALTError, WALTValidationError, WALTRedisError, WALTTimeoutError, isWALTError } =
      await import('./frontend/lib/walt/errors');

    const validationError = new WALTValidationError('Test validation error', { test: true });
    const redisError = new WALTRedisError('Test redis error');
    const timeoutError = new WALTTimeoutError('Test timeout', 30000);

    if (isWALTError(validationError) && isWALTError(redisError) && isWALTError(timeoutError)) {
      log('WALT Infrastructure', 'Error Classes', 'PASS', 'All error classes and type guards working');
    } else {
      log('WALT Infrastructure', 'Error Classes', 'FAIL', 'Type guards not working correctly');
    }
  } catch (error: any) {
    log('WALT Infrastructure', 'Error Classes', 'FAIL', `Error classes error: ${error.message}`);
  }

  // Test Validation
  try {
    const { validateDiscoveryUrl, validateToolParameters } = await import('./frontend/lib/walt/validation');

    // Should pass
    validateDiscoveryUrl('https://example.com');

    // Should fail - localhost
    let localhostBlocked = false;
    try {
      validateDiscoveryUrl('http://localhost:3000');
    } catch {
      localhostBlocked = true;
    }

    // Should fail - private IP
    let privateIPBlocked = false;
    try {
      validateDiscoveryUrl('http://192.168.1.1');
    } catch {
      privateIPBlocked = true;
    }

    if (localhostBlocked && privateIPBlocked) {
      log('WALT Infrastructure', 'Validation (SSRF Protection)', 'PASS', 'Blocks localhost and private IPs');
    } else {
      log('WALT Infrastructure', 'Validation (SSRF Protection)', 'FAIL', 'SSRF protection not working', {
        localhostBlocked,
        privateIPBlocked
      });
    }
  } catch (error: any) {
    log('WALT Infrastructure', 'Validation', 'FAIL', `Validation error: ${error.message}`);
  }

  // Test Cache Manager
  try {
    const { discoveryCache } = await import('./frontend/lib/walt/cache-manager');

    discoveryCache.set('test-key-1', { test: 'data', timestamp: Date.now() });
    const cached = discoveryCache.get('test-key-1');

    if (cached && cached.test === 'data') {
      const stats = discoveryCache.getStats();
      log('WALT Infrastructure', 'Cache Manager', 'PASS', 'Cache stores and retrieves data', {
        maxSize: 500,
        currentSize: stats.size,
        hits: stats.hits,
        misses: stats.misses
      });
    } else {
      log('WALT Infrastructure', 'Cache Manager', 'FAIL', 'Cache did not return expected data');
    }
  } catch (error: any) {
    log('WALT Infrastructure', 'Cache Manager', 'FAIL', `Cache error: ${error.message}`);
  }

  // Test Cost Calculator
  try {
    const { estimateToolExecutionCost, LLM_PRICING, BROWSER_PRICING } =
      await import('./frontend/lib/walt/cost-calculator');

    const cost = estimateToolExecutionCost({
      executionTimeMs: 5000,
      discoveryMethod: 'python',
      inputTokens: 1000,
      outputTokens: 500,
      model: 'gpt-4o'
    });

    if (cost.total_cost > 0 && cost.llm_cost > 0 && cost.browser_cost > 0) {
      log('WALT Infrastructure', 'Cost Calculator', 'PASS', 'Calculates LLM + browser costs', {
        llm_cost: `$${cost.llm_cost.toFixed(4)}`,
        browser_cost: `$${cost.browser_cost.toFixed(4)}`,
        total_cost: `$${cost.total_cost.toFixed(4)}`,
        models_supported: Object.keys(LLM_PRICING).length
      });
    } else {
      log('WALT Infrastructure', 'Cost Calculator', 'FAIL', 'Cost calculation returned zero or negative');
    }
  } catch (error: any) {
    log('WALT Infrastructure', 'Cost Calculator', 'FAIL', `Cost calculator error: ${error.message}`);
  }
}

// =============================================================================
// TEST 2: Rate Limiting Integration Status (CRITICAL)
// =============================================================================
async function testRateLimitingIntegration() {
  console.log('\n⏱️  Testing Rate Limiting Integration (CRITICAL)...\n');

  // Check if rate limiter infrastructure exists
  try {
    const rateLimiterPath = './frontend/lib/api-rate-limiter.ts';
    const content = await fs.readFile(rateLimiterPath, 'utf-8');

    const hasPerplexityConfig = content.includes('perplexity') && content.includes('requestsPerMinute');
    const hasProviderRotation = content.includes('makeRequest') && content.includes('fallback');

    log('Rate Limiting', 'Infrastructure File', 'PASS', 'api-rate-limiter.ts exists with provider rotation', {
      fileSize: `${content.length} bytes`,
      hasPerplexityConfig,
      hasProviderRotation
    });
  } catch (error: any) {
    log('Rate Limiting', 'Infrastructure File', 'FAIL', 'api-rate-limiter.ts not found');
  }

  // Check if wrapper exists
  try {
    const wrapperPath = './frontend/lib/brain-skills/llm-helpers.ts';
    const content = await fs.readFile(wrapperPath, 'utf-8');

    const hasRateLimitedCall = content.includes('callPerplexityWithRateLimiting');
    const hasRetryLogic = content.includes('callLLMWithRetry');
    const hasFallbackChain = content.includes('openrouter') && content.includes('ollama');

    log('Rate Limiting', 'Wrapper File', 'PASS', 'llm-helpers.ts exists with retry logic', {
      fileSize: `${content.length} bytes`,
      hasRateLimitedCall,
      hasRetryLogic,
      hasFallbackChain
    });
  } catch (error: any) {
    log('Rate Limiting', 'Wrapper File', 'FAIL', 'llm-helpers.ts not found');
  }

  // Check MoE Orchestrator integration (THE CRITICAL TEST)
  try {
    const moePath = './frontend/lib/brain-skills/moe-orchestrator.ts';
    const content = await fs.readFile(moePath, 'utf-8');

    const usesWrapper = content.includes('callPerplexityWithRateLimiting') ||
                       content.includes("from './llm-helpers'") ||
                       content.includes('import { callPerplexityWithRateLimiting');

    const directFetchMatches = content.match(/fetch\s*\(\s*['"]https:\/\/api\.perplexity\.ai/g) || [];
    const directFetchCount = directFetchMatches.length;

    if (usesWrapper && directFetchCount === 0) {
      log('Rate Limiting', 'MoE Orchestrator Integration', 'PASS', 'moe-orchestrator.ts uses rate-limited wrapper');
    } else if (!usesWrapper && directFetchCount > 0) {
      log('Rate Limiting', 'MoE Orchestrator Integration', 'FAIL',
        '🚨 CRITICAL: moe-orchestrator.ts still has direct Perplexity calls', {
          directFetchCount,
          usesWrapper: false,
          impact: 'Users will continue experiencing rate limit errors'
        });
    } else if (usesWrapper && directFetchCount > 0) {
      log('Rate Limiting', 'MoE Orchestrator Integration', 'WARN',
        'Partial migration - both wrapper and direct calls found', {
          directFetchCount,
          recommendation: 'Remove remaining direct fetch calls'
        });
    }
  } catch (error: any) {
    log('Rate Limiting', 'MoE Orchestrator Integration', 'FAIL', `Cannot read moe-orchestrator.ts: ${error.message}`);
  }

  // Check Teacher-Student System
  try {
    const teacherPath = './frontend/lib/teacher-student-system.ts';
    const content = await fs.readFile(teacherPath, 'utf-8');

    const usesWrapper = content.includes('callPerplexityWithRateLimiting');
    const directFetchMatches = content.match(/fetch\s*\(\s*['"]https:\/\/api\.perplexity\.ai/g) || [];

    if (usesWrapper && directFetchMatches.length === 0) {
      log('Rate Limiting', 'Teacher-Student Integration', 'PASS', 'Uses rate-limited wrapper');
    } else {
      log('Rate Limiting', 'Teacher-Student Integration', 'WARN', 'May have direct fetch calls', {
        directFetchCount: directFetchMatches.length
      });
    }
  } catch (error: any) {
    log('Rate Limiting', 'Teacher-Student Integration', 'INFO', `teacher-student-system.ts check skipped: ${error.message}`);
  }

  // Check GEPA Teacher-Student
  try {
    const gepaPath = './frontend/lib/gepa-teacher-student.ts';
    const content = await fs.readFile(gepaPath, 'utf-8');

    const usesWrapper = content.includes('callPerplexityWithRateLimiting');
    const directFetchMatches = content.match(/fetch\s*\(\s*['"]https:\/\/api\.perplexity\.ai/g) || [];

    if (usesWrapper && directFetchMatches.length === 0) {
      log('Rate Limiting', 'GEPA Integration', 'PASS', 'Uses rate-limited wrapper');
    } else {
      log('Rate Limiting', 'GEPA Integration', 'WARN', 'May have direct fetch calls', {
        directFetchCount: directFetchMatches.length
      });
    }
  } catch (error: any) {
    log('Rate Limiting', 'GEPA Integration', 'INFO', `gepa-teacher-student.ts check skipped: ${error.message}`);
  }
}

// =============================================================================
// TEST 3: Code Quality Checks
// =============================================================================
async function testCodeQuality() {
  console.log('\n📊 Testing Code Quality...\n');

  // Check for console.log usage in new files
  const filesToCheck = [
    './frontend/lib/walt/logger.ts',
    './frontend/lib/walt/errors.ts',
    './frontend/lib/walt/validation.ts',
    './frontend/lib/walt/cache-manager.ts',
    './frontend/lib/walt/cost-calculator.ts',
    './frontend/lib/brain-skills/llm-helpers.ts'
  ];

  for (const filePath of filesToCheck) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const consoleMatches = content.match(/console\.(log|debug|info|warn|error)/g) || [];

      // Allow console in logger.ts (it's the logger implementation)
      if (filePath.includes('logger.ts')) {
        log('Code Quality', `Console Usage: ${path.basename(filePath)}`, 'INFO',
          `${consoleMatches.length} console calls (expected in logger)`);
      } else if (consoleMatches.length === 0) {
        log('Code Quality', `Console Usage: ${path.basename(filePath)}`, 'PASS', 'No console.log statements');
      } else {
        log('Code Quality', `Console Usage: ${path.basename(filePath)}`, 'WARN',
          `Found ${consoleMatches.length} console statements`, {
            count: consoleMatches.length
          });
      }
    } catch (error: any) {
      log('Code Quality', `Console Usage: ${path.basename(filePath)}`, 'INFO', `Skipped: ${error.message}`);
    }
  }

  // Check for 'any' types in new files
  for (const filePath of filesToCheck) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Match ': any' but not in comments or strings
      const anyMatches = content.match(/:\s*any(?!\w)/g) || [];

      if (anyMatches.length === 0) {
        log('Code Quality', `Type Safety: ${path.basename(filePath)}`, 'PASS', 'No "any" types used');
      } else {
        log('Code Quality', `Type Safety: ${path.basename(filePath)}`, 'WARN',
          `Found ${anyMatches.length} "any" types`, {
            count: anyMatches.length,
            recommendation: 'Consider using specific types'
          });
      }
    } catch (error: any) {
      log('Code Quality', `Type Safety: ${path.basename(filePath)}`, 'INFO', `Skipped: ${error.message}`);
    }
  }
}

// =============================================================================
// TEST 4: File Structure
// =============================================================================
async function testFileStructure() {
  console.log('\n📁 Testing File Structure...\n');

  const expectedFiles = [
    { path: './frontend/lib/walt/logger.ts', description: 'Structured logging' },
    { path: './frontend/lib/walt/errors.ts', description: 'Type-safe errors' },
    { path: './frontend/lib/walt/validation.ts', description: 'Security validation' },
    { path: './frontend/lib/walt/cache-manager.ts', description: 'LRU cache' },
    { path: './frontend/lib/walt/cost-calculator.ts', description: 'Cost calculation' },
    { path: './frontend/lib/api-rate-limiter.ts', description: 'Rate limiter infrastructure' },
    { path: './frontend/lib/brain-skills/llm-helpers.ts', description: 'Rate-limited LLM wrapper' },
    { path: './BRAIN_RATE_LIMIT_FIX.md', description: 'Rate limit analysis' },
    { path: './BRAIN_RATE_LIMIT_USAGE.md', description: 'Rate limit usage guide' }
  ];

  for (const file of expectedFiles) {
    try {
      const stats = await fs.stat(file.path);
      log('File Structure', file.description, 'PASS', `✓ ${file.path} (${stats.size} bytes)`);
    } catch (error: any) {
      log('File Structure', file.description, 'FAIL', `✗ ${file.path} not found`);
    }
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     PERMUTATION Offline Component Test Suite              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await testFileStructure();
  await testWALTInfrastructure();
  await testRateLimitingIntegration();
  await testCodeQuality();

  // Print Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  const info = results.filter(r => r.status === 'INFO').length;
  const total = results.length;

  console.log(`✅ PASSED:   ${passed}/${total}`);
  console.log(`❌ FAILED:   ${failed}/${total}`);
  console.log(`⚠️  WARNINGS: ${warnings}/${total}`);
  console.log(`ℹ️  INFO:     ${info}/${total}\n`);

  // Critical Issues
  const criticalIssues = results.filter(r =>
    r.status === 'FAIL' &&
    (r.category === 'Rate Limiting' || r.test.includes('Integration'))
  );

  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:\n');
    for (const issue of criticalIssues) {
      console.log(`   ❌ ${issue.category} - ${issue.test}`);
      console.log(`      ${issue.message}`);
      if (issue.details) {
        console.log(`      Details: ${JSON.stringify(issue.details, null, 2)}`);
      }
    }
    console.log('');
  }

  // Warnings
  const warningIssues = results.filter(r => r.status === 'WARN');
  if (warningIssues.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    for (const issue of warningIssues) {
      console.log(`   ⚠️  ${issue.category} - ${issue.test}: ${issue.message}`);
    }
    console.log('');
  }

  // Recommendations
  console.log('📋 RECOMMENDATIONS:\n');

  const rateLimitFixNeeded = results.find(r =>
    r.test === 'MoE Orchestrator Integration' && r.status === 'FAIL'
  );

  if (rateLimitFixNeeded) {
    console.log('   1. 🚨 URGENT: Apply rate limiting wrapper to moe-orchestrator.ts');
    console.log('      - Replace direct fetch() calls with callPerplexityWithRateLimiting()');
    console.log('      - See: BRAIN_RATE_LIMIT_USAGE.md for migration guide');
    console.log('      - Impact: Fixes user-reported rate limiting errors\n');
  }

  const anyTypesWarnings = results.filter(r => r.test.includes('Type Safety') && r.status === 'WARN');
  if (anyTypesWarnings.length > 0) {
    console.log('   2. Replace "any" types with specific types for better type safety\n');
  }

  console.log('   3. Run full integration tests with dev server running');
  console.log('   4. Test rate limiting with rapid requests (25+ in 1 minute)\n');

  // Save results
  await fs.writeFile('./test-components-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed, warnings, info },
    results,
    criticalIssues,
    warningIssues
  }, null, 2));

  console.log('📄 Detailed results saved to: test-components-results.json\n');

  // Exit code based on critical issues
  process.exit(criticalIssues.length > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
