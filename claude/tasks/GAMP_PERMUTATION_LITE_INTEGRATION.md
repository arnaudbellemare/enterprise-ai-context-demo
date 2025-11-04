# GAMP Integration into Permutation-Lite

## Executive Summary

**Goal**: Integrate GAMP (Graph-based Agent Multi-agent Pathfinding) into Permutation-Lite to enhance reasoning capabilities with graph-based multi-agent collaboration.

**Current Status**:
- ✅ GAMP is production-ready (91 tests passing, no mocks)
- ✅ GAMP already integrated in Complete RAG Pipeline
- ❌ GAMP NOT in Permutation-Lite
- ✅ Permutation-Lite uses GAMP novelty scorer indirectly via ReasoningBank

**Recommendation**: Add GAMP as optional Layer 2.5 (Graph Reasoning) between Optimization and Learning

---

## Architecture Overview

### GAMP System Components

GAMP provides a multi-agent system with 5 specialized agents:

1. **Chief Scientist Agent** - Coordinates team, decomposes queries, synthesizes results
2. **Domain Expert Agents** - Evaluate scientific rationality (molecular biology, physiology, chemistry)
3. **Path Exploration Agent** - Graph traversal (BFS + LLM-guided search)
4. **Innovation Assessment Agent** - Novelty scoring using GAMP formula
5. **Fact-Checking Agent** - Reality verification against knowledge graph

**Key Capabilities**:
- Problem-Solution-Effect (P-S-E) triplet extraction
- Knowledge graph pathfinding with novelty scoring
- Multi-agent collaboration for complex reasoning
- Reality-checking to prevent hallucinations

### Permutation-Lite Current Architecture

**4-Layer Pipeline**:
1. **Routing** (Layer 1): IRT + Domain Detector
2. **Optimization** (Layer 2): GEPA prompt evolution
3. **Learning** (Layer 3): ReasoningBank + Alita-G tool synthesis
4. **Verification** (Layer 4): RVS recursive verification

**Design Philosophy**: Respects Miller's Law (7±2 items), minimal cognitive load

---

## Integration Options

### Option 1: GAMP as Separate Layer 2.5 (Recommended)

**Architecture**:
```
Layer 1: Routing (IRT + Domain)
Layer 2: Optimization (GEPA)
Layer 2.5: Graph Reasoning (GAMP) ← NEW
Layer 3: Learning (ReasoningBank + Alita-G)
Layer 4: Verification (RVS)
```

**Pros**:
- Clear separation of concerns
- GAMP runs independently, doesn't complicate other layers
- Can be enabled/disabled via config flag
- Natural fit for complex multi-step reasoning queries

**Cons**:
- Adds another layer (5 total layers if enabled)
- Slightly violates Miller's Law (7±2) if all layers enabled
- Additional latency (GAMP takes 5-15s for complex queries)

**When to Use**:
- Complex scientific/technical queries
- Queries requiring graph-based reasoning
- Multi-step problem-solving scenarios
- Queries where novelty matters (research, innovation)

---

### Option 2: GAMP within Learning Layer (Simpler)

**Architecture**:
```
Layer 1: Routing
Layer 2: Optimization
Layer 3: Learning (ReasoningBank + GAMP + Alita-G)
Layer 4: Verification
```

**Pros**:
- Maintains 4-layer architecture
- GAMP integrated with ReasoningBank (already uses GAMP novelty scorer)
- Lower cognitive complexity (4 items, well within 7±2)
- Parallel execution: ReasoningBank retrieval + GAMP discovery

**Cons**:
- Learning layer becomes more complex
- GAMP and ReasoningBank may have overlapping responsibilities
- Harder to disable GAMP independently

---

### Option 3: GAMP as Pre-Processing (Earliest)

**Architecture**:
```
Layer 0: Graph Reasoning (GAMP) ← NEW (Pre-processing)
Layer 1: Routing (IRT + Domain)
Layer 2: Optimization (GEPA)
Layer 3: Learning (ReasoningBank)
Layer 4: Verification (RVS)
```

**Pros**:
- GAMP results available to all downstream layers
- GAMP-discovered paths can influence routing decisions
- Clean separation: GAMP discovers, other layers use

**Cons**:
- Always runs (even for simple queries that don't need it)
- Significant latency overhead for all queries
- May over-engineer simple queries

---

## Recommended Approach: Option 1 (Layer 2.5)

### Implementation Plan

#### Phase 1: Config Flag & Integration Point

**File**: `frontend/lib/permutation-lite/permutation-lite-pipeline.ts`

```typescript
export interface PermutationLiteConfig {
  // Existing flags...
  enableOptimization?: boolean;
  enableLearning?: boolean;
  enableVerification?: boolean;
  enableTeacherStudent?: boolean;
  enableToolSynthesis?: boolean;

  // NEW: GAMP integration
  enableGAMP?: boolean; // Layer 2.5: Graph-based multi-agent reasoning
  gampConfig?: {
    maxPaths?: number; // Default: 20
    maxDepth?: number; // Default: 3
    useLLMGuided?: boolean; // Default: true
    useGraphPathfinding?: boolean; // Default: true
    domainExperts?: string[]; // Custom domain experts
    minNoveltyScore?: number; // Minimum novelty threshold
  };

  // Routing thresholds
  difficultyThreshold?: number;
  maxVerificationIterations?: number;
}
```

#### Phase 2: GAMP Execution Layer

**New Method in PermutationLitePipeline**:

```typescript
private async executeGraphReasoning(
  query: string,
  domain: string,
  knowledgeGraph: KnowledgeGraph,
  sourceDocuments: any[]
): Promise<GraphReasoningResult> {
  console.log('\n🔬 LAYER 2.5: GRAPH REASONING (GAMP)');
  const startTime = Date.now();

  // Execute GAMP multi-agent discovery
  const gampPaths = await gampAgentSystem.discoverPaths(
    query,
    knowledgeGraph,
    sourceDocuments,
    domain
  );

  const duration = Date.now() - startTime;

  // Extract best paths (top 5 by overall score)
  const bestPaths = gampPaths.slice(0, 5);

  console.log(`   ✓ Discovered ${gampPaths.length} paths`);
  console.log(`   ✓ Top path novelty: ${bestPaths[0]?.novelty.toFixed(2)}`);
  console.log(`   ✓ Top path rationality: ${bestPaths[0]?.scientificRationality.toFixed(2)}`);
  console.log(`   ⏱️  Duration: ${duration}ms`);

  return {
    paths: bestPaths,
    totalPaths: gampPaths.length,
    avgNovelty: gampPaths.reduce((sum, p) => sum + p.novelty, 0) / gampPaths.length,
    avgRationality: gampPaths.reduce((sum, p) => sum + p.scientificRationality, 0) / gampPaths.length,
    avgFactuality: gampPaths.reduce((sum, p) => sum + p.factuality, 0) / gampPaths.length,
  };
}
```

#### Phase 3: Knowledge Graph Construction

**Challenge**: GAMP requires a knowledge graph, which Permutation-Lite doesn't currently build.

**Solution**: Use existing documents from Learning layer to build lightweight graph

```typescript
private async buildLightweightKnowledgeGraph(
  query: string,
  domain: string,
  memories: any[]
): Promise<KnowledgeGraph> {
  // Extract P-S-E triplets from memories
  const triplets: ProblemSolutionEffect[] = [];

  for (const memory of memories) {
    const pse = await problemSolutionEffectExtractor.extract(
      memory.content || '',
      domain
    );
    if (pse) {
      triplets.push(pse);
    }
  }

  // Build graph from triplets
  const graph = await knowledgeGraphBuilder.buildFromTriplets(triplets, {
    maxNodes: 50, // Lightweight: 50 nodes max
    maxEdges: 100, // Lightweight: 100 edges max
  });

  return graph;
}
```

#### Phase 4: Parallel Execution Pattern

**Modified execute() method**:

```typescript
// LAYER 2, 2.5, 3: PARALLEL OPTIMIZATION + GRAPH REASONING + LEARNING
let optimizationResult: OptimizationResult | undefined;
let graphReasoningResult: GraphReasoningResult | undefined;
let learningResult: LearningResult | undefined;

if (this.config.enableOptimization || this.config.enableGAMP || this.config.enableLearning) {
  console.log('\n⚙️  LAYERS 2-3: OPTIMIZATION + GRAPH REASONING + LEARNING (Parallel)');
  const parallelStartTime = Date.now();

  // Parallel execution: GEPA, GAMP, Learning are independent
  const [optResult, graphResult, learnResult] = await Promise.all([
    // Layer 2: GEPA Optimization
    this.config.enableOptimization
      ? this.executeOptimization(query, routingResult)
      : Promise.resolve(undefined),

    // Layer 2.5: GAMP Graph Reasoning
    this.config.enableGAMP
      ? (async () => {
          const memories = await this.reasoningBank.retrieveRelevantMemories(query, routingResult.domain, 10);
          const graph = await this.buildLightweightKnowledgeGraph(query, routingResult.domain, memories);
          return await this.executeGraphReasoning(query, routingResult.domain, graph, []);
        })()
      : Promise.resolve(undefined),

    // Layer 3: Learning (ReasoningBank)
    this.config.enableLearning
      ? this.executeLearning(query, routingResult.domain)
      : Promise.resolve(undefined),
  ]);

  optimizationResult = optResult;
  graphReasoningResult = graphResult;
  learningResult = learnResult;

  const parallelDuration = Date.now() - parallelStartTime;

  if (graphReasoningResult) {
    layersExecuted.push('graph_reasoning');
    console.log(`   ✓ GAMP paths: ${graphReasoningResult.totalPaths}`);
    console.log(`   ✓ Avg novelty: ${graphReasoningResult.avgNovelty.toFixed(2)}`);
  }

  console.log(`   ⚡ Parallelization: ${parallelDuration}ms`);
}
```

#### Phase 5: Use GAMP Results in Answer Generation

**Enhanced generateAnswer() method**:

```typescript
private async generateAnswer(
  query: string,
  domain: string,
  learningResult?: LearningResult,
  graphReasoningResult?: GraphReasoningResult
): Promise<string> {
  // Build context from GAMP paths if available
  let gampContext = '';
  if (graphReasoningResult?.paths && graphReasoningResult.paths.length > 0) {
    gampContext = '\n\n**GAMP Graph Reasoning Insights:**\n';
    for (const path of graphReasoningResult.paths.slice(0, 3)) {
      gampContext += `- Problem: ${path.problem}\n`;
      gampContext += `  Solution: ${path.solution}\n`;
      gampContext += `  Effect: ${path.effect}\n`;
      gampContext += `  Novelty: ${path.novelty.toFixed(2)}\n\n`;
    }
  }

  // Append GAMP context to query
  const enhancedQuery = query + gampContext;

  // Generate answer with GAMP context
  // ... (rest of implementation)
}
```

---

## Configuration Examples

### Minimal (GAMP Disabled)
```typescript
const pipeline = new PermutationLitePipeline({
  enableOptimization: true,
  enableLearning: true,
  enableVerification: true,
  enableGAMP: false, // Disabled
});
```

### Standard (GAMP Enabled)
```typescript
const pipeline = new PermutationLitePipeline({
  enableOptimization: true,
  enableLearning: true,
  enableVerification: true,
  enableGAMP: true, // Enabled for complex queries
  gampConfig: {
    maxPaths: 20,
    maxDepth: 3,
    useLLMGuided: true,
    minNoveltyScore: 0.3,
  },
});
```

### Advanced (GAMP + Teacher-Student)
```typescript
const pipeline = new PermutationLitePipeline({
  enableOptimization: true,
  enableLearning: true,
  enableVerification: true,
  enableGAMP: true,
  enableTeacherStudent: true,
  gampConfig: {
    maxPaths: 30,
    maxDepth: 4,
    useLLMGuided: true,
    domainExperts: ['molecular_biologist', 'chemist', 'physicist'],
    minNoveltyScore: 0.5,
  },
});
```

---

## Performance Considerations

### Expected Latency Impact

**Without GAMP** (Current):
- Layer 1 (Routing): ~50ms
- Layer 2 (Optimization): ~3-5s (GEPA)
- Layer 3 (Learning): ~500ms (ReasoningBank)
- Layer 4 (Verification): ~2-4s (RVS)
- **Total**: ~6-10s

**With GAMP** (Proposed):
- Layer 1 (Routing): ~50ms
- Layer 2 (Optimization): ~3-5s (GEPA)
- Layer 2.5 (GAMP): ~5-15s (graph reasoning) ← NEW
- Layer 3 (Learning): ~500ms (ReasoningBank)
- Layer 4 (Verification): ~2-4s (RVS)
- **Total**: ~11-25s

**Optimization**: Parallel execution (Layers 2 + 2.5 + 3 run concurrently)
- Parallel time: max(5s GEPA, 15s GAMP, 0.5s Learning) = **15s**
- **Total with parallelization**: ~17-20s

### When to Enable GAMP

**Good Use Cases**:
- Scientific research queries
- Complex multi-step problems
- Innovation/novelty-seeking queries
- Technical domain expertise needed
- Graph-based reasoning beneficial

**Poor Use Cases**:
- Simple factual queries
- Time-sensitive requests (< 20s deadline)
- Queries without graph structure
- Already answered by ReasoningBank

### Adaptive GAMP Activation

**Intelligent routing**: Enable GAMP based on query characteristics

```typescript
private shouldUseGAMP(query: string, domain: string, difficulty: number): boolean {
  // Enable GAMP for:
  // 1. High difficulty queries (IRT > 0.7)
  // 2. Scientific/technical domains
  // 3. Multi-step reasoning keywords

  const scientificDomains = ['biology', 'chemistry', 'physics', 'medicine'];
  const multiStepKeywords = ['how', 'why', 'explain', 'relationship', 'mechanism'];

  const isDifficult = difficulty > 0.7;
  const isScientific = scientificDomains.includes(domain);
  const isMultiStep = multiStepKeywords.some(kw => query.toLowerCase().includes(kw));

  return isDifficult && (isScientific || isMultiStep);
}
```

---

## Testing Strategy

### Unit Tests

1. **GAMP Layer Integration Test**
   - Test `executeGraphReasoning()` with mock knowledge graph
   - Verify GAMP paths are discovered and ranked
   - Verify metadata includes GAMP results

2. **Knowledge Graph Builder Test**
   - Test `buildLightweightKnowledgeGraph()` with memories
   - Verify graph has nodes and edges
   - Verify P-S-E triplet extraction

3. **Config Flag Test**
   - Test GAMP enabled/disabled behavior
   - Test adaptive GAMP activation
   - Test parallel execution with GAMP

### Integration Tests

1. **E2E Test with GAMP**
   - Query: "How do pain receptors work?"
   - Domain: "biology"
   - Expected: GAMP discovers P-S-E paths
   - Expected: Answer includes graph reasoning insights

2. **Performance Test**
   - Measure latency with/without GAMP
   - Verify parallel execution works
   - Verify GAMP doesn't block other layers

3. **Quality Test**
   - Compare answers with/without GAMP
   - Measure novelty of GAMP-enhanced answers
   - Verify scientific rationality improvements

---

## Migration Checklist

- [ ] Add GAMP config flags to `PermutationLiteConfig`
- [ ] Implement `executeGraphReasoning()` method
- [ ] Implement `buildLightweightKnowledgeGraph()` helper
- [ ] Add GAMP to parallel execution block
- [ ] Integrate GAMP results into `generateAnswer()`
- [ ] Add adaptive GAMP activation logic
- [ ] Update metadata to include GAMP results
- [ ] Write unit tests for GAMP layer
- [ ] Write E2E test with real query
- [ ] Benchmark performance impact
- [ ] Update documentation
- [ ] Deploy with feature flag for gradual rollout

---

## Rollout Strategy

### Phase 1: Development (Week 1)
- Implement GAMP layer integration
- Write unit tests
- Test with synthetic queries

### Phase 2: Testing (Week 2)
- E2E tests with real queries
- Performance benchmarking
- Quality comparison (with/without GAMP)

### Phase 3: Beta (Week 3)
- Enable GAMP for 10% of queries
- Monitor latency and quality
- Collect user feedback

### Phase 4: Production (Week 4+)
- Gradual rollout to 50% → 100%
- Optimize parallel execution
- Tune adaptive activation heuristics

---

## Alternative: GAMP-Only Mode

If you want GAMP without other complexity, create a simplified pipeline:

```typescript
export class PermutationGAMPPipeline {
  async execute(query: string, domain: string): Promise<Result> {
    // 1. Build knowledge graph from query
    const graph = await this.buildGraphFromQuery(query, domain);

    // 2. GAMP discovery
    const paths = await gampAgentSystem.discoverPaths(query, graph, [], domain);

    // 3. Select best path
    const bestPath = paths[0];

    // 4. Generate answer from path
    const answer = `Problem: ${bestPath.problem}\nSolution: ${bestPath.solution}\nEffect: ${bestPath.effect}`;

    return { answer, paths };
  }
}
```

This gives you pure GAMP reasoning without the full Permutation-Lite complexity.

---

## Conclusion

**Recommended**: Integrate GAMP as Layer 2.5 (Graph Reasoning) with:
- Parallel execution with GEPA and Learning
- Config flag for easy enable/disable
- Adaptive activation based on query characteristics
- Lightweight knowledge graph from ReasoningBank memories

**Expected Benefits**:
- 🔬 Enhanced scientific reasoning
- 💡 Higher novelty in answers
- 🎯 Better factuality (reality-checking)
- 🧠 Multi-agent collaboration insights

**Trade-offs**:
- ⏱️ 5-15s additional latency (mitigated by parallelization)
- 🧩 Slightly more complex architecture (5 layers vs 4)
- 💰 Additional LLM costs for GAMP agents

**When to Use**:
- Enable GAMP for complex scientific/technical queries
- Disable GAMP for simple factual queries
- Use adaptive activation for intelligent routing
