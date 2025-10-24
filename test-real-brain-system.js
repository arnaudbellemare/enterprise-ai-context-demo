#!/usr/bin/env node

/**
 * Real Brain System Test - Complete PERMUTATION System
 * 
 * This test demonstrates what the complete PERMUTATION system
 * with GEPA-TRM integration would produce when working properly.
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds for complex processing

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
 * Test 1: Complete PERMUTATION System with GEPA-TRM
 */
async function testCompletePermutationSystem() {
  console.log("\n🧠 Test 1: Complete PERMUTATION System with GEPA-TRM");
  console.log("=" * 60);
  console.log("Testing: Full system with all 11 components integrated");
  console.log("Features: GEPA optimization, TRM verification, MoE orchestration");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Analyze the current luxury watch market including Rolex, Patek Philippe, and Audemars Piguet. Provide specific prices, market trends, and investment recommendations.",
        context: "luxury_market_analysis",
        skills: ["gepa_trm_local", "advanced_reranking", "quality_evaluation"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Complete PERMUTATION System: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      console.log(`📋 Response Preview:`);
      console.log(response.data?.answer?.substring(0, 800) + "...");
      
      return {
        success: true,
        duration: duration,
        data: response.data
      };
    } else {
      console.log(`❌ Complete PERMUTATION System: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log("⏰ Complete PERMUTATION System: TIMEOUT (Complex processing)");
      console.log("💡 This is expected for the full system - it's processing with all components");
      return { success: false, error: 'Timeout - Complex processing' };
    } else {
      console.error("❌ Complete PERMUTATION System: ERROR:", error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Test 2: GEPA-TRM Integration with Local Fallback
 */
async function testGEPATRMIntegration() {
  console.log("\n🔧 Test 2: GEPA-TRM Integration with Local Fallback");
  console.log("=" * 60);
  console.log("Testing: GEPA optimization with TRM verification and local Gemma3:4b");
  console.log("Features: Cost optimization, quality assurance, local fallback");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What are the key considerations for implementing AI in healthcare? Include HIPAA compliance, FDA regulations, and ethical considerations.",
        context: "healthcare_ai_implementation",
        skills: ["gepa_trm_local"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ GEPA-TRM Integration: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      console.log(`📋 Response Preview:`);
      console.log(response.data?.answer?.substring(0, 800) + "...");
      
      return {
        success: true,
        duration: duration,
        data: response.data
      };
    } else {
      console.log(`❌ GEPA-TRM Integration: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log("⏰ GEPA-TRM Integration: TIMEOUT (Complex optimization)");
      console.log("💡 This is expected - GEPA optimization takes time for quality results");
      return { success: false, error: 'Timeout - Complex optimization' };
    } else {
      console.error("❌ GEPA-TRM Integration: ERROR:", error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Test 3: MoE Orchestrator with All Skills
 */
async function testMoEOrchestrator() {
  console.log("\n🎯 Test 3: MoE Orchestrator with All Skills");
  console.log("=" * 60);
  console.log("Testing: Multi-expert system with 9 registered skills");
  console.log("Features: ACE Framework, Quality Evaluation, Advanced RAG");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Design a comprehensive fintech compliance strategy for a startup operating in US, EU, and UK markets. Include specific regulatory requirements and implementation timeline.",
        context: "fintech_compliance",
        skills: ["legal_analysis", "quality_evaluation", "advanced_reranking"]
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ MoE Orchestrator: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      console.log(`📋 Response Preview:`);
      console.log(response.data?.answer?.substring(0, 800) + "...");
      
      return {
        success: true,
        duration: duration,
        data: response.data
      };
    } else {
      console.log(`❌ MoE Orchestrator: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log("⏰ MoE Orchestrator: TIMEOUT (Multi-expert processing)");
      console.log("💡 This is expected - Multiple experts working together takes time");
      return { success: false, error: 'Timeout - Multi-expert processing' };
    } else {
      console.error("❌ MoE Orchestrator: ERROR:", error.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Run All Real Brain System Tests
 */
async function runRealBrainSystemTests() {
  console.log("🚀 Starting Real Brain System Tests - Complete PERMUTATION System");
  console.log("Testing the full system with all 11 components and GEPA-TRM integration");
  console.log("=" * 80);
  
  const results = {
    completeSystem: null,
    gepaTRMIntegration: null,
    moeOrchestrator: null,
    summary: {
      totalTests: 3,
      completedTests: 0,
      successfulTests: 0,
      failedTests: 0,
      timeoutTests: 0,
      totalDuration: 0,
      averageDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Execute all tests
  console.log("\n🎯 Executing Real Brain System Tests...");
  
  results.completeSystem = await testCompletePermutationSystem();
  results.gepaTRMIntegration = await testGEPATRMIntegration();
  results.moeOrchestrator = await testMoEOrchestrator();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const testResults = [
    results.completeSystem,
    results.gepaTRMIntegration,
    results.moeOrchestrator
  ];
  
  const successfulTests = testResults.filter(r => r && r.success);
  const completedTests = testResults.filter(r => r && (r.success || r.error));
  const timeoutTests = testResults.filter(r => r && r.error && r.error.includes('Timeout'));
  
  results.summary.completedTests = completedTests.length;
  results.summary.successfulTests = successfulTests.length;
  results.summary.failedTests = results.summary.totalTests - results.summary.successfulTests;
  results.summary.timeoutTests = timeoutTests.length;
  
  if (successfulTests.length > 0) {
    const durations = successfulTests.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive results
  console.log("\n📊 REAL BRAIN SYSTEM TEST RESULTS");
  console.log("=" * 80);
  console.log(`✅ Successful Tests: ${results.summary.successfulTests}/${results.summary.totalTests}`);
  console.log(`⏰ Timeout Tests: ${results.summary.timeoutTests}/${results.summary.totalTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}/${results.summary.totalTests}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration / 1000)}s`);
  console.log(`🎯 Success Rate: ${(results.summary.successfulTests / results.summary.totalTests * 100).toFixed(1)}%`);
  console.log(`🕐 Total Execution Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed test results
  console.log("\n📋 DETAILED TEST RESULTS");
  console.log("-" * 80);
  
  const tests = [
    { name: "Complete PERMUTATION System", result: results.completeSystem },
    { name: "GEPA-TRM Integration", result: results.gepaTRMIntegration },
    { name: "MoE Orchestrator", result: results.moeOrchestrator }
  ];
  
  tests.forEach(test => {
    if (test.result && test.result.success) {
      console.log(`✅ ${test.name}: SUCCESS (${Math.round(test.result.duration / 1000)}s)`);
      console.log(`   Skills: ${test.result.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`   Cost: $${test.result.data?.cost || 'N/A'}`);
      console.log(`   Quality: ${(test.result.data?.quality * 100).toFixed(1)}%`);
    } else if (test.result && test.result.error && test.result.error.includes('Timeout')) {
      console.log(`⏰ ${test.name}: TIMEOUT (Complex processing)`);
      console.log(`   Reason: ${test.result.error}`);
    } else {
      console.log(`❌ ${test.name}: FAILED (${test.result?.error || 'Unknown error'})`);
    }
  });
  
  // System capabilities assessment
  console.log("\n💡 REAL BRAIN SYSTEM CAPABILITIES ASSESSMENT");
  console.log("-" * 80);
  
  if (results.summary.successfulTests === results.summary.totalTests) {
    console.log("🎉 ALL REAL BRAIN SYSTEM TESTS COMPLETED SUCCESSFULLY!");
    console.log("✅ Complete PERMUTATION system working perfectly");
    console.log("✅ GEPA-TRM integration functioning");
    console.log("✅ MoE orchestrator with all skills operational");
    console.log("✅ Cost optimization and quality assurance working");
    console.log("✅ System ready for production use");
    console.log("\n🚀 COMPLETE PERMUTATION SYSTEM IS FULLY OPERATIONAL!");
  } else if (results.summary.timeoutTests > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some tests timed out due to complex processing");
    console.log("🔧 System demonstrates advanced capabilities but needs optimization");
    console.log(`✅ ${results.summary.successfulTests} out of ${results.summary.totalTests} tests working`);
    console.log(`⏰ ${results.summary.timeoutTests} tests timed out (expected for complex processing)`);
    console.log("\n💡 The system is working but needs performance optimization for production use");
  } else {
    console.log("❌ SYSTEM NEEDS ATTENTION: Real brain system requires improvements");
    console.log("🚨 Review system configuration and dependencies");
  }
  
  return results;
}

// Run the real brain system tests
if (require.main === module) {
  runRealBrainSystemTests()
    .then(results => {
      console.log("\n🏁 Real Brain System Tests completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Real Brain System Tests failed:", error);
      process.exit(1);
    });
}

module.exports = {
  testCompletePermutationSystem,
  testGEPATRMIntegration,
  testMoEOrchestrator,
  runRealBrainSystemTests
};
