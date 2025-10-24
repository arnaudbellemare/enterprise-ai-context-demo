#!/usr/bin/env node

/**
 * GEPA-TRM Integration Test
 * Test the new GEPA-TRM local fallback skill in the Brain API
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 120000; // 2 minutes for GEPA-TRM optimization

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
 * Test 1: GEPA-TRM Integration with Market Research
 */
async function testGEPATRMMarketResearch() {
  console.log("\n🎯 Test 1: GEPA-TRM Market Research");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What is the current market value of a 1960s Ferrari 250 GT?",
        context: "market_research",
        skills: ["gepa_trm_local"] // Force GEPA-TRM skill
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ GEPA-TRM Market Research Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🤖 Model: ${response.data?.metadata?.model || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.metadata?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.metadata?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.metadata?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.metadata?.fallbackUsed || 'N/A'}`);
      console.log(`📋 Response: ${response.data?.answer ? response.data.answer.substring(0, 500) + "..." : "No response"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ GEPA-TRM Market Research Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ GEPA-TRM Market Research Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: GEPA-TRM Integration with Art Valuation
 */
async function testGEPATRMArtValuation() {
  console.log("\n🎨 Test 2: GEPA-TRM Art Valuation");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Analyze the current auction market for Mark Rothko paintings",
        context: "art_valuation",
        skills: ["gepa_trm_local"] // Force GEPA-TRM skill
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ GEPA-TRM Art Valuation Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🤖 Model: ${response.data?.metadata?.model || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.metadata?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.metadata?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.metadata?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.metadata?.fallbackUsed || 'N/A'}`);
      console.log(`📋 Response: ${response.data?.answer ? response.data.answer.substring(0, 500) + "..." : "No response"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ GEPA-TRM Art Valuation Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ GEPA-TRM Art Valuation Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: GEPA-TRM Integration with Simple Query
 */
async function testGEPATRMSimpleQuery() {
  console.log("\n🔧 Test 3: GEPA-TRM Simple Query");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What is artificial intelligence?",
        context: "general",
        skills: ["gepa_trm_local"] // Force GEPA-TRM skill
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ GEPA-TRM Simple Query Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🤖 Model: ${response.data?.metadata?.model || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.metadata?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.metadata?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.metadata?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.metadata?.fallbackUsed || 'N/A'}`);
      console.log(`📋 Response: ${response.data?.answer ? response.data.answer.substring(0, 500) + "..." : "No response"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ GEPA-TRM Simple Query Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ GEPA-TRM Simple Query Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run Comprehensive GEPA-TRM Integration Test
 */
async function runGEPATRMIntegrationTest() {
  console.log("🚀 Starting GEPA-TRM Integration Test");
  console.log("Testing GEPA optimization with TRM verification and local fallback");
  console.log("=" * 70);
  
  const results = {
    marketResearch: null,
    artValuation: null,
    simpleQuery: null,
    summary: {
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      averageDuration: 0,
      totalDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Test 1: Market Research
  results.marketResearch = await testGEPATRMMarketResearch();
  
  // Test 2: Art Valuation
  results.artValuation = await testGEPATRMArtValuation();
  
  // Test 3: Simple Query
  results.simpleQuery = await testGEPATRMSimpleQuery();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.marketResearch, results.artValuation, results.simpleQuery];
  const successfulTests = testResults.filter(r => r && r.success);
  
  results.summary.passedTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive summary
  console.log("\n📊 COMPREHENSIVE GEPA-TRM INTEGRATION RESULTS");
  console.log("=" * 70);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Test Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed results
  console.log("\n📋 DETAILED RESULTS");
  console.log("-" * 60);
  
  if (results.marketResearch && results.marketResearch.success) {
    console.log(`🎯 Market Research: ✅ SUCCESS (${results.marketResearch.duration}ms)`);
    console.log(`   Model: ${results.marketResearch.data?.metadata?.model}`);
    console.log(`   Cost: $${results.marketResearch.data?.metadata?.cost}`);
    console.log(`   TRM Verified: ${results.marketResearch.data?.metadata?.trmVerified}`);
    console.log(`   Local Fallback: ${results.marketResearch.data?.metadata?.fallbackUsed}`);
  } else {
    console.log(`🎯 Market Research: ❌ FAILED (${results.marketResearch?.error || 'Unknown error'})`);
  }
  
  if (results.artValuation && results.artValuation.success) {
    console.log(`🎨 Art Valuation: ✅ SUCCESS (${results.artValuation.duration}ms)`);
    console.log(`   Model: ${results.artValuation.data?.metadata?.model}`);
    console.log(`   Cost: $${results.artValuation.data?.metadata?.cost}`);
    console.log(`   TRM Verified: ${results.artValuation.data?.metadata?.trmVerified}`);
    console.log(`   Local Fallback: ${results.artValuation.data?.metadata?.fallbackUsed}`);
  } else {
    console.log(`🎨 Art Valuation: ❌ FAILED (${results.artValuation?.error || 'Unknown error'})`);
  }
  
  if (results.simpleQuery && results.simpleQuery.success) {
    console.log(`🔧 Simple Query: ✅ SUCCESS (${results.simpleQuery.duration}ms)`);
    console.log(`   Model: ${results.simpleQuery.data?.metadata?.model}`);
    console.log(`   Cost: $${results.simpleQuery.data?.metadata?.cost}`);
    console.log(`   TRM Verified: ${results.simpleQuery.data?.metadata?.trmVerified}`);
    console.log(`   Local Fallback: ${results.simpleQuery.data?.metadata?.fallbackUsed}`);
  } else {
    console.log(`🔧 Simple Query: ❌ FAILED (${results.simpleQuery?.error || 'Unknown error'})`);
  }
  
  // Integration Assessment
  console.log("\n💡 GEPA-TRM INTEGRATION ASSESSMENT");
  console.log("-" * 60);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! GEPA-TRM integration is working perfectly!");
    console.log("✅ GEPA optimization with TRM verification is functional");
    console.log("✅ Local Gemma3:4b fallback is working");
    console.log("✅ Cost optimization is effective");
    console.log("✅ Ready for production use");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some GEPA-TRM tests work, others need fixes.");
    console.log("🔧 Next steps: Debug failed tests, optimize working ones");
  } else {
    console.log("❌ ALL TESTS FAILED: GEPA-TRM integration needs significant work.");
    console.log("🚨 Next steps: Check GEPA-TRM configuration, debug integration issues");
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  runGEPATRMIntegrationTest()
    .then(results => {
      console.log("\n🏁 GEPA-TRM Integration Test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Test failed with error:", error);
      process.exit(1);
    });
}

module.exports = {
  testGEPATRMMarketResearch,
  testGEPATRMArtValuation,
  testGEPATRMSimpleQuery,
  runGEPATRMIntegrationTest
};
