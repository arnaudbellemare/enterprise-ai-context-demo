/**
 * EBM Evaluators
 * 
 * ElizaOS Evaluator pattern for energy-based quality assessment.
 * Evaluators: energy-threshold-validator, refinement-quality-scorer
 */

import { Evaluator, Handler, Runtime, Message, State, HandlerResult, HandlerMetadata } from '../eliza-patterns/types';

/**
 * Evaluator: Validates that energy meets quality threshold
 */
export const energyThresholdValidator: Evaluator = {
  name: 'energy-threshold-validator',
  description: 'Validates that answer energy meets minimum quality threshold',
  alwaysRun: false,

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!(state.answer_energy || state.ebm_energy_history);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const energyHistory = state.ebm_energy_history as number[] || [];
    const currentEnergy = state.answer_energy as number || 
      (energyHistory.length > 0 ? energyHistory[energyHistory.length - 1] : 1.0);
    const threshold = state.ebm_energy_threshold || 0.5; // Lower energy = better

    // Energy should be below threshold for quality
    const isValid = currentEnergy <= threshold;
    const improvement = energyHistory.length > 1 
      ? energyHistory[0] - energyHistory[energyHistory.length - 1]
      : 0;

    const metadata: HandlerMetadata = {
      isValid,
      currentEnergy,
      threshold,
      improvement,
      energyHistoryLength: energyHistory.length,
      meetsThreshold: isValid
    };

    return {
      response: isValid
        ? `✅ Energy valid: ${currentEnergy.toFixed(4)} (threshold: ${threshold}, improvement: ${improvement.toFixed(4)})`
        : `⚠️ Energy above threshold: ${currentEnergy.toFixed(4)} (threshold: ${threshold})`,
      metadata
    };
  }
};

/**
 * Evaluator: Scores refinement quality
 */
export const refinementQualityScorer: Evaluator = {
  name: 'refinement-quality-scorer',
  description: 'Scores the quality of EBM refinement',
  alwaysRun: true, // Always run for quality tracking

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    // Always validate
    return true;
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const improvement = state.ebm_improvement as number || 0;
    const stepsCompleted = state.ebm_steps_completed as number || 0;
    const converged = state.ebm_converged as boolean || false;
    const energyHistory = state.ebm_energy_history as number[] || [];

    // Quality score based on improvement, convergence, and steps
    const improvementScore = Math.min(1.0, Math.max(0, improvement / 0.2)); // Normalize to 0-1
    const convergenceScore = converged ? 1.0 : 0.7; // Bonus for convergence
    const efficiencyScore = stepsCompleted > 0 
      ? Math.min(1.0, 2 / stepsCompleted) // Fewer steps = more efficient
      : 0.5;

    // Composite quality score
    const qualityScore = (improvementScore * 0.5) + (convergenceScore * 0.3) + (efficiencyScore * 0.2);
    const isValid = qualityScore >= 0.6; // Minimum acceptable score

    const metadata: HandlerMetadata = {
      isValid,
      qualityScore,
      improvement,
      stepsCompleted,
      converged,
      efficiencyScore,
      qualityBreakdown: {
        improvementComponent: improvementScore * 0.5,
        convergenceComponent: convergenceScore * 0.3,
        efficiencyComponent: efficiencyScore * 0.2
      }
    };

    return {
      response: `EBM Quality Score: ${qualityScore.toFixed(3)} (${isValid ? 'PASS' : 'FAIL'})`,
      metadata
    };
  }
};

/**
 * Evaluator: Validates refinement improvement
 */
export const improvementValidator: Evaluator = {
  name: 'improvement-validator',
  description: 'Validates that refinement actually improved the answer',
  alwaysRun: false,

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!(state.ebm_improvement !== undefined && state.ebm_energy_history);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const improvement = state.ebm_improvement as number || 0;
    const energyHistory = state.ebm_energy_history as number[] || [];
    const threshold = 0.01; // Minimum improvement required

    const isValid = improvement >= threshold;
    const improvementPercent = energyHistory.length > 0
      ? (improvement / energyHistory[0]) * 100
      : 0;

    const metadata: HandlerMetadata = {
      isValid,
      improvement,
      improvementPercent,
      threshold,
      initialEnergy: energyHistory[0],
      finalEnergy: energyHistory[energyHistory.length - 1] || energyHistory[0]
    };

    return {
      response: isValid
        ? `✅ Refinement improved answer: ${improvement.toFixed(4)} (${improvementPercent.toFixed(1)}% reduction)`
        : `⚠️ Refinement improvement below threshold: ${improvement.toFixed(4)} (threshold: ${threshold})`,
      metadata
    };
  }
};

/**
 * All EBM evaluators
 */
export const ebmEvaluators: Evaluator[] = [
  energyThresholdValidator,
  refinementQualityScorer,
  improvementValidator
];

