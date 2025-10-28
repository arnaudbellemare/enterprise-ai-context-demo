/**
 * REFRAG (Retrieval-Enhanced Fine-Grained RAG) System
 * 
 * Inspired by: https://github.com/marcusjihansson/dspy-refrag
 * 
 * Advanced RAG with:
 * - Sensor-based chunk selection (not just top-k)
 * - MMR (Maximal Marginal Relevance) for diversity
 * - Uncertainty sampling for active learning
 * - Optimization memory (learns from past retrievals)
 * - Multiple vector DB integrations
 */

import { embeddingService, type EmbeddingResult } from './embedding-service';
import { createLogger } from '../../lib/walt/logger';
import { z } from 'zod';

const logger = createLogger('REFRAG');

// ============================================================
// TYPES & SCHEMAS
// ============================================================

export const ChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.object({
    source: z.string().optional(),
    page: z.number().optional(),
    section: z.string().optional(),
    timestamp: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  embedding: z.array(z.number()).optional(),
  score: z.number().optional(),
});

export type Chunk = z.infer<typeof ChunkSchema>;

export const REFRAGResultSchema = z.object({
  chunks: z.array(ChunkSchema),
  metadata: z.object({
    sensorStrategy: z.string(),
    diversityScore: z.number(),
    relevanceScores: z.array(z.number()),
    totalCandidates: z.number(),
    selectedCount: z.number(),
    processingTimeMs: z.number(),
    optimizationLearned: z.boolean(),
  }),
});

export type REFRAGResult = z.infer<typeof REFRAGResultSchema>;

export type SensorMode = 'mmr' | 'uncertainty' | 'adaptive' | 'ensemble' | 'topk';

export interface REFRAGConfig {
  sensorMode: SensorMode;
  k: number;                    // Initial candidates to retrieve
  budget: number;               // Final chunks to select
  mmrLambda: number;            // MMR diversity parameter (0-1)
  uncertaintyThreshold: number; // Uncertainty sampling threshold
  enableOptimizationMemory: boolean;
  vectorDB: {
    type: 'weaviate' | 'pgvector' | 'qdrant' | 'inmemory';
    config: any;
  };
}

// ============================================================
// VECTOR RETRIEVER INTERFACE
// ============================================================

export interface VectorRetriever {
  search(embedding: number[], k: number, filters?: any): Promise<Chunk[]>;
  upsert(documents: Document[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  getCollectionStats(): Promise<{count: number, dimensions: number}>;
}

export interface Document {
  id: string;
  content: string;
  metadata?: any;
}

// ============================================================
// CHUNK SENSOR STRATEGIES
// ============================================================

export class AdvancedSensor {
  private mode: SensorMode;
  private mmrLambda: number;
  private uncertaintyThreshold: number;

  constructor(mode: SensorMode, config: {mmrLambda?: number, uncertaintyThreshold?: number} = {}) {
    this.mode = mode;
    this.mmrLambda = config.mmrLambda || 0.7;
    this.uncertaintyThreshold = config.uncertaintyThreshold || 0.5;

    logger.info('AdvancedSensor initialized', { mode, config });
  }

  getMode(): SensorMode {
    return this.mode;
  }

  async select(
    candidates: Chunk[], 
    query: string, 
    budget: number,
    queryEmbedding?: number[]
  ): Promise<Chunk[]> {
    const startTime = Date.now();
    
    logger.info('Sensor selection started', {
      mode: this.mode,
      candidates: candidates.length,
      budget,
      queryLength: query.length
    });

    let selected: Chunk[] = [];

    switch (this.mode) {
      case 'mmr':
        selected = await this.maximalMarginalRelevance(candidates, budget, queryEmbedding);
        break;
      case 'uncertainty':
        selected = await this.uncertaintySampling(candidates, budget);
        break;
      case 'adaptive':
        selected = await this.adaptiveStrategy(candidates, query, budget, queryEmbedding);
        break;
      case 'ensemble':
        selected = await this.ensembleStrategy(candidates, query, budget, queryEmbedding);
        break;
      case 'topk':
        selected = candidates.slice(0, budget);
        break;
      default:
        selected = candidates.slice(0, budget);
    }

    const processingTime = Date.now() - startTime;
    
    logger.info('Sensor selection completed', {
      mode: this.mode,
      selected: selected.length,
      processingTimeMs: processingTime
    });

    return selected;
  }

  private async maximalMarginalRelevance(
    candidates: Chunk[],
    budget: number,
    queryEmbedding?: number[]
  ): Promise<Chunk[]> {
    if (candidates.length <= budget) return candidates;

    const selected: Chunk[] = [];
    const remaining = [...candidates];

    // Start with highest scoring chunk
    const firstChunk = remaining.reduce((max, chunk) => 
      (chunk.score || 0) > (max.score || 0) ? chunk : max
    );
    selected.push(firstChunk);
    remaining.splice(remaining.indexOf(firstChunk), 1);

    // MMR selection for remaining slots
    while (selected.length < budget && remaining.length > 0) {
      let bestChunk: Chunk | null = null;
      let bestScore = -Infinity;

      for (const chunk of remaining) {
        const relevance = chunk.score || 0;
        const maxSimilarity = Math.max(
          ...selected.map(s => this.cosineSimilarity(
            chunk.embedding || [],
            s.embedding || []
          ))
        );
        
        const mmrScore = this.mmrLambda * relevance - (1 - this.mmrLambda) * maxSimilarity;
        
        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestChunk = chunk;
        }
      }

      if (bestChunk) {
        selected.push(bestChunk);
        remaining.splice(remaining.indexOf(bestChunk), 1);
      } else {
        break;
      }
    }

    return selected;
  }

  private async uncertaintySampling(candidates: Chunk[], budget: number): Promise<Chunk[]> {
    // Simulate uncertainty by using score variance
    // In real implementation, would use model uncertainty
    const uncertainChunks = candidates
      .map(chunk => ({
        ...chunk,
        uncertainty: Math.random() * (1 - (chunk.score || 0)) // Higher uncertainty for lower scores
      }))
      .filter(chunk => chunk.uncertainty > this.uncertaintyThreshold)
      .sort((a, b) => b.uncertainty - a.uncertainty)
      .slice(0, budget);

    return uncertainChunks;
  }

  private async adaptiveStrategy(
    candidates: Chunk[], 
    query: string, 
    budget: number,
    queryEmbedding?: number[]
  ): Promise<Chunk[]> {
    // Analyze query characteristics
    const queryLength = query.length;
    const hasQuestion = query.includes('?');
    const hasTechnicalTerms = /\b(api|database|algorithm|function|class|method)\b/i.test(query);
    
    // Choose strategy based on query characteristics
    if (queryLength < 50 && hasQuestion) {
      // Short questions: use MMR for diversity
      return this.maximalMarginalRelevance(candidates, budget, queryEmbedding);
    } else if (hasTechnicalTerms) {
      // Technical queries: use uncertainty sampling
      return this.uncertaintySampling(candidates, budget);
    } else {
      // General queries: use ensemble
      return this.ensembleStrategy(candidates, query, budget, queryEmbedding);
    }
  }

  private async ensembleStrategy(
    candidates: Chunk[], 
    query: string, 
    budget: number,
    queryEmbedding?: number[]
  ): Promise<Chunk[]> {
    // Combine multiple strategies
    const mmrChunks = await this.maximalMarginalRelevance(candidates, Math.ceil(budget / 2), queryEmbedding);
    const uncertaintyChunks = await this.uncertaintySampling(candidates, Math.floor(budget / 2));
    
    // Merge and deduplicate
    const combined = [...mmrChunks, ...uncertaintyChunks];
    const unique = combined.filter((chunk, index, arr) => 
      arr.findIndex(c => c.id === chunk.id) === index
    );
    
    return unique.slice(0, budget);
  }

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
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ============================================================
// OPTIMIZATION MEMORY
// ============================================================

export interface RetrievalRecord {
  query: string;
  queryType: string;
  chunks: Chunk[];
  sensorMode: SensorMode;
  effectiveness: number;  // 0-1, measured by downstream quality
  timestamp: number;
  metadata: {
    queryLength: number;
    hasQuestion: boolean;
    technicalTerms: boolean;
    processingTimeMs: number;
  };
}

export class OptimizationStore {
  private records: RetrievalRecord[] = [];
  private queryTypeCache: Map<string, string> = new Map();

  constructor() {
    logger.info('OptimizationStore initialized');
  }

  async record(record: RetrievalRecord): Promise<void> {
    this.records.push(record);
    
    // Keep only last 1000 records to prevent memory bloat
    if (this.records.length > 1000) {
      this.records = this.records.slice(-1000);
    }
    
    logger.info('Retrieval record stored', {
      queryType: record.queryType,
      sensorMode: record.sensorMode,
      effectiveness: record.effectiveness
    });
  }

  async getBestStrategy(queryType: string): Promise<SensorMode> {
    const relevantRecords = this.records.filter(r => r.queryType === queryType);
    
    if (relevantRecords.length === 0) {
      return 'adaptive'; // Default fallback
    }

    // Calculate average effectiveness by strategy
    const strategyEffectiveness = new Map<SensorMode, number[]>();
    
    for (const record of relevantRecords) {
      if (!strategyEffectiveness.has(record.sensorMode)) {
        strategyEffectiveness.set(record.sensorMode, []);
      }
      strategyEffectiveness.get(record.sensorMode)!.push(record.effectiveness);
    }

    // Find best strategy
    let bestStrategy: SensorMode = 'adaptive';
    let bestAvgEffectiveness = 0;

    for (const [strategy, effectivenesses] of strategyEffectiveness) {
      const avgEffectiveness = effectivenesses.reduce((a, b) => a + b, 0) / effectivenesses.length;
      if (avgEffectiveness > bestAvgEffectiveness) {
        bestAvgEffectiveness = avgEffectiveness;
        bestStrategy = strategy;
      }
    }

    logger.info('Best strategy determined', {
      queryType,
      bestStrategy,
      avgEffectiveness: bestAvgEffectiveness,
      sampleSize: relevantRecords.length
    });

    return bestStrategy;
  }

  async suggestParameters(query: string): Promise<{k: number, budget: number, mode: SensorMode}> {
    const queryType = this.classifyQuery(query);
    const bestMode = await this.getBestStrategy(queryType);
    
    // Analyze historical performance for parameter suggestions
    const relevantRecords = this.records.filter(r => r.queryType === queryType);
    
    let suggestedK = 10;
    let suggestedBudget = 3;
    
    if (relevantRecords.length > 0) {
      // Find optimal k and budget based on historical data
      const avgK = relevantRecords.reduce((sum, r) => sum + r.chunks.length, 0) / relevantRecords.length;
      suggestedK = Math.max(5, Math.min(20, Math.round(avgK * 1.5)));
      suggestedBudget = Math.max(2, Math.min(5, Math.round(avgK * 0.3)));
    }

    return {
      k: suggestedK,
      budget: suggestedBudget,
      mode: bestMode
    };
  }

  private classifyQuery(query: string): string {
    // Simple query classification
    if (query.includes('?')) {
      if (query.length < 50) return 'short_question';
      return 'long_question';
    }
    
    if (/\b(how|what|why|when|where)\b/i.test(query)) {
      return 'explanatory';
    }
    
    if (/\b(api|database|algorithm|function|class|method|code)\b/i.test(query)) {
      return 'technical';
    }
    
    if (query.length < 100) return 'brief';
    return 'detailed';
  }

  getStats(): {totalRecords: number, queryTypes: Record<string, number>, strategies: Record<string, number>} {
    const queryTypes: Record<string, number> = {};
    const strategies: Record<string, number> = {};
    
    for (const record of this.records) {
      queryTypes[record.queryType] = (queryTypes[record.queryType] || 0) + 1;
      strategies[record.sensorMode] = (strategies[record.sensorMode] || 0) + 1;
    }
    
    return {
      totalRecords: this.records.length,
      queryTypes,
      strategies
    };
  }
}

// ============================================================
// MAIN REFRAG SYSTEM
// ============================================================

export class REFRAGSystem {
  private retriever: VectorRetriever;
  private sensor: AdvancedSensor;
  private optimizationMemory: OptimizationStore;
  private config: REFRAGConfig;
  private embeddingGenerator: EmbeddingGenerator;

  constructor(config: REFRAGConfig, retriever: VectorRetriever) {
    this.config = config;
    this.retriever = retriever;
    this.sensor = new AdvancedSensor(config.sensorMode, {
      mmrLambda: config.mmrLambda,
      uncertaintyThreshold: config.uncertaintyThreshold
    });
    this.optimizationMemory = new OptimizationStore();
    this.embeddingGenerator = new EmbeddingGenerator();
    
    logger.info('REFRAG System initialized', {
      sensorMode: config.sensorMode,
      k: config.k,
      budget: config.budget,
      optimizationEnabled: config.enableOptimizationMemory
    });
  }

  async retrieve(query: string, context?: any): Promise<REFRAGResult> {
    const startTime = Date.now();
    
    logger.info('REFRAG retrieval started', { query: query.substring(0, 100) });

    try {
      // 1. Generate query embedding
      const queryEmbedding = await this.embeddingGenerator.generate(query);
      
      // 2. Get optimization suggestions if enabled
      let k = this.config.k;
      let budget = this.config.budget;
      let sensorMode = this.config.sensorMode;
      
      if (this.config.enableOptimizationMemory) {
        const suggestions = await this.optimizationMemory.suggestParameters(query);
        k = suggestions.k;
        budget = suggestions.budget;
        sensorMode = suggestions.mode;
        
        // Update sensor mode if different
        if (sensorMode !== this.sensor.getMode()) {
          this.sensor = new AdvancedSensor(sensorMode, {
            mmrLambda: this.config.mmrLambda,
            uncertaintyThreshold: this.config.uncertaintyThreshold
          });
        }
      }

      // 3. Retrieve initial candidates
      const candidates = await this.retriever.search(queryEmbedding, k);
      
      // 4. Sensor-based chunk selection
      const selectedChunks = await this.sensor.select(
        candidates, 
        query, 
        budget, 
        queryEmbedding
      );

      // 5. Calculate metrics
      const diversityScore = this.calculateDiversity(selectedChunks);
      const relevanceScores = selectedChunks.map(c => c.score || 0);
      const processingTime = Date.now() - startTime;

      // 6. Record for optimization (if enabled)
      if (this.config.enableOptimizationMemory) {
        const queryType = this.classifyQuery(query);
        const effectiveness = await this.estimateEffectiveness(query, selectedChunks);
        
        await this.optimizationMemory.record({
          query,
          queryType,
          chunks: selectedChunks,
          sensorMode,
          effectiveness,
          timestamp: Date.now(),
          metadata: {
            queryLength: query.length,
            hasQuestion: query.includes('?'),
            technicalTerms: /\b(api|database|algorithm|function|class|method)\b/i.test(query),
            processingTimeMs: processingTime
          }
        });
      }

      const result: REFRAGResult = {
        chunks: selectedChunks,
        metadata: {
          sensorStrategy: sensorMode,
          diversityScore,
          relevanceScores,
          totalCandidates: candidates.length,
          selectedCount: selectedChunks.length,
          processingTimeMs: processingTime,
          optimizationLearned: this.config.enableOptimizationMemory
        }
      };

      logger.info('REFRAG retrieval completed', {
        candidates: candidates.length,
        selected: selectedChunks.length,
        diversityScore: diversityScore.toFixed(3),
        processingTimeMs: processingTime
      });

      return result;

    } catch (error) {
      logger.error('REFRAG retrieval failed', error);
      throw error;
    }
  }

  private calculateDiversity(chunks: Chunk[]): number {
    if (chunks.length <= 1) return 1;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const similarity = this.cosineSimilarity(
          chunks[i].embedding || [],
          chunks[j].embedding || []
        );
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
    return 1 - avgSimilarity; // Higher diversity = lower average similarity
  }

  private async estimateEffectiveness(query: string, chunks: Chunk[]): Promise<number> {
    // Simple heuristic: longer, more diverse chunks = better
    const avgLength = chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length;
    const diversity = this.calculateDiversity(chunks);
    const avgScore = chunks.reduce((sum, c) => sum + (c.score || 0), 0) / chunks.length;
    
    // Combine factors (normalized to 0-1)
    const lengthFactor = Math.min(avgLength / 1000, 1); // Normalize by 1000 chars
    const diversityFactor = diversity;
    const scoreFactor = avgScore;
    
    return (lengthFactor * 0.3 + diversityFactor * 0.4 + scoreFactor * 0.3);
  }

  private classifyQuery(query: string): string {
    if (query.includes('?')) {
      if (query.length < 50) return 'short_question';
      return 'long_question';
    }
    
    if (/\b(how|what|why|when|where)\b/i.test(query)) {
      return 'explanatory';
    }
    
    if (/\b(api|database|algorithm|function|class|method|code)\b/i.test(query)) {
      return 'technical';
    }
    
    if (query.length < 100) return 'brief';
    return 'detailed';
  }

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
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getOptimizationStats(): any {
    return this.optimizationMemory.getStats();
  }
}

// ============================================================
// EMBEDDING GENERATOR
// ============================================================

export class EmbeddingGenerator {
  async generate(text: string): Promise<number[]> {
    try {
      const result = await embeddingService.generate(text);
      logger.info('REFRAG embedding generated successfully', { 
        provider: result.provider, 
        dimensions: result.dimensions,
        textLength: text.length 
      });
      return result.embedding;
    } catch (error: any) {
      logger.error('REFRAG embedding generation failed', { error: error.message });
      // Return zero vector as fallback
      return new Array(512).fill(0);
    }
  }
}

// Export singleton instance
export const refragSystem = new REFRAGSystem(
  {
    sensorMode: 'adaptive',
    k: 10,
    budget: 3,
    mmrLambda: 0.7,
    uncertaintyThreshold: 0.5,
    enableOptimizationMemory: true,
    vectorDB: {
      type: 'inmemory',
      config: {}
    }
  },
  // Will be replaced with actual retriever
  {} as VectorRetriever
);
