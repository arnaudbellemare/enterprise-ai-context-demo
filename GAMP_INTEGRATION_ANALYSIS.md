# GAMP Framework Integration Analysis
## Graph reasoning And Multi-agent Pathfinding for Scientific Discovery

**Source**: "A Framework for Identifying New Idea Generation Paths Integrating Graph Reasoning and Multi-Agent Collaboration" - Liang Guoqiang et al.

**Context**: Our system already has multi-agent collaboration, but GAMP provides a structured framework for scientific discovery pathfinding.

**Related Documents**:
- `frontend/__tests__/lib/gamp/GAMP_APPLICATIONS.md` - Ideal domains and use cases for GAMP
- `frontend/__tests__/lib/gamp/GAMP_INTEGRATION_STATUS.md` - Current integration status

---

## Core GAMP Concepts → Our System Mapping

### 1. **Three-Layer Knowledge Graph: Problem-Solution-Effect**

**GAMP Structure**:
- **Problem Layer**: Core scientific questions/challenges
- **Solution Layer**: Methods, technologies, compounds, tools
- **Effect Layer**: Results, discoveries, biological functions

**Our Current State**:
- ✅ Document chunking with contextual enrichment
- ✅ RAG retrieval with 150 → 20 reranking
- ✅ ReasoningBank memory extraction
- ❌ **No structured Problem-Solution-Effect representation**

**Integration Opportunity**:
- Enhance contextual chunk enrichment to extract Problem-Solution-Effect triplets
- Store in structured format (could use Neo4j or enhance Supabase schema)
- Use for pathfinding in scientific discovery scenarios

---

### 2. **Multi-Agent Collaboration System**

**GAMP Agents**:
1. **Chief Scientist Agent** - Coordinator, task decomposition
2. **Domain Expert Agents** - Discipline-specific evaluation
3. **Path Exploration Agent** - Graph traversal + LLM semantic guidance
4. **Innovation Assessment Agent** - Novelty scoring
5. **Fact-Checking Agent** - Reliability verification

**Our Current State**:
- ✅ Multi-agent system (Teacher-Student-Judge)
- ✅ Permutation AI stack (multiple specialized components)
- ✅ ReasoningBank (self-judgment, memory consolidation)
- ⚠️ **Unstructured roles** - agents don't have clear GAMP-style roles

**Integration Opportunity**:
- Formalize our agents into GAMP-style roles
- Add Innovation Assessment Agent (novelty scoring)
- Enhance Fact-Checking Agent (we have reality-check layer, could formalize)

---

### 3. **Graph Reasoning + LLM Integration**

**GAMP Approach**:
- Symbolism (structured knowledge graphs) + Connectionism (LLM semantic understanding)
- Graph algorithms (BFS, genetic algorithms) + LLM-guided search
- Path exploration on knowledge graph with semantic understanding

**Our Current State**:
- ✅ RAG with hybrid search (BM25 + vector embeddings)
- ✅ 150 → 20 reranking (pathfinding through candidate space)
- ✅ Contextual chunk enrichment (semantic understanding)
- ❌ **No explicit graph structure** for pathfinding

**Integration Opportunity**:
- Build knowledge graph from enriched chunks
- Add graph-based path exploration to RAG pipeline
- Combine with LLM semantic guidance for non-obvious connections

---

### 4. **Novelty Assessment Formula**

**GAMP Formula**:
```
Novelty(P) = 1 / (1 + log(freq(P)))
```
Where `freq(P)` is the frequency of path or sub-paths in historical literature.

**Our Current State**:
- ✅ ReasoningBank success rate tracking
- ✅ Memory usage tracking
- ❌ **No explicit novelty scoring**

**Integration Opportunity**:
- Add novelty scoring to memory items
- Track path frequency in ReasoningBank
- Use for ranking innovative vs. conventional strategies

---

### 5. **Structured Collaboration Protocol**

**GAMP Workflow**:
1. Chief Scientist receives query → decomposes into sub-tasks
2. Path Exploration Agent finds paths on graph
3. Domain Expert Agents evaluate scientific rationality
4. Innovation Assessment Agent scores novelty
5. Fact-Checking Agent verifies against knowledge base
6. Chief Scientist synthesizes and ranks paths

**Our Current State**:
- ✅ Teacher-Student-Judge collaboration
- ✅ Permutation pipeline (reformulation → retrieval → reranking → synthesis → generation)
- ⚠️ **Less structured roles** - could benefit from GAMP-style protocol

**Integration Opportunity**:
- Formalize our pipeline into GAMP-style roles
- Add explicit innovation assessment step
- Enhance fact-checking with graph verification

---

## Concrete Implementation Proposals

### 1. **Problem-Solution-Effect Extraction Layer**

**File**: `frontend/lib/rag/problem-solution-effect-extractor.ts`

```typescript
export interface ProblemSolutionEffect {
  problem: string;
  solution: string;
  effect: string;
  confidence: number;
  source: string; // chunk/document ID
}

export class ProblemSolutionEffectExtractor {
  async extractFromChunk(chunk: string): Promise<ProblemSolutionEffect> {
    // Use LLM to extract Problem-Solution-Effect triplets
    // Similar to contextual enrichment but with structured output
  }
  
  async buildKnowledgeGraph(extractions: ProblemSolutionEffect[]): Promise<KnowledgeGraph> {
    // Build three-layer graph structure
    // Store in Neo4j or enhance Supabase schema
  }
}
```

**Integration Point**: Add to contextual chunk enrichment pipeline

---

### 2. **GAMP-Style Multi-Agent System**

**File**: `frontend/lib/gamp/gamp-agent-system.ts`

```typescript
export class GAMPMultiAgentSystem {
  private chiefScientist: ChiefScientistAgent;
  private domainExperts: DomainExpertAgent[];
  private pathExplorer: PathExplorationAgent;
  private innovationAssessor: InnovationAssessmentAgent;
  private factChecker: FactCheckingAgent;
  
  async discoverPaths(query: string, knowledgeGraph: KnowledgeGraph): Promise<Path[]> {
    // 1. Chief Scientist decomposes query
    const subtasks = await this.chiefScientist.decompose(query);
    
    // 2. Path Explorer finds paths
    const candidatePaths = await this.pathExplorer.explore(knowledgeGraph, subtasks);
    
    // 3. Domain Experts evaluate
    const evaluatedPaths = await Promise.all(
      candidatePaths.map(path => 
        this.domainExperts.evaluate(path)
      )
    );
    
    // 4. Innovation Assessor scores novelty
    const scoredPaths = await Promise.all(
      evaluatedPaths.map(path =>
        this.innovationAssessor.assess(path)
      )
    );
    
    // 5. Fact Checker verifies
    const verifiedPaths = await this.factChecker.verify(scoredPaths, knowledgeGraph);
    
    // 6. Chief Scientist ranks and returns
    return this.chiefScientist.rank(verifiedPaths);
  }
}
```

**Integration Point**: New scientific discovery pipeline, parallel to existing RAG

---

### 3. **Novelty Scoring System**

**File**: `frontend/lib/gamp/novelty-scorer.ts`

```typescript
export class NoveltyScorer {
  private pathFrequencyCache: Map<string, number> = new Map();
  
  /**
   * Calculate novelty score for a path
   * Formula: Novelty(P) = 1 / (1 + log(freq(P)))
   */
  calculateNovelty(path: Path, historicalPaths: Path[]): number {
    const frequency = this.calculateFrequency(path, historicalPaths);
    return 1 / (1 + Math.log(frequency + 1));
  }
  
  private calculateFrequency(path: Path, historicalPaths: Path[]): number {
    // Count how many times path or sub-paths appear in history
    const pathKey = this.pathToKey(path);
    
    if (this.pathFrequencyCache.has(pathKey)) {
      return this.pathFrequencyCache.get(pathKey)!;
    }
    
    let count = 0;
    for (const historicalPath of historicalPaths) {
      if (this.isSubPath(path, historicalPath)) {
        count++;
      }
    }
    
    this.pathFrequencyCache.set(pathKey, count);
    return count;
  }
}
```

**Integration Point**: Add to ReasoningBank memory evaluation, Innovation Assessment Agent

---

### 4. **Graph-Based Path Exploration**

**File**: `frontend/lib/gamp/graph-path-explorer.ts`

```typescript
export class GraphPathExplorer {
  /**
   * Explore paths using graph algorithms + LLM semantic guidance
   */
  async explorePaths(
    knowledgeGraph: KnowledgeGraph,
    query: string,
    maxDepth: number = 3
  ): Promise<Path[]> {
    // 1. BFS for direct associations
    const bfsPaths = this.breadthFirstSearch(knowledgeGraph, query, maxDepth);
    
    // 2. LLM-guided semantic exploration
    const semanticPaths = await this.llmGuidedSearch(knowledgeGraph, query);
    
    // 3. Combine and deduplicate
    return this.combinePaths(bfsPaths, semanticPaths);
  }
  
  private async llmGuidedSearch(
    graph: KnowledgeGraph,
    query: string
  ): Promise<Path[]> {
    // LLM predicts: "What might be functionally complementary to X?"
    // Then search graph for predicted entities
    const predictions = await this.llm.predictRelatedEntities(query);
    return this.searchGraphForEntities(graph, predictions);
  }
}
```

**Integration Point**: Enhance RAG retrieval with graph-based pathfinding

---

### 5. **Innovation Assessment Agent**

**File**: `frontend/lib/gamp/innovation-assessment-agent.ts`

```typescript
export class InnovationAssessmentAgent {
  private noveltyScorer: NoveltyScorer;
  
  async assessPath(path: Path, knowledgeGraph: KnowledgeGraph): Promise<AssessmentResult> {
    // 1. Calculate novelty
    const novelty = this.noveltyScorer.calculateNovelty(path, knowledgeGraph.historicalPaths);
    
    // 2. Calculate topological novelty (graph structure)
    const topologicalNovelty = this.calculateTopologicalNovelty(path, knowledgeGraph);
    
    // 3. LLM semantic assessment
    const semanticNovelty = await this.llm.assessNovelty(path);
    
    // 4. Combine scores
    const overallScore = (novelty * 0.4 + topologicalNovelty * 0.3 + semanticNovelty * 0.3);
    
    return {
      novelty: overallScore,
      breakdown: { novelty, topologicalNovelty, semanticNovelty },
      potentialImpact: await this.assessImpact(path)
    };
  }
}
```

**Integration Point**: New agent in multi-agent system

---

## Integration Strategy

### Phase 1: Foundation (Week 1-2)
1. ✅ Implement Problem-Solution-Effect extractor
2. ✅ Add to contextual chunk enrichment pipeline
3. ✅ Build basic knowledge graph structure

### Phase 2: Graph Reasoning (Week 3-4)
1. ✅ Implement graph path explorer
2. ✅ Integrate with RAG retrieval
3. ✅ Add LLM-guided semantic search

### Phase 3: Multi-Agent Roles (Week 5-6)
1. ✅ Formalize GAMP-style agent roles
2. ✅ Implement Innovation Assessment Agent
3. ✅ Enhance Fact-Checking Agent

### Phase 4: Novelty Scoring (Week 7-8)
1. ✅ Implement novelty scoring formula
2. ✅ Integrate with ReasoningBank
3. ✅ Add to memory evaluation

---

## Alignment with Existing Systems

### ✅ **Strong Alignment**
- Multi-agent architecture (Teacher-Student-Judge)
- RAG pipeline (150 → 20 reranking is pathfinding)
- ReasoningBank (memory extraction and evaluation)
- Contextual enrichment (semantic understanding)

### ⚠️ **Partial Alignment**
- Document chunking (needs Problem-Solution-Effect structure)
- Memory evaluation (needs novelty scoring)
- Agent roles (needs formalization)

### ❌ **Missing**
- Explicit graph structure for pathfinding
- Innovation assessment agent
- Novelty scoring formula
- Problem-Solution-Effect knowledge representation

---

## Key Insights from GAMP

1. **Structured Knowledge > Unstructured Text**: Problem-Solution-Effect provides clearer reasoning paths
2. **Graph + LLM > Either Alone**: Combine symbolism (graph structure) with connectionism (semantic understanding)
3. **Role-Based Agents > Generic Agents**: Clear roles improve collaboration efficiency
4. **Novelty Scoring > Success Scoring**: Innovation requires different metrics than task success
5. **Fact-Checking > Generation**: Reliability requires explicit verification against knowledge base

---

## Next Steps

1. **Immediate**: Add Problem-Solution-Effect extraction to contextual enrichment
2. **Short-term**: Implement novelty scoring for ReasoningBank memories
3. **Medium-term**: Build graph-based path explorer
4. **Long-term**: Full GAMP-style multi-agent system for scientific discovery

---

## Conclusion

GAMP provides a **structured framework** that complements our existing multi-agent system. The key additions are:

1. **Structured knowledge representation** (Problem-Solution-Effect)
2. **Explicit graph reasoning** (pathfinding on knowledge graph)
3. **Novelty assessment** (beyond just success/failure)
4. **Formal agent roles** (clear division of labor)

Our system already has the foundation (multi-agent, RAG, memory) - we just need to add the **structure** and **graph reasoning** components from GAMP.

