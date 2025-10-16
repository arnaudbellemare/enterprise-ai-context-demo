import { NextRequest, NextResponse } from 'next/server';
import { dynamicScaler } from '@/lib/dynamic-scaling';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { action, metrics, config } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log(`⚡ Dynamic Scaling - Action: ${action}`);

    switch (action) {
      case 'record_metrics':
        if (!metrics) {
          return NextResponse.json(
            { error: 'Metrics are required' },
            { status: 400 }
          );
        }

        dynamicScaler.recordMetrics(metrics);
        console.log(`   ✅ Metrics recorded`);

        return NextResponse.json({
          success: true,
          message: 'Metrics recorded',
          timestamp: new Date().toISOString()
        });

      case 'make_decision':
        const decision = dynamicScaler.makeScalingDecision();
        console.log(`   🎯 Decision: ${decision.action}`);
        console.log(`   📊 Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
        console.log(`   💰 Cost: $${decision.estimatedCost.toFixed(2)}/hour`);

        return NextResponse.json({
          success: true,
          decision,
          timestamp: new Date().toISOString()
        });

      case 'execute_scaling':
        if (!metrics) {
          return NextResponse.json(
            { error: 'Decision is required for execution' },
            { status: 400 }
          );
        }

        const executed = dynamicScaler.executeScaling(metrics);
        console.log(`   ${executed ? '✅' : '❌'} Scaling ${executed ? 'executed' : 'failed'}`);

        return NextResponse.json({
          success: executed,
          message: executed ? 'Scaling executed' : 'Scaling failed',
          timestamp: new Date().toISOString()
        });

      case 'update_config':
        if (!config) {
          return NextResponse.json(
            { error: 'Config is required' },
            { status: 400 }
          );
        }

        dynamicScaler.updateConfig(config);
        console.log(`   ✅ Config updated`);

        return NextResponse.json({
          success: true,
          message: 'Config updated',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: record_metrics, make_decision, execute_scaling, or update_config' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Dynamic Scaling error:', error);
    return NextResponse.json(
      { error: error.message || 'Scaling operation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = dynamicScaler.getScalingStats();
    const status = dynamicScaler.getSystemStatus();
    
    return NextResponse.json({
      success: true,
      stats,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Dynamic Scaling stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get scaling stats' },
      { status: 500 }
    );
  }
}
