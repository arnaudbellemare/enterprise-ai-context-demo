import { EnhancedUnifiedPipeline } from './enhanced-unified-pipeline';
import { evaluatePermutationOutput, createPermutationEvaluators } from './openevals-ollama';
import { createLogger } from './walt/logger';

const logger = createLogger('PermutationEvals');

export interface TestCase {
  name: string;
  query: string;
  domain: string;
  expectedOutput?: string;
  description: string;
}

export interface EvaluationResults {
  testCase: TestCase;
  outputs: Record<string, any>;
  evaluations: Record<string, any>;
  overallScore: number;
  passed: boolean;
  executionTime: number;
}

/**
 * Comprehensive test suite for PERMUTATION system
 */
export class PermutationTestSuite {
  private pipeline: EnhancedUnifiedPipeline;
  private evaluators: Record<string, any>;

  constructor() {
    this.pipeline = new EnhancedUnifiedPipeline({
      enableSkills: true,
      enablePromptMII: true,
      enableIRT: true,
      enableSemiotic: true,
      enableSemioticObservability: true,
      enableContinualKV: true,
      enableInferenceKV: true,
      enableRLM: true,
      enableACE: true,
      enableGEPA: true,
      enableDSPy: true,
      enableTeacherStudent: true,
      enableRVS: true,
      enableCreativeJudge: true,
      enableMarkdownOptimization: true,
      enableConversationalMemory: true,
      enableREFRAG: true,
      enableRealLoRA: true,
      enableRealContinualLearning: true,
      enableRealMarkdownOptimization: true,
      enableFullDSPy: true,
      enableFullACE: true,
      enableFullIRT: true,
      enableFullPromptMII: true,
      enableGKD: true,
    });
    
    this.evaluators = createPermutationEvaluators();
  }

  /**
   * Define test cases for PERMUTATION
   */
  getTestCases(): TestCase[] {
    return [
      {
        name: 'microservices_architecture',
        query: 'Design a microservices architecture for a fintech platform handling 10M+ transactions daily.',
        domain: 'enterprise_architecture',
        description: 'Test complex enterprise architecture design with multiple components'
      },
      {
        name: 'ai_research_paper',
        query: 'Write a research paper abstract on the integration of knowledge distillation with prompt optimization.',
        domain: 'research',
        description: 'Test academic writing and research synthesis capabilities'
      },
      {
        name: 'code_optimization',
        query: 'Optimize this Python function for better performance: def slow_function(data): return [x*2 for x in data if x > 0]',
        domain: 'codegen',
        description: 'Test code optimization and technical problem-solving'
      },
      {
        name: 'semiotic_analysis',
        query: 'Analyze the semiotic meaning of the phrase "artificial intelligence" using Picca\'s framework.',
        domain: 'philosophy',
        description: 'Test semiotic analysis and philosophical reasoning'
      },
      {
        name: 'multi_step_reasoning',
        query: 'If a company has 1000 employees and wants to implement a microservices architecture, what are the key considerations for service decomposition?',
        domain: 'reasoning',
        description: 'Test multi-step reasoning and complex problem decomposition'
      },
      {
        name: 'creative_synthesis',
        query: 'Create a novel approach to combining RAG with knowledge distillation for improved AI performance.',
        domain: 'innovation',
        description: 'Test creative synthesis and innovative thinking'
      },
      {
        name: 'technical_documentation',
        query: 'Write comprehensive documentation for a PERMUTATION system deployment.',
        domain: 'documentation',
        description: 'Test technical documentation and system explanation'
      },
      {
        name: 'error_handling',
        query: 'What happens when the PERMUTATION system encounters a failure in the Teacher-Student layer?',
        domain: 'troubleshooting',
        description: 'Test error handling and system resilience understanding'
      }
    ];
  }

  /**
   * Run a single test case
   */
  async runTestCase(testCase: TestCase): Promise<EvaluationResults> {
    logger.info(`Running test case: ${testCase.name}`, {
      query: testCase.query,
      domain: testCase.domain
    });

    const startTime = Date.now();
    
    try {
      // Execute PERMUTATION pipeline
      const result = await this.pipeline.execute(testCase.query, testCase.domain);
      const executionTime = Date.now() - startTime;

      // Prepare outputs for evaluation
      const outputs = {
        response: result?.answer || 'No response generated',
        metadata: result?.metadata || {},
        trace: result?.trace || {},
        quality_score: result?.metadata?.quality_score || 0,
        layers_executed: result?.trace?.layers?.filter(l => l.status === 'success').length || 0,
        total_layers: result?.trace?.layers?.length || 0
      };

      // Run comprehensive evaluation
      const evaluations = await evaluatePermutationOutput(
        { query: testCase.query, domain: testCase.domain },
        outputs,
        testCase.expectedOutput ? { expected: testCase.expectedOutput } : undefined
      );

      // Calculate overall score
      const scores = Object.values(evaluations).map((evalResult: any) => {
        if (typeof evalResult.score === 'boolean') return evalResult.score ? 1 : 0;
        if (typeof evalResult.score === 'number') return evalResult.score;
        return 0;
      });
      
      const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const passed = overallScore >= 0.7; // 70% threshold for passing

      logger.info(`Test case completed: ${testCase.name}`, {
        overallScore: overallScore.toFixed(3),
        passed,
        executionTime: `${executionTime}ms`,
        evaluationsCount: Object.keys(evaluations).length
      });

      return {
        testCase,
        outputs,
        evaluations,
        overallScore,
        passed,
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error(`Test case failed: ${testCase.name}`, { error: error.message });

      return {
        testCase,
        outputs: { error: error.message },
        evaluations: { error: { score: false, comment: error.message } },
        overallScore: 0,
        passed: false,
        executionTime
      };
    }
  }

  /**
   * Run all test cases
   */
  async runAllTests(): Promise<EvaluationResults[]> {
    const testCases = this.getTestCases();
    logger.info(`Starting comprehensive PERMUTATION test suite`, {
      totalTests: testCases.length
    });

    const results: EvaluationResults[] = [];

    // Run tests sequentially to avoid overwhelming the system
    for (const testCase of testCases) {
      const result = await this.runTestCase(testCase);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate summary
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / totalTests;
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests;

    logger.info('PERMUTATION test suite completed', {
      passedTests,
      totalTests,
      passRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
      averageScore: averageScore.toFixed(3),
      averageExecutionTime: `${(averageExecutionTime / 1000).toFixed(1)}s`
    });

    return results;
  }

  /**
   * Generate detailed test report
   */
  generateReport(results: EvaluationResults[]): string {
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / totalTests;
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests;

    let report = `
# PERMUTATION System Evaluation Report

## Summary
- **Total Tests**: ${totalTests}
- **Passed**: ${passedTests}
- **Pass Rate**: ${((passedTests / totalTests) * 100).toFixed(1)}%
- **Average Score**: ${averageScore.toFixed(3)}
- **Average Execution Time**: ${(averageExecutionTime / 1000).toFixed(1)}s

## Test Results

`;

    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const score = (result.overallScore * 100).toFixed(1);
      
      report += `### ${index + 1}. ${result.testCase.name} ${status}
- **Score**: ${score}%
- **Execution Time**: ${(result.executionTime / 1000).toFixed(1)}s
- **Description**: ${result.testCase.description}
- **Query**: ${result.testCase.query}

**Evaluation Details**:
`;

      Object.entries(result.evaluations).forEach(([evaluationName, evaluationResult]: [string, any]) => {
        const evaluationScore = typeof evaluationResult.score === 'boolean' ? 
          (evaluationResult.score ? '100%' : '0%') : 
          `${(evaluationResult.score * 100).toFixed(1)}%`;
        
        report += `- **${evaluationName}**: ${evaluationScore} - ${evaluationResult.comment.substring(0, 100)}...
`;
      });

      report += `
`;
    });

    return report;
  }
}

/**
 * Quick test function for immediate evaluation
 */
export async function quickPermutationTest(): Promise<void> {
  console.log('🔧 Running Quick PERMUTATION Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const testSuite = new PermutationTestSuite();
  const testCases = testSuite.getTestCases().slice(0, 3); // Run first 3 tests for quick evaluation
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Query: ${testCase.query}`);
    
    const result = await testSuite.runTestCase(testCase);
    
    console.log(`📊 Score: ${(result.overallScore * 100).toFixed(1)}%`);
    console.log(`⏱️  Time: ${(result.executionTime / 1000).toFixed(1)}s`);
    console.log(`✅ Status: ${result.passed ? 'PASS' : 'FAIL'}`);
    
    // Show evaluation details
    Object.entries(result.evaluations).forEach(([evaluationName, evaluationResult]: [string, any]) => {
      const evaluationScore = typeof evaluationResult.score === 'boolean' ? 
        (evaluationResult.score ? '100%' : '0%') : 
        `${(evaluationResult.score * 100).toFixed(1)}%`;
      console.log(`   ${evaluationName}: ${evaluationScore}`);
    });
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Quick PERMUTATION Test Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
