import { NextRequest, NextResponse } from 'next/server';
import ContinualLearningSystem from '../../../../lib/continual-learning-system';

const continualLearningSystem = new ContinualLearningSystem();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      operation, 
      query, 
      context,
      baseModel 
    } = body;

    console.log('🚀 Continual Learning System API:', { 
      operation, 
      query: query?.substring(0, 50) 
    });

    let result;

    switch (operation) {
      case 'continual-learning-pipeline':
        result = await continualLearningSystem.executeContinualLearning(
          query || 'Sample query', 
          context || {}, 
          baseModel || {}
        );
        break;

      case 'test-time-fine-tuning':
        const tttResult = await continualLearningSystem.ttt.adaptAtInference(
          query || 'Sample query', 
          context || {}, 
          baseModel || {}
        );
        result = {
          tttResult,
          methodology: ['Test-Time Fine-tuning: Adapt model weights at inference'],
          paradigmShift: 'From static pre-training to dynamic adaptation'
        };
        break;

      case 'active-learning-selection':
        const selectedExamples = await continualLearningSystem.activeSelector.selectActiveExamples(
          query || 'Sample query', 
          10
        );
        result = {
          selectedExamples,
          methodology: ['Active Learning Selection: SIFT-style diverse, informative examples'],
          paradigmShift: 'From naive retrieval to active selection'
        };
        break;

      case 'local-mixtures-experts':
        const mergedModel = await continualLearningSystem.localExperts.mergeAtInference(
          query || 'Sample query', 
          baseModel || {}
        );
        result = {
          mergedModel,
          methodology: ['Local Mixtures of Experts: Test-time model merging'],
          paradigmShift: 'Amortized TTT with expert neighborhoods'
        };
        break;

      case 'test-time-memorization':
        const memoryEntries = await continualLearningSystem.memorization.retrieveFromMemory(
          query || 'Sample query'
        );
        result = {
          memoryEntries,
          methodology: ['Test-time Memorization: Architectural memory for continual learning'],
          paradigmShift: 'Persistent memory for continual learning'
        };
        break;

      case 'meta-learning-adaptation':
        const metaResult = await continualLearningSystem.ttt.metaLearningAdaptation(
          query || 'Sample query', 
          context || {}, 
          baseModel || {}
        );
        result = {
          metaResult,
          methodology: ['Meta-Learning Adaptation: Learn how to adapt quickly'],
          paradigmShift: 'One-step adaptation using meta-learned strategies'
        };
        break;

      case 'few-shot-adaptation':
        const fewShotResult = await continualLearningSystem.ttt.fewShotAdaptation(
          query || 'Sample query', 
          context?.examples || [], 
          baseModel || {}
        );
        result = {
          fewShotResult,
          methodology: ['Few-Shot Adaptation: Adapt with minimal examples'],
          paradigmShift: 'Efficient adaptation with limited data'
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid operation. Supported operations: continual-learning-pipeline, test-time-fine-tuning, active-learning-selection, local-mixtures-experts, test-time-memorization, meta-learning-adaptation, few-shot-adaptation'
        }, { status: 400 });
    }

    console.log('✅ Continual Learning operation completed:', { 
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
          'Test-Time Fine-tuning (TTT)',
          'Active Learning Selector',
          'Local Mixtures of Experts',
          'Test-time Memorization'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Continual Learning System API error:', error);
    
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
    message: 'Continual Learning System API - Beyond Static Pre-training',
    paradigmShift: {
      from: 'Static pre-training',
      to: 'Dynamic, on-the-fly adaptation',
      innovation: 'Test-time adaptation outperforms in-context learning',
      efficiency: '3.8B model with TTT outperforms 27B base model',
      speed: 'Local MoE achieves TTT accuracy with 100x speedup'
    },
    availableOperations: [
      {
        operation: 'continual-learning-pipeline',
        description: 'Complete continual learning pipeline with all paradigms',
        parameters: ['query', 'context', 'baseModel']
      },
      {
        operation: 'test-time-fine-tuning',
        description: 'Test-Time Fine-tuning: Adapt model weights at inference',
        parameters: ['query', 'context', 'baseModel']
      },
      {
        operation: 'active-learning-selection',
        description: 'SIFT-style active selection of diverse, informative examples',
        parameters: ['query']
      },
      {
        operation: 'local-mixtures-experts',
        description: 'Local Mixtures of Experts: Test-time model merging',
        parameters: ['query', 'baseModel']
      },
      {
        operation: 'test-time-memorization',
        description: 'Test-time Memorization: Architectural memory for continual learning',
        parameters: ['query']
      },
      {
        operation: 'meta-learning-adaptation',
        description: 'Meta-Learning Adaptation: Learn how to adapt quickly',
        parameters: ['query', 'context', 'baseModel']
      },
      {
        operation: 'few-shot-adaptation',
        description: 'Few-Shot Adaptation: Adapt with minimal examples',
        parameters: ['query', 'examples', 'baseModel']
      }
    ],
    continualLearningParadigms: {
      'test-time-fine-tuning': {
        description: 'Adapt model weights to specific prompt at inference',
        benefits: ['Dynamic adaptation', 'Task-specific optimization', 'Improved performance'],
        performance: 'Consistently outperforms in-context learning'
      },
      'active-learning-selection': {
        description: 'SIFT-style selection of small, diverse, maximally informative examples',
        benefits: ['Reduced redundancy', 'Improved diversity', 'Better information density'],
        performance: 'Outperforms naive nearest neighbor retrieval'
      },
      'local-mixtures-experts': {
        description: 'Test-time model merging with neighborhood experts',
        benefits: ['Amortized TTT', 'Fast retrieval', 'Near-TTT accuracy'],
        performance: '100x faster than TTT with similar accuracy'
      },
      'test-time-memorization': {
        description: 'Architectural memory for continual learning',
        benefits: ['Persistent learning', 'Knowledge retention', 'Efficient retrieval'],
        performance: 'Orthogonal to amortized TTT'
      }
    },
    capabilities: [
      'Test-Time Fine-tuning: Adapt model weights at inference',
      'Active Learning Selection: SIFT-style diverse, informative examples',
      'Local Mixtures of Experts: Test-time model merging',
      'Test-time Memorization: Architectural memory for continual learning',
      'Meta-Learning Adaptation: Learn how to adapt quickly',
      'Few-Shot Adaptation: Adapt with minimal examples',
      'Dynamic On-the-fly Adaptation: Continuous learning during inference',
      'Performance Optimization: 3.8B model outperforms 27B base model'
    ],
    researchInsights: [
      'Scaling paradigm shifting from static pre-training to dynamic adaptation',
      'Test-time fine-tuning creates new performance vector independent of pre-training scale',
      'Actively fine-tuned 3.8B Phi-3 model outperforms base 27B Gemma-2 model',
      'Local Mixtures of Experts amortizes TTT with neighborhood experts',
      'Test-time memorization provides architectural memory for continual learning',
      'On-demand learning consistently outperforms in-context learning on complex tasks'
    ]
  });
}
