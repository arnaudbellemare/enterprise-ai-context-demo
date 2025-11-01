/**
 * SRL Actions
 * 
 * ElizaOS Action pattern for SRL enhancement operations.
 * Actions: enhance-with-srl, compute-step-reward, generate-reasoning
 */

import { Action, Handler, Runtime, Message, State, HandlerResult, HandlerMetadata } from '../eliza-patterns/types';
import { SWiRLSRLEnhancer, SRLEnhancedDecomposition } from './swirl-srl-enhancer';
import { SWiRLDecompositionResult } from '../swirl-decomposer';

/**
 * Action: Enhance SWiRL decomposition with SRL supervision
 */
export const enhanceWithSRLAction: Action = {
  name: 'enhance-with-srl',
  description: 'Enhances SWiRL decomposition with step-wise supervision from expert trajectories',
  effects: {
    provides: ['srl-enhanced-decomposition'],
    requires: ['swirl-decomposition', 'srl-expert-trajectory'],
    modifies: ['srl-step-rewards', 'srl-average-reward']
  },
  
  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    // Requires SWiRL decomposition and expert trajectory
    return !!(state.swirl_decomposition && state.srl_expert_trajectory);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const startTime = Date.now();
    
    try {
      const decomposition = state.swirl_decomposition as SWiRLDecompositionResult;
      const expertTrajectory = state.srl_expert_trajectory;
      const domain = state.domain || 'general';

      // Create SRL enhancer
      const srlEnhancer = new SWiRLSRLEnhancer({
        expertTrajectories: [expertTrajectory],
        stepRewardWeight: 0.6,
        finalRewardWeight: 0.4,
        reasoningGeneration: true,
        similarityThreshold: 0.5
      });

      // Enhance decomposition
      const enhanced = await srlEnhancer.enhanceWithSRL(
        decomposition,
        message.content,
        domain
      );

      // Store results in state
      state.srl_enhanced_decomposition = enhanced;
      state.srl_step_rewards = enhanced.trajectory.steps.map(s => (s as any).stepReward || 0);
      state.srl_average_reward = enhanced.averageStepReward;

      const latency = Date.now() - startTime;

      const metadata: HandlerMetadata = {
        latency,
        components: ['SRL', 'SWiRL'],
        averageStepReward: enhanced.averageStepReward,
        totalReward: enhanced.totalReward,
        stepsEnhanced: enhanced.trajectory.steps.length
      };

      return {
        response: `SRL enhancement complete: ${enhanced.trajectory.steps.length} steps enhanced with average reward ${enhanced.averageStepReward.toFixed(3)}`,
        state: {
          srl_enhanced_decomposition: enhanced,
          srl_step_rewards: metadata.stepsEnhanced,
          srl_average_reward: enhanced.averageStepReward
        },
        metadata
      };
    } catch (error: any) {
      console.error('SRL enhancement action failed:', error);
      return {
        response: '',
        metadata: {
          error: error.message,
          latency: Date.now() - startTime
        }
      };
    }
  }
};

/**
 * Action: Compute step reward for a single step
 */
export const computeStepRewardAction: Action = {
  name: 'compute-step-reward',
  description: 'Computes reward for a single step compared to expert trajectory',
  effects: {
    provides: ['step-reward'],
    requires: ['model-step', 'expert-step'],
    modifies: []
  },

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!(state.model_step && state.expert_step);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    try {
      const modelStep = state.model_step;
      const expertStep = state.expert_step;
      
      // Simplified reward computation (full logic in SWiRLSRLEnhancer)
      const srlEnhancer = new SWiRLSRLEnhancer({
        expertTrajectories: [],
        stepRewardWeight: 0.6,
        finalRewardWeight: 0.4,
        reasoningGeneration: false,
        similarityThreshold: 0.5
      });

      // Use private method via type casting (in production, would expose method)
      const reward = (srlEnhancer as any).computeStepReward?.(
        modelStep,
        expertStep,
        modelStep.reasoning
      ) || 0.5;

      return {
        response: `Step reward: ${reward.toFixed(3)}`,
        metadata: {
          stepReward: reward
        }
      };
    } catch (error: any) {
      return {
        response: '',
        metadata: {
          error: error.message
        }
      };
    }
  }
};

/**
 * Action: Generate internal reasoning for a step
 */
export const generateReasoningAction: Action = {
  name: 'generate-reasoning',
  description: 'Generates internal reasoning monologue for a SWiRL step',
  effects: {
    provides: ['step-reasoning'],
    requires: ['swirl-step'],
    modifies: []
  },

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!state.swirl_step;
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    try {
      const step = state.swirl_step;
      const query = message.content;

      const srlEnhancer = new SWiRLSRLEnhancer({
        expertTrajectories: [],
        stepRewardWeight: 0.6,
        finalRewardWeight: 0.4,
        reasoningGeneration: true,
        similarityThreshold: 0.5
      });

      // Use private method via type casting
      const reasoning = await (srlEnhancer as any).generateInternalReasoning?.(
        step,
        query,
        step.step_number - 1
      ) || step.reasoning || '';

      return {
        response: reasoning,
        metadata: {
          reasoningLength: reasoning.length
        }
      };
    } catch (error: any) {
      return {
        response: '',
        metadata: {
          error: error.message
        }
      };
    }
  }
};

/**
 * All SRL actions
 */
export const srlActions: Action[] = [
  enhanceWithSRLAction,
  computeStepRewardAction,
  generateReasoningAction
];

