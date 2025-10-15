import { NextRequest, NextResponse } from 'next/server';
import { simplePermutationEngine } from '../../../../lib/simple-permutation-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Simple PERMUTATION API called - FAST MODE!');
    const startTime = Date.now();

    // Use the simple, fast permutation engine
    const result = await simplePermutationEngine.execute(lastMessage.content);

    const duration = Date.now() - startTime;
    console.log(`⚡ Simple PERMUTATION completed in ${duration}ms - FAST!`);

    return NextResponse.json({
      response: result.answer,
      reasoning: result.reasoning,
      metadata: result.metadata,
      trace: result.trace,
      components_used: result.metadata.components_used.length,
      teacher: 'Simple Engine',
      domain: result.metadata.domain,
      duration_ms: duration
    });

  } catch (error) {
    console.error('❌ Simple PERMUTATION API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
