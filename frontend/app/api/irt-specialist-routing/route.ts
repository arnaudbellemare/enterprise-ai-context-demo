import { NextRequest, NextResponse } from 'next/server';
import { realIRTFluidBenchmarking } from '@/lib/real-irt-fluid-benchmarking';

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

    console.log(`🧠 Real IRT Fluid Benchmarking - Query: ${query.substring(0, 50)}...`);
    console.log(`   Domain: ${domain}`);

    // Create mock language model responses for testing
    const mockResponses = {
      subject_id: 'test_model',
      responses: {
        'item_1': Math.random() > 0.5 ? 1 : 0,
        'item_2': Math.random() > 0.5 ? 1 : 0,
        'item_3': Math.random() > 0.5 ? 1 : 0,
        'item_4': Math.random() > 0.5 ? 1 : 0,
        'item_5': Math.random() > 0.5 ? 1 : 0
      }
    };

    // Run real Fluid Benchmarking
    const result = await realIRTFluidBenchmarking.runFluidBenchmarking(mockResponses, {
      start_ability: 0,
      n_max: 20,
      estimation_method: 'map',
      benchmark: 'mmlu'
    });

    console.log(`   ✅ Real IRT Fluid Benchmarking completed`);
    console.log(`   📊 Final ability: ${result.final_ability.toFixed(3)}`);
    console.log(`   🎯 Accuracy: ${(result.benchmark_performance.accuracy * 100).toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      result,
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
    const availableBenchmarks = realIRTFluidBenchmarking.getAvailableBenchmarks();
    const benchmarkStats = availableBenchmarks.map(benchmark => ({
      benchmark,
      stats: realIRTFluidBenchmarking.getIRTModelStats(benchmark)
    }));
    
    return NextResponse.json({
      success: true,
      available_benchmarks: availableBenchmarks,
      benchmark_stats: benchmarkStats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Real IRT stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get IRT stats' },
      { status: 500 }
    );
  }
}
