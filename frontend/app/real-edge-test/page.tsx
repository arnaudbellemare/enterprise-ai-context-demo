'use client';

import { useState } from 'react';

interface TestResult {
  query: string;
  baseline: {
    answer: string;
    latency_ms: number;
    cost: number;
    accuracy_score: number;
    quality_score: number;
  };
  permutation: {
    answer: string;
    latency_ms: number;
    cost: number;
    accuracy_score: number;
    quality_score: number;
    components_used: string[];
  };
  winner: 'baseline' | 'permutation' | 'tie';
  edge_metrics: {
    latency_difference_ms: number;
    cost_difference: number;
    accuracy_improvement: number;
    quality_improvement: number;
  };
}

interface BenchmarkReport {
  test_date: string;
  total_tests: number;
  permutation_wins: number;
  baseline_wins: number;
  ties: number;
  avg_accuracy_improvement: number;
  avg_quality_improvement: number;
  avg_latency_overhead_ms: number;
  avg_cost_overhead: number;
  edge_confirmed: boolean;
  results: TestResult[];
}

export default function RealEdgeTestPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/benchmark/real-edge-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8">
      {/* Header */}
      <div className="border-2 border-green-400 mb-8 p-6">
        <h1 className="text-3xl font-bold mb-2 text-center">🔥 REAL EDGE TEST 🔥</h1>
        <p className="text-center text-sm">NO MOCKS, NO BULLSHIT - Does PERMUTATION Actually Have an Edge?</p>
        <div className="mt-4 text-xs text-center border-t border-green-400 pt-4">
          <p>Baseline: Direct LLM Call (Teacher Model only)</p>
          <p>PERMUTATION: Full System (All 11 Components)</p>
        </div>
      </div>

      {/* Run Button */}
      <div className="text-center mb-8">
        <button
          onClick={runBenchmark}
          disabled={loading}
          className={`px-8 py-4 text-lg font-bold border-2 transition-all ${
            loading
              ? 'border-yellow-400 text-yellow-400 cursor-wait animate-pulse'
              : 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black'
          }`}
        >
          {loading ? '⏳ RUNNING REAL TESTS...' : '▶ RUN EDGE TEST'}
        </button>
        {loading && (
          <p className="mt-4 text-sm animate-pulse">
            Testing 5 real queries... This will take 30-60 seconds...
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-2 border-red-500 p-4 mb-8">
          <h3 className="text-red-500 font-bold mb-2">❌ ERROR</h3>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {report && (
        <div>
          {/* Verdict */}
          <div className={`border-4 p-6 mb-8 ${
            report.edge_confirmed ? 'border-green-400' : 'border-red-500'
          }`}>
            <h2 className="text-2xl font-bold mb-4 text-center">
              {report.edge_confirmed ? '✅ EDGE CONFIRMED' : '❌ NO EDGE DETECTED'}
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Win/Loss */}
              <div className="border border-green-400 p-4">
                <h3 className="font-bold mb-2">🏆 WIN/LOSS</h3>
                <div className="space-y-1 text-sm">
                  <p>PERMUTATION Wins: <span className="float-right font-bold">{report.permutation_wins}/{report.total_tests}</span></p>
                  <p>Baseline Wins: <span className="float-right font-bold">{report.baseline_wins}/{report.total_tests}</span></p>
                  <p>Ties: <span className="float-right font-bold">{report.ties}/{report.total_tests}</span></p>
                </div>
              </div>

              {/* Performance */}
              <div className="border border-green-400 p-4">
                <h3 className="font-bold mb-2">📈 PERFORMANCE</h3>
                <div className="space-y-1 text-sm">
                  <p>Accuracy: <span className={`float-right font-bold ${report.avg_accuracy_improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {report.avg_accuracy_improvement > 0 ? '+' : ''}{report.avg_accuracy_improvement}%
                  </span></p>
                  <p>Quality: <span className={`float-right font-bold ${report.avg_quality_improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {report.avg_quality_improvement > 0 ? '+' : ''}{report.avg_quality_improvement}%
                  </span></p>
                  <p>Latency: <span className="float-right font-bold text-yellow-400">
                    +{report.avg_latency_overhead_ms}ms
                  </span></p>
                  <p>Cost: <span className="float-right font-bold text-yellow-400">
                    +${report.avg_cost_overhead.toFixed(4)}
                  </span></p>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="border-t border-green-400 pt-4 text-sm">
              <p className="text-center">
                {report.edge_confirmed ? (
                  <>
                    <span className="text-green-400 font-bold">VERDICT:</span> PERMUTATION provides measurable value through its 11-component system.
                    {report.avg_accuracy_improvement > 10 && ' Accuracy gains are significant.'}
                    {report.avg_quality_improvement > 15 && ' Quality improvements justify the overhead.'}
                  </>
                ) : (
                  <>
                    <span className="text-red-400 font-bold">VERDICT:</span> Direct LLM calls perform comparably or better.
                    {report.avg_latency_overhead_ms > 5000 && ' Latency overhead may not be justified.'}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-green-400 pb-2">DETAILED TEST RESULTS</h3>
            
            {report.results.map((result, idx) => (
              <div key={idx} className="border border-green-400 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">TEST #{idx + 1}</h4>
                    <p className="text-xs text-gray-400">{result.query}</p>
                  </div>
                  <div className={`px-3 py-1 border-2 font-bold text-sm ${
                    result.winner === 'permutation' ? 'border-green-400 text-green-400' :
                    result.winner === 'baseline' ? 'border-red-400 text-red-400' :
                    'border-yellow-400 text-yellow-400'
                  }`}>
                    {result.winner === 'permutation' ? '🏆 PERMUTATION' :
                     result.winner === 'baseline' ? '🏆 BASELINE' :
                     '🤝 TIE'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Baseline */}
                  <div className="border border-gray-600 p-3">
                    <h5 className="font-bold mb-2 text-red-400">🔹 BASELINE (Direct LLM)</h5>
                    <p className="mb-2">Accuracy: {result.baseline.accuracy_score}%</p>
                    <p className="mb-2">Quality: {result.baseline.quality_score}%</p>
                    <p className="mb-2">Latency: {result.baseline.latency_ms.toFixed(0)}ms</p>
                    <p className="mb-2">Cost: ${result.baseline.cost.toFixed(4)}</p>
                    <div className="mt-2 p-2 bg-gray-900 border border-gray-700">
                      <p className="text-gray-400 line-clamp-3">{result.baseline.answer.substring(0, 150)}...</p>
                    </div>
                  </div>

                  {/* PERMUTATION */}
                  <div className="border border-gray-600 p-3">
                    <h5 className="font-bold mb-2 text-green-400">🔸 PERMUTATION (Full System)</h5>
                    <p className="mb-2">Accuracy: {result.permutation.accuracy_score}%</p>
                    <p className="mb-2">Quality: {result.permutation.quality_score}%</p>
                    <p className="mb-2">Latency: {result.permutation.latency_ms.toFixed(0)}ms</p>
                    <p className="mb-2">Cost: ${result.permutation.cost.toFixed(4)}</p>
                    <p className="mb-2 text-cyan-400">Components: {result.permutation.components_used.length}</p>
                    <div className="mt-2 p-2 bg-gray-900 border border-gray-700">
                      <p className="text-gray-400 line-clamp-3">{result.permutation.answer.substring(0, 150)}...</p>
                    </div>
                  </div>
                </div>

                {/* Edge Metrics */}
                <div className="mt-3 pt-3 border-t border-gray-600 text-xs">
                  <p className="font-bold mb-1">EDGE METRICS:</p>
                  <div className="flex gap-4">
                    <span className={result.edge_metrics.accuracy_improvement > 0 ? 'text-green-400' : 'text-red-400'}>
                      Accuracy: {result.edge_metrics.accuracy_improvement > 0 ? '+' : ''}{result.edge_metrics.accuracy_improvement.toFixed(1)}%
                    </span>
                    <span className={result.edge_metrics.quality_improvement > 0 ? 'text-green-400' : 'text-red-400'}>
                      Quality: {result.edge_metrics.quality_improvement > 0 ? '+' : ''}{result.edge_metrics.quality_improvement.toFixed(1)}%
                    </span>
                    <span className="text-yellow-400">
                      Latency: +{result.edge_metrics.latency_difference_ms.toFixed(0)}ms
                    </span>
                    <span className="text-yellow-400">
                      Cost: +${result.edge_metrics.cost_difference.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!report && !loading && (
        <div className="border border-gray-600 p-6 mt-8 text-sm">
          <h3 className="font-bold mb-3">📋 HOW THIS TEST WORKS:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            <li>Runs 5 diverse, challenging queries requiring real-time data, calculations, and domain expertise</li>
            <li>Tests BASELINE (direct Teacher Model call) vs PERMUTATION (full 11-component system)</li>
            <li>Measures accuracy, quality, latency, and cost for each approach</li>
            <li>Determines winner based on real performance metrics (no mocks, no simulations)</li>
            <li>Confirms edge if PERMUTATION shows &gt;10% quality improvement OR &gt;15% accuracy improvement</li>
          </ol>
        </div>
      )}
    </div>
  );
}


