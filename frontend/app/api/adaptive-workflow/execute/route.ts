/**
 * Adaptive Workflow Execution API
 * 
 * Dynamically builds and executes specialized workflows based on query/business use case.
 * Only activates components needed for the specific domain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdaptiveWorkflowOrchestrator } from '@/lib/adaptive-workflow-orchestrator';

export const maxDuration = 300; // 5 minutes max

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      domain,
      maxLatency,
      maxCost,
      priority = 'balanced'
    } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Adaptive Workflow Execution');
    console.log(`Query: "${query.substring(0, 100)}..."`);
    console.log(`Domain: ${domain || 'auto-detect'}`);
    console.log(`Priority: ${priority}`);

    const orchestrator = getAdaptiveWorkflowOrchestrator();

    // Execute with adaptive workflow selection
    const execution = await orchestrator.execute(
      query,
      { domain },
      {
        maxLatency,
        maxCost,
        priority: priority as 'speed' | 'quality' | 'cost' | 'balanced'
      }
    );

    return NextResponse.json({
      success: true,
      execution,
      workflow: {
        useCase: execution.workflowProfile.useCase,
        domain: execution.workflowProfile.domain,
        components: execution.activatedComponents,
        priority: execution.workflowProfile.priority
      },
      metrics: {
        executionTime: execution.executionTime,
        cost: execution.cost,
        quality: execution.quality,
        expectedLatency: execution.workflowProfile.expectedLatency,
        expectedCost: execution.workflowProfile.expectedCost
      }
    });

  } catch (error: any) {
    console.error('Adaptive workflow execution error:', error);
    return NextResponse.json(
      {
        error: 'Workflow execution failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET: List available workflow profiles
 */
export async function GET() {
  try {
    const orchestrator = getAdaptiveWorkflowOrchestrator();
    const profiles = orchestrator.getAvailableProfiles();

    return NextResponse.json({
      success: true,
      profiles: profiles.map(p => ({
        useCase: p.useCase,
        domain: p.domain,
        requiredComponents: p.requiredComponents,
        optionalComponents: p.optionalComponents,
        priority: p.priority,
        expectedLatency: p.expectedLatency,
        expectedCost: p.expectedCost
      }))
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

