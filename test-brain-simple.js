#!/usr/bin/env node

/**
 * Simple Brain API Test: Test if the brain API works with simple queries
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 30000; // 30 seconds

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
 * Test 1: Simple Brain Query
 */
async function testSimpleBrainQuery() {
  console.log("\n🧠 Test 1: Simple Brain Query");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What is 2 + 2?",
        context: "general"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Simple Brain Query Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Response: ${response.data?.response ? response.data.response.substring(0, 200) + '...' : 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Simple Brain Query Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Simple Brain Query Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Art Market Query (Simplified)
 */
async function testArtMarketQuery() {
  console.log("\n🎨 Test 2: Art Market Query (Simplified)");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What is the current price of a Mark Rothko painting?",
        context: "art_valuation"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Art Market Query Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Response: ${response.data?.response ? response.data.response.substring(0, 200) + '...' : 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Art Market Query Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Art Market Query Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Classic Cars Query (Simplified)
 */
async function testClassicCarsQuery() {
  console.log("\n🚗 Test 3: Classic Cars Query (Simplified)");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What is the value of a 1960s Ferrari 250 GT?",
        context: "classic_cars"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Classic Cars Query Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Response: ${response.data?.response ? response.data.response.substring(0, 200) + '...' : 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Classic Cars Query Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Classic Cars Query Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run Comprehensive Test Suite
 */
async function runComprehensiveTest() {
  console.log("🚀 Starting PERMUTATION Brain API Test");
  console.log("Testing brain API with simple queries");
  console.log("=" * 60);
  
  const results = {
    simpleQuery: null,
    artMarket: null,
    classicCars: null,
    summary: {
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      averageDuration: 0,
      totalDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Test 1: Simple Query
  results.simpleQuery = await testSimpleBrainQuery();
  
  // Test 2: Art Market
  results.artMarket = await testArtMarketQuery();
  
  // Test 3: Classic Cars
  results.classicCars = await testClassicCarsQuery();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.simpleQuery, results.artMarket, results.classicCars];
  const successfulTests = testResults.filter(r => r && r.success);
  
  results.summary.passedTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive summary
  console.log("\n📊 COMPREHENSIVE TEST RESULTS");
  console.log("=" * 60);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Test Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed results
  console.log("\n📋 DETAILED RESULTS");
  console.log("-" * 40);
  
  if (results.simpleQuery && results.simpleQuery.success) {
    console.log(`🧠 Simple Query: ✅ SUCCESS (${results.simpleQuery.duration}ms)`);
  } else {
    console.log(`🧠 Simple Query: ❌ FAILED (${results.simpleQuery?.error || 'Unknown error'})`);
  }
  
  if (results.artMarket && results.artMarket.success) {
    console.log(`🎨 Art Market: ✅ SUCCESS (${results.artMarket.duration}ms)`);
  } else {
    console.log(`🎨 Art Market: ❌ FAILED (${results.artMarket?.error || 'Unknown error'})`);
  }
  
  if (results.classicCars && results.classicCars.success) {
    console.log(`🚗 Classic Cars: ✅ SUCCESS (${results.classicCars.duration}ms)`);
  } else {
    console.log(`🚗 Classic Cars: ❌ FAILED (${results.classicCars?.error || 'Unknown error'})`);
  }
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-" * 40);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! PERMUTATION Brain API is working.");
    console.log("✅ Next steps: Test complex market data queries, build market database");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some queries work, others need improvement.");
    console.log("🔧 Next steps: Debug failed queries, optimize brain API");
  } else {
    console.log("❌ ALL TESTS FAILED: PERMUTATION Brain API needs significant improvement.");
    console.log("🚨 Next steps: Check brain API configuration, debug system issues");
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  runComprehensiveTest()
    .then(results => {
      console.log("\n🏁 Test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Test failed with error:", error);
      process.exit(1);
    });
}

module.exports = {
  testSimpleBrainQuery,
  testArtMarketQuery,
  testClassicCarsQuery,
  runComprehensiveTest
};