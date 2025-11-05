/**
 * Simple Workflow Metrics Test
 * 
 * Quick test to verify workflow metrics are working.
 */

import { workflowMetricsTracker } from './frontend/lib/workflow-metrics-integration';
import { contextQualityDashboard } from './frontend/lib/context-quality-dashboard';

async function simpleTest() {
  console.log('🧪 Simple Workflow Metrics Test\n');
  
  // 1. Start workflow
  const workflowId = `test-${Date.now()}`;
  workflowMetricsTracker.startWorkflow(workflowId, 'Simple Test', 2);
  
  // 2. Track a node
  await workflowMetricsTracker.trackNodeMetrics(
    workflowId,
    'node-1',
    'Test Node',
    'test',
    {
      query: 'Test query',
      domain: 'general',
      agent: 'test',
      contextQuality: {
        relevance: 0.8,
        coherence: 0.7,
        completeness: 0.9,
        efficiency: 0.6,
        freshness: 0.8,
        diversity: 0.7,
      },
    }
  );
  
  // 3. Record quality
  contextQualityDashboard.recordQuality({
    relevance: 0.8,
    coherence: 0.7,
    completeness: 0.9,
    efficiency: 0.6,
    freshness: 0.8,
    diversity: 0.7,
  });
  
  // 4. Get metrics
  const metrics = workflowMetricsTracker.endWorkflow(workflowId);
  const dashboard = contextQualityDashboard.getDashboardData();
  
  console.log('✅ Workflow Metrics:');
  console.log(`   Quality: ${(metrics.overallMetrics.workflowQuality * 100).toFixed(1)}%`);
  console.log(`   Nodes: ${metrics.executedNodes}/${metrics.totalNodes}`);
  
  console.log('\n✅ Context Quality:');
  console.log(`   Overall: ${(dashboard.summary.overallQuality * 100).toFixed(1)}%`);
  
  console.log('\n✅ Test Passed!');
  process.exit(0);
}

simpleTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

