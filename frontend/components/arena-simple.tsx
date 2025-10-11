/**
 * Simple Arena Component for Testing
 */

'use client';

import React, { useState } from 'react';
import TestingValidation from './testing-validation';
import ExecutionProofViewer from './execution-proof-viewer';
import StatisticalBenchmark from './statistical-benchmark';
import { 
  ModernTaskSelector, 
  ModernExecutionButtons, 
  ModernResultsCard, 
  ModernStatsComparison,
  ModernAlertBox,
  ModernLoadingState
} from './modern-arena-ui';
import { ChartLineData01Icon, CheckmarkBadge02Icon } from 'hugeicons-react';

export default function ArenaSimple() {
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [customTask, setCustomTask] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [useRealExecution, setUseRealExecution] = useState<boolean>(false); // Disabled by default - needs Playwright setup
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const [results, setResults] = useState<{
    browserbase: { status: string; duration: number; cost: number; accuracy: number; logs: string[]; result: string; proofOfExecution?: boolean; [key: string]: any };
    ourSystem: { status: string; duration: number; cost: number; accuracy: number; logs: string[]; result: string; proofOfExecution?: boolean; [key: string]: any };
  }>({
    browserbase: { status: 'idle', duration: 0, cost: 0, accuracy: 0, logs: [], result: '', proofOfExecution: false },
    ourSystem: { status: 'idle', duration: 0, cost: 0, accuracy: 0, logs: [], result: '', proofOfExecution: false }
  });

  const tasks = [
    { 
      id: 'liquidations', 
      name: '🔥 Crypto Liquidations (Real-Time)', 
      description: 'Find actual liquidations in last 24h',
      example: 'What are the actual crypto liquidations that happened in the last 24 hours? Include amounts, exchanges, and whether they were longs or shorts.'
    },
    { 
      id: 'crypto', 
      name: 'Check Crypto Prices', 
      description: 'Get current cryptocurrency prices',
      example: 'Go to CoinGecko and get the current price of Bitcoin, Ethereum, and Solana'
    },
    { 
      id: 'hackernews', 
      name: 'Browse Hacker News', 
      description: 'Find trending discussions',
      example: 'Go to Hacker News and find the top 3 trending technology discussions'
    },
    { 
      id: 'github', 
      name: 'Review GitHub PR', 
      description: 'Navigate and review pull requests',
      example: 'Go to https://github.com/microsoft/vscode and review the latest open pull request'
    }
  ];

  const runStatisticalBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkResults(null);

    try {
      console.log('🧪 Starting statistical benchmark...');
      console.log('📡 Making request to /api/arena/benchmark');
      
      const response = await fetch('/api/arena/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testSuite: 'standard' })
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Benchmark failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Benchmark complete!');
      console.log('📊 Results:', data);
      setBenchmarkResults(data);
      
    } catch (error: any) {
      console.error('❌ Benchmark error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Benchmark failed: ${error.message}\n\nCheck console for details.`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const executeTask = async (provider: 'browserbase' | 'ourSystem') => {
    const taskDescription = selectedTask ? 
      tasks.find(t => t.id === selectedTask)?.example || '' :
      customTask;

    if (!taskDescription) return;

    console.log(`🚀 ${provider} execution started`);
    
    setIsRunning(true);
    
    setResults(prev => ({
      ...prev,
      [provider]: { status: 'running', duration: 0, cost: 0, accuracy: 0, logs: ['Starting execution...'], result: '' }
    }));

    try {
      const endpoint = provider === 'browserbase' 
        ? '/api/arena/execute-browserbase-real' // Use REAL execution with Playwright
        : '/api/arena/execute-ace-fast';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskDescription })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const executionResult = await response.json();
      
      console.log(`✅ ${provider} completed: ${executionResult.duration}s, ${executionResult.accuracy}%`);

      setResults(prev => ({
        ...prev,
        [provider]: {
          status: executionResult.status || 'completed',
          duration: executionResult.duration || 0,
          cost: executionResult.cost || 0,
          accuracy: executionResult.accuracy || 0,
          logs: executionResult.logs || ['No logs'],
          result: executionResult.result || 'No result',
          ...executionResult
        }
      }));

    } catch (error: any) {
      console.error(`❌ ${provider} failed:`, error.message);
      
      setResults(prev => ({
        ...prev,
        [provider]: {
          status: 'error',
          duration: 0,
          cost: 0,
          accuracy: 0,
          logs: [`Execution failed: ${error.message}`],
          result: `Error: ${error.message}`
        }
      }));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏸️';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Black & White Header */}
      <div className="bg-black text-white p-16 relative overflow-hidden border-b-4 border-white">
        {/* Geometric pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(white 2px, transparent 2px), linear-gradient(90deg, white 2px, transparent 2px)',
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <ChartLineData01Icon size={40} className="text-white" />
              <div className="inline-block px-4 py-2 border-2 border-white">
                <span className="text-xs font-bold tracking-widest">STATISTICAL COMPARISON</span>
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-6 tracking-tight">
              ARENA COMPARISON
            </h1>
            <p className="text-2xl text-gray-300 mb-6 font-medium">
              ACE Framework vs. Browserbase Arena
            </p>
            <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
              Head-to-head comparison with real APIs, statistical significance testing (McNemar's test, p &lt; 0.05), 
              and peer-reviewable proof. No marketing claims. Only scientific facts.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">

        {/* Modern Task Selection */}
        <div className="bg-white border-2 border-gray-200 p-10 mb-8">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 border-2 border-black mb-3">
              <span className="text-xs font-bold tracking-widest">STEP 01</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-black">
              SELECT TEST CASE
            </h2>
          </div>
          
          <ModernTaskSelector
            onSelectTask={(taskId: string, example: string) => {
              setSelectedTask(taskId);
              setCustomTask('');
            }}
            selectedTask={selectedTask}
          />

          {/* Custom Task Input */}
          <div className="mt-10 pt-8 border-t-2 border-gray-200">
            <label className="block text-sm font-bold text-black mb-4 tracking-wide">
              OR ENTER CUSTOM TASK:
            </label>
            <input
              type="text"
              value={customTask}
              onChange={(e) => {
                setCustomTask(e.target.value);
                setSelectedTask('');
              }}
              placeholder="Enter your custom test query..."
              className="w-full px-6 py-4 border-2 border-gray-900 bg-white focus:border-black focus:shadow-xl transition-all text-lg font-mono"
            />
          </div>
        </div>

        {/* Modern Execution Controls */}
        <div className="bg-white border-2 border-gray-200 p-10 mb-8">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 border-2 border-black mb-3">
              <span className="text-xs font-bold tracking-widest">STEP 02</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-black">
              EXECUTE COMPARISON
            </h2>
          </div>
          
          {isRunning && (
            <ModernAlertBox
              type="info"
              title="Execution in Progress"
              message="Running real API tests on both systems. This may take 5-15 seconds..."
            />
          )}
          
          <div className="mt-6">
            <ModernExecutionButtons
              onRun={(provider: string) => executeTask(provider as 'browserbase' | 'ourSystem')}
              isRunning={isRunning}
              disabled={!selectedTask && !customTask}
            />
            
          </div>
        </div>

        {/* Modern Live Results */}
        <div className="mb-12">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 border-2 border-black mb-3">
              <span className="text-xs font-bold tracking-widest">STEP 03</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-black">
              LIVE RESULTS
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ModernResultsCard
              title="Browserbase Arena"
              subtitle="Standard browser automation"
              result={results.browserbase}
              isCompleted={results.browserbase.status !== 'idle' && results.browserbase.status !== 'running'}
            />
            
            <ModernResultsCard
              title="ACE Framework"
              subtitle="GEPA + DSPy + ACE Optimization"
              result={results.ourSystem}
              isCompleted={results.ourSystem.status !== 'idle' && results.ourSystem.status !== 'running'}
            />
          </div>
        </div>


        {/* Statistical Significance Testing */}
        <div className="mb-12">
          <div className="bg-white border-2 border-gray-200 p-12 relative overflow-hidden">
            {/* Subtle pattern background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <ChartLineData01Icon size={32} className="text-black" />
                    <h2 className="text-3xl font-bold text-black tracking-tight">
                      Statistical Significance Testing
                    </h2>
                  </div>
                  <p className="text-lg text-gray-600 font-medium">
                    Rigorous A/B testing with McNemar's test, paired t-tests, and effect size analysis
                  </p>
                </div>
                
                <button 
                  onClick={runStatisticalBenchmark}
                  disabled={isBenchmarking}
                  className="group relative border-2 border-black bg-black px-6 py-3 text-white transition-all duration-300 hover:bg-white hover:text-black hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <CheckmarkBadge02Icon size={20} className="text-white group-hover:text-black" />
                    <span className="font-bold text-base tracking-wide">
                      {isBenchmarking ? 'Running...' : 'Run Statistical Benchmark'}
                    </span>
                  </div>
                </button>
              </div>
              
              {/* Benchmark Status / Results */}
              {isBenchmarking ? (
                <div className="bg-blue-50 border-2 border-blue-300 p-8 rounded-lg">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-black mb-4"></div>
                    <p className="text-lg text-gray-800 font-bold mb-2">
                      Running Statistical Benchmark...
                    </p>
                    <p className="text-sm text-gray-600">
                      This may take 5-10 minutes. Testing multiple scenarios across both systems.
                    </p>
                  </div>
                </div>
              ) : benchmarkResults ? (
                <div className="bg-green-50 border-2 border-green-300 p-8 rounded-lg">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-black mb-4">Benchmark Results</h3>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white p-4 border border-gray-300 rounded">
                        <div className="text-2xl font-bold text-black">{benchmarkResults.summary?.totalTestCases || 0}</div>
                        <div className="text-sm text-gray-600">Total Tests</div>
                      </div>
                      <div className="bg-white p-4 border border-gray-300 rounded">
                        <div className="text-2xl font-bold text-green-600">{benchmarkResults.results?.ace?.correctTasks || 0}</div>
                        <div className="text-sm text-gray-600">ACE Correct</div>
                      </div>
                      <div className="bg-white p-4 border border-gray-300 rounded">
                        <div className="text-2xl font-bold text-red-600">{benchmarkResults.results?.browserbase?.correctTasks || 0}</div>
                        <div className="text-sm text-gray-600">BB Correct</div>
                      </div>
                      <div className="bg-white p-4 border border-gray-300 rounded">
                        <div className="text-2xl font-bold text-blue-600">{benchmarkResults.results?.ace?.accuracy?.toFixed(1) || 0}%</div>
                        <div className="text-sm text-gray-600">ACE Accuracy</div>
                      </div>
                    </div>

                    {/* Statistical Tests */}
                    {benchmarkResults.statisticalTests && (
                      <div className="space-y-4">
                        <div className="bg-white p-4 border-2 border-black rounded">
                          <h4 className="font-bold text-lg mb-2">McNemar's Test</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Chi-squared: </span>
                              <span className="font-bold">{benchmarkResults.statisticalTests.mcnemarsTest?.statistic?.toFixed(2) || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">p-value: </span>
                              <span className="font-bold">{benchmarkResults.statisticalTests.mcnemarsTest?.pValue?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className={`px-3 py-1 rounded font-bold ${benchmarkResults.statisticalTests.mcnemarsTest?.significant ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                {benchmarkResults.statisticalTests.mcnemarsTest?.significant ? '✅ Significant' : '❌ Not Significant'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 border-2 border-black rounded">
                          <h4 className="font-bold text-lg mb-2">Effect Size (Cohen's d)</h4>
                          <div className="text-2xl font-bold text-black mb-2">
                            {benchmarkResults.statisticalTests.effectSize?.cohensD?.toFixed(2) || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {benchmarkResults.statisticalTests.effectSize?.interpretation || 'No interpretation available'}
                          </div>
                        </div>

                        <div className="bg-white p-4 border-2 border-black rounded">
                          <h4 className="font-bold text-lg mb-2">Recommendation</h4>
                          <p className="text-gray-800">{benchmarkResults.conclusion?.recommendation || benchmarkResults.statisticalTests.recommendation || 'No recommendation available'}</p>
                        </div>

                        <div className="bg-white p-4 border-2 border-black rounded">
                          <h4 className="font-bold text-lg mb-2">Summary</h4>
                          <p className="text-gray-800 whitespace-pre-line">{benchmarkResults.conclusion?.summary || 'No summary available'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-gray-300 p-8 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg text-gray-800 font-medium mb-4">
                      Run a comprehensive statistical benchmark to prove which system is better with scientific rigor.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600 font-mono">
                      <span className="px-3 py-1 border border-gray-400 rounded">McNemar's test</span>
                      <span className="px-3 py-1 border border-gray-400 rounded">Paired t-test</span>
                      <span className="px-3 py-1 border border-gray-400 rounded">Cohen's d</span>
                      <span className="px-3 py-1 border border-gray-400 rounded">Contingency analysis</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Keep old results as backup/detailed view */}
        <div className="hidden">
          {/* Browserbase Results */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800" style={{ fontFamily: 'monospace' }}>
                  🌐 Browserbase Arena
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(results.browserbase.status)}`}>
                  {getStatusIcon(results.browserbase.status)} {results.browserbase.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'monospace' }}>
                Standard browser automation with model comparison
              </p>
            </div>

            <div className="p-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.browserbase.duration}s</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">${results.browserbase.cost}</div>
                  <div className="text-sm text-gray-600">Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.browserbase.accuracy}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.browserbase.logs.length}</div>
                  <div className="text-sm text-gray-600">Steps</div>
                </div>
              </div>

              {/* Execution Logs */}
              {results.browserbase.logs.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'monospace' }}>
                    Execution Log:
                  </h4>
                  <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                    {results.browserbase.logs.map((log, index) => (
                      <div key={index} className="text-sm text-gray-700 mb-1" style={{ fontFamily: 'monospace' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Result */}
              {results.browserbase.result && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'monospace' }}>
                    Result:
                  </h4>
                  <div className="bg-blue-50 rounded-md p-3 text-sm text-blue-800 whitespace-pre-wrap" style={{ fontFamily: 'monospace' }}>
                    {results.browserbase.result}
                  </div>
                </div>
              )}

              {/* Execution Proof */}
              {results.browserbase.proofOfExecution && (
                <ExecutionProofViewer 
                  proof={results.browserbase as any} 
                  provider="browserbase"
                />
              )}
            </div>
          </div>

          {/* Our System Results */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800" style={{ fontFamily: 'monospace' }}>
                  🧠 Our System + ACE
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(results.ourSystem.status)}`}>
                  {getStatusIcon(results.ourSystem.status)} {results.ourSystem.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'monospace' }}>
                ACE-enhanced workflow automation with KV cache optimization
              </p>
            </div>

            <div className="p-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.ourSystem.duration}s</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${results.ourSystem.cost}</div>
                  <div className="text-sm text-gray-600">Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.ourSystem.accuracy}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.ourSystem.logs.length}</div>
                  <div className="text-sm text-gray-600">Steps</div>
                </div>
              </div>

              {/* Execution Logs */}
              {results.ourSystem.logs.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'monospace' }}>
                    ACE Execution Log:
                  </h4>
                  <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                    {results.ourSystem.logs.map((log, index) => (
                      <div key={index} className="text-sm text-gray-700 mb-1" style={{ fontFamily: 'monospace' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Result */}
              {results.ourSystem.result && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'monospace' }}>
                    Result:
                  </h4>
                  <div className="bg-green-50 rounded-md p-3 text-sm text-green-800 whitespace-pre-wrap" style={{ fontFamily: 'monospace' }}>
                    {results.ourSystem.result}
                  </div>
                </div>
              )}

              {/* Execution Proof */}
              {results.ourSystem.proofOfExecution && (
                <ExecutionProofViewer 
                  proof={results.ourSystem as any} 
                  provider="our-system"
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
