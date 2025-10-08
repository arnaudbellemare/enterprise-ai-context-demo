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
    position: { x: 0, y: 0 },
    data: {
      label: 'User Query',
      description: 'Initialize Ax workflow',
      handles: { target: false, source: true },
      content: 'User asks: "What are the latest AI developments?" Ax will auto-optimize all downstream prompts.',
      footer: 'Status: Ready',
      icon: '🎯',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axMemorySearch,
    type: 'axWorkflow',
    position: { x: 500, y: -200 },
    data: {
      label: 'Ax Memory Search',
      description: 'DSPy-optimized search',
      handles: { target: true, source: true },
      content: 'query:string → searchQuery:string, threshold:number, topK:number. Auto-generates optimal search parameters.',
      footer: 'Duration: ~150ms',
      icon: '🧠',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axWebSearch,
    type: 'axWorkflow',
    position: { x: 500, y: 200 },
    data: {
      label: 'Ax Web Search',
      description: 'Auto-optimized queries',
      handles: { target: true, source: true },
      content: 'query:string → optimizedQuery:string, recency:class. Auto-optimizes for search engines.',
      footer: 'Duration: ~800ms',
      icon: '🌐',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axContextAssembly,
    type: 'axWorkflow',
    position: { x: 1000, y: 0 },
    data: {
      label: 'Context Assembly',
      description: 'Intelligent merging',
      handles: { target: true, source: true },
      content: 'results:string[] → context:string, scores:number[]. Smart deduplication and ranking.',
      footer: 'Duration: ~200ms',
      icon: '📦',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axModelRouter,
    type: 'axWorkflow',
    position: { x: 1500, y: 0 },
    data: {
      label: 'Model Router',
      description: 'Auto model selection',
      handles: { target: true, source: true },
      content: 'query:string, models:string[] → selectedModel:string, reasoning:string. Picks optimal AI model.',
      footer: 'Confidence: 94%',
      icon: '🤖',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axGEPAOptimize,
    type: 'axWorkflow',
    position: { x: 2000, y: 0 },
    data: {
      label: 'GEPA Evolution',
      description: 'Prompt optimization',
      handles: { target: true, source: true },
      content: 'prompt:string → optimizedPrompt:string, improvements:string[]. Evolutionary improvement.',
      footer: 'Duration: ~1.2s',
      icon: '⚡',
      axPowered: true,
    },
  },
  {
    id: nodeIds.axResponse,
    type: 'axWorkflow',
    position: { x: 2500, y: 0 },
    data: {
      label: 'Final Response',
      description: 'Optimized answer',
      handles: { target: true, source: false },
      content: 'All prompts auto-optimized by Ax. Quality: 98% | Speed: 2.1s | Cost: $0.008',
      footer: 'Total time: 2.1s',
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
    <Node handles={data.handles}>
      <NodeHeader>
        <NodeTitle>{data.label}</NodeTitle>
        <NodeDescription>{data.description}</NodeDescription>
      </NodeHeader>
      <NodeContent>
        <p className="text-sm whitespace-pre-line">{data.content}</p>
      </NodeContent>
      <NodeFooter>
        <p className="text-muted-foreground text-xs">{data.footer}</p>
      </NodeFooter>
      <Toolbar>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
        <Button size="sm" variant="ghost">
          Delete
        </Button>
      </Toolbar>
    </Node>
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
          <Button size="sm" variant="secondary">
            Export
          </Button>
        </Panel>
      </Canvas>
    </div>
  );
}

