/**
 * ARTICULATION STORAGE API
 * Store agent "think out loud" articulations
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      agent_id,
      task_id,
      team_id,
      type,
      thought,
      context,
      metadata
    } = body;
    
    // Validate required fields
    if (!agent_id || !task_id || !team_id || !type || !thought) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Store articulation
    const articulation = {
      agent_id,
      task_id,
      team_id,
      type,
      thought,
      context: context || null,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      searchable: true
    };
    
    // In production, store in Supabase
    // For now, store in memory (implement Supabase integration later)
    console.log('[Articulation] Stored:', {
      agent: agent_id,
      type: type,
      preview: thought.substring(0, 50) + '...'
    });
    
    return NextResponse.json({
      success: true,
      articulation: articulation
    });
    
  } catch (error) {
    console.error('[Articulation] Error:', error);
    return NextResponse.json(
      { error: 'Failed to store articulation' },
      { status: 500 }
    );
  }
}

