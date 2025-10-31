/**
 * EBM Actions
 * 
 * ElizaOS Action pattern for EBM refinement operations.
 * Actions: refine-answer, compute-energy, check-convergence
 */

import { Action, Handler, Runtime, Message, State, HandlerResult, HandlerMetadata } from '../eliza-patterns/types';
import { EBMAnswerRefiner, EBMRefinementResult } from './answer-refiner-simple';

/**
 * Action: Refine answer using energy-based optimization
 */
export const refineAnswerAction: Action = {
  name: 'refine-answer',
  description: 'Refines an answer using energy-based optimization to improve quality',
  effects: {
    provides: ['refined-answer'],
    requires: ['initial-answer'],
    modifies: ['ebm-energy-history', 'ebm-improvement']
  },
  
  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!state.initial_answer;
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const startTime = Date.now();
    
    try {
      const initialAnswer = state.initial_answer as string;
      const query = message.content;
      const context = JSON.stringify(state.context || {});
      const refinementSteps = state.ebm_refinement_steps || 3;
      const domain = state.domain || 'general';

      // Create refiner
      const refiner = new EBMAnswerRefiner({
        refinementSteps,
        learningRate: 0.5,
        noiseScale: 0.01,
        temperature: 0.8,
        energyFunction: domain,
        earlyStoppingThreshold: 0.001
      });

      // Refine answer
      const result = await refiner.refine(query, context, initialAnswer);

      // Store results in state
      state.refined_answer = result.refinedAnswer;
      state.ebm_energy_history = result.energyHistory;
      state.ebm_improvement = result.improvement;
      state.ebm_converged = result.converged;
      state.ebm_steps_completed = result.stepsCompleted;

      const latency = Date.now() - startTime;

      const metadata: HandlerMetadata = {
        latency,
        components: ['EBM'],
        energyImprovement: result.improvement,
        stepsCompleted: result.stepsCompleted,
        converged: result.converged,
        initialEnergy: result.energyHistory[0],
        finalEnergy: result.energyHistory[result.energyHistory.length - 1]
      };

      return {
        response: result.refinedAnswer,
        state: {
          refined_answer: result.refinedAnswer,
          ebm_energy_history: result.energyHistory,
          ebm_improvement: result.improvement,
          ebm_converged: result.converged,
          ebm_steps_completed: result.stepsCompleted
        },
        metadata
      };
    } catch (error: any) {
      console.error('EBM refinement action failed:', error);
      return {
        response: state.initial_answer || '',
        metadata: {
          error: error.message,
          latency: Date.now() - startTime
        }
      };
    }
  }
};

/**
 * Action: Compute energy for an answer
 */
export const computeEnergyAction: Action = {
  name: 'compute-energy',
  description: 'Computes energy score for an answer (lower = better)',
  effects: {
    provides: ['answer-energy'],
    requires: ['answer'],
    modifies: []
  },

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!(state.answer || state.initial_answer);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    try {
      const answer = (state.answer || state.initial_answer) as string;
      const query = message.content;
      const context = JSON.stringify(state.context || {});
      const domain = state.domain || 'general';

      const refiner = new EBMAnswerRefiner({
        refinementSteps: 0, // Not refining, just computing
        energyFunction: domain,
        learningRate: 0.5,
        noiseScale: 0.01,
        temperature: 0.8
      });

      // Use private method via type casting
      const energy = (refiner as any).computeEnergy?.(query, context, answer) || 1.0;

      return {
        response: `Energy: ${energy.toFixed(4)}`,
        metadata: {
          energy,
          lowerIsBetter: true
        }
      };
    } catch (error: any) {
      return {
        response: '',
        metadata: {
          error: error.message,
          energy: 1.0
        }
      };
    }
  }
};

/**
 * Action: Check if refinement has converged
 */
export const checkConvergenceAction: Action = {
  name: 'check-convergence',
  description: 'Checks if EBM refinement has converged (energy change < threshold)',
  effects: {
    provides: ['convergence-status'],
    requires: ['ebm-energy-history'],
    modifies: []
  },

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    const history = state.ebm_energy_history as number[];
    return !!(history && history.length >= 2);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    try {
      const history = state.ebm_energy_history as number[];
      const threshold = state.ebm_convergence_threshold || 0.001;

      // Check last two energy values
      const recent = history.slice(-2);
      const energyChange = Math.abs(recent[1] - recent[0]);
      const converged = energyChange < threshold;

      return {
        response: converged
          ? `Converged: Energy change ${energyChange.toFixed(6)} < threshold ${threshold}`
          : `Not converged: Energy change ${energyChange.toFixed(6)} >= threshold ${threshold}`,
        metadata: {
          converged,
          energyChange,
          threshold,
          recentEnergy: recent
        }
      };
    } catch (error: any) {
      return {
        response: '',
        metadata: {
          error: error.message,
          converged: false
        }
      };
    }
  }
};

/**
 * All EBM actions
 */
export const ebmActions: Action[] = [
  refineAnswerAction,
  computeEnergyAction,
  checkConvergenceAction
];

