/**
 * Pipeline Result Cache
 * 
 * Caches expensive computation results to improve performance and reduce costs.
 * Implements LRU eviction and TTL-based expiration.
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

export class PipelineCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(maxSize: number = 500, defaultTTL: number = 3600000) { // 1 hour default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from query and context
   */
  private generateKey(query: string, domain?: string, additional?: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    const domainPart = domain || 'general';
    const additionalPart = additional ? `:${additional}` : '';
    return `${domainPart}:${this.hashString(normalizedQuery)}${additionalPart}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update hit stats
    entry.hits++;
    this.hitCount++;
    
    return entry.value as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;
    let lruTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize: least hits, then oldest
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp < lruTimestamp)) {
        lruKey = key;
        lruHits = entry.hits;
        lruTimestamp = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Cache IRT difficulty calculation
   */
  getIRTDifficulty(query: string, domain: string): number | null {
    const key = this.generateKey(query, domain, 'irt');
    return this.get<number>(key);
  }

  setIRTDifficulty(query: string, domain: string, difficulty: number): void {
    const key = this.generateKey(query, domain, 'irt');
    this.set(key, difficulty, 7200000); // 2 hour TTL for IRT (stable)
  }

  /**
   * Cache semiotic analysis
   */
  getSemioticAnalysis(query: string, domain?: string): any | null {
    const key = this.generateKey(query, domain, 'semiotic');
    return this.get<any>(key);
  }

  setSemioticAnalysis(query: string, domain: string | undefined, analysis: any): void {
    const key = this.generateKey(query, domain, 'semiotic');
    this.set(key, analysis, 3600000); // 1 hour TTL
  }

  /**
   * Cache LLM response (with shorter TTL due to potential data changes)
   */
  getLLMResponse(query: string, domain?: string, model?: string): string | null {
    const key = this.generateKey(query, domain, `llm:${model || 'default'}`);
    return this.get<string>(key);
  }

  setLLMResponse(query: string, domain: string | undefined, response: string, model?: string, ttl?: number): void {
    const key = this.generateKey(query, domain, `llm:${model || 'default'}`);
    this.set(key, response, ttl || 1800000); // 30 min default TTL for LLM responses
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
  } {
    const totalRequests = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      totalRequests,
      hits: this.hitCount,
      misses: this.missCount,
    };
  }

  /**
   * Clear expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.defaultTTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
export const pipelineCache = new PipelineCache();

