/**
 * Enhanced Unified Pipeline API
 * 
 * The COMPLETE PERMUTATION system in one endpoint.
 * Orchestrates ALL 12 layers for maximum quality + efficiency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedPipeline, type EnhancedPipelineConfig } from '../../../lib/enhanced-unified-pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      query,
      domain,
      context,
      config
    } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Execute enhanced pipeline
    const result = await enhancedPipeline.execute(
      query,
      domain,
      context
    );
    
    // If custom config provided, use new instance
    if (config) {
      enhancedPipeline.updateConfig(config);
    }
    
    return NextResponse.json({
      success: true,
      result,
      performance_metrics: enhancedPipeline.getPerformanceMetrics()
    });
    
  } catch (error: any) {
    console.error('Enhanced pipeline error:', error);
    
    return NextResponse.json(
      { 
        error: 'Pipeline execution failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get performance metrics
    const metrics = enhancedPipeline.getPerformanceMetrics();
    
    return NextResponse.json({
      success: true,
      pipeline: 'Enhanced Unified PERMUTATION Pipeline',
      version: '2.0',
      layers: 12,
      components: metrics.enabled_components,
      metrics
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

