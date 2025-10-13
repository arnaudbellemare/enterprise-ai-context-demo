/**
 * Perplexity API with Caching
 * Caches search results to reduce API costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/caching';
import { log } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, messages, recencyFilter = 'month' } = body;
    
    // Use query from messages if not provided directly
    const finalQuery = query || (messages && messages.length > 0 ? messages[messages.length - 1]?.content : '');
    
    if (!finalQuery) {
      return NextResponse.json(
        { error: 'Query or messages required' },
        { status: 400 }
      );
    }
    
    // Generate cache key
    const cacheKey = `perplexity:${cache.generateKey({ query: finalQuery, recencyFilter })}`;
    
    log.info('Perplexity search request', { query: finalQuery.substring(0, 50), cacheKey });
    
    // Try cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      const duration = Date.now() - startTime;
      log.model('Perplexity', 'search', duration, 0, undefined, true); // Cache hit - $0 cost
      
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        cacheKey
      });
    }
    
    // Cache miss - call real Perplexity API
    log.info('Perplexity cache miss, calling API');
    
    const perplexityResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/perplexity/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, recencyFilter })
      }
    );
    
    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API failed: ${perplexityResponse.status}`);
    }
    
    const result = await perplexityResponse.json();
    
    // Cache for 1 hour (searches become stale quickly)
    await cache.set(cacheKey, result, {
      ttl: 3600, // 1 hour
      tags: ['perplexity', 'search']
    });
    
    const duration = Date.now() - startTime;
    log.model('Perplexity', 'search', duration, 0.005, result.tokensUsed, false); // ~$0.005 per search
    
    return NextResponse.json({
      ...result,
      cached: false,
      cacheKey
    });
    
  } catch (error: any) {
    log.error('Perplexity search error', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

// Cache management endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    
    if (tag === 'perplexity') {
      await cache.invalidateTag('perplexity');
      log.info('Perplexity cache cleared');
      return NextResponse.json({ success: true, message: 'Cache cleared' });
    }
    
    return NextResponse.json(
      { error: 'Invalid tag' },
      { status: 400 }
    );
  } catch (error: any) {
    log.error('Cache clear error', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

