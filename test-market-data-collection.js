#!/usr/bin/env node

/**
 * Real Test: PERMUTATION + Perplexity Market Data Collection
 * 
 * This test will verify if PERMUTATION can actually collect real market data
 * using Perplexity for art, classic cars, and jewelry markets.
 */

const { PermutationEngine } = require('./frontend/lib/permutation-engine');

// Initialize PERMUTATION engine
const permutation = new PermutationEngine({
  enableTeacherModel: true,   // Use Perplexity for real-time data
  enableStudentModel: true,   // Fallback to Ollama
  enableMultiQuery: true,    // Generate multiple queries
  enableReasoningBank: true, // Use memory system
  enableIRT: true,           // Smart routing
  enableDSPy: true,          // Quality optimization
  enableACE: true,           // Adaptive prompting
  enableTRM: true,           // Verification
  enableSQL: false           // No SQL needed for this test
});

console.log("🧪 Starting PERMUTATION Market Data Collection Test...");
console.log("=" * 60);

/**
 * Test 1: Art Market Data Collection
 */
async function testArtMarketData() {
  console.log("\n🎨 Test 1: Art Market Data Collection");
  console.log("-" * 40);
  
  try {
    const startTime = Date.now();
    
    const result = await permutation.execute({
      query: "Find recent auction results for Mark Rothko paintings sold at Christie's and Sotheby's in 2024. Include hammer prices, estimates, sale dates, and artwork details.",
      domain: "art_valuation",
      context: {
        artist: "Mark Rothko",
        timeRange: "2024",
        auctionHouses: ["Christie's", "Sotheby's"],
        dataNeeded: ["hammer_prices", "estimates", "sale_dates", "artwork_details"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log("✅ Art Market Data Collected Successfully!");
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📈 Data Sources: ${result.sources ? result.sources.join(', ') : 'N/A'}`);
    console.log(`🔍 Reasoning: ${result.reasoning ? result.reasoning.substring(0, 200) + '...' : 'N/A'}`);
    console.log(`📋 Results Preview: ${result.answer ? result.answer.substring(0, 300) + '...' : 'N/A'}`);
    
    return {
      success: true,
      data: result.answer,
      confidence: result.confidence,
      sources: result.sources,
      reasoning: result.reasoning,
      duration: duration
    };
    
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
    
    const result = await permutation.execute({
      query: "Find recent auction results for 1960s Ferrari 250 GT sold at RM Sotheby's and Bonhams in 2024. Include hammer prices, estimates, vehicle conditions, mileage, and colors.",
      domain: "classic_cars",
      context: {
        vehicle: "Ferrari 250 GT",
        era: "1960s",
        timeRange: "2024",
        auctionHouses: ["RM Sotheby's", "Bonhams"],
        dataNeeded: ["hammer_prices", "estimates", "conditions", "mileage", "colors"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log("✅ Classic Cars Data Collected Successfully!");
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📈 Data Sources: ${result.sources ? result.sources.join(', ') : 'N/A'}`);
    console.log(`🔍 Reasoning: ${result.reasoning ? result.reasoning.substring(0, 200) + '...' : 'N/A'}`);
    console.log(`📋 Results Preview: ${result.answer ? result.answer.substring(0, 300) + '...' : 'N/A'}`);
    
    return {
      success: true,
      data: result.answer,
      confidence: result.confidence,
      sources: result.sources,
      reasoning: result.reasoning,
      duration: duration
    };
    
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
    
    const result = await permutation.execute({
      query: "Find recent auction results for Cartier diamond rings sold at Christie's Jewelry and Sotheby's Jewelry in 2024. Include hammer prices, estimates, diamond specifications, and ring conditions.",
      domain: "jewelry",
      context: {
        brand: "Cartier",
        item: "diamond rings",
        timeRange: "2024",
        auctionHouses: ["Christie's Jewelry", "Sotheby's Jewelry"],
        dataNeeded: ["hammer_prices", "estimates", "diamond_specs", "conditions"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log("✅ Jewelry Data Collected Successfully!");
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📈 Data Sources: ${result.sources ? result.sources.join(', ') : 'N/A'}`);
    console.log(`🔍 Reasoning: ${result.reasoning ? result.reasoning.substring(0, 200) + '...' : 'N/A'}`);
    console.log(`📋 Results Preview: ${result.answer ? result.answer.substring(0, 300) + '...' : 'N/A'}`);
    
    return {
      success: true,
      data: result.answer,
      confidence: result.confidence,
      sources: result.sources,
      reasoning: result.reasoning,
      duration: duration
    };
    
  } catch (error) {
    console.error("❌ Jewelry Test Failed:", error.message);
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
  console.log("🚀 Starting Comprehensive Market Data Test...");
  console.log("Testing PERMUTATION + Perplexity for real market data collection");
  console.log("=" * 60);
  
  const results = {
    artMarket: null,
    classicCars: null,
    jewelry: null,
    summary: {
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      averageConfidence: 0,
      averageDuration: 0,
      totalDuration: 0
    }
  };
  
  const startTime = Date.now();
  
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
    const confidences = successfulTests.map(r => r.confidence || 0);
    const durations = successfulTests.map(r => r.duration || 0);
    
    results.summary.averageConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive summary
  console.log("\n📊 COMPREHENSIVE TEST RESULTS");
  console.log("=" * 60);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`📈 Average Confidence: ${(results.summary.averageConfidence * 100).toFixed(1)}%`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Test Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed results
  console.log("\n📋 DETAILED RESULTS");
  console.log("-" * 40);
  
  if (results.artMarket && results.artMarket.success) {
    console.log(`🎨 Art Market: ✅ SUCCESS (${(results.artMarket.confidence * 100).toFixed(1)}% confidence, ${results.artMarket.duration}ms)`);
  } else {
    console.log(`🎨 Art Market: ❌ FAILED (${results.artMarket?.error || 'Unknown error'})`);
  }
  
  if (results.classicCars && results.classicCars.success) {
    console.log(`🚗 Classic Cars: ✅ SUCCESS (${(results.classicCars.confidence * 100).toFixed(1)}% confidence, ${results.classicCars.duration}ms)`);
  } else {
    console.log(`🚗 Classic Cars: ❌ FAILED (${results.classicCars?.error || 'Unknown error'})`);
  }
  
  if (results.jewelry && results.jewelry.success) {
    console.log(`💎 Jewelry: ✅ SUCCESS (${(results.jewelry.confidence * 100).toFixed(1)}% confidence, ${results.jewelry.duration}ms)`);
  } else {
    console.log(`💎 Jewelry: ❌ FAILED (${results.jewelry?.error || 'Unknown error'})`);
  }
  
  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("-" * 40);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! PERMUTATION is ready for market data collection.");
    console.log("✅ Next steps: Scale up data collection, build market database");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some tests passed, others need improvement.");
    console.log("🔧 Next steps: Debug failed tests, improve query generation");
  } else {
    console.log("❌ ALL TESTS FAILED: PERMUTATION needs significant improvement.");
    console.log("🚨 Next steps: Debug system issues, check Perplexity integration");
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
  runComprehensiveTest
};
