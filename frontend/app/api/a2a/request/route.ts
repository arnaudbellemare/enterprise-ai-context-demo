/**
 * A2A Request API - Bidirectional Agent Communication
 * 
 * Handles bidirectional request-response communication between agents
 * using advanced prompting techniques and structured messaging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { a2aEngine } from '../../../../lib/a2a-communication-engine';

/**
 * POST /api/a2a/request
 * Send a request to another agent
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      from,
      to,
      instruction,
      context,
      expectedOutput,
      tools,
      priority = 'medium',
      timeout = 300,
      domain = 'general'
    } = body;

    if (!from || !to || !instruction) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, instruction' },
        { status: 400 }
      );
    }

    console.log(`📤 A2A Request: ${from} → ${to}`);

    const response = await a2aEngine.sendRequest({
      from,
      to,
      instruction,
      context,
      expectedOutput,
      tools,
      priority,
      timeout,
      domain
    });

    return NextResponse.json({
      success: true,
      correlationId: response.correlationId,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('A2A Request error:', error);
    return NextResponse.json(
      { error: 'Request failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/a2a/request
 * Get pending messages for an agent
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId parameter' },
        { status: 400 }
      );
    }

    const pendingMessages = a2aEngine.getPendingMessages(agentId);

    return NextResponse.json({
      agentId,
      pendingMessages,
      count: pendingMessages.length
    });

  } catch (error: any) {
    console.error('A2A Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages', details: error.message },
      { status: 500 }
    );
  }
}
