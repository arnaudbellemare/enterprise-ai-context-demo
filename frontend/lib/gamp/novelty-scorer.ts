/**
 * Novelty Scoring System
 * 
 * Based on GAMP framework: Novelty(P) = 1 / (1 + log(freq(P)))
 * 
 * Calculates novelty scores for paths, memories, and strategies based on
 * their frequency in historical data.
 */

export interface Path {
  id: string;
  nodes: string[];  // Sequence of entities/concepts
  edges?: string[]; // Relations between nodes
  type?: 'problem-solution-effect' | 'memory' | 'strategy';
}

export interface NoveltyScore {
  path: Path;
  novelty: number;      // 0-1: Higher = more novel
  frequency: number;    // How many times path/sub-path appears
  subPathFrequency: Map<string, number>; // Frequency of sub-paths
  breakdown: {
    fullPathNovelty: number;
    subPathNovelty: number;
    averageNovelty: number;
  };
}

export class NoveltyScorer {
  private pathFrequencyCache: Map<string, number> = new Map();
  private historicalPaths: Path[] = [];
  
  /**
   * Calculate novelty score for a path
   * Formula: Novelty(P) = 1 / (1 + log(freq(P)))
   */
  calculateNovelty(path: Path, historicalPaths: Path[] = this.historicalPaths): NoveltyScore {
    // Update historical paths if provided
    if (historicalPaths.length > 0 && historicalPaths !== this.historicalPaths) {
      this.historicalPaths = historicalPaths;
      this.pathFrequencyCache.clear(); // Clear cache when history changes
    }
    
    // Calculate frequency
    const frequency = this.calculateFrequency(path, historicalPaths);
    
    // Calculate sub-path frequencies
    const subPathFrequencies = this.calculateSubPathFrequencies(path, historicalPaths);
    
    // Calculate novelty for full path
    const fullPathNovelty = this.noveltyFormula(frequency);
    
    // Calculate novelty for sub-paths
    const subPathNovelties = Array.from(subPathFrequencies.values()).map(freq =>
      this.noveltyFormula(freq)
    );
    const averageSubPathNovelty = subPathNovelties.length > 0
      ? subPathNovelties.reduce((a, b) => a + b, 0) / subPathNovelties.length
      : 1.0;
    
    // Overall novelty (weighted average)
    const overallNovelty = (fullPathNovelty * 0.6 + averageSubPathNovelty * 0.4);
    
    return {
      path,
      novelty: overallNovelty,
      frequency,
      subPathFrequency: subPathFrequencies,
      breakdown: {
        fullPathNovelty,
        subPathNovelty: averageSubPathNovelty,
        averageNovelty: overallNovelty,
      },
    };
  }
  
  /**
   * Novelty formula: Novelty(P) = 1 / (1 + log(freq(P)))
   */
  private noveltyFormula(frequency: number): number {
    if (frequency === 0) return 1.0; // Never seen = maximum novelty
    return 1 / (1 + Math.log(frequency + 1)); // +1 to avoid log(0)
  }
  
  /**
   * Calculate how many times path or sub-paths appear in history
   */
  private calculateFrequency(path: Path, historicalPaths: Path[]): number {
    const pathKey = this.pathToKey(path);
    
    // Check cache first
    if (this.pathFrequencyCache.has(pathKey)) {
      return this.pathFrequencyCache.get(pathKey)!;
    }
    
    let count = 0;
    for (const historicalPath of historicalPaths) {
      if (this.isSubPath(path, historicalPath) || this.isExactMatch(path, historicalPath)) {
        count++;
      }
    }
    
    // Cache result
    this.pathFrequencyCache.set(pathKey, count);
    return count;
  }
  
  /**
   * Calculate frequencies of all sub-paths
   */
  private calculateSubPathFrequencies(
    path: Path,
    historicalPaths: Path[]
  ): Map<string, number> {
    const subPaths = this.generateSubPaths(path);
    const frequencies = new Map<string, number>();
    
    for (const subPath of subPaths) {
      let count = 0;
      for (const historicalPath of historicalPaths) {
        if (this.isSubPath(subPath, historicalPath) || this.isExactMatch(subPath, historicalPath)) {
          count++;
        }
      }
      frequencies.set(this.pathToKey(subPath), count);
    }
    
    return frequencies;
  }
  
  /**
   * Generate all sub-paths of a path (n-grams)
   */
  private generateSubPaths(path: Path): Path[] {
    const subPaths: Path[] = [];
    const nodes = path.nodes;
    
    // Generate all contiguous sub-sequences (2-node, 3-node, etc.)
    for (let length = 2; length <= nodes.length; length++) {
      for (let start = 0; start <= nodes.length - length; start++) {
        subPaths.push({
          id: `${path.id}_sub_${start}_${start + length}`,
          nodes: nodes.slice(start, start + length),
          type: path.type,
        });
      }
    }
    
    return subPaths;
  }
  
  /**
   * Check if path1 is a sub-path of path2
   */
  private isSubPath(path1: Path, path2: Path): boolean {
    const nodes1 = path1.nodes;
    const nodes2 = path2.nodes;
    
    // Check if path1's nodes appear consecutively in path2
    for (let i = 0; i <= nodes2.length - nodes1.length; i++) {
      let match = true;
      for (let j = 0; j < nodes1.length; j++) {
        if (nodes1[j] !== nodes2[i + j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    
    return false;
  }
  
  /**
   * Check if two paths are exactly the same
   */
  private isExactMatch(path1: Path, path2: Path): boolean {
    if (path1.nodes.length !== path2.nodes.length) return false;
    
    for (let i = 0; i < path1.nodes.length; i++) {
      if (path1.nodes[i] !== path2.nodes[i]) return false;
    }
    
    return true;
  }
  
  /**
   * Convert path to string key for caching
   */
  private pathToKey(path: Path): string {
    return `${path.type || 'unknown'}:${path.nodes.join('->')}`;
  }
  
  /**
   * Add historical paths for frequency calculation
   */
  addHistoricalPaths(paths: Path[]): void {
    this.historicalPaths.push(...paths);
    this.pathFrequencyCache.clear(); // Clear cache when new paths added
  }
  
  /**
   * Clear all historical paths
   */
  clearHistory(): void {
    this.historicalPaths = [];
    this.pathFrequencyCache.clear();
  }
  
  /**
   * Batch calculate novelty for multiple paths
   */
  batchCalculateNovelty(paths: Path[]): NoveltyScore[] {
    return paths.map(path => this.calculateNovelty(path));
  }
  
  /**
   * Get most novel paths (highest novelty scores)
   */
  getMostNovelPaths(paths: Path[], topK: number = 10): NoveltyScore[] {
    const scores = this.batchCalculateNovelty(paths);
    return scores
      .sort((a, b) => b.novelty - a.novelty)
      .slice(0, topK);
  }
}

// Singleton instance
export const noveltyScorer = new NoveltyScorer();

