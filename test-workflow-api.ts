/**
 * Test Workflow Metrics API Integration
 * 
 * Tests the workflow execution API with metrics tracking.
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TIMEOUT_MS = 120000;

async function testWorkflowAPI() {
  console.log('🧪 Testing Workflow API with Extended Intelligence Metrics\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Execute workflow and check metrics
    console.log('\n📊 Test 1: Execute Workflow with Metrics');
    console.log('-'.repeat(60));
    
    const workflowRequest = {
      nodes: [
        {
          id: 'memory-search',
          data: {
            id: 'memorySearch',
            label: 'Memory Search',
            apiEndpoint: '/api/memory/search',
          },
        },
        {
          id: 'context-assembly',
          data: {
            id: 'contextAssembly',
            label: 'Context Assembly',
            apiEndpoint: '/api/context/assemble',
          },
        },
        {
          id: 'answer',
          data: {
            id: 'answer',
            label: 'Generate Answer',
            apiEndpoint: '/api/answer',
          },
        },
      ],
      edges: [
        { source: 'memory-search', target: 'context-assembly' },
        { source: 'context-assembly', target: 'answer' },
      ],
      initialData: {
        query: 'What is the impact of climate change on agriculture?',
        workflowName: 'Climate Change Research Workflow',
      },
    };
    
    console.log('📤 Executing workflow...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Workflow execution failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Workflow executed in ${executionTime}ms`);
    console.log(`\n📈 Workflow Metrics:`);
    console.log(`   Execution Time: ${result.metrics.executionTime}ms`);
    console.log(`   Successful Nodes: ${result.metrics.successfulNodes}`);
    console.log(`   Failed Nodes: ${result.metrics.failedNodes}`);
    
    if (result.metrics.extendedIntelligence) {
      console.log(`\n   Extended Intelligence Metrics:`);
      console.log(`   - Avg Agent Contribution: ${(result.metrics.extendedIntelligence.avgAgentContribution * 100).toFixed(1)}%`);
      console.log(`   - Avg Context Contribution: ${(result.metrics.extendedIntelligence.avgContextContribution * 100).toFixed(1)}%`);
      console.log(`   - Avg Extended Intelligence: ${(result.metrics.extendedIntelligence.avgExtendedIntelligence * 100).toFixed(1)}%`);
      console.log(`   - Avg Intelligence Extension: ${(result.metrics.extendedIntelligence.avgIntelligenceExtension * 100).toFixed(1)}%`);
      console.log(`   - Workflow Quality: ${(result.metrics.extendedIntelligence.workflowQuality * 100).toFixed(1)}%`);
      
      if (result.metrics.nodeMetrics && result.metrics.nodeMetrics.length > 0) {
        console.log(`\n   Node Metrics:`);
        result.metrics.nodeMetrics.forEach((node: any, i: number) => {
          console.log(`   ${i + 1}. ${node.nodeName}:`);
          console.log(`      - Extended Intelligence: ${(node.extendedIntelligence * 100).toFixed(1)}%`);
          console.log(`      - Intelligence Extension: ${(node.intelligenceExtension * 100).toFixed(1)}%`);
        });
      }
    } else {
      console.log('   ⚠️  Extended intelligence metrics not available (may need nodes that produce answers/context)');
    }
    
    // Test 2: Get workflow metrics via API
    console.log('\n\n📊 Test 2: Get Workflow Metrics via API');
    console.log('-'.repeat(60));
    
    // Wait a bit for metrics to be stored
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const metricsResponse = await fetch(`${API_URL}/api/workflow/metrics?all=true`);
    
    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json();
      console.log('✅ Retrieved workflow metrics:');
      console.log(`   Total Workflows: ${metricsData.aggregate?.totalWorkflows || metricsData.workflows?.length || 0}`);
      
      if (metricsData.aggregate) {
        console.log(`\n   Aggregate Statistics:`);
        console.log(`   - Avg Workflow Quality: ${(metricsData.aggregate.avgWorkflowQuality * 100).toFixed(1)}%`);
        console.log(`   - Avg Intelligence Extension: ${(metricsData.aggregate.avgIntelligenceExtension * 100).toFixed(1)}%`);
        console.log(`   - Avg Agent Contribution: ${(metricsData.aggregate.avgAgentContribution * 100).toFixed(1)}%`);
        console.log(`   - Avg Context Contribution: ${(metricsData.aggregate.avgContextContribution * 100).toFixed(1)}%`);
      }
    } else {
      console.log('   ⚠️  Metrics API not available (may need to wait for metrics to be stored)');
    }
    
    // Test 3: Test Metrics Tracker Node
    console.log('\n\n📊 Test 3: Metrics Tracker Node');
    console.log('-'.repeat(60));
    
    const metricsWorkflowRequest = {
      nodes: [
        {
          id: 'context-assembly',
          data: {
            id: 'contextAssembly',
            label: 'Context Assembly',
            apiEndpoint: '/api/context/assemble',
          },
        },
        {
          id: 'metrics-tracker',
          data: {
            id: 'metricsTracker',
            label: 'Track Context Quality',
          },
          config: {
            trackContextQuality: true,
            domain: 'general',
          },
        },
        {
          id: 'answer',
          data: {
            id: 'answer',
            label: 'Generate Answer',
            apiEndpoint: '/api/answer',
          },
        },
        {
          id: 'metrics-final',
          data: {
            id: 'metricsTracker',
            label: 'Track Extended Intelligence',
          },
          config: {
            enableAgentComparison: true,
            trackContextQuality: true,
            domain: 'general',
            agent: 'gemma3:4b',
          },
        },
      ],
      edges: [
        { source: 'context-assembly', target: 'metrics-tracker' },
        { source: 'metrics-tracker', target: 'answer' },
        { source: 'answer', target: 'metrics-final' },
      ],
      initialData: {
        query: 'What is machine learning?',
        workflowName: 'Metrics Test Workflow',
      },
    };
    
    console.log('📤 Executing workflow with metrics tracker nodes...');
    const metricsResponse2 = await fetch(`${API_URL}/api/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metricsWorkflowRequest),
    });
    
    if (metricsResponse2.ok) {
      const metricsResult = await metricsResponse2.json();
      console.log('✅ Workflow with metrics tracker executed');
      console.log(`   Nodes executed: ${metricsResult.metrics.successfulNodes}`);
      
      if (metricsResult.metrics.extendedIntelligence) {
        console.log(`   Workflow Quality: ${(metricsResult.metrics.extendedIntelligence.workflowQuality * 100).toFixed(1)}%`);
      }
    } else {
      const errorText = await metricsResponse2.text();
      console.log(`   ⚠️  Metrics tracker workflow failed: ${metricsResponse2.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
    }
    
    // Test 4: Context Metrics API
    console.log('\n\n📊 Test 4: Context Metrics API');
    console.log('-'.repeat(60));
    
    const contextMetricsResponse = await fetch(`${API_URL}/api/context-metrics?endpoint=extended-intelligence&timeWindow=3600000`);
    
    if (contextMetricsResponse.ok) {
      const contextMetrics = await contextMetricsResponse.json();
      console.log('✅ Context Metrics API:');
      if (contextMetrics.metrics) {
        console.log(`   Total Queries: ${contextMetrics.metrics.totalQueries}`);
        console.log(`   Avg Extended Intelligence: ${(contextMetrics.metrics.avgExtendedIntelligence * 100).toFixed(1)}%`);
        console.log(`   Avg Intelligence Extension: ${(contextMetrics.metrics.avgIntelligenceExtension * 100).toFixed(1)}%`);
      }
    } else {
      console.log('   ⚠️  Context metrics API not available');
    }
    
    const qualityDashboardResponse = await fetch(`${API_URL}/api/context-metrics?endpoint=quality-dashboard&timeWindow=3600000`);
    
    if (qualityDashboardResponse.ok) {
      const dashboard = await qualityDashboardResponse.json();
      console.log('\n✅ Quality Dashboard API:');
      if (dashboard.dashboard) {
        console.log(`   Overall Quality: ${(dashboard.dashboard.summary.overallQuality * 100).toFixed(1)}%`);
        console.log(`   Alerts: ${dashboard.dashboard.alerts.length}`);
        console.log(`   Recommendations: ${dashboard.dashboard.recommendations.length}`);
      }
    } else {
      console.log('   ⚠️  Quality dashboard API not available');
    }
    
    console.log('\n\n✅ All API Tests Completed!');
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Test Failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests with timeout
const testPromise = testWorkflowAPI();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Test timeout')), TIMEOUT_MS)
);

Promise.race([testPromise, timeoutPromise]).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

