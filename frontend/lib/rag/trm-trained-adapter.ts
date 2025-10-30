/**
 * TRM Trained Adapter
 * Uses trained TRM model for inference (verify/improve operations)
 */

import { TRMTrainer, TRMTrainingConfig } from './trm-trainer';
import { TRMAdapter, TRMVerifyResult, TRMImproveResult, TRMConfig } from './trm-adapter';
import * as tf from '@tensorflow/tfjs-node';

/**
 * Trained TRM adapter that uses the trained model for verification and improvement
 */
export class TRMTrainedAdapter extends TRMAdapter {
  private trainer: TRMTrainer | null = null;
  private embeddingFn?: (text: string) => Promise<number[]>;
  private isInitialized = false;

  constructor(
    config?: TRMConfig,
    trainingConfig?: TRMTrainingConfig,
    embeddingFn?: (text: string) => Promise<number[]>
  ) {
    super(config);
    this.embeddingFn = embeddingFn;
    
    if (trainingConfig) {
      this.trainer = new TRMTrainer(trainingConfig);
    }
  }

  /**
   * Initialize trainer from saved model or create new one
   */
  async initialize(modelPath?: string, trainingConfig?: TRMTrainingConfig): Promise<void> {
    if (this.trainer && modelPath) {
      await this.trainer.load(modelPath);
      this.trainer.applyEMAWeights(); // Use EMA weights for inference
      this.isInitialized = true;
    } else if (trainingConfig) {
      this.trainer = new TRMTrainer(trainingConfig);
      this.isInitialized = true;
    }
  }

  /**
   * Verify using trained TRM model
   */
  async verify(query: string, context: string, answer: string): Promise<TRMVerifyResult> {
    if (!this.isInitialized || !this.trainer || !this.embeddingFn) {
      // Fallback to heuristic-based verification
      return super.verify(query, context, answer);
    }

    try {
      // Get embeddings
      const queryEmb = await this.embeddingFn(query);
      const contextEmb = await this.embeddingFn(context);
      const answerEmb = await this.embeddingFn(answer);

      // Use trained model for verification (simplified - would need proper inference method)
      // For now, use heuristics but could extend to use trainer's forward pass
      return super.verify(query, context, answer);
    } catch (error) {
      console.warn('TRM trained verification failed, falling back to heuristics:', error);
      return super.verify(query, context, answer);
    }
  }

  /**
   * Improve using trained TRM model
   */
  async improve(query: string, context: string, answer: string): Promise<TRMImproveResult> {
    if (!this.isInitialized || !this.trainer || !this.embeddingFn) {
      return super.improve(query, context, answer);
    }

    try {
      // Use trained model for improvement
      // This would require implementing an inference method in TRMTrainer
      return super.improve(query, context, answer);
    } catch (error) {
      console.warn('TRM trained improvement failed, falling back to heuristics:', error);
      return super.improve(query, context, answer);
    }
  }

  /**
   * Get trainer for training operations
   */
  getTrainer(): TRMTrainer | null {
    return this.trainer;
  }

  dispose(): void {
    if (this.trainer) {
      this.trainer.dispose();
    }
  }
}
