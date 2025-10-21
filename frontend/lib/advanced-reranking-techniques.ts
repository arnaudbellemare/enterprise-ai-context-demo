// Advanced Reranking Techniques for Brain System
// Based on LanceDB custom reranker documentation

export interface RerankResult {
  content: string;
  originalScore: number;
  rerankedScore: number;
  relevanceScore: number;
  metadata: any;
  rank: number;
}

export interface HybridSearchResult {
  vectorResults: any[];
  ftsResults: any[];
  combinedResults: any[];
  rerankedResults: RerankResult[];
}

export interface RerankerConfig {
  method: 'linear_combination' | 'cross_encoder' | 'cohere' | 'colbert' | 'custom';
  weights?: {
    vector: number;
    fts: number;
    relevance: number;
  };
  filters?: string[];
  returnScore: 'relevance' | 'all' | 'vector' | 'fts';
}

export class AdvancedRerankingTechniques {
  private config: RerankerConfig;

  constructor(config: RerankerConfig = {
    method: 'linear_combination',
    weights: { vector: 0.6, fts: 0.4, relevance: 0.8 },
    returnScore: 'relevance'
  }) {
    this.config = config;
  }

  /**
   * Linear Combination Reranker
   * Weighted linear combination of semantic search & keyword-based search results
   */
  async linearCombinationRerank(
    query: string,
    vectorResults: any[],
    ftsResults: any[],
    weights: { vector: number; fts: number; relevance: number } = { vector: 0.6, fts: 0.4, relevance: 0.8 }
  ): Promise<RerankResult[]> {
    console.log('   📊 Linear Combination Reranking: Starting...');
    
    // Combine and deduplicate results
    const combinedResults = this.mergeResults(vectorResults, ftsResults);
    
    const rerankedResults: RerankResult[] = [];
    
    for (let i = 0; i < combinedResults.length; i++) {
      const result = combinedResults[i];
      
      // Calculate linear combination score
      const vectorScore = result.vectorScore || 0;
      const ftsScore = result.ftsScore || 0;
      const relevanceScore = result.relevanceScore || 0;
      
      const linearScore = (
        vectorScore * weights.vector +
        ftsScore * weights.fts +
        relevanceScore * weights.relevance
      );
      
      rerankedResults.push({
        content: result.content,
        originalScore: result.originalScore || 0,
        rerankedScore: linearScore,
        relevanceScore,
        metadata: result.metadata,
        rank: i + 1
      });
    }
    
    // Sort by reranked score
    rerankedResults.sort((a, b) => b.rerankedScore - a.rerankedScore);
    
    console.log(`   ✅ Linear Combination: Reranked ${rerankedResults.length} results`);
    return rerankedResults;
  }

  /**
   * Cross Encoder Reranker
   * Discards existing scores and calculates relevance of each search result-query pair
   */
  async crossEncoderRerank(
    query: string,
    vectorResults: any[],
    ftsResults: any[]
  ): Promise<RerankResult[]> {
    console.log('   🎯 Cross Encoder Reranking: Starting...');
    
    const combinedResults = this.mergeResults(vectorResults, ftsResults);
    const rerankedResults: RerankResult[] = [];
    
    for (let i = 0; i < combinedResults.length; i++) {
      const result = combinedResults[i];
      
      // Calculate cross-encoder relevance score
      const relevanceScore = await this.calculateCrossEncoderRelevance(query, result.content);
      
      rerankedResults.push({
        content: result.content,
        originalScore: result.originalScore || 0,
        rerankedScore: relevanceScore,
        relevanceScore,
        metadata: result.metadata,
        rank: i + 1
      });
    }
    
    // Sort by cross-encoder score
    rerankedResults.sort((a, b) => b.rerankedScore - a.rerankedScore);
    
    console.log(`   ✅ Cross Encoder: Reranked ${rerankedResults.length} results`);
    return rerankedResults;
  }

  /**
   * Cohere Reranker
   * Advanced semantic reranking using Cohere's rerank API
   */
  async cohereRerank(
    query: string,
    vectorResults: any[],
    ftsResults: any[]
  ): Promise<RerankResult[]> {
    console.log('   🌊 Cohere Reranking: Starting...');
    
    const combinedResults = this.mergeResults(vectorResults, ftsResults);
    const rerankedResults: RerankResult[] = [];
    
    // Simulate Cohere reranking (in production, use actual Cohere API)
    for (let i = 0; i < combinedResults.length; i++) {
      const result = combinedResults[i];
      
      // Calculate Cohere-style relevance score
      const cohereScore = await this.calculateCohereRelevance(query, result.content);
      
      rerankedResults.push({
        content: result.content,
        originalScore: result.originalScore || 0,
        rerankedScore: cohereScore,
        relevanceScore: cohereScore,
        metadata: result.metadata,
        rank: i + 1
      });
    }
    
    // Sort by Cohere score
    rerankedResults.sort((a, b) => b.rerankedScore - a.rerankedScore);
    
    console.log(`   ✅ Cohere: Reranked ${rerankedResults.length} results`);
    return rerankedResults;
  }

  /**
   * ColBERT Reranker
   * Contextualized late interaction reranking
   */
  async colbertRerank(
    query: string,
    vectorResults: any[],
    ftsResults: any[]
  ): Promise<RerankResult[]> {
    console.log('   🔬 ColBERT Reranking: Starting...');
    
    const combinedResults = this.mergeResults(vectorResults, ftsResults);
    const rerankedResults: RerankResult[] = [];
    
    for (let i = 0; i < combinedResults.length; i++) {
      const result = combinedResults[i];
      
      // Calculate ColBERT-style relevance score
      const colbertScore = await this.calculateColBERTRelevance(query, result.content);
      
      rerankedResults.push({
        content: result.content,
        originalScore: result.originalScore || 0,
        rerankedScore: colbertScore,
        relevanceScore: colbertScore,
        metadata: result.metadata,
        rank: i + 1
      });
    }
    
    // Sort by ColBERT score
    rerankedResults.sort((a, b) => b.rerankedScore - a.rerankedScore);
    
    console.log(`   ✅ ColBERT: Reranked ${rerankedResults.length} results`);
    return rerankedResults;
  }

  /**
   * Custom Reranker with Filters
   * Enhanced reranker that accepts filter queries and custom parameters
   */
  async customRerank(
    query: string,
    vectorResults: any[],
    ftsResults: any[],
    filters: string[] = [],
    baseReranker: 'linear' | 'cross_encoder' | 'cohere' | 'colbert' = 'linear'
  ): Promise<RerankResult[]> {
    console.log('   🛠️ Custom Reranking: Starting...');
    
    // Apply base reranking method
    let rerankedResults: RerankResult[];
    
    switch (baseReranker) {
      case 'linear':
        rerankedResults = await this.linearCombinationRerank(query, vectorResults, ftsResults);
        break;
      case 'cross_encoder':
        rerankedResults = await this.crossEncoderRerank(query, vectorResults, ftsResults);
        break;
      case 'cohere':
        rerankedResults = await this.cohereRerank(query, vectorResults, ftsResults);
        break;
      case 'colbert':
        rerankedResults = await this.colbertRerank(query, vectorResults, ftsResults);
        break;
      default:
        rerankedResults = await this.linearCombinationRerank(query, vectorResults, ftsResults);
    }
    
    // Apply filters
    if (filters.length > 0) {
      rerankedResults = this.applyFilters(rerankedResults, filters);
    }
    
    console.log(`   ✅ Custom: Reranked ${rerankedResults.length} results with ${filters.length} filters`);
    return rerankedResults;
  }

  /**
   * Hybrid Search with Reranking
   * Complete hybrid search pipeline with reranking
   */
  async hybridSearchWithReranking(
    query: string,
    vectorResults: any[],
    ftsResults: any[],
    rerankerMethod: 'linear_combination' | 'cross_encoder' | 'cohere' | 'colbert' | 'custom' = 'linear_combination',
    filters: string[] = []
  ): Promise<HybridSearchResult> {
    console.log('   🔍 Hybrid Search with Reranking: Starting...');
    
    const startTime = Date.now();
    
    // Perform reranking based on method
    let rerankedResults: RerankResult[];
    
    switch (rerankerMethod) {
      case 'linear_combination':
        rerankedResults = await this.linearCombinationRerank(query, vectorResults, ftsResults);
        break;
      case 'cross_encoder':
        rerankedResults = await this.crossEncoderRerank(query, vectorResults, ftsResults);
        break;
      case 'cohere':
        rerankedResults = await this.cohereRerank(query, vectorResults, ftsResults);
        break;
      case 'colbert':
        rerankedResults = await this.colbertRerank(query, vectorResults, ftsResults);
        break;
      case 'custom':
        rerankedResults = await this.customRerank(query, vectorResults, ftsResults, filters);
        break;
      default:
        rerankedResults = await this.linearCombinationRerank(query, vectorResults, ftsResults);
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`   ✅ Hybrid Search: Completed in ${processingTime}ms`);
    console.log(`   📊 Vector results: ${vectorResults.length}`);
    console.log(`   📊 FTS results: ${ftsResults.length}`);
    console.log(`   📊 Reranked results: ${rerankedResults.length}`);
    
    return {
      vectorResults,
      ftsResults,
      combinedResults: this.mergeResults(vectorResults, ftsResults),
      rerankedResults
    };
  }

  /**
   * Evaluate Reranking Performance
   * Calculate hit-rate at top-k for reranking evaluation
   */
  async evaluateRerankingPerformance(
    query: string,
    groundTruth: string[],
    rerankedResults: RerankResult[],
    topK: number[] = [3, 5, 10]
  ): Promise<{ [key: string]: number }> {
    console.log('   📈 Evaluating Reranking Performance...');
    
    const evaluation: { [key: string]: number } = {};
    
    for (const k of topK) {
      const topKResults = rerankedResults.slice(0, k);
      const topKContent = topKResults.map(r => r.content);
      
      // Calculate hit rate
      const hits = groundTruth.filter(gt => 
        topKContent.some(content => 
          this.calculateSimilarity(gt, content) > 0.8
        )
      ).length;
      
      const hitRate = hits / groundTruth.length;
      evaluation[`top_${k}`] = hitRate;
    }
    
    console.log(`   ✅ Evaluation completed:`, evaluation);
    return evaluation;
  }

  // Helper methods
  private mergeResults(vectorResults: any[], ftsResults: any[]): any[] {
    const combined = [...vectorResults, ...ftsResults];
    const unique = new Map();
    
    for (const result of combined) {
      const key = result.content?.substring(0, 100) || result.id;
      if (!unique.has(key)) {
        unique.set(key, result);
      }
    }
    
    return Array.from(unique.values());
  }

  private async calculateCrossEncoderRelevance(query: string, content: string): Promise<number> {
    // Simulate cross-encoder relevance calculation
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = content.toLowerCase().split(' ');
    
    let relevance = 0;
    for (const word of queryWords) {
      if (contentWords.includes(word)) {
        relevance += 0.1;
      }
    }
    
    // Add semantic similarity
    const semanticSimilarity = await this.calculateSemanticSimilarity(query, content);
    relevance += semanticSimilarity * 0.5;
    
    return Math.min(1.0, relevance);
  }

  private async calculateCohereRelevance(query: string, content: string): Promise<number> {
    // Simulate Cohere reranking
    const queryLength = query.length;
    const contentLength = content.length;
    
    // Length-based relevance
    const lengthRelevance = Math.min(1.0, contentLength / (queryLength * 10));
    
    // Keyword matching
    const keywordRelevance = this.calculateKeywordMatch(query, content);
    
    // Semantic similarity
    const semanticRelevance = await this.calculateSemanticSimilarity(query, content);
    
    // Combine scores
    return (lengthRelevance * 0.3 + keywordRelevance * 0.4 + semanticRelevance * 0.3);
  }

  private async calculateColBERTRelevance(query: string, content: string): Promise<number> {
    // Simulate ColBERT contextualized late interaction
    const queryTokens = query.split(' ');
    const contentTokens = content.split(' ');
    
    let maxSimilarity = 0;
    
    for (const queryToken of queryTokens) {
      for (const contentToken of contentTokens) {
        const similarity = this.calculateTokenSimilarity(queryToken, contentToken);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }
    
    return maxSimilarity;
  }

  private applyFilters(results: RerankResult[], filters: string[]): RerankResult[] {
    return results.filter(result => {
      return !filters.some(filter => 
        result.content.toLowerCase().includes(filter.toLowerCase())
      );
    });
  }

  private calculateKeywordMatch(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = content.toLowerCase().split(' ');
    const matches = queryWords.filter(word => contentWords.includes(word));
    return matches.length / queryWords.length;
  }

  private async calculateSemanticSimilarity(query: string, content: string): Promise<number> {
    // Simulate semantic similarity calculation
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = content.toLowerCase().split(' ');
    
    let similarity = 0;
    for (const queryWord of queryWords) {
      for (const contentWord of contentWords) {
        if (queryWord === contentWord) {
          similarity += 0.1;
        } else if (this.calculateTokenSimilarity(queryWord, contentWord) > 0.8) {
          similarity += 0.05;
        }
      }
    }
    
    return Math.min(1.0, similarity);
  }

  private calculateTokenSimilarity(token1: string, token2: string): number {
    // Simple token similarity calculation
    if (token1 === token2) return 1.0;
    if (token1.includes(token2) || token2.includes(token1)) return 0.8;
    
    // Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(token1, token2);
    const maxLength = Math.max(token1.length, token2.length);
    return 1 - (distance / maxLength);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const advancedRerankingTechniques = new AdvancedRerankingTechniques();
