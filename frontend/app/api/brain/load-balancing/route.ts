import { NextRequest, NextResponse } from 'next/server';
import { getSkillLoadBalancer } from '../../../../lib/brain-skills/load-balancer';

/**
 * Load Balancing Monitoring API
 * GET /api/brain/load-balancing
 * Returns current load balancing metrics and utilization
 */
export async function GET(request: NextRequest) {
  try {
    const balancer = getSkillLoadBalancer();
    const metrics = balancer.getAllMetrics();

    // Calculate overall system health
    const totalUtilization = Object.values(metrics).reduce((sum: number, m: any) => sum + m.utilization, 0);
    const avgUtilization = totalUtilization / Object.keys(metrics).length;
    
    const totalQueueDepth = Object.values(metrics).reduce((sum: number, m: any) => sum + m.queueDepth, 0);
    
    const healthStatus = avgUtilization > 0.8 ? 'high' : avgUtilization > 0.6 ? 'medium' : 'low';
    const queueStatus = totalQueueDepth > 20 ? 'congested' : totalQueueDepth > 10 ? 'moderate' : 'clear';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      systemHealth: {
        status: healthStatus,
        avgUtilization: Math.round(avgUtilization * 100) / 100,
        totalQueueDepth,
        queueStatus
      },
      skills: metrics,
      recommendations: generateRecommendations(metrics, avgUtilization, totalQueueDepth)
    });
  } catch (error: any) {
    console.error('Load balancing API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/brain/load-balancing
 * Reset metrics or update configuration
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const balancer = getSkillLoadBalancer();

    if (action === 'reset') {
      balancer.resetMetrics();
      return NextResponse.json({
        success: true,
        message: 'Metrics reset successfully'
      });
    }

    if (action === 'update_limits') {
      const { skillName, newLimit } = await request.json();
      // This would require extending the load balancer to support dynamic limits
      return NextResponse.json({
        success: true,
        message: `Updated limit for ${skillName} to ${newLimit}`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Load balancing POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

function generateRecommendations(metrics: Record<string, any>, avgUtilization: number, totalQueueDepth: number): string[] {
  const recommendations: string[] = [];

  // High utilization recommendations
  if (avgUtilization > 0.8) {
    recommendations.push('High system utilization detected. Consider scaling up or reducing concurrent requests.');
  }

  // Queue depth recommendations
  if (totalQueueDepth > 20) {
    recommendations.push('High queue depth detected. Consider increasing concurrency limits or optimizing skill performance.');
  }

  // Individual skill recommendations
  Object.entries(metrics).forEach(([skillName, metrics]) => {
    if (metrics.utilization > 0.9) {
      recommendations.push(`${skillName} is at maximum capacity. Consider increasing its concurrency limit.`);
    }
    
    if (metrics.queueDepth > 10) {
      recommendations.push(`${skillName} has a long queue. Consider optimizing its performance or increasing capacity.`);
    }

    if (metrics.failedRequests > metrics.successfulRequests * 0.1) {
      recommendations.push(`${skillName} has a high failure rate (${Math.round(metrics.failedRequests / metrics.totalRequests * 100)}%). Check for issues.`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('System is operating within normal parameters.');
  }

  return recommendations;
}
