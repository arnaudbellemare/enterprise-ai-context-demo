/**
 * Input Validation
 * 
 * Validates and sanitizes user inputs to prevent injection attacks
 * and ensure system stability
 */

import { ValidationError } from './errors';
import { z } from 'zod';

/**
 * Query validation schema
 */
const querySchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(10000, 'Query exceeds maximum length of 10,000 characters')
    .refine(
      (val) => {
        // Check for suspicious patterns
        const suspiciousPatterns = [
          /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /data:text\/html/gi,
        ];
        return !suspiciousPatterns.some(pattern => pattern.test(val));
      },
      'Query contains potentially unsafe content'
    ),
  domain: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export type ValidatedQuery = z.infer<typeof querySchema>;

/**
 * Validate query input
 */
export function validateQuery(input: {
  query: string;
  domain?: string;
  context?: Record<string, unknown>;
}): ValidatedQuery {
  // Check length before sanitization to provide clear error
  if (input.query.length > 10000) {
    throw new ValidationError(
      `Query exceeds maximum length of 10,000 characters (got ${input.query.length})`,
      'query',
      input.query.substring(0, 100)
    );
  }
  
  try {
    return querySchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Query validation failed: ${firstError.message}`,
        firstError.path.join('.'),
        input.query
      );
    }
    throw error;
  }
}

/**
 * Sanitize query string
 */
export function sanitizeQuery(query: string): string {
  // Remove control characters except newlines and tabs
  let sanitized = query.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}

/**
 * Validate domain
 */
const domainSchema = z.enum([
  'general',
  'financial',
  'legal',
  'healthcare',
  'real_estate',
  'crypto',
  'art',
  'business',
  'science',
  'philosophy',
]);

export function validateDomain(domain: string | undefined): string | undefined {
  if (!domain) return undefined;
  
  try {
    return domainSchema.parse(domain);
  } catch (error) {
    throw new ValidationError(
      `Invalid domain: ${domain}. Must be one of: ${domainSchema.options.join(', ')}`,
      'domain',
      domain
    );
  }
}

/**
 * Validate configuration object
 */
const configSchema = z.object({
  enableACE: z.boolean().optional(),
  enableGEPA: z.boolean().optional(),
  enableIRT: z.boolean().optional(),
  enableRVS: z.boolean().optional(),
  enableDSPy: z.boolean().optional(),
  enableSemiotic: z.boolean().optional(),
  enableTeacherStudent: z.boolean().optional(),
  enableSWiRL: z.boolean().optional(),
  enableSRL: z.boolean().optional(),
  enableEBM: z.boolean().optional(),
  enableToolSynthesis: z.boolean().optional(),
  enableSelfImprovingJudge: z.boolean().optional(),
  optimizationMode: z.enum(['quality', 'speed', 'balanced']).optional(),
  aceThreshold: z.number().min(0).max(1).optional(),
  swirlThreshold: z.number().min(0).max(1).optional(),
  rvsThreshold: z.number().min(0).max(1).optional(),
}).passthrough(); // Allow additional properties

export function validateConfig(config: unknown): z.infer<typeof configSchema> {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        `Configuration validation failed: ${firstError.message}`,
        firstError.path.join('.'),
        config
      );
    }
    throw error;
  }
}

/**
 * Rate limit check (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Clear rate limit data (for testing or cleanup)
 */
export function clearRateLimit(identifier?: string): void {
  if (identifier) {
    rateLimitStore.delete(identifier);
  } else {
    rateLimitStore.clear();
  }
}

