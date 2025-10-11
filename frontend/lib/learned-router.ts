/**
 * Learned Router for Web Search Detection
 * Uses simple pattern learning from historical queries
 * Falls back to heuristics when uncertain
 */

export interface QueryExample {
  query: string;
  needsWebSearch: boolean;
  timestamp: Date;
  wasCorrect?: boolean;
  userCorrected?: boolean;
}

export interface RouterMetrics {
  totalQueries: number;
  correctPredictions: number;
  accuracy: number;
  heuristicFallbacks: number;
  learnedDecisions: number;
}

export class LearnedRouter {
  private examples: QueryExample[] = [];
  private patterns: Map<string, { webSearch: number; local: number }> = new Map();
  private metrics: RouterMetrics = {
    totalQueries: 0,
    correctPredictions: 0,
    accuracy: 0,
    heuristicFallbacks: 0,
    learnedDecisions: 0
  };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Extract features from query for pattern matching
   */
  private extractFeatures(query: string): string[] {
    const features: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Extract bigrams (2-word patterns)
    const words = queryLower.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      features.push(`${words[i]} ${words[i + 1]}`);
    }
    
    // Extract domain indicators
    if (/https?:\/\//.test(query)) features.push('HAS_URL');
    if (/github\.com|gitlab\.com/.test(query)) features.push('HAS_GIT');
    if (/\d+/.test(query)) features.push('HAS_NUMBER');
    if (/\?/.test(query)) features.push('IS_QUESTION');
    
    // Extract time indicators
    const timeWords = ['current', 'latest', 'today', 'now', 'recent'];
    timeWords.forEach(word => {
      if (queryLower.includes(word)) features.push(`TIME_${word.toUpperCase()}`);
    });
    
    // Extract action verbs
    const actions = ['get', 'find', 'search', 'check', 'review', 'browse'];
    actions.forEach(action => {
      if (queryLower.includes(action)) features.push(`ACTION_${action.toUpperCase()}`);
    });
    
    return features;
  }

  /**
   * Learn from a query example
   */
  learn(query: string, needsWebSearch: boolean, wasCorrect: boolean = true): void {
    const example: QueryExample = {
      query,
      needsWebSearch,
      timestamp: new Date(),
      wasCorrect
    };
    
    this.examples.push(example);
    
    // Update pattern statistics
    const features = this.extractFeatures(query);
    features.forEach(feature => {
      if (!this.patterns.has(feature)) {
        this.patterns.set(feature, { webSearch: 0, local: 0 });
      }
      
      const stats = this.patterns.get(feature)!;
      if (needsWebSearch) {
        stats.webSearch++;
      } else {
        stats.local++;
      }
    });
    
    // Keep only recent examples (last 1000)
    if (this.examples.length > 1000) {
      this.examples = this.examples.slice(-1000);
    }
    
    this.saveToStorage();
  }

  /**
   * Predict if query needs web search using learned patterns
   */
  predictWithConfidence(query: string): { 
    needsWebSearch: boolean; 
    confidence: number;
    method: 'learned' | 'heuristic';
    features: string[];
  } {
    const features = this.extractFeatures(query);
    
    if (features.length === 0) {
      return {
        needsWebSearch: false,
        confidence: 0.5,
        method: 'heuristic',
        features: []
      };
    }
    
    // Calculate weighted score from learned patterns
    let webScore = 0;
    let localScore = 0;
    let totalSamples = 0;
    
    features.forEach(feature => {
      const stats = this.patterns.get(feature);
      if (stats) {
        webScore += stats.webSearch;
        localScore += stats.local;
        totalSamples += stats.webSearch + stats.local;
      }
    });
    
    // If we have enough data, use learned prediction
    if (totalSamples >= 5) {
      const webProbability = webScore / (webScore + localScore);
      const confidence = Math.abs(webProbability - 0.5) * 2; // 0 to 1
      
      this.metrics.learnedDecisions++;
      
      return {
        needsWebSearch: webProbability > 0.5,
        confidence,
        method: 'learned',
        features
      };
    }
    
    // Not enough data, use heuristic fallback
    this.metrics.heuristicFallbacks++;
    
    return {
      needsWebSearch: this.heuristicFallback(query),
      confidence: 0.6,
      method: 'heuristic',
      features
    };
  }

  /**
   * Heuristic fallback (same as our current implementation)
   */
  private heuristicFallback(query: string): boolean {
    const queryLower = query.toLowerCase();
    
    // URL detection
    if (/https?:\/\/|www\.|\.com|\.org|\.io|\.net/.test(query)) return true;
    
    // Time-based queries
    const timeIndicators = ['current', 'latest', 'recent', 'today', 'now', 'last 24'];
    if (timeIndicators.some(ind => queryLower.includes(ind))) return true;
    
    // Web actions
    const webActions = ['browse', 'visit', 'go to', 'review', 'check'];
    if (webActions.some(action => queryLower.includes(action))) return true;
    
    // Real-time data
    const realTimeData = ['price', 'news', 'trending', 'liquidation'];
    if (realTimeData.some(data => queryLower.includes(data))) return true;
    
    return false;
  }

  /**
   * Record feedback on prediction accuracy
   */
  recordFeedback(query: string, predicted: boolean, actual: boolean): void {
    const wasCorrect = predicted === actual;
    
    this.metrics.totalQueries++;
    if (wasCorrect) {
      this.metrics.correctPredictions++;
    }
    this.metrics.accuracy = this.metrics.correctPredictions / this.metrics.totalQueries;
    
    // Learn from this example
    this.learn(query, actual, wasCorrect);
  }

  /**
   * Get current metrics
   */
  getMetrics(): RouterMetrics {
    return { ...this.metrics };
  }

  /**
   * Get top patterns for web search
   */
  getTopWebSearchPatterns(limit: number = 10): Array<{ pattern: string; score: number }> {
    const scored = Array.from(this.patterns.entries())
      .map(([pattern, stats]) => ({
        pattern,
        score: stats.webSearch / (stats.webSearch + stats.local)
      }))
      .filter(p => p.score > 0.7)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return scored;
  }

  /**
   * Export learned patterns for analysis
   */
  exportPatterns(): Record<string, { webSearch: number; local: number }> {
    const exported: Record<string, { webSearch: number; local: number }> = {};
    this.patterns.forEach((value, key) => {
      exported[key] = value;
    });
    return exported;
  }

  /**
   * Save to localStorage (browser) or file (server)
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      try {
        const data = {
          patterns: Array.from(this.patterns.entries()),
          metrics: this.metrics,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('learned-router', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save learned router data:', error);
      }
    }
    // Server environment: could save to database/file
  }

  /**
   * Load from storage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('learned-router');
        if (stored) {
          const data = JSON.parse(stored);
          this.patterns = new Map(data.patterns);
          this.metrics = data.metrics || this.metrics;
        }
      } catch (error) {
        console.warn('Failed to load learned router data:', error);
      }
    }
  }

  /**
   * Reset learning (for testing or retraining)
   */
  reset(): void {
    this.examples = [];
    this.patterns.clear();
    this.metrics = {
      totalQueries: 0,
      correctPredictions: 0,
      accuracy: 0,
      heuristicFallbacks: 0,
      learnedDecisions: 0
    };
    this.saveToStorage();
  }
}

// Singleton instance
let routerInstance: LearnedRouter | null = null;

export function getLearnedRouter(): LearnedRouter {
  if (!routerInstance) {
    routerInstance = new LearnedRouter();
  }
  return routerInstance;
}

