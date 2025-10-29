/**
 * Environment Variable Validation with Zod
 *
 * Validates required environment variables at startup to fail fast
 * if configuration is missing or invalid.
 *
 * Uses Zod schemas for type-safe validation as recommended in CODE_ANALYSIS_REPORT.md
 *
 * Usage:
 *   import { validateEnvironment } from '@/lib/env-validation';
 *   validateEnvironment(); // Call at app startup
 */

import { z } from 'zod';

interface EnvValidationError {
  variable: string;
  reason: string;
}

interface EnvValidationResult {
  valid: boolean;
  errors: EnvValidationError[];
  warnings: EnvValidationError[];
}

/**
 * Zod schema for required environment variables
 */
const requiredEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Must be a valid URL').min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'API key must be at least 10 characters'),
});

/**
 * Zod schema for recommended environment variables (optional)
 */
const recommendedEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'API key must be at least 10 characters').optional(),
  OPENAI_API_KEY: z.string().min(10, 'API key must be at least 10 characters').optional(),
  PERPLEXITY_API_KEY: z.string().min(10, 'API key must be at least 10 characters').optional(),
  ANTHROPIC_API_KEY: z.string().min(10, 'API key must be at least 10 characters').optional(),
  OLLAMA_HOST: z.string().url('Must be a valid URL').or(z.string().regex(/^[\w.-]+(:\d+)?$/, 'Must be hostname or hostname:port')).optional(),
});

/**
 * Validate a single environment variable (legacy function for compatibility)
 */
function validateEnvVar(varName: string): EnvValidationError | null {
  const value = process.env[varName];

  if (!value) {
    return {
      variable: varName,
      reason: 'Missing or empty',
    };
  }

  // Use Zod for validation based on variable name
  if (varName.includes('URL') || varName.includes('HOST')) {
    const urlSchema = z.string().url();
    try {
      urlSchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          variable: varName,
          reason: error.errors[0]?.message || 'Invalid URL format',
        };
      }
      return {
        variable: varName,
        reason: 'Invalid URL format',
      };
    }
  }

  if (varName.includes('API_KEY') || varName.includes('_KEY')) {
    const keySchema = z.string().min(10, 'API key must be at least 10 characters');
    try {
      keySchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          variable: varName,
          reason: error.errors[0]?.message || 'API key too short',
        };
      }
    }
  }

  return null;
}

/**
 * Validate all required and recommended environment variables using Zod
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: EnvValidationError[] = [];
  const warnings: EnvValidationError[] = [];

  // Validate required variables using Zod schema
  try {
    requiredEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.errors) {
        const path = issue.path[0] as string;
        errors.push({
          variable: path,
          reason: issue.message || 'Validation failed',
        });
      }
    }
  }

  // Validate recommended variables (non-blocking warnings)
  const recommendedVars = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OLLAMA_HOST: process.env.OLLAMA_HOST,
  };

  try {
    recommendedEnvSchema.parse(recommendedVars);
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.errors) {
        const path = issue.path[0] as string;
        // Only add warning if variable was provided but invalid
        if (recommendedVars[path as keyof typeof recommendedVars]) {
          warnings.push({
            variable: path,
            reason: issue.message || 'Invalid format',
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw error if invalid
 * Use this at application startup for fail-fast behavior
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    const errorMessage = [
      '❌ Environment Validation Failed:',
      '',
      'Missing or invalid required environment variables:',
      ...result.errors.map(e => `  - ${e.variable}: ${e.reason}`),
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      'See CLAUDE.md for environment setup instructions.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log warnings for missing recommended variables
  if (result.warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  Missing recommended environment variables:');
    result.warnings.forEach(w => {
      console.warn(`  - ${w.variable}: ${w.reason}`);
    });
    console.warn('Some features may not be available.');
  }
}

/**
 * Get a required environment variable or throw error
 * Use this for runtime access to environment variables
 */
export function getEnvOrThrow(varName: string): string {
  const value = process.env[varName];

  if (!value) {
    throw new Error(
      `Required environment variable ${varName} is not set. ` +
      `Please add it to your .env.local file.`
    );
  }

  return value;
}

/**
 * Get an optional environment variable with default value
 */
export function getEnvOrDefault(varName: string, defaultValue: string): string {
  return process.env[varName] || defaultValue;
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

// Validate environment at module load time (fail fast)
if (!isTest()) {
  validateEnvironmentOrThrow();
}
