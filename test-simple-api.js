#!/usr/bin/env node

/**
 * Simple API Test: Test if PERMUTATION APIs are working
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 10000; // 10 seconds

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
      method: options.method || 'GET',
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
 * Test 1: Smart Extract API
 */
async function testSmartExtractAPI() {
  console.log("\n🔍 Test 1: Smart Extract API");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/smart-extract`, {
      method: 'GET'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Smart Extract API Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 API Name: ${response.data?.name || 'N/A'}`);
      console.log(`📋 Description: ${response.data?.description || 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Smart Extract API Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Smart Extract API Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Search Unified API
 */
async function testSearchUnifiedAPI() {
  console.log("\n🔍 Test 2: Search Unified API");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/search/unified`, {
      method: 'GET'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Search Unified API Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Description: ${response.data?.description || 'N/A'}`);
      console.log(`📋 Sources: ${response.data?.sources?.length || 0} available`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Search Unified API Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Search Unified API Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Model Router API
 */
async function testModelRouterAPI() {
  console.log("\n🤖 Test 3: Model Router API");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/model-router`, {
      method: 'POST',
      body: {
        task: "Find recent auction results for Mark Rothko paintings",
        context: "art_valuation"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Model Router API Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Selected Model: ${response.data?.model || 'N/A'}`);
      console.log(`📋 Reason: ${response.data?.reason || 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Model Router API Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Model Router API Failed:", error.message);
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
  console.log("🚀 Starting PERMUTATION API Test");
  console.log("Testing available API endpoints");
  console.log("=" * 60);
  
  const results = {
    smartExtract: null,
    searchUnified: null,
    modelRouter: null,
    summary: {
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      averageDuration: 0,
      totalDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Test 1: Smart Extract
  results.smartExtract = await testSmartExtractAPI();
  
  // Test 2: Search Unified
  results.searchUnified = await testSearchUnifiedAPI();
  
  // Test 3: Model Router
  results.modelRouter = await testModelRouterAPI();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.smartExtract, results.searchUnified, results.modelRouter];
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
  
  if (results.smartExtract && results.smartExtract.success) {
    console.log(`🔍 Smart Extract: ✅ SUCCESS (${results.smartExtract.duration}ms)`);
  } else {
    console.log(`🔍 Smart Extract: ❌ FAILED (${results.smartExtract?.error || 'Unknown error'})`);
  }
  
  if (results.searchUnified && results.searchUnified.success) {
    console.log(`🔍 Search Unified: ✅ SUCCESS (${results.searchUnified.duration}ms)`);
  } else {
    console.log(`🔍 Search Unified: ❌ FAILED (${results.searchUnified?.error || 'Unknown error'})`);
  }
  
  if (results.modelRouter && results.modelRouter.success) {
    console.log(`🤖 Model Router: ✅ SUCCESS (${results.modelRouter.duration}ms)`);
  } else {
    console.log(`🤖 Model Router: ❌ FAILED (${results.modelRouter?.error || 'Unknown error'})`);
  }
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-" * 40);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! PERMUTATION APIs are working.");
    console.log("✅ Next steps: Test more complex endpoints, build market data collection");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some APIs work, others need improvement.");
    console.log("🔧 Next steps: Debug failed APIs, test brain API separately");
  } else {
    console.log("❌ ALL TESTS FAILED: PERMUTATION APIs need significant improvement.");
    console.log("🚨 Next steps: Check server configuration, debug API issues");
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
  testSmartExtractAPI,
  testSearchUnifiedAPI,
  testModelRouterAPI,
  runComprehensiveTest
};
