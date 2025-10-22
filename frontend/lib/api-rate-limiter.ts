/**
 * API Rate Limiter with Intelligent Fallback
 * 
 * Handles rate limiting for multiple API providers with intelligent fallback
 * and API key rotation to prevent rate limit issues.
 */

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  cooldownMs: number;
}

interface APIProvider {
  name: string;
  apiKey: string;
  config: RateLimitConfig;
  lastUsed: number;
  requestCount: number;
  isRateLimited: boolean;
  rateLimitUntil: number;
}

class APIRateLimiter {
  private providers: Map<string, APIProvider> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenRouter configuration
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        config: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          burstLimit: 10,
          cooldownMs: 1000
        },
        lastUsed: 0,
        requestCount: 0,
        isRateLimited: false,
        rateLimitUntil: 0
      });
    }

    // Perplexity configuration
    if (process.env.PERPLEXITY_API_KEY) {
      this.providers.set('perplexity', {
        name: 'Perplexity',
        apiKey: process.env.PERPLEXITY_API_KEY,
        config: {
          requestsPerMinute: 20,
          requestsPerHour: 500,
          burstLimit: 5,
          cooldownMs: 2000
        },
        lastUsed: 0,
        requestCount: 0,
        isRateLimited: false,
        rateLimitUntil: 0
      });
    }

    // Ollama local fallback
    this.providers.set('ollama', {
      name: 'Ollama Local',
      apiKey: 'local',
      config: {
        requestsPerMinute: 1000,
        requestsPerHour: 10000,
        burstLimit: 50,
        cooldownMs: 100
      },
      lastUsed: 0,
      requestCount: 0,
      isRateLimited: false,
      rateLimitUntil: 0
    });
  }

  /**
   * Get the best available provider for a request
   */
  private getBestProvider(preferredProvider?: string): APIProvider | null {
    const now = Date.now();
    
    // Reset rate limits if cooldown period has passed
    for (const provider of this.providers.values()) {
      if (provider.isRateLimited && now > provider.rateLimitUntil) {
        provider.isRateLimited = false;
        provider.requestCount = 0;
        console.log(`🔄 ${provider.name} rate limit reset`);
      }
    }

    // Try preferred provider first
    if (preferredProvider) {
      const preferred = this.providers.get(preferredProvider);
      if (preferred && !preferred.isRateLimited) {
        return preferred;
      }
    }

    // Find best available provider
    const availableProviders = Array.from(this.providers.values())
      .filter(p => !p.isRateLimited)
      .sort((a, b) => {
        // Prioritize by request count (least used first)
        if (a.requestCount !== b.requestCount) {
          return a.requestCount - b.requestCount;
        }
        // Then by last used (least recently used)
        return a.lastUsed - b.lastUsed;
      });

    return availableProviders[0] || null;
  }

  /**
   * Make an API request with intelligent provider selection
   */
  async makeRequest(
    requestFn: (provider: APIProvider) => Promise<Response>,
    preferredProvider?: string,
    fallbackProviders: string[] = ['ollama']
  ): Promise<{ response: Response; provider: APIProvider }> {
    const startTime = Date.now();
    
    // Try preferred provider first
    let provider = this.getBestProvider(preferredProvider);
    
    if (!provider) {
      // Try fallback providers
      for (const fallbackName of fallbackProviders) {
        provider = this.getBestProvider(fallbackName);
        if (provider) break;
      }
    }

    if (!provider) {
      throw new Error('All API providers are rate limited. Please try again later.');
    }

    try {
      console.log(`🚀 Using ${provider.name} for API request`);
      
      // Update provider stats
      provider.lastUsed = startTime;
      provider.requestCount++;
      
      // Make the request
      const response = await requestFn(provider);
      
      // Check for rate limiting
      if (response.status === 429) {
        console.warn(`⚠️ ${provider.name} rate limited, marking as unavailable`);
        provider.isRateLimited = true;
        provider.rateLimitUntil = startTime + (provider.config.cooldownMs * 10); // 10x cooldown for rate limits
        
        // Try with fallback provider
        if (fallbackProviders.length > 0) {
          console.log(`🔄 Falling back to ${fallbackProviders[0]}`);
          return this.makeRequest(requestFn, fallbackProviders[0], fallbackProviders.slice(1));
        }
        
        throw new Error(`${provider.name} rate limited and no fallbacks available`);
      }
      
      return { response, provider };
      
    } catch (error) {
      console.error(`❌ ${provider.name} request failed:`, error);
      
      // Mark provider as temporarily unavailable
      provider.isRateLimited = true;
      provider.rateLimitUntil = startTime + provider.config.cooldownMs;
      
      // Try with fallback provider
      if (fallbackProviders.length > 0) {
        console.log(`🔄 Falling back to ${fallbackProviders[0]}`);
        return this.makeRequest(requestFn, fallbackProviders[0], fallbackProviders.slice(1));
      }
      
      throw error;
    }
  }

  /**
   * Get provider statistics
   */
  getStats() {
    const stats = {
      providers: Array.from(this.providers.values()).map(p => ({
        name: p.name,
        requestCount: p.requestCount,
        isRateLimited: p.isRateLimited,
        rateLimitUntil: p.rateLimitUntil,
        lastUsed: p.lastUsed
      })),
      totalRequests: Array.from(this.providers.values()).reduce((sum, p) => sum + p.requestCount, 0)
    };
    
    return stats;
  }

  /**
   * Reset all rate limits
   */
  resetRateLimits() {
    for (const provider of this.providers.values()) {
      provider.isRateLimited = false;
      provider.requestCount = 0;
      provider.rateLimitUntil = 0;
    }
    console.log('🔄 All rate limits reset');
  }
}

// Export singleton instance
export const apiRateLimiter = new APIRateLimiter();

/**
 * Helper function to make API requests with rate limiting
 */
export async function makeRateLimitedRequest(
  requestFn: (provider: APIProvider) => Promise<Response>,
  preferredProvider?: string,
  fallbackProviders: string[] = ['ollama']
) {
  return apiRateLimiter.makeRequest(requestFn, preferredProvider, fallbackProviders);
}

/**
 * Get current rate limiter statistics
 */
export function getRateLimiterStats() {
  return apiRateLimiter.getStats();
}

/**
 * Reset all rate limits (useful for testing)
 */
export function resetAllRateLimits() {
  apiRateLimiter.resetRateLimits();
}
