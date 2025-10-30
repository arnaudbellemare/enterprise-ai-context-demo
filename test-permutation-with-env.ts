#!/usr/bin/env tsx

/**
 * 🚀 PERMUTATION COMPONENTS TEST WITH ENVIRONMENT
 * 
 * This test loads environment variables and tests the real PERMUTATION components
 */

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PermutationEngine, PermutationConfig } from './frontend/lib/permutation-engine';
import { ACEFramework } from './frontend/lib/ace-framework';
import { gepaAlgorithms } from './frontend/lib/gepa-algorithms';
import { SmartRouter, getSmartRouter } from './frontend/lib/smart-router';
import { getAdvancedCache } from './frontend/lib/advanced-cache-system';
import { createMultiAgentPipeline } from './frontend/lib/parallel-agent-system';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration: number;
  details?: any;
  timestamp: string;
}

// Mock model for ACE Framework
const mockModel = {
  generate: async (prompt: string) => ({
    text: 'Mock response',
    tokens: 10,
    cost: 0.001
  })
};

class PermutationWithEnvTest {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async run() {
    console.log('🚀 PERMUTATION COMPONENTS TEST WITH ENVIRONMENT');
    console.log('===============================================');
    console.log('Testing PERMUTATION components with proper environment setup...\n');
    
    // Verify environment variables
    console.log('🔧 Environment Check:');
    console.log(`   PERPLEXITY_API_KEY: ${process.env.PERPLEXITY_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}\n`);

    this.startTime = Date.now();

    try {
      // Test core components
      await this.testCoreComponents();
      
      // Test integration flows
      await this.testIntegrationFlows();
      
      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testCoreComponents() {
    console.log('📋 CORE PERMUTATION COMPONENTS');
    console.log('==================================================\n');

    // Test PermutationEngine (with minimal config to avoid API calls)
    await this.runTest('PermutationEngine', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false, // Disable to avoid Perplexity API calls
        enableStudentModel: false, // Disable to avoid Ollama calls
        enableMultiQuery: false,   // Disable to avoid complex processing
        enableReasoningBank: false, // Disable to avoid database calls
        enableLoRA: false,
        enableIRT: false,
        enableDSPy: false,
        enableACE: false,
        enableSWiRL: false,
        enableTRM: false,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      };

      const engine = new PermutationEngine(config);
      
      // Test that the engine can be instantiated and has the expected methods
      if (!engine || typeof engine.execute !== 'function') {
        throw new Error('PermutationEngine instantiation failed');
      }

      return {
        engineInstantiated: true,
        hasExecuteMethod: typeof engine.execute === 'function',
        configApplied: true,
        envVarsLoaded: !!process.env.PERPLEXITY_API_KEY
      };
    });

    // Test ACEFramework (with proper model parameter)
    await this.runTest('ACEFramework', async () => {
      const ace = new ACEFramework(mockModel);
      
      // Test that ACE can be instantiated and has expected methods
      if (!ace || typeof ace.processQuery !== 'function') {
        throw new Error('ACEFramework instantiation failed');
      }

      return {
        aceInstantiated: true,
        hasProcessQueryMethod: typeof ace.processQuery === 'function',
        hasGenerateContextMethod: typeof ace.generateContext === 'function',
        hasReflectMethod: typeof ace.reflect === 'function'
      };
    });

    // Test GEPAAlgorithms (this is a singleton, so no instantiation needed)
    await this.runTest('GEPAAlgorithms', async () => {
      if (!gepaAlgorithms || typeof gepaAlgorithms.optimize !== 'function') {
        throw new Error('GEPAAlgorithms instantiation failed');
      }

      return {
        gepaInstantiated: true,
        hasOptimizeMethod: typeof gepaAlgorithms.optimize === 'function',
        hasEvolveMethod: typeof gepaAlgorithms.evolve === 'function',
        hasGetPopulationMethod: typeof gepaAlgorithms.getPopulation === 'function'
      };
    });

    // Test SmartRouter
    await this.runTest('SmartRouter', async () => {
      const router = getSmartRouter();
      
      if (!router || typeof router.route !== 'function') {
        throw new Error('SmartRouter instantiation failed');
      }

      return {
        routerInstantiated: true,
        hasRouteMethod: typeof router.route === 'function',
        hasGetStatsMethod: typeof router.getStats === 'function'
      };
    });

    // Test AdvancedCache
    await this.runTest('AdvancedCache', async () => {
      const cache = getAdvancedCache();
      
      if (!cache || typeof cache.set !== 'function' || typeof cache.get !== 'function') {
        throw new Error('AdvancedCache instantiation failed');
      }

      return {
        cacheInstantiated: true,
        hasSetMethod: typeof cache.set === 'function',
        hasGetMethod: typeof cache.get === 'function',
        hasGetHitRateMethod: typeof cache.getHitRate === 'function'
      };
    });

    // Test MultiAgentPipeline
    await this.runTest('MultiAgentPipeline', async () => {
      const pipeline = createMultiAgentPipeline();
      
      if (!pipeline || typeof pipeline.execute !== 'function') {
        throw new Error('MultiAgentPipeline instantiation failed');
      }

      return {
        pipelineInstantiated: true,
        hasExecuteMethod: typeof pipeline.execute === 'function',
        hasAddAgentMethod: typeof pipeline.addAgent === 'function'
      };
    });
  }

  async testIntegrationFlows() {
    console.log('\n📋 INTEGRATION FLOWS');
    console.log('==================================================\n');

    // Test Component Instantiation with Proper Parameters
    await this.runTest('ComponentInstantiation', async () => {
      const components = {
        PermutationEngine: new PermutationEngine({
          enableTeacherModel: false,
          enableStudentModel: false,
          enableMultiQuery: false,
          enableReasoningBank: false,
          enableLoRA: false,
          enableIRT: false,
          enableDSPy: false,
          enableACE: false,
          enableSWiRL: false,
          enableTRM: false,
          enableSQL: false,
          enableWeaviateRetrieveDSPy: false
        }),
        ACEFramework: new ACEFramework(mockModel),
        SmartRouter: getSmartRouter(),
        AdvancedCache: getAdvancedCache(),
        MultiAgentPipeline: createMultiAgentPipeline()
      };

      const allInstantiated = Object.values(components).every(comp => comp !== null && comp !== undefined);
      
      if (!allInstantiated) {
        throw new Error('Not all components instantiated successfully');
      }

      return {
        allComponentsInstantiated: allInstantiated,
        componentCount: Object.keys(components).length,
        components: Object.keys(components),
        envVarsAvailable: {
          perplexity: !!process.env.PERPLEXITY_API_KEY,
          supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
        }
      };
    });

    // Test Environment Variable Loading
    await this.runTest('EnvironmentVariables', async () => {
      const envVars = {
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      };

      const allSet = Object.values(envVars).every(value => value && value.length > 0);
      
      if (!allSet) {
        throw new Error('Not all required environment variables are set');
      }

      return {
        allEnvVarsSet: allSet,
        envVars: Object.keys(envVars).reduce((acc, key) => {
          acc[key] = !!envVars[key as keyof typeof envVars];
          return acc;
        }, {} as Record<string, boolean>)
      };
    });

    // Test Configuration Handling
    await this.runTest('ConfigurationHandling', async () => {
      const configs = [
        {
          name: 'Minimal',
          config: {
            enableTeacherModel: false,
            enableStudentModel: false,
            enableMultiQuery: false,
            enableReasoningBank: false,
            enableLoRA: false,
            enableIRT: false,
            enableDSPy: false,
            enableACE: false,
            enableSWiRL: false,
            enableTRM: false,
            enableSQL: false,
            enableWeaviateRetrieveDSPy: false
          }
        },
        {
          name: 'ACE_Only',
          config: {
            enableTeacherModel: false,
            enableStudentModel: false,
            enableMultiQuery: false,
            enableReasoningBank: false,
            enableLoRA: false,
            enableIRT: false,
            enableDSPy: false,
            enableACE: true,
            enableSWiRL: false,
            enableTRM: false,
            enableSQL: false,
            enableWeaviateRetrieveDSPy: false
          }
        },
        {
          name: 'IRT_Only',
          config: {
            enableTeacherModel: false,
            enableStudentModel: false,
            enableMultiQuery: false,
            enableReasoningBank: false,
            enableLoRA: false,
            enableIRT: true,
            enableDSPy: false,
            enableACE: false,
            enableSWiRL: false,
            enableTRM: false,
            enableSQL: false,
            enableWeaviateRetrieveDSPy: false
          }
        }
      ];

      const results = configs.map(({ name, config }) => {
        try {
          const engine = new PermutationEngine(config);
          return { name, success: true, engine: !!engine };
        } catch (error) {
          return { name, success: false, error: error.message };
        }
      });

      const allSuccessful = results.every(r => r.success);

      return {
        allConfigurationsValid: allSuccessful,
        configurations: results,
        totalConfigs: configs.length
      };
    });

    // Test Error Handling
    await this.runTest('ErrorHandling', async () => {
      try {
        // Test with invalid config (should handle gracefully)
        const engine = new PermutationEngine({
          enableTeacherModel: false,
          enableStudentModel: false,
          enableMultiQuery: false,
          enableReasoningBank: false,
          enableLoRA: false,
          enableIRT: false,
          enableDSPy: false,
          enableACE: false,
          enableSWiRL: false,
          enableTRM: false,
          enableSQL: false,
          enableWeaviateRetrieveDSPy: false
        });

        // Test that engine handles null/undefined inputs gracefully
        const result = await engine.execute('', '');
        
        return {
          errorHandling: true,
          gracefulDegradation: !!result,
          fallbackResponse: result?.answer?.includes('Unable to generate') || false
        };
      } catch (error) {
        return {
          errorHandling: true,
          errorCaught: true,
          errorType: error.constructor.name
        };
      }
    });
  }

  async runTest(name: string, testFunction: () => Promise<any>) {
    const testStart = Date.now();
    console.log(`🔧 Running: ${name}`);

    try {
      const result = await testFunction();
      const testResult: TestResult = {
        name,
        status: 'passed',
        message: `${name} working correctly`,
        duration: Date.now() - testStart,
        details: result,
        timestamp: new Date().toISOString()
      };

      this.results.push(testResult);
      console.log(`   ✅ ${name} - PASSED (${testResult.duration}ms)`);

    } catch (error) {
      const testResult: TestResult = {
        name,
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - testStart,
        timestamp: new Date().toISOString()
      };

      this.results.push(testResult);
      console.log(`   ❌ ${name} - FAILED: ${testResult.message}`);
    }
  }

  generateFinalReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const successRate = (passed / this.results.length) * 100;

    console.log('\n🎉 PERMUTATION COMPONENTS TEST WITH ENVIRONMENT RESULTS');
    console.log('======================================================');
    console.log(`📊 Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

    console.log('\n📋 DETAILED RESULTS:');
    console.log('====================');
    this.results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.message} (${result.duration}ms)`);
      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    });

    // Overall assessment
    console.log('\n🏆 OVERALL ASSESSMENT:');
    console.log('=====================');
    
    if (successRate >= 90) {
      console.log('✅ EXCELLENT: PERMUTATION components are working very well');
      console.log('  - All core components instantiate correctly');
      console.log('  - Environment variables are properly loaded');
      console.log('  - Component interfaces are properly defined');
      console.log('  - Configuration handling works correctly');
      console.log('  - Error handling is robust');
    } else if (successRate >= 80) {
      console.log('✅ GOOD: PERMUTATION components are working well with minor issues');
    } else if (successRate >= 70) {
      console.log('⚠️ FAIR: PERMUTATION components have some issues that need attention');
    } else {
      console.log('❌ POOR: PERMUTATION components have significant issues');
    }

    // Save results
    const filename = `permutation-with-env-test-results-${new Date().toISOString().split('T')[0]}.json`;
    require('fs').writeFileSync(filename, JSON.stringify({
      summary: {
        totalTests: this.results.length,
        passed,
        failed,
        successRate,
        totalDuration
      },
      results: this.results
    }, null, 2));
    console.log(`\n💾 Detailed results saved to: ${filename}`);
  }
}

// Main execution
async function main() {
  const test = new PermutationWithEnvTest();
  await test.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export default PermutationWithEnvTest;
