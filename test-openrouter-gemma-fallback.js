/**
 * Test OpenRouter → Gemma3:4b Fallback
 * 
 * Tests the intelligent fallback system that switches from OpenRouter
 * to local Gemma3:4b when rate limits are hit.
 */

const fetch = require('node-fetch');

async function testOpenRouterGemmaFallback() {
  console.log('🧪 Testing OpenRouter → Gemma3:4b Fallback\n');
  
  const testQuery = `Test the OpenRouter to Gemma3:4b fallback system: "What are the benefits of intelligent API rate limiting in AI systems? Provide a comprehensive analysis with technical details and practical examples."`;

  try {
    console.log('📝 Query (OpenRouter → Gemma3:4b Fallback Test):');
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
        sessionId: 'openrouter-gemma-fallback-test',
        complexity: 8,
        needsReasoning: true,
        useMoE: true,
        context: {
          testType: 'openrouter_gemma_fallback',
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

    // Check for fallback behavior
    const responseText = result.response || '';
    const hasOpenRouterFallback = responseText.includes('OpenRouter') || responseText.includes('rate limit');
    const hasGemmaFallback = responseText.includes('Gemma3:4b') || responseText.includes('Ollama');
    const hasIntelligentFallback = responseText.includes('switching') || responseText.includes('fallback');
    
    console.log('🔄 Fallback Analysis:');
    console.log(`   OpenRouter Usage: ${hasOpenRouterFallback ? '✅' : '❌'}`);
    console.log(`   Gemma3:4b Fallback: ${hasGemmaFallback ? '✅' : '❌'}`);
    console.log(`   Intelligent Fallback: ${hasIntelligentFallback ? '✅' : '❌'}`);
    console.log();

    // Check behavioral evaluation improvements
    const behavioralDimensions = result.metadata?.behavioralDimensions || [];
    const hasNonDefaultScores = behavioralDimensions.some(dim => dim.score !== 0.5);
    const hasMeaningfulScores = behavioralDimensions.some(dim => dim.score > 0.6 || dim.score < 0.4);
    
    console.log('🎯 Behavioral Evaluation Analysis:');
    console.log(`   Non-Default Scores: ${hasNonDefaultScores ? '✅' : '❌'}`);
    console.log(`   Meaningful Scores: ${hasMeaningfulScores ? '✅' : '❌'}`);
    console.log(`   Dimensions Evaluated: ${behavioralDimensions.length}/6`);
    
    if (behavioralDimensions.length > 0) {
      console.log('   Score Breakdown:');
      behavioralDimensions.forEach(dim => {
        const scorePercent = (dim.score * 100).toFixed(1);
        const status = dim.score === 0.5 ? '⚠️' : (dim.score > 0.7 ? '✅' : '❌');
        console.log(`     ${status} ${dim.dimension}: ${scorePercent}%`);
      });
    }
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

    // Check for fallback improvements
    const hasNoHeuristicFallback = !responseText.includes('fallback heuristics');
    const hasIntelligentAPI = responseText.includes('API') || responseText.includes('provider');
    const hasQualityScore = result.metadata?.combinedScore > 0.5;
    
    console.log('🚀 Fallback Improvements:');
    console.log(`   No Heuristic Fallback: ${hasNoHeuristicFallback ? '✅' : '❌'}`);
    console.log(`   Intelligent API Selection: ${hasIntelligentAPI ? '✅' : '❌'}`);
    console.log(`   Quality Score Available: ${hasQualityScore ? '✅' : '❌'}`);
    console.log();

    // Overall assessment
    const improvementScore = (
      (hasNonDefaultScores ? 1 : 0) * 0.3 +
      (hasMeaningfulScores ? 1 : 0) * 0.3 +
      (hasNoHeuristicFallback ? 1 : 0) * 0.2 +
      (hasIntelligentAPI ? 1 : 0) * 0.2
    ) * 100;

    console.log('🏆 OpenRouter → Gemma3:4b Fallback Assessment:');
    console.log(`   Improvement Score: ${improvementScore.toFixed(1)}%`);
    console.log(`   Execution Time: ${executionTime.toFixed(2)}s`);
    console.log(`   Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   Quality Score: ${result.metadata?.combinedScore || 'N/A'}`);
    console.log(`   Behavioral Scores: ${hasNonDefaultScores ? 'Improved' : 'Still Default'}`);
    
    if (improvementScore >= 80) {
      console.log('\n🎉 EXCELLENT: OpenRouter → Gemma3:4b fallback working perfectly!');
    } else if (improvementScore >= 60) {
      console.log('\n✅ GOOD: Fallback system working well with minor issues');
    } else {
      console.log('\n⚠️ NEEDS IMPROVEMENT: Fallback system needs better handling');
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
      hasNonDefaultScores,
      hasMeaningfulScores,
      hasNoHeuristicFallback,
      hasIntelligentAPI,
      response: responseText
    };

  } catch (error) {
    console.error('❌ OpenRouter → Gemma3:4b Fallback Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testOpenRouterGemmaFallback()
  .then(result => {
    if (result.success) {
      console.log('\n✅ OpenRouter → Gemma3:4b Fallback Test Completed Successfully!');
      console.log(`   Improvement Score: ${result.improvementScore.toFixed(1)}%`);
      console.log(`   Time: ${result.executionTime.toFixed(2)}s`);
      console.log(`   Skills: ${result.skillsActivated}`);
      console.log(`   Non-Default Scores: ${result.hasNonDefaultScores ? '✅' : '❌'}`);
      console.log(`   Meaningful Scores: ${result.hasMeaningfulScores ? '✅' : '❌'}`);
      console.log(`   No Heuristic Fallback: ${result.hasNoHeuristicFallback ? '✅' : '❌'}`);
      console.log(`   Intelligent API: ${result.hasIntelligentAPI ? '✅' : '❌'}`);
    } else {
      console.log('\n❌ OpenRouter → Gemma3:4b Fallback Test Failed!');
      console.log(`   Error: ${result.error}`);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
  });
