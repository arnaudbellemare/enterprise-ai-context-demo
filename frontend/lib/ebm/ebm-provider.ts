/**
 * EBM Refinement Suggestion Provider
 * 
 * ElizaOS Provider pattern for injecting refinement suggestions as context.
 * Provides energy-based refinement guidance for answer improvement.
 */

import { Provider, ProviderResult, Runtime, Message, State, Context } from '../eliza-patterns/types';
import { EBMAnswerRefiner } from './answer-refiner-simple';

export class EBMRefinementProvider implements Provider {
  name = 'ebm-refinement-suggestions';
  description = 'Provides energy-based refinement suggestions for answer improvement';
  dynamic = true; // Modifies state with refinement suggestions
  position = 2; // After initial answer generation

  async get(
    runtime: Runtime,
    message: Message,
    state: State
  ): Promise<ProviderResult> {
    const query = message.content;
    const initialAnswer = state.initial_answer;

    if (!initialAnswer) {
      return {
        context: [],
        success: false,
        error: 'Initial answer not available for refinement'
      };
    }

    try {
      // Create refiner to generate suggestions
      const refiner = new EBMAnswerRefiner({
        refinementSteps: state.ebm_refinement_steps || 3,
        learningRate: 0.5,
        noiseScale: 0.01,
        temperature: 0.8,
        energyFunction: state.domain || 'general'
      });

      // Generate refinement suggestions
      const suggestions = (refiner as any).generateRefinementSuggestions?.(
        query,
        JSON.stringify(state.context || {}),
        initialAnswer
      ) || [];

      // Build context from suggestions
      const contexts: Context[] = [
        {
          role: 'system',
          content: `EBM Refinement Suggestions: ${suggestions.join(', ')}`,
          name: 'ebm-suggestions-header',
          timestamp: Date.now()
        }
      ];

      // Add detailed suggestion context
      for (const suggestion of suggestions) {
        contexts.push({
          role: 'assistant',
          content: `Suggestion: ${suggestion}\nAction: ${this.getSuggestionDescription(suggestion)}`,
          name: `ebm-suggestion-${suggestion}`,
          timestamp: Date.now()
        });
      }

      // Store suggestions in state for actions
      state.ebm_refinement_suggestions = suggestions;

      return {
        context: contexts,
        success: true,
        tokens: contexts.reduce((sum, ctx) => sum + ctx.content.length, 0)
      };
    } catch (error: any) {
      console.error('EBM Refinement Provider error:', error);
      return {
        context: [],
        success: false,
        error: error.message
      };
    }
  }

  private getSuggestionDescription(suggestion: string): string {
    const descriptions: Record<string, string> = {
      'add_detail': 'Add more detailed information to improve completeness',
      'add_structure': 'Add structure (bullets, sections) to improve readability',
      'improve_relevance': 'Improve relevance to query by adding query-specific details',
      'add_context': 'Add citations or references to provided context'
    };
    return descriptions[suggestion] || 'Improve answer quality';
  }
}

