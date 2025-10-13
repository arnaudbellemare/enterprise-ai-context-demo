/**
 * SOCIAL A2A POST API
 * Store casual team communications
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const post = await req.json();
    
    const {
      agent_id,
      team_id,
      type,
      message,
      tags,
      visibility,
      context
    } = post;
    
    // Validate
    if (!agent_id || !team_id || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const socialPost = {
      id: `post-${Date.now()}`,
      agent_id,
      team_id,
      type,
      message,
      tags: tags || [],
      visibility: visibility || 'team',
      context: context || {},
      timestamp: new Date().toISOString(),
      searchable: true,
      replies: []
    };
    
    console.log('[Social A2A] Posted:', {
      agent: agent_id,
      type: type,
      preview: message.substring(0, 50) + '...'
    });
    
    return NextResponse.json({
      success: true,
      post: socialPost
    });
    
  } catch (error) {
    console.error('[Social A2A] Post error:', error);
    return NextResponse.json(
      { error: 'Failed to post' },
      { status: 500 }
    );
  }
}

