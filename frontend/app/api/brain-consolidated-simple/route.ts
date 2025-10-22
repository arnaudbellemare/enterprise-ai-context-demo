/**
 * Simplified Brain Consolidated Route
 * 
 * Minimal working version for testing
 */

import { NextRequest, NextResponse } from 'next/server';

interface BrainRequest {
  query: string;
  strategy?: 'original' | 'modular' | 'moe' | 'auto';
}

interface BrainResponse {
  success: boolean;
  response: string;
  metadata: {
    strategyUsed: string;
    totalTime: number;
  };
  error?: string;
}

/**
 * POST /api/brain-consolidated-simple
 * Simplified unified brain endpoint
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json() as BrainRequest;
    const { query, strategy = 'auto' } = body;

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    // Simple response for testing
    const response: BrainResponse = {
      success: true,
      response: `Processed query: "${query}" using strategy: ${strategy}`,
      metadata: {
        strategyUsed: strategy,
        totalTime: Date.now() - startTime
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'Brain system unavailable, please try again'
    }, { status: 500 });
  }
}

/**
 * GET /api/brain-consolidated-simple
 * Get system status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    status: 'operational',
    message: 'Simplified brain endpoint is working'
  });
}