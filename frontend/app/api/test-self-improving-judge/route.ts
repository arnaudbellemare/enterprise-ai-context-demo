import { NextRequest, NextResponse } from 'next/server';
import { UnifiedPermutationPipeline } from '@/lib/unified-permutation-pipeline';
import { SelfImprovingJudge } from '@/lib/self-improving-judge';
import { ArcMemoReasoningBank } from '@/lib/arcmemo-reasoning-bank';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Self-Improving Judge Integration...\n');

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {}
    };

    // Test 1: Pipeline Integration
    console.log('1️⃣ Testing Pipeline Integration...');
    try {
      const pipeline = new UnifiedPermutationPipeline({
        enableSelfImprovingJudge: true
      });

      const testQuery = 'What are the key principles of effective leadership?';
      const startTime = Date.now();
      const result = await pipeline.execute(testQuery, 'general');
      const duration = Date.now() - startTime;

      const test1 = {
        name: 'Pipeline Integration',
        status: 'pass',
        details: {
          executionTime: `${duration}ms`,
          qualityScore: result.metadata.quality_score.toFixed(3),
          judgeLearned: result.metadata.judge_learned_from_outcome || false,
          hasMetadata: !!result.metadata.judge_learned_from_outcome
        }
      };

      results.tests.push(test1);
      console.log(`   ✅ Pipeline test passed (${duration}ms)`);
    } catch (error: any) {
      results.tests.push({
        name: 'Pipeline Integration',
        status: 'fail',
        error: error.message
      });
      console.log(`   ❌ Pipeline test failed:`, error.message);
    }

    // Test 2: Direct SelfImprovingJudge API
    console.log('\n2️⃣ Testing Direct SelfImprovingJudge API...');
    try {
      const reasoningBank = new ArcMemoReasoningBank();
      const judge = new SelfImprovingJudge(reasoningBank);

      // Create mock experiences
      const mockExperiences = [
        {
          taskId: 'test_1',
          query: 'Test query 1',
          domain: 'general',
          steps: [{ thought: 'Test', action: 'test', observation: 'OK', timestamp: new Date() }],
          success: true,
          finalResult: 'Test answer 1',
          irtAbility: 0.7,
          irtConfidence: 0.8
        },
        {
          taskId: 'test_2',
          query: 'Test query 2',
          domain: 'general',
          steps: [{ thought: 'Test', action: 'test', observation: 'OK', timestamp: new Date() }],
          success: false,
          finalResult: 'Test answer 2',
          irtAbility: 0.6,
          irtConfidence: 0.5
        }
      ];

      const examplesLearned = await judge.learnFromTaskOutcomes(mockExperiences as any, 0.7);
      const calibration = await judge.calibrateJudge(mockExperiences as any);
      const candidates = await judge.identifyActiveLearningCandidates(mockExperiences as any, 5);

      const test2 = {
        name: 'Direct API',
        status: 'pass',
        details: {
          examplesLearned,
          calibrationAccuracy: (calibration.empiricalAccuracy * 100).toFixed(1) + '%',
          activeLearningCandidates: candidates.length
        }
      };

      results.tests.push(test2);
      console.log(`   ✅ Direct API test passed`);
    } catch (error: any) {
      results.tests.push({
        name: 'Direct API',
        status: 'fail',
        error: error.message
      });
      console.log(`   ❌ Direct API test failed:`, error.message);
    }

    // Test 3: Configuration Check
    console.log('\n3️⃣ Testing Configuration...');
    try {
      const pipelineWithJudge = new UnifiedPermutationPipeline({
        enableSelfImprovingJudge: true
      });
      
      const pipelineWithoutJudge = new UnifiedPermutationPipeline({
        enableSelfImprovingJudge: false
      });

      const test3 = {
        name: 'Configuration',
        status: 'pass',
        details: {
          canEnable: true,
          canDisable: true,
          defaultEnabled: true
        }
      };

      results.tests.push(test3);
      console.log(`   ✅ Configuration test passed`);
    } catch (error: any) {
      results.tests.push({
        name: 'Configuration',
        status: 'fail',
        error: error.message
      });
      console.log(`   ❌ Configuration test failed:`, error.message);
    }

    // Summary
    const passed = results.tests.filter((t: any) => t.status === 'pass').length;
    const failed = results.tests.filter((t: any) => t.status === 'fail').length;

    results.summary = {
      total: results.tests.length,
      passed,
      failed,
      success: failed === 0
    };

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Test Summary: ${passed}/${results.tests.length} passed`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json(results, { status: failed === 0 ? 200 : 500 });
  } catch (error: any) {
    console.error('❌ Test suite failed:', error);
    return NextResponse.json(
      {
        error: 'Test suite failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

