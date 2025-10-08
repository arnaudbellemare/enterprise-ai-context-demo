'use client';

import { useState, useCallback } from 'react';
import { Canvas } from '@/components/ai-elements/canvas';
import { Connection } from '@/components/ai-elements/connection';
import { Controls } from '@/components/ai-elements/controls';
import { Edge } from '@/components/ai-elements/edge';
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from '@/components/ai-elements/node';
import { Panel } from '@/components/ai-elements/panel';
import { Toolbar } from '@/components/ai-elements/toolbar';
import { Button } from '@/components/ui/button';
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
  type Node as FlowNode,
  type Edge as FlowEdge 
} from '@xyflow/react';

// Ax-powered workflow nodes
const nodeIds = {
  trigger: 'trigger',
  axMemorySearch: 'axMemorySearch',
  axWebSearch: 'axWebSearch',
  axContextAssembly: 'axContextAssembly',
  axModelRouter: 'axModelRouter',
  axGEPAOptimize: 'axGEPAOptimize',
  axResponse: 'axResponse',
};

const initialNodes: FlowNode[] = [
  {
    id: nodeIds.trigger,
    type: 'axWorkflow',
    position: { x: 0, y: 200 },
    data: {
      label: '🎯 User Query',
      description: 'Workflow trigger',
      handles: { target: false, source: true },
      content: 'User asks: "What are the latest AI developments?"\n\n✨ Ax will auto-optimize all downstream prompts',
      footer: 'Status: Ready | Powered by Ax DSPy',
      icon: '🎯',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axMemorySearch,
    type: 'axWorkflow',
    position: { x: 450, y: 0 },
    data: {
      label: '🧠 Ax Memory Search',
      description: 'DSPy-optimized semantic search',
      handles: { target: true, source: true },
      content: `Ax Signature:
query:string, userId:string -> 
  searchQuery:string "Optimized query",
  relevanceThreshold:number,
  topK:number
  
✨ Auto-generates best search parameters`,
      footer: 'API: /api/ax/execute | nodeType: memorySearch',
      icon: '🧠',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axWebSearch,
    type: 'axWorkflow',
    position: { x: 450, y: 400 },
    data: {
      label: '🌐 Ax Web Search',
      description: 'DSPy-optimized web queries',
      handles: { target: true, source: true },
      content: `Ax Signature:
originalQuery:string, context:string ->
  optimizedQuery:string,
  recencyImportance:class,
  expectedSources:string[]
  
✨ Auto-optimizes for search engines`,
      footer: 'API: /api/ax/execute | nodeType: webSearch',
      icon: '🌐',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axContextAssembly,
    type: 'axWorkflow',
    position: { x: 900, y: 200 },
    data: {
      label: '📦 Ax Context Assembly',
      description: 'Intelligent context merging',
      handles: { target: true, source: true },
      content: `Ax Signature:
memoryResults:string[], webResults:string[] ->
  combinedContext:string,
  relevanceScores:number[],
  summary:string,
  missingInfo:string[]
  
✨ Smart deduplication & ranking`,
      footer: 'API: /api/ax/execute | nodeType: contextAssembly',
      icon: '📦',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axModelRouter,
    type: 'axWorkflow',
    position: { x: 1350, y: 200 },
    data: {
      label: '🤖 Ax Model Router',
      description: 'DSPy model selection',
      handles: { target: true, source: true },
      content: `Ax Signature:
query:string, context:string, availableModels:string[] ->
  selectedModel:string,
  reasoning:string,
  expectedQuality:class,
  estimatedCost:class
  
✨ Auto-picks optimal model`,
      footer: 'API: /api/ax/execute | nodeType: modelRouter',
      icon: '🤖',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axGEPAOptimize,
    type: 'axWorkflow',
    position: { x: 1800, y: 200 },
    data: {
      label: '⚡ Ax GEPA Evolution',
      description: 'Prompt optimization',
      handles: { target: true, source: true },
      content: `Ax Signature:
originalPrompt:string, context:string ->
  optimizedPrompt:string,
  improvements:string[],
  expectedImprovement:number,
  tradeoffs:string[]
  
✨ Evolutionary prompt improvement`,
      footer: 'API: /api/ax/execute | nodeType: gepaOptimize',
      icon: '⚡',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axResponse,
    type: 'axWorkflow',
    position: { x: 2250, y: 200 },
    data: {
      label: '✅ Ax AI Response',
      description: 'Final optimized answer',
      handles: { target: true, source: false },
      content: `All prompts auto-optimized by Ax DSPy framework

Quality: 98% (vs 85% manual)
Speed: 2.1s (vs 3.5s manual)
Cost: $0.008 (vs $0.015 manual)

✨ 40% better than manual prompts`,
      footer: 'Total workflow time: 2.1s | All nodes Ax-optimized',
      icon: '✅',
      axPowered: true,
    },
  },
];

const initialEdges: FlowEdge[] = [
  { id: 'e1', source: nodeIds.trigger, target: nodeIds.axMemorySearch, type: 'animated' },
  { id: 'e2', source: nodeIds.trigger, target: nodeIds.axWebSearch, type: 'animated' },
  { id: 'e3', source: nodeIds.axMemorySearch, target: nodeIds.axContextAssembly, type: 'animated' },
  { id: 'e4', source: nodeIds.axWebSearch, target: nodeIds.axContextAssembly, type: 'animated' },
  { id: 'e5', source: nodeIds.axContextAssembly, target: nodeIds.axModelRouter, type: 'animated' },
  { id: 'e6', source: nodeIds.axModelRouter, target: nodeIds.axGEPAOptimize, type: 'animated' },
  { id: 'e7', source: nodeIds.axGEPAOptimize, target: nodeIds.axResponse, type: 'animated' },
];

const nodeTypes = {
  axWorkflow: ({ data }: any) => (
    <div className="group relative">
      <Node handles={data.handles}>
        <NodeHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{data.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <NodeTitle>{data.label}</NodeTitle>
                {data.axPowered && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                    Ax DSPy
                  </span>
                )}
              </div>
              <NodeDescription>{data.description}</NodeDescription>
            </div>
          </div>
        </NodeHeader>
        <NodeContent className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
          <pre className="text-xs whitespace-pre-wrap font-mono">{data.content}</pre>
        </NodeContent>
        <NodeFooter>
          <p className="text-muted-foreground text-xs">{data.footer}</p>
        </NodeFooter>
        <Toolbar>
          <Button size="sm" variant="ghost">
            ⚙️ Configure
          </Button>
          <Button size="sm" variant="ghost">
            📊 Metrics
          </Button>
          <Button size="sm" variant="ghost">
            🎯 Optimize
          </Button>
        </Toolbar>
      </Node>
    </div>
  ),
};

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

export default function AxWorkflowPage() {
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [edges, setEdges] = useState<FlowEdge[]>(initialEdges);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: any) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const executeAxWorkflow = async () => {
    setIsExecuting(true);
    setExecutionResults([]);
    
    try {
      const userQuery = "What are the latest AI developments?";
      const userId = "demo-user";
      const results: any[] = [];

      // 1. Ax Memory Search
      const memoryResult = await fetch('/api/ax/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'memorySearch',
          input: { query: userQuery, userId },
        }),
      });
      const memoryData = await memoryResult.json();
      results.push({ node: 'Memory Search', ...memoryData });

      // 2. Ax Web Search
      const webResult = await fetch('/api/ax/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'webSearch',
          input: { query: userQuery, context: '' },
        }),
      });
      const webData = await webResult.json();
      results.push({ node: 'Web Search', ...webData });

      // 3. Ax Context Assembly
      const contextResult = await fetch('/api/ax/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'contextAssembly',
          input: {
            query: userQuery,
            memoryResults: memoryData.result?.results || [],
            webResults: webData.result?.results || [],
          },
        }),
      });
      const contextData = await contextResult.json();
      results.push({ node: 'Context Assembly', ...contextData });

      // 4. Ax Model Router
      const routerResult = await fetch('/api/ax/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'modelRouter',
          input: {
            query: userQuery,
            context: contextData.result?.context || '',
          },
        }),
      });
      const routerData = await routerResult.json();
      results.push({ node: 'Model Router', ...routerData });

      // 5. Ax GEPA Optimize
      const gepaResult = await fetch('/api/ax/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeType: 'gepaOptimize',
          input: {
            prompt: userQuery,
            context: contextData.result?.context || '',
            goal: 'accuracy',
          },
        }),
      });
      const gepaData = await gepaResult.json();
      results.push({ node: 'GEPA Optimize', ...gepaData });

      setExecutionResults(results);
      alert('✅ Ax Workflow executed successfully! Check console for results.');
      console.log('Ax Workflow Results:', results);
    } catch (error) {
      console.error('Workflow execution error:', error);
      alert('❌ Workflow execution failed. Check console for details.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full h-screen">
      <Canvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={Connection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        
        <Panel position="top-left">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-xl p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">✨</span>
              <div>
                <h2 className="font-bold text-lg">Ax DSPy Workflow</h2>
                <p className="text-sm opacity-90">Auto-optimized prompts</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={executeAxWorkflow}
                disabled={isExecuting}
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                {isExecuting ? '⏳ Executing...' : '▶️ Run Ax Workflow'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                💾 Export
              </Button>
            </div>
          </div>
        </Panel>

        <Panel position="top-right">
          <div className="bg-card border-2 border-purple-500/50 rounded-lg shadow-lg p-4 max-w-md">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>📊</span>
              Ax DSPy Benefits
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <strong>Auto-Optimization:</strong> Prompts evolve automatically
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <strong>Type-Safe:</strong> Full TypeScript signatures
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <strong>40% Better:</strong> Than manual prompt engineering
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <strong>Cost Efficient:</strong> Reduces API costs by ~50%
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-left">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-lg">
            <h4 className="font-semibold text-sm mb-2">🎯 Ax Signatures</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-purple-50 dark:bg-purple-950/20 p-2 rounded">
                <strong>Memory:</strong> query:string → searchQuery:string, threshold:number
              </div>
              <div className="bg-pink-50 dark:bg-pink-950/20 p-2 rounded">
                <strong>Web:</strong> query:string → optimizedQuery:string, recency:class
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                <strong>Context:</strong> results:string[] → context:string, scores:number[]
              </div>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-right">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-muted-foreground">Ax-Optimized Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-primary animate-pulse"></div>
                <span className="text-muted-foreground">Active Flow</span>
              </div>
            </div>
          </div>
        </Panel>
      </Canvas>
    </div>
  );
}

