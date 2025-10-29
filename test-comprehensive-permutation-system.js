#!/usr/bin/env node

/**
 * COMPREHENSIVE PERMUTATION AI SYSTEM TEST
 * 
 * Tests all components of the PERMUTATION AI system to ensure
 * complete functionality and correctness.
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds per test

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function logTest(testName, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testName}: PASS`);
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
    console.log(`❌ ${testName}: FAIL - ${details}`);
  }
  testResults.details.push({ test: testName, status, details });
}

async function runTest(testName, testFunction) {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    await testFunction();
  } catch (error) {
    logTest(testName, 'FAIL', error.message);
  }
}

// Test Cases
async function testServerHealth() {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  if (response.status === 200) {
    logTest('Server Health Check', 'PASS');
  } else {
    logTest('Server Health Check', 'FAIL', `Status: ${response.status}`);
  }
}

async function testEstateValueAI() {
  const testRequest = {
    artwork: {
      title: "Starry Night",
      artist: "Vincent van Gogh",
      year: "1889",
      medium: "Oil on canvas",
      dimensions: "73.7 cm × 92.1 cm",
      condition: "Good",
      provenance: ["Private collection", "Auction house"]
    },
    insurancePolicy: {
      type: "fine-art",
      coverage: {
        amount: 1000000,
        deductible: 10000
      }
    },
    requirements: {
      purpose: "insurance",
      jurisdiction: "US",
      urgency: "standard"
    }
  };

  const response = await makeRequest(`${BASE_URL}/api/estatevalue-ai`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Estate Value AI API', 'PASS', `Value: $${response.data.data.valuation.estimatedValue}`);
  } else {
    logTest('Estate Value AI API', 'FAIL', `Status: ${response.status}, Success: ${response.data.success}`);
  }
}

async function testRealisticValuation() {
  const testRequest = {
    artwork: {
      title: "Campbell's Soup Cans",
      artist: "Andy Warhol",
      year: "1962",
      medium: "Synthetic polymer paint on canvas",
      dimensions: "50.8 cm × 40.6 cm each"
    },
    category: "contemporary-art"
  };

  const response = await makeRequest(`${BASE_URL}/api/realistic-valuation`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Realistic Valuation API', 'PASS', `Confidence: ${response.data.data.valuation.confidence}`);
  } else {
    logTest('Realistic Valuation API', 'FAIL', `Status: ${response.status}`);
  }
}

async function testArtDecoCartierValuation() {
  const testRequest = {
    item: {
      type: "watch",
      model: "Santos",
      year: "1911",
      condition: "Excellent",
      materials: ["Gold", "Leather"],
      provenance: "Original owner"
    },
    valuationType: "insurance"
  };

  const response = await makeRequest(`${BASE_URL}/api/art-deco-cartier-valuation`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Art Deco Cartier Valuation API', 'PASS', `Value: $${response.data.data.valuation.estimatedValue}`);
  } else {
    logTest('Art Deco Cartier Valuation API', 'FAIL', `Status: ${response.status}`);
  }
}

async function testTeacherStudentJudgeAdvanced() {
  const testRequest = {
    artwork: {
      title: "The Persistence of Memory",
      artist: "Salvador Dalí",
      year: "1931",
      medium: "Oil on canvas",
      dimensions: "24 cm × 33 cm"
    },
    query: "Assess this Dalí painting for insurance purposes"
  };

  const response = await makeRequest(`${BASE_URL}/api/teacher-student-judge-advanced`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Teacher-Student-Judge Advanced', 'PASS', `Confidence: ${response.data.data.teacher.confidence}`);
  } else {
    logTest('Teacher-Student-Judge Advanced', 'FAIL', `Status: ${response.status}`);
  }
}

async function testGANOPROOptimization() {
  const testRequest = {
    initialPrompt: "Analyze this artwork for insurance valuation",
    maxIterations: 3,
    maxCandidates: 5
  };

  const response = await makeRequest(`${BASE_URL}/api/gan-opro-optimization`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('GAN-OPRO Optimization', 'PASS', `Final Score: ${response.data.result.finalScore}`);
  } else {
    logTest('GAN-OPRO Optimization', 'FAIL', `Status: ${response.status}`);
  }
}

async function testGEPAOptimization() {
  const testRequest = {
    prompt: "Value this artwork for insurance",
    domain: "art-valuation",
    maxIterations: 2
  };

  const response = await makeRequest(`${BASE_URL}/api/gepa-optimization`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('GEPA Optimization', 'PASS', `Improvement: ${response.data.improvement}%`);
  } else {
    logTest('GEPA Optimization', 'FAIL', `Status: ${response.status}`);
  }
}

async function testCreativeJudge() {
  const testRequest = {
    response: "This artwork is worth approximately $50,000 based on recent auction sales of similar pieces.",
    context: "Art insurance valuation",
    patterns: ["blind_spots", "practical_concerns"]
  };

  const response = await makeRequest(`${BASE_URL}/api/creative-judge`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Creative Judge System', 'PASS', `Blind Spots Found: ${response.data.blindSpots?.length || 0}`);
  } else {
    logTest('Creative Judge System', 'FAIL', `Status: ${response.status}`);
  }
}

async function testMultiLLMSearch() {
  const testRequest = {
    query: "Van Gogh Starry Night auction prices 2024",
    maxTokens: 5000,
    searchStrategy: "parallel"
  };

  const response = await makeRequest(`${BASE_URL}/api/multi-llm-search`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Multi-LLM Search', 'PASS', `Results: ${response.data.results?.length || 0}`);
  } else {
    logTest('Multi-LLM Search', 'FAIL', `Status: ${response.status}`);
  }
}

async function testBrainAPI() {
  const testRequest = {
    query: "Assess this Picasso painting for estate valuation",
    domain: "art-valuation",
    context: {
      artwork: "Picasso painting",
      purpose: "estate"
    }
  };

  const response = await makeRequest(`${BASE_URL}/api/brain`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Brain API', 'PASS', `Quality: ${response.data.quality}`);
  } else {
    logTest('Brain API', 'FAIL', `Status: ${response.status}`);
  }
}

async function testAdvancedLearningMethods() {
  const testRequest = {
    query: "Analyze market trends for contemporary art",
    context: "Art market analysis",
    methods: ["self_supervised", "causal_inference"]
  };

  const response = await makeRequest(`${BASE_URL}/api/advanced-learning-methods`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Advanced Learning Methods', 'PASS', `Methods Applied: ${response.data.methods?.length || 0}`);
  } else {
    logTest('Advanced Learning Methods', 'FAIL', `Status: ${response.status}`);
  }
}

async function testContinualLearning() {
  const testRequest = {
    task: "art-valuation",
    data: {
      artwork: "Monet Water Lilies",
      value: 500000
    },
    learningType: "incremental"
  };

  const response = await makeRequest(`${BASE_URL}/api/continual-learning`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Continual Learning', 'PASS', `Learning Score: ${response.data.learningScore}`);
  } else {
    logTest('Continual Learning', 'FAIL', `Status: ${response.status}`);
  }
}

async function testFluidBenchmarking() {
  const testRequest = {
    method: "knowledge_graph",
    userId: "test-user",
    n_max: 10,
    compare_methods: false
  };

  const response = await makeRequest(`${BASE_URL}/api/evaluate/fluid`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Fluid Benchmarking', 'PASS', `Ability: ${response.data.ability}`);
  } else {
    logTest('Fluid Benchmarking', 'FAIL', `Status: ${response.status}`);
  }
}

async function testRigorousEvaluation() {
  const testRequest = {
    baseline: [0.85, 0.78, 0.92],
    optimized: [0.89, 0.82, 0.94],
    testCases: [],
    controlCases: []
  };

  const response = await makeRequest(`${BASE_URL}/api/rigorous-evaluation`, {
    method: 'POST',
    body: testRequest
  });

  if (response.status === 200 && response.data.success) {
    logTest('Rigorous Evaluation', 'PASS', `Significance: ${response.data.statisticalSignificance}`);
  } else {
    logTest('Rigorous Evaluation', 'FAIL', `Status: ${response.status}`);
  }
}

// Main test execution
async function runComprehensiveSystemTest() {
  console.log('🚀 COMPREHENSIVE PERMUTATION AI SYSTEM TEST');
  console.log('============================================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Timeout per test: ${TEST_TIMEOUT}ms`);
  console.log('');

  const startTime = Date.now();

  // Core System Tests
  await runTest('Server Health Check', testServerHealth);
  
  // Art Insurance APIs
  await runTest('Estate Value AI API', testEstateValueAI);
  await runTest('Realistic Valuation API', testRealisticValuation);
  await runTest('Art Deco Cartier Valuation API', testArtDecoCartierValuation);
  
  // Advanced PERMUTATION AI Components
  await runTest('Teacher-Student-Judge Advanced', testTeacherStudentJudgeAdvanced);
  await runTest('GAN-OPRO Optimization', testGANOPROOptimization);
  await runTest('GEPA Optimization', testGEPAOptimization);
  
  // Judge Systems
  await runTest('Creative Judge System', testCreativeJudge);
  
  // Multi-LLM and Brain APIs
  await runTest('Multi-LLM Search', testMultiLLMSearch);
  await runTest('Brain API', testBrainAPI);
  
  // Advanced Learning Systems
  await runTest('Advanced Learning Methods', testAdvancedLearningMethods);
  await runTest('Continual Learning', testContinualLearning);
  
  // Evaluation Systems
  await runTest('Fluid Benchmarking', testFluidBenchmarking);
  await runTest('Rigorous Evaluation', testRigorousEvaluation);

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('============================================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} (${((testResults.passed / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failed} (${((testResults.failed / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time per Test: ${(totalTime / testResults.total).toFixed(0)}ms`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  testResults.details.forEach(detail => {
    const status = detail.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${status} ${detail.test}: ${detail.details || detail.status}`);
  });

  // System health assessment
  const passRate = (testResults.passed / testResults.total) * 100;
  let systemStatus;
  if (passRate >= 90) {
    systemStatus = '🟢 EXCELLENT';
  } else if (passRate >= 75) {
    systemStatus = '🟡 GOOD';
  } else if (passRate >= 50) {
    systemStatus = '🟠 FAIR';
  } else {
    systemStatus = '🔴 POOR';
  }

  console.log('\n🎯 SYSTEM HEALTH ASSESSMENT');
  console.log('============================================================');
  console.log(`Overall Status: ${systemStatus}`);
  console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
  
  if (passRate >= 90) {
    console.log('✅ PERMUTATION AI system is working excellently');
    console.log('✅ All core components are functional');
    console.log('✅ Ready for production use');
  } else if (passRate >= 75) {
    console.log('⚠️  PERMUTATION AI system is mostly functional');
    console.log('⚠️  Some components may need attention');
    console.log('⚠️  Review failed tests before production');
  } else {
    console.log('❌ PERMUTATION AI system has significant issues');
    console.log('❌ Multiple components are not working');
    console.log('❌ System needs debugging before use');
  }

  console.log('\n🔧 RECOMMENDATIONS:');
  if (testResults.failed > 0) {
    console.log('1. Review failed test details above');
    console.log('2. Check server logs for error messages');
    console.log('3. Verify all dependencies are installed');
    console.log('4. Ensure all environment variables are set');
    console.log('5. Check database connections and API keys');
  } else {
    console.log('1. System is ready for production deployment');
    console.log('2. Consider running performance benchmarks');
    console.log('3. Monitor system metrics in production');
    console.log('4. Set up automated testing in CI/CD pipeline');
  }

  console.log('\n✅ COMPREHENSIVE SYSTEM TEST COMPLETE');
  console.log('============================================================');
}

// Run the comprehensive test
runComprehensiveSystemTest().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
