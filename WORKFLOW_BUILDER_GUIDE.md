# 🎯 AI Workflow Builder Guide

Visual workflow builder integrating your Memory System, GEPA Optimization, and Multi-Model Routing using [AI SDK Elements](https://ai-sdk.dev/elements/examples/workflow).

## 🚀 What's New

We've added a **visual workflow builder** that lets you:
- ✅ **Design AI workflows visually** - Drag & drop nodes to build complex AI pipelines
- ✅ **Integrate with your stack** - Memory search, GEPA, model routing, all in one flow
- ✅ **Real-time execution** - Watch data flow through your workflow
- ✅ **Export/Import** - Save and share workflows as JSON

## 📍 Access the Workflow Builder

Navigate to: **`http://localhost:3000/workflow`**

## 🏗️ Architecture

### Pre-Built Workflow Nodes

Your workflow includes these integrated nodes:

```
🎯 User Query → 🧠 Memory Search ↘
                                    📦 Context Assembly → 🤖 Model Router → ⚡ GEPA Optimize → ✅ AI Response
                🌐 Web Search    ↗
```

#### 1. **🎯 User Query (Trigger)**
- **What:** Workflow entry point
- **Input:** User question/prompt
- **Output:** Query string

#### 2. **🧠 Memory Search**
- **What:** Vector similarity search in indexed memories
- **API:** `/api/search/indexed`
- **Features:**
  - Searches vector embeddings (1536 dimensions)
  - Threshold-based filtering (default: 0.8)
  - Returns top N relevant memories
- **Output:** Array of relevant memories

#### 3. **🌐 Live Web Search**
- **What:** Real-time web search via Perplexity
- **API:** `/api/perplexity/chat`
- **Features:**
  - Live internet search
  - Recency filtering
  - Citation tracking
- **Output:** Array of web results

#### 4. **📦 Context Assembly**
- **What:** Merge and deduplicate results from all sources
- **API:** `/api/context/assemble`
- **Features:**
  - Combines indexed + live results
  - Deduplication
  - Relevance ranking
  - Merge strategies (hybrid, indexed-first, live-first)
- **Output:** Unified context array

#### 5. **🤖 Model Router**
- **What:** Smart AI model selection based on query type
- **API:** `/api/answer`
- **Auto-Selection Logic:**
  - **Math queries** → `o1-mini` (reasoning specialist)
  - **Code queries** → `gpt-4o` (programming expert)
  - **Scientific** → `claude-3-sonnet` (deep reasoning)
  - **General** → `claude-3-haiku` (fast responses)
- **Output:** Selected model + rationale

#### 6. **⚡ GEPA Optimize**
- **What:** Prompt evolution and optimization
- **API:** `/api/gepa/optimize`
- **Features:**
  - Iterative prompt refinement
  - Performance tracking
  - Context-aware optimization
- **Output:** Optimized prompt + metrics

#### 7. **✅ AI Response**
- **What:** Final answer generation
- **Features:**
  - Uses selected model
  - Optimized prompt
  - Full context
  - Quality scoring
- **Output:** Final AI response

## 🎨 Visual Components

### Node Structure

Each node uses the compound component pattern:

```typescript
<Node handles={{ target: true, source: true }}>
  <NodeHeader>
    <NodeTitle>Memory Search</NodeTitle>
    <NodeDescription>Vector similarity search</NodeDescription>
  </NodeHeader>
  <NodeContent>
    <p>Searching indexed memories...</p>
  </NodeContent>
  <NodeFooter>
    <p>API: /api/search/indexed | ~150ms</p>
  </NodeFooter>
  <Toolbar>
    <Button>Configure</Button>
    <Button>Inspect</Button>
  </Toolbar>
</Node>
```

### Edge Types

**1. Animated Edges** (Active data flow):
```typescript
{
  type: 'animated',
  source: 'nodeA',
  target: 'nodeB'
}
```

**2. Temporary Edges** (Conditional/error paths):
```typescript
{
  type: 'temporary',
  source: 'nodeA',
  target: 'nodeB'
}
```

## 🔧 Customization

### Adding Custom Nodes

Create a new node type:

```typescript
const customNode = {
  id: 'customNode',
  type: 'aiWorkflow',
  position: { x: 500, y: 300 },
  data: {
    label: '🔥 Custom Node',
    description: 'Your custom logic',
    handles: { target: true, source: true },
    content: 'Node content here...',
    footer: 'Status: Ready',
    icon: '🔥',
  },
};

setNodes((nds) => [...nds, customNode]);
```

### Connecting to Your APIs

Execute a workflow programmatically:

```typescript
const executeWorkflow = async (userQuery: string) => {
  // 1. Memory Search
  const memoryResults = await fetch('/api/search/indexed', {
    method: 'POST',
    body: JSON.stringify({
      query: userQuery,
      userId: user.id,
      matchThreshold: 0.8,
    }),
  });

  // 2. Web Search (parallel)
  const webResults = await fetch('/api/perplexity/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'user', content: userQuery }],
    }),
  });

  // 3. Assemble Context
  const context = await fetch('/api/context/assemble', {
    method: 'POST',
    body: JSON.stringify({
      sources: [
        await memoryResults.json(),
        await webResults.json(),
      ],
    }),
  });

  // 4. Route to Model
  const modelSelection = await fetch('/api/answer', {
    method: 'POST',
    body: JSON.stringify({
      query: userQuery,
      autoSelectModel: true,
    }),
  });

  // 5. GEPA Optimize
  const optimized = await fetch('/api/gepa/optimize', {
    method: 'POST',
    body: JSON.stringify({
      prompt: userQuery,
      context: await context.json(),
    }),
  });

  // 6. Generate Response
  const response = await fetch('/api/answer', {
    method: 'POST',
    body: JSON.stringify({
      query: await optimized.json(),
      documents: await context.json(),
    }),
  });

  return response.json();
};
```

## 🎯 Use Cases

### 1. Research Assistant Workflow

```
User Query → Memory Search (papers) → Web Search (latest) → Context → Answer
```

**Example:**
```typescript
const researchWorkflow = {
  nodes: [
    { id: 'query', data: { label: 'Research Question' } },
    { id: 'papers', data: { label: 'Search Papers', collection: 'research' } },
    { id: 'web', data: { label: 'Latest News' } },
    { id: 'synthesize', data: { label: 'Synthesize Answer' } },
  ],
  edges: [
    { source: 'query', target: 'papers' },
    { source: 'query', target: 'web' },
    { source: 'papers', target: 'synthesize' },
    { source: 'web', target: 'synthesize' },
  ],
};
```

### 2. Code Documentation Workflow

```
Code Query → Memory Search (snippets) → Model Router (GPT-4o) → GEPA → Code Answer
```

### 3. Customer Support Workflow

```
Support Query → Memory Search (KB) → Decision Node → [Found: Quick Answer | Not Found: Escalate]
```

## 🚀 Advanced Features

### Dynamic Node Creation

Add nodes based on runtime conditions:

```typescript
const addConditionalNode = (condition: boolean) => {
  if (condition) {
    const newNode = {
      id: `dynamic-${Date.now()}`,
      type: 'aiWorkflow',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        label: 'Dynamic Node',
        description: 'Created at runtime',
        // ... other data
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  }
};
```

### Workflow Templates

Save and load workflow templates:

```typescript
// Save workflow
const saveWorkflow = () => {
  const workflow = { nodes, edges };
  localStorage.setItem('workflow-template', JSON.stringify(workflow));
};

// Load workflow
const loadWorkflow = () => {
  const saved = localStorage.getItem('workflow-template');
  if (saved) {
    const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
    setNodes(savedNodes);
    setEdges(savedEdges);
  }
};
```

### Real-Time Execution Visualization

Animate nodes as they execute:

```typescript
const executeWithVisualization = async () => {
  for (const node of nodes) {
    // Highlight current node
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id
          ? { ...n, data: { ...n.data, status: 'executing' } }
          : n
      )
    );

    // Execute node logic
    await executeNode(node);

    // Mark as complete
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id
          ? { ...n, data: { ...n.data, status: 'complete' } }
          : n
      )
    );
  }
};
```

## 🎨 Styling

### Custom Node Styles

Override default styles:

```typescript
const customNodeTypes = {
  aiWorkflow: ({ data }) => (
    <Node 
      handles={data.handles}
      className="border-2 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50"
    >
      {/* ... node content */}
    </Node>
  ),
};
```

### Custom Edge Styles

```typescript
const customEdgeTypes = {
  success: (props) => (
    <BaseEdge
      {...props}
      style={{
        stroke: 'green',
        strokeWidth: 3,
      }}
    />
  ),
  error: (props) => (
    <BaseEdge
      {...props}
      style={{
        stroke: 'red',
        strokeWidth: 3,
        strokeDasharray: '5, 5',
      }}
    />
  ),
};
```

## 📊 Analytics

Track workflow performance:

```typescript
const trackWorkflowMetrics = async (workflowId: string) => {
  const metrics = {
    workflowId,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    executionTime: 0,
    nodeMetrics: [],
  };

  const startTime = Date.now();

  for (const node of nodes) {
    const nodeStart = Date.now();
    await executeNode(node);
    const nodeEnd = Date.now();

    metrics.nodeMetrics.push({
      nodeId: node.id,
      executionTime: nodeEnd - nodeStart,
    });
  }

  metrics.executionTime = Date.now() - startTime;

  // Save to analytics
  await fetch('/api/analytics/workflow', {
    method: 'POST',
    body: JSON.stringify(metrics),
  });
};
```

## 🔗 Integration with AI SDK Elements

This workflow builder is built using [Vercel AI SDK Elements](https://ai-sdk.dev/elements/examples/workflow), providing:

- **React Flow** - Powerful workflow visualization
- **AI Elements** - Pre-built AI components (Node, Edge, Canvas, etc.)
- **Full Customization** - Extend with your own logic
- **Production Ready** - Built for scale

## 📚 Resources

- **AI SDK Workflow Docs:** https://ai-sdk.dev/elements/examples/workflow
- **React Flow Docs:** https://reactflow.dev/
- **Your Memory System:** `MEMORY_SYSTEM_GUIDE.md`
- **GEPA Integration:** `backend/src/core/gepa_optimizer.py`

## 🎯 Quick Start

1. **Navigate to workflow:**
   ```bash
   http://localhost:3000/workflow
   ```

2. **Explore the default workflow:**
   - See how query flows through memory search → web search → context assembly → model routing → GEPA optimization → response

3. **Customize nodes:**
   - Click nodes to see toolbar
   - Configure, inspect, or delete nodes
   - Drag to reposition

4. **Execute workflow:**
   - Click "▶️ Run Workflow"
   - Watch animated data flow
   - See execution metrics

5. **Export workflow:**
   - Click "💾 Export"
   - Save as JSON
   - Share or version control

---

**🎉 You now have a visual AI workflow builder integrated with your entire stack!**

Built with: AI SDK Elements + React Flow + Your Memory System + GEPA + Multi-Model Routing 🚀

