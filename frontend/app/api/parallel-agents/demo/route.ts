import { NextRequest, NextResponse } from 'next/server';
import { getParallelAgentEngine } from '@/lib/parallel-agents';

/**
 * Parallel Agents Demo API
 * Demonstrates parallel execution of multiple specialized sub-agents
 */

export async function POST(request: NextRequest) {
  try {
    const {
      configuration = 'company_research',
      input = 'Apple Inc.',
      use_gepa_routing = true,
      aggregation_strategy = 'merge',
      timeout_ms = 10000
    } = await request.json();

    console.log('🔄 Starting Parallel Agents Demo');
    console.log('Configuration:', configuration);
    console.log('Input:', input);
    console.log('Use GEPA routing:', use_gepa_routing);

    const engine = getParallelAgentEngine();

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

    // Execute parallel processing
    const result = await engine.executeParallel(configuration, input, {
      useGEPARouting: use_gepa_routing,
      aggregationStrategy: aggregation_strategy,
      timeout_ms
    });

    // Build comprehensive response
    const response = {
      success: result.success,
      result: {
        parallel_execution: {
          configuration_id: configuration,
          input_processed: input,
          success: result.success,
          total_agents: result.parallel_visualization.total_agents,
          successful_agents: result.parallel_visualization.successful_agents,
          failed_agents: result.parallel_visualization.failed_agents,
          execution_time_ms: result.execution_metadata.total_duration_ms || 0
        },

        agent_configuration: configDetails?.map(agent => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          processing_type: agent.processing_type,
          priority: agent.priority,
          expected_output: agent.expected_output_format
        })),

        execution_timeline: result.parallel_visualization.execution_timeline,

        individual_results: Array.from(result.individual_results.entries()).map(([agentId, output]) => ({
          agent_id: agentId,
          output_type: typeof output,
          output_preview: typeof output === 'string' ? 
            output.substring(0, 200) + (output.length > 200 ? '...' : '') :
            JSON.stringify(output).substring(0, 200) + '...',
          output_size: typeof output === 'string' ? output.length : JSON.stringify(output).length
        })),

        aggregated_output: {
          type: typeof result.aggregated_output,
          preview: typeof result.aggregated_output === 'string' ?
            result.aggregated_output.substring(0, 300) + (result.aggregated_output.length > 300 ? '...' : '') :
            JSON.stringify(result.aggregated_output).substring(0, 300) + '...',
          strategy_used: aggregation_strategy
        },

        performance_metrics: {
          parallel_efficiency: Math.round((result.execution_metadata.parallel_efficiency || 0) * 100) / 100,
          total_tokens_used: Array.from(result.execution_metadata.agent_performance.values())
            .reduce((sum, perf) => sum + perf.tokens_used, 0),
          total_cost: Array.from(result.execution_metadata.agent_performance.values())
            .reduce((sum, perf) => sum + perf.cost, 0),
          avg_agent_duration_ms: Array.from(result.execution_metadata.agent_performance.values())
            .reduce((sum, perf) => sum + (perf.duration_ms || 0), 0) / result.parallel_visualization.total_agents
        },

        parallelization_insights: {
          time_saved_percent: result.insights.parallelization_benefit,
          efficiency_score: result.insights.efficiency_score,
          bottleneck_agent: result.insights.bottleneck_agent,
          recommendations: result.insights.recommendations,
          sequential_vs_parallel: {
            estimated_sequential_time: Array.from(result.execution_metadata.agent_performance.values())
              .reduce((sum, perf) => sum + (perf.duration_ms || 0), 0),
            actual_parallel_time: result.execution_metadata.total_duration_ms || 0,
            speedup_factor: Array.from(result.execution_metadata.agent_performance.values())
              .reduce((sum, perf) => sum + (perf.duration_ms || 0), 0) / (result.execution_metadata.total_duration_ms || 1)
          }
        },

        gepa_integration: use_gepa_routing ? {
          enabled: true,
          description: 'Parallel agents executed with GEPA runtime routing for optimal prompt variant selection',
          benefits: [
            'Each agent uses optimal prompt variant based on its role and context',
            'Dynamic adaptation to system load and performance',
            'Cost optimization across all parallel agents',
            'Consistent quality with auditable routing decisions'
          ],
          routing_decisions: Array.from(result.execution_metadata.agent_performance.entries()).map(([agentId, perf]) => ({
            agent_id: agentId,
            tokens_used: perf.tokens_used,
            cost: perf.cost,
            success: perf.success
          }))
        } : {
          enabled: false,
          description: 'Parallel agents executed with standard prompts'
        },

        key_insights: [
          'Parallel execution processes multiple independent tasks simultaneously',
          'Each sub-agent specializes in a specific aspect of the overall task',
          'Results are aggregated using configurable strategies (merge, consensus, weighted, best-of)',
          'Significant performance improvements over sequential processing',
          'Fault tolerance - system continues even if some agents fail',
          'Scalable architecture for complex multi-faceted tasks'
        ],

        use_cases_demonstrated: {
          [configuration]: configuration === 'company_research' ? [
            'News and sentiment analysis',
            'Financial data gathering',
            'Competitive intelligence research',
            'Social media monitoring'
          ] : configuration === 'feedback_analysis' ? [
            'Sentiment analysis across feedback',
            'Keyword extraction and topic modeling',
            'Automated categorization',
            'Urgency detection and prioritization'
          ] : configuration === 'travel_planning' ? [
            'Flight and hotel search',
            'Activity and attraction research',
            'Dining and restaurant recommendations',
            'Comprehensive travel planning'
          ] : configuration === 'content_generation' ? [
            'Headline generation and A/B testing',
            'Content body creation',
            'Call-to-action optimization',
            'Visual content recommendations'
          ] : []
        },

        comparison_with_sequential: {
          sequential_issues: [
            'Much slower execution time',
            'Blocking operations reduce responsiveness',
            'Resource underutilization',
            'Single point of failure',
            'Poor user experience with long wait times'
          ],
          parallel_benefits: [
            'Faster overall execution',
            'Better resource utilization',
            'Improved fault tolerance',
            'Enhanced user experience',
            'Scalable architecture',
            'Independent task processing'
          ]
        },

        aggregation_strategies: {
          merge: 'Combines all agent results into a comprehensive output',
          consensus: 'Finds agreement among agent results',
          weighted: 'Applies weights based on agent priority and performance',
          best_of: 'Selects the highest quality result from all agents'
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Parallel agents demo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute parallel agents demo'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to list available parallel configurations
 */
export async function GET() {
  try {
    const engine = getParallelAgentEngine();
    const availableConfigs = engine.getAvailableConfigurations();
    
    const configDetails = availableConfigs.map(configId => {
      const details = engine.getConfigurationDetails(configId);
      return {
        id: configId,
        name: configId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        agent_count: details?.length || 0,
        description: getConfigurationDescription(configId),
        use_cases: getConfigurationUseCases(configId),
        agents: details?.map(agent => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          processing_type: agent.processing_type,
          priority: agent.priority
        })) || []
      };
    });

    return NextResponse.json({
      success: true,
      available_configurations: configDetails
    });

  } catch (error) {
    console.error('Error fetching parallel configurations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available configurations'
    }, { status: 500 });
  }
}

function getConfigurationDescription(configId: string): string {
  const descriptions = {
    company_research: 'Comprehensive company analysis using parallel specialized agents for news, financial, competitive, and social media research',
    feedback_analysis: 'Multi-faceted customer feedback processing with sentiment analysis, keyword extraction, categorization, and urgency detection',
    travel_planning: 'Complete travel planning workflow with parallel search for flights, hotels, activities, and dining recommendations',
    content_generation: 'Parallel content creation with specialized agents for headlines, body content, CTAs, and visual recommendations'
  };
  return descriptions[configId as keyof typeof descriptions] || 'Custom parallel agent configuration';
}

function getConfigurationUseCases(configId: string): string[] {
  const useCases = {
    company_research: [
      'Investment research and due diligence',
      'Competitive analysis and market intelligence',
      'Brand monitoring and reputation management',
      'Business development and partnership research'
    ],
    feedback_analysis: [
      'Customer experience optimization',
      'Product improvement prioritization',
      'Sentiment monitoring and trend analysis',
      'Automated customer service routing'
    ],
    travel_planning: [
      'Automated travel booking assistance',
      'Personalized trip planning',
      'Travel concierge services',
      'Corporate travel management'
    ],
    content_generation: [
      'Marketing campaign creation',
      'A/B testing and optimization',
      'Content marketing automation',
      'Multi-channel content distribution'
    ]
  };
  return useCases[configId as keyof typeof useCases] || ['Custom parallel processing workflows'];
}
