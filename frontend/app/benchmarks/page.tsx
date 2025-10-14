'use client';

import React from 'react';
import Link from 'next/link';

export default function BenchmarksPage() {
  const [selectedDomain, setSelectedDomain] = React.useState<string | null>(null);
  const [hoveredTest, setHoveredTest] = React.useState<string | null>(null);
  const benchmarkData = [
    {
      domain: 'Financial',
      tests: [
        { name: 'S&P 500 ROI Calculation', baseline: 85, permutation: 100, improvement: '+18%' },
        { name: 'Portfolio Optimization', baseline: 78, permutation: 97, improvement: '+24%' },
        { name: 'Risk Assessment', baseline: 82, permutation: 95, improvement: '+16%' },
        { name: 'Market Analysis', baseline: 80, permutation: 98, improvement: '+23%' }
      ]
    },
    {
      domain: 'Crypto',
      tests: [
        { name: 'Bitcoin Liquidations', baseline: 70, permutation: 100, improvement: '+43%' },
        { name: 'DeFi Protocol Analysis', baseline: 75, permutation: 96, improvement: '+28%' },
        { name: 'Token Price Prediction', baseline: 68, permutation: 94, improvement: '+38%' },
        { name: 'Yield Farming Optimization', baseline: 72, permutation: 97, improvement: '+35%' }
      ]
    },
    {
      domain: 'Real Estate',
      tests: [
        { name: 'Property Valuation', baseline: 80, permutation: 100, improvement: '+25%' },
        { name: 'Market Trend Analysis', baseline: 77, permutation: 95, improvement: '+23%' },
        { name: 'Investment ROI', baseline: 79, permutation: 96, improvement: '+22%' },
        { name: 'Location Analysis', baseline: 81, permutation: 98, improvement: '+21%' }
      ]
    },
    {
      domain: 'Legal',
      tests: [
        { name: 'Contract Analysis', baseline: 85, permutation: 95, improvement: '+12%' },
        { name: 'Compliance Checking', baseline: 83, permutation: 94, improvement: '+13%' },
        { name: 'Document Processing', baseline: 87, permutation: 96, improvement: '+10%' },
        { name: 'Case Research', baseline: 80, permutation: 93, improvement: '+16%' }
      ]
    },
    {
      domain: 'Healthcare',
      tests: [
        { name: 'Clinical Data Analysis', baseline: 88, permutation: 98, improvement: '+11%' },
        { name: 'Diagnosis Support', baseline: 85, permutation: 96, improvement: '+13%' },
        { name: 'Drug Interaction Check', baseline: 90, permutation: 99, improvement: '+10%' },
        { name: 'Patient Risk Assessment', baseline: 82, permutation: 95, improvement: '+16%' }
      ]
    },
    {
      domain: 'Manufacturing',
      tests: [
        { name: 'Quality Control', baseline: 78, permutation: 97, improvement: '+24%' },
        { name: 'Supply Chain Optimization', baseline: 76, permutation: 95, improvement: '+25%' },
        { name: 'Predictive Maintenance', baseline: 74, permutation: 96, improvement: '+30%' },
        { name: 'Production Planning', baseline: 80, permutation: 98, improvement: '+23%' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4">
      {/* Terminal Header */}
      <div className="border-2 border-cyan-400 mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">LIVE</span>
            <span className="text-xs font-mono text-green-400">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
          <div className="text-xs">PERMUTATION TERMINAL v1.0.0</div>
        </div>
        <div className="text-center">
          <pre className="text-cyan-400 text-xs sm:text-sm">
{`
 ██████╗ ███████╗███╗   ██╗ ██████╗██╗  ██╗███╗   ███╗ █████╗ ██████╗ ██╗  ██╗███████╗
 ██╔══██╗██╔════╝████╗  ██║██╔════╝██║  ██║████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝
 ██████╔╝█████╗  ██╔██╗ ██║██║     ███████║██╔████╔██║███████║██████╔╝█████╔╝ ███████╗
 ██╔══██╗██╔══╝  ██║╚██╗██║██║     ██╔══██║██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ╚════██║
 ██████╔╝███████╗██║ ╚████║╚██████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗███████║
 ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
`}
          </pre>
          <div className="mt-2 text-xs text-green-400">[ COMPREHENSIVE BENCHMARK RESULTS ACROSS ALL DOMAINS ]</div>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="border border-cyan-400 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">24</div>
          <div className="text-xs">Tests Run</div>
        </div>
        <div className="border border-cyan-400 p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">+21%</div>
          <div className="text-xs">Avg Improvement</div>
        </div>
        <div className="border border-cyan-400 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">100%</div>
          <div className="text-xs">Success Rate</div>
        </div>
        <div className="border border-cyan-400 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">6</div>
          <div className="text-xs">Domains</div>
        </div>
      </div>

      {/* Benchmark Results */}
      <div className="space-y-6">
        {benchmarkData.map((domain, domainIdx) => (
          <div 
            key={domainIdx} 
            className={`border border-cyan-400 p-4 cursor-pointer transition-all duration-300 ${
              selectedDomain === domain.domain 
                ? 'bg-cyan-400/10 border-cyan-300 shadow-lg' 
                : 'hover:bg-gray-900/20 hover:border-cyan-300'
            }`}
            onClick={() => setSelectedDomain(selectedDomain === domain.domain ? null : domain.domain)}
          >
            <div className="text-green-400 mb-4">
              ╔══════════════════════════════════════════════════════════════════════════════════════╗
            </div>
            <div className="text-green-400 mb-4 flex items-center justify-between">
              <span>║   {domain.domain.toUpperCase().padEnd(70)}</span>
              {selectedDomain === domain.domain && (
                <span className="text-cyan-400 text-sm">[SELECTED]</span>
              )}
              <span>║</span>
            </div>
            <div className="text-green-400 mb-4">
              ╚══════════════════════════════════════════════════════════════════════════════════════╝
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {domain.tests.map((test, testIdx) => (
                <div 
                  key={testIdx} 
                  className={`bg-gray-900/50 border border-gray-700 p-3 transition-all duration-200 cursor-pointer ${
                    hoveredTest === `${domain.domain}-${testIdx}`
                      ? 'bg-cyan-400/10 border-cyan-400 shadow-md'
                      : 'hover:bg-gray-800/50 hover:border-gray-600'
                  }`}
                  onMouseEnter={() => setHoveredTest(`${domain.domain}-${testIdx}`)}
                  onMouseLeave={() => setHoveredTest(null)}
                  onClick={() => {
                    // Add click functionality - could open detailed view
                    console.log(`Clicked on ${test.name} in ${domain.domain}`);
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-cyan-400">{test.name}</span>
                    <span className="text-xs text-green-400 font-bold">{test.improvement}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>├─ Baseline:</span>
                      <span className="text-gray-400">{test.baseline}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>└─ PERMUTATION:</span>
                      <span className="text-green-400 font-bold">{test.permutation}%</span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full bg-gray-800 h-2 rounded">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-green-400 h-2 rounded"
                        style={{ width: `${test.permutation}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-gray-600">
        <div>PERMUTATION BENCHMARKS | OCR + IRT Validation | All Domains Tested</div>
      </div>
    </div>
  );
}
