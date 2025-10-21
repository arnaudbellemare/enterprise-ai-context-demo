#!/usr/bin/env node

/**
 * TEST COMPLEX QUERIES
 * 
 * Tests the fixed complex query handling
 */

const COMPLEX_QUERIES = [
  {
    domain: "financial",
    query: "Analyze the risk-return profile of a diversified portfolio consisting of 60% S&P 500 index funds, 30% international equity funds, and 10% corporate bonds. Consider the impact of inflation, interest rate changes, and market volatility over a 10-year investment horizon.",
    expected_complexity: "high"
  },
  {
    domain: "crypto", 
    query: "Evaluate the technical and fundamental analysis of Bitcoin's current market position. Analyze on-chain metrics including active addresses, transaction volume, hash rate, and whale movements.",
    expected_complexity: "high"
  }
];

function evaluateResponseQuality(response) {
  if (!response || typeof response !== 'string') {
    return 0;
  }

  const text = response.toLowerCase();
  const words = text.split(/\s+/).length;
  
  let qualityScore = 0;
  
  // Length factor (0-30 points)
  if (words >= 200) qualityScore += 30;
  else if (words >= 100) qualityScore += 20;
  else if (words >= 50) qualityScore += 10;
  
  // Technical depth (0-25 points)
  const technicalTerms = ['analysis', 'evaluate', 'assess', 'consider', 'recommend', 'strategy', 'implementation', 'optimization', 'risk', 'performance'];
  const technicalCount = technicalTerms.filter(term => text.includes(term)).length;
  qualityScore += Math.min(technicalCount * 2.5, 25);
  
  // Structure and organization (0-20 points)
  if (text.includes('1.') || text.includes('•') || text.includes('-')) qualityScore += 10;
  if (text.includes('conclusion') || text.includes('summary')) qualityScore += 5;
  if (text.includes('recommend') || text.includes('suggest')) qualityScore += 5;
  
  // Professional language (0-15 points)
  const professionalTerms = ['however', 'furthermore', 'moreover', 'consequently', 'therefore', 'specifically', 'particularly', 'comprehensive', 'systematic'];
  const professionalCount = professionalTerms.filter(term => text.includes(term)).length;
  qualityScore += Math.min(professionalCount * 2, 15);
  
  // Completeness (0-10 points)
  if (words >= 150 && technicalCount >= 5) qualityScore += 10;
  else if (words >= 100 && technicalCount >= 3) qualityScore += 7;
  else if (words >= 50 && technicalCount >= 2) qualityScore += 5;
  
  return Math.min(qualityScore, 100) / 100;
}

async function testPermutationAPI(query) {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/chat/permutation', {
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
    const answer = data.answer || data.response || '';
    const quality = evaluateResponseQuality(answer);
    
    return {
      success: true,
      answer: answer,
      quality: quality,
      duration: duration,
      tokens: answer.split(' ').length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      quality: 0,
      duration: 0,
      tokens: 0
    };
  }
}

async function testOllamaBaseline(query) {
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:4b',
        messages: [{ role: 'user', content: query }],
        stream: false
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.message?.content || data.response || '';
    const quality = evaluateResponseQuality(answer);
    
    return {
      success: true,
      answer: answer,
      quality: quality,
      duration: duration,
      tokens: answer.split(' ').length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      quality: 0,
      duration: 0,
      tokens: 0
    };
  }
}

async function runComplexQueryTest() {
  console.log('🚀 TESTING COMPLEX QUERY FIXES');
  console.log('================================');
  console.log('Testing fixed complex query handling');
  console.log('================================\n');

  const results = [];
  
  for (let i = 0; i < COMPLEX_QUERIES.length; i++) {
    const test = COMPLEX_QUERIES[i];
    console.log(`📊 Test ${i + 1}/${COMPLEX_QUERIES.length}: ${test.domain.toUpperCase()}`);
    console.log(`Query: ${test.query.substring(0, 100)}...`);
    console.log('');

    // Test PERMUTATION
    console.log('🤖 Testing PERMUTATION system...');
    const permutationResult = await testPermutationAPI(test.query);
    
    if (permutationResult.success) {
      console.log(`✅ PERMUTATION: Quality=${(permutationResult.quality * 100).toFixed(1)}%, Duration=${(permutationResult.duration / 1000).toFixed(1)}s, Tokens=${permutationResult.tokens}`);
    } else {
      console.log(`❌ PERMUTATION ERROR: ${permutationResult.error}`);
    }

    // Test Baseline
    console.log('🔵 Testing Ollama baseline...');
    const baselineResult = await testOllamaBaseline(test.query);
    
    if (baselineResult.success) {
      console.log(`✅ BASELINE: Quality=${(baselineResult.quality * 100).toFixed(1)}%, Duration=${(baselineResult.duration / 1000).toFixed(1)}s, Tokens=${baselineResult.tokens}`);
    } else {
      console.log(`❌ BASELINE ERROR: ${baselineResult.error}`);
    }

    // Calculate improvement
    if (permutationResult.success && baselineResult.success) {
      const improvement = ((permutationResult.quality - baselineResult.quality) / baselineResult.quality * 100).toFixed(1);
      console.log(`📈 Improvement: ${improvement > 0 ? '+' : ''}${improvement}%`);
      
      results.push({
        domain: test.domain,
        query: test.query,
        permutation: {
          quality: permutationResult.quality,
          duration: permutationResult.duration,
          tokens: permutationResult.tokens
        },
        baseline: {
          quality: baselineResult.quality,
          duration: baselineResult.duration,
          tokens: baselineResult.tokens
        },
        improvement: parseFloat(improvement)
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  // Summary
  if (results.length > 0) {
    const avgPermutationQuality = results.reduce((sum, r) => sum + r.permutation.quality, 0) / results.length;
    const avgBaselineQuality = results.reduce((sum, r) => sum + r.baseline.quality, 0) / results.length;
    const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
    const avgPermutationDuration = results.reduce((sum, r) => sum + r.permutation.duration, 0) / results.length;
    const avgBaselineDuration = results.reduce((sum, r) => sum + r.baseline.duration, 0) / results.length;

    console.log('📊 COMPLEX QUERY TEST SUMMARY');
    console.log('==============================');
    console.log(`Tests Completed: ${results.length}/${COMPLEX_QUERIES.length}`);
    console.log(`Average PERMUTATION Quality: ${(avgPermutationQuality * 100).toFixed(1)}%`);
    console.log(`Average Baseline Quality: ${(avgBaselineQuality * 100).toFixed(1)}%`);
    console.log(`Average Improvement: ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(1)}%`);
    console.log(`Average PERMUTATION Duration: ${(avgPermutationDuration / 1000).toFixed(1)}s`);
    console.log(`Average Baseline Duration: ${(avgBaselineDuration / 1000).toFixed(1)}s`);
    
    if (avgImprovement > 0) {
      console.log('\n🎉 PERMUTATION is BETTER than baseline for complex queries!');
    } else {
      console.log('\n😞 PERMUTATION still needs improvement for complex queries...');
    }
  } else {
    console.log('❌ No successful tests completed');
  }

  console.log('\n🏁 Complex query test completed');
}

// Check servers
async function checkServers() {
  console.log('🔍 Checking server status...');
  
  try {
    const permutationResponse = await fetch('http://localhost:3000/api/weaviate-retrieve-dspy');
    if (permutationResponse.ok) {
      console.log('✅ PERMUTATION server (localhost:3000) is running');
    } else {
      console.log('❌ PERMUTATION server is not responding');
      return false;
    }
  } catch (error) {
    console.log('❌ PERMUTATION server is not running');
    return false;
  }

  try {
    const baselineResponse = await fetch('http://localhost:11434/api/tags');
    if (baselineResponse.ok) {
      console.log('✅ Ollama server (localhost:11434) is running');
    } else {
      console.log('❌ Ollama server is not responding');
      return false;
    }
  } catch (error) {
    console.log('❌ Ollama server is not running');
    return false;
  }

  return true;
}

// Main execution
async function main() {
  const serversOk = await checkServers();
  
  if (!serversOk) {
    console.log('\n❌ Cannot run test - servers not available');
    process.exit(1);
  }

  await runComplexQueryTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runComplexQueryTest, COMPLEX_QUERIES };


