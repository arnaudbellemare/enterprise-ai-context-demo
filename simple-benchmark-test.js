#!/usr/bin/env node

/**
 * SIMPLE BENCHMARK TEST
 * 
 * Tests just the basic chat endpoints without complex systems
 */

const SIMPLE_QUERIES = [
  "What is 2+2?",
  "What is the capital of France?",
  "Explain photosynthesis in one sentence.",
  "What is machine learning?",
  "How do you make coffee?"
];

function evaluateResponseQuality(response) {
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
  
  // Accuracy indicators (0-40 points)
  if (text.includes('4') && text.includes('2+2')) qualityScore += 40;
  else if (text.includes('paris') && text.includes('france')) qualityScore += 40;
  else if (text.includes('photosynthesis') && text.includes('sunlight')) qualityScore += 40;
  else if (text.includes('machine learning') && text.includes('algorithm')) qualityScore += 40;
  else if (text.includes('coffee') && (text.includes('water') || text.includes('bean'))) qualityScore += 40;
  else qualityScore += 20; // Partial credit for any response
  
  // Clarity (0-30 points)
  if (words >= 10 && !text.includes('error')) qualityScore += 30;
  else if (words >= 5) qualityScore += 20;
  else qualityScore += 10;
  
  return Math.min(qualityScore, 100) / 100;
}

async function testSimplePermutation(query) {
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

async function runSimpleBenchmark() {
  console.log('🚀 SIMPLE BENCHMARK TEST');
  console.log('========================');
  console.log('Testing simple queries only');
  console.log('========================\n');

  const results = [];
  
  for (let i = 0; i < SIMPLE_QUERIES.length; i++) {
    const query = SIMPLE_QUERIES[i];
    console.log(`📊 Test ${i + 1}/${SIMPLE_QUERIES.length}: ${query}`);
    
    // Test PERMUTATION
    console.log('🤖 Testing PERMUTATION...');
    const permutationResult = await testSimplePermutation(query);
    
    if (permutationResult.success) {
      console.log(`✅ PERMUTATION: Quality=${(permutationResult.quality * 100).toFixed(1)}%, Duration=${permutationResult.duration}ms`);
    } else {
      console.log(`❌ PERMUTATION ERROR: ${permutationResult.error}`);
    }

    // Test Baseline
    console.log('🔵 Testing Ollama baseline...');
    const baselineResult = await testOllamaBaseline(query);
    
    if (baselineResult.success) {
      console.log(`✅ BASELINE: Quality=${(baselineResult.quality * 100).toFixed(1)}%, Duration=${baselineResult.duration}ms`);
    } else {
      console.log(`❌ BASELINE ERROR: ${baselineResult.error}`);
    }

    // Calculate improvement
    if (permutationResult.success && baselineResult.success) {
      const improvement = ((permutationResult.quality - baselineResult.quality) / baselineResult.quality * 100).toFixed(1);
      console.log(`📈 Improvement: ${improvement > 0 ? '+' : ''}${improvement}%`);
      
      results.push({
        query: query,
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

    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Summary
  if (results.length > 0) {
    const avgPermutationQuality = results.reduce((sum, r) => sum + r.permutation.quality, 0) / results.length;
    const avgBaselineQuality = results.reduce((sum, r) => sum + r.baseline.quality, 0) / results.length;
    const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
    const avgPermutationDuration = results.reduce((sum, r) => sum + r.permutation.duration, 0) / results.length;
    const avgBaselineDuration = results.reduce((sum, r) => sum + r.baseline.duration, 0) / results.length;

    console.log('📊 SIMPLE BENCHMARK SUMMARY');
    console.log('============================');
    console.log(`Tests Completed: ${results.length}/${SIMPLE_QUERIES.length}`);
    console.log(`Average PERMUTATION Quality: ${(avgPermutationQuality * 100).toFixed(1)}%`);
    console.log(`Average Baseline Quality: ${(avgBaselineQuality * 100).toFixed(1)}%`);
    console.log(`Average Improvement: ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(1)}%`);
    console.log(`Average PERMUTATION Duration: ${(avgPermutationDuration / 1000).toFixed(1)}s`);
    console.log(`Average Baseline Duration: ${(avgBaselineDuration / 1000).toFixed(1)}s`);
    
    if (avgImprovement > 0) {
      console.log('\n🎉 PERMUTATION is BETTER than baseline!');
    } else {
      console.log('\n😞 PERMUTATION is WORSE than baseline...');
    }
  } else {
    console.log('❌ No successful tests completed');
  }
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
    console.log('\n❌ Cannot run benchmark - servers not available');
    process.exit(1);
  }

  await runSimpleBenchmark();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runSimpleBenchmark, SIMPLE_QUERIES };



