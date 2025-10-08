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
      label: 'User Query',
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
      label: 'Memory Search',
      description: 'Vector similarity search',
      handles: { target: true, source: true },
      content: 'Searching indexed memories with embeddings. Found 12 relevant memories with similarity > 0.8',
      footer: 'Duration: ~150ms',
      icon: '🧠',
    },
  },
  {
    id: nodeIds.webSearch,
    type: 'aiWorkflow',
    position: { x: 400, y: 400 },
    data: {
      label: 'Live Web Search',
      description: 'Perplexity search',
      handles: { target: true, source: true },
      content: 'Querying Perplexity API for latest information. Found 8 recent articles',
      footer: 'Duration: ~800ms',
      icon: '🌐',
    },
  },
  {
    id: nodeIds.contextAssembly,
    type: 'aiWorkflow',
    position: { x: 800, y: 200 },
    data: {
      label: 'Context Assembly',
      description: 'Merge and deduplicate',
      handles: { target: true, source: true },
      content: 'Merging 20 documents from all sources. Deduplicating and ranking by relevance',
      footer: 'Duration: ~200ms',
      icon: '📦',
    },
  },
  {
    id: nodeIds.modelRouter,
    type: 'aiWorkflow',
    position: { x: 1200, y: 200 },
    data: {
      label: 'Model Router',
      description: 'Smart model selection',
      handles: { target: true, source: true },
      content: 'Query type detected: General. Selected model: claude-3-haiku for fast, accurate responses',
      footer: 'Confidence: 94%',
      icon: '🤖',
    },
  },
  {
    id: nodeIds.gepaOptimize,
    type: 'aiWorkflow',
    position: { x: 1600, y: 200 },
    data: {
      label: 'GEPA Optimize',
      description: 'Prompt evolution',
      handles: { target: true, source: true },
      content: 'Optimizing prompt with assembled context. Iteration 3 shows +12% performance improvement',
      footer: 'Duration: ~1.2s',
      icon: '⚡',
    },
  },
  {
    id: nodeIds.response,
    type: 'aiWorkflow',
    position: { x: 2000, y: 200 },
    data: {
      label: 'AI Response',
      description: 'Final answer',
      handles: { target: true, source: false },
      content: 'Generated comprehensive answer using Claude Haiku with optimized prompt',
      footer: 'Total time: 2.5s',
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

// Clean node type matching AI Elements design
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
        <Panel position="top-left">
          <Button size="sm" variant="secondary" onClick={exportWorkflow}>
            Export
          </Button>
        </Panel>
      </Canvas>
    </div>
  );
}

