/**
 * Test Rate Limiting Endpoint
 *
 * Make 25 rapid requests to this endpoint to test rate limiting:
 * curl -X POST http://localhost:3000/api/test-rate-limit -d '{"query":"test"}' -H "Content-Type: application/json"
 */

import { NextRequest, NextResponse } from 'next/server';
import { callPerplexityWithRateLimiting, callLLMWithRetry } from '../../../lib/brain-skills/llm-helpers';
import { getRateLimiterStats } from '../../../lib/api-rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const { query = 'What is 2+2?', useRetry = false } = await req.json();

    console.log(`\n🧪 Testing rate limiting with query: ${query}`);

    const startTime = Date.now();

    // Call with or without retry
    const result = useRetry
      ? await callLLMWithRetry([{ role: 'user', content: query }])
      : await callPerplexityWithRateLimiting([{ role: 'user', content: query }]);

    const duration = Date.now() - startTime;

    // Get current rate limiter stats
    const stats = getRateLimiterStats();

    return NextResponse.json({
      success: true,
      query,
      response: result.content.substring(0, 200), // Truncate for readability
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      cost: result.cost,
      tokens: result.tokens,
      duration,
      rateLimiterStats: stats
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        rateLimiterStats: getRateLimiterStats()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check rate limiter status
 */
export async function GET() {
  const stats = getRateLimiterStats();

  return NextResponse.json({
    success: true,
    stats,
    providers: stats.providers.map((p: any) => ({
      name: p.name,
      requestCount: p.requestCount,
      isRateLimited: p.isRateLimited,
      rateLimitedUntil: p.rateLimitUntil ? new Date(p.rateLimitUntil).toISOString() : null,
      lastUsed: p.lastUsed ? new Date(p.lastUsed).toISOString() : null
    }))
  });
}
