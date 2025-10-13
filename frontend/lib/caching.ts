/**
 * Production Caching Layer
 * Redis-based caching with fallback to in-memory
 */

import crypto from 'crypto';
import { log } from './monitoring';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;  // Custom cache key
  tags?: string[]; // Tags for cache invalidation
}

interface CacheEntry<T> {
  value: T;
  expires: number;
  tags: string[];
  created: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private redis: any = null;
  private useRedis: boolean = false;
  
  constructor() {
    this.initializeRedis();
  }
  
  private async initializeRedis() {
    // Initialize Redis connection if available
    if (process.env.REDIS_URL && typeof window === 'undefined') {
      try {
        const { createClient } = await import('redis');
        this.redis = createClient({
          url: process.env.REDIS_URL
        });
        
        await this.redis.connect();
        this.useRedis = true;
        
        log.info('Redis cache initialized', {
          url: process.env.REDIS_URL.replace(/:[^:]*@/, ':***@') // Hide password
        });
      } catch (error) {
        log.warn('Redis not available, using memory cache', error);
        this.useRedis = false;
      }
    }
  }
  
  /**
   * Generate cache key from input
   */
  generateKey(input: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(input));
    return hash.digest('hex').substring(0, 16);
  }
  
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.useRedis && this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          log.perf('Cache hit (Redis)', { duration: 0, cost: 0, cacheHit: true }, { key });
          return JSON.parse(cached) as T;
        }
      }
      
      // Fallback to memory cache
      const entry = this.memoryCache.get(key);
      if (entry) {
        // Check expiration
        if (entry.expires > Date.now()) {
          log.perf('Cache hit (Memory)', { duration: 0, cost: 0, cacheHit: true }, { key });
          return entry.value as T;
        } else {
          // Expired, remove
          this.memoryCache.delete(key);
        }
      }
      
      log.perf('Cache miss', { duration: 0, cost: 0, cacheHit: false }, { key });
      return null;
    } catch (error) {
      log.error('Cache get error', error, { key });
      return null;
    }
  }
  
  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 3600; // Default 1 hour
      const expires = Date.now() + (ttl * 1000);
      
      // Store in Redis
      if (this.useRedis && this.redis) {
        await this.redis.setEx(key, ttl, JSON.stringify(value));
        
        // Store tags for invalidation
        if (options.tags) {
          for (const tag of options.tags) {
            await this.redis.sAdd(`tag:${tag}`, key);
            await this.redis.expire(`tag:${tag}`, ttl);
          }
        }
      }
      
      // Store in memory cache
      this.memoryCache.set(key, {
        value,
        expires,
        tags: options.tags || [],
        created: Date.now()
      });
      
      log.info('Cache set', {
        key,
        ttl,
        storage: this.useRedis ? 'redis+memory' : 'memory',
        tags: options.tags
      });
      
      // Cleanup old entries periodically
      if (this.memoryCache.size > 1000) {
        this.cleanupMemoryCache();
      }
    } catch (error) {
      log.error('Cache set error', error, { key });
    }
  }
  
  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
      
      log.info('Cache deleted', { key });
    } catch (error) {
      log.error('Cache delete error', error, { key });
    }
  }
  
  /**
   * Invalidate by tag
   */
  async invalidateTag(tag: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.sMembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(keys);
          await this.redis.del(`tag:${tag}`);
        }
      }
      
      // Memory cache invalidation
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags.includes(tag)) {
          this.memoryCache.delete(key);
        }
      }
      
      log.info('Cache tag invalidated', { tag });
    } catch (error) {
      log.error('Cache invalidate error', error, { tag });
    }
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.flushDb();
      }
      this.memoryCache.clear();
      
      log.info('Cache cleared');
    } catch (error) {
      log.error('Cache clear error', error);
    }
  }
  
  /**
   * Cleanup expired memory cache entries
   */
  private cleanupMemoryCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires < now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      log.info('Memory cache cleaned', { removed: cleaned, remaining: this.memoryCache.size });
    }
  }
  
  /**
   * Get cache stats
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      usingRedis: this.useRedis,
      entries: Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
        key,
        expires: new Date(entry.expires).toISOString(),
        tags: entry.tags,
        age: Date.now() - entry.created
      }))
    };
  }
}

// Singleton instance
const cache = new CacheManager();

// Convenience wrapper for caching expensive operations
export async function cached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Cache miss - fetch data
  const startTime = Date.now();
  const data = await fetchFn();
  const duration = Date.now() - startTime;
  
  // Store in cache
  await cache.set(key, data, options);
  
  log.perf('Cached function', { duration, cost: 0, cacheHit: false }, { key });
  
  return data;
}

export { cache, CacheManager };
export type { CacheOptions };

