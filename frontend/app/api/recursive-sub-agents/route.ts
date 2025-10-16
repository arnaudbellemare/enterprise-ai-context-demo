import { NextRequest, NextResponse } from 'next/server';
import { recursiveSubAgentOrchestrator } from '@/lib/recursive-sub-agent-orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      domain, 
      requiredCapabilities = [],
      maxDepth = 3,
      maxCost = 0.5,
      maxLatency = 30000,
      strategy = 'hybrid',
      priority = 'medium'
    } = await request.json();

    if (!query || !domain) {
      return NextResponse.json(
        { error: 'Query and domain are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Recursive Sub-Agent Orchestration - Query: ${query.substring(0, 50)}...`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Strategy: ${strategy}`);
    console.log(`   Max Depth: ${maxDepth}`);

    // Create task
    const task = {
      id: `task_${Date.now()}`,
      query,
      domain,
      priority,
      maxDepth,
      currentDepth: 0,
      requiredCapabilities,
      context: {}
    };

    // Create execution plan
    const plan = recursiveSubAgentOrchestrator.createExecutionPlan(task, {
      maxDepth,
      maxCost,
      maxLatency,
      strategy
    });

    console.log(`   📋 Execution Plan: ${plan.agents.length} agents, ${plan.strategy} strategy`);
    console.log(`   🎯 Agents: ${plan.agents.map(a => a.name).join(', ')}`);

    // Execute recursive sub-agent calls
    const results = await recursiveSubAgentOrchestrator.executeRecursive(task, plan);

    console.log(`   ✅ Execution completed: ${results.length} results`);
    console.log(`   📊 Total sub-tasks: ${results.reduce((sum, r) => sum + r.subTasks.length, 0)}`);

    // Aggregate results
    const aggregatedResult = {
      originalQuery: query,
      domain,
      strategy,
      executionPlan: plan,
      results,
      summary: {
        totalAgents: results.length,
        totalSubTasks: results.reduce((sum, r) => sum + r.subTasks.length, 0),
        totalCost: results.reduce((sum, r) => sum + r.cost, 0),
        totalLatency: results.reduce((sum, r) => sum + r.latency, 0),
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length || 0,
        maxDepth: Math.max(...results.map(r => r.metadata.depth), 0)
      }
    };

    return NextResponse.json({
      success: true,
      result: aggregatedResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Recursive Sub-Agent Orchestration error:', error);
    return NextResponse.json(
      { error: error.message || 'Recursive execution failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = recursiveSubAgentOrchestrator.getExecutionStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Recursive Sub-Agent stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get execution stats' },
      { status: 500 }
    );
  }
}
