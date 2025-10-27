'use client';

import React, { useState, useEffect } from 'react';

interface OptimizedResult {
  query: string;
  answer: string;
  component_used: string;
  routing_decision: {
    primary_component: string;
    fallback_component?: string;
    reasoning: string;
  };
  performance: {
    latency_ms: number;
    cost: number;
    cached: boolean;
    cache_savings: {
      cost_saved: number;
      latency_saved_ms: number;
    };
  };
  quality: {
    confidence: number;
    accuracy_estimate: number;
  };
  optimization_applied: string[];
  trace?: {
    steps: Array<{
      component: string;
      description: string;
      status: string;
    }>;
  };
}

export default function OptimizedSystemPage() {
  const [query, setQuery] = useState('');
  const [taskType, setTaskType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [useParallel, setUseParallel] = useState(false);
  const [result, setResult] = useState<OptimizedResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stats, setStats] = useState<any>(null);
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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/optimized/execute');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const executeOptimized = async () => {
    if (!query.trim()) {
      alert('Please enter a query');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      const response = await fetch('/api/optimized/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          task_type: taskType,
          priority,
          use_parallel: useParallel
        })
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      
      // Reload stats
      await loadStats();

    } catch (error: any) {
      console.error('Execution error:', error);
      alert(`Execution failed: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
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
          <div className="text-xs">OPTIMIZED PERMUTATION SYSTEM v3.0.0</div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">OPTIMIZED SYSTEM</h1>
          <div className="text-sm text-green-400">All 3 Optimization Phases Active</div>
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
            { id: 'tech-stack', label: 'TECH STACK', href: '/tech-stack-benchmark' },
            { id: 'optimization', label: 'OPTIMIZATION', href: '/optimization-strategy' },
            { id: 'optimized', label: 'OPTIMIZED SYSTEM', href: '/optimized-system' }
          ].map((section) => (
            <a key={section.id} href={section.href}>
              <button
                className={`px-4 py-2 border border-cyan-400 font-mono text-sm transition-colors ${
                  section.id === 'optimized'
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

      {/* System Status */}
      {stats && (
        <div className="border border-green-400 mb-4 p-4 bg-green-900 bg-opacity-10">
          <h3 className="text-lg font-bold text-green-400 mb-3">SYSTEM STATUS: ALL PHASES ACTIVE ✅</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-green-400 font-bold mb-2">PHASE 1: Foundation</div>
              <div className="space-y-1 text-xs">
                {stats.capabilities?.phase_1.map((item: string, index: number) => (
                  <div key={index} className="text-white">✓ {item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-yellow-400 font-bold mb-2">PHASE 2: Enhancement</div>
              <div className="space-y-1 text-xs">
                {stats.capabilities?.phase_2.map((item: string, index: number) => (
                  <div key={index} className="text-white">✓ {item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-cyan-400 font-bold mb-2">PHASE 3: Advanced</div>
              <div className="space-y-1 text-xs">
                {stats.capabilities?.phase_3.map((item: string, index: number) => (
                  <div key={index} className="text-white">✓ {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Input */}
      <div className="border border-cyan-400 mb-4 p-4">
        <h3 className="text-lg font-bold text-green-400 mb-4">EXECUTE OPTIMIZED QUERY</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Query:</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query..."
              className="w-full p-3 bg-black border border-cyan-400 text-cyan-400 focus:outline-none focus:border-green-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">Task Type:</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full p-3 bg-black border border-cyan-400 text-cyan-400 focus:outline-none focus:border-green-400"
              >
                <option value="general">General</option>
                <option value="ocr">OCR</option>
                <option value="irt">IRT</option>
                <option value="reasoning">Reasoning</option>
                <option value="optimization">Optimization</option>
                <option value="query_expansion">Query Expansion</option>
                <option value="synthesis">Synthesis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Priority:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-3 bg-black border border-cyan-400 text-cyan-400 focus:outline-none focus:border-green-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useParallel}
                  onChange={(e) => setUseParallel(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Use Parallel Execution (Phase 3)</span>
              </label>
            </div>
          </div>

          <button
            onClick={executeOptimized}
            disabled={isExecuting}
            className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-black font-bold rounded transition-colors"
          >
            {isExecuting ? 'EXECUTING OPTIMIZED SYSTEM...' : 'EXECUTE WITH ALL 3 PHASES'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isExecuting && (
        <div className="border border-cyan-400 mb-4 p-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-cyan-400">Executing optimized system...</p>
            <p className="text-xs text-gray-400 mt-2">
              Phase 1: Routing | Phase 2: Optimization | Phase 3: Parallel Execution
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Performance Summary */}
          <div className="border border-green-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">PERFORMANCE SUMMARY</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 text-sm">Component Used</div>
                <div className="text-white font-bold">{result.component_used}</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 text-sm">Latency</div>
                <div className="text-white font-bold">{result.performance.latency_ms}ms</div>
                {result.performance.cached && (
                  <div className="text-green-400 text-xs">Saved {result.performance.cache_savings.latency_saved_ms}ms</div>
                )}
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 text-sm">Cost</div>
                <div className="text-white font-bold">${result.performance.cost.toFixed(4)}</div>
                {result.performance.cached && (
                  <div className="text-green-400 text-xs">Saved ${result.performance.cache_savings.cost_saved.toFixed(4)}</div>
                )}
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-cyan-400 text-sm">Accuracy</div>
                <div className="text-white font-bold">{(result.quality.accuracy_estimate * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Answer */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-3">ANSWER</h3>
            <div className="bg-gray-900 p-4 rounded text-white">
              {result.answer}
            </div>
          </div>

          {/* Routing Decision */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-3">ROUTING DECISION</h3>
            <div className="bg-gray-900 p-4 rounded space-y-2">
              <div><span className="text-cyan-400">Primary Component:</span> <span className="text-white">{result.routing_decision.primary_component}</span></div>
              {result.routing_decision.fallback_component && (
                <div><span className="text-cyan-400">Fallback Component:</span> <span className="text-white">{result.routing_decision.fallback_component}</span></div>
              )}
              <div><span className="text-cyan-400">Reasoning:</span> <span className="text-white">{result.routing_decision.reasoning}</span></div>
            </div>
          </div>

          {/* Optimizations Applied */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-3">OPTIMIZATIONS APPLIED ({result.optimization_applied.length})</h3>
            <div className="space-y-2">
              {result.optimization_applied.map((opt, index) => (
                <div key={index} className="bg-gray-900 p-2 rounded text-sm text-white">
                  {index + 1}. {opt}
                </div>
              ))}
            </div>
          </div>

          {/* Execution Trace */}
          {result.trace && result.trace.steps.length > 0 && (
            <div className="border border-cyan-400 mb-4 p-4">
              <h3 className="text-lg font-bold text-green-400 mb-3">EXECUTION TRACE</h3>
              <div className="space-y-2">
                {result.trace.steps.map((step, index) => (
                  <div key={index} className="bg-gray-900 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-400 font-bold">{step.component}</span>
                      <span className={`text-xs ${step.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {step.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-white">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-600">
        <div>OPTIMIZED PERMUTATION SYSTEM | All 3 Phases Active | Data-Driven Performance</div>
      </div>
    </div>
  );
}



