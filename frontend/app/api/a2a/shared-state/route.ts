/**
 * A2A Shared State API - Blackboard Pattern Implementation
 * 
 * Manages shared state between agents using the blackboard pattern.
 */

import { NextRequest, NextResponse } from 'next/server';
import { a2aEngine } from '../../../../lib/a2a-communication-engine';

/**
 * POST /api/a2a/shared-state
 * Update shared state
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      key,
      value,
      updatedBy,
      domain = 'general',
      accessLevel = 'read'
    } = body;

    if (!key || value === undefined || !updatedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value, updatedBy' },
        { status: 400 }
      );
    }

    console.log(`💾 A2A Shared State Update: ${key} by ${updatedBy}`);

    await a2aEngine.updateSharedState({
      key,
      value,
      updatedBy,
      domain,
      accessLevel
    });

    return NextResponse.json({
      success: true,
      message: 'Shared state updated successfully',
      key,
      updatedBy,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('A2A Shared State Update error:', error);
    return NextResponse.json(
      { error: 'Shared state update failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/a2a/shared-state
 * Get shared state
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const requestedBy = searchParams.get('requestedBy');

    if (!key || !requestedBy) {
      return NextResponse.json(
        { error: 'Missing required parameters: key, requestedBy' },
        { status: 400 }
      );
    }

    console.log(`📖 A2A Shared State Read: ${key} by ${requestedBy}`);

    const value = await a2aEngine.getSharedState(key, requestedBy);

    return NextResponse.json({
      success: true,
      key,
      value,
      requestedBy,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('A2A Shared State Read error:', error);
    return NextResponse.json(
      { error: 'Shared state read failed', details: error.message },
      { status: 500 }
    );
  }
}
