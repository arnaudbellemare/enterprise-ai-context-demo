# Chat Reasoning Mode Selection

## Overview

The chat-reasoning interface now supports two modes:
- **Expert Mode**: Full Unified Permutation Pipeline (11+ components)
- **Lite Mode**: Permutation-Lite (4-layer streamlined pipeline)

## Implementation

### Frontend (`frontend/app/chat-reasoning/page.tsx`)

**Mode Selector UI:**
- Two toggle buttons in the header: "EXPERT" and "LITE"
- Active mode highlighted in cyan
- Tooltips explain each mode
- Mode selection persists during session

**State Management:**
```typescript
const [mode, setMode] = useState<'expert' | 'lite'>('expert');
```

**API Request:**
```typescript
body: JSON.stringify({ 
  query: input, 
  domain: 'general',
  mode: mode // Passes selected mode to API
})
```

### Backend API (`frontend/app/api/chat-reasoning/route.ts`)

**Mode Routing:**
```typescript
let mode: 'expert' | 'lite' = 'expert'; // Default
mode = body.mode || 'expert';

if (mode === 'lite') {
  // Permutation-Lite execution
  const result = await executePermutationLite(query, domain, {
    enableVectorPassing: true,
    vectorPassingProvider: 'ollama'
  });
  // Returns lite-specific format
} else {
  // Unified Pipeline execution
  const result = await executeUnifiedPipeline(query, domain, ...);
  // Returns expert-specific format
}
```

## Mode Comparison

### Expert Mode (Unified Permutation Pipeline)

**Architecture:**
- 11+ AI components integrated
- Teacher-Student-Judge pattern
- ACE Framework, DSPy, GEPA, RVS, EBM
- Parallel execution
- Streaming support

**Use Cases:**
- Complex queries requiring comprehensive analysis
- Multi-domain reasoning
- Research-intensive questions
- Maximum quality and thoroughness

**Performance:**
- Higher quality scores
- More comprehensive answers
- Longer processing time
- Higher API costs

### Lite Mode (Permutation-Lite)

**Architecture:**
- 4-layer streamlined pipeline
  1. Routing (IRT + Domain Detector)
  2. Optimization (GEPA)
  3. Learning (ReasoningBank)
  4. Verification (RVS)
- Vector-passing enabled (Ollama)
- Cost-effective

**Use Cases:**
- Standard queries
- Quick responses needed
- Cost-sensitive applications
- Production workloads

**Performance:**
- Fast response time (~70-85 seconds)
- Low cost ($0.001 per query)
- Quality score: 1.0
- Verified answers (confidence 0.77+)

## Response Formats

### Expert Mode Response
```json
{
  "success": true,
  "response": "...",
  "metadata": {
    "mode": "expert",
    "processing_time_ms": 120000,
    "quality_score": 0.95,
    "cost": 0.001
  },
  "reasoningSteps": [...],
  "systemComponents": [...],
  "metrics": {...}
}
```

### Lite Mode Response
```json
{
  "success": true,
  "answer": "...",
  "metadata": {
    "mode": "lite",
    "processing_time_ms": 71000,
    "quality_score": 1.0,
    "cost": 0.001,
    "layers_executed": ["routing", "optimization", "learning", "verification"],
    "routing": {...},
    "optimization": {...},
    "learning": {...},
    "verification": {...}
  },
  "reasoningSteps": [
    {
      "step": "1",
      "title": "Routing",
      "content": "Domain: financial, Difficulty: 0.662, Route: complex"
    },
    {
      "step": "2",
      "title": "Optimization (GEPA)",
      "content": "Quality: 0.80, Generations: 10"
    },
    {
      "step": "3",
      "title": "Learning (ReasoningBank)",
      "content": "Memories Stored: 3, Memories Used: 0"
    },
    {
      "step": "4",
      "title": "Verification (RVS)",
      "content": "Verified: ✅, Confidence: 0.77, Iterations: 12"
    }
  ]
}
```

## Usage

1. **Visit** `/chat-reasoning`
2. **Select Mode** using EXPERT/LITE buttons in header
3. **Enter Query** and submit
4. **View Results** with mode-specific reasoning steps

## Example Queries

**Expert Mode Recommended:**
- "Analyze the complete cross-border tax implications of moving a $10M art collection from New York to London, considering US, UK, and Singapore jurisdictions"

**Lite Mode Recommended:**
- "What should be the insurance premium on a painting valued at $125,000?"
- "Optimize tax filing for assets across multiple jurisdictions"

## Benefits

- **Flexibility**: Choose the right tool for each query
- **Cost Control**: Use Lite mode for standard queries
- **Quality**: Use Expert mode for complex analysis
- **Transparency**: See exactly which pipeline is processing your query

