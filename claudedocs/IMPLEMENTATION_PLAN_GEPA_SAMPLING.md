# Implementation Plan: Full GEPA RAG + Inference Sampling

**Date:** 2025-10-30
**Timeline:** 4 weeks (aggressive but achievable)
**Priority:** 🔴 CRITICAL - Core research infrastructure
**Outcome:** Production-ready RAG pipeline with inference-time sampling

---

## Executive Summary

This plan implements **both** missing pieces in parallel:

1. **Full GEPA RAG Pipeline** (5 stages) - Fills 65% implementation gap
2. **Inference Sampling Integration** - Drop-in enhancement for diversity/quality

These components are **synergistic**: inference sampling improves each RAG stage's output quality and diversity.

---

## Week 1: Foundation Layer (Days 1-7)

### Day 1-2: Inference Sampling Core Module

**Goal:** Working `mcmcSampling()` function usable across system

**File:** `frontend/lib/inference-sampling.ts`

**Implementation:**
```typescript
/**
 * MCMC-Inspired Inference Sampling
 * Provides diverse, high-quality samples from base models
 */

export interface SamplingConfig {
  model: string;           // 'gpt-4o-mini', 'ollama/llama3.1:8b', etc.
  prompt: string;
  numSamples: number;      // Generate k samples
  beta: number;            // Sharpening (1.0-2.0)
  temperature?: number;
  topK?: number;           // Return best k
}

export async function mcmcSampling(config: SamplingConfig): Promise<string[]> {
  // 1. Generate numSamples candidates
  // 2. Calculate log likelihoods
  // 3. Sharpen distribution (beta)
  // 4. Metropolis-Hastings acceptance
  // 5. Select top-k by diversity + quality
}
```

**Tasks:**
- [ ] Core sampling logic (4 hours)
- [ ] Model integrations (OpenAI, Anthropic, Ollama) (3 hours)
- [ ] Log likelihood calculation (2 hours)
- [ ] Diversity-aware selection (2 hours)
- [ ] Unit tests (2 hours)
- [ ] Quick benchmark vs baseline (1 hour)

**Success Criteria:**
- ✅ 5-10 diverse samples generated in < 2s
- ✅ Diversity score > 0.6 (vs < 0.3 baseline)
- ✅ All model providers working

---

### Day 3-4: Vector Store Interface + Supabase Integration

**Goal:** Real vector operations (not mocks)

**File:** `frontend/lib/vector-store-adapter.ts`

**Implementation:**
```typescript
/**
 * Vector Store Abstraction
 * Supports multiple backends: Supabase, Qdrant, Weaviate
 */

export interface VectorStoreAdapter {
  similaritySearch(query: string, k: number, filters?: any): Promise<Document[]>;
  vectorSearch(embedding: number[], k: number, filters?: any): Promise<Document[]>;
  hybridSearch(query: string, k: number, alpha: number): Promise<Document[]>;
  getCollectionInfo(): Promise<CollectionInfo>;
}

export class SupabaseVectorAdapter implements VectorStoreAdapter {
  async similaritySearch(query: string, k: number = 5): Promise<Document[]> {
    // 1. Get embedding (OpenAI text-embedding-3-small)
    const embedding = await this.getEmbedding(query);

    // 2. Query Supabase pgvector
    const { data } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: k
    });

    return data;
  }

  async hybridSearch(query: string, k: number, alpha: number): Promise<Document[]> {
    // 1. Semantic search (alpha weight)
    const semantic = await this.similaritySearch(query, k * 2);

    // 2. Keyword search ((1-alpha) weight)
    const { data: keyword } = await supabase
      .from('documents')
      .select()
      .textSearch('content', query)
      .limit(k * 2);

    // 3. Fusion (RRF - Reciprocal Rank Fusion)
    return fusionRanking(semantic, keyword, alpha, k);
  }
}
```

**Tasks:**
- [ ] VectorStoreAdapter interface (1 hour)
- [ ] SupabaseVectorAdapter implementation (3 hours)
- [ ] Embedding generation (OpenAI API) (2 hours)
- [ ] Hybrid search (RRF fusion) (3 hours)
- [ ] Supabase migration for `match_documents` function (1 hour)
- [ ] Integration tests (2 hours)

**Success Criteria:**
- ✅ Real vector search working (not mocks)
- ✅ Hybrid search improves recall by 10-15%
- ✅ < 200ms latency for top-20 retrieval

**Supabase Migration:**
```sql
-- supabase/migrations/015_vector_search.sql

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM documents d
  WHERE (filter = '{}' OR d.metadata @> filter)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

### Day 5: Query Reformulation Stage (RAG Stage 1)

**Goal:** GEPA-optimized query enhancement

**File:** `frontend/lib/rag/query-reformulator.ts`

**Implementation:**
```typescript
/**
 * Query Reformulation with Inference Sampling
 * RAG Stage 1: Enhance user query for better retrieval
 */

export class QueryReformulator {
  private seedPrompts = {
    clarification: "Enhance this query with specific details and context.",
    expansion: "Generate alternative phrasings that cover different aspects.",
    decomposition: "Break this complex query into sub-questions."
  };

  async reformulate(query: string, domain: string): Promise<ReformulationResult> {
    // Use inference sampling for diverse reformulations
    const reformulations = await mcmcSampling({
      model: 'gpt-4o-mini',
      prompt: `${this.seedPrompts.expansion}

Original query: "${query}"
Domain: ${domain}

Generate 5 alternative phrasings that would improve retrieval.`,
      numSamples: 10,
      beta: 1.5,
      topK: 5
    });

    // Select best reformulation
    const selected = await this.selectBestReformulation(query, reformulations);

    return {
      original: query,
      reformulated: selected,
      alternatives: reformulations,
      confidence: 0.85
    };
  }

  private async selectBestReformulation(
    original: string,
    candidates: string[]
  ): Promise<string> {
    // Score by: specificity, clarity, retrievability
    const scores = await Promise.all(
      candidates.map(c => this.scoreReformulation(original, c))
    );

    const best = candidates[scores.indexOf(Math.max(...scores))];
    return best;
  }
}
```

**Tasks:**
- [ ] QueryReformulator class (2 hours)
- [ ] Integration with inference sampling (1 hour)
- [ ] Scoring logic (specificity, clarity) (2 hours)
- [ ] GEPA seed prompts (curated set) (1 hour)
- [ ] Unit tests (1 hour)

**Success Criteria:**
- ✅ Reformulated queries improve retrieval recall by 15%
- ✅ 5 diverse alternatives generated in < 1s
- ✅ GEPA prompts stored in Supabase for evolution

---

### Day 6-7: Document Retrieval + Reranking (RAG Stages 2-3)

**Goal:** Integrate vector store + GEPA reranking

**File:** `frontend/lib/rag/retrieval-pipeline.ts`

**Implementation:**
```typescript
/**
 * Retrieval + Reranking Pipeline
 * RAG Stages 2-3: Retrieve documents, rerank with GEPA
 */

export class RetrievalPipeline {
  constructor(
    private vectorStore: VectorStoreAdapter,
    private reformulator: QueryReformulator
  ) {}

  async retrieve(query: string, domain: string, topK: number = 5): Promise<Document[]> {
    // Stage 1: Query reformulation
    const { reformulated } = await this.reformulator.reformulate(query, domain);

    // Stage 2: Retrieval (with inference sampling for diverse queries)
    const diverseQueries = await mcmcSampling({
      model: 'ollama/llama3.1:8b',
      prompt: `Generate ${topK} diverse search queries for: "${reformulated}"`,
      numSamples: topK * 2,
      beta: 1.3,
      topK: topK
    });

    // Retrieve documents for each diverse query
    const allDocs = await Promise.all(
      diverseQueries.map(q => this.vectorStore.hybridSearch(q, topK, 0.7))
    );

    // Deduplicate by content similarity
    const deduplicated = this.deduplicateDocuments(allDocs.flat());

    // Stage 3: GEPA listwise reranking
    const reranked = await this.gepaRerank(query, deduplicated, topK);

    return reranked;
  }

  private async gepaRerank(
    query: string,
    candidates: Document[],
    topK: number
  ): Promise<Document[]> {
    // Use existing GEPA reranking (gepa-enhanced-retrieval.ts)
    const reranker = new GEPAEnhancedRetrieval();
    const result = await reranker.gepaListwiseRerank(
      query,
      candidates.map(d => ({
        id: d.id,
        content: d.content,
        metadata: d.metadata,
        similarity: d.similarity
      })),
      topK
    );

    return result.map(r => candidates.find(c => c.id === r.id)!);
  }
}
```

**Tasks:**
- [ ] RetrievalPipeline class (3 hours)
- [ ] Multi-query expansion with sampling (2 hours)
- [ ] Document deduplication (2 hours)
- [ ] Integration with GEPA reranking (2 hours)
- [ ] Performance optimization (parallel retrieval) (2 hours)
- [ ] Integration tests (2 hours)

**Success Criteria:**
- ✅ Recall@10 > 0.85 (vs 0.70 baseline)
- ✅ Multi-query expansion covers 67% more retrieval angles
- ✅ Latency < 2s for top-5 retrieval

---

## Week 2: RAG Pipeline Completion (Days 8-14)

### Day 8-9: Context Synthesis Stage (RAG Stage 4)

**Goal:** GEPA-optimized document combination

**File:** `frontend/lib/rag/context-synthesizer.ts`

**Implementation:**
```typescript
/**
 * Context Synthesis with Inference Sampling
 * RAG Stage 4: Combine retrieved documents optimally
 */

export class ContextSynthesizer {
  private seedPrompt = `Synthesize the following documents into coherent context.
Remove redundancy, resolve contradictions, highlight complementary information.`;

  async synthesize(
    query: string,
    documents: Document[],
    maxTokens: number = 2000
  ): Promise<SynthesisResult> {
    // Use inference sampling for diverse synthesis strategies
    const syntheses = await mcmcSampling({
      model: 'gpt-4o',
      prompt: `${this.seedPrompt}

Query: "${query}"

Documents:
${documents.map((d, i) => `[${i+1}] ${d.content}`).join('\n\n')}

Generate synthesized context (max ${maxTokens} tokens).`,
      numSamples: 5,
      beta: 1.8,  // High quality
      topK: 3
    });

    // Select best synthesis (by coverage and coherence)
    const best = await this.selectBestSynthesis(query, documents, syntheses);

    return {
      context: best,
      coverage: this.calculateCoverage(documents, best),
      coherence: this.calculateCoherence(best),
      tokensUsed: this.countTokens(best)
    };
  }

  private calculateCoverage(documents: Document[], synthesis: string): number {
    // Measure: What % of key information is preserved?
    const allKeyPhrases = this.extractKeyPhrases(documents.map(d => d.content).join(' '));
    const synthesisKeyPhrases = this.extractKeyPhrases(synthesis);

    const preserved = allKeyPhrases.filter(kp => synthesisKeyPhrases.includes(kp));
    return preserved.length / allKeyPhrases.length;
  }

  private calculateCoherence(synthesis: string): number {
    // Heuristic: sentence connectivity, logical flow
    const sentences = synthesis.split(/[.!?]+/);

    // Check for transition words, anaphora, topic continuity
    let coherenceScore = 0;
    for (let i = 1; i < sentences.length; i++) {
      if (this.hasTransition(sentences[i]) || this.hasAnaphora(sentences[i], sentences[i-1])) {
        coherenceScore++;
      }
    }

    return coherenceScore / Math.max(sentences.length - 1, 1);
  }
}
```

**Tasks:**
- [ ] ContextSynthesizer class (3 hours)
- [ ] Integration with inference sampling (1 hour)
- [ ] Coverage calculation (2 hours)
- [ ] Coherence scoring (2 hours)
- [ ] Token budget management (1 hour)
- [ ] GEPA seed prompts for synthesis (1 hour)
- [ ] Unit tests (2 hours)

**Success Criteria:**
- ✅ Coverage > 0.85 (preserves 85% of key information)
- ✅ Coherence > 0.75
- ✅ Stays within token budget (2000 tokens)

---

### Day 10-11: Answer Generation Stage (RAG Stage 5)

**Goal:** GEPA-optimized final answer generation

**File:** `frontend/lib/rag/answer-generator.ts`

**Implementation:**
```typescript
/**
 * Answer Generation with Inference Sampling
 * RAG Stage 5: Generate final answer from synthesized context
 */

export class AnswerGenerator {
  private seedPrompt = `Generate a comprehensive, accurate answer based on the provided context.
Be faithful to the context, cite sources, and acknowledge limitations.`;

  async generate(
    query: string,
    context: string,
    domain: string
  ): Promise<AnswerResult> {
    // Use inference sampling for diverse answer perspectives
    const answers = await mcmcSampling({
      model: 'gpt-4o',
      prompt: `${this.seedPrompt}

Query: "${query}"
Domain: ${domain}

Context:
${context}

Generate answer:`,
      numSamples: 5,
      beta: 2.0,  // Very high quality
      topK: 3
    });

    // Select best answer (by faithfulness, relevance, completeness)
    const best = await this.selectBestAnswer(query, context, answers);

    // Verify faithfulness
    const faithfulness = await this.verifyFaithfulness(best, context);

    return {
      answer: best,
      faithfulness: faithfulness,
      relevance: this.calculateRelevance(query, best),
      completeness: this.calculateCompleteness(query, best),
      confidence: faithfulness * 0.5 + 0.5  // Weight faithfulness heavily
    };
  }

  private async verifyFaithfulness(answer: string, context: string): Promise<number> {
    // Use inference sampling for multi-path verification
    const verifications = await mcmcSampling({
      model: 'claude-3-5-sonnet-20241022',
      prompt: `Verify if this answer is faithful to the context (no hallucinations).

Context: ${context}

Answer: ${answer}

Is the answer faithful? Rate 0.0-1.0.`,
      numSamples: 3,
      beta: 1.5,
      topK: 3
    });

    // Parse scores and average
    const scores = verifications.map(v => this.parseFaithfulnessScore(v));
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
}
```

**Tasks:**
- [ ] AnswerGenerator class (3 hours)
- [ ] Integration with inference sampling (1 hour)
- [ ] Faithfulness verification (3 hours)
- [ ] Relevance/completeness scoring (2 hours)
- [ ] GEPA seed prompts for generation (1 hour)
- [ ] Unit tests (2 hours)

**Success Criteria:**
- ✅ Faithfulness > 0.90 (no hallucinations)
- ✅ Relevance > 0.85
- ✅ Completeness > 0.80

---

### Day 12-14: Full Pipeline Integration + Evaluation

**Goal:** End-to-end RAG pipeline with all 5 stages

**File:** `frontend/lib/rag/gepa-rag-pipeline.ts`

**Implementation:**
```typescript
/**
 * Full GEPA RAG Pipeline
 * Integrates all 5 stages with inference sampling throughout
 */

export class GEPARAGPipeline {
  constructor(
    private vectorStore: VectorStoreAdapter,
    private reformulator: QueryReformulator,
    private retrieval: RetrievalPipeline,
    private synthesizer: ContextSynthesizer,
    private generator: AnswerGenerator
  ) {}

  async execute(query: string, domain: string): Promise<RAGResult> {
    console.log('🔄 GEPA RAG Pipeline: Starting');

    const startTime = Date.now();

    // Stage 1: Query Reformulation
    const { reformulated } = await this.reformulator.reformulate(query, domain);
    console.log('✅ Stage 1: Query Reformulation complete');

    // Stage 2-3: Retrieval + Reranking
    const documents = await this.retrieval.retrieve(reformulated, domain, 10);
    console.log('✅ Stage 2-3: Retrieval + Reranking complete');

    // Stage 4: Context Synthesis
    const { context } = await this.synthesizer.synthesize(query, documents, 2000);
    console.log('✅ Stage 4: Context Synthesis complete');

    // Stage 5: Answer Generation
    const { answer, faithfulness, confidence } = await this.generator.generate(
      query,
      context,
      domain
    );
    console.log('✅ Stage 5: Answer Generation complete');

    const latency = Date.now() - startTime;

    // Log to Supabase for evaluation
    await this.logExecution({
      query,
      reformulated,
      documents,
      context,
      answer,
      faithfulness,
      confidence,
      latency
    });

    return {
      query,
      reformulated,
      documents,
      context,
      answer,
      metrics: {
        faithfulness,
        confidence,
        latency,
        documentsRetrieved: documents.length
      }
    };
  }
}
```

**Tasks:**
- [ ] GEPARAGPipeline orchestration (3 hours)
- [ ] Error handling and fallbacks (2 hours)
- [ ] Logging to Supabase (2 hours)
- [ ] API endpoint `/api/rag/gepa/execute` (2 hours)
- [ ] End-to-end integration tests (4 hours)

**Success Criteria:**
- ✅ All 5 stages execute successfully
- ✅ End-to-end latency < 5s (p50)
- ✅ Quality score > 0.90 (faithfulness * confidence)

---

## Week 3: Evaluation & Optimization (Days 15-21)

### Day 15-16: Evaluation Metrics

**Goal:** Comprehensive evaluation system

**File:** `frontend/lib/rag/evaluation.ts`

**Implementation:**
```typescript
/**
 * RAG Evaluation Metrics
 * Implements precision, recall, MRR, NDCG, F1, BLEU, faithfulness
 */

export class RAGEvaluator {
  // Retrieval Metrics
  calculatePrecision(retrieved: Document[], groundTruth: string[]): number {
    const relevant = retrieved.filter(d => groundTruth.includes(d.id));
    return relevant.length / retrieved.length;
  }

  calculateRecall(retrieved: Document[], groundTruth: string[]): number {
    const relevant = retrieved.filter(d => groundTruth.includes(d.id));
    return relevant.length / groundTruth.length;
  }

  calculateMRR(retrieved: Document[], groundTruth: string[]): number {
    for (let i = 0; i < retrieved.length; i++) {
      if (groundTruth.includes(retrieved[i].id)) {
        return 1 / (i + 1);
      }
    }
    return 0;
  }

  calculateNDCG(retrieved: Document[], groundTruth: Map<string, number>): number {
    // Normalized Discounted Cumulative Gain
    let dcg = 0;
    let idcg = 0;

    for (let i = 0; i < retrieved.length; i++) {
      const relevance = groundTruth.get(retrieved[i].id) || 0;
      dcg += (Math.pow(2, relevance) - 1) / Math.log2(i + 2);
    }

    // Calculate ideal DCG
    const idealRelevances = Array.from(groundTruth.values()).sort((a, b) => b - a);
    for (let i = 0; i < Math.min(idealRelevances.length, retrieved.length); i++) {
      idcg += (Math.pow(2, idealRelevances[i]) - 1) / Math.log2(i + 2);
    }

    return idcg > 0 ? dcg / idcg : 0;
  }

  // Generation Metrics
  calculateF1(generated: string, reference: string): number {
    const genTokens = new Set(this.tokenize(generated));
    const refTokens = new Set(this.tokenize(reference));

    const intersection = new Set([...genTokens].filter(t => refTokens.has(t)));

    const precision = intersection.size / genTokens.size;
    const recall = intersection.size / refTokens.size;

    return 2 * (precision * recall) / (precision + recall + 1e-10);
  }

  calculateBLEU(generated: string, reference: string): number {
    // Simplified BLEU-1 (unigrams)
    const genTokens = this.tokenize(generated);
    const refTokens = this.tokenize(reference);

    const matches = genTokens.filter(t => refTokens.includes(t));
    return matches.length / genTokens.length;
  }

  async assessFaithfulness(answer: string, context: string): Promise<number> {
    // Use LLM to verify faithfulness
    const verification = await mcmcSampling({
      model: 'claude-3-5-sonnet-20241022',
      prompt: `Assess faithfulness (0.0-1.0):

Context: ${context}

Answer: ${answer}

Is the answer faithful to the context? Rate 0.0-1.0.`,
      numSamples: 3,
      beta: 1.5,
      topK: 3
    });

    const scores = verification.map(v => parseFloat(v.match(/[\d.]+/)?.[0] || '0.5'));
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
}
```

**Tasks:**
- [ ] Implement all retrieval metrics (3 hours)
- [ ] Implement all generation metrics (3 hours)
- [ ] Faithfulness assessment (2 hours)
- [ ] Ground truth dataset creation (50-100 examples) (4 hours)
- [ ] Evaluation dashboard (2 hours)

**Success Criteria:**
- ✅ All metrics implemented and tested
- ✅ Ground truth dataset with 50+ examples
- ✅ Evaluation dashboard showing metrics

---

### Day 17-18: Benchmarking Against Paper Results

**Goal:** Reproduce HotpotQA, Enron QA improvements

**File:** `test-gepa-rag-benchmark.ts`

**Implementation:**
```typescript
import { GEPARAGPipeline } from './frontend/lib/rag/gepa-rag-pipeline';
import { RAGEvaluator } from './frontend/lib/rag/evaluation';

async function benchmarkGEPARAG() {
  console.log('🧪 GEPA RAG Benchmark\n');

  const pipeline = new GEPARAGPipeline(/* ... */);
  const evaluator = new RAGEvaluator();

  // Load test datasets
  const hotpotQA = await loadHotpotQA(100);  // Sample 100 queries
  const enronQA = await loadEnronQA(50);     // Sample 50 queries

  // Benchmark HotpotQA (multi-hop)
  console.log('📊 HotpotQA (multi-hop reasoning):');
  let totalF1 = 0;

  for (const { query, answer, supportingDocs } of hotpotQA) {
    const result = await pipeline.execute(query, 'general');
    const f1 = evaluator.calculateF1(result.answer, answer);
    totalF1 += f1;
  }

  const avgF1 = totalF1 / hotpotQA.length;
  console.log(`   Average F1: ${(avgF1 * 100).toFixed(1)}%`);
  console.log(`   Target: 62% (from paper)`);
  console.log(`   Baseline: 42% (vanilla)`);

  // Benchmark Enron QA (hard subset)
  console.log('\n📊 Enron QA (hard subset):');
  let totalRecall = 0;

  for (const { query, relevantDocs } of enronQA) {
    const result = await pipeline.execute(query, 'email');
    const recall = evaluator.calculateRecall(result.documents, relevantDocs);
    totalRecall += recall;
  }

  const avgRecall = totalRecall / enronQA.length;
  console.log(`   Recall@1: ${(avgRecall * 100).toFixed(1)}%`);
  console.log(`   Target: 45% (from paper)`);
  console.log(`   Baseline: 32% (vanilla)`);

  // Performance metrics
  console.log('\n⚡ Performance:');
  console.log(`   Latency (p50): ${result.metrics.latency}ms`);
  console.log(`   Cost per query: $${calculateCost(result)}`);
}

benchmarkGEPARAG().catch(console.error);
```

**Tasks:**
- [ ] Load HotpotQA dataset (2 hours)
- [ ] Load Enron QA dataset (2 hours)
- [ ] Run benchmarks (4 hours)
- [ ] Compare to paper targets (1 hour)
- [ ] Document results (1 hour)

**Target Results (from paper):**
```
HotpotQA:
- Vanilla: 42% F1
- GEPA: 62% F1
- Our target: 58-62% F1

Enron QA:
- Vanilla: 32% recall@1
- GEPA: 45% recall@1
- Our target: 42-45% recall@1
```

---

### Day 19-21: Integration with PERMUTATION

**Goal:** Connect GEPA RAG to existing systems

**Integration Points:**

1. **ReasoningBank** ([reasoning-bank.ts](frontend/lib/reasoning-bank.ts))
```typescript
// Replace simple retrieval with GEPA RAG
const ragPipeline = new GEPARAGPipeline(/* ... */);
const result = await ragPipeline.execute(query, 'reasoning');
const memories = result.documents.map(d => d.metadata);
```

2. **Brain API** ([brain/route.ts](frontend/app/api/brain/route.ts))
```typescript
// Use GEPA RAG for enhanced retrieval
if (context.requiresRetrieval) {
  const ragResult = await gepaRAG.execute(query, context.domain);
  enhancedContext = ragResult.context;
}
```

3. **ACE Framework** ([ace-framework.ts](frontend/lib/ace-framework.ts))
```typescript
// Use GEPA RAG to retrieve relevant playbook bullets
const relevantBullets = await gepaRAG.retrieve(query, domain, 10);
const playbook = filterPlaybookBullets(relevantBullets);
```

4. **Team Memory** ([team-memory/search](frontend/app/api/team-memory/search))
```typescript
// Replace basic vector search with GEPA RAG
const ragResult = await gepaRAG.execute(query, 'team_memory');
return ragResult.documents;
```

**Tasks:**
- [ ] Integrate with ReasoningBank (2 hours)
- [ ] Integrate with Brain API (2 hours)
- [ ] Integrate with ACE Framework (2 hours)
- [ ] Integrate with Team Memory (2 hours)
- [ ] End-to-end integration tests (4 hours)
- [ ] Performance regression tests (2 hours)

**Success Criteria:**
- ✅ All integrations working
- ✅ No performance regressions
- ✅ Quality improvements validated

---

## Week 4: Production Deployment (Days 22-28)

### Day 22-23: API Endpoints

**Goal:** Production-ready API

**Endpoints:**

1. **`POST /api/rag/gepa/execute`** - Full pipeline
```typescript
{
  "query": "What was Q4 2024 revenue?",
  "domain": "financial",
  "topK": 5,
  "options": {
    "reformulate": true,
    "synthesize": true,
    "verify": true
  }
}

Response:
{
  "answer": "Q4 2024 revenue was $3.9M, up 23% YoY...",
  "documents": [...],
  "metrics": {
    "faithfulness": 0.94,
    "confidence": 0.89,
    "latency": 3200
  }
}
```

2. **`POST /api/rag/gepa/retrieve`** - Retrieval only
3. **`POST /api/rag/gepa/evaluate`** - Batch evaluation

**Tasks:**
- [ ] Implement API endpoints (4 hours)
- [ ] Add authentication (2 hours)
- [ ] Rate limiting (1 hour)
- [ ] Error handling (2 hours)
- [ ] API documentation (2 hours)

---

### Day 24-25: Monitoring & Observability

**Goal:** Production monitoring

**Metrics to Track:**
```typescript
interface RAGMetrics {
  // Quality
  faithfulness: number;
  relevance: number;
  completeness: number;

  // Performance
  latency: number;
  tokensUsed: number;
  cost: number;

  // Retrieval
  documentsRetrieved: number;
  recall: number;
  precision: number;

  // Inference Sampling
  diversitScore: number;
  samplesGenerated: number;
}
```

**Supabase Logging:**
```sql
-- supabase/migrations/016_rag_metrics.sql

CREATE TABLE rag_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  domain text NOT NULL,
  reformulated_query text,
  documents_retrieved int,
  answer text,
  faithfulness float,
  confidence float,
  latency int,
  cost float,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rag_executions_created_at ON rag_executions(created_at);
CREATE INDEX idx_rag_executions_domain ON rag_executions(domain);
```

**Tasks:**
- [ ] Implement metrics collection (2 hours)
- [ ] Supabase logging migration (1 hour)
- [ ] Dashboard (4 hours)
- [ ] Alerts (latency > 10s, faithfulness < 0.8) (2 hours)

---

### Day 26-27: Testing & Validation

**Goal:** Production readiness

**Test Suite:**
```bash
# Unit tests
npm run test:rag:unit

# Integration tests
npm run test:rag:integration

# Benchmarks
npm run test:rag:benchmark

# Load tests
npm run test:rag:load
```

**Tasks:**
- [ ] Write comprehensive test suite (6 hours)
- [ ] Load testing (100 concurrent queries) (2 hours)
- [ ] Fix bugs and edge cases (4 hours)

---

### Day 28: Documentation & Rollout

**Goal:** Go live

**Documentation:**
- [ ] Architecture diagram
- [ ] API documentation
- [ ] Integration guide
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

**Rollout:**
- [ ] Deploy to production
- [ ] Feature flag: 10% traffic
- [ ] Monitor for 24 hours
- [ ] Increase to 50% traffic
- [ ] Increase to 100% traffic

---

## Success Metrics (Week 4 End)

### Quality Metrics
- ✅ Faithfulness > 0.90
- ✅ Recall@10 > 0.85
- ✅ F1 score > 0.80 (generation)

### Performance Metrics
- ✅ Latency (p50) < 5s
- ✅ Cost per query < $0.015
- ✅ Diversity score > 0.60

### Paper Targets
- ✅ HotpotQA: 58-62% F1 (target: 62%)
- ✅ Enron QA: 42-45% recall@1 (target: 45%)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Latency too high | Cache reformulations, parallel execution, faster models |
| Cost exceeds budget | Use Ollama for easy queries, cache aggressively |
| Quality doesn't improve | Tune beta/k parameters, improve seed prompts |
| Integration breaks existing code | Feature flags, comprehensive tests, gradual rollout |

---

## Cost Estimate

**Development:**
- 4 weeks × 40 hours = 160 hours
- Estimated cost: $20-30K (consultant rate)

**Runtime (per 1K queries):**
```
Reformulation: $0.50 (gpt-4o-mini)
Retrieval: $0.20 (embeddings)
Reranking: $1.00 (gpt-4o-mini)
Synthesis: $2.00 (gpt-4o)
Generation: $3.00 (gpt-4o)
Verification: $1.00 (claude)
Total: $7.70 per 1K queries

With caching (40% hit rate):
Total: $4.60 per 1K queries
```

**ROI:**
- Quality improvement: +25%
- Cost per query: $0.010 → $0.0046 (with routing)
- Net savings: ~50% (from better teacher/student routing)

---

## Next Steps

**Immediate:**
1. ✅ Review and approve this plan
2. 🎯 Set up project repo/branch
3. 📋 Schedule daily standups (15 min)

**Week 1 Kickoff:**
1. Day 1 morning: Implement inference sampling core
2. Day 1 afternoon: Test with multi-query expansion
3. Day 2: Vector store integration

**Questions to Address:**
- [ ] Which vector store to prioritize? (Supabase pgvector recommended)
- [ ] Which models for each stage? (gpt-4o-mini for fast, gpt-4o for quality)
- [ ] Beta values for different stages? (1.3-1.5 for diversity, 1.8-2.0 for quality)

---

## Conclusion

This plan delivers:
1. ✅ **Full GEPA RAG Pipeline** (all 5 stages)
2. ✅ **Inference Sampling** (drop-in enhancement)
3. ✅ **Production-Ready** (API, monitoring, tests)
4. ✅ **Paper-Level Performance** (HotpotQA, Enron QA targets)

**Timeline:** 4 weeks aggressive, 6 weeks conservative

**Recommendation:** Start Week 1 immediately while momentum is high.
