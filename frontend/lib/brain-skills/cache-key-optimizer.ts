/**
 * Cache Key Optimizer
 *
 * Intelligent cache key generation with semantic similarity
 * to maximize cache hit rates for similar queries.
 *
 * Features:
 * - Query normalization and canonicalization
 * - Stopword removal
 * - Synonym handling
 * - Fuzzy context matching
 * - Semantic fingerprinting
 */

export interface CacheKeyConfig {
  enableNormalization: boolean;
  enableStopwordRemoval: boolean;
  enableSynonymMatching: boolean;
  fuzzyContextMatching: boolean;
  minSimilarityThreshold: number;
}

/**
 * Common English stopwords to remove for better key matching
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'when', 'where', 'why', 'how'
]);

/**
 * Common synonyms for semantic matching
 */
const SYNONYMS: { [key: string]: string } = {
  // Technology
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'nn': 'neural network',
  'dl': 'deep learning',
  'nlp': 'natural language processing',

  // Business
  'optimize': 'optimization',
  'analyze': 'analysis',
  'implement': 'implementation',
  'develop': 'development',
  'create': 'creation',

  // Actions
  'explain': 'describe',
  'show': 'display',
  'tell': 'inform',
  'find': 'search',
  'get': 'retrieve',

  // Questions
  'whats': 'what is',
  'hows': 'how is',
  'wheres': 'where is',
  'whos': 'who is',
  'whens': 'when is'
};

export class CacheKeyOptimizer {
  private config: CacheKeyConfig;

  constructor(config?: Partial<CacheKeyConfig>) {
    this.config = {
      enableNormalization: config?.enableNormalization ?? true,
      enableStopwordRemoval: config?.enableStopwordRemoval ?? true,
      enableSynonymMatching: config?.enableSynonymMatching ?? true,
      fuzzyContextMatching: config?.fuzzyContextMatching ?? true,
      minSimilarityThreshold: config?.minSimilarityThreshold ?? 0.85
    };
  }

  /**
   * Generate optimized cache key
   */
  generateKey(skillName: string, query: string, context?: any): string {
    const normalizedQuery = this.normalizeQuery(query);
    const contextHash = context ? this.hashContext(context) : '';

    const baseKey = `${skillName}:${normalizedQuery}`;
    return contextHash ? `${baseKey}:${contextHash}` : baseKey;
  }

  /**
   * Normalize query for better cache matching
   */
  normalizeQuery(query: string): string {
    let normalized = query;

    if (this.config.enableNormalization) {
      // Convert to lowercase
      normalized = normalized.toLowerCase();

      // Remove extra whitespace
      normalized = normalized.replace(/\s+/g, ' ').trim();

      // Remove punctuation except for important chars
      normalized = normalized.replace(/[^\w\s-]/g, '');

      // Apply synonym replacement
      if (this.config.enableSynonymMatching) {
        normalized = this.applySynonyms(normalized);
      }

      // Remove stopwords
      if (this.config.enableStopwordRemoval) {
        normalized = this.removeStopwords(normalized);
      }

      // Sort words alphabetically for consistent keys
      const words = normalized.split(' ').filter(w => w.length > 0);
      words.sort();
      normalized = words.join(' ');
    }

    return normalized;
  }

  /**
   * Apply synonym replacements
   */
  private applySynonyms(text: string): string {
    let result = text;

    // Replace multi-word phrases first
    Object.entries(SYNONYMS).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Remove stopwords from query
   */
  private removeStopwords(text: string): string {
    const words = text.split(' ');
    const filtered = words.filter(word => {
      // Keep important words
      if (word.length <= 2) return !STOPWORDS.has(word);
      return !STOPWORDS.has(word);
    });

    return filtered.join(' ');
  }

  /**
   * Hash context with fuzzy matching support
   */
  hashContext(context: any): string {
    if (!context) return '';

    // Extract and normalize relevant fields
    const relevantFields: any = {};

    // Domain - normalize to base categories
    if (context.domain) {
      relevantFields.domain = this.normalizeDomain(context.domain);
    }

    // Complexity - bucket into ranges for fuzzy matching
    if (context.complexity !== undefined) {
      if (this.config.fuzzyContextMatching) {
        // Bucket complexity: 1-3 (low), 4-6 (medium), 7-10 (high)
        if (context.complexity <= 3) {
          relevantFields.complexity = 'low';
        } else if (context.complexity <= 6) {
          relevantFields.complexity = 'medium';
        } else {
          relevantFields.complexity = 'high';
        }
      } else {
        relevantFields.complexity = context.complexity;
      }
    }

    // Boolean flags - exact match
    if (context.needsReasoning !== undefined) {
      relevantFields.reasoning = !!context.needsReasoning;
    }
    if (context.needsOptimization !== undefined) {
      relevantFields.optimization = !!context.needsOptimization;
    }

    // Create stable hash
    return this.stableStringify(relevantFields);
  }

  /**
   * Normalize domain to base categories
   */
  private normalizeDomain(domain: string): string {
    const normalized = domain.toLowerCase();

    // Map similar domains to canonical names
    const domainMap: { [key: string]: string } = {
      'tech': 'technology',
      'sci': 'science',
      'eng': 'engineering',
      'biz': 'business',
      'fin': 'finance',
      'legal': 'law',
      'medicine': 'medical',
      'edu': 'education'
    };

    return domainMap[normalized] || normalized;
  }

  /**
   * Create stable JSON string for hashing
   */
  private stableStringify(obj: any): string {
    // Sort keys for stable output
    const sortedKeys = Object.keys(obj).sort();
    const pairs = sortedKeys.map(key => `${key}:${obj[key]}`);
    return pairs.join('|');
  }

  /**
   * Calculate similarity between two queries
   */
  calculateSimilarity(query1: string, query2: string): number {
    const norm1 = this.normalizeQuery(query1);
    const norm2 = this.normalizeQuery(query2);

    // Use Jaccard similarity on word sets
    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Check if two queries are semantically similar enough to share cache
   */
  areSimilar(query1: string, query2: string): boolean {
    const similarity = this.calculateSimilarity(query1, query2);
    return similarity >= this.config.minSimilarityThreshold;
  }

  /**
   * Get configuration
   */
  getConfig(): CacheKeyConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheKeyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Global optimizer instance
 */
let globalOptimizer: CacheKeyOptimizer | null = null;

/**
 * Get or create global cache key optimizer
 */
export function getCacheKeyOptimizer(): CacheKeyOptimizer {
  if (!globalOptimizer) {
    globalOptimizer = new CacheKeyOptimizer({
      enableNormalization: true,
      enableStopwordRemoval: true,
      enableSynonymMatching: true,
      fuzzyContextMatching: true,
      minSimilarityThreshold: 0.85
    });
  }
  return globalOptimizer;
}

/**
 * Reset global optimizer (for testing)
 */
export function resetCacheKeyOptimizer(): void {
  globalOptimizer = null;
}

/**
 * Utility: Test query normalization
 */
export function testNormalization(query: string): {
  original: string;
  normalized: string;
  words: string[];
  removedStopwords: number;
} {
  const optimizer = getCacheKeyOptimizer();
  const normalized = optimizer.normalizeQuery(query);
  const originalWords = query.toLowerCase().split(/\s+/);
  const normalizedWords = normalized.split(' ');

  return {
    original: query,
    normalized,
    words: normalizedWords,
    removedStopwords: originalWords.length - normalizedWords.length
  };
}

/**
 * Utility: Compare two queries
 */
export function compareQueries(query1: string, query2: string): {
  similarity: number;
  areSimilar: boolean;
  normalized1: string;
  normalized2: string;
} {
  const optimizer = getCacheKeyOptimizer();
  const normalized1 = optimizer.normalizeQuery(query1);
  const normalized2 = optimizer.normalizeQuery(query2);
  const similarity = optimizer.calculateSimilarity(query1, query2);
  const areSimilar = optimizer.areSimilar(query1, query2);

  return {
    similarity,
    areSimilar,
    normalized1,
    normalized2
  };
}
