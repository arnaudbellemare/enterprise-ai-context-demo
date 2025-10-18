import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY ? 'Set' : 'Not set',
    OLLAMA_URL: process.env.OLLAMA_URL || 'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set'
  });
}
