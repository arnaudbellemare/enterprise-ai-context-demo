import { NextRequest, NextResponse } from 'next/server';
import { irtSpecialistRouter } from '@/lib/irt-specialist-routing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query, domain, requirements = {} } = await request.json();

    if (!query || !domain) {
      return NextResponse.json(
        { error: 'Query and domain are required' },
        { status: 400 }
      );
    }

    console.log(`🧠 IRT Specialist Routing - Query: ${query.substring(0, 50)}...`);
    console.log(`   Domain: ${domain}`);

    // Get IRT-based routing decision
    const routingDecision = irtSpecialistRouter.routeQuery(query, domain, requirements);

    console.log(`   ✅ IRT Decision: ${routingDecision.selectedComponent}`);
    console.log(`   📊 Probability: ${(routingDecision.probability * 100).toFixed(1)}%`);
    console.log(`   🎯 Confidence: ${(routingDecision.confidence * 100).toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      routing: routingDecision,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('IRT Specialist Routing error:', error);
    return NextResponse.json(
      { error: error.message || 'IRT routing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = irtSpecialistRouter.getIRTStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('IRT stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get IRT stats' },
      { status: 500 }
    );
  }
}
