/**
 * ReasoningBank Implementation
 * 
 * Memory framework for retrieving past solutions and learned patterns
 * Based on the ReasoningBank paper: "ReasoningBank: A Memory Framework for Retrieving Past Solutions"
 * 
 * Features:
 * - Semantic similarity search
 * - Pattern recognition
 * - Solution retrieval
 * - Learning from successful executions
 */

export interface ReasoningMemory {
  id: string;
  query: string;
  solution: string;
  domain: string;
  reasoning_steps: string[];
  success_metrics: {
    accuracy: number;
    user_satisfaction: number;
    execution_time_ms: number;
  };
  created_at: Date;
  last_accessed: Date;
  access_count: number;
  tags: string[];
  embedding?: number[];
}

export interface ReasoningBankConfig {
  max_memories: number;
  similarity_threshold: number;
  embedding_model: string;
  enable_learning: boolean;
  retention_days: number;
}

/**
 * ReasoningBank - Memory framework for past solutions
 */
export class ReasoningBank {
  private memories: Map<string, ReasoningMemory> = new Map();
  private config: ReasoningBankConfig;
  private embeddingCache: Map<string, number[]> = new Map();
  
  constructor(config?: Partial<ReasoningBankConfig>) {
    this.config = {
      max_memories: 1000,
      similarity_threshold: 0.7,
      embedding_model: 'Xenova/all-MiniLM-L6-v2',
      enable_learning: true,
      retention_days: 30,
      ...config
    };
  }
  
  /**
   * Store a successful reasoning pattern
   */
  async storeMemory(
    query: string,
    solution: string,
    domain: string,
    reasoningSteps: string[],
    successMetrics: {
      accuracy: number;
      user_satisfaction: number;
      execution_time_ms: number;
    },
    tags: string[] = []
  ): Promise<string> {
    const memoryId = this.generateMemoryId();
    
    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(query);
    
    const memory: ReasoningMemory = {
      id: memoryId,
      query,
      solution,
      domain,
      reasoning_steps: reasoningSteps,
      success_metrics: successMetrics,
      created_at: new Date(),
      last_accessed: new Date(),
      access_count: 0,
      tags,
      embedding
    };
    
    // Store memory
    this.memories.set(memoryId, memory);
    
    // Cleanup old memories if needed
    await this.cleanupOldMemories();
    
    console.log(`💾 ReasoningBank: Stored memory ${memoryId} for domain ${domain}`);
    return memoryId;
  }
  
  /**
   * Retrieve similar past solutions
   */
  async retrieveSimilar(query: string, domain: string, limit: number = 5): Promise<ReasoningMemory[]> {
    console.log(`🔍 ReasoningBank: Retrieving similar solutions for "${query.substring(0, 50)}..."`);
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Calculate similarities
    const similarities: Array<{ memory: ReasoningMemory; similarity: number }> = [];
    
    for (const memory of this.memories.values()) {
      // Filter by domain first
      if (memory.domain !== domain && domain !== 'general') {
        continue;
      }
      
      if (memory.embedding) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, memory.embedding);
        if (similarity >= this.config.similarity_threshold) {
          similarities.push({ memory, similarity });
        }
      }
    }
    
    // Sort by similarity and return top results
    const sortedMemories = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => {
        // Update access tracking
        item.memory.last_accessed = new Date();
        item.memory.access_count++;
        return item.memory;
      });
    
    console.log(`✅ ReasoningBank: Found ${sortedMemories.length} similar solutions`);
    return sortedMemories;
  }
  
  /**
   * Retrieve memories by pattern
   */
  async retrieveByPattern(pattern: string, domain: string): Promise<ReasoningMemory[]> {
    console.log(`🔍 ReasoningBank: Retrieving by pattern "${pattern}"`);
    
    const patternMemories: ReasoningMemory[] = [];
    
    for (const memory of this.memories.values()) {
      if (memory.domain !== domain && domain !== 'general') {
        continue;
      }
      
      // Check if pattern matches query, solution, or tags
      const matchesQuery = memory.query.toLowerCase().includes(pattern.toLowerCase());
      const matchesSolution = memory.solution.toLowerCase().includes(pattern.toLowerCase());
      const matchesTags = memory.tags.some(tag => tag.toLowerCase().includes(pattern.toLowerCase()));
      
      if (matchesQuery || matchesSolution || matchesTags) {
        patternMemories.push(memory);
      }
    }
    
    // Sort by success metrics
    return patternMemories.sort((a, b) => {
      const scoreA = a.success_metrics.accuracy * a.success_metrics.user_satisfaction;
      const scoreB = b.success_metrics.accuracy * b.success_metrics.user_satisfaction;
      return scoreB - scoreA;
    });
  }
  
  /**
   * Learn from successful execution
   */
  async learnFromSuccess(
    query: string,
    solution: string,
    domain: string,
    reasoningSteps: string[],
    executionMetrics: {
      accuracy: number;
      user_satisfaction: number;
      execution_time_ms: number;
    }
  ): Promise<void> {
    if (!this.config.enable_learning) {
      return;
    }
    
    console.log(`🧠 ReasoningBank: Learning from successful execution`);
    
    // Extract tags from query and solution
    const tags = this.extractTags(query, solution);
    
    // Store as memory
    await this.storeMemory(query, solution, domain, reasoningSteps, executionMetrics, tags);
    
    // Update existing similar memories
    await this.updateSimilarMemories(query, domain, executionMetrics);
  }
  
  /**
   * Get reasoning patterns for a domain
   */
  async getDomainPatterns(domain: string): Promise<{
    common_patterns: string[];
    success_factors: string[];
    failure_patterns: string[];
  }> {
    const domainMemories = Array.from(this.memories.values())
      .filter(m => m.domain === domain);
    
    if (domainMemories.length === 0) {
      return {
        common_patterns: [],
        success_factors: [],
        failure_patterns: []
      };
    }
    
    // Analyze patterns
    const commonPatterns = this.analyzeCommonPatterns(domainMemories);
    const successFactors = this.analyzeSuccessFactors(domainMemories);
    const failurePatterns = this.analyzeFailurePatterns(domainMemories);
    
    return {
      common_patterns: commonPatterns,
      success_factors: successFactors,
      failure_patterns: failurePatterns
    };
  }
  
  /**
   * Get memory statistics
   */
  getStats(): {
    total_memories: number;
    domain_distribution: Record<string, number>;
    avg_success_rate: number;
    most_accessed: ReasoningMemory[];
  } {
    const memories = Array.from(this.memories.values());
    
    // Domain distribution
    const domainDistribution: Record<string, number> = {};
    memories.forEach(memory => {
      domainDistribution[memory.domain] = (domainDistribution[memory.domain] || 0) + 1;
    });
    
    // Average success rate
    const avgSuccessRate = memories.length > 0 
      ? memories.reduce((sum, m) => sum + m.success_metrics.accuracy, 0) / memories.length
      : 0;
    
    // Most accessed memories
    const mostAccessed = memories
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 5);
    
    return {
      total_memories: memories.length,
      domain_distribution: domainDistribution,
      avg_success_rate: avgSuccessRate,
      most_accessed: mostAccessed
    };
  }
  
  // Private helper methods
  
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }
    
    try {
      // Use local embeddings (Xenova/transformers)
      const { embedLocal } = await import('./local-embeddings');
      const embedding = await embedLocal(text);
      
      // Cache the embedding
      this.embeddingCache.set(text, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Fallback to simple hash-based embedding
      return this.generateHashEmbedding(text);
    }
  }
  
  private generateHashEmbedding(text: string): number[] {
    // Simple hash-based embedding for fallback
    const hash = this.simpleHash(text);
    const embedding = new Array(384).fill(0);
    
    for (let i = 0; i < Math.min(hash.length, 384); i++) {
      embedding[i] = (hash.charCodeAt(i % hash.length) - 128) / 128;
    }
    
    return embedding;
  }
  
  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  private extractTags(query: string, solution: string): string[] {
    const tags: string[] = [];
    
    // Extract domain-specific tags
    const domainKeywords = {
      crypto: ['bitcoin', 'ethereum', 'blockchain', 'defi'],
      financial: ['investment', 'roi', 'portfolio', 'stock'],
      legal: ['contract', 'compliance', 'regulation', 'law'],
      healthcare: ['medical', 'diagnosis', 'treatment', 'patient'],
      technology: ['software', 'programming', 'ai', 'algorithm']
    };
    
    const text = (query + ' ' + solution).toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(domain);
      }
    }
    
    // Extract action tags
    if (text.includes('calculate') || text.includes('compute')) tags.push('calculation');
    if (text.includes('analyze') || text.includes('analysis')) tags.push('analysis');
    if (text.includes('compare') || text.includes('versus')) tags.push('comparison');
    if (text.includes('predict') || text.includes('forecast')) tags.push('prediction');
    
    return [...new Set(tags)]; // Remove duplicates
  }
  
  private async updateSimilarMemories(
    query: string,
    domain: string,
    metrics: { accuracy: number; user_satisfaction: number; execution_time_ms: number }
  ): Promise<void> {
    const similarMemories = await this.retrieveSimilar(query, domain, 3);
    
    for (const memory of similarMemories) {
      // Update success metrics with weighted average
      const weight = 0.1; // Learning rate
      memory.success_metrics.accuracy = 
        (1 - weight) * memory.success_metrics.accuracy + weight * metrics.accuracy;
      memory.success_metrics.user_satisfaction = 
        (1 - weight) * memory.success_metrics.user_satisfaction + weight * metrics.user_satisfaction;
    }
  }
  
  private async cleanupOldMemories(): Promise<void> {
    if (this.memories.size <= this.config.max_memories) {
      return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention_days);
    
    const memoriesToDelete: string[] = [];
    
    for (const [id, memory] of this.memories.entries()) {
      if (memory.created_at < cutoffDate && memory.access_count < 2) {
        memoriesToDelete.push(id);
      }
    }
    
    // Delete old, unused memories
    memoriesToDelete.forEach(id => this.memories.delete(id));
    
    console.log(`🧹 ReasoningBank: Cleaned up ${memoriesToDelete.length} old memories`);
  }
  
  private analyzeCommonPatterns(memories: ReasoningMemory[]): string[] {
    const patterns: string[] = [];
    
    // Analyze common query patterns
    const queryWords = memories.flatMap(m => m.query.toLowerCase().split(' '));
    const wordFreq = this.calculateWordFrequency(queryWords);
    const commonWords = Object.entries(wordFreq)
      .filter(([_, freq]) => freq > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, _]) => word);
    
    patterns.push(...commonWords);
    
    return patterns;
  }
  
  private analyzeSuccessFactors(memories: ReasoningMemory[]): string[] {
    const factors: string[] = [];
    
    // Analyze high-success memories
    const highSuccessMemories = memories.filter(m => 
      m.success_metrics.accuracy > 0.8 && m.success_metrics.user_satisfaction > 0.8
    );
    
    if (highSuccessMemories.length > 0) {
      factors.push('Detailed reasoning steps');
      factors.push('Domain-specific knowledge');
      factors.push('Clear solution structure');
    }
    
    return factors;
  }
  
  private analyzeFailurePatterns(memories: ReasoningMemory[]): string[] {
    const patterns: string[] = [];
    
    // Analyze low-success memories
    const lowSuccessMemories = memories.filter(m => 
      m.success_metrics.accuracy < 0.6 || m.success_metrics.user_satisfaction < 0.6
    );
    
    if (lowSuccessMemories.length > 0) {
      patterns.push('Vague reasoning');
      patterns.push('Incomplete solutions');
      patterns.push('Domain mismatch');
    }
    
    return patterns;
  }
  
  private calculateWordFrequency(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 3) { // Only count meaningful words
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    return freq;
  }
}

/**
 * Create ReasoningBank instance
 */
export function createReasoningBank(config?: Partial<ReasoningBankConfig>): ReasoningBank {
  return new ReasoningBank(config);
}

/**
 * Retrieve memories (convenience function)
 */
export async function retrieveMemories(query: string, domain: string, limit?: number): Promise<ReasoningMemory[]> {
  const bank = createReasoningBank();
  return await bank.retrieveSimilar(query, domain, limit);
}
