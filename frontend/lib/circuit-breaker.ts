/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by stopping requests to failing services.
 * Implements half-open state for recovery testing.
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;        // Open circuit after N failures
  resetTimeout: number;             // Time before attempting reset (ms)
  halfOpenMaxAttempts: number;     // Max attempts in half-open state
  successThreshold: number;         // Close circuit after N successes
}

export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing, reject requests
  HALF_OPEN = 'half-open' // Testing recovery
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  totalRequests: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private totalRequests: number = 0;
  private lastFailure?: Date;
  private lastSuccess?: Date;
  private nextAttempt?: Date;
  private halfOpenAttempts: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      halfOpenMaxAttempts: 3,
      successThreshold: 2,
    }
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.totalRequests++;

    // Check if circuit should be opened/closed
    this.updateState();

    // Reject if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttempt && Date.now() < this.nextAttempt.getTime()) {
        throw new Error(
          `Circuit breaker "${this.name}" is OPEN. Next attempt: ${this.nextAttempt.toISOString()}`
        );
      }
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenAttempts = 0;
    }

    // Execute in half-open state
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts > this.config.halfOpenMaxAttempts) {
        this.state = CircuitState.OPEN;
        this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
        throw new Error(`Circuit breaker "${this.name}" failed recovery`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      // Don't count config errors (400 Bad Request) as circuit failures
      // These are usually fixable issues, not service failures
      const isConfigError = (error as any)?.isConfigError || 
                           (error instanceof Error && error.message.includes('config error'));
      
      if (!isConfigError) {
      this.onFailure();
      }
      
      // Try fallback if provided
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          throw new Error(
            `Circuit breaker "${this.name}" failed and fallback also failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      
      throw error;
    }
  }

  /**
   * Record success
   */
  private onSuccess(): void {
    this.lastSuccess = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.halfOpenAttempts = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.successes++;
      // Reset failure count on success streak
      if (this.successes >= 10) {
        this.failures = Math.max(0, this.failures - 1);
      }
    }
  }

  /**
   * Record failure
   */
  private onFailure(): void {
    this.lastFailure = new Date();
    this.failures++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery, open circuit again
      this.state = CircuitState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
      this.halfOpenAttempts = 0;
    }
  }

  /**
   * Update circuit state based on thresholds
   */
  private updateState(): void {
    if (this.state === CircuitState.CLOSED && this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.resetTimeout);
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalRequests: this.totalRequests,
    };
  }

  /**
   * Reset circuit breaker (for testing/manual intervention)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
    this.nextAttempt = undefined;
  }

  /**
   * Check if circuit is healthy (can accept requests)
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN;
  }
}

/**
 * Circuit breaker registry
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  getOrCreate(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  reset(name?: string): void {
    if (name) {
      this.breakers.get(name)?.reset();
    } else {
      for (const breaker of this.breakers.values()) {
        breaker.reset();
      }
    }
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

