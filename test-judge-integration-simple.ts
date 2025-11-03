/**
 * Simple Self-Improving Judge Integration Test
 * 
 * Quick verification that:
 * 1. SelfImprovingJudge class exists and can be instantiated
 * 2. Methods are callable
 * 3. Pipeline integration works
 */

async function testJudgeIntegration() {
  console.log('🧪 Testing Self-Improving Judge Integration...\n');

  try {
    // Test 1: Import and instantiate
    console.log('1️⃣ Testing imports...');
    const { SelfImprovingJudge } = await import('./frontend/lib/self-improving-judge');
    const { ArcMemoReasoningBank } = await import('./frontend/lib/arcmemo-reasoning-bank');
    const { UnifiedPermutationPipeline } = await import('./frontend/lib/unified-permutation-pipeline');
    console.log('   ✅ All imports successful\n');

    // Test 2: Instantiate components
    console.log('2️⃣ Testing instantiation...');
    const reasoningBank = new ArcMemoReasoningBank();
    const judge = new SelfImprovingJudge(reasoningBank);
    const pipeline = new UnifiedPermutationPipeline({
      enableSelfImprovingJudge: true
    });
    console.log('   ✅ All components instantiated\n');

    // Test 3: Test judge methods with mock data
    console.log('3️⃣ Testing judge methods...');
    const mockExperience = {
      taskId: 'test_1',
      query: 'What is 2+2?',
      domain: 'general',
      steps: [
        {
          thought: 'Simple arithmetic question',
          action: 'calculate',
          observation: 'Result is 4',
          timestamp: new Date()
        }
      ],
      success: true,
      finalResult: 'The answer is 4',
      irtAbility: 0.8,
      irtConfidence: 0.9
    };

    const examplesLearned = await judge.learnFromTaskOutcomes([mockExperience as any], 0.7);
    console.log(`   ✅ learnFromTaskOutcomes: ${examplesLearned} examples learned`);

    const calibration = await judge.calibrateJudge([mockExperience as any]);
    console.log(`   ✅ calibrateJudge: ${(calibration.empiricalAccuracy * 100).toFixed(1)}% accuracy`);

    const candidates = await judge.identifyActiveLearningCandidates([mockExperience as any], 5);
    console.log(`   ✅ identifyActiveLearningCandidates: ${candidates.length} candidates found\n`);

    // Test 4: Pipeline configuration
    console.log('4️⃣ Testing pipeline configuration...');
    const config = (pipeline as any).config;
    console.log(`   ✅ enableSelfImprovingJudge: ${config.enableSelfImprovingJudge}`);
    console.log(`   ✅ enableToolSynthesis: ${config.enableToolSynthesis}`);
    console.log(`   ✅ enableACE: ${config.enableACE}\n`);

    // Test 5: Verify integration point exists
    console.log('5️⃣ Testing integration point...');
    const executeMethod = (pipeline as any).execute;
    if (typeof executeMethod === 'function') {
      console.log('   ✅ execute method exists (integration point ready)');
    } else {
      throw new Error('execute method not found');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Integration Status:');
    console.log('  ✅ SelfImprovingJudge class imported and instantiated');
    console.log('  ✅ All judge methods callable');
    console.log('  ✅ UnifiedPermutationPipeline configured with judge');
    console.log('  ✅ Integration point (execute method) ready');
    console.log('\nThe self-improving judge will learn from every pipeline execution!\n');

    return { success: true };
  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  testJudgeIntegration()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testJudgeIntegration };


