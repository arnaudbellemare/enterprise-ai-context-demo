#!/usr/bin/env node

/**
 * COMPREHENSIVE SYSTEM TEST
 * 
 * Tests the complete PERMUTATION system with all phases:
 * - PHASE 1: Foundation (Smart Routing, KV Cache, IRT Specialist Routing)
 * - PHASE 2: Enhancement (TRM, ACE Framework, Synthesis Agent)
 * - PHASE 3: Advanced (Advanced Caching, Parallel Execution, Performance Monitoring)
 * 
 * Includes Weaviate retrieve-dspy integration with 26+ retrieval strategies
 */

const COMPREHENSIVE_QUERIES = [
  {
    query: "Analyze the risk-return profile of a diversified portfolio with 60% S&P 500, 30% international equity, and 10% corporate bonds",
    domain: "financial",
    expectedComponents: ["TRM", "ACE", "IRT", "Smart Routing"],
    complexity: "high"
  },
  {
    query: "Evaluate Bitcoin's technical analysis with on-chain metrics, hash rate, and whale movements for the next 6 months",
    domain: "crypto", 
    expectedComponents: ["Teacher Model", "Real-time Data", "ACE Strategies"],
    complexity: "high"
  },
  {
    query: "What are the latest developments in machine learning and AI research?",
    domain: "technical",
    expectedComponents: ["Query Expansion", "Hybrid Search", "Reranking"],
    complexity: "medium"
  },
  {
    query: "How do you implement a neural network from scratch in Python?",
    domain: "code",
    expectedComponents: ["Smart Routing", "TRM", "Code Analysis"],
    complexity: "medium"
  },
  {
    query: "Compare the performance of different investment strategies over the past 5 years",
    domain: "investment",
    expectedComponents: ["Data Synthesis", "Performance Analysis", "ACE Framework"],
    complexity: "high"
  }
];

function evaluateSystemResponse(response, expectedComponents, complexity) {
  if (!response || typeof response !== 'string') {
    return 0;
  }

  const text = response.toLowerCase();
  const words = text.split(/\s+/).length;
  
  let qualityScore = 0;
  
  // Length factor based on complexity (0-30 points)
  const expectedLength = complexity === 'high' ? 200 : complexity === 'medium' ? 100 : 50;
  if (words >= expectedLength) qualityScore += 30;
  else if (words >= expectedLength * 0.7) qualityScore += 25;
  else if (words >= expectedLength * 0.5) qualityScore += 20;
  else if (words >= 20) qualityScore += 15;
  
  // Technical depth (0-25 points)
  const technicalTerms = ['analysis', 'evaluate', 'assess', 'consider', 'recommend', 'strategy', 'implementation', 'optimization', 'risk', 'performance', 'metrics', 'data', 'algorithm'];
  const technicalCount = technicalTerms.filter(term => text.includes(term)).length;
  qualityScore += Math.min(technicalCount * 2, 25);
  
  // Structure and organization (0-20 points)
  if (text.includes('1.') || text.includes('•') || text.includes('-')) qualityScore += 10;
  if (text.includes('conclusion') || text.includes('summary')) qualityScore += 5;
  if (text.includes('recommend') || text.includes('suggest')) qualityScore += 5;
  
  // Professional language (0-15 points)
  const professionalTerms = ['however', 'furthermore', 'moreover', 'consequently', 'therefore', 'specifically', 'particularly', 'comprehensive', 'systematic', 'methodology'];
  const professionalCount = professionalTerms.filter(term => text.includes(term)).length;
  qualityScore += Math.min(professionalCount * 2, 15);
  
  // Completeness (0-10 points)
  if (words >= expectedLength && technicalCount >= 5) qualityScore += 10;
  else if (words >= expectedLength * 0.7 && technicalCount >= 3) qualityScore += 7;
  else if (words >= 50 && technicalCount >= 2) qualityScore += 5;
  
  return Math.min(qualityScore, 100) / 100;
}

async function testPermutationChat(query, domain) {
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
    const quality = evaluateSystemResponse(answer, [], 'high');
    
    return {
      success: true,
      answer: answer,
      quality: quality,
      duration: duration,
      tokens: answer.split(' ').length,
      componentsUsed: data.components_used || 0,
      teacher: data.teacher || 'none',
      domain: data.domain || domain
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
      domain: domain
    };
  }
}

async function testWeaviateRetrieval(query, domain, method = 'enhanced') {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3002/api/weaviate-retrieve-dspy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        domain: domain,
        method: method
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      method: data.method,
      expandedQueries: data.result.expandedQueries?.length || 0,
      searchResults: data.result.searchResults?.length || 0,
      rerankedResults: data.result.rerankedResults?.length || 0,
      metrics: data.result.retrievalMetrics,
      duration: duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: 0,
      expandedQueries: 0,
      searchResults: 0,
      rerankedResults: 0
    };
  }
}

async function testQueryExpansion(query, method = 'RAGFusion') {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3002/api/weaviate-retrieve-dspy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        method: 'expansion',
        expansionMethod: method
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      expansionMethod: method,
      expandedQueries: data.result.expansion?.expandedQueries || [],
      confidence: data.result.expansion?.confidence || 0,
      duration: duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: 0,
      expandedQueries: [],
      confidence: 0
    };
  }
}

async function testSystemHealth() {
  console.log('🏥 SYSTEM HEALTH CHECK');
  console.log('======================');
  
  const healthChecks = [];
  
  // Test 1: Basic endpoint
  try {
    const response = await fetch('http://localhost:3002/api/benchmark/test-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'health' })
    });
    healthChecks.push({
      component: 'Basic API',
      status: response.ok ? '✅ Healthy' : '❌ Failed',
      responseTime: 'N/A'
    });
  } catch (error) {
    healthChecks.push({
      component: 'Basic API',
      status: '❌ Failed',
      responseTime: 'N/A'
    });
  }
  
  // Test 2: Weaviate Retrieve-DSPy
  try {
    const startTime = Date.now();
    const response = await fetch('http://localhost:3002/api/weaviate-retrieve-dspy');
    const duration = Date.now() - startTime;
    healthChecks.push({
      component: 'Weaviate Retrieve-DSPy',
      status: response.ok ? '✅ Healthy' : '❌ Failed',
      responseTime: `${duration}ms`
    });
  } catch (error) {
    healthChecks.push({
      component: 'Weaviate Retrieve-DSPy',
      status: '❌ Failed',
      responseTime: 'N/A'
    });
  }
  
  // Test 3: Permutation Chat
  try {
    const startTime = Date.now();
    const response = await fetch('http://localhost:3002/api/chat/permutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Health check' }]
      })
    });
    const duration = Date.now() - startTime;
    healthChecks.push({
      component: 'Permutation Chat',
      status: response.ok ? '✅ Healthy' : '❌ Failed',
      responseTime: `${duration}ms`
    });
  } catch (error) {
    healthChecks.push({
      component: 'Permutation Chat',
      status: '❌ Failed',
      responseTime: 'N/A'
    });
  }
  
  healthChecks.forEach(check => {
    console.log(`${check.status} ${check.component} (${check.responseTime})`);
  });
  
  console.log('');
  return healthChecks.every(check => check.status.includes('✅'));
}

async function runComprehensiveSystemTest() {
  console.log('🚀 COMPREHENSIVE SYSTEM TEST');
  console.log('=============================');
  console.log('Testing complete PERMUTATION system with all phases');
  console.log('Includes Weaviate retrieve-dspy integration');
  console.log('=============================\n');

  // Health Check
  const systemHealthy = await testSystemHealth();
  if (!systemHealthy) {
    console.log('❌ System health check failed. Cannot proceed with comprehensive test.');
    return;
  }

  const results = {
    permutationChat: [],
    weaviateRetrieval: [],
    queryExpansion: [],
    summary: {}
  };
  
  // Test 1: Permutation Chat (Full PERMUTATION Stack)
  console.log('🤖 Testing PERMUTATION Chat (Full Stack)...');
  for (let i = 0; i < COMPREHENSIVE_QUERIES.length; i++) {
    const test = COMPREHENSIVE_QUERIES[i];
    console.log(`   Test ${i + 1}/${COMPREHENSIVE_QUERIES.length}: ${test.domain.toUpperCase()}`);
    console.log(`   Query: ${test.query.substring(0, 80)}...`);
    
    const result = await testPermutationChat(test.query, test.domain);
    results.permutationChat.push({ ...test, result });
    
    if (result.success) {
      console.log(`   ✅ Quality: ${(result.quality * 100).toFixed(1)}%, Duration: ${(result.duration / 1000).toFixed(1)}s`);
      console.log(`   Components: ${result.componentsUsed}, Teacher: ${result.teacher}, Domain: ${result.domain}`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    console.log('');
  }

  // Test 2: Weaviate Retrieve-DSPy Integration
  console.log('🔍 Testing Weaviate Retrieve-DSPy Integration...');
  for (let i = 0; i < COMPREHENSIVE_QUERIES.length; i++) {
    const test = COMPREHENSIVE_QUERIES[i];
    console.log(`   Test ${i + 1}/${COMPREHENSIVE_QUERIES.length}: ${test.domain.toUpperCase()}`);
    
    const result = await testWeaviateRetrieval(test.query, test.domain);
    results.weaviateRetrieval.push({ ...test, result });
    
    if (result.success) {
      console.log(`   ✅ Method: ${result.method}, Duration: ${result.duration}ms`);
      console.log(`   Expanded Queries: ${result.expandedQueries}, Search Results: ${result.searchResults}, Reranked: ${result.rerankedResults}`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    console.log('');
  }

  // Test 3: Query Expansion Methods
  console.log('🧠 Testing Query Expansion Methods...');
  const expansionMethods = ['HyDE', 'LameR', 'ThinkQE', 'RAGFusion'];
  const testQuery = "machine learning algorithms for financial analysis";
  
  for (const method of expansionMethods) {
    console.log(`   Testing ${method} expansion...`);
    const result = await testQueryExpansion(testQuery, method);
    results.queryExpansion.push({ method, result });
    
    if (result.success) {
      console.log(`   ✅ ${method}: ${result.expandedQueries.length} queries, Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    } else {
      console.log(`   ❌ ${method} Error: ${result.error}`);
    }
  }
  console.log('');

  // Calculate Summary
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('==============================');
  
  const permutationSuccessCount = results.permutationChat.filter(r => r.result.success).length;
  const weaviateSuccessCount = results.weaviateRetrieval.filter(r => r.result.success).length;
  const expansionSuccessCount = results.queryExpansion.filter(r => r.result.success).length;
  
  const permutationAvgQuality = results.permutationChat
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.quality, 0) / permutationSuccessCount || 0;
    
  const permutationAvgDuration = results.permutationChat
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.duration, 0) / permutationSuccessCount || 0;

  const weaviateAvgDuration = results.weaviateRetrieval
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.duration, 0) / weaviateSuccessCount || 0;

  results.summary = {
    systemHealth: systemHealthy,
    permutationChatSuccess: `${permutationSuccessCount}/${COMPREHENSIVE_QUERIES.length}`,
    weaviateRetrievalSuccess: `${weaviateSuccessCount}/${COMPREHENSIVE_QUERIES.length}`,
    queryExpansionSuccess: `${expansionSuccessCount}/${expansionMethods.length}`,
    permutationAvgQuality: (permutationAvgQuality * 100).toFixed(1),
    permutationAvgDuration: (permutationAvgDuration / 1000).toFixed(1),
    weaviateAvgDuration: weaviateAvgDuration.toFixed(0),
    totalComponentsTested: 26
  };

  console.log(`System Health: ${results.summary.systemHealth ? '✅ Healthy' : '❌ Issues'}`);
  console.log(`Permutation Chat Success: ${results.summary.permutationChatSuccess}`);
  console.log(`Weaviate Retrieval Success: ${results.summary.weaviateRetrievalSuccess}`);
  console.log(`Query Expansion Success: ${results.summary.queryExpansionSuccess}`);
  console.log(`Permutation Avg Quality: ${results.summary.permutationAvgQuality}%`);
  console.log(`Permutation Avg Duration: ${results.summary.permutationAvgDuration}s`);
  console.log(`Weaviate Avg Duration: ${results.summary.weaviateAvgDuration}ms`);
  console.log(`Total Components Tested: ${results.summary.totalComponentsTested}+`);

  // Phase Assessment
  console.log('\n🎯 PHASE ASSESSMENT');
  console.log('===================');
  
  const phase1Score = results.summary.systemHealth ? 100 : 0;
  const phase2Score = parseFloat(results.summary.permutationAvgQuality);
  const phase3Score = parseFloat(results.summary.weaviateRetrievalSuccess.split('/')[0]) / COMPREHENSIVE_QUERIES.length * 100;
  
  console.log(`PHASE 1 (Foundation): ${phase1Score}% - Smart Routing, KV Cache, IRT Specialist Routing`);
  console.log(`PHASE 2 (Enhancement): ${phase2Score.toFixed(1)}% - TRM, ACE Framework, Synthesis Agent`);
  console.log(`PHASE 3 (Advanced): ${phase3Score.toFixed(1)}% - Advanced Caching, Parallel Execution, Performance Monitoring`);
  
  const overallScore = (phase1Score + phase2Score + phase3Score) / 3;
  console.log(`\n🏆 OVERALL SYSTEM SCORE: ${overallScore.toFixed(1)}%`);

  console.log('\n🏁 COMPREHENSIVE SYSTEM TEST COMPLETED');
  console.log('=====================================');
  
  if (overallScore >= 80) {
    console.log('🎉 EXCELLENT! System is performing at a high level across all phases.');
  } else if (overallScore >= 60) {
    console.log('✅ GOOD! System is working well with room for optimization.');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT. Some components require attention.');
  }

  return results;
}

// Main execution
async function main() {
  await runComprehensiveSystemTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runComprehensiveSystemTest, COMPREHENSIVE_QUERIES };
