/**
 * LLM Helpers with Rate Limiting
 *
 * Centralized wrapper for all LLM API calls with automatic:
 * - Rate limiting
 * - Provider fallback
 * - Retry logic
 * - Error handling
 */

import { apiRateLimiter } from '../api-rate-limiter';
import { createLogger } from '../walt/logger';

const logger = createLogger('LLMHelpers', 'info');

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  provider: string;
  fallbackUsed: boolean;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
  };
}

/**
 * Call Perplexity with automatic rate limiting and fallback
 */
export async function callPerplexityWithRateLimiting(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const {
    temperature = 0.7,
    maxTokens = 4000,
    model = 'llama-3.1-sonar-large-128k-online',
    stream = false
  } = options;

  try {
    const result = await apiRateLimiter.makeRequest(
      async (provider) => {
        if (provider.name === 'Perplexity') {
          // Use Perplexity API
          return fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              stream
            })
          });
        } else if (provider.name === 'Ollama Local') {
          // Fallback to Ollama
          logger.info('Using Ollama fallback', { provider: 'Ollama Local' });
          return fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.1',
              messages: messages.map(m => ({
                role: m.role,
                content: m.content
              })),
              stream: false,
              options: {
                temperature,
                num_predict: maxTokens
              }
            })
          });
        } else if (provider.name === 'OpenRouter') {
          // Use OpenRouter as fallback
          logger.info('Using OpenRouter fallback', { provider: 'OpenRouter' });
          return fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://permutation-ai.com',
              'X-Title': 'PERMUTATION AI'
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3.1-8b-instruct',
              messages,
              temperature,
              max_tokens: maxTokens
            })
          });
        }

        throw new Error('Unsupported provider');
      },
      'perplexity',
      ['openrouter', 'ollama']
    );

    if (!result.response.ok) {
      const errorText = await result.response.text();
      throw new Error(`API call failed: ${result.response.status} - ${errorText}`);
    }

    const data = await result.response.json();

    // Parse response based on provider
    let content: string;
    let tokens = { input: 0, output: 0 };

    if (result.provider.name === 'Ollama Local') {
      content = data.message?.content || '';
    } else {
      // Perplexity and OpenRouter use same format
      content = data.choices?.[0]?.message?.content || '';
      tokens = {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0
      };
    }

    // Calculate cost
    const cost = calculateCost(result.provider.name, tokens.input, tokens.output);

    return {
      content,
      provider: result.provider.name,
      fallbackUsed: result.provider.name !== 'Perplexity',
      cost,
      tokens
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('LLM call failed completely', { error: errorMessage });

    // Final fallback: return error message
    return {
      content: `Error: Unable to generate response. ${errorMessage}. Please try again later.`,
      provider: 'error',
      fallbackUsed: true,
      cost: 0
    };
  }
}

/**
 * Call LLM with retry logic for transient errors
 */
export async function callLLMWithRetry(
  messages: LLMMessage[],
  options: LLMOptions = {},
  maxRetries: number = 3
): Promise<LLMResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callPerplexityWithRateLimiting(messages, options);

      // Don't retry if we got a response (even if fallback)
      if (result.provider !== 'error') {
        return result;
      }

      lastError = new Error(result.content);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn('LLM call attempt failed', {
        attempt,
        maxRetries,
        error: errorMessage
      });

      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logger.info('Retrying LLM call', { delayMs: delay });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  return {
    content: `Error: Failed after ${maxRetries} attempts. ${lastError?.message || 'Unknown error'}`,
    provider: 'error',
    fallbackUsed: true,
    cost: 0
  };
}

/**
 * Calculate cost based on provider and token usage
 */
function calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
  const costs = {
    'Perplexity': {
      input: 0.001,  // $1 per 1M input tokens
      output: 0.001  // $1 per 1M output tokens
    },
    'OpenRouter': {
      input: 0.0005,  // $0.50 per 1M input tokens (llama-3.1-8b)
      output: 0.0005
    },
    'Ollama Local': {
      input: 0,
      output: 0
    }
  };

  const providerCosts = costs[provider as keyof typeof costs] || costs['Perplexity'];

  return (inputTokens / 1000000) * providerCosts.input +
         (outputTokens / 1000000) * providerCosts.output;
}

/**
 * Batch LLM calls with rate limiting
 */
export async function batchLLMCalls(
  requests: Array<{ messages: LLMMessage[]; options?: LLMOptions }>,
  concurrency: number = 3
): Promise<LLMResponse[]> {
  const results: LLMResponse[] = [];
  const batches: typeof requests = [];

  // Split into batches
  for (let i = 0; i < requests.length; i += concurrency) {
    batches.push(...requests.slice(i, i + concurrency));
  }

  // Process batches
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(req => callPerplexityWithRateLimiting(req.messages, req.options))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + concurrency < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Health check for LLM providers
 */
export async function checkLLMHealth(): Promise<{
  perplexity: boolean;
  openrouter: boolean;
  ollama: boolean;
}> {
  const health = {
    perplexity: false,
    openrouter: false,
    ollama: false
  };

  // Check Perplexity
  try {
    const result = await callPerplexityWithRateLimiting(
      [{ role: 'user', content: 'test' }],
      { maxTokens: 10 }
    );
    health.perplexity = result.provider === 'Perplexity';
    health.openrouter = result.provider === 'OpenRouter';
    health.ollama = result.provider === 'Ollama Local';
  } catch (error) {
    logger.error('LLM health check failed', { error });
  }

  return health;
}
