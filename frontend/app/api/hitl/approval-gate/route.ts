/**
 * HITL Approval Gate API - Workflow Pause/Resume
 * 
 * Manages approval gates in workflows where human approval is required
 * before proceeding with critical operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hitlEngine } from '../../../../lib/hitl-escalation-engine';

/**
 * POST /api/hitl/approval-gate/create
 * Create an approval gate in a workflow
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workflowId,
      nodeId,
      criteria,
      approverRole,
      timeout = 3600
    } = body;

    if (!workflowId || !nodeId || !criteria || !approverRole) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, nodeId, criteria, approverRole' },
        { status: 400 }
      );
    }

    console.log(`🛑 Creating approval gate for workflow ${workflowId}, node ${nodeId}`);

    const gate = await hitlEngine.createApprovalGate({
      workflowId,
      nodeId,
      criteria,
      approverRole,
      timeout
    });

    return NextResponse.json({
      gateId: gate.id,
      status: 'created',
      gate
    });

  } catch (error: any) {
    console.error('HITL Approval gate creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create approval gate', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hitl/approval-gate/check
 * Check if approval is required and pause workflow if needed
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workflowId,
      nodeId,
      result
    } = body;

    if (!workflowId || !nodeId || !result) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, nodeId, result' },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking approval gate for workflow ${workflowId}, node ${nodeId}`);

    const approvalResult = await hitlEngine.checkApprovalGate({
      workflowId,
      nodeId,
      result
    });

    if (approvalResult.approved) {
      console.log(`✅ Approval gate passed for ${nodeId}`);
    } else {
      console.log(`⏸️ Workflow paused at approval gate for ${nodeId}`);
    }

    return NextResponse.json({
      approved: approvalResult.approved,
      autoApproved: approvalResult.autoApproved,
      gateId: approvalResult.gateId,
      humanResponse: approvalResult.humanResponse,
      workflowPaused: !approvalResult.approved
    });

  } catch (error: any) {
    console.error('HITL Approval gate check error:', error);
    return NextResponse.json(
      { error: 'Failed to check approval gate', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hitl/approval-gate/respond
 * Human responds to approval gate
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gateId,
      decision,
      reasoning,
      modifications,
      confidence = 0.9
    } = body;

    if (!gateId || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields: gateId, decision' },
        { status: 400 }
      );
    }

    console.log(`👤 Human response to approval gate ${gateId}: ${decision}`);

    const humanResponse = {
      decision: decision as 'approve' | 'reject' | 'modify',
      reasoning,
      modifications,
      confidence,
      timestamp: new Date()
    };

    // Process the human response
    await hitlEngine.processHumanResponse(gateId, humanResponse);

    return NextResponse.json({
      processed: true,
      gateId,
      decision,
      humanResponse
    });

  } catch (error: any) {
    console.error('HITL Approval gate response error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval gate response', details: error.message },
      { status: 500 }
    );
  }
}
