# Chat-Reasoning API Modes

The `/api/chat-reasoning` endpoint supports **4 distinct modes**, each optimized for different use cases:

---

## 1. **`expert`** (Default)
**Full PERMUTATION Unified Pipeline**

**What it includes**:
- Complete unified PERMUTATION pipeline
- All 11+ AI components
- Parallel execution optimizations
- Full context engineering
- Teacher-Student-Judge system

**Best for**:
- Complex queries requiring maximum capability
- Research and analysis tasks
- When you need the full AI stack
- Production enterprise use cases

**Performance**: Most comprehensive, highest cost, longest execution time

---

## 2. **`lite`**
**Simplified 4-Layer Architecture**

**What it includes**:
- Routing (domain detection, IRT difficulty)
- Optimization (GEPA prompt evolution)
- Learning (ReasoningBank memory storage/retrieval)
- Verification (RVS - Recursive Verification System)

**Best for**:
- Standard queries
- When you need faster responses
- Cost-sensitive applications
- Simple Q&A tasks

**Performance**: Fast, efficient, moderate cost

---

## 3. **`lite-gamp`**
**PERMUTATION-Lite with GAMP Graph Reasoning**

**What it includes**:
- All `lite` features
- **GAMP (Graph-based Agent Multi-agent Pathfinding)**
  - Knowledge graph construction
  - Problem-Solution-Effect (P-S-E) extraction
  - Multi-agent path discovery
  - Novelty scoring
- **Context Engineering 2.0** (always enabled)
- **DO-RAG/REFRAG** query reformulation + reranking
- **GEPA + DSPy + Ax LLM** with 10 iterations
- **Teacher-Student** system (Perplexity/Ollama)
- **20 GEPA rollouts** with Pareto sampling

**Best for**:
- Scientific discovery queries
- Research-oriented questions
- Complex reasoning tasks
- When you need graph-based insights
- Multi-step problem solving

**Performance**: Comprehensive, includes graph reasoning, optimized for research

**GAMP Activation**:
- Activates for difficulty > 0.3 (IRT threshold)
- Research-oriented queries (contains "investigate", "explore", "analyze", etc.)
- Scientific domains (if configured)
- Very high difficulty (> 0.7) even without research keywords

---

## 4. **`lite-officer`** ⭐ NEW
**Unified GEPA Framework (Goals-Evidence-Performance-Actions)**

**What it includes**:
- All `lite-gamp` features
- **GEPA Cycle**:
  - **G: Goals** - SMART objectives leveraging strengths
  - **E: Evidence** - SQRRR method + ReasoningBank retrieval
  - **P: Performance** - SOAR-balanced assessment + AAR
  - **A: Actions** - Dominance ranking + Table 4-2 methods
- **Self-optimization** - Learns from each cycle
- **Reflective learning** - AAR provides insights
- **Strength-leveraging** - Uses identified strengths to address needs

**Best for**:
- Adaptive development workflows
- Self-improving systems
- When you need reflective learning
- Enterprise AI optimization
- Leadership development-inspired AI

**Performance**: Comprehensive + self-optimizing, includes GEPA cycle metadata

**Key Differentiator**:
- Only mode with **reflective GEPA cycle**
- Provides **SOAR assessment** and **AAR** (After Action Review)
- **Dominance ranking** for action prioritization
- **Table 4-2 developmental activities** (Feedback, Study, Practice)

---

## Comparison Table

| Mode | GAMP | Context Eng 2.0 | GEPA Cycle | Self-Optimization | Best For |
|------|------|----------------|------------|-------------------|----------|
| **expert** | ❌ | ✅ | ❌ | ❌ | Full capability |
| **lite** | ❌ | ❌ | ❌ | ❌ | Fast & efficient |
| **lite-gamp** | ✅ | ✅ | ❌ | ❌ | Research & reasoning |
| **lite-officer** | ✅ | ✅ | ✅ | ✅ | Adaptive learning |

---

## Usage Examples

### Expert Mode
```typescript
POST /api/chat-reasoning
{
  "query": "Complex enterprise analysis",
  "mode": "expert",
  "stream": true
}
```

### Lite Mode
```typescript
POST /api/chat-reasoning
{
  "query": "Simple question",
  "mode": "lite",
  "stream": true
}
```

### Lite-GAMP Mode
```typescript
POST /api/chat-reasoning
{
  "query": "Investigate the relationship between X and Y",
  "mode": "lite-gamp",
  "stream": true
}
```

### Lite-Officer Mode
```typescript
POST /api/chat-reasoning
{
  "query": "Analyze ROI for Bitcoin investment",
  "mode": "lite-officer",
  "domain": "financial",
  "stream": true
}
```

---

## Response Structure

All modes return similar structure but with different metadata:

```typescript
{
  success: true,
  answer: "...",
  reasoningSteps: [
    { step: "1", title: "...", content: "...", status: "complete" }
  ],
  metadata: {
    mode: "lite-officer", // or expert, lite, lite-gamp
    domain: "financial",
    quality_score: 0.89,
    processing_time_ms: 1234,
    // Mode-specific metadata:
    // - expert: Full pipeline metadata
    // - lite: Routing, optimization, learning, verification
    // - lite-gamp: + graphReasoning, contextEngineering
    // - lite-officer: + gepaCycle (goals, evidence, performance, actions)
  }
}
```

---

## Recommendations

- **Use `expert`** for maximum capability and complex enterprise queries
- **Use `lite`** for simple, fast responses with standard quality
- **Use `lite-gamp`** for research, scientific discovery, and graph-based reasoning
- **Use `lite-officer`** for adaptive, self-improving systems with reflective learning

---

**Last Updated**: 2025-01-15  
**Status**: ✅ All 4 modes operational

