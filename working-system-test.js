#!/usr/bin/env node

/**
 * WORKING SYSTEM TEST
 * 
 * Tests the actual available endpoints in the system
 * Uses real API calls to verify functionality
 */

const TEST_QUERIES = [
  {
    query: "What is 2+2?",
    type: "math",
    expectedKeywords: ["4", "addition", "sum"]
  },
  {
    query: "What is the capital of France?",
    type: "general",
    expectedKeywords: ["paris", "france"]
  },
  {
    query: "Explain machine learning in simple terms",
    type: "technical",
    expectedKeywords: ["algorithm", "data", "learning", "computer"]
  },
  {
    query: "What are the benefits of investing in index funds?",
    type: "investment",
    expectedKeywords: ["diversification", "low cost", "market", "risk"]
  },
  {
    query: "How do you make a good cup of coffee?",
    type: "general",
    expectedKeywords: ["water", "beans", "grind", "brew"]
  }
];

function evaluateResponseQuality(response, expectedKeywords = []) {
  if (!response || typeof response !== 'string') {
    return 0;
  }

  const text = response.toLowerCase();
  const words = text.split(/\s+/).length;
  
  let qualityScore = 0;
  
  // Length factor (0-30 points)
  if (words >= 20) qualityScore += 30;
  else if (words >= 10) qualityScore += 20;
  else if (words >= 5) qualityScore += 10;
  
  // Keyword matching (0-40 points)
  if (expectedKeywords.length > 0) {
    const matchedKeywords = expectedKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length;
    qualityScore += (matchedKeywords / expectedKeywords.length) * 40;
  } else {
    qualityScore += 20; // Base score for any response
  }
  
  // Clarity and structure (0-30 points)
  if (words >= 10 && !text.includes('error')) qualityScore += 30;
  else if (words >= 5) qualityScore += 20;
  else qualityScore += 10;
  
  return Math.min(qualityScore, 100) / 100;
}

async function testAnswerAPI(query, queryType) {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3002/api/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        queryType: queryType,
        autoSelectModel: true
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.answer || '';
    const quality = evaluateResponseQuality(answer);
    
    return {
      success: true,
      answer: answer,
      quality: quality,
      duration: duration,
      tokens: answer.split(' ').length,
      provider: data.provider || 'unknown',
      model: data.model || 'unknown',
      queryType: data.queryType || queryType
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      quality: 0,
      duration: 0,
      tokens: 0,
      provider: 'none',
      model: 'none'
    };
  }
}

async function testPermutationChat(query) {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3002/api/chat/permutation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }]
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.response || data.answer || '';
    const quality = evaluateResponseQuality(answer);
    
    return {
      success: true,
      answer: answer,
      quality: quality,
      duration: duration,
      tokens: answer.split(' ').length,
      componentsUsed: data.components_used || 0,
      teacher: data.teacher || 'none',
      domain: data.domain || 'unknown'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      quality: 0,
      duration: 0,
      tokens: 0,
      componentsUsed: 0,
      teacher: 'none',
      domain: 'unknown'
    };
  }
}

async function testSimpleEndpoint() {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3002/api/benchmark/test-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: 'basic functionality'
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: data.message || 'Test successful',
      duration: duration,
      timestamp: data.timestamp
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: 0
    };
  }
}

async function testAvailableModels() {
  try {
    const response = await fetch('http://localhost:3002/api/answer');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      models: data.models || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      models: []
    };
  }
}

async function runWorkingSystemTest() {
  console.log('🚀 WORKING SYSTEM TEST');
  console.log('======================');
  console.log('Testing actual available endpoints');
  console.log('======================\n');

  const results = {
    answerAPI: [],
    permutationChat: [],
    simpleEndpoint: null,
    availableModels: null,
    summary: {}
  };
  
  // Test 1: Available Models
  console.log('📋 Testing Available Models...');
  results.availableModels = await testAvailableModels();
  
  if (results.availableModels.success) {
    console.log(`✅ Found ${results.availableModels.models.length} available models:`);
    results.availableModels.models.forEach(model => {
      console.log(`   - ${model.name}: ${model.useCase} (${model.speed} speed)`);
    });
  } else {
    console.log(`❌ Failed to get models: ${results.availableModels.error}`);
  }
  console.log('');

  // Test 2: Simple Endpoint
  console.log('🧪 Testing Simple Endpoint...');
  results.simpleEndpoint = await testSimpleEndpoint();
  
  if (results.simpleEndpoint.success) {
    console.log(`✅ Simple endpoint works: ${results.simpleEndpoint.message}`);
    console.log(`   Duration: ${results.simpleEndpoint.duration}ms`);
  } else {
    console.log(`❌ Simple endpoint failed: ${results.simpleEndpoint.error}`);
  }
  console.log('');

  // Test 3: Answer API with different query types
  console.log('🎯 Testing Answer API...');
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const test = TEST_QUERIES[i];
    console.log(`   Test ${i + 1}/${TEST_QUERIES.length}: ${test.query}`);
    
    const result = await testAnswerAPI(test.query, test.type);
    results.answerAPI.push({ ...test, result });
    
    if (result.success) {
      console.log(`   ✅ Quality: ${(result.quality * 100).toFixed(1)}%, Duration: ${result.duration}ms`);
      console.log(`   Provider: ${result.provider}, Model: ${result.model}`);
      console.log(`   Answer: ${result.answer.substring(0, 100)}...`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    console.log('');
  }

  // Test 4: Permutation Chat
  console.log('🤖 Testing Permutation Chat...');
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const test = TEST_QUERIES[i];
    console.log(`   Test ${i + 1}/${TEST_QUERIES.length}: ${test.query}`);
    
    const result = await testPermutationChat(test.query);
    results.permutationChat.push({ ...test, result });
    
    if (result.success) {
      console.log(`   ✅ Quality: ${(result.quality * 100).toFixed(1)}%, Duration: ${result.duration}ms`);
      console.log(`   Components: ${result.componentsUsed}, Teacher: ${result.teacher}, Domain: ${result.domain}`);
      console.log(`   Answer: ${result.answer.substring(0, 100)}...`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    console.log('');
  }

  // Calculate Summary
  console.log('📊 TEST SUMMARY');
  console.log('================');
  
  const answerSuccessCount = results.answerAPI.filter(r => r.result.success).length;
  const permutationSuccessCount = results.permutationChat.filter(r => r.result.success).length;
  
  const answerAvgQuality = results.answerAPI
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.quality, 0) / answerSuccessCount || 0;
    
  const permutationAvgQuality = results.permutationChat
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.quality, 0) / permutationSuccessCount || 0;

  const answerAvgDuration = results.answerAPI
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.duration, 0) / answerSuccessCount || 0;
    
  const permutationAvgDuration = results.permutationChat
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.duration, 0) / permutationSuccessCount || 0;

  results.summary = {
    simpleEndpoint: results.simpleEndpoint.success,
    availableModels: results.availableModels.models?.length || 0,
    answerAPISuccess: `${answerSuccessCount}/${TEST_QUERIES.length}`,
    permutationChatSuccess: `${permutationSuccessCount}/${TEST_QUERIES.length}`,
    answerAvgQuality: (answerAvgQuality * 100).toFixed(1),
    permutationAvgQuality: (permutationAvgQuality * 100).toFixed(1),
    answerAvgDuration: (answerAvgDuration / 1000).toFixed(1),
    permutationAvgDuration: (permutationAvgDuration / 1000).toFixed(1)
  };

  console.log(`Simple Endpoint: ${results.summary.simpleEndpoint ? '✅ Working' : '❌ Failed'}`);
  console.log(`Available Models: ${results.summary.availableModels}`);
  console.log(`Answer API Success: ${results.summary.answerAPISuccess}`);
  console.log(`Permutation Chat Success: ${results.summary.permutationChatSuccess}`);
  console.log(`Answer API Avg Quality: ${results.summary.answerAvgQuality}%`);
  console.log(`Permutation Chat Avg Quality: ${results.summary.permutationAvgQuality}%`);
  console.log(`Answer API Avg Duration: ${results.summary.answerAvgDuration}s`);
  console.log(`Permutation Chat Avg Duration: ${results.summary.permutationAvgDuration}s`);

  // Detailed Results
  console.log('\n📋 DETAILED RESULTS');
  console.log('===================');
  
  console.log('\n🎯 Answer API Results:');
  results.answerAPI.forEach((test, index) => {
    console.log(`${index + 1}. ${test.query}`);
    if (test.result.success) {
      console.log(`   ✅ Quality: ${(test.result.quality * 100).toFixed(1)}%, Duration: ${test.result.duration}ms`);
      console.log(`   Provider: ${test.result.provider}, Model: ${test.result.model}`);
    } else {
      console.log(`   ❌ Error: ${test.result.error}`);
    }
  });

  console.log('\n🤖 Permutation Chat Results:');
  results.permutationChat.forEach((test, index) => {
    console.log(`${index + 1}. ${test.query}`);
    if (test.result.success) {
      console.log(`   ✅ Quality: ${(test.result.quality * 100).toFixed(1)}%, Duration: ${test.result.duration}ms`);
      console.log(`   Components: ${test.result.componentsUsed}, Teacher: ${test.result.teacher}`);
    } else {
      console.log(`   ❌ Error: ${test.result.error}`);
    }
  });

  console.log('\n🏁 WORKING SYSTEM TEST COMPLETED');
  console.log('=================================');
  
  // Overall assessment
  const overallSuccess = results.summary.simpleEndpoint && 
                        results.summary.answerAPISuccess.includes('/') && 
                        parseInt(results.summary.answerAPISuccess.split('/')[0]) > 0;
  
  if (overallSuccess) {
    console.log('🎉 SYSTEM IS WORKING! Key endpoints are functional.');
  } else {
    console.log('⚠️  SYSTEM HAS ISSUES. Some endpoints are not working properly.');
  }

  return results;
}

// Check if servers are running
async function checkServers() {
  console.log('🔍 Checking server status...');
  
  try {
    const response = await fetch('http://localhost:3002/api/benchmark/test-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'ping' })
    });
    if (response.ok) {
      console.log('✅ Frontend server (localhost:3002) is running');
    } else {
      console.log('❌ Frontend server is not responding');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend server is not running');
    return false;
  }

  return true;
}

// Main execution
async function main() {
  const serversOk = await checkServers();
  
  if (!serversOk) {
    console.log('\n❌ Cannot run test - frontend server not available');
    console.log('Please ensure the Next.js frontend is running on localhost:3002');
    console.log('Run: npm run dev (from the frontend directory)');
    process.exit(1);
  }

  await runWorkingSystemTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runWorkingSystemTest, TEST_QUERIES };
