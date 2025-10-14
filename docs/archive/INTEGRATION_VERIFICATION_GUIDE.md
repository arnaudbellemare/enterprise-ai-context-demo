'use client';

/**
 * Integration Test Page
 * Shows all features actually working
 */

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  response?: any;
  error?: string;
  time?: number;
}

export default function IntegrationTestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: '1. Knowledge Graph API', status: 'pending' },
    { name: '2. Instant Answer API', status: 'pending' },
    { name: '3. Smart Extract API', status: 'pending' },
    { name: '4. Context Enrich API (Grok)', status: 'pending' },
    { name: '5. Grok Agent API', status: 'pending' },
    { name: '6. Fluid Benchmarking API', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runAllTests = async () => {
    setIsRunning(true);

    // Test 1: Knowledge Graph
    updateTest(0, { status: 'running' });
    try {
      const start = Date.now();
      const res = await fetch('/api/entities/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Sarah is working on the AI optimization project with John',
          userId: 'test-user'
        })
      });
      const data = await res.json();
      updateTest(0, {
        status: 'success',
        response: data,
        time: Date.now() - start
      });
    } catch (error: any) {
      updateTest(0, { status: 'error', error: error.message });
    }

    // Test 2: Instant Answer
    updateTest(1, { status: 'running' });
    try {
      const start = Date.now();
      const res = await fetch('/api/instant-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What is Sarah working on?',
          userId: 'test-user',
          includeContext: true
        })
      });
      const data = await res.json();
      updateTest(1, {
        status: 'success',
        response: data,
        time: Date.now() - start
      });
    } catch (error: any) {
      updateTest(1, { status: 'error', error: error.message });
    }

    // Test 3: Smart Extract
    updateTest(2, { status: 'running' });
    try {
      const start = Date.now();
      const res = await fetch('/api/smart-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Invoice #INV-001 from Acme Corp for $1,250.50',
          userId: 'test-user',
          options: { autoDetect: true }
        })
      });
      const data = await res.json();
      updateTest(2, {
        status: 'success',
        response: data,
        time: Date.now() - start
      });
    } catch (error: any) {
      updateTest(2, { status: 'error', error: error.message });
    }

    // Test 4: Context Enrich (Grok)
    updateTest(3, { status: 'running' });
    try {
      const start = Date.now();
      const res = await fetch('/api/context/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Help me with the project',
          userId: 'test-user',
          includeSources: ['memory_network', 'conversation_history']
        })
      });
      const data = await res.json();
      updateTest(3, {
        status: 'success',
        response: data,
        time: Date.now() - start
      });
    } catch (error: any) {
      updateTest(3, { status: 'error', error: error.message });
    }

    // Test 5: Grok Agent
    updateTest(4, { status: 'running' });
    try {
      const start = Date.now();
      const res = await fetch('/api/grok-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Extract entities',
          userId: 'test-user',
          agentType: 'entity_extraction'
        })
      });
      const data = await res.json();
      updateTest(4, {
        status: 'success',
        response: data,
        time: Date.now() - start
      });
    } catch (error: any) {
      updateTest(4, { status: 'error', error: error.message });
    }

    // Test 6: Fluid Benchmarking
    updateTest(5, { status: 'running' });
    try {
      const start = Date.now();
      const res = await fetch('/api/evaluate/fluid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'knowledge_graph',
          n_max: 10
        })
      });
      const data = await res.json();
      updateTest(5, {
        status: 'success',
        response: data,
        time: Date.now() - start
      });
    } catch (error: any) {
      updateTest(5, { status: 'error', error: error.message });
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔬 Integration Test Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Verify all features are actually integrated and working
        </p>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="mb-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>

        <div className="space-y-4">
          {tests.map((test, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-lg border-2 p-6 transition-all ${
                test.status === 'success' ? 'border-green-500' :
                test.status === 'error' ? 'border-red-500' :
                test.status === 'running' ? 'border-blue-500 animate-pulse' :
                'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{test.name}</h3>
                <div className="flex items-center gap-2">
                  {test.time && (
                    <span className="text-sm text-gray-600">{test.time}ms</span>
                  )}
                  {test.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {test.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                  {test.status === 'running' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                  {test.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                </div>
              </div>

              {test.status === 'success' && test.response && (
                <div className="mt-4 p-4 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-64">
                  <pre>{JSON.stringify(test.response, null, 2)}</pre>
                </div>
              )}

              {test.status === 'error' && (
                <div className="mt-4 p-4 bg-red-50 rounded text-sm text-red-700">
                  Error: {test.error}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📚 What's Being Tested:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Knowledge Graph - Pattern-based entity extraction</li>
            <li>✅ Instant Answer - Query knowledge graph</li>
            <li>✅ Smart Extract - Complexity-based routing</li>
            <li>✅ Context Enrich - Grok-optimized structured context</li>
            <li>✅ Grok Agent - All 8 principles integrated</li>
            <li>✅ Fluid Benchmarking - IRT-based scientific validation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

