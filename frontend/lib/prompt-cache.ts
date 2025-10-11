/**
 * Prompt Cache Manager - Grok Principle #6
 * Optimize for cache hits by keeping stable prompt structure
 * 
 * Key insight: LLMs cache prompts. Stable system prompts = faster inference.
 */

export interface CachedPrompt {
  system: string;      // STABLE - gets cached
  user: string;        // VARIES - not cached
  context?: string;    // SEMI-STABLE - append to user
  cacheKey: string;    // For tracking cache hits
}

export interface PromptCacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  avgResponseTime: {
    cached: number;
    uncached: number;
  };
}

// In-memory cache stats
const cacheStats = new Map<string, {
  hits: number;
  misses: number;
  totalTime: number;
  cachedTime: number;
}>();

/**
 * Create cache-optimized prompt structure
 * 
 * Grok Principle #6: Stable prompts = cache hits = faster inference
 */
export class PromptCacheManager {
  private stableSystemPrompts: Map<string, string> = new Map();

  /**
   * Register a stable system prompt for an agent type
   * This prompt should NEVER change to maximize cache hits
   */
  registerStablePrompt(agentType: string, systemPrompt: string): void {
    this.stableSystemPrompts.set(agentType, systemPrompt);
    console.log(`✅ Registered stable prompt for: ${agentType}`);
  }

  /**
   * Build cache-friendly prompt structure
   * 
   * Key principle: System prompt stays same, only user content varies
   */
  buildCachedPrompt(
    agentType: string,
    userQuery: string,
    context?: string,
    additionalInstructions?: string
  ): CachedPrompt {
    // Get stable system prompt (CACHED by LLM)
    const systemPrompt = this.stableSystemPrompts.get(agentType) || 
      'You are a helpful AI assistant.';

    // Build user message (NOT cached, but that's OK - only this part changes)
    const userParts: string[] = [];

    // Add context if provided (using Markdown sections)
    if (context) {
      userParts.push('## Context');
      userParts.push(context);
      userParts.push('');
    }

    // Add additional instructions if any
    if (additionalInstructions) {
      userParts.push('## Additional Instructions');
      userParts.push(additionalInstructions);
      userParts.push('');
    }

    // Add the actual query
    userParts.push('## Query');
    userParts.push(userQuery);

    const userMessage = userParts.join('\n');

    // Create cache key for tracking
    const cacheKey = `${agentType}-${this._hashString(systemPrompt)}`;

    return {
      system: systemPrompt,
      user: userMessage,
      context,
      cacheKey
    };
  }

  /**
   * Track cache performance
   */
  trackRequest(cacheKey: string, wasHit: boolean, responseTime: number): void {
    if (!cacheStats.has(cacheKey)) {
      cacheStats.set(cacheKey, {
        hits: 0,
        misses: 0,
        totalTime: 0,
        cachedTime: 0
      });
    }

    const stats = cacheStats.get(cacheKey)!;

    if (wasHit) {
      stats.hits++;
      stats.cachedTime += responseTime;
    } else {
      stats.misses++;
    }

    stats.totalTime += responseTime;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(cacheKey?: string): PromptCacheStats | Map<string, PromptCacheStats> {
    if (cacheKey) {
      const stats = cacheStats.get(cacheKey);
      if (!stats) {
        return {
          totalRequests: 0,
          cacheHits: 0,
          cacheMisses: 0,
          hitRate: 0,
          avgResponseTime: { cached: 0, uncached: 0 }
        };
      }

      const totalRequests = stats.hits + stats.misses;
      return {
        totalRequests,
        cacheHits: stats.hits,
        cacheMisses: stats.misses,
        hitRate: totalRequests > 0 ? stats.hits / totalRequests : 0,
        avgResponseTime: {
          cached: stats.hits > 0 ? stats.cachedTime / stats.hits : 0,
          uncached: stats.misses > 0 ? (stats.totalTime - stats.cachedTime) / stats.misses : 0
        }
      };
    }

    // Return all stats
    const allStats = new Map<string, PromptCacheStats>();
    for (const [key, stats] of cacheStats.entries()) {
      const totalRequests = stats.hits + stats.misses;
      allStats.set(key, {
        totalRequests,
        cacheHits: stats.hits,
        cacheMisses: stats.misses,
        hitRate: totalRequests > 0 ? stats.hits / totalRequests : 0,
        avgResponseTime: {
          cached: stats.hits > 0 ? stats.cachedTime / stats.hits : 0,
          uncached: stats.misses > 0 ? (stats.totalTime - stats.cachedTime) / stats.misses : 0
        }
      });
    }

    return allStats;
  }

  /**
   * Simple string hashing for cache keys
   */
  private _hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Global cache manager instance
export const promptCache = new PromptCacheManager();

// Initialize with stable prompts
if (typeof window === 'undefined') {
  // Server-side initialization
  import('./system-prompts').then(({ SYSTEM_PROMPTS }) => {
    promptCache.registerStablePrompt('market_research', SYSTEM_PROMPTS.market_research);
    promptCache.registerStablePrompt('entity_extraction', SYSTEM_PROMPTS.entity_extraction);
    promptCache.registerStablePrompt('team_collaboration', SYSTEM_PROMPTS.team_collaboration);
  });
}

/**
 * Middleware helper for APIs
 * Automatically structures prompts for cache optimization
 */
export function withCacheOptimization(
  agentType: string,
  userQuery: string,
  context?: string
): CachedPrompt {
  return promptCache.buildCachedPrompt(agentType, userQuery, context);
}

