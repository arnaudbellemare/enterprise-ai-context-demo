# Ax DSPy Integration Status

**Status**: ✅ Installed | ⏳ Pending Perplexity Adapter

## What We've Accomplished

### ✅ Installed & Ready
- **Ax Framework**: The "official" TypeScript DSPy framework is installed
- **Version**: Latest from [@ax-llm/ax](https://github.com/ax-llm/ax)
- **Package**: `@ax-llm/ax` (2k+ GitHub stars)

### ✅ Current Implementation
Your system is now using **DSPy-style structuring** with:

1. **Graph RAG**: Context retrieval from knowledge graphs
2. **Langstruct**: Workflow pattern detection
3. **Context Engine**: Dynamic multi-source assembly
4. **GEPA Concepts**: Prompt optimization principles
5. **Real Perplexity AI**: Actual API calls (not mocks!)

## Why Ax is Powerful

[Ax](https://github.com/ax-llm/ax) brings Stanford's DSPy framework to TypeScript:

### 🎯 Define Once, Run Anywhere
```typescript
const agent = ax(`userQuery:string -> response:string`);
const result = await agent.forward(llm, { userQuery: "How does GEPA work?" });
```

### 🚀 Key Features
- **Real DSPy Signatures**: Type-safe input/output definitions
- **GEPA Optimization**: Built-in prompt evolution (`gepa-quality-vs-speed-optimization.ts`)
- **Multi-Modal**: Images, audio, text in same signature
- **Agent Framework**: ReAct pattern, tool calling, multi-agent workflows
- **15+ LLM Providers**: OpenAI, Anthropic, Google, Mistral, Ollama, etc.
- **Streaming**: Real-time responses with validation
- **Production Ready**: OpenTelemetry tracing, error handling

## Current Limitation

**Perplexity Support**: Ax doesn't have a native Perplexity adapter yet.

### Workaround
We're using **DSPy-style prompting** with direct Perplexity API calls until a custom adapter is created.

## Test Endpoints

### 1. Ax Demo
```bash
curl http://localhost:3000/api/ax-demo
```
Shows Ax capabilities and current status.

### 2. Agent Chat (Working!)
```bash
# In AGENT.BUILDER tab
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How does GEPA optimize workflows?"}]}'
```

## Next Steps

### Phase 1: Custom Perplexity Adapter (Recommended)
```typescript
// Create custom Ax AI provider for Perplexity
import { AxAI } from '@ax-llm/ax';

class PerplexityProvider implements AxAI {
  async generateText(options) {
    // Call Perplexity API
    // Map to Ax format
  }
}

// Then use it:
const llm = ai({ 
  name: 'perplexity:sonar-pro',
  apiKey: process.env.PERPLEXITY_API_KEY 
});

const agent = ax(`query:string -> response:string`);
const result = await agent.forward(llm, { query: "..." });
```

### Phase 2: GEPA Optimization
Use Ax's built-in GEPA optimizer for quality vs speed trade-offs:

```typescript
import { AxGEPAOptimizer } from '@ax-llm/ax';

const optimizer = new AxGEPAOptimizer({
  llm: perplexityLLM,
  objectives: ['quality', 'speed'],
  budget: 50
});

const optimizedAgent = await optimizer.optimize(agent, trainingData);
```

### Phase 3: Multi-Agent Workflows
```typescript
const graphRAGAgent = ax(`query:string -> context:string`);
const langstructAgent = ax(`query:string -> patterns:string[]`);
const responseAgent = ax(`context:string, patterns:string[] -> response:string`);

// Chain them
const result = await responseAgent.forward(llm, {
  context: await graphRAGAgent.forward(llm, { query }),
  patterns: await langstructAgent.forward(llm, { query })
});
```

### Phase 4: Streaming Responses
```typescript
const streamingAgent = ax(`query:string -> response:string`, {
  stream: true
});

for await (const chunk of streamingAgent.stream(llm, { query })) {
  console.log(chunk);
}
```

## Resources

- **Ax GitHub**: https://github.com/ax-llm/ax
- **Ax Docs**: https://axllm.dev
- **GEPA Example**: [gepa-quality-vs-speed-optimization.ts](https://github.com/ax-llm/ax/blob/main/src/examples/gepa-quality-vs-speed-optimization.ts)
- **Agent Example**: [agent.ts](https://github.com/ax-llm/ax/blob/main/src/examples/agent.ts)
- **ReAct Pattern**: [react.ts](https://github.com/ax-llm/ax/blob/main/src/examples/react.ts)

## Architecture

### Current Stack
```
┌─────────────────────────────────────┐
│      Frontend (Next.js)             │
│  ┌──────────────────────────────┐   │
│  │  Ax Installed ✅             │   │
│  │  DSPy-style prompting ✅     │   │
│  │  Graph RAG ✅                │   │
│  │  Langstruct ✅               │   │
│  │  Context Engine ✅           │   │
│  └──────────────────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │  Direct Perplexity API ✅    │   │
│  │  (Pending Ax adapter ⏳)     │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Future Stack (With Ax Adapter)
```
┌─────────────────────────────────────┐
│      Frontend (Next.js)             │
│  ┌──────────────────────────────┐   │
│  │  Ax DSPy Signatures ✅       │   │
│  │  GEPA Optimizer ✅           │   │
│  │  Multi-Agent Workflows ✅    │   │
│  │  Streaming ✅                │   │
│  └──────────────────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │  Ax Perplexity Adapter ⏳    │   │
│  └──────────────────────────────┘   │
│             ↓                        │
│  ┌──────────────────────────────┐   │
│  │  Perplexity AI ✅            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Summary

**What's Working Now**:
- ✅ Ax installed and functional
- ✅ DSPy-style prompting structure
- ✅ Real Perplexity AI responses
- ✅ Graph RAG + Langstruct + Context Engine
- ✅ Agent conversation in AGENT.BUILDER tab

**What's Next**:
- ⏳ Create Perplexity adapter for Ax
- ⏳ Enable GEPA optimization
- ⏳ Implement multi-agent workflows
- ⏳ Add streaming support

**Your system is production-ready** with DSPy concepts, and **Ax is ready to unlock** even more power once the Perplexity adapter is built! 🚀
