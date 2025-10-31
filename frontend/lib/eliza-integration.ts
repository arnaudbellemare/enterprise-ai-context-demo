/**
 * ElizaOS Integration Layer
 * 
 * Integrates SRL and EBM plugins into PERMUTATION engine.
 * Provides unified interface for ElizaOS pattern execution.
 */

import { createRuntime, type Runtime, type Message, type State } from './eliza-patterns/runtime-simple';
import { registerSRLPlugin } from './srl/srl-plugin';
import { registerEBMPlugin } from './ebm/ebm-plugin';

export interface ElizaIntegrationConfig {
  enableSRL?: boolean;
  enableEBM?: boolean;
}

export class ElizaIntegration {
  private runtime: Runtime;
  private config: Required<ElizaIntegrationConfig>;

  constructor(config: ElizaIntegrationConfig = {}) {
    this.config = {
      enableSRL: config.enableSRL ?? true,
      enableEBM: config.enableEBM ?? true
    };
    
    this.runtime = createRuntime() as Runtime;
  }

  /**
   * Initialize integration (register plugins)
   */
  async initialize(): Promise<void> {
    if (this.config.enableSRL) {
      await registerSRLPlugin(this.runtime);
    }
    
    if (this.config.enableEBM) {
      await registerEBMPlugin(this.runtime);
    }
  }

  /**
   * Execute SRL enhancement workflow
   */
  async executeSRLWorkflow(
    query: string,
    domain: string,
    swirlDecomposition: any
  ): Promise<{
    enhanced: any;
    averageReward: number;
    metadata: any;
  }> {
    const message: Message = {
      id: `srl-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    // Initialize state
    this.runtime.state = {
      domain,
      swirl_decomposition: swirlDecomposition
    };

    try {
      // Execute providers
      if (this.runtime.executeProviders) {
        await this.runtime.executeProviders(message);
      }

      // Execute enhancement action
      const result = this.runtime.executeAction 
        ? await this.runtime.executeAction('enhance-with-srl', message)
        : null;
      
      if (!result) {
        // Check if action validation failed
        const action = this.runtime.actions.get('enhance-with-srl');
        if (action) {
          const canRun = await action.validate(this.runtime, message, this.runtime.state);
          if (!canRun) {
            throw new Error('SRL enhancement action validation failed - missing required state');
          }
        }
        throw new Error('SRL enhancement action returned null');
      }

      // Execute evaluators
      if (this.runtime.executeEvaluators) {
        await this.runtime.executeEvaluators(message);
      }

      return {
        enhanced: this.runtime.state.srl_enhanced_decomposition || swirlDecomposition,
        averageReward: this.runtime.state.srl_average_reward || 0,
        metadata: {
          stepRewards: this.runtime.state.srl_step_rewards || [],
          trajectoryQuality: this.runtime.state.srl_trajectory_quality || 0
        }
      };
    } catch (error: any) {
      console.error('SRL workflow error:', error);
      // Return fallback result
      return {
        enhanced: swirlDecomposition,
        averageReward: 0,
        metadata: {
          stepRewards: [],
          trajectoryQuality: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Execute EBM refinement workflow
   */
  async executeEBMWorkflow(
    query: string,
    domain: string,
    initialAnswer: string,
    context: any = {}
  ): Promise<{
    refinedAnswer: string;
    improvement: number;
    metadata: any;
  }> {
    const message: Message = {
      id: `ebm-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    // Initialize state
    this.runtime.state = {
      domain,
      initial_answer: initialAnswer,
      context
    };

    try {
      // Execute providers (optional for EBM)
      await this.runtime.executeProviders(message).catch(() => {
        // Providers may not be available, continue anyway
      });

      // Execute refinement action
      const result = await this.runtime.executeAction('refine-answer', message);
      
      if (!result) {
        // Check if action validation failed
        const action = this.runtime.actions.get('refine-answer');
        if (action) {
          const canRun = await action.validate(this.runtime, message, this.runtime.state);
          if (!canRun) {
            throw new Error('EBM refinement action validation failed - missing initial_answer in state');
          }
        }
        throw new Error('EBM refinement action returned null');
      }

      // Execute evaluators
      await this.runtime.executeEvaluators(message).catch(() => {
        // Evaluators may fail, continue anyway
      });

      return {
        refinedAnswer: this.runtime.state.refined_answer || result.response || initialAnswer,
        improvement: this.runtime.state.ebm_improvement || 0,
        metadata: {
          energyHistory: this.runtime.state.ebm_energy_history || [],
          converged: this.runtime.state.ebm_converged || false,
          stepsCompleted: this.runtime.state.ebm_steps_completed || 0
        }
      };
    } catch (error: any) {
      console.error('EBM workflow error:', error);
      // Return fallback result
      return {
        refinedAnswer: initialAnswer,
        improvement: 0,
        metadata: {
          energyHistory: [],
          converged: false,
          stepsCompleted: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Get runtime instance (for advanced usage)
   */
  getRuntime(): Runtime {
    return this.runtime;
  }

  /**
   * Stop all services
   */
  async stop(): Promise<void> {
    if (this.runtime.stopServices) {
      await this.runtime.stopServices();
    }
  }

  /**
   * Reset integration state
   */
  async reset(): Promise<void> {
    if (this.runtime.reset) {
      await this.runtime.reset();
    }
    await this.initialize();
  }
}

/**
 * Create ElizaOS integration instance
 */
export function createElizaIntegration(config?: ElizaIntegrationConfig): ElizaIntegration {
  return new ElizaIntegration(config);
}

