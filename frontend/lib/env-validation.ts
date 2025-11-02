/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at startup
 * Provides clear error messages if critical variables are missing
 */

import { z } from 'zod';

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Optional but recommended
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  POSTGRES_URL: z.string().url().optional(),
  
  // LLM API Keys (at least one should be present)
  PERPLEXITY_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  
  // Optional configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws with clear error message if validation fails
 */
export function validateEnvironment(): ValidatedEnv {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      POSTGRES_URL: process.env.POSTGRES_URL,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL,
    };
    
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(
        `❌ Environment validation failed:\n` +
        `Missing or invalid variables: ${missingVars}\n` +
        `Please check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

/**
 * Check if at least one LLM provider is configured
 */
export function validateLLMProviders(): {
  hasPerplexity: boolean;
  hasOpenRouter: boolean;
  hasAnthropic: boolean;
  hasOpenAI: boolean;
  hasAny: boolean;
} {
  const env = process.env;
  const hasPerplexity = !!env.PERPLEXITY_API_KEY;
  const hasOpenRouter = !!env.OPENROUTER_API_KEY;
  const hasAnthropic = !!env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!env.OPENAI_API_KEY;
  const hasAny = hasPerplexity || hasOpenRouter || hasAnthropic || hasOpenAI;
  
  if (!hasAny) {
    console.warn(
      '⚠️  No LLM provider API keys found. The system may not function correctly.\n' +
      'Please set at least one of: PERPLEXITY_API_KEY, OPENROUTER_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY'
    );
  }
  
  return {
    hasPerplexity,
    hasOpenRouter,
    hasAnthropic,
    hasOpenAI,
    hasAny,
  };
}

/**
 * Check if Supabase is configured
 */
export function validateSupabase(): {
  hasUrl: boolean;
  hasKey: boolean;
  isConfigured: boolean;
} {
  const env = process.env;
  const hasUrl = !!(env.NEXT_PUBLIC_SUPABASE_URL || env.POSTGRES_URL);
  const hasKey = !!(env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const isConfigured = hasUrl && hasKey;
  
  if (!isConfigured) {
    console.warn(
      '⚠️  Supabase not fully configured. Persistence features will use in-memory storage.\n' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for full functionality.'
    );
  }
  
  return {
    hasUrl,
    hasKey,
    isConfigured,
  };
}

/**
 * Get safe environment variable (never returns undefined in critical paths)
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value || defaultValue!;
}

/**
 * Initialize and validate environment on module load
 */
let validatedEnv: ValidatedEnv | null = null;

export function initializeEnvironment(): ValidatedEnv {
  if (!validatedEnv) {
    validatedEnv = validateEnvironment();
    validateLLMProviders();
    validateSupabase();
  }
  return validatedEnv;
}

// Auto-initialize if in Node.js environment
if (typeof window === 'undefined') {
  try {
    initializeEnvironment();
  } catch (error) {
    // Don't throw during module load, but log warning
    console.warn('⚠️  Environment validation warning:', error instanceof Error ? error.message : 'Unknown error');
  }
}
