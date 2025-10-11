/**
 * KV Cache Manager for Efficient Context Reuse
 * Implements cache-aware prompt structures and reusable prefixes
 * 
 * Based on best practices for long-running tasks with >50 steps
 */

export interface CacheEntry {
  key: string;
  value: string;
  tokens: number;
  timestamp: Date;
  hitCount: number;
  reusable: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalTokens: number;
  hitRate: number;
  reusedTokens: number;
  efficiency: number;
}

export class KVCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number;
  private maxTokensPerEntry: number;

  constructor(maxCacheSize: number = 100, maxTokensPerEntry: number = 20000) {
    this.maxCacheSize = maxCacheSize;
    this.maxTokensPerEntry = maxTokensPerEntry;
  }

  /**
   * Store reusable context in cache with automatic prefix detection
   */
  store(key: string, value: string, tokens: number, reusable: boolean = true): void {
    // Check if entry exists
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      existing.value = value;
      existing.tokens = tokens;
      existing.timestamp = new Date();
      existing.hitCount = 0; // Reset on update
      return;
    }

    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    // Store new entry
    this.cache.set(key, {
      key,
      value,
      tokens,
      timestamp: new Date(),
      hitCount: 0,
      reusable
    });
  }

  /**
   * Retrieve cached context and increment hit count
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    entry.hitCount++;
    entry.timestamp = new Date(); // Update LRU
    return entry.value;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Build cache-friendly prompt structure
   * Separates reusable prefix from dynamic query
   */
  buildCachedPrompt(
    systemPrompt: string,
    contextPrefix: string,
    dynamicQuery: string,
    cacheKey: string
  ): {
    cachedPrefix: string;
    dynamicSuffix: string;
    tokensReused: number;
  } {
    // Store reusable prefix in cache
    const prefixContent = `${systemPrompt}\n\n${contextPrefix}`;
    const estimatedTokens = this.estimateTokens(prefixContent);
    
    this.store(cacheKey, prefixContent, estimatedTokens, true);
    
    return {
      cachedPrefix: prefixContent,
      dynamicSuffix: dynamicQuery,
      tokensReused: estimatedTokens
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastUsed(): void {
    let lruKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp.getTime() < oldestTime) {
        oldestTime = entry.timestamp.getTime();
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    let totalTokens = 0;
    let totalHits = 0;
    let reusedTokens = 0;

    for (const entry of this.cache.values()) {
      totalTokens += entry.tokens;
      totalHits += entry.hitCount;
      if (entry.reusable && entry.hitCount > 0) {
        reusedTokens += entry.tokens * entry.hitCount;
      }
    }

    const hitRate = this.cache.size > 0 ? totalHits / this.cache.size : 0;
    const efficiency = totalTokens > 0 ? reusedTokens / totalTokens : 0;

    return {
      totalEntries: this.cache.size,
      totalTokens,
      hitRate,
      reusedTokens,
      efficiency: efficiency * 100
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Export cache for persistence
   */
  export(): string {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: entry.value,
      tokens: entry.tokens,
      timestamp: entry.timestamp.toISOString(),
      hitCount: entry.hitCount,
      reusable: entry.reusable
    }));
    
    return JSON.stringify(entries);
  }

  /**
   * Import cache from persistence
   */
  import(data: string): void {
    try {
      const entries = JSON.parse(data);
      this.cache.clear();
      
      for (const entry of entries) {
        this.cache.set(entry.key, {
          key: entry.key,
          value: entry.value,
          tokens: entry.tokens,
          timestamp: new Date(entry.timestamp),
          hitCount: entry.hitCount,
          reusable: entry.reusable
        });
      }
    } catch (error) {
      console.error('Failed to import cache:', error);
    }
  }
}

/**
 * DOM-based Markdown Extractor
 * Queries page markdown directly without visual encoding overhead
 */
export class DOMMarkdownExtractor {
  /**
   * Extract markdown from DOM element
   */
  static extractMarkdown(element: HTMLElement | Document): string {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );

    let markdown = '';
    let node: Node | null;

    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          markdown += text + '\n';
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // Convert HTML structure to markdown
        switch (tagName) {
          case 'h1':
            markdown += '# ';
            break;
          case 'h2':
            markdown += '## ';
            break;
          case 'h3':
            markdown += '### ';
            break;
          case 'h4':
            markdown += '#### ';
            break;
          case 'li':
            markdown += '- ';
            break;
          case 'code':
            markdown += '`';
            break;
          case 'pre':
            markdown += '```\n';
            break;
        }
      }
    }

    return markdown;
  }

  /**
   * Extract relevant information using targeted query
   * This is the key optimization: instead of dumping 20,000+ tokens,
   * we ask specific questions and extract only relevant information
   */
  static async extractRelevant(
    pageMarkdown: string,
    query: string,
    llmCall: (prompt: string) => Promise<string>
  ): Promise<string> {
    // Check if page is too large
    const estimatedTokens = Math.ceil(pageMarkdown.length / 4);
    
    if (estimatedTokens > 20000) {
      console.log(`📊 Large page detected: ${estimatedTokens} tokens`);
      console.log(`🎯 Using targeted extraction for: "${query}"`);
      
      // Use separate LLM call against page markdown
      // Retrieve only relevant information
      const extractionPrompt = `Extract only the information needed to answer this question from the provided markdown.

Question: ${query}

Markdown Content:
${pageMarkdown}

Return only the relevant excerpt (max 500 tokens) that answers the question. Be concise and precise.`;

      const relevantInfo = await llmCall(extractionPrompt);
      
      console.log(`✅ Extracted ${Math.ceil(relevantInfo.length / 4)} tokens (from ${estimatedTokens} total)`);
      
      return relevantInfo;
    }

    // For smaller pages, return full content
    return pageMarkdown;
  }

  /**
   * Extract structured data from markdown
   */
  static extractStructured(markdown: string, schema: {
    fields: string[];
  }): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const field of schema.fields) {
      // Simple pattern matching for common fields
      const patterns = [
        new RegExp(`${field}[:\\s]+(.+)`, 'i'),
        new RegExp(`\\*\\*${field}\\*\\*[:\\s]+(.+)`, 'i'),
        new RegExp(`# ${field}[\\s\\n]+(.+)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match) {
          result[field] = match[1].trim();
          break;
        }
      }
    }

    return result;
  }
}

/**
 * Concise Action Space for Minimal Token Usage
 * Action names and parameters are terse: 10-15 tokens max
 */
export class ConciseActionSpace {
  /**
   * Define ultra-concise action format
   */
  static readonly actions = {
    // Navigation (2-3 tokens)
    nav: { params: ['url'], tokens: 3 },
    clk: { params: ['sel'], tokens: 2 },
    scr: { params: ['dir', 'amt'], tokens: 3 },
    
    // Input (2-3 tokens)
    typ: { params: ['sel', 'txt'], tokens: 3 },
    sel: { params: ['sel', 'val'], tokens: 3 },
    
    // Extraction (2-4 tokens)
    ext: { params: ['q'], tokens: 2 },      // Extract with query
    get: { params: ['sel'], tokens: 2 },     // Get element text
    cnt: { params: ['sel'], tokens: 2 },     // Count elements
    
    // Validation (2-3 tokens)
    chk: { params: ['sel', 'exp'], tokens: 3 },
    wai: { params: ['sel', 'ms'], tokens: 3 },
    
    // Workflow (1-2 tokens)
    nxt: { params: [], tokens: 1 },          // Next step
    end: { params: ['res'], tokens: 2 },     // End with result
    err: { params: ['msg'], tokens: 2 }      // Error
  };

  /**
   * Format action in concise notation
   */
  static format(action: string, params: Record<string, any>): string {
    const actionDef = this.actions[action as keyof typeof this.actions];
    if (!actionDef) throw new Error(`Unknown action: ${action}`);

    // Ultra-concise format: action(p1,p2,...)
    const paramValues = actionDef.params.map(p => params[p] || '');
    return `${action}(${paramValues.join(',')})`;
  }

  /**
   * Parse concise action format
   */
  static parse(actionStr: string): {
    action: string;
    params: Record<string, any>;
  } {
    const match = actionStr.match(/^(\w+)\((.+)\)$/);
    if (!match) throw new Error(`Invalid action format: ${actionStr}`);

    const [, action, paramsStr] = match;
    const actionDef = this.actions[action as keyof typeof this.actions];
    if (!actionDef) throw new Error(`Unknown action: ${action}`);

    const paramValues = paramsStr.split(',');
    const params: Record<string, any> = {};
    
    actionDef.params.forEach((paramName, index) => {
      params[paramName] = paramValues[index];
    });

    return { action, params };
  }

  /**
   * Estimate tokens for action
   */
  static estimateTokens(action: string): number {
    const actionDef = this.actions[action as keyof typeof this.actions];
    return actionDef?.tokens || 10;
  }
}

/**
 * Global instances
 */
export const kvCacheManager = new KVCacheManager();
export const domExtractor = DOMMarkdownExtractor;
export const actionSpace = ConciseActionSpace;
