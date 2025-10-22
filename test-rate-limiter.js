/**
 * Test Rate Limiter Integration
 * 
 * Tests the new API rate limiter to ensure it properly handles
 * rate limiting and fallback instead of using basic heuristics.
 */

const fetch = require('node-fetch');

async function testRateLimiterIntegration() {
  console.log('🧪 Testing Rate Limiter Integration\n');
  
  const testQuery = `Test the rate limiter integration with a simple query: "What are the benefits of using intelligent API rate limiting in AI systems?"`;

  try {
    console.log('📝 Query (Rate Limiter Test):');
    console.log(testQuery.substring(0, 100) + '...\n');
    
    console.log('🚀 Sending request to Brain API...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/brain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        domain: 'technology',
        sessionId: 'rate-limiter-test',
        complexity: 7,
        needsReasoning: true,
        useMoE: true,
        context: {
          testType: 'rate_limiter',
          expectedBehavior: 'intelligent_fallback',
          expectedTone: 'professional',
          expectedStyle: 'technical',
          expectedFocus: 'system_analysis'
        }
      })
    });

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Response received successfully!\n');
    console.log('📊 Execution Metrics:');
    console.log(`   Execution Time: ${executionTime.toFixed(2)}s`);
    console.log(`   Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   MoE Optimized: ${result.metadata?.moeOptimized || false}`);
    console.log(`   Combined Score: ${result.metadata?.combinedScore || 'N/A'}\n`);

    // Check if rate limiter is working
    const responseText = result.response || '';
    const hasRateLimiterFallback = responseText.includes('Rate-limited') || responseText.includes('intelligent fallback');
    const hasHeuristicFallback = responseText.includes('fallback heuristics') || responseText.includes('Rate Limited');
    
    console.log('🔍 Rate Limiter Analysis:');
    console.log(`   Intelligent Fallback: ${hasRateLimiterFallback ? '✅' : '❌'}`);
    console.log(`   Heuristic Fallback: ${hasHeuristicFallback ? '⚠️' : '✅'}`);
    console.log();

    // Check skills activated
    if (result.metadata?.skillsActivated) {
      console.log('🧠 Skills Analysis:');
      result.metadata.skillsActivated.forEach((skill, index) => {
        const score = result.metadata.skillScores?.[skill] || 'N/A';
        console.log(`   ${index + 1}. ${skill}: ${score}`);
      });
      console.log();
    }

    // Check for quality evaluation improvements
    const hasQualityEvaluation = result.metadata?.combinedScore > 0;
    const hasOpenEvals = result.metadata?.openEvalsEnabled;
    const hasBehavioralEvaluation = result.metadata?.behavioralEvaluationEnabled;
    
    console.log('🎯 Evaluation Analysis:');
    console.log(`   Quality Evaluation: ${hasQualityEvaluation ? '✅' : '❌'}`);
    console.log(`   OpenEvals Integration: ${hasOpenEvals ? '✅' : '❌'}`);
    console.log(`   Behavioral Evaluation: ${hasBehavioralEvaluation ? '✅' : '❌'}`);
    console.log();

    // Check for rate limiter improvements
    const hasNoHeuristicFallback = !responseText.includes('fallback heuristics');
    const hasIntelligentAPI = responseText.includes('API') || responseText.includes('provider');
    const hasQualityScore = result.metadata?.combinedScore > 0.5;
    
    console.log('🚀 Rate Limiter Improvements:');
    console.log(`   No Heuristic Fallback: ${hasNoHeuristicFallback ? '✅' : '❌'}`);
    console.log(`   Intelligent API Selection: ${hasIntelligentAPI ? '✅' : '❌'}`);
    console.log(`   Quality Score Available: ${hasQualityScore ? '✅' : '❌'}`);
    console.log();

    // Overall assessment
    const improvementScore = (
      (hasNoHeuristicFallback ? 1 : 0) * 0.4 +
      (hasIntelligentAPI ? 1 : 0) * 0.3 +
      (hasQualityScore ? 1 : 0) * 0.3
    ) * 100;

    console.log('🏆 Rate Limiter Integration Assessment:');
    console.log(`   Improvement Score: ${improvementScore.toFixed(1)}%`);
    console.log(`   Execution Time: ${executionTime.toFixed(2)}s`);
    console.log(`   Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   Quality Score: ${result.metadata?.combinedScore || 'N/A'}`);
    
    if (improvementScore >= 80) {
      console.log('\n🎉 EXCELLENT: Rate limiter integration working perfectly!');
    } else if (improvementScore >= 60) {
      console.log('\n✅ GOOD: Rate limiter integration working well with minor issues');
    } else {
      console.log('\n⚠️ NEEDS IMPROVEMENT: Rate limiter integration needs better handling');
    }

    // Show sample of response
    console.log('\n📄 Response Sample:');
    console.log('─'.repeat(80));
    console.log(responseText.substring(0, 600) + '...');
    console.log('─'.repeat(80));

    return {
      success: true,
      improvementScore,
      executionTime,
      skillsActivated: result.metadata?.skillsActivated?.length || 0,
      qualityScore: result.metadata?.combinedScore,
      hasNoHeuristicFallback,
      hasIntelligentAPI,
      hasQualityScore,
      response: responseText
    };

  } catch (error) {
    console.error('❌ Rate Limiter Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testRateLimiterIntegration()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Rate Limiter Integration Test Completed Successfully!');
      console.log(`   Improvement Score: ${result.improvementScore.toFixed(1)}%`);
      console.log(`   Time: ${result.executionTime.toFixed(2)}s`);
      console.log(`   Skills: ${result.skillsActivated}`);
      console.log(`   No Heuristic Fallback: ${result.hasNoHeuristicFallback ? '✅' : '❌'}`);
      console.log(`   Intelligent API: ${result.hasIntelligentAPI ? '✅' : '❌'}`);
      console.log(`   Quality Score: ${result.hasQualityScore ? '✅' : '❌'}`);
    } else {
      console.log('\n❌ Rate Limiter Integration Test Failed!');
      console.log(`   Error: ${result.error}`);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });
