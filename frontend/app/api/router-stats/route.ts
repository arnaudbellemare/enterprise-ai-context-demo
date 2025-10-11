import { NextRequest, NextResponse } from 'next/server';
import { getLearnedRouter } from '@/lib/learned-router';

export const runtime = 'nodejs';

/**
 * API endpoint to view and manage learned router statistics
 */
export async function GET(request: NextRequest) {
  try {
    const router = getLearnedRouter();
    const metrics = router.getMetrics();
    const topPatterns = router.getTopWebSearchPatterns(20);
    const allPatterns = router.exportPatterns();
    
    return NextResponse.json({
      metrics,
      topPatterns,
      totalPatterns: Object.keys(allPatterns).length,
      patterns: allPatterns,
      summary: {
        accuracy: `${(metrics.accuracy * 100).toFixed(1)}%`,
        totalQueries: metrics.totalQueries,
        learnedDecisionsRatio: metrics.totalQueries > 0 
          ? `${((metrics.learnedDecisions / metrics.totalQueries) * 100).toFixed(1)}%`
          : '0%',
        heuristicFallbackRatio: metrics.totalQueries > 0
          ? `${((metrics.heuristicFallbacks / metrics.totalQueries) * 100).toFixed(1)}%`
          : '0%'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to get router stats' },
      { status: 500 }
    );
  }
}

/**
 * POST: Reset the learned router
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'reset') {
      const router = getLearnedRouter();
      router.reset();
      
      return NextResponse.json({
        success: true,
        message: 'Router reset successfully'
      });
    }
    
    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to reset router' },
      { status: 500 }
    );
  }
}

