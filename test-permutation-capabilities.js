#!/usr/bin/env node

/**
 * PERMUTATION Capabilities Test: Demonstrate what PERMUTATION can actually do
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
 * Test 1: Model Router - Intelligent Model Selection
 */
async function testModelRouter() {
  console.log("\n🧠 Test 1: Model Router - Intelligent Model Selection");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/model-router`, {
      method: 'POST',
      body: {
        task: "Analyze market trends for luxury watches and provide valuation insights",
        context: "luxury_watches"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Model Router Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🤖 Selected Model: ${response.data?.model || 'N/A'}`);
      console.log(`💡 Reasoning: ${response.data?.reason || 'N/A'}`);
      console.log(`💰 Estimated Cost: $${response.data?.estimatedCost || 'N/A'}`);
      console.log(`⭐ Estimated Quality: ${response.data?.estimatedQuality || 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Model Router Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Model Router Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Smart Extract - Data Extraction
 */
async function testSmartExtract() {
  console.log("\n🔍 Test 2: Smart Extract - Data Extraction");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/smart-extract`, {
      method: 'POST',
      body: {
        text: "Mark Rothko's painting sold for $2.5 million at Christie's auction in New York on March 15, 2024",
        userId: "test_user_123"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Smart Extract Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Method: ${response.data?.method || 'N/A'}`);
      console.log(`🎯 Confidence: ${response.data?.confidence || 'N/A'}`);
      console.log(`📈 Entities Found: ${response.data?.entities?.length || 0}`);
      console.log(`🔗 Relationships: ${response.data?.relationships?.length || 0}`);
      console.log(`⚡ Processing Speed: ${response.data?.performance?.speed || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.performance?.estimated_cost || 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Smart Extract Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Smart Extract Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Unified Search - Market Research
 */
async function testUnifiedSearch() {
  console.log("\n🔎 Test 3: Unified Search - Market Research");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/search/unified`, {
      method: 'POST',
      body: {
        query: "Rolex Submariner auction results 2024 Christie's Sotheby's hammer prices",
        context: "luxury_watches"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Unified Search Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Total Results: ${response.data?.totalResults || 'N/A'}`);
      console.log(`🔍 Sources: ${response.data?.sources || 'N/A'}`);
      console.log(`⚡ Processing Time: ${response.data?.processingTime || 'N/A'}ms`);
      console.log(`🔄 Merge Strategy: ${response.data?.mergeStrategy || 'N/A'}`);
      console.log(`📊 Source Breakdown: ${JSON.stringify(response.data?.sourceBreakdown || {}, null, 2)}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Unified Search Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Unified Search Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run Comprehensive PERMUTATION Capabilities Test
 */
async function runPermutationCapabilitiesTest() {
  console.log("🚀 Starting PERMUTATION Capabilities Test");
  console.log("Demonstrating what PERMUTATION can actually do");
  console.log("=" * 70);
  
  const results = {
    modelRouter: null,
    smartExtract: null,
    unifiedSearch: null,
    summary: {
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      averageDuration: 0,
      totalDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Test 1: Model Router
  results.modelRouter = await testModelRouter();
  
  // Test 2: Smart Extract
  results.smartExtract = await testSmartExtract();
  
  // Test 3: Unified Search
  results.unifiedSearch = await testUnifiedSearch();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.modelRouter, results.smartExtract, results.unifiedSearch];
  const successfulTests = testResults.filter(r => r && r.success);
  
  results.summary.passedTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive summary
  console.log("\n📊 COMPREHENSIVE PERMUTATION CAPABILITIES RESULTS");
  console.log("=" * 70);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Test Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed results
  console.log("\n📋 DETAILED RESULTS");
  console.log("-" * 60);
  
  if (results.modelRouter && results.modelRouter.success) {
    console.log(`🧠 Model Router: ✅ SUCCESS (${results.modelRouter.duration}ms)`);
    console.log(`   Model: ${results.modelRouter.data?.model}`);
    console.log(`   Cost: $${results.modelRouter.data?.estimatedCost}`);
    console.log(`   Quality: ${results.modelRouter.data?.estimatedQuality}`);
  } else {
    console.log(`🧠 Model Router: ❌ FAILED (${results.modelRouter?.error || 'Unknown error'})`);
  }
  
  if (results.smartExtract && results.smartExtract.success) {
    console.log(`🔍 Smart Extract: ✅ SUCCESS (${results.smartExtract.duration}ms)`);
    console.log(`   API: ${results.smartExtract.data?.name}`);
    console.log(`   Speed: ${results.smartExtract.data?.methods?.knowledge_graph?.speed}`);
    console.log(`   Accuracy: ${results.smartExtract.data?.methods?.knowledge_graph?.accuracy}`);
  } else {
    console.log(`🔍 Smart Extract: ❌ FAILED (${results.smartExtract?.error || 'Unknown error'})`);
  }
  
  if (results.unifiedSearch && results.unifiedSearch.success) {
    console.log(`🔎 Unified Search: ✅ SUCCESS (${results.unifiedSearch.duration}ms)`);
    console.log(`   Results: ${results.unifiedSearch.data?.totalResults}`);
    console.log(`   Sources: ${results.unifiedSearch.data?.sources}`);
    console.log(`   Strategy: ${results.unifiedSearch.data?.mergeStrategy}`);
  } else {
    console.log(`🔎 Unified Search: ❌ FAILED (${results.unifiedSearch?.error || 'Unknown error'})`);
  }
  
  // Business Value Assessment
  console.log("\n💼 BUSINESS VALUE ASSESSMENT");
  console.log("-" * 60);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL CORE SYSTEMS WORKING! PERMUTATION is ready for business.");
    console.log("✅ Intelligent model routing for cost optimization");
    console.log("✅ Smart data extraction for market research");
    console.log("✅ Unified search for comprehensive market data");
    console.log("✅ Ready for insurance/estate valuation applications");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some systems working, others need fixes.");
    console.log("🔧 Next steps: Fix failed systems, optimize working ones");
  } else {
    console.log("❌ ALL SYSTEMS FAILED: PERMUTATION needs significant work.");
    console.log("🚨 Next steps: Debug all systems, check configurations");
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  runPermutationCapabilitiesTest()
    .then(results => {
      console.log("\n🏁 PERMUTATION Capabilities Test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Test failed with error:", error);
      process.exit(1);
    });
}

module.exports = {
  testModelRouter,
  testSmartExtract,
  testUnifiedSearch,
  runPermutationCapabilitiesTest
};
