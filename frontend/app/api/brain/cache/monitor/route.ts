import { NextRequest, NextResponse } from 'next/server';
import { getSkillCache } from '@/lib/brain-skills/skill-cache';
import { rateLimiter, RATE_LIMITS, generateRateLimitKey } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

/**
 * Cache Monitoring System
 * 
 * Provides real-time metrics and analysis for cache performance
 * Includes rate limiting to prevent abuse
 */

interface CacheMetrics {
  hitRate: number;
  utilizationPercent: number;
  size: number;
  maxSize: number;
  averageResponseTime: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

interface MonitoringResult {
  success: boolean;
  current?: {
    metrics: CacheMetrics;
    trends: {
      hitRateTrend: 'improving' | 'stable' | 'declining';
      utilizationTrend: 'increasing' | 'stable' | 'decreasing';
      recommendations: string[];
    };
    alerts: Array<{
      level: 'info' | 'warning' | 'critical';
      message: string;
    }>;
  };
  history?: Array<{
    timestamp: string;
    metrics: CacheMetrics;
  }>;
  error?: string;
}

/**
 * GET /api/brain/cache/monitor
 * Get real-time cache metrics and analysis
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = generateRateLimitKey(request, 'cache-monitor');
    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey, RATE_LIMITS.CACHE_MONITOR);
    
    if (!rateLimitResult.allowed) {
      logger.security('Rate limit exceeded for cache monitoring', {
        key: rateLimitKey,
        retryAfter: rateLimitResult.retryAfter
      });
      
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many monitoring requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      });
    }

    const cache = getSkillCache();
    const stats = cache.getStats();
    
    // Get query parameters
    const url = new URL(request.url);
    const includeHistory = url.searchParams.get('history') === 'true';
    const hours = parseInt(url.searchParams.get('hours') || '24');

    // Calculate current metrics
    const metrics: CacheMetrics = {
      hitRate: stats.hitRate,
      utilizationPercent: stats.utilizationPercent,
      size: stats.size,
      maxSize: stats.maxSize,
      averageResponseTime: 0, // Not available in current stats
      totalRequests: stats.hitCount + stats.missCount,
      cacheHits: stats.hitCount,
      cacheMisses: stats.missCount
    };

    // Analyze trends
    const trends = analyzeTrends(metrics);
    
    // Generate recommendations
    const recommendations = trends.recommendations;
    
    // Generate alerts
    const alerts = generateAlerts(metrics, trends);

    const result: MonitoringResult = {
      success: true,
      current: {
        metrics,
        trends,
        alerts
      }
    };

    // Add historical data if requested
    if (includeHistory) {
      result.history = await getHistoricalMetrics(hours);
    }

    logger.info('Cache monitoring data retrieved', {
      operation: 'cache_monitoring',
      metadata: {
        hitRate: metrics.hitRate,
        utilization: metrics.utilizationPercent,
        size: metrics.size,
        maxSize: metrics.maxSize
      }
    });

    return NextResponse.json(result);

  } catch (error: any) {
    logger.error('Cache monitoring failed', error, {
      operation: 'cache_monitoring'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/brain/cache/monitor
 * Store metrics snapshot for historical analysis
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = generateRateLimitKey(request, 'cache-monitor');
    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey, RATE_LIMITS.CACHE_MONITOR);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }, { status: 429 });
    }

    const body = await request.json();
    const { metrics, timestamp } = body;

    // Validate metrics data
    if (!metrics || typeof metrics.hitRate !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Invalid metrics data'
      }, { status: 400 });
    }

    // Store metrics snapshot (placeholder - would integrate with database)
    await storeMetricsSnapshot({
      timestamp: timestamp || new Date().toISOString(),
      metrics
    });

    logger.info('Cache metrics snapshot stored', {
      operation: 'cache_monitoring',
      metadata: {
        hitRate: metrics.hitRate,
        utilization: metrics.utilizationPercent
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Metrics snapshot stored successfully'
    });

  } catch (error: any) {
    logger.error('Failed to store metrics snapshot', error, {
      operation: 'cache_monitoring'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Analyze cache performance trends
 */
function analyzeTrends(metrics: CacheMetrics): {
  hitRateTrend: 'improving' | 'stable' | 'declining';
  utilizationTrend: 'increasing' | 'stable' | 'decreasing';
  recommendations: string[];
} {
  const recommendations: string[] = [];
  
  // Analyze hit rate trend (simplified - would use historical data in production)
  let hitRateTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (metrics.hitRate > 0.6) {
    hitRateTrend = 'improving';
  } else if (metrics.hitRate < 0.3) {
    hitRateTrend = 'declining';
    recommendations.push('Consider warming cache with common queries');
  }

  // Analyze utilization trend
  let utilizationTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (metrics.utilizationPercent > 80) {
    utilizationTrend = 'increasing';
    recommendations.push('Cache is nearly full - consider increasing size or implementing TTL');
  } else if (metrics.utilizationPercent < 20) {
    utilizationTrend = 'decreasing';
    recommendations.push('Cache is underutilized - consider warming with more queries');
  }

  // Generate additional recommendations
  if (metrics.hitRate < 0.4) {
    recommendations.push('Low hit rate detected - review cache key generation strategy');
  }
  
  if (metrics.averageResponseTime > 1000) {
    recommendations.push('High response time detected - consider optimizing cache operations');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache performance is optimal');
  }

  return {
    hitRateTrend,
    utilizationTrend,
    recommendations
  };
}

/**
 * Generate alerts based on metrics
 */
function generateAlerts(metrics: CacheMetrics, trends: any): Array<{
  level: 'info' | 'warning' | 'critical';
  message: string;
}> {
  const alerts: Array<{ level: 'info' | 'warning' | 'critical'; message: string }> = [];

  // Critical alerts
  if (metrics.hitRate < 0.1) {
    alerts.push({
      level: 'critical',
      message: 'Critical: Cache hit rate is extremely low (< 10%)'
    });
  }

  if (metrics.utilizationPercent > 95) {
    alerts.push({
      level: 'critical',
      message: 'Critical: Cache is nearly full (> 95% utilization)'
    });
  }

  // Warning alerts
  if (metrics.hitRate < 0.3) {
    alerts.push({
      level: 'warning',
      message: 'Warning: Cache hit rate is low (< 30%)'
    });
  }

  if (metrics.utilizationPercent > 80) {
    alerts.push({
      level: 'warning',
      message: 'Warning: Cache utilization is high (> 80%)'
    });
  }

  if (metrics.averageResponseTime > 2000) {
    alerts.push({
      level: 'warning',
      message: 'Warning: Average response time is high (> 2s)'
    });
  }

  // Info alerts
  if (metrics.hitRate > 0.6) {
    alerts.push({
      level: 'info',
      message: 'Cache performing well: ' + (metrics.hitRate * 100).toFixed(1) + '% hit rate'
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: 'info',
      message: 'Cache system is operating normally'
    });
  }

  return alerts;
}

/**
 * Get historical metrics (placeholder implementation)
 */
async function getHistoricalMetrics(hours: number): Promise<Array<{
  timestamp: string;
  metrics: CacheMetrics;
}>> {
  // In production, this would query a time-series database
  // For now, return empty array
  return [];
}

/**
 * Store metrics snapshot (placeholder implementation)
 */
async function storeMetricsSnapshot(data: {
  timestamp: string;
  metrics: CacheMetrics;
}): Promise<void> {
  // In production, this would store in a time-series database
  // For now, just log the data
  logger.debug('Metrics snapshot stored', {
    operation: 'cache_monitoring',
    metadata: {
      timestamp: data.timestamp,
      metrics: data.metrics
    }
  });
}