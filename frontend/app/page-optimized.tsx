'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OptimizedDashboard() {
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

  const essentialComponents = [
    {
      title: '💬 Chat',
      description: 'Full PERMUTATION system with reward-based optimization',
      href: '/chat',
      status: 'active',
      features: ['Teacher-Student Pattern', 'Multi-Phase TRM', 'Smart Routing', 'Real-time Optimization']
    },
    {
      title: '🤖 Agent Builder',
      description: 'Build and customize AI agents with reward-based optimization',
      href: '/agent-builder',
      status: 'active',
      features: ['Custom Agent Creation', 'Reward-Based Training', 'Component Selection', 'Performance Optimization']
    },
    {
      title: '⚔️ Arena',
      description: 'Test and compare different AI components and strategies',
      href: '/arena',
      status: 'active',
      features: ['Component Comparison', 'Performance Testing', 'Benchmark Analysis', 'Strategy Evaluation']
    },
    {
      title: '📊 Real Benchmarks',
      description: 'Comprehensive performance testing with real metrics',
      href: '/real-benchmarks',
      status: 'active',
      features: ['Real Performance Data', 'Component Benchmarking', 'Quality Metrics', 'Optimization Tracking']
    }
  ];

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4">
      {/* Terminal Header */}
      <div className="border-2 border-cyan-400 mb-6 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">LIVE</span>
            <span className="text-xs font-mono text-green-400">{currentTime}</span>
          </div>
          <div className="text-xs">PERMUTATION AI v2.0.0 - OPTIMIZED</div>
        </div>
        
        <div className="text-center">
          <pre className="text-cyan-400 text-xs sm:text-sm">
{`
 ██████╗ ███████╗██████╗ ███╗   ███╗██╗   ██╗████████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
 ██╔══██╗██╔════╝██╔══██╗████╗ ████║██║   ██║╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
 ██████╔╝█████╗  ██████╔╝██╔████╔██║██║   ██║   ██║   ███████║   ██║   ██║██║   ██║██╔██╗ ██║
 ██╔═══╝ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ██║   ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
 ██║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
 ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
`}
          </pre>
          <div className="text-xs text-green-400 mt-2">
            🎯 REWARD-BASED OPTIMIZATION SYSTEM - NO LABELS NEEDED
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="border border-green-400 mb-6 p-4">
        <div className="text-green-400 text-sm font-bold mb-2">✅ SYSTEM STATUS</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-green-900/20 p-2 border border-green-400/50">
            <div className="text-green-400 font-bold">Teacher-Student</div>
            <div className="text-green-300">70% cost savings</div>
          </div>
          <div className="bg-green-900/20 p-2 border border-green-400/50">
            <div className="text-green-400 font-bold">Multi-Phase TRM</div>
            <div className="text-green-300">5-phase processing</div>
          </div>
          <div className="bg-green-900/20 p-2 border border-green-400/50">
            <div className="text-green-400 font-bold">Smart Routing</div>
            <div className="text-green-300">Domain detection</div>
          </div>
          <div className="bg-green-900/20 p-2 border border-green-400/50">
            <div className="text-green-400 font-bold">Performance</div>
            <div className="text-green-300">Real-time monitoring</div>
          </div>
        </div>
      </div>

      {/* Essential Components */}
      <div className="mb-6">
        <div className="text-cyan-400 text-lg font-bold mb-4">🎯 ESSENTIAL COMPONENTS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {essentialComponents.map((component, index) => (
            <Link key={index} href={component.href}>
              <div className="border border-cyan-400 p-4 hover:bg-cyan-400/10 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-cyan-400 font-bold text-lg">{component.title}</div>
                  <div className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                    {component.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-gray-300 text-sm mb-3">{component.description}</div>
                <div className="text-xs text-gray-400">
                  <div className="font-bold mb-1">Features:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {component.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Key Benefits */}
      <div className="border border-yellow-400 mb-6 p-4">
        <div className="text-yellow-400 text-sm font-bold mb-2">🚀 KEY BENEFITS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-yellow-900/20 p-3 border border-yellow-400/50">
            <div className="text-yellow-400 font-bold mb-1">NO Labels Required</div>
            <div className="text-yellow-300">LLM-as-a-Judge provides instant feedback</div>
          </div>
          <div className="bg-yellow-900/20 p-3 border border-yellow-400/50">
            <div className="text-yellow-400 font-bold mb-1">Cost Effective</div>
            <div className="text-yellow-300">70% cost savings with quality optimization</div>
          </div>
          <div className="bg-yellow-900/20 p-3 border border-yellow-400/50">
            <div className="text-yellow-400 font-bold mb-1">Real-Time</div>
            <div className="text-yellow-300">Instant optimization and adaptation</div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="border border-blue-400 p-4">
        <div className="text-blue-400 text-sm font-bold mb-2">🚀 QUICK START</div>
        <div className="text-xs text-gray-300 space-y-1">
          <div>1. <span className="text-blue-400">Chat</span> - Start with the main chat interface for full PERMUTATION system</div>
          <div>2. <span className="text-blue-400">Agent Builder</span> - Create custom AI agents with reward-based optimization</div>
          <div>3. <span className="text-blue-400">Arena</span> - Test and compare different components and strategies</div>
          <div>4. <span className="text-blue-400">Real Benchmarks</span> - Monitor performance with real metrics</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <div>PERMUTATION AI - Complete Reward-Based Optimization System</div>
        <div>Ready for production deployment • All components integrated</div>
      </div>
    </div>
  );
}
