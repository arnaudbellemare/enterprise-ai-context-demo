/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup to fail fast
 * if configuration is missing or invalid.
 *
 * Usage:
 *   import { validateEnvironment } from '@/lib/env-validation';
 *   validateEnvironment(); // Call at app startup
 */

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
 * Required environment variables for production
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'PERPLEXITY_API_KEY',
  'ANTHROPIC_API_KEY',
  'OLLAMA_HOST',
] as const;

/**
 * Validate a single environment variable
 */
function validateEnvVar(varName: string): EnvValidationError | null {
  const value = process.env[varName];

  if (!value) {
    return {
      variable: varName,
      reason: 'Missing or empty',
    };
  }

  // Validate URL format for URL variables
  if (varName.includes('URL') || varName.includes('HOST')) {
    try {
      new URL(value);
    } catch (error) {
      return {
        variable: varName,
        reason: 'Invalid URL format',
      };
    }
  }

  // Validate API key format (basic check)
  if (varName.includes('API_KEY') || varName.includes('_KEY')) {
    if (value.length < 10) {
      return {
        variable: varName,
        reason: 'API key appears too short (< 10 characters)',
      };
    }
  }

  return null;
}

/**
 * Validate all required and recommended environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: EnvValidationError[] = [];
  const warnings: EnvValidationError[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const error = validateEnvVar(varName);
    if (error) {
      errors.push(error);
    }
  }

  // Check recommended variables
  for (const varName of RECOMMENDED_ENV_VARS) {
    const error = validateEnvVar(varName);
    if (error) {
      warnings.push(error);
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
