# Testing Extended Intelligence Metrics in Workflows

## Quick Test Commands

### Test 1: Simple Library Test (Fastest)
Tests the core metrics tracking functionality:

```bash
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo
npx tsx test-workflow-simple.ts
```

**Expected Output:**
```
✅ Workflow Metrics:
   Quality: 0.0%
   Nodes: 1/2

✅ Context Quality:
   Overall: 74.5%

✅ Test Passed!
```

### Test 2: Comprehensive Library Test
Tests all metrics features end-to-end:

```bash
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo
npx tsx test-workflow-metrics.ts
```

**Expected Output:**
- ✅ Workflow metrics tracking
- ✅ Context quality dashboard
- ✅ Extended intelligence metrics aggregation
- ✅ Workflow metrics retrieval
- ✅ Metrics tracker node execution

### Test 3: API Integration Test (Requires Server)
Tests the workflow execution API with metrics:

```bash
# Make sure server is running on localhost:3000
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo
npx tsx test-workflow-api.ts
```

**Expected Output:**
- ✅ Workflow execution with metrics
- ✅ Metrics API retrieval
- ✅ Metrics tracker node execution
- ✅ Context metrics API

## Manual Testing via API

### 1. Execute a Workflow

```bash
curl -X POST http://localhost:3000/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
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
          "apiEndpoint": "/api/answer"
        }
      }
    ],
    "edges": [
      { "source": "memory-search", "target": "answer" }
    ],
    "initialData": {
      "query": "What is climate change?",
      "workflowName": "Test Workflow"
    }
  }'
```

**Check response for `metrics.extendedIntelligence`**

### 2. Get Workflow Metrics

```bash
# Get all workflow metrics
curl "http://localhost:3000/api/workflow/metrics?all=true"

# Get specific workflow (use workflowId from execution response)
curl "http://localhost:3000/api/workflow/metrics?workflowId=workflow-1234567890"
```

### 3. Get Context Metrics

```bash
# Extended intelligence metrics
curl "http://localhost:3000/api/context-metrics?endpoint=extended-intelligence&timeWindow=3600000"

# Quality dashboard
curl "http://localhost:3000/api/context-metrics?endpoint=quality-dashboard&timeWindow=3600000"
```

## Test Scenarios

### Scenario 1: Basic Workflow Execution

**Test**: Execute a simple workflow and verify metrics are tracked.

**Steps:**
1. Execute workflow with 2-3 nodes
2. Check response for `metrics.extendedIntelligence`
3. Verify `workflowQuality` is calculated

**Expected**: Metrics should be present in response.

### Scenario 2: Metrics Tracker Node

**Test**: Add metrics tracker node to workflow.

**Steps:**
1. Create workflow with `metricsTracker` node
2. Configure with `trackContextQuality: true`
3. Execute workflow
4. Verify metrics are recorded

**Expected**: Metrics tracker node executes and records quality metrics.

### Scenario 3: Agent Comparison

**Test**: Compare agent-only vs context-enhanced answers.

**Steps:**
1. Create workflow with `metricsTracker` node
2. Configure with `enableAgentComparison: true`
3. Ensure workflow produces `finalAnswer`
4. Execute workflow
5. Check metrics for agent vs context contribution

**Expected**: Metrics show agent contribution and context improvement.

### Scenario 4: Multiple Workflows

**Test**: Track metrics across multiple workflows.

**Steps:**
1. Execute 3-5 different workflows
2. Get all metrics: `GET /api/workflow/metrics?all=true`
3. Check aggregate statistics

**Expected**: Aggregate metrics show average across all workflows.

### Scenario 5: Context Quality Trends

**Test**: Monitor context quality over time.

**Steps:**
1. Execute multiple workflows with context
2. Record quality metrics after each
3. Get quality dashboard: `GET /api/context-metrics?endpoint=quality-dashboard`
4. Check trends (improving/stable/declining)

**Expected**: Trends show quality changes over time.

## Test Results Interpretation

### Good Metrics
- **Workflow Quality > 0.7**: High quality workflow
- **Intelligence Extension > 0.2**: Context is significantly extending intelligence
- **Context Contribution > 0.15**: Context is providing meaningful improvement
- **Quality Trends = "improving"**: System is getting better

### Warning Signs
- **Workflow Quality < 0.5**: Low quality, needs optimization
- **Intelligence Extension < 0.1**: Context not contributing much
- **Context Efficiency < 0.3**: Context is inefficient (too many tokens)
- **Quality Trends = "declining"**: System quality degrading

### Debugging

If metrics are not appearing:

1. **Check node execution**: Ensure nodes produce `finalAnswer` or `context`
2. **Check workflow ID**: Ensure `workflowId` is set in `initialData`
3. **Check API response**: Look for `metrics.extendedIntelligence` in response
4. **Check server logs**: Look for metrics tracking errors

## Example Test Output

```
📈 Workflow Metrics Results:
   Workflow: Test Workflow
   Total Nodes: 3
   Executed Nodes: 3
   Execution Time: 3200ms

   Overall Metrics:
   - Avg Agent Contribution: 65.0%
   - Avg Context Contribution: 23.0%
   - Avg Extended Intelligence: 88.0%
   - Avg Intelligence Extension: 28.0%
   - Workflow Quality: 88.0%

   Per-Node Metrics:
   Node 1: Memory Search
     - Extended Intelligence: 0.0%
     - Intelligence Extension: 0.0%
   Node 2: Context Assembly
     - Extended Intelligence: 0.0%
     - Intelligence Extension: 0.0%
   Node 3: Generate Answer
     - Extended Intelligence: 88.0%
     - Intelligence Extension: 28.0%
```

## Integration with CI/CD

Add to your test suite:

```bash
# In package.json
{
  "scripts": {
    "test:workflow-metrics": "tsx test-workflow-metrics.ts",
    "test:workflow-api": "tsx test-workflow-api.ts"
  }
}
```

Run in CI:
```bash
npm run test:workflow-metrics
```

## Troubleshooting

### Issue: Metrics not appearing in workflow response

**Solution**: Ensure nodes produce `finalAnswer` or `context` in their results.

### Issue: Metrics tracker node fails

**Solution**: Check that `workflowId` is set in `workflowData`.

### Issue: API returns 404 for metrics

**Solution**: Ensure workflow has been executed at least once before querying metrics.

### Issue: Agent comparison not working

**Solution**: Ensure Ollama is running and `OLLAMA_BASE_URL` is set correctly.

## Next Steps

1. Run `test-workflow-simple.ts` to verify basic functionality
2. Run `test-workflow-metrics.ts` for comprehensive testing
3. Test with real workflows via API
4. Monitor metrics over time to identify optimization opportunities

