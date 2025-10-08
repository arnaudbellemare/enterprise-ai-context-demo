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
  type Edge as FlowEdge,
  type Connection as FlowConnection
} from '@xyflow/react';

// Same node library
const AVAILABLE_NODE_TYPES = [
  { 
    id: 'memorySearch', 
    label: '🧠 Memory Search',
    description: 'Vector similarity search',
    icon: '🧠',
    apiEndpoint: '/api/search/indexed',
    config: {
      matchThreshold: 0.8,
      matchCount: 10,
      collection: '',
    }
  },
  { 
    id: 'webSearch', 
    label: '🌐 Web Search',
    description: 'Live Perplexity search',
    icon: '🌐',
    apiEndpoint: '/api/perplexity/chat',
    config: {
      recencyFilter: 'month',
      maxResults: 10,
    }
  },
  { 
    id: 'contextAssembly', 
    label: '📦 Context Assembly',
    description: 'Merge results',
    icon: '📦',
    apiEndpoint: '/api/context/assemble',
    config: {
      mergeStrategy: 'hybrid',
      maxResults: 20,
    }
  },
  { 
    id: 'modelRouter', 
    label: '🤖 Model Router',
    description: 'Select best AI model',
    icon: '🤖',
    apiEndpoint: '/api/answer',
    config: {
      autoSelect: true,
      preferredModel: 'claude-3-haiku',
    }
  },
  { 
    id: 'gepaOptimize', 
    label: '⚡ GEPA Optimize',
    description: 'Prompt evolution',
    icon: '⚡',
    apiEndpoint: '/api/gepa/optimize',
    config: {
      iterations: 3,
      goal: 'accuracy',
    }
  },
  { 
    id: 'langstruct', 
    label: '🔍 LangStruct',
    description: 'Extract structured data',
    icon: '🔍',
    apiEndpoint: '/api/langstruct/process',
    config: {
      useRealLangStruct: true,
      refine: true,
    }
  },
  { 
    id: 'answer', 
    label: '✅ Generate Answer',
    description: 'Final AI response',
    icon: '✅',
    apiEndpoint: '/api/answer',
    config: {
      temperature: 0.7,
      maxTokens: 2048,
    }
  }
];

export default function WorkflowPage() {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: FlowConnection) => {
      const newEdge = {
        ...connection,
        type: 'animated',
        id: `edge-${Date.now()}`,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      addLog(`✅ Connected: ${connection.source} → ${connection.target}`);
    },
    []
  );

  const addNode = (nodeType: typeof AVAILABLE_NODE_TYPES[0]) => {
    const nodeId = `${nodeType.id}-${Date.now()}`;
    const newNode: FlowNode = {
      id: nodeId,
      type: 'customizable',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      },
      data: {
        ...nodeType,
        nodeId,
        status: 'ready',
        config: { ...nodeType.config }
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeConfigs((configs) => ({
      ...configs,
      [nodeId]: { ...nodeType.config }
    }));
    addLog(`➕ Added: ${nodeType.label}`);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    delete nodeConfigs[nodeId];
    if (selectedNode?.nodeId === nodeId) setSelectedNode(null);
    addLog(`🗑️ Deleted: ${nodeId}`);
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodeConfigs((configs) => ({
      ...configs,
      [nodeId]: { ...configs[nodeId], ...config }
    }));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n
      )
    );
  };

  const addLog = (message: string) => {
    setExecutionLog((logs) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...logs.slice(0, 99)]);
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Add nodes first!');
      return;
    }

    setIsExecuting(true);
    addLog('🚀 Workflow started');

    try {
      let workflowData: any = {
        query: 'Sample query',
        userId: 'user-' + Date.now(),
      };

      const executionOrder = getExecutionOrder(nodes, edges);
      
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        addLog(`▶️ ${node.data.label}...`);
        
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n
          )
        );

        // Execute node (simplified for demo - can be configured to call real APIs)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'complete' } } : n
          )
        );
        
        addLog(`✅ ${node.data.label} done`);
      }

      addLog('🎉 Workflow complete!');
      alert('✅ Workflow completed!');
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getExecutionOrder = (nodes: FlowNode[], edges: FlowEdge[]): string[] => {
    const order: string[] = [];
    const visited = new Set<string>();
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const incomingEdges = edges.filter((e) => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }
      
      order.push(nodeId);
    };

    nodes.forEach((node) => visit(node.id));
    return order;
  };

  const exportWorkflow = () => {
    const workflow = { nodes, edges, configs: nodeConfigs };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    addLog('💾 Exported');
  };

  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setNodeConfigs(workflow.configs || {});
        addLog('📥 Imported');
      } catch (error) {
        alert('Import failed');
      }
    };
    reader.readAsText(file);
  };

  const clearWorkflow = () => {
    if (confirm('Clear all?')) {
      setNodes([]);
      setEdges([]);
      setNodeConfigs({});
      setSelectedNode(null);
      addLog('🧹 Cleared');
    }
  };

  const nodeTypes = {
    customizable: ({ data }: any) => {
      const statusColors = {
        ready: 'border-gray-300',
        executing: 'border-yellow-500 animate-pulse',
        complete: 'border-green-500',
        error: 'border-red-500',
      };

      return (
        <div className="group">
          <Node handles={{ target: true, source: true }} className={`${statusColors[data.status]} border-2`}>
            <NodeHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{data.icon}</span>
                <div className="flex-1">
                  <NodeTitle>{data.label}</NodeTitle>
                  <NodeDescription>{data.description}</NodeDescription>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  data.status === 'executing' ? 'bg-yellow-100 text-yellow-800' :
                  data.status === 'complete' ? 'bg-green-100 text-green-800' :
                  data.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {data.status}
                </span>
              </div>
            </NodeHeader>
            <NodeContent>
              <div className="text-xs space-y-1">
                <div className="font-mono text-muted-foreground">
                  {data.apiEndpoint}
                </div>
              </div>
            </NodeContent>
            <NodeFooter>
              <p className="text-xs text-muted-foreground">
                Drag handles to connect
              </p>
            </NodeFooter>
            <Toolbar>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedNode(data)}
              >
                ⚙️
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => deleteNode(data.nodeId)}
              >
                🗑️
              </Button>
            </Toolbar>
          </Node>
        </div>
      );
    },
  };

  const edgeTypes = {
    animated: Edge.Animated,
    temporary: Edge.Temporary,
  };

  return (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">🎯 Add Nodes</h2>
        <div className="space-y-2">
          {AVAILABLE_NODE_TYPES.map((nodeType) => (
            <button
              key={nodeType.id}
              onClick={() => addNode(nodeType)}
              className="w-full p-3 text-left bg-background hover:bg-accent border border-border rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{nodeType.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{nodeType.label}</div>
                  <div className="text-xs text-muted-foreground">{nodeType.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-2">📋 Log</h3>
          <div className="bg-background border rounded-lg p-2 max-h-60 overflow-y-auto">
            {executionLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity</p>
            ) : (
              executionLog.map((log, idx) => (
                <div key={idx} className="text-xs font-mono">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
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
            <div className="bg-card border rounded-lg shadow-lg p-3 flex gap-2">
              <Button 
                size="sm" 
                onClick={executeWorkflow}
                disabled={isExecuting || nodes.length === 0}
              >
                {isExecuting ? '⏳ Running...' : '▶️ Execute'}
              </Button>
              <Button size="sm" variant="secondary" onClick={exportWorkflow}>
                💾 Export
              </Button>
              <label className="cursor-pointer">
                <Button size="sm" variant="outline" asChild>
                  <span>📥 Import</span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importWorkflow}
                  className="hidden"
                />
              </label>
              <Button size="sm" variant="destructive" onClick={clearWorkflow}>
                🧹 Clear
              </Button>
            </div>
          </Panel>

          <Panel position="top-right">
            <div className="bg-card border rounded-lg shadow-lg p-4">
              <h3 className="font-semibold mb-2">📊 Workflow</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Nodes:</span>
                  <span className="font-mono">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Connections:</span>
                  <span className="font-mono">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={isExecuting ? 'text-yellow-600' : 'text-green-600'}>
                    {isExecuting ? '⏳ Running' : '● Ready'}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {nodes.length === 0 && (
            <Panel position="bottom-right">
              <div className="bg-blue-500 text-white rounded-lg p-4">
                <h3 className="font-bold mb-2">🚀 Quick Start</h3>
                <ol className="text-sm space-y-1">
                  <li>1. Click nodes from sidebar</li>
                  <li>2. Drag ● to ● to connect</li>
                  <li>3. Click ⚙️ to configure</li>
                  <li>4. Click ▶️ to execute</li>
                </ol>
              </div>
            </Panel>
          )}
        </Canvas>

        {/* Config Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-96 bg-card border rounded-lg shadow-2xl p-4 max-h-[80vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span>{selectedNode.icon}</span>
                {selectedNode.label}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedNode(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(nodeConfigs[selectedNode.nodeId] || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium block mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {typeof value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.nodeId, { [key]: e.target.checked })
                      }
                    />
                  ) : typeof value === 'number' ? (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.nodeId, { [key]: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                      step="0.1"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.nodeId, { [key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>API:</strong> {selectedNode.apiEndpoint}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function deleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    delete nodeConfigs[nodeId];
    if (selectedNode?.nodeId === nodeId) setSelectedNode(null);
    addLog(`🗑️ Deleted: ${nodeId}`);
  }

  function updateNodeConfig(nodeId: string, config: any) {
    setNodeConfigs((configs) => ({
      ...configs,
      [nodeId]: { ...configs[nodeId], ...config }
    }));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n
      )
    );
  }

  function getExecutionOrder(nodes: FlowNode[], edges: FlowEdge[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const incomingEdges = edges.filter((e) => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }
      
      order.push(nodeId);
    };

    nodes.forEach((node) => visit(node.id));
    return order;
  }

  function executeWorkflow() {
    // Implementation above
  }

  function exportWorkflow() {
    const workflow = { nodes, edges, configs: nodeConfigs };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    addLog('💾 Exported');
  }

  function importWorkflow(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setNodeConfigs(workflow.configs || {});
        addLog('📥 Imported');
      } catch (error) {
        alert('Import failed');
      }
    };
    reader.readAsText(file);
  }

  function clearWorkflow() {
    if (confirm('Clear all?')) {
      setNodes([]);
      setEdges([]);
      setNodeConfigs({});
      setSelectedNode(null);
      addLog('🧹 Cleared');
    }
  }
}
