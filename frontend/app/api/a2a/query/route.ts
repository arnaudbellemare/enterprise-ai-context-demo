/**
 * A2A Query API - Information Query Between Agents
 * 
 * Handles query requests between agents for specific information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { a2aEngine } from '../../../../lib/a2a-communication-engine';

/**
 * POST /api/a2a/query
 * Query another agent for information
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      from,
      to,
      query,
      context,
      expectedOutput,
      timeout = 60
    } = body;

    if (!from || !to || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, query' },
        { status: 400 }
      );
    }

    console.log(`❓ A2A Query: ${from} → ${to}`);
    console.log(`   Query: ${query}`);

    const response = await a2aEngine.queryAgent({
      from,
      to,
      query,
      context,
      expectedOutput,
      timeout
    });

    return NextResponse.json({
      success: true,
      correlationId: response.correlationId,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('A2A Query error:', error);
    return NextResponse.json(
      { error: 'Query failed', details: error.message },
      { status: 500 }
    );
  }
}
