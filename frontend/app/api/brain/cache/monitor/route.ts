import { NextRequest, NextResponse } from 'next/server';
import { getSkillCache } from '@/lib/brain-skills/skill-cache';
import { createClient } from '@supabase/supabase-js';

/**
 * Cache Monitoring System
 *
 * Provides real-time cache performance metrics, trends, and alerts
 * for optimizing cache hit rates and system performance.
 */

interface CacheMetrics {
  timestamp: number;
  cacheSize: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  utilizationPercent: number;
}

interface CacheAnalysis {
  metrics: CacheMetrics;
  trends: {
    hitRateTrend: string; // 'improving' | 'stable' | 'declining'
    utilizationTrend: string;
    recommendations: string[];
  };
  alerts: {
    level: 'info' | 'warning' | 'critical';
    message: string;
  }[];
  performance: {
    avgCacheAge: number;
    mostCachedSkills: { skill: string; count: number }[];
    leastCachedSkills: { skill: string; count: number }[];
  };
}

/**
 * GET /api/brain/cache/monitor
 * Get current cache metrics and analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const historyHours = parseInt(searchParams.get('hours') || '24', 10);

    const cache = getSkillCache();
    const stats = cache.getStats();

    // Current metrics
    const metrics: CacheMetrics = {
      timestamp: Date.now(),
      cacheSize: stats.size,
      maxSize: stats.maxSize,
      hitCount: stats.hitCount,
      missCount: stats.missCount,
      hitRate: stats.hitRate,
      utilizationPercent: stats.utilizationPercent
    };

    // Analyze trends and generate recommendations
    const analysis = analyzeCache(metrics);

    // Get historical data if requested
    let history: CacheMetrics[] = [];
    if (includeHistory) {
      history = await getCacheHistory(historyHours);
    }

    return NextResponse.json({
      success: true,
      current: analysis,
      history: includeHistory ? history : undefined,
      monitoring: {
        endpoint: '/api/brain/cache/monitor',
        updateInterval: 30000, // 30 seconds
        metricsRetention: '7 days'
      }
    });

  } catch (error: any) {
    console.error('❌ Cache Monitoring Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/brain/cache/monitor
 * Store cache metrics snapshot for historical analysis
 */
export async function POST(request: NextRequest) {
  try {
    const cache = getSkillCache();
    const stats = cache.getStats();

    const metrics: CacheMetrics = {
      timestamp: Date.now(),
      cacheSize: stats.size,
      maxSize: stats.maxSize,
      hitCount: stats.hitCount,
      missCount: stats.missCount,
      hitRate: stats.hitRate,
      utilizationPercent: stats.utilizationPercent
    };

    // Store to Supabase for historical tracking
    await storeCacheMetrics(metrics);

    return NextResponse.json({
      success: true,
      message: 'Cache metrics stored',
      metrics
    });

  } catch (error: any) {
    console.error('❌ Cache Metrics Storage Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Analyze cache metrics and generate recommendations
 */
function analyzeCache(metrics: CacheMetrics): CacheAnalysis {
  const alerts: { level: 'info' | 'warning' | 'critical'; message: string }[] = [];
  const recommendations: string[] = [];

  // Hit rate analysis
  if (metrics.hitRate < 0.3) {
    alerts.push({
      level: 'critical',
      message: `Cache hit rate critically low: ${(metrics.hitRate * 100).toFixed(1)}%`
    });
    recommendations.push('Run cache warming: npm run warm-cache');
    recommendations.push('Review query patterns for cache optimization');
  } else if (metrics.hitRate < 0.5) {
    alerts.push({
      level: 'warning',
      message: `Cache hit rate below target: ${(metrics.hitRate * 100).toFixed(1)}% (target: 50%+)`
    });
    recommendations.push('Consider warming cache with common queries');
  } else if (metrics.hitRate >= 0.6) {
    alerts.push({
      level: 'info',
      message: `Cache performing well: ${(metrics.hitRate * 100).toFixed(1)}% hit rate`
    });
  }

  // Utilization analysis
  if (metrics.utilizationPercent > 90) {
    alerts.push({
      level: 'warning',
      message: `Cache utilization high: ${metrics.utilizationPercent.toFixed(1)}%`
    });
    recommendations.push('Consider increasing cache max size');
    recommendations.push('Review cache TTL settings');
  } else if (metrics.utilizationPercent < 20) {
    alerts.push({
      level: 'info',
      message: `Cache underutilized: ${metrics.utilizationPercent.toFixed(1)}%`
    });
    recommendations.push('Run cache warming to improve readiness');
  }

  // Efficiency analysis
  const totalRequests = metrics.hitCount + metrics.missCount;
  if (totalRequests > 0) {
    const efficiency = (metrics.hitRate * metrics.utilizationPercent) / 100;
    if (efficiency < 0.3) {
      recommendations.push('Cache efficiency low - review caching strategy');
    }
  }

  // Trends (simplified - would use historical data in production)
  const hitRateTrend = metrics.hitRate >= 0.5 ? 'stable' : 'declining';
  const utilizationTrend = metrics.utilizationPercent >= 40 ? 'stable' : 'declining';

  return {
    metrics,
    trends: {
      hitRateTrend,
      utilizationTrend,
      recommendations
    },
    alerts,
    performance: {
      avgCacheAge: 0, // Would calculate from cache entries
      mostCachedSkills: [], // Would analyze cache contents
      leastCachedSkills: []
    }
  };
}

/**
 * Store cache metrics to Supabase for historical tracking
 */
async function storeCacheMetrics(metrics: CacheMetrics): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ Supabase not configured, skipping metrics storage');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from('cache_metrics_history').insert({
      timestamp: new Date(metrics.timestamp).toISOString(),
      cache_size: metrics.cacheSize,
      max_size: metrics.maxSize,
      hit_count: metrics.hitCount,
      miss_count: metrics.missCount,
      hit_rate: metrics.hitRate,
      utilization_percent: metrics.utilizationPercent
    });

    if (error) {
      console.error('Failed to store cache metrics:', error);
    }
  } catch (error) {
    console.error('Error storing cache metrics:', error);
  }
}

/**
 * Get historical cache metrics from Supabase
 */
async function getCacheHistory(hours: number): Promise<CacheMetrics[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return [];
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('cache_metrics_history')
      .select('*')
      .gte('timestamp', since)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Failed to fetch cache history:', error);
      return [];
    }

    return (data || []).map(row => ({
      timestamp: new Date(row.timestamp).getTime(),
      cacheSize: row.cache_size,
      maxSize: row.max_size,
      hitCount: row.hit_count,
      missCount: row.miss_count,
      hitRate: row.hit_rate,
      utilizationPercent: row.utilization_percent
    }));

  } catch (error) {
    console.error('Error fetching cache history:', error);
    return [];
  }
}
