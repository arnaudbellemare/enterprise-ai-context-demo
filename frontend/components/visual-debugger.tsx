/**
 * VISUAL DEBUGGER COMPONENT (Inspired by Mix SDK DevTools)
 * 
 * Real-time visualization of agent execution
 * - Execution timeline
 * - Tool usage monitoring
 * - Performance metrics
 */

'use client';

import { useState, useEffect } from 'react';

interface ExecutionStep {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

interface ToolUsage {
  tool: string;
  count: number;
  avgDuration: number;
}

interface PerformanceMetrics {
  irtAbility: number;
  gepaIterations: number;
  loraAdapter?: string;
  modelUsed: string;
  cost: number;
  duration: number;
}

export function VisualDebugger() {
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLive, setIsLive] = useState(false);
  
  // Mock data for demonstration
  useEffect(() => {
    const mockSteps: ExecutionStep[] = [
      {
        id: '1',
        type: 'start',
        description: 'Task received: Analyze financial report with charts',
        timestamp: new Date(Date.now() - 10000),
        metadata: { taskId: 'task-001' }
      },
      {
        id: '2',
        type: 'difficulty',
        description: 'Difficulty assessed: θ = 1.6 (above average)',
        timestamp: new Date(Date.now() - 9500),
        duration: 200,
        metadata: { ability: 1.6, threshold: 1.0 }
      },
      {
        id: '3',
        type: 'collaboration',
        description: 'Collaboration suggested: Moderate (hard problem detected)',
        timestamp: new Date(Date.now() - 9200),
        duration: 100
      },
      {
        id: '4',
        type: 'model_routing',
        description: 'Model selected: gemini-2.0-flash (vision required)',
        timestamp: new Date(Date.now() - 9000),
        duration: 150,
        metadata: { model: 'gemini-2.0-flash', reason: 'vision' }
      },
      {
        id: '5',
        type: 'articulation',
        description: 'Agent articulated: "Analyzing report with multiple charts..."',
        timestamp: new Date(Date.now() - 8700),
        duration: 300
      },
      {
        id: '6',
        type: 'lora',
        description: 'LoRA loaded: financial_lora (weight_decay: 1e-5)',
        timestamp: new Date(Date.now() - 8200),
        duration: 250,
        metadata: { adapter: 'financial_lora', domain: 'financial' }
      },
      {
        id: '7',
        type: 'multimodal',
        description: 'Analyzing 3 charts in PDF using Gemini vision',
        timestamp: new Date(Date.now() - 7800),
        duration: 1200,
        metadata: { images: 3 }
      },
      {
        id: '8',
        type: 'dspy',
        description: 'DSPy module executed: FinancialAnalyst',
        timestamp: new Date(Date.now() - 6300),
        duration: 800
      },
      {
        id: '9',
        type: 'gepa',
        description: 'GEPA optimization: Iteration 1/20',
        timestamp: new Date(Date.now() - 5200),
        duration: 600
      },
      {
        id: '10',
        type: 'team_search',
        description: 'Searched team knowledge: Found 2 relevant reports',
        timestamp: new Date(Date.now() - 4400),
        duration: 400
      },
      {
        id: '11',
        type: 'reasoning_bank',
        description: 'Retrieved strategy: "Financial chart analysis pattern"',
        timestamp: new Date(Date.now() - 3800),
        duration: 300
      },
      {
        id: '12',
        type: 'response',
        description: 'Response generated: 847 tokens',
        timestamp: new Date(Date.now() - 3200),
        duration: 700,
        metadata: { tokens: 847 }
      },
      {
        id: '13',
        type: 'irt',
        description: 'IRT evaluation: θ = 1.7 (Very Good)',
        timestamp: new Date(Date.now() - 2200),
        duration: 400,
        metadata: { ability: 1.7 }
      },
      {
        id: '14',
        type: 'social',
        description: 'Posted to team: "Analyzed Q4 financial report - strong growth!"',
        timestamp: new Date(Date.now() - 1600),
        duration: 200
      },
      {
        id: '15',
        type: 'complete',
        description: 'Task complete - all learnings stored',
        timestamp: new Date(Date.now() - 1000),
        duration: 300
      }
    ];
    
    setExecutionSteps(mockSteps);
    
    setToolUsage([
      { tool: 'Articulation', count: 3, avgDuration: 250 },
      { tool: 'Social A2A', count: 2, avgDuration: 200 },
      { tool: 'Team Memory', count: 1, avgDuration: 400 },
      { tool: 'ReasoningBank', count: 1, avgDuration: 300 },
      { tool: 'Multimodal Analysis', count: 1, avgDuration: 1200 }
    ]);
    
    setMetrics({
      irtAbility: 1.7,
      gepaIterations: 20,
      loraAdapter: 'financial_lora',
      modelUsed: 'gemini-2.0-flash',
      cost: 0.002,
      duration: 9.5
    });
  }, []);
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Visual Debugger</h1>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: Execution Timeline */}
          <div className="col-span-1 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Execution Timeline</h2>
            
            <div className="space-y-3">
              {executionSteps.map((step, i) => (
                <div key={step.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="text-sm text-gray-500">
                    Step {i + 1} - {step.type}
                  </div>
                  <div className="text-sm font-medium">{step.description}</div>
                  {step.duration && (
                    <div className="text-xs text-gray-400 mt-1">
                      Duration: {step.duration}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Column 2: Tool Usage */}
          <div className="col-span-1 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tool Usage</h2>
            
            <div className="space-y-4">
              {toolUsage.map((tool) => (
                <div key={tool.tool} className="border-b pb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{tool.tool}</span>
                    <span className="text-sm text-gray-500">{tool.count}x</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Avg: {tool.avgDuration}ms
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((tool.count / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold text-sm mb-2">Collaborative Tools</h3>
              <div className="text-xs space-y-1">
                <div>✅ Articulation: 3 thoughts</div>
                <div>✅ Social posts: 2 updates</div>
                <div>✅ Team search: 1 query</div>
                <div>✅ ReasoningBank: 1 strategy</div>
              </div>
            </div>
          </div>
          
          {/* Column 3: Performance Metrics */}
          <div className="col-span-1 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            
            {metrics && (
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">IRT Ability</div>
                  <div className="text-2xl font-bold">θ = {metrics.irtAbility.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">Very Good (top 16%)</div>
                </div>
                
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">GEPA Iterations</div>
                  <div className="text-2xl font-bold">{metrics.gepaIterations}</div>
                  <div className="text-xs text-gray-400">Optimization complete</div>
                </div>
                
                {metrics.loraAdapter && (
                  <div className="border-b pb-3">
                    <div className="text-sm text-gray-500">LoRA Adapter</div>
                    <div className="text-sm font-mono">{metrics.loraAdapter}</div>
                    <div className="text-xs text-gray-400">weight_decay: 1e-5</div>
                  </div>
                )}
                
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Model Used</div>
                  <div className="text-sm font-mono">{metrics.modelUsed}</div>
                  <div className="text-xs text-gray-400">Smart routing</div>
                </div>
                
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Cost</div>
                  <div className="text-xl font-bold">${metrics.cost.toFixed(6)}</div>
                  <div className="text-xs text-gray-400">Per request</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="text-xl font-bold">{metrics.duration.toFixed(2)}s</div>
                  <div className="text-xs text-gray-400">Total execution time</div>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-green-50 rounded">
              <h3 className="font-semibold text-sm mb-2">System Status</h3>
              <div className="text-xs space-y-1">
                <div>✅ All systems operational</div>
                <div>✅ Collaborative tools active</div>
                <div>✅ Multimodal ready</div>
                <div>✅ Smart routing enabled</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Live Status Indicator */}
        <div className="mt-6 text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isLive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {isLive ? 'Live Monitoring' : 'Static Demo'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default VisualDebugger;

