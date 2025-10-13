/**
 * Monitoring Stats API
 * Provides real-time system metrics
 */

import { NextResponse } from 'next/server';
import { cache } from '@/lib/caching';

export async function GET() {
  const stats = {
    cache: cache.getStats(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    },
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(stats);
}

