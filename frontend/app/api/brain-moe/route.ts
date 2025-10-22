import { NextRequest, NextResponse } from 'next/server';
import { getMoEBrainOrchestrator } from '../../../lib/brain-skills/moe-orchestrator';

/**
 * Complete MoE Brain API
 * POST /api/brain-moe
 * Uses all MoE optimization patterns for optimal performance
 */
export async function POST(request: NextRequest) {
  try {
    const { query, context = {}, sessionId, priority = 'normal', budget, maxLatency, requiredQuality } = await request.json();

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    console.log(`🧠 MoE Brain: Processing query "${query.substring(0, 50)}..."`);

    const orchestrator = getMoEBrainOrchestrator();
    
    const moeRequest = {
      query,
      context: {
        ...context,
        sessionId: sessionId || 'default',
        timestamp: new Date().toISOString()
      },
      sessionId,
      priority,
      budget,
      maxLatency,
      requiredQuality
    };

    const startTime = Date.now();
    const response = await orchestrator.executeQuery(moeRequest);
    const totalTime = Date.now() - startTime;

    console.log(`✅ MoE Brain: Completed in ${totalTime}ms`);
    console.log(`   Skills: ${response.metadata.skillsActivated.join(', ')}`);
    console.log(`   Cost: $${response.metadata.totalCost.toFixed(4)}`);
    console.log(`   Quality: ${response.metadata.averageQuality.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      response: response.response,
      metadata: {
        ...response.metadata,
        totalTime,
        moeOptimized: true
      },
      performance: response.performance,
      sessionId: sessionId || 'default'
    });

  } catch (error: any) {
    console.error('❌ MoE Brain API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'MoE system unavailable, please try again'
    }, { status: 500 });
  }
}

/**
 * GET /api/brain-moe
 * System status and health check
 */
export async function GET(request: NextRequest) {
  try {
    const orchestrator = getMoEBrainOrchestrator();
    const status = orchestrator.getSystemStatus();
    const health = await orchestrator.healthCheck();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: 'MoE Brain Orchestrator',
      status,
      health,
      features: {
        topKSelection: true,
        loadBalancing: true,
        queryBatching: true,
        resourceManagement: true,
        dynamicRouting: true,
        abTesting: true
      }
    });

  } catch (error: any) {
    console.error('❌ MoE Brain status error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
