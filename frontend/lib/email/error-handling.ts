/**
 * Structured Error Handling for Email System
 * 
 * State belongs in structured types, not in error messages
 */

export enum EmailErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  CLASSIFICATION_FAILED = 'CLASSIFICATION_FAILED',
  RESPONSE_GENERATION_FAILED = 'RESPONSE_GENERATION_FAILED',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  LANGUAGE_DETECTION_FAILED = 'LANGUAGE_DETECTION_FAILED',
  ENTITY_EXTRACTION_FAILED = 'ENTITY_EXTRACTION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

export interface EmailError {
  code: EmailErrorCode;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  timestamp: string;
}

export class EmailSystemError extends Error {
  constructor(
    public readonly error: EmailError
  ) {
    super(error.message);
    this.name = 'EmailSystemError';
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    return this.error.recoverable;
  }

  /**
   * Get structured error data
   */
  toJSON(): EmailError {
    return this.error;
  }
}

/**
 * Create structured error
 */
export function createEmailError(
  code: EmailErrorCode,
  message: string,
  details?: Record<string, any>,
  recoverable: boolean = false
): EmailSystemError {
  return new EmailSystemError({
    code,
    message,
    details,
    recoverable,
    timestamp: new Date().toISOString()
  });
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  [EmailErrorCode.INVALID_INPUT]: () => ({
    action: 'validate',
    fallback: 'use_default_template'
  }),
  [EmailErrorCode.CLASSIFICATION_FAILED]: () => ({
    action: 'retry',
    fallback: 'use_rule_based_only'
  }),
  [EmailErrorCode.RESPONSE_GENERATION_FAILED]: () => ({
    action: 'use_generic_response',
    fallback: 'require_human_review'
  }),
  [EmailErrorCode.TEMPLATE_NOT_FOUND]: () => ({
    action: 'use_generic_response',
    fallback: 'require_human_review'
  }),
  [EmailErrorCode.LANGUAGE_DETECTION_FAILED]: () => ({
    action: 'default_to_english',
    fallback: 'require_human_review'
  })
};

/**
 * Validate email request input
 */
export function validateEmailRequest(request: any): { valid: boolean; errors: EmailError[] } {
  const errors: EmailError[] = [];

  if (!request) {
    errors.push({
      code: EmailErrorCode.INVALID_INPUT,
      message: 'Email request is required',
      recoverable: false,
      timestamp: new Date().toISOString()
    });
    return { valid: false, errors };
  }

  if (!request.body || typeof request.body !== 'string' || request.body.trim().length === 0) {
    errors.push({
      code: EmailErrorCode.INVALID_INPUT,
      message: 'Email body is required and must be non-empty',
      recoverable: false,
      timestamp: new Date().toISOString()
    });
  }

  if (!request.from || typeof request.from !== 'string') {
    errors.push({
      code: EmailErrorCode.INVALID_INPUT,
      message: 'Email from address is required',
      recoverable: true,
      timestamp: new Date().toISOString()
    });
  }

  if (!request.to || typeof request.to !== 'string') {
    errors.push({
      code: EmailErrorCode.INVALID_INPUT,
      message: 'Email to address is required',
      recoverable: true,
      timestamp: new Date().toISOString()
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

