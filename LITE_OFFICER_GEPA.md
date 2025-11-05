# Lite-Officer Mode: Unified GEPA Framework

**Version 2.2 | Adapted from FM 6-22 Leadership Development**

## Overview

`lite-officer` is a new mode in the chat-reasoning API that implements the **Unified GEPA Framework** (Goals-Evidence-Performance-Actions) for adaptive development in enterprise AI context engineering.

## Core Philosophy

> "Use strengths (e.g., DSPy refinement) to address needs (e.g., ambiguity handling) amid uncertainties (e.g., real-time data flux)."

The GEPA cycle creates a **reflective, self-optimizing loop** for enterprise AI systems:
- **Query input** → **GEPA execution** (via PERMUTATION Engine) → **Reflective AAR** → **Iterate** via LoRA/DSPy

## GEPA Cycle Phases

### **G: Goals** (Set Intent)
- **SMART objectives**: Multi-domain objectives (e.g., financial ROI analysis)
- **Leverage strengths**: Use identified strengths (e.g., DSPy, synthesis) to achieve goals
- **Quality targets**: Domain-specific quality targets (e.g., 92% for financial queries)

**Example**:
```typescript
goals: {
  smart: [
    "Achieve 92% quality score for financial queries",
    "Leverage DSPy for optimal context engineering",
    "Address ambiguity handling through synthesis capability"
  ],
  leverage: ["DSPy", "context_engineering", "synthesis"],
  domain: "financial",
  qualityTarget: 0.92
}
```

### **E: Evidence** (Gather/Process)
- **SQRRR method**: Survey, Question, Read, Recite, Review
- **ReasoningBank retrieval**: Multi-sensory data from ReasoningBank memories
- **Indicators**: Short-term indicators (e.g., "Drift hinders", "ReasoningBank supports")

**Example**:
```typescript
evidence: {
  sqrrr: {
    survey: "Query: Analyze ROI for Bitcoin investment...",
    question: "What evidence is needed to answer this query accurately?",
    read: "Retrieved 5 relevant memories from ReasoningBank: ...",
    recite: "Key patterns from ReasoningBank: 5 relevant memories retrieved",
    review: "Evidence gathering complete: Retrieved 5 memories"
  },
  indicators: ["ReasoningBank supports", "Ambiguity hinders"],
  reasoningBankRetrieval: [...]
}
```

### **P: Performance** (Assess/Reflect)
- **SOAR-balanced**: Situation, Observation, Assessment, Recommendation
- **AAR (After Action Review)**: Capability evaluation (what supports/hinders)
- **Strengths & Needs**: Identify strengths and needs from performance

**Example**:
```typescript
performance: {
  aar: {
    capability: "Strengths (DSPy, context_engineering) support performance. Needs (quality) hinder performance.",
    cause: "Insufficient context or optimization",
    leverage: "DSPy"
  },
  qualityScore: 0.89,
  strengths: ["DSPy", "context_engineering"],
  needs: ["quality"],
  supports: ["Quality meets target", "Context Engineering active"],
  hinders: ["Quality below target"],
  soar: {
    situation: "Executing financial query with GEPA cycle",
    observation: "Quality: 0.890, Strengths: DSPy, context_engineering, Needs: quality",
    assessment: "Performance below target. Quality meets target, Context Engineering active support performance. Quality below target hinder performance.",
    recommendation: "Leverage DSPy to address quality gaps"
  }
}
```

### **A: Actions** (Iterate/Experiment)
- **Dominance Technique**: Rank actions by impact/cost (Pareto optimal)
- **Table 4-2 Methods**: Feedback, Study, Practice activities
- **Iteration**: DSPy, LoRA, or prompt evolution based on needs

**Example**:
```typescript
actions: {
  table42: {
    feedback: ["Request TRM evaluation", "Consult ReasoningBank for past evals"],
    study: ["Investigate DSPy refinements"],
    practice: ["Teach chain evolution via GEPA"]
  },
  dominance: {
    rank: "DSPy optimization",
    impact: 0.8,
    cost: 0.3
  },
  iteration: {
    method: "DSPy",
    prompt: "...",
    config: { optimize: true, iterations: 5 }
  },
  contingency: "Fallback: Use DSPy if DSPy fails"
}
```

## API Usage

### Request
```typescript
POST /api/chat-reasoning
{
  "query": "Analyze ROI for Bitcoin investment in Q1 2025",
  "domain": "financial",
  "mode": "lite-officer",
  "stream": true
}
```

### Response (Streaming)
```typescript
// Step 0: G - Goals
event: reasoning
data: {
  step: "0",
  title: "G: Goals",
  content: "Setting SMART objectives and leveraging strengths...",
  status: "in_progress"
}

// Step 1: E - Evidence
event: reasoning
data: {
  step: "1",
  title: "E: Evidence",
  content: "Gathering multi-sensory data with SQRRR and ReasoningBank...",
  status: "in_progress"
}

// Step 2: P - Performance
event: reasoning
data: {
  step: "2",
  title: "P: Performance",
  content: "SOAR & AAR: Quality 0.890, Strengths: DSPy, context_engineering",
  status: "complete",
  data: { /* performance object */ }
}

// Step 3: A - Actions
event: reasoning
data: {
  step: "3",
  title: "A: Actions",
  content: "Dominance Rank: DSPy optimization, Iteration: DSPy",
  status: "complete",
  data: { /* actions object */ }
}

// Final Answer
event: answer
data: {
  text: "...",
  metadata: {
    mode: "lite-officer",
    quality_score: 0.89,
    gepaCycle: {
      goals: [...],
      strengths: [...],
      needs: [...],
      actions: "DSPy",
      soar: {...}
    }
  }
}
```

## Implementation Details

### UnifiedGEPAEngine
**Location**: `frontend/lib/gepa-unified-engine.ts`

**Key Methods**:
- `execute(query, domain)`: Executes full GEPA cycle
- `setGoals(query, domain)`: Sets SMART goals leveraging strengths
- `gatherEvidence(query, domain)`: Gathers evidence using SQRRR and ReasoningBank
- `assessPerformance(query, domain, result, goals, evidence)`: Assesses with SOAR & AAR
- `determineActions(query, domain, goals, evidence, performance)`: Determines actions using dominance

### Integration with PERMUTATION Pipeline
- Uses `PermutationLiteGAMPPipeline` for base execution
- Enables GAMP, Optimization, Learning, Teacher-Student, REFRAG
- Integrates with Context Engineering 2.0
- Stores GEPA cycles for learning and iteration

## Benefits

1. **Self-Optimization**: System learns from each cycle and improves
2. **Strength-Leveraging**: Uses identified strengths to address needs
3. **Reflective Learning**: AAR provides insights for continuous improvement
4. **Dominance Ranking**: Prioritizes actions by impact/cost
5. **Table 4-2 Methods**: Structured developmental activities

## Example Workflow

1. **Query**: "Analyze ROI for Bitcoin investment"
2. **G: Goals**: Set 92% quality target, leverage DSPy
3. **E: Evidence**: Retrieve 5 memories, identify indicators
4. **Execute**: PERMUTATION pipeline with GAMP, Context Engineering 2.0
5. **P: Performance**: Assess quality (0.89), identify strengths/needs
6. **A: Actions**: Rank actions (DSPy optimization), determine iteration method
7. **Next Cycle**: Apply actions, iterate, improve

## Comparison with Other Modes

| Mode | Focus | GEPA Cycle | Self-Optimization |
|------|-------|------------|------------------|
| **expert** | Full PERMUTATION pipeline | ❌ | ❌ |
| **lite** | Simplified 4-layer | ❌ | ❌ |
| **lite-gamp** | GAMP graph reasoning | ❌ | ❌ |
| **lite-officer** | GEPA unified framework | ✅ | ✅ |

## Key Files

- `frontend/lib/gepa-unified-engine.ts` - Unified GEPA Engine implementation
- `frontend/app/api/chat-reasoning/route.ts` - API route handler for `lite-officer` mode
- `LEADERSHIP_DEVELOPMENT_AI_ADAPTATION.md` - Source adaptation from FM 6-22

---

**Status**: ✅ Implemented and operational  
**Version**: 2.2  
**Last Updated**: 2025-01-15

