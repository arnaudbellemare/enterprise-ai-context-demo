/**
 * REFRAG Vector-Passing Benchmark API
 * 
 * Endpoints:
 * - POST /api/refrag/benchmark: Run benchmark comparing vector-passing vs text-passing
 * - GET /api/refrag/benchmark: Get benchmark test definitions
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFRAGBenchmark } from '../../../../lib/refrag-benchmark';
import { createLogger } from '../../../../lib/walt/logger';

const logger = createLogger('REFRAGBenchmarkAPI');

const benchmark = new REFRAGBenchmark();

export async function GET(request: NextRequest) {
  try {
    const tests = benchmark.getTests();
    
    return NextResponse.json({
      success: true,
      tests: tests.map(t => ({
        query: t.query,
        expectedContext: t.expectedContext,
        chunkCount: t.chunks.length
      })),
      available: {
        perplexity: !!process.env.PERPLEXITY_API_KEY,
        ollama: true // Will be checked at runtime
      }
    });
  } catch (error: any) {
    logger.error('Failed to get benchmark tests', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, testIndex } = body;

    if (!provider || !['perplexity', 'ollama'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider. Use "perplexity" or "ollama"' },
        { status: 400 }
      );
    }

    // Check provider availability
    if (provider === 'perplexity' && !process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'PERPLEXITY_API_KEY not configured' },
        { status: 400 }
      );
    }

    if (provider === 'ollama') {
      try {
        const ollamaCheck = await fetch('http://localhost:11434/api/tags', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        if (!ollamaCheck.ok) {
          return NextResponse.json(
            { success: false, error: 'Ollama not available. Start Ollama server first.' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Ollama not available. Start Ollama server first.' },
          { status: 400 }
        );
      }
    }

    logger.info('Running benchmark', { provider, testIndex });

    let results;

    if (testIndex !== undefined) {
      // Run single test
      const tests = benchmark.getTests();
      if (testIndex < 0 || testIndex >= tests.length) {
        return NextResponse.json(
          { success: false, error: `Invalid test index. Use 0-${tests.length - 1}` },
          { status: 400 }
        );
      }
      const singleResult = await benchmark.runBenchmark(tests[testIndex], provider);
      results = [singleResult];
    } else {
      // Run all tests
      results = await benchmark.runAllBenchmarks(provider);
    }

    const summary = benchmark.getSummary(results);

    return NextResponse.json({
      success: true,
      provider,
      summary: {
        testCount: summary.testCount,
        averageSpeedups: {
          ttft: `${summary.averageSpeedups.ttft.toFixed(2)}x`,
          ttit: `${summary.averageSpeedups.ttit.toFixed(2)}x`,
          throughput: `${summary.averageSpeedups.throughput.toFixed(2)}x`,
          tokenEfficiency: `${summary.averageSpeedups.tokenEfficiency.toFixed(1)}%`
        }
      },
      results: results.map(r => ({
        query: r.test.query,
        comparison: {
          ttft_speedup: `${r.comparison.ttft_speedup.toFixed(2)}x`,
          ttit_speedup: `${r.comparison.ttit_speedup.toFixed(2)}x`,
          throughput_speedup: `${r.comparison.throughput_speedup.toFixed(2)}x`,
          tokenEfficiency: `${r.comparison.tokenEfficiency.toFixed(1)}%`
        },
        vectorPassing: {
          ttft_ms: r.vectorPassing.ttft_ms,
          ttit_ms: r.vectorPassing.ttit_ms,
          totalTime_ms: r.vectorPassing.totalTime_ms,
          throughput_improvement: r.vectorPassing.throughput_improvement.toFixed(2),
          method: r.vectorPassing.method
        },
        textPassing: {
          ttft_ms: r.textPassing.ttft_ms,
          ttit_ms: r.textPassing.ttit_ms,
          totalTime_ms: r.textPassing.totalTime_ms
        }
      }))
    });
  } catch (error: any) {
    logger.error('Benchmark failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

