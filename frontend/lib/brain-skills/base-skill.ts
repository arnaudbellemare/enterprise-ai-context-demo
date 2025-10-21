/**
 * Base Skill Class
 *
 * Abstract base class for all brain skills.
 * Provides common functionality like caching, metrics, error handling.
 */

import { BrainSkill, BrainContext, SkillResult } from './types';
import { getSkillCache } from './skill-cache';
import { getMetricsTracker, hashQuery } from './skill-metrics';

export abstract class BaseSkill implements BrainSkill {
  abstract name: string;
  abstract description: string;
  abstract priority: number;

  dependencies?: string[];
  maxParallel?: number;
  timeout: number = 30000; // 30 seconds default
  retryAttempts: number = 1;
  cacheEnabled: boolean = true;
  cacheTTL: number = 3600000; // 1 hour default

  /**
   * Abstract activation function - must be implemented by each skill
   */
  abstract activation(context: BrainContext): boolean;

  /**
   * Abstract execute implementation - must be implemented by each skill
   */
  protected abstract executeImplementation(
    query: string,
    context: BrainContext
  ): Promise<SkillResult>;

  /**
   * Execute skill with caching, metrics, and error handling
   */
  async execute(query: string, context: BrainContext): Promise<SkillResult> {
    const startTime = Date.now();
    const cache = getSkillCache();
    const metrics = getMetricsTracker();
    const queryHash = hashQuery(query, context.domain);

    try {
      // Try cache first if enabled
      if (this.cacheEnabled) {
        const cached = cache.get(this.name, query, context, this.cacheTTL);
        if (cached) {
          const duration = Date.now() - startTime;
          await metrics.track(this.name, duration, true, {
            queryHash,
            domain: context.domain,
            cacheHit: true
          });
          return cached;
        }
      }

      // Execute with timeout
      const timeoutPromise = new Promise<SkillResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${this.timeout}ms`)), this.timeout)
      );

      const result = await Promise.race([
        this.executeImplementation(query, context),
        timeoutPromise
      ]);

      // Cache successful result
      if (this.cacheEnabled && result.success) {
        cache.set(this.name, query, result, context);
      }

      // Track metrics
      const duration = Date.now() - startTime;
      await metrics.track(this.name, duration, result.success, {
        queryHash,
        domain: context.domain,
        cost: result.metadata.cost,
        qualityScore: result.metadata.quality,
        cacheHit: false
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Track failure
      await metrics.track(this.name, duration, false, {
        queryHash,
        domain: context.domain
      });

      // Return fallback result
      return this.createFallbackResult(error.message);
    }
  }

  /**
   * Create a fallback result for errors
   */
  protected createFallbackResult(errorMessage: string): SkillResult {
    return {
      success: false,
      fallback: true,
      message: `${this.name} unavailable: ${errorMessage}`,
      metadata: {
        processingTime: 0,
        fallback: true
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(
    data: any,
    metadata: Partial<SkillResult['metadata']> = {}
  ): SkillResult {
    return {
      success: true,
      data,
      result: data,
      metadata: {
        processingTime: metadata.processingTime || 0,
        model: metadata.model,
        cost: metadata.cost,
        quality: metadata.quality,
        tokensUsed: metadata.tokensUsed,
        cacheHit: false,
        fallback: false
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper to make fetch requests with error handling
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = this.timeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response;
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }
}
