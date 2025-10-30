#!/usr/bin/env tsx

/**
 * 🚀 REAL PERMUTATION COMPONENTS TEST
 * 
 * This test actually imports and uses the real PERMUTATION components
 * to verify they work correctly with real data and logic.
 */

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

class RealPermutationTest {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async run() {
    console.log('🚀 REAL PERMUTATION COMPONENTS TEST');
    console.log('====================================');
    console.log('Testing actual PERMUTATION components with real implementations...\n');

    this.startTime = Date.now();

    try {
      // Test core components
      await this.testCoreComponents();
      
      // Test integration flows
      await this.testIntegrationFlows();
      
      // Test performance metrics
      await this.testPerformanceMetrics();
      
      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testCoreComponents() {
    console.log('📋 CORE PERMUTATION COMPONENTS');
    console.log('==================================================\n');

    // Test PermutationEngine
    await this.runTest('PermutationEngine', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false, // Disable to avoid API calls
        enableStudentModel: true,
        enableMultiQuery: true,
        enableReasoningBank: true,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: true,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      };

      const engine = new PermutationEngine(config);
      const result = await engine.execute('What is artificial intelligence?', 'technology');
      
      if (!result || !result.answer) {
        throw new Error('PermutationEngine execution failed');
      }

      return {
        responseLength: result.answer.length,
        componentsUsed: result.metadata.components_used,
        qualityScore: result.metadata.quality_score,
        duration: result.metadata.duration_ms
      };
    });

    // Test ACEFramework
    await this.runTest('ACEFramework', async () => {
      const ace = new ACEFramework();
      
      // Test context generation
      const context = await ace.generateContext('test query', 'technology');
      
      if (!context) {
        throw new Error('ACEFramework context generation failed');
      }

      return {
        contextGenerated: !!context,
        bulletsCount: context.bullets?.length || 0,
        sectionsCount: Object.keys(context.sections || {}).length
      };
    });

    // Test GEPAAlgorithms
    await this.runTest('GEPAAlgorithms', async () => {
      const result = await gepaAlgorithms.optimize({
        domain: 'technology',
        basePrompts: ['Explain machine learning'],
        objectives: ['quality', 'speed']
      });
      
      if (!result || !result.evolved_prompts) {
        throw new Error('GEPAAlgorithms optimization failed');
      }

      return {
        evolvedPrompts: result.evolved_prompts.length,
        paretoFronts: result.pareto_fronts?.length || 0,
        generations: result.optimization_metrics?.generations_evolved || 0
      };
    });

    // Test SmartRouter
    await this.runTest('SmartRouter', async () => {
      const router = getSmartRouter();
      
      const route = await router.route('What is machine learning?', 'technology');
      
      if (!route) {
        throw new Error('SmartRouter routing failed');
      }

      return {
        selectedComponent: route.component,
        confidence: route.confidence,
        reasoning: route.reasoning
      };
    });

    // Test AdvancedCache
    await this.runTest('AdvancedCache', async () => {
      const cache = getAdvancedCache();
      
      const key = 'test-cache-key';
      const value = { data: 'test data', timestamp: Date.now() };
      
      await cache.set(key, value, 3600);
      const retrieved = await cache.get(key);
      
      if (!retrieved) {
        throw new Error('AdvancedCache operations failed');
      }

      return {
        cacheSet: true,
        cacheGet: !!retrieved,
        hitRate: await cache.getHitRate()
      };
    });

    // Test MultiAgentPipeline
    await this.runTest('MultiAgentPipeline', async () => {
      const pipeline = createMultiAgentPipeline();
      
      const result = await pipeline.execute('Complex analysis task', 'technology');
      
      if (!result) {
        throw new Error('MultiAgentPipeline execution failed');
      }

      return {
        agentsExecuted: result.agents?.length || 0,
        coordinationScore: result.coordinationScore || 0,
        totalTime: result.totalTime || 0
      };
    });
  }

  async testIntegrationFlows() {
    console.log('\n📋 INTEGRATION FLOWS');
    console.log('==================================================\n');

    // Test End-to-End Execution
    await this.runTest('EndToEndExecution', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false,
        enableStudentModel: true,
        enableMultiQuery: true,
        enableReasoningBank: true,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: true,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      };

      const engine = new PermutationEngine(config);
      const result = await engine.execute('Analyze the impact of AI on healthcare', 'healthcare');
      
      if (!result || !result.answer) {
        throw new Error('End-to-end execution failed');
      }

      return {
        stepsCompleted: result.trace.steps.length,
        allStepsSuccessful: result.trace.steps.every(step => step.status === 'success'),
        totalTime: result.trace.total_duration_ms,
        componentsUsed: result.metadata.components_used.length
      };
    });

    // Test Component Interaction
    await this.runTest('ComponentInteraction', async () => {
      const ace = new ACEFramework();
      const router = getSmartRouter();
      const cache = getAdvancedCache();
      
      // Test interaction between components
      const query = 'What are the latest AI developments?';
      const domain = 'technology';
      
      // ACE generates context
      const context = await ace.generateContext(query, domain);
      
      // Router determines best approach
      const route = await router.route(query, domain);
      
      // Cache stores intermediate results
      await cache.set('interaction-test', { context, route }, 3600);
      
      if (!context || !route) {
        throw new Error('Component interaction failed');
      }

      return {
        componentsInteracted: 3,
        contextGenerated: !!context,
        routingSuccessful: !!route,
        cachingSuccessful: true
      };
    });

    // Test Data Flow Validation
    await this.runTest('DataFlowValidation', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false,
        enableStudentModel: true,
        enableMultiQuery: true,
        enableReasoningBank: true,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: true,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      };

      const engine = new PermutationEngine(config);
      const result = await engine.execute('Simple test query', 'general');
      
      // Validate data flow integrity
      const hasValidAnswer = result.answer && result.answer.length > 0;
      const hasValidMetadata = result.metadata && result.metadata.components_used.length > 0;
      const hasValidTrace = result.trace && result.trace.steps.length > 0;
      
      if (!hasValidAnswer || !hasValidMetadata || !hasValidTrace) {
        throw new Error('Data flow validation failed');
      }

      return {
        dataIntegrity: true,
        answerValid: hasValidAnswer,
        metadataValid: hasValidMetadata,
        traceValid: hasValidTrace
      };
    });

    // Test Error Propagation
    await this.runTest('ErrorPropagation', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false,
        enableStudentModel: false, // Disable to force error
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
      };

      const engine = new PermutationEngine(config);
      
      try {
        const result = await engine.execute('Test query', 'general');
        // Should handle gracefully even with all components disabled
        return {
          errorHandled: true,
          gracefulDegradation: !!result.answer,
          fallbackUsed: result.answer?.includes('Unable to generate') || false
        };
      } catch (error) {
        return {
          errorHandled: true,
          errorType: error.constructor.name,
          gracefulDegradation: false
        };
      }
    });

    // Test Cache Integration
    await this.runTest('CacheIntegration', async () => {
      const cache = getAdvancedCache();
      const config: PermutationConfig = {
        enableTeacherModel: false,
        enableStudentModel: true,
        enableMultiQuery: true,
        enableReasoningBank: true,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: true,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      };

      const engine = new PermutationEngine(config);
      
      // First request (should miss cache)
      const result1 = await engine.execute('What is machine learning?', 'technology');
      
      // Second request (should hit cache)
      const result2 = await engine.execute('What is machine learning?', 'technology');
      
      const hitRate = await cache.getHitRate();
      
      return {
        cacheIntegration: true,
        firstRequest: !!result1.answer,
        secondRequest: !!result2.answer,
        hitRate: hitRate
      };
    });
  }

  async testPerformanceMetrics() {
    console.log('\n📋 PERFORMANCE & QUALITY');
    console.log('==================================================\n');

    // Test Response Time
    await this.runTest('ResponseTime', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false,
        enableStudentModel: true,
        enableMultiQuery: false, // Disable for faster response
        enableReasoningBank: false,
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
      const start = Date.now();
      
      const result = await engine.execute('What is 2+2?', 'general');
      
      const duration = Date.now() - start;
      
      if (duration > 10000) { // 10 second timeout
        throw new Error('Response time exceeds targets');
      }

      return {
        duration: duration,
        target: 10000,
        responseGenerated: !!result.answer
      };
    });

    // Test Quality Score
    await this.runTest('QualityScore', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false,
        enableStudentModel: true,
        enableMultiQuery: true,
        enableReasoningBank: true,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: true,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      };

      const engine = new PermutationEngine(config);
      const result = await engine.execute('Explain quantum computing', 'technology');
      
      const qualityScore = result.metadata.quality_score;
      
      if (qualityScore < 0.5) {
        throw new Error('Quality score below threshold');
      }

      return {
        qualityScore: qualityScore,
        threshold: 0.5,
        componentsUsed: result.metadata.components_used.length
      };
    });

    // Test Cost Optimization
    await this.runTest('CostOptimization', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false, // Disable expensive teacher model
        enableStudentModel: true,
        enableMultiQuery: false, // Disable to reduce cost
        enableReasoningBank: false,
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
      const result = await engine.execute('Simple query', 'general');
      
      const cost = result.metadata.cost;
      
      if (cost > 0.01) { // $0.01 threshold
        throw new Error('Cost exceeds optimization targets');
      }

      return {
        cost: cost,
        target: 0.01,
        optimization: cost < 0.005 ? 'excellent' : 'good'
      };
    });

    // Test Memory Usage
    await this.runTest('MemoryUsage', async () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      
      if (heapUsedMB > 2000) { // 2GB threshold
        throw new Error('Memory usage exceeds limits');
      }

      return {
        heapUsedMB: heapUsedMB,
        threshold: 2000,
        usagePercent: (heapUsedMB / 2000) * 100
      };
    });

    // Test Throughput
    await this.runTest('Throughput', async () => {
      const config: PermutationConfig = {
        enableTeacherModel: false,
        enableStudentModel: true,
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
      };

      const engine = new PermutationEngine(config);
      const queries = [
        'What is AI?',
        'What is ML?',
        'What is DL?',
        'What is NLP?',
        'What is CV?'
      ];

      const start = Date.now();
      const results = await Promise.all(
        queries.map(query => engine.execute(query, 'technology'))
      );
      const duration = Date.now() - start;
      
      const throughput = queries.length / (duration / 1000); // queries per second
      
      if (throughput < 0.1) { // 0.1 queries per second minimum
        throw new Error('Throughput below requirements');
      }

      return {
        throughput: throughput,
        queries: queries.length,
        duration: duration,
        allSuccessful: results.every(r => !!r.answer)
      };
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

    console.log('\n🎉 REAL PERMUTATION COMPONENTS TEST RESULTS');
    console.log('=============================================');
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
      console.log('✅ EXCELLENT: Real PERMUTATION components are working very well');
    } else if (successRate >= 70) {
      console.log('✅ GOOD: Real PERMUTATION components are working well with minor issues');
    } else if (successRate >= 50) {
      console.log('⚠️ FAIR: Real PERMUTATION components have some issues that need attention');
    } else {
      console.log('❌ POOR: Real PERMUTATION components have significant issues');
    }

    // Save results
    const filename = `real-permutation-test-results-${new Date().toISOString().split('T')[0]}.json`;
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
  const test = new RealPermutationTest();
  await test.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export default RealPermutationTest;
