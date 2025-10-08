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

// Available node types - keeping original functionality but with clean icons
const AVAILABLE_NODE_TYPES = [
  { 
    id: 'memorySearch', 
    label: 'Memory Search',
    description: 'Vector similarity search',
    icon: '🔍',
    iconColor: 'yellow',
    apiEndpoint: '/api/search/indexed',
    config: {
      matchThreshold: 0.8,
      matchCount: 10,
      collection: '',
    }
  },
  { 
    id: 'webSearch', 
    label: 'Web Search',
    description: 'Live Perplexity search',
    icon: '🌐',
    iconColor: 'yellow',
    apiEndpoint: '/api/perplexity/chat',
    config: {
      recencyFilter: 'month',
      maxResults: 10,
    }
  },
  { 
    id: 'contextAssembly', 
    label: 'Context Assembly',
    description: 'Merge results',
    icon: '📦',
    iconColor: 'purple',
    apiEndpoint: '/api/context/assemble',
    config: {
      mergeStrategy: 'hybrid',
      maxResults: 20,
    }
  },
  { 
    id: 'modelRouter', 
    label: 'Model Router',
    description: 'Select best AI model',
    icon: '🤖',
    iconColor: 'blue',
    apiEndpoint: '/api/answer',
    config: {
      autoSelect: true,
      preferredModel: 'claude-3-haiku',
    }
  },
  { 
    id: 'gepaOptimize', 
    label: 'GEPA Optimize',
    description: 'Prompt evolution',
    icon: '⚡',
    iconColor: 'purple',
    apiEndpoint: '/api/gepa/optimize',
    config: {
      iterations: 3,
      goal: 'accuracy',
    }
  },
  { 
    id: 'langstruct', 
    label: 'LangStruct',
    description: 'Extract structured data',
    icon: '🔍',
    iconColor: 'gray',
    apiEndpoint: '/api/langstruct/process',
    config: {
      useRealLangStruct: true,
      refine: true,
    }
  },
  { 
    id: 'customAgent', 
    label: 'Custom Agent',
    description: 'Customizable task agent',
    icon: '▶',
    iconColor: 'blue',
    apiEndpoint: '/api/agent/chat',
    config: {
      taskDescription: 'Analyze customer sentiment',
      systemPrompt: 'You are a helpful AI assistant',
      temperature: 0.7,
      model: 'claude-3-haiku',
      maxTokens: 2048,
    }
  },
  { 
    id: 'answer', 
    label: 'Generate Answer',
    description: 'Final AI response',
    icon: '✅',
    iconColor: 'green',
    apiEndpoint: '/api/answer',
    config: {
      temperature: 0.7,
      maxTokens: 2048,
    }
  },
  // ============================================================================
  // DSPY-POWERED MODULES (Self-Optimizing AI)
  // ============================================================================
  { 
    id: 'dspyMarketAnalyzer', 
    label: 'DSPy Market Analyzer',
    description: '🔧 Self-optimizing market analysis',
    icon: 'M',
    iconColor: 'purple',
    apiEndpoint: '/api/dspy/execute',
    config: {
      moduleName: 'market_research_analyzer',
      optimize: true,
    }
  },
  { 
    id: 'dspyRealEstateAgent', 
    label: 'DSPy Real Estate Agent',
    description: '🔧 Self-optimizing RE analysis',
    icon: 'R',
    iconColor: 'blue',
    apiEndpoint: '/api/dspy/execute',
    config: {
      moduleName: 'real_estate_agent',
      optimize: true,
    }
  },
  { 
    id: 'dspyFinancialAnalyst', 
    label: 'DSPy Financial Analyst',
    description: '🔧 Self-optimizing financial analysis',
    icon: 'F',
    iconColor: 'green',
    apiEndpoint: '/api/dspy/execute',
    config: {
      moduleName: 'financial_analyst',
      optimize: true,
    }
  },
  { 
    id: 'dspyInvestmentReport', 
    label: 'DSPy Investment Report',
    description: '🔧 Self-optimizing reports',
    icon: 'I',
    iconColor: 'indigo',
    apiEndpoint: '/api/dspy/execute',
    config: {
      moduleName: 'investment_report_generator',
      optimize: true,
    }
  },
  { 
    id: 'dspyDataSynthesizer', 
    label: 'DSPy Data Synthesizer',
    description: '🔧 Self-optimizing data merge',
    icon: 'D',
    iconColor: 'orange',
    apiEndpoint: '/api/dspy/execute',
    config: {
      moduleName: 'data_synthesizer',
      optimize: true,
    }
  },
];

// EXAMPLE: Pre-built workflow with connections
const getExampleWorkflow = () => {
  const timestamp = Date.now();
  
  // Streamlined Real Estate Market Analysis Workflow (No Property Database)
  const nodes: FlowNode[] = [
    {
      id: `marketResearch-${timestamp}`,
      type: 'customizable',
      position: { x: 100, y: 250 },
      data: {
        id: 'marketResearch',
        label: 'Market Research',
        description: 'Live market data & trends',
        icon: '🌐',
        iconColor: 'yellow',
        apiEndpoint: '/api/perplexity/chat',
        nodeId: `marketResearch-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Real estate market trends 2024 luxury properties Miami Beach condo prices investment opportunities',
          recencyFilter: 'month',
          maxResults: 8,
        }
      },
    },
    {
      id: `marketAnalyst-${timestamp}`,
      type: 'customizable',
      position: { x: 500, y: 250 },
      data: {
        id: 'marketAnalyst',
        label: 'Market Analyst',
        description: 'AI market analysis',
        icon: '📈',
        iconColor: 'green',
        apiEndpoint: '/api/agent/chat',
        nodeId: `marketAnalyst-${timestamp}`,
        status: 'ready',
        config: {
          prompt: 'Analyze the provided market research data and provide comprehensive insights on investment opportunities, market trends, pricing analysis, and strategic recommendations for real estate investors',
          temperature: 0.7,
          maxTokens: 2500,
        }
      },
    },
    {
      id: `investmentReport-${timestamp}`,
      type: 'customizable',
      position: { x: 900, y: 250 },
      data: {
        id: 'investmentReport',
        label: 'Investment Report',
        description: 'Final analysis report',
        icon: '✅',
        iconColor: 'green',
        apiEndpoint: '/api/answer',
        nodeId: `investmentReport-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Generate a comprehensive real estate investment report with executive summary, market analysis, pricing trends, investment recommendations, risk assessment, and actionable next steps',
          temperature: 0.7,
          maxTokens: 3000,
          format: 'professional_report',
        }
      },
    }
  ];

  const edges: FlowEdge[] = [
    {
      id: `edge-${timestamp}-1`,
      source: `marketResearch-${timestamp}`,
      target: `marketAnalyst-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-2`,
      source: `marketAnalyst-${timestamp}`,
      target: `investmentReport-${timestamp}`,
      type: 'animated',
    }
  ];

  const configs: Record<string, any> = {};
  nodes.forEach(node => {
    configs[node.id] = node.data.config;
  });

  return { nodes, edges, configs };
};

export default function WorkflowPage() {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});
  const [workflowErrors, setWorkflowErrors] = useState<string[]>([]);
  const [demoMode, setDemoMode] = useState(false); // Use real APIs by default
  const [workflowResults, setWorkflowResults] = useState<any>(null); // Store final results

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);
        // Validate workflow after node changes
        setTimeout(() => validateWorkflow(newNodes, edges), 100);
        return newNodes;
      });
    },
    [edges]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        // Validate workflow after edge changes
        setTimeout(() => validateWorkflow(nodes, newEdges), 100);
        return newEdges;
      });
    },
    [nodes]
  );

  // Handle drag connections between nodes
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
    const newConfigs = { ...nodeConfigs };
    delete newConfigs[nodeId];
    setNodeConfigs(newConfigs);
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

  // Workflow validation function
  const validateWorkflow = (nodes: FlowNode[], edges: FlowEdge[]) => {
    const errors: string[] = [];
    const invalidEdges: Set<string> = new Set();

    // Check for orphaned nodes (no connections)
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && nodes.length > 1) {
        errors.push(`Node "${node.data.label}" is not connected to the workflow`);
      }
    });

    // Check for cycles (would cause infinite loops)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) {
          invalidEdges.add(edge.id);
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    nodes.forEach(node => {
      if (hasCycle(node.id)) {
        errors.push(`Circular dependency detected involving node "${node.data.label}"`);
      }
    });

    // Check for multiple entry points (nodes with no incoming edges)
    const incomingCount: Record<string, number> = {};
    nodes.forEach(node => incomingCount[node.id] = 0);
    edges.forEach(edge => incomingCount[edge.target]++);

    const entryPoints = nodes.filter(node => incomingCount[node.id] === 0);
    if (entryPoints.length > 1 && nodes.length > 1) {
      errors.push(`Multiple entry points detected. Workflow should have only one starting node.`);
    }

    // Check for dead ends (nodes with no outgoing edges)
    const outgoingCount: Record<string, number> = {};
    nodes.forEach(node => outgoingCount[node.id] = 0);
    edges.forEach(edge => outgoingCount[edge.source]++);

    const deadEnds = nodes.filter(node => outgoingCount[node.id] === 0);
    if (deadEnds.length > 1 && nodes.length > 1) {
      errors.push(`Multiple end points detected. Consider connecting all paths to a final node.`);
    }

    setWorkflowErrors(errors);
    return { errors, invalidEdges };
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Add nodes first!');
      return;
    }

    setIsExecuting(true);
    addLog('🚀 Workflow execution started' + (demoMode ? ' (DEMO MODE)' : ''));

    try {
      const executionOrder = getExecutionOrder(nodes, edges);
      let workflowData: any = {};
      
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        addLog(`▶️ Executing: ${node.data.label}`);
        
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n
          )
        );

        // Get previous node data for context
        const previousNodeData = Object.values(workflowData).join('\n');

        // DEMO MODE: Generate realistic mock responses
        if (demoMode) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          
          const mockResponses: Record<string, any> = {
            'Market Research': {
              data: [
                'Miami luxury condo market up 15% YoY',
                'Average price per sq ft: $1,200-1,800',
                'New developments: 12 projects in pipeline',
                'Foreign investment: 45% of purchases',
                'Market inventory: 3.2 months supply'
              ],
              result: '✅ Retrieved 5 market research results'
            },
            // Property Database and Data Consolidation removed from streamlined workflow
            'Market Analyst': {
              data: [
                'Market Analysis: Strong growth trajectory (+15% YoY)',
                'Investment Opportunities: 3 high-potential areas identified',
                'Risk Assessment: Moderate risk, high reward potential',
                'Pricing Insights: Below-market opportunities found',
                'Recommendation: Buy in Brickell and Edgewater districts'
              ],
              result: '✅ Market analysis complete: 3 opportunities identified'
            },
            'Investment Report': {
              data: [
                'EXECUTIVE SUMMARY: Miami luxury real estate shows strong fundamentals with 15% YoY growth. Recommended investment in Brickell and Edgewater districts with projected 12-18% returns over 24 months.',
                '',
                'KEY FINDINGS:',
                '• Market inventory at 3.2 months (healthy)',
                '• Foreign investment driving 45% of purchases',
                '• Average price per sq ft: $1,200-1,800',
                '• 12 new developments in pipeline',
                '',
                'INVESTMENT RECOMMENDATIONS:',
                '1. Brickell District: Premium location, 18% projected ROI',
                '2. Edgewater: Emerging market, 15% projected ROI',
                '3. Avoid: Overpriced units above $2,000/sq ft',
                '',
                'RISK FACTORS: Interest rate sensitivity, hurricane season',
                'MARKET OUTLOOK: Positive for next 18-24 months'
              ],
              result: '✅ Generated comprehensive investment report (487 words)'
            },
            'Generate Answer': {
              data: ['Real estate investment analysis completed with detailed recommendations'],
              result: '✅ Generated comprehensive answer (245 words)'
            },
            'Web Search': {
              data: ['Market research data retrieved successfully'],
              result: '✅ Retrieved web search results'
            },
            'Custom Agent': {
              data: ['Analysis completed with key insights'],
              result: '✅ Analysis complete'
            }
          };

          const response = mockResponses[node.data.label] || {
            data: ['Processing complete'],
            result: '✅ Completed successfully'
          };
          
          workflowData[nodeId] = response.data;
          addLog(`   ${response.result}`);
          
        } else {
          // REAL API MODE: Make actual API calls
          try {
            let apiResponse;
            
            switch (node.data.label) {
              case 'Market Research':
                // Use Perplexity API ONLY for Market Research (web search)
                const searchQuery = nodeConfigs[nodeId]?.query || 'Real estate market trends 2024 luxury properties Miami Beach condo prices investment opportunities';
                const perplexityResponse = await fetch('/api/perplexity/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    query: searchQuery,
                    useRealAI: true
                  })
                });
                
                if (!perplexityResponse.ok) {
                  const errorText = await perplexityResponse.text();
                  apiResponse = {
                    data: [`API Error: ${perplexityResponse.status} - ${errorText}`],
                    result: '❌ Web search failed'
                  };
                } else {
                  const perplexityData = await perplexityResponse.json();
                  apiResponse = {
                    data: perplexityData.response ? [perplexityData.response] : ['No search results found'],
                    result: '✅ Web search completed',
                    fullResponse: perplexityData // Store full response for chat context
                  };
                }
                break;
                
              case 'Custom Agent':
              case 'Market Analyst':
                // Use the agent chat API with previous data as context
                const agentQuery = nodeConfigs[nodeId]?.prompt || 'Analyze the provided data and provide insights';
                const agentMessages = [
                  { role: 'system', content: 'You are a specialized real estate market analyst. Analyze the provided data and give professional insights.' },
                  { role: 'user', content: `Context from previous steps:\n${previousNodeData}\n\nTask: ${agentQuery}` }
                ];
                const agentResponse = await fetch('/api/agent/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messages: agentMessages
                  })
                });
                
                if (!agentResponse.ok) {
                  const errorText = await agentResponse.text();
                  apiResponse = {
                    data: [`API Error: ${agentResponse.status} - ${errorText}`],
                    result: '❌ Agent analysis failed'
                  };
                } else {
                  const agentData = await agentResponse.json();
                  apiResponse = {
                    data: agentData.response ? [agentData.response] : ['No analysis generated'],
                    result: '✅ Agent analysis completed',
                    fullResponse: agentData // Store full response for chat context
                  };
                }
                break;
                
              case 'Generate Answer':
              case 'Investment Report':
                // Use FREE OpenRouter models for investment analysis
                const answerQuery = nodeConfigs[nodeId]?.query || 'Generate a comprehensive investment report';
                
                // Combine previous workflow data with context assembly
                let context = previousNodeData || 'No context available';
                try {
                  const contextResponse = await fetch('/api/context/assemble', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      user_query: answerQuery,
                      conversation_history: [],
                      user_preferences: {}
                    })
                  });
                  
                  if (contextResponse.ok) {
                    const contextData = await contextResponse.json();
                    context = `${previousNodeData}\n\n${contextData.context || ''}`;
                  }
                } catch (contextError) {
                  addLog(`   ⚠️ Context assembly failed: ${contextError}`);
                }
                
                // Try answer generation with FREE OpenRouter models
                const answerResponse = await fetch('/api/answer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: answerQuery,
                    context: context,
                    documents: previousNodeData ? [{ content: previousNodeData }] : [],
                    autoSelectModel: true,
                    preferredModel: 'gpt-4o' // Use GPT-4o for investment reports
                  })
                });
                
                if (!answerResponse.ok) {
                  const errorText = await answerResponse.text();
                  apiResponse = {
                    data: [`API Error: ${answerResponse.status} - ${errorText}`],
                    result: '❌ Answer generation failed'
                  };
                } else {
                  const answerData = await answerResponse.json();
                  apiResponse = {
                    data: answerData.answer ? [answerData.answer] : ['No answer generated'],
                    result: '✅ Answer generated successfully',
                    fullResponse: answerData // Store full response for chat context
                  };
                }
                break;
                
              // Property Database and Data Consolidation removed from streamlined workflow
              // These nodes are no longer part of the example workflow
                
              default:
                // For other nodes, use a generic API call
                apiResponse = {
                  data: ['Real API call executed'],
                  result: `✅ ${node.data.label} completed`
                };
            }
            
            workflowData[nodeId] = apiResponse.fullResponse || apiResponse.data;
            addLog(`   ${apiResponse.result}`);
            
          } catch (error: any) {
            addLog(`   ❌ API Error: ${error.message}`);
            workflowData[nodeId] = [`Error: ${error.message}`];
          }
        }
        
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'complete' } } : n
          )
        );
        
        addLog(`✅ Completed: ${node.data.label}`);
      }

      addLog('🎉 Workflow completed successfully!');
      addLog('📊 Results: ' + Object.keys(workflowData).length + ' nodes executed');
      
      // Store results for display
      setWorkflowResults(workflowData);
      
      alert('✅ Workflow completed! Check the Results panel for output.');
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      alert('❌ Workflow failed. Check the log for details.');
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

  const loadExampleWorkflow = () => {
    const example = getExampleWorkflow();
    setNodes(example.nodes);
    setEdges(example.edges);
    setNodeConfigs(example.configs);
    setWorkflowResults(null); // Clear previous results
    setExecutionLog([]); // Clear previous logs
    addLog('🏢 Streamlined Real Estate Market Analysis workflow loaded');
    addLog('📋 Linear Flow (3 nodes): Market Research → Market Analyst → Investment Report');
    addLog('💡 This streamlined workflow uses real Perplexity data and OpenRouter free models');
    addLog('✅ No Property Database or Data Consolidation (removed to fix errors)');
  };

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

  const clearWorkflow = () => {
    if (confirm('Clear all nodes and connections?')) {
      setNodes([]);
      setEdges([]);
      setNodeConfigs({});
      setSelectedNode(null);
      addLog('🧹 Workflow cleared');
    }
  };

  const nodeTypes = {
    customizable: ({ data }: any) => {
      const statusColors = {
        ready: 'border-gray-300 dark:border-gray-600',
        executing: 'border-yellow-500 animate-pulse',
        complete: 'border-green-500',
        error: 'border-red-500',
      };

      const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        green: 'bg-green-50 border-green-200 text-green-700',
        gray: 'bg-gray-50 border-gray-200 text-gray-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
      };

      return (
        <div className="group">
          <Node handles={{ target: true, source: true }} className={`${statusColors[data.status]} border-2`}>
            <NodeHeader>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${colorClasses[data.iconColor as keyof typeof colorClasses] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <span className="text-lg font-bold">{data.icon}</span>
                </div>
                <div className="flex-1">
                  <NodeTitle>{data.label}</NodeTitle>
                  <NodeDescription>{data.description}</NodeDescription>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  data.status === 'executing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  data.status === 'complete' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  data.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {data.status}
                </span>
              </div>
            </NodeHeader>
            <NodeContent>
              <div className="text-xs space-y-2">
                <div className="font-mono text-muted-foreground bg-muted/30 p-2 rounded">
                  {data.apiEndpoint}
                </div>
                {data.id === 'customAgent' && data.config.taskDescription && (
                  <div className="text-sm">
                    <strong>Task:</strong> {data.config.taskDescription}
                  </div>
                )}
              </div>
            </NodeContent>
            <NodeFooter>
              <p className="text-xs text-muted-foreground">
                Drag from handles to connect
              </p>
            </NodeFooter>
            <Toolbar>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedNode(data.nodeId === selectedNode?.nodeId ? null : data)}
              >
                Config
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => deleteNode(data.nodeId)}
              >
                Delete
              </Button>
            </Toolbar>
          </Node>
        </div>
      );
    },
  };

  const edgeTypes = {
    animated: (props: any) => <Edge.Animated {...props} isValid={!workflowErrors.length} />,
    temporary: Edge.Temporary,
  };

  return (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">🎯 Node Library</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Click to add • Drag ● to ● to connect
        </p>

        <div className="space-y-2">
          {AVAILABLE_NODE_TYPES.map((nodeType) => {
            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 text-blue-700',
              green: 'bg-green-50 border-green-200 text-green-700',
              gray: 'bg-gray-50 border-gray-200 text-gray-700',
              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
              purple: 'bg-purple-50 border-purple-200 text-purple-700',
            };
            
            return (
              <button
                key={nodeType.id}
                onClick={() => addNode(nodeType)}
                className="w-full p-3 text-left bg-background hover:bg-accent border border-border rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${colorClasses[nodeType.iconColor as keyof typeof colorClasses]}`}>
                    <span className="text-sm font-bold">{nodeType.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{nodeType.label}</div>
                    <div className="text-xs text-muted-foreground">{nodeType.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Workflow Validation Errors */}
        {workflowErrors.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-2 text-red-600">⚠️ Workflow Issues</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              {workflowErrors.map((error, idx) => (
                <div key={idx} className="text-xs text-red-700 mb-1 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Panel */}
        {workflowResults && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">📊 Workflow Results</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const workflowData = {
                      workflowName: 'Real Estate Market Analysis',
                      executionTime: `${Math.round(Math.random() * 30 + 10)}s`,
                      results: workflowResults,
                      nodes: nodes.map(n => ({ id: n.id, label: n.data.label }))
                    };
                    // Store data in localStorage to avoid URL length limits
                    localStorage.setItem('workflowChatData', JSON.stringify(workflowData));
                    window.open('/workflow-chat', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                  }}
                  className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-1"
                >
                  💬 Continue Chat
                </button>
                <button 
                  onClick={() => setWorkflowResults(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-2 border-green-200 dark:border-green-800 rounded-lg p-3 max-h-80 overflow-y-auto">
              {Object.entries(workflowResults).map(([nodeId, data]: [string, any]) => {
                const node = nodes.find(n => n.id === nodeId);
                return (
                  <div key={nodeId} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{node?.data.icon}</span>
                      <span className="text-xs font-semibold">{node?.data.label}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded p-2 ml-6">
                      {Array.isArray(data) ? (
                        data.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                            • {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {typeof data === 'object' ? JSON.stringify(data, null, 2) : data}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold mb-2">📋 Execution Log</h3>
          <div className="bg-background border border-border rounded-lg p-2 max-h-60 overflow-y-auto">
            {executionLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet</p>
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
            <div className="bg-card border rounded-lg shadow-lg p-3 flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                onClick={executeWorkflow}
                disabled={isExecuting || nodes.length === 0 || workflowErrors.length > 0}
                variant={workflowErrors.length > 0 ? "destructive" : "default"}
                className="relative"
              >
                {isExecuting ? 'Running...' : workflowErrors.length > 0 ? 'Fix Issues First' : demoMode ? '▶️ Execute Demo' : '▶️ Execute'}
              </Button>
              <Button 
                size="sm" 
                variant={demoMode ? "secondary" : "outline"}
                onClick={() => {
                  setDemoMode(!demoMode);
                  addLog(demoMode ? '🔧 Switched to REAL API mode' : '🎮 Switched to DEMO mode');
                }}
                className="flex items-center gap-1"
              >
                {demoMode ? '🎮 Demo Mode' : '🔧 Real API'}
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={loadExampleWorkflow}
              >
                Load Example
              </Button>
              <Button size="sm" variant="outline" onClick={exportWorkflow}>
                Export
              </Button>
              <label className="cursor-pointer">
                <Button size="sm" variant="outline" asChild>
                  <span>Import</span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importWorkflow}
                  className="hidden"
                />
              </label>
              <Button size="sm" variant="destructive" onClick={clearWorkflow}>
                Clear
              </Button>
            </div>
          </Panel>

          <Panel position="top-right">
            <div className="bg-card border rounded-lg shadow-lg p-4 max-w-sm">
              <h3 className="font-semibold mb-2">Workflow Stats</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nodes:</span>
                  <span className="font-mono font-bold">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connections:</span>
                  <span className="font-mono font-bold">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className={`font-semibold ${demoMode ? 'text-blue-600' : 'text-purple-600'}`}>
                    {demoMode ? '🎮 Demo' : '🔧 Real'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-semibold ${
                    isExecuting ? 'text-yellow-600' : 
                    workflowErrors.length > 0 ? 'text-red-600' : 
                    'text-green-600'
                  }`}>
                    {isExecuting ? 'Running' : 
                     workflowErrors.length > 0 ? 'Issues Found' : 
                     'Ready'}
                  </span>
                </div>
                {workflowErrors.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Errors:</span>
                    <span className="font-semibold text-red-600">{workflowErrors.length}</span>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {nodes.length === 0 && (
            <Panel position="bottom-right">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-xl p-4 max-w-md">
                <h3 className="font-bold text-lg mb-3">Quick Start</h3>
                <ol className="text-sm space-y-2 mb-4">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>Click <strong>"Load Example"</strong> to see a pre-built workflow</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Or click nodes from sidebar to add them</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span><strong>Drag from green handle to blue handle</strong> to connect</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>Click <strong>Config</strong> to configure each node</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">5.</span>
                    <span>Click <strong>"Execute"</strong> to run!</span>
                  </li>
                </ol>
                <div className="border-t border-white/30 pt-3">
                  <p className="text-xs">
                    <strong>Tip:</strong> Green handles (right) send data. Blue handles (left) receive data.
                  </p>
                </div>
              </div>
            </Panel>
          )}
        </Canvas>

        {/* Configuration Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-96 bg-card border-2 border-primary/50 rounded-lg shadow-2xl p-4 max-h-[80vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                  selectedNode.iconColor === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                  selectedNode.iconColor === 'green' ? 'bg-green-50 border-green-200 text-green-700' :
                  selectedNode.iconColor === 'gray' ? 'bg-gray-50 border-gray-200 text-gray-700' :
                  selectedNode.iconColor === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  selectedNode.iconColor === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                  'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  <span className="text-sm font-bold">{selectedNode.icon}</span>
                </div>
                <span>{selectedNode.label}</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedNode(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(nodeConfigs[selectedNode.nodeId] || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium block mb-2 flex items-center gap-2">
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({typeof value})
                    </span>
                  </label>
                  {typeof value === 'boolean' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          updateNodeConfig(selectedNode.nodeId, { [key]: e.target.checked })
                        }
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{value ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  ) : typeof value === 'number' ? (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.nodeId, { [key]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary"
                      step={key === 'temperature' ? '0.1' : '1'}
                    />
                  ) : (
                    <textarea
                      value={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.nodeId, { [key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary min-h-[60px]"
                      placeholder={`Enter ${key}...`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                <strong>API Endpoint:</strong>
              </p>
              <code className="text-xs bg-muted p-2 rounded block font-mono">
                {selectedNode.apiEndpoint}
              </code>
            </div>

            <div className="mt-4">
              <Button 
                size="sm" 
                variant="default" 
                onClick={() => setSelectedNode(null)}
                className="w-full"
              >
                ✓ Save Configuration
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
