/**
 * 🎓 Teacher Model Caching System
 * 
 * Implements intelligent caching for teacher model (Perplexity) responses
 * with OCR-specific caching, semantic similarity, and adaptive TTL
 */

export interface CachedTeacherResponse {
  id: string;
  query: string;
  response: string;
  timestamp: number;
  ttl: number;
  domain: string;
  confidence: number;
  metadata: {
    model: string;
    tokens: number;
    cost: number;
    processingTime: number;
    ocrResults?: string[];
    semanticHash: string;
  };
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  totalCostSaved: number;
  domainBreakdown: Record<string, number>;
}

class TeacherModelCache {
  private cache = new Map<string, CachedTeacherResponse>();
  private accessLog = new Map<string, number[]>();
  private semanticIndex = new Map<string, string[]>(); // semantic hash -> cache keys
  private maxSize = 1000;
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate semantic hash for query similarity matching
   */
  private generateSemanticHash(query: string): string {
    // Simple semantic hashing based on key terms and structure
    const normalized = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = normalized.split(' ');
    const keyTerms = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'oil', 'sit', 'try', 'use'].includes(word)
    );
    
    return keyTerms.sort().join('-').substring(0, 50);
  }

  /**
   * Calculate semantic similarity between two queries
   */
  private calculateSimilarity(query1: string, query2: string): number {
    const hash1 = this.generateSemanticHash(query1);
    const hash2 = this.generateSemanticHash(query2);
    
    if (hash1 === hash2) return 1.0;
    
    const words1 = new Set(hash1.split('-'));
    const words2 = new Set(hash2.split('-'));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Check if cached response is still valid
   */
  private isValid(cached: CachedTeacherResponse): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Get cache key for query
   */
  private getCacheKey(query: string, domain: string): string {
    return `${domain}:${this.generateSemanticHash(query)}`;
  }

  /**
   * Find similar cached responses
   */
  private findSimilarResponses(query: string, domain: string, threshold: number = 0.7): CachedTeacherResponse[] {
    const semanticHash = this.generateSemanticHash(query);
    const similarKeys = this.semanticIndex.get(semanticHash) || [];
    
    const similar: CachedTeacherResponse[] = [];
    
    for (const key of similarKeys) {
      const cached = this.cache.get(key);
      if (cached && this.isValid(cached) && cached.domain === domain) {
        const similarity = this.calculateSimilarity(query, cached.query);
        if (similarity >= threshold) {
          similar.push(cached);
        }
      }
    }
    
    return similar.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Cache a teacher model response
   */
  public cacheResponse(
    query: string,
    response: string,
    domain: string,
    metadata: {
      model: string;
      tokens: number;
      cost: number;
      processingTime: number;
      ocrResults?: string[];
    }
  ): string {
    const cacheKey = this.getCacheKey(query, domain);
    const semanticHash = this.generateSemanticHash(query);
    
    // Calculate confidence based on response quality
    const confidence = Math.min(1.0, response.length / 1000); // Simple confidence metric
    
    // Adaptive TTL based on domain and confidence
    const adaptiveTTL = this.calculateAdaptiveTTL(domain, confidence);
    
    const cachedResponse: CachedTeacherResponse = {
      id: cacheKey,
      query,
      response,
      timestamp: Date.now(),
      ttl: adaptiveTTL,
      domain,
      confidence,
      metadata: {
        ...metadata,
        semanticHash
      }
    };
    
    // Store in cache
    this.cache.set(cacheKey, cachedResponse);
    
    // Update semantic index
    if (!this.semanticIndex.has(semanticHash)) {
      this.semanticIndex.set(semanticHash, []);
    }
    this.semanticIndex.get(semanticHash)!.push(cacheKey);
    
    // Update access log
    this.accessLog.set(cacheKey, [Date.now()]);
    
    // Cleanup if cache is full
    this.cleanup();
    
    return cacheKey;
  }

  /**
   * Calculate adaptive TTL based on domain and confidence
   */
  private calculateAdaptiveTTL(domain: string, confidence: number): number {
    const baseTTL = this.defaultTTL;
    
    // Domain-specific TTL adjustments
    const domainMultipliers = {
      finance: 0.5,    // Financial data changes frequently
      healthcare: 2.0, // Medical knowledge is more stable
      technology: 0.3, // Tech changes very rapidly
      legal: 3.0,      // Legal knowledge is very stable
      education: 1.5,  // Educational content is moderately stable
      general: 1.0     // General knowledge baseline
    };
    
    const domainMultiplier = domainMultipliers[domain as keyof typeof domainMultipliers] || 1.0;
    const confidenceMultiplier = 0.5 + (confidence * 0.5); // 0.5x to 1.0x based on confidence
    
    return baseTTL * domainMultiplier * confidenceMultiplier;
  }

  /**
   * Get cached response for query
   */
  public getCachedResponse(query: string, domain: string): {
    response: string;
    cacheKey: string;
    confidence: number;
    age: number;
    source: 'exact' | 'similar';
  } | null {
    const cacheKey = this.getCacheKey(query, domain);
    
    // Check for exact match
    const exact = this.cache.get(cacheKey);
    if (exact && this.isValid(exact)) {
      this.recordAccess(cacheKey);
      return {
        response: exact.response,
        cacheKey: exact.id,
        confidence: exact.confidence,
        age: Date.now() - exact.timestamp,
        source: 'exact'
      };
    }
    
    // Check for similar responses
    const similar = this.findSimilarResponses(query, domain, 0.8);
    if (similar.length > 0) {
      const best = similar[0];
      this.recordAccess(best.id);
      return {
        response: best.response,
        cacheKey: best.id,
        confidence: best.confidence * 0.9, // Slightly lower confidence for similar matches
        age: Date.now() - best.timestamp,
        source: 'similar'
      };
    }
    
    return null;
  }

  /**
   * Record cache access for LRU cleanup
   */
  private recordAccess(cacheKey: string): void {
    const now = Date.now();
    const accesses = this.accessLog.get(cacheKey) || [];
    accesses.push(now);
    
    // Keep only recent accesses (last 10)
    if (accesses.length > 10) {
      accesses.splice(0, accesses.length - 10);
    }
    
    this.accessLog.set(cacheKey, accesses);
  }

  /**
   * Cleanup expired and least recently used entries
   */
  private cleanup(): void {
    if (this.cache.size <= this.maxSize) return;
    
    // Remove expired entries first
    for (const [key, cached] of this.cache.entries()) {
      if (!this.isValid(cached)) {
        this.cache.delete(key);
        this.accessLog.delete(key);
      }
    }
    
    // If still over limit, remove least recently used
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
        key,
        cached,
        lastAccess: Math.max(...(this.accessLog.get(key) || [0]))
      }));
      
      entries.sort((a, b) => a.lastAccess - b.lastAccess);
      
      const toRemove = entries.slice(0, this.cache.size - this.maxSize);
      for (const entry of toRemove) {
        this.cache.delete(entry.key);
        this.accessLog.delete(entry.key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const totalEntries = this.cache.size;
    const now = Date.now();
    
    let totalHits = 0;
    let totalMisses = 0;
    let totalResponseTime = 0;
    let totalCostSaved = 0;
    const domainBreakdown: Record<string, number> = {};
    
    for (const [key, cached] of this.cache.entries()) {
      const accesses = this.accessLog.get(key) || [];
      totalHits += accesses.length;
      
      if (this.isValid(cached)) {
        totalResponseTime += cached.metadata.processingTime;
        totalCostSaved += cached.metadata.cost;
        
        domainBreakdown[cached.domain] = (domainBreakdown[cached.domain] || 0) + 1;
      } else {
        totalMisses++;
      }
    }
    
    return {
      totalEntries,
      hitRate: totalHits / (totalHits + totalMisses) || 0,
      missRate: totalMisses / (totalHits + totalMisses) || 0,
      averageResponseTime: totalResponseTime / totalEntries || 0,
      totalCostSaved,
      domainBreakdown
    };
  }

  /**
   * Clear cache
   */
  public clear(): void {
    this.cache.clear();
    this.accessLog.clear();
    this.semanticIndex.clear();
  }
}

export const teacherModelCache = new TeacherModelCache();
