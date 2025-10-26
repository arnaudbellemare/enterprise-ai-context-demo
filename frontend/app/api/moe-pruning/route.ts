import { NextRequest, NextResponse } from 'next/server';
import UnifiedMoEPromptSystem from '../../../../lib/moe-pruning-system';

const unifiedSystem = new UnifiedMoEPromptSystem();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      operation,
      task,
      initialPrompt,
      pruningStrategy
    } = body;

    console.log('🧠 MoE Pruning + Prompt Optimization API:', { operation });

    let result;

    switch (operation) {
      case 'unified-pipeline':
        const strategy = pruningStrategy || {
          name: 'adaptive',
          threshold: 0.75,
          criteria: 'adaptive',
          targetReduction: 0.3
        };
        
        result = await unifiedSystem.executeUnifiedPipeline(
          task || 'general analysis',
          initialPrompt || 'Analyze the following:',
          strategy
        );
        break;

      case 'prune-experts':
        const pruningEngine = unifiedSystem['pruningEngine'];
        const pruningResult = await pruningEngine.pruneExperts(
          pruningStrategy || {
            name: 'performance-based',
            threshold: 0.80,
            criteria: 'performance',
            targetReduction: 0.25
          }
        );
        result = {
          pruningResult,
          methodology: ['MoE Pruning: Create modular LLM architecture']
        };
        break;

      case 'optimize-prompt':
        const promptEngine = unifiedSystem['promptEngine'];
        const promptOptimization = await promptEngine.optimizePrompt(
          initialPrompt || 'Analyze the following:',
          task || 'general analysis',
          0.95
        );
        result = {
          promptOptimization,
          methodology: ['Prompt Optimization: Surpass RL performance']
        };
        break;

      case 'analyze-capabilities':
        const pruningEng = unifiedSystem['pruningEngine'];
        const promptEng = unifiedSystem['promptEngine'];
        
        const prunedResult = await pruningEng.pruneExperts({
          name: 'adaptive',
          threshold: 0.75,
          criteria: 'adaptive',
          targetReduction: 0.3
        });
        
        const modularArch = await pruningEng.createModularArchitecture(prunedResult.retainedExperts);
        
        const promptOpt = await promptEng.optimizePrompt(
          initialPrompt || 'Analyze the following:',
          task || 'general analysis',
          0.95
        );
        
        const capabilities = await promptEng.analyzeModuleCapabilities(
          modularArch.modules,
          promptOpt
        );
        
        result = {
          capabilities,
          methodology: ['Analyze Module Capabilities: What we can do with modules']
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid operation. Supported: unified-pipeline, prune-experts, optimize-prompt, analyze-capabilities'
        }, { status: 400 });
    }

    console.log('✅ MoE Pruning + Prompt Optimization operation completed:', { operation });

    return NextResponse.json({
      success: true,
      operation,
      result,
      timestamp: new Date().toISOString(),
      breakthrough: {
        insight1: 'MoE pruning means we can have LLM modules',
        insight2: 'Prompt optimization surpassing RL (in some cases)',
        insight3: 'We can do more with those modules than previously thought possible'
      }
    });

  } catch (error) {
    console.error('❌ MoE Pruning + Prompt Optimization API error:', error);
    
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
    message: 'MoE Pruning + Prompt Optimization System - Surpassing RL Performance',
    breakthrough: {
      insight1: 'MoE pruning means we can have LLM modules',
      insight2: 'Prompt optimization surpassing RL (in some cases)',
      insight3: 'We can do more with those modules than previously thought possible'
    },
    availableOperations: [
      {
        operation: 'unified-pipeline',
        description: 'Complete MoE pruning + prompt optimization pipeline',
        parameters: ['task', 'initialPrompt', 'pruningStrategy']
      },
      {
        operation: 'prune-experts',
        description: 'Prune MoE experts to create modular LLM architecture',
        parameters: ['pruningStrategy']
      },
      {
        operation: 'optimize-prompt',
        description: 'Optimize prompts to surpass RL performance',
        parameters: ['initialPrompt', 'task']
      },
      {
        operation: 'analyze-capabilities',
        description: 'Analyze what we can do with modules',
        parameters: ['task', 'initialPrompt']
      }
    ],
    paradigms: {
      'moe-pruning': {
        description: 'MoE pruning means we can have LLM modules',
        breakthrough: 'Create modular LLM architecture through expert pruning',
        capabilities: [
          'Dynamic expert composition',
          'Modular architecture creation',
          'Efficient expert selection',
          'Performance-based pruning'
        ]
      },
      'prompt-optimization': {
        description: 'Prompt optimization surpassing RL (in some cases)',
        breakthrough: 'Achieve better performance than RL through prompt engineering',
        capabilities: [
          'Iterative prompt refinement',
          'RL baseline comparison',
          'Domain-specific optimization',
          'Performance gain tracking'
        ]
      },
      'module-capabilities': {
        description: 'We can do more with those modules than previously thought possible',
        breakthrough: 'Unlock new capabilities through modular composition',
        capabilities: [
          'Cross-domain expert combinations',
          'Dynamic capability analysis',
          'Performance potential estimation',
          'RL-surpassing domain identification'
        ]
      }
    },
    researchInsights: [
      'MoE pruning enables modular LLM architectures',
      'Prompt optimization can surpass RL in specific domains',
      'Modular experts can be dynamically composed and pruned',
      'We can do more with modules than previously thought possible',
      'Efficiency gains through strategic expert pruning',
      'Performance improvements through prompt evolution'
    ]
  });
}
