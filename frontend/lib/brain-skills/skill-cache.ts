/**
 * Skill Cache System for Brain
 *
 * Provides intelligent caching for skill results to improve performance
 * and reduce API costs for similar queries.
 *
 * Features:
 * - LRU cache with TTL
 * - Query similarity detection with semantic optimization
 * - Per-skill cache configuration
 * - Cache hit metrics
 * - Optimized key generation for better hit rates
 */

import { SkillResult, SkillCacheEntry } from './types';
import { getCacheKeyOptimizer } from './cache-key-optimizer';

export interface SkillCacheConfig {
  maxSize: number;
  defaultTTL: number; // milliseconds
  enableSemanticSimilarity: boolean;
  similarityThreshold: number; // 0.0 - 1.0
}

export class SkillCache {
  private cache: Map<string, SkillCacheEntry>;
  private accessOrder: string[]; // For LRU
  private config: SkillCacheConfig;
  private hitCount: number = 0;
  private missCount: number = 0;
  private optimizer = getCacheKeyOptimizer();

  constructor(config?: Partial<SkillCacheConfig>) {
    this.cache = new Map();
    this.accessOrder = [];
    this.config = {
      maxSize: config?.maxSize || 1000,
      defaultTTL: config?.defaultTTL || 3600000, // 1 hour
      enableSemanticSimilarity: config?.enableSemanticSimilarity || true,
      similarityThreshold: config?.similarityThreshold || 0.85
    };
  }

  /**
   * Generate optimized cache key for skill + query + context
   */
  private generateCacheKey(skillName: string, query: string, context?: any): string {
    // Use optimizer for better key generation
    return this.optimizer.generateKey(skillName, query, context);
  }

  /**
   * Hash context object for cache key (delegated to optimizer)
   */
  private hashContext(context: any): string {
    return this.optimizer.hashContext(context);
  }

  /**
   * Get cached result if available and valid
   */
  get(skillName: string, query: string, context?: any, ttl?: number): SkillResult | null {
    const key = this.generateCacheKey(skillName, query, context);
    const cached = this.cache.get(key);

    if (!cached) {
      this.missCount++;
      return null;
    }

    // Check if cache entry is still valid
    const maxAge = ttl || this.config.defaultTTL;
    const age = Date.now() - cached.timestamp;

    if (age > maxAge) {
      // Cache entry expired
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.missCount++;
      return null;
    }

    // Update access order (LRU)
    this.updateAccessOrder(key);
    this.hitCount++;

    console.log(`   💾 Cache HIT for ${skillName} (age: ${Math.round(age / 1000)}s)`);

    // Return cached result with updated metadata
    return {
      ...cached.result,
      metadata: {
        ...cached.result.metadata,
        cacheHit: true
      }
    };
  }

  /**
   * Store result in cache
   */
  set(skillName: string, query: string, result: SkillResult, context?: any): void {
    const key = this.generateCacheKey(skillName, query, context);

    // Enforce cache size limit (LRU eviction)
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      const oldestKey = this.accessOrder[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.removeFromAccessOrder(oldestKey);
      }
    }

    const entry: SkillCacheEntry = {
      result,
      timestamp: Date.now(),
      query,
      context
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);

    console.log(`   💾 Cache STORED for ${skillName} (total: ${this.cache.size})`);
  }

  /**
   * Invalidate cache entries for a specific skill
   */
  invalidateSkill(skillName: string): number {
    let removed = 0;
    const keysToRemove: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${skillName}:`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      removed++;
    });

    console.log(`   💾 Invalidated ${removed} cache entries for ${skillName}`);
    return removed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
    console.log(`   💾 Cache CLEARED`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
      utilizationPercent: (this.cache.size / this.config.maxSize) * 100
    };
  }

  /**
   * Update LRU access order
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Find similar cached queries (for future semantic similarity)
   */
  findSimilar(query: string, threshold: number = 0.85): SkillCacheEntry[] {
    // Simple string similarity for now
    // TODO: Implement semantic similarity with embeddings
    const normalizedQuery = query.toLowerCase().trim();
    const similar: SkillCacheEntry[] = [];

    for (const entry of this.cache.values()) {
      const similarity = this.calculateStringSimilarity(
        normalizedQuery,
        entry.query.toLowerCase().trim()
      );

      if (similarity >= threshold) {
        similar.push(entry);
      }
    }

    return similar.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Simple string similarity (Jaccard similarity)
   */
  private calculateStringSimilarity(s1: string, s2: string): number {
    const words1 = new Set(s1.split(' '));
    const words2 = new Set(s2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// Global cache instance
let globalSkillCache: SkillCache | null = null;

/**
 * Get or create global skill cache
 */
export function getSkillCache(): SkillCache {
  if (!globalSkillCache) {
    globalSkillCache = new SkillCache({
      maxSize: 1000,
      defaultTTL: 3600000, // 1 hour
      enableSemanticSimilarity: true,
      similarityThreshold: 0.85
    });
  }
  return globalSkillCache;
}

/**
 * Reset global cache (for testing)
 */
export function resetSkillCache(): void {
  globalSkillCache = null;
}
