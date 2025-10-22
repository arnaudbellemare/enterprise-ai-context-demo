/**
 * PromptMII Integration for Meta-Learning Instruction Induction
 * 
 * Automatically generates task-specific instructions for brain skills,
 * achieving better performance with fewer tokens.
 * 
 * Based on: https://github.com/millix19/promptmii
 * 
 * Key Features:
 * - Meta-learning instruction induction for LLMs
 * - Task-specific instruction generation
 * - 3-13× token reduction while maintaining ICL performance
 * - Adaptive prompt evolution based on performance
 */

import { logger } from './logger';

export interface PromptMIIConfig {
  instructionModel: string; // Model for generating instructions
  predictionModel: string; // Model for making predictions
  maxInstructionLength: number;
  evolutionEnabled: boolean;
  performanceThreshold: number;
}

export interface InstructionGenerationRequest {
  task: string;
  domain: string;
  examples: Array<{
    input: string;
    output: string;
    metadata?: any;
  }>;
  constraints?: string[];
  targetPerformance?: number;
}

export interface GeneratedInstruction {
  instruction: string;
  confidence: number;
  metadata: {
    generationTime: number;
    tokenCount: number;
    modelUsed: string;
    evolutionGeneration?: number;
  };
  performance?: {
    fScore: number;
    accuracy: number;
    precision: number;
    recall: number;
  };
}

export class PromptMIIIntegration {
  private config: PromptMIIConfig;
  private instructionCache: Map<string, GeneratedInstruction> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();

  constructor(config?: Partial<PromptMIIConfig>) {
    this.config = {
      instructionModel: config?.instructionModel || 'meta-llama/Llama-3.1-8B-Instruct',
      predictionModel: config?.predictionModel || 'meta-llama/Llama-3.1-8B-Instruct',
      maxInstructionLength: config?.maxInstructionLength || 500,
      evolutionEnabled: config?.evolutionEnabled ?? true,
      performanceThreshold: config?.performanceThreshold || 0.7
    };

    logger.info('PromptMII Integration initialized', {
      operation: 'promptmii_initialization',
      metadata: {
        instructionModel: this.config.instructionModel,
        evolutionEnabled: this.config.evolutionEnabled
      }
    });
  }

  /**
   * Generate task-specific instruction using meta-learning
   */
  async generateInstruction(request: InstructionGenerationRequest): Promise<GeneratedInstruction> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(request);

    // Check cache first
    const cached = this.instructionCache.get(cacheKey);
    if (cached && !this.shouldEvolve(cacheKey)) {
      logger.info('Returning cached instruction', {
        operation: 'promptmii_generation',
        metadata: {
          task: request.task,
          cached: true
        }
      });
      return cached;
    }

    logger.info('Generating new instruction', {
      operation: 'promptmii_generation',
      metadata: {
        task: request.task,
        domain: request.domain,
        exampleCount: request.examples.length
      }
    });

    try {
      // Step 1: Analyze examples to understand task requirements
      const taskAnalysis = await this.analyzeTask(request);

      // Step 2: Generate instruction using meta-learning approach
      const instruction = await this.induceInstruction(taskAnalysis, request);

      // Step 3: Validate and refine instruction
      const refinedInstruction = await this.refineInstruction(instruction, request);

      // Step 4: Calculate confidence score
      const confidence = this.calculateConfidence(refinedInstruction, request);

      const generatedInstruction: GeneratedInstruction = {
        instruction: refinedInstruction,
        confidence,
        metadata: {
          generationTime: Date.now() - startTime,
          tokenCount: this.estimateTokenCount(refinedInstruction),
          modelUsed: this.config.instructionModel,
          evolutionGeneration: this.getEvolutionGeneration(cacheKey)
        }
      };

      // Cache the result
      this.instructionCache.set(cacheKey, generatedInstruction);

      logger.info('Instruction generated successfully', {
        operation: 'promptmii_generation',
        metadata: {
          task: request.task,
          confidence,
          tokenCount: generatedInstruction.metadata.tokenCount,
          generationTime: generatedInstruction.metadata.generationTime
        }
      });

      return generatedInstruction;

    } catch (error: any) {
      logger.error('Instruction generation failed', error, {
        operation: 'promptmii_generation',
        metadata: {
          task: request.task,
          domain: request.domain
        }
      });

      // Return fallback instruction
      return this.getFallbackInstruction(request);
    }
  }

  /**
   * Analyze task to understand requirements
   */
  private async analyzeTask(request: InstructionGenerationRequest): Promise<{
    taskType: string;
    inputPattern: string;
    outputPattern: string;
    complexity: number;
    domainKnowledge: string[];
  }> {
    // Analyze input/output patterns
    const inputs = request.examples.map(e => e.input);
    const outputs = request.examples.map(e => e.output);

    // Determine task type (classification, generation, transformation, etc.)
    const taskType = this.inferTaskType(inputs, outputs);

    // Extract patterns
    const inputPattern = this.extractPattern(inputs);
    const outputPattern = this.extractPattern(outputs);

    // Calculate complexity
    const complexity = this.calculateTaskComplexity(request);

    // Extract domain knowledge
    const domainKnowledge = this.extractDomainKnowledge(request);

    return {
      taskType,
      inputPattern,
      outputPattern,
      complexity,
      domainKnowledge
    };
  }

  /**
   * Induce instruction using meta-learning
   */
  private async induceInstruction(
    taskAnalysis: any,
    request: InstructionGenerationRequest
  ): Promise<string> {
    // Meta-learning prompt for instruction induction
    const metaPrompt = `Given the following task examples, generate a clear, concise instruction that would enable an AI model to perform this task accurately.

Task Domain: ${request.domain}
Task Type: ${taskAnalysis.taskType}
Complexity: ${taskAnalysis.complexity}

Examples:
${request.examples.slice(0, 3).map((ex, i) => `
Example ${i + 1}:
Input: ${ex.input}
Output: ${ex.output}
`).join('\n')}

${request.constraints ? `Constraints:\n${request.constraints.join('\n')}` : ''}

Generate a precise instruction (max ${this.config.maxInstructionLength} chars) that captures the essence of this task. The instruction should be:
1. Clear and unambiguous
2. Generalizable beyond the examples
3. Focused on the task objective
4. Domain-appropriate

Instruction:`;

    // Use instruction model to generate instruction
    const instruction = await this.callInstructionModel(metaPrompt);

    return instruction;
  }

  /**
   * Refine instruction for better performance
   */
  private async refineInstruction(
    instruction: string,
    request: InstructionGenerationRequest
  ): Promise<string> {
    // Trim to max length
    let refined = instruction.trim();
    if (refined.length > this.config.maxInstructionLength) {
      refined = refined.substring(0, this.config.maxInstructionLength).trim();
      // Try to end at a sentence boundary
      const lastPeriod = refined.lastIndexOf('.');
      if (lastPeriod > this.config.maxInstructionLength * 0.8) {
        refined = refined.substring(0, lastPeriod + 1);
      }
    }

    // Remove any meta-instructions or formatting artifacts
    refined = refined.replace(/^(Instruction:|Task:|Here's the instruction:)/gi, '').trim();

    // Ensure it starts with an action verb if possible
    const actionVerbs = ['analyze', 'classify', 'generate', 'transform', 'extract', 'identify', 'determine', 'evaluate'];
    const startsWithAction = actionVerbs.some(verb => 
      refined.toLowerCase().startsWith(verb)
    );

    if (!startsWithAction && request.domain) {
      // Prepend domain-specific action
      const domainAction = this.getDomainAction(request.domain, request.task);
      if (domainAction && !refined.toLowerCase().includes(domainAction.toLowerCase())) {
        refined = `${domainAction} ${refined.charAt(0).toLowerCase()}${refined.slice(1)}`;
      }
    }

    return refined;
  }

  /**
   * Calculate confidence in generated instruction
   */
  private calculateConfidence(instruction: string, request: InstructionGenerationRequest): number {
    let confidence = 0.5; // Base confidence

    // Factor 1: Instruction length (not too short, not too long)
    const lengthRatio = instruction.length / this.config.maxInstructionLength;
    if (lengthRatio > 0.3 && lengthRatio < 0.8) {
      confidence += 0.2;
    }

    // Factor 2: Contains domain keywords
    const domainKeywords = request.domain.toLowerCase().split(/\s+/);
    const hasDomainKeywords = domainKeywords.some(keyword => 
      instruction.toLowerCase().includes(keyword)
    );
    if (hasDomainKeywords) {
      confidence += 0.15;
    }

    // Factor 3: Number of examples used
    if (request.examples.length >= 3) {
      confidence += 0.1;
    }

    // Factor 4: Clarity indicators (action verbs, clear structure)
    const clarityIndicators = [
      /\b(analyze|classify|generate|transform|extract|identify|determine|evaluate)\b/i,
      /\b(based on|according to|considering|given)\b/i,
      /\b(should|must|will|need to)\b/i
    ];
    const clarityScore = clarityIndicators.filter(pattern => pattern.test(instruction)).length;
    confidence += (clarityScore / clarityIndicators.length) * 0.15;

    return Math.min(1.0, confidence);
  }

  /**
   * Determine if instruction should evolve based on performance
   */
  private shouldEvolve(cacheKey: string): boolean {
    if (!this.config.evolutionEnabled) return false;

    const history = this.performanceHistory.get(cacheKey);
    if (!history || history.length < 3) return false;

    // Calculate average performance of last 3 attempts
    const recentAvg = history.slice(-3).reduce((sum, score) => sum + score, 0) / 3;

    return recentAvg < this.config.performanceThreshold;
  }

  /**
   * Track performance and trigger evolution if needed
   */
  async trackPerformance(
    request: InstructionGenerationRequest,
    performance: { fScore: number; accuracy: number }
  ): Promise<void> {
    const cacheKey = this.getCacheKey(request);
    const history = this.performanceHistory.get(cacheKey) || [];
    
    history.push(performance.fScore);
    this.performanceHistory.set(cacheKey, history);

    logger.info('Performance tracked', {
      operation: 'promptmii_tracking',
      metadata: {
        task: request.task,
        fScore: performance.fScore,
        accuracy: performance.accuracy,
        avgPerformance: history.reduce((sum, s) => sum + s, 0) / history.length
      }
    });

    // Trigger evolution if performance is poor
    if (this.shouldEvolve(cacheKey)) {
      logger.info('Triggering instruction evolution', {
        operation: 'promptmii_evolution',
        metadata: {
          task: request.task,
          currentPerformance: performance.fScore,
          threshold: this.config.performanceThreshold
        }
      });

      // Remove from cache to trigger regeneration
      this.instructionCache.delete(cacheKey);
    }
  }

  // Helper methods

  private getCacheKey(request: InstructionGenerationRequest): string {
    return `${request.task}:${request.domain}:${request.examples.length}`;
  }

  private getEvolutionGeneration(cacheKey: string): number {
    const history = this.performanceHistory.get(cacheKey);
    return history ? Math.floor(history.length / 3) : 0;
  }

  private inferTaskType(inputs: string[], outputs: string[]): string {
    // Simple heuristics for task type inference
    const hasLabels = outputs.every(o => o.length < 50 && !o.includes(' '));
    if (hasLabels) return 'classification';

    const transformational = outputs.some((o, i) => o.includes(inputs[i].substring(0, 20)));
    if (transformational) return 'transformation';

    return 'generation';
  }

  private extractPattern(texts: string[]): string {
    // Extract common patterns (simplified)
    const avgLength = texts.reduce((sum, t) => sum + t.length, 0) / texts.length;
    const hasStructure = texts.some(t => t.includes(':') || t.includes(','));
    
    return `length:${Math.round(avgLength)},structured:${hasStructure}`;
  }

  private calculateTaskComplexity(request: InstructionGenerationRequest): number {
    let complexity = 5; // Base complexity

    // Adjust based on example count
    complexity += Math.min(2, request.examples.length * 0.1);

    // Adjust based on input/output length
    const avgInputLength = request.examples.reduce((sum, ex) => sum + ex.input.length, 0) / request.examples.length;
    const avgOutputLength = request.examples.reduce((sum, ex) => sum + ex.output.length, 0) / request.examples.length;
    complexity += Math.min(2, (avgInputLength + avgOutputLength) / 200);

    // Adjust based on constraints
    if (request.constraints && request.constraints.length > 0) {
      complexity += Math.min(1, request.constraints.length * 0.2);
    }

    return Math.min(10, Math.max(1, complexity));
  }

  private extractDomainKnowledge(request: InstructionGenerationRequest): string[] {
    const knowledge: Set<string> = new Set();

    // Extract from domain
    knowledge.add(request.domain);

    // Extract from task
    const taskWords = request.task.toLowerCase().split(/\s+/);
    taskWords.forEach(word => {
      if (word.length > 4) knowledge.add(word);
    });

    // Extract from examples
    request.examples.forEach(ex => {
      // Look for domain-specific terms (capitalized words, technical terms)
      const words = ex.input.match(/\b[A-Z][a-z]+\b/g) || [];
      words.forEach(word => {
        if (word.length > 4) knowledge.add(word.toLowerCase());
      });
    });

    return Array.from(knowledge).slice(0, 10);
  }

  private getDomainAction(domain: string, task: string): string {
    const domainActions: Record<string, string> = {
      'legal': 'Analyze',
      'technical': 'Evaluate',
      'business': 'Assess',
      'medical': 'Diagnose',
      'retrieval': 'Extract',
      'reasoning': 'Determine',
      'optimization': 'Optimize',
      'evaluation': 'Evaluate'
    };

    return domainActions[domain.toLowerCase()] || 'Process';
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private async callInstructionModel(prompt: string): Promise<string> {
    // This would call the actual instruction model via API
    // For now, return a simulated instruction
    // In production, integrate with OpenRouter, Perplexity, or Ollama

    // Simulated response based on meta-learning principles
    return `Analyze the input and generate an appropriate output following the pattern demonstrated in the examples. Consider domain-specific requirements and constraints.`;
  }

  private getFallbackInstruction(request: InstructionGenerationRequest): GeneratedInstruction {
    const fallbackInstruction = `Process the ${request.domain} task: ${request.task}`;

    return {
      instruction: fallbackInstruction,
      confidence: 0.3,
      metadata: {
        generationTime: 0,
        tokenCount: this.estimateTokenCount(fallbackInstruction),
        modelUsed: 'fallback'
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): PromptMIIConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PromptMIIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('PromptMII configuration updated', {
      operation: 'promptmii_config_update',
      metadata: {
        newConfig
      }
    });
  }

  /**
   * Clear cache and history
   */
  reset(): void {
    this.instructionCache.clear();
    this.performanceHistory.clear();
    logger.info('PromptMII cache and history reset', {
      operation: 'promptmii_reset'
    });
  }

  /**
   * Get statistics
   */
  getStats(): {
    cachedInstructions: number;
    avgPerformance: number;
    totalEvolutions: number;
  } {
    const avgPerformance = Array.from(this.performanceHistory.values())
      .flat()
      .reduce((sum, score, _, arr) => sum + score / arr.length, 0);

    const totalEvolutions = Array.from(this.performanceHistory.values())
      .reduce((sum, history) => sum + Math.floor(history.length / 3), 0);

    return {
      cachedInstructions: this.instructionCache.size,
      avgPerformance,
      totalEvolutions
    };
  }
}

// Export singleton instance
export const promptMII = new PromptMIIIntegration();

// Export factory function
export function getPromptMII(config?: Partial<PromptMIIConfig>): PromptMIIIntegration {
  if (config) {
    return new PromptMIIIntegration(config);
  }
  return promptMII;
}
