/**
 * A2A Inform API - One-way Agent Communication
 * 
 * Handles informational messages between agents without requiring responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { a2aEngine } from '../../../../lib/a2a-communication-engine';

/**
 * POST /api/a2a/inform
 * Send information to another agent
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      from,
      to,
      data,
      domain = 'general',
      priority = 'medium'
    } = body;

    if (!from || !to || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, data' },
        { status: 400 }
      );
    }

    console.log(`📢 A2A Inform: ${from} → ${to}`);

    await a2aEngine.sendInformation({
      from,
      to,
      data,
      domain,
      priority
    });

    return NextResponse.json({
      success: true,
      message: 'Information sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('A2A Inform error:', error);
    return NextResponse.json(
      { error: 'Inform failed', details: error.message },
      { status: 500 }
    );
  }
}
