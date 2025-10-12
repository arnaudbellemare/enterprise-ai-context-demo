/**
 * HITL Escalation API - Enterprise Human-in-the-Loop
 * 
 * Provides escalation endpoints for agents to request human oversight
 * and approval gates for critical decisions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hitlEngine } from '../../../../lib/hitl-escalation-engine';

/**
 * POST /api/hitl/escalate
 * Agent escalates to human operator
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId,
      reason,
      context,
      urgency = 'medium',
      requiredExpertise,
      domain = 'general',
      confidence = 0.5,
      riskScore = 0.5,
      amount
    } = body;

    if (!agentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, reason' },
        { status: 400 }
      );
    }

    console.log(`🚨 HITL ESCALATION REQUEST from ${agentId}:`, reason);

    // Check if escalation is needed
    const shouldEscalate = hitlEngine.shouldEscalate({
      confidence,
      riskScore,
      amount,
      domain,
      context
    });

    if (!shouldEscalate) {
      return NextResponse.json({
        escalated: false,
        reason: 'Escalation criteria not met',
        confidence,
        riskScore
      });
    }

    // Escalate to human
    const humanResponse = await hitlEngine.escalateToHuman({
      agentId,
      reason,
      context,
      urgency,
      requiredExpertise,
      domain,
      confidence,
      riskScore,
      amount
    });

    return NextResponse.json({
      escalated: true,
      humanResponse,
      escalationId: `esc_${Date.now()}`,
      status: humanResponse.decision === 'approve' ? 'approved' : 'rejected'
    });

  } catch (error: any) {
    console.error('HITL Escalation error:', error);
    return NextResponse.json(
      { error: 'Escalation failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hitl/escalate
 * Get pending escalations for human review
 */
export async function GET(req: NextRequest) {
  try {
    const pendingEscalations = hitlEngine.getPendingEscalations();
    const pendingGates = hitlEngine.getPendingApprovalGates();

    return NextResponse.json({
      pendingEscalations,
      pendingApprovalGates: pendingGates,
      totalPending: pendingEscalations.length + pendingGates.length
    });

  } catch (error: any) {
    console.error('HITL Get escalations error:', error);
    return NextResponse.json(
      { error: 'Failed to get escalations', details: error.message },
      { status: 500 }
    );
  }
}
