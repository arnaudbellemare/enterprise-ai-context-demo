/**
 * WALT Error Types
 *
 * Structured error types for better type safety and error handling
 */

export class WALTError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WALTError';
  }
}

export class WALTDiscoveryError extends WALTError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WALT_DISCOVERY_ERROR', details);
    this.name = 'WALTDiscoveryError';
  }
}

export class WALTStorageError extends WALTError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WALT_STORAGE_ERROR', details);
    this.name = 'WALTStorageError';
  }
}

export class WALTRedisError extends WALTError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WALT_REDIS_ERROR', details);
    this.name = 'WALTRedisError';
  }
}

export class WALTTimeoutError extends WALTError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WALT_TIMEOUT_ERROR', details);
    this.name = 'WALTTimeoutError';
  }
}

export class WALTValidationError extends WALTError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WALT_VALIDATION_ERROR', details);
    this.name = 'WALTValidationError';
  }
}

/**
 * Type guard to check if error is a WALTError
 */
export function isWALTError(error: unknown): error is WALTError {
  return error instanceof WALTError;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Extract error details for logging
 */
export function getErrorDetails(error: unknown): Record<string, unknown> {
  if (isWALTError(error)) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
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
    error: String(error),
  };
}
