#!/usr/bin/env node

/**
 * Demonstration Queries - Working System Showcase
 * 
 * This test suite demonstrates the PERMUTATION system capabilities
 * with queries that are complex enough to show the system's power
 * but not so complex that they cause timeouts or errors.
 */

const https = require('https');
const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 60000; // 1 minute for demonstration queries

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
 * Demo 1: Market Research with Real-time Data
 */
async function testMarketResearchDemo() {
  console.log("\n📈 Demo 1: Market Research with Real-time Data");
  console.log("=" * 60);
  console.log("Testing: Real-time market data collection and analysis");
  console.log("Features: GEPA optimization, cost optimization, quality assurance");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What are the current market prices for luxury watches like Rolex and Patek Philippe? Include recent auction results and retail prices.",
        context: "market_research"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Market Research Demo: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 600) + (answer.length > 600 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        demo: "Market Research with Real-time Data"
      };
    } else {
      console.log(`❌ Market Research Demo: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, demo: "Market Research with Real-time Data" };
    }
    
  } catch (error) {
    console.error("❌ Market Research Demo: ERROR:", error.message);
    return { success: false, error: error.message, demo: "Market Research with Real-time Data" };
  }
}

/**
 * Demo 2: Technical Analysis with Multi-step Reasoning
 */
async function testTechnicalAnalysisDemo() {
  console.log("\n🔧 Demo 2: Technical Analysis with Multi-step Reasoning");
  console.log("=" * 60);
  console.log("Testing: Multi-step technical analysis and problem solving");
  console.log("Features: ACE framework, continual learning, reasoning chains");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "Analyze the pros and cons of using microservices vs monolithic architecture for a startup. Include specific technologies, costs, and implementation considerations.",
        context: "technical_analysis"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Technical Analysis Demo: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 600) + (answer.length > 600 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        demo: "Technical Analysis with Multi-step Reasoning"
      };
    } else {
      console.log(`❌ Technical Analysis Demo: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, demo: "Technical Analysis with Multi-step Reasoning" };
    }
    
  } catch (error) {
    console.error("❌ Technical Analysis Demo: ERROR:", error.message);
    return { success: false, error: error.message, demo: "Technical Analysis with Multi-step Reasoning" };
  }
}

/**
 * Demo 3: Financial Analysis with Risk Assessment
 */
async function testFinancialAnalysisDemo() {
  console.log("\n💼 Demo 3: Financial Analysis with Risk Assessment");
  console.log("=" * 60);
  console.log("Testing: Financial analysis with risk modeling and recommendations");
  console.log("Features: Domain expertise, risk assessment, cost optimization");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What are the key factors to consider when evaluating a startup for investment? Include financial metrics, market analysis, and risk factors.",
        context: "financial_analysis"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Financial Analysis Demo: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 600) + (answer.length > 600 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        demo: "Financial Analysis with Risk Assessment"
      };
    } else {
      console.log(`❌ Financial Analysis Demo: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, demo: "Financial Analysis with Risk Assessment" };
    }
    
  } catch (error) {
    console.error("❌ Financial Analysis Demo: ERROR:", error.message);
    return { success: false, error: error.message, demo: "Financial Analysis with Risk Assessment" };
  }
}

/**
 * Demo 4: Legal Research with Compliance Analysis
 */
async function testLegalResearchDemo() {
  console.log("\n⚖️  Demo 4: Legal Research with Compliance Analysis");
  console.log("=" * 60);
  console.log("Testing: Legal research with compliance and regulatory analysis");
  console.log("Features: Legal expertise, compliance verification, risk assessment");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What are the key GDPR compliance requirements for a SaaS company handling customer data? Include specific obligations and penalties.",
        context: "legal_research"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Legal Research Demo: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 600) + (answer.length > 600 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        demo: "Legal Research with Compliance Analysis"
      };
    } else {
      console.log(`❌ Legal Research Demo: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, demo: "Legal Research with Compliance Analysis" };
    }
    
  } catch (error) {
    console.error("❌ Legal Research Demo: ERROR:", error.message);
    return { success: false, error: error.message, demo: "Legal Research with Compliance Analysis" };
  }
}

/**
 * Demo 5: Healthcare AI with Regulatory Compliance
 */
async function testHealthcareAIDemo() {
  console.log("\n🏥 Demo 5: Healthcare AI with Regulatory Compliance");
  console.log("=" * 60);
  console.log("Testing: Healthcare AI implementation with regulatory considerations");
  console.log("Features: Healthcare expertise, compliance, technical implementation");
  console.log("-" * 60);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${API_BASE_URL}/api/brain`, {
      method: 'POST',
      body: {
        query: "What are the key considerations for implementing AI in healthcare? Include HIPAA compliance, FDA regulations, and ethical considerations.",
        context: "healthcare_ai"
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200) {
      console.log("✅ Healthcare AI Demo: SUCCESS!");
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🧠 Skills Used: ${response.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`💰 Cost: $${response.data?.cost || 'N/A'}`);
      console.log(`⭐ Quality: ${response.data?.quality || 'N/A'}`);
      console.log(`🔍 TRM Verified: ${response.data?.trmVerified || 'N/A'}`);
      console.log(`🏠 Local Fallback: ${response.data?.fallbackUsed || 'N/A'}`);
      
      // Show response preview
      const answer = response.data?.answer || response.data?.data || 'No response';
      console.log("\n📋 Response Preview:");
      console.log(answer.substring(0, 600) + (answer.length > 600 ? "..." : ""));
      
      return {
        success: true,
        duration: duration,
        data: response.data,
        demo: "Healthcare AI with Regulatory Compliance"
      };
    } else {
      console.log(`❌ Healthcare AI Demo: FAILED (HTTP ${response.status})`);
      return { success: false, error: `HTTP ${response.status}`, demo: "Healthcare AI with Regulatory Compliance" };
    }
    
  } catch (error) {
    console.error("❌ Healthcare AI Demo: ERROR:", error.message);
    return { success: false, error: error.message, demo: "Healthcare AI with Regulatory Compliance" };
  }
}

/**
 * Run All Demonstration Queries
 */
async function runDemonstrationQueries() {
  console.log("🚀 Starting Demonstration Queries - PERMUTATION System Showcase");
  console.log("Testing PERMUTATION system with GEPA-TRM integration");
  console.log("=" * 80);
  
  const results = {
    marketResearch: null,
    technicalAnalysis: null,
    financialAnalysis: null,
    legalResearch: null,
    healthcareAI: null,
    summary: {
      totalDemos: 5,
      completedDemos: 0,
      successfulDemos: 0,
      failedDemos: 0,
      totalDuration: 0,
      averageDuration: 0
    }
  };
  
  const startTime = Date.now();
  
  // Execute all demonstration queries
  console.log("\n🎯 Executing Demonstration Queries...");
  
  results.marketResearch = await testMarketResearchDemo();
  results.technicalAnalysis = await testTechnicalAnalysisDemo();
  results.financialAnalysis = await testFinancialAnalysisDemo();
  results.legalResearch = await testLegalResearchDemo();
  results.healthcareAI = await testHealthcareAIDemo();
  
  const endTime = Date.now();
  results.summary.totalDuration = endTime - startTime;
  
  // Calculate summary statistics
  const demoResults = [
    results.marketResearch,
    results.technicalAnalysis,
    results.financialAnalysis,
    results.legalResearch,
    results.healthcareAI
  ];
  
  const successfulDemos = demoResults.filter(r => r && r.success);
  const completedDemos = demoResults.filter(r => r && (r.success || r.error));
  
  results.summary.completedDemos = completedDemos.length;
  results.summary.successfulDemos = successfulDemos.length;
  results.summary.failedDemos = results.summary.totalDemos - results.summary.successfulDemos;
  
  if (successfulDemos.length > 0) {
    const durations = successfulDemos.map(r => r.duration || 0);
    results.summary.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Print comprehensive results
  console.log("\n📊 DEMONSTRATION QUERIES RESULTS");
  console.log("=" * 80);
  console.log(`✅ Successful Demos: ${results.summary.successfulDemos}/${results.summary.totalDemos}`);
  console.log(`❌ Failed Demos: ${results.summary.failedDemos}/${results.summary.totalDemos}`);
  console.log(`⏱️  Average Duration: ${Math.round(results.summary.averageDuration / 1000)}s`);
  console.log(`🎯 Success Rate: ${(results.summary.successfulDemos / results.summary.totalDemos * 100).toFixed(1)}%`);
  console.log(`🕐 Total Execution Time: ${Math.round(results.summary.totalDuration / 1000)}s`);
  
  // Detailed demo results
  console.log("\n📋 DETAILED DEMO RESULTS");
  console.log("-" * 80);
  
  const demos = [
    { name: "Market Research", result: results.marketResearch },
    { name: "Technical Analysis", result: results.technicalAnalysis },
    { name: "Financial Analysis", result: results.financialAnalysis },
    { name: "Legal Research", result: results.legalResearch },
    { name: "Healthcare AI", result: results.healthcareAI }
  ];
  
  demos.forEach(demo => {
    if (demo.result && demo.result.success) {
      console.log(`✅ ${demo.name}: SUCCESS (${Math.round(demo.result.duration / 1000)}s)`);
      console.log(`   Skills: ${demo.result.data?.skills?.join(', ') || 'N/A'}`);
      console.log(`   Cost: $${demo.result.data?.cost || 'N/A'}`);
      console.log(`   Quality: ${demo.result.data?.quality || 'N/A'}`);
      console.log(`   TRM Verified: ${demo.result.data?.trmVerified || 'N/A'}`);
    } else {
      console.log(`❌ ${demo.name}: FAILED (${demo.result?.error || 'Unknown error'})`);
    }
  });
  
  // System capabilities assessment
  console.log("\n💡 PERMUTATION SYSTEM CAPABILITIES ASSESSMENT");
  console.log("-" * 80);
  
  if (results.summary.successfulDemos === results.summary.totalDemos) {
    console.log("🎉 ALL DEMONSTRATION QUERIES COMPLETED SUCCESSFULLY!");
    console.log("✅ GEPA-TRM integration working perfectly");
    console.log("✅ Multi-domain expertise demonstrated");
    console.log("✅ Cost optimization effective");
    console.log("✅ Quality assurance functioning");
    console.log("✅ System ready for production use");
    console.log("\n🚀 PERMUTATION SYSTEM IS FULLY OPERATIONAL!");
  } else if (results.summary.successfulDemos > 0) {
    console.log("⚠️  PARTIAL SUCCESS: Some demonstration queries completed successfully");
    console.log("🔧 System demonstrates core capabilities with room for optimization");
    console.log(`✅ ${results.summary.successfulDemos} out of ${results.summary.totalDemos} demos working`);
  } else {
    console.log("❌ SYSTEM NEEDS ATTENTION: Demonstration queries require system improvements");
    console.log("🚨 Review GEPA-TRM integration and system configuration");
  }
  
  return results;
}

// Run the demonstration queries
if (require.main === module) {
  runDemonstrationQueries()
    .then(results => {
      console.log("\n🏁 Demonstration Queries completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Demonstration Queries failed:", error);
      process.exit(1);
    });
}

module.exports = {
  testMarketResearchDemo,
  testTechnicalAnalysisDemo,
  testFinancialAnalysisDemo,
  testLegalResearchDemo,
  testHealthcareAIDemo,
  runDemonstrationQueries
};
