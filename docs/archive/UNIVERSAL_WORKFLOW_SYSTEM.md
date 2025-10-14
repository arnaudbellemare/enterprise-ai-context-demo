# Universal Workflow Execution System

## Current Problem

The workflow execution in `frontend/app/workflow/page.tsx` is:
- ❌ **Hardcoded** for specific node types (Market Research, Custom Agent, etc.)
- ❌ **Doesn't use** our routing systems (hybrid routing, one-token optimization)
- ❌ **Doesn't leverage** specialized tools (DSPy, GEPA, LangStruct, CEL, ArcMemo)
- ❌ **Switch-case hell** - 500+ lines of node-specific code

## What We Actually Built

### 1. **Hybrid Agent Routing** (`/api/agents`)
- ⚡ 90% keyword matching (instant)
- 🧠 10% one-token LLM (60ms)
- Intelligently routes to best agent

### 2. **Specialized Tools**
- **DSPy Modules**: Self-optimizing agents (now routes to Perplexity with specialized prompts)
- **GEPA**: Prompt evolution and optimization
- **LangStruct**: Structured data extraction
- **CEL**: Expression evaluation for logic
- **Memory Search**: Vector similarity
- **Context Assembly**: Multi-source RAG
- **ArcMemo**: Concept-level memory

### 3. **Cost Optimization** (`/api/model-router`)
- Routes to Ollama (free) vs Perplexity (paid)
- Estimates costs
- Optimizes for speed/quality

## Proposed Universal System

### Architecture

```
User creates workflow with any nodes
    ↓
Execute Workflow
    ↓
For each node:
    1. Extract: node.data.apiEndpoint
    2. Build: context from previous nodes
    3. Call: Universal Node Executor
    4. Store: results in workflow data
    5. Apply: ArcMemo concept learning
    ↓
Display results
```

### Universal Node Executor

```typescript
async function executeNode(node: FlowNode, context: any, nodeConfig: any) {
  const { apiEndpoint, label, role } = node.data;
  
  // Build request based on node configuration
  const request = {
    query: nodeConfig.query || nodeConfig.prompt || context.query,
    context: context.previousResults,
    config: nodeConfig,
    ...context
  };
  
  // Route to appropriate API endpoint
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  const data = await response.json();
  
  // Strip markdown and format
  return {
    success: data.success !== false,
    content: stripMarkdown(extractContent(data)),
    rawData: data,
    nodeLabel: label,
    executionTime: data.executionTime || 0
  };
}
```

### API Endpoint Registry

All nodes should use these standardized endpoints:

| **Node Type** | **API Endpoint** | **Purpose** |
|--------------|------------------|-------------|
| Web Search | `/api/perplexity/chat` | Real-time web research |
| DSPy Market | `/api/dspy/execute` | Self-optimizing market analysis |
| DSPy Finance | `/api/dspy/execute` | Self-optimizing financial analysis |
| DSPy Real Estate | `/api/dspy/execute` | Self-optimizing RE analysis |
| GEPA Optimize | `/api/gepa/optimize` | Prompt evolution |
| LangStruct | `/api/langstruct/process` | Structured extraction |
| Memory Search | `/api/search/indexed` | Vector similarity search |
| Context Assembly | `/api/context/assemble` | Multi-source RAG |
| CEL Expression | `/api/cel/execute` | Expression evaluation |
| Custom Agent | `/api/agent/chat` | General AI agent |
| Model Router | `/api/model-router` | Intelligent model selection |
| Answer Generator | `/api/answer` | Final synthesis |

### Standardized API Response Format

All endpoints should return:

```typescript
{
  success: boolean;
  content?: string;        // Main text output
  response?: string;       // Alternative text output
  data?: any;             // Structured data
  error?: string;         // Error message
  executionTime?: number; // Latency in ms
  metadata?: {
    model?: string;
    cost?: number;
    provider?: string;
  }
}
```

## Implementation Plan

### Step 1: Create Universal Executor Utility

```typescript
// frontend/lib/workflow-executor.ts

export interface NodeExecutionContext {
  previousResults: Record<string, any>;
  workflowGoal: string;
  domain: string;
}

export interface NodeExecutionResult {
  success: boolean;
  content: string;
  rawData: any;
  error?: string;
  executionTime: number;
}

export async function executeUniversalNode(
  node: FlowNode,
  context: NodeExecutionContext,
  nodeConfig: any
): Promise<NodeExecutionResult> {
  const startTime = Date.now();
  
  try {
    // Extract API endpoint
    const apiEndpoint = node.data.apiEndpoint || '/api/agent/chat';
    
    // Build request payload
    const payload = buildNodePayload(node, context, nodeConfig);
    
    // Make API call
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract and format content
    const content = extractAndFormatContent(data);
    
    return {
      success: true,
      content: stripMarkdown(content),
      rawData: data,
      executionTime: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      content: '',
      rawData: null,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

function buildNodePayload(node: FlowNode, context: NodeExecutionContext, config: any) {
  // Universal payload builder
  return {
    query: config.query || config.prompt || context.workflowGoal,
    context: formatPreviousResults(context.previousResults),
    domain: context.domain,
    ...config
  };
}

function extractAndFormatContent(data: any): string {
  // Universal content extractor
  if (typeof data === 'string') return data;
  if (data.content) return data.content;
  if (data.response) return data.response;
  if (data.answer) return data.answer;
  if (data.result) return data.result;
  if (data.outputs) {
    if (typeof data.outputs === 'string') return data.outputs;
    if (data.outputs.result) return data.outputs.result;
    if (data.outputs.reasoning) return data.outputs.reasoning;
  }
  return JSON.stringify(data, null, 2);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
    .replace(/\*(.*?)\*/g, '$1')      // Italic
    .replace(/#{1,6}\s/g, '')         // Headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Code
    .trim();
}
```

### Step 2: Simplify Workflow Execution

```typescript
// In frontend/app/workflow/page.tsx

const executeWorkflow = async () => {
  setIsExecuting(true);
  addLog('🚀 Starting universal workflow execution');
  
  try {
    const executionOrder = getExecutionOrder(nodes, edges);
    const workflowResults: Record<string, any> = {};
    
    // Get workflow context
    const workflowGoal = nodes[0]?.data.description || 'Complete workflow analysis';
    const domain = detectDomain(workflowGoal);
    
    // Execute nodes in order
    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      addLog(`▶️ Executing: ${node.data.label}`);
      
      // Update node status
      updateNodeStatus(nodeId, 'executing');
      
      // Build execution context
      const context: NodeExecutionContext = {
        previousResults: workflowResults,
        workflowGoal,
        domain
      };
      
      // Execute node universally
      const result = await executeUniversalNode(
        node,
        context,
        nodeConfigs[nodeId] || {}
      );
      
      // Store result
      workflowResults[nodeId] = result;
      
      // Update node status
      updateNodeStatus(nodeId, result.success ? 'complete' : 'error');
      
      addLog(result.success 
        ? `✅ Completed: ${node.data.label} (${result.executionTime}ms)`
        : `❌ Failed: ${node.data.label} - ${result.error}`
      );
    }
    
    // Store results for display and chat
    setWorkflowResults(workflowResults);
    
    addLog('🎉 Workflow completed successfully!');
    
  } catch (error: any) {
    addLog(`❌ Workflow failed: ${error.message}`);
  } finally {
    setIsExecuting(false);
  }
};
```

### Step 3: Integrate ArcMemo

```typescript
// Before workflow execution
const concepts = await fetch('/api/arcmemo', {
  method: 'POST',
  body: JSON.stringify({
    action: 'retrieve',
    query: { userRequest: workflowGoal, domain }
  })
}).then(r => r.json());

// Enrich first node with concepts
if (concepts.concepts.length > 0) {
  addLog(`💡 Applied ${concepts.concepts.length} learned concepts`);
}

// After successful workflow
await fetch('/api/arcmemo', {
  method: 'POST',
  body: JSON.stringify({
    action: 'abstract',
    workflow: {
      name: workflowName,
      domain,
      nodes,
      results: workflowResults,
      userQuery: workflowGoal
    }
  })
});
```

## Benefits

✅ **Universal**: Works with ANY node configuration
✅ **Maintainable**: No more switch-case hell
✅ **Extensible**: Add new nodes by just adding API endpoints
✅ **Intelligent**: Uses all our optimization systems
✅ **Clean**: Strips markdown consistently
✅ **Learning**: Integrates ArcMemo for continuous improvement

## Migration Path

1. Create `frontend/lib/workflow-executor.ts` with universal functions
2. Replace switch-case in `executeWorkflow` with universal executor
3. Test with existing workflows
4. Enable ArcMemo integration
5. Remove old hardcoded logic

---

**This is the workflow system we should have built from the start!** 🚀

