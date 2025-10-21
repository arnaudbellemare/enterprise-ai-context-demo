/**
 * Brain Systems Test Script
 *
 * Tests both /api/brain and /api/brain-enhanced endpoints
 * to ensure they work correctly after improvements
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test queries
const testQueries = [
  {
    query: 'What is artificial intelligence?',
    domain: 'general',
    description: 'Simple general query'
  },
  {
    query: 'Analyze the legal implications of AI in healthcare',
    domain: 'legal',
    description: 'Complex legal domain query'
  },
  {
    query: 'What are the latest trends in cryptocurrency?',
    domain: 'crypto',
    description: 'Real-time data query'
  }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, query, domain, description) {
  const url = `${BASE_URL}/api/${endpoint}`;

  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Testing: ${endpoint}`, 'cyan');
  log(`Query: ${query}`, 'blue');
  log(`Domain: ${domain}`, 'blue');
  log(`Description: ${description}`, 'blue');
  log('='.repeat(80), 'cyan');

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        domain,
        sessionId: `test-${Date.now()}`
      })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      log(`❌ FAILED: ${response.status} ${response.statusText}`, 'red');
      const errorText = await response.text();
      log(`Error: ${errorText.substring(0, 200)}`, 'red');
      return {
        success: false,
        endpoint,
        error: `${response.status} ${response.statusText}`,
        duration
      };
    }

    const data = await response.json();

    log(`✅ SUCCESS (${duration}ms)`, 'green');

    // Check response structure
    if (data.success) {
      log(`✓ Response has success flag`, 'green');
    } else {
      log(`⚠ Response missing success flag`, 'yellow');
    }

    if (data.response || data.answer) {
      const responseText = data.response || data.answer;
      log(`✓ Response text: ${responseText.substring(0, 100)}...`, 'green');
    } else {
      log(`⚠ Response missing text`, 'yellow');
    }

    if (data.brain_processing) {
      log(`✓ Brain processing metadata present`, 'green');
      if (data.brain_processing.activated_skills) {
        log(`  - Activated skills: ${data.brain_processing.activated_skills.length}`, 'blue');
        log(`  - Skills: ${data.brain_processing.activated_skills.join(', ')}`, 'blue');
      }
    }

    if (data.metadata) {
      log(`✓ Metadata present`, 'green');
      if (data.metadata.processing_time_ms) {
        log(`  - Processing time: ${data.metadata.processing_time_ms}ms`, 'blue');
      }
      if (data.metadata.skills_activated !== undefined) {
        log(`  - Skills activated: ${data.metadata.skills_activated}`, 'blue');
      }
    }

    // Check for enhancements (brain-enhanced specific)
    if (data.enhancements) {
      log(`✓ Enhancements present`, 'green');
      log(`  - Vector search: ${data.enhancements.vectorSearch}`, 'blue');
      log(`  - Similar queries: ${data.enhancements.similarQueries}`, 'blue');
    }

    return {
      success: true,
      endpoint,
      duration,
      skillsActivated: data.brain_processing?.activated_skills?.length || 0,
      responseLength: (data.response || data.answer || '').length
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ EXCEPTION: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');

    return {
      success: false,
      endpoint,
      error: error.message,
      duration
    };
  }
}

async function runTests() {
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║       Brain Systems Integration Test Suite                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');

  log(`\nBase URL: ${BASE_URL}`, 'blue');
  log(`Test Queries: ${testQueries.length}`, 'blue');
  log(`Endpoints: /api/brain, /api/brain-enhanced\n`, 'blue');

  const results = [];

  // Test each query on both endpoints
  for (const testCase of testQueries) {
    // Test brain endpoint
    const brainResult = await testEndpoint(
      'brain',
      testCase.query,
      testCase.domain,
      testCase.description
    );
    results.push(brainResult);

    // Test brain-enhanced endpoint
    const enhancedResult = await testEndpoint(
      'brain-enhanced',
      testCase.query,
      testCase.domain,
      testCase.description
    );
    results.push(enhancedResult);
  }

  // Summary
  log('\n╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                        Test Summary                              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

  log(`\nTotal Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Average Duration: ${avgDuration.toFixed(2)}ms`, 'blue');

  // Breakdown by endpoint
  const brainResults = results.filter(r => r.endpoint === 'brain');
  const enhancedResults = results.filter(r => r.endpoint === 'brain-enhanced');

  log('\n/api/brain:', 'cyan');
  log(`  Passed: ${brainResults.filter(r => r.success).length}/${brainResults.length}`,
    brainResults.every(r => r.success) ? 'green' : 'red');
  log(`  Avg Duration: ${(brainResults.reduce((sum, r) => sum + r.duration, 0) / brainResults.length).toFixed(2)}ms`, 'blue');

  log('\n/api/brain-enhanced:', 'cyan');
  log(`  Passed: ${enhancedResults.filter(r => r.success).length}/${enhancedResults.length}`,
    enhancedResults.every(r => r.success) ? 'green' : 'red');
  log(`  Avg Duration: ${(enhancedResults.reduce((sum, r) => sum + r.duration, 0) / enhancedResults.length).toFixed(2)}ms`, 'blue');

  // Failed tests details
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    failures.forEach(f => {
      log(`  - ${f.endpoint}: ${f.error}`, 'red');
    });
  }

  // Success message
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Both brain systems are working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }

  log('\n');

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
