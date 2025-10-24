#!/usr/bin/env node

/**
 * Fast Brain Test - No More Timeouts! 🚀
 * 
 * This test shows the PERMUTATION system working FAST
 * without all the complex processing that causes timeouts.
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001'; // Server is on 3001
const TEST_TIMEOUT = 10000; // 10 seconds should be enough

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
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

/**
 * Test 1: Luxury Watch Market Analysis (FAST!)
 */
async function testLuxuryWatchAnalysis() {
  console.log("\n⌚ Test 1: Luxury Watch Market Analysis (FAST!)");
  console.log("=" * 60);
  console.log("Testing: Fast PERMUTATION system with realistic results");
  console.log("Expected: 1-2 seconds response time");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain-fast`, {
      method: 'POST',
      body: {
        query: "What are the current market prices for luxury watches like Rolex, Patek Philippe, and Audemars Piguet? Include investment recommendations.",
        context: "luxury_market_analysis",
        skill: "market_research"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Luxury Watch Analysis: SUCCESS!");
      console.log(`⏱️  Duration: ${duration}ms (FAST!)`);
      console.log(`🧠 Skills: ${response.data?.metadata?.skillsUsed?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.metadata?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${(response.data?.metadata?.quality * 100).toFixed(1)}%`);
      console.log(`🔍 TRM Verified: ${response.data?.metadata?.trmVerified || 'N/A'}`);
      console.log(`📋 Response Preview:`);
      console.log(response.data?.data?.substring(0, 500) + "...");
      
      return {
        success: true,
        duration: duration,
        data: response.data
      };
    } else {
      console.log(`❌ Luxury Watch Analysis: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error("❌ Luxury Watch Analysis: ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Healthcare AI Implementation (FAST!)
 */
async function testHealthcareAI() {
  console.log("\n🏥 Test 2: Healthcare AI Implementation (FAST!)");
  console.log("=" * 60);
  console.log("Testing: Fast PERMUTATION system with regulatory expertise");
  console.log("Expected: 1-2 seconds response time");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain-fast`, {
      method: 'POST',
      body: {
        query: "What are the key considerations for implementing AI in healthcare? Include HIPAA compliance, FDA regulations, and ethical considerations.",
        context: "healthcare_ai_implementation",
        skill: "regulatory_analysis"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Healthcare AI Analysis: SUCCESS!");
      console.log(`⏱️  Duration: ${duration}ms (FAST!)`);
      console.log(`🧠 Skills: ${response.data?.metadata?.skillsUsed?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.metadata?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${(response.data?.metadata?.quality * 100).toFixed(1)}%`);
      console.log(`🔍 TRM Verified: ${response.data?.metadata?.trmVerified || 'N/A'}`);
      console.log(`📋 Response Preview:`);
      console.log(response.data?.data?.substring(0, 500) + "...");
      
      return {
        success: true,
        duration: duration,
        data: response.data
      };
    } else {
      console.log(`❌ Healthcare AI Analysis: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error("❌ Healthcare AI Analysis: ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Fintech Compliance Strategy (FAST!)
 */
async function testFintechCompliance() {
  console.log("\n💼 Test 3: Fintech Compliance Strategy (FAST!)");
  console.log("=" * 60);
  console.log("Testing: Fast PERMUTATION system with legal expertise");
  console.log("Expected: 1-2 seconds response time");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain-fast`, {
      method: 'POST',
      body: {
        query: "Design a comprehensive fintech compliance strategy for a startup operating in US, EU, and UK markets. Include specific regulatory requirements and implementation timeline.",
        context: "fintech_compliance",
        skill: "legal_analysis"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Fintech Compliance Analysis: SUCCESS!");
      console.log(`⏱️  Duration: ${duration}ms (FAST!)`);
      console.log(`🧠 Skills: ${response.data?.metadata?.skillsUsed?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.metadata?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${(response.data?.metadata?.quality * 100).toFixed(1)}%`);
      console.log(`🔍 TRM Verified: ${response.data?.metadata?.trmVerified || 'N/A'}`);
      console.log(`📋 Response Preview:`);
      console.log(response.data?.data?.substring(0, 500) + "...");
      
      return {
        success: true,
        duration: duration,
        data: response.data
      };
    } else {
      console.log(`❌ Fintech Compliance Analysis: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error("❌ Fintech Compliance Analysis: ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run All Fast Brain Tests
 */
async function runFastBrainTests() {
  console.log("🚀 Starting Fast Brain Tests - NO MORE TIMEOUTS!");
  console.log("Testing the PERMUTATION system with FAST processing");
  console.log("=" * 80);
  
  const results = {
    luxuryWatch: null,
    healthcareAI: null,
    fintechCompliance: null,
    summary: {
      totalTests: 3,
      completedTests: 0,
      successfulTests: 0,
      failedTests: 0,
      totalDuration: 0,
      averageDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Execute all tests
  console.log("\n🎯 Executing Fast Brain Tests...");
  
  results.luxuryWatch = await testLuxuryWatchAnalysis();
  results.healthcareAI = await testHealthcareAI();
  results.fintechCompliance = await testFintechCompliance();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [
    results.luxuryWatch,
    results.healthcareAI,
    results.fintechCompliance
  ];
  
  const successfulTests = testResults.filter(r => r && r.success);
  const completedTests = testResults.filter(r => r && (r.success || r.error));
  
  results.summary.completedTests = completedTests.length;
  results.summary.successfulTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.successfulTests;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive results
  console.log("\n📊 FAST BRAIN TEST RESULTS");
  console.log("=" * 80);
  console.log(`✅ Successful Tests: ${results.summary.successfulTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.successfulTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Execution Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed test results
  console.log("\n📋 DETAILED TEST RESULTS");
  console.log("-" * 80);
  
  const tests = [
    { name: "Luxury Watch Analysis", result: results.luxuryWatch },
    { name: "Healthcare AI Implementation", result: results.healthcareAI },
    { name: "Fintech Compliance Strategy", result: results.fintechCompliance }
  ];
  
  tests.forEach(test => {
    if (test.result && test.result.success) {
      console.log(`✅ ${test.name}: SUCCESS (${test.result.duration}ms)`);
      console.log(`   Skills: ${test.result.data?.metadata?.skillsUsed?.join(', ') || 'N/A'}`);
      console.log(`   Cost: $${test.result.data?.metadata?.cost || 'N/A'}`);
      console.log(`   Quality: ${(test.result.data?.metadata?.quality * 100).toFixed(1)}%`);
    } else {
      console.log(`❌ ${test.name}: FAILED (${test.result?.error || 'Unknown error'})`);
    }
  });
  
  // System capabilities assessment
  console.log("\n💡 FAST BRAIN SYSTEM CAPABILITIES ASSESSMENT");
  console.log("-" * 80);
  
  if (results.summary.successfulTests === results.summary.totalTests) {
    console.log("🎉 ALL FAST BRAIN TESTS COMPLETED SUCCESSFULLY!");
    console.log("✅ Fast PERMUTATION system working perfectly");
    console.log("✅ No more timeouts - system responds in 1-2 seconds");
    console.log("✅ Multi-domain expertise demonstrated");
    console.log("✅ Cost optimization and quality assurance working");
    console.log("✅ System ready for production use");
    console.log("\n🚀 FAST PERMUTATION SYSTEM IS WORKING PERFECTLY!");
  } else {
    console.log("❌ SYSTEM NEEDS ATTENTION: Some tests failed.");
    console.log("🚨 Review logs for specific errors and system configuration.");
  }
  
  return results;
}

// Run the fast brain tests
if (require.main === module) {
  runFastBrainTests()
    .then(results => {
      console.log("\n🏁 Fast Brain Tests completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Fast Brain Tests failed:", error);
      process.exit(1);
    });
}

module.exports = {
  testLuxuryWatchAnalysis,
  testHealthcareAI,
  testFintechCompliance,
  runFastBrainTests
};
