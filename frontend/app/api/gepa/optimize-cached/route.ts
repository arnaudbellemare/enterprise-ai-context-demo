/**
 * GEPA Optimization with Caching
 * Caches optimizations for 24 hours to save compute time
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/caching';
import { log } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { prompt, context, performanceGoal = 'accuracy' } = body;
    
    // Generate cache key from inputs
    const cacheKey = `gepa:${cache.generateKey({ prompt, context, performanceGoal })}`;
    
    log.info('GEPA optimization request', { cacheKey, goal: performanceGoal });
    
    // Try cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      const duration = Date.now() - startTime;
      log.model('GEPA', 'optimize', duration, 0, undefined, true); // Cache hit
      
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        cacheKey
      });
    }
    
    // Cache miss - perform real optimization
    log.info('GEPA cache miss, running optimization');
    
    // Call actual GEPA API
    const gepaResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gepa/optimize`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, performanceGoal })
      }
    );
    
    if (!gepaResponse.ok) {
      throw new Error(`GEPA optimization failed: ${gepaResponse.status}`);
    }
    
    const result = await gepaResponse.json();
    
    // Cache for 24 hours
    await cache.set(cacheKey, result, {
      ttl: 86400, // 24 hours
      tags: ['gepa', `gepa:${performanceGoal}`]
    });
    
    const duration = Date.now() - startTime;
    log.model('GEPA', 'optimize', duration, 0.001, undefined, false); // No cache
    
    return NextResponse.json({
      ...result,
      cached: false,
      cacheKey
    });
    
  } catch (error: any) {
    log.error('GEPA optimization error', error);
    return NextResponse.json(
      { error: error.message || 'Optimization failed' },
      { status: 500 }
    );
  }
}

