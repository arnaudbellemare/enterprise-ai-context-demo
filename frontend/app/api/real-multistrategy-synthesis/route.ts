import { NextRequest, NextResponse } from 'next/server';
import { realMultiStrategySynthesisEngine } from '@/lib/real-multistrategy-synthesis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      sources, 
      targetLength, 
      qualityThreshold = 0.8,
      strategy = 'all' // 'all', 'hierarchical', 'consensus', 'weighted_ensemble', 'adversarial', 'evolutionary'
    } = await request.json();

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        { error: 'Sources array is required and must not be empty' },
        { status: 400 }
      );
    }

    console.log(`🧬 Real Multi-Strategy Synthesis - ${sources.length} sources`);
    console.log(`   Target Length: ${targetLength || 'auto'}`);
    console.log(`   Quality Threshold: ${qualityThreshold}`);
    console.log(`   Strategy: ${strategy}`);

    // Execute multi-strategy synthesis
    const result = await realMultiStrategySynthesisEngine.executeMultiStrategySynthesis(
      sources,
      targetLength,
      qualityThreshold
    );

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Real Multi-Strategy Synthesis error:', error);
    return NextResponse.json(
      { error: error.message || 'Multi-strategy synthesis failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = realMultiStrategySynthesisEngine.getSynthesisStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Real Multi-Strategy Synthesis stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get synthesis stats' },
      { status: 500 }
    );
  }
}
