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
import { circuitBreakerRegistry } from '../circuit-breaker';

const logger = createLogger('LLMHelpers', 'info');
const perplexityBreaker = circuitBreakerRegistry.getOrCreate('perplexity', {
  failureThreshold: 10, // More lenient - only trip after 10 real failures (not config errors)
  resetTimeout: 30000,   // Shorter timeout - 30 seconds instead of 60
  halfOpenMaxAttempts: 3,
  successThreshold: 2,
});
const ollamaBreaker = circuitBreakerRegistry.getOrCreate('ollama', {
  failureThreshold: 5,
  resetTimeout: 30000,
  halfOpenMaxAttempts: 3,
  successThreshold: 2,
});

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
  timeout?: number;  // Request timeout in milliseconds
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
  let {
    temperature = 0.7,
    maxTokens = 4000,
    model = 'sonar-pro',
    stream = false
  } = options;
  
  // Ensure Perplexity uses a valid model (not Ollama model names)
  if (model && (model.startsWith('ollama-') || model.includes('gemma') || model.includes('llama'))) {
    model = 'sonar-pro'; // Default to valid Perplexity model
  }

  try {
    // Log available providers for debugging
    const stats = apiRateLimiter.getStats();
    logger.info('Available LLM providers', { 
      providers: stats.providers.map(p => ({ name: p.name, rateLimited: p.isRateLimited }))
    });
    
    // Prefer Perplexity if available, fallback to Ollama
    const result = await apiRateLimiter.makeRequest(
      async (provider) => {
        logger.info(`Attempting LLM call with provider: ${provider.name}`);
        if (provider.name === 'Perplexity') {
          // Use Perplexity API - bypass circuit breaker for testing
          const fn = async () => {
              const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${provider.apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model,
                  messages,
                  temperature,
                  max_tokens: Math.floor(maxTokens), // Ensure integer for Perplexity API
                  stream
                })
              });
              
              if (!response.ok) {
                // Get error details for debugging
                let errorDetails = '';
                try {
                  const errorBody = await response.clone().text();
                  errorDetails = errorBody.substring(0, 200);
                } catch {
                  errorDetails = response.statusText;
                }
                
                // Handle specific status codes
                if (response.status === 401) {
                  logger.warn('Perplexity API key invalid or missing, will fallback to Ollama', {
                    status: response.status,
                    statusText: response.statusText,
                    details: errorDetails
                  });
                  throw new Error('Perplexity authentication failed - falling back to Ollama');
                }
                
                if (response.status === 400) {
                  // 400 errors are usually config issues (model name, format) - don't trip circuit breaker
                  logger.warn('Perplexity API request format error, will fallback to Ollama', {
                    status: response.status,
                    statusText: response.statusText,
                    details: errorDetails,
                    model: model
                  });
                  // Throw a special error that won't trip circuit breaker
                  const configError = new Error(`Perplexity API config error: ${response.status} ${response.statusText} - ${errorDetails}`);
                  (configError as any).isConfigError = true; // Mark as config error
                  throw configError;
                }
                
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorDetails}`);
              }
              
              return response;
            };
          
          // Bypass circuit breaker for testing
          if (process.env.SUPPRESS_CLEANUP_LOGS) {
            return await fn();
          }
          
          return await perplexityBreaker.execute(
            fn,
            async () => {
              // Fallback to Ollama if Perplexity circuit is open
              logger.warn('Perplexity circuit breaker open, falling back to Ollama', { provider: 'Ollama Local' });
              throw new Error('Perplexity circuit breaker open');
            }
          );
        } else if (provider.name === 'Ollama Local') {
          // Fallback to Ollama
          logger.info('Using Ollama fallback', { provider: 'Ollama Local' });
          
          // Validate and normalize messages format
          let normalizedMessages = messages;
          if (!Array.isArray(messages)) {
            if (messages && typeof messages === 'object' && Array.isArray((messages as any).messages)) {
              // Handle case where messages is wrapped in an object
              normalizedMessages = (messages as any).messages;
              logger.info('Normalized messages from object format', { originalType: typeof messages });
            } else {
              logger.error('Invalid messages format for Ollama', { messages, type: typeof messages });
              throw new Error('Messages must be an array or object with messages array');
            }
          }
          
          // Use Ollama - bypass circuit breaker for testing
          const fn = async () => {
              const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
              logger.info(`Calling Ollama at ${ollamaUrl}/api/chat`);
              
              // Quick health check first
              try {
                const healthCheck = await fetch(`${ollamaUrl}/api/tags`, {
                  signal: AbortSignal.timeout(5000)
                }).catch(() => null);
                
                if (!healthCheck || !healthCheck.ok) {
                  throw new Error('Ollama is not responding - check if service is running (ollama serve)');
                }
              } catch (healthError) {
                if (healthError instanceof Error && healthError.message.includes('not responding')) {
                  throw healthError;
                }
                // Continue if health check fails but don't block
                logger.warn('Ollama health check failed, proceeding anyway');
              }
              
              // Add timeout to fetch - Ollama needs more time for large prompts
              const controller = new AbortController();
              const timeoutMs = options.timeout || 120000; // Default 120s for Ollama
              const timeoutId = setTimeout(() => {
                controller.abort();
                logger.error(`Ollama request timeout after ${timeoutMs}ms`);
              }, timeoutMs);
              
              // Add connection timeout (separate from request timeout)
              const connectionTimeoutId = setTimeout(() => {
                controller.abort();
                logger.error('Ollama connection timeout - service may not be responding');
              }, 10000); // 10 second connection timeout
              
              logger.info(`Ollama request timeout set to ${timeoutMs}ms`);
              
              try {
                const response = await fetch(`${ollamaUrl}/api/chat`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    model: 'gemma3:4b',
                    messages: normalizedMessages.map(m => ({
                      role: m.role,
                      content: m.content
                    })),
                    stream: false,
                    options: {
                      temperature,
                      num_predict: maxTokens
                    }
                  }),
                  signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                clearTimeout(connectionTimeoutId);
                
                if (!response.ok) {
                  const errorText = await response.text().catch(() => response.statusText);
                  logger.error(`Ollama API error: ${response.status}`, { errorText });
                  throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
                }
                
                return response;
              } catch (error: any) {
                clearTimeout(timeoutId);
                clearTimeout(connectionTimeoutId);
                if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                  const timeoutMsg = error.message?.includes('connection') 
                    ? 'Ollama connection timeout - service may not be responding'
                    : `Ollama request timed out after ${timeoutMs}ms`;
                  logger.error(timeoutMsg);
                  throw new Error(timeoutMsg);
                }
                throw error;
              }
            };
          
          // Bypass circuit breaker for testing
          if (process.env.SUPPRESS_CLEANUP_LOGS) {
            return await fn();
          }
          
          return await ollamaBreaker.execute(
            fn,
            async () => {
              // Fallback to simple error message
              logger.error('Ollama circuit breaker open', { provider: 'Ollama Local' });
              throw new Error('Ollama circuit breaker open');
            }
          );
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
      
      // Handle 401 Unauthorized - try fallback
      if (result.response.status === 401) {
        logger.warn('API authentication failed, trying fallback providers', {
          provider: result.provider.name,
          status: result.response.status
        });
        
        // If Perplexity failed, apiRateLimiter will automatically try fallback providers
        throw new Error('Authentication failed - fallback provider will be attempted');
      }
      
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

    // If it's an auth error, provide helpful message and don't fail completely
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('authentication failed') || errorMessage.includes('401')) {
      logger.warn('Authentication error detected, returning graceful fallback');
      const lastUserMessage = messages[messages.length - 1]?.content || 'your question';
      return {
        content: `I'm currently having authentication issues with external APIs. However, I can still help you with your query: "${lastUserMessage}". Please note that real-time web search may not be available, but I'll provide the best answer I can with available resources.`,
        provider: 'fallback',
        fallbackUsed: true,
        cost: 0
      };
    }

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
