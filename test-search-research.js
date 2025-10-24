#!/usr/bin/env node

/**
 * Search Research Test: Test PERMUTATION's search capabilities for market price research
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
 * Test 1: Search for Art Market Prices
 */
async function testArtMarketSearch() {
  console.log("\n🎨 Test 1: Art Market Price Search");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/search/unified`, {
      method: 'POST',
      body: {
        query: "Mark Rothko paintings auction results 2024 Christie's Sotheby's hammer prices",
        context: "art_valuation"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Art Market Search Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Results: ${response.data ? JSON.stringify(response.data, null, 2).substring(0, 800) + "..." : "No data"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Art Market Search Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Art Market Search Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Search for Classic Car Prices
 */
async function testClassicCarSearch() {
  console.log("\n🚗 Test 2: Classic Car Price Search");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/search/unified`, {
      method: 'POST',
      body: {
        query: "Ferrari 250 GT auction results 2024 RM Sotheby's Bonhams hammer prices",
        context: "classic_cars"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Classic Car Search Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Results: ${response.data ? JSON.stringify(response.data, null, 2).substring(0, 800) + "..." : "No data"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Classic Car Search Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Classic Car Search Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Search for Jewelry Prices
 */
async function testJewelrySearch() {
  console.log("\n💎 Test 3: Jewelry Price Search");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/search/unified`, {
      method: 'POST',
      body: {
        query: "Cartier diamond rings auction results 2024 Christie's Sotheby's hammer prices",
        context: "jewelry"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Jewelry Search Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Results: ${response.data ? JSON.stringify(response.data, null, 2).substring(0, 800) + "..." : "No data"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Jewelry Search Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Jewelry Search Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run Comprehensive Search Research Test
 */
async function runSearchResearchTest() {
  console.log("🚀 Starting PERMUTATION Search Research Test");
  console.log("Testing PERMUTATION's search capabilities for market price research");
  console.log("=" * 70);
  
  const results = {
    artSearch: null,
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
  
  // Test 1: Art Market Search
  results.artSearch = await testArtMarketSearch();
  
  // Test 2: Classic Car Search
  results.classicCars = await testClassicCarSearch();
  
  // Test 3: Jewelry Search
  results.jewelry = await testJewelrySearch();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.artSearch, results.classicCars, results.jewelry];
  const successfulTests = testResults.filter(r => r && r.success);
  
  results.summary.passedTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive summary
  console.log("\n📊 COMPREHENSIVE SEARCH RESEARCH RESULTS");
  console.log("=" * 70);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Test Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed results
  console.log("\n📋 DETAILED RESULTS");
  console.log("-" * 50);
  
  if (results.artSearch && results.artSearch.success) {
    console.log(`🎨 Art Search: ✅ SUCCESS (${results.artSearch.duration}ms)`);
    console.log(`   Data Quality: ${results.artSearch.data ? 'High' : 'Low'}`);
  } else {
    console.log(`🎨 Art Search: ❌ FAILED (${results.artSearch?.error || 'Unknown error'})`);
  }
  
  if (results.classicCars && results.classicCars.success) {
    console.log(`🚗 Classic Cars: ✅ SUCCESS (${results.classicCars.duration}ms)`);
    console.log(`   Data Quality: ${results.classicCars.data ? 'High' : 'Low'}`);
  } else {
    console.log(`🚗 Classic Cars: ❌ FAILED (${results.classicCars?.error || 'Unknown error'})`);
  }
  
  if (results.jewelry && results.jewelry.success) {
    console.log(`💎 Jewelry: ✅ SUCCESS (${results.jewelry.duration}ms)`);
    console.log(`   Data Quality: ${results.jewelry.data ? 'High' : 'Low'}`);
  } else {
    console.log(`💎 Jewelry: ❌ FAILED (${results.jewelry?.error || 'Unknown error'})`);
  }
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-" * 50);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! PERMUTATION search can find market prices!");
    console.log("✅ Next steps: Build automated market database using PERMUTATION search");
    console.log("✅ The system can search for auction results, hammer prices, and market trends");
    console.log("✅ Real-time market data collection is working for insurance/estate valuation");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some market price searches work, others need improvement.");
    console.log("🔧 Next steps: Debug failed searches, optimize search capabilities");
  } else {
    console.log("❌ ALL TESTS FAILED: PERMUTATION search needs improvement.");
    console.log("🚨 Next steps: Check search capabilities, debug external API connections");
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  runSearchResearchTest()
    .then(results => {
      console.log("\n🏁 Search Research Test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Test failed with error:", error);
      process.exit(1);
    });
}

module.exports = {
  testArtMarketSearch,
  testClassicCarSearch,
  testJewelrySearch,
  runSearchResearchTest
};
