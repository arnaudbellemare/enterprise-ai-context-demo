import { NextRequest, NextResponse } from 'next/server';
import { getPromptChainingEngine } from '@/lib/prompt-chaining';

/**
 * Prompt Chaining Demo API
 * Demonstrates the Prompt Chaining (Pipeline) pattern for complex multi-step tasks
 */

export async function POST(request: NextRequest) {
  try {
    const {
      chain_type = 'market_research',
      input_data = 'Sample market research document about AI adoption in healthcare',
      use_gepa_routing = true,
      enable_parallel = false
    } = await request.json();

    console.log('🔗 Starting Prompt Chaining Demo');
    console.log('Chain type:', chain_type);
    console.log('Use GEPA routing:', use_gepa_routing);

    const engine = getPromptChainingEngine();

    // Validate chain exists
    const availableChains = engine.getAvailableChains();
    if (!availableChains.includes(chain_type)) {
      return NextResponse.json({
        success: false,
        error: `Chain not found. Available chains: ${availableChains.join(', ')}`
      }, { status: 400 });
    }

    // Get chain details for visualization
    const chainDetails = engine.getChainDetails(chain_type);

    // Execute the chain
    const result = await engine.executeChain(chain_type, input_data, {
      useGEPARouting: use_gepa_routing,
      enableParallelSteps: enable_parallel
    });

    // Build comprehensive response
    const response = {
      success: result.success,
      result: {
        chain_execution: {
          chain_id: chain_type,
          success: result.success,
          steps_completed: result.chain_visualization.steps_completed,
          total_steps: result.chain_visualization.total_steps,
          execution_time: result.execution_metadata.completed_at ? 
            new Date(result.execution_metadata.completed_at).getTime() - 
            new Date(result.execution_metadata.started_at).getTime() : 0
        },

        chain_structure: chainDetails?.map(step => ({
          id: step.id,
          name: step.name,
          role: step.role,
          expected_output: step.expected_output_format,
          has_external_tools: !!step.external_tools,
          has_validation: !!step.validation_rules
        })),

        execution_flow: result.chain_visualization.execution_flow,

        step_outputs: Object.entries(result.step_outputs).map(([stepId, output]) => ({
          step_id: stepId,
          output_preview: typeof output === 'string' ? 
            output.substring(0, 200) + (output.length > 200 ? '...' : '') :
            JSON.stringify(output).substring(0, 200) + '...',
          output_type: typeof output,
          output_length: typeof output === 'string' ? output.length : JSON.stringify(output).length
        })),

        final_output: {
          type: typeof result.final_output,
          preview: typeof result.final_output === 'string' ?
            result.final_output.substring(0, 300) + (result.final_output.length > 300 ? '...' : '') :
            JSON.stringify(result.final_output).substring(0, 300) + '...',
          full_length: typeof result.final_output === 'string' ? 
            result.final_output.length : JSON.stringify(result.final_output).length
        },

        performance_metrics: {
          total_tokens_used: result.execution_metadata.total_tokens_used,
          total_cost: result.execution_metadata.total_cost,
          avg_step_latency_ms: result.execution_metadata.performance_metrics.avg_step_latency_ms,
          success_rate: result.execution_metadata.performance_metrics.success_rate,
          error_rate: result.execution_metadata.performance_metrics.error_rate
        },

        gepa_integration: use_gepa_routing ? {
          enabled: true,
          description: 'Chain executed with GEPA runtime routing for optimal prompt variant selection',
          benefits: [
            'Dynamic prompt selection based on runtime context',
            'Cost and latency optimization',
            'Automatic adaptation to system load',
            'Auditable routing decisions'
          ]
        } : {
          enabled: false,
          description: 'Chain executed with standard prompts'
        },

        key_insights: [
          'Prompt chaining breaks complex tasks into manageable sequential steps',
          'Each step focuses on a specific role and output format',
          'Output from one step serves as input for the next',
          'Validation rules ensure quality at each step',
          'External tools can be integrated between steps',
          'State management maintains context across the chain',
          'Retry policies handle transient failures gracefully'
        ],

        use_cases_demonstrated: {
          [chain_type]: chain_type === 'market_research' ? [
            'Content extraction from research documents',
            'Structured summarization of findings',
            'Trend identification with supporting data',
            'Professional report generation'
          ] : chain_type === 'financial_analysis' ? [
            'Financial data extraction and normalization',
            'Automated metrics calculation',
            'Risk assessment and scoring',
            'Investment recommendation generation'
          ] : chain_type === 'code_generation' ? [
            'Requirements analysis and extraction',
            'Pseudocode generation and architecture',
            'Code implementation with best practices',
            'Automated code review and testing'
          ] : []
        },

        comparison_with_single_prompt: {
          single_prompt_issues: [
            'Cognitive overload with complex multi-faceted tasks',
            'Instruction neglect and context drift',
            'Error propagation and hallucination risk',
            'Difficulty in debugging and validation',
            'Limited integration with external tools'
          ],
          chaining_benefits: [
            'Focused processing at each step',
            'Modular debugging and validation',
            'Clear separation of concerns',
            'Robust error handling and recovery',
            'Easy integration with external systems',
            'Better control over output quality'
          ]
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Prompt chaining demo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute prompt chaining demo'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to list available chains
 */
export async function GET() {
  try {
    const engine = getPromptChainingEngine();
    const availableChains = engine.getAvailableChains();
    
    const chainDetails = availableChains.map(chainId => {
      const details = engine.getChainDetails(chainId);
      return {
        id: chainId,
        name: chainId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        steps: details?.length || 0,
        description: getChainDescription(chainId),
        use_cases: getChainUseCases(chainId)
      };
    });

    return NextResponse.json({
      success: true,
      available_chains: chainDetails
    });

  } catch (error) {
    console.error('Error fetching chains:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available chains'
    }, { status: 500 });
  }
}

function getChainDescription(chainId: string): string {
  const descriptions = {
    market_research: 'Multi-step market research analysis from document extraction to final report generation',
    financial_analysis: 'Comprehensive financial analysis pipeline from data extraction to investment recommendations',
    code_generation: 'Complete software development workflow from requirements to tested code'
  };
  return descriptions[chainId as keyof typeof descriptions] || 'Custom prompt chain';
}

function getChainUseCases(chainId: string): string[] {
  const useCases = {
    market_research: [
      'Automated research report generation',
      'Market trend analysis',
      'Competitive intelligence',
      'Business intelligence workflows'
    ],
    financial_analysis: [
      'Investment analysis automation',
      'Risk assessment workflows',
      'Financial reporting',
      'Portfolio management'
    ],
    code_generation: [
      'AI-assisted development',
      'Automated code review',
      'Test generation',
      'Software architecture planning'
    ]
  };
  return useCases[chainId as keyof typeof useCases] || ['Custom workflows'];
}
