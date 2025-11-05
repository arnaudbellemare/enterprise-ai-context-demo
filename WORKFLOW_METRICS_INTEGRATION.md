# Extended Intelligence Metrics Integration for Workflows

## Overview

Extended intelligence metrics can be integrated into workflows to track agent+context intelligence at each workflow step. This enables:
- **Per-node metrics**: Track intelligence extension at each workflow node
- **Workflow-level metrics**: Aggregate metrics across the entire workflow
- **Context quality tracking**: Monitor context quality throughout workflow execution
- **A/B testing**: Compare different workflow configurations

## Integration Methods

### Method 1: Add Metrics Tracker Node

Add a "Metrics Tracker" node to your workflow to track metrics at specific points.

**Example Workflow:**
```json
{
  "nodes": [
    {
      "id": "memory-search",
      "type": "memorySearch",
      "label": "Memory Search",
      "apiEndpoint": "/api/memory/search"
    },
    {
      "id": "context-assembly",
      "type": "contextAssembly",
      "label": "Context Assembly",
      "apiEndpoint": "/api/context/assemble"
    },
    {
      "id": "metrics-tracker-1",
      "type": "metricsTracker",
      "label": "Track Context Quality",
      "config": {
        "trackContextQuality": true,
        "domain": "general"
      }
    },
    {
      "id": "answer",
      "type": "answer",
      "label": "Generate Answer",
      "apiEndpoint": "/api/agent/chat"
    },
    {
      "id": "metrics-tracker-2",
      "type": "metricsTracker",
      "label": "Track Extended Intelligence",
      "config": {
        "enableAgentComparison": true,
        "trackContextQuality": true,
        "domain": "general",
        "agent": "gemma3:4b"
      }
    }
  ],
  "edges": [
    { "source": "memory-search", "target": "context-assembly" },
    { "source": "context-assembly", "target": "metrics-tracker-1" },
    { "source": "metrics-tracker-1", "target": "answer" },
    { "source": "answer", "target": "metrics-tracker-2" }
  ]
}
```

### Method 2: Integrate into Workflow Execution

Modify the workflow execution engine to automatically track metrics.

**Modified `/api/workflow/execute/route.ts`:**

```typescript
import { workflowMetricsTracker } from '@/lib/workflow-metrics-integration';

export async function POST(req: NextRequest) {
  const { nodes, edges, configs, userId, initialData } = await req.json();
  
  const workflowId = `workflow-${Date.now()}`;
  const workflowName = initialData.workflowName || 'Custom Workflow';
  
  // Start tracking
  workflowMetricsTracker.startWorkflow(workflowId, workflowName, nodes.length);
  
  const executionOrder = getTopologicalOrder(nodes, edges);
  let workflowData = { workflowId, userId, ...initialData };
  
  for (const nodeId of executionOrder) {
    const node = nodes.find((n: any) => n.id === nodeId);
    const nodeConfig = configs[nodeId] || {};
    
    // Execute node
    const result = await executeNode(node, workflowData, nodeConfig);
    workflowData = { ...workflowData, ...result };
    
    // Track metrics if node has context/answer
    if (node.data.id === 'metricsTracker') {
      await executeMetricsTrackerNode(nodeConfig, workflowData);
    } else if (result.finalAnswer || result.context) {
      // Auto-track metrics for nodes that produce answers/context
      await workflowMetricsTracker.trackNodeMetrics(
        workflowId,
        nodeId,
        node.data.label,
        node.data.id,
        {
          query: workflowData.query || '',
          domain: nodeConfig.domain || 'general',
          agent: nodeConfig.agent || 'unknown',
          contextAnswer: result.finalAnswer,
          contextQuality: result.contextQuality,
          contextTokens: estimateTokens(result.context || []),
          sessionId: workflowId,
        }
      );
    }
  }
  
  // End tracking
  const metrics = workflowMetricsTracker.endWorkflow(workflowId);
  
  return NextResponse.json({
    success: true,
    executionLog,
    finalData: workflowData,
    metrics: {
      ...existingMetrics,
      extendedIntelligence: metrics.overallMetrics,
      nodeMetrics: metrics.nodeMetrics,
    },
  });
}
```

### Method 3: Workflow Template with Metrics

Create a workflow template that includes metrics tracking by default.

**Example Template:**
```typescript
export function createWorkflowWithMetrics(
  name: string,
  nodes: any[],
  edges: any[]
): any {
  // Add metrics tracker nodes at key points
  const metricsNodes = [
    {
      id: 'metrics-start',
      type: 'metricsTracker',
      label: 'Workflow Start Metrics',
      config: { trackContextQuality: true },
    },
    {
      id: 'metrics-end',
      type: 'metricsTracker',
      label: 'Workflow End Metrics',
      config: {
        enableAgentComparison: true,
        trackContextQuality: true,
      },
    },
  ];
  
  const allNodes = [...nodes, ...metricsNodes];
  const allEdges = [
    ...edges,
    { source: nodes[0].id, target: 'metrics-start' },
    { source: nodes[nodes.length - 1].id, target: 'metrics-end' },
  ];
  
  return {
    name,
    nodes: allNodes,
    edges: allEdges,
  };
}
```

## Usage Examples

### Example 1: Basic Workflow with Metrics

```typescript
import { workflowMetricsTracker } from '@/lib/workflow-metrics-integration';

// Create workflow
const workflowId = 'my-workflow';
workflowMetricsTracker.startWorkflow(workflowId, 'My Workflow', 3);

// Execute nodes
for (const node of nodes) {
  const result = await executeNode(node);
  
  // Track metrics after each node
  if (result.context || result.answer) {
    await workflowMetricsTracker.trackNodeMetrics(
      workflowId,
      node.id,
      node.label,
      node.type,
      {
        query: workflowData.query,
        domain: 'general',
        agent: 'gemma3:4b',
        contextAnswer: result.answer,
        contextQuality: result.contextQuality,
      }
    );
  }
}

// Get final metrics
const metrics = workflowMetricsTracker.endWorkflow(workflowId);
console.log('Workflow Quality:', metrics.overallMetrics.workflowQuality);
console.log('Intelligence Extension:', metrics.overallMetrics.avgIntelligenceExtension);
```

### Example 2: A/B Testing Workflows

```typescript
import { contextABTesting } from '@/lib/context-ab-testing';

// Test two workflow configurations
const configA = {
  nodes: [/* workflow A nodes */],
  config: { maxContextItems: 10 },
};

const configB = {
  nodes: [/* workflow B nodes */],
  config: { maxContextItems: 15 },
};

const testResult = await contextABTesting.runABTest({
  query: 'What is climate change?',
  domain: 'general',
  configurationA: {
    id: 'workflow-a',
    name: 'Workflow A',
    config: configA.config,
  },
  configurationB: {
    id: 'workflow-b',
    name: 'Workflow B',
    config: configB.config,
  },
  generateAnswer: async (query, context, config) => {
    // Execute workflow with config
    const result = await executeWorkflow(config.nodes, config);
    return {
      answer: result.finalAnswer,
      contextTokens: estimateTokens(result.context),
      agentTokens: estimateTokens(result.finalAnswer),
      latency: result.executionTime,
    };
  },
});

console.log('Winner:', testResult.winner);
console.log('Improvement:', testResult.improvement, '%');
```

### Example 3: Workflow Quality Dashboard

```typescript
import { workflowMetricsTracker } from '@/lib/workflow-metrics-integration';

// Get all workflow metrics
const allMetrics = workflowMetricsTracker.getAllWorkflowMetrics();

// Calculate aggregate statistics
const avgWorkflowQuality = allMetrics.reduce(
  (sum, m) => sum + m.overallMetrics.workflowQuality,
  0
) / allMetrics.length;

const avgIntelligenceExtension = allMetrics.reduce(
  (sum, m) => sum + m.overallMetrics.avgIntelligenceExtension,
  0
) / allMetrics.length;

console.log('Average Workflow Quality:', avgWorkflowQuality);
console.log('Average Intelligence Extension:', avgIntelligenceExtension);

// Find best performing workflows
const bestWorkflows = allMetrics
  .sort((a, b) => b.overallMetrics.workflowQuality - a.overallMetrics.workflowQuality)
  .slice(0, 5);

console.log('Top 5 Workflows:', bestWorkflows.map(w => ({
  name: w.workflowName,
  quality: w.overallMetrics.workflowQuality,
})));
```

## API Integration

### Get Workflow Metrics

```bash
# Get metrics for a specific workflow
GET /api/workflow/metrics?workflowId=workflow-123

# Get all workflow metrics
GET /api/workflow/metrics?all=true
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "workflowId": "workflow-123",
    "workflowName": "My Workflow",
    "overallMetrics": {
      "avgAgentContribution": 0.65,
      "avgContextContribution": 0.23,
      "avgExtendedIntelligence": 0.88,
      "avgIntelligenceExtension": 0.28,
      "workflowQuality": 0.88
    },
    "nodeMetrics": [
      {
        "nodeId": "memory-search",
        "nodeName": "Memory Search",
        "extendedIntelligence": 0.75,
        "intelligenceExtension": 0.15
      },
      {
        "nodeId": "answer",
        "nodeName": "Generate Answer",
        "extendedIntelligence": 0.92,
        "intelligenceExtension": 0.35
      }
    ],
    "executionTime": 3200
  }
}
```

## Benefits

1. **Workflow Optimization**: Identify which nodes contribute most to intelligence extension
2. **Quality Monitoring**: Track workflow quality over time
3. **A/B Testing**: Compare different workflow configurations
4. **Context Optimization**: Identify where context quality can be improved
5. **Performance Analysis**: Understand agent vs context contribution at each step

## Next Steps

1. **Add Metrics API Endpoint**: Create `/api/workflow/metrics` endpoint
2. **Workflow Builder Integration**: Add metrics tracker node to workflow builder UI
3. **Dashboard Visualization**: Create dashboard showing workflow metrics
4. **Automated Optimization**: Use metrics to automatically optimize workflow configurations

