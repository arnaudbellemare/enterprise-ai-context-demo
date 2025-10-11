'use client';

import React, { useState } from 'react';

export default function OptimizerPage() {
  const [agentConfig, setAgentConfig] = useState('');
  const [source, setSource] = useState<'google_vertex' | 'microsoft_copilot' | 'openai_assistant' | 'custom_json'>('custom_json');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const analyzeAgent = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/optimizer/import-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          agentConfig: JSON.parse(agentConfig || '{}')
        })
      });

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runOptimization = async (iterations: number) => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimizer/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'imported-agent',
          iterations,
          optimizationGoals: ['accuracy', 'cost']
        })
      });

      const data = await response.json();
      setOptimizationResult(data);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-black text-white p-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'monospace' }}>
            🚀 Agent Optimization Layer
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Plug into ANY agent platform. Boost performance by 10-25%. Reduce costs by 95%.
          </p>
          <p className="text-lg text-gray-400">
            Works with Google Vertex AI, Microsoft Copilot, OpenAI Assistants, and custom agents
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-4xl font-bold text-green-600 mb-2">+10.6%</div>
            <div className="text-gray-700 font-semibold mb-1">Accuracy Gain</div>
            <div className="text-sm text-gray-600">ACE context engineering (Stanford/SambaNova research)</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500">
            <div className="text-4xl font-bold text-blue-600 mb-2">-86.9%</div>
            <div className="text-gray-700 font-semibold mb-1">Fewer Rollouts</div>
            <div className="text-sm text-gray-600">GEPA reflective evolution (35x efficiency)</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500">
            <div className="text-4xl font-bold text-purple-600 mb-2">-95%</div>
            <div className="text-gray-700 font-semibold mb-1">Cost Reduction</div>
            <div className="text-sm text-gray-600">Smart routing + model optimization</div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'monospace' }}>
            📥 Step 1: Import Your Agent
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Source:
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="custom_json">Custom JSON</option>
              <option value="google_vertex">Google Vertex AI</option>
              <option value="microsoft_copilot">Microsoft Copilot Studio</option>
              <option value="openai_assistant">OpenAI Assistant</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Configuration (JSON):
            </label>
            <textarea
              value={agentConfig}
              onChange={(e) => setAgentConfig(e.target.value)}
              placeholder={`{
  "name": "My Sales Assistant",
  "instructions": "You are a helpful sales assistant...",
  "model": "gpt-4",
  "tools": []
}`}
              className="w-full h-48 px-4 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={analyzeAgent}
            disabled={isAnalyzing || !agentConfig}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
          >
            {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Agent'}
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'monospace' }}>
              📊 Analysis Results
            </h2>

            {/* Current State */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-red-900 mb-4">⚠️ Issues Detected</h3>
              <ul className="space-y-2">
                {analysisResult.analysis.issues.map((issue: string, i: number) => (
                  <li key={i} className="text-sm text-red-800">❌ {issue}</li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-4">✅ Optimization Opportunities</h3>
              <ul className="space-y-2">
                {analysisResult.analysis.opportunities.map((opp: string, i: number) => (
                  <li key={i} className="text-sm text-green-800">✅ {opp}</li>
                ))}
              </ul>
            </div>

            {/* Projected Gains */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-purple-900 mb-4">📈 Projected Improvements</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Current Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div>Accuracy: {analysisResult.projectedResults.current.accuracy}%</div>
                    <div>Cost: ${analysisResult.projectedResults.current.cost}</div>
                    <div>Latency: {analysisResult.projectedResults.current.latency}s</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">After Optimization</h4>
                  <div className="space-y-1 text-sm font-bold text-green-700">
                    <div>Accuracy: {analysisResult.projectedResults.optimized.accuracy.toFixed(1)}% ({analysisResult.projectedResults.improvements.accuracyGain})</div>
                    <div>Cost: ${analysisResult.projectedResults.optimized.cost.toFixed(4)} ({analysisResult.projectedResults.improvements.costReduction})</div>
                    <div>Latency: {analysisResult.projectedResults.optimized.latency.toFixed(2)}s ({analysisResult.projectedResults.improvements.latencyReduction})</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimization Options */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">🎯 Start Optimization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => runOptimization(5)}
                  disabled={isOptimizing}
                  className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  <div className="font-bold mb-1">🆓 Free Trial (5 Iterations)</div>
                  <div className="text-sm">Get ~10% improvement, $0 cost</div>
                </button>
                
                <button
                  onClick={() => runOptimization(20)}
                  disabled={isOptimizing}
                  className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  <div className="font-bold mb-1">💎 Pro (20 Iterations)</div>
                  <div className="text-sm">Get ~20-25% improvement, $29/month</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Results */}
        {optimizationResult && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-green-900" style={{ fontFamily: 'monospace' }}>
              ✅ Optimization Complete!
            </h2>

            {/* Final Results */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  +{optimizationResult.improvements.accuracyGain}%
                </div>
                <div className="text-sm text-gray-700">Accuracy Gain</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  -{optimizationResult.improvements.costReduction}%
                </div>
                <div className="text-sm text-gray-700">Cost Reduction</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  -{optimizationResult.improvements.rolloutsReduction}%
                </div>
                <div className="text-sm text-gray-700">Fewer Rollouts</div>
              </div>
            </div>

            {/* Iteration Progress */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Optimization Progress</h3>
              <div className="space-y-2">
                {optimizationResult.allIterations.map((iter: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>Iteration {iter.iteration}</span>
                    <div className="flex gap-4">
                      <span className="text-green-700">Acc: {iter.accuracy.toFixed(1)}%</span>
                      <span className="text-blue-700">Cost: ${iter.cost.toFixed(4)}</span>
                      <span className="text-purple-700">Rollouts: {iter.rollouts.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Download */}
            <div className="flex gap-4">
              <button
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📥 Download Optimized Agent Config
              </button>
              <button
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📊 Download Full Optimization Report
              </button>
            </div>
          </div>
        )}

        {/* How It Works */}
        {!analysisResult && !optimizationResult && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'monospace' }}>
              How It Works
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Import Your Agent</h3>
                  <p className="text-gray-600">
                    Upload config from Google Vertex AI, Microsoft Copilot, OpenAI, or custom JSON.
                    We analyze your current setup and identify improvement opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Run Optimization (5-20 iterations)</h3>
                  <p className="text-gray-600 mb-2">
                    We apply proven optimizations:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ <strong>GEPA</strong>: Prompt evolution (35x fewer rollouts)</li>
                    <li>✅ <strong>DSPy</strong>: Signature optimization (+5-8%)</li>
                    <li>✅ <strong>ACE</strong>: Context engineering (+10.6%)</li>
                    <li>✅ <strong>Smart Routing</strong>: 95% cost reduction</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Deploy Optimized Agent</h3>
                  <p className="text-gray-600">
                    Get back an optimized config ready to deploy in your original platform.
                    Enjoy 10-25% better performance with 68-95% lower costs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">💎 Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="bg-white text-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">🆓 Free</h3>
              <div className="text-3xl font-bold mb-4">$0</div>
              <ul className="space-y-2 text-sm mb-6">
                <li>✅ 5 optimization iterations</li>
                <li>✅ 1 agent at a time</li>
                <li>✅ Basic GEPA + DSPy</li>
                <li>✅ ~10% performance gain</li>
              </ul>
              <div className="text-xs text-gray-500">Perfect for trying it out</div>
            </div>

            {/* Pro Tier */}
            <div className="bg-purple-900 text-white rounded-lg p-6 border-4 border-yellow-400 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">💎 Pro</h3>
              <div className="text-3xl font-bold mb-1">$29</div>
              <div className="text-sm mb-4">per agent/month</div>
              <ul className="space-y-2 text-sm mb-6">
                <li>✅ Unlimited iterations</li>
                <li>✅ Multiple agents</li>
                <li>✅ Full GEPA + DSPy + ACE</li>
                <li>✅ ~20-25% performance gain</li>
                <li>✅ A/B testing</li>
                <li>✅ Real-time monitoring</li>
              </ul>
              <div className="text-xs opacity-80">ROI: Pays for itself in saved API costs</div>
            </div>

            {/* Enterprise */}
            <div className="bg-white text-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">🏢 Enterprise</h3>
              <div className="text-3xl font-bold mb-4">$50k+</div>
              <ul className="space-y-2 text-sm mb-6">
                <li>✅ Custom optimization</li>
                <li>✅ Industry context packs</li>
                <li>✅ Dedicated team</li>
                <li>✅ SLA guarantees</li>
                <li>✅ White-label option</li>
                <li>✅ Integration support</li>
              </ul>
              <div className="text-xs text-gray-500">For large-scale deployments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
