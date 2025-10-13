/**
 * ARTICULATION SEARCH API
 * Semantic search through agent articulations
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { query, team_id, limit = 10 } = body;
    
    if (!query || !team_id) {
      return NextResponse.json(
        { error: 'Missing query or team_id' },
        { status: 400 }
      );
    }
    
    // Mock semantic search results
    // In production: Use Supabase vector search or embedding-based search
    const mockResults = [
      {
        entry: {
          id: '1',
          agent_id: 'agent-1',
          task_id: 'bowling-score',
          team_id: team_id,
          type: 'breakthrough',
          thought: 'Found the issue with spare calculation - need to add next roll',
          timestamp: new Date(Date.now() - 3600000),
          searchable: true
        },
        similarity: 0.87,
        relevance: 'High - similar problem domain'
      },
      {
        entry: {
          id: '2',
          agent_id: 'agent-2',
          task_id: 'hexagonal-grid',
          team_id: team_id,
          type: 'stuck',
          thought: 'Having trouble with coordinate system conversion',
          timestamp: new Date(Date.now() - 7200000),
          searchable: true
        },
        similarity: 0.72,
        relevance: 'Medium - related to algorithmic challenges'
      }
    ];
    
    console.log('[Articulation] Search:', {
      query: query.substring(0, 50),
      team: team_id,
      results: mockResults.length
    });
    
    return NextResponse.json(mockResults.slice(0, limit));
    
  } catch (error) {
    console.error('[Articulation] Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

