/**
 * Context Metrics API
 * 
 * Provides endpoints for accessing extended intelligence metrics and context quality dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extendedIntelligenceMetrics } from '@/lib/extended-intelligence-metrics';
import { contextQualityDashboard } from '@/lib/context-quality-dashboard';
import { contextABTesting } from '@/lib/context-ab-testing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const domain = searchParams.get('domain') || 'general';
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000'); // 1 hour default
    
    switch (endpoint) {
      case 'extended-intelligence':
        // Get aggregated extended intelligence metrics
        const metrics = extendedIntelligenceMetrics.getAggregatedMetrics(timeWindow);
        const trends = extendedIntelligenceMetrics.getContextQualityTrends();
        
        return NextResponse.json({
          success: true,
          metrics,
          trends,
          timestamp: new Date().toISOString(),
        });
        
      case 'quality-dashboard':
        // Get context quality dashboard data
        const dashboard = contextQualityDashboard.getDashboardData();
        const qualityTrends = contextQualityDashboard.getQualityTrends(timeWindow);
        
        return NextResponse.json({
          success: true,
          dashboard,
          trends: qualityTrends,
          timestamp: new Date().toISOString(),
        });
        
      case 'ab-test-results':
        // Get A/B test results
        const limit = parseInt(searchParams.get('limit') || '10');
        const testResults = contextABTesting.getTestResults(domain, limit);
        const winningConfig = contextABTesting.getWinningConfiguration(domain);
        
        return NextResponse.json({
          success: true,
          testResults,
          winningConfiguration: winningConfig,
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid endpoint. Use: extended-intelligence, quality-dashboard, or ab-test-results',
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Context metrics API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch context metrics',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    switch (action) {
      case 'record-metrics':
        // Record extended intelligence metrics
        const metrics = await extendedIntelligenceMetrics.recordMetrics(params);
        return NextResponse.json({
          success: true,
          metrics,
          timestamp: new Date().toISOString(),
        });
        
      case 'record-quality':
        // Record context quality metrics
        contextQualityDashboard.recordQuality(params.quality);
        return NextResponse.json({
          success: true,
          message: 'Quality metrics recorded',
          timestamp: new Date().toISOString(),
        });
        
      case 'run-ab-test':
        // Run A/B test (requires generateAnswer function - would need to be passed or implemented)
        return NextResponse.json({
          success: false,
          error: 'A/B testing requires generateAnswer function. Implement in pipeline.',
        }, { status: 400 });
        
      case 'clear':
        // Clear metrics
        const clearType = params.type || 'all';
        if (clearType === 'metrics') {
          extendedIntelligenceMetrics.clear();
        } else if (clearType === 'dashboard') {
          contextQualityDashboard.clear();
        } else if (clearType === 'ab-tests') {
          contextABTesting.clear(params.domain);
        } else {
          extendedIntelligenceMetrics.clear();
          contextQualityDashboard.clear();
          contextABTesting.clear();
        }
        
        return NextResponse.json({
          success: true,
          message: `Cleared ${clearType}`,
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: record-metrics, record-quality, run-ab-test, or clear',
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Context metrics API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process request',
    }, { status: 500 });
  }
}

