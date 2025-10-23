/**
 * WALT Input Validation
 *
 * Security-focused validation for URLs, goals, and parameters
 * Protects against SSRF, injection attacks, and malicious inputs
 */

import { WALTValidationError } from './errors';

/**
 * Validate URL for WALT discovery
 * Prevents SSRF and ensures safe URL access
 */
export function validateDiscoveryUrl(url: string): void {
  // Check if URL is provided
  if (!url || typeof url !== 'string') {
    throw new WALTValidationError('URL is required and must be a string', { url });
  }

  // Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new WALTValidationError('Invalid URL format', { url });
  }

  // Only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new WALTValidationError('Only HTTP and HTTPS protocols are allowed', {
      url,
      protocol: parsedUrl.protocol,
    });
  }

  // Block private IP ranges (SSRF protection)
  const hostname = parsedUrl.hostname;

  // Block localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    throw new WALTValidationError('Access to localhost is not allowed', { url, hostname });
  }

  // Block private IP ranges (basic check)
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./, // Link-local
  ];

  if (privateRanges.some((range) => range.test(hostname))) {
    throw new WALTValidationError('Access to private IP ranges is not allowed', {
      url,
      hostname,
    });
  }

  // Block reserved domains
  const blockedDomains = ['.local', '.internal', '.lan'];
  if (blockedDomains.some((blocked) => hostname.endsWith(blocked))) {
    throw new WALTValidationError('Access to reserved domains is not allowed', {
      url,
      hostname,
    });
  }
}

/**
 * Sanitize goal string
 * Removes potentially dangerous characters
 */
export function sanitizeGoal(goal: string): string {
  if (!goal || typeof goal !== 'string') {
    return '';
  }

  // Remove control characters and potential injection patterns
  return goal
    .replace(/[\x00-\x1F\x7F]/g, '') // Control characters
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Script tags
    .replace(/javascript:/gi, '') // JavaScript protocol
    .replace(/on\w+\s*=/gi, '') // Event handlers
    .trim()
    .slice(0, 500); // Limit length
}

/**
 * Validate max_tools parameter
 */
export function validateMaxTools(maxTools: number | undefined): number {
  if (maxTools === undefined) {
    return 10; // Default
  }

  if (typeof maxTools !== 'number' || isNaN(maxTools)) {
    throw new WALTValidationError('max_tools must be a number', { maxTools });
  }

  if (maxTools < 1) {
    throw new WALTValidationError('max_tools must be at least 1', { maxTools });
  }

  if (maxTools > 100) {
    throw new WALTValidationError('max_tools cannot exceed 100', { maxTools });
  }

  return Math.floor(maxTools);
}

/**
 * Validate tool name
 * Ensures safe tool naming
 */
export function validateToolName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new WALTValidationError('Tool name is required and must be a string', { name });
  }

  // Allow alphanumeric, underscore, hyphen
  const validNamePattern = /^[a-zA-Z0-9_-]+$/;
  if (!validNamePattern.test(name)) {
    throw new WALTValidationError(
      'Tool name must contain only alphanumeric characters, underscores, and hyphens',
      { name }
    );
  }

  if (name.length > 100) {
    throw new WALTValidationError('Tool name cannot exceed 100 characters', { name });
  }
}

/**
 * Validate Redis URL
 * Ensures safe Redis connection configuration
 */
export function validateRedisUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new WALTValidationError('Redis URL is required', { url });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new WALTValidationError('Invalid Redis URL format', { url });
  }

  // Only allow redis/rediss protocols
  if (!['redis:', 'rediss:'].includes(parsedUrl.protocol)) {
    throw new WALTValidationError('Only redis:// and rediss:// protocols are allowed', {
      url: url.replace(/:[^:@]+@/, ':***@'), // Hide password in error
      protocol: parsedUrl.protocol,
    });
  }
}

/**
 * Validate environment configuration
 * Checks required environment variables
 */
export interface EnvironmentValidation {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvironment(required: string[]): EnvironmentValidation {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const varName of required) {
    const value = typeof process !== 'undefined' ? process.env[varName] : undefined;

    if (!value) {
      missing.push(varName);
    }
  }

  // Check for production-specific requirements
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Warn if using default Redis URL in production
    if (process.env.REDIS_URL === 'redis://localhost:6379') {
      warnings.push('Using default Redis URL in production is not recommended');
    }

    // Warn if Redis doesn't use TLS in production
    if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('rediss://')) {
      warnings.push('Using non-TLS Redis connection in production is not recommended');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}
