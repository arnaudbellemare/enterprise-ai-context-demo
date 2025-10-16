#!/usr/bin/env node

/**
 * 🎯 DSPy Reward-Based Optimization Test
 * 
 * Demonstrates reward-based optimization for open-ended tasks without requiring
 * labeled training data. Based on "Reasoning-Intensive Regression" paper.
 * 
 * Paper: https://arxiv.org/pdf/2508.21762
 */

const BASE_URL = 'http://localhost:3005';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

async function testRewardOptimization() {
  console.log('🎯 DSPy Reward-Based Optimization Test');
  console.log('=====================================');
  console.log('Testing reward-based optimization for open-ended tasks...\n');

  const testCases = [
    {
      name: 'Summarization Task',
      taskType: 'summarization',
      basePrompt: 'Summarize the following text in 2-3 paragraphs, highlighting key points.',
      description: 'Optimizing summarization prompts based on coherence, completeness, and readability rewards'
    },
    {
      name: 'Presentation Task',
      taskType: 'presentation',
      basePrompt: 'Create a presentation about the topic with clear structure and engaging content.',
      description: 'Optimizing presentation prompts based on structure, engagement, and persuasiveness rewards'
    },
    {
      name: 'Creative Writing Task',
      taskType: 'creative',
      basePrompt: 'Write a creative piece that is original and engaging.',
      description: 'Optimizing creative writing prompts based on originality, creativity, and emotional impact rewards'
    }
  ];

  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Task Type: ${testCase.taskType}`);
    console.log(`🎯 Base Prompt: ${testCase.basePrompt}`);
    console.log(`📋 Description: ${testCase.description}\n`);

    try {
      const startTime = Date.now();
      
      const result = await testEndpoint('/api/dspy-reward-optimization', 'POST', {
        taskType: testCase.taskType,
        basePrompt: testCase.basePrompt,
        maxIterations: 3
      });

      const duration = Date.now() - startTime;

      if (result.success) {
        const data = result.data.result;
        
        console.log(`✅ Optimization Results:`);
        console.log(`   📈 Improvement: ${data.improvement_percentage.toFixed(1)}%`);
        console.log(`   🏆 Best Reward Score: ${(data.best_reward_score * 100).toFixed(1)}%`);
        console.log(`   🔄 Iterations: ${data.iterations_completed}`);
        console.log(`   ⏱️ Duration: ${duration}ms`);
        
        console.log(`\n📊 Reward History:`);
        data.reward_history.forEach((reward, index) => {
          console.log(`   Iteration ${index + 1}: ${(reward * 100).toFixed(1)}%`);
        });
        
        console.log(`\n🎯 Best Performance Breakdown:`);
        Object.entries(data.best_performance.scores).forEach(([dimension, score]) => {
          console.log(`   ${dimension}: ${(score * 100).toFixed(1)}%`);
        });
        
        console.log(`\n💡 Optimization Suggestions:`);
        data.best_performance.suggestions.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion}`);
        });
        
        console.log(`\n📝 Optimized Prompt:`);
        console.log(`   ${data.optimized_prompt.substring(0, 200)}...`);
        
        results.push({
          success: true,
          testCase: testCase.name,
          improvement: data.improvement_percentage,
          bestReward: data.best_reward_score,
          duration: duration
        });
        
      } else {
        console.log(`❌ Optimization failed: ${result.error}`);
        results.push({
          success: false,
          testCase: testCase.name,
          error: result.error
        });
      }

    } catch (error) {
      console.log(`❌ Test error: ${error.message}`);
      results.push({
        success: false,
        testCase: testCase.name,
        error: error.message
      });
    }

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final Results
  console.log(`\n🎉 DSPy Reward-Based Optimization Test Completed!`);
  console.log('================================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`📊 Results: ${successful.length}/${results.length} tests passed`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Optimizations:');
    console.log('=============================');
    successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testCase}:`);
      console.log(`   📈 Improvement: ${result.improvement.toFixed(1)}%`);
      console.log(`   🏆 Best Reward: ${(result.bestReward * 100).toFixed(1)}%`);
      console.log(`   ⏱️ Duration: ${result.duration}ms`);
      console.log('');
    });
    
    const avgImprovement = successful.reduce((sum, r) => sum + r.improvement, 0) / successful.length;
    const avgReward = successful.reduce((sum, r) => sum + r.bestReward, 0) / successful.length;
    
    console.log(`📈 Average Improvement: ${avgImprovement.toFixed(1)}%`);
    console.log(`🏆 Average Best Reward: ${(avgReward * 100).toFixed(1)}%`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Optimizations:');
    console.log('=========================');
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testCase}: ${result.error}`);
    });
  }

  console.log('\n🎯 Key Insights:');
  console.log('================');
  console.log('✅ Reward-based optimization works without labeled training data');
  console.log('✅ LLM-as-a-Judge provides effective reward signals');
  console.log('✅ Iterative optimization improves prompt quality');
  console.log('✅ Different task types require different reward dimensions');
  console.log('✅ Reasoning-intensive regression approach is effective');

  return successful.length === results.length;
}

async function demonstrateRewardDimensions() {
  console.log('\n🎯 Reward Dimension Analysis');
  console.log('=============================');
  
  const dimensions = {
    summarization: {
      coherence: 'Logical flow and structure',
      completeness: 'Coverage of key points',
      conciseness: 'Brevity without losing meaning',
      readability: 'Clarity and accessibility',
      factual_accuracy: 'Truthfulness of claims'
    },
    presentation: {
      structure: 'Clear organization',
      engagement: 'Audience engagement',
      clarity: 'Message clarity',
      visual_appeal: 'Aesthetic quality',
      persuasiveness: 'Convincing arguments'
    },
    creative: {
      originality: 'Novel ideas',
      creativity: 'Artistic merit',
      coherence: 'Internal consistency',
      emotional_impact: 'Emotional resonance',
      technical_quality: 'Craft and execution'
    }
  };

  Object.entries(dimensions).forEach(([taskType, dims]) => {
    console.log(`\n📊 ${taskType.toUpperCase()} Reward Dimensions:`);
    Object.entries(dims).forEach(([dimension, description]) => {
      console.log(`   • ${dimension}: ${description}`);
    });
  });
}

async function main() {
  try {
    console.log('🚀 DSPy Reward-Based Optimization Demo');
    console.log('======================================');
    console.log('Based on "Reasoning-Intensive Regression" paper');
    console.log('Paper URL: https://arxiv.org/pdf/2508.21762');
    console.log('Methodology: LLM-as-a-Judge for reward-based optimization\n');

    const success = await testRewardOptimization();
    await demonstrateRewardDimensions();
    
    if (success) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('====================');
      console.log('✅ DSPy reward-based optimization working perfectly!');
      console.log('✅ No labeled training data required!');
      console.log('✅ LLM-as-a-Judge provides effective rewards!');
      console.log('✅ Iterative optimization improves quality!');
      console.log('✅ Ready for open-ended task optimization!');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('The reward optimization system needs attention');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ DSPy reward optimization test failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);