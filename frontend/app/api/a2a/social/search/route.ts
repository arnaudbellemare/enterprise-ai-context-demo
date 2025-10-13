/**
 * SOCIAL A2A SEARCH API
 * Search team posts (tag-based + semantic)
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { query, team_id, tags } = body;
    
    if (!query || !team_id) {
      return NextResponse.json(
        { error: 'Missing query or team_id' },
        { status: 400 }
      );
    }
    
    // Mock search results
    // In production: Use Supabase with tag filtering + vector search
    const mockResults = [
      {
        id: 'post-1',
        agent_id: 'agent-1',
        team_id: team_id,
        type: 'tip',
        message: '💡 Tip: For bowling scores, remember to add next two rolls for strikes',
        tags: ['bowling', 'edge-cases'],
        visibility: 'team',
        timestamp: new Date(Date.now() - 3600000),
        searchable: true,
        replies: []
      },
      {
        id: 'post-2',
        agent_id: 'agent-2',
        team_id: team_id,
        type: 'discovery',
        message: '🔍 Discovery: Hexagonal grids use cube coordinates for easier pathfinding',
        tags: ['hexagonal', 'algorithms'],
        visibility: 'team',
        timestamp: new Date(Date.now() - 7200000),
        searchable: true,
        replies: []
      }
    ];
    
    // Filter by tags if provided
    let results = mockResults;
    if (tags && tags.length > 0) {
      results = mockResults.filter(post =>
        post.tags.some((tag: string) => tags.includes(tag))
      );
    }
    
    console.log('[Social A2A] Search:', {
      query: query.substring(0, 50),
      team: team_id,
      tags: tags,
      results: results.length
    });
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('[Social A2A] Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

