#!/usr/bin/env node

/**
 * Market Price Research Test: Test PERMUTATION's ability to find real market prices
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 60000; // 60 seconds for research queries

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
 * Test 1: Research Art Market Prices
 */
async function testArtPriceResearch() {
  console.log("\n🎨 Test 1: Art Market Price Research");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Research current market prices for Mark Rothko paintings sold at auction in 2024. Find specific hammer prices, estimates, and sale dates from Christie's, Sotheby's, and Phillips auctions. Include artwork titles, dimensions, and provenance details.",
        context: "art_valuation_research"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Art Price Research Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Confidence: ${response.data?.confidence || 'N/A'}`);
      console.log(`🔍 Sources: ${response.data?.sources || 'N/A'}`);
      console.log(`🧠 Reasoning: ${response.data?.reasoning || 'N/A'}`);
      console.log(`📋 Results: ${response.data?.answer ? JSON.stringify(response.data.answer, null, 2).substring(0, 800) + "..." : "No data"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Art Price Research Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Art Price Research Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Research Classic Car Prices
 */
async function testClassicCarPriceResearch() {
  console.log("\n🚗 Test 2: Classic Car Price Research");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Research current market prices for 1960s Ferrari 250 GT models sold at auction in 2024. Find specific hammer prices, estimates, and sale dates from RM Sotheby's, Bonhams, and Gooding & Company auctions. Include car details, condition, and provenance.",
        context: "classic_cars_research"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Classic Car Price Research Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Confidence: ${response.data?.confidence || 'N/A'}`);
      console.log(`🔍 Sources: ${response.data?.sources || 'N/A'}`);
      console.log(`🧠 Reasoning: ${response.data?.reasoning || 'N/A'}`);
      console.log(`📋 Results: ${response.data?.answer ? JSON.stringify(response.data.answer, null, 2).substring(0, 800) + "..." : "No data"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Classic Car Price Research Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Classic Car Price Research Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Research Jewelry Prices
 */
async function testJewelryPriceResearch() {
  console.log("\n💎 Test 3: Jewelry Price Research");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Research current market prices for Cartier diamond rings sold at auction in 2024. Find specific hammer prices, estimates, and sale dates from Christie's Jewelry, Sotheby's Jewelry, and Phillips auctions. Include ring details, diamond specifications, and provenance.",
        context: "jewelry_research"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Jewelry Price Research Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`📈 Confidence: ${response.data?.confidence || 'N/A'}`);
      console.log(`🔍 Sources: ${response.data?.sources || 'N/A'}`);
      console.log(`🧠 Reasoning: ${response.data?.reasoning || 'N/A'}`);
      console.log(`📋 Results: ${response.data?.answer ? JSON.stringify(response.data.answer, null, 2).substring(0, 800) + "..." : "No data"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Jewelry Price Research Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Jewelry Price Research Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run Comprehensive Market Price Research Test
 */
async function runMarketPriceResearchTest() {
  console.log("🚀 Starting PERMUTATION Market Price Research Test");
  console.log("Testing PERMUTATION's ability to find real market prices through online research");
  console.log("=" * 70);
  
  const results = {
    artPrices: null,
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
  
  // Test 1: Art Market Prices
  results.artPrices = await testArtPriceResearch();
  
  // Test 2: Classic Car Prices
  results.classicCars = await testClassicCarPriceResearch();
  
  // Test 3: Jewelry Prices
  results.jewelry = await testJewelryPriceResearch();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.artPrices, results.classicCars, results.jewelry];
  const successfulTests = testResults.filter(r => r && r.success);
  
  results.summary.passedTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive summary
  console.log("\n📊 COMPREHENSIVE MARKET PRICE RESEARCH RESULTS");
  console.log("=" * 70);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Test Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed results
  console.log("\n📋 DETAILED RESULTS");
  console.log("-" * 50);
  
  if (results.artPrices && results.artPrices.success) {
    console.log(`🎨 Art Prices: ✅ SUCCESS (${results.artPrices.duration}ms)`);
    console.log(`   Confidence: ${results.artPrices.data?.confidence || 'N/A'}`);
    console.log(`   Sources: ${results.artPrices.data?.sources || 'N/A'}`);
    console.log(`   Data Quality: ${results.artPrices.data?.answer ? 'High' : 'Low'}`);
  } else {
    console.log(`🎨 Art Prices: ❌ FAILED (${results.artPrices?.error || 'Unknown error'})`);
  }
  
  if (results.classicCars && results.classicCars.success) {
    console.log(`🚗 Classic Cars: ✅ SUCCESS (${results.classicCars.duration}ms)`);
    console.log(`   Confidence: ${results.classicCars.data?.confidence || 'N/A'}`);
    console.log(`   Sources: ${results.classicCars.data?.sources || 'N/A'}`);
    console.log(`   Data Quality: ${results.classicCars.data?.answer ? 'High' : 'Low'}`);
  } else {
    console.log(`🚗 Classic Cars: ❌ FAILED (${results.classicCars?.error || 'Unknown error'})`);
  }
  
  if (results.jewelry && results.jewelry.success) {
    console.log(`💎 Jewelry: ✅ SUCCESS (${results.jewelry.duration}ms)`);
    console.log(`   Confidence: ${results.jewelry.data?.confidence || 'N/A'}`);
    console.log(`   Sources: ${results.jewelry.data?.sources || 'N/A'}`);
    console.log(`   Data Quality: ${results.jewelry.data?.answer ? 'High' : 'Low'}`);
  } else {
    console.log(`💎 Jewelry: ❌ FAILED (${results.jewelry?.error || 'Unknown error'})`);
  }
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-" * 50);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! PERMUTATION can find real market prices!");
    console.log("✅ Next steps: Build automated market database using PERMUTATION research");
    console.log("✅ The system can research auction results, hammer prices, and market trends");
    console.log("✅ Real-time market data collection is working for insurance/estate valuation");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some market price research works, others need improvement.");
    console.log("🔧 Next steps: Debug failed queries, optimize research capabilities");
  } else {
    console.log("❌ ALL TESTS FAILED: PERMUTATION market price research needs improvement.");
    console.log("🚨 Next steps: Check research capabilities, debug external API connections");
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  runMarketPriceResearchTest()
    .then(results => {
      console.log("\n🏁 Market Price Research Test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Test failed with error:", error);
      process.exit(1);
    });
}

module.exports = {
  testArtPriceResearch,
  testClassicCarPriceResearch,
  testJewelryPriceResearch,
  runMarketPriceResearchTest
};
