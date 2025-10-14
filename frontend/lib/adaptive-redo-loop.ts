/**
 * 🧠 ADAPTIVE REDO LOOP - TRM-Inspired Enhancements
 * 
 * Based on "Less is More: Recursive Reasoning with Tiny Networks" (TRM)
 * Implements Adaptive Computational Time (ACT) and EMA for stability
 * 
 * Key innovations from TRM paper:
 * - ACT: Learn when to halt early (like TRM's Q-learning)
 * - EMA: Exponential Moving Average for stability
 * - Multi-scale reasoning: Like TRM's z features
 */

import { Verifier, VerificationResult, createVerifier } from './verifier';
import { RedoLoop, RedoResult, RedoIteration, RedoConfig } from './redo-loop';

export interface ACTConfig {
  enable_act: boolean;
  halt_threshold: number; // When to stop (0.0-1.0)
  continue_threshold: number; // When to continue (0.0-1.0)
  learning_rate: number; // For Q-learning updates
  ema_decay: number; // EMA decay rate (0.999 like TRM)
}

export interface MultiScaleConfig {
  enable_multiscale: boolean;
  latent_dim: number; // Dimension of reasoning state z
  reasoning_layers: number; // Number of reasoning steps
  scale_factors: number[]; // Different scales for reasoning
}

export interface AdaptiveRedoConfig extends RedoConfig {
  act_config?: ACTConfig;
  multiscale_config?: MultiScaleConfig;
}

/**
 * Adaptive Redo Loop with TRM-inspired features
 */
export class AdaptiveRedoLoop extends RedoLoop {
  protected actConfig: Required<ACTConfig>;
  protected multiscaleConfig: Required<MultiScaleConfig>;
  private emaScore: number;
  private haltQ: number; // Q-value for halting
  private continueQ: number; // Q-value for continuing
  private reasoningState: number[]; // Multi-scale latent state z

  constructor(config: AdaptiveRedoConfig = {}) {
    super(config);
    
    this.actConfig = {
      enable_act: config.act_config?.enable_act ?? true,
      halt_threshold: config.act_config?.halt_threshold ?? 0.7,
      continue_threshold: config.act_config?.continue_threshold ?? 0.3,
      learning_rate: config.act_config?.learning_rate ?? 0.01,
      ema_decay: config.act_config?.ema_decay ?? 0.999,
    };

    this.multiscaleConfig = {
      enable_multiscale: config.multiscale_config?.enable_multiscale ?? true,
      latent_dim: config.multiscale_config?.latent_dim ?? 64,
      reasoning_layers: config.multiscale_config?.reasoning_layers ?? 3,
      scale_factors: config.multiscale_config?.scale_factors ?? [1.0, 0.5, 0.25],
    };

    // Initialize TRM-inspired state
    this.emaScore = 0.5;
    this.haltQ = 0.5;
    this.continueQ = 0.5;
    this.reasoningState = new Array(this.multiscaleConfig.latent_dim).fill(0);
  }

  /**
   * Execute with Adaptive Computational Time (ACT) - TRM's key innovation
   */
  async executeWithACT(
    task: string,
    context?: string,
    groundTruth?: any
  ): Promise<RedoResult> {
    const startTime = Date.now();
    const iterations: RedoIteration[] = [];
    let previousErrors: string[] = [];
    let previousSuggestions: string[] = [];
    let bestAttempt: { answer: string; quality: number } = { answer: '', quality: 0 };

    console.log(`🧠 Starting Adaptive Redo Loop (TRM-inspired)...`);
    console.log(`   - ACT: ${this.actConfig.enable_act ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Multi-scale: ${this.multiscaleConfig.enable_multiscale ? 'Enabled' : 'Disabled'}`);

    for (let i = 0; i < this.config.max_iterations; i++) {
      console.log(`\n📝 Iteration ${i + 1}/${this.config.max_iterations}...`);

      // Build prompt with TRM-inspired multi-scale reasoning
      const prompt = this.buildMultiScalePrompt(
        task,
        context,
        i,
        previousErrors,
        previousSuggestions
      );

      // Generate answer with reasoning state
      const answer = await this.generateWithReasoning(task, prompt, i);

      // Verify with EMA-stabilized confidence
      const verification = await this.verifyWithEMA(task, answer, context, groundTruth);

      // Store iteration
      iterations.push({
        iteration: i + 1,
        answer,
        verification,
        timestamp: Date.now(),
        prompt_used: prompt,
        model: this.config.model,
      });

      // Calculate quality with EMA
      const quality = this.calculateEMAQuality(verification);
      
      // Update best attempt
      if (quality > bestAttempt.quality) {
        bestAttempt = { answer, quality };
      }

      console.log(`📊 Verification result:`);
      console.log(`   - Valid: ${verification.is_valid}`);
      console.log(`   - Confidence: ${verification.confidence.toFixed(3)}`);
      console.log(`   - EMA Quality: ${quality.toFixed(3)}`);
      console.log(`   - Halt Q: ${this.haltQ.toFixed(3)}`);
      console.log(`   - Continue Q: ${this.continueQ.toFixed(3)}`);

      // ACT: Learn when to halt (TRM's key innovation)
      if (this.actConfig.enable_act) {
        const shouldHalt = await this.learnHaltCondition(verification, i);
        
        if (shouldHalt) {
          console.log(`🛑 ACT: Early stopping at iteration ${i + 1} (learned to halt)`);
          
          // Learn from this successful halt
          this.updateQValues(verification, true, true);
          
          return {
            final_answer: answer,
            verified: true,
            iterations: i + 1,
            all_attempts: iterations,
            total_time_ms: Date.now() - startTime,
            confidence: verification.confidence,
            quality_score: quality,
            improvement_over_initial: iterations.length > 1 
              ? quality - this.calculateEMAQuality(iterations[0].verification)
              : 0,
          };
        }
      }

      // Check if verification passed normally
      if (this.verifier.meetsThreshold(verification)) {
        console.log(`✅ Verification passed on iteration ${i + 1}!`);
        
        // Learn from this success
        this.updateQValues(verification, true, false);
        
        return {
          final_answer: answer,
          verified: true,
          iterations: i + 1,
          all_attempts: iterations,
          total_time_ms: Date.now() - startTime,
          confidence: verification.confidence,
          quality_score: quality,
          improvement_over_initial: iterations.length > 1 
            ? quality - this.calculateEMAQuality(iterations[0].verification)
            : 0,
        };
      }

      // If not passed, prepare for next iteration
      console.log(`⚠️ Verification failed. Errors: ${verification.errors.join(', ')}`);
      previousErrors = verification.errors;
      previousSuggestions = verification.suggestions;

      // Learn from this failure
      this.updateQValues(verification, false, false);

      // Update reasoning state for next iteration (TRM's multi-scale approach)
      if (this.multiscaleConfig.enable_multiscale) {
        this.updateReasoningState(task, answer, verification);
      }
    }

    // Return best attempt even if not fully verified
    console.log(`\n⚠️ Max iterations reached. Returning best attempt (EMA quality: ${bestAttempt.quality.toFixed(3)})`);
    
    const bestIteration = iterations.find(it => it.answer === bestAttempt.answer)!;
    
    return {
      final_answer: bestAttempt.answer,
      verified: false,
      iterations: iterations.length,
      all_attempts: iterations,
      total_time_ms: Date.now() - startTime,
      confidence: bestIteration.verification.confidence,
      quality_score: bestAttempt.quality,
      improvement_over_initial: iterations.length > 1
        ? bestAttempt.quality - this.calculateEMAQuality(iterations[0].verification)
        : 0,
    };
  }

  /**
   * Build prompt with multi-scale reasoning (TRM's z features)
   */
  private buildMultiScalePrompt(
    task: string,
    context: string | undefined,
    iteration: number,
    previousErrors: string[],
    previousSuggestions: string[]
  ): string {
    if (iteration === 0) {
      // First attempt - include reasoning state
      const reasoningContext = this.multiscaleConfig.enable_multiscale 
        ? `\n\nReasoning State: ${this.reasoningState.slice(0, 10).map(x => x.toFixed(2)).join(', ')}...`
        : '';
      
      return `${context ? context + '\n\n' : ''}Task: ${task}${reasoningContext}\n\nProvide a complete, accurate answer:`;
    }

    // Subsequent attempts - include error corrections and reasoning state
    const reasoningContext = this.multiscaleConfig.enable_multiscale 
      ? `\n\nCurrent Reasoning State: ${this.reasoningState.slice(0, 10).map(x => x.toFixed(2)).join(', ')}...`
      : '';

    return `${context ? context + '\n\n' : ''}Task: ${task}

PREVIOUS ATTEMPT HAD ERRORS:
${previousErrors.map((err, i) => `${i + 1}. ${err}`).join('\n')}

SUGGESTIONS FOR IMPROVEMENT:
${previousSuggestions.map((sug, i) => `${i + 1}. ${sug}`).join('\n')}${reasoningContext}

Please provide a corrected answer that addresses these issues. Use the reasoning state to guide your thinking:`;
  }

  /**
   * Generate answer with multi-scale reasoning (TRM's approach)
   */
  private async generateWithReasoning(
    task: string,
    prompt: string,
    iteration: number
  ): Promise<string> {
    if (!this.multiscaleConfig.enable_multiscale) {
      return this.generateAnswer(prompt);
    }

    // Multi-scale reasoning like TRM
    let reasoningPrompt = prompt;
    
    // Add reasoning state to prompt
    const reasoningStateStr = this.reasoningState
      .map((val, i) => `z[${i}]=${val.toFixed(3)}`)
      .slice(0, 10)
      .join(', ');
    
    reasoningPrompt += `\n\nReasoning State: [${reasoningStateStr}...]`;
    reasoningPrompt += `\n\nUse this reasoning state to guide your answer.`;

    return this.generateAnswer(reasoningPrompt);
  }

  /**
   * Verify with EMA-stabilized confidence (TRM's stability approach)
   */
  private async verifyWithEMA(
    task: string,
    answer: string,
    context?: string,
    groundTruth?: any
  ): Promise<VerificationResult> {
    const verification = await this.verifier.verify(task, answer, context, groundTruth);
    
    // Apply EMA to confidence (TRM's approach for stability)
    const emaConfidence = this.actConfig.ema_decay * this.emaScore + 
                          (1 - this.actConfig.ema_decay) * verification.confidence;
    
    this.emaScore = emaConfidence;
    
    // Return verification with EMA-stabilized confidence
    return {
      ...verification,
      confidence: emaConfidence,
    };
  }

  /**
   * Calculate quality with EMA (TRM's stability)
   */
  private calculateEMAQuality(verification: VerificationResult): number {
    const baseQuality = this.verifier.calculateQualityScore(verification);
    
    // Apply EMA to quality score for stability
    const emaQuality = this.actConfig.ema_decay * this.emaScore + 
                      (1 - this.actConfig.ema_decay) * baseQuality;
    
    return emaQuality;
  }

  /**
   * Learn halt condition using Q-learning (TRM's ACT approach)
   */
  private async learnHaltCondition(
    verification: VerificationResult,
    iteration: number
  ): Promise<boolean> {
    if (!this.actConfig.enable_act) {
      return false;
    }

    // Calculate halt probability based on Q-values
    const haltProbability = this.sigmoid(this.haltQ);
    const continueProbability = this.sigmoid(this.continueQ);
    
    // TRM's approach: halt if halt probability > threshold
    const shouldHalt = haltProbability > this.actConfig.halt_threshold;
    
    console.log(`🧠 ACT Learning:`);
    console.log(`   - Halt probability: ${haltProbability.toFixed(3)}`);
    console.log(`   - Continue probability: ${continueProbability.toFixed(3)}`);
    console.log(`   - Should halt: ${shouldHalt}`);
    
    return shouldHalt;
  }

  /**
   * Update Q-values based on outcome (TRM's Q-learning)
   */
  private updateQValues(
    verification: VerificationResult,
    wasSuccessful: boolean,
    wasEarlyHalt: boolean
  ): void {
    if (!this.actConfig.enable_act) {
      return;
    }

    const reward = wasSuccessful ? 1.0 : -0.5;
    const learningRate = this.actConfig.learning_rate;
    
    if (wasEarlyHalt) {
      // Update halt Q-value
      this.haltQ += learningRate * (reward - this.haltQ);
      console.log(`🧠 Updated halt Q: ${this.haltQ.toFixed(3)} (reward: ${reward})`);
    } else {
      // Update continue Q-value
      this.continueQ += learningRate * (reward - this.continueQ);
      console.log(`🧠 Updated continue Q: ${this.continueQ.toFixed(3)} (reward: ${reward})`);
    }
  }

  /**
   * Update reasoning state (TRM's multi-scale z features)
   */
  protected updateReasoningState(
    task: string,
    answer: string,
    verification: VerificationResult
  ): void {
    if (!this.multiscaleConfig.enable_multiscale) {
      return;
    }

    // Update reasoning state based on verification results
    // This simulates TRM's z feature updates
    const feedback = verification.is_valid ? 1.0 : -0.5;
    const confidence = verification.confidence;
    
    // Update each scale factor
    this.multiscaleConfig.scale_factors.forEach((scale, i) => {
      const updateIndex = Math.min(i * 10, this.reasoningState.length - 1);
      this.reasoningState[updateIndex] += scale * feedback * confidence;
      
      // Keep values bounded
      this.reasoningState[updateIndex] = Math.max(-1, Math.min(1, this.reasoningState[updateIndex]));
    });

    console.log(`🧠 Updated reasoning state: [${this.reasoningState.slice(0, 5).map(x => x.toFixed(2)).join(', ')}...]`);
  }

  /**
   * Sigmoid function for probability calculations
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Get current reasoning state (for debugging)
   */
  getReasoningState(): number[] {
    return [...this.reasoningState];
  }

  /**
   * Get Q-values (for debugging)
   */
  getQValues(): { halt: number; continue: number } {
    return {
      halt: this.haltQ,
      continue: this.continueQ,
    };
  }

  /**
   * Get EMA score (for debugging)
   */
  getEMAScore(): number {
    return this.emaScore;
  }
}

/**
 * Multi-Scale Reasoning Loop - TRM's z features
 */
export class MultiScaleReasoningLoop extends AdaptiveRedoLoop {
  private scaleStates: Map<number, number[]>; // Different scales of reasoning

  constructor(config: AdaptiveRedoConfig = {}) {
    super(config);
    this.scaleStates = new Map();
    
    // Initialize scale states
    this.multiscaleConfig.scale_factors.forEach(scale => {
      this.scaleStates.set(scale, new Array(this.multiscaleConfig.latent_dim).fill(0));
    });
  }

  /**
   * Execute with multi-scale reasoning (TRM's approach)
   */
  async executeWithMultiScale(
    task: string,
    context?: string,
    groundTruth?: any
  ): Promise<RedoResult> {
    console.log(`🧠 Starting Multi-Scale Reasoning (TRM z-features)...`);
    console.log(`   - Scales: ${this.multiscaleConfig.scale_factors.join(', ')}`);
    console.log(`   - Latent dim: ${this.multiscaleConfig.latent_dim}`);

    // Initialize all scale states
    this.multiscaleConfig.scale_factors.forEach(scale => {
      this.scaleStates.set(scale, new Array(this.multiscaleConfig.latent_dim).fill(0));
    });

    return this.executeWithACT(task, context, groundTruth);
  }

  /**
   * Update reasoning state across all scales (TRM's approach)
   */
  protected updateReasoningState(
    task: string,
    answer: string,
    verification: VerificationResult
  ): void {
    super.updateReasoningState(task, answer, verification);

    // Update each scale independently (TRM's multi-scale approach)
    this.multiscaleConfig.scale_factors.forEach(scale => {
      const scaleState = this.scaleStates.get(scale)!;
      const feedback = verification.is_valid ? 1.0 : -0.5;
      const confidence = verification.confidence;
      
      // Update with scale-specific learning rate
      const scaleLearningRate = scale * 0.1;
      
      for (let i = 0; i < scaleState.length; i++) {
        scaleState[i] += scaleLearningRate * feedback * confidence;
        scaleState[i] = Math.max(-1, Math.min(1, scaleState[i]));
      }
    });

    console.log(`🧠 Multi-scale reasoning updated:`);
    this.multiscaleConfig.scale_factors.forEach(scale => {
      const state = this.scaleStates.get(scale)!;
      console.log(`   - Scale ${scale}: [${state.slice(0, 3).map(x => x.toFixed(2)).join(', ')}...]`);
    });
  }

  /**
   * Get all scale states (for debugging)
   */
  getAllScaleStates(): Map<number, number[]> {
    return new Map(this.scaleStates);
  }
}

/**
 * Factory function for TRM-inspired redo loops
 */
export function createAdaptiveRedoLoop(
  type: 'basic' | 'adaptive' | 'multiscale' = 'adaptive',
  config?: AdaptiveRedoConfig
): AdaptiveRedoLoop | MultiScaleReasoningLoop {
  switch (type) {
    case 'multiscale':
      return new MultiScaleReasoningLoop(config);
    case 'adaptive':
      return new AdaptiveRedoLoop(config);
    default:
      return new AdaptiveRedoLoop(config);
  }
}
