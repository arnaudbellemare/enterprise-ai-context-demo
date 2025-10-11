/**
 * Statistical Benchmark Component
 * Runs proper A/B testing with McNemar's test and statistical significance
 */

'use client';

import React, { useState } from 'react';

interface BenchmarkResults {
  benchmark: any;
  results: any;
  statisticalTests: any;
  conclusion: any;
  rawData?: any;
}

export default function StatisticalBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResults | null>(null);

  const runBenchmark = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const response = await fetch('/api/arena/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testSuite: 'standard' })
      });

      const data = await response.json();
      setResults(data);
      
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-900 mb-2" style={{ fontFamily: 'monospace' }}>
            📊 Statistical Significance Testing
          </h2>
          <p className="text-sm text-gray-600">
            Rigorous A/B testing with McNemar's test, paired t-tests, and effect size analysis
          </p>
        </div>
        <button
          onClick={runBenchmark}
          disabled={isRunning}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          style={{ fontFamily: 'monospace' }}
        >
          {isRunning ? '⏳ Running Tests...' : '🧪 Run Statistical Benchmark'}
        </button>
      </div>

      {isRunning && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-purple-800 font-semibold mb-2">Running comprehensive benchmark suite...</p>
          <p className="text-sm text-purple-700">
            • Testing 5 different tasks on both systems<br/>
            • Measuring accuracy, cost, and response time<br/>
            • Calculating statistical significance<br/>
            • This may take 2-5 minutes...
          </p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Browserbase Results */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3" style={{ fontFamily: 'monospace' }}>
                🌐 Browserbase Arena
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Accuracy:</span>
                  <span className="font-bold text-blue-900">{results.results.browserbase.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Avg Cost:</span>
                  <span className="font-bold text-blue-900">${results.results.browserbase.avgCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Avg Time:</span>
                  <span className="font-bold text-blue-900">{results.results.browserbase.avgResponseTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tasks Correct:</span>
                  <span className="font-bold text-blue-900">
                    {results.results.browserbase.correctTasks}/{results.results.browserbase.totalTasks}
                  </span>
                </div>
              </div>
            </div>

            {/* ACE Results */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3" style={{ fontFamily: 'monospace' }}>
                🧠 Our ACE System
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Accuracy:</span>
                  <span className="font-bold text-green-900">{results.results.ace.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Avg Cost:</span>
                  <span className="font-bold text-green-900">${results.results.ace.avgCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Avg Time:</span>
                  <span className="font-bold text-green-900">{results.results.ace.avgResponseTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tasks Correct:</span>
                  <span className="font-bold text-green-900">
                    {results.results.ace.correctTasks}/{results.results.ace.totalTasks}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistical Significance */}
          <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-300">
            <h3 className="text-xl font-bold text-purple-900 mb-4" style={{ fontFamily: 'monospace' }}>
              📈 Statistical Significance Tests
            </h3>

            {/* McNemar's Test */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">McNemar's Test (Accuracy)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Test Statistic (χ²):</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{results.statisticalTests.mcnemarsTest.statistic.toFixed(3)}</code>
                </div>
                <div className="flex justify-between">
                  <span>P-value:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{results.statisticalTests.mcnemarsTest.pValue.toFixed(4)}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span>Statistically Significant:</span>
                  <span className={`px-3 py-1 rounded font-semibold ${
                    results.statisticalTests.mcnemarsTest.significant 
                      ? 'bg-green-200 text-green-900' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {results.statisticalTests.mcnemarsTest.significant ? '✅ YES (p < 0.05)' : '❌ NO (p > 0.05)'}
                  </span>
                </div>
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                  {results.statisticalTests.mcnemarsTest.interpretation}
                </div>
              </div>
            </div>

            {/* Paired t-test */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Paired t-test (Cost)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>t-Statistic:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{results.statisticalTests.pairedTTest.tStatistic.toFixed(3)}</code>
                </div>
                <div className="flex justify-between">
                  <span>P-value:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{results.statisticalTests.pairedTTest.pValue.toFixed(4)}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span>Statistically Significant:</span>
                  <span className={`px-3 py-1 rounded font-semibold ${
                    results.statisticalTests.pairedTTest.significant 
                      ? 'bg-green-200 text-green-900' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {results.statisticalTests.pairedTTest.significant ? '✅ YES (p < 0.05)' : '❌ NO (p > 0.05)'}
                  </span>
                </div>
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                  {results.statisticalTests.pairedTTest.interpretation}
                </div>
              </div>
            </div>

            {/* Effect Size */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Effect Size (Cohen's d)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Cohen's d:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{results.statisticalTests.effectSize.cohensD.toFixed(3)}</code>
                </div>
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                  {results.statisticalTests.effectSize.interpretation}
                </div>
              </div>
            </div>
          </div>

          {/* Contingency Matrix */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'monospace' }}>
              🔍 Where Systems Disagree (Contingency Matrix)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-100 border border-green-300 rounded p-4 text-center">
                <div className="text-3xl font-bold text-green-900">
                  {results.statisticalTests.contingencyMatrix.ace_only}
                </div>
                <div className="text-sm text-green-800 mt-2">
                  ACE Correct, Browserbase Wrong
                </div>
              </div>
              <div className="bg-blue-100 border border-blue-300 rounded p-4 text-center">
                <div className="text-3xl font-bold text-blue-900">
                  {results.statisticalTests.contingencyMatrix.browserbase_only}
                </div>
                <div className="text-sm text-blue-800 mt-2">
                  Browserbase Correct, ACE Wrong
                </div>
              </div>
              <div className="bg-gray-100 border border-gray-300 rounded p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {results.statisticalTests.contingencyMatrix.both_correct}
                </div>
                <div className="text-sm text-gray-700 mt-2">
                  Both Correct
                </div>
              </div>
              <div className="bg-red-100 border border-red-300 rounded p-4 text-center">
                <div className="text-3xl font-bold text-red-900">
                  {results.statisticalTests.contingencyMatrix.both_wrong}
                </div>
                <div className="text-sm text-red-800 mt-2">
                  Both Wrong
                </div>
              </div>
            </div>
          </div>

          {/* Final Recommendation */}
          <div className={`rounded-lg p-6 border-2 ${
            results.conclusion.statisticallySignificant 
              ? 'bg-green-50 border-green-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'monospace' }}>
              🏆 Statistical Conclusion ({results.conclusion.confidence} Confidence)
            </h3>
            <div className="bg-white rounded p-4 mb-4 whitespace-pre-wrap text-sm" style={{ fontFamily: 'monospace' }}>
              {results.conclusion.summary}
            </div>
            <div className={`text-lg font-bold p-4 rounded ${
              results.conclusion.recommendation.includes('ACE') 
                ? 'bg-green-200 text-green-900' 
                : 'bg-yellow-200 text-yellow-900'
            }`}>
              {results.conclusion.recommendation}
            </div>
          </div>

          {/* Download Results */}
          <div className="flex gap-4">
            <button
              onClick={() => downloadBenchmarkResults(results)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              style={{ fontFamily: 'monospace' }}
            >
              📥 Download Full Statistical Report
            </button>
            <button
              onClick={() => downloadRawData(results)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              style={{ fontFamily: 'monospace' }}
            >
              📊 Download Raw Data (CSV)
            </button>
          </div>
        </div>
      )}

      {!results && !isRunning && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            Run a comprehensive statistical benchmark to prove which system is better with scientific rigor.
          </p>
          <p className="text-sm text-gray-500">
            Tests: McNemar's test, Paired t-test, Cohen's d, Contingency analysis
          </p>
        </div>
      )}
    </div>
  );
}

function downloadBenchmarkResults(results: BenchmarkResults) {
  const report = {
    ...results,
    generatedAt: new Date().toISOString(),
    reportType: 'Statistical Significance Analysis'
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `statistical-benchmark-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadRawData(results: BenchmarkResults) {
  const bb = results.rawData?.browserbaseResults || [];
  const ace = results.rawData?.aceResults || [];
  
  let csv = 'Task,Browserbase_Correct,Browserbase_Time,Browserbase_Cost,ACE_Correct,ACE_Time,ACE_Cost\n';
  
  for (let i = 0; i < bb.length; i++) {
    csv += `${bb[i].taskId},${bb[i].correct ? 1 : 0},${bb[i].responseTime},${bb[i].cost},`;
    csv += `${ace[i].correct ? 1 : 0},${ace[i].responseTime},${ace[i].cost}\n`;
  }
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `benchmark-raw-data-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
