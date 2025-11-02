/**
 * Simplified nanoEBM Answer Refiner (No TensorFlow.js Dependency)
 * 
 * Enhanced with LLM-based refinement for actual answer improvement.
 * 
 * ISSUE FIXED: Previously added generic placeholders like "[Additional details]"
 * which didn't actually improve answers. Now uses LLM calls for real refinement.
 */

export interface EBMConfig {
  refinementSteps: number;
  learningRate: number;
  noiseScale: number;
  temperature: number;
  energyFunction: string;
  earlyStoppingThreshold?: number;
  useLLMRefinement?: boolean;  // NEW: Use LLM for actual refinement
  llmModel?: string;            // Model to use for refinement (default: 'ollama-gemma3:4b')
}

export interface EBMRefinementResult {
  initialAnswer: string;
  refinedAnswer: string;
  energyHistory: number[];
  improvement: number;
  converged: boolean;
  stepsCompleted: number;
}

export class SimpleEBMAnswerRefiner {
  private config: Required<EBMConfig> & { useLLMRefinement: boolean; llmModel: string };

  constructor(config: EBMConfig) {
    this.config = {
      refinementSteps: config.refinementSteps || 3,
      learningRate: config.learningRate || 0.5,
      noiseScale: config.noiseScale || 0.01,
      temperature: config.temperature || 0.8,
      energyFunction: config.energyFunction || 'default',
      earlyStoppingThreshold: config.earlyStoppingThreshold || 0.001,
      useLLMRefinement: config.useLLMRefinement ?? true,  // Default to true for real refinement
      llmModel: config.llmModel || 'ollama-gemma3:4b'
    };
  }

  /**
   * Refine answer using simplified energy-based optimization
   */
  async refine(
    query: string,
    context: string,
    initialAnswer: string
  ): Promise<EBMRefinementResult> {
    console.log(`🔬 EBM: Starting refinement (${this.config.refinementSteps} steps)`);
    
    // Compute initial energy
    const initialEnergy = this.computeEnergy(query, context, initialAnswer);
    const energyHistory: number[] = [initialEnergy];
    
    console.log(`   Initial energy: ${initialEnergy.toFixed(4)}`);

    let refinedAnswer = initialAnswer;
    let converged = false;
    let stepsCompleted = 0;

    // Refinement loop (simplified: text-based improvements instead of embedding gradients)
    for (let step = 0; step < this.config.refinementSteps; step++) {
      stepsCompleted = step + 1;
      
      // Generate refinement suggestions
      const suggestions = this.generateRefinementSuggestions(query, context, refinedAnswer);
      
      // Try each suggestion and compute energy
      let bestEnergy = step === 0 ? initialEnergy : energyHistory[energyHistory.length - 1];
      let bestAnswer = refinedAnswer;
      let improvementsTried = 0;
      let improvementsFound = 0;
      
      if (suggestions.length === 0) {
        // If no suggestions, try general improvement
        suggestions.push('add_detail'); // Always try to add detail
      }
      
      for (const suggestion of suggestions) {
        improvementsTried++;
        try {
          const candidateAnswer = await this.applySuggestion(query, context, refinedAnswer, suggestion);
          
          // Only evaluate if answer actually changed
          if (candidateAnswer !== refinedAnswer && candidateAnswer.trim().length > 0) {
            const candidateEnergy = this.computeEnergy(query, context, candidateAnswer);
            
            if (candidateEnergy < bestEnergy) {
              const improvement = bestEnergy - candidateEnergy;
              console.log(`   🔧 ${suggestion}: energy=${candidateEnergy.toFixed(4)} (improvement: -${improvement.toFixed(4)})`);
              bestEnergy = candidateEnergy;
              bestAnswer = candidateAnswer;
              improvementsFound++;
            } else {
              console.log(`   ⊘ ${suggestion}: energy=${candidateEnergy.toFixed(4)} (no improvement)`);
            }
          } else {
            console.log(`   ⊘ ${suggestion}: no change or empty result`);
          }
        } catch (error) {
          console.warn(`   ⚠️  ${suggestion} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      refinedAnswer = bestAnswer;
      energyHistory.push(bestEnergy);
      
      if (improvementsFound === 0 && improvementsTried > 0) {
        console.log(`   ℹ️  Tried ${improvementsTried} refinements, none improved energy`);
      }

      // Check convergence
      if (step > 0) {
        const energyChange = Math.abs(energyHistory[step + 1] - energyHistory[step]);
        if (energyChange < this.config.earlyStoppingThreshold!) {
          console.log(`   ✓ Converged at step ${step + 1} (energy change: ${energyChange.toFixed(6)})`);
          converged = true;
          break;
        }
      }

      console.log(`   Step ${step + 1}: energy=${bestEnergy.toFixed(4)} (change: ${step > 0 ? (energyHistory[step + 1] - energyHistory[step]).toFixed(4) : 'N/A'})`);
    }

    const improvement = energyHistory[0] - energyHistory[energyHistory.length - 1];

    console.log(`   ✓ Refinement complete: energy reduced by ${improvement.toFixed(4)} (${stepsCompleted} steps)`);

    return {
      initialAnswer,
      refinedAnswer,
      energyHistory,
      improvement,
      converged,
      stepsCompleted
    };
  }

  /**
   * Compute energy function E(query, context, answer)
   * Lower energy = better answer
   * 
   * Enhanced to better detect LLM improvements:
   * - Penalizes generic placeholders
   * - Rewards meaningful content additions
   * - Better word overlap calculation
   */
  private computeEnergy(query: string, context: string, answer: string): number {
    // Penalize generic placeholders (these don't improve answers)
    const placeholderPatterns = [
      /\[Additional details.*?\]/gi,
      /\[Enhanced relevance.*?\]/gi,
      /\[Based on.*?context.*?\]/gi,
      /\[Additional.*?\]/gi,
    ];
    
    let placeholderPenalty = 0;
    for (const pattern of placeholderPatterns) {
      const matches = answer.match(pattern);
      if (matches) {
        placeholderPenalty += matches.length * 0.2; // Penalize placeholders
      }
    }
    
    // Simplified energy function based on:
    // 1. Answer relevance to query (lower = better)
    // 2. Answer faithfulness to context (lower = better)
    // 3. Answer completeness (higher completeness = lower energy)
    // 4. Penalty for generic placeholders
    
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const answerWords = new Set(answer.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const contextWords = new Set(context.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    // Relevance: How well answer addresses query
    const queryAnswerOverlap = Array.from(queryWords).filter(w => answerWords.has(w)).length;
    const relevanceScore = queryWords.size > 0 ? queryAnswerOverlap / queryWords.size : 0;
    const relevanceEnergy = 1 - relevanceScore; // Lower overlap = higher energy
    
    // Faithfulness: How well answer is supported by context
    const answerContextOverlap = Array.from(answerWords).filter(w => contextWords.has(w)).length;
    const faithfulnessScore = answerWords.size > 0 ? answerContextOverlap / answerWords.size : 0;
    const faithfulnessEnergy = 1 - faithfulnessScore; // Lower overlap = higher energy
    
    // Completeness: Answer length and structure (longer, structured = lower energy)
    const lengthScore = Math.min(1, answer.length / 500); // Prefer longer answers (up to 500 chars)
    const hasStructure = (answer.includes('\n') || answer.includes('•') || answer.includes('-') || answer.includes('1.')) ? 1 : 0;
    const completenessEnergy = 1 - (lengthScore * 0.7 + hasStructure * 0.3);
    
    // Quality indicators: Reward specific, informative content
    const hasSpecificInfo = (answer.match(/\d+/g) || []).length > 0 ? 0.1 : 0; // Numbers indicate specifics
    const hasExamples = (answer.match(/example|for instance|such as/gi) || []).length > 0 ? 0.05 : 0;
    const qualityBonus = hasSpecificInfo + hasExamples;
    
    // Combined energy (weighted sum) + penalties - bonuses
    const totalEnergy = 
      relevanceEnergy * 0.35 +
      faithfulnessEnergy * 0.35 +
      completenessEnergy * 0.2 +
      placeholderPenalty * 0.1 -
      qualityBonus;
    
    return Math.max(0, Math.min(1, totalEnergy)); // Clamp to [0, 1]
  }

  /**
   * Generate refinement suggestions
   */
  private generateRefinementSuggestions(query: string, context: string, answer: string): string[] {
    const suggestions: string[] = [];
    
    // Suggestion 1: Add more detail if answer is short
    if (answer.length < 200) {
      suggestions.push('add_detail');
    }
    
    // Suggestion 2: Add structure if missing
    if (!answer.includes('\n') && !answer.includes('•')) {
      suggestions.push('add_structure');
    }
    
    // Suggestion 3: Improve relevance if low query overlap
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const answerWords = new Set(answer.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const overlap = Array.from(queryWords).filter(w => answerWords.has(w)).length;
    if (overlap / queryWords.size < 0.3) {
      suggestions.push('improve_relevance');
    }
    
    // Suggestion 4: Add context citations if low context overlap
    const contextWords = new Set(context.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const contextOverlap = Array.from(answerWords).filter(w => contextWords.has(w)).length;
    if (contextOverlap / answerWords.size < 0.3) {
      suggestions.push('add_context');
    }
    
    return suggestions;
  }

  /**
   * Apply refinement suggestion to answer
   * Now uses LLM for actual improvement instead of generic placeholders
   */
  private async applySuggestion(
    query: string,
    context: string,
    answer: string,
    suggestion: string
  ): Promise<string> {
    // If LLM refinement is disabled, use simple heuristics (legacy)
    if (!this.config.useLLMRefinement) {
      return this.applySuggestionLegacy(answer, suggestion);
    }
    
    // Use LLM for actual refinement
    try {
      const { callPerplexityWithRateLimiting } = await import('../brain-skills/llm-helpers');
      
      let refinementPrompt = '';
      
      switch (suggestion) {
        case 'add_detail':
          refinementPrompt = `Improve the following answer by adding more specific details and examples. Keep the original content but expand with relevant information.\n\nQuery: ${query}\n\nCurrent Answer: ${answer}\n\nImproved Answer:`;
          break;
        
        case 'add_structure':
          refinementPrompt = `Restructure the following answer with better organization. Use bullet points, numbered lists, or clear sections to make it easier to read.\n\nQuery: ${query}\n\nCurrent Answer: ${answer}\n\nRestructured Answer:`;
          break;
        
        case 'improve_relevance':
          refinementPrompt = `Improve the relevance of the following answer to the query. Focus on directly addressing what was asked.\n\nQuery: ${query}\n\nCurrent Answer: ${answer}\n\nMore Relevant Answer:`;
          break;
        
        case 'add_context':
          refinementPrompt = `Enhance the following answer by incorporating relevant information from the context provided.\n\nQuery: ${query}\n\nContext: ${context.substring(0, 500)}\n\nCurrent Answer: ${answer}\n\nEnhanced Answer:`;
          break;
        
        default:
          return answer;
      }
      
      const messages = [
        {
          role: 'system' as const,
          content: 'You are an expert at refining answers to make them more helpful, accurate, and complete. Provide only the improved answer, without additional commentary.'
        },
        {
          role: 'user' as const,
          content: refinementPrompt
        }
      ];
      
      const response = await callPerplexityWithRateLimiting(messages, {
        model: this.config.llmModel,
        temperature: this.config.temperature,
        maxTokens: Math.max(500, answer.length * 1.5) // Allow expansion
      });
      
      return response.content.trim() || answer;
      
    } catch (error) {
      console.warn(`   ⚠️  LLM refinement failed for ${suggestion}, using legacy method:`, error);
      return this.applySuggestionLegacy(answer, suggestion);
    }
  }
  
  /**
   * Legacy suggestion application (generic placeholders)
   * Fallback when LLM refinement fails
   */
  private applySuggestionLegacy(answer: string, suggestion: string): string {
    switch (suggestion) {
      case 'add_detail':
        return answer + '\n\n[Additional details based on analysis]';
      
      case 'add_structure':
        // Convert to bullet points
        const sentences = answer.split(/[.!?]\s+/).filter(s => s.length > 10);
        if (sentences.length > 1) {
          return sentences.map(s => `• ${s}`).join('\n');
        }
        return answer;
      
      case 'improve_relevance':
        return `[Enhanced relevance]: ${answer}`;
      
      case 'add_context':
        return `${answer}\n\n[Based on provided context]`;
      
      default:
        return answer;
    }
  }
}

// Export simplified version as default for easier testing
export { SimpleEBMAnswerRefiner as EBMAnswerRefiner };


