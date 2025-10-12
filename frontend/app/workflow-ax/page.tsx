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

// Available node types for workflow builder
const AVAILABLE_NODE_TYPES = [
  { 
    id: 'memorySearch', 
    label: '🧠 Memory Search',
    description: 'Vector similarity search in your vault',
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
    description: 'Live Perplexity web search',
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
    description: 'Merge & deduplicate results',
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
    description: 'Smart AI model selection',
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
    description: 'Evolutionary prompt optimization',
    icon: '⚡',
    apiEndpoint: '/api/gepa/optimize',
    config: {
      iterations: 3,
      goal: 'accuracy',
    }
  },
  { 
    id: 'langstruct', 
    label: '🔍 LangStruct Extract',
    description: 'Extract structured data',
    icon: '🔍',
    apiEndpoint: '/api/langstruct/process',
    config: {
      useRealLangStruct: true,
      refine: true,
      maxRetries: 2,
    }
  },
  { 
    id: 'axOptimize', 
    label: '✨ Ax DSPy Optimize',
    description: 'Auto-optimize with Ax signatures',
    icon: '✨',
    apiEndpoint: '/api/ax-dspy',
    config: {
      provider: 'openai',
    }
  },
  { 
    id: 'answer', 
    label: '✅ Generate Answer',
    description: 'Final AI response generation',
    icon: '✅',
    apiEndpoint: '/api/answer',
    config: {
      temperature: 0.7,
      maxTokens: 2048,
    }
  }
];

export default function AxWorkflowPage() {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});

  // Handle node changes (drag, select, etc.)
  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Handle connections between nodes (drag from one handle to another)
  const onConnect = useCallback(
    (connection: FlowConnection) => {
      const newEdge: any = {
        ...connection,
        type: 'animated',
        id: `edge-${Date.now()}`,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      addLog(`✅ Connected: ${connection.source} → ${connection.target}`);
    },
    []
  );

  // Add node to canvas
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
    addLog(`➕ Added node: ${nodeType.label}`);
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    delete nodeConfigs[nodeId];
    setSelectedNode(null);
    addLog(`🗑️ Deleted node: ${nodeId}`);
  };

  // Update node configuration
  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodeConfigs((configs) => ({
      ...configs,
      [nodeId]: { ...configs[nodeId], ...config }
    }));
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...(n.data.config || {}), ...config } } }
          : n
      )
    );
    addLog(`⚙️ Updated config for: ${nodeId}`);
  };

  // Add log entry
  const addLog = (message: string) => {
    setExecutionLog((logs) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...logs.slice(0, 99)]);
  };

  // Execute workflow
  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Please add nodes to your workflow first!');
      return;
    }

    setIsExecuting(true);
    setExecutionLog([]);
    addLog('🚀 Starting workflow execution...');

    try {
      const userId = 'demo-user-' + Date.now();
      let workflowData: any = {
        query: 'What are the latest AI developments?',
        userId,
      };

      // Execute nodes in topological order based on connections
      const executionOrder = getExecutionOrder(nodes, edges);
      
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        addLog(`▶️ Executing: ${node.data.label}`);
        
        // Update node status
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n
          )
        );

        try {
          // Execute the actual API call
          const result = await executeNode(node, workflowData, nodeConfigs[nodeId]);
          workflowData = { ...workflowData, ...result };
          
          // Update node status to complete
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, status: 'complete', result } } : n
            )
          );
          
          addLog(`✅ Completed: ${node.data.label}`);
        } catch (error: any) {
          addLog(`❌ Error in ${node.data.label}: ${error.message}`);
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n
            )
          );
        }

        // Small delay for visualization
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      addLog('🎉 Workflow completed successfully!');
      alert('✅ Workflow executed! Check the execution log panel.');
    } catch (error: any) {
      addLog(`❌ Workflow failed: ${error.message}`);
      alert('❌ Workflow execution failed. Check the log for details.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Get execution order from graph topology
  const getExecutionOrder = (nodes: FlowNode[], edges: FlowEdge[]): string[] => {
    // Simple topological sort
    const order: string[] = [];
    const visited = new Set<string>();
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Visit all dependencies first
      const incomingEdges = edges.filter((e) => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }
      
      order.push(nodeId);
    };

    nodes.forEach((node) => visit(node.id));
    return order;
  };

  // Execute individual node
  const executeNode = async (node: FlowNode, workflowData: any, config: any) => {
    const { id: nodeType, apiEndpoint } = node.data;

    switch (nodeType) {
      case 'memorySearch':
        const memoryRes = await fetch(apiEndpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: workflowData.query,
            userId: workflowData.userId,
            ...config,
          }),
        });
        const memoryData = await memoryRes.json();
        return { memoryResults: memoryData.documents || [] };

      case 'webSearch':
        const webRes = await fetch(apiEndpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: workflowData.query }],
            searchRecencyFilter: config.recencyFilter,
          }),
        });
        const webData = await webRes.json();
        return { webResults: webData.citations || [] };

      case 'contextAssembly':
        return {
          context: [...(workflowData.memoryResults || []), ...(workflowData.webResults || [])]
        };

      case 'modelRouter':
        const routerRes = await fetch(apiEndpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: workflowData.query,
            autoSelectModel: config.autoSelect,
            preferredModel: config.preferredModel,
          }),
        });
        const routerData = await routerRes.json();
        return { selectedModel: routerData.model };

      case 'gepaOptimize':
        const gepaRes = await fetch(apiEndpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: workflowData.query,
            context: JSON.stringify(workflowData.context || []),
          }),
        });
        const gepaData = await gepaRes.json();
        return { optimizedPrompt: gepaData.optimizedPrompt };

      case 'langstruct':
        const langstructRes = await fetch(apiEndpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: JSON.stringify(workflowData.context || workflowData.query),
            useRealLangStruct: config.useRealLangStruct,
          }),
        });
        const langstructData = await langstructRes.json();
        return { extractedData: langstructData.extracted_data };

      case 'answer':
        const answerRes = await fetch(apiEndpoint as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: workflowData.optimizedPrompt || workflowData.query,
            documents: workflowData.context || [],
            preferredModel: workflowData.selectedModel || config.preferredModel,
          }),
        });
        const answerData = await answerRes.json();
        return { finalAnswer: answerData.answer };

      default:
        return {};
    }
  };

  // Export workflow
  const exportWorkflow = () => {
    const workflow = { nodes, edges, configs: nodeConfigs };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    addLog('💾 Workflow exported');
  };

  // Import workflow
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
        addLog('📥 Workflow imported');
      } catch (error) {
        alert('Failed to import workflow');
      }
    };
    reader.readAsText(file);
  };

  // Clear workflow
  const clearWorkflow = () => {
    if (confirm('Clear all nodes and connections?')) {
      setNodes([]);
      setEdges([]);
      setNodeConfigs({});
      setSelectedNode(null);
      addLog('🧹 Workflow cleared');
    }
  };

  // Custom node type renderer
  const nodeTypes = {
    customizable: ({ data }: any) => {
      const statusColors: Record<string, string> = {
        ready: 'border-gray-300',
        executing: 'border-yellow-500 animate-pulse',
        complete: 'border-green-500',
        error: 'border-red-500',
      };

      return (
        <div className="group">
          <Node handles={{ target: true, source: true }} className={`${statusColors[data.status] || 'border-gray-300'} border-2`}>
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
                  API: {data.apiEndpoint}
                </div>
                <div className="text-muted-foreground">
                  Config: {Object.keys(data.config).length} parameters
                </div>
              </div>
            </NodeContent>
            <NodeFooter>
              <p className="text-xs text-muted-foreground">
                Click to configure • Drag from handles to connect
              </p>
            </NodeFooter>
            <Toolbar>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedNode(data.nodeId === selectedNode?.id ? null : data)}
              >
                ⚙️ Config
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
      {/* Sidebar - Node Library */}
      <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">🎯 Node Library</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Click to add nodes to your workflow
          </p>
        </div>

        <div className="space-y-2">
          {AVAILABLE_NODE_TYPES.map((nodeType) => (
            <button
              key={nodeType.id}
              onClick={() => addNode(nodeType)}
              className="w-full p-3 text-left bg-background hover:bg-accent border border-border rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{nodeType.icon}</span>
                <span className="font-semibold text-sm">{nodeType.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{nodeType.description}</p>
            </button>
          ))}
        </div>

        {/* Execution Log */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">📋 Execution Log</h3>
          <div className="bg-background border border-border rounded-lg p-2 max-h-60 overflow-y-auto">
            {executionLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">No executions yet</p>
            ) : (
              <div className="space-y-1">
                {executionLog.map((log, idx) => (
                  <div key={idx} className="text-xs font-mono">{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
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
          
          {/* Top Toolbar */}
          <Panel position="top-left">
            <div className="bg-card border border-border rounded-lg shadow-lg p-3 flex gap-2">
              <Button 
                size="sm" 
                variant="default"
                onClick={executeWorkflow}
                disabled={isExecuting || nodes.length === 0}
              >
                {isExecuting ? '⏳ Running...' : '▶️ Execute Workflow'}
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

          {/* Info Panel */}
          <Panel position="top-right">
            <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span>✨</span>
                Ax DSPy Workflow Builder
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nodes:</span>
                  <span className="font-mono">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connections:</span>
                  <span className="font-mono">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={isExecuting ? 'text-yellow-600' : 'text-green-600'}>
                    {isExecuting ? '⏳ Running' : '● Ready'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Drag from node handles to connect them. Double-click nodes to configure.
                </p>
              </div>
            </div>
          </Panel>

          {/* Instructions */}
          {nodes.length === 0 && (
            <Panel position="bottom-right">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg p-4 max-w-md">
                <h3 className="font-bold mb-2">🚀 Get Started</h3>
                <ol className="text-sm space-y-1">
                  <li>1. Click nodes from the left sidebar to add them</li>
                  <li>2. Drag from ● handles to connect nodes</li>
                  <li>3. Click ⚙️ Config to customize parameters</li>
                  <li>4. Click ▶️ Execute to run your workflow</li>
                </ol>
              </div>
            </Panel>
          )}
        </Canvas>

        {/* Configuration Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-96 bg-card border border-border rounded-lg shadow-2xl p-4 max-h-[80vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span>{String(selectedNode.data?.icon || '')}</span>
                Configure {String(selectedNode.data?.label || selectedNode.id)}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedNode(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(nodeConfigs[selectedNode.id] || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium block mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {typeof value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, { [key]: e.target.checked })
                      }
                      className="rounded"
                    />
                  ) : typeof value === 'number' ? (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, { [key]: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      step="0.1"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.id, { [key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <strong>API:</strong> {String(selectedNode.data?.apiEndpoint || '')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
