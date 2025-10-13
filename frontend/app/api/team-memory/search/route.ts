/**
 * TEAM MEMORY SEARCH API
 * Semantic search through team knowledge
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
    
    // Mock search results
    // In production: Use Supabase vector search
    const mockResults = [
      {
        id: 'knowledge-1',
        team_id: team_id,
        type: 'solution',
        problem: 'Bowling score calculation',
        content: JSON.stringify({
          solution: 'Track frames and handle strikes/spares',
          approach: 'State machine with lookahead',
          lessons: ['Edge cases matter', 'Test with 300 perfect game']
        }),
        metadata: { domain: 'algorithms', difficulty: 1.5 },
        created_at: new Date(Date.now() - 86400000).toISOString(),
        verified: true,
        usefulness_score: 4.5
      },
      {
        id: 'knowledge-2',
        team_id: team_id,
        type: 'pitfall',
        problem: 'Hexagonal grid pathfinding',
        content: JSON.stringify({
          mistake: 'Used square grid distance formula',
          how_to_avoid: 'Use cube coordinates for hexagonal grids'
        }),
        metadata: { domain: 'algorithms' },
        created_at: new Date(Date.now() - 172800000).toISOString(),
        verified: true,
        usefulness_score: 4.0
      }
    ];
    
    console.log('[Team Memory] Search:', {
      query: query.substring(0, 50),
      team: team_id,
      results: mockResults.length
    });
    
    return NextResponse.json(mockResults.slice(0, limit));
    
  } catch (error) {
    console.error('[Team Memory] Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

