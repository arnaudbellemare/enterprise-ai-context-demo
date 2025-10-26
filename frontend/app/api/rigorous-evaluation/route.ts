import { NextRequest, NextResponse } from 'next/server';
import RigorousEvaluationSystem from '../../../../lib/rigorous-evaluation-system';

const rigorousEvaluationSystem = new RigorousEvaluationSystem();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      operation, 
      baselineResults,
      improvedResults,
      evaluationRuns,
      rlMethods,
      datasetSize,
      confidenceLevel 
    } = body;

    console.log('🔬 Rigorous Evaluation System API:', { 
      operation, 
      baselineCount: baselineResults?.length || 0,
      improvedCount: improvedResults?.length || 0 
    });

    let result;

    switch (operation) {
      case 'rigorous-evaluation-analysis':
        result = await rigorousEvaluationSystem.executeRigorousEvaluation(
          baselineResults || [],
          improvedResults || [],
          evaluationRuns || [],
          rlMethods || []
        );
        break;

      case 'analyze-baseline-variance':
        const baselineVariance = await rigorousEvaluationSystem.baselineVarianceAnalyzer.analyzeBaselineVariance(
          baselineResults || [],
          improvedResults || [],
          confidenceLevel || 0.95
        );
        result = {
          baselineVariance,
          methodology: ['Baseline Variance Analysis: Detect improvements within margin of error'],
          critique: 'Recent methods\' improvements fall entirely within baseline model variance ranges'
        };
        break;

      case 'detect-illusion-of-gains':
        const illusionDetection = await rigorousEvaluationSystem.baselineVarianceAnalyzer.detectIllusionOfGains(
          baselineResults || [],
          improvedResults || [],
          0.05
        );
        result = {
          illusionDetection,
          methodology: ['Detect Illusion of Gains: Identify when improvements are within baseline variance'],
          critique: 'Perceived reasoning progress may be illusory'
        };
        break;

      case 'analyze-implementation-sensitivity':
        const sensitivityAnalysis = await rigorousEvaluationSystem.implementationSensitivityAnalyzer.analyzeImplementationSensitivity(
          evaluationRuns || []
        );
        result = {
          sensitivityAnalysis,
          methodology: ['Implementation Sensitivity: Test sensitivity to parameters, seeds, prompts, hardware'],
          critique: 'Current benchmarks are highly sensitive to implementation details'
        };
        break;

      case 'test-small-dataset-sensitivity':
        const datasetSensitivity = await rigorousEvaluationSystem.implementationSensitivityAnalyzer.testSmallDatasetSensitivity(
          datasetSize || 30,
          evaluationRuns || []
        );
        result = {
          datasetSensitivity,
          methodology: ['Small Dataset Sensitivity: Analyze impact of small dataset sizes'],
          critique: 'AIME 24 only has 30 examples where one question shifts Pass@1 by 3+ percentage points'
        };
        break;

      case 'evaluate-rl-methods':
        const rlEvaluation = await rigorousEvaluationSystem.rlMethodEvaluator.evaluateRLMethods(
          rlMethods || []
        );
        result = {
          rlEvaluation,
          methodology: ['RL Method Evaluation: Test for minimal real gains and overfitting'],
          critique: 'RL approaches show minimal real gains and overfit easily'
        };
        break;

      case 'test-rl-overfitting':
        const methodName = body.methodName || 'Test Method';
        const trainingResults = body.trainingResults || [];
        const validationResults = body.validationResults || [];
        const testResults = body.testResults || [];
        
        const overfittingTest = await rigorousEvaluationSystem.rlMethodEvaluator.testRLOverfitting(
          methodName,
          trainingResults,
          validationResults,
          testResults
        );
        result = {
          overfittingTest,
          methodology: ['Test RL Overfitting: Identify methods that overfit easily'],
          critique: 'RL methods drop 6-17% from reported results with no statistically significant improvements'
        };
        break;

      case 'implement-multi-seed-protocol':
        const protocolName = body.protocolName || 'rigorous';
        const evaluationFunction = async (seed: number) => {
          // Simulate evaluation function
          return Math.random() * 0.1 + 0.7;
        };
        
        const multiSeedResults = await rigorousEvaluationSystem.multiSeedEvaluator.implementMultiSeedProtocol(
          protocolName,
          evaluationFunction
        );
        result = {
          multiSeedResults,
          methodology: ['Multi-Seed Protocols: Ensure statistically significant and stable results'],
          critique: 'Critical need for rigorous multi-seed evaluation protocols'
        };
        break;

      case 'compare-methods-rigorously':
        const methods = body.methods || [];
        const comparison = await rigorousEvaluationSystem.multiSeedEvaluator.compareMethodsRigorously(
          methods,
          body.protocolName || 'standard'
        );
        result = {
          comparison,
          methodology: ['Compare Methods Rigorously: Ensure fair comparison with statistical significance'],
          critique: 'Need for transparent reporting standards'
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid operation. Supported operations: rigorous-evaluation-analysis, analyze-baseline-variance, detect-illusion-of-gains, analyze-implementation-sensitivity, test-small-dataset-sensitivity, evaluate-rl-methods, test-rl-overfitting, implement-multi-seed-protocol, compare-methods-rigorously'
        }, { status: 400 });
    }

    console.log('✅ Rigorous Evaluation operation completed:', { 
      operation, 
      resultKeys: Object.keys(result || {}) 
    });

    return NextResponse.json({
      success: true,
      operation,
      result,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: Date.now(),
        components: [
          'Baseline Variance Analyzer',
          'Implementation Sensitivity Analyzer',
          'RL Method Evaluator',
          'Multi-Seed Evaluator'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Rigorous Evaluation System API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Rigorous Evaluation System API - Addressing the Illusion of Reasoning Gains',
    researchCritique: {
      problem: 'Illusion of reasoning gains falling within baseline variance ranges',
      sensitivity: 'High sensitivity to implementation details (decoding parameters, seeds, prompts, hardware)',
      datasetSize: 'Small dataset sizes causing performance swings (e.g., AIME 24 with 30 examples)',
      rlMethods: 'RL approaches showing minimal real gains and overfitting easily',
      standardization: 'Need for rigorous multi-seed evaluation protocols and transparent reporting',
      significance: 'Recent methods\' improvements fall entirely within baseline model variance ranges'
    },
    availableOperations: [
      {
        operation: 'rigorous-evaluation-analysis',
        description: 'Complete rigorous evaluation analysis with all components',
        parameters: ['baselineResults', 'improvedResults', 'evaluationRuns', 'rlMethods']
      },
      {
        operation: 'analyze-baseline-variance',
        description: 'Analyze baseline model variance ranges',
        parameters: ['baselineResults', 'improvedResults', 'confidenceLevel']
      },
      {
        operation: 'detect-illusion-of-gains',
        description: 'Detect illusion of reasoning gains',
        parameters: ['baselineResults', 'improvedResults']
      },
      {
        operation: 'analyze-implementation-sensitivity',
        description: 'Analyze implementation sensitivity to parameters, seeds, prompts, hardware',
        parameters: ['evaluationRuns']
      },
      {
        operation: 'test-small-dataset-sensitivity',
        description: 'Test sensitivity to small dataset sizes',
        parameters: ['datasetSize', 'evaluationRuns']
      },
      {
        operation: 'evaluate-rl-methods',
        description: 'Evaluate RL methods under standardized conditions',
        parameters: ['rlMethods']
      },
      {
        operation: 'test-rl-overfitting',
        description: 'Test RL methods for overfitting',
        parameters: ['methodName', 'trainingResults', 'validationResults', 'testResults']
      },
      {
        operation: 'implement-multi-seed-protocol',
        description: 'Implement rigorous multi-seed evaluation protocols',
        parameters: ['protocolName']
      },
      {
        operation: 'compare-methods-rigorously',
        description: 'Compare methods under rigorous evaluation',
        parameters: ['methods', 'protocolName']
      }
    ],
    rigorousEvaluationParadigms: {
      'baseline-variance-analysis': {
        description: 'Detect if improvements fall within baseline model variance ranges',
        problem: 'Recent methods\' improvements fall entirely within baseline model variance ranges',
        solution: 'Statistical significance testing and variance analysis'
      },
      'implementation-sensitivity': {
        description: 'Test sensitivity to decoding parameters, seeds, prompts, hardware',
        problem: 'Current benchmarks are highly sensitive to implementation details',
        solution: 'Standardized evaluation protocols and parameter reporting'
      },
      'small-dataset-sensitivity': {
        description: 'Analyze impact of small dataset sizes on performance swings',
        problem: 'AIME 24 only has 30 examples where one question shifts Pass@1 by 3+ percentage points',
        solution: 'Larger, more diverse datasets for reliable evaluation'
      },
      'rl-method-evaluation': {
        description: 'Test RL methods for minimal real gains and overfitting',
        problem: 'RL approaches show minimal real gains and overfit easily',
        solution: 'Standardized evaluation with proper train/validation/test splits'
      },
      'multi-seed-protocols': {
        description: 'Implement rigorous multi-seed evaluation protocols',
        problem: 'Need for statistically significant and stable results',
        solution: 'Multi-seed evaluation with confidence intervals and stability testing'
      }
    },
    capabilities: [
      'Baseline Variance Analysis: Detect improvements within margin of error',
      'Implementation Sensitivity: Test sensitivity to parameters, seeds, prompts, hardware',
      'Small Dataset Sensitivity: Analyze impact of small dataset sizes',
      'RL Method Evaluation: Test for minimal real gains and overfitting',
      'Multi-Seed Protocols: Ensure statistically significant and stable results',
      'Transparent Reporting: Implement rigorous reporting standards',
      'Statistical Significance: Test for meaningful improvements over baselines',
      'Overfitting Detection: Identify methods that overfit easily'
    ],
    researchInsights: [
      'Improvements from recent reasoning methods fall entirely within baseline model variance ranges',
      'Perceived reasoning progress may be illusory due to evaluation methodology issues',
      'Current benchmarks are highly sensitive to implementation details',
      'Small dataset sizes cause performance swings (e.g., AIME 24 with 30 examples)',
      'RL approaches show minimal real gains and overfit easily',
      'RL methods drop 6-17% from reported results with no statistically significant improvements',
      'Critical need for rigorous multi-seed evaluation protocols',
      'Need for transparent reporting standards in AI research'
    ],
    technicalBreakthrough: {
      problem: 'The illusion of reasoning gains in AI evaluation',
      rootCause: 'Improvements fall within baseline model variance ranges (margin of error)',
      sensitivity: 'High sensitivity to implementation (decoding parameters, seeds, prompts, hardware)',
      datasetIssues: 'Small dataset sizes causing performance swings',
      rlProblems: 'RL methods show minimal real gains and overfit easily',
      solution: 'Rigorous multi-seed evaluation protocols and transparent reporting standards',
      innovation: 'Statistical significance testing and variance analysis for AI evaluation',
      impact: 'Address fundamental flaws in current AI reasoning evaluation methodology'
    }
  });
}
