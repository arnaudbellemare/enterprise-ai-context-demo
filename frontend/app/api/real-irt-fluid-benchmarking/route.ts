import { NextRequest, NextResponse } from 'next/server';
import { realIRTFluidBenchmarking } from '@/lib/real-irt-fluid-benchmarking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      lm_responses, 
      benchmark = 'mmlu',
      start_ability = 0,
      n_max = 50,
      estimation_method = 'map'
    } = await request.json();

    if (!lm_responses) {
      return NextResponse.json(
        { error: 'Language model responses are required' },
        { status: 400 }
      );
    }

    console.log(`🧠 Real IRT Fluid Benchmarking - Benchmark: ${benchmark}`);
    console.log(`   Start ability: ${start_ability}`);
    console.log(`   Max items: ${n_max}`);
    console.log(`   Estimation method: ${estimation_method}`);

    // Run Fluid Benchmarking
    const result = await realIRTFluidBenchmarking.runFluidBenchmarking(lm_responses, {
      start_ability,
      n_max,
      estimation_method,
      benchmark
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Real IRT Fluid Benchmarking error:', error);
    return NextResponse.json(
      { error: error.message || 'Fluid benchmarking failed' },
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
