# 🔄 Ax DSPy Consolidation - Unified API Endpoint

## 📋 **What Changed**

We've **consolidated** the Ax framework functionality into a **single unified endpoint**: `/api/ax-dspy`

### **Before (Fragmented)**
- ✅ `/api/ax-dspy` - DSPy module execution (40+ modules)
- ⚠️ `/api/ax/execute` - Workflow node execution (6 node types)
- **Problem**: Two separate endpoints with overlapping functionality

### **After (Consolidated)**
- ✅ `/api/ax-dspy` - **UNIFIED** endpoint supporting:
  - 40+ DSPy modules (financial, legal, healthcare, etc.)
  - 6 workflow node types (memorySearch, webSearch, etc.)
  - Type-safe AI programming with Ax framework
  - Self-optimizing prompts through DSPy

---

## 🎯 **Unified API Endpoint**

### **Endpoint**: `/api/ax-dspy`

### **Mode 1: DSPy Module Execution**

Execute any of the 40+ specialized business modules:

```json
{
  "moduleName": "financial_analyst",
  "inputs": {
    "financialData": "Q4 2024 financials",
    "analysisGoal": "investment recommendation"
  },
  "provider": "ollama",
  "optimize": true
}
```

**Available Modules**: 
- Financial (6): `market_research_analyzer`, `financial_analyst`, `portfolio_optimizer`, etc.
- Real Estate (3): `real_estate_agent`, `property_valuator`, `rental_analyzer`
- Legal (3): `legal_analyst`, `contract_reviewer`, `compliance_checker`
- Marketing (3): `marketing_strategist`, `content_creator`, `sales_optimizer`
- Technology (3): `tech_architect`, `saas_analyzer`, `product_manager`
- Healthcare (3): `medical_analyzer`, `clinical_researcher`, `healthcare_compliance`
- Manufacturing (3): `manufacturing_optimizer`, `supply_chain_analyst`, `quality_assurance`
- Education (2): `educational_designer`, `research_analyst`
- Data Analytics (3): `data_synthesizer`, `data_analyst`, `business_intelligence`
- Operations (2): `operations_optimizer`, `logistics_coordinator`
- Customer Service (1): `customer_service_optimizer`
- Specialized (4): `sustainability_advisor`, `cybersecurity_analyst`, `innovation_catalyst`, `competitive_analyzer`, `entity_extractor`, `business_consultant`

### **Mode 2: Workflow Node Execution**

Execute Ax-powered workflow nodes with automatic optimization:

```json
{
  "nodeType": "memorySearch",
  "input": {
    "query": "latest market trends",
    "userId": "user-123"
  },
  "config": {
    "provider": "openai"
  }
}
```

**Available Node Types**:
- `memorySearch` - Semantic search with Ax optimization
- `webSearch` - Web search with query optimization
- `contextAssembly` - Intelligent context merging
- `modelRouter` - Smart model selection
- `gepaOptimize` - Prompt evolution and optimization
- `intelligentAgent` - ReAct pattern agent with planning

---

## 🔧 **Implementation Details**

### **Request Detection**
The API automatically detects the mode based on request structure:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Mode 2: Workflow Node Execution
  if (body.nodeType) {
    return await executeWorkflowNode(body);
  }
  
  // Mode 1: DSPy Module Execution (default)
  // ... execute DSPy module
}
```

### **Workflow Node Execution Functions**

Each node type has a dedicated Ax-powered function:

1. **`executeMemorySearchNode()`**
   - Optimizes search queries using Ax
   - Determines optimal relevance threshold
   - Calls `/api/search/indexed` with optimized parameters

2. **`executeWebSearchNode()`**
   - Optimizes queries for web search
   - Determines recency importance
   - Calls `/api/perplexity/chat` with optimized query

3. **`executeContextAssemblyNode()`**
   - Merges memory and web results intelligently
   - Deduplicates and scores context pieces
   - Identifies missing information

4. **`executeModelRouterNode()`**
   - Analyzes query and context
   - Selects optimal model (Claude, GPT-4, etc.)
   - Provides reasoning and cost estimates

5. **`executeGEPAOptimizeNode()`**
   - Evolves prompts for better performance
   - Identifies specific improvements
   - Analyzes tradeoffs

6. **`executeIntelligentAgentNode()`**
   - Uses ReAct pattern (Thought → Action → Observation)
   - Creates execution plan
   - Performs actions with function calling

---

## 📊 **Benefits of Consolidation**

### **1. Simplified Architecture**
- ✅ Single endpoint for all Ax functionality
- ✅ Consistent API interface
- ✅ Easier to maintain and extend

### **2. Better Integration**
- ✅ Workflow nodes can use DSPy modules
- ✅ DSPy modules can be composed into workflows
- ✅ Seamless interoperability

### **3. Code Reusability**
- ✅ Shared LLM initialization
- ✅ Shared error handling
- ✅ Shared optimization logic

### **4. Clearer Organization**
- ✅ All Ax functionality in one place
- ✅ Clear mode separation
- ✅ Comprehensive documentation

---

## 🔄 **Migration Guide**

### **Old Endpoint (Removed)**
```typescript
// ❌ OLD: /api/ax/execute
await fetch('/api/ax/execute', {
  method: 'POST',
  body: JSON.stringify({
    nodeType: 'memorySearch',
    input: { query: 'test', userId: 'user-123' },
    config: {}
  })
});
```

### **New Endpoint (Consolidated)**
```typescript
// ✅ NEW: /api/ax-dspy (same payload)
await fetch('/api/ax-dspy', {
  method: 'POST',
  body: JSON.stringify({
    nodeType: 'memorySearch',
    input: { query: 'test', userId: 'user-123' },
    config: {}
  })
});
```

**No payload changes required!** The API accepts the exact same format.

---

## 📁 **File Changes**

### **Modified**
- ✅ `frontend/app/api/ax-dspy/route.ts` - Added workflow node execution functions
- ✅ `frontend/app/workflow-ax/page.tsx` - Updated endpoint reference

### **Deleted**
- ❌ `frontend/app/api/ax/execute/route.ts` - Functionality moved to `/api/ax-dspy`

---

## 🎯 **Usage Examples**

### **Example 1: Financial Analysis (DSPy Module)**
```typescript
const response = await fetch('/api/ax-dspy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    moduleName: 'financial_analyst',
    inputs: {
      financialData: 'Q4 2024 revenue: $50M, expenses: $30M',
      analysisGoal: 'profitability analysis'
    },
    provider: 'ollama'
  })
});

const result = await response.json();
// result.result.keyMetrics, result.result.analysis, etc.
```

### **Example 2: Memory Search (Workflow Node)**
```typescript
const response = await fetch('/api/ax-dspy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nodeType: 'memorySearch',
    input: {
      query: 'crypto market trends',
      userId: 'user-456'
    },
    config: {
      provider: 'openai'
    }
  })
});

const result = await response.json();
// result.result.optimizedQuery, result.result.results, etc.
```

### **Example 3: Workflow Composition**
```typescript
// Step 1: Web search (workflow node)
const webResult = await fetch('/api/ax-dspy', {
  method: 'POST',
  body: JSON.stringify({
    nodeType: 'webSearch',
    input: { query: 'latest AI developments' }
  })
});

// Step 2: Analyze with DSPy module
const analysisResult = await fetch('/api/ax-dspy', {
  method: 'POST',
  body: JSON.stringify({
    moduleName: 'data_analyst',
    inputs: {
      dataset: JSON.stringify(webResult.result.results),
      analysisGoal: 'identify key trends'
    }
  })
});
```

---

## 🚀 **Result**

We now have a **unified, powerful, and extensible** Ax DSPy API that provides:

✅ **40+ specialized business modules** for any domain
✅ **6 workflow node types** with Ax optimization
✅ **Type-safe AI programming** with DSPy signatures
✅ **Self-optimizing prompts** for better performance
✅ **Single endpoint** for all Ax functionality
✅ **Seamless integration** between modules and workflows

This consolidation makes our system **cleaner, more maintainable, and more powerful**! 🎉
