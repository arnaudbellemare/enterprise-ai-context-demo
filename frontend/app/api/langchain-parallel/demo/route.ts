import { NextRequest, NextResponse } from 'next/server';
import { getLangChainParallelEngine } from '@/lib/langchain-parallel';

/**
 * LangChain-Style Parallel Execution Demo API
 * Demonstrates async concurrency with RunnableParallel pattern
 */

export async function POST(request: NextRequest) {
  try {
    const {
      configuration = 'topic_analysis',
      topic = 'The history of space exploration',
      use_gepa_routing = true
    } = await request.json();

    console.log('🔄 Starting LangChain-Style Parallel Execution Demo');
    console.log('Configuration:', configuration);
    console.log('Topic:', topic);
    console.log('Use GEPA routing:', use_gepa_routing);

    const engine = getLangChainParallelEngine();

    // Validate configuration exists
    const availableConfigs = engine.getAvailableConfigurations();
    if (!availableConfigs.includes(configuration)) {
      return NextResponse.json({
        success: false,
        error: `Configuration not found. Available configurations: ${availableConfigs.join(', ')}`
      }, { status: 400 });
    }

    // Get configuration details for visualization
    const configDetails = engine.getConfigurationDetails(configuration);

    // Execute LangChain-style parallel processing
    const result = await engine.executeParallel(configuration, topic, {
      useGEPARouting: use_gepa_routing
    });

    // Build comprehensive response
    const response = {
      success: result.success,
      result: {
        langchain_parallel_execution: {
          configuration_id: configuration,
          input_topic: result.input_topic,
          success: result.success,
          total_tasks: result.concurrency_insights.total_tasks,
          completed_tasks: result.concurrency_insights.tasks_completed,
          execution_time_ms: result.execution_metadata.total_duration_ms || 0
        },

        parallel_tasks: configDetails?.parallel_tasks.map(task => ({
          id: task.id,
          name: task.name,
          system_prompt_preview: task.system_prompt.substring(0, 100) + '...',
          user_prompt_template: task.user_prompt_template,
          output_format: task.output_format,
          priority: task.priority
        })),

        synthesis_configuration: {
          synthesis_prompt_preview: configDetails?.synthesis_prompt.substring(0, 200) + '...',
          model_config: configDetails?.model_config
        },

        parallel_outputs: Array.from(result.parallel_outputs.entries()).map(([taskId, output]) => ({
          task_id: taskId,
          output_type: typeof output,
          output_preview: typeof output === 'string' ? 
            output.substring(0, 200) + (output.length > 200 ? '...' : '') :
            JSON.stringify(output).substring(0, 200) + '...',
          output_size: typeof output === 'string' ? output.length : JSON.stringify(output).length
        })),

        synthesis_output: {
          type: typeof result.synthesis_output,
          preview: typeof result.synthesis_output === 'string' ?
            result.synthesis_output.substring(0, 400) + (result.synthesis_output.length > 400 ? '...' : '') :
            JSON.stringify(result.synthesis_output).substring(0, 400) + '...',
          full_length: typeof result.synthesis_output === 'string' ? 
            result.synthesis_output.length : JSON.stringify(result.synthesis_output).length
        },

        performance_metrics: {
          total_duration_ms: result.execution_metadata.total_duration_ms || 0,
          parallel_duration_ms: result.execution_metadata.parallel_duration_ms || 0,
          synthesis_duration_ms: result.execution_metadata.synthesis_duration_ms || 0,
          concurrency_efficiency: Math.round((result.execution_metadata.concurrency_efficiency || 0) * 100) / 100,
          total_tokens_used: Array.from(result.execution_metadata.task_performance.values())
            .reduce((sum, perf) => sum + perf.tokens_used, 0),
          total_cost: Array.from(result.execution_metadata.task_performance.values())
            .reduce((sum, perf) => sum + perf.cost, 0)
        },

        task_performance: Array.from(result.execution_metadata.task_performance.entries()).map(([taskId, perf]) => ({
          task_id: taskId,
          duration_ms: perf.duration_ms || 0,
          success: perf.success,
          tokens_used: perf.tokens_used,
          cost: perf.cost
        })),

        concurrency_insights: {
          concurrency_benefit_percent: result.concurrency_insights.concurrency_benefit,
          efficiency_score: result.concurrency_insights.efficiency_score,
          bottleneck_task: result.concurrency_insights.bottleneck_task,
          recommendations: result.concurrency_insights.recommendations,
          sequential_vs_concurrent: {
            estimated_sequential_time: Array.from(result.execution_metadata.task_performance.values())
              .reduce((sum, perf) => sum + (perf.duration_ms || 0), 0),
            actual_concurrent_time: result.execution_metadata.parallel_duration_ms || 0,
            speedup_factor: Array.from(result.execution_metadata.task_performance.values())
              .reduce((sum, perf) => sum + (perf.duration_ms || 0), 0) / (result.execution_metadata.parallel_duration_ms || 1)
          }
        },

        gepa_integration: use_gepa_routing ? {
          enabled: true,
          description: 'LangChain-style execution with GEPA runtime routing for optimal prompt variant selection',
          benefits: [
            'Each parallel task uses optimal prompt variant based on context',
            'Synthesis step leverages best available prompt for comprehensive analysis',
            'Dynamic adaptation to system load and performance',
            'Cost optimization across all concurrent tasks',
            'Auditable routing decisions for each task'
          ],
          routing_applied_to: [
            'All parallel tasks (summary, questions, key terms)',
            'Final synthesis step for comprehensive analysis'
          ]
        } : {
          enabled: false,
          description: 'LangChain-style execution with standard prompts'
        },

        langchain_pattern_explanation: {
          pattern: 'RunnableParallel with Synthesis',
          description: 'Multiple independent LLM chains execute concurrently, followed by a synthesis step',
          implementation: [
            '1. Define parallel tasks (summarize, questions, key terms)',
            '2. Execute tasks concurrently using Promise.allSettled()',
            '3. Wait for all parallel tasks to complete',
            '4. Execute synthesis step with all parallel results',
            '5. Return comprehensive final output'
          ],
          concurrency_vs_parallelism: {
            note: 'This uses async concurrency, not true parallelism',
            explanation: 'Event loop switches between tasks during network requests (LLM calls)',
            benefit: 'Multiple tasks progress simultaneously on single thread',
            limitation: 'Constrained by JavaScript single-threaded nature'
          }
        },

        key_insights: [
          'LangChain-style parallel execution uses async concurrency for multiple LLM calls',
          'RunnableParallel pattern allows independent tasks to execute simultaneously',
          'Event loop switches between tasks during idle periods (network requests)',
          'Synthesis step combines all parallel results into comprehensive output',
          'Significant performance improvement over sequential execution',
          'Fault tolerance with graceful handling of failed tasks'
        ],

        use_cases_demonstrated: {
          [configuration]: configuration === 'topic_analysis' ? [
            'Topic summarization and overview',
            'Question generation for exploration',
            'Key terms extraction for understanding',
            'Comprehensive synthesis of all aspects'
          ] : configuration === 'market_research' ? [
            'Market analysis and sizing',
            'Competitor research and positioning',
            'Trend identification and forecasting',
            'Risk assessment and mitigation',
            'Strategic market report synthesis'
          ] : configuration === 'content_creation' ? [
            'Content ideation and brainstorming',
            'Structure planning and organization',
            'Audience analysis and targeting',
            'SEO strategy and keywords',
            'Comprehensive content strategy synthesis'
          ] : configuration === 'financial_analysis' ? [
            'Financial modeling and projections',
            'Risk analysis and assessment',
            'Investment thesis development',
            'Valuation analysis and targets',
            'Comprehensive investment report synthesis'
          ] : []
        },

        comparison_with_sequential: {
          sequential_approach: [
            'Execute tasks one after another',
            'Each task waits for previous to complete',
            'Total time = sum of all task times',
            'Single point of failure stops entire process',
            'Poor resource utilization'
          ],
          concurrent_approach: [
            'Execute all tasks simultaneously',
            'Event loop manages task switching',
            'Total time ≈ longest task time',
            'Fault tolerance with graceful failures',
            'Optimal resource utilization',
            'Better user experience with faster results'
          ]
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('LangChain parallel demo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute LangChain parallel demo'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to list available LangChain configurations
 */
export async function GET() {
  try {
    const engine = getLangChainParallelEngine();
    const availableConfigs = engine.getAvailableConfigurations();
    
    const configDetails = availableConfigs.map(configId => {
      const details = engine.getConfigurationDetails(configId);
      return {
        id: configId,
        name: details?.name || configId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: details?.description || 'LangChain-style parallel execution configuration',
        parallel_tasks_count: details?.parallel_tasks.length || 0,
        model_config: details?.model_config,
        parallel_tasks: details?.parallel_tasks.map(task => ({
          id: task.id,
          name: task.name,
          priority: task.priority,
          output_format: task.output_format
        })) || []
      };
    });

    return NextResponse.json({
      success: true,
      available_configurations: configDetails,
      langchain_pattern_info: {
        pattern_name: 'RunnableParallel with Synthesis',
        description: 'Multiple independent LLM chains execute concurrently, followed by a synthesis step',
        benefits: [
          'Async concurrency for multiple LLM calls',
          'Event loop manages task switching during network requests',
          'Significant performance improvement over sequential execution',
          'Fault tolerance with graceful error handling',
          'Comprehensive synthesis of all parallel results'
        ],
        use_cases: [
          'Topic analysis with multiple perspectives',
          'Market research with concurrent data gathering',
          'Content creation with parallel ideation',
          'Financial analysis with multiple evaluation methods'
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching LangChain configurations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available configurations'
    }, { status: 500 });
  }
}
