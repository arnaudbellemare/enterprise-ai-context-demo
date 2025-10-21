/**
 * Brain Skill Metrics API
 *
 * Provides metrics and analytics for brain skills
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsTracker, getSkillCache, getSkillRegistry } from '../../../../lib/brain-skills';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/brain/metrics
 *
 * Query parameters:
 * - hours: Number of hours to look back (default: 24)
 * - skill: Specific skill name to filter (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hoursAgo = parseInt(searchParams.get('hours') || '24', 10);
    const skillName = searchParams.get('skill') || undefined;

    const metrics = getMetricsTracker();
    const cache = getSkillCache();
    const registry = getSkillRegistry();

    // Get overall metrics
    const overallMetrics = await metrics.getAllMetrics(hoursAgo);

    // Get cache statistics
    const cacheStats = cache.getStats();

    // Get registry statistics
    const registryStats = registry.getStats();

    // Get skill-specific metrics if requested
    let skillMetrics = null;
    if (skillName) {
      skillMetrics = await metrics.getSkillMetrics(skillName, hoursAgo);
    }

    return NextResponse.json({
      success: true,
      timeRange: {
        hoursAgo,
        from: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
        to: new Date().toISOString()
      },
      overall: overallMetrics || {
        totalExecutions: 0,
        successRate: 0,
        avgExecutionTime: 0,
        totalCost: 0,
        avgQualityScore: 0,
        cacheHitRate: 0,
        mostUsedSkill: '',
        slowestSkill: '',
        fastestSkill: ''
      },
      cache: {
        currentSize: cacheStats.size,
        maxSize: cacheStats.maxSize,
        hitCount: cacheStats.hitCount,
        missCount: cacheStats.missCount,
        hitRate: cacheStats.hitRate,
        utilizationPercent: cacheStats.utilizationPercent
      },
      registry: {
        totalSkills: registryStats.totalSkills,
        skills: registryStats.skillDescriptions
      },
      skillSpecific: skillMetrics
    });

  } catch (error: any) {
    console.error('❌ Brain metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brain/metrics
 *
 * Clear cache or old metrics
 *
 * Query parameters:
 * - action: 'clear_cache' | 'cleanup_metrics'
 * - days: For cleanup_metrics, days to keep (default: 30)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'clear_cache') {
      const cache = getSkillCache();
      cache.clear();

      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }

    if (action === 'cleanup_metrics') {
      const daysToKeep = parseInt(searchParams.get('days') || '30', 10);
      const metrics = getMetricsTracker();
      const deletedCount = await metrics.cleanupOldMetrics(daysToKeep);

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deletedCount} old metrics`,
        deletedCount
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: clear_cache or cleanup_metrics' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Brain metrics cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup', details: error.message },
      { status: 500 }
    );
  }
}
