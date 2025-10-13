/**
 * TEAM MEMORY STORAGE API
 * Store accumulated team knowledge
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const knowledge = await req.json();
    
    const {
      team_id,
      type,
      problem,
      content,
      metadata
    } = knowledge;
    
    // Validate
    if (!team_id || !type || !problem || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const stored = {
      id: `knowledge-${Date.now()}`,
      team_id,
      type,
      problem,
      content,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      verified: false,
      usefulness_score: 0
    };
    
    console.log('[Team Memory] Stored:', {
      team: team_id,
      type: type,
      problem: problem.substring(0, 50) + '...'
    });
    
    return NextResponse.json({
      success: true,
      knowledge: stored
    });
    
  } catch (error) {
    console.error('[Team Memory] Store error:', error);
    return NextResponse.json(
      { error: 'Failed to store knowledge' },
      { status: 500 }
    );
  }
}

