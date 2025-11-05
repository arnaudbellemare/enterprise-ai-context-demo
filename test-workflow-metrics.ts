/**
 * Test Extended Intelligence Metrics Integration in Workflows
 * 
 * Tests the workflow metrics tracking system end-to-end.
 */

import { workflowMetricsTracker, executeMetricsTrackerNode } from './frontend/lib/workflow-metrics-integration';
import { extendedIntelligenceMetrics } from './frontend/lib/extended-intelligence-metrics';
import { contextQualityDashboard } from './frontend/lib/context-quality-dashboard';

const TIMEOUT_MS = 60000;

async function testWorkflowMetrics() {
  console.log('🧪 Testing Extended Intelligence Metrics Integration in Workflows\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Basic workflow metrics tracking
    console.log('\n📊 Test 1: Basic Workflow Metrics Tracking');
    console.log('-'.repeat(60));
    
    const workflowId = `test-workflow-${Date.now()}`;
    const workflowName = 'Test Workflow';
    
    workflowMetricsTracker.startWorkflow(workflowId, workflowName, 3);
    console.log(`✅ Started workflow tracking: ${workflowId}`);
    
    // Simulate workflow execution with node metrics
    const testQuery = 'What is the impact of climate change on agriculture?';
    
    // Track node 1: Memory Search
    await workflowMetricsTracker.trackNodeMetrics(
      workflowId,
      'node-1',
      'Memory Search',
      'memorySearch',
      {
        query: testQuery,
        domain: 'general',
        agent: 'gemma3:4b',
        contextQuality: {
          relevance: 0.85,
          coherence: 0.75,
          completeness: 0.80,
          efficiency: 0.70,
          freshness: 0.90,
          diversity: 0.65,
        },
      }
    );
    console.log('✅ Tracked node 1: Memory Search');
    
    // Track node 2: Context Assembly
    await workflowMetricsTracker.trackNodeMetrics(
      workflowId,
      'node-2',
      'Context Assembly',
      'contextAssembly',
      {
        query: testQuery,
        domain: 'general',
        agent: 'gemma3:4b',
        contextQuality: {
          relevance: 0.90,
          coherence: 0.80,
          completeness: 0.85,
          efficiency: 0.75,
          freshness: 0.95,
          diversity: 0.70,
        },
      }
    );
    console.log('✅ Tracked node 2: Context Assembly');
    
    // Track node 3: Answer Generation (with agent comparison)
    const agentOnlyAnswer = 'Climate change affects agriculture through temperature changes and precipitation patterns.';
    const contextEnhancedAnswer = 'Climate change significantly impacts agriculture through multiple mechanisms: 1) Temperature changes affect crop growth cycles and yields, 2) Altered precipitation patterns lead to droughts and floods, 3) Extreme weather events damage crops and infrastructure, 4) Pests and diseases expand their ranges. Research shows that global crop yields could decline by 10-25% by 2050 without adaptation measures.';
    
    await workflowMetricsTracker.trackNodeMetrics(
      workflowId,
      'node-3',
      'Generate Answer',
      'answer',
      {
        query: testQuery,
        domain: 'general',
        agent: 'gemma3:4b',
        agentAnswer: agentOnlyAnswer,
        contextAnswer: contextEnhancedAnswer,
        contextQuality: {
          relevance: 0.92,
          coherence: 0.85,
          completeness: 0.88,
          efficiency: 0.72,
          freshness: 0.95,
          diversity: 0.78,
        },
        agentQuality: {
          quality: 0.65,
          relevance: 0.70,
          coherence: 0.60,
          completeness: 0.55,
        },
        contextTokens: 1500,
        agentTokens: 600,
        sessionId: workflowId,
      }
    );
    console.log('✅ Tracked node 3: Generate Answer (with agent comparison)');
    
    // End workflow and get metrics
    const workflowMetrics = workflowMetricsTracker.endWorkflow(workflowId);
    
    console.log('\n📈 Workflow Metrics Results:');
    console.log(`   Workflow: ${workflowMetrics.workflowName}`);
    console.log(`   Total Nodes: ${workflowMetrics.totalNodes}`);
    console.log(`   Executed Nodes: ${workflowMetrics.executedNodes}`);
    console.log(`   Execution Time: ${workflowMetrics.executionTime}ms`);
    console.log(`\n   Overall Metrics:`);
    console.log(`   - Avg Agent Contribution: ${(workflowMetrics.overallMetrics.avgAgentContribution * 100).toFixed(1)}%`);
    console.log(`   - Avg Context Contribution: ${(workflowMetrics.overallMetrics.avgContextContribution * 100).toFixed(1)}%`);
    console.log(`   - Avg Extended Intelligence: ${(workflowMetrics.overallMetrics.avgExtendedIntelligence * 100).toFixed(1)}%`);
    console.log(`   - Avg Intelligence Extension: ${(workflowMetrics.overallMetrics.avgIntelligenceExtension * 100).toFixed(1)}%`);
    console.log(`   - Workflow Quality: ${(workflowMetrics.overallMetrics.workflowQuality * 100).toFixed(1)}%`);
    
    console.log(`\n   Per-Node Metrics:`);
    workflowMetrics.nodeMetrics.forEach((node, i) => {
      console.log(`   Node ${i + 1}: ${node.nodeName}`);
      console.log(`     - Extended Intelligence: ${(node.extendedIntelligence * 100).toFixed(1)}%`);
      console.log(`     - Intelligence Extension: ${(node.intelligenceExtension * 100).toFixed(1)}%`);
    });
    
    // Test 2: Context Quality Dashboard
    console.log('\n\n📊 Test 2: Context Quality Dashboard');
    console.log('-'.repeat(60));
    
    // Record some quality metrics
    contextQualityDashboard.recordQuality({
      relevance: 0.82,
      coherence: 0.75,
      completeness: 0.88,
      efficiency: 0.68,
      freshness: 0.91,
      diversity: 0.73,
    });
    
    contextQualityDashboard.recordQuality({
      relevance: 0.85,
      coherence: 0.78,
      completeness: 0.90,
      efficiency: 0.72,
      freshness: 0.93,
      diversity: 0.75,
    });
    
    const dashboard = contextQualityDashboard.getDashboardData();
    console.log('✅ Context Quality Dashboard:');
    console.log(`   Current Quality:`);
    console.log(`   - Relevance: ${(dashboard.current.relevance * 100).toFixed(1)}%`);
    console.log(`   - Coherence: ${(dashboard.current.coherence * 100).toFixed(1)}%`);
    console.log(`   - Efficiency: ${(dashboard.current.efficiency * 100).toFixed(1)}%`);
    console.log(`   - Overall: ${(dashboard.summary.overallQuality * 100).toFixed(1)}%`);
    
    if (dashboard.alerts.length > 0) {
      console.log(`\n   ⚠️  Alerts: ${dashboard.alerts.length}`);
      dashboard.alerts.forEach(alert => {
        console.log(`     - ${alert.message} (${alert.severity})`);
      });
    }
    
    if (dashboard.recommendations.length > 0) {
      console.log(`\n   💡 Recommendations: ${dashboard.recommendations.length}`);
      dashboard.recommendations.forEach(rec => {
        console.log(`     - ${rec}`);
      });
    }
    
    // Test 3: Extended Intelligence Metrics Aggregation
    console.log('\n\n📊 Test 3: Extended Intelligence Metrics Aggregation');
    console.log('-'.repeat(60));
    
    const aggregated = extendedIntelligenceMetrics.getAggregatedMetrics(3600000); // 1 hour
    console.log('✅ Aggregated Metrics:');
    console.log(`   Total Queries: ${aggregated.totalQueries}`);
    console.log(`   Avg Agent Contribution: ${(aggregated.avgAgentContribution * 100).toFixed(1)}%`);
    console.log(`   Avg Context Contribution: ${(aggregated.avgContextContribution * 100).toFixed(1)}%`);
    console.log(`   Avg Extended Intelligence: ${(aggregated.avgExtendedIntelligence * 100).toFixed(1)}%`);
    console.log(`   Avg Intelligence Extension: ${(aggregated.avgIntelligenceExtension * 100).toFixed(1)}%`);
    console.log(`   Context Efficiency: ${(aggregated.contextEfficiency * 100).toFixed(1)}%`);
    
    const trends = extendedIntelligenceMetrics.getContextQualityTrends();
    console.log(`\n   Quality Trends:`);
    console.log(`   - Relevance: ${trends.avgRelevance.toFixed(3)} (${trends.trends.relevance})`);
    console.log(`   - Coherence: ${trends.avgCoherence.toFixed(3)} (${trends.trends.coherence})`);
    console.log(`   - Efficiency: ${trends.avgEfficiency.toFixed(3)} (${trends.trends.efficiency})`);
    
    // Test 4: Get Workflow Metrics via API (simulated)
    console.log('\n\n📊 Test 4: Workflow Metrics Retrieval');
    console.log('-'.repeat(60));
    
    const retrievedMetrics = workflowMetricsTracker.getWorkflowMetrics(workflowId);
    if (retrievedMetrics) {
      console.log('✅ Retrieved workflow metrics:');
      console.log(`   Workflow: ${retrievedMetrics.workflowName}`);
      console.log(`   Quality: ${(retrievedMetrics.overallMetrics.workflowQuality * 100).toFixed(1)}%`);
      console.log(`   Nodes tracked: ${retrievedMetrics.nodeMetrics.length}`);
    }
    
    const allMetrics = workflowMetricsTracker.getAllWorkflowMetrics();
    console.log(`\n✅ Total workflows tracked: ${allMetrics.length}`);
    
    // Test 5: Metrics Tracker Node Execution
    console.log('\n\n📊 Test 5: Metrics Tracker Node Execution');
    console.log('-'.repeat(60));
    
    const testNodeWorkflowId = `test-node-${Date.now()}`;
    workflowMetricsTracker.startWorkflow(testNodeWorkflowId, 'Test Node Workflow', 1);
    
    const testWorkflowData = {
      workflowId: testNodeWorkflowId,
      query: testQuery,
      context: [
        { content: 'Climate change affects agriculture', source: 'web', type: 'fact' },
        { content: 'Temperature changes impact crop yields', source: 'memory', type: 'insight' },
      ],
    };
    
    const nodeResult = await executeMetricsTrackerNode(
      {
        trackContextQuality: true,
        domain: 'general',
      },
      testWorkflowData
    );
    
    console.log('✅ Metrics Tracker Node executed:');
    console.log(`   Metrics recorded: ${nodeResult.metricsRecorded}`);
    console.log(`   Workflow ID: ${nodeResult.workflowId}`);
    console.log(`   Node ID: ${nodeResult.nodeId}`);
    
    workflowMetricsTracker.endWorkflow(testNodeWorkflowId);
    
    console.log('\n\n✅ All Tests Passed!');
    console.log('='.repeat(60));
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Workflow metrics tracking');
    console.log('   ✅ Context quality dashboard');
    console.log('   ✅ Extended intelligence metrics aggregation');
    console.log('   ✅ Workflow metrics retrieval');
    console.log('   ✅ Metrics tracker node execution');
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Test Failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests with timeout
const testPromise = testWorkflowMetrics();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Test timeout')), TIMEOUT_MS)
);

Promise.race([testPromise, timeoutPromise]).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

