#!/usr/bin/env node

/**
 * Simple Test: PERMUTATION Market Data Collection
 * 
 * This test uses the existing API endpoints to test market data collection
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
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
 * Test 1: Art Market Data Collection
 */
async function testArtMarketData() {
  console.log("\n🎨 Test 1: Art Market Data Collection");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Find recent auction results for Mark Rothko paintings sold at Christie's and Sotheby's in 2024. Include hammer prices, estimates, sale dates, and artwork details.",
        context: "art_valuation"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Art Market Data Collected Successfully!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Results Preview: ${response.data?.response ? response.data.response.substring(0, 300) + '...' : 'N/A'}`);
      
      return {
        success: true,
        data: response.data?.response,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Art Market Test Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Art Market Test Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Classic Cars Market Data Collection
 */
async function testClassicCarsData() {
  console.log("\n🚗 Test 2: Classic Cars Market Data Collection");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Find recent auction results for 1960s Ferrari 250 GT sold at RM Sotheby's and Bonhams in 2024. Include hammer prices, estimates, vehicle conditions, mileage, and colors.",
        context: "classic_cars"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Classic Cars Data Collected Successfully!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Results Preview: ${response.data?.response ? response.data.response.substring(0, 300) + '...' : 'N/A'}`);
      
      return {
        success: true,
        data: response.data?.response,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Classic Cars Test Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Classic Cars Test Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Jewelry Market Data Collection
 */
async function testJewelryData() {
  console.log("\n💎 Test 3: Jewelry Market Data Collection");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Find recent auction results for Cartier diamond rings sold at Christie's Jewelry and Sotheby's Jewelry in 2024. Include hammer prices, estimates, diamond specifications, and ring conditions.",
        context: "jewelry"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Jewelry Data Collected Successfully!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Results Preview: ${response.data?.response ? response.data.response.substring(0, 300) + '...' : 'N/A'}`);
      
      return {
        success: true,
        data: response.data?.response,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Jewelry Test Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Jewelry Test Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test API Health
 */
async function testAPIHealth() {
  console.log("\n🏥 Testing API Health");
  console.log("-" * 40);
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/health`, {
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log("✅ API is healthy!");
      return true;
    } else {
      console.log(`❌ API health check failed: HTTP ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error("❌ API health check failed:", error.message);
    return false;
  }
}

/**
 * Run Comprehensive Test Suite
 */
async function runComprehensiveTest() {
  console.log("🚀 Starting PERMUTATION Market Data Collection Test");
  console.log("Testing market data collection via API endpoints");
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
  
  // Skip API health check and go directly to tests
  console.log("🚀 Starting tests directly...");
  
  // Test 1: Art Market
  results.artMarket = await testArtMarketData();
  
  // Test 2: Classic Cars
  results.classicCars = await testClassicCarsData();
  
  // Test 3: Jewelry
  results.jewelry = await testJewelryData();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.artMarket, results.classicCars, results.jewelry];
  const successfulTests = testResults.filter(r => r && r.success);
  
  results.summary.passedTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  
  if (successfulTests.length > 0) {
    const durations = testResults
      .filter(r => r && typeof r === 'object' && r.duration)
      .map(r => r.duration);
    
    if (durations.length > 0) {
      results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }
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
  } else {
    console.log(`🎨 Art Market: ❌ FAILED (${results.artMarket?.error || 'Unknown error'})`);
  }
  
  if (results.classicCars && results.classicCars.success) {
    console.log(`🚗 Classic Cars: ✅ SUCCESS (${results.classicCars.duration}ms)`);
  } else {
    console.log(`🚗 Classic Cars: ❌ FAILED (${results.classicCars?.error || 'Unknown error'})`);
  }
  
  if (results.jewelry && results.jewelry.success) {
    console.log(`💎 Jewelry: ✅ SUCCESS (${results.jewelry.duration}ms)`);
  } else {
    console.log(`💎 Jewelry: ❌ FAILED (${results.jewelry?.error || 'Unknown error'})`);
  }
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-" * 40);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! PERMUTATION is working for market data collection.");
    console.log("✅ Next steps: Scale up data collection, build market database");
  } else if (results.summary.passedTests > 1) {
    console.log("⚠️  PARTIAL SUCCESS: Some tests passed, others need improvement.");
    console.log("🔧 Next steps: Debug failed tests, improve query processing");
  } else {
    console.log("❌ MOST TESTS FAILED: PERMUTATION needs significant improvement.");
    console.log("🚨 Next steps: Debug system issues, check API endpoints");
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
  testArtMarketData,
  testClassicCarsData,
  testJewelryData,
  testAPIHealth,
  runComprehensiveTest
};
