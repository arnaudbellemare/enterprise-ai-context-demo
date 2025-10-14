/**
 * Parallel Agent Processing Pattern
 * 
 * Implements parallel execution of multiple sub-agents on the same input:
 * - Single input distributed to multiple specialized agents
 * - Concurrent processing for independent tasks
 * - Aggregated outputs for comprehensive results
 * - Performance optimization through parallelization
 */

export interface SubAgent {
  id: string;
  name: string;
  role: string;
  prompt: string;
  expected_output_format: 'text' | 'json' | 'structured' | 'list';
  processing_type: 'analysis' | 'extraction' | 'generation' | 'validation' | 'transformation';
  dependencies?: string[]; // Other agents this depends on
  timeout_ms?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface ParallelExecution {
  execution_id: string;
  input: any;
  sub_agents: SubAgent[];
  execution_state: 'pending' | 'running' | 'completed' | 'failed';
  results: Map<string, any>;
  errors: Map<string, string>;
  performance_metrics: {
    start_time: number;
    end_time?: number;
    total_duration_ms?: number;
    parallel_efficiency: number; // Actual vs theoretical speedup
    agent_performance: Map<string, {
      start_time: number;
      end_time?: number;
      duration_ms?: number;
      success: boolean;
      tokens_used: number;
      cost: number;
    }>;
  };
  aggregation_strategy: 'merge' | 'consensus' | 'weighted' | 'best_of';
}

export interface ParallelResult {
  success: boolean;
  aggregated_output: any;
  individual_results: Map<string, any>;
  execution_metadata: ParallelExecution['performance_metrics'];
  parallel_visualization: {
    total_agents: number;
    successful_agents: number;
    failed_agents: number;
    execution_timeline: Array<{
      agent_id: string;
      status: 'completed' | 'failed' | 'timeout';
      duration_ms: number;
      output_preview: string;
    }>;
  };
  insights: {
    parallelization_benefit: number; // Time saved vs sequential
    efficiency_score: number; // 0-1
    bottleneck_agent?: string;
    recommendations: string[];
  };
}

/**
 * Parallel Agent Engine
 * Manages concurrent execution of multiple specialized agents
 */
export class ParallelAgentEngine {
  private predefinedConfigurations: Map<string, SubAgent[]> = new Map();
  private activeExecutions: Map<string, ParallelExecution> = new Map();

  constructor() {
    this.initializePredefinedConfigurations();
  }

  /**
   * Initialize common parallel agent configurations
   */
  private initializePredefinedConfigurations(): void {
    // Company Research Configuration
    this.predefinedConfigurations.set('company_research', [
      {
        id: 'news_agent',
        name: 'News Research Agent',
        role: 'News Analyst',
        prompt: `You are a News Research Specialist. Analyze news articles and social media mentions about the company.

Company: {input}

Extract:
- Recent news headlines and summaries
- Sentiment analysis of coverage
- Key events and developments
- Media attention trends

Output format: Structured analysis with sentiment scores.`,
        expected_output_format: 'structured',
        processing_type: 'analysis',
        priority: 'high'
      },
      {
        id: 'financial_agent',
        name: 'Financial Data Agent',
        role: 'Financial Analyst',
        prompt: `You are a Financial Data Specialist. Gather and analyze financial information about the company.

Company: {input}

Collect:
- Stock price data and trends
- Financial ratios and metrics
- Revenue and growth data
- Market cap and valuation

Output format: JSON with financial metrics.`,
        expected_output_format: 'json',
        processing_type: 'extraction',
        priority: 'high'
      },
      {
        id: 'competitive_agent',
        name: 'Competitive Intelligence Agent',
        role: 'Competitive Analyst',
        prompt: `You are a Competitive Intelligence Specialist. Research the competitive landscape.

Company: {input}

Analyze:
- Direct competitors and market position
- Competitive advantages and weaknesses
- Market share and positioning
- Industry trends and threats

Output format: Structured competitive analysis.`,
        expected_output_format: 'structured',
        processing_type: 'analysis',
        priority: 'medium'
      },
      {
        id: 'social_agent',
        name: 'Social Media Agent',
        role: 'Social Media Analyst',
        prompt: `You are a Social Media Intelligence Specialist. Monitor social media presence and sentiment.

Company: {input}

Monitor:
- Social media mentions and engagement
- Brand sentiment and reputation
- Influencer mentions and partnerships
- Customer feedback and reviews

Output format: JSON with social media metrics.`,
        expected_output_format: 'json',
        processing_type: 'analysis',
        priority: 'medium'
      }
    ]);

    // Customer Feedback Analysis Configuration
    this.predefinedConfigurations.set('feedback_analysis', [
      {
        id: 'sentiment_agent',
        name: 'Sentiment Analysis Agent',
        role: 'Sentiment Analyst',
        prompt: `You are a Sentiment Analysis Specialist. Analyze the emotional tone and sentiment of customer feedback.

Feedback: {input}

Analyze:
- Overall sentiment (positive/negative/neutral)
- Emotional intensity scores
- Sentiment trends over time
- Key sentiment drivers

Output format: JSON with sentiment scores and trends.`,
        expected_output_format: 'json',
        processing_type: 'analysis',
        priority: 'high'
      },
      {
        id: 'keyword_agent',
        name: 'Keyword Extraction Agent',
        role: 'Keyword Analyst',
        prompt: `You are a Keyword Extraction Specialist. Identify key themes and topics in customer feedback.

Feedback: {input}

Extract:
- Most frequent keywords and phrases
- Topic categories and themes
- Emerging issues and trends
- Product feature mentions

Output format: JSON with keyword analysis.`,
        expected_output_format: 'json',
        processing_type: 'extraction',
        priority: 'high'
      },
      {
        id: 'categorization_agent',
        name: 'Categorization Agent',
        role: 'Categorization Specialist',
        prompt: `You are a Feedback Categorization Specialist. Categorize feedback into relevant business areas.

Feedback: {input}

Categorize by:
- Product features and functionality
- Customer service and support
- Pricing and billing
- User experience and interface

Output format: JSON with categorized feedback.`,
        expected_output_format: 'json',
        processing_type: 'transformation',
        priority: 'medium'
      },
      {
        id: 'urgency_agent',
        name: 'Urgency Detection Agent',
        role: 'Urgency Analyst',
        prompt: `You are an Urgency Detection Specialist. Identify urgent issues requiring immediate attention.

Feedback: {input}

Identify:
- Critical bugs or issues
- Security concerns
- Customer churn risks
- Escalation-worthy complaints

Output format: JSON with urgency scores and flags.`,
        expected_output_format: 'json',
        processing_type: 'analysis',
        priority: 'high'
      }
    ]);

    // Travel Planning Configuration
    this.predefinedConfigurations.set('travel_planning', [
      {
        id: 'flight_agent',
        name: 'Flight Search Agent',
        role: 'Flight Specialist',
        prompt: `You are a Flight Search Specialist. Find the best flight options for the travel request.

Travel Request: {input}

Search for:
- Available flights and prices
- Best routes and connections
- Airline options and amenities
- Price trends and deals

Output format: JSON with flight options.`,
        expected_output_format: 'json',
        processing_type: 'extraction',
        priority: 'high'
      },
      {
        id: 'hotel_agent',
        name: 'Hotel Search Agent',
        role: 'Hotel Specialist',
        prompt: `You are a Hotel Search Specialist. Find accommodation options for the travel request.

Travel Request: {input}

Search for:
- Available hotels and rates
- Location and amenities
- Reviews and ratings
- Booking availability

Output format: JSON with hotel options.`,
        expected_output_format: 'json',
        processing_type: 'extraction',
        priority: 'high'
      },
      {
        id: 'activities_agent',
        name: 'Activities Agent',
        role: 'Activities Specialist',
        prompt: `You are a Local Activities Specialist. Find things to do and see at the destination.

Travel Request: {input}

Research:
- Tourist attractions and landmarks
- Local events and activities
- Cultural experiences
- Outdoor activities and recreation

Output format: JSON with activity recommendations.`,
        expected_output_format: 'json',
        processing_type: 'generation',
        priority: 'medium'
      },
      {
        id: 'dining_agent',
        name: 'Dining Agent',
        role: 'Dining Specialist',
        prompt: `You are a Restaurant and Dining Specialist. Find dining recommendations for the destination.

Travel Request: {input}

Recommend:
- Top-rated restaurants
- Local cuisine specialties
- Budget-friendly options
- Dietary restrictions accommodations

Output format: JSON with dining recommendations.`,
        expected_output_format: 'json',
        processing_type: 'generation',
        priority: 'medium'
      }
    ]);

    // Content Generation Configuration
    this.predefinedConfigurations.set('content_generation', [
      {
        id: 'headline_agent',
        name: 'Headline Generation Agent',
        role: 'Headline Specialist',
        prompt: `You are a Headline Generation Specialist. Create compelling headlines for the content.

Content Topic: {input}

Generate:
- Multiple headline variations
- Different emotional appeals
- Length variations (short/medium/long)
- A/B testing options

Output format: JSON with headline options.`,
        expected_output_format: 'json',
        processing_type: 'generation',
        priority: 'high'
      },
      {
        id: 'body_agent',
        name: 'Content Body Agent',
        role: 'Content Writer',
        prompt: `You are a Content Writing Specialist. Create the main body content.

Content Topic: {input}

Write:
- Engaging introduction
- Well-structured main content
- Supporting details and examples
- Compelling conclusion

Output format: Structured content.`,
        expected_output_format: 'structured',
        processing_type: 'generation',
        priority: 'high'
      },
      {
        id: 'cta_agent',
        name: 'Call-to-Action Agent',
        role: 'CTA Specialist',
        prompt: `You are a Call-to-Action Specialist. Create effective CTAs for the content.

Content Topic: {input}

Create:
- Primary CTA buttons
- Secondary CTAs
- Different urgency levels
- A/B testing variations

Output format: JSON with CTA options.`,
        expected_output_format: 'json',
        processing_type: 'generation',
        priority: 'medium'
      },
      {
        id: 'visual_agent',
        name: 'Visual Content Agent',
        role: 'Visual Specialist',
        prompt: `You are a Visual Content Specialist. Suggest visual elements for the content.

Content Topic: {input}

Suggest:
- Image types and styles
- Color schemes
- Layout recommendations
- Visual hierarchy

Output format: JSON with visual recommendations.`,
        expected_output_format: 'json',
        processing_type: 'generation',
        priority: 'low'
      }
    ]);
  }

  /**
   * Execute parallel processing with multiple sub-agents
   */
  async executeParallel(
    configurationId: string,
    input: any,
    options: {
      useGEPARouting?: boolean;
      aggregationStrategy?: 'merge' | 'consensus' | 'weighted' | 'best_of';
      timeout_ms?: number;
      customAgents?: SubAgent[];
    } = {}
  ): Promise<ParallelResult> {
    console.log(`🔄 Starting parallel agent execution: ${configurationId}`);
    
    const subAgents = options.customAgents || this.predefinedConfigurations.get(configurationId);
    if (!subAgents) {
      throw new Error(`Configuration not found: ${configurationId}`);
    }

    // Initialize execution state
    const execution: ParallelExecution = {
      execution_id: `exec_${Date.now()}`,
      input,
      sub_agents: subAgents,
      execution_state: 'pending',
      results: new Map(),
      errors: new Map(),
      performance_metrics: {
        start_time: Date.now(),
        parallel_efficiency: 0,
        agent_performance: new Map()
      },
      aggregation_strategy: options.aggregationStrategy || 'merge'
    };

    this.activeExecutions.set(execution.execution_id, execution);
    execution.execution_state = 'running';

    try {
      console.log(`🚀 Executing ${subAgents.length} agents in parallel`);

      // Execute all agents concurrently
      const agentPromises = subAgents.map(agent => 
        this.executeSubAgent(agent, input, execution, options)
      );

      // Wait for all agents to complete
      const results = await Promise.allSettled(agentPromises);

      // Process results
      results.forEach((result, index) => {
        const agent = subAgents[index];
        if (result.status === 'fulfilled') {
          execution.results.set(agent.id, result.value.output);
        } else {
          execution.errors.set(agent.id, result.reason);
          console.error(`❌ Agent ${agent.name} failed:`, result.reason);
        }
      });

      // Complete execution
      execution.execution_state = 'completed';
      execution.performance_metrics.end_time = Date.now();
      execution.performance_metrics.total_duration_ms = 
        execution.performance_metrics.end_time - execution.performance_metrics.start_time;

      // Calculate parallel efficiency
      execution.performance_metrics.parallel_efficiency = this.calculateParallelEfficiency(execution);

      // Aggregate results
      const aggregatedOutput = this.aggregateResults(execution);

      const parallelResult = this.buildParallelResult(execution, aggregatedOutput);
      console.log(`✅ Parallel execution completed: ${configurationId}`);

      return parallelResult;

    } catch (error) {
      console.error(`💥 Parallel execution failed: ${configurationId}`, error);
      execution.execution_state = 'failed';
      execution.performance_metrics.end_time = Date.now();
      
      return {
        success: false,
        aggregated_output: null,
        individual_results: execution.results,
        execution_metadata: execution.performance_metrics,
        parallel_visualization: this.buildVisualization(execution),
        insights: {
          parallelization_benefit: 0,
          efficiency_score: 0,
          recommendations: ['Execution failed - check agent configurations']
        }
      };
    }
  }

  /**
   * Execute a single sub-agent
   */
  private async executeSubAgent(
    agent: SubAgent,
    input: any,
    execution: ParallelExecution,
    options: any
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    const startTime = Date.now();
    
    // Initialize agent performance tracking
    execution.performance_metrics.agent_performance.set(agent.id, {
      start_time: startTime,
      tokens_used: 0,
      cost: 0,
      success: false
    });

    try {
      console.log(`🤖 Executing agent: ${agent.name}`);

      // Build prompt with input
      const contextualPrompt = agent.prompt.replace('{input}', JSON.stringify(input));

      // Execute with GEPA routing if enabled
      let result;
      if (options.useGEPARouting) {
        result = await this.executeWithGEPARouting(agent, contextualPrompt);
      } else {
        result = await this.executeStandardAgent(agent, contextualPrompt);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update performance metrics
      const agentPerf = execution.performance_metrics.agent_performance.get(agent.id)!;
      agentPerf.end_time = endTime;
      agentPerf.duration_ms = duration;
      agentPerf.success = true;
      agentPerf.tokens_used = result.tokens_used;
      agentPerf.cost = result.cost;

      console.log(`✅ Agent ${agent.name} completed in ${duration}ms`);

      return result;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update performance metrics for failed agent
      const agentPerf = execution.performance_metrics.agent_performance.get(agent.id)!;
      agentPerf.end_time = endTime;
      agentPerf.duration_ms = duration;
      agentPerf.success = false;

      console.error(`❌ Agent ${agent.name} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Execute agent with GEPA routing for optimal prompt selection
   */
  private async executeWithGEPARouting(
    agent: SubAgent,
    prompt: string
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    // Import GEPA router
    const { getGEPARouter } = await import('./gepa-runtime-router');
    const router = getGEPARouter();
    
    // Map agent role to GEPA module
    const moduleName = this.mapRoleToModule(agent.role);
    
    // Create routing signals
    const signals = {
      current_load: 0.3, // Parallel execution typically has lower per-agent load
      budget_remaining: 100,
      latency_requirement: 3000,
      risk_tolerance: 0.4,
      user_tier: 'pro' as const,
      task_complexity: (agent.processing_type === 'analysis' ? 'high' : 'medium') as 'high' | 'medium' | 'low',
      time_of_day: new Date().getHours()
    };
    
    // Select optimal prompt variant
    const variant = await router.selectVariant(moduleName, signals);
    
    // Execute with selected variant
    return this.executeLLM(variant.text, prompt, agent);
  }

  /**
   * Execute standard agent without GEPA routing
   */
  private async executeStandardAgent(
    agent: SubAgent,
    prompt: string
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    return this.executeLLM(agent.prompt, prompt, agent);
  }

  /**
   * Execute LLM call (simulated for demo)
   */
  private async executeLLM(
    systemPrompt: string,
    userPrompt: string,
    agent: SubAgent
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    // Simulate processing time based on agent priority and type
    const baseTime = agent.priority === 'high' ? 800 : agent.priority === 'medium' ? 1200 : 1500;
    const processingTime = baseTime + (Math.random() * 400 - 200);
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate output based on expected format and agent type
    let output: any;
    switch (agent.expected_output_format) {
      case 'json':
        output = this.generateJSONOutput(agent);
        break;
      case 'structured':
        output = this.generateStructuredOutput(agent);
        break;
      case 'list':
        output = this.generateListOutput(agent);
        break;
      default:
        output = this.generateTextOutput(agent);
    }
    
    // Simulate token usage and cost
    const tokens_used = Math.floor(Math.random() * 300) + 150;
    const cost = tokens_used * 0.00002;
    
    return { output, tokens_used, cost };
  }

  /**
   * Generate JSON output for agent
   */
  private generateJSONOutput(agent: SubAgent): any {
    const baseOutput = {
      agent_id: agent.id,
      processing_type: agent.processing_type,
      timestamp: new Date().toISOString(),
      success: true
    };

    switch (agent.processing_type) {
      case 'analysis':
        return {
          ...baseOutput,
          analysis_results: {
            sentiment_score: Math.random() * 2 - 1, // -1 to 1
            confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
            key_insights: [`Key insight from ${agent.role}`],
            recommendations: [`Recommendation from ${agent.role}`]
          }
        };
      case 'extraction':
        return {
          ...baseOutput,
          extracted_data: {
            items_found: Math.floor(Math.random() * 10) + 1,
            data_points: [`Data point from ${agent.role}`],
            metadata: { source: agent.role, confidence: Math.random() * 0.3 + 0.7 }
          }
        };
      case 'generation':
        return {
          ...baseOutput,
          generated_content: {
            variations: [`Generated option 1 from ${agent.role}`, `Generated option 2 from ${agent.role}`],
            quality_score: Math.random() * 0.3 + 0.7,
            creativity_score: Math.random() * 0.4 + 0.6
          }
        };
      default:
        return baseOutput;
    }
  }

  /**
   * Generate structured output for agent
   */
  private generateStructuredOutput(agent: SubAgent): string {
    return `${agent.role} Analysis:

Key Findings:
- Finding 1: Detailed analysis result from ${agent.role}
- Finding 2: Another insight from ${agent.role}
- Finding 3: Additional analysis from ${agent.role}

Recommendations:
1. Primary recommendation based on ${agent.processing_type} analysis
2. Secondary recommendation for optimization
3. Long-term strategic recommendation

Summary:
Comprehensive analysis completed by ${agent.role} with focus on ${agent.processing_type} processing.`;
  }

  /**
   * Generate list output for agent
   */
  private generateListOutput(agent: SubAgent): string[] {
    return [
      `Item 1 from ${agent.role}`,
      `Item 2 from ${agent.role}`,
      `Item 3 from ${agent.role}`,
      `Item 4 from ${agent.role}`,
      `Item 5 from ${agent.role}`
    ];
  }

  /**
   * Generate text output for agent
   */
  private generateTextOutput(agent: SubAgent): string {
    return `Comprehensive ${agent.processing_type} analysis completed by ${agent.role}. This analysis provides detailed insights and recommendations based on the specialized expertise of the ${agent.name}.`;
  }

  /**
   * Calculate parallel efficiency
   */
  private calculateParallelEfficiency(execution: ParallelExecution): number {
    const agentDurations = Array.from(execution.performance_metrics.agent_performance.values())
      .map(perf => perf.duration_ms || 0);
    
    const sequentialTime = agentDurations.reduce((sum, duration) => sum + duration, 0);
    const parallelTime = execution.performance_metrics.total_duration_ms || 0;
    
    return sequentialTime > 0 ? parallelTime / sequentialTime : 1;
  }

  /**
   * Aggregate results from all agents
   */
  private aggregateResults(execution: ParallelExecution): any {
    const results = Array.from(execution.results.entries());
    
    switch (execution.aggregation_strategy) {
      case 'merge':
        return this.mergeResults(results);
      case 'consensus':
        return this.consensusAggregation(results);
      case 'weighted':
        return this.weightedAggregation(results, execution.sub_agents);
      case 'best_of':
        return this.bestOfAggregation(results);
      default:
        return this.mergeResults(results);
    }
  }

  /**
   * Merge all results into a comprehensive output
   */
  private mergeResults(results: Array<[string, any]>): any {
    const merged: any = {
      parallel_analysis: {
        timestamp: new Date().toISOString(),
        total_agents: results.length,
        successful_agents: results.length
      },
      agent_results: {}
    };

    results.forEach(([agentId, result]) => {
      merged.agent_results[agentId] = result;
    });

    return merged;
  }

  /**
   * Find consensus among agent results
   */
  private consensusAggregation(results: Array<[string, any]>): any {
    // Simplified consensus - in practice would be more sophisticated
    return {
      consensus_result: results[0]?.[1] || null,
      agreement_level: results.length > 1 ? 'moderate' : 'single_agent',
      agent_count: results.length
    };
  }

  /**
   * Weighted aggregation based on agent priority and performance
   */
  private weightedAggregation(results: Array<[string, any]>, agents: SubAgent[]): any {
    const weights = agents.reduce((acc, agent) => {
      acc[agent.id] = agent.priority === 'high' ? 0.4 : agent.priority === 'medium' ? 0.3 : 0.2;
      return acc;
    }, {} as Record<string, number>);

    return {
      weighted_result: results.reduce((acc, [agentId, result]) => {
        acc[agentId] = { result, weight: weights[agentId] || 0.1 };
        return acc;
      }, {} as any),
      total_weight: Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    };
  }

  /**
   * Select best result based on quality metrics
   */
  private bestOfAggregation(results: Array<[string, any]>): any {
    // Simplified best-of selection
    const bestResult = results[0]; // In practice would evaluate quality metrics
    
    return {
      best_result: bestResult?.[1] || null,
      selected_agent: bestResult?.[0] || null,
      alternatives: results.slice(1)
    };
  }

  /**
   * Map agent role to GEPA module
   */
  private mapRoleToModule(role: string): string {
    if (role.toLowerCase().includes('financial') || role.toLowerCase().includes('analyst')) {
      return 'financial_analyst';
    }
    if (role.toLowerCase().includes('risk')) {
      return 'risk_assessor';
    }
    if (role.toLowerCase().includes('market') || role.toLowerCase().includes('research')) {
      return 'market_research';
    }
    return 'financial_analyst'; // Default
  }

  /**
   * Build parallel result
   */
  private buildParallelResult(execution: ParallelExecution, aggregatedOutput: any): ParallelResult {
    const successfulAgents = Array.from(execution.performance_metrics.agent_performance.values())
      .filter(perf => perf.success).length;
    
    const failedAgents = execution.sub_agents.length - successfulAgents;
    
    const insights = this.generateInsights(execution);

    return {
      success: successfulAgents > 0,
      aggregated_output: aggregatedOutput,
      individual_results: execution.results,
      execution_metadata: execution.performance_metrics,
      parallel_visualization: this.buildVisualization(execution),
      insights
    };
  }

  /**
   * Build execution visualization
   */
  private buildVisualization(execution: ParallelExecution) {
    return {
      total_agents: execution.sub_agents.length,
      successful_agents: Array.from(execution.performance_metrics.agent_performance.values())
        .filter(perf => perf.success).length,
      failed_agents: Array.from(execution.performance_metrics.agent_performance.values())
        .filter(perf => !perf.success).length,
      execution_timeline: execution.sub_agents.map(agent => {
        const perf = execution.performance_metrics.agent_performance.get(agent.id)!;
        return {
          agent_id: agent.id,
          status: (perf.success ? 'completed' : 'failed') as 'completed' | 'timeout' | 'failed',
          duration_ms: perf.duration_ms || 0,
          output_preview: execution.results.get(agent.id) ? 
            String(execution.results.get(agent.id)).substring(0, 100) + '...' : 'Failed'
        };
      })
    };
  }

  /**
   * Generate insights about parallel execution
   */
  private generateInsights(execution: ParallelExecution) {
    const agentDurations = Array.from(execution.performance_metrics.agent_performance.values())
      .map(perf => perf.duration_ms || 0);
    
    const sequentialTime = agentDurations.reduce((sum, duration) => sum + duration, 0);
    const parallelTime = execution.performance_metrics.total_duration_ms || 0;
    const parallelizationBenefit = Math.max(0, (sequentialTime - parallelTime) / sequentialTime);
    
    const efficiencyScore = 1 - execution.performance_metrics.parallel_efficiency;
    
    const bottleneckAgent = agentDurations.length > 0 ? 
      execution.sub_agents[agentDurations.indexOf(Math.max(...agentDurations))]?.id : undefined;
    
    const recommendations: string[] = [];
    if (efficiencyScore < 0.5) {
      recommendations.push('Consider optimizing agent execution times');
    }
    if (bottleneckAgent) {
      recommendations.push(`Optimize ${bottleneckAgent} - it's the slowest agent`);
    }
    if (parallelizationBenefit < 0.3) {
      recommendations.push('Parallel execution benefits are limited - consider sequential processing');
    }
    
    return {
      parallelization_benefit: Math.round(parallelizationBenefit * 100),
      efficiency_score: Math.round(efficiencyScore * 100) / 100,
      bottleneck_agent: bottleneckAgent,
      recommendations
    };
  }

  /**
   * Get available configurations
   */
  getAvailableConfigurations(): string[] {
    return Array.from(this.predefinedConfigurations.keys());
  }

  /**
   * Get configuration details
   */
  getConfigurationDetails(configId: string): SubAgent[] | null {
    return this.predefinedConfigurations.get(configId) || null;
  }

  /**
   * Create custom configuration
   */
  createCustomConfiguration(configId: string, agents: SubAgent[]): void {
    this.predefinedConfigurations.set(configId, agents);
    console.log(`✅ Created custom parallel configuration: ${configId} with ${agents.length} agents`);
  }
}

// Singleton instance
let parallelEngine: ParallelAgentEngine | null = null;

export function getParallelAgentEngine(): ParallelAgentEngine {
  if (!parallelEngine) {
    parallelEngine = new ParallelAgentEngine();
  }
  return parallelEngine;
}
