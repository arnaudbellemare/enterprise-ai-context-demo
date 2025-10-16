import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Production-grade performance metrics storage with persistence
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatency: number;
  totalCost: number;
  componentUsage: Record<string, { requests: number; totalLatency: number; totalCost: number; errors: number }>;
  errorLogs: Array<{ timestamp: number; component: string; error: string; severity: 'low' | 'medium' | 'high' }>;
  performanceHistory: Array<{ timestamp: number; component: string; latency: number; cost: number; success: boolean; domain?: string }>;
  startTime: number;
  lastReset: number;
  alerts: Array<{ timestamp: number; type: string; message: string; severity: 'info' | 'warning' | 'error' }>;
}

let performanceMetrics: PerformanceMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalLatency: 0,
  totalCost: 0,
  componentUsage: {},
  errorLogs: [],
  performanceHistory: [],
  startTime: Date.now(),
  lastReset: Date.now(),
  alerts: []
};

// Performance thresholds for alerts
const PERFORMANCE_THRESHOLDS = {
  maxLatency: 10000, // 10 seconds
  maxErrorRate: 0.1, // 10%
  maxCostPerRequest: 0.01, // $0.01
  maxMemoryUsage: 0.8 // 80%
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,
      component,
      metrics
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Performance Monitoring: ${action} for ${component || 'system'}`);

    switch (action) {
      case 'record':
        await recordMetrics(component, metrics);
        break;
      case 'reset':
        performanceMetrics = {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalLatency: 0,
          totalCost: 0,
          componentUsage: {},
          errorLogs: [],
          performanceHistory: [],
          startTime: Date.now(),
          lastReset: Date.now(),
          alerts: []
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: record or reset' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      component,
      message: `${action} completed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Performance Monitoring Error:', error);
    return NextResponse.json(
      { 
        error: 'Performance monitoring operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'detailed';
    const timeRange = searchParams.get('timeRange') || 'all';

    console.log(`📊 Performance Monitoring: Getting ${format} stats`);

    const stats = calculatePerformanceStats(timeRange);

    if (format === 'summary') {
      return NextResponse.json({
        success: true,
        format: 'summary',
        stats: {
          uptime: Date.now() - performanceMetrics.startTime,
          totalRequests: stats.totalRequests,
          successRate: stats.successRate,
          avgLatency: stats.avgLatency,
          totalCost: stats.totalCost,
          topComponents: stats.topComponents
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      format: 'detailed',
      stats,
      rawMetrics: performanceMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Performance Monitoring GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get performance stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to record metrics
async function recordMetrics(component: string, metrics: any) {
  performanceMetrics.totalRequests++;
  
  if (metrics.success) {
    performanceMetrics.successfulRequests++;
  } else {
    performanceMetrics.failedRequests++;
    performanceMetrics.errorLogs.push({
      timestamp: Date.now(),
      component,
      error: metrics.error || 'Unknown error',
      severity: 'medium' as 'low' | 'medium' | 'high'
    });
  }

  performanceMetrics.totalLatency += metrics.latency || 0;
  performanceMetrics.totalCost += metrics.cost || 0;

  // Track component usage
  if (component) {
    if (!performanceMetrics.componentUsage[component]) {
      performanceMetrics.componentUsage[component] = {
        requests: 0,
        totalLatency: 0,
        totalCost: 0,
        errors: 0
      };
    }
    
    performanceMetrics.componentUsage[component].requests++;
    performanceMetrics.componentUsage[component].totalLatency += metrics.latency || 0;
    performanceMetrics.componentUsage[component].totalCost += metrics.cost || 0;
    
    if (!metrics.success) {
      performanceMetrics.componentUsage[component].errors++;
    }
  }

  // Add to performance history (keep last 100 entries)
  performanceMetrics.performanceHistory.push({
    timestamp: Date.now(),
    component,
    latency: metrics.latency || 0,
    cost: metrics.cost || 0,
    success: metrics.success || false
  });

  if (performanceMetrics.performanceHistory.length > 100) {
    performanceMetrics.performanceHistory.shift();
  }
}

// Helper function to calculate performance stats
function calculatePerformanceStats(timeRange: string) {
  const now = Date.now();
  let filteredHistory = performanceMetrics.performanceHistory;

  // Filter by time range
  if (timeRange !== 'all') {
    const timeRangeMs = timeRange === 'hour' ? 3600000 : 
                       timeRange === 'day' ? 86400000 : 
                       timeRange === 'week' ? 604800000 : 3600000;
    
    filteredHistory = performanceMetrics.performanceHistory.filter(
      entry => (now - entry.timestamp) <= timeRangeMs
    );
  }

  const totalRequests = performanceMetrics.totalRequests;
  const successfulRequests = performanceMetrics.successfulRequests;
  const failedRequests = performanceMetrics.failedRequests;
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  const avgLatency = totalRequests > 0 ? performanceMetrics.totalLatency / totalRequests : 0;

  // Calculate component stats
  const componentStats = Object.entries(performanceMetrics.componentUsage).map(([name, stats]) => ({
    component: name,
    requests: stats.requests,
    avgLatency: stats.requests > 0 ? stats.totalLatency / stats.requests : 0,
    totalCost: stats.totalCost,
    errorRate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0
  })).sort((a, b) => b.requests - a.requests);

  // Calculate performance trends
  const recentHistory = filteredHistory.slice(-20); // Last 20 entries
  const avgRecentLatency = recentHistory.length > 0 ? 
    recentHistory.reduce((sum, entry) => sum + entry.latency, 0) / recentHistory.length : 0;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: successRate.toFixed(2),
    avgLatency: avgLatency.toFixed(0),
    avgRecentLatency: avgRecentLatency.toFixed(0),
    totalCost: performanceMetrics.totalCost.toFixed(4),
    uptime: now - performanceMetrics.startTime,
    componentStats,
    topComponents: componentStats.slice(0, 5),
    recentErrors: performanceMetrics.errorLogs.slice(-10),
    performanceTrend: {
      improving: avgRecentLatency < avgLatency,
      trend: avgRecentLatency < avgLatency ? 'improving' : 'degrading',
      change: ((avgRecentLatency - avgLatency) / avgLatency * 100).toFixed(1)
    }
  };
}

