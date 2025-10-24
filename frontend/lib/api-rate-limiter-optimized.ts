/**
 * Optimized API Rate Limiter with Performance Monitoring
 *
 * Improvements over basic version:
 * - Structured logging instead of console.log
 * - Performance metrics tracking (latency, success rate, fallback rate)
 * - Adaptive exponential backoff
 * - Circuit breaker pattern for failing providers
 * - Provider health scoring
 * - Detailed observability and monitoring hooks
 * - Supabase metrics storage integration ready
 */

import { createLogger } from './walt/logger';

const logger = createLogger('RateLimiter', 'info');

// ============================================================================
// Types
// ============================================================================

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  baseCooldownMs: number;        // Base cooldown, will be adapted
  maxCooldownMs: number;         // Maximum backoff
  circuitBreakerThreshold: number; // Consecutive failures before circuit breaks
}

interface APIProvider {
  name: string;
  apiKey: string;
  config: RateLimitConfig;

  // Request tracking
  lastUsed: number;
  requestCount: number;
  hourlyRequestCount: number;
  minuteRequestCount: number;

  // Rate limiting
  isRateLimited: boolean;
  rateLimitUntil: number;
  currentCooldown: number;       // Adaptive cooldown
  consecutiveFailures: number;

  // Circuit breaker
  circuitBreakerOpen: boolean;
  circuitBreakerUntil: number;

  // Performance metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  avgLatencyMs: number;
  totalCost: number;

  // Health score (0-1, where 1 is perfect)
  healthScore: number;
}

interface RequestMetrics {
  provider: string;
  startTime: number;
  endTime: number;
  latency: number;
  success: boolean;
  statusCode: number;
  error?: string;
  fallbackUsed: boolean;
  cost?: number;
}

interface RateLimiterStats {
  providers: Array<{
    name: string;
    requestCount: number;
    successRate: number;
    avgLatency: number;
    healthScore: number;
    isRateLimited: boolean;
    circuitBreakerOpen: boolean;
    totalCost: number;
  }>;
  globalStats: {
    totalRequests: number;
    totalSuccessful: number;
    totalFailed: number;
    totalRateLimited: number;
    fallbackRate: number;
    avgLatency: number;
    totalCost: number;
  };
  recentMetrics: RequestMetrics[];
}

// ============================================================================
// Optimized Rate Limiter
// ============================================================================

class OptimizedAPIRateLimiter {
  private providers: Map<string, APIProvider> = new Map();
  private metricsHistory: RequestMetrics[] = [];
  private maxMetricsHistory = 1000; // Keep last 1000 requests

  // Reset counters periodically
  private hourlyResetInterval!: NodeJS.Timeout;
  private minuteResetInterval!: NodeJS.Timeout;

  constructor() {
    this.initializeProviders();
    this.startPeriodicResets();
  }

  private initializeProviders() {
    // OpenRouter configuration
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        config: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          burstLimit: 10,
          baseCooldownMs: 1000,
          maxCooldownMs: 60000,
          circuitBreakerThreshold: 5
        },
        lastUsed: 0,
        requestCount: 0,
        hourlyRequestCount: 0,
        minuteRequestCount: 0,
        isRateLimited: false,
        rateLimitUntil: 0,
        currentCooldown: 1000,
        consecutiveFailures: 0,
        circuitBreakerOpen: false,
        circuitBreakerUntil: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitedRequests: 0,
        avgLatencyMs: 0,
        totalCost: 0,
        healthScore: 1.0
      });
    }

    // Perplexity configuration
    if (process.env.PERPLEXITY_API_KEY) {
      this.providers.set('perplexity', {
        name: 'Perplexity',
        apiKey: process.env.PERPLEXITY_API_KEY,
        config: {
          requestsPerMinute: 20,
          requestsPerHour: 500,
          burstLimit: 5,
          baseCooldownMs: 2000,
          maxCooldownMs: 120000,
          circuitBreakerThreshold: 3
        },
        lastUsed: 0,
        requestCount: 0,
        hourlyRequestCount: 0,
        minuteRequestCount: 0,
        isRateLimited: false,
        rateLimitUntil: 0,
        currentCooldown: 2000,
        consecutiveFailures: 0,
        circuitBreakerOpen: false,
        circuitBreakerUntil: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitedRequests: 0,
        avgLatencyMs: 0,
        totalCost: 0,
        healthScore: 1.0
      });
    }

    // Ollama local fallback
    this.providers.set('ollama', {
      name: 'Ollama Local',
      apiKey: 'local',
      config: {
        requestsPerMinute: 1000,
        requestsPerHour: 10000,
        burstLimit: 50,
        baseCooldownMs: 100,
        maxCooldownMs: 5000,
        circuitBreakerThreshold: 10
      },
      lastUsed: 0,
      requestCount: 0,
      hourlyRequestCount: 0,
      minuteRequestCount: 0,
      isRateLimited: false,
      rateLimitUntil: 0,
      currentCooldown: 100,
      consecutiveFailures: 0,
      circuitBreakerOpen: false,
      circuitBreakerUntil: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      avgLatencyMs: 0,
      totalCost: 0,
      healthScore: 1.0
    });

    logger.info('Rate limiter initialized', {
      providers: Array.from(this.providers.keys())
    });
  }

  private startPeriodicResets() {
    // Reset minute counters every minute
    this.minuteResetInterval = setInterval(() => {
      for (const provider of this.providers.values()) {
        provider.minuteRequestCount = 0;
      }
      logger.debug('Minute counters reset');
    }, 60000);

    // Reset hourly counters every hour
    this.hourlyResetInterval = setInterval(() => {
      for (const provider of this.providers.values()) {
        provider.hourlyRequestCount = 0;
      }
      logger.debug('Hourly counters reset');
    }, 3600000);
  }

  /**
   * Get the best available provider using health-based scoring
   */
  private getBestProvider(preferredProvider?: string): APIProvider | null {
    const now = Date.now();

    // Reset rate limits and circuit breakers if cooldown period has passed
    for (const provider of this.providers.values()) {
      if (provider.isRateLimited && now > provider.rateLimitUntil) {
        provider.isRateLimited = false;
        provider.currentCooldown = provider.config.baseCooldownMs; // Reset cooldown
        logger.info('Rate limit reset', { provider: provider.name });
      }

      if (provider.circuitBreakerOpen && now > provider.circuitBreakerUntil) {
        provider.circuitBreakerOpen = false;
        provider.consecutiveFailures = 0;
        logger.info('Circuit breaker reset', { provider: provider.name });
      }
    }

    // Try preferred provider first
    if (preferredProvider) {
      const preferred = this.providers.get(preferredProvider);
      if (preferred && !preferred.isRateLimited && !preferred.circuitBreakerOpen) {
        // Check if within rate limits
        if (this.isWithinRateLimits(preferred)) {
          return preferred;
        }
      }
    }

    // Find best available provider based on health score
    const availableProviders = Array.from(this.providers.values())
      .filter(p => !p.isRateLimited && !p.circuitBreakerOpen && this.isWithinRateLimits(p))
      .sort((a, b) => {
        // Sort by health score (higher is better)
        return b.healthScore - a.healthScore;
      });

    return availableProviders[0] || null;
  }

  /**
   * Check if provider is within rate limits
   */
  private isWithinRateLimits(provider: APIProvider): boolean {
    return (
      provider.minuteRequestCount < provider.config.requestsPerMinute &&
      provider.hourlyRequestCount < provider.config.requestsPerHour
    );
  }

  /**
   * Update provider health score based on recent performance
   */
  private updateHealthScore(provider: APIProvider) {
    const successRate = provider.totalRequests > 0
      ? provider.successfulRequests / provider.totalRequests
      : 1.0;

    const rateLimitRate = provider.totalRequests > 0
      ? provider.rateLimitedRequests / provider.totalRequests
      : 0;

    const failureRate = provider.totalRequests > 0
      ? provider.failedRequests / provider.totalRequests
      : 0;

    // Health score formula (0-1 scale)
    provider.healthScore =
      successRate * 0.5 +                    // 50% weight on success
      (1 - rateLimitRate) * 0.3 +            // 30% weight on avoiding rate limits
      (1 - failureRate) * 0.2;               // 20% weight on avoiding failures

    logger.debug('Health score updated', {
      provider: provider.name,
      healthScore: provider.healthScore.toFixed(3),
      successRate: successRate.toFixed(3)
    });
  }

  /**
   * Make an API request with intelligent provider selection
   */
  async makeRequest(
    requestFn: (provider: APIProvider) => Promise<Response>,
    preferredProvider?: string,
    fallbackProviders: string[] = ['ollama'],
    options?: {
      cost?: number;
      timeout?: number;
    }
  ): Promise<{ response: Response; provider: APIProvider; metrics: RequestMetrics }> {

    const startTime = Date.now();
    let fallbackUsed = false;

    // Try preferred provider first
    let provider = this.getBestProvider(preferredProvider);

    if (!provider) {
      // Try fallback providers
      for (const fallbackName of fallbackProviders) {
        provider = this.getBestProvider(fallbackName);
        if (provider) {
          fallbackUsed = true;
          logger.info('Using fallback provider', {
            preferred: preferredProvider,
            fallback: provider.name
          });
          break;
        }
      }
    }

    if (!provider) {
      throw new Error('All API providers are unavailable. Please try again later.');
    }

    // Update provider counters
    provider.lastUsed = startTime;
    provider.requestCount++;
    provider.totalRequests++;
    provider.minuteRequestCount++;
    provider.hourlyRequestCount++;

    let success = false;
    let statusCode = 0;
    let error: string | undefined;

    try {
      logger.info('Making API request', {
        provider: provider.name,
        requestNumber: provider.requestCount
      });

      // Make the request
      const response = await requestFn(provider);
      statusCode = response.status;

      // Check for rate limiting
      if (response.status === 429) {
        provider.rateLimitedRequests++;
        provider.failedRequests++;
        provider.consecutiveFailures++;

        // Adaptive exponential backoff
        provider.currentCooldown = Math.min(
          provider.currentCooldown * 2,
          provider.config.maxCooldownMs
        );

        provider.isRateLimited = true;
        provider.rateLimitUntil = startTime + provider.currentCooldown;

        logger.warn('Provider rate limited', {
          provider: provider.name,
          cooldown: provider.currentCooldown,
          consecutiveFailures: provider.consecutiveFailures
        });

        // Circuit breaker check
        if (provider.consecutiveFailures >= provider.config.circuitBreakerThreshold) {
          provider.circuitBreakerOpen = true;
          provider.circuitBreakerUntil = startTime + (provider.currentCooldown * 5);
          logger.error('Circuit breaker opened', {
            provider: provider.name,
            failures: provider.consecutiveFailures
          });
        }

        // Try with fallback provider
        if (fallbackProviders.length > 0 && !fallbackUsed) {
          logger.info('Attempting fallback', { fallback: fallbackProviders[0] });
          return this.makeRequest(requestFn, fallbackProviders[0], fallbackProviders.slice(1), options);
        }

        error = 'Rate limited and no fallbacks available';
        throw new Error(error);
      }

      // Success
      provider.successfulRequests++;
      provider.consecutiveFailures = 0; // Reset on success
      provider.currentCooldown = provider.config.baseCooldownMs; // Reset cooldown
      success = true;

      // Update latency average
      const latency = Date.now() - startTime;
      provider.avgLatencyMs = (provider.avgLatencyMs * (provider.successfulRequests - 1) + latency) / provider.successfulRequests;

      // Update cost
      if (options?.cost) {
        provider.totalCost += options.cost;
      }

      // Update health score
      this.updateHealthScore(provider);

      // Record metrics
      const metrics: RequestMetrics = {
        provider: provider.name,
        startTime,
        endTime: Date.now(),
        latency,
        success: true,
        statusCode,
        fallbackUsed,
        cost: options?.cost
      };

      this.recordMetrics(metrics);

      logger.info('Request successful', {
        provider: provider.name,
        latency,
        healthScore: provider.healthScore.toFixed(3)
      });

      return { response, provider, metrics };

    } catch (err) {
      provider.failedRequests++;
      provider.consecutiveFailures++;
      error = err instanceof Error ? err.message : String(err);

      logger.error('Request failed', {
        provider: provider.name,
        error,
        consecutiveFailures: provider.consecutiveFailures
      });

      // Update health score
      this.updateHealthScore(provider);

      // Mark provider as temporarily unavailable
      provider.isRateLimited = true;
      provider.rateLimitUntil = startTime + provider.currentCooldown;

      // Circuit breaker check
      if (provider.consecutiveFailures >= provider.config.circuitBreakerThreshold) {
        provider.circuitBreakerOpen = true;
        provider.circuitBreakerUntil = startTime + (provider.currentCooldown * 5);
        logger.error('Circuit breaker opened', {
          provider: provider.name,
          failures: provider.consecutiveFailures
        });
      }

      // Record metrics
      const metrics: RequestMetrics = {
        provider: provider.name,
        startTime,
        endTime: Date.now(),
        latency: Date.now() - startTime,
        success: false,
        statusCode,
        error,
        fallbackUsed
      };

      this.recordMetrics(metrics);

      // Try with fallback provider
      if (fallbackProviders.length > 0 && !fallbackUsed) {
        logger.info('Attempting fallback after failure', { fallback: fallbackProviders[0] });
        return this.makeRequest(requestFn, fallbackProviders[0], fallbackProviders.slice(1), options);
      }

      throw err;
    }
  }

  /**
   * Record request metrics
   */
  private recordMetrics(metrics: RequestMetrics) {
    this.metricsHistory.push(metrics);

    // Keep only recent metrics
    if (this.metricsHistory.length > this.maxMetricsHistory) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): RateLimiterStats {
    const providerStats = Array.from(this.providers.values()).map(p => ({
      name: p.name,
      requestCount: p.totalRequests,
      successRate: p.totalRequests > 0 ? p.successfulRequests / p.totalRequests : 0,
      avgLatency: p.avgLatencyMs,
      healthScore: p.healthScore,
      isRateLimited: p.isRateLimited,
      circuitBreakerOpen: p.circuitBreakerOpen,
      totalCost: p.totalCost
    }));

    const totalRequests = this.metricsHistory.length;
    const totalSuccessful = this.metricsHistory.filter(m => m.success).length;
    const totalFailed = this.metricsHistory.filter(m => !m.success).length;
    const totalRateLimited = Array.from(this.providers.values()).reduce(
      (sum, p) => sum + p.rateLimitedRequests, 0
    );
    const fallbackUsed = this.metricsHistory.filter(m => m.fallbackUsed).length;
    const avgLatency = totalRequests > 0
      ? this.metricsHistory.reduce((sum, m) => sum + m.latency, 0) / totalRequests
      : 0;
    const totalCost = Array.from(this.providers.values()).reduce(
      (sum, p) => sum + p.totalCost, 0
    );

    return {
      providers: providerStats,
      globalStats: {
        totalRequests,
        totalSuccessful,
        totalFailed,
        totalRateLimited,
        fallbackRate: totalRequests > 0 ? fallbackUsed / totalRequests : 0,
        avgLatency,
        totalCost
      },
      recentMetrics: this.metricsHistory.slice(-100) // Last 100 requests
    };
  }

  /**
   * Reset all rate limits and health scores
   */
  resetAll() {
    for (const provider of this.providers.values()) {
      provider.isRateLimited = false;
      provider.requestCount = 0;
      provider.rateLimitUntil = 0;
      provider.currentCooldown = provider.config.baseCooldownMs;
      provider.consecutiveFailures = 0;
      provider.circuitBreakerOpen = false;
      provider.circuitBreakerUntil = 0;
      provider.healthScore = 1.0;
    }

    this.metricsHistory = [];

    logger.info('All rate limits and metrics reset');
  }

  /**
   * Cleanup timers on destruction
   */
  destroy() {
    clearInterval(this.hourlyResetInterval);
    clearInterval(this.minuteResetInterval);
    logger.info('Rate limiter destroyed');
  }
}

// Export singleton instance
export const optimizedRateLimiter = new OptimizedAPIRateLimiter();

/**
 * Helper function to make rate-limited requests
 */
export async function makeOptimizedRateLimitedRequest(
  requestFn: (provider: APIProvider) => Promise<Response>,
  preferredProvider?: string,
  fallbackProviders: string[] = ['ollama'],
  options?: { cost?: number; timeout?: number }
) {
  return optimizedRateLimiter.makeRequest(requestFn, preferredProvider, fallbackProviders, options);
}

/**
 * Get comprehensive rate limiter statistics
 */
export function getOptimizedRateLimiterStats() {
  return optimizedRateLimiter.getStats();
}

/**
 * Reset all rate limits and metrics
 */
export function resetOptimizedRateLimiter() {
  optimizedRateLimiter.resetAll();
}

// Export types for use in other modules
export type { APIProvider, RateLimiterStats, RequestMetrics };
