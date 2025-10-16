'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BenchmarkResult {
  domain: string;
  query: string;
  permutation: {
    quality: number;
    duration: number;
    tokens: number;
    success: boolean;
  };
  baseline: {
    quality: number;
    duration: number;
    tokens: number;
    success: boolean;
    error?: string;
  };
  improvement: number;
  timestamp: string;
}

interface BenchmarkSummary {
  totalTests: number;
  successfulTests: number;
  avgPermutationQuality: number;
  avgBaselineQuality: number;
  avgImprovement: number;
  avgPermutationDuration: number;
  avgBaselineDuration: number;
  timestamp: string;
}

export default function BenchmarksPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

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

  const runRealBenchmarks = async () => {
    setIsRunning(true);
    try {
      console.log('🚀 Starting real benchmark run...');
      const response = await fetch('/api/benchmark/run-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Real benchmark results:', data);
      
      setBenchmarkResults(data.results || []);
      setBenchmarkSummary(data.summary || null);
      setLastRun(new Date().toLocaleString());
    } catch (error) {
      console.error('❌ Benchmark run failed:', error);
      alert(`Benchmark failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'financial': return '💰';
      case 'crypto': return '₿';
      case 'real_estate': return '🏠';
      case 'legal': return '⚖️';
      case 'healthcare': return '🏥';
      default: return '📊';
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-400';
    if (quality >= 80) return 'text-yellow-400';
    if (quality >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-400';
    if (improvement === 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4">
      {/* Terminal Header */}
      <div className="border-2 border-cyan-400 mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">LIVE</span>
            <span className="text-sm font-mono text-green-400 font-bold">{currentTime || 'Loading...'}</span>
          </div>
          <div className="text-xs">PERMUTATION TERMINAL v1.0.0</div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">REAL BENCHMARKS</h1>
          <div className="text-sm text-green-400">PERMUTATION vs Ollama Baseline (Real Data)</div>
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
            { id: 'benchmarks', label: 'BENCHMARKS', href: '/benchmarks' }
          ].map((section) => (
            <Link key={section.id} href={section.href}>
              <button
                className={`px-4 py-2 border border-cyan-400 font-mono text-sm transition-colors ${
                  section.id === 'benchmarks'
                    ? 'bg-cyan-400 text-black'
                    : 'bg-black text-cyan-400 hover:bg-cyan-400 hover:text-black'
                }`}
              >
                [{section.label}]
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Benchmark Controls */}
      <div className="border border-cyan-400 mb-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-cyan-400">BENCHMARK CONTROLS</h2>
          <div className="flex gap-2">
            <button
              onClick={runRealBenchmarks}
              disabled={isRunning}
              className={`px-4 py-2 border border-cyan-400 font-mono text-sm transition-colors ${
                isRunning
                  ? 'bg-yellow-400 text-black cursor-not-allowed'
                  : 'bg-cyan-400 text-black hover:bg-cyan-300'
              }`}
            >
              {isRunning ? '🔄 RUNNING...' : '🚀 RUN REAL BENCHMARKS'}
            </button>
          </div>
        </div>
        
        {lastRun && (
          <div className="text-sm text-green-400">
            Last run: {lastRun}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {benchmarkSummary && (
        <div className="border border-cyan-400 mb-4 p-4">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">SUMMARY STATISTICS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{benchmarkSummary.totalTests}</div>
              <div className="text-sm text-cyan-400">Tests Run</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getImprovementColor(benchmarkSummary.avgImprovement)}`}>
                {benchmarkSummary.avgImprovement > 0 ? '+' : ''}{benchmarkSummary.avgImprovement}%
              </div>
              <div className="text-sm text-cyan-400">Avg Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{Math.round((benchmarkSummary.successfulTests / benchmarkSummary.totalTests) * 100)}%</div>
              <div className="text-sm text-cyan-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{benchmarkSummary.successfulTests}</div>
              <div className="text-sm text-cyan-400">Domains</div>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Results */}
      {benchmarkResults.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">DETAILED RESULTS</h2>
          {benchmarkResults.map((result, index) => (
            <div key={index} className="border border-cyan-400 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getDomainIcon(result.domain)}</span>
                <h3 className="text-lg font-bold text-cyan-400">{result.domain.toUpperCase()}</h3>
                <span className="text-sm text-gray-400">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="text-sm text-gray-400 mb-2">Query:</div>
                <div className="text-sm bg-gray-900 p-2 rounded border">
                  {result.query.substring(0, 200)}...
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PERMUTATION Results */}
                <div className="border border-green-400 p-3">
                  <div className="text-green-400 font-bold mb-2">🤖 PERMUTATION</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span className={getQualityColor(result.permutation.quality)}>
                        {result.permutation.quality}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{(result.permutation.duration / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span>{result.permutation.tokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={result.permutation.success ? 'text-green-400' : 'text-red-400'}>
                        {result.permutation.success ? '✅ Success' : '❌ Failed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Baseline Results */}
                <div className="border border-blue-400 p-3">
                  <div className="text-blue-400 font-bold mb-2">🔵 BASELINE (Ollama)</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span className={getQualityColor(result.baseline.quality)}>
                        {result.baseline.quality}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{(result.baseline.duration / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span>{result.baseline.tokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={result.baseline.success ? 'text-green-400' : 'text-red-400'}>
                        {result.baseline.success ? '✅ Success' : '❌ Failed'}
                      </span>
                    </div>
                    {result.baseline.error && (
                      <div className="text-red-400 text-xs mt-2">
                        Error: {result.baseline.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Improvement */}
              <div className="mt-3 p-3 border border-yellow-400">
                <div className="text-center">
                  <div className="text-yellow-400 font-bold mb-1">IMPROVEMENT</div>
                  <div className={`text-2xl font-bold ${getImprovementColor(result.improvement)}`}>
                    {result.improvement > 0 ? '+' : ''}{result.improvement}%
                  </div>
                  <div className="text-sm text-gray-400">
                    PERMUTATION vs Baseline
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-cyan-400 p-8 text-center">
          <div className="text-xl text-cyan-400 mb-4">NO BENCHMARK DATA</div>
          <div className="text-gray-400 mb-4">
            Click "RUN REAL BENCHMARKS" to start testing the system
          </div>
          <div className="text-sm text-gray-500">
            This will run actual queries against both PERMUTATION and Ollama baseline
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border border-cyan-400 mt-8 p-4 text-center">
        <div className="text-sm text-gray-400">
          PERMUTATION BENCHMARKS | Real Data Only | No Mock Results
        </div>
      </div>
    </div>
  );
}