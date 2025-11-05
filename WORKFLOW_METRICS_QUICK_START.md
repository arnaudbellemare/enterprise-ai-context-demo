# Workflow Metrics Integration - Quick Start

## ✅ What's Integrated

Extended intelligence metrics are now **automatically integrated** into workflow execution:

1. **Automatic Tracking**: Metrics are tracked automatically for nodes that produce answers/context
2. **Metrics Tracker Node**: Add a `metricsTracker` node to your workflow for explicit tracking
3. **API Endpoints**: Access workflow metrics via `/api/workflow/metrics`

## 🚀 Quick Example

### Example 1: Automatic Tracking (No Configuration Needed)

Just execute your workflow normally - metrics are tracked automatically:

```typescript
// POST /api/workflow/execute
{
  "nodes": [
    {
      "id": "memory-search",
      "data": {
        "id": "memorySearch",
        "label": "Memory Search",
        "apiEndpoint": "/api/memory/search"
      }
    },
    {
      "id": "answer",
      "data": {
        "id": "answer",
        "label": "Generate Answer",
        "apiEndpoint": "/api/agent/chat"
      }
    }
  ],
  "edges": [
    { "source": "memory-search", "target": "answer" }
  ],
  "initialData": {
    "query": "What is climate change?",
    "workflowName": "Climate Change Research"
  }
}
```

**Response includes metrics:**
```json
{
  "success": true,
  "finalData": { ... },
  "metrics": {
    "totalNodes": 2,
    "executionTime": 3200,
    "extendedIntelligence": {
      "avgAgentContribution": 0.65,
      "avgContextContribution": 0.23,
      "avgExtendedIntelligence": 0.88,
      "avgIntelligenceExtension": 0.28,
      "workflowQuality": 0.88
    },
    "nodeMetrics": [
      {
        "nodeId": "answer",
        "nodeName": "Generate Answer",
        "extendedIntelligence": 0.88,
        "intelligenceExtension": 0.28
      }
    ]
  }
}
```

### Example 2: Add Metrics Tracker Node

Add explicit metrics tracking at specific points:

```json
{
  "nodes": [
    {
      "id": "context-assembly",
      "data": {
        "id": "contextAssembly",
        "label": "Context Assembly"
      }
    },
    {
      "id": "metrics-tracker",
      "data": {
        "id": "metricsTracker",
        "label": "Track Context Quality"
      },
      "config": {
        "trackContextQuality": true,
        "domain": "general"
      }
    },
    {
      "id": "answer",
      "data": {
        "id": "answer",
        "label": "Generate Answer"
      }
    },
    {
      "id": "metrics-final",
      "data": {
        "id": "metricsTracker",
        "label": "Track Extended Intelligence"
      },
      "config": {
        "enableAgentComparison": true,
        "trackContextQuality": true,
        "domain": "general",
        "agent": "gemma3:4b"
      }
    }
  ],
  "edges": [
    { "source": "context-assembly", "target": "metrics-tracker" },
    { "source": "metrics-tracker", "target": "answer" },
    { "source": "answer", "target": "metrics-final" }
  ]
}
```

## 📊 Access Metrics

### Get Workflow Metrics

```bash
# Get metrics for specific workflow
GET /api/workflow/metrics?workflowId=workflow-1234567890

# Get all workflow metrics
GET /api/workflow/metrics?all=true
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "workflowId": "workflow-1234567890",
    "workflowName": "Climate Change Research",
    "overallMetrics": {
      "avgAgentContribution": 0.65,
      "avgContextContribution": 0.23,
      "avgExtendedIntelligence": 0.88,
      "avgIntelligenceExtension": 0.28,
      "workflowQuality": 0.88
    },
    "nodeMetrics": [
      {
        "nodeId": "answer",
        "nodeName": "Generate Answer",
        "agentContribution": 0.65,
        "contextContribution": 0.23,
        "extendedIntelligence": 0.88,
        "intelligenceExtension": 0.28,
        "contextQuality": {
          "relevance": 0.92,
          "coherence": 0.85,
          "efficiency": 0.72
        }
      }
    ],
    "executionTime": 3200
  }
}
```

## 🎯 Use Cases

### 1. Monitor Workflow Quality

```typescript
// After executing workflow
const response = await fetch('/api/workflow/execute', { ... });
const result = await response.json();

console.log('Workflow Quality:', result.metrics.extendedIntelligence.workflowQuality);
console.log('Intelligence Extension:', result.metrics.extendedIntelligence.avgIntelligenceExtension);
```

### 2. Identify Best Performing Nodes

```typescript
const metricsResponse = await fetch('/api/workflow/metrics?workflowId=workflow-123');
const { metrics } = await metricsResponse.json();

// Find node with highest intelligence extension
const bestNode = metrics.nodeMetrics.reduce((best, node) => 
  node.intelligenceExtension > best.intelligenceExtension ? node : best
);

console.log('Best Node:', bestNode.nodeName);
console.log('Intelligence Extension:', bestNode.intelligenceExtension);
```

### 3. Compare Workflow Configurations

```typescript
import { contextABTesting } from '@/lib/context-ab-testing';

// Test two workflow configurations
const testResult = await contextABTesting.runABTest({
  query: 'What is climate change?',
  domain: 'general',
  configurationA: {
    id: 'workflow-a',
    name: 'Workflow A (10 context items)',
    config: { maxContextItems: 10 },
  },
  configurationB: {
    id: 'workflow-b',
    name: 'Workflow B (15 context items)',
    config: { maxContextItems: 15 },
  },
  generateAnswer: async (query, context, config) => {
    // Execute workflow with config
    const response = await fetch('/api/workflow/execute', {
      method: 'POST',
      body: JSON.stringify({
        nodes: buildWorkflowNodes(config),
        initialData: { query },
      }),
    });
    const result = await response.json();
    return {
      answer: result.finalData.finalAnswer,
      contextTokens: estimateTokens(result.finalData.context),
      agentTokens: estimateTokens(result.finalData.finalAnswer),
      latency: result.metrics.executionTime,
    };
  },
});
```

## 🔧 Configuration Options

### Metrics Tracker Node Config

```typescript
{
  "trackContextQuality": true,      // Track context quality metrics
  "enableAgentComparison": true,   // Generate agent-only answer for comparison
  "domain": "general",               // Domain for metrics
  "agent": "gemma3:4b"              // Agent model name
}
```

## 📈 Metrics Available

### Per-Node Metrics
- `agentContribution`: Baseline quality without context
- `contextContribution`: Quality improvement from context
- `extendedIntelligence`: Final quality (agent+context)
- `intelligenceExtension`: How much context extends intelligence
- `contextQuality`: Relevance, coherence, efficiency, etc.

### Workflow-Level Metrics
- `avgAgentContribution`: Average across all nodes
- `avgContextContribution`: Average context contribution
- `avgExtendedIntelligence`: Average extended intelligence
- `avgIntelligenceExtension`: Average intelligence extension
- `workflowQuality`: Overall workflow quality score

## 🎨 Integration in Workflow Builder UI

When building workflows in the UI, you can:

1. **Drag & Drop Metrics Tracker**: Add metrics tracking at any point
2. **View Metrics Panel**: See real-time metrics during execution
3. **Compare Workflows**: Compare metrics across different workflow configurations

## Next Steps

1. **Test in Your Workflows**: Add metrics tracker nodes to existing workflows
2. **Monitor Quality**: Check `/api/workflow/metrics` to see workflow performance
3. **Optimize**: Use metrics to identify which nodes need improvement
4. **A/B Test**: Compare different workflow configurations

That's it! Extended intelligence metrics are now integrated into your workflows. 🎉

