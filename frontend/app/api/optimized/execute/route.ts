import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedEngine, OptimizedQuery } from '@/lib/optimized-permutation-engine';

/**
 * Optimized Permutation Execution API
 * 
 * Uses all 3 phases of optimization:
 * - Phase 1: Smart routing, caching, IRT specialist
 * - Phase 2: TRM engine, ACE fallback, cost optimization
 * - Phase 3: Parallel execution, auto-optimization, dynamic scaling
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, task_type, priority, requirements, use_parallel } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Optimized Permutation API: Starting execution');
    console.log(`📋 Query: ${query}`);
    console.log(`🎯 Task Type: ${task_type || 'general'}`);

    const optimizedQuery: OptimizedQuery = {
      query,
      task_type: task_type || 'general',
      priority: priority || 'medium',
      requirements: requirements || {},
      use_parallel: use_parallel || false
    };

    const engine = getOptimizedEngine();
    const result = await engine.execute(optimizedQuery);

    console.log('✅ Optimized execution complete');
    console.log(`💾 Cached: ${result.performance.cached}`);
    console.log(`⚡ Latency: ${result.performance.latency_ms}ms`);
    console.log(`💰 Cost: $${result.performance.cost.toFixed(4)}`);
    console.log(`🎯 Optimizations: ${result.optimization_applied.length}`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Optimized Permutation Error:', error);
    return NextResponse.json(
      { error: 'Execution failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const engine = getOptimizedEngine();
    const stats = engine.getSystemStats();

    return NextResponse.json({
      status: 'All 3 Optimization Phases Active',
      stats,
      capabilities: {
        phase_1: [
          'Smart routing based on task type',
          'KV Cache for all optimization tasks',
          'Teacher Model result caching',
          'IRT specialist routing'
        ],
        phase_2: [
          'TRM as primary reasoning engine',
          'ACE Framework as OCR fallback',
          'Synthesis Agent optimization',
          'Cost-based component selection'
        ],
        phase_3: [
          'Advanced caching strategies',
          'Parallel component execution',
          'Performance monitoring and auto-optimization',
          'Dynamic component scaling'
        ]
      }
    });

  } catch (error: any) {
    console.error('❌ Stats Error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats', details: error.message },
      { status: 500 }
    );
  }
}




