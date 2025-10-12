/**
 * Prompt Chaining Pattern Implementation
 * 
 * Implements the Prompt Chaining (Pipeline) pattern for complex multi-step tasks:
 * - Sequential decomposition of complex problems
 * - Output of one prompt serves as input for the next
 * - Modular, debuggable, and reliable processing
 * - Integration with external tools and APIs
 * - State management across chain steps
 */

export interface ChainStep {
  id: string;
  name: string;
  prompt: string;
  role: string; // "Market Analyst", "Data Processor", "Report Writer", etc.
  expected_output_format: 'text' | 'json' | 'structured' | 'tool_response';
  validation_rules?: string[];
  external_tools?: string[];
  retry_policy?: {
    max_attempts: number;
    backoff_strategy: 'linear' | 'exponential';
  };
}

export interface ChainExecution {
  chain_id: string;
  steps: ChainStep[];
  current_step: number;
  state: Record<string, any>;
  outputs: Record<string, any>;
  errors: Record<string, string>;
  execution_metadata: {
    started_at: string;
    completed_at?: string;
    total_tokens_used: number;
    total_cost: number;
    performance_metrics: {
      avg_step_latency_ms: number;
      success_rate: number;
      error_rate: number;
    };
  };
}

export interface ChainResult {
  success: boolean;
  final_output: any;
  step_outputs: Record<string, any>;
  execution_metadata: ChainExecution['execution_metadata'];
  chain_visualization: {
    steps_completed: number;
    total_steps: number;
    execution_flow: Array<{
      step_id: string;
      status: 'completed' | 'failed' | 'skipped';
      duration_ms: number;
      output_preview: string;
    }>;
  };
}

/**
 * Prompt Chaining Engine
 * Manages sequential execution of prompt chains with state management
 */
export class PromptChainingEngine {
  private chains: Map<string, ChainStep[]> = new Map();
  private executions: Map<string, ChainExecution> = new Map();

  constructor() {
    this.initializePredefinedChains();
  }

  /**
   * Initialize common prompt chains for different use cases
   */
  private initializePredefinedChains(): void {
    // Market Research Analysis Chain
    this.chains.set('market_research', [
      {
        id: 'extract_content',
        name: 'Content Extraction',
        prompt: `You are a Content Extraction Specialist. Extract and clean the key information from the following market research document:

{input_document}

Focus on:
- Key findings and statistics
- Market trends and insights
- Competitive landscape information
- Financial data and metrics

Output format: Structured text with clear sections.`,
        role: 'Content Extraction Specialist',
        expected_output_format: 'structured',
        validation_rules: ['Must contain at least 3 key findings', 'Must include statistical data']
      },
      {
        id: 'summarize_findings',
        name: 'Findings Summary',
        prompt: `You are a Market Research Analyst. Summarize the key findings from the extracted content:

{extracted_content}

Create a concise summary focusing on:
1. Top 3 market insights
2. Key statistical findings
3. Competitive intelligence highlights

Output format: Structured summary with numbered insights.`,
        role: 'Market Research Analyst',
        expected_output_format: 'structured',
        validation_rules: ['Must have exactly 3 insights', 'Must include statistics']
      },
      {
        id: 'identify_trends',
        name: 'Trend Identification',
        prompt: `You are a Trend Analyst. Based on the summary, identify emerging trends and extract supporting data points:

{summary}

For each trend:
- Trend name and description
- Supporting data points
- Market implications
- Confidence level (High/Medium/Low)

Output format: JSON with trends array.`,
        role: 'Trend Analyst',
        expected_output_format: 'json',
        validation_rules: ['Must have trends array', 'Each trend must have supporting data']
      },
      {
        id: 'generate_report',
        name: 'Report Generation',
        prompt: `You are a Business Report Writer. Create a comprehensive market research report using the trends and findings:

{trends_data}

Structure the report with:
1. Executive Summary
2. Key Findings
3. Market Trends Analysis
4. Recommendations
5. Risk Assessment

Output format: Professional business report.`,
        role: 'Business Report Writer',
        expected_output_format: 'text',
        validation_rules: ['Must include all 5 sections', 'Professional tone required']
      }
    ]);

    // Financial Analysis Chain
    this.chains.set('financial_analysis', [
      {
        id: 'extract_financial_data',
        name: 'Data Extraction',
        prompt: `You are a Financial Data Specialist. Extract and normalize financial data from:

{financial_document}

Extract:
- Revenue figures
- Cost structures
- Key ratios
- Growth metrics
- Risk indicators

Output format: Structured financial data.`,
        role: 'Financial Data Specialist',
        expected_output_format: 'structured'
      },
      {
        id: 'calculate_metrics',
        name: 'Metrics Calculation',
        prompt: `You are a Financial Analyst. Calculate key financial metrics from the extracted data:

{financial_data}

Calculate:
- Profitability ratios
- Liquidity ratios
- Efficiency ratios
- Growth rates
- Risk metrics

Use external calculator tool for precise calculations.

Output format: JSON with calculated metrics.`,
        role: 'Financial Analyst',
        expected_output_format: 'json',
        external_tools: ['calculator']
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        prompt: `You are a Risk Management Analyst. Assess financial risks based on the calculated metrics:

{calculated_metrics}

Evaluate:
- Credit risk indicators
- Market risk factors
- Operational risk exposure
- Liquidity risk assessment
- Overall risk score (1-10)

Output format: Structured risk assessment.`,
        role: 'Risk Management Analyst',
        expected_output_format: 'structured'
      },
      {
        id: 'investment_recommendation',
        name: 'Investment Analysis',
        prompt: `You are an Investment Advisor. Provide investment recommendations based on the financial analysis:

{risk_assessment}
{calculated_metrics}

Provide:
- Investment recommendation (Buy/Hold/Sell)
- Key supporting factors
- Risk considerations
- Price target (if applicable)
- Confidence level

Output format: Professional investment analysis.`,
        role: 'Investment Advisor',
        expected_output_format: 'text'
      }
    ]);

    // Code Generation Chain
    this.chains.set('code_generation', [
      {
        id: 'understand_requirements',
        name: 'Requirements Analysis',
        prompt: `You are a Software Requirements Analyst. Analyze the coding request:

{user_request}

Extract:
- Functional requirements
- Technical specifications
- Input/output requirements
- Performance constraints
- Error handling needs

Output format: Structured requirements.`,
        role: 'Software Requirements Analyst',
        expected_output_format: 'structured'
      },
      {
        id: 'generate_pseudocode',
        name: 'Pseudocode Generation',
        prompt: `You are a Software Architect. Create pseudocode based on the requirements:

{requirements}

Create:
- Algorithm outline
- Data structures
- Control flow
- Key functions
- Error handling logic

Output format: Structured pseudocode.`,
        role: 'Software Architect',
        expected_output_format: 'structured'
      },
      {
        id: 'write_code',
        name: 'Code Implementation',
        prompt: `You are a Senior Software Developer. Implement the code based on the pseudocode:

{pseudocode}

Requirements:
- Follow best practices
- Include proper error handling
- Add meaningful comments
- Use appropriate data structures

Output format: Complete code implementation.`,
        role: 'Senior Software Developer',
        expected_output_format: 'text'
      },
      {
        id: 'code_review',
        name: 'Code Review',
        prompt: `You are a Code Review Expert. Review the implemented code for issues:

{implemented_code}

Check for:
- Logic errors
- Performance issues
- Security vulnerabilities
- Code quality
- Best practices compliance

Output format: Code review report with recommendations.`,
        role: 'Code Review Expert',
        expected_output_format: 'structured',
        retry_policy: {
          max_attempts: 3,
          backoff_strategy: 'exponential'
        }
      },
      {
        id: 'generate_tests',
        name: 'Test Generation',
        prompt: `You are a Test Engineer. Generate comprehensive tests for the reviewed code:

{code_review}
{implemented_code}

Create:
- Unit tests
- Edge case tests
- Integration tests
- Performance tests

Output format: Test suite implementation.`,
        role: 'Test Engineer',
        expected_output_format: 'text'
      }
    ]);
  }

  /**
   * Execute a prompt chain
   */
  async executeChain(
    chainId: string,
    input: any,
    options: {
      useGEPARouting?: boolean;
      enableParallelSteps?: boolean;
      customSteps?: ChainStep[];
    } = {}
  ): Promise<ChainResult> {
    console.log(`🔗 Starting prompt chain execution: ${chainId}`);
    
    const steps = options.customSteps || this.chains.get(chainId);
    if (!steps) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    // Initialize execution state
    const execution: ChainExecution = {
      chain_id: chainId,
      steps,
      current_step: 0,
      state: { input },
      outputs: {},
      errors: {},
      execution_metadata: {
        started_at: new Date().toISOString(),
        total_tokens_used: 0,
        total_cost: 0,
        performance_metrics: {
          avg_step_latency_ms: 0,
          success_rate: 0,
          error_rate: 0
        }
      }
    };

    this.executions.set(chainId, execution);

    try {
      // Execute steps sequentially
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        execution.current_step = i;
        
        console.log(`📝 Executing step ${i + 1}/${steps.length}: ${step.name}`);
        
        const stepResult = await this.executeStep(step, execution, options);
        
        if (stepResult.success) {
          execution.outputs[step.id] = stepResult.output;
          execution.execution_metadata.total_tokens_used += stepResult.tokens_used;
          execution.execution_metadata.total_cost += stepResult.cost;
        } else {
          execution.errors[step.id] = stepResult.error;
          console.error(`❌ Step ${step.name} failed: ${stepResult.error}`);
          
          // Handle retry policy
          if (step.retry_policy && stepResult.attempt < step.retry_policy.max_attempts) {
            console.log(`🔄 Retrying step ${step.name} (attempt ${stepResult.attempt + 1})`);
            i--; // Retry current step
            continue;
          }
          
          // If critical step fails, stop execution
          break;
        }
      }

      // Complete execution
      execution.execution_metadata.completed_at = new Date().toISOString();
      execution.execution_metadata.performance_metrics = this.calculatePerformanceMetrics(execution);

      const result = this.buildChainResult(execution);
      console.log(`✅ Chain execution completed: ${chainId}`);
      
      return result;

    } catch (error) {
      console.error(`💥 Chain execution failed: ${chainId}`, error);
      execution.execution_metadata.completed_at = new Date().toISOString();
      
      return {
        success: false,
        final_output: null,
        step_outputs: execution.outputs,
        execution_metadata: execution.execution_metadata,
        chain_visualization: this.buildVisualization(execution)
      };
    }
  }

  /**
   * Execute a single step in the chain
   */
  private async executeStep(
    step: ChainStep,
    execution: ChainExecution,
    options: any
  ): Promise<{
    success: boolean;
    output?: any;
    error?: string;
    tokens_used: number;
    cost: number;
    attempt: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Build prompt with context from previous steps
      const contextualPrompt = this.buildContextualPrompt(step, execution);
      
      // Execute with GEPA routing if enabled
      let result;
      if (options.useGEPARouting) {
        result = await this.executeWithGEPARouting(step, contextualPrompt, execution);
      } else {
        result = await this.executeStandardPrompt(step, contextualPrompt);
      }
      
      const duration = Date.now() - startTime;
      
      // Validate output
      const validationResult = this.validateStepOutput(step, result.output);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`,
          tokens_used: result.tokens_used,
          cost: result.cost,
          attempt: 1
        };
      }
      
      console.log(`✅ Step ${step.name} completed in ${duration}ms`);
      
      return {
        success: true,
        output: result.output,
        tokens_used: result.tokens_used,
        cost: result.cost,
        attempt: 1
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Step ${step.name} failed after ${duration}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tokens_used: 0,
        cost: 0,
        attempt: 1
      };
    }
  }

  /**
   * Build contextual prompt by injecting previous step outputs
   */
  private buildContextualPrompt(step: ChainStep, execution: ChainExecution): string {
    let prompt = step.prompt;
    
    // Replace placeholders with actual values
    const placeholders = prompt.match(/\{([^}]+)\}/g);
    if (placeholders) {
      for (const placeholder of placeholders) {
        const key = placeholder.slice(1, -1); // Remove { }
        
        if (key === 'input_document' || key === 'financial_document' || key === 'user_request') {
          prompt = prompt.replace(placeholder, JSON.stringify(execution.state.input));
        } else if (execution.outputs[key]) {
          prompt = prompt.replace(placeholder, JSON.stringify(execution.outputs[key]));
        } else {
          // Try to find in previous outputs
          const found = Object.entries(execution.outputs).find(([outputKey, value]) => 
            outputKey.toLowerCase().includes(key.toLowerCase())
          );
          if (found) {
            prompt = prompt.replace(placeholder, JSON.stringify(found[1]));
          }
        }
      }
    }
    
    return prompt;
  }

  /**
   * Execute with GEPA routing for optimal prompt variant selection
   */
  private async executeWithGEPARouting(
    step: ChainStep,
    prompt: string,
    execution: ChainExecution
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    // Import GEPA router
    const { getGEPARouter } = await import('./gepa-runtime-router');
    const router = getGEPARouter();
    
    // Determine module based on step role
    const moduleName = this.mapRoleToModule(step.role);
    
    // Create routing signals based on execution context
    const signals = {
      current_load: 0.5, // Could be dynamic
      budget_remaining: 100, // Could be dynamic
      latency_requirement: 5000,
      risk_tolerance: 0.3,
      user_tier: 'pro' as const,
      task_complexity: step.external_tools ? 'high' : 'medium' as const,
      time_of_day: new Date().getHours()
    };
    
    // Select optimal prompt variant
    const variant = await router.selectVariant(moduleName, signals);
    
    // Execute with selected variant
    return this.executeLLM(variant.text, prompt, step);
  }

  /**
   * Execute standard prompt without GEPA routing
   */
  private async executeStandardPrompt(
    step: ChainStep,
    prompt: string
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    return this.executeLLM(step.prompt, prompt, step);
  }

  /**
   * Execute LLM call (simulated for demo)
   */
  private async executeLLM(
    systemPrompt: string,
    userPrompt: string,
    step: ChainStep
  ): Promise<{ output: any; tokens_used: number; cost: number }> {
    // Simulate LLM execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate output based on expected format
    let output: any;
    switch (step.expected_output_format) {
      case 'json':
        output = {
          success: true,
          data: `Generated ${step.role} output in JSON format`,
          timestamp: new Date().toISOString()
        };
        break;
      case 'structured':
        output = `Generated structured ${step.role} output with clear sections and formatting.`;
        break;
      case 'text':
        output = `Generated comprehensive ${step.role} analysis with detailed insights and recommendations.`;
        break;
      default:
        output = `Generated ${step.role} output.`;
    }
    
    // Simulate token usage and cost
    const tokens_used = Math.floor(Math.random() * 500) + 200;
    const cost = tokens_used * 0.00002; // $0.02 per 1k tokens
    
    return { output, tokens_used, cost };
  }

  /**
   * Validate step output against validation rules
   */
  private validateStepOutput(step: ChainStep, output: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!step.validation_rules) {
      return { valid: true, errors: [] };
    }
    
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
    
    for (const rule of step.validation_rules) {
      if (rule.includes('Must contain') && !outputStr.toLowerCase().includes(rule.toLowerCase())) {
        errors.push(`Missing required content: ${rule}`);
      }
      if (rule.includes('Must have') && !outputStr.toLowerCase().includes(rule.toLowerCase())) {
        errors.push(`Missing required element: ${rule}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Map step role to GEPA module
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
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(execution: ChainExecution) {
    const completedSteps = Object.keys(execution.outputs).length;
    const totalSteps = execution.steps.length;
    const errorSteps = Object.keys(execution.errors).length;
    
    return {
      avg_step_latency_ms: 1000, // Would be calculated from actual timings
      success_rate: completedSteps / totalSteps,
      error_rate: errorSteps / totalSteps
    };
  }

  /**
   * Build chain result
   */
  private buildChainResult(execution: ChainExecution): ChainResult {
    const finalStep = execution.steps[execution.steps.length - 1];
    const finalOutput = execution.outputs[finalStep.id];
    
    return {
      success: Object.keys(execution.errors).length === 0,
      final_output: finalOutput,
      step_outputs: execution.outputs,
      execution_metadata: execution.execution_metadata,
      chain_visualization: this.buildVisualization(execution)
    };
  }

  /**
   * Build execution visualization
   */
  private buildVisualization(execution: ChainExecution) {
    return {
      steps_completed: Object.keys(execution.outputs).length,
      total_steps: execution.steps.length,
      execution_flow: execution.steps.map((step, index) => ({
        step_id: step.id,
        status: execution.outputs[step.id] ? 'completed' : 
                execution.errors[step.id] ? 'failed' : 'skipped',
        duration_ms: 1000, // Would be actual duration
        output_preview: execution.outputs[step.id] ? 
          String(execution.outputs[step.id]).substring(0, 100) + '...' : ''
      }))
    };
  }

  /**
   * Get available chains
   */
  getAvailableChains(): string[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Get chain details
   */
  getChainDetails(chainId: string): ChainStep[] | null {
    return this.chains.get(chainId) || null;
  }

  /**
   * Create custom chain
   */
  createCustomChain(chainId: string, steps: ChainStep[]): void {
    this.chains.set(chainId, steps);
    console.log(`✅ Created custom chain: ${chainId} with ${steps.length} steps`);
  }
}

// Singleton instance
let chainingEngine: PromptChainingEngine | null = null;

export function getPromptChainingEngine(): PromptChainingEngine {
  if (!chainingEngine) {
    chainingEngine = new PromptChainingEngine();
  }
  return chainingEngine;
}
