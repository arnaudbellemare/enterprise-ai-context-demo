/**
 * SRL Expert Trajectory Provider
 * 
 * ElizaOS Provider pattern for injecting expert trajectories as context.
 * Provides dynamic expert guidance for multi-step reasoning.
 */

import { Provider, ProviderResult, Runtime, Message, State, Context } from '../eliza-patterns/types';
import { ExpertTrajectory, loadExpertTrajectories } from './swirl-srl-enhancer';

export class SRLExpertTrajectoryProvider implements Provider {
  name = 'srl-expert-trajectory';
  description = 'Provides expert trajectories for step-wise supervision in multi-step reasoning queries';
  dynamic = true; // Modifies state with matched trajectory
  position = 1; // Early execution (before actions)

  private cachedTrajectories: Map<string, ExpertTrajectory[]> = new Map();

  async get(
    runtime: Runtime,
    message: Message,
    state: State
  ): Promise<ProviderResult> {
    // Get domain from runtime state if not in message state
    const domain = state.domain || runtime.state?.domain || 'general';
    const query = message.content;

    try {
      // Load expert trajectories for domain (with caching)
      let trajectories = this.cachedTrajectories.get(domain);
      if (!trajectories) {
        trajectories = await loadExpertTrajectories(domain);
        this.cachedTrajectories.set(domain, trajectories);
      }

      if (trajectories.length === 0) {
        return {
          context: [],
          success: false,
          error: `No expert trajectories available for domain: ${domain}`
        };
      }

      // Find best matching trajectory
      const matchedTrajectory = this.findBestTrajectory(query, domain, trajectories);

      if (!matchedTrajectory) {
        return {
          context: [],
          success: false,
          error: `No matching expert trajectory found for query`
        };
      }

      // Build context from trajectory
      const contexts: Context[] = [
        {
          role: 'system',
          content: `Expert Trajectory Matched: ${matchedTrajectory.query}`,
          name: 'srl-trajectory-header',
          timestamp: Date.now()
        }
      ];

      // Add each step as context
      for (const step of matchedTrajectory.steps) {
        contexts.push({
          role: 'assistant',
          content: `Step ${step.stepNumber}: ${step.action}\nReasoning: ${step.internalReasoning}\nExpected Result: ${step.expectedResult}`,
          name: `srl-step-${step.stepNumber}`,
          timestamp: Date.now()
        });
      }

      // Store matched trajectory in state for actions to use
      state.srl_expert_trajectory = matchedTrajectory;
      state.srl_trajectory_quality = matchedTrajectory.quality;
      // Also store in runtime state for persistence
      if (runtime.state) {
        runtime.state.srl_expert_trajectory = matchedTrajectory;
        runtime.state.srl_trajectory_quality = matchedTrajectory.quality;
      }

      return {
        context: contexts,
        success: true,
        tokens: contexts.reduce((sum, ctx) => sum + ctx.content.length, 0)
      };
    } catch (error: any) {
      console.error('SRL Expert Trajectory Provider error:', error);
      return {
        context: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find best matching expert trajectory for query
   */
  private findBestTrajectory(
    query: string,
    domain: string,
    trajectories: ExpertTrajectory[]
  ): ExpertTrajectory | null {
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 3));

    let bestMatch: ExpertTrajectory | null = null;
    let bestScore = 0;

    for (const trajectory of trajectories) {
      const trajLower = trajectory.query.toLowerCase();
      const trajWords = new Set(trajLower.split(/\s+/).filter(w => w.length > 3));

      // Jaccard similarity
      const intersection = Array.from(queryWords).filter(w => trajWords.has(w)).length;
      const union = queryWords.size + trajWords.size - intersection;
      const similarity = union > 0 ? intersection / union : 0;

      // Weight by trajectory quality
      const score = similarity * 0.7 + trajectory.quality * 0.3;

      if (score > bestScore && score > 0.3) { // Minimum similarity threshold
        bestScore = score;
        bestMatch = trajectory;
      }
    }

    return bestMatch;
  }
}

