# Tool-Based Agent Handoffs (Vercel AI SDK Style)

## Inspiration

Based on Vercel AI SDK's approach where agents declare tools like `switchToAgentB` as explicit handoff triggers, providing cleaner agent collaboration than implicit routing.

---

## The Problem with Implicit Routing

### **Current Approach (Dynamic Routing):**
```typescript
// After each node execution
const routingCheck = await fetch('/api/agents', {
  body: { userRequest: `Based on result: ${result}, need more agents?` }
});

if (shouldHandoff) {
  // Implicitly add agents based on LLM interpretation
  nodes.push(suggestedAgent);
}
```

**Issues:**
- ❌ Agent doesn't explicitly request handoff
- ❌ System guesses when handoff is needed
- ❌ Hard to predict/debug
- ❌ Agents can't control their own workflow

---

## The Better Approach: Tool-Based Handoffs

### **Vercel AI SDK Style:**

```typescript
// Agent declares available tools
const webSearchAgent = {
  name: 'Web Search Agent',
  tools: [
    {
      name: 'switchToMarketAnalyzer',
      description: 'Switch to DSPy Market Analyzer for deep analysis',
      targetAgent: 'dspyMarketAgent'
    },
    {
      name: 'switchToRealEstateAgent',
      description: 'Switch to Real Estate specialist',
      targetAgent: 'dspyRealEstateAgent'
    }
  ]
};

// During execution, agent EXPLICITLY calls tool:
Result: {
  answer: "I found market data...",
  toolCalls: [
    { name: 'switchToMarketAnalyzer', args: { data: '...' } }
  ]
}

// System detects tool call and switches
if (result.toolCalls?.includes('switchToMarketAnalyzer')) {
  currentAgent = 'dspyMarketAgent';
  // Prepare next step with agent B's config
}
```

---

## Benefits

| Aspect | Implicit Routing | Tool-Based Handoffs |
|--------|-----------------|---------------------|
| **Clarity** | ❌ System guesses | ✅ Agent explicitly requests |
| **Control** | ❌ System decides | ✅ Agent decides |
| **Debugging** | ❌ Hard to trace | ✅ Clear tool calls |
| **Streaming** | ⚠️ Complex | ✅ Native support |
| **Predictability** | ❌ LLM interpretation | ✅ Explicit triggers |

---

## Implementation in Our System

### **1. Agent Registry with Tools**

```typescript
const AGENT_REGISTRY = {
  webSearchAgent: {
    name: 'Web Search Agent',
    apiEndpoint: '/api/perplexity/chat',
    tools: [
      {
        name: 'switchToMarketAnalyzer',
        description: 'Switch to market analysis specialist',
        trigger: 'After gathering web data, if deep analysis needed',
        targetAgent: 'dspyMarketAgent',
        contextToPass: ['searchResults', 'marketData']
      },
      {
        name: 'switchToFinancialAnalyst',
        description: 'Switch to financial specialist',
        trigger: 'If financial calculations or ROI analysis needed',
        targetAgent: 'dspyFinancialAgent',
        contextToPass: ['financialData', 'numbers']
      }
    ],
    prompt: `You are a web research specialist.
             
Available tools:
- switchToMarketAnalyzer: Use when gathered data needs deep market analysis
- switchToFinancialAnalyst: Use when financial calculations are needed

After researching, if analysis is required, call the appropriate tool.`
  },
  
  dspyMarketAgent: {
    name: 'DSPy Market Analyzer',
    apiEndpoint: '/api/ax-dspy',
    tools: [
      {
        name: 'switchToInvestmentReport',
        description: 'Switch to investment report generator',
        trigger: 'After analysis, if formal report needed',
        targetAgent: 'dspyInvestmentReportAgent'
      }
    ],
    prompt: `You are a market analysis specialist using DSPy.
             
After analysis, if a formal investment report is needed, call switchToInvestmentReport.`
  }
};
```

---

### **2. Tool Detection in Workflow Executor**

```typescript
// In frontend/app/workflow/page.tsx - executeWorkflow()

for (const nodeId of executionOrder) {
  const node = nodes.find(n => n.id === nodeId);
  
  // Execute node
  const result = await executeNode(node, {
    availableTools: node.data.tools || []
  });
  
  // ✨ CHECK FOR TOOL CALLS (Explicit Handoffs)
  if (result.toolCalls && result.toolCalls.length > 0) {
    for (const toolCall of result.toolCalls) {
      if (toolCall.name.startsWith('switchTo')) {
        addLog(`🔀 TOOL HANDOFF: ${node.label} → ${toolCall.targetAgent}`);
        
        // Find tool definition
        const tool = node.data.tools?.find(t => t.name === toolCall.name);
        if (tool) {
          // Add target agent to workflow
          const targetAgent = AGENT_REGISTRY[tool.targetAgent];
          const newNodeId = `handoff-${Date.now()}`;
          
          nodes.push({
            id: newNodeId,
            data: {
              label: targetAgent.name,
              apiEndpoint: targetAgent.apiEndpoint,
              role: targetAgent.role,
              config: targetAgent.config,
              // Pass context from tool call
              contextFromPrevious: toolCall.args
            }
          });
          
          executionOrder.splice(
            executionOrder.indexOf(nodeId) + 1,
            0,
            newNodeId
          );
          
          addLog(`  ✨ Added: ${targetAgent.name} (explicit tool call)`);
        }
      }
    }
  }
}
```

---

### **3. Streaming Support (Vercel AI SDK Style)**

```typescript
// In API route
export async function POST(req: Request) {
  const { messages, agent } = await req.json();
  
  const currentAgent = AGENT_REGISTRY[agent];
  
  // Stream response with tool calls
  const stream = await streamText({
    model: currentAgent.modelPreference === 'local' ? ollama : perplexity,
    messages,
    tools: currentAgent.tools.reduce((acc, tool) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: z.object({
          reason: z.string(),
          context: z.any()
        }),
        execute: async ({ reason, context }) => {
          // Tool execution triggers handoff
          return {
            handoff: tool.targetAgent,
            reason,
            context
          };
        }
      };
      return acc;
    }, {})
  });
  
  return stream.toDataStreamResponse();
}
```

---

## Comparison

### **Your System NOW (Implicit):**

```
Node 1: Web Search
  → Executes
  → Result: "Found market data..."
  → System: "Hmm, this looks complex, maybe add Financial Agent?"
  → LLM decides: "Yes, add Financial Agent"
  → Adds agent implicitly
```

**Issues:**
- Agent doesn't know it triggered a handoff
- System guesses intent
- No explicit control

---

### **With Tool-Based Handoffs (Explicit):**

```
Node 1: Web Search
  → Executes with tools: [switchToMarketAnalyzer, switchToFinancialAnalyst]
  → Agent decides: "This data needs deep market analysis"
  → Agent calls: tool.switchToMarketAnalyzer({ data: "..." })
  → System detects tool call
  → Adds Market Analyzer (explicit, predictable)
```

**Benefits:**
- ✅ Agent explicitly requests handoff
- ✅ Clear intent via tool call
- ✅ Predictable workflow
- ✅ Agent controls its own flow

---

## Why This is Better for Your System

### **1. Explicit > Implicit**
```typescript
// Implicit (current)
"Result seems complex" → Maybe add agent? → LLM guesses

// Explicit (tool-based)
Agent calls switchToFinancialAnalyst → Clear handoff → Predictable
```

### **2. Streaming Compatible**
```typescript
// Works natively with streaming
const stream = useChat({
  api: '/api/agent/chat',
  onToolCall: ({ toolCall }) => {
    if (toolCall.name.startsWith('switchTo')) {
      // Handle handoff in UI
      switchToAgent(toolCall.targetAgent);
    }
  }
});
```

### **3. Better UX**
```
User sees:
  🌐 Web Search Agent: "I found market data..."
  🔀 Calling tool: switchToMarketAnalyzer
  M DSPy Market Analyzer: "Analyzing market data..."
  
vs. current:
  🌐 Web Search Agent: "I found market data..."
  🤔 Checking if handoff needed...
  🔀 Adding DSPy Market Analyzer (system decided)
```

---

## Implementation Plan

### **Phase 1: Add Tools to Agents** ✅ (Just Did)
- Define tools in AGENT_REGISTRY
- Specify targetAgent for each tool
- Document trigger conditions

### **Phase 2: Tool Detection in Executor** ⏳
- Parse agent responses for tool calls
- Detect `switchToX` patterns
- Add target agent to workflow

### **Phase 3: Tool Execution** ⏳
- Execute tool (prepare handoff)
- Pass context to next agent
- Update workflow state

### **Phase 4: Streaming Integration** ⏳
- Integrate with useChat
- Real-time tool call display
- Smooth agent transitions

---

## Next Steps

Want me to:

**Option A:** Implement full tool-based handoff system (replaces dynamic routing)

**Option B:** Keep both (tool-based for explicit, dynamic for implicit)

**Option C:** Just document this pattern for future enhancement

---

## Your Suggestion Summary

> "Basically you can create a tool 'switchToAgentB' that simply serves as a trigger and give it to AgentA, and then in prepareStep you can change prompt/config/available tools to those of AgentB if that trigger fires."

✅ **Excellent idea!** This is:
- Cleaner than implicit routing
- More predictable
- Better for streaming
- Native to Vercel AI SDK patterns
- Gives agents explicit control

**Should we implement this fully?** 🚀

