/**
 * ACEAgent - Base Agent Class with ACE Context Engineering
 * 
 * All agents in the system can extend this class to get:
 * - Evolving playbook-based context
 * - Automatic learning from experiences
 * - Incremental delta updates
 * - Grow-and-refine mechanism
 * - Superior performance (+8-13% over baselines)
 */

import { ACEReasoningBank, Experience } from './ace-reasoningbank';
import { Playbook, Bullet } from './ace/types';

export interface AgentConfig {
  agent_id: string;
  agent_type: string;                // e.g., 'financial', 'legal', 'product'
  enable_learning: boolean;           // Whether to learn from experiences
  enable_ace_context: boolean;        // Whether to use ACE playbook as context
  max_context_bullets: number;        // How many bullets to include in context
}

export interface AgentExecutionContext {
  task: string;
  inputs: any;
  playbook_bullets?: Bullet[];       // ACE playbook context
  additional_context?: any;
}

export interface AgentExecutionResult {
  success: boolean;
  output: any;
  reasoning?: string;
  error?: string;
  metrics?: {
    latency_ms: number;
    tokens_used?: number;
    cost?: number;
  };
}

/**
 * Base ACE Agent Class
 */
export abstract class ACEAgent {
  protected config: AgentConfig;
  protected reasoningBank: ACEReasoningBank;
  protected llm: any;

  constructor(
    config: AgentConfig,
    reasoningBank: ACEReasoningBank,
    llm?: any
  ) {
    this.config = config;
    this.reasoningBank = reasoningBank;
    this.llm = llm;

    console.log(`🤖 ACEAgent initialized: ${config.agent_id} (${config.agent_type})`);
  }

  /**
   * Execute task with ACE context
   */
  async execute(task: string, inputs?: any): Promise<AgentExecutionResult> {
    console.log(`\n🤖 ${this.config.agent_id}: Executing task`);
    console.log(`   Task: ${task.substring(0, 80)}...`);

    const startTime = Date.now();

    try {
      // Build execution context with ACE playbook
      const context = await this.buildExecutionContext(task, inputs);

      // Execute task (implemented by subclass)
      const result = await this.executeTask(context);

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Learn from experience if enabled
      if (this.config.enable_learning && result.success) {
        await this.learnFromExecution(task, inputs, result);
      }

      console.log(`   ✅ Success (${latency}ms)`);

      return {
        ...result,
        metrics: {
          ...result.metrics,
          latency_ms: latency
        }
      };
    } catch (error: any) {
      const endTime = Date.now();
      const latency = endTime - startTime;

      console.log(`   ❌ Error: ${error.message}`);

      // Learn from failure too
      if (this.config.enable_learning) {
        await this.learnFromFailure(task, inputs, error);
      }

      return {
        success: false,
        output: null,
        error: error.message,
        metrics: { latency_ms: latency }
      };
    }
  }

  /**
   * Build execution context with ACE playbook
   */
  protected async buildExecutionContext(
    task: string,
    inputs?: any
  ): Promise<AgentExecutionContext> {
    let playbook_bullets: Bullet[] | undefined;

    if (this.config.enable_ace_context) {
      // Retrieve relevant bullets from playbook
      playbook_bullets = await this.reasoningBank.retrieveRelevant(
        task,
        this.config.max_context_bullets
      );

      console.log(`   📖 Context: ${playbook_bullets.length} relevant bullets`);
    }

    return {
      task,
      inputs,
      playbook_bullets
    };
  }

  /**
   * Execute task (must be implemented by subclass)
   */
  protected abstract executeTask(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult>;

  /**
   * Learn from successful execution
   */
  protected async learnFromExecution(
    task: string,
    inputs: any,
    result: AgentExecutionResult
  ): Promise<void> {
    const experience: Experience = {
      task,
      trajectory: {
        steps: [], // Could be filled by subclass
        reasoning: result.reasoning
      },
      result: result.output,
      feedback: {
        success: true,
        metrics: result.metrics
      },
      timestamp: new Date()
    };

    await this.reasoningBank.learnFromExperience(experience);
  }

  /**
   * Learn from failure
   */
  protected async learnFromFailure(
    task: string,
    inputs: any,
    error: Error
  ): Promise<void> {
    const experience: Experience = {
      task,
      trajectory: {
        steps: [],
        reasoning: ''
      },
      result: null,
      feedback: {
        success: false,
        error: error.message
      },
      timestamp: new Date()
    };

    await this.reasoningBank.learnFromExperience(experience);
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return {
      agent_id: this.config.agent_id,
      agent_type: this.config.agent_type,
      reasoning_bank_stats: this.reasoningBank.getStats()
    };
  }

  /**
   * Get current playbook
   */
  getPlaybook(): Playbook {
    return this.reasoningBank.getPlaybook();
  }

  /**
   * Reset agent (clear learning)
   */
  reset(): void {
    this.reasoningBank.reset();
    console.log(`🔄 ${this.config.agent_id} reset`);
  }
}

/**
 * Example: Financial ACE Agent
 */
export class FinancialACEAgent extends ACEAgent {
  protected async executeTask(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    // Build prompt with ACE playbook
    let systemPrompt = `You are a financial analysis expert.`;

    if (context.playbook_bullets && context.playbook_bullets.length > 0) {
      systemPrompt += `\n\nYour Playbook (learned strategies):\n`;
      context.playbook_bullets.forEach(bullet => {
        systemPrompt += `\n[${bullet.id}] ${bullet.content}`;
      });
      systemPrompt += `\n\nUse relevant strategies from the playbook when applicable.`;
    }

    // Execute with LLM
    const response = await this.llm.generateText({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context.task }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      success: true,
      output: response.text,
      reasoning: response.text
    };
  }
}

/**
 * Example: Product ACE Agent
 */
export class ProductACEAgent extends ACEAgent {
  protected async executeTask(
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> {
    let systemPrompt = `You are a product strategy expert.`;

    if (context.playbook_bullets && context.playbook_bullets.length > 0) {
      systemPrompt += `\n\nYour Playbook:\n`;
      context.playbook_bullets.forEach(bullet => {
        systemPrompt += `\n• ${bullet.content}`;
      });
    }

    const response = await this.llm.generateText({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context.task }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      success: true,
      output: response.text,
      reasoning: response.text
    };
  }
}

/**
 * Helper: Create ACE Agent
 */
export function createACEAgent(
  agentId: string,
  agentType: string,
  reasoningBank: ACEReasoningBank,
  llm?: any
): ACEAgent {
  const config: AgentConfig = {
    agent_id: agentId,
    agent_type: agentType,
    enable_learning: true,
    enable_ace_context: true,
    max_context_bullets: 10
  };

  // Route to specific agent type
  switch (agentType) {
    case 'financial':
      return new FinancialACEAgent(config, reasoningBank, llm);
    case 'product':
      return new ProductACEAgent(config, reasoningBank, llm);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

