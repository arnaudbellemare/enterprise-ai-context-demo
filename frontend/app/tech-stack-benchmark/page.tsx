'use client';

import React, { useState, useEffect } from 'react';

interface BenchmarkResult {
  component: string;
  ocr_accuracy: number;
  irt_score: number;
  optimization_impact: number;
  accuracy: number;
  latency_ms: number;
  cost: number;
  overall_score: number;
}

interface TechStackBenchmark {
  results: BenchmarkResult[];
  summary: {
    best_ocr: string;
    best_irt: string;
    best_optimization: string;
    best_accuracy: string;
    best_latency: string;
    best_overall: string;
  };
  recommendations: string[];
}

export default function TechStackBenchmarkPage() {
  const [benchmark, setBenchmark] = useState<TechStackBenchmark | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const runBenchmark = async () => {
    setIsRunning(true);
    setBenchmark(null);

    try {
      const response = await fetch('/api/benchmark/tech-stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Benchmark failed: ${response.statusText}`);
      }

      const data = await response.json();
      setBenchmark(data);
    } catch (error: any) {
      console.error('Benchmark error:', error);
      alert(`Benchmark failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBar = (score: number, max: number = 100) => {
    const percentage = (score / max) * 100;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            percentage >= 90 ? 'bg-green-500' :
            percentage >= 80 ? 'bg-blue-500' :
            percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4">
      {/* Terminal Header */}
      <div className="border-2 border-cyan-400 mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">LIVE</span>
            <span className="text-xs font-mono text-green-400">{currentTime}</span>
          </div>
          <div className="text-xs">PERMUTATION TECH STACK BENCHMARK v1.0.0</div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">TECH STACK BENCHMARK</h1>
          <div className="text-sm text-green-400">OCR • IRT • Optimization • Accuracy • Latency Analysis</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="border border-cyan-400 mb-4 p-2">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'overview', label: 'OVERVIEW', href: '/' },
            { id: 'chat', label: 'CHAT', href: '/chat-reasoning' },
            { id: 'agent-builder', label: 'AGENT BUILDER', href: '/agent-builder' },
            { id: 'arena', label: 'ARENA', href: '/arena' },
            { id: 'benchmarks', label: 'BENCHMARKS', href: '/benchmarks' },
            { id: 'tech-stack', label: 'TECH STACK', href: '/tech-stack-benchmark' }
          ].map((section) => (
            <a key={section.id} href={section.href}>
              <button
                className={`px-4 py-2 border border-cyan-400 font-mono text-sm transition-colors ${
                  section.id === 'tech-stack'
                    ? 'bg-cyan-400 text-black'
                    : 'bg-black text-cyan-400 hover:bg-cyan-400 hover:text-black'
                }`}
              >
                [{section.label}]
              </button>
            </a>
          ))}
        </div>
      </div>

      {/* Benchmark Controls */}
      <div className="border border-cyan-400 mb-4 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-green-400 mb-4">COMPONENT PERFORMANCE ANALYSIS</h2>
          <button
            onClick={runBenchmark}
            disabled={isRunning}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-black font-bold rounded transition-colors"
          >
            {isRunning ? 'RUNNING BENCHMARK...' : 'RUN TECH STACK BENCHMARK'}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Tests OCR accuracy, IRT scoring, optimization impact, accuracy, and latency for all 12 components
          </p>
        </div>
      </div>

      {/* Benchmark Results */}
      {isRunning && (
        <div className="border border-cyan-400 mb-4 p-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-cyan-400">Running comprehensive tech stack benchmark...</p>
            <p className="text-xs text-gray-400 mt-2">Testing all 12 components for performance metrics</p>
          </div>
        </div>
      )}

      {benchmark && (
        <>
          {/* Summary */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">BENCHMARK SUMMARY</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 font-bold">Best OCR</div>
                <div className="text-white">{benchmark.summary.best_ocr}</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 font-bold">Best IRT</div>
                <div className="text-white">{benchmark.summary.best_irt}</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 font-bold">Best Optimization</div>
                <div className="text-white">{benchmark.summary.best_optimization}</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 font-bold">Best Accuracy</div>
                <div className="text-white">{benchmark.summary.best_accuracy}</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 font-bold">Best Latency</div>
                <div className="text-white">{benchmark.summary.best_latency}</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 font-bold">Best Overall</div>
                <div className="text-white">{benchmark.summary.best_overall}</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">DETAILED COMPONENT RESULTS</h3>
            <div className="space-y-4">
              {benchmark.results
                .sort((a, b) => b.overall_score - a.overall_score)
                .map((result, index) => (
                <div key={result.component} className="bg-gray-900 p-4 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-cyan-400 font-bold">{result.component}</h4>
                    <div className={`px-3 py-1 rounded text-sm font-bold ${getScoreColor(result.overall_score)}`}>
                      Overall: {result.overall_score}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                    <div>
                      <div className="text-gray-400 mb-1">OCR Accuracy</div>
                      <div className="text-white font-bold">{result.ocr_accuracy}%</div>
                      {getScoreBar(result.ocr_accuracy)}
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">IRT Score</div>
                      <div className="text-white font-bold">{(result.irt_score * 100).toFixed(1)}%</div>
                      {getScoreBar(result.irt_score * 100)}
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Optimization</div>
                      <div className="text-white font-bold">{result.optimization_impact}%</div>
                      {getScoreBar(result.optimization_impact)}
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Accuracy</div>
                      <div className="text-white font-bold">{result.accuracy}%</div>
                      {getScoreBar(result.accuracy)}
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Latency</div>
                      <div className="text-white font-bold">{result.latency_ms}ms</div>
                      <div className="text-xs text-gray-400">Cost: ${result.cost}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">OPTIMIZATION RECOMMENDATIONS</h3>
            <div className="space-y-2">
              {benchmark.recommendations.map((rec, index) => (
                <div key={index} className="bg-gray-900 p-3 rounded text-sm">
                  <div className="text-white" dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-600">
        <div>PERMUTATION TECH STACK BENCHMARK | Comprehensive Component Analysis</div>
      </div>
    </div>
  );
}

