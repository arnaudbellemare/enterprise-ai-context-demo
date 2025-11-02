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
  gatingStrategy?: 'uniform' | 'data-dependent' | 'per-dimension' | 'kimi-enhanced';

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

  /**
   * ENHANCEMENT: Residual Learning (RDN)
   */
  enableResidual?: boolean;
  residualClipValue?: number;  // γ parameter for residual clipping (default: 0.5)

  /**
   * ENHANCEMENT: Data-dependent gating network
   */
  enableDataDependentGating?: boolean;
  gatingNetworkDim?: number;  // Dimension of gating network (default: 64)

  /**
   * ENHANCEMENT: Adaptive stability mechanisms
   */
  adaptiveBeta?: boolean;  // Whether β_t adapts based on topic shift
  stabilityThreshold?: number;  // Threshold for stability checks (default: 0.1)
}

export interface ContextSynthesisResult {
  context: string;
  documents: Document[];
  memoryState?: Float32Array;
  residualState?: Float32Array;  // ENHANCEMENT: Residual state (R_t)
  alpha: number | number[];  // Gating parameter (can be per-dimension)
  beta: number;              // Update strength (can be adaptive)
  topicShift: number;        // Topic shift score
  diversityScore: number;
  compressionRatio: number;
  latency: number;
  // ENHANCEMENT: Additional metrics
  residualMagnitude?: number;  // ||R_t|| for monitoring
  gatingEfficiency?: number;   // How efficiently gating used memory
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
 * Context Synthesizer with Enhanced Delta Rule Memory
 * 
 * ENHANCEMENTS:
 * - Residual Learning (RDN): Maintains residual state for expressivity
 * - Kimi-Style Per-Dimension Gating: Data-dependent fine-grained control
 * - Adaptive Stability Mechanisms: Prevents divergence, enables graceful degradation
 */
export class ContextSynthesizer {
  private memoryState: Float32Array | null = null;
  private residualState: Float32Array | null = null;  // ENHANCEMENT: Residual state (R_t)
  private previousQuery: string | null = null;
  private previousEmbedding: Float32Array | null = null;
  private embeddingDim: number;
  
  // ENHANCEMENT: Gating network parameters (learnable, initialized as identity-like)
  private gatingNetworkWeights: Float32Array | null = null;

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
      // ENHANCEMENT: Residual learning parameters
      enableResidual = false,
      residualClipValue = 0.5,
      // ENHANCEMENT: Data-dependent gating
      enableDataDependentGating = false,
      gatingNetworkDim = 64,
      // ENHANCEMENT: Adaptive stability
      adaptiveBeta = false,
      stabilityThreshold = 0.1,
    } = config;

    console.log(`🧩 Synthesizing context from ${documents.length} documents`);

    // Step 1: Detect topic shift
    const topicShift = await this.detectTopicShift(query, this.previousQuery);

    console.log(`   📊 Topic shift: ${topicShift.toFixed(3)} (threshold: ${topicShiftThreshold})`);

    // Step 2: Calculate gating parameter α_t (ENHANCED)
    let alpha: number | number[];
    let adaptiveBetaValue = beta;

    if (gatingStrategy === 'uniform') {
      alpha = topicShift > topicShiftThreshold ? 0.3 : 0.9;
    } else if (gatingStrategy === 'data-dependent') {
      alpha = this.calculateDataDependentGating(topicShift, topicShiftThreshold);
    } else if (gatingStrategy === 'kimi-enhanced' || enableDataDependentGating) {
      // ENHANCEMENT: Kimi-style per-dimension gating with data-dependent network
      alpha = await this.calculateKimiEnhancedGating(
        query,
        topicShift,
        embeddingDim,
        this.memoryState,
        gatingNetworkDim
      );
    } else {
      alpha = await this.calculatePerDimensionGating(
        query,
        topicShift,
        embeddingDim
      );
    }

    // ENHANCEMENT: Adaptive β_t based on topic shift and stability
    if (adaptiveBeta) {
      adaptiveBetaValue = this.calculateAdaptiveBeta(
        beta,
        topicShift,
        stabilityThreshold
      );
      console.log(`   ⚙️ Adaptive β_t: ${adaptiveBetaValue.toFixed(3)} (from ${beta.toFixed(3)})`);
    }

    console.log(`   🎚️ Gating: α_t = ${Array.isArray(alpha) ? `per-dim (${alpha.length})` : alpha.toFixed(3)}`);

    // Step 3: Enhanced Delta Rule update (if enabled)
    if (useDeltaRule && this.memoryState) {
      const updateResult = await this.enhancedDeltaRuleUpdate(
        this.memoryState,
        this.residualState,
        query,
        documents,
        alpha,
        adaptiveBetaValue,
        enableResidual,
        residualClipValue,
        embeddingDim
      );
      
      this.memoryState = updateResult.memoryState;
      this.residualState = updateResult.residualState;

      if (enableResidual && updateResult.residualMagnitude) {
        console.log(`   🔄 Enhanced Delta Rule: Updated state (residual: ${updateResult.residualMagnitude.toFixed(4)})`);
      } else {
        console.log(`   🔄 Delta Rule: Updated memory state`);
      }
    } else if (useDeltaRule) {
      // Initialize memory state
      this.memoryState = await this.initializeMemoryState(query, documents, embeddingDim);
      if (enableResidual) {
        this.residualState = new Float32Array(embeddingDim);  // Initialize residual state
      }

      console.log(`   🆕 Delta Rule: Initialized memory state${enableResidual ? ' + residual' : ''}`);
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
    
    // ENHANCEMENT: Calculate residual magnitude and gating efficiency
    const residualMagnitude = this.residualState 
      ? Math.sqrt(Array.from(this.residualState).reduce((sum, x) => sum + x * x, 0))
      : undefined;
    const gatingEfficiency = Array.isArray(alpha) 
      ? this.calculateGatingEfficiency(alpha)
      : undefined;

    // Update state for next iteration
    this.previousQuery = query;

    console.log(`   ✅ Synthesized ${synthesizedContext.length} chars (${compressionRatio.toFixed(1)}x compression)`);
    console.log(`   📊 Diversity: ${diversityScore.toFixed(3)}, Latency: ${latency}ms`);
    if (residualMagnitude !== undefined) {
      console.log(`   📐 Residual magnitude: ${residualMagnitude.toFixed(4)}`);
    }
    if (gatingEfficiency !== undefined) {
      console.log(`   ⚡ Gating efficiency: ${(gatingEfficiency * 100).toFixed(1)}%`);
    }

    return {
      context: synthesizedContext,
      documents,
      memoryState: this.memoryState || undefined,
      residualState: this.residualState || undefined,  // ENHANCEMENT
      alpha,
      beta: adaptiveBetaValue,
      topicShift,
      diversityScore,
      compressionRatio,
      latency,
      residualMagnitude,  // ENHANCEMENT
      gatingEfficiency   // ENHANCEMENT
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
   * ENHANCEMENT: Kimi-Style Enhanced Per-Dimension Gating
   * 
   * Data-dependent gating with finer-grained control per dimension.
   * Uses query embedding, state, and topic shift to compute per-dimension α_t[d].
   * 
   * Based on: Kimi Delta Attention (KDA) from arxiv.org/abs/2510.26692
   */
  private async calculateKimiEnhancedGating(
    query: string,
    topicShift: number,
    embeddingDim: number,
    memoryState: Float32Array | null,
    gatingNetworkDim: number = 64
  ): Promise<number[]> {
    const queryEmbedding = await this.getEmbedding(query);
    const alpha = new Array(embeddingDim).fill(0.5);

    // Initialize gating network weights if needed (identity-like)
    if (!this.gatingNetworkWeights) {
      this.gatingNetworkWeights = new Float32Array(gatingNetworkDim * embeddingDim);
      // Initialize as small random values (near identity)
      for (let i = 0; i < this.gatingNetworkWeights.length; i++) {
        this.gatingNetworkWeights[i] = (Math.random() * 0.02) - 0.01;
      }
    }

    // Compute per-dimension gating: α_t[d] = σ(W_g · [query[d], state[d], topic_shift])
    for (let d = 0; d < embeddingDim; d++) {
      // Build input feature vector: [query_emb[d], state[d], topic_shift]
      const queryVal = queryEmbedding[d];
      const stateVal = memoryState ? memoryState[d] : 0;
      const topicShiftVal = topicShift;

      // Simplified gating network (linear + sigmoid)
      // In production, use full MLP: α_t[d] = σ(W_2 · ReLU(W_1 · [query[d], state[d], topic_shift]))
      const gateInput = queryVal * 0.5 + stateVal * 0.3 + topicShiftVal * 0.2;
      
      // Sigmoid activation: σ(x) = 1 / (1 + exp(-x))
      // Scale gateInput to reasonable range [-5, 5]
      const scaledInput = gateInput * 10;
      alpha[d] = 1 / (1 + Math.exp(-scaledInput));
      
      // Clamp to [0.1, 0.95] for stability
      alpha[d] = Math.max(0.1, Math.min(0.95, alpha[d]));
    }

    // Normalize to prevent extreme values
    const avgAlpha = alpha.reduce((sum, a) => sum + a, 0) / embeddingDim;
    const targetAvg = 0.7; // Target average retention
    
    if (Math.abs(avgAlpha - targetAvg) > 0.2) {
      const scale = targetAvg / avgAlpha;
      for (let d = 0; d < embeddingDim; d++) {
        alpha[d] = Math.max(0.1, Math.min(0.95, alpha[d] * scale));
      }
    }

    return alpha;
  }

  /**
   * ENHANCEMENT: Adaptive Beta (β_t) Calculation
   * 
   * Adapts update strength based on topic shift and stability requirements.
   * Higher topic shift → stronger update (forget old, remember new)
   * Lower topic shift → gentler update (maintain continuity)
   */
  private calculateAdaptiveBeta(
    baseBeta: number,
    topicShift: number,
    stabilityThreshold: number
  ): number {
    // Adaptive formula: β_t = baseBeta · (1 + topicShift · stability_factor)
    // Higher topic shift → stronger updates
    const stabilityFactor = 1.0 - stabilityThreshold;
    const adaptiveFactor = 1.0 + (topicShift * stabilityFactor);
    
    let adaptiveBeta = baseBeta * adaptiveFactor;
    
    // Clamp to reasonable range [0.1, 3.0]
    adaptiveBeta = Math.max(0.1, Math.min(3.0, adaptiveBeta));
    
    // Stability check: if topic shift is extreme, moderate the update
    if (topicShift > 0.9) {
      adaptiveBeta *= 0.8;  // Slightly reduce to prevent instability
    }
    
    return adaptiveBeta;
  }

  /**
   * ENHANCEMENT: Enhanced Delta Rule with Residual Learning (RDN)
   * 
   * Implements Residual Delta Net (RDN) with:
   * - Standard delta rule update
   * - Residual error accumulation
   * - Residual clipping for stability
   * 
   * Formula:
   * S_t = α_t · S_{t-1} - [delta update] + [new value]
   * R_t = R_{t-1} + [residual error]
   * S_final = S_t + clip(R_t, -γ, +γ)
   * 
   * Based on: Residual Linear Attention (arxiv.org/abs/2509.25223)
   */
  private async enhancedDeltaRuleUpdate(
    memoryState: Float32Array,
    residualState: Float32Array | null,
    query: string,
    documents: Document[],
    alpha: number | number[],
    beta: number,
    enableResidual: boolean,
    residualClipValue: number,
    embeddingDim: number
  ): Promise<{
    memoryState: Float32Array;
    residualState: Float32Array | null;
    residualMagnitude?: number;
  }> {
    // Step 1: Standard delta rule update
    const baseState = await this.deltaRuleUpdate(
      memoryState,
      query,
      documents,
      alpha,
      beta
    );

    let newResidualState: Float32Array | null = null;
    let residualMagnitude: number | undefined = undefined;

    if (enableResidual) {
      // Step 2: Compute residual error
      // Error = difference between target (from documents) and prediction (from state)
      const queryEmbedding = await this.getEmbedding(query);
      const docEmbeddings = await Promise.all(
        documents.map(d => this.getEmbedding(d.content))
      );
      const avgDocEmbedding = this.averageEmbeddings(docEmbeddings);

      // Prediction from current state: S_t @ k_t
      const prediction = this.dotProduct(memoryState, queryEmbedding);
      
      // Target from documents: v_t @ k_t
      const target = this.dotProduct(avgDocEmbedding, queryEmbedding);
      
      // Residual error
      const error = target - prediction;

      // Step 3: Accumulate residual: R_t = R_{t-1} + error
      if (residualState) {
        newResidualState = new Float32Array(residualState.length);
        for (let i = 0; i < residualState.length; i++) {
          // Accumulate error scaled by query embedding dimension
          newResidualState[i] = residualState[i] + (error * queryEmbedding[i] * 0.1);
        }
      } else {
        // Initialize residual state
        newResidualState = new Float32Array(embeddingDim);
        for (let i = 0; i < embeddingDim; i++) {
          newResidualState[i] = error * queryEmbedding[i] * 0.1;
        }
      }

      // Step 4: Clip residual for stability: clip(R_t, -γ, +γ)
      for (let i = 0; i < newResidualState.length; i++) {
        newResidualState[i] = Math.max(
          -residualClipValue,
          Math.min(residualClipValue, newResidualState[i])
        );
      }

      // Step 5: Apply residual correction to final state
      const finalState = new Float32Array(baseState.length);
      for (let i = 0; i < baseState.length; i++) {
        finalState[i] = baseState[i] + newResidualState[i];
      }

      // Calculate residual magnitude for monitoring
      residualMagnitude = Math.sqrt(
        Array.from(newResidualState).reduce((sum, x) => sum + x * x, 0)
      );

      return {
        memoryState: finalState,
        residualState: newResidualState,
        residualMagnitude
      };
    }

    return {
      memoryState: baseState,
      residualState: null
    };
  }

  /**
   * ENHANCEMENT: Calculate Gating Efficiency
   * 
   * Measures how efficiently the gating mechanism uses memory.
   * Higher efficiency = more dimensions actively retained/forgotten (not stuck in middle)
   */
  private calculateGatingEfficiency(alpha: number[]): number {
    if (alpha.length === 0) return 0;

    // Count dimensions that are clearly retained (>0.7) or forgotten (<0.3)
    // vs. ambiguous (0.3-0.7)
    let decisiveDimensions = 0;
    
    for (const a of alpha) {
      if (a < 0.3 || a > 0.7) {
        decisiveDimensions++;
      }
    }

    return decisiveDimensions / alpha.length;
  }

  /**
   * Reset memory state
   */
  reset(): void {
    this.memoryState = null;
    this.residualState = null;  // ENHANCEMENT: Reset residual state
    this.previousQuery = null;
    this.previousEmbedding = null;
    this.gatingNetworkWeights = null;  // ENHANCEMENT: Reset gating network
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
