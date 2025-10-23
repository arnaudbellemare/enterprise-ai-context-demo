/**
 * WALT Cache Manager
 *
 * LRU cache implementation with size limits and TTL support
 * Prevents memory leaks and provides predictable resource usage
 */

import { LRUCache } from 'lru-cache';
import { createLogger } from './logger';
import type { DiscoveredWALTTool } from './types';

const logger = createLogger('walt:cache');

export interface CacheEntry<T> {
  data: T;
  expires_at: Date;
  created_at: Date;
}

export interface CacheOptions {
  max?: number; // Maximum number of items in cache
  ttl?: number; // Time to live in milliseconds
  updateAgeOnGet?: boolean; // Update age on cache access
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  hit_rate: number;
}

/**
 * Generic LRU Cache Manager with TTL support
 */
export class CacheManager<T> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };

  constructor(options: CacheOptions = {}) {
    const {
      max = 1000, // Default: 1000 items
      ttl = 3600000, // Default: 1 hour
      updateAgeOnGet = true,
    } = options;

    this.cache = new LRUCache<string, CacheEntry<T>>({
      max,
      ttl,
      updateAgeOnGet,
      dispose: (value, key) => {
        this.stats.evictions++;
        logger.debug('Cache entry evicted', { key, size: this.cache.size });
      },
    });

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };

    logger.info('Cache manager initialized', {
      maxSize: max,
      ttlMs: ttl,
    });
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.debug('Cache miss', { key });
      return undefined;
    }

    // Check if entry has expired (double-check since LRU handles TTL)
    if (entry.expires_at < new Date()) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug('Cache entry expired', { key, expired_at: entry.expires_at });
      return undefined;
    }

    this.stats.hits++;
    logger.debug('Cache hit', { key, age: Date.now() - entry.created_at.getTime() });
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const now = new Date();
    const expires_at = new Date(now.getTime() + (ttl || 3600000));

    const entry: CacheEntry<T> = {
      data,
      expires_at,
      created_at: now,
    };

    this.cache.set(key, entry);
    logger.debug('Cache entry set', {
      key,
      expires_at,
      size: this.cache.size,
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { previous_size: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hit_rate = total > 0 ? this.stats.hits / total : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hit_rate: Math.round(hit_rate * 100) / 100,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    logger.info('Cache stats reset');
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get remaining capacity
   */
  remainingCapacity(): number {
    return (this.cache.max || 0) - this.cache.size;
  }
}

/**
 * Discovery-specific cache manager
 */
export interface DiscoveryCacheEntry {
  tools: DiscoveredWALTTool[];
  domain: string;
  url: string;
}

export class DiscoveryCacheManager extends CacheManager<DiscoveryCacheEntry> {
  constructor() {
    // Discovery cache: 500 entries, 24 hour TTL
    super({
      max: 500,
      ttl: 86400000, // 24 hours
      updateAgeOnGet: true,
    });
  }

  /**
   * Generate cache key for URL and domain
   */
  static getCacheKey(url: string, domain: string): string {
    return `${domain}:${url}`;
  }

  /**
   * Get cached tools for URL
   */
  getTools(url: string, domain: string): DiscoveredWALTTool[] | undefined {
    const key = DiscoveryCacheManager.getCacheKey(url, domain);
    const entry = this.get(key);
    return entry?.tools;
  }

  /**
   * Cache discovered tools
   */
  setTools(url: string, domain: string, tools: DiscoveredWALTTool[], ttl?: number): void {
    const key = DiscoveryCacheManager.getCacheKey(url, domain);
    this.set(key, { tools, domain, url }, ttl);
  }
}

/**
 * Singleton cache instances
 */
export const discoveryCache = new DiscoveryCacheManager();
