/**
 * Comprehensive Integration Tests for ElizaOS SRL + EBM Implementation
 * 
 * Tests:
 * 1. SRL integration on multi-step queries
 * 2. EBM integration on refinement queries
 * 3. Combined approach for optimal quality
 */

import { createElizaIntegration } from './frontend/lib/eliza-integration';
import { createSWiRLDecomposer } from './frontend/lib/swirl-decomposer';

interface TestResult {
  testName: string;
  success: boolean;
  latency: number;
  metadata: any;
  error?: string;
}

class ElizaIntegrationTester {
  private results: TestResult[] = [];
  private eliza: ReturnType<typeof createElizaIntegration>;

  constructor() {
    this.eliza = createElizaIntegration({
      enableSRL: true,
      enableEBM: true
    });
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing ElizaOS integration...');
    await this.eliza.initialize();
    console.log('✅ ElizaOS integration initialized\n');
  }

  /**
   * Test 1: SRL on Multi-Step Financial Query
   */
  async testSRLMultiStepFinancial(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'SRL Multi-Step Financial Query';
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🧪 Test 1: ${testName}`);
    console.log(`${'─'.repeat(80)}`);

    try {
      const query = 'Calculate Bitcoin ROI 2020-2024 vs S&P 500, adjust for inflation, and explain which was better for a tax-advantaged account.';
      const domain = 'financial';

      // Step 1: Decompose with SWiRL (with fallback if Ollama fails)
      console.log('   1️⃣  Decomposing query with SWiRL...');
      let decomposition;
      try {
        const decomposer = createSWiRLDecomposer('qwen2.5:14b');
        decomposition = await decomposer.decompose(query, ['web_search', 'calculator', 'sql']);
        console.log(`      ✅ Decomposition: ${decomposition.trajectory.steps.length} steps`);
      } catch (error: any) {
        console.log(`      ⚠️  SWiRL failed (${error.message}), using fallback decomposition`);
        // Fallback: simple decomposition
        decomposition = {
          trajectory: {
            task_id: `fallback-${Date.now()}`,
            original_task: query,
            steps: [
              { step_number: 1, description: 'Retrieve data', reasoning: '', tools_needed: [], complexity_score: 0.5, depends_on: [] },
              { step_number: 2, description: 'Calculate values', reasoning: '', tools_needed: [], complexity_score: 0.5, depends_on: [1] },
              { step_number: 3, description: 'Analyze and synthesize', reasoning: '', tools_needed: [], complexity_score: 0.5, depends_on: [2] }
            ],
            total_complexity: 0.5,
            estimated_time_ms: 5000,
            tools_required: []
          },
          sub_trajectories: [],
          synthesis_plan: 'Fallback synthesis plan'
        };
      }

      // Step 2: Enhance with SRL
      console.log('   2️⃣  Enhancing with SRL supervision...');
      const srlResult = await this.eliza.executeSRLWorkflow(
        query,
        domain,
        decomposition
      );
      console.log(`      ✅ SRL Enhancement complete`);
      console.log(`      📊 Average step reward: ${srlResult.averageReward.toFixed(3)}`);
      console.log(`      📊 Step rewards: ${srlResult.metadata.stepRewards.map((r: number) => r.toFixed(2)).join(', ')}`);
      console.log(`      📊 Trajectory quality: ${srlResult.metadata.trajectoryQuality.toFixed(3)}`);

      const latency = Date.now() - startTime;

      return {
        testName,
        success: true,
        latency,
        metadata: {
          stepsEnhanced: decomposition.trajectory.steps.length,
          averageReward: srlResult.averageReward,
          stepRewards: srlResult.metadata.stepRewards,
          trajectoryQuality: srlResult.metadata.trajectoryQuality
        }
      };
    } catch (error: any) {
      console.error(`      ❌ Test failed: ${error.message}`);
      return {
        testName,
        success: false,
        latency: Date.now() - startTime,
        metadata: {},
        error: error.message
      };
    }
  }

  /**
   * Test 2: SRL on Multi-Step Legal Query
   */
  async testSRLMultiStepLegal(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'SRL Multi-Step Legal Query';
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🧪 Test 2: ${testName}`);
    console.log(`${'─'.repeat(80)}`);

    try {
      const query = 'Analyze the legal implications of a non-compete clause in an employment contract where the employee works remotely from California but the company is based in New York.';
      const domain = 'legal';

      // Step 1: Decompose with SWiRL (with fallback)
      console.log('   1️⃣  Decomposing query with SWiRL...');
      let decomposition;
      try {
        const decomposer = createSWiRLDecomposer('qwen2.5:14b');
        decomposition = await decomposer.decompose(query, ['web_search', 'calculator']);
        console.log(`      ✅ Decomposition: ${decomposition.trajectory.steps.length} steps`);
      } catch (error: any) {
        console.log(`      ⚠️  SWiRL failed, using fallback`);
        decomposition = {
          trajectory: {
            task_id: `fallback-${Date.now()}`,
            original_task: query,
            steps: [
              { step_number: 1, description: 'Identify jurisdictions', reasoning: '', tools_needed: [], complexity_score: 0.6, depends_on: [] },
              { step_number: 2, description: 'Analyze laws', reasoning: '', tools_needed: [], complexity_score: 0.7, depends_on: [1] },
              { step_number: 3, description: 'Determine enforceability', reasoning: '', tools_needed: [], complexity_score: 0.8, depends_on: [2] }
            ],
            total_complexity: 0.7,
            estimated_time_ms: 6000,
            tools_required: []
          },
          sub_trajectories: [],
          synthesis_plan: 'Fallback synthesis plan'
        };
      }

      // Step 2: Enhance with SRL
      console.log('   2️⃣  Enhancing with SRL supervision...');
      const srlResult = await this.eliza.executeSRLWorkflow(
        query,
        domain,
        decomposition
      );
      console.log(`      ✅ SRL Enhancement complete`);
      console.log(`      📊 Average step reward: ${srlResult.averageReward.toFixed(3)}`);
      console.log(`      📊 Trajectory quality: ${srlResult.metadata.trajectoryQuality.toFixed(3)}`);

      const latency = Date.now() - startTime;

      return {
        testName,
        success: true,
        latency,
        metadata: {
          stepsEnhanced: decomposition.trajectory.steps.length,
          averageReward: srlResult.averageReward,
          trajectoryQuality: srlResult.metadata.trajectoryQuality
        }
      };
    } catch (error: any) {
      console.error(`      ❌ Test failed: ${error.message}`);
      return {
        testName,
        success: false,
        latency: Date.now() - startTime,
        metadata: {},
        error: error.message
      };
    }
  }

  /**
   * Test 3: EBM on Refinement Query
   */
  async testEBMRefinement(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'EBM Answer Refinement';
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🧪 Test 3: ${testName}`);
    console.log(`${'─'.repeat(80)}`);

    try {
      const query = 'Based on this employment contract, is the non-compete clause enforceable for a remote California employee?';
      const domain = 'legal';
      const initialAnswer = `Non-compete clauses are generally not enforceable in California under Business and Professions Code Section 16600. Since the employee works remotely from California, California law would likely apply. However, there are limited exceptions for sale of business or trade secrets.`;
      const context = { domain, queryType: 'verification' };

      console.log(`   📝 Initial answer length: ${initialAnswer.length} chars`);
      console.log('   1️⃣  Refining with EBM...');
      
      const ebmResult = await this.eliza.executeEBMWorkflow(
        query,
        domain,
        initialAnswer,
        context
      );

      console.log(`      ✅ EBM Refinement complete`);
      console.log(`      📊 Energy improvement: ${ebmResult.improvement.toFixed(4)}`);
      console.log(`      📊 Refinement steps: ${ebmResult.metadata.stepsCompleted}`);
      console.log(`      📊 Converged: ${ebmResult.metadata.converged}`);
      console.log(`      📊 Refined answer length: ${ebmResult.refinedAnswer.length} chars`);

      const latency = Date.now() - startTime;

      return {
        testName,
        success: true,
        latency,
        metadata: {
          improvement: ebmResult.improvement,
          stepsCompleted: ebmResult.metadata.stepsCompleted,
          converged: ebmResult.metadata.converged,
          energyHistory: ebmResult.metadata.energyHistory,
          answerLengthBefore: initialAnswer.length,
          answerLengthAfter: ebmResult.refinedAnswer.length
        }
      };
    } catch (error: any) {
      console.error(`      ❌ Test failed: ${error.message}`);
      return {
        testName,
        success: false,
        latency: Date.now() - startTime,
        metadata: {},
        error: error.message
      };
    }
  }

  /**
   * Test 4: EBM on Verification Query
   */
  async testEBMVerification(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'EBM Verification Query';
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🧪 Test 4: ${testName}`);
    console.log(`${'─'.repeat(80)}`);

    try {
      const query = 'Verify if the insurance premium calculation is accurate for a 1930s Art Deco Cartier bracelet valued at $45,000 with a $2,000 deductible.';
      const domain = 'insurance';
      const initialAnswer = `The premium calculation appears correct based on standard jewelry insurance rates. For a $45,000 valuation with $2,000 deductible, typical premium is 1-3% of value.`;
      const context = { domain, queryType: 'verification' };

      console.log('   1️⃣  Refining with EBM...');
      
      const ebmResult = await this.eliza.executeEBMWorkflow(
        query,
        domain,
        initialAnswer,
        context
      );

      console.log(`      ✅ EBM Refinement complete`);
      console.log(`      📊 Energy improvement: ${ebmResult.improvement.toFixed(4)}`);
      console.log(`      📊 Converged: ${ebmResult.metadata.converged}`);

      const latency = Date.now() - startTime;

      return {
        testName,
        success: true,
        latency,
        metadata: {
          improvement: ebmResult.improvement,
          converged: ebmResult.metadata.converged,
          stepsCompleted: ebmResult.metadata.stepsCompleted
        }
      };
    } catch (error: any) {
      console.error(`      ❌ Test failed: ${error.message}`);
      return {
        testName,
        success: false,
        latency: Date.now() - startTime,
        metadata: {},
        error: error.message
      };
    }
  }

  /**
   * Test 5: Combined SRL + EBM (Optimal Quality)
   */
  async testCombinedSRLAndEBM(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Combined SRL + EBM (Optimal Quality)';
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🧪 Test 5: ${testName}`);
    console.log(`${'─'.repeat(80)}`);

    try {
      const query = 'Design an experiment to test the efficacy of a new drug compound, including hypothesis formation, control group design, and statistical analysis plan.';
      const domain = 'science';

      // Phase 1: SRL-Enhanced Decomposition
      console.log('   📋 Phase 1: SRL-Enhanced Decomposition');
      let decomposition;
      try {
        const decomposer = createSWiRLDecomposer('qwen2.5:14b');
        decomposition = await decomposer.decompose(query, ['web_search', 'calculator']);
      } catch (error: any) {
        console.log(`      ⚠️  SWiRL failed, using fallback`);
        decomposition = {
          trajectory: {
            task_id: `fallback-${Date.now()}`,
            original_task: query,
            steps: [
              { step_number: 1, description: 'Formulate hypothesis', reasoning: '', tools_needed: [], complexity_score: 0.6, depends_on: [] },
              { step_number: 2, description: 'Design control group', reasoning: '', tools_needed: [], complexity_score: 0.7, depends_on: [1] },
              { step_number: 3, description: 'Plan statistical analysis', reasoning: '', tools_needed: [], complexity_score: 0.7, depends_on: [2] }
            ],
            total_complexity: 0.67,
            estimated_time_ms: 7000,
            tools_required: []
          },
          sub_trajectories: [],
          synthesis_plan: 'Fallback synthesis plan'
        };
      }
      
      const srlResult = await this.eliza.executeSRLWorkflow(
        query,
        domain,
        decomposition
      );
      console.log(`      ✅ SRL: ${srlResult.averageReward.toFixed(3)} avg reward`);

      // Phase 2: Execute steps to get initial answer
      console.log('   📋 Phase 2: Execute Steps');
      let initialAnswer = '';
      for (const step of decomposition.trajectory.steps) {
        const stepResult = await decomposer.executeStep(step, initialAnswer);
        initialAnswer += `\n${step.description}: ${JSON.stringify(stepResult)}`;
      }
      console.log(`      ✅ Generated initial answer (${initialAnswer.length} chars)`);

      // Phase 3: EBM Refinement
      console.log('   📋 Phase 3: EBM Refinement');
      const context = {
        domain,
        queryType: 'multi_step',
        srlReward: srlResult.averageReward,
        steps: decomposition.trajectory.steps.length
      };

      const ebmResult = await this.eliza.executeEBMWorkflow(
        query,
        domain,
        initialAnswer,
        context
      );
      console.log(`      ✅ EBM: ${ebmResult.improvement.toFixed(4)} energy improvement`);

      const latency = Date.now() - startTime;

      // Calculate overall quality score
      const qualityScore = (srlResult.averageReward * 0.5) + (Math.min(1.0, ebmResult.improvement / 0.2) * 0.5);

      console.log(`\n   📊 Combined Quality Score: ${qualityScore.toFixed(3)}`);

      return {
        testName,
        success: true,
        latency,
        metadata: {
          qualityScore,
          srlAverageReward: srlResult.averageReward,
          ebmImprovement: ebmResult.improvement,
          ebmConverged: ebmResult.metadata.converged,
          stepsEnhanced: decomposition.trajectory.steps.length,
          refinementSteps: ebmResult.metadata.stepsCompleted
        }
      };
    } catch (error: any) {
      console.error(`      ❌ Test failed: ${error.message}`);
      return {
        testName,
        success: false,
        latency: Date.now() - startTime,
        metadata: {},
        error: error.message
      };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('\n' + '═'.repeat(80));
    console.log('🧪 ELIZAOS INTEGRATION TEST SUITE');
    console.log('═'.repeat(80));
    console.log('\nTesting SRL + EBM implementation with ElizaOS patterns\n');

    // Initialize
    await this.initialize();

    // Run tests
    this.results.push(await this.testSRLMultiStepFinancial());
    this.results.push(await this.testSRLMultiStepLegal());
    this.results.push(await this.testEBMRefinement());
    this.results.push(await this.testEBMVerification());
    this.results.push(await this.testCombinedSRLAndEBM());

    // Generate report
    this.generateReport();

    // Cleanup
    await this.eliza.stop();
  }

  /**
   * Generate test report
   */
  private generateReport(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 TEST REPORT');
    console.log('═'.repeat(80));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const avgLatency = this.results.reduce((sum, r) => sum + r.latency, 0) / this.results.length;

    console.log(`\n✅ Successful: ${successful}/${this.results.length}`);
    console.log(`❌ Failed: ${failed}/${this.results.length}`);
    console.log(`⏱️  Average Latency: ${avgLatency.toFixed(0)}ms\n`);

    for (const result of this.results) {
      console.log(`${result.success ? '✅' : '❌'} ${result.testName}`);
      console.log(`   Latency: ${result.latency}ms`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   Metadata: ${JSON.stringify(result.metadata, null, 2).substring(0, 200)}...`);
      }
      console.log('');
    }

    // Summary statistics
    console.log('\n' + '─'.repeat(80));
    console.log('📈 SUMMARY STATISTICS');
    console.log('─'.repeat(80));

    const srlTests = this.results.filter(r => r.testName.includes('SRL'));
    const ebmTests = this.results.filter(r => r.testName.includes('EBM'));
    const combinedTests = this.results.filter(r => r.testName.includes('Combined'));

    if (srlTests.length > 0) {
      const avgSRLReward = srlTests
        .map(r => r.metadata?.averageReward || 0)
        .reduce((a, b) => a + b, 0) / srlTests.length;
      console.log(`\nSRL Tests:`);
      console.log(`  Average Step Reward: ${avgSRLReward.toFixed(3)}`);
    }

    if (ebmTests.length > 0) {
      const avgEBMImprovement = ebmTests
        .map(r => r.metadata?.improvement || 0)
        .reduce((a, b) => a + b, 0) / ebmTests.length;
      console.log(`\nEBM Tests:`);
      console.log(`  Average Energy Improvement: ${avgEBMImprovement.toFixed(4)}`);
    }

    if (combinedTests.length > 0) {
      const avgQualityScore = combinedTests
        .map(r => r.metadata?.qualityScore || 0)
        .reduce((a, b) => a + b, 0) / combinedTests.length;
      console.log(`\nCombined Tests:`);
      console.log(`  Average Quality Score: ${avgQualityScore.toFixed(3)}`);
    }
  }
}

// Run tests
async function main() {
  const tester = new ElizaIntegrationTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { ElizaIntegrationTester };

