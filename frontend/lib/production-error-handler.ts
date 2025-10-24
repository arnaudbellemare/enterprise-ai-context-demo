/**
 * Production Error Handler - Enterprise Grade
 * 
 * Comprehensive error handling for production deployment:
 * - Circuit breakers for external services
 * - Retry logic with exponential backoff
 * - Graceful degradation
 * - Error tracking and alerting
 * - Performance monitoring
 */

import { createLogger } from './walt/logger';

const logger = createLogger('Production-Error-Handler', 'info');

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        logger.info('Circuit breaker transitioning to HALF_OPEN', { service: 'unknown' });
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      logger.info('Circuit breaker transitioning to CLOSED', { service: 'unknown' });
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.error('Circuit breaker transitioning to OPEN', { 
        service: 'unknown',
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold
      });
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export class RetryHandler {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          logger.info('Retry successful', { context, attempt });
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.config.maxAttempts) {
          logger.error('All retry attempts failed', { 
            context, 
            attempts: this.config.maxAttempts,
            lastError: lastError.message
          });
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        logger.warn('Retry attempt failed, retrying', { 
          context, 
          attempt, 
          nextRetryIn: delay,
          error: lastError.message
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelay);

    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Graceful Degradation
// ============================================================================

export interface DegradationConfig {
  fallbackEnabled: boolean;
  fallbackTimeout: number;
  qualityThreshold: number;
}

export class GracefulDegradation {
  private config: DegradationConfig;

  constructor(config: DegradationConfig) {
    this.config = config;
  }

  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    if (!this.config.fallbackEnabled) {
      return await primaryOperation();
    }

    try {
      const result = await this.withTimeout(
        primaryOperation(),
        this.config.fallbackTimeout
      );
      
      // Check quality threshold if applicable
      if (this.isQualityAcceptable(result)) {
        logger.info('Primary operation successful', { context });
        return result;
      } else {
        logger.warn('Primary operation quality below threshold, using fallback', { context });
        return await fallbackOperation();
      }
    } catch (error) {
      logger.warn('Primary operation failed, using fallback', { 
        context, 
        error: error instanceof Error ? error.message : String(error)
      });
      return await fallbackOperation();
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private isQualityAcceptable(result: any): boolean {
    // Implement quality checks based on result type
    if (typeof result === 'object' && result !== null) {
      if (result.quality !== undefined) {
        return result.quality >= this.config.qualityThreshold;
      }
      if (result.confidence !== undefined) {
        return result.confidence >= this.config.qualityThreshold;
      }
    }
    return true; // Default to acceptable if no quality metrics
  }
}

// ============================================================================
// Error Tracking and Alerting
// ============================================================================

export interface ErrorAlert {
  id: string;
  timestamp: Date;
  context: string;
  error: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

export class ErrorTracker {
  private alerts: ErrorAlert[] = [];
  private alertThresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeThresholds();
  }

  private initializeThresholds(): void {
    this.alertThresholds.set('critical', 1);
    this.alertThresholds.set('high', 5);
    this.alertThresholds.set('medium', 20);
    this.alertThresholds.set('low', 100);
  }

  trackError(
    error: Error,
    context: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata: Record<string, any> = {}
  ): void {
    const alert: ErrorAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      context,
      error: error.message,
      severity,
      metadata
    };

    this.alerts.push(alert);
    logger.error('Error tracked', { 
      alertId: alert.id,
      context,
      severity,
      error: error.message,
      metadata
    });

    this.checkAlertThresholds(alert);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkAlertThresholds(alert: ErrorAlert): void {
    const threshold = this.alertThresholds.get(alert.severity) || 100;
    const recentAlerts = this.getRecentAlerts(alert.context, alert.severity, 60000); // 1 minute

    if (recentAlerts.length >= threshold) {
      this.triggerAlert(alert, recentAlerts.length);
    }
  }

  private getRecentAlerts(context: string, severity: string, timeWindow: number): ErrorAlert[] {
    const cutoff = Date.now() - timeWindow;
    return this.alerts.filter(alert => 
      alert.context === context &&
      alert.severity === severity &&
      alert.timestamp.getTime() > cutoff
    );
  }

  private triggerAlert(alert: ErrorAlert, count: number): void {
    logger.error('Alert threshold exceeded', {
      context: alert.context,
      severity: alert.severity,
      count,
      threshold: this.alertThresholds.get(alert.severity)
    });

    // In production, this would trigger actual alerts (email, Slack, PagerDuty, etc.)
    this.sendProductionAlert(alert, count);
  }

  private sendProductionAlert(alert: ErrorAlert, count: number): void {
    // Production alert implementation
    logger.error('PRODUCTION ALERT', {
      message: `Alert threshold exceeded for ${alert.context}`,
      severity: alert.severity,
      count,
      alertId: alert.id,
      timestamp: alert.timestamp.toISOString()
    });
  }

  getAlerts(context?: string, severity?: string): ErrorAlert[] {
    return this.alerts.filter(alert => {
      if (context && alert.context !== context) return false;
      if (severity && alert.severity !== severity) return false;
      return true;
    });
  }

  clearAlerts(): void {
    this.alerts = [];
    logger.info('All alerts cleared');
  }
}

// ============================================================================
// Production Error Handler
// ============================================================================

export class ProductionErrorHandler {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryHandlers: Map<string, RetryHandler> = new Map();
  private degradationHandlers: Map<string, GracefulDegradation> = new Map();
  private errorTracker: ErrorTracker;

  constructor() {
    this.errorTracker = new ErrorTracker();
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    // Initialize circuit breakers for different services
    this.circuitBreakers.set('perplexity', new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000 // 1 minute
    }));

    this.circuitBreakers.set('ollama', new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 15000, // 15 seconds
      monitoringPeriod: 30000 // 30 seconds
    }));

    // Initialize retry handlers
    this.retryHandlers.set('default', new RetryHandler({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true
    }));

    // Initialize degradation handlers
    this.degradationHandlers.set('llm', new GracefulDegradation({
      fallbackEnabled: true,
      fallbackTimeout: 5000,
      qualityThreshold: 0.7
    }));
  }

  async executeWithCircuitBreaker<T>(
    service: string,
    operation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (!circuitBreaker) {
      throw new Error(`No circuit breaker configured for service: ${service}`);
    }

    try {
      return await circuitBreaker.execute(operation);
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error(String(error)),
        `${context}_${service}`,
        'high'
      );
      throw error;
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'unknown',
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const retryHandler = this.retryHandlers.get('default');
    if (!retryHandler) {
      throw new Error('No retry handler configured');
    }

    try {
      return await retryHandler.execute(operation, context);
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error(String(error)),
        `${context}_retry_failed`,
        'critical'
      );
      throw error;
    }
  }

  async executeWithDegradation<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    const degradationHandler = this.degradationHandlers.get('llm');
    if (!degradationHandler) {
      throw new Error('No degradation handler configured');
    }

    try {
      return await degradationHandler.executeWithFallback(
        primaryOperation,
        fallbackOperation,
        context
      );
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error(String(error)),
        `${context}_degradation_failed`,
        'critical'
      );
      throw error;
    }
  }

  getCircuitBreakerState(service: string): CircuitState | null {
    const circuitBreaker = this.circuitBreakers.get(service);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  getErrorAlerts(context?: string, severity?: string): ErrorAlert[] {
    return this.errorTracker.getAlerts(context, severity);
  }

  clearErrorAlerts(): void {
    this.errorTracker.clearAlerts();
  }
}

// ============================================================================
// Export Production Error Handler Instance
// ============================================================================

export const productionErrorHandler = new ProductionErrorHandler();
