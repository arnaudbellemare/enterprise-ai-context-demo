import { NextRequest, NextResponse } from 'next/server';
import { synthesisAgentOptimizer } from '@/lib/synthesis-agent-optimization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sources, strategy = 'weighted_average', targetLength = 1000 } = await request.json();

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        { error: 'Sources array is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Synthesis Agent Optimization - ${sources.length} sources`);
    console.log(`   Strategy: ${strategy}`);
    console.log(`   Target length: ${targetLength}`);

    // Synthesize sources
    const result = synthesisAgentOptimizer.synthesizeSources(sources, strategy, targetLength);

    console.log(`   ✅ Synthesis completed`);
    console.log(`   📊 Quality: ${(result.quality * 100).toFixed(1)}%`);
    console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   ⚡ Time: ${result.metadata.synthesisTime}ms`);
    console.log(`   🔧 Conflicts resolved: ${result.metadata.conflictsResolved}`);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Synthesis Agent Optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Synthesis failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = synthesisAgentOptimizer.getSynthesisStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Synthesis Agent stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get synthesis stats' },
      { status: 500 }
    );
  }
}
