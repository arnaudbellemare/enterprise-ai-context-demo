# Handoff Systems Guide

## 🚗 Two Systems, One Platform

Your system now has **TWO handoff mechanisms** that work independently. Think of it like having two cars in your garage - use the right one for the right job!

---

## **System 1: Implicit Handoffs** (Your Daily Driver 🚙)

### **Status:** ✅ **PRODUCTION - USE THIS NOW**

### **What it is:**
The current system you've been using. Agents are connected via `handoffTo` arrays, and the system automatically checks after each node if additional agents are needed.

### **How it works:**
```typescript
// Agent definition
webSearchAgent: {
  handoffTo: ['dspyMarketAgent', 'dspyRealEstateAgent'],
  ...
}

// After node execution
→ Dynamic routing check
→ LLM decides: "Need financial analysis?"
→ Automatically inserts Financial Agent
→ Workflow continues
```

### **Where it's used:**
- ✅ `/app/workflow/page.tsx` (Workflow Executor)
- ✅ `/api/agents/route.ts` (Hybrid Routing API)
- ✅ Agent Builder workflows
- ✅ All visual workflow building

### **Benefits:**
- ⚡ Fast (no tool parsing needed)
- 🎯 Smart (LLM-powered decisions)
- 🔄 Dynamic (adapts during execution)
- ✅ Battle-tested (already working)
- 💰 Cost-optimized (uses one-token trick)

### **When to use:**
- ✅ Building workflows in the UI
- ✅ Executing multi-agent workflows
- ✅ Agent Builder recommendations
- ✅ **Default choice for everything right now**

### **Example:**
```
User: "Research Miami real estate and create investment report"

Workflow:
  1. Web Search Agent (gathers data)
  2. → Implicit check → "Need market analysis?"
  3. → YES → DSPy Market Analyzer (analyzes)
  4. → Implicit check → "Need financial report?"
  5. → YES → Investment Report Generator (reports)

Result: 3-agent workflow, seamlessly orchestrated
```

---

## **System 2: Tool-Based Handoffs** (The Electric Car in the Garage 🚗⚡)

### **Status:** ⚠️ **AVAILABLE - USE WHEN NEEDED**

### **What it is:**
A Vercel AI SDK-style system where agents explicitly call tools (like `switchToMarketAnalyzer`) to trigger handoffs. The `prepareStep()` hook detects these calls and switches agent context.

### **How it works:**
```typescript
// Agent definition
webSearchAgent: {
  tools: {
    switchToMarketAnalyzer: {
      targetAgent: 'dspyMarketAgent',
      description: 'Delegate to market specialist'
    }
  }
}

// Agent response
Agent: "I found data... TOOL_CALL: switchToMarketAnalyzer { ... }"

// prepareStep() detects tool call
→ Switches systemPrompt to Market Analyzer
→ Switches tools to Market Analyzer tools
→ Next message uses Market Analyzer config
```

### **Where it's used:**
- ⚠️ `/api/agent/chat-stateful` (Stateful Chat API)
- ⚠️ `/lib/tool-based-handoff.ts` (Core logic)
- ⚠️ Standalone - NOT integrated with main workflow

### **Benefits:**
- 🔍 Transparent (tool calls are visible data)
- 📊 Traceable (can log/analyze tool calls)
- 🌊 Streaming-friendly (tools in stream)
- 🔧 SDK-native (OpenAI, Anthropic, Vercel AI)
- 🎯 Agent autonomy (agents decide when to delegate)

### **When to use:**
- ⚠️ When you need **explicit** handoff visibility
- ⚠️ When using OpenAI/Anthropic SDKs with tool support
- ⚠️ When building conversational agents (not workflows)
- ⚠️ When you want streaming with visible tool calls
- ⚠️ **Future use - not needed yet**

### **Example:**
```
POST /api/agent/chat-stateful
{
  "message": "Research Miami market",
  "state": {
    "currentAgent": "webSearchAgent",
    "conversationHistory": []
  }
}

Response:
{
  "response": "Found data... TOOL_CALL: switchToMarketAnalyzer {...}",
  "toolCallDetected": true,
  "toolCall": { "name": "switchToMarketAnalyzer" },
  "hint": "Next message will be handled by Market Analyzer"
}

# Next call - agent automatically switched!
POST /api/agent/chat-stateful
{
  "message": "Continue",
  "state": { ... } # State from previous response
}

Response:
{
  "response": "Market analysis shows...",
  "currentAgent": "DSPy Market Analyzer" # ← SWITCHED!
}
```

---

## **Comparison Table**

| Feature | Implicit Handoffs | Tool-Based Handoffs |
|---------|------------------|---------------------|
| **Status** | ✅ Production | ⚠️ Available |
| **Visibility** | Hidden in logs | Explicit tool calls |
| **Speed** | Fast | Requires tool parsing |
| **LLM Support** | Any LLM | Needs tool support |
| **Streaming** | Works | Better (tools in stream) |
| **Use Case** | Workflows | Conversational agents |
| **Integration** | ✅ Fully integrated | ⚠️ Standalone endpoint |
| **Endpoint** | `/api/agents` | `/api/agent/chat-stateful` |
| **Complexity** | Low | Medium |
| **When to use** | **NOW** | **Future** |

---

## **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR AI SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IMPLICIT HANDOFFS (System 1) - ACTIVE ✅                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent Builder → /api/agents → Workflow Executor     │  │
│  │                                                       │  │
│  │  Flow: keyword → LLM → handoffTo → dynamic routing   │  │
│  │  Used by: All workflows, visual builder              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  TOOL-BASED HANDOFFS (System 2) - READY ⚠️                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/agent/chat-stateful                            │  │
│  │                                                       │  │
│  │  Flow: tools → prepareStep() → agent switch          │  │
│  │  Used by: Future conversational agents                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  BOTH USE: AGENT_REGISTRY (shared config)                  │
│  - handoffTo: Used by System 1                             │
│  - tools: Used by System 2                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **When to Switch Systems**

### **Stay with Implicit (System 1) if:**
- ✅ Your workflows are working perfectly
- ✅ You're building in the UI
- ✅ You want fast, automatic routing
- ✅ You're using Ollama/Perplexity (limited tool support)

### **Switch to Tool-Based (System 2) when:**
- ⚠️ You integrate OpenAI SDK with streaming
- ⚠️ You need visible handoff decisions in UI
- ⚠️ You want conversational agents (not workflows)
- ⚠️ You need to audit/log agent decisions
- ⚠️ You want LLMs to explicitly choose handoffs

---

## **Files Reference**

### **System 1 (Implicit) - Production**
```
frontend/app/api/agents/route.ts
  └─ AGENT_REGISTRY (handoffTo arrays)
  └─ Hybrid routing (keyword + LLM + semantic)
  └─ buildAgentWorkflow()

frontend/app/workflow/page.tsx
  └─ Workflow executor
  └─ Dynamic routing checks
  └─ Parallel DAG execution

frontend/app/agent-builder/page.tsx
  └─ UI for building workflows
  └─ Uses /api/agents for routing
```

### **System 2 (Tool-Based) - Ready for Future**
```
frontend/lib/tool-based-handoff.ts
  └─ prepareStep() core logic
  └─ createHandoffTool() helper
  └─ Type definitions

frontend/app/api/agent/chat-stateful/route.ts
  └─ Stateful chat with tool handoffs
  └─ Uses prepareStep()
  └─ Complete working implementation

TOOL_BASED_HANDOFFS_IMPLEMENTATION.md
  └─ Full documentation
  └─ Integration examples
```

---

## **Quick Decision Guide**

**"Which system should I use?"**

```
Are you building a workflow in the UI?
  └─ YES → Use Implicit (System 1) ✅
  
Are you executing an existing workflow?
  └─ YES → Use Implicit (System 1) ✅
  
Are you using the Agent Builder?
  └─ YES → Use Implicit (System 1) ✅
  
Do you need streaming with visible tool calls?
  └─ YES → Use Tool-Based (System 2) ⚠️
  
Do you have OpenAI SDK integrated?
  └─ YES → Consider Tool-Based (System 2) ⚠️
  
Not sure?
  └─ Use Implicit (System 1) ✅
```

---

## **Future Migration Path**

If you ever want to fully switch to tool-based:

**Phase 1:** Test with chat endpoint
- Use `/api/agent/chat-stateful` for conversational agents
- Keep workflows on implicit system
- Validate tool-based approach

**Phase 2:** Integrate OpenAI SDK
- Add OpenAI function calling
- Use real tool support (not regex)
- Test streaming with tools

**Phase 3:** Update workflow executor
- Integrate `prepareStep()` into `/app/workflow/page.tsx`
- Make handoffs explicit in UI
- Keep implicit as fallback

**Phase 4:** Full migration (optional)
- All handoffs via tools
- Remove implicit routing
- Unified system

**Current Status:** Phase 0 (Both systems available, implicit in use)

---

## **Summary**

🚙 **System 1 (Implicit):** Your reliable daily driver - **USE THIS NOW**
- Production-ready
- Fully integrated
- Fast and smart
- Zero risk

🚗⚡ **System 2 (Tool-Based):** Your fancy electric car - **READY WHEN YOU NEED IT**
- Future-ready
- SDK-compatible
- Explicit and traceable
- Available but not required

**Both coexist peacefully. Use System 1 for everything today. System 2 is ready when you want to experiment or integrate advanced LLM SDKs.**

---

**No action needed! Everything is already set up correctly.** 🎉

