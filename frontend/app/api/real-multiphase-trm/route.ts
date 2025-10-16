import { NextRequest, NextResponse } from 'next/server';
import { realMultiPhaseTRMEngine } from '@/lib/real-multiphase-trm-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query, domain = 'general', optimizationLevel = 'high' } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🧠 Real Multi-Phase TRM - Query: ${query.substring(0, 50)}...`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Optimization Level: ${optimizationLevel}`);

    // Execute multi-phase TRM processing
    const result = await realMultiPhaseTRMEngine.executeMultiPhaseTRM(query, domain);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Real Multi-Phase TRM error:', error);
    return NextResponse.json(
      { error: error.message || 'Multi-phase TRM processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = realMultiPhaseTRMEngine.getExecutionStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Real Multi-Phase TRM stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get TRM stats' },
      { status: 500 }
    );
  }
}
