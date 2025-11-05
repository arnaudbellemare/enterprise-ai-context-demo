/**
 * Workflow Metrics API
 * 
 * Provides endpoints for accessing extended intelligence metrics for workflows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { workflowMetricsTracker } from '@/lib/workflow-metrics-integration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const all = searchParams.get('all') === 'true';
    
    if (all) {
      // Get all workflow metrics
      const allMetrics = workflowMetricsTracker.getAllWorkflowMetrics();
      
      // Calculate aggregate statistics
      const aggregate = {
        totalWorkflows: allMetrics.length,
        avgWorkflowQuality: allMetrics.length > 0
          ? allMetrics.reduce((sum, m) => sum + m.overallMetrics.workflowQuality, 0) / allMetrics.length
          : 0,
        avgIntelligenceExtension: allMetrics.length > 0
          ? allMetrics.reduce((sum, m) => sum + m.overallMetrics.avgIntelligenceExtension, 0) / allMetrics.length
          : 0,
        avgAgentContribution: allMetrics.length > 0
          ? allMetrics.reduce((sum, m) => sum + m.overallMetrics.avgAgentContribution, 0) / allMetrics.length
          : 0,
        avgContextContribution: allMetrics.length > 0
          ? allMetrics.reduce((sum, m) => sum + m.overallMetrics.avgContextContribution, 0) / allMetrics.length
          : 0,
      };
      
      return NextResponse.json({
        success: true,
        workflows: allMetrics,
        aggregate,
        timestamp: new Date().toISOString(),
      });
    } else if (workflowId) {
      // Get metrics for specific workflow
      const metrics = workflowMetricsTracker.getWorkflowMetrics(workflowId);
      
      if (!metrics) {
        return NextResponse.json({
          success: false,
          error: `Workflow ${workflowId} not found`,
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Either workflowId or all=true must be provided',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Workflow metrics API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch workflow metrics',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    
    if (workflowId) {
      workflowMetricsTracker.clear(workflowId);
      return NextResponse.json({
        success: true,
        message: `Cleared metrics for workflow ${workflowId}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      workflowMetricsTracker.clearMetrics();
      return NextResponse.json({
        success: true,
        message: 'Cleared all workflow metrics',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Workflow metrics API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to clear workflow metrics',
    }, { status: 500 });
  }
}

