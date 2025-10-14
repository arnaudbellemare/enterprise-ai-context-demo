/**
 * LangChain-Style Parallel Execution Pattern
 * 
 * Implements async concurrency (not true parallelism due to single-threaded nature):
 * - Multiple independent LLM chains execute simultaneously
 * - RunnableParallel bundles chains for concurrent execution
 * - Final synthesis step combines all parallel results
 * - Event loop switches between tasks when idle (network requests)
 */

export interface LangChainTask {
  id: string;
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  output_format: 'string' | 'json' | 'structured';
  priority: number;
}

export interface ParallelChainConfig {
  config_id: string;
  name: string;
  description: string;
  parallel_tasks: LangChainTask[];
  synthesis_prompt: string;
  model_config: {
    model_name: string;
    temperature: number;
    max_tokens?: number;
  };
}

export interface ParallelExecution {
  execution_id: string;
  input: string;
  config: ParallelChainConfig;
  parallel_results: Map<string, any>;
  synthesis_result: any;
  execution_metadata: {
    start_time: number;
    end_time?: number;
    total_duration_ms?: number;
    parallel_duration_ms?: number;
    synthesis_duration_ms?: number;
    concurrency_efficiency: number; // Actual vs theoretical speedup
    task_performance: Map<string, {
      start_time: number;
      end_time?: number;
      duration_ms?: number;
      success: boolean;
      tokens_used: number;
      cost: number;
    }>;
  };
}

export interface ParallelResult {
  success: boolean;
  input_topic: string;
  parallel_outputs: Map<string, any>;
  synthesis_output: any;
  execution_metadata: ParallelExecution['execution_metadata'];
  concurrency_insights: {
    tasks_completed: number;
    total_tasks: number;
    concurrency_benefit: number; // Time saved vs sequential
    bottleneck_task?: string;
    efficiency_score: number; // 0-1
    recommendations: string[];
  };
}

/**
 * LangChain-Style Parallel Execution Engine
 * Implements async concurrency with RunnableParallel pattern
 */
export class LangChainParallelEngine {
  private predefinedConfigurations: Map<string, ParallelChainConfig> = new Map();
  private activeExecutions: Map<string, ParallelExecution> = new Map();

  constructor() {
    this.initializePredefinedConfigurations();
  }

  /**
   * Initialize LangChain-style parallel configurations
   */
  private initializePredefinedConfigurations(): void {
    // Topic Analysis Configuration (similar to the example)
    this.predefinedConfigurations.set('topic_analysis', {
      config_id: 'topic_analysis',
      name: 'Comprehensive Topic Analysis',
      description: 'Parallel execution of summary, questions, and key terms extraction',
      parallel_tasks: [
        {
          id: 'summarize',
          name: 'Topic Summarization',
          system_prompt: 'You are a concise summarization specialist. Create clear, informative summaries.',
          user_prompt_template: 'Summarize the following topic concisely in 2-3 sentences: {topic}',
          output_format: 'string',
          priority: 1
        },
        {
          id: 'questions',
          name: 'Question Generation',
          system_prompt: 'You are a question generation specialist. Create engaging, thought-provoking questions.',
          user_prompt_template: 'Generate 3 interesting questions related to this topic: {topic}',
          output_format: 'structured',
          priority: 2
        },
        {
          id: 'key_terms',
          name: 'Key Terms Extraction',
          system_prompt: 'You are a key terms extraction specialist. Identify the most important terms and concepts.',
          user_prompt_template: 'Identify 5-10 key terms from this topic (comma-separated): {topic}',
          output_format: 'string',
          priority: 3
        }
      ],
      synthesis_prompt: `You are a comprehensive analysis specialist. Based on the parallel analysis results, create a comprehensive overview.

Topic: {topic}

Summary: {summary}
Questions: {questions}
Key Terms: {key_terms}

Create a comprehensive analysis that includes:
1. Executive Summary
2. Key Questions to Explore
3. Important Terms and Concepts
4. Recommended Next Steps

Format as a structured, professional analysis.`,
      model_config: {
        model_name: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1000
      }
    });

    // Market Research Configuration
    this.predefinedConfigurations.set('market_research', {
      config_id: 'market_research',
      name: 'Parallel Market Research',
      description: 'Concurrent market analysis, competitor research, and trend identification',
      parallel_tasks: [
        {
          id: 'market_analysis',
          name: 'Market Analysis',
          system_prompt: 'You are a market analysis specialist. Analyze market size, trends, and opportunities.',
          user_prompt_template: 'Analyze the market for: {topic}. Focus on size, growth, trends, and opportunities.',
          output_format: 'structured',
          priority: 1
        },
        {
          id: 'competitor_analysis',
          name: 'Competitor Analysis',
          system_prompt: 'You are a competitive intelligence specialist. Identify key competitors and market positioning.',
          user_prompt_template: 'Identify and analyze competitors for: {topic}. Focus on market leaders and positioning.',
          output_format: 'structured',
          priority: 2
        },
        {
          id: 'trend_analysis',
          name: 'Trend Analysis',
          system_prompt: 'You are a trend analysis specialist. Identify emerging trends and future directions.',
          user_prompt_template: 'Identify current and emerging trends for: {topic}. Focus on future implications.',
          output_format: 'structured',
          priority: 3
        },
        {
          id: 'risk_assessment',
          name: 'Risk Assessment',
          system_prompt: 'You are a risk assessment specialist. Identify potential risks and challenges.',
          user_prompt_template: 'Assess potential risks and challenges for: {topic}. Focus on market and operational risks.',
          output_format: 'structured',
          priority: 4
        }
      ],
      synthesis_prompt: `You are a strategic market research specialist. Synthesize the parallel research into a comprehensive market report.

Market Topic: {topic}

Market Analysis: {market_analysis}
Competitor Analysis: {competitor_analysis}
Trend Analysis: {trend_analysis}
Risk Assessment: {risk_assessment}

Create a comprehensive market research report with:
1. Executive Summary
2. Market Overview and Opportunities
3. Competitive Landscape
4. Key Trends and Future Outlook
5. Risk Assessment and Mitigation
6. Strategic Recommendations

Format as a professional market research report.`,
      model_config: {
        model_name: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 1500
      }
    });

    // Content Creation Configuration
    this.predefinedConfigurations.set('content_creation', {
      config_id: 'content_creation',
      name: 'Parallel Content Creation',
      description: 'Concurrent content ideation, structure planning, and audience analysis',
      parallel_tasks: [
        {
          id: 'ideation',
          name: 'Content Ideation',
          system_prompt: 'You are a content ideation specialist. Generate creative and engaging content ideas.',
          user_prompt_template: 'Generate 5 creative content ideas for: {topic}. Focus on different angles and formats.',
          output_format: 'structured',
          priority: 1
        },
        {
          id: 'structure',
          name: 'Content Structure',
          system_prompt: 'You are a content structure specialist. Create logical content organization and flow.',
          user_prompt_template: 'Create a detailed content structure and outline for: {topic}. Include sections and flow.',
          output_format: 'structured',
          priority: 2
        },
        {
          id: 'audience',
          name: 'Audience Analysis',
          system_prompt: 'You are an audience analysis specialist. Identify target audience and engagement strategies.',
          user_prompt_template: 'Analyze the target audience for content about: {topic}. Include demographics and engagement strategies.',
          output_format: 'structured',
          priority: 3
        },
        {
          id: 'seo_keywords',
          name: 'SEO Keywords',
          system_prompt: 'You are an SEO specialist. Identify relevant keywords and search terms.',
          user_prompt_template: 'Identify SEO keywords and search terms for content about: {topic}. Include primary and secondary keywords.',
          output_format: 'structured',
          priority: 4
        }
      ],
      synthesis_prompt: `You are a content strategy specialist. Synthesize the parallel content analysis into a comprehensive content plan.

Content Topic: {topic}

Ideation: {ideation}
Structure: {structure}
Audience Analysis: {audience}
SEO Keywords: {seo_keywords}

Create a comprehensive content strategy with:
1. Content Overview and Objectives
2. Target Audience and Personas
3. Content Ideas and Formats
4. Content Structure and Organization
5. SEO Strategy and Keywords
6. Distribution and Promotion Plan

Format as a professional content strategy document.`,
      model_config: {
        model_name: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 1200
      }
    });

    // Financial Analysis Configuration
    this.predefinedConfigurations.set('financial_analysis', {
      config_id: 'financial_analysis',
      name: 'Parallel Financial Analysis',
      description: 'Concurrent financial modeling, risk assessment, and investment analysis',
      parallel_tasks: [
        {
          id: 'financial_modeling',
          name: 'Financial Modeling',
          system_prompt: 'You are a financial modeling specialist. Create comprehensive financial models and projections.',
          user_prompt_template: 'Create a financial model and projections for: {topic}. Include revenue, costs, and growth assumptions.',
          output_format: 'structured',
          priority: 1
        },
        {
          id: 'risk_analysis',
          name: 'Risk Analysis',
          system_prompt: 'You are a risk analysis specialist. Identify and assess financial and operational risks.',
          user_prompt_template: 'Analyze financial and operational risks for: {topic}. Include risk mitigation strategies.',
          output_format: 'structured',
          priority: 2
        },
        {
          id: 'investment_thesis',
          name: 'Investment Thesis',
          system_prompt: 'You are an investment analyst. Develop investment thesis and recommendations.',
          user_prompt_template: 'Develop an investment thesis for: {topic}. Include buy/hold/sell recommendation with rationale.',
          output_format: 'structured',
          priority: 3
        },
        {
          id: 'valuation',
          name: 'Valuation Analysis',
          system_prompt: 'You are a valuation specialist. Perform comprehensive valuation analysis.',
          user_prompt_template: 'Perform valuation analysis for: {topic}. Include multiple valuation methods and price targets.',
          output_format: 'structured',
          priority: 4
        }
      ],
      synthesis_prompt: `You are a senior financial analyst. Synthesize the parallel financial analysis into a comprehensive investment report.

Investment Topic: {topic}

Financial Model: {financial_modeling}
Risk Analysis: {risk_analysis}
Investment Thesis: {investment_thesis}
Valuation: {valuation}

Create a comprehensive investment analysis with:
1. Executive Summary and Recommendation
2. Financial Model and Projections
3. Risk Assessment and Mitigation
4. Investment Thesis and Rationale
5. Valuation Analysis and Price Targets
6. Key Assumptions and Sensitivity Analysis

Format as a professional investment research report.`,
      model_config: {
        model_name: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 1500
      }
    });
  }

  /**
   * Execute LangChain-style parallel processing
   */
  async executeParallel(
    configId: string,
    topic: string,
    options: {
      useGEPARouting?: boolean;
      customConfig?: ParallelChainConfig;
    } = {}
  ): Promise<ParallelResult> {
    console.log(`🔄 Starting LangChain-style parallel execution: ${configId}`);
    console.log(`Topic: ${topic}`);

    const config = options.customConfig || this.predefinedConfigurations.get(configId);
    if (!config) {
      throw new Error(`Configuration not found: ${configId}`);
    }

    // Initialize execution state
    const execution: ParallelExecution = {
      execution_id: `langchain_exec_${Date.now()}`,
      input: topic,
      config,
      parallel_results: new Map(),
      synthesis_result: null,
      execution_metadata: {
        start_time: Date.now(),
        concurrency_efficiency: 0,
        task_performance: new Map()
      }
    };

    this.activeExecutions.set(execution.execution_id, execution);

    try {
      // Execute parallel tasks concurrently (async, not true parallelism)
      console.log(`🚀 Executing ${config.parallel_tasks.length} parallel tasks concurrently`);
      const parallelStartTime = Date.now();

      const parallelPromises = config.parallel_tasks.map(task => 
        this.executeParallelTask(task, topic, execution, options)
      );

      // Wait for all parallel tasks to complete
      const parallelResults = await Promise.allSettled(parallelPromises);

      const parallelEndTime = Date.now();
      execution.execution_metadata.parallel_duration_ms = parallelEndTime - parallelStartTime;

      // Process parallel results
      parallelResults.forEach((result, index) => {
        const task = config.parallel_tasks[index];
        if (result.status === 'fulfilled') {
          execution.parallel_results.set(task.id, result.value.output);
        } else {
          console.error(`❌ Parallel task ${task.name} failed:`, result.reason);
          execution.parallel_results.set(task.id, `Error: ${result.reason}`);
        }
      });

      // Execute synthesis step
      console.log(`🔗 Executing synthesis step`);
      const synthesisStartTime = Date.now();

      const synthesisResult = await this.executeSynthesis(config, execution, options);
      execution.synthesis_result = synthesisResult;

      const synthesisEndTime = Date.now();
      execution.execution_metadata.synthesis_duration_ms = synthesisEndTime - synthesisStartTime;

      // Complete execution
      execution.execution_metadata.end_time = Date.now();
      execution.execution_metadata.total_duration_ms = 
        execution.execution_metadata.end_time - execution.execution_metadata.start_time;

      // Calculate concurrency efficiency
      execution.execution_metadata.concurrency_efficiency = this.calculateConcurrencyEfficiency(execution);

      const result = this.buildParallelResult(execution);
      console.log(`✅ LangChain-style parallel execution completed: ${configId}`);

      return result;

    } catch (error) {
      console.error(`💥 Parallel execution failed: ${configId}`, error);
      execution.execution_metadata.end_time = Date.now();
      
      return {
        success: false,
        input_topic: topic,
        parallel_outputs: execution.parallel_results,
        synthesis_output: execution.synthesis_result,
        execution_metadata: execution.execution_metadata,
        concurrency_insights: {
          tasks_completed: 0,
          total_tasks: config.parallel_tasks.length,
          concurrency_benefit: 0,
          efficiency_score: 0,
          recommendations: ['Execution failed - check configuration and input']
        }
      };
    }
  }

  /**
   * Execute a single parallel task (simulating LangChain chain)
   */
  private async executeParallelTask(
    task: LangChainTask,
    topic: string,
    execution: ParallelExecution,
    options: any
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    const startTime = Date.now();
    
    // Initialize task performance tracking
    execution.execution_metadata.task_performance.set(task.id, {
      start_time: startTime,
      tokens_used: 0,
      cost: 0,
      success: false
    });

    try {
      console.log(`📝 Executing parallel task: ${task.name}`);

      // Build user prompt with topic
      const userPrompt = task.user_prompt_template.replace('{topic}', topic);

      // Execute with GEPA routing if enabled
      let result;
      if (options.useGEPARouting) {
        result = await this.executeWithGEPARouting(task, userPrompt);
      } else {
        result = await this.executeStandardTask(task, userPrompt);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update performance metrics
      const taskPerf = execution.execution_metadata.task_performance.get(task.id)!;
      taskPerf.end_time = endTime;
      taskPerf.duration_ms = duration;
      taskPerf.success = true;
      taskPerf.tokens_used = result.tokens_used;
      taskPerf.cost = result.cost;

      console.log(`✅ Parallel task ${task.name} completed in ${duration}ms`);

      return result;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update performance metrics for failed task
      const taskPerf = execution.execution_metadata.task_performance.get(task.id)!;
      taskPerf.end_time = endTime;
      taskPerf.duration_ms = duration;
      taskPerf.success = false;

      console.error(`❌ Parallel task ${task.name} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Execute synthesis step (final LLM call)
   */
  private async executeSynthesis(
    config: ParallelChainConfig,
    execution: ParallelExecution,
    options: any
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    try {
      // Build synthesis prompt with all parallel results
      let synthesisPrompt = config.synthesis_prompt
        .replace('{topic}', execution.input);

      // Replace placeholders with actual results
      for (const [taskId, result] of execution.parallel_results.entries()) {
        const placeholder = `{${taskId}}`;
        if (synthesisPrompt.includes(placeholder)) {
          synthesisPrompt = synthesisPrompt.replace(placeholder, String(result));
        }
      }

      // Execute synthesis with GEPA routing if enabled
      if (options.useGEPARouting) {
        const { getGEPARouter } = await import('./gepa-runtime-router');
        const router = getGEPARouter();
        
        const signals = {
          current_load: 0.2,
          budget_remaining: 100,
          latency_requirement: 5000,
          risk_tolerance: 0.3,
          user_tier: 'pro' as const,
          task_complexity: 'high' as const,
          time_of_day: new Date().getHours()
        };
        
        const variant = await router.selectVariant('financial_analyst', signals);
        return this.executeLLM(variant.text, synthesisPrompt, config.model_config);
      } else {
        return this.executeLLM('You are a comprehensive analysis specialist.', synthesisPrompt, config.model_config);
      }

    } catch (error) {
      console.error('❌ Synthesis step failed:', error);
      throw error;
    }
  }

  /**
   * Execute with GEPA routing for optimal prompt variant selection
   */
  private async executeWithGEPARouting(
    task: LangChainTask,
    userPrompt: string
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    // Import GEPA router
    const { getGEPARouter } = await import('./gepa-runtime-router');
    const router = getGEPARouter();
    
    // Map task to GEPA module
    const moduleName = this.mapTaskToModule(task);
    
    // Create routing signals
    const signals = {
      current_load: 0.3,
      budget_remaining: 100,
      latency_requirement: 3000,
      risk_tolerance: 0.4,
      user_tier: 'pro' as const,
      task_complexity: 'medium' as const,
      time_of_day: new Date().getHours()
    };
    
    // Select optimal prompt variant
    const variant = await router.selectVariant(moduleName, signals);
    
    // Execute with selected variant
    return this.executeLLM(variant.text, userPrompt, { model_name: 'gpt-4o-mini', temperature: 0.3 });
  }

  /**
   * Execute standard task without GEPA routing
   */
  private async executeStandardTask(
    task: LangChainTask,
    userPrompt: string
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    return this.executeLLM(task.system_prompt, userPrompt, { model_name: 'gpt-4o-mini', temperature: 0.3 });
  }

  /**
   * Execute LLM call (simulated for demo)
   */
  private async executeLLM(
    systemPrompt: string,
    userPrompt: string,
    modelConfig: any
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    // Simulate async LLM call (network request simulation)
    // This is where the event loop would switch to other tasks
    const processingTime = 800 + (Math.random() * 400 - 200); // 600-1000ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate output based on task type
    const output = this.generateTaskOutput(systemPrompt, userPrompt);
    
    // Simulate token usage and cost
    const tokens_used = Math.floor(Math.random() * 400) + 200;
    const cost = tokens_used * 0.000015; // $0.015 per 1k tokens for gpt-4o-mini
    
    return { output, tokens_used, cost };
  }

  /**
   * Generate task output based on system prompt and user prompt
   */
  private generateTaskOutput(systemPrompt: string, userPrompt: string): any {
    const promptLower = userPrompt.toLowerCase();
    
    if (promptLower.includes('summarize')) {
      return `Comprehensive summary: This topic covers important concepts and provides valuable insights. The analysis reveals key trends and significant developments that are relevant to current understanding.`;
    }
    
    if (promptLower.includes('question')) {
      return `1. What are the key factors influencing this topic?
2. How has this topic evolved over time?
3. What are the future implications and trends?`;
    }
    
    if (promptLower.includes('key terms') || promptLower.includes('terms')) {
      return `key concepts, important factors, significant trends, major developments, core principles, essential elements, critical aspects, fundamental ideas, primary components, central themes`;
    }
    
    if (promptLower.includes('market') || promptLower.includes('competitor')) {
      return `Market Analysis: The market shows strong growth potential with emerging opportunities. Key competitors include established players and innovative newcomers. Market size is expanding with increasing demand.`;
    }
    
    if (promptLower.includes('financial') || promptLower.includes('investment')) {
      return `Financial Analysis: Strong fundamentals with positive growth trajectory. Revenue projections show consistent growth. Risk assessment indicates moderate risk with good return potential.`;
    }
    
    if (promptLower.includes('content') || promptLower.includes('idea')) {
      return `Content Strategy: Multiple engaging angles identified. Target audience shows high engagement potential. SEO opportunities include relevant keywords and trending topics.`;
    }
    
    // Default structured output
    return `Analysis Result: Comprehensive analysis completed with detailed insights and recommendations. The evaluation covers all key aspects and provides actionable conclusions.`;
  }

  /**
   * Calculate concurrency efficiency (async vs sequential)
   */
  private calculateConcurrencyEfficiency(execution: ParallelExecution): number {
    const taskDurations = Array.from(execution.execution_metadata.task_performance.values())
      .map(perf => perf.duration_ms || 0);
    
    const sequentialTime = taskDurations.reduce((sum, duration) => sum + duration, 0);
    const parallelTime = execution.execution_metadata.parallel_duration_ms || 0;
    
    return parallelTime > 0 ? sequentialTime / parallelTime : 1;
  }

  /**
   * Map task to GEPA module
   */
  private mapTaskToModule(task: LangChainTask): string {
    const taskName = task.name.toLowerCase();
    
    if (taskName.includes('financial') || taskName.includes('investment')) {
      return 'financial_analyst';
    }
    if (taskName.includes('risk')) {
      return 'risk_assessor';
    }
    if (taskName.includes('market') || taskName.includes('research')) {
      return 'market_research';
    }
    return 'financial_analyst'; // Default
  }

  /**
   * Build parallel result
   */
  private buildParallelResult(execution: ParallelExecution): ParallelResult {
    const successfulTasks = Array.from(execution.execution_metadata.task_performance.values())
      .filter(perf => perf.success).length;
    
    const totalTasks = execution.config.parallel_tasks.length;
    
    const concurrencyInsights = this.generateConcurrencyInsights(execution);

    return {
      success: successfulTasks > 0,
      input_topic: execution.input,
      parallel_outputs: execution.parallel_results,
      synthesis_output: execution.synthesis_result,
      execution_metadata: execution.execution_metadata,
      concurrency_insights: concurrencyInsights
    };
  }

  /**
   * Generate concurrency insights
   */
  private generateConcurrencyInsights(execution: ParallelExecution) {
    const taskDurations = Array.from(execution.execution_metadata.task_performance.values())
      .map(perf => perf.duration_ms || 0);
    
    const sequentialTime = taskDurations.reduce((sum, duration) => sum + duration, 0);
    const parallelTime = execution.execution_metadata.parallel_duration_ms || 0;
    const concurrencyBenefit = Math.max(0, (sequentialTime - parallelTime) / sequentialTime);
    
    const efficiencyScore = 1 - (execution.execution_metadata.concurrency_efficiency || 1);
    
    const bottleneckTask = taskDurations.length > 0 ? 
      execution.config.parallel_tasks[taskDurations.indexOf(Math.max(...taskDurations))]?.name : undefined;
    
    const recommendations: string[] = [];
    if (efficiencyScore < 0.3) {
      recommendations.push('Consider optimizing task execution times');
    }
    if (bottleneckTask) {
      recommendations.push(`Optimize ${bottleneckTask} - it's the slowest task`);
    }
    if (concurrencyBenefit < 0.2) {
      recommendations.push('Limited concurrency benefits - consider task dependencies');
    }
    
    return {
      tasks_completed: Array.from(execution.execution_metadata.task_performance.values())
        .filter(perf => perf.success).length,
      total_tasks: execution.config.parallel_tasks.length,
      concurrency_benefit: Math.round(concurrencyBenefit * 100),
      bottleneck_task: bottleneckTask,
      efficiency_score: Math.round(efficiencyScore * 100) / 100,
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
  getConfigurationDetails(configId: string): ParallelChainConfig | null {
    return this.predefinedConfigurations.get(configId) || null;
  }

  /**
   * Create custom configuration
   */
  createCustomConfiguration(config: ParallelChainConfig): void {
    this.predefinedConfigurations.set(config.config_id, config);
    console.log(`✅ Created custom LangChain configuration: ${config.config_id}`);
  }
}

// Singleton instance
let langchainEngine: LangChainParallelEngine | null = null;

export function getLangChainParallelEngine(): LangChainParallelEngine {
  if (!langchainEngine) {
    langchainEngine = new LangChainParallelEngine();
  }
  return langchainEngine;
}
