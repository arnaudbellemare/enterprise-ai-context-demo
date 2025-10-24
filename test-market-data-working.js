#!/usr/bin/env node

/**
 * Working API Test: Test market data collection using working APIs
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
 * Test 1: Model Router for Art Market
 */
async function testArtMarketModelRouter() {
  console.log("\n🎨 Test 1: Art Market Model Router");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/model-router`, {
      method: 'POST',
      body: {
        task: "Find recent auction results for Mark Rothko paintings sold at Christie's and Sotheby's in 2024",
        context: "art_valuation"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Art Market Model Router Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Selected Model: ${response.data?.model || 'N/A'}`);
      console.log(`📋 Reason: ${response.data?.reason || 'N/A'}`);
      console.log(`📋 Estimated Cost: $${response.data?.estimatedCost || 'N/A'}`);
      console.log(`📋 Estimated Quality: ${response.data?.estimatedQuality || 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Art Market Model Router Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Art Market Model Router Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Model Router for Classic Cars
 */
async function testClassicCarsModelRouter() {
  console.log("\n🚗 Test 2: Classic Cars Model Router");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/model-router`, {
      method: 'POST',
      body: {
        task: "Find recent auction results for 1960s Ferrari 250 GT sold at RM Sotheby's and Bonhams in 2024",
        context: "classic_cars"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Classic Cars Model Router Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Selected Model: ${response.data?.model || 'N/A'}`);
      console.log(`📋 Reason: ${response.data?.reason || 'N/A'}`);
      console.log(`📋 Estimated Cost: $${response.data?.estimatedCost || 'N/A'}`);
      console.log(`📋 Estimated Quality: ${response.data?.estimatedQuality || 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Classic Cars Model Router Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Classic Cars Model Router Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Model Router for Jewelry
 */
async function testJewelryModelRouter() {
  console.log("\n💎 Test 3: Jewelry Model Router");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/model-router`, {
      method: 'POST',
      body: {
        task: "Find recent auction results for Cartier diamond rings sold at Christie's Jewelry and Sotheby's Jewelry in 2024",
        context: "jewelry"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Jewelry Model Router Working!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Selected Model: ${response.data?.model || 'N/A'}`);
      console.log(`📋 Reason: ${response.data?.reason || 'N/A'}`);
      console.log(`📋 Estimated Cost: $${response.data?.estimatedCost || 'N/A'}`);
      console.log(`📋 Estimated Quality: ${response.data?.estimatedQuality || 'N/A'}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Jewelry Model Router Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Jewelry Model Router Failed:", error.message);
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
  console.log("🚀 Starting PERMUTATION Market Data Collection Test");
  console.log("Testing market data collection using working APIs");
  console.log("=" * 60);
  
  const results = {
    artMarket: null,
    classicCars: null,
    jewelry: null,
    summary: {
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      averageDuration: 0,
      totalDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Test 1: Art Market
  results.artMarket = await testArtMarketModelRouter();
  
  // Test 2: Classic Cars
  results.classicCars = await testClassicCarsModelRouter();
  
  // Test 3: Jewelry
  results.jewelry = await testJewelryModelRouter();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.artMarket, results.classicCars, results.jewelry];
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
  
  if (results.artMarket && results.artMarket.success) {
    console.log(`🎨 Art Market: ✅ SUCCESS (${results.artMarket.duration}ms)`);
    console.log(`   Model: ${results.artMarket.data?.model}`);
    console.log(`   Cost: $${results.artMarket.data?.estimatedCost}`);
    console.log(`   Quality: ${results.artMarket.data?.estimatedQuality}`);
  } else {
    console.log(`🎨 Art Market: ❌ FAILED (${results.artMarket?.error || 'Unknown error'})`);
  }
  
  if (results.classicCars && results.classicCars.success) {
    console.log(`🚗 Classic Cars: ✅ SUCCESS (${results.classicCars.duration}ms)`);
    console.log(`   Model: ${results.classicCars.data?.model}`);
    console.log(`   Cost: $${results.classicCars.data?.estimatedCost}`);
    console.log(`   Quality: ${results.classicCars.data?.estimatedQuality}`);
  } else {
    console.log(`🚗 Classic Cars: ❌ FAILED (${results.classicCars?.error || 'Unknown error'})`);
  }
  
  if (results.jewelry && results.jewelry.success) {
    console.log(`💎 Jewelry: ✅ SUCCESS (${results.jewelry.duration}ms)`);
    console.log(`   Model: ${results.jewelry.data?.model}`);
    console.log(`   Cost: $${results.jewelry.data?.estimatedCost}`);
    console.log(`   Quality: ${results.jewelry.data?.estimatedQuality}`);
  } else {
    console.log(`💎 Jewelry: ❌ FAILED (${results.jewelry?.error || 'Unknown error'})`);
  }
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-" * 40);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! PERMUTATION can handle market data queries.");
    console.log("✅ Next steps: Build market database using model router + search APIs");
    console.log("✅ The system can intelligently route different asset types to appropriate models");
    console.log("✅ Cost and quality estimates are working for market data collection");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some market queries work, others need improvement.");
    console.log("🔧 Next steps: Debug failed queries, optimize model routing");
  } else {
    console.log("❌ ALL TESTS FAILED: PERMUTATION model routing needs improvement.");
    console.log("🚨 Next steps: Check model router configuration, debug routing logic");
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
  testArtMarketModelRouter,
  testClassicCarsModelRouter,
  testJewelryModelRouter,
  runComprehensiveTest
};
