import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Production-grade cache implementation with advanced features
interface CacheEntry {
  value: any;
  expires: number;
  created: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
  size: number;
}

class ProductionCache {
  private cache = new Map<string, CacheEntry>();
  private accessLog = new Map<string, number[]>();
  private maxSize: number;
  private maxMemoryMB: number;
  private hitCount = 0;
  private missCount = 0;
  
  constructor(maxSize: number = 10000, maxMemoryMB: number = 100) {
    this.maxSize = maxSize;
    this.maxMemoryMB = maxMemoryMB;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  async set(key: string, value: any, ttl: number = 3600, tags?: string[]): Promise<boolean> {
    const now = Date.now();
    const expires = now + (ttl * 1000);
    const serialized = JSON.stringify(value);
    const size = new Blob([serialized]).size;
    
    // Check memory limits
    if (this.getMemoryUsage() + size > this.maxMemoryMB * 1024 * 1024) {
      this.evictLRU();
    }
    
    // Check size limits
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      expires,
      created: now,
      accessCount: 0,
      lastAccessed: now,
      tags,
      size
    });
    
    return true;
  }
  
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) {
      this.missCount++;
      return null;
    }
    
    const now = Date.now();
    if (now > item.expires) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }
    
    // Update access tracking
    item.accessCount++;
    item.lastAccessed = now;
    this.hitCount++;
    
    // Track access pattern
    if (!this.accessLog.has(key)) {
      this.accessLog.set(key, []);
    }
    this.accessLog.get(key)!.push(now);
    
    return item.value;
  }
  
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    this.accessLog.delete(key);
    return deleted;
  }
  
  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessLog.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
  
  // Advanced cache operations
  async getByTag(tag: string): Promise<Array<{ key: string; value: any }>> {
    const results = [];
    for (const [key, item] of this.cache.entries()) {
      if (item.tags?.includes(tag) && Date.now() <= item.expires) {
        results.push({ key, value: item.value });
      }
    }
    return results;
  }
  
  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.tags?.includes(tag)) {
        this.cache.delete(key);
        this.accessLog.delete(key);
        count++;
      }
    }
    return count;
  }
  
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessLog.delete(oldestKey);
    }
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        this.accessLog.delete(key);
      }
    }
  }
  
  private getMemoryUsage(): number {
    let total = 0;
    for (const item of this.cache.values()) {
      total += item.size;
    }
    return total;
  }
  
  async getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.entries()).filter(([_, item]) => now <= item.expires);
    
    // Calculate hit rate
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    
    // Calculate memory usage
    const memoryUsage = this.getMemoryUsage();
    const memoryUsageMB = memoryUsage / (1024 * 1024);
    
    return {
      total_entries: this.cache.size,
      valid_entries: validEntries.length,
      expired_entries: this.cache.size - validEntries.length,
      hit_rate: Math.round(hitRate * 100) / 100,
      miss_rate: Math.round((1 - hitRate) * 100) / 100,
      total_hits: this.hitCount,
      total_misses: this.missCount,
      memory_usage_mb: Math.round(memoryUsageMB * 100) / 100,
      max_memory_mb: this.maxMemoryMB,
      memory_utilization: Math.round((memoryUsageMB / this.maxMemoryMB) * 100),
      avg_ttl: 3600,
      top_keys: this.getTopKeys(5)
    };
  }
  
  private getTopKeys(limit: number): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    return Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, accessCount: item.accessCount, lastAccessed: item.lastAccessed }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }
}

// Global production cache instance
const productionCache = new ProductionCache();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, value, ttl, tags } = body;

    switch (action) {
      case 'set':
        if (!key || value === undefined) {
          return NextResponse.json({ error: 'Key and value are required for set operation' }, { status: 400 });
        }
        const success = await productionCache.set(key, value, ttl, tags);
        return NextResponse.json({ success, message: 'Value cached successfully' });

      case 'get':
        if (!key) {
          return NextResponse.json({ error: 'Key is required for get operation' }, { status: 400 });
        }
        const result = await productionCache.get(key);
        return NextResponse.json({ success: true, value: result, hit: result !== null });

      case 'delete':
        if (!key) {
          return NextResponse.json({ error: 'Key is required for delete operation' }, { status: 400 });
        }
        const deleted = await productionCache.delete(key);
        return NextResponse.json({ success: true, deleted });

      case 'exists':
        if (!key) {
          return NextResponse.json({ error: 'Key is required for exists operation' }, { status: 400 });
        }
        const exists = await productionCache.exists(key);
        return NextResponse.json({ success: true, exists });

      case 'clear':
        await productionCache.clear();
        return NextResponse.json({ success: true, message: 'Cache cleared' });

      case 'getByTag':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json({ error: 'Tags array is required for getByTag operation' }, { status: 400 });
        }
        const tagResults = await productionCache.getByTag(tags[0]);
        return NextResponse.json({ success: true, results: tagResults });

      case 'invalidateByTag':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json({ error: 'Tags array is required for invalidateByTag operation' }, { status: 400 });
        }
        const invalidated = await productionCache.invalidateByTag(tags[0]);
        return NextResponse.json({ success: true, invalidated });

      case 'stats':
        const stats = await productionCache.getStats();
        return NextResponse.json({ success: true, stats });

      default:
        return NextResponse.json({ error: 'Invalid action. Supported actions: set, get, delete, exists, clear, getByTag, invalidateByTag, stats' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Production Cache Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = await productionCache.getStats();
    return NextResponse.json({
      success: true,
      message: 'Production-grade cache system',
      stats,
      capabilities: [
        'LRU eviction',
        'Memory management',
        'Access tracking',
        'Tag-based operations',
        'Automatic cleanup',
        'Performance metrics'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get cache stats', 
      details: error.message 
    }, { status: 500 });
  }
}
