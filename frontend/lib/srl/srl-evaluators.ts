/**
 * SRL Evaluators
 * 
 * ElizaOS Evaluator pattern for quality assessment.
 * Evaluators: step-reward-validator, trajectory-match-validator
 */

import { Evaluator, Handler, Runtime, Message, State, HandlerResult, HandlerMetadata } from '../eliza-patterns/types';

/**
 * Evaluator: Validates step rewards meet quality threshold
 */
export const stepRewardValidator: Evaluator = {
  name: 'step-reward-validator',
  description: 'Validates that step rewards meet minimum quality threshold',
  alwaysRun: false,

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!(state.srl_step_rewards && state.srl_step_rewards.length > 0);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const rewards = state.srl_step_rewards as number[] || [];
    const threshold = state.srl_reward_threshold || 0.5;
    const averageReward = state.srl_average_reward || 0;

    // Check if all steps meet threshold
    const allStepsValid = rewards.every(r => r >= threshold);
    const averageValid = averageReward >= threshold;

    const isValid = allStepsValid && averageValid;

    const metadata: HandlerMetadata = {
      isValid,
      averageReward,
      minReward: Math.min(...rewards),
      maxReward: Math.max(...rewards),
      threshold,
      stepsPassed: rewards.filter(r => r >= threshold).length,
      totalSteps: rewards.length
    };

    return {
      response: isValid
        ? `✅ Step rewards valid: average ${averageReward.toFixed(3)} (threshold: ${threshold})`
        : `⚠️ Step rewards below threshold: average ${averageReward.toFixed(3)} (threshold: ${threshold})`,
      metadata
    };
  }
};

/**
 * Evaluator: Validates expert trajectory match quality
 */
export const trajectoryMatchValidator: Evaluator = {
  name: 'trajectory-match-validator',
  description: 'Validates that matched expert trajectory is suitable for query',
  alwaysRun: false,

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    return !!(state.srl_expert_trajectory && state.srl_trajectory_quality);
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const trajectory = state.srl_expert_trajectory;
    const quality = state.srl_trajectory_quality || 0;
    const threshold = state.srl_trajectory_quality_threshold || 0.7;

    const isValid = quality >= threshold;

    const metadata: HandlerMetadata = {
      isValid,
      trajectoryQuality: quality,
      threshold,
      trajectorySteps: trajectory?.steps?.length || 0,
      trajectoryDomain: trajectory?.domain || 'unknown'
    };

    return {
      response: isValid
        ? `✅ Expert trajectory matched: quality ${quality.toFixed(3)} (${trajectory.steps.length} steps)`
        : `⚠️ Expert trajectory quality below threshold: ${quality.toFixed(3)} (threshold: ${threshold})`,
      metadata
    };
  }
};

/**
 * Evaluator: Computes overall SRL quality score
 */
export const srlQualityScorer: Evaluator = {
  name: 'srl-quality-scorer',
  description: 'Computes overall quality score for SRL enhancement',
  alwaysRun: true, // Always run for quality tracking

  async validate(runtime: Runtime, message: Message, state: State): Promise<boolean> {
    // Always validate (alwaysRun)
    return true;
  },

  handler: async (runtime: Runtime, message: Message, state: State): Promise<HandlerResult> => {
    const averageReward = state.srl_average_reward || 0;
    const trajectoryQuality = state.srl_trajectory_quality || 0;
    const stepsEnhanced = state.srl_step_rewards?.length || 0;

    // Composite quality score
    const qualityScore = (averageReward * 0.6) + (trajectoryQuality * 0.4);
    const isValid = qualityScore >= 0.65; // Minimum acceptable score

    const metadata: HandlerMetadata = {
      isValid,
      qualityScore,
      averageReward,
      trajectoryQuality,
      stepsEnhanced,
      qualityBreakdown: {
        rewardComponent: averageReward * 0.6,
        trajectoryComponent: trajectoryQuality * 0.4
      }
    };

    return {
      response: `SRL Quality Score: ${qualityScore.toFixed(3)} (${isValid ? 'PASS' : 'FAIL'})`,
      metadata
    };
  }
};

/**
 * All SRL evaluators
 */
export const srlEvaluators: Evaluator[] = [
  stepRewardValidator,
  trajectoryMatchValidator,
  srlQualityScorer
];

