/**
 * Comprehensive System Quality Test
 * 
 * Demonstrates the full capabilities and quality of the PERMUTATION system
 * Tests all components, error handling, and validates improvements
 */

require('dotenv').config();

import { executeUnifiedPipeline } from './frontend/lib/unified-permutation-pipeline';
import { OptimizedPermutationAdapter } from './frontend/lib/optimized-permutation-adapter';
import { SelfImprovingOptimizer } from './frontend/lib/self-improving-optimizer';
import { initializeEnvironment, validateLLMProviders, validateSupabase } from './frontend/lib/env-validation';
import { ValidationError, PipelineError } from './frontend/lib/errors';
import { clearRateLimit } from './frontend/lib/input-validation';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface QualityMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  averageQuality: number;
  componentsTested: string[];
  improvements: string[];
}

/**
 * Test Suite Runner
 */
class QualityTestSuite {
  private results: TestResult[] = [];
  private metrics: QualityMetrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    totalDuration: 0,
    averageQuality: 0,
    componentsTested: [],
    improvements: [],
  };

  async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    this.metrics.totalTests++;
    
    try {
      console.log(`\n🧪 Running: ${name}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: true,
        duration,
        details: result,
      });
      
      this.metrics.passedTests++;
      this.metrics.totalDuration += duration;
      
      console.log(`✅ PASSED: ${name} (${duration}ms)`);
      
      if (result?.quality_score !== undefined) {
        this.metrics.averageQuality += result.quality_score;
        // Track count of quality scores for accurate averaging
        if (!this.metrics.improvements.includes('quality_tracked')) {
          this.metrics.improvements.push('quality_tracked');
        }
      }
      
      if (result?.metadata?.components_used) {
        result.metadata.components_used.forEach((comp: string) => {
          if (!this.metrics.componentsTested.includes(comp)) {
            this.metrics.componentsTested.push(comp);
          }
        });
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      
      this.metrics.failedTests++;
      this.metrics.totalDuration += duration;
      
      console.log(`❌ FAILED: ${name} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getResults(): { results: TestResult[]; metrics: QualityMetrics } {
    // Only average quality scores from tests that actually returned them
    const qualityScoreCount = this.results.filter(r => 
      r.passed && r.details?.quality_score !== undefined
    ).length;
    
    if (qualityScoreCount > 0) {
      this.metrics.averageQuality = this.metrics.averageQuality / qualityScoreCount;
    }
    
    return {
      results: this.results,
      metrics: this.metrics,
    };
  }
}

/**
 * Test 1: Environment Validation
 */
async function testEnvironmentValidation(): Promise<void> {
  try {
    initializeEnvironment();
    const llmCheck = validateLLMProviders();
    const supabaseCheck = validateSupabase();
    
    if (!llmCheck.hasAny) {
      throw new Error('No LLM providers configured');
    }
    
    console.log('   ✓ Environment variables validated');
    console.log(`   ✓ LLM Providers: ${llmCheck.hasPerplexity ? 'Perplexity ' : ''}${llmCheck.hasOpenRouter ? 'OpenRouter ' : ''}${llmCheck.hasAnthropic ? 'Anthropic ' : ''}`);
    console.log(`   ✓ Supabase: ${supabaseCheck.isConfigured ? 'Configured' : 'In-memory mode'}`);
  } catch (error) {
    throw new Error(`Environment validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test 2: Input Validation
 */
async function testInputValidation(): Promise<void> {
  // Test valid input
  try {
    const result = await executeUnifiedPipeline(
      'What is the capital of France?',
      'general'
    );
    
    if (!result.answer || result.answer.length === 0) {
      throw new Error('Empty answer returned');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new Error(`Input validation error: ${error.message}`);
    }
    throw error;
  }
  
  // Test invalid input (too long)
  try {
    const longQuery = 'A'.repeat(15000);
    await executeUnifiedPipeline(longQuery);
    throw new Error('Should have rejected overly long query');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('   ✓ Correctly rejected overly long query');
    } else {
      throw error;
    }
  }
  
  // Test invalid domain
  try {
    await executeUnifiedPipeline('Test query', 'invalid_domain' as any);
    throw new Error('Should have rejected invalid domain');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('   ✓ Correctly rejected invalid domain');
    } else {
      throw error;
    }
  }
}

/**
 * Test 3: Basic Query Processing
 */
async function testBasicQuery(): Promise<{ quality_score: number }> {
  const result = await executeUnifiedPipeline(
    'What is the capital of France?',
    'general'
  );
  
  if (!result.answer || result.answer.length === 0) {
    throw new Error('Empty answer');
  }
  
  if (result.metadata.quality_score < 0.7) {
    throw new Error(`Quality score too low: ${result.metadata.quality_score}`);
  }
  
  console.log(`   ✓ Answer generated: ${result.answer.substring(0, 100)}...`);
  console.log(`   ✓ Quality score: ${result.metadata.quality_score.toFixed(3)}`);
  console.log(`   ✓ Components used: ${result.metadata.components_used.join(', ')}`);
  
  return { quality_score: result.metadata.quality_score };
}

/**
 * Test 4: Complex Query with All Components
 */
async function testComplexQuery(): Promise<{ quality_score: number }> {
  const result = await executeUnifiedPipeline(
    'Explain how machine learning models learn from data, including the concepts of training, validation, and generalization. Provide examples.',
    'science',
    undefined,
    {
      enableACE: true,
      enableGEPA: true,
      enableIRT: true,
      enableRVS: true,
      enableDSPy: true,
      enableSemiotic: true,
      enableTeacherStudent: true,
      enableSWiRL: true,
      enableEBM: true,
      optimizationMode: 'quality',
      aceThreshold: 0.3, // Lower threshold to activate more components
      swirlThreshold: 0.3,
      rvsThreshold: 0.2,
    }
  );
  
  if (result.metadata.components_used.length < 5) {
    throw new Error(`Not enough components activated: ${result.metadata.components_used.length}`);
  }
  
  console.log(`   ✓ Complex query processed`);
  console.log(`   ✓ Quality score: ${result.metadata.quality_score.toFixed(3)}`);
  console.log(`   ✓ Components: ${result.metadata.components_used.join(', ')}`);
  console.log(`   ✓ Execution time: ${result.metadata.performance.total_time_ms}ms`);
  
  return { quality_score: result.metadata.quality_score };
}

/**
 * Test 5: Optimized Configuration
 */
async function testOptimizedConfiguration(): Promise<{ improvement: number }> {
  // Initialize optimizer
  const optimizer = new SelfImprovingOptimizer();
  
  // Quick optimization run
  const testQueries = [
    'What is machine learning?',
    'Explain neural networks',
    'How does backpropagation work?',
  ];
  
  const mockEvaluator = async (query: string, answer: string) => {
    // Simple quality metric
    const length = answer.length;
    const hasTechnicalTerms = /(algorithm|model|neural|learning|network)/i.test(answer);
    return {
      quality: Math.min(0.95, 0.6 + (length > 200 ? 0.2 : length / 1000) + (hasTechnicalTerms ? 0.15 : 0)),
      latency: 1000,
      cost: 0.001,
    };
  };
  
  await optimizer.initializeBaseline(testQueries, mockEvaluator);
  
  // Run a few generations
  for (let i = 0; i < 2; i++) {
    await optimizer.evolveGeneration(testQueries, mockEvaluator);
  }
  
  const bestCandidate = optimizer.getBestCandidate();
  if (!bestCandidate) {
    throw new Error('No optimized candidate found');
  }
  
  console.log(`   ✓ Optimizer found best candidate (CMP: ${optimizer.calculateCMP(bestCandidate.id).toFixed(3)})`);
  console.log(`   ✓ Thresholds: ACE=${bestCandidate.permutationParams.aceThreshold.toFixed(2)}, SWiRL=${bestCandidate.permutationParams.swirlThreshold.toFixed(2)}, RVS=${bestCandidate.permutationParams.rvsThreshold.toFixed(2)}`);
  
  // Test with optimized config
  const adapter = new OptimizedPermutationAdapter(optimizer);
  const optimizedConfig = adapter.getOptimalConfig('optimizer');
  const result = await executeUnifiedPipeline(
    'Explain quantum computing basics',
    'science',
    undefined,
    optimizedConfig
  );
  
  console.log(`   ✓ Optimized config quality: ${result.metadata.quality_score.toFixed(3)}`);
  
  return { improvement: result.metadata.quality_score };
}

/**
 * Test 6: Error Handling
 */
async function testErrorHandling(): Promise<void> {
  // Test that errors are properly handled and typed
  try {
    await executeUnifiedPipeline('', 'general'); // Empty query should fail
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw new Error(`Expected ValidationError, got ${error instanceof Error ? error.constructor.name : typeof error}`);
    }
    console.log('   ✓ ValidationError correctly thrown for empty query');
  }
}

/**
 * Test 7: Performance and Cost Tracking
 */
async function testPerformanceTracking(): Promise<{ performance: any }> {
  const result = await executeUnifiedPipeline(
    'What are the key principles of software engineering?',
    'general'
  );
  
  if (!result.metadata.performance) {
    throw new Error('Performance metrics missing');
  }
  
  if (result.metadata.performance.total_time_ms <= 0) {
    throw new Error('Invalid execution time');
  }
  
  console.log(`   ✓ Execution time tracked: ${result.metadata.performance.total_time_ms}ms`);
  console.log(`   ✓ Cost tracked: $${result.metadata.performance.cost.toFixed(4)}`);
  console.log(`   ✓ LLM calls tracked: Teacher=${result.metadata.performance.teacher_calls}, Student=${result.metadata.performance.student_calls}`);
  
  return { performance: result.metadata.performance };
}

/**
 * Test 8: Component Integration
 */
async function testComponentIntegration(): Promise<void> {
  const result = await executeUnifiedPipeline(
    'Compare and contrast supervised and unsupervised learning',
    'science',
    undefined,
    {
      enableIRT: true,
      enableSemiotic: true,
      enableTeacherStudent: true,
      enableRVS: true,
    }
  );
  
  const requiredComponents = ['IRT Calculator', 'Semiotic Inference System', 'Teacher-Student System'];
  const usedComponents = result.metadata.components_used;
  
  for (const required of requiredComponents) {
    if (!usedComponents.includes(required)) {
      throw new Error(`Required component ${required} not activated`);
    }
  }
  
  console.log(`   ✓ All required components integrated: ${usedComponents.join(', ')}`);
}

/**
 * Main Test Execution
 */
async function runComprehensiveTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 COMPREHENSIVE SYSTEM QUALITY TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\nThis test suite validates:');
  console.log('  ✓ Environment configuration');
  console.log('  ✓ Input validation and security');
  console.log('  ✓ Component integration');
  console.log('  ✓ Error handling');
  console.log('  ✓ Performance tracking');
  console.log('  ✓ Optimized configuration');
  console.log('  ✓ System quality and reliability');
  
  const suite = new QualityTestSuite();
  
  // Clear rate limits for testing
  clearRateLimit();
  
  try {
    // Core Functionality Tests
    await suite.runTest('Environment Validation', testEnvironmentValidation);
    await suite.runTest('Input Validation', testInputValidation);
    await suite.runTest('Basic Query Processing', testBasicQuery);
    await suite.runTest('Complex Query with All Components', testComplexQuery);
    await suite.runTest('Component Integration', testComponentIntegration);
    await suite.runTest('Performance and Cost Tracking', testPerformanceTracking);
    await suite.runTest('Error Handling', testErrorHandling);
    await suite.runTest('Optimized Configuration', testOptimizedConfiguration);
    
    // Get results
    const { results, metrics } = suite.getResults();
    
    // Print Summary
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\nTotal Tests: ${metrics.totalTests}`);
    console.log(`✅ Passed: ${metrics.passedTests}`);
    console.log(`❌ Failed: ${metrics.failedTests}`);
    console.log(`⏱️  Total Duration: ${metrics.totalDuration}ms`);
    console.log(`📈 Average Duration: ${(metrics.totalDuration / metrics.totalTests).toFixed(0)}ms`);
    console.log(`⭐ Average Quality Score: ${metrics.averageQuality.toFixed(3)}`);
    console.log(`🧩 Components Tested: ${metrics.componentsTested.join(', ')}`);
    
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('✅ SYSTEM QUALITY ASSESSMENT');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const passRate = (metrics.passedTests / metrics.totalTests) * 100;
    
    if (passRate === 100) {
      console.log('\n🎉 EXCELLENT: All tests passed! System is production-ready.');
    } else if (passRate >= 80) {
      console.log('\n✅ GOOD: Most tests passed. Minor issues to address.');
    } else {
      console.log('\n⚠️  WARNING: Several tests failed. Review and fix issues.');
    }
    
    console.log(`\nPass Rate: ${passRate.toFixed(1)}%`);
    console.log(`Quality Score: ${metrics.averageQuality.toFixed(3)}/1.0`);
    
    if (metrics.averageQuality >= 0.9) {
      console.log('✨ Outstanding quality scores!');
    } else if (metrics.averageQuality >= 0.8) {
      console.log('👍 Good quality scores.');
    } else {
      console.log('📝 Quality scores could be improved.');
    }
    
    // Print failed tests
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`\n  ${test.name}`);
        console.log(`    Error: ${test.error}`);
        console.log(`    Duration: ${test.duration}ms`);
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
    // Return success if all tests passed
    if (metrics.failedTests === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

export { runComprehensiveTests, QualityTestSuite };

