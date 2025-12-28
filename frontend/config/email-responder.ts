/**
 * Email Responder Configuration
 *
 * Centralized configuration for email responder functionality.
 * Modify these values instead of hardcoding throughout the application.
 */

export const EMAIL_RESPONDER_CONFIG = {
  // API Configuration
  API_ENDPOINT: '/api/email/classify-and-respond',

  // Email Configuration
  DEFAULT_TO_EMAIL: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'info@gestionvelora.com',
  PLACEHOLDER_FROM: 'tenant@example.com',
  PLACEHOLDER_SUBJECT: 'Email subject',

  // UI Configuration
  TEXTAREA_ROWS: 12,
  MAX_EMAIL_LENGTH: 10000,
  MIN_EMAIL_LENGTH: 10,

  // Performance Configuration
  DEBOUNCE_DELAY_MS: 1000, // 1 second cooldown between requests
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds max

  // Feature Flags
  ENABLE_PALIMPZEST_BY_DEFAULT: true,

  // Placeholders
  EMAIL_PLACEHOLDER: `Paste the email content here...

Example:
From: tenant@example.com
Subject: Dégât d'eau - Unité 1507

Bonjour Arnaud,
Je vous écris concernant...`,
} as const;

/**
 * Error Messages
 *
 * User-friendly error messages for common scenarios.
 */
export const ERROR_MESSAGES = {
  EMPTY_EMAIL: 'Please paste email content before generating a response',
  EMAIL_TOO_SHORT: `Email content is too short (minimum ${EMAIL_RESPONDER_CONFIG.MIN_EMAIL_LENGTH} characters)`,
  EMAIL_TOO_LONG: `Email content exceeds maximum length (${EMAIL_RESPONDER_CONFIG.MAX_EMAIL_LENGTH.toLocaleString()} characters)`,
  INVALID_EMAIL_FORMAT: 'Please enter a valid email address',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. The server took too long to respond. Please try again.',
  SERVER_ERROR: (status: number) => `Server error (${status}). Please try again later.`,
  RATE_LIMITED: 'Too many requests. Please wait a moment before trying again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  RESPONSE_COPIED: 'Response copied to clipboard!',
  BODY_COPIED: 'Response body copied to clipboard!',
  CLASSIFICATION_COMPLETE: 'Email classified successfully',
} as const;

/**
 * Validation Functions
 */
export const validators = {
  /**
   * Validate email address format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Validate email content length
   */
  isValidEmailLength: (text: string): boolean => {
    const length = text.trim().length;
    return length >= EMAIL_RESPONDER_CONFIG.MIN_EMAIL_LENGTH &&
           length <= EMAIL_RESPONDER_CONFIG.MAX_EMAIL_LENGTH;
  },

  /**
   * Check if email content is too short
   */
  isTooShort: (text: string): boolean => {
    return text.trim().length < EMAIL_RESPONDER_CONFIG.MIN_EMAIL_LENGTH;
  },

  /**
   * Check if email content is too long
   */
  isTooLong: (text: string): boolean => {
    return text.trim().length > EMAIL_RESPONDER_CONFIG.MAX_EMAIL_LENGTH;
  },
} as const;

/**
 * Email Extraction Utilities
 */
export const emailExtractors = {
  /**
   * Extract 'From' email address from pasted content
   */
  extractFrom: (emailText: string): string => {
    const fromMatch = emailText.match(/From:\s*(.+)/i) ||
                     emailText.match(/De:\s*(.+)/i) ||
                     emailText.match(/^(.+@.+\..+)/);
    return fromMatch ? fromMatch[1].trim() : '';
  },

  /**
   * Extract 'Subject' from pasted content
   */
  extractSubject: (emailText: string): string => {
    const subjectMatch = emailText.match(/Subject:\s*(.+)/i) ||
                        emailText.match(/Objet:\s*(.+)/i) ||
                        emailText.match(/Sujet:\s*(.+)/i);
    return subjectMatch ? subjectMatch[1].trim() : '';
  },
} as const;
