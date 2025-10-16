#!/usr/bin/env node

/**
 * 🎯 Hybrid Optimization Demo
 * 
 * Demonstrates when to use supervised vs unsupervised optimization
 * for different aspects of the same system.
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

async function demonstrateHybridApproach() {
  console.log('🎯 HYBRID OPTIMIZATION: When to Use Supervised vs Unsupervised');
  console.log('==============================================================');
  console.log('Demonstrating the ideal approach for different task types...\n');

  const scenarios = [
    {
      name: 'Customer Service Intent Classification',
      type: 'SUPERVISED',
      task: 'Classify customer queries into categories',
      why: 'Clear right/wrong answers exist',
      example: '"I want to cancel my subscription" → cancellation',
      optimization: 'Train on labeled examples for accuracy'
    },
    {
      name: 'Response Quality Evaluation',
      type: 'UNSUPERVISED',
      task: 'Evaluate chatbot response quality',
      why: 'Multiple valid responses, subjective quality',
      example: 'Rate helpfulness, politeness, completeness',
      optimization: 'Use reward signals from LLM-as-a-Judge'
    },
    {
      name: 'Email Spam Detection',
      type: 'SUPERVISED',
      task: 'Classify emails as spam or not spam',
      why: 'Binary classification with clear labels',
      example: 'Spam email → spam (1), Regular email → not spam (0)',
      optimization: 'Train on spam/not-spam labeled dataset'
    },
    {
      name: 'Creative Content Generation',
      type: 'UNSUPERVISED',
      task: 'Generate engaging marketing copy',
      why: 'No single "correct" answer, subjective appeal',
      example: 'Rate creativity, engagement, persuasiveness',
      optimization: 'Use reward signals for creative quality'
    },
    {
      name: 'Medical Diagnosis Classification',
      type: 'SUPERVISED',
      task: 'Classify symptoms into disease categories',
      why: 'Medical accuracy requires exact classification',
      example: 'Symptoms → specific diagnosis',
      optimization: 'Train on medical records with confirmed diagnoses'
    },
    {
      name: 'Conversation Naturalness',
      type: 'UNSUPERVISED',
      task: 'Make chatbot responses more natural',
      why: 'Naturalness is subjective and contextual',
      example: 'Rate flow, authenticity, human-likeness',
      optimization: 'Use reward signals for conversational quality'
    }
  ];

  console.log('📊 SCENARIO ANALYSIS:');
  console.log('=====================\n');

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Type: ${scenario.type}`);
    console.log(`   Task: ${scenario.task}`);
    console.log(`   Why ${scenario.type}: ${scenario.why}`);
    console.log(`   Example: ${scenario.example}`);
    console.log(`   Optimization: ${scenario.optimization}`);
    console.log('');
  });

  // Test both approaches with our existing systems
  console.log('🧪 TESTING BOTH APPROACHES:');
  console.log('============================\n');

  // Test 1: Supervised Optimization (GEPA with labeled data)
  console.log('🎯 TEST 1: SUPERVISED OPTIMIZATION (GEPA)');
  console.log('-------------------------------------------');
  
  try {
    const gepaResult = await testEndpoint('/api/gepa-optimization', 'POST', {
      prompt: 'Classify this email as spam or not spam: "Win $1000 now! Click here!"',
      domain: 'technology'
    });

    if (gepaResult.success) {
      console.log('✅ SUPERVISED: GEPA Optimization successful');
      console.log(`   📈 Improvement: ${gepaResult.data.metrics?.improvementPercentage || 'N/A'}%`);
      console.log(`   🔄 Iterations: ${gepaResult.data.metrics?.totalIterations || 'N/A'}`);
      console.log('   💡 Best for: Tasks with clear right/wrong answers');
    } else {
      console.log('❌ SUPERVISED: GEPA Optimization failed');
    }
  } catch (error) {
    console.log(`❌ SUPERVISED: Test error - ${error.message}`);
  }

  // Test 2: Unsupervised Optimization (Reward-based)
  console.log('\n🎨 TEST 2: UNSUPERVISED OPTIMIZATION (Reward-Based)');
  console.log('----------------------------------------------------');
  
  try {
    const rewardResult = await testEndpoint('/api/dspy-reward-optimization', 'POST', {
      taskType: 'creative',
      basePrompt: 'Write engaging marketing copy for a new product',
      maxIterations: 2
    });

    if (rewardResult.success) {
      console.log('✅ UNSUPERVISED: Reward-based optimization successful');
      console.log(`   📈 Improvement: ${rewardResult.data.result.improvement_percentage.toFixed(1)}%`);
      console.log(`   🏆 Best Reward: ${(rewardResult.data.result.best_reward_score * 100).toFixed(1)}%`);
      console.log('   💡 Best for: Subjective quality and creative tasks');
    } else {
      console.log('❌ UNSUPERVISED: Reward-based optimization failed');
    }
  } catch (error) {
    console.log(`❌ UNSUPERVISED: Test error - ${error.message}`);
  }

  // Analysis and Recommendations
  console.log('\n🎯 OPTIMIZATION STRATEGY RECOMMENDATIONS:');
  console.log('==========================================\n');

  console.log('✅ USE SUPERVISED WHEN:');
  console.log('   • You have labeled training data');
  console.log('   • Task has clear right/wrong answers');
  console.log('   • You need high precision and accuracy');
  console.log('   • Examples: Classification, NER, Factual QA');
  console.log('   • Tools: GEPA, traditional ML, fine-tuning');

  console.log('\n✅ USE UNSUPERVISED WHEN:');
  console.log('   • No labeled data available');
  console.log('   • Task involves subjective quality');
  console.log('   • Multiple valid answers exist');
  console.log('   • Examples: Creative writing, Summarization, Conversation');
  console.log('   • Tools: LLM-as-a-Judge, Reward-based optimization');

  console.log('\n🔄 USE HYBRID WHEN:');
  console.log('   • System has multiple components');
  console.log('   • Some parts need precision, others need creativity');
  console.log('   • Example: Chatbot (intent classification + response quality)');
  console.log('   • Tools: Combine both approaches strategically');

  console.log('\n📊 REAL-WORLD EXAMPLES:');
  console.log('========================');

  const examples = [
    {
      system: 'Customer Service Chatbot',
      supervised: 'Intent classification (cancellation, billing, support)',
      unsupervised: 'Response quality (helpfulness, politeness, completeness)',
      why: 'Intent has clear categories, but response quality is subjective'
    },
    {
      system: 'Content Moderation',
      supervised: 'Toxic content detection (hate speech, spam)',
      unsupervised: 'Content quality and engagement',
      why: 'Toxicity is binary, but content quality is nuanced'
    },
    {
      system: 'Medical AI Assistant',
      supervised: 'Symptom-to-diagnosis mapping',
      unsupervised: 'Patient communication quality',
      why: 'Diagnosis needs accuracy, but communication needs empathy'
    }
  ];

  examples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.system}:`);
    console.log(`   🎯 Supervised: ${example.supervised}`);
    console.log(`   🎨 Unsupervised: ${example.unsupervised}`);
    console.log(`   💡 Why: ${example.why}`);
  });

  return true;
}

async function main() {
  try {
    const success = await demonstrateHybridApproach();
    
    if (success) {
      console.log('\n🎉 HYBRID OPTIMIZATION ANALYSIS COMPLETE!');
      console.log('==========================================');
      console.log('✅ Both supervised and unsupervised optimization have their place');
      console.log('✅ Choose based on task characteristics, not just availability');
      console.log('✅ Hybrid approaches often provide the best results');
      console.log('✅ PERMUTATION system supports both for maximum flexibility');
      process.exit(0);
    } else {
      console.log('\n❌ Analysis failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Hybrid optimization demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
