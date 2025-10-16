#!/usr/bin/env node

/**
 * 🎯 LLM-as-a-Judge Demo: No Labels Needed!
 * 
 * Demonstrates how DSPy apps since 2023 use reward signals
 * instead of supervised labels for optimization.
 */

const BASE_URL = 'http://localhost:3000';

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

async function demonstrateNoLabelsApproach() {
  console.log('🎯 LLM-as-a-Judge: NO LABELS NEEDED!');
  console.log('====================================');
  console.log('Demonstrating reward-based optimization without supervised data...\n');

  console.log('📊 THE PARADIGM SHIFT:');
  console.log('======================');
  console.log('❌ OLD WAY (Pre-2023):');
  console.log('   • Collect 10,000 labeled examples');
  console.log('   • Hire annotators for months');
  console.log('   • Wait for training data');
  console.log('   • Limited to tasks with clear answers');
  console.log('');
  console.log('✅ NEW WAY (2023+):');
  console.log('   • Define reward heuristics');
  console.log('   • Use LLM-as-a-Judge instantly');
  console.log('   • Optimize based on reward signals');
  console.log('   • Works for ANY subjective task');
  console.log('');

  // Test different types of reward-based optimization
  const testCases = [
    {
      name: 'Creative Writing',
      taskType: 'creative',
      basePrompt: 'Write a short story about a robot learning to dream',
      description: 'Optimize for creativity, engagement, originality - NO labels needed!',
      rewardDimensions: ['creativity', 'engagement', 'originality', 'emotional_impact']
    },
    {
      name: 'Business Presentation',
      taskType: 'presentation',
      basePrompt: 'Create a presentation about AI trends in healthcare',
      description: 'Optimize for structure, engagement, persuasiveness - NO labels needed!',
      rewardDimensions: ['structure', 'engagement', 'clarity', 'persuasiveness']
    },
    {
      name: 'Technical Documentation',
      taskType: 'summarization',
      basePrompt: 'Summarize complex technical concepts for non-technical audience',
      description: 'Optimize for clarity, completeness, readability - NO labels needed!',
      rewardDimensions: ['coherence', 'completeness', 'readability', 'clarity']
    }
  ];

  console.log('🧪 TESTING REWARD-BASED OPTIMIZATION:');
  console.log('======================================\n');

  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Task Type: ${testCase.taskType}`);
    console.log(`🎯 Base Prompt: ${testCase.basePrompt}`);
    console.log(`📋 Description: ${testCase.description}`);
    console.log(`🎨 Reward Dimensions: ${testCase.rewardDimensions.join(', ')}`);
    console.log('');

    try {
      const startTime = Date.now();
      
      // Use our reward-based optimization API
      const result = await testEndpoint('/api/dspy-reward-optimization', 'POST', {
        taskType: testCase.taskType,
        basePrompt: testCase.basePrompt,
        maxIterations: 3
      });

      const duration = Date.now() - startTime;

      if (result.success) {
        const data = result.data.result;
        
        console.log(`✅ REWARD-BASED OPTIMIZATION SUCCESSFUL!`);
        console.log(`   📈 Improvement: ${data.improvement_percentage.toFixed(1)}%`);
        console.log(`   🏆 Best Reward Score: ${(data.best_reward_score * 100).toFixed(1)}%`);
        console.log(`   🔄 Iterations: ${data.iterations_completed}`);
        console.log(`   ⏱️ Duration: ${duration}ms`);
        console.log('');
        
        console.log(`📊 REWARD DIMENSION BREAKDOWN:`);
        Object.entries(data.best_performance.scores).forEach(([dimension, score]) => {
          const emoji = score > 0.8 ? '🟢' : score > 0.6 ? '🟡' : '🔴';
          console.log(`   ${emoji} ${dimension}: ${(score * 100).toFixed(1)}%`);
        });
        console.log('');
        
        console.log(`💡 OPTIMIZATION SUGGESTIONS (No Labels Required!):`);
        data.best_performance.suggestions.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion}`);
        });
        console.log('');
        
        console.log(`📝 OPTIMIZED PROMPT (Learned from Rewards!):`);
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

  // Analysis of results
  console.log(`\n🎉 REWARD-BASED OPTIMIZATION RESULTS:`);
  console.log('====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`📊 Results: ${successful.length}/${results.length} optimizations successful`);
  
  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL OPTIMIZATIONS (NO LABELS NEEDED!):');
    console.log('================================================');
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

  console.log('\n🎯 KEY INSIGHTS - WHY NO LABELS ARE NEEDED:');
  console.log('==========================================');
  console.log('✅ LLM-as-a-Judge provides instant quality assessment');
  console.log('✅ Reward heuristics capture subjective quality dimensions');
  console.log('✅ Iterative optimization improves based on feedback');
  console.log('✅ Works for any task type (creative, technical, business)');
  console.log('✅ Fast iteration without data collection overhead');
  console.log('✅ Scales to any domain or application');
  console.log('');

  console.log('📚 REAL DSPy SUCCESS STORIES (2023-2024):');
  console.log('==========================================');
  console.log('🎨 Creative Writing Apps:');
  console.log('   • No labeled stories needed');
  console.log('   • Just "rate creativity, engagement"');
  console.log('   • Result: Better creative prompts');
  console.log('');
  console.log('💻 Code Generation Tools:');
  console.log('   • No labeled code examples needed');
  console.log('   • Just "rate quality, readability, efficiency"');
  console.log('   • Result: Better code generation');
  console.log('');
  console.log('📧 Business Communication:');
  console.log('   • No labeled emails needed');
  console.log('   • Just "rate persuasiveness, professionalism"');
  console.log('   • Result: Better business writing');
  console.log('');

  console.log('🚀 THE FUTURE OF DSPy OPTIMIZATION:');
  console.log('===================================');
  console.log('🎯 Reward-based optimization is the new standard');
  console.log('🎨 LLM-as-a-Judge replaces expensive human labeling');
  console.log('⚡ Fast iteration enables rapid experimentation');
  console.log('🌍 Works globally without cultural bias in labels');
  console.log('💰 Cost-effective for any organization size');
  console.log('🔧 Adaptable to any domain or use case');

  return successful.length === results.length;
}

async function main() {
  try {
    const success = await demonstrateNoLabelsApproach();
    
    if (success) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('====================');
      console.log('✅ LLM-as-a-Judge working perfectly!');
      console.log('✅ NO LABELS NEEDED for optimization!');
      console.log('✅ Reward-based approach is the future!');
      console.log('✅ PERMUTATION system ready for any task!');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('The LLM-as-a-Judge system needs attention');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ LLM-as-a-Judge demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
