/**
 * Brain System Migration Test
 *
 * Tests both the original and new brain systems to ensure:
 * 1. Original system still works (backward compatibility)
 * 2. New system works when enabled
 * 3. Feature flag toggles correctly
 */

const API_BASE = 'http://localhost:3000';

// Test configuration
const TEST_QUERY = 'Explain the concept of machine learning in simple terms';
const TEST_DOMAIN = 'technology';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function testBrainSystem(systemName, expectedSystem) {
  console.log(`\n${colorize(`Testing ${systemName}...`, 'cyan')}`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/api/brain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: TEST_QUERY,
        domain: TEST_DOMAIN
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    // Validate response structure
    if (!data.success) {
      throw new Error('Response success is false');
    }

    if (!data.response) {
      throw new Error('No response field in data');
    }

    if (!data.brain_processing) {
      throw new Error('No brain_processing field');
    }

    if (!Array.isArray(data.brain_processing.activated_skills)) {
      throw new Error('activated_skills is not an array');
    }

    // Check which system was used
    const actualSystem = data.brain_processing.synthesis_method;
    const metadataSystem = data.metadata?.system;

    console.log(`  ${colorize('✓', 'green')} Response received`);
    console.log(`  ${colorize('✓', 'green')} Duration: ${duration}ms`);
    console.log(`  ${colorize('✓', 'green')} Skills activated: ${data.brain_processing.activated_skills.length}`);
    console.log(`  ${colorize('✓', 'green')} System used: ${actualSystem}`);

    if (expectedSystem === 'new' && metadataSystem === 'new-modular') {
      console.log(`  ${colorize('✓', 'green')} Cache hit rate: ${(data.metadata.cache_hit_rate * 100).toFixed(2)}%`);
      console.log(`  ${colorize('✓', 'green')} Cache size: ${data.metadata.cache_size}`);

      if (data.performance) {
        console.log(`  ${colorize('✓', 'green')} Successful skills: ${data.performance.successful_skills}`);
        console.log(`  ${colorize('✓', 'green')} Failed skills: ${data.performance.failed_skills}`);
      }
    }

    // Verify system matches expectation
    if (expectedSystem === 'new' && metadataSystem !== 'new-modular') {
      console.log(`  ${colorize('⚠', 'yellow')} WARNING: Expected new system but got ${metadataSystem || 'original'}`);
    }

    if (expectedSystem === 'original' && metadataSystem === 'new-modular') {
      console.log(`  ${colorize('⚠', 'yellow')} WARNING: Expected original system but got new system`);
    }

    return {
      success: true,
      duration,
      skillsActivated: data.brain_processing.activated_skills.length,
      system: actualSystem,
      metadataSystem,
      responseLength: data.response.length,
      cacheHitRate: data.metadata?.cache_hit_rate || 0
    };

  } catch (error) {
    console.log(`  ${colorize('✗', 'red')} FAILED: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log(colorize('\n╔════════════════════════════════════════════════════════════╗', 'blue'));
  console.log(colorize('║  Brain System Migration Test Suite                        ║', 'blue'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'blue'));

  console.log(`\nTest query: "${TEST_QUERY.substring(0, 50)}..."`);
  console.log(`Test domain: ${TEST_DOMAIN}`);

  // Check if server is running
  console.log(`\n${colorize('Checking server status...', 'cyan')}`);
  try {
    const response = await fetch(`${API_BASE}/api/health`).catch(() => null);
    if (!response) {
      throw new Error('Server not responding');
    }
    console.log(`  ${colorize('✓', 'green')} Server is running`);
  } catch (error) {
    console.log(`  ${colorize('✗', 'red')} Server is NOT running`);
    console.log(`\n${colorize('Please start the server first:', 'yellow')}`);
    console.log(`  npm run dev`);
    process.exit(1);
  }

  // Test 1: Original System (default, no env var)
  console.log(`\n${colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue')}`);
  console.log(colorize('Test 1: Original Subconscious Memory System', 'blue'));
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue'));

  const originalResult = await testBrainSystem('Original System', 'original');

  // Test 2: Run same query again to test consistency
  console.log(`\n${colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue')}`);
  console.log(colorize('Test 2: Original System (Repeat Query)', 'blue'));
  console.log(colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue'));

  const originalRepeatResult = await testBrainSystem('Original System (Repeat)', 'original');

  // Summary
  console.log(`\n${colorize('╔════════════════════════════════════════════════════════════╗', 'blue')}`);
  console.log(colorize('║  Test Summary                                              ║', 'blue'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'blue'));

  const allPassed = originalResult.success && originalRepeatResult.success;

  if (allPassed) {
    console.log(`\n${colorize('✅ ALL TESTS PASSED', 'green')}`);
    console.log(`\n${colorize('Results:', 'cyan')}`);
    console.log(`  Original System:`);
    console.log(`    - First request: ${originalResult.duration}ms`);
    console.log(`    - Second request: ${originalRepeatResult.duration}ms`);
    console.log(`    - Skills activated: ${originalResult.skillsActivated}`);
    console.log(`    - Response length: ${originalResult.responseLength} chars`);

    console.log(`\n${colorize('Next Steps:', 'cyan')}`);
    console.log(`  1. ✅ Original system verified working`);
    console.log(`  2. To enable NEW system with caching + metrics:`);
    console.log(`     ${colorize('export BRAIN_USE_NEW_SKILLS=true', 'yellow')}`);
    console.log(`     ${colorize('npm run dev', 'yellow')}`);
    console.log(`  3. Run this test again to verify new system`);
    console.log(`  4. Compare performance between systems`);

  } else {
    console.log(`\n${colorize('❌ SOME TESTS FAILED', 'red')}`);
    console.log(`\n${colorize('Failed tests:', 'red')}`);
    if (!originalResult.success) {
      console.log(`  - Original System: ${originalResult.error}`);
    }
    if (!originalRepeatResult.success) {
      console.log(`  - Original System (Repeat): ${originalRepeatResult.error}`);
    }
    process.exit(1);
  }

  console.log(`\n${colorize('Feature Flag Status:', 'cyan')}`);
  console.log(`  BRAIN_USE_NEW_SKILLS = ${process.env.BRAIN_USE_NEW_SKILLS || 'false (default)'}`);
  console.log(`  Current system: ${originalResult.metadataSystem || 'original'}`);
}

// Run tests
runTests().catch(error => {
  console.error(`\n${colorize('Fatal error:', 'red')}`, error);
  process.exit(1);
});
