#!/usr/bin/env node

/**
 * 🎓 TEACHER-STUDENT PATTERN TEST
 * 
 * Tests the cost optimization system to ensure it properly implements
 * the teacher-student pattern instead of always selecting Perplexity
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

async function testTeacherStudentPattern() {
  console.log('🎓 TEACHER-STUDENT PATTERN TEST');
  console.log('================================');
  console.log('Testing cost optimization to ensure proper teacher-student implementation\n');

  const testCases = [
    {
      name: 'Simple Query (Should use Single Model)',
      query: 'What is machine learning?',
      userTier: 'basic',
      expectedPattern: 'single-model',
      description: 'Simple, short query should use single model (Ollama for free users)'
    },
    {
      name: 'Complex Query (Should use Teacher-Student)',
      query: 'How can we implement personalized learning paths using AI to improve student outcomes in K-12 education?',
      userTier: 'enterprise',
      expectedPattern: 'teacher-student',
      description: 'Complex, long query should use teacher-student pattern'
    },
    {
      name: 'Enterprise High Quality (Should use Teacher-Student)',
      query: 'Optimize production line efficiency using IoT sensors and predictive analytics',
      userTier: 'enterprise',
      expectedPattern: 'teacher-student',
      description: 'Enterprise user with high quality requirements should use teacher-student'
    },
    {
      name: 'Technical Query (Should use Teacher-Student)',
      query: 'What are the best strategies for implementing real-time fraud detection using machine learning algorithms in banking systems with microservices architecture?',
      userTier: 'premium',
      expectedPattern: 'teacher-student',
      description: 'Technical query with many keywords should use teacher-student'
    },
    {
      name: 'Basic User Simple Query (Should use Single Model)',
      query: 'Explain AI in simple terms',
      userTier: 'basic',
      expectedPattern: 'single-model',
      description: 'Basic user with simple query should use single model'
    }
  ];

  let passed = 0;
  let total = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST ${i + 1}/${total}: ${testCase.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Query: "${testCase.query}"`);
    console.log(`👤 User Tier: ${testCase.userTier}`);
    console.log(`🎯 Expected: ${testCase.expectedPattern}`);
    console.log(`📋 Description: ${testCase.description}\n`);

    try {
      // Test cost optimization
      const budget = testCase.userTier === 'free' ? 0 : (testCase.userTier === 'basic' ? 10 : 50);
      const minQuality = testCase.userTier === 'enterprise' ? 0.9 : 0.8;
      
      const costOpt = await testEndpoint('/api/real-cost-optimization', 'POST', {
        query: testCase.query,
        requirements: { maxCost: 0.02, minQuality: minQuality },
        context: { 
          userTier: testCase.userTier, 
          budgetRemaining: budget 
        }
      });

      if (!costOpt.success) {
        console.log(`❌ FAILED: Cost optimization failed - ${costOpt.error}`);
        continue;
      }

      const result = costOpt.data.result;
      const selectedProvider = result.selectedProvider;
      const selectedModel = result.selectedModel;
      
      console.log(`✅ Cost Optimization Results:`);
      console.log(`   🎯 Provider: ${selectedProvider}`);
      console.log(`   💻 Model: ${selectedModel}`);
      console.log(`   💰 Cost: $${result.estimatedCost.toFixed(6)}`);
      console.log(`   ⏱️ Latency: ${result.estimatedLatency}ms`);
      console.log(`   🎯 Quality: ${(result.estimatedQuality * 100).toFixed(1)}%`);

      // Determine actual pattern used
      let actualPattern;
      if (selectedProvider === 'Teacher-Student' && selectedModel === 'perplexity-guides-ollama') {
        actualPattern = 'teacher-student';
      } else if (selectedProvider === 'Perplexity' || selectedProvider === 'Ollama') {
        actualPattern = 'single-model';
      } else {
        actualPattern = 'unknown';
      }

      console.log(`\n🔍 Pattern Analysis:`);
      console.log(`   Expected: ${testCase.expectedPattern}`);
      console.log(`   Actual: ${actualPattern}`);

      // Check if pattern matches expectation
      const patternCorrect = actualPattern === testCase.expectedPattern;
      
      if (patternCorrect) {
        console.log(`✅ PASSED: Correct pattern selected!`);
        passed++;
      } else {
        console.log(`❌ FAILED: Expected ${testCase.expectedPattern}, got ${actualPattern}`);
      }

      // Additional analysis
      if (actualPattern === 'teacher-student') {
        console.log(`\n🎓 Teacher-Student Analysis:`);
        console.log(`   👨‍🏫 Teacher Cost: $${(result.costBreakdown?.teacherCost || 0).toFixed(6)}`);
        console.log(`   👨‍🎓 Student Cost: $${(result.costBreakdown?.studentCost || 0).toFixed(6)}`);
        console.log(`   🔄 Coordination: $${(result.costBreakdown?.coordinationCost || 0).toFixed(6)}`);
        console.log(`   📊 Total: $${result.estimatedCost.toFixed(6)}`);
      } else if (actualPattern === 'single-model') {
        console.log(`\n🎯 Single Model Analysis:`);
        console.log(`   💻 Direct Model: ${selectedProvider}/${selectedModel}`);
        console.log(`   💰 Direct Cost: $${result.estimatedCost.toFixed(6)}`);
      }

    } catch (error) {
      console.log(`❌ FAILED: Test error - ${error.message}`);
    }

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final Results
  console.log(`\n🎉 TEACHER-STUDENT PATTERN TEST COMPLETED!`);
  console.log('==========================================');
  console.log(`📊 Results: ${passed}/${total} tests passed`);
  console.log(`🎯 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed === total) {
    console.log(`\n✅ ALL TESTS PASSED!`);
    console.log(`🎓 Teacher-Student pattern working correctly!`);
    console.log(`🎯 System intelligently chooses between patterns based on:`);
    console.log(`   - Query complexity`);
    console.log(`   - User tier`);
    console.log(`   - Quality requirements`);
    console.log(`   - Query length`);
  } else {
    console.log(`\n❌ SOME TESTS FAILED!`);
    console.log(`🔧 Teacher-Student pattern needs adjustment`);
    console.log(`📋 Failed tests indicate where the logic needs refinement`);
  }

  return passed === total;
}

async function main() {
  try {
    const success = await testTeacherStudentPattern();
    
    if (success) {
      console.log('\n🎉 TEACHER-STUDENT PATTERN VERIFIED!');
      console.log('=====================================');
      console.log('✅ Cost optimization correctly implements teacher-student pattern');
      console.log('✅ Simple queries use single models (cost-effective)');
      console.log('✅ Complex queries use teacher-student (quality-focused)');
      console.log('✅ Enterprise users get teacher-student for high quality');
      console.log('✅ Basic users get single models for cost savings');
      process.exit(0);
    } else {
      console.log('\n❌ TEACHER-STUDENT PATTERN NEEDS FIXES');
      console.log('The cost optimization logic needs adjustment');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Teacher-Student test failed:', error);
    process.exit(1);
  }
}

// Run teacher-student pattern test
main().catch(console.error);
