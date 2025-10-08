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

// Node IDs
const nodeIds = {
  trigger: 'trigger',
  memorySearch: 'memorySearch',
  webSearch: 'webSearch',
  contextAssembly: 'contextAssembly',
  modelRouter: 'modelRouter',
  gepaOptimize: 'gepaOptimize',
  response: 'response',
};

// Initial workflow nodes with your AI stack integration
const initialNodes: FlowNode[] = [
  {
    id: nodeIds.trigger,
    type: 'aiWorkflow',
    position: { x: 0, y: 200 },
    data: {
      label: '🎯 User Query',
      description: 'Workflow trigger',
      handles: { target: false, source: true },
      content: 'User asks: "What are the latest AI developments?"',
      footer: 'Status: Active',
      icon: '🎯',
    },
  },
  {
    id: nodeIds.memorySearch,
    type: 'aiWorkflow',
    position: { x: 400, y: 0 },
    data: {
      label: '🧠 Memory Search',
      description: 'Vector similarity search',
      handles: { target: true, source: true },
      content: 'Searching indexed memories with embeddings...\nFound 12 relevant memories (threshold: 0.8)',
      footer: 'API: /api/search/indexed | ~150ms',
      icon: '🧠',
    },
  },
  {
    id: nodeIds.webSearch,
    type: 'aiWorkflow',
    position: { x: 400, y: 400 },
    data: {
      label: '🌐 Live Web Search',
      description: 'Perplexity search',
      handles: { target: true, source: true },
      content: 'Querying Perplexity API for latest info...\nFound 8 recent articles',
      footer: 'API: /api/perplexity/chat | ~800ms',
      icon: '🌐',
    },
  },
  {
    id: nodeIds.contextAssembly,
    type: 'aiWorkflow',
    position: { x: 800, y: 200 },
    data: {
      label: '📦 Context Assembly',
      description: 'Merge & deduplicate',
      handles: { target: true, source: true },
      content: 'Merging 20 documents from all sources\nDeduplicating and ranking by relevance...',
      footer: 'API: /api/context/assemble | ~200ms',
      icon: '📦',
    },
  },
  {
    id: nodeIds.modelRouter,
    type: 'aiWorkflow',
    position: { x: 1200, y: 200 },
    data: {
      label: '🤖 Model Router',
      description: 'Smart model selection',
      handles: { target: true, source: true },
      content: 'Query type: General → Selected: claude-3-haiku\nReason: Fast, accurate for general queries',
      footer: 'API: /api/answer | Auto-select',
      icon: '🤖',
    },
  },
  {
    id: nodeIds.gepaOptimize,
    type: 'aiWorkflow',
    position: { x: 1600, y: 200 },
    data: {
      label: '⚡ GEPA Optimize',
      description: 'Prompt evolution',
      handles: { target: true, source: true },
      content: 'Optimizing prompt with context...\nIteration: 3 | Performance: +12%',
      footer: 'API: /api/gepa/optimize | ~1.2s',
      icon: '⚡',
    },
  },
  {
    id: nodeIds.response,
    type: 'aiWorkflow',
    position: { x: 2000, y: 200 },
    data: {
      label: '✅ AI Response',
      description: 'Final answer',
      handles: { target: true, source: false },
      content: 'Generated comprehensive answer using Claude Haiku\nQuality score: 94% | User satisfaction: High',
      footer: 'Total workflow time: 2.5s',
      icon: '✅',
    },
  },
];

// Initial edges showing data flow
const initialEdges: FlowEdge[] = [
  {
    id: 'e1',
    source: nodeIds.trigger,
    target: nodeIds.memorySearch,
    type: 'animated',
  },
  {
    id: 'e2',
    source: nodeIds.trigger,
    target: nodeIds.webSearch,
    type: 'animated',
  },
  {
    id: 'e3',
    source: nodeIds.memorySearch,
    target: nodeIds.contextAssembly,
    type: 'animated',
  },
  {
    id: 'e4',
    source: nodeIds.webSearch,
    target: nodeIds.contextAssembly,
    type: 'animated',
  },
  {
    id: 'e5',
    source: nodeIds.contextAssembly,
    target: nodeIds.modelRouter,
    type: 'animated',
  },
  {
    id: 'e6',
    source: nodeIds.modelRouter,
    target: nodeIds.gepaOptimize,
    type: 'animated',
  },
  {
    id: 'e7',
    source: nodeIds.gepaOptimize,
    target: nodeIds.response,
    type: 'animated',
  },
];

// Custom node type with your branding
const nodeTypes = {
  aiWorkflow: ({
    data,
  }: {
    data: {
      label: string;
      description: string;
      handles: { target: boolean; source: boolean };
      content: string;
      footer: string;
      icon: string;
    };
  }) => (
    <div className="group">
      <Node handles={data.handles}>
        <NodeHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{data.icon}</span>
            <div>
              <NodeTitle>{data.label}</NodeTitle>
              <NodeDescription>{data.description}</NodeDescription>
            </div>
          </div>
        </NodeHeader>
        <NodeContent>
          <p className="text-sm whitespace-pre-line">{data.content}</p>
        </NodeContent>
        <NodeFooter>
          <p className="text-muted-foreground text-xs">{data.footer}</p>
        </NodeFooter>
        <Toolbar>
          <Button size="sm" variant="ghost">
            ⚙️ Configure
          </Button>
          <Button size="sm" variant="ghost">
            🔍 Inspect
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive">
            🗑️
          </Button>
        </Toolbar>
      </Node>
    </div>
  ),
};

// Edge types
const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

export default function WorkflowPage() {
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [edges, setEdges] = useState<FlowEdge[]>(initialEdges);
  const [isExecuting, setIsExecuting] = useState(false);

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

  const executeWorkflow = async () => {
    setIsExecuting(true);
    // Simulate workflow execution
    // In production, this would trigger your actual API calls
    setTimeout(() => {
      setIsExecuting(false);
      alert('Workflow executed successfully! ✅');
    }, 2000);
  };

  const exportWorkflow = () => {
    const workflowData = { nodes, edges };
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-workflow.json';
    a.click();
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
        
        {/* Top toolbar */}
        <Panel position="top-left">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3 flex gap-2">
            <Button 
              size="sm" 
              variant="default"
              onClick={executeWorkflow}
              disabled={isExecuting}
            >
              {isExecuting ? '⏳ Executing...' : '▶️ Run Workflow'}
            </Button>
            <Button size="sm" variant="secondary" onClick={exportWorkflow}>
              💾 Export
            </Button>
            <Button size="sm" variant="outline">
              ➕ Add Node
            </Button>
          </div>
        </Panel>

        {/* Info panel */}
        <Panel position="top-right">
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="font-semibold mb-2">🎯 AI Workflow Builder</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Visual workflow combining your memory system, GEPA optimization, and multi-model routing.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Nodes:</span>
                <span className="font-mono">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connections:</span>
                <span className="font-mono">{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600">● Ready</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-primary"></div>
                <span className="text-muted-foreground">Active Flow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
                <span className="text-muted-foreground">Conditional</span>
              </div>
            </div>
          </div>
        </Panel>
      </Canvas>
    </div>
  );
}

