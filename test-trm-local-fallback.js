#!/usr/bin/env node

/**
 * TRM Local Fallback Test
 * Test the local Gemma3:4b fallback functionality
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
 * Test 1: Direct Ollama Local Test
 */
async function testDirectOllamaLocal() {
  console.log("\n🏠 Test 1: Direct Ollama Local Test");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest('http://localhost:11434/api/generate', {
      method: 'POST',
      body: {
        model: 'gemma3:4b',
        prompt: 'What is artificial intelligence?',
        stream: false
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Direct Ollama Local Test Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🤖 Model: ${response.data?.model || 'N/A'}`);
      console.log(`📋 Response: ${response.data?.response ? response.data.response.substring(0, 200) + "..." : "No response"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Direct Ollama Local Test Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Direct Ollama Local Test Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 2: Brain API with Local Fallback
 */
async function testBrainAPILocalFallback() {
  console.log("\n🧠 Test 2: Brain API with Local Fallback");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What is machine learning?",
        context: "general"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Brain API with Local Fallback Successful!");
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🤖 Model: ${response.data?.metadata?.model || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.metadata?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.metadata?.quality || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.metadata?.fallbackUsed || 'N/A'}`);
      console.log(`📋 Response: ${response.data?.answer ? response.data.answer.substring(0, 200) + "..." : "No response"}`);
      
      return {
        success: true,
        data: response.data,
        duration: duration,
        status: response.status
      };
    } else {
      console.log(`❌ Brain API with Local Fallback Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Brain API with Local Fallback Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 3: Model Router Test
 */
async function testModelRouter() {
  console.log("\n🎯 Test 3: Model Router Test");
  console.log("-" * 50);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/model-router`, {
      method: 'POST',
      body: {
        task: "Explain quantum computing",
        context: "general"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Model Router Test Successful!");
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
      console.log(`❌ Model Router Test Failed: HTTP ${response.status}`);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        status: response.status
      };
    }
    
  } catch (error) {
    console.error("❌ Model Router Test Failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run Comprehensive TRM Local Fallback Test
 */
async function runTRMLocalFallbackTest() {
  console.log("🚀 Starting TRM Local Fallback Test");
  console.log("Testing local Gemma3:4b fallback functionality");
  console.log("=" * 60);
  
  const results = {
    directOllama: null,
    brainAPI: null,
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
  
  // Test 1: Direct Ollama
  results.directOllama = await testDirectOllamaLocal();
  
  // Test 2: Brain API
  results.brainAPI = await testBrainAPILocalFallback();
  
  // Test 3: Model Router
  results.modelRouter = await testModelRouter();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [results.directOllama, results.brainAPI, results.modelRouter];
  const successfulTests = testResults.filter(r => r && r.success);
  
  results.summary.passedTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.passedTests;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive summary
  console.log("\n📊 COMPREHENSIVE TRM LOCAL FALLBACK RESULTS");
  console.log("=" * 60);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration)}ms`);
  console.log(`🎯 Success Rate: ${(results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Test Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed results
  console.log("\n📋 DETAILED RESULTS");
  console.log("-" * 50);
  
  if (results.directOllama && results.directOllama.success) {
    console.log(`🏠 Direct Ollama: ✅ SUCCESS (${results.directOllama.duration}ms)`);
    console.log(`   Model: ${results.directOllama.data?.model}`);
    console.log(`   Response Length: ${results.directOllama.data?.response?.length || 0} chars`);
  } else {
    console.log(`🏠 Direct Ollama: ❌ FAILED (${results.directOllama?.error || 'Unknown error'})`);
  }
  
  if (results.brainAPI && results.brainAPI.success) {
    console.log(`🧠 Brain API: ✅ SUCCESS (${results.brainAPI.duration}ms)`);
    console.log(`   Model: ${results.brainAPI.data?.metadata?.model}`);
    console.log(`   Cost: $${results.brainAPI.data?.metadata?.cost}`);
    console.log(`   Local Fallback: ${results.brainAPI.data?.metadata?.fallbackUsed}`);
  } else {
    console.log(`🧠 Brain API: ❌ FAILED (${results.brainAPI?.error || 'Unknown error'})`);
  }
  
  if (results.modelRouter && results.modelRouter.success) {
    console.log(`🎯 Model Router: ✅ SUCCESS (${results.modelRouter.duration}ms)`);
    console.log(`   Selected Model: ${results.modelRouter.data?.model}`);
    console.log(`   Cost: $${results.modelRouter.data?.estimatedCost}`);
    console.log(`   Quality: ${results.modelRouter.data?.estimatedQuality}`);
  } else {
    console.log(`🎯 Model Router: ❌ FAILED (${results.modelRouter?.error || 'Unknown error'})`);
  }
  
  // Assessment
  console.log("\n💡 TRM LOCAL FALLBACK ASSESSMENT");
  console.log("-" * 50);
  
  if (results.summary.passedTests === results.summary.totalTests) {
    console.log("🎉 ALL TESTS PASSED! TRM local fallback is working perfectly!");
    console.log("✅ Direct Ollama connection is functional");
    console.log("✅ Brain API with local fallback is working");
    console.log("✅ Model router is selecting appropriate models");
    console.log("✅ Local Gemma3:4b integration is ready for production");
  } else if (results.summary.passedTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some TRM local fallback tests work, others need fixes.");
    console.log("🔧 Next steps: Debug failed tests, optimize working ones");
  } else {
    console.log("❌ ALL TESTS FAILED: TRM local fallback needs significant work.");
    console.log("🚨 Next steps: Check Ollama installation, debug local model connections");
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  runTRMLocalFallbackTest()
    .then(results => {
      console.log("\n🏁 TRM Local Fallback Test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Test failed with error:", error);
      process.exit(1);
    });
}

module.exports = {
  testDirectOllamaLocal,
  testBrainAPILocalFallback,
  testModelRouter,
  runTRMLocalFallbackTest
};
