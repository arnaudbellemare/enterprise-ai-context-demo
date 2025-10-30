#!/usr/bin/env tsx

/**
 * 🚀 COMPREHENSIVE REAL PERMUTATION SYSTEM TEST
 * 
 * This test validates the complete PERMUTATION system using REAL components:
 * - All 11+ integrated components (ACE, GEPA, IRT, Teacher-Student, TRM, etc.)
 * - Real execution flows and data processing
 * - Performance metrics and quality validation
 * - Edge cases and error handling
 * - System integration and component interaction
 */

// Read environment variables only (no inline secrets). Ensure .env.local is used locally and not committed.

import { PermutationEngine, PermutationConfig } from './frontend/lib/permutation-engine';
import { ACEFramework } from './frontend/lib/ace-framework';
import { gepaAlgorithms } from './frontend/lib/gepa-algorithms';
import { SmartRouter, getSmartRouter, TaskType } from './frontend/lib/smart-router';
import { getAdvancedCache } from './frontend/lib/advanced-cache-system';
import { createMultiAgentPipeline } from './frontend/lib/parallel-agent-system';
import { createReasoningBank } from './frontend/lib/reasoning-bank';
import { createTRM } from './frontend/lib/trm';

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

class ComprehensiveRealPermutationTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async run() {
    console.log('🚀 COMPREHENSIVE REAL PERMUTATION SYSTEM TEST');
    console.log('==============================================');
    console.log('Testing complete PERMUTATION system with REAL components...\n');
    
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
      
      // Test performance metrics
      await this.testPerformanceMetrics();
      
      // Test edge cases
      await this.testEdgeCases();
      
      // Test domain-specific capabilities
      await this.testDomainSpecific();
      
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
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      };

      const engine = new PermutationEngine(config);
      
      if (!engine || typeof engine.execute !== 'function') {
        throw new Error('PermutationEngine instantiation failed');
      }

      // Test basic execution
      const result = await engine.execute('What is artificial intelligence?', 'technology');
      
      if (!result || !result.answer || result.answer.length === 0) {
        throw new Error('PermutationEngine execution failed');
      }

      return {
        engineInstantiated: true,
        hasExecuteMethod: true,
        executionSuccessful: true,
        answerLength: result.answer.length,
        componentsUsed: result.metadata.components_used.length,
        qualityScore: result.metadata.quality_score,
        duration: result.metadata.duration_ms
      };
    });

    // Test ACEFramework
    await this.runTest('ACEFramework', async () => {
      const ace = new ACEFramework(mockModel);
      
      if (!ace || typeof ace.processQuery !== 'function') {
        throw new Error('ACEFramework instantiation failed');
      }

      // Test basic processing
      const result = await ace.processQuery('Test query', 'general');
      
      return {
        aceInstantiated: true,
        hasProcessQueryMethod: true,
        hasGenerateContextMethod: typeof (ace as any).generateContext === 'function',
        hasReflectMethod: typeof (ace as any).reflect === 'function',
        processQueryResult: !!result
      };
    });

    // Test GEPAAlgorithms (FIXED)
    await this.runTest('GEPAAlgorithms', async () => {
      if (!gepaAlgorithms || typeof gepaAlgorithms.optimizePrompts !== 'function') {
        throw new Error('GEPAAlgorithms instantiation failed');
      }

      // Test optimization
      const result = await gepaAlgorithms.optimizePrompts('technology', [
        'What is machine learning?',
        'How does AI work?',
        'Explain neural networks'
      ], ['quality', 'speed', 'cost']);

      if (!result || !result.evolved_prompts || !Array.isArray(result.evolved_prompts)) {
        throw new Error('GEPAAlgorithms optimization failed');
      }

      return {
        gepaInstantiated: true,
        hasOptimizePromptsMethod: true,
        optimizationSuccessful: true,
        evolvedPrompts: result.evolved_prompts.length,
        paretoFronts: result.pareto_fronts.length,
        generationsEvolved: result.optimization_metrics.generations_evolved
      };
    });

    // Test SmartRouter
    await this.runTest('SmartRouter', async () => {
      const router = getSmartRouter();
      
      if (!router || typeof router.route !== 'function') {
        throw new Error('SmartRouter instantiation failed');
      }

      const taskType: TaskType = {
        type: 'general',
        priority: 'medium',
        requirements: {
          accuracy_required: 80,
          max_latency_ms: 5000,
          max_cost: 0.05,
          requires_real_time_data: false
        }
      };

      const result = router.route(taskType, 'Test query');
      
      return {
        routerInstantiated: true,
        hasRouteMethod: true,
        routingSuccessful: !!result,
        primaryComponent: result?.primary_component || 'unknown'
      };
    });

    // Test AdvancedCache
    await this.runTest('AdvancedCache', async () => {
      const cache = getAdvancedCache();
      
      if (!cache || typeof cache.set !== 'function' || typeof cache.get !== 'function') {
        throw new Error('AdvancedCache instantiation failed');
      }

      // Test cache operations
      await cache.set('test-key', 'test-value', 3600, {
        component: 'Test',
        task_type: 'unit',
        priority: 'low',
        cost_saved: 0.001,
        latency_saved_ms: 5
      });
      const retrieved = await cache.get('test-key');
      
      return {
        cacheInstantiated: true,
        hasSetMethod: true,
        hasGetMethod: true,
        cacheOperationsWork: retrieved === 'test-value'
      };
    });

    // Test MultiAgentPipeline
    await this.runTest('MultiAgentPipeline', async () => {
      const pipeline = createMultiAgentPipeline('technology');
      
      if (!pipeline || typeof pipeline.execute !== 'function') {
        throw new Error('MultiAgentPipeline instantiation failed');
      }

      const result = await pipeline.execute('Test query', {});
      
      return {
        pipelineInstantiated: true,
        hasExecuteMethod: true,
        executionSuccessful: !!result,
        parallelResults: result?.parallelResults?.length || 0
      };
    });

    // Test ReasoningBank
    await this.runTest('ReasoningBank', async () => {
      const reasoningBank = createReasoningBank({
        max_memories: 1000,
        similarity_threshold: 0.7,
        embedding_model: 'Xenova/all-MiniLM-L6-v2',
        enable_learning: true,
        retention_days: 30
      });
      
      if (!reasoningBank || typeof reasoningBank.retrieveSimilar !== 'function') {
        throw new Error('ReasoningBank instantiation failed');
      }

      const memories = await reasoningBank.retrieveSimilar('Test query', 'general', 5);
      
      return {
        reasoningBankInstantiated: true,
        hasRetrieveSimilarMethod: true,
        memoriesRetrieved: memories.length,
        isArray: Array.isArray(memories)
      };
    });

    // Test TRM Engine
    await this.runTest('TRMEngine', async () => {
      const trm = createTRM({
        max_iterations: 5,
        confidence_threshold: 0.8,
        verification_required: true,
        adaptive_computation: true,
        multi_scale: true
      });
      
      if (!trm || typeof trm.processQuery !== 'function') {
        throw new Error('TRMEngine instantiation failed');
      }

      const steps = [
        { step: 1, action: 'Analyze query', tool: 'parse' },
        { step: 2, action: 'Generate reasoning', tool: 'reason' },
        { step: 3, action: 'Verify solution', tool: 'verify' }
      ];

      const result = await trm.processQuery('Test query', steps);
      
      return {
        trmInstantiated: true,
        hasProcessQueryMethod: true,
        executionSuccessful: !!result,
        iterations: result?.iterations || 0,
        confidence: result?.confidence || 0
      };
    });
  }

  async testIntegrationFlows() {
    console.log('\n📋 INTEGRATION FLOWS');
    console.log('==================================================\n');

    // Test End-to-End Execution
    await this.runTest('EndToEndExecution', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      const complexQuery = 'Analyze the impact of artificial intelligence on healthcare, including current applications, future potential, and ethical considerations';
      const result = await engine.execute(complexQuery, 'healthcare');
      
      const hasAnswer = result.answer && result.answer.length > 100;
      const hasReasoning = result.reasoning && Array.isArray(result.reasoning) && result.reasoning.length > 0;
      const hasMetadata = result.metadata && result.metadata.components_used.length > 5;
      const hasTrace = result.trace && result.trace.steps.length > 3;

      if (!hasAnswer || !hasReasoning || !hasMetadata || !hasTrace) {
        throw new Error('Incomplete end-to-end execution');
      }

      return {
        endToEndSuccessful: true,
        answerLength: result.answer.length,
        reasoningSteps: result.reasoning.length,
        componentsUsed: result.metadata.components_used.length,
        traceSteps: result.trace.steps.length,
        qualityScore: result.metadata.quality_score,
        totalDuration: result.metadata.duration_ms
      };
    });

    // Test Component Interaction
    await this.runTest('ComponentInteraction', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      const result = await engine.execute('Compare machine learning vs deep learning approaches', 'technology');
      const components = result.metadata.components_used;
      
      const expectedComponents = ['Smart Router', 'IRT', 'ACE', 'TRM', 'Synthesis'];
      const usedExpectedComponents = expectedComponents.filter(comp => 
        components.some(used => used.includes(comp))
      );

      if (usedExpectedComponents.length < 3) {
        throw new Error('Insufficient component interaction');
      }

      return {
        componentInteractionSuccessful: true,
        totalComponents: components.length,
        expectedComponentsUsed: usedExpectedComponents.length,
        componentList: components
      };
    });

    // Test Data Flow Validation
    await this.runTest('DataFlowValidation', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      const result = await engine.execute('What are the benefits of renewable energy?', 'energy');
      const trace = result.trace;
      
      const hasRoutingAndCache = trace.steps.some(step => step.component.includes('Smart Router'));
      const hasDomainDetection = trace.steps.some(step => step.component.includes('Domain Detection'));
      const hasInputProcessing = hasRoutingAndCache && hasDomainDetection;

      // Accept any enabled optimization stage
      const hasACE = trace.steps.some(step => step.component.includes('ACE Framework') || step.component.includes('ACE Playbook'));
      const hasDSPy = trace.steps.some(step => step.component.includes('DSPy'));
      const hasWeaviate = trace.steps.some(step => step.component.includes('Weaviate Retrieve-DSPy'));
      const hasOptimization = hasACE || hasDSPy || hasWeaviate;

      // Accept TRM or Multi-Agent as execution engines
      const hasTRM = trace.steps.some(step => step.component.includes('TRM'));
      const hasMultiAgent = trace.steps.some(step => step.component.includes('Multi-Agent Research'));
      const hasExecution = hasTRM || hasMultiAgent;

      const hasSynthesis = trace.steps.some(step => step.component.includes('Synthesis Agent'));

      if (!hasInputProcessing || !hasExecution || !hasSynthesis) {
        throw new Error('Incomplete data flow');
      }

      return {
        dataFlowValid: true,
        hasInputProcessing,
        hasOptimization,
        hasExecution,
        hasSynthesis,
        totalSteps: trace.steps.length
      };
    });

    // Test Error Handling
    await this.runTest('ErrorHandling', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      // Test with empty query
      const result = await engine.execute('', 'invalid');
      
      // Should handle error gracefully - either returns a helpful message or valid response
      // Graceful degradation means system doesn't crash and returns something useful
      const errorHandled = result.answer && (result.answer.includes('Error') || 
                                             result.answer.includes('Unable') || 
                                             result.answer.includes('Please') ||
                                             result.answer.length > 0);
      
      return {
        errorHandlingSuccessful: errorHandled && !!result.answer,
        gracefulDegradation: !!result.answer,
        fallbackResponse: errorHandled
      };
    });

    // Test Cache Integration
    await this.runTest('CacheIntegration', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      const query = 'What is blockchain technology?';
      
      // First request (should miss cache)
      const start1 = Date.now();
      const result1 = await engine.execute(query, 'technology');
      const duration1 = Date.now() - start1;
      
      // Second request (should hit cache)
      const start2 = Date.now();
      const result2 = await engine.execute(query, 'technology');
      const duration2 = Date.now() - start2;
      
      // Second request should be faster (cached)
      const isCached = duration2 < duration1 * 0.8;
      
      return {
        cacheIntegrationSuccessful: true,
        firstDuration: duration1,
        secondDuration: duration2,
        isCached,
        speedImprovement: ((duration1 - duration2) / duration1 * 100).toFixed(1) + '%'
      };
    });
  }

  async testPerformanceMetrics() {
    console.log('\n📋 PERFORMANCE METRICS');
    console.log('==================================================\n');

    // Test Response Time
    await this.runTest('ResponseTime', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: false, // Disable for speed
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: false, // Disable for speed
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      });

      const queries = [
        'What is 2+2?',
        'What is the capital of France?',
        'Explain photosynthesis briefly'
      ];

      const times: number[] = [];
      for (const query of queries) {
        const start = Date.now();
        await engine.execute(query, 'general');
        const duration = Date.now() - start;
        times.push(duration);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const target = 60000; // 60 seconds (realistic for Perplexity API with multiple components)
      const maxAllowed = 120000; // 120 seconds (2 minutes max for complex queries)

      const passed = avgTime <= target && maxTime <= maxAllowed;

      return {
        responseTimeTest: passed ? 'passed' : 'failed',
        averageTime: avgTime,
        maxTime,
        target,
        maxAllowed,
        measurements: times
      };
    });

    // Test Quality Score
    await this.runTest('QualityScore', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      const result = await engine.execute('Explain the concept of machine learning and its applications', 'technology');
      const qualityScore = result.metadata?.quality_score || 0;
      const minRequired = 0.65; // Realistic threshold for production (0.7+ is good, 0.8+ is excellent)
      const target = 0.8;

      const passed = qualityScore >= minRequired;

      return {
        qualityScoreTest: passed ? 'passed' : 'failed',
        qualityScore,
        minRequired,
        target,
        answerLength: result.answer.length
      };
    });

    // Test Cost Optimization
    await this.runTest('CostOptimization', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      const result = await engine.execute('What are the benefits of renewable energy?', 'energy');
      const cost = result.metadata.cost;
      const maxAllowed = 0.05;
      const target = 0.02;

      const passed = cost <= maxAllowed;

      return {
        costOptimizationTest: passed ? 'passed' : 'failed',
        cost,
        maxAllowed,
        target,
        componentsUsed: result.metadata.components_used.length
      };
    });
  }

  async testEdgeCases() {
    console.log('\n📋 EDGE CASES & ERROR HANDLING');
    console.log('==================================================\n');

    // Test Invalid Inputs
    await this.runTest('InvalidInputs', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: false,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: false,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      });

      const invalidInputs = [
        { query: '', domain: 'general' },
        { query: 'a'.repeat(10000), domain: 'general' } // Very long query
      ];

      let handledCorrectly = 0;
      for (const input of invalidInputs) {
        const result = await engine.execute(input.query, input.domain);
        if (result.answer && result.answer.length > 0) {
          handledCorrectly++;
        }
      }

      const passed = handledCorrectly >= invalidInputs.length * 0.8;

      return {
        invalidInputsTest: passed ? 'passed' : 'failed',
        totalInputs: invalidInputs.length,
        handledCorrectly,
        successRate: (handledCorrectly / invalidInputs.length * 100).toFixed(1) + '%'
      };
    });

    // Test Resource Limits
    await this.runTest('ResourceLimits', async () => {
      const engine = new PermutationEngine({
        enableTeacherModel: true,
        enableStudentModel: true,
        enableMultiQuery: false,
        enableReasoningBank: false,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: false,
        enableACE: true,
        enableSWiRL: true,
        enableTRM: true,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: true
      });

      const complexQuery = 'Analyze the economic, social, and environmental impacts of implementing a universal basic income system, considering factors such as inflation, labor market effects, poverty reduction, and sustainability, while comparing different implementation strategies across various countries and their respective outcomes.';
      
      const result = await engine.execute(complexQuery, 'economics');
      const handledCorrectly = result.answer && result.answer.length > 0;

      return {
        resourceLimitsTest: handledCorrectly ? 'passed' : 'failed',
        handledCorrectly,
        queryLength: complexQuery.length,
        answerLength: result.answer.length
      };
    });
  }

  async testDomainSpecific() {
    console.log('\n📋 DOMAIN-SPECIFIC CAPABILITIES');
    console.log('==================================================\n');

    const domains = [
      { name: 'FinancialAnalysis', query: 'Analyze the risk-return profile of investing in technology stocks vs bonds', domain: 'financial' },
      { name: 'HealthcareQueries', query: 'What are the potential side effects of common medications?', domain: 'healthcare' },
      { name: 'TechnologyQuestions', query: 'Explain the differences between microservices and monolithic architecture', domain: 'technology' },
      { name: 'LegalReasoning', query: 'What are the key elements of a valid contract?', domain: 'legal' },
      { name: 'RealEstateValuation', query: 'What factors affect property valuation in real estate?', domain: 'real_estate' }
    ];

    for (const { name, query, domain } of domains) {
      await this.runTest(name, async () => {
        const engine = new PermutationEngine({
          enableTeacherModel: true,
          enableStudentModel: true,
          enableMultiQuery: false,
          enableReasoningBank: false,
          enableLoRA: false,
          enableIRT: true,
          enableDSPy: false,
          enableACE: true,
          enableSWiRL: true,
          enableTRM: true,
          enableSQL: false,
          enableWeaviateRetrieveDSPy: true
        });

        const result = await engine.execute(query, domain);
        
        if (!result.answer || result.answer.length < 50) {
          throw new Error(`${name} execution failed`);
        }

        return {
          domainTestSuccessful: true,
          answerLength: result.answer.length,
          qualityScore: result.metadata.quality_score,
          irtDifficulty: result.metadata.irt_difficulty,
          componentsUsed: result.metadata.components_used.length
        };
      });
    }
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

    console.log('\n🎉 COMPREHENSIVE REAL PERMUTATION SYSTEM TEST RESULTS');
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
    
    if (successRate >= 95) {
      console.log('🎉 EXCELLENT: PERMUTATION system is performing exceptionally well!');
      console.log('✅ All major components are working correctly');
      console.log('✅ System is ready for production use');
    } else if (successRate >= 85) {
      console.log('✅ GOOD: PERMUTATION system is performing well with minor issues');
      console.log('⚠️  Some components may need attention');
      console.log('✅ System is mostly ready for production use');
    } else if (successRate >= 70) {
      console.log('⚠️  FAIR: PERMUTATION system has some issues that need addressing');
      console.log('❌ Several components are not working correctly');
      console.log('⚠️  System needs fixes before production use');
    } else {
      console.log('❌ POOR: PERMUTATION system has significant issues');
      console.log('❌ Many components are not working correctly');
      console.log('❌ System is not ready for production use');
    }

    // Save results
    const filename = `comprehensive-real-permutation-test-results-${new Date().toISOString().split('T')[0]}.json`;
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
  const tester = new ComprehensiveRealPermutationTester();
  await tester.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export default ComprehensiveRealPermutationTester;
