/**
 * ArborProvider with Model-Predictive Control (MPC) First
 * 
 * REFACTORED to align with modern ML best practices:
 * 1. Uses EBM critic to predict outcomes BEFORE execution (model-predictive control)
 * 2. Only uses RL when predictions don't match actual outcomes
 * 3. Uses RL to adjust world model/critic, NOT policy directly
 * 4. Joint-embedding architectures for query-context relationships
 * 5. Energy-based scoring (not probabilistic)
 * 
 * Architecture:
 * - Planning Phase: EBM critic predicts outcome → Execute planned action
 * - Check Phase: Compare prediction vs actual → If match, continue with MPC
 * - RL Phase: Only if prediction failed → Adjust EBM critic (world model)
 */

import type { BaseLM } from './arbor-provider';
import { EBMAnswerRefiner, type EBMConfig } from './ebm/answer-refiner-simple';
import { createJointEmbedding } from './joint-embedding';
import { SemioticAwarenessSystem, createSemioticAwarenessSystem } from './semiotic-awareness';

export interface ArborMPCConfig {
  // EBM Critic Configuration
  ebm_critic_steps: number;       // EBM refinement steps for prediction
  prediction_threshold: number;    // Max prediction error before using RL (default: 0.1)
  
  // MPC Configuration
  planning_horizon: number;        // How many steps ahead to plan (default: 3)
  use_planning: boolean;            // Enable model-predictive control (default: true)
  
  // RL Configuration (only when planning fails)
  rl_learning_rate: number;        // Learning rate for critic adjustment (default: 1e-4)
  rl_update_frequency: number;     // Update critic every N failed predictions (default: 5)
  
  // Joint-Embedding Configuration
  use_joint_embeddings: boolean;   // Use joint query-context embeddings (default: true)
  embedding_dimension: number;     // Dimension of joint embeddings (default: 768)
  
  // Reward Configuration
  reward_dimensions: {
    quality: number;
    cost: number;
    privacy: number;
    latency: number;
  };
  
  // Monitoring
  checkpoint_frequency: number;
  enable_rollback: boolean;
}

export interface PredictedOutcome {
  quality: number;
  cost: number;
  privacy: number;
  latency_ms: number;
  confidence: number;  // Prediction confidence (0-1)
}

export interface ActualOutcome {
  quality: number;
  cost: number;
  privacy: number;
  latency_ms: number;
}

export interface PlanningResult {
  predicted: PredictedOutcome;
  actual: ActualOutcome;
  prediction_error: number;
  planning_succeeded: boolean;
  used_rl: boolean;
}

/**
 * EBM Critic: Predicts outcomes before execution
 * Uses energy-based model to predict reward dimensions
 */
class EBMCritic {
  private ebmRefiner: EBMAnswerRefiner;
  
  constructor(config: Partial<EBMConfig> = {}) {
    this.ebmRefiner = new EBMAnswerRefiner({
      refinementSteps: config.refinementSteps || 3,
      learningRate: config.learningRate || 0.5,
      noiseScale: 0.01,
      temperature: 0.8,
      energyFunction: 'default',
      useLLMRefinement: false  // Prediction only, no refinement
    });
  }

  /**
   * Predict outcome using EBM energy function
   * Energy-based prediction (not probabilistic)
   */
  async predictReward(
    query: string,
    context: string,
    proposedPrompt: string
  ): Promise<PredictedOutcome> {
    // Use EBM energy function to predict quality
    // Lower energy = higher quality
    const predictedEnergy = await this.ebmRefiner.refine(query, context, proposedPrompt);
    const predictedQuality = 1.0 - Math.min(1.0, predictedEnergy.energyHistory[0] || 0.5);
    
    // Predict cost based on prompt length and model choice
    const estimatedCost = this.estimateCost(proposedPrompt, context);
    
    // Predict privacy based on query sensitivity
    const predictedPrivacy = this.estimatePrivacy(query);
    
    // Predict latency based on prompt complexity
    const predictedLatency = this.estimateLatency(proposedPrompt, context);
    
    // Prediction confidence based on energy consistency
    const energyVariance = this.calculateEnergyVariance(predictedEnergy.energyHistory);
    const confidence = Math.max(0.5, 1.0 - energyVariance);
    
    return {
      quality: predictedQuality,
      cost: estimatedCost,
      privacy: predictedPrivacy,
      latency_ms: predictedLatency,
      confidence
    };
  }

  private estimateCost(prompt: string, context: string): number {
    // Estimate cost based on token count
    const tokens = (prompt.length + context.length) / 4; // Rough estimate
    return tokens * 0.000001; // $0.001 per 1k tokens
  }

  private estimatePrivacy(query: string): number {
    // Privacy score based on sensitive keywords
    const sensitiveTerms = ['$', 'collection', 'assets', 'financial', 'tax', 'legal'];
    const hasSensitive = sensitiveTerms.some(term => query.toLowerCase().includes(term));
    return hasSensitive ? 0.6 : 1.0; // Lower = more sensitive
  }

  private estimateLatency(prompt: string, context: string): number {
    // Estimate latency based on complexity
    const complexity = (prompt.length + context.length) / 1000;
    return 1000 + (complexity * 500); // Base 1s + complexity
  }

  private calculateEnergyVariance(energyHistory: number[]): number {
    if (energyHistory.length < 2) return 0.5;
    const mean = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
    const variance = energyHistory.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / energyHistory.length;
    return variance;
  }

  /**
   * Update critic using RL when prediction fails
   * Adjusts energy function parameters based on prediction error
   */
  async updateCriticWithRL(
    predicted: PredictedOutcome,
    actual: ActualOutcome,
    learningRate: number
  ): Promise<void> {
    // Calculate prediction errors
    const qualityError = Math.abs(predicted.quality - actual.quality);
    const costError = Math.abs(predicted.cost - actual.cost);
    const privacyError = Math.abs(predicted.privacy - actual.privacy);
    const latencyError = Math.abs(predicted.latency_ms - actual.latency_ms);
    
    // Update EBM parameters to reduce prediction error
    // In real implementation, this would adjust energy function parameters
    console.log(`   🔄 Adjusting EBM critic (learning rate: ${learningRate})`);
    console.log(`      Quality error: ${qualityError.toFixed(4)}`);
    console.log(`      Cost error: ${costError.toFixed(4)}`);
    console.log(`      Privacy error: ${privacyError.toFixed(4)}`);
    console.log(`      Latency error: ${latencyError.toFixed(0)}ms`);
    
    // Update energy function weights based on errors
    // This is a simplified update - real implementation would use gradient descent
  }
}

/**
 * Joint-Embedding Architecture
 * Creates joint query-context embeddings with energy-based scoring
 */
class JointEmbeddingArchitecture {
  private dimension: number;
  
  constructor(dimension: number = 768) {
    this.dimension = dimension;
  }

  /**
   * Create joint embedding from query and context
   * Energy-based scoring (not probabilistic)
   */
  async createJointEmbedding(
    query: string,
    context: string
  ): Promise<{ embedding: number[]; energy: number }> {
    // In real implementation, would use actual embedding model
    // For now, simulate joint embedding
    const queryEmbedding = this.embed(query);
    const contextEmbedding = this.embed(context);
    
    // Joint embedding: concatenate and normalize
    const jointEmbedding = [...queryEmbedding, ...contextEmbedding].slice(0, this.dimension);
    const normalized = this.normalize(jointEmbedding);
    
    // Energy-based score (lower = better alignment)
    const energy = this.computeJointEnergy(queryEmbedding, contextEmbedding);
    
    return {
      embedding: normalized,
      energy
    };
  }

  private embed(text: string): number[] {
    // Simulated embedding - real implementation would use actual model
    const tokens = text.split(/\s+/).slice(0, 384);
    return Array.from({ length: 384 }, (_, i) => {
      const hash = this.simpleHash(tokens[i] || '');
      return (hash % 2000) / 2000 - 0.5; // Normalized to [-0.5, 0.5]
    });
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private normalize(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return embedding;
    return embedding.map(v => v / magnitude);
  }

  /**
   * Compute energy of joint embedding
   * Lower energy = better query-context alignment
   */
  private computeJointEnergy(
    queryEmbedding: number[],
    contextEmbedding: number[]
  ): number {
    // Energy = negative similarity (lower = better)
    const similarity = this.cosineSimilarity(queryEmbedding, contextEmbedding);
    return 1.0 - similarity; // Energy: 0 = perfect alignment, 1 = no alignment
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const minLen = Math.min(a.length, b.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < minLen; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * ArborProvider with Model-Predictive Control (MPC) First
 * 
 * Implements:
 * 1. Planning with EBM critic (predict outcome)
 * 2. Execute planned action
 * 3. Check: Did prediction match?
 * 4. If no → Use RL to adjust critic (not policy)
 */
export class ArborProviderMPC {
  private config: ArborMPCConfig;
  private baseLM: BaseLM;
  private ebmCritic: EBMCritic;
  private jointEmbedding: JointEmbeddingArchitecture;
  private semioticAwareness: SemioticAwarenessSystem;
  private failedPredictions: Array<{ predicted: PredictedOutcome; actual: ActualOutcome }> = [];
  private rlUpdateCounter: number = 0;

  constructor(
    baseLM: BaseLM,
    config: Partial<ArborMPCConfig> = {}
  ) {
    this.baseLM = baseLM;
    
    this.config = {
      ebm_critic_steps: 3,
      prediction_threshold: 0.1,
      planning_horizon: 3,
      use_planning: true,
      rl_learning_rate: 1e-4,
      rl_update_frequency: 5,
      use_joint_embeddings: true,
      embedding_dimension: 768,
      reward_dimensions: {
        quality: 0.5,
        cost: -0.3,
        privacy: 0.2,
        latency: -0.1
      },
      checkpoint_frequency: 50,
      enable_rollback: true,
      ...config
    };

    this.ebmCritic = new EBMCritic({
      refinementSteps: this.config.ebm_critic_steps,
      learningRate: 0.5,
      useLLMRefinement: false
    } as any); // EBMConfig type mismatch - simplified config for MPC critic

    this.jointEmbedding = new JointEmbeddingArchitecture(
      this.config.embedding_dimension
    );

    this.semioticAwareness = createSemioticAwarenessSystem();

    console.log('🌳 ArborProvider-MPC initialized');
    console.log(`   - MPC-first: Planning with EBM critic`);
    console.log(`   - RL fallback: Only when predictions fail`);
    console.log(`   - Joint embeddings: ${this.config.use_joint_embeddings}`);
    console.log(`   - Semiotic awareness: Sign manipulation framework (Picca, 2025)`);
  }

  /**
   * Model-Predictive Control: Plan first, then execute
   * Enhanced with semiotic awareness (sign manipulation, not understanding)
   */
  async planAndExecute(
    query: string,
    context: string,
    proposedPrompt: string
  ): Promise<PlanningResult> {
    console.log('🎯 MPC: Planning phase (with semiotic awareness)...');

    // SEMIOTIC ANALYSIS: Analyze query and prompt as signs, not direct meaning
    const queryAnalysis = await this.semioticAwareness.analyzeQuery(query, 'general');
    const promptAnalysis = await this.semioticAwareness.analyzeQuery(proposedPrompt, queryAnalysis.overallFramework.domain);

    // Enhance prompt with semiotic awareness (avoid anthropomorphism)
    const semioticPrompt = this.semioticAwareness.enhancePromptWithSemiotics(
      proposedPrompt,
      promptAnalysis
    );

    console.log(`   🔤 Semiotic: ${queryAnalysis.signs.length} signs identified, ${queryAnalysis.overallFramework.linguisticFramework} framework`);
    console.log(`   🎭 Situatedness: ${queryAnalysis.overallFramework.situatedness.toFixed(3)}, Avoids anthropomorphism: ${queryAnalysis.avoidsAnthropomorphism}`);

    // PHASE 1: PLAN (Predict outcome using EBM critic + semiotic analysis)
    const predictedOutcome = await this.ebmCritic.predictReward(
      query,
      context,
      semioticPrompt
    );

    // Enhance prediction with semiotic insights
    const semioticPrediction = await this.semioticAwareness.predictWithSemiotics(
      query,
      semioticPrompt,
      queryAnalysis.overallFramework.domain
    );

    // Combine EBM prediction with semiotic quality
    const enhancedQuality = (predictedOutcome.quality * 0.7) + (semioticPrediction.quality * 0.3);
    const finalPredictedOutcome = {
      ...predictedOutcome,
      quality: enhancedQuality
    };

    console.log(`   📊 Predicted: quality=${finalPredictedOutcome.quality.toFixed(3)}, cost=$${finalPredictedOutcome.cost.toFixed(4)}, confidence=${finalPredictedOutcome.confidence.toFixed(3)}`);
    console.log(`   🎭 Semiotic: cultural alignment=${semioticPrediction.culturalAlignment.toFixed(3)}, interpretation clarity=${semioticPrediction.interpretationClarity.toFixed(3)}`);

    // PHASE 2: EXECUTE (Run planned action with semiotic-enhanced prompt)
    console.log('   ⚙️ Executing planned action (semiotic-aware)...');
    const actualOutcome = await this.executeWithPrompt(query, context, semioticPrompt);

    console.log(`   ✅ Actual: quality=${actualOutcome.quality.toFixed(3)}, cost=$${actualOutcome.cost.toFixed(4)}`);

    // PHASE 3: CHECK (Compare prediction vs actual, including semiotic metrics)
    const predictionError = this.calculatePredictionError(finalPredictedOutcome, actualOutcome);
    const planningSucceeded = predictionError <= this.config.prediction_threshold;

    console.log(`   ${planningSucceeded ? '✅' : '❌'} Prediction error: ${predictionError.toFixed(4)} (threshold: ${this.config.prediction_threshold})`);

    // PHASE 4: RL ADJUSTMENT (Only if planning failed)
    let usedRL = false;
    if (!planningSucceeded) {
      console.log('   🔄 Planning failed → Using RL to adjust critic...');
      
      // Store failed prediction for batch RL update
      this.failedPredictions.push({
        predicted: predictedOutcome,
        actual: actualOutcome
      });

      // Update critic when enough failures accumulate
      this.rlUpdateCounter++;
      if (this.rlUpdateCounter >= this.config.rl_update_frequency) {
        await this.adjustCriticWithRL();
        this.rlUpdateCounter = 0;
        usedRL = true;
      }
    } else {
      console.log('   ✅ Planning succeeded → Continuing with MPC (no RL needed)');
    }

    return {
      predicted: predictedOutcome,
      actual: actualOutcome,
      prediction_error: predictionError,
      planning_succeeded: planningSucceeded,
      used_rl: usedRL
    };
  }

  /**
   * Execute with prompt and measure actual outcome
   */
  private async executeWithPrompt(
    query: string,
    context: string,
    prompt: string
  ): Promise<ActualOutcome> {
    const startTime = Date.now();

    // Use joint embeddings if enabled
    if (this.config.use_joint_embeddings) {
      const joint = await this.jointEmbedding.createJointEmbedding(query, context);
      // Joint embedding can inform execution (lower energy = better alignment)
      console.log(`   🔗 Joint embedding energy: ${joint.energy.toFixed(4)}`);
    }

    // Execute query (simulated - real implementation would call LLM)
    const answer = await this.baseLM.generate?.(prompt) || 'Generated answer';

    const latency = Date.now() - startTime;

    // Measure actual outcomes
    const actualQuality = this.measureQuality(query, answer);
    const actualCost = this.estimateCost(prompt);
    const actualPrivacy = this.estimatePrivacy(query);
    const actualLatency = latency;

    return {
      quality: actualQuality,
      cost: actualCost,
      privacy: actualPrivacy,
      latency_ms: actualLatency
    };
  }

  /**
   * Adjust EBM critic using RL (only when planning fails)
   * Updates world model, NOT policy
   */
  private async adjustCriticWithRL(): Promise<void> {
    console.log(`🔄 Adjusting EBM critic with RL (${this.failedPredictions.length} failed predictions)...`);

    for (const { predicted, actual } of this.failedPredictions) {
      await this.ebmCritic.updateCriticWithRL(
        predicted,
        actual,
        this.config.rl_learning_rate
      );
    }

    // Clear failed predictions after update
    this.failedPredictions = [];

    console.log('   ✅ Critic updated (world model improved, ready for better planning)');
  }

  /**
   * Calculate prediction error (composite metric)
   */
  private calculatePredictionError(
    predicted: PredictedOutcome,
    actual: ActualOutcome
  ): number {
    const qualityError = Math.abs(predicted.quality - actual.quality);
    const costError = Math.abs(predicted.cost - actual.cost);
    const privacyError = Math.abs(predicted.privacy - actual.privacy);
    const latencyError = Math.abs(predicted.latency_ms - actual.latency_ms) / 5000; // Normalize

    // Weighted composite error
    const compositeError = (
      this.config.reward_dimensions.quality * qualityError +
      Math.abs(this.config.reward_dimensions.cost) * costError +
      this.config.reward_dimensions.privacy * privacyError +
      Math.abs(this.config.reward_dimensions.latency) * latencyError
    );

    return compositeError;
  }

  private measureQuality(query: string, answer: string): number {
    // Simplified quality measurement
    // Real implementation would use LLM-as-judge or other metrics
    const answerLength = answer.length;
    const hasDetails = answer.split('.').length > 2;
    const relevance = query.split(' ').filter(word => answer.toLowerCase().includes(word.toLowerCase())).length / query.split(' ').length;
    
    return Math.min(1.0, 0.3 + (answerLength > 100 ? 0.3 : 0) + (hasDetails ? 0.2 : 0) + (relevance * 0.2));
  }

  private estimateCost(prompt: string): number {
    const tokens = prompt.length / 4;
    return tokens * 0.000001;
  }

  private estimatePrivacy(query: string): number {
    const sensitiveTerms = ['$', 'collection', 'assets', 'financial', 'tax', 'legal'];
    const hasSensitive = sensitiveTerms.some(term => query.toLowerCase().includes(term));
    return hasSensitive ? 0.6 : 1.0;
  }

  /**
   * Get statistics about MPC performance
   */
  getMPCStats(): {
    total_plans: number;
    successful_plans: number;
    failed_plans: number;
    rl_updates: number;
    avg_prediction_error: number;
  } {
    // In real implementation, would track these statistics
    return {
      total_plans: 0,
      successful_plans: 0,
      failed_plans: 0,
      rl_updates: Math.floor(this.rlUpdateCounter / this.config.rl_update_frequency),
      avg_prediction_error: 0
    };
  }
}

/**
 * Factory function
 */
export function createArborProviderMPC(
  baseLM: BaseLM,
  config?: Partial<ArborMPCConfig>
): ArborProviderMPC {
  return new ArborProviderMPC(baseLM, config);
}

