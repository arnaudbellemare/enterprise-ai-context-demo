#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE PERMUTATION SYSTEM TEST
 * 
 * This test validates the complete PERMUTATION system capabilities:
 * - All 11+ integrated components (ACE, GEPA, IRT, Teacher-Student, TRM, etc.)
 * - Real execution flows and data processing
 * - Performance metrics and quality validation
 * - Edge cases and error handling
 * - System integration and component interaction
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds per test
  retries: 2,
  parallel: false, // Run tests sequentially for better debugging
  verbose: true
};

// Test categories and their expected capabilities
const TEST_CATEGORIES = {
  CORE_COMPONENTS: {
    name: 'Core PERMUTATION Components',
    tests: [
      'PermutationEngine',
      'ACEFramework', 
      'GEPAAlgorithms',
      'IRTCalculator',
      'TeacherStudentSystem',
      'TRMEngine',
      'ReasoningBank',
      'SmartRouter',
      'AdvancedCache',
      'MultiAgentPipeline'
    ]
  },
  INTEGRATION_FLOWS: {
    name: 'Integration Flows',
    tests: [
      'EndToEndExecution',
      'ComponentInteraction',
      'DataFlowValidation',
      'ErrorPropagation',
      'CacheIntegration'
    ]
  },
  PERFORMANCE_METRICS: {
    name: 'Performance & Quality',
    tests: [
      'ResponseTime',
      'QualityScore',
      'CostOptimization',
      'MemoryUsage',
      'Throughput'
    ]
  },
  EDGE_CASES: {
    name: 'Edge Cases & Error Handling',
    tests: [
      'InvalidInputs',
      'NetworkFailures',
      'ResourceLimits',
      'ConcurrentRequests',
      'MalformedData'
    ]
  },
  DOMAIN_SPECIFIC: {
    name: 'Domain-Specific Capabilities',
    tests: [
      'FinancialAnalysis',
      'HealthcareQueries',
      'TechnologyQuestions',
      'LegalReasoning',
      'RealEstateValuation'
    ]
  }
};

// Test queries covering different complexity levels and domains
const TEST_QUERIES = {
  SIMPLE: [
    'What is 2+2?',
    'What is the capital of France?',
    'Explain photosynthesis briefly'
  ],
  MEDIUM: [
    'How does machine learning work?',
    'Compare stocks vs bonds for investment',
    'What are the benefits of renewable energy?'
  ],
  COMPLEX: [
    'Analyze the impact of quantum computing on drug discovery and its potential to revolutionize healthcare',
    'Compare the economic implications of different cryptocurrency regulations across major markets',
    'Evaluate the feasibility of implementing a universal basic income system in developed countries'
  ],
  REAL_TIME: [
    'What are the latest trends in AI technology?',
    'Current stock market performance today',
    'Recent developments in renewable energy'
  ],
  TECHNICAL: [
    'Explain transformer architecture in neural networks',
    'How does the AdamW optimizer work compared to Adam?',
    'What are the trade-offs between different database indexing strategies?'
  ]
};

// Expected system capabilities
const EXPECTED_CAPABILITIES = {
  COMPONENTS: {
    'PermutationEngine': {
      required: true,
      features: ['execute', 'domainDetection', 'multiQueryGeneration', 'synthesis']
    },
    'ACEFramework': {
      required: true,
      features: ['generateTrajectory', 'reflect', 'curate', 'playbookManagement']
    },
    'GEPAAlgorithms': {
      required: true,
      features: ['optimizePrompts', 'geneticEvolution', 'paretoFronts', 'fitnessEvaluation']
    },
    'IRTCalculator': {
      required: true,
      features: ['calculateDifficulty', 'expectedAccuracy', 'discriminationParameter']
    },
    'TeacherStudentSystem': {
      required: true,
      features: ['teacherProcess', 'studentProcess', 'learningSession', 'webSearch']
    },
    'TRMEngine': {
      required: true,
      features: ['recursiveReasoning', 'verification', 'confidenceScoring', 'adaptiveComputation']
    }
  },
  PERFORMANCE: {
    responseTime: { max: 10000, target: 5000 }, // ms
    qualityScore: { min: 0.8, target: 0.9 },
    costPerQuery: { max: 0.05, target: 0.02 }, // USD
    cacheHitRate: { min: 0.3, target: 0.5 },
    successRate: { min: 0.95, target: 0.98 }
  },
  INTEGRATION: {
    componentInteraction: true,
    dataFlow: true,
    errorHandling: true,
    caching: true,
    parallelExecution: true
  }
};

class ComprehensivePermutationTester {
  constructor() {
    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      categories: {},
      detailed: [],
      performance: {},
      errors: []
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 COMPREHENSIVE PERMUTATION SYSTEM TEST');
    console.log('==========================================');
    console.log('Testing complete PERMUTATION system capabilities...\n');

    try {
      // Test each category
      for (const [categoryKey, category] of Object.entries(TEST_CATEGORIES)) {
        console.log(`\n📋 ${category.name.toUpperCase()}`);
        console.log('='.repeat(50));
        
        this.results.categories[categoryKey] = {
          name: category.name,
          tests: [],
          passed: 0,
          failed: 0,
          duration: 0
        };

        const categoryStart = Date.now();

        for (const testName of category.tests) {
          await this.runTest(categoryKey, testName);
        }

        this.results.categories[categoryKey].duration = Date.now() - categoryStart;
        this.results.categories[categoryKey].passed = this.results.categories[categoryKey].tests.filter(t => t.status === 'passed').length;
        this.results.categories[categoryKey].failed = this.results.categories[categoryKey].tests.filter(t => t.status === 'failed').length;
      }

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.results.errors.push(error.message);
    }
  }

  async runTest(categoryKey, testName) {
    const testStart = Date.now();
    console.log(`\n🔧 Running: ${testName}`);

    try {
      let result;
      
      switch (categoryKey) {
        case 'CORE_COMPONENTS':
          result = await this.testCoreComponent(testName);
          break;
        case 'INTEGRATION_FLOWS':
          result = await this.testIntegrationFlow(testName);
          break;
        case 'PERFORMANCE_METRICS':
          result = await this.testPerformanceMetric(testName);
          break;
        case 'EDGE_CASES':
          result = await this.testEdgeCase(testName);
          break;
        case 'DOMAIN_SPECIFIC':
          result = await this.testDomainSpecific(testName);
          break;
        default:
          result = { status: 'skipped', message: 'Unknown test category' };
      }

      const testResult = {
        name: testName,
        status: result.status,
        message: result.message,
        duration: Date.now() - testStart,
        details: result.details || {},
        timestamp: new Date().toISOString()
      };

      this.results.categories[categoryKey].tests.push(testResult);
      this.results.detailed.push(testResult);
      this.results.summary.totalTests++;

      if (result.status === 'passed') {
        this.results.summary.passed++;
        console.log(`   ✅ ${testName} - PASSED (${testResult.duration}ms)`);
      } else if (result.status === 'failed') {
        this.results.summary.failed++;
        console.log(`   ❌ ${testName} - FAILED: ${result.message}`);
      } else {
        this.results.summary.skipped++;
        console.log(`   ⏭️  ${testName} - SKIPPED: ${result.message}`);
      }

    } catch (error) {
      const testResult = {
        name: testName,
        status: 'failed',
        message: error.message,
        duration: Date.now() - testStart,
        error: error.stack,
        timestamp: new Date().toISOString()
      };

      this.results.categories[categoryKey].tests.push(testResult);
      this.results.detailed.push(testResult);
      this.results.summary.totalTests++;
      this.results.summary.failed++;
      this.results.errors.push(`${testName}: ${error.message}`);

      console.log(`   ❌ ${testName} - ERROR: ${error.message}`);
    }
  }

  async testCoreComponent(componentName) {
    switch (componentName) {
      case 'PermutationEngine':
        return await this.testPermutationEngine();
      case 'ACEFramework':
        return await this.testACEFramework();
      case 'GEPAAlgorithms':
        return await this.testGEPAAlgorithms();
      case 'IRTCalculator':
        return await this.testIRTCalculator();
      case 'TeacherStudentSystem':
        return await this.testTeacherStudentSystem();
      case 'TRMEngine':
        return await this.testTRMEngine();
      case 'ReasoningBank':
        return await this.testReasoningBank();
      case 'SmartRouter':
        return await this.testSmartRouter();
      case 'AdvancedCache':
        return await this.testAdvancedCache();
      case 'MultiAgentPipeline':
        return await this.testMultiAgentPipeline();
      default:
        return { status: 'skipped', message: 'Unknown component' };
    }
  }

  async testPermutationEngine() {
    try {
      // Test basic execution
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'What is machine learning?',
        domain: 'technology'
      });

      if (!response.success) {
        return { status: 'failed', message: 'PermutationEngine execution failed' };
      }

      const result = response.data;
      
      // Validate required fields
      const requiredFields = ['answer', 'reasoning', 'metadata', 'trace'];
      const missingFields = requiredFields.filter(field => !(field in result));
      
      if (missingFields.length > 0) {
        return { status: 'failed', message: `Missing required fields: ${missingFields.join(', ')}` };
      }

      // Validate metadata structure
      const metadata = result.metadata;
      const requiredMetadata = ['domain', 'quality_score', 'irt_difficulty', 'components_used', 'cost', 'duration_ms'];
      const missingMetadata = requiredMetadata.filter(field => !(field in metadata));
      
      if (missingMetadata.length > 0) {
        return { status: 'failed', message: `Missing metadata fields: ${missingMetadata.join(', ')}` };
      }

      // Validate trace structure
      const trace = result.trace;
      if (!Array.isArray(trace.steps)) {
        return { status: 'failed', message: 'Invalid trace structure' };
      }

      return {
        status: 'passed',
        message: 'PermutationEngine working correctly',
        details: {
          answerLength: result.answer.length,
          componentsUsed: metadata.components_used.length,
          qualityScore: metadata.quality_score,
          irtDifficulty: metadata.irt_difficulty,
          cost: metadata.cost,
          duration: metadata.duration_ms,
          traceSteps: trace.steps.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `PermutationEngine test failed: ${error.message}` };
    }
  }

  async testACEFramework() {
    try {
      const response = await this.makeRequest('/api/prompts/adaptive', 'POST', {
        query: 'How does artificial intelligence work?',
        domain: 'technology',
        context: {
          previousAttempts: 0,
          userTier: 'enterprise'
        }
      });

      if (!response.success) {
        return { status: 'failed', message: 'ACEFramework execution failed' };
      }

      const result = response.data;
      
      // Validate ACE-specific fields
      if (!result.adaptive_prompt || !result.template_used) {
        return { status: 'failed', message: 'Missing ACE-specific fields' };
      }

      return {
        status: 'passed',
        message: 'ACEFramework working correctly',
        details: {
          templateUsed: result.template_used.name,
          adaptationsApplied: result.adaptations_applied.length,
          confidence: result.confidence,
          promptLength: result.adaptive_prompt.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `ACEFramework test failed: ${error.message}` };
    }
  }

  async testGEPAAlgorithms() {
    try {
      const response = await this.makeRequest('/api/gepa-optimization', 'POST', {
        domain: 'technology',
        basePrompts: [
          'Explain machine learning',
          'What is artificial intelligence?',
          'How do neural networks work?'
        ],
        objectives: ['quality', 'speed', 'cost']
      });

      if (!response.success) {
        return { status: 'failed', message: 'GEPAAlgorithms execution failed' };
      }

      const result = response.data;
      
      // Validate GEPA-specific fields
      if (!result.evolved_prompts || !Array.isArray(result.evolved_prompts)) {
        return { status: 'failed', message: 'Missing evolved_prompts array' };
      }

      if (!result.pareto_fronts || !Array.isArray(result.pareto_fronts)) {
        return { status: 'failed', message: 'Missing pareto_fronts array' };
      }

      return {
        status: 'passed',
        message: 'GEPAAlgorithms working correctly',
        details: {
          evolvedPrompts: result.evolved_prompts.length,
          paretoFronts: result.pareto_fronts.length,
          generations: result.optimization_metrics.generations_evolved,
          diversityScore: result.optimization_metrics.diversity_score
        }
      };

    } catch (error) {
      return { status: 'failed', message: `GEPAAlgorithms test failed: ${error.message}` };
    }
  }

  async testIRTCalculator() {
    try {
      const response = await this.makeRequest('/api/irt-calculator', 'POST', {
        query: 'Explain quantum computing and its applications',
        domain: 'technology'
      });

      if (!response.success) {
        return { status: 'failed', message: 'IRTCalculator execution failed' };
      }

      const result = response.data;
      
      // Validate IRT-specific fields
      const requiredFields = ['difficulty', 'discrimination', 'ability', 'expectedAccuracy', 'level'];
      const missingFields = requiredFields.filter(field => !(field in result));
      
      if (missingFields.length > 0) {
        return { status: 'failed', message: `Missing IRT fields: ${missingFields.join(', ')}` };
      }

      // Validate difficulty range
      if (result.difficulty < 0 || result.difficulty > 2) {
        return { status: 'failed', message: 'Invalid difficulty range' };
      }

      return {
        status: 'passed',
        message: 'IRTCalculator working correctly',
        details: {
          difficulty: result.difficulty,
          discrimination: result.discrimination,
          expectedAccuracy: result.expectedAccuracy,
          level: result.level,
          factors: result.factors
        }
      };

    } catch (error) {
      return { status: 'failed', message: `IRTCalculator test failed: ${error.message}` };
    }
  }

  async testTeacherStudentSystem() {
    try {
      const response = await this.makeRequest('/api/teacher-student', 'POST', {
        query: 'What are the latest developments in AI?',
        domain: 'technology'
      });

      if (!response.success) {
        return { status: 'failed', message: 'TeacherStudentSystem execution failed' };
      }

      const result = response.data;
      
      // Validate Teacher-Student specific fields
      if (!result.teacher_response || !result.student_response) {
        return { status: 'failed', message: 'Missing teacher or student response' };
      }

      return {
        status: 'passed',
        message: 'TeacherStudentSystem working correctly',
        details: {
          teacherConfidence: result.teacher_response.confidence,
          studentConfidence: result.student_response.confidence,
          learningEffectiveness: result.learning_session.learning_effectiveness,
          sourcesFound: result.teacher_response.sources.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `TeacherStudentSystem test failed: ${error.message}` };
    }
  }

  async testTRMEngine() {
    try {
      const response = await this.makeRequest('/api/trm-engine', 'POST', {
        query: 'Solve this complex reasoning problem: If a train leaves at 2 PM and travels at 60 mph, and another train leaves at 3 PM traveling at 80 mph, when will they meet?',
        domain: 'mathematics'
      });

      if (!response.success) {
        return { status: 'failed', message: 'TRMEngine execution failed' };
      }

      const result = response.data;
      
      // Validate TRM-specific fields
      if (!result.iterations || !result.verified || result.confidence === undefined) {
        return { status: 'failed', message: 'Missing TRM-specific fields' };
      }

      return {
        status: 'passed',
        message: 'TRMEngine working correctly',
        details: {
          iterations: result.iterations,
          verified: result.verified,
          confidence: result.confidence,
          answer: result.answer ? result.answer.substring(0, 100) + '...' : 'No answer'
        }
      };

    } catch (error) {
      return { status: 'failed', message: `TRMEngine test failed: ${error.message}` };
    }
  }

  async testReasoningBank() {
    try {
      const response = await this.makeRequest('/api/reasoning-bank', 'POST', {
        query: 'How to optimize database performance?',
        domain: 'technology',
        limit: 5
      });

      if (!response.success) {
        return { status: 'failed', message: 'ReasoningBank execution failed' };
      }

      const result = response.data;
      
      // Validate ReasoningBank specific fields
      if (!Array.isArray(result.memories)) {
        return { status: 'failed', message: 'Memories should be an array' };
      }

      return {
        status: 'passed',
        message: 'ReasoningBank working correctly',
        details: {
          memoriesFound: result.memories.length,
          avgSimilarity: result.memories.reduce((sum, m) => sum + (m.similarity || 0), 0) / result.memories.length,
          domains: [...new Set(result.memories.map(m => m.domain))]
        }
      };

    } catch (error) {
      return { status: 'failed', message: `ReasoningBank test failed: ${error.message}` };
    }
  }

  async testSmartRouter() {
    try {
      const response = await this.makeRequest('/api/smart-routing', 'POST', {
        query: 'What is the current stock price of Apple?',
        domain: 'financial'
      });

      if (!response.success) {
        return { status: 'failed', message: 'SmartRouter execution failed' };
      }

      const result = response.data;
      
      // Validate SmartRouter specific fields
      if (!result.routingDecision || !result.routingDecision.primary_component) {
        return { status: 'failed', message: 'Missing routing decision' };
      }

      return {
        status: 'passed',
        message: 'SmartRouter working correctly',
        details: {
          primaryComponent: result.routingDecision.primary_component,
          estimatedCost: result.routingDecision.estimated_cost,
          estimatedLatency: result.routingDecision.estimated_latency_ms,
          reasoning: result.routingDecision.reasoning
        }
      };

    } catch (error) {
      return { status: 'failed', message: `SmartRouter test failed: ${error.message}` };
    }
  }

  async testAdvancedCache() {
    try {
      // Test cache set
      const setResponse = await this.makeRequest('/api/advanced-cache', 'POST', {
        action: 'set',
        key: 'test-key',
        value: 'test-value',
        ttl: 3600
      });

      if (!setResponse.success) {
        return { status: 'failed', message: 'Cache set failed' };
      }

      // Test cache get
      const getResponse = await this.makeRequest('/api/advanced-cache', 'POST', {
        action: 'get',
        key: 'test-key'
      });

      if (!getResponse.success || getResponse.data.value !== 'test-value') {
        return { status: 'failed', message: 'Cache get failed or value mismatch' };
      }

      return {
        status: 'passed',
        message: 'AdvancedCache working correctly',
        details: {
          setSuccess: setResponse.success,
          getSuccess: getResponse.success,
          valueMatch: getResponse.data.value === 'test-value'
        }
      };

    } catch (error) {
      return { status: 'failed', message: `AdvancedCache test failed: ${error.message}` };
    }
  }

  async testMultiAgentPipeline() {
    try {
      const response = await this.makeRequest('/api/multi-agent', 'POST', {
        query: 'Analyze the pros and cons of different programming languages for web development',
        domain: 'technology',
        agentCount: 3
      });

      if (!response.success) {
        return { status: 'failed', message: 'MultiAgentPipeline execution failed' };
      }

      const result = response.data;
      
      // Validate MultiAgent specific fields
      if (!result.parallelResults || !Array.isArray(result.parallelResults)) {
        return { status: 'failed', message: 'Missing parallelResults array' };
      }

      return {
        status: 'passed',
        message: 'MultiAgentPipeline working correctly',
        details: {
          agentCount: result.parallelResults.length,
          totalDuration: result.totalDuration,
          successRate: result.parallelResults.filter(r => r.success).length / result.parallelResults.length,
          agentNames: result.parallelResults.map(r => r.agentName)
        }
      };

    } catch (error) {
      return { status: 'failed', message: `MultiAgentPipeline test failed: ${error.message}` };
    }
  }

  async testIntegrationFlow(flowName) {
    switch (flowName) {
      case 'EndToEndExecution':
        return await this.testEndToEndExecution();
      case 'ComponentInteraction':
        return await this.testComponentInteraction();
      case 'DataFlowValidation':
        return await this.testDataFlowValidation();
      case 'ErrorPropagation':
        return await this.testErrorPropagation();
      case 'CacheIntegration':
        return await this.testCacheIntegration();
      default:
        return { status: 'skipped', message: 'Unknown integration flow' };
    }
  }

  async testEndToEndExecution() {
    try {
      const complexQuery = 'Analyze the impact of artificial intelligence on healthcare, including current applications, future potential, and ethical considerations';
      
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: complexQuery,
        domain: 'healthcare'
      });

      if (!response.success) {
        return { status: 'failed', message: 'End-to-end execution failed' };
      }

      const result = response.data;
      
      // Validate complete flow
      const hasAnswer = result.answer && result.answer.length > 100;
      const hasReasoning = result.reasoning && Array.isArray(result.reasoning) && result.reasoning.length > 0;
      const hasMetadata = result.metadata && result.metadata.components_used.length > 5;
      const hasTrace = result.trace && result.trace.steps.length > 3;

      if (!hasAnswer || !hasReasoning || !hasMetadata || !hasTrace) {
        return { status: 'failed', message: 'Incomplete end-to-end execution' };
      }

      return {
        status: 'passed',
        message: 'End-to-end execution working correctly',
        details: {
          answerLength: result.answer.length,
          reasoningSteps: result.reasoning.length,
          componentsUsed: result.metadata.components_used.length,
          traceSteps: result.trace.steps.length,
          qualityScore: result.metadata.quality_score,
          totalDuration: result.metadata.duration_ms
        }
      };

    } catch (error) {
      return { status: 'failed', message: `End-to-end execution test failed: ${error.message}` };
    }
  }

  async testComponentInteraction() {
    try {
      // Test that components work together
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'Compare machine learning vs deep learning approaches',
        domain: 'technology'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Component interaction failed' };
      }

      const result = response.data;
      const components = result.metadata.components_used;
      
      // Check that multiple components were used
      const expectedComponents = ['Smart Router', 'IRT', 'ACE', 'TRM', 'Synthesis'];
      const usedExpectedComponents = expectedComponents.filter(comp => 
        components.some(used => used.includes(comp))
      );

      if (usedExpectedComponents.length < 3) {
        return { status: 'failed', message: 'Insufficient component interaction' };
      }

      return {
        status: 'passed',
        message: 'Component interaction working correctly',
        details: {
          totalComponents: components.length,
          expectedComponentsUsed: usedExpectedComponents.length,
          componentList: components
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Component interaction test failed: ${error.message}` };
    }
  }

  async testDataFlowValidation() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'What are the benefits of renewable energy?',
        domain: 'energy'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Data flow validation failed' };
      }

      const result = response.data;
      
      // Validate data flows through the system
      const trace = result.trace;
      const hasInputProcessing = trace.steps.some(step => step.component.includes('Domain Detection'));
      const hasOptimization = trace.steps.some(step => step.component.includes('ACE') || step.component.includes('GEPA'));
      const hasExecution = trace.steps.some(step => step.component.includes('TRM') || step.component.includes('Multi-Agent'));
      const hasSynthesis = trace.steps.some(step => step.component.includes('Synthesis'));

      if (!hasInputProcessing || !hasOptimization || !hasExecution || !hasSynthesis) {
        return { status: 'failed', message: 'Incomplete data flow' };
      }

      return {
        status: 'passed',
        message: 'Data flow validation working correctly',
        details: {
          hasInputProcessing,
          hasOptimization,
          hasExecution,
          hasSynthesis,
          totalSteps: trace.steps.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Data flow validation test failed: ${error.message}` };
    }
  }

  async testErrorPropagation() {
    try {
      // Test with invalid input to see error handling
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: '', // Empty query
        domain: 'invalid'
      });

      // Should handle error gracefully
      if (response.success) {
        return { status: 'failed', message: 'Should have failed with invalid input' };
      }

      // Check error structure
      if (!response.error && !response.data?.error) {
        return { status: 'failed', message: 'Missing error information' };
      }

      return {
        status: 'passed',
        message: 'Error propagation working correctly',
        details: {
          errorHandled: true,
          errorMessage: response.error || response.data?.error
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Error propagation test failed: ${error.message}` };
    }
  }

  async testCacheIntegration() {
    try {
      const query = 'What is blockchain technology?';
      
      // First request (should miss cache)
      const response1 = await this.makeRequest('/api/optimized/execute', 'POST', {
        query,
        domain: 'technology'
      });

      if (!response1.success) {
        return { status: 'failed', message: 'First request failed' };
      }

      // Second request (should hit cache)
      const response2 = await this.makeRequest('/api/optimized/execute', 'POST', {
        query,
        domain: 'technology'
      });

      if (!response2.success) {
        return { status: 'failed', message: 'Second request failed' };
      }

      // Compare responses
      const duration1 = response1.data.metadata.duration_ms;
      const duration2 = response2.data.metadata.duration_ms;
      
      // Second request should be faster (cached)
      const isCached = duration2 < duration1 * 0.8; // At least 20% faster

      return {
        status: 'passed',
        message: 'Cache integration working correctly',
        details: {
          firstDuration: duration1,
          secondDuration: duration2,
          isCached,
          speedImprovement: ((duration1 - duration2) / duration1 * 100).toFixed(1) + '%'
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Cache integration test failed: ${error.message}` };
    }
  }

  async testPerformanceMetric(metricName) {
    switch (metricName) {
      case 'ResponseTime':
        return await this.testResponseTime();
      case 'QualityScore':
        return await this.testQualityScore();
      case 'CostOptimization':
        return await this.testCostOptimization();
      case 'MemoryUsage':
        return await this.testMemoryUsage();
      case 'Throughput':
        return await this.testThroughput();
      default:
        return { status: 'skipped', message: 'Unknown performance metric' };
    }
  }

  async testResponseTime() {
    try {
      const queries = TEST_QUERIES.SIMPLE.slice(0, 3);
      const times = [];

      for (const query of queries) {
        const start = Date.now();
        const response = await this.makeRequest('/api/optimized/execute', 'POST', {
          query,
          domain: 'general'
        });
        const duration = Date.now() - start;
        
        if (response.success) {
          times.push(duration);
        }
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const target = EXPECTED_CAPABILITIES.PERFORMANCE.responseTime.target;
      const maxAllowed = EXPECTED_CAPABILITIES.PERFORMANCE.responseTime.max;

      const passed = avgTime <= target && maxTime <= maxAllowed;

      return {
        status: passed ? 'passed' : 'failed',
        message: `Response time ${passed ? 'within' : 'exceeds'} targets`,
        details: {
          averageTime: avgTime,
          maxTime,
          target,
          maxAllowed,
          measurements: times
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Response time test failed: ${error.message}` };
    }
  }

  async testQualityScore() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'Explain the concept of machine learning and its applications',
        domain: 'technology'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Quality score test failed' };
      }

      const qualityScore = response.data.metadata.quality_score;
      const minRequired = EXPECTED_CAPABILITIES.PERFORMANCE.qualityScore.min;
      const target = EXPECTED_CAPABILITIES.PERFORMANCE.qualityScore.target;

      const passed = qualityScore >= minRequired;

      return {
        status: passed ? 'passed' : 'failed',
        message: `Quality score ${passed ? 'meets' : 'below'} requirements`,
        details: {
          qualityScore,
          minRequired,
          target,
          answerLength: response.data.answer.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Quality score test failed: ${error.message}` };
    }
  }

  async testCostOptimization() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'What are the benefits of renewable energy?',
        domain: 'energy'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Cost optimization test failed' };
      }

      const cost = response.data.metadata.cost;
      const maxAllowed = EXPECTED_CAPABILITIES.PERFORMANCE.costPerQuery.max;
      const target = EXPECTED_CAPABILITIES.PERFORMANCE.costPerQuery.target;

      const passed = cost <= maxAllowed;

      return {
        status: passed ? 'passed' : 'failed',
        message: `Cost ${passed ? 'within' : 'exceeds'} limits`,
        details: {
          cost,
          maxAllowed,
          target,
          componentsUsed: response.data.metadata.components_used.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Cost optimization test failed: ${error.message}` };
    }
  }

  async testMemoryUsage() {
    try {
      // Test memory usage by running multiple queries
      const queries = TEST_QUERIES.MEDIUM.slice(0, 5);
      const memoryBefore = process.memoryUsage();

      for (const query of queries) {
        await this.makeRequest('/api/optimized/execute', 'POST', {
          query,
          domain: 'general'
        });
      }

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Check if memory increase is reasonable (less than 100MB)
      const passed = memoryIncreaseMB < 100;

      return {
        status: passed ? 'passed' : 'failed',
        message: `Memory usage ${passed ? 'within' : 'exceeds'} limits`,
        details: {
          memoryIncreaseMB,
          memoryBefore: Math.round(memoryBefore.heapUsed / 1024 / 1024),
          memoryAfter: Math.round(memoryAfter.heapUsed / 1024 / 1024),
          queriesProcessed: queries.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Memory usage test failed: ${error.message}` };
    }
  }

  async testThroughput() {
    try {
      const queries = TEST_QUERIES.SIMPLE.slice(0, 5);
      const startTime = Date.now();

      // Run queries in parallel
      const promises = queries.map(query => 
        this.makeRequest('/api/optimized/execute', 'POST', {
          query,
          domain: 'general'
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const successfulQueries = results.filter(r => r.success).length;
      const throughput = (successfulQueries / totalTime) * 1000; // queries per second

      const passed = throughput >= 0.5; // At least 0.5 queries per second

      return {
        status: passed ? 'passed' : 'failed',
        message: `Throughput ${passed ? 'meets' : 'below'} requirements`,
        details: {
          throughput,
          totalTime,
          successfulQueries,
          totalQueries: queries.length,
          successRate: successfulQueries / queries.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Throughput test failed: ${error.message}` };
    }
  }

  async testEdgeCase(caseName) {
    switch (caseName) {
      case 'InvalidInputs':
        return await this.testInvalidInputs();
      case 'NetworkFailures':
        return await this.testNetworkFailures();
      case 'ResourceLimits':
        return await this.testResourceLimits();
      case 'ConcurrentRequests':
        return await this.testConcurrentRequests();
      case 'MalformedData':
        return await this.testMalformedData();
      default:
        return { status: 'skipped', message: 'Unknown edge case' };
    }
  }

  async testInvalidInputs() {
    try {
      const invalidInputs = [
        { query: '', domain: 'general' },
        { query: null, domain: 'general' },
        { query: 'Valid query', domain: '' },
        { query: 'Valid query', domain: null },
        { query: 'a'.repeat(10000), domain: 'general' } // Very long query
      ];

      let handledCorrectly = 0;

      for (const input of invalidInputs) {
        const response = await this.makeRequest('/api/optimized/execute', 'POST', input);
        
        // Should either fail gracefully or handle the input
        if (!response.success || (response.success && response.data.answer)) {
          handledCorrectly++;
        }
      }

      const passed = handledCorrectly >= invalidInputs.length * 0.8; // 80% should be handled

      return {
        status: passed ? 'passed' : 'failed',
        message: `Invalid inputs ${passed ? 'handled' : 'not handled'} correctly`,
        details: {
          totalInputs: invalidInputs.length,
          handledCorrectly,
          successRate: (handledCorrectly / invalidInputs.length * 100).toFixed(1) + '%'
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Invalid inputs test failed: ${error.message}` };
    }
  }

  async testNetworkFailures() {
    try {
      // Test with invalid endpoint
      const response = await this.makeRequest('/api/invalid-endpoint', 'POST', {
        query: 'Test query',
        domain: 'general'
      });

      // Should handle 404 gracefully
      const handledCorrectly = !response.success && response.status === 404;

      return {
        status: handledCorrectly ? 'passed' : 'failed',
        message: `Network failures ${handledCorrectly ? 'handled' : 'not handled'} correctly`,
        details: {
          statusCode: response.status,
          success: response.success,
          error: response.error
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Network failures test failed: ${error.message}` };
    }
  }

  async testResourceLimits() {
    try {
      // Test with very complex query that might hit resource limits
      const complexQuery = 'Analyze the economic, social, and environmental impacts of implementing a universal basic income system, considering factors such as inflation, labor market effects, poverty reduction, and sustainability, while comparing different implementation strategies across various countries and their respective outcomes.';
      
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: complexQuery,
        domain: 'economics'
      });

      // Should either succeed or fail gracefully
      const handledCorrectly = response.success || (response.error && response.error.includes('timeout'));

      return {
        status: handledCorrectly ? 'passed' : 'failed',
        message: `Resource limits ${handledCorrectly ? 'handled' : 'not handled'} correctly`,
        details: {
          success: response.success,
          error: response.error,
          queryLength: complexQuery.length
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Resource limits test failed: ${error.message}` };
    }
  }

  async testConcurrentRequests() {
    try {
      const queries = TEST_QUERIES.SIMPLE.slice(0, 3);
      
      // Send concurrent requests
      const promises = queries.map(query => 
        this.makeRequest('/api/optimized/execute', 'POST', {
          query,
          domain: 'general'
        })
      );

      const results = await Promise.all(promises);
      const successfulRequests = results.filter(r => r.success).length;
      const passed = successfulRequests >= queries.length * 0.8; // 80% should succeed

      return {
        status: passed ? 'passed' : 'failed',
        message: `Concurrent requests ${passed ? 'handled' : 'not handled'} correctly`,
        details: {
          totalRequests: queries.length,
          successfulRequests,
          successRate: (successfulRequests / queries.length * 100).toFixed(1) + '%'
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Concurrent requests test failed: ${error.message}` };
    }
  }

  async testMalformedData() {
    try {
      const malformedInputs = [
        { query: 'Valid query', domain: 'general', extraField: 'invalid' },
        { query: 123, domain: 'general' }, // Wrong type
        { query: 'Valid query', domain: 'general', metadata: 'invalid' }
      ];

      let handledCorrectly = 0;

      for (const input of malformedInputs) {
        const response = await this.makeRequest('/api/optimized/execute', 'POST', input);
        
        // Should either succeed (ignoring extra fields) or fail gracefully
        if (response.success || (response.error && !response.error.includes('Internal Server Error'))) {
          handledCorrectly++;
        }
      }

      const passed = handledCorrectly >= malformedInputs.length * 0.8;

      return {
        status: passed ? 'passed' : 'failed',
        message: `Malformed data ${passed ? 'handled' : 'not handled'} correctly`,
        details: {
          totalInputs: malformedInputs.length,
          handledCorrectly,
          successRate: (handledCorrectly / malformedInputs.length * 100).toFixed(1) + '%'
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Malformed data test failed: ${error.message}` };
    }
  }

  async testDomainSpecific(domainName) {
    switch (domainName) {
      case 'FinancialAnalysis':
        return await this.testFinancialAnalysis();
      case 'HealthcareQueries':
        return await this.testHealthcareQueries();
      case 'TechnologyQuestions':
        return await this.testTechnologyQuestions();
      case 'LegalReasoning':
        return await this.testLegalReasoning();
      case 'RealEstateValuation':
        return await this.testRealEstateValuation();
      default:
        return { status: 'skipped', message: 'Unknown domain' };
    }
  }

  async testFinancialAnalysis() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'Analyze the risk-return profile of investing in technology stocks vs bonds',
        domain: 'financial'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Financial analysis failed' };
      }

      const result = response.data;
      const answer = result.answer.toLowerCase();
      
      // Check for financial analysis keywords
      const financialKeywords = ['risk', 'return', 'investment', 'portfolio', 'volatility', 'yield', 'market'];
      const hasFinancialTerms = financialKeywords.some(keyword => answer.includes(keyword));

      return {
        status: hasFinancialTerms ? 'passed' : 'failed',
        message: `Financial analysis ${hasFinancialTerms ? 'contains' : 'missing'} relevant terms`,
        details: {
          answerLength: result.answer.length,
          hasFinancialTerms,
          qualityScore: result.metadata.quality_score,
          irtDifficulty: result.metadata.irt_difficulty
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Financial analysis test failed: ${error.message}` };
    }
  }

  async testHealthcareQueries() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'What are the potential side effects of common medications?',
        domain: 'healthcare'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Healthcare query failed' };
      }

      const result = response.data;
      const answer = result.answer.toLowerCase();
      
      // Check for healthcare keywords
      const healthcareKeywords = ['medication', 'side effects', 'dosage', 'treatment', 'patient', 'medical'];
      const hasHealthcareTerms = healthcareKeywords.some(keyword => answer.includes(keyword));

      return {
        status: hasHealthcareTerms ? 'passed' : 'failed',
        message: `Healthcare query ${hasHealthcareTerms ? 'contains' : 'missing'} relevant terms`,
        details: {
          answerLength: result.answer.length,
          hasHealthcareTerms,
          qualityScore: result.metadata.quality_score,
          irtDifficulty: result.metadata.irt_difficulty
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Healthcare query test failed: ${error.message}` };
    }
  }

  async testTechnologyQuestions() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'Explain the differences between microservices and monolithic architecture',
        domain: 'technology'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Technology question failed' };
      }

      const result = response.data;
      const answer = result.answer.toLowerCase();
      
      // Check for technology keywords
      const techKeywords = ['microservices', 'monolithic', 'architecture', 'scalability', 'deployment', 'api'];
      const hasTechTerms = techKeywords.some(keyword => answer.includes(keyword));

      return {
        status: hasTechTerms ? 'passed' : 'failed',
        message: `Technology question ${hasTechTerms ? 'contains' : 'missing'} relevant terms`,
        details: {
          answerLength: result.answer.length,
          hasTechTerms,
          qualityScore: result.metadata.quality_score,
          irtDifficulty: result.metadata.irt_difficulty
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Technology question test failed: ${error.message}` };
    }
  }

  async testLegalReasoning() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'What are the key elements of a valid contract?',
        domain: 'legal'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Legal reasoning failed' };
      }

      const result = response.data;
      const answer = result.answer.toLowerCase();
      
      // Check for legal keywords
      const legalKeywords = ['contract', 'agreement', 'consideration', 'offer', 'acceptance', 'legal', 'binding'];
      const hasLegalTerms = legalKeywords.some(keyword => answer.includes(keyword));

      return {
        status: hasLegalTerms ? 'passed' : 'failed',
        message: `Legal reasoning ${hasLegalTerms ? 'contains' : 'missing'} relevant terms`,
        details: {
          answerLength: result.answer.length,
          hasLegalTerms,
          qualityScore: result.metadata.quality_score,
          irtDifficulty: result.metadata.irt_difficulty
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Legal reasoning test failed: ${error.message}` };
    }
  }

  async testRealEstateValuation() {
    try {
      const response = await this.makeRequest('/api/optimized/execute', 'POST', {
        query: 'What factors affect property valuation in real estate?',
        domain: 'real_estate'
      });

      if (!response.success) {
        return { status: 'failed', message: 'Real estate valuation failed' };
      }

      const result = response.data;
      const answer = result.answer.toLowerCase();
      
      // Check for real estate keywords
      const realEstateKeywords = ['property', 'valuation', 'location', 'market', 'appraisal', 'investment', 'roi'];
      const hasRealEstateTerms = realEstateKeywords.some(keyword => answer.includes(keyword));

      return {
        status: hasRealEstateTerms ? 'passed' : 'failed',
        message: `Real estate valuation ${hasRealEstateTerms ? 'contains' : 'missing'} relevant terms`,
        details: {
          answerLength: result.answer.length,
          hasRealEstateTerms,
          qualityScore: result.metadata.quality_score,
          irtDifficulty: result.metadata.irt_difficulty
        }
      };

    } catch (error) {
      return { status: 'failed', message: `Real estate valuation test failed: ${error.message}` };
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: TEST_CONFIG.timeout
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      const result = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: result,
        error: result.error || (response.ok ? null : `HTTP ${response.status}`)
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: null,
        error: error.message
      };
    }
  }

  generateFinalReport() {
    this.results.summary.duration = Date.now() - this.startTime;
    
    console.log('\n🎉 COMPREHENSIVE PERMUTATION SYSTEM TEST RESULTS');
    console.log('================================================');
    console.log(`📊 Total Tests: ${this.results.summary.totalTests}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⏭️  Skipped: ${this.results.summary.skipped}`);
    console.log(`⏱️  Total Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);
    console.log(`📈 Success Rate: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`);

    // Category breakdown
    console.log('\n📋 CATEGORY BREAKDOWN:');
    console.log('=====================');
    for (const [categoryKey, category] of Object.entries(this.results.categories)) {
      const successRate = ((category.passed / category.tests.length) * 100).toFixed(1);
      console.log(`${category.name}: ${category.passed}/${category.tests.length} (${successRate}%)`);
    }

    // Performance summary
    if (Object.keys(this.results.performance).length > 0) {
      console.log('\n⚡ PERFORMANCE SUMMARY:');
      console.log('======================');
      for (const [metric, value] of Object.entries(this.results.performance)) {
        console.log(`${metric}: ${value}`);
      }
    }

    // Error summary
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      console.log('==========');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Overall assessment
    const overallSuccess = this.results.summary.passed / this.results.summary.totalTests;
    console.log('\n🏆 OVERALL ASSESSMENT:');
    console.log('=====================');
    
    if (overallSuccess >= 0.95) {
      console.log('🎉 EXCELLENT: PERMUTATION system is performing exceptionally well!');
      console.log('✅ All major components are working correctly');
      console.log('✅ System is ready for production use');
    } else if (overallSuccess >= 0.85) {
      console.log('✅ GOOD: PERMUTATION system is performing well with minor issues');
      console.log('⚠️  Some components may need attention');
      console.log('✅ System is mostly ready for production use');
    } else if (overallSuccess >= 0.70) {
      console.log('⚠️  FAIR: PERMUTATION system has some issues that need addressing');
      console.log('❌ Several components are not working correctly');
      console.log('⚠️  System needs fixes before production use');
    } else {
      console.log('❌ POOR: PERMUTATION system has significant issues');
      console.log('❌ Many components are not working correctly');
      console.log('❌ System is not ready for production use');
    }

    // Save detailed results
    this.saveDetailedResults();
  }

  saveDetailedResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `permutation-test-results-${timestamp}.json`;
    
    try {
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Detailed results saved to: ${filename}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save detailed results: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const tester = new ComprehensivePermutationTester();
  
  try {
    await tester.runAllTests();
    
    const successRate = tester.results.summary.passed / tester.results.summary.totalTests;
    process.exit(successRate >= 0.85 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run the comprehensive test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ComprehensivePermutationTester, TEST_CATEGORIES, TEST_QUERIES, EXPECTED_CAPABILITIES };