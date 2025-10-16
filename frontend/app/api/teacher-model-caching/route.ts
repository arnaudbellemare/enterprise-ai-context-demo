import { NextRequest, NextResponse } from 'next/server';
import { teacherModelCache } from '@/lib/teacher-model-caching';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { action, query, response, domain, metadata } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log(`🎓 Teacher Model Caching - Action: ${action}`);

    switch (action) {
      case 'cache':
        if (!query || !response || !domain || !metadata) {
          return NextResponse.json(
            { error: 'Query, response, domain, and metadata are required for caching' },
            { status: 400 }
          );
        }

        const cacheKey = teacherModelCache.cacheResponse(query, response, domain, metadata);
        console.log(`   ✅ Cached response with key: ${cacheKey}`);

        return NextResponse.json({
          success: true,
          cacheKey,
          timestamp: new Date().toISOString()
        });

      case 'get':
        if (!query || !domain) {
          return NextResponse.json(
            { error: 'Query and domain are required for retrieval' },
            { status: 400 }
          );
        }

        const cached = teacherModelCache.getCachedResponse(query, domain);
        console.log(`   ${cached ? '✅' : '❌'} Cache ${cached ? 'hit' : 'miss'}`);

        return NextResponse.json({
          success: true,
          cached,
          timestamp: new Date().toISOString()
        });

      case 'clear':
        teacherModelCache.clear();
        console.log(`   ✅ Cache cleared`);

        return NextResponse.json({
          success: true,
          message: 'Cache cleared',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: cache, get, or clear' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Teacher Model Caching error:', error);
    return NextResponse.json(
      { error: error.message || 'Caching operation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = teacherModelCache.getStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Teacher Model Cache stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}
