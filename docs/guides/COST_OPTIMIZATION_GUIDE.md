# 💰 Cost Optimization Guide: Smart Model Routing

## Problem
Your workflow is using **Perplexity API (paid)** for all agents, even when free Ollama models would work fine.

**Current Cost:** ~$0.012 per workflow execution  
**Optimized Cost:** ~$0.003 per workflow execution (75% savings!)

---

## Solution: Intelligent Model Selection

### **Model Routing Rules:**

| **Agent Type** | **Current** | **Should Use** | **Reason** | **Cost** |
|----------------|-------------|----------------|------------|----------|
| Web Search | Perplexity | **Perplexity** | Needs web access + citations | $0.003 |
| DSPy Market Analyzer | Perplexity | **Ollama (free)** | Analysis only, no web needed | $0 |
| DSPy Data Synthesizer | Perplexity | **Ollama (free)** | Synthesis, no web needed | $0 |
| GEPA Optimizer | Perplexity | **Ollama (free)** | Prompt evolution, no web | $0 |
| CEL Expression | Perplexity | **Ollama (free)** | Data transformation, no web | $0 |
| LangStruct | Perplexity | **Ollama (free)** | Data extraction, no web | $0 |
| Custom Agent | Perplexity | **Depends** | Check if needs research | Varies |

---

## Implementation

### **Step 1: Update Agent Registry**

Add `modelPreference` and `estimatedCost` to each agent:

```typescript
// frontend/app/api/agents/route.ts

export const AGENT_REGISTRY = {
  webSearchAgent: {
    // ... existing config
    modelPreference: 'perplexity', // PAID - needs web search
    estimatedCost: 0.003,
  },
  
  dspyMarketAgent: {
    // ... existing config
    modelPreference: 'local', // FREE - analysis only
    estimatedCost: 0,
  },
  
  gepaAgent: {
    // ... existing config
    modelPreference: 'local', // FREE - prompt optimization
    estimatedCost: 0,
  },
  
  // ... update all agents
};
```

### **Step 2: Create Ollama API Endpoint**

```typescript
// frontend/app/api/ollama/chat/route.ts

export async function POST(request: Request) {
  const { query, systemPrompt } = await request.json();
  
  // Call local Ollama
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt: `${systemPrompt}\n\nUser: ${query}`,
      stream: false
    })
  });
  
  const data = await response.json();
  
  return NextResponse.json({
    success: true,
    response: data.response,
    model: 'llama3.2 (local)',
    cost: 0,
    isRealAI: true
  });
}
```

### **Step 3: Update Workflow Executor**

```typescript
// frontend/app/workflow/page.tsx

// In executeWorkflow function:
const agent = AGENT_REGISTRY[nodeId];
const modelSelection = selectOptimalModel({
  taskType: node.data.label,
  requiresWebSearch: agent.modelPreference === 'perplexity',
  complexity: 'medium'
});

// Route to correct API
const apiEndpoint = modelSelection.tier === 'local' 
  ? '/api/ollama/chat'  // FREE
  : node.data.apiEndpoint; // PAID

const response = await fetch(apiEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: nodeConfig.query,
    systemPrompt: nodeConfig.systemPrompt
  })
});
```

---

## Expected Results

### **Before Optimization:**
```
Workflow: Research Miami real estate

Agents:
1. Web Search (Perplexity) - $0.003
2. Market Analyzer (Perplexity) - $0.003  ❌ Should be FREE
3. Data Synthesizer (Perplexity) - $0.003  ❌ Should be FREE
4. GEPA Optimizer (Perplexity) - $0.003  ❌ Should be FREE

Total Cost: $0.012
```

### **After Optimization:**
```
Workflow: Research Miami real estate

Agents:
1. Web Search (Perplexity) - $0.003  ✅ Needs web access
2. Market Analyzer (Ollama) - $0.000  ✅ FREE!
3. Data Synthesizer (Ollama) - $0.000  ✅ FREE!
4. GEPA Optimizer (Ollama) - $0.000  ✅ FREE!

Total Cost: $0.003 (75% savings!)
```

---

## Quick Wins

### **Immediate Savings:**

1. **DSPy Agents** → Ollama (free)
   - Market Analyzer
   - Real Estate Agent
   - Financial Analyst
   - Data Synthesizer
   - Investment Report Generator

2. **GEPA Optimizer** → Ollama (free)
   - Prompt evolution doesn't need web search

3. **CEL Expressions** → Always local (already free)

4. **LangStruct** → Ollama (free)
   - Data extraction, no web needed

5. **Custom Agents** → Ollama (free) for synthesis

### **Keep Perplexity For:**
- ✅ Initial web research
- ✅ Real-time market data
- ✅ Citations needed
- ✅ Current events

---

## Cost Comparison

| **Workflow Type** | **Before** | **After** | **Savings** |
|-------------------|------------|-----------|-------------|
| Real Estate Analysis | $0.012 | $0.003 | 75% |
| Simple Synthesis | $0.009 | $0.000 | 100% |
| Research + Analysis | $0.015 | $0.003 | 80% |
| Data Transformation | $0.006 | $0.000 | 100% |

**Monthly Savings (1000 workflows/month):**
- Before: $12.00
- After: $3.00
- **Savings: $9.00/month** 💰

---

## Implementation Checklist

- [ ] Add `modelPreference` to all agents in `AGENT_REGISTRY`
- [ ] Create `/api/ollama/chat` endpoint
- [ ] Update workflow executor to route based on `modelPreference`
- [ ] Add cost display in UI
- [ ] Test with local Ollama running
- [ ] Verify Perplexity still used for web search
- [ ] Monitor cost savings

---

## Testing

```bash
# Test cost estimation
curl -s http://localhost:3000/api/agents \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userRequest":"Research Miami real estate"}' \
  | jq '.costEstimate'

# Expected output:
{
  "total": 0.003,
  "freeNodes": 3,
  "paidNodes": 1,
  "savings": "3 free agents, 1 paid API call",
  "recommendation": "✅ 75% cost savings with smart routing!"
}
```

---

## Next Steps

1. **Install Ollama** (if not already):
   ```bash
   # macOS
   brew install ollama
   
   # Start Ollama
   ollama serve
   
   # Pull model
   ollama pull llama3.2
   ```

2. **Update agents** with model preferences

3. **Create Ollama endpoint**

4. **Test workflow execution**

5. **Monitor savings** 📊

---

**Result:** Your system will intelligently route to free Ollama for 75%+ of tasks, using Perplexity only when web search is actually needed!

