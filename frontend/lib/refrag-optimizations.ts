/**
 * REFRAG Performance Optimizations
 * 
 * Based on insights from dspy-refrag: https://github.com/marcusjihansson/dspy-refrag
 * 
 * Key optimizations:
 * 1. Batch embedding generation (parallel processing)
 * 2. Parallel sensor strategies (ensemble in parallel)
 * 3. Early stopping when confidence threshold met
 * 4. Embedding caching (avoid re-computing)
 * 5. Optimized vector index queries (batch retrieval)
 * 6. Pre-computed similarity matrices
 */

export interface REFRAGOptimizationConfig {
  enableBatchEmbeddings: boolean;      // Generate embeddings in batches (default: true)
  enableParallelSensors: boolean;      // Run sensor strategies in parallel (default: true)
  enableEarlyStopping: boolean;        // Stop when confidence threshold met (default: true)
  enableEmbeddingCache: boolean;       // Cache computed embeddings (default: true)
  enableBatchRetrieval: boolean;       // Batch vector DB queries (default: true)
  confidenceThreshold: number;        // Early stopping threshold (default: 0.9)
  batchSize: number;                   // Batch size for embeddings (default: 10)
  maxParallelSensors: number;          // Max parallel sensor strategies (default: 3)
  cacheSize: number;                   // Embedding cache size (default: 1000)
}

export class REFRAGOptimizations {
  private config: REFRAGOptimizationConfig;
  private embeddingCache: Map<string, number[]> = new Map();
  private similarityCache: Map<string, number> = new Map();

  constructor(config: Partial<REFRAGOptimizationConfig> = {}) {
    this.config = {
      enableBatchEmbeddings: true,
      enableParallelSensors: true,
      enableEarlyStopping: true,
      enableEmbeddingCache: true,
      enableBatchRetrieval: true,
      confidenceThreshold: 0.9,
      batchSize: 10,
      maxParallelSensors: 3,
      cacheSize: 1000,
      ...config
    };
  }

  /**
   * Batch embedding generation (faster than sequential)
   */
  async generateBatchEmbeddings(
    texts: string[],
    embeddingService: any
  ): Promise<number[][]> {
    if (!this.config.enableBatchEmbeddings || texts.length === 1) {
      // Sequential fallback
      const embeddings: number[][] = [];
      for (const text of texts) {
        const cached = this.getCachedEmbedding(text);
        if (cached) {
          embeddings.push(cached);
        } else {
          const embedding = await embeddingService.generateEmbedding(text);
          this.setCachedEmbedding(text, embedding);
          embeddings.push(embedding);
        }
      }
      return embeddings;
    }

    // Batch processing: process in chunks
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      batches.push(texts.slice(i, i + this.config.batchSize));
    }

    // Process batches in parallel
    const allEmbeddings = await Promise.all(
      batches.map(async (batch) => {
        // Check cache first
        const cachedEmbeddings: (number[] | null)[] = batch.map(text => this.getCachedEmbedding(text));
        const uncachedTexts = batch.filter((_, idx) => !cachedEmbeddings[idx]);
        const uncachedIndices = batch.map((_, idx) => idx).filter(idx => !cachedEmbeddings[idx]);

        if (uncachedTexts.length === 0) {
          return cachedEmbeddings as number[][];
        }

        // Generate embeddings for uncached texts
        const newEmbeddings = await Promise.all(
          uncachedTexts.map(text => embeddingService.generateEmbedding(text))
        );

        // Cache new embeddings
        uncachedTexts.forEach((text, idx) => {
          this.setCachedEmbedding(text, newEmbeddings[idx]);
        });

        // Combine cached and new embeddings
        const result: number[][] = [];
        let uncachedIdx = 0;
        for (let i = 0; i < batch.length; i++) {
          if (cachedEmbeddings[i]) {
            result.push(cachedEmbeddings[i]!);
          } else {
            result.push(newEmbeddings[uncachedIdx++]);
          }
        }
        return result;
      })
    );

    return allEmbeddings.flat();
  }

  /**
   * Parallel sensor strategies (faster ensemble)
   */
  async runParallelSensors(
    candidates: any[],
    query: string,
    budget: number,
    queryEmbedding: number[],
    sensorStrategies: Array<{ name: string; select: (candidates: any[], budget: number, queryEmbedding?: number[]) => Promise<any[]> }>
  ): Promise<{ strategy: string; chunks: any[]; score: number }[]> {
    if (!this.config.enableParallelSensors || sensorStrategies.length === 1) {
      // Sequential fallback
      const strategy = sensorStrategies[0];
      const chunks = await strategy.select(candidates, budget, queryEmbedding);
      return [{ strategy: strategy.name, chunks, score: 0.8 }];
    }

    // Run sensor strategies in parallel
    const results = await Promise.all(
      sensorStrategies.slice(0, this.config.maxParallelSensors).map(async (strategy) => {
        const chunks = await strategy.select(candidates, budget, queryEmbedding);
        // Score based on diversity and relevance
        const diversityScore = this.calculateDiversity(chunks);
        const relevanceScore = this.calculateRelevance(chunks, queryEmbedding);
        const score = (diversityScore * 0.4) + (relevanceScore * 0.6);
        return { strategy: strategy.name, chunks, score };
      })
    );

    return results;
  }

  /**
   * Early stopping when confidence threshold met
   */
  shouldEarlyStop(
    currentChunks: any[],
    queryEmbedding: number[],
    confidence: number
  ): boolean {
    if (!this.config.enableEarlyStopping) return false;

    // Check if we have high-confidence chunks
    const avgConfidence = currentChunks.reduce((sum, chunk) => {
      const similarity = chunk.embedding ? this.getCachedSimilarity(
        chunk.embedding,
        queryEmbedding
      ) : 0;
      return sum + similarity;
    }, 0) / Math.max(1, currentChunks.length);

    return avgConfidence >= this.config.confidenceThreshold;
  }

  /**
   * Batch vector retrieval (optimize DB queries)
   */
  async batchRetrieve(
    retriever: any,
    embeddings: number[][],
    k: number
  ): Promise<any[][]> {
    if (!this.config.enableBatchRetrieval || embeddings.length === 1) {
      // Sequential fallback
      const results: any[][] = [];
      for (const embedding of embeddings) {
        const chunks = await retriever.search(embedding, k);
        results.push(chunks);
      }
      return results;
    }

    // Batch retrieval: process multiple queries in parallel
    const results = await Promise.all(
      embeddings.map(embedding => retriever.search(embedding, k))
    );

    return results;
  }

  /**
   * Pre-compute similarity matrix (faster MMR)
   */
  precomputeSimilarityMatrix(
    embeddings: number[][]
  ): number[][] {
    const n = embeddings.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
        matrix[i][j] = similarity;
        matrix[j][i] = similarity; // Symmetric
      }
      matrix[i][i] = 1.0; // Self-similarity
    }

    return matrix;
  }

  /**
   * Fast MMR using pre-computed similarity matrix
   */
  fastMMR(
    candidates: any[],
    queryEmbedding: number[],
    budget: number,
    similarityMatrix?: number[][]
  ): any[] {
    if (candidates.length === 0) return [];

    const selected: any[] = [];
    const remaining = [...candidates];

    // Pre-compute query similarities if not using matrix
    if (!similarityMatrix) {
      const querySimilarities = candidates.map(chunk => 
        chunk.embedding ? this.cosineSimilarity(chunk.embedding, queryEmbedding) : 0
      );

      // Select first chunk (highest relevance)
      const firstIdx = querySimilarities.indexOf(Math.max(...querySimilarities));
      selected.push(remaining[firstIdx]);
      remaining.splice(firstIdx, 1);

      // Iterative MMR selection
      for (let i = 1; i < budget && remaining.length > 0; i++) {
        let bestScore = -Infinity;
        let bestIdx = 0;

        for (let j = 0; j < remaining.length; j++) {
          const relevance = querySimilarities[candidates.indexOf(remaining[j])];
          const maxSimilarity = Math.max(
            ...selected.map(selectedChunk => {
              const selectedIdx = candidates.indexOf(selectedChunk);
              const currentIdx = candidates.indexOf(remaining[j]);
              return similarityMatrix?.[selectedIdx]?.[currentIdx] || 
                     (remaining[j].embedding && selectedChunk.embedding
                       ? this.cosineSimilarity(remaining[j].embedding, selectedChunk.embedding)
                       : 0);
            })
          );
          const mmrScore = (0.7 * relevance) - (0.3 * maxSimilarity);
          
          if (mmrScore > bestScore) {
            bestScore = mmrScore;
            bestIdx = j;
          }
        }

        selected.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
      }
    } else {
      // Use pre-computed similarity matrix (faster)
      const querySimilarities = candidates.map((chunk, idx) => 
        chunk.embedding ? this.cosineSimilarity(chunk.embedding, queryEmbedding) : 0
      );

      const firstIdx = querySimilarities.indexOf(Math.max(...querySimilarities));
      selected.push(remaining[firstIdx]);
      remaining.splice(firstIdx, 1);

      for (let i = 1; i < budget && remaining.length > 0; i++) {
        let bestScore = -Infinity;
        let bestIdx = 0;

        for (let j = 0; j < remaining.length; j++) {
          const currentIdx = candidates.indexOf(remaining[j]);
          const relevance = querySimilarities[currentIdx];
          const maxSimilarity = Math.max(
            ...selected.map(selectedChunk => {
              const selectedIdx = candidates.indexOf(selectedChunk);
              return similarityMatrix[selectedIdx][currentIdx];
            })
          );
          const mmrScore = (0.7 * relevance) - (0.3 * maxSimilarity);
          
          if (mmrScore > bestScore) {
            bestScore = mmrScore;
            bestIdx = j;
          }
        }

        selected.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
      }
    }

    return selected;
  }

  // ============================================================
  // CACHING HELPERS
  // ============================================================

  private getCachedEmbedding(text: string): number[] | null {
    if (!this.config.enableEmbeddingCache) return null;
    return this.embeddingCache.get(text) || null;
  }

  private setCachedEmbedding(text: string, embedding: number[]): void {
    if (!this.config.enableEmbeddingCache) return;
    
    // LRU eviction if cache is full
    if (this.embeddingCache.size >= this.config.cacheSize) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) {
        this.embeddingCache.delete(firstKey);
      }
    }
    
    this.embeddingCache.set(text, embedding);
  }

  private getCachedSimilarity(embedding1: number[], embedding2: number[]): number {
    const key = this.similarityKey(embedding1, embedding2);
    const cached = this.similarityCache.get(key);
    if (cached !== undefined) return cached;

    const similarity = this.cosineSimilarity(embedding1, embedding2);
    
    // Cache similarity (LRU)
    if (this.similarityCache.size >= this.config.cacheSize) {
      const firstKey = this.similarityCache.keys().next().value;
      this.similarityCache.delete(firstKey);
    }
    this.similarityCache.set(key, similarity);

    return similarity;
  }

  private similarityKey(emb1: number[], emb2: number[]): string {
    // Create deterministic key from embeddings
    const hash1 = emb1.length > 0 ? emb1.slice(0, 5).map(x => x.toFixed(2)).join(',') : 'empty';
    const hash2 = emb2.length > 0 ? emb2.slice(0, 5).map(x => x.toFixed(2)).join(',') : 'empty';
    return `${hash1}|${hash2}`;
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateDiversity(chunks: any[]): number {
    if (chunks.length < 2) return 0;
    
    let totalSimilarity = 0;
    let pairs = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        if (chunks[i].embedding && chunks[j].embedding) {
          totalSimilarity += this.cosineSimilarity(chunks[i].embedding, chunks[j].embedding);
          pairs++;
        }
      }
    }
    
    // Diversity = 1 - average similarity (lower similarity = higher diversity)
    return pairs > 0 ? 1 - (totalSimilarity / pairs) : 0;
  }

  private calculateRelevance(chunks: any[], queryEmbedding: number[]): number {
    if (chunks.length === 0) return 0;
    
    const similarities = chunks
      .filter(chunk => chunk.embedding)
      .map(chunk => this.cosineSimilarity(chunk.embedding, queryEmbedding));
    
    return similarities.length > 0
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length
      : 0;
  }

  /**
   * Clear caches (useful for memory management)
   */
  clearCaches(): void {
    this.embeddingCache.clear();
    this.similarityCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    embeddingCacheSize: number;
    similarityCacheSize: number;
    totalCacheSize: number;
  } {
    return {
      embeddingCacheSize: this.embeddingCache.size,
      similarityCacheSize: this.similarityCache.size,
      totalCacheSize: this.embeddingCache.size + this.similarityCache.size
    };
  }
}

/**
 * Factory function
 */
export function createREFRAGOptimizations(
  config?: Partial<REFRAGOptimizationConfig>
): REFRAGOptimizations {
  return new REFRAGOptimizations(config);
}

