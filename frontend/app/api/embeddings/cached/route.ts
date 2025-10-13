/**
 * Embeddings API with Caching
 * Caches embeddings to save API costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/caching';
import { log } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { text, model = 'text-embedding-ada-002' } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Generate cache key from text
    const cacheKey = `embedding:${model}:${cache.generateKey(text)}`;
    
    log.info('Embedding request', { textLength: text.length, model, cacheKey });
    
    // Try cache first
    const cachedEmbedding = await cache.get(cacheKey);
    if (cachedEmbedding) {
      const duration = Date.now() - startTime;
      log.model('OpenAI', 'embedding', duration, 0, undefined, true); // $0 cached
      
      return NextResponse.json({
        embedding: cachedEmbedding,
        cached: true,
        cacheKey
      });
    }
    
    // Cache miss - generate embedding
    log.info('Embedding cache miss, generating');
    
    const embeddingResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embeddings/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model })
      }
    );
    
    if (!embeddingResponse.ok) {
      throw new Error(`Embedding generation failed: ${embeddingResponse.status}`);
    }
    
    const result = await embeddingResponse.json();
    
    // Cache embeddings indefinitely (they don't change)
    await cache.set(cacheKey, result.embedding, {
      ttl: 2592000, // 30 days
      tags: ['embedding', `embedding:${model}`]
    });
    
    const duration = Date.now() - startTime;
    const estimatedCost = text.length * 0.0000001; // Rough estimate
    log.model('OpenAI', 'embedding', duration, estimatedCost, text.length, false);
    
    return NextResponse.json({
      embedding: result.embedding,
      cached: false,
      cacheKey
    });
    
  } catch (error: any) {
    log.error('Embedding generation error', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}

