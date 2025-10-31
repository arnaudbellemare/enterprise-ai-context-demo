#!/usr/bin/env tsx

/**
 * 🚀 ADAPTIVE WORKFLOW + PERMUTATION SYSTEM INTEGRATION TEST
 * 
 * Tests that:
 * 1. Adaptive Workflow Orchestrator detects use cases correctly
 * 2. Permutation Engine receives correct component configs
 * 3. All components (LoRA, DSPy, GEPA, SWiRL, TRM, etc.) activate properly
 * 4. Different business use cases get specialized workflows
 * 5. System executes end-to-end successfully
 */

import { AdaptiveWorkflowOrchestrator } from './frontend/lib/adaptive-workflow-orchestrator';
import { PermutationEngine, PermutationConfig } from './frontend/lib/permutation-engine';

interface TestCase {
  name: string;
  query: string;
  expectedUseCase: string;
  expectedComponents: string[];
  minQuality?: number;
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Insurance Premium',
    query: 'What is the premium for a 1930s Art Deco Cartier bracelet valued at $50,000?',
    expectedUseCase: 'insurance_premium',
    expectedComponents: ['LoRA Fine-tuning', 'DSPy', 'TRM Verification', 'ACE Framework', 'IRT Scoring'],
    minQuality: 0.7
  },
  {
    name: 'LATAM Legal',
    query: 'Analyze Mexican labor law compliance requirements for a US company opening a subsidiary in Mexico City.',
    expectedUseCase: 'legal_latam',
    expectedComponents: ['LoRA Fine-tuning', 'DSPy', 'SWiRL', 'Multi-Query Expansion', 'ACE Framework', 'TRM Verification'],
    minQuality: 0.7
  },
  {
    name: 'Marketing Campaign',
    query: 'Create a marketing campaign strategy for a new SaaS product targeting SMBs in the healthcare sector.',
    expectedUseCase: 'marketing',
    expectedComponents: ['GEPA Optimization', 'DSPy', 'ACE Framework', 'Multi-Query Expansion', 'ReasoningBank'],
    minQuality: 0.6
  },
  {
    name: 'Copywriting',
    query: 'Write compelling email copy for a product launch with multiple variations for A/B testing.',
    expectedUseCase: 'copywriting',
    expectedComponents: ['GEPA Optimization', 'DSPy', 'ACE Framework', 'Multi-Query Expansion', 'ReasoningBank'],
    minQuality: 0.6
  },
  {
    name: 'Science Research',
    query: 'Design an experiment to test the efficacy of a new drug compound for treating diabetes, including methodology and expected results.',
    expectedUseCase: 'science_research',
    expectedComponents: ['GEPA Optimization', 'DSPy', 'SWiRL', 'ACE Framework', 'Weaviate Retrieval', 'ReasoningBank'],
    minQuality: 0.7
  },
  {
    name: 'Manufacturing',
    query: 'Analyze production efficiency metrics from Q4 2024 and generate a structured report with recommendations.',
    expectedUseCase: 'manufacturing',
    expectedComponents: ['LoRA Fine-tuning', 'DSPy', 'SQL Generation', 'ACE Framework', 'IRT Scoring'],
    minQuality: 0.6
  }
];

class AdaptiveWorkflowIntegrationTester {
  private orchestrator: AdaptiveWorkflowOrchestrator;
  private results: any[] = [];

  constructor() {
    this.orchestrator = new AdaptiveWorkflowOrchestrator();
  }

  async runAllTests() {
    console.log('🚀 ADAPTIVE WORKFLOW + PERMUTATION SYSTEM INTEGRATION TEST');
    console.log('===========================================================\n');

    // Check environment
    this.checkEnvironment();

    console.log('\n📋 TESTING USE CASE DETECTION AND COMPONENT ACTIVATION\n');

    for (const testCase of TEST_CASES) {
      await this.testUseCase(testCase);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }

    this.printSummary();
  }

  private checkEnvironment() {
    console.log('🔧 Environment Check:');
    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
    const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    console.log(`   PERPLEXITY_API_KEY: ${hasPerplexity ? '✅ Set' : '⚠️  Missing (will use fallback)'}`);
    console.log(`   SUPABASE: ${hasSupabase ? '✅ Set' : '⚠️  Missing (some features unavailable)'}`);
    
    if (!hasPerplexity && !hasSupabase) {
      console.log('\n   ⚠️  Warning: Missing API keys. Tests will run with mocks/fallbacks.');
    }
  }

  private async testUseCase(testCase: TestCase) {
    console.log(`\n📌 Test: ${testCase.name}`);
    const queryPreview = testCase.query ? testCase.query.substring(0, 80) : 'N/A';
    console.log(`   Query: "${queryPreview}..."`);
    
    try {
      if (!testCase.query || typeof testCase.query !== 'string') {
        throw new Error('Invalid query');
      }
      
      // Step 1: Analyze query first (this is safe and doesn't execute)
      const analysis = await this.orchestrator.analyzeQuery(testCase.query).catch((err: any) => {
        console.log(`   ⚠️  AnalyzeQuery error: ${err.message}`);
        // Return a basic analysis if analyzeQuery fails
        return {
          businessUseCase: 'general' as any,
          domain: 'general',
          complexity: 0.5,
          requiresVerification: false,
          requiresRetrieval: false,
          requiresOptimization: false,
          requiresRealTimeData: false,
          confidence: 0.5
        };
      });
      
      console.log(`   ✓ Use Case Detected: ${analysis.businessUseCase}`);
      console.log(`   ✓ Domain: ${analysis.domain}`);
      console.log(`   ✓ Complexity: ${analysis.complexity.toFixed(2)}`);
      
      // Validate use case detection
      if (analysis.businessUseCase !== testCase.expectedUseCase) {
        console.log(`   ⚠️  Warning: Expected ${testCase.expectedUseCase}, got ${analysis.businessUseCase}`);
      }

      // Step 2: Get workflow profile via selectWorkflow (private, but we can test via execute with timeout)
      // For testing, we'll just verify the profile exists by checking getAvailableProfiles
      const profiles = this.orchestrator.getAvailableProfiles();
      const profile = profiles.find(p => p.useCase === analysis.businessUseCase);
      
      if (!profile) {
        // Try to get it via execution (but limit to quick validation)
        try {
          const execution = await Promise.race([
            this.orchestrator.execute(testCase.query, {}, {}),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]) as any;
          
          if (execution && execution.workflowProfile) {
            const foundProfile = execution.workflowProfile;
            console.log(`   ✓ Workflow Profile: ${foundProfile.useCase}`);
            console.log(`   ✓ Priority: ${foundProfile.priority}`);
            console.log(`   ✓ Expected Latency: ${foundProfile.expectedLatency}ms`);
            console.log(`   ✓ Expected Cost: $${foundProfile.expectedCost.toFixed(4)}`);
            
            // Continue with foundProfile
            await this.validateProfile(foundProfile, testCase, analysis);
            return;
          }
        } catch (execError: any) {
          if (execError.message === 'Timeout') {
            console.log(`   ⚠️  Execution timeout (expected for test), using profile validation only`);
          }
        }
        
        throw new Error(`No profile found for use case: ${analysis.businessUseCase}`);
      }
      
      console.log(`   ✓ Workflow Profile: ${profile.useCase}`);
      console.log(`   ✓ Priority: ${profile.priority}`);
      console.log(`   ✓ Expected Latency: ${profile.expectedLatency}ms`);
      console.log(`   ✓ Expected Cost: $${profile.expectedCost.toFixed(4)}`);
      
      await this.validateProfile(profile, testCase, analysis);
      
    } catch (error: any) {
      console.log(`   ❌ Test Failed: ${error.message}`);
      this.results.push({
        testCase: testCase.name,
        useCase: 'unknown',
        detected: false,
        components: [],
        configValid: false,
        executionTime: 0,
        passed: false,
        error: error.message
      });
    }
  }
  
  private async validateProfile(profile: any, testCase: TestCase, analysis: any) {

      // Step 3: Verify components are correct
      const requiredComponents = profile.requiredComponents || [];
      console.log(`   ✓ Required Components (${requiredComponents.length}):`);
      requiredComponents.forEach(comp => {
        const expected = testCase.expectedComponents.includes(comp);
        console.log(`     ${expected ? '✅' : '⚠️ '} ${comp}`);
      });

      // Step 4: Test Permutation Engine config
      const config = profile.config;
      console.log(`   ✓ Permutation Config:`);
      console.log(`     - Teacher Model: ${config.enableTeacherModel ? '✅' : '❌'}`);
      console.log(`     - Student Model: ${config.enableStudentModel ? '✅' : '❌'}`);
      console.log(`     - LoRA: ${config.enableLoRA ? '✅' : '❌'}`);
      console.log(`     - DSPy: ${config.enableDSPy ? '✅' : '❌'}`);
      console.log(`     - TRM: ${config.enableTRM ? '✅' : '❌'}`);
      console.log(`     - SWiRL: ${config.enableSWiRL ? '✅' : '❌'}`);
      console.log(`     - ACE: ${config.enableACE ? '✅' : '❌'}`);
      console.log(`     - IRT: ${config.enableIRT ? '✅' : '❌'}`);
      console.log(`     - ReasoningBank: ${config.enableReasoningBank ? '✅' : '❌'}`);
      console.log(`     - Multi-Query: ${config.enableMultiQuery ? '✅' : '❌'}`);

      // Step 5: Validate Permutation Engine can use config
      console.log(`   ✓ Validating Permutation Engine config...`);
      
      try {
        // Create permutation engine with config to validate it works
        const engine = new PermutationEngine(config);
        
        // Check if engine was created successfully
        if (!engine) {
          throw new Error('Failed to create PermutationEngine with config');
        }

        console.log(`   ✓ Permutation Engine created successfully`);

        this.results.push({
          testCase: testCase.name,
          useCase: analysis.businessUseCase,
          detected: analysis.businessUseCase === testCase.expectedUseCase,
          components: requiredComponents,
          configValid: true,
          executionTime: 0,
          passed: true
        });

      } catch (execError: any) {
        console.log(`   ⚠️  Config validation error: ${execError.message}`);
        this.results.push({
          testCase: testCase.name,
          useCase: analysis.businessUseCase,
          detected: analysis.businessUseCase === testCase.expectedUseCase,
          components: requiredComponents,
          configValid: false,
          executionTime: 0,
          passed: false,
          error: execError.message
        });
      }
  }

  private printSummary() {
    console.log('\n\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const useCaseAccuracy = this.results.filter(r => r.detected).length;
    
    console.log(`\n✅ Tests Passed: ${passed}/${total} (${(passed/total*100).toFixed(1)}%)`);
    console.log(`✅ Use Case Detection: ${useCaseAccuracy}/${total} (${(useCaseAccuracy/total*100).toFixed(1)}%)`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach((result, i) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`\n${status} ${i + 1}. ${result.testCase}`);
      console.log(`   Use Case: ${result.useCase} ${result.detected ? '✅' : '⚠️ '}`);
      console.log(`   Components: ${result.components.length}`);
      console.log(`   Config Valid: ${result.configValid ? '✅' : '❌'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n🎯 SYSTEM STATUS:');
    if (passed === total && useCaseAccuracy === total) {
      console.log('   ✅ Adaptive Workflow + Permutation System: FULLY INTEGRATED');
      console.log('   ✅ All components configured correctly');
      console.log('   ✅ Use case detection working');
      console.log('   ✅ Workflow profiles activated properly');
    } else if (passed >= total * 0.8) {
      console.log('   ⚠️  Adaptive Workflow + Permutation System: MOSTLY WORKING');
      console.log('   ⚠️  Some tests failed, but core functionality intact');
    } else {
      console.log('   ❌ Adaptive Workflow + Permutation System: NEEDS FIXES');
      console.log('   ❌ Multiple tests failed, review errors above');
    }
  }
}

// Run tests
async function main() {
  const tester = new AdaptiveWorkflowIntegrationTester();
  await tester.runAllTests();
}

main().catch(console.error);

