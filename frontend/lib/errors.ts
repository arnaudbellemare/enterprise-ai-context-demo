/**
 * Custom Error Classes
 * 
 * Standardized error handling throughout the system
 */

/**
 * Base error class for all system errors
 */
export class SystemError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly cause?: Error,
    public readonly metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends SystemError {
  constructor(message: string, cause?: Error, metadata?: Record<string, any>) {
    super(message, 'CONFIG_ERROR', 500, cause, metadata);
  }
}

/**
 * Environment variable errors
 */
export class EnvironmentError extends ConfigurationError {
  constructor(message: string, missingVar?: string) {
    super(message, undefined, missingVar ? { missingVariable: missingVar } : undefined);
  }
}

/**
 * LLM API errors
 */
export class LLMError extends SystemError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly model?: string,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(message, 'LLM_ERROR', 502, cause, { provider, model, ...metadata });
  }
}

/**
 * Validation errors
 */
export class ValidationError extends SystemError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any,
    metadata?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', 400, undefined, { field, value, ...metadata });
  }
}

/**
 * Pipeline execution errors
 */
export class PipelineError extends SystemError {
  constructor(
    message: string,
    public readonly phase: string,
    public readonly component?: string,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(message, 'PIPELINE_ERROR', 500, cause, { phase, component, ...metadata });
  }
}

/**
 * Database errors
 */
export class DatabaseError extends SystemError {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly table?: string,
    cause?: Error,
    metadata?: Record<string, any>
  ) {
    super(message, 'DATABASE_ERROR', 503, cause, { operation, table, ...metadata });
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends SystemError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly retryAfter?: number,
    metadata?: Record<string, any>
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, undefined, { provider, retryAfter, ...metadata });
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends SystemError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    public readonly operation: string,
    metadata?: Record<string, any>
  ) {
    super(message, 'TIMEOUT_ERROR', 504, undefined, { timeoutMs, operation, ...metadata });
  }
}

/**
 * Convert error to safe error object for logging/serialization
 */
export function toSafeError(error: unknown): {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
  stack?: string;
} {
  if (error instanceof SystemError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      metadata: error.metadata,
      stack: error.stack,
    };
  }
  
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  
  return {
    name: 'UnknownError',
    message: String(error),
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof SystemError) {
    return error.statusCode >= 500 || error instanceof RateLimitError || error instanceof TimeoutError;
  }
  return false;
}

/**
 * Get retry delay for error (in milliseconds)
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000;
  }
  
  if (error instanceof TimeoutError) {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
  }
  
  // Exponential backoff for other retryable errors
  if (isRetryableError(error)) {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
  }
  
  return 0;
}

