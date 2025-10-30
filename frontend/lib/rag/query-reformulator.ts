/**
 * Query Reformulation Stage (RAG Stage 1)
 *
 * Implements GEPA RAG query reformulation with inference sampling.
 * Generates diverse, high-quality query variations to improve retrieval recall.
 *
 * Features:
 * - MCMC-inspired sampling for diverse reformulations
 * - GEPA-optimized prompt selection
 * - Multi-strategy reformulation (expansion, clarification, decomposition)
 * - Semantic deduplication
 * - Quality scoring
 *
 * References:
 * - GEPA RAG: https://github.com/gepa-ai/gepa/blob/main/src/gepa/adapters/generic_rag_adapter/GEPA_RAG.md
 * - Inference Sampling: arXiv:2510.14901
 */

import { mcmcSampling, generateDiverseSamples, type SamplingConfig } from '../inference-sampling';

export interface QueryReformulationConfig {
  /**
   * Number of reformulations to generate
   */
  numReformulations: number;

  /**
   * Reformulation strategies to use
   */
  strategies?: ReformulationStrategy[];

  /**
   * Beta parameter for quality sharpening (1.0-2.0)
   * Higher = more quality-focused, lower = more diversity
   */
  beta?: number;

  /**
   * Model to use for generation
   */
  model?: string;

  /**
   * Temperature for generation (0.0-2.0)
   */
  temperature?: number;

  /**
   * Whether to include original query in results
   */
  includeOriginal?: boolean;

  /**
   * Minimum similarity threshold for deduplication
   */
  dedupThreshold?: number;
}

export type ReformulationStrategy =
  | 'expansion'      // Add context and details
  | 'clarification'  // Make query more specific
  | 'decomposition'  // Break into sub-queries
  | 'simplification' // Remove jargon
  | 'variation';     // Paraphrase with same meaning

export interface ReformulatedQuery {
  query: string;
  strategy: ReformulationStrategy;
  quality: number;
  similarity: number;  // Similarity to original query (0-1)
  rank: number;
}

export interface ReformulationResult {
  originalQuery: string;
  reformulations: ReformulatedQuery[];
  diversity: number;
  avgQuality: number;
  strategiesUsed: ReformulationStrategy[];
  latency: number;
}

/**
 * GEPA-Optimized Prompts for Query Reformulation
 *
 * These prompts are evolved through GEPA optimization to maximize
 * retrieval recall while maintaining query intent.
 */
const REFORMULATION_PROMPTS: Record<ReformulationStrategy, string> = {
  expansion: `Given the query: "{query}"

Generate an expanded version that:
- Adds relevant context and domain knowledge
- Includes potential synonyms and related concepts
- Makes implicit requirements explicit
- Maintains the original intent

Expanded query:`,

  clarification: `Given the query: "{query}"

Generate a clarified version that:
- Removes ambiguity
- Specifies implicit assumptions
- Adds precision without changing intent
- Uses more specific terminology

Clarified query:`,

  decomposition: `Given the query: "{query}"

Break this into 2-3 focused sub-queries that:
- Cover different aspects of the original question
- Can be answered independently
- Together address the full query
- Are more specific than the original

Sub-queries (one per line):`,

  simplification: `Given the query: "{query}"

Generate a simplified version that:
- Removes unnecessary jargon
- Uses plain language
- Keeps core intent clear
- Is easier to match against documents

Simplified query:`,

  variation: `Given the query: "{query}"

Generate a paraphrased variation that:
- Expresses the same intent differently
- Uses alternative vocabulary
- Maintains semantic meaning
- Would match different document phrasings

Variation:`,
};

/**
 * Query Reformulator
 *
 * Generates diverse, high-quality query reformulations using
 * GEPA optimization and inference sampling.
 */
export class QueryReformulator {
  private model: string;
  private defaultBeta: number;
  private defaultTemp: number;

  constructor(
    model: string = 'gpt-4o-mini',
    defaultBeta: number = 1.3,
    defaultTemp: number = 0.8
  ) {
    this.model = model;
    this.defaultBeta = defaultBeta;
    this.defaultTemp = defaultTemp;
  }

  /**
   * Reformulate query with multiple strategies
   */
  async reformulate(
    query: string,
    config: QueryReformulationConfig
  ): Promise<ReformulationResult> {
    const startTime = Date.now();

    const {
      numReformulations,
      strategies = ['expansion', 'clarification', 'variation'],
      beta = this.defaultBeta,
      model = this.model,
      temperature = this.defaultTemp,
      includeOriginal = true,
      dedupThreshold = 0.85,
    } = config;

    console.log(`🔄 Reformulating query: "${query.substring(0, 60)}..."`);
    console.log(`   Strategies: [${strategies.join(', ')}]`);
    console.log(`   Target count: ${numReformulations}`);

    // Generate reformulations per strategy
    const allReformulations: ReformulatedQuery[] = [];

    for (const strategy of strategies) {
      const strategyResults = await this.reformulateWithStrategy(
        query,
        strategy,
        numReformulations,
        beta,
        model,
        temperature
      );

      allReformulations.push(...strategyResults);
    }

    // Semantic deduplication
    const deduplicated = await this.deduplicateReformulations(
      allReformulations,
      dedupThreshold
    );

    // Select top-k by quality
    const sorted = deduplicated
      .sort((a, b) => b.quality - a.quality)
      .slice(0, numReformulations);

    // Add original if requested
    if (includeOriginal) {
      sorted.unshift({
        query,
        strategy: 'variation',
        quality: 1.0,
        similarity: 1.0,
        rank: 0,
      });
    }

    // Update ranks
    sorted.forEach((r, i) => {
      r.rank = i + 1;
    });

    // Calculate metrics
    const diversity = this.calculateDiversity(sorted.map(r => r.query));
    const avgQuality = sorted.reduce((sum, r) => sum + r.quality, 0) / sorted.length;
    const latency = Date.now() - startTime;

    console.log(`   ✅ Generated ${sorted.length} reformulations in ${latency}ms`);
    console.log(`   📊 Diversity: ${diversity.toFixed(3)}, Avg Quality: ${avgQuality.toFixed(3)}`);

    return {
      originalQuery: query,
      reformulations: sorted,
      diversity,
      avgQuality,
      strategiesUsed: strategies,
      latency,
    };
  }

  /**
   * Generate reformulations for a specific strategy
   */
  private async reformulateWithStrategy(
    query: string,
    strategy: ReformulationStrategy,
    count: number,
    beta: number,
    model: string,
    temperature: number
  ): Promise<ReformulatedQuery[]> {
    const prompt = REFORMULATION_PROMPTS[strategy].replace('{query}', query);

    // Generate samples with MCMC sampling
    const samplingConfig: SamplingConfig = {
      model,
      prompt,
      numSamples: count * 2, // Oversample for selection
      beta,
      temperature,
      maxTokens: 150,
      topK: count,
    };

    const result = await mcmcSampling(samplingConfig);

    // Process results
    const reformulations: ReformulatedQuery[] = [];

    for (let i = 0; i < result.samples.length; i++) {
      const sample = result.samples[i].trim();

      // Skip empty or invalid samples
      if (!sample || sample.length < 10) continue;

      // Handle decomposition (multiple sub-queries)
      if (strategy === 'decomposition') {
        const subQueries = sample
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 10 && q.includes('?'));

        for (const subQuery of subQueries) {
          const cleaned = this.cleanReformulation(subQuery);
          const similarity = await this.calculateSimilarity(query, cleaned);

          reformulations.push({
            query: cleaned,
            strategy,
            quality: result.likelihoods[i] || 0.5,
            similarity,
            rank: 0, // Will be set later
          });
        }
      } else {
        const cleaned = this.cleanReformulation(sample);
        const similarity = await this.calculateSimilarity(query, cleaned);

        reformulations.push({
          query: cleaned,
          strategy,
          quality: result.likelihoods[i] || 0.5,
          similarity,
          rank: 0,
        });
      }
    }

    return reformulations;
  }

  /**
   * Clean reformulation output
   */
  private cleanReformulation(text: string): string {
    // Remove common prefixes
    const prefixes = [
      'Expanded query:',
      'Clarified query:',
      'Sub-query:',
      'Simplified query:',
      'Variation:',
      'Query:',
    ];

    let cleaned = text.trim();

    for (const prefix of prefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length).trim();
      }
    }

    // Remove numbering (1., 2., etc.)
    cleaned = cleaned.replace(/^\d+\.\s*/, '');

    // Remove quotes
    cleaned = cleaned.replace(/^["']|["']$/g, '');

    return cleaned.trim();
  }

  /**
   * Calculate semantic similarity between queries
   *
   * Uses token overlap (Jaccard) as approximation.
   * For production, use embeddings.
   */
  private async calculateSimilarity(query1: string, query2: string): Promise<number> {
    const tokens1 = new Set(this.tokenize(query1));
    const tokens2 = new Set(this.tokenize(query2));

    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  /**
   * Tokenize query for similarity calculation
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2); // Filter stop words
  }

  /**
   * Deduplicate semantically similar reformulations
   */
  private async deduplicateReformulations(
    reformulations: ReformulatedQuery[],
    threshold: number
  ): Promise<ReformulatedQuery[]> {
    const deduplicated: ReformulatedQuery[] = [];
    const seen = new Set<string>();

    for (const reformulation of reformulations) {
      // Skip if too similar to original
      if (reformulation.similarity > threshold) {
        continue;
      }

      // Skip if too similar to already selected
      let isDuplicate = false;
      for (const existing of deduplicated) {
        const similarity = await this.calculateSimilarity(
          reformulation.query,
          existing.query
        );

        if (similarity > threshold) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate && !seen.has(reformulation.query.toLowerCase())) {
        deduplicated.push(reformulation);
        seen.add(reformulation.query.toLowerCase());
      }
    }

    return deduplicated;
  }

  /**
   * Calculate diversity across reformulations
   */
  private calculateDiversity(queries: string[]): number {
    if (queries.length <= 1) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < queries.length; i++) {
      for (let j = i + 1; j < queries.length; j++) {
        const tokens1 = new Set(this.tokenize(queries[i]));
        const tokens2 = new Set(this.tokenize(queries[j]));

        const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
        const union = new Set([...tokens1, ...tokens2]);

        const jaccard = intersection.size / union.size;
        totalDistance += 1 - jaccard;
        comparisons++;
      }
    }

    return totalDistance / comparisons;
  }
}

/**
 * Factory function for easy instantiation
 */
export function createQueryReformulator(
  model?: string,
  beta?: number,
  temperature?: number
): QueryReformulator {
  return new QueryReformulator(model, beta, temperature);
}

/**
 * Convenience function for simple reformulation
 */
export async function reformulateQuery(
  query: string,
  numReformulations: number = 5,
  strategies?: ReformulationStrategy[]
): Promise<ReformulationResult> {
  const reformulator = new QueryReformulator();

  return await reformulator.reformulate(query, {
    numReformulations,
    strategies,
    includeOriginal: true,
  });
}
