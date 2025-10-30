/**
 * Context Synthesis Stage with Delta Rule (RAG Stage 4)
 *
 * Implements GEPA RAG context synthesis with DeltaNet-inspired memory management.
 * Uses Delta Rule for targeted forgetting when query topics shift.
 *
 * Features:
 * - Delta Rule memory (targeted key-value updates)
 * - Data-dependent gating (α_t scalar) for topic shift detection
 * - Per-dimension gating (Kimi-style) for semantic control
 * - Inference sampling for diverse synthesis candidates
 * - Memory-efficient bounded context
 * - Adaptive context window management
 *
 * References:
 * - DeltaNet: https://arxiv.org/abs/2102.11174
 * - Mamba-2: https://arxiv.org/abs/2405.21060
 * - Kimi: https://arxiv.org/abs/2410.16194
 * - GEPA RAG: https://github.com/gepa-ai/gepa
 */

import { Document } from './vector-store-adapter';
import { mcmcSampling, generateQualitySamples, type SamplingConfig } from '../inference-sampling';

export interface ContextSynthesisConfig {
  /**
   * Maximum context length (tokens)
   */
  maxContextLength?: number;

  /**
   * Whether to use Delta Rule memory
   */
  useDeltaRule?: boolean;

  /**
   * Topic shift threshold (0.0-1.0)
   * Higher = more sensitive to topic changes
   */
  topicShiftThreshold?: number;

  /**
   * Gating strategy
   */
  gatingStrategy?: 'uniform' | 'data-dependent' | 'per-dimension';

  /**
   * Dimension for embedding state (for per-dimension gating)
   */
  embeddingDim?: number;

  /**
   * Whether to use inference sampling
   */
  useInferenceSampling?: boolean;

  /**
   * Number of synthesis candidates
   */
  numCandidates?: number;

  /**
   * Beta parameter for quality sharpening
   */
  beta?: number;

  /**
   * Model for synthesis
   */
  model?: string;
}

export interface ContextSynthesisResult {
  context: string;
  documents: Document[];
  memoryState?: Float32Array;
  alpha: number | number[];  // Gating parameter
  beta: number;              // Update strength
  topicShift: number;        // Topic shift score
  diversityScore: number;
  compressionRatio: number;
  latency: number;
}

/**
 * GEPA-Optimized Synthesis Prompts
 */
const SYNTHESIS_PROMPTS = {
  default: `Given the query: "{query}"

Synthesize the following documents into a coherent, concise context:

Documents:
{documents}

Requirements:
- Combine complementary information
- Remove redundancies
- Maintain factual accuracy
- Prioritize relevance to the query
- Keep context under {maxLength} tokens

Synthesized Context:`,

  focused: `Query: "{query}"

Create a FOCUSED context from these documents, keeping only information directly relevant to the query:

{documents}

Synthesized Context (under {maxLength} tokens):`,

  comprehensive: `Query: "{query}"

Create a COMPREHENSIVE context that combines all relevant details from these documents:

{documents}

Synthesized Context (under {maxLength} tokens):`,
};

/**
 * Context Synthesizer with Delta Rule Memory
 */
export class ContextSynthesizer {
  private memoryState: Float32Array | null = null;
  private previousQuery: string | null = null;
  private previousEmbedding: Float32Array | null = null;
  private embeddingDim: number;

  constructor(embeddingDim: number = 1536) {
    this.embeddingDim = embeddingDim;
  }

  /**
   * Synthesize context from documents
   */
  async synthesize(
    query: string,
    documents: Document[],
    config: ContextSynthesisConfig = {}
  ): Promise<ContextSynthesisResult> {
    const startTime = Date.now();

    const {
      maxContextLength = 2000,
      useDeltaRule = true,
      topicShiftThreshold = 0.5,
      gatingStrategy = 'data-dependent',
      embeddingDim = this.embeddingDim,
      useInferenceSampling = true,
      numCandidates = 3,
      beta = 1.5,
      model = 'gpt-4o-mini',
    } = config;

    console.log(`🧩 Synthesizing context from ${documents.length} documents`);

    // Step 1: Detect topic shift
    const topicShift = await this.detectTopicShift(query, this.previousQuery);

    console.log(`   📊 Topic shift: ${topicShift.toFixed(3)} (threshold: ${topicShiftThreshold})`);

    // Step 2: Calculate gating parameter α_t
    let alpha: number | number[];

    if (gatingStrategy === 'uniform') {
      alpha = topicShift > topicShiftThreshold ? 0.3 : 0.9;
    } else if (gatingStrategy === 'data-dependent') {
      alpha = this.calculateDataDependentGating(topicShift, topicShiftThreshold);
    } else {
      alpha = await this.calculatePerDimensionGating(
        query,
        topicShift,
        embeddingDim
      );
    }

    console.log(`   🎚️ Gating: α_t = ${Array.isArray(alpha) ? 'per-dim' : alpha.toFixed(3)}`);

    // Step 3: Delta Rule update (if enabled)
    if (useDeltaRule && this.memoryState) {
      this.memoryState = await this.deltaRuleUpdate(
        this.memoryState,
        query,
        documents,
        alpha,
        beta
      );

      console.log(`   🔄 Delta Rule: Updated memory state`);
    } else if (useDeltaRule) {
      // Initialize memory state
      this.memoryState = await this.initializeMemoryState(query, documents, embeddingDim);

      console.log(`   🆕 Delta Rule: Initialized memory state`);
    }

    // Step 4: Synthesize context (with or without inference sampling)
    let synthesizedContext: string;

    if (useInferenceSampling) {
      synthesizedContext = await this.synthesizeWithSampling(
        query,
        documents,
        maxContextLength,
        numCandidates,
        beta,
        model
      );
    } else {
      synthesizedContext = await this.synthesizeSimple(
        query,
        documents,
        maxContextLength,
        model
      );
    }

    // Step 5: Calculate metrics
    const diversityScore = this.calculateDiversity(documents.map(d => d.content));
    const originalLength = documents.reduce((sum, d) => sum + d.content.length, 0);
    const compressionRatio = originalLength / synthesizedContext.length;
    const latency = Date.now() - startTime;

    // Update state for next iteration
    this.previousQuery = query;

    console.log(`   ✅ Synthesized ${synthesizedContext.length} chars (${compressionRatio.toFixed(1)}x compression)`);
    console.log(`   📊 Diversity: ${diversityScore.toFixed(3)}, Latency: ${latency}ms`);

    return {
      context: synthesizedContext,
      documents,
      memoryState: this.memoryState || undefined,
      alpha,
      beta,
      topicShift,
      diversityScore,
      compressionRatio,
      latency,
    };
  }

  /**
   * Detect topic shift between current and previous query
   */
  private async detectTopicShift(currentQuery: string, previousQuery: string | null): Promise<number> {
    if (!previousQuery) return 0;

    // Use token overlap as approximation
    // In production, use embeddings: 1 - cosine_similarity(embed(q1), embed(q2))
    const tokens1 = new Set(this.tokenize(currentQuery));
    const tokens2 = new Set(this.tokenize(previousQuery));

    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);

    const similarity = intersection.size / union.size;

    return 1 - similarity;  // Higher = more topic shift
  }

  /**
   * Calculate data-dependent gating (scalar α_t)
   *
   * α_t determines how much previous context to retain:
   * - α_t = 1.0: Keep all previous context
   * - α_t = 0.5: Keep half, forget half
   * - α_t = 0.0: Forget all previous context
   */
  private calculateDataDependentGating(topicShift: number, threshold: number): number {
    if (topicShift < threshold * 0.5) {
      // Small shift: Keep most context
      return 0.9;
    } else if (topicShift < threshold) {
      // Medium shift: Partial forgetting
      return 0.5;
    } else {
      // Large shift: Aggressive forgetting
      return 0.2;
    }
  }

  /**
   * Calculate per-dimension gating (Kimi-style)
   *
   * Returns α_t as a vector where each dimension can be retained/forgotten independently.
   *
   * Example semantic dimensions:
   * - Dimensions 0-511: Financial information
   * - Dimensions 512-1023: Product information
   * - Dimensions 1024-1535: Customer information
   */
  private async calculatePerDimensionGating(
    query: string,
    topicShift: number,
    embeddingDim: number
  ): Promise<number[]> {
    // Simplified: Use topic shift to modulate dimensions
    // In production, use learned gating network

    const alpha = new Array(embeddingDim).fill(0.5);

    // Example: If topic shift detected, aggressively forget certain dimensions
    if (topicShift > 0.7) {
      // Forget first half (financial info)
      for (let i = 0; i < embeddingDim / 2; i++) {
        alpha[i] = 0.1;
      }

      // Keep second half (product info)
      for (let i = embeddingDim / 2; i < embeddingDim; i++) {
        alpha[i] = 0.9;
      }
    }

    return alpha;
  }

  /**
   * Delta Rule update
   *
   * S_t = α_t * S_{t-1} - α_t * β_t * S_{t-1} * k_t * k_t^T + β_t * v_t * k_t^T
   *
   * Where:
   * - S_t: New state
   * - S_{t-1}: Previous state
   * - α_t: Gating (keep previous context)
   * - β_t: Update strength
   * - k_t: Query embedding
   * - v_t: Document embeddings
   */
  private async deltaRuleUpdate(
    state: Float32Array,
    query: string,
    documents: Document[],
    alpha: number | number[],
    beta: number
  ): Promise<Float32Array> {
    const queryEmbedding = await this.getEmbedding(query);
    const docEmbeddings = await Promise.all(
      documents.map(d => this.getEmbedding(d.content))
    );

    const newState = new Float32Array(state.length);

    // Step 1: Scale previous state by α_t
    for (let i = 0; i < state.length; i++) {
      const alphaValue = Array.isArray(alpha) ? alpha[i] : alpha;
      newState[i] = alphaValue * state[i];
    }

    // Step 2: Remove old value for k_t (Delta Rule)
    // v_old = S_{t-1} @ k_t
    const oldValue = this.dotProduct(state, queryEmbedding);

    for (let i = 0; i < state.length; i++) {
      const alphaValue = Array.isArray(alpha) ? alpha[i] : alpha;
      newState[i] -= alphaValue * beta * oldValue * queryEmbedding[i];
    }

    // Step 3: Add new value for k_t
    // Average document embeddings as v_t
    const avgDocEmbedding = this.averageEmbeddings(docEmbeddings);

    const newValue = this.dotProduct(avgDocEmbedding, queryEmbedding);

    for (let i = 0; i < state.length; i++) {
      newState[i] += beta * newValue * queryEmbedding[i];
    }

    return newState;
  }

  /**
   * Initialize memory state
   */
  private async initializeMemoryState(
    query: string,
    documents: Document[],
    embeddingDim: number
  ): Promise<Float32Array> {
    const state = new Float32Array(embeddingDim);

    const queryEmbedding = await this.getEmbedding(query);
    const docEmbeddings = await Promise.all(
      documents.map(d => this.getEmbedding(d.content))
    );

    const avgDocEmbedding = this.averageEmbeddings(docEmbeddings);

    // Initialize as outer product: k_t @ v_t^T
    const value = this.dotProduct(avgDocEmbedding, queryEmbedding);

    for (let i = 0; i < embeddingDim; i++) {
      state[i] = value * queryEmbedding[i];
    }

    return state;
  }

  /**
   * Synthesize context with inference sampling
   */
  private async synthesizeWithSampling(
    query: string,
    documents: Document[],
    maxLength: number,
    numCandidates: number,
    beta: number,
    model: string
  ): Promise<string> {
    const docList = documents
      .map((doc, i) => `[${i + 1}] ${doc.content.substring(0, 300)}...`)
      .join('\n\n');

    const prompt = SYNTHESIS_PROMPTS.default
      .replace('{query}', query)
      .replace('{documents}', docList)
      .replace('{maxLength}', maxLength.toString());

    // Generate diverse synthesis candidates
    const samplingConfig: SamplingConfig = {
      model,
      prompt,
      numSamples: numCandidates * 2,
      beta,
      temperature: 0.8,
      maxTokens: maxLength,
      topK: numCandidates,
    };

    const result = await mcmcSampling(samplingConfig);

    // Select best candidate (highest quality)
    return result.samples[0];
  }

  /**
   * Simple synthesis (single generation)
   */
  private async synthesizeSimple(
    query: string,
    documents: Document[],
    maxLength: number,
    model: string
  ): Promise<string> {
    const docList = documents
      .map((doc, i) => `[${i + 1}] ${doc.content.substring(0, 300)}...`)
      .join('\n\n');

    const prompt = SYNTHESIS_PROMPTS.default
      .replace('{query}', query)
      .replace('{documents}', docList)
      .replace('{maxLength}', maxLength.toString());

    // Placeholder: Replace with actual LLM call
    return `Synthesized context for "${query}" from ${documents.length} documents.`;
  }

  /**
   * Get embedding (placeholder - replace with OpenAI API)
   */
  private async getEmbedding(text: string): Promise<Float32Array> {
    // Placeholder: Random embedding
    const embedding = new Float32Array(this.embeddingDim);

    for (let i = 0; i < this.embeddingDim; i++) {
      embedding[i] = Math.random() * 2 - 1;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));

    for (let i = 0; i < this.embeddingDim; i++) {
      embedding[i] /= norm;
    }

    return embedding;
  }

  /**
   * Dot product
   */
  private dotProduct(a: Float32Array, b: Float32Array): number {
    let sum = 0;

    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  /**
   * Average embeddings
   */
  private averageEmbeddings(embeddings: Float32Array[]): Float32Array {
    const avg = new Float32Array(this.embeddingDim);

    for (const embedding of embeddings) {
      for (let i = 0; i < this.embeddingDim; i++) {
        avg[i] += embedding[i];
      }
    }

    for (let i = 0; i < this.embeddingDim; i++) {
      avg[i] /= embeddings.length;
    }

    return avg;
  }

  /**
   * Calculate diversity
   */
  private calculateDiversity(contents: string[]): number {
    if (contents.length <= 1) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        const similarity = this.calculateTextSimilarity(contents[i], contents[j]);
        totalDistance += 1 - similarity;
        comparisons++;
      }
    }

    return totalDistance / comparisons;
  }

  /**
   * Calculate text similarity (Jaccard)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));

    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  /**
   * Reset memory state
   */
  reset(): void {
    this.memoryState = null;
    this.previousQuery = null;
    this.previousEmbedding = null;
  }
}

/**
 * Factory function
 */
export function createContextSynthesizer(embeddingDim?: number): ContextSynthesizer {
  return new ContextSynthesizer(embeddingDim);
}

/**
 * Convenience function for simple synthesis
 */
export async function synthesizeContext(
  query: string,
  documents: Document[],
  maxLength: number = 2000
): Promise<string> {
  const synthesizer = new ContextSynthesizer();

  const result = await synthesizer.synthesize(query, documents, {
    maxContextLength: maxLength,
    useDeltaRule: true,
  });

  return result.context;
}
