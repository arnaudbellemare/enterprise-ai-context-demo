# GEPA RAG Implementation Gap Analysis

**Date:** 2025-10-30
**Status:** ⚠️ Partial Implementation (~35% Complete)
**Priority:** 🔴 HIGH - Core research component incomplete

---

## Executive Summary

The current GEPA implementation has foundational components (reranking, basic algorithms) but **lacks 65% of the official GEPA RAG specification**. Key missing pieces:
- Query reformulation, context synthesis, answer generation stages
- Vector store abstraction layer
- Actual GEPA prompt optimization (currently simulated)
- Comprehensive evaluation metrics
- Multi-vector-store support

---

## 1. Pipeline Coverage

### Official GEPA RAG Pipeline (5 Stages)
```
Query Reformulation → Document Retrieval → Document Reranking →
Context Synthesis → Answer Generation
```

### Current Implementation
```
[MISSING] → Document Retrieval (mock) → Document Reranking (partial) →
[MISSING] → [MISSING]
```

**Coverage:** 2/5 stages (40%)

---

## 2. Component-by-Component Analysis

### ✅ **Implemented:**

#### A. Listwise Reranking ([gepa-enhanced-retrieval.ts:129-155](frontend/lib/gepa-enhanced-retrieval.ts#L129-L155))
```typescript
async gepaListwiseRerank(
  query: string,
  candidates: RetrievalCandidate[],
  topK: number = 5
): Promise<RetrievalCandidate[]>
```
- ✅ Takes full candidate list (not pairwise)
- ✅ GEPA-inspired scoring heuristics
- ⚠️ **Issue:** Not actually optimized through GEPA iterations

#### B. Genetic Algorithm ([gepa-algorithms.ts:49-596](frontend/lib/gepa-algorithms.ts#L49-L596))
```typescript
class GEPAAlgorithms {
  async optimizePrompts(domain: string, basePrompts: string[], objectives: string[])
}
```
- ✅ Population evolution (mutation, crossover)
- ✅ Pareto front creation
- ✅ Multi-objective fitness
- ⚠️ **Issue:** Not connected to RAG pipeline

#### C. Multi-Hop Retrieval ([gepa-enhanced-retrieval.ts:467-542](frontend/lib/gepa-enhanced-retrieval.ts#L467-L542))
```typescript
class MultiHopGEPARetrieval {
  async multiHopSearch(query: string, maxHops: number = 3)
}
```
- ✅ Iterative retrieval steps
- ⚠️ **Issue:** Query generation not GEPA-optimized

---

### ❌ **Missing (Critical Gaps):**

#### A. Query Reformulation Stage
**Spec Requirement:**
```python
class QueryReformulator:
    def reformulate(self, query: str) -> str:
        # GEPA-optimized prompt to enhance user query
        # Examples:
        # "Q4 revenue?" → "What was Q4 2024 revenue with YoY growth?"
        pass
```

**Current:** Not implemented
**Impact:** 🔴 HIGH - Initial query quality affects entire pipeline
**Estimated Improvement:** +15-20% retrieval quality (from GEPA paper)

---

#### B. Context Synthesis Stage
**Spec Requirement:**
```python
class ContextSynthesizer:
    def synthesize(self, query: str, documents: List[Document]) -> str:
        # GEPA-optimized prompt to combine retrieved docs
        # Handles redundancy, contradiction, complementarity
        pass
```

**Current:** Not implemented
**Impact:** 🔴 HIGH - Retrieved docs not optimally combined
**Estimated Improvement:** +10-15% answer quality

---

#### C. Answer Generation Stage
**Spec Requirement:**
```python
class AnswerGenerator:
    def generate(self, query: str, context: str) -> str:
        # GEPA-optimized prompt for final answer
        # Faithful to context, concise, well-structured
        pass
```

**Current:** Not implemented
**Impact:** 🔴 HIGH - No GEPA-optimized final generation
**Estimated Improvement:** +20-30% generation quality

---

#### D. Vector Store Interface
**Spec Requirement:**
```python
class VectorStoreInterface:
    def similarity_search(query: str, k: int = 5, filters=None) -> List[Document]
    def vector_search(query_vector: List[float], k: int = 5, filters=None) -> List[Document]
    def hybrid_search(query: str, k: int = 5, alpha: float = 0.5) -> List[Document]
    def get_collection_info() -> Dict[str, Any]
```

**Current:** Hardcoded mocks ([gepa-enhanced-retrieval.ts:71-126](frontend/lib/gepa-enhanced-retrieval.ts#L71-L126))
**Impact:** 🟡 MEDIUM - Can't use real vector stores
**Blockers:**
- No Supabase pgvector integration
- No Qdrant/Weaviate/ChromaDB support
- No hybrid search (keyword + semantic)

---

#### E. Evaluation Metrics
**Spec Requirement:**
```python
retrieval_metrics = {
    "precision": calculate_precision(retrieved, ground_truth),
    "recall": calculate_recall(retrieved, ground_truth),
    "mrr": calculate_mrr(retrieved, ground_truth),
    "ndcg": calculate_ndcg(retrieved, ground_truth)
}

generation_metrics = {
    "f1": calculate_f1(generated, reference),
    "bleu": calculate_bleu(generated, reference),
    "faithfulness": assess_faithfulness(generated, context),
    "relevance": assess_relevance(generated, query)
}

combined_score = (
    retrieval_weight * retrieval_score +
    generation_weight * generation_score
)
```

**Current:** Basic recall@1 only ([gepa-enhanced-retrieval.ts:295-314](frontend/lib/gepa-enhanced-retrieval.ts#L295-L314))
**Impact:** 🔴 HIGH - Can't properly evaluate GEPA improvements
**Missing Metrics:**
- Precision, MRR, NDCG for retrieval
- F1, BLEU, faithfulness for generation
- No ground truth comparison

---

#### F. GEPA Integration Loop
**Spec Requirement:**
```python
# Full GEPA optimization cycle
optimizer = GEPAOptimizer(
    seed_candidate="Rerank documents by relevance",
    trainset=train_examples,  # (query, context, answer) tuples
    valset=val_examples,
    max_metric_calls=50,
    reflection_llm_model="gpt-4o"
)

# GEPA evolves the prompt through reflection
optimized_prompt = optimizer.optimize(
    component="reranking",  # or "reformulation", "synthesis", "generation"
    objective="maximize_f1_and_minimize_cost"
)
```

**Current:** Manual prompt engineering ([gepa-enhanced-retrieval.ts:319-338](frontend/lib/gepa-enhanced-retrieval.ts#L319-L338))
**Impact:** 🔴 CRITICAL - Not actually using GEPA optimization
**Gap:**
- No reflection-based prompt evolution
- No trainset/valset evaluation
- No automatic improvement cycles
- Reranking heuristics are hardcoded, not learned

---

## 3. Configuration System

### Spec Requirements
```python
config = {
    "retrieval_strategy": "hybrid",  # similarity | vector | hybrid
    "top_k": 20,
    "hybrid_alpha": 0.7,  # 0=keyword, 1=semantic
    "filters": {"domain": "financial", "year": 2024},
    "retrieval_weight": 0.3,
    "generation_weight": 0.7,
    "llm_model": "gpt-4o",
    "reflection_model": "claude-3-5-sonnet-20241022"
}
```

### Current Implementation
```typescript
// Hardcoded in gepa-enhanced-retrieval.ts:61-64
constructor(gepaIterations: number = 20) {
  this.gepaIterations = gepaIterations;
  this.currentPrompt = this.getInitialRerankingPrompt();
}
```

**Missing:**
- No `retrieval_strategy` configuration
- No `hybrid_alpha` tuning
- No `filters` support
- No weight configuration for retrieval vs generation
- No model selection per component

---

## 4. Vector Store Support

### Spec Requirements (5 stores)

| Store | Status | Gap |
|-------|--------|-----|
| **ChromaDB** | ❌ Not implemented | Need HTTP client + collection management |
| **Weaviate** | ❌ Not implemented | Need GraphQL client + hybrid search |
| **Qdrant** | ⚠️ Available (Supabase) | Need proper interface abstraction |
| **Milvus** | ❌ Not implemented | Need gRPC client |
| **LanceDB** | ❌ Not implemented | Need serverless adapter |

**Current:**
- Mock data hardcoded in `initialRetrieval()` ([gepa-enhanced-retrieval.ts:80-124](frontend/lib/gepa-enhanced-retrieval.ts#L80-L124))
- No real embeddings
- No similarity calculations
- No filtering support

**Required Interface:**
```typescript
interface VectorStoreAdapter {
  similaritySearch(query: string, k: number, filters?: Record<string, any>): Promise<Document[]>;
  vectorSearch(embedding: number[], k: number, filters?: Record<string, any>): Promise<Document[]>;
  hybridSearch(query: string, k: number, alpha: number): Promise<Document[]>;
  getCollectionInfo(): Promise<{ count: number; dimension: number; metadata: Record<string, any> }>;
}
```

---

## 5. Performance Gaps

### Expected (from GEPA paper)
```
HotpotQA (multi-hop):
- Vanilla: 42% F1
- GEPA: 62% F1
- Gain: +20% absolute

Enron QA (hard):
- Vanilla: 32% recall@1
- GEPA listwise: 45% recall@1
- Gain: +40% relative

HoVer (fact verification):
- Baseline: X%
- GEPA: +17% improvement

Efficiency:
- 35x fewer rollouts than RL
- 6,400 vs 220,000+ rollouts
```

### Current (based on code)
```
HotpotQA: Not benchmarked
Enron QA: Not benchmarked
HoVer: Not benchmarked

Efficiency:
- No actual GEPA optimization running
- Simulated reranking with hardcoded heuristics
- Unknown rollout count (not implemented)
```

**Gap:** Cannot validate GEPA improvements without proper benchmarking

---

## 6. Integration Points

### Current System Usage
```typescript
// Used by:
// 1. ReasoningBank search (gepa-enhanced-retrieval.ts:356-386)
// 2. Team Memory search (gepa-enhanced-retrieval.ts:391-422)
// 3. Articulations search (gepa-enhanced-retrieval.ts:427-458)

const search = new GEPAEnhancedMemorySearch();
const results = await search.searchReasoningBank(query, 5);
```

**Issues:**
- No actual GEPA optimization
- No ground truth for evaluation
- No feedback loop for improvement
- Simulated reranking, not learned

---

## 7. Recommended Implementation Plan

### Phase 1: Foundation (Week 1-2)
**Priority:** 🔴 CRITICAL

1. **Vector Store Interface** (3 days)
   - [ ] Create `VectorStoreAdapter` interface
   - [ ] Implement Supabase pgvector adapter
   - [ ] Add similarity/vector/hybrid search methods
   - [ ] Integrate with existing Supabase tables

2. **Evaluation Metrics** (2 days)
   - [ ] Implement precision, recall, MRR, NDCG
   - [ ] Implement F1, BLEU, faithfulness
   - [ ] Create ground truth dataset (50-100 examples)
   - [ ] Add metric tracking to Supabase

3. **Query Reformulation Stage** (2 days)
   - [ ] Create `QueryReformulator` class
   - [ ] Define seed prompts
   - [ ] Integrate with pipeline

### Phase 2: GEPA Integration (Week 3-4)
**Priority:** 🔴 HIGH

4. **GEPA Optimization Loop** (5 days)
   - [ ] Connect `GEPAAlgorithms` to RAG pipeline
   - [ ] Implement reflection-based evolution
   - [ ] Add trainset/valset evaluation
   - [ ] Store optimized prompts in Supabase

5. **Context Synthesis Stage** (2 days)
   - [ ] Create `ContextSynthesizer` class
   - [ ] Implement redundancy/contradiction handling
   - [ ] GEPA-optimize synthesis prompts

6. **Answer Generation Stage** (2 days)
   - [ ] Create `AnswerGenerator` class
   - [ ] Implement faithfulness checks
   - [ ] GEPA-optimize generation prompts

### Phase 3: Multi-Store Support (Week 5-6)
**Priority:** 🟡 MEDIUM

7. **Additional Vector Stores** (4 days each)
   - [ ] ChromaDB adapter (local testing)
   - [ ] Weaviate adapter (production)
   - [ ] Qdrant adapter (high-performance)

8. **Hybrid Search** (3 days)
   - [ ] Implement keyword + semantic fusion
   - [ ] Add `hybrid_alpha` parameter tuning
   - [ ] Benchmark hybrid vs pure semantic

### Phase 4: Benchmarking (Week 7-8)
**Priority:** 🟡 MEDIUM

9. **Reproduce Paper Results** (5 days)
   - [ ] Create HotpotQA test set
   - [ ] Create Enron QA test set
   - [ ] Run vanilla baseline
   - [ ] Run GEPA-optimized system
   - [ ] Compare to paper's 42%→62% F1 gain

10. **Integration Tests** (3 days)
    - [ ] End-to-end RAG pipeline test
    - [ ] GEPA optimization convergence test
    - [ ] Multi-hop query test
    - [ ] Performance regression tests

---

## 8. Quick Wins (Can Implement Today)

### 1. Real Vector Store (2 hours)
```typescript
// frontend/lib/vector-store-adapter.ts
import { supabase } from './supabase';

export class SupabaseVectorAdapter implements VectorStoreAdapter {
  async similaritySearch(query: string, k: number = 5): Promise<Document[]> {
    const embedding = await this.getEmbedding(query);

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: k
    });

    if (error) throw error;
    return data;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Use existing OpenAI embeddings from PERMUTATION
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const { data } = await response.json();
    return data[0].embedding;
  }
}
```

### 2. Basic Evaluation (1 hour)
```typescript
// frontend/lib/gepa-evaluation.ts
export function calculatePrecision(retrieved: string[], groundTruth: string[]): number {
  const relevant = retrieved.filter(doc => groundTruth.includes(doc));
  return relevant.length / retrieved.length;
}

export function calculateRecall(retrieved: string[], groundTruth: string[]): number {
  const relevant = retrieved.filter(doc => groundTruth.includes(doc));
  return relevant.length / groundTruth.length;
}

export function calculateMRR(retrieved: string[], groundTruth: string[]): number {
  for (let i = 0; i < retrieved.length; i++) {
    if (groundTruth.includes(retrieved[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}
```

### 3. Query Reformulation (1 hour)
```typescript
// frontend/lib/query-reformulator.ts
export class QueryReformulator {
  private seedPrompt = "Enhance this query for better retrieval. Make it more specific and include key details.";

  async reformulate(query: string): Promise<string> {
    const prompt = `${this.seedPrompt}\n\nOriginal query: "${query}"\n\nEnhanced query:`;

    const response = await fetch('/api/llm/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });

    const { text } = await response.json();
    return text.trim();
  }
}
```

---

## 9. Dependencies

### Python Dependencies (for benchmarking)
```bash
pip install gepa-ai  # Official GEPA package
pip install chromadb weaviate-client qdrant-client pymilvus lancedb
pip install datasets  # For HotpotQA, Enron QA benchmarks
```

### TypeScript Dependencies
```bash
npm install @supabase/supabase-js  # Already installed
npm install chromadb-client  # For ChromaDB
npm install weaviate-ts-client  # For Weaviate
npm install @qdrant/js-client  # For Qdrant
```

---

## 10. Success Metrics

### Immediate (Phase 1-2)
- [ ] All 5 pipeline stages implemented
- [ ] Real vector store (not mocks)
- [ ] Evaluation metrics working
- [ ] GEPA optimization loop functional

### Medium-term (Phase 3-4)
- [ ] Multi-hop F1: 42% → 62% (reproduce paper)
- [ ] Recall@1: 32% → 45% (reproduce paper)
- [ ] Support 3+ vector stores
- [ ] Automated benchmarking suite

### Long-term (Production)
- [ ] GEPA optimization reduces latency by 20%
- [ ] Answer quality score > 0.90 (current PERMUTATION target)
- [ ] Cost per query < $0.01 (current PERMUTATION target)
- [ ] Integration with all PERMUTATION memory systems (ReasoningBank, Team Memory, Articulations)

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| GEPA optimization doesn't converge | Medium | High | Use manual fallback prompts |
| Vector store migration breaks existing code | Low | High | Feature flag toggle |
| Benchmark datasets too large/slow | Medium | Medium | Sample subsets (10% of data) |
| GEPA improvements don't match paper | Medium | Medium | Adjust hyperparameters, increase iterations |
| Integration with PERMUTATION breaks | Low | Critical | Comprehensive integration tests |

---

## 12. Next Steps

**Recommended Action:**
1. ✅ **Accept this analysis** as current state assessment
2. 🎯 **Choose priority level:**
   - **Option A (Aggressive):** Full implementation (8 weeks, high effort)
   - **Option B (Pragmatic):** Core gaps only (4 weeks, medium effort)
   - **Option C (Minimal):** Quick wins + defer full GEPA (1 week, low effort)

3. 📋 **Create implementation plan** based on chosen option

**My Recommendation:** **Option B (Pragmatic)**
- Implement Phases 1-2 (foundation + GEPA integration)
- Defer multi-store support until proven valuable
- Get to 60-70% coverage with production-ready core

---

## Appendix: File References

| Component | File | Lines |
|-----------|------|-------|
| Listwise Reranking | [gepa-enhanced-retrieval.ts](frontend/lib/gepa-enhanced-retrieval.ts) | 129-155 |
| GEPA Score Logic | [gepa-enhanced-retrieval.ts](frontend/lib/gepa-enhanced-retrieval.ts) | 261-290 |
| Multi-Hop Search | [gepa-enhanced-retrieval.ts](frontend/lib/gepa-enhanced-retrieval.ts) | 467-542 |
| Genetic Algorithm | [gepa-algorithms.ts](frontend/lib/gepa-algorithms.ts) | 49-596 |
| Pareto Fronts | [gepa-algorithms.ts](frontend/lib/gepa-algorithms.ts) | 252-323 |
| Universal Prompts | [gepa-universal-prompt.ts](frontend/lib/gepa-universal-prompt.ts) | 1-100 |
