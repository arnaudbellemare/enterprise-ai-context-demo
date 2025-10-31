/**
 * EBM Energy Calculation Service
 * 
 * ElizaOS Service pattern for long-running energy computation.
 * Handles energy calculations, refinement orchestration, and caching.
 */

import { Service, Runtime } from '../eliza-patterns/types';
import { EBMAnswerRefiner } from './answer-refiner-simple';

export class EBMEnergyService extends Service {
  static serviceName = 'ebm-energy-service';
  capabilityDescription = 'Manages energy-based refinement: calculations, refinement orchestration, and result caching';

  private energyCache: Map<string, number> = new Map();
  private isRunning = false;

  static async start(runtime: Runtime): Promise<Service> {
    const service = new EBMEnergyService();
    service.isRunning = true;
    console.log('✅ EBM Energy Service started');
    return service;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.energyCache.clear();
    console.log('✅ EBM Energy Service stopped');
  }

  /**
   * Compute energy for answer (with caching)
   */
  async computeEnergy(
    query: string,
    context: string,
    answer: string,
    domain: string = 'general'
  ): Promise<number> {
    // Generate cache key
    const cacheKey = `${domain}:${query.substring(0, 50)}:${answer.substring(0, 50)}`;
    
    // Check cache
    if (this.energyCache.has(cacheKey)) {
      return this.energyCache.get(cacheKey)!;
    }

    // Compute energy
    const refiner = new EBMAnswerRefiner({
      refinementSteps: 0, // Just compute, don't refine
      energyFunction: domain,
      learningRate: 0.5,
      noiseScale: 0.01,
      temperature: 0.8
    });

    const answerStr = answer || '';
    const queryStr = query || '';
    const contextStr = context || '';
    const energy = (refiner as any).computeEnergy?.(answerStr, queryStr, contextStr) || 1.0;

    // Cache result (limit cache size)
    if (this.energyCache.size > 1000) {
      // Remove oldest entries (simple FIFO)
      const firstKey = this.energyCache.keys().next().value;
      if (firstKey) {
        this.energyCache.delete(firstKey);
      }
    }
    this.energyCache.set(cacheKey, energy);

    return energy;
  }

  /**
   * Refine answer using energy-based optimization
   */
  async refineAnswer(
    query: string,
    context: string,
    initialAnswer: string,
    domain: string = 'general',
    refinementSteps: number = 3
  ): Promise<{
    refinedAnswer: string;
    energyHistory: number[];
    improvement: number;
    converged: boolean;
    stepsCompleted: number;
  }> {
    const refiner = new EBMAnswerRefiner({
      refinementSteps,
      learningRate: 0.5,
      noiseScale: 0.01,
      temperature: 0.8,
      energyFunction: domain,
      earlyStoppingThreshold: 0.001
    });

    const result = await refiner.refine(query, context, initialAnswer);
    
    return {
      refinedAnswer: result.refinedAnswer,
      energyHistory: result.energyHistory,
      improvement: result.improvement,
      converged: result.converged,
      stepsCompleted: result.stepsCompleted
    };
  }

  /**
   * Check if service is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Clear energy cache
   */
  clearCache(): void {
    this.energyCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.energyCache.size,
      maxSize: 1000
    };
  }
}

