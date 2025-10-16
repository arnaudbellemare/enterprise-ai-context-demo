import { NextRequest, NextResponse } from 'next/server';
import { realCostOptimizationEngine } from '@/lib/real-cost-optimization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      query,
      requirements = {},
      context = {
        userTier: 'premium',
        usageHistory: [],
        budgetRemaining: 10.0
      }
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`💰 Real Cost Optimization - Query: ${query.substring(0, 50)}...`);
    console.log(`   User Tier: ${context.userTier}`);
    console.log(`   Budget Remaining: $${context.budgetRemaining}`);
    console.log(`   Requirements:`, requirements);

    // Execute cost optimization
    const result = await realCostOptimizationEngine.optimizeCost({
      query,
      requirements,
      context
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Real Cost Optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Cost optimization failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = realCostOptimizationEngine.getCostOptimizationStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Real Cost Optimization stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cost optimization stats' },
      { status: 500 }
    );
  }
}
