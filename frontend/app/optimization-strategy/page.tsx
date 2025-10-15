'use client';

import React, { useState, useEffect } from 'react';

interface OptimizationStrategy {
  component_priorities: {
    high_priority: string[];
    medium_priority: string[];
    low_priority: string[];
  };
  performance_optimizations: {
    ocr_optimization: string[];
    irt_optimization: string[];
    latency_optimization: string[];
    cost_optimization: string[];
  };
  architecture_recommendations: {
    primary_components: string[];
    secondary_components: string[];
    caching_strategy: string[];
    routing_strategy: string[];
  };
  implementation_roadmap: {
    phase_1: string[];
    phase_2: string[];
    phase_3: string[];
  };
}

export default function OptimizationStrategyPage() {
  const [strategy, setStrategy] = useState<OptimizationStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const generateStrategy = async () => {
    setIsLoading(true);
    setStrategy(null);

    try {
      const response = await fetch('/api/optimization/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Strategy generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setStrategy(data);
    } catch (error: any) {
      console.error('Strategy error:', error);
      alert(`Strategy generation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high_priority': return 'text-red-400 bg-red-100';
      case 'medium_priority': return 'text-yellow-400 bg-yellow-100';
      case 'low_priority': return 'text-green-400 bg-green-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'phase_1': return 'border-red-400 bg-red-50';
      case 'phase_2': return 'border-yellow-400 bg-yellow-50';
      case 'phase_3': return 'border-green-400 bg-green-50';
      default: return 'border-gray-400 bg-gray-50';
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
          <div className="text-xs">PERMUTATION OPTIMIZATION STRATEGY v1.0.0</div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">OPTIMIZATION STRATEGY</h1>
          <div className="text-sm text-green-400">Based on Tech Stack Benchmark Results</div>
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
            { id: 'optimization', label: 'OPTIMIZATION', href: '/optimization-strategy' }
          ].map((section) => (
            <a key={section.id} href={section.href}>
              <button
                className={`px-4 py-2 border border-cyan-400 font-mono text-sm transition-colors ${
                  section.id === 'optimization'
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

      {/* Strategy Controls */}
      {/* Implementation Status - ALL 3 PHASES COMPLETE */}
      <div className="border border-green-400 mb-4 p-4 bg-green-900 bg-opacity-10">
        <h2 className="text-xl font-bold text-green-400 mb-4">✅ ALL 3 PHASES IMPLEMENTED & ACTIVE</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900 p-3 rounded border-2 border-green-500">
            <div className="text-green-400 font-bold mb-2">PHASE 1: Foundation ✅</div>
            <div className="space-y-1 text-xs text-white">
              <div>✓ Smart routing based on task type</div>
              <div>✓ KV Cache for all optimization tasks</div>
              <div>✓ Teacher Model result caching</div>
              <div>✓ IRT specialist routing (93.1%)</div>
            </div>
          </div>
          <div className="bg-gray-900 p-3 rounded border-2 border-green-500">
            <div className="text-green-400 font-bold mb-2">PHASE 2: Enhancement ✅</div>
            <div className="space-y-1 text-xs text-white">
              <div>✓ TRM as primary reasoning engine</div>
              <div>✓ ACE Framework as OCR fallback</div>
              <div>✓ Synthesis Agent optimization</div>
              <div>✓ Cost-based component selection</div>
            </div>
          </div>
          <div className="bg-gray-900 p-3 rounded border-2 border-green-500">
            <div className="text-green-400 font-bold mb-2">PHASE 3: Advanced ✅</div>
            <div className="space-y-1 text-xs text-white">
              <div>✓ Advanced caching strategies</div>
              <div>✓ Parallel component execution</div>
              <div>✓ Performance monitoring & auto-optimization</div>
              <div>✓ Dynamic component scaling</div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <a href="/optimized-system" className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded transition-colors">
            → VIEW OPTIMIZED SYSTEM IN ACTION
          </a>
        </div>
      </div>

      <div className="border border-cyan-400 mb-4 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-green-400 mb-4">ANALYZE CURRENT BENCHMARK DATA</h2>
          <button
            onClick={generateStrategy}
            disabled={isLoading}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-black font-bold rounded transition-colors"
          >
            {isLoading ? 'ANALYZING REAL DATA...' : 'ANALYZE REAL BENCHMARK RESULTS'}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Fetches real benchmark data and generates dynamic optimization recommendations
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="border border-cyan-400 mb-4 p-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-cyan-400">Analyzing benchmark results...</p>
            <p className="text-xs text-gray-400 mt-2">Generating optimization strategy based on component performance</p>
          </div>
        </div>
      )}

      {/* Strategy Results */}
      {strategy && (
        <>
          {/* Component Priorities */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">COMPONENT PRIORITIES</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-red-400 font-bold mb-2">🔴 HIGH PRIORITY (Best Performers)</h4>
                <div className="space-y-2">
                  {strategy.component_priorities.high_priority.map((item, index) => (
                    <div key={index} className="bg-gray-900 p-3 rounded text-sm">
                      <div className="text-white">{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-yellow-400 font-bold mb-2">🟡 MEDIUM PRIORITY (Good Performers)</h4>
                <div className="space-y-2">
                  {strategy.component_priorities.medium_priority.map((item, index) => (
                    <div key={index} className="bg-gray-900 p-3 rounded text-sm">
                      <div className="text-white">{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-green-400 font-bold mb-2">🟢 LOW PRIORITY (Optimize or Replace)</h4>
                <div className="space-y-2">
                  {strategy.component_priorities.low_priority.map((item, index) => (
                    <div key={index} className="bg-gray-900 p-3 rounded text-sm">
                      <div className="text-white">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Optimizations */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">PERFORMANCE OPTIMIZATIONS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-4 rounded">
                <h4 className="text-cyan-400 font-bold mb-3">🔍 OCR Optimization</h4>
                <div className="space-y-2 text-sm">
                  {strategy.performance_optimizations.ocr_optimization.map((item, index) => (
                    <div key={index} className="text-white">• {item}</div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded">
                <h4 className="text-cyan-400 font-bold mb-3">📊 IRT Optimization</h4>
                <div className="space-y-2 text-sm">
                  {strategy.performance_optimizations.irt_optimization.map((item, index) => (
                    <div key={index} className="text-white">• {item}</div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded">
                <h4 className="text-cyan-400 font-bold mb-3">⚡ Latency Optimization</h4>
                <div className="space-y-2 text-sm">
                  {strategy.performance_optimizations.latency_optimization.map((item, index) => (
                    <div key={index} className="text-white">• {item}</div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded">
                <h4 className="text-cyan-400 font-bold mb-3">💰 Cost Optimization</h4>
                <div className="space-y-2 text-sm">
                  {strategy.performance_optimizations.cost_optimization.map((item, index) => (
                    <div key={index} className="text-white">• {item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Recommendations */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">ARCHITECTURE RECOMMENDATIONS</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-green-400 font-bold mb-2">🏗️ Primary Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {strategy.architecture_recommendations.primary_components.map((item, index) => (
                    <div key={index} className="bg-green-900 p-2 rounded text-sm text-white">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-yellow-400 font-bold mb-2">🔧 Secondary Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {strategy.architecture_recommendations.secondary_components.map((item, index) => (
                    <div key={index} className="bg-yellow-900 p-2 rounded text-sm text-white">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-cyan-400 font-bold mb-2">💾 Caching Strategy</h4>
                <div className="space-y-2">
                  {strategy.architecture_recommendations.caching_strategy.map((item, index) => (
                    <div key={index} className="bg-gray-900 p-2 rounded text-sm text-white">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-blue-400 font-bold mb-2">🔄 Routing Strategy</h4>
                <div className="space-y-2">
                  {strategy.architecture_recommendations.routing_strategy.map((item, index) => (
                    <div key={index} className="bg-gray-900 p-2 rounded text-sm text-white">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Roadmap */}
          <div className="border border-cyan-400 mb-4 p-4">
            <h3 className="text-lg font-bold text-green-400 mb-4">IMPLEMENTATION ROADMAP</h3>
            
            <div className="space-y-4">
              <div className={`border-2 p-4 rounded ${getPhaseColor('phase_1')}`}>
                <h4 className="text-red-400 font-bold mb-3">🚀 PHASE 1: Foundation (Immediate)</h4>
                <div className="space-y-2">
                  {strategy.implementation_roadmap.phase_1.map((item, index) => (
                    <div key={index} className="text-sm text-black">• {item}</div>
                  ))}
                </div>
              </div>

              <div className={`border-2 p-4 rounded ${getPhaseColor('phase_2')}`}>
                <h4 className="text-yellow-400 font-bold mb-3">⚡ PHASE 2: Enhancement (Short-term)</h4>
                <div className="space-y-2">
                  {strategy.implementation_roadmap.phase_2.map((item, index) => (
                    <div key={index} className="text-sm text-black">• {item}</div>
                  ))}
                </div>
              </div>

              <div className={`border-2 p-4 rounded ${getPhaseColor('phase_3')}`}>
                <h4 className="text-green-400 font-bold mb-3">🎯 PHASE 3: Advanced (Long-term)</h4>
                <div className="space-y-2">
                  {strategy.implementation_roadmap.phase_3.map((item, index) => (
                    <div key={index} className="text-sm text-black">• {item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-600">
        <div>PERMUTATION OPTIMIZATION STRATEGY | Data-Driven Performance Enhancement</div>
      </div>
    </div>
  );
}
