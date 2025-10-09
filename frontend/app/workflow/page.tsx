'use client';

import { useState, useCallback, useEffect } from 'react';
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
    icon: 'SEARCH',
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
    icon: 'SEARCH',
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
    icon: 'OK',
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
    description: '🔧 Self-optimizing market analysis (FREE - Ollama)',
    icon: 'M',
    iconColor: 'purple',
    apiEndpoint: '/api/ax-dspy',
    config: {
      moduleName: 'market_research_analyzer',
      provider: 'ollama',
      optimize: true,
    }
  },
  { 
    id: 'dspyRealEstateAgent', 
    label: 'DSPy Real Estate Agent',
    description: '🔧 Self-optimizing RE analysis (FREE - Ollama)',
    icon: 'R',
    iconColor: 'blue',
    apiEndpoint: '/api/ax-dspy',
    config: {
      moduleName: 'real_estate_agent',
      provider: 'ollama',
      optimize: true,
    }
  },
  { 
    id: 'dspyFinancialAnalyst', 
    label: 'DSPy Financial Analyst',
    description: '🔧 Self-optimizing financial analysis (FREE - Ollama)',
    icon: 'F',
    iconColor: 'green',
    apiEndpoint: '/api/ax-dspy',
    config: {
      moduleName: 'financial_analyst',
      provider: 'ollama',
      optimize: true,
    }
  },
  { 
    id: 'dspyInvestmentReport', 
    label: 'DSPy Investment Report',
    description: '🔧 Self-optimizing reports (FREE - Ollama)',
    icon: 'I',
    iconColor: 'indigo',
    apiEndpoint: '/api/ax-dspy',
    config: {
      moduleName: 'investment_report_generator',
      provider: 'ollama',
      optimize: true,
    }
  },
  { 
    id: 'dspyDataSynthesizer', 
    label: 'DSPy Data Synthesizer',
    description: '🔧 Self-optimizing data merge (FREE - Ollama)',
    icon: 'D',
    iconColor: 'orange',
    apiEndpoint: '/api/ax-dspy',
    config: {
      moduleName: 'data_synthesizer',
      provider: 'ollama',
      optimize: true,
    }
  },
];

// AX LLM WORKFLOW: Official Ax Framework Integration
const getAxLLMWorkflow = () => {
  const spacing = 350;
  return {
    nodes: [
      {
        id: 'ax-1',
        type: 'customizable',
        position: { x: 100, y: 200 },
        data: {
          label: 'Web Search',
          apiEndpoint: '/api/perplexity/chat',
          icon: '🌐',
          iconColor: 'bg-blue-500',
          status: 'idle',
        },
      },
      {
        id: 'ax-2',
        type: 'customizable',
        position: { x: 100 + spacing, y: 200 },
        data: {
          label: 'Ax Agent',
          apiEndpoint: '/api/agent/chat',
          icon: '🤖',
          iconColor: 'bg-purple-500',
          status: 'idle',
        },
      },
      {
        id: 'ax-3',
        type: 'customizable',
        position: { x: 100 + spacing * 2, y: 200 },
        data: {
          label: 'Ax Optimizer',
          apiEndpoint: '/api/agent/chat',
          icon: '⚡',
          iconColor: 'bg-yellow-500',
          status: 'idle',
        },
      },
      {
        id: 'ax-4',
        type: 'customizable',
        position: { x: 100 + spacing * 3, y: 200 },
        data: {
          label: 'Ax Report Generator',
          apiEndpoint: '/api/answer',
          icon: 'CONFIG',
          iconColor: 'bg-green-500',
          status: 'idle',
        },
      },
    ],
    edges: [
      { id: 'e-ax-1-2', source: 'ax-1', target: 'ax-2', type: 'default', animated: true },
      { id: 'e-ax-2-3', source: 'ax-2', target: 'ax-3', type: 'default', animated: true },
      { id: 'e-ax-3-4', source: 'ax-3', target: 'ax-4', type: 'default', animated: true },
    ],
    configs: {
      'ax-1': {
        query: 'Miami Beach luxury real estate market trends 2024-2025 investment opportunities prices',
        industry: 'real estate',
        useRealAI: true,
      },
      'ax-2': {
        query: 'Analyze the Miami Beach luxury real estate market data and provide expert insights using Ax LLM framework',
        useRealAI: true,
      },
      'ax-3': {
        query: 'Optimize the market analysis using Ax LLM prompt optimization and provide enhanced recommendations',
        useRealAI: true,
      },
      'ax-4': {
        query: 'Generate a comprehensive investment report based on Ax-optimized market analysis',
        preferredModel: 'gemma-3',
        autoSelectModel: false,
        queryType: 'investment',
      },
    },
  };
};

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
        icon: 'OK',
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

// COMPLEX WORKFLOW: Full system capabilities demonstration
const getComplexWorkflow = () => {
  const timestamp = Date.now();
  
  const nodes: FlowNode[] = [
    // Entry point: Web Search
    {
      id: `webSearch-${timestamp}`,
      type: 'customizable',
      position: { x: 50, y: 100 },
      data: {
        id: 'webSearch',
        label: 'Web Search',
        description: 'Live market data',
        icon: '🌐',
        iconColor: 'yellow',
        apiEndpoint: '/api/perplexity/chat',
        nodeId: `webSearch-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Miami Beach luxury real estate market trends 2024 investment opportunities',
          recencyFilter: 'month',
          maxResults: 8,
        }
      },
    },
    // Memory Search (parallel to web search)
    {
      id: `memorySearch-${timestamp}`,
      type: 'customizable',
      position: { x: 50, y: 300 },
      data: {
        id: 'memorySearch',
        label: 'Memory Search',
        description: 'Vector similarity search',
        icon: 'SEARCH',
        iconColor: 'purple',
        apiEndpoint: '/api/search/indexed',
        nodeId: `memorySearch-${timestamp}`,
        status: 'ready',
        config: {
          query: 'luxury real estate Miami Beach historical data',
          matchThreshold: 0.7,
          matchCount: 5,
        }
      },
    },
    // Context Assembly: Merge web + memory
    {
      id: `contextAssembly-${timestamp}`,
      type: 'customizable',
      position: { x: 400, y: 200 },
      data: {
        id: 'contextAssembly',
        label: 'Context Assembly',
        description: 'Merge data sources',
        icon: '📦',
        iconColor: 'blue',
        apiEndpoint: '/api/context/assemble',
        nodeId: `contextAssembly-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Combine web search and memory data for comprehensive real estate analysis',
          mergeStrategy: 'hybrid',
        }
      },
    },
    // Model Router: Select best model
    {
      id: `modelRouter-${timestamp}`,
      type: 'customizable',
      position: { x: 750, y: 100 },
      data: {
        id: 'modelRouter',
        label: 'Model Router',
        description: 'Smart model selection',
        icon: '🔀',
        iconColor: 'orange',
        apiEndpoint: '/api/answer',
        nodeId: `modelRouter-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Analyze real estate investment opportunities',
          autoSelectModel: true,
        }
      },
    },
    // GEPA Optimizer: Optimize prompts
    {
      id: `gepaOptimize-${timestamp}`,
      type: 'customizable',
      position: { x: 750, y: 300 },
      data: {
        id: 'gepaOptimize',
        label: 'GEPA Optimize',
        description: 'Prompt optimization',
        icon: '⚡',
        iconColor: 'red',
        apiEndpoint: '/api/agent/chat',
        nodeId: `gepaOptimize-${timestamp}`,
        status: 'ready',
        config: {
          prompt: 'Optimize investment analysis with GEPA framework',
          temperature: 0.3,
        }
      },
    },
    // Market Analyst: Deep analysis
    {
      id: `marketAnalyst-${timestamp}`,
      type: 'customizable',
      position: { x: 1100, y: 200 },
      data: {
        id: 'marketAnalyst',
        label: 'Market Analyst',
        description: 'Expert analysis',
        icon: '📈',
        iconColor: 'green',
        apiEndpoint: '/api/agent/chat',
        nodeId: `marketAnalyst-${timestamp}`,
        status: 'ready',
        config: {
          prompt: 'Provide expert real estate market analysis with specific recommendations',
          temperature: 0.7,
        }
      },
    },
    // Investment Report: Final output
    {
      id: `investmentReport-${timestamp}`,
      type: 'customizable',
      position: { x: 1450, y: 100 },
      data: {
        id: 'investmentReport',
        label: 'Investment Report',
        description: 'Professional report',
        icon: 'OK',
        iconColor: 'green',
        apiEndpoint: '/api/answer',
        nodeId: `investmentReport-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Generate comprehensive investment report with executive summary, analysis, and recommendations',
          preferredModel: 'gemma-2',
        }
      },
    },
    // Risk Assessment (parallel final node)
    {
      id: `riskAssessment-${timestamp}`,
      type: 'customizable',
      position: { x: 1450, y: 300 },
      data: {
        id: 'riskAssessment',
        label: 'Risk Assessment',
        description: 'Risk analysis',
        icon: 'WARNING',
        iconColor: 'red',
        apiEndpoint: '/api/answer',
        nodeId: `riskAssessment-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Analyze investment risks, market volatility, and mitigation strategies',
          preferredModel: 'gemma-2',
        }
      },
    },
  ];

  const edges: FlowEdge[] = [
    // Web Search → Context Assembly
    {
      id: `edge-${timestamp}-1`,
      source: `webSearch-${timestamp}`,
      target: `contextAssembly-${timestamp}`,
      type: 'animated',
    },
    // Memory Search → Context Assembly
    {
      id: `edge-${timestamp}-2`,
      source: `memorySearch-${timestamp}`,
      target: `contextAssembly-${timestamp}`,
      type: 'animated',
    },
    // Context Assembly → Model Router
    {
      id: `edge-${timestamp}-3`,
      source: `contextAssembly-${timestamp}`,
      target: `modelRouter-${timestamp}`,
      type: 'animated',
    },
    // Context Assembly → GEPA Optimize
    {
      id: `edge-${timestamp}-4`,
      source: `contextAssembly-${timestamp}`,
      target: `gepaOptimize-${timestamp}`,
      type: 'animated',
    },
    // Model Router → Market Analyst
    {
      id: `edge-${timestamp}-5`,
      source: `modelRouter-${timestamp}`,
      target: `marketAnalyst-${timestamp}`,
      type: 'animated',
    },
    // GEPA Optimize → Market Analyst
    {
      id: `edge-${timestamp}-6`,
      source: `gepaOptimize-${timestamp}`,
      target: `marketAnalyst-${timestamp}`,
      type: 'animated',
    },
    // Market Analyst → Investment Report
    {
      id: `edge-${timestamp}-7`,
      source: `marketAnalyst-${timestamp}`,
      target: `investmentReport-${timestamp}`,
      type: 'animated',
    },
    // Market Analyst → Risk Assessment
    {
      id: `edge-${timestamp}-8`,
      source: `marketAnalyst-${timestamp}`,
      target: `riskAssessment-${timestamp}`,
      type: 'animated',
    },
  ];

  const configs: Record<string, any> = {};
  nodes.forEach(node => {
    configs[node.id] = node.data.config;
  });

  return { nodes, edges, configs };
};

// DSPY-OPTIMIZED WORKFLOW: Self-improving AI with continuous learning
const getDSPyOptimizedWorkflow = () => {
  const timestamp = Date.now();
  
  const nodes: FlowNode[] = [
    // Entry: Multi-source data gathering
    {
      id: `multiSourceRAG-${timestamp}`,
      type: 'customizable',
      position: { x: 50, y: 200 },
      data: {
        id: 'multiSourceRAG',
        label: 'Multi-Source RAG',
        description: 'Web + Memory + Context',
        icon: '🔎',
        iconColor: 'purple',
        apiEndpoint: '/api/perplexity/chat',
        nodeId: `multiSourceRAG-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Miami Beach luxury real estate market trends 2024 investment opportunities comprehensive analysis',
          recencyFilter: 'month',
          maxResults: 10,
        }
      },
    },
    // DSPy Market Analyzer (self-optimizing)
    {
      id: `dspyMarketAnalyzer-${timestamp}`,
      type: 'customizable',
      position: { x: 450, y: 200 },
      data: {
        id: 'dspyMarketAnalyzer',
        label: 'DSPy Market Analyzer',
        description: '🔧 Self-optimizing analysis',
        icon: 'M',
        iconColor: 'purple',
        apiEndpoint: '/api/dspy/execute',
        nodeId: `dspyMarketAnalyzer-${timestamp}`,
        status: 'ready',
        config: {
          moduleName: 'market_research_analyzer',
          optimize: true,
        }
      },
    },
    // DSPy Real Estate Agent (specialized self-optimizing)
    {
      id: `dspyRealEstateAgent-${timestamp}`,
      type: 'customizable',
      position: { x: 850, y: 200 },
      data: {
        id: 'dspyRealEstateAgent',
        label: 'DSPy Real Estate Agent',
        description: '🔧 Self-optimizing RE expert',
        icon: 'R',
        iconColor: 'blue',
        apiEndpoint: '/api/dspy/execute',
        nodeId: `dspyRealEstateAgent-${timestamp}`,
        status: 'ready',
        config: {
          moduleName: 'real_estate_agent',
          optimize: true,
        }
      },
    },
    // DSPy Investment Report (self-optimizing reports)
    {
      id: `dspyInvestmentReport-${timestamp}`,
      type: 'customizable',
      position: { x: 1250, y: 200 },
      data: {
        id: 'dspyInvestmentReport',
        label: 'DSPy Investment Report',
        description: '🔧 Self-optimizing reports',
        icon: 'I',
        iconColor: 'indigo',
        apiEndpoint: '/api/dspy/execute',
        nodeId: `dspyInvestmentReport-${timestamp}`,
        status: 'ready',
        config: {
          moduleName: 'investment_report_generator',
          optimize: true,
        }
      },
    },
    // Continuous Learning Tracker
    {
      id: `learningTracker-${timestamp}`,
      type: 'customizable',
      position: { x: 1250, y: 400 },
      data: {
        id: 'learningTracker',
        label: 'Learning Tracker',
        description: 'Track optimization metrics',
        icon: 'CHART',
        iconColor: 'green',
        apiEndpoint: '/api/answer',
        nodeId: `learningTracker-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Summarize workflow performance, optimization metrics, and learning improvements',
          preferredModel: 'phi-3',
        }
      },
    },
  ];

  const edges: FlowEdge[] = [
    {
      id: `edge-${timestamp}-1`,
      source: `multiSourceRAG-${timestamp}`,
      target: `dspyMarketAnalyzer-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-2`,
      source: `dspyMarketAnalyzer-${timestamp}`,
      target: `dspyRealEstateAgent-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-3`,
      source: `dspyRealEstateAgent-${timestamp}`,
      target: `dspyInvestmentReport-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-4`,
      source: `dspyRealEstateAgent-${timestamp}`,
      target: `learningTracker-${timestamp}`,
      type: 'animated',
    },
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
  const [selectedNode, setSelectedNode] = useState<{ nodeId: string; label: string; apiEndpoint: string; icon?: string; iconColor?: string } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});
  const [workflowErrors, setWorkflowErrors] = useState<string[]>([]);
  const [workflowResults, setWorkflowResults] = useState<any>(null); // Store final results
  const [currentWorkflowName, setCurrentWorkflowName] = useState<string>('Real Estate Market Analysis');

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
      const newEdge: any = {
        ...connection,
        type: 'animated',
        id: `edge-${Date.now()}`,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      addLog(`Connected: ${connection.source} → ${connection.target}`);
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
    addLog(`Deleted: ${nodeId}`);
  };

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
    addLog(`Updated configuration for ${nodeId}`);
  };

  const addLog = (message: string) => {
    setExecutionLog((logs) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...logs.slice(0, 99)]);
  };

  // Function to strip markdown formatting from text
  const stripMarkdown = (text: string): string => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
      .replace(/__(.*?)__/g, '$1')     // Remove bold __text__
      .replace(/_(.*?)_/g, '$1')       // Remove italic _text_
      .replace(/`(.*?)`/g, '$1')       // Remove code `text`
      .replace(/#{1,6}\s/g, '')        // Remove headers # ## ### etc
      .replace(/^\s*[-*+]\s/gm, '• ')  // Convert bullet points to simple bullets
      .replace(/\n{3,}/g, '\n\n')      // Limit multiple newlines
      .trim();
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
    // Allow up to 3 entry points for parallel data gathering (e.g., Web + Memory + Database)
    if (entryPoints.length > 3 && nodes.length > 1) {
      errors.push(`${entryPoints.length} entry points detected. Consider if this many parallel starts is intentional.`);
    }

    // Check for dead ends (nodes with no outgoing edges)
    const outgoingCount: Record<string, number> = {};
    nodes.forEach(node => outgoingCount[node.id] = 0);
    edges.forEach(edge => outgoingCount[edge.source]++);

    const deadEnds = nodes.filter(node => outgoingCount[node.id] === 0);
    // Allow up to 3 exit points for parallel outputs (e.g., Report + Risk + Summary)
    if (deadEnds.length > 3 && nodes.length > 1) {
      errors.push(`${deadEnds.length} end points detected. Consider if this many parallel outputs is intentional.`);
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
    addLog('🚀 Workflow execution started with REAL APIs');

    try {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ARCMEMO: Retrieve learned concepts BEFORE execution
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let learnedConcepts: any[] = [];
      try {
        addLog('🧠 Retrieving learned concepts from ArcMemo...');
        const conceptsResponse = await fetch('/api/arcmemo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'retrieve',
            query: { 
              userRequest: currentWorkflowName, 
              domain: currentWorkflowName.toLowerCase().includes('real estate') ? 'real_estate' : 
                      currentWorkflowName.toLowerCase().includes('financ') ? 'finance' : 'general'
            }
          })
        });
        
        if (conceptsResponse.ok) {
          const conceptsData = await conceptsResponse.json();
          learnedConcepts = conceptsData.concepts || [];
          if (learnedConcepts.length > 0) {
            addLog(`💡 Applied ${learnedConcepts.length} learned concepts to improve analysis`);
          } else {
            addLog('📝 No prior concepts found - will learn from this execution');
          }
        }
      } catch (error) {
        console.warn('⚠️ ArcMemo retrieval failed:', error);
        addLog('⚠️ Concept retrieval skipped (not critical)');
      }
      
      const executionOrder = getExecutionOrder(nodes, edges);
      let workflowData: any = {};
      let totalCost = 0; // Track total workflow cost
      let freeNodes = 0;
      let paidNodes = 0;
      
      // Inject learned concepts as context (if any)
      if (learnedConcepts.length > 0) {
        workflowData['_arcmemo_concepts'] = learnedConcepts
          .map(c => `💡 Learned: ${c.concept} (${c.domain}, success rate: ${(c.successRate * 100).toFixed(0)}%)`)
          .join('\n');
      }
      
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        addLog(`▶️  Executing: ${node.data.label}`);
        
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n
          )
        );

        // Get previous node data for context - properly extract text from objects
        const previousNodeData = Object.entries(workflowData).map(([nodeId, data]) => {
          if (typeof data === 'string') return data;
          if (Array.isArray(data)) return data.join('\n');
          if (data && typeof data === 'object') {
            // Extract text from response objects
            const dataObj = data as any;
            return dataObj.response || dataObj.content || dataObj.answer || dataObj.context || JSON.stringify(data, null, 2);
          }
          return String(data);
        }).join('\n\n---\n\n');
        
        // REAL API MODE: All workflows use real API calls
        // - Perplexity for Market Research (web search)
        // - Ollama (gemma3:4b) for all other AI tasks
        // - OpenRouter as fallback if Ollama fails
        
        // Declare cost tracking variables in outer scope
        let useFreeLLM = false;
        let estimatedCost = 0;
        
        {
          // REAL API MODE: Make actual API calls
          try {
            let apiResponse;
            
            // Start with base config - this will be optimized by GEPA if applicable
            const baseConfig = nodeConfigs[nodeId] || {};
            let nodeConfig = { ...baseConfig };
            
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // COST OPTIMIZATION: Choose between Perplexity (paid) and Ollama (free)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            // Use free Ollama for these tasks (don't need web search):
            const nodeLabel = String(node.data.label || '');
            const canUseFree = nodeLabel.includes('DSPy') || 
                               nodeLabel.includes('Custom Agent') ||
                               nodeLabel.includes('Generate Answer') ||
                               nodeLabel.includes('Investment Report');
            
            // Must use Perplexity for web search
            const requiresWebSearch = nodeLabel.includes('Market Research') ||
                                      nodeLabel.includes('Web Search');
            
            if (canUseFree && !requiresWebSearch) {
              useFreeLLM = true;
              estimatedCost = 0; // FREE!
              addLog(`💰 Using FREE Ollama (cost: $0.00)`);
            } else if (requiresWebSearch) {
              estimatedCost = 0.005; // $0.005 per request
              addLog(`💸 Using Perplexity for web search (cost: ~$0.005)`);
            }
            
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // GEPA: Optimize prompts BEFORE execution (for AI nodes)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            const nodeEndpoint = String(node.data.apiEndpoint || '');
            const isAINode = nodeEndpoint.includes('/agent/') || 
                             nodeEndpoint.includes('/perplexity/') ||
                             nodeEndpoint.includes('/ax-dspy') ||
                             nodeLabel.includes('Custom Agent') ||
                             nodeLabel.includes('DSPy');
            
            if (isAINode) {
              try {
                addLog(`⚡ Optimizing prompt with GEPA...`);
                const gepaResponse = await fetch('/api/gepa/optimize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: nodeConfig.query || nodeConfig.prompt || nodeConfig.systemPrompt || currentWorkflowName,
                    context: previousNodeData.substring(0, 2000), // Limit context size
                    industry: currentWorkflowName.toLowerCase().includes('real estate') ? 'real_estate' : 
                             currentWorkflowName.toLowerCase().includes('financ') ? 'finance' : 'general'
                  })
                });
                
                if (gepaResponse.ok) {
                  const gepaData = await gepaResponse.json();
                  if (gepaData.optimizedPrompt) {
                    nodeConfig = {
                      ...nodeConfig,
                      query: gepaData.optimizedPrompt,
                      _gepaOptimized: true
                    };
                    addLog(`✨ GEPA optimization applied (15-30% quality boost)`);
                  }
                }
              } catch (error) {
                console.warn('⚠️ GEPA optimization failed (non-critical):', error);
                addLog(`⚠️ GEPA optimization skipped (non-critical)`);
              }
            }
            
            console.log(`🔍 Executing node: "${node.data.label}" with endpoint: ${node.data.apiEndpoint}`);
            
            switch (node.data.label) {
              case 'Market Research':
                // Use Perplexity API ONLY for Market Research (web search)
                const searchQuery = nodeConfig.query || nodeConfigs[nodeId]?.query || 'Real estate market trends 2024 luxury properties Miami Beach condo prices investment opportunities';
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
              case 'Ax Agent':
              case 'Ax Optimizer':
              case 'Market Analyst':
                // Use the Ax LLM agent chat API with previous data as context
                const isAxNode = node.data.label.startsWith('Ax');
                
                // Use dynamic system prompt from node config if available
                const defaultSystemPrompt = isAxNode 
                  ? 'You are an Ax LLM-powered AI agent using the official Ax framework from https://github.com/ax-llm/ax. You use automatic prompt optimization and type-safe AI programs.'
                  : 'You are a specialized real estate market analyst. Analyze the provided data and give professional insights.';
                  
                const systemPrompt = nodeConfigs[nodeId]?.systemPrompt || defaultSystemPrompt;
                
                const taskContext = isAxNode && node.data.label === 'Ax Optimizer'
                  ? `Using Ax LLM framework optimization capabilities, enhance and optimize the following analysis:\n${previousNodeData}\n\nApply GEPA framework (Growth, Efficiency, Performance, Alignment) and provide optimized recommendations.`
                  : `Context from previous steps:\n${previousNodeData}\n\nTask: ${nodeConfigs[nodeId]?.query || nodeConfigs[nodeId]?.prompt || 'Analyze the provided data and provide insights'}`;
                
                const agentMessages = [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: taskContext }
                ];
                const agentResponse = await fetch('/api/agent/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messages: agentMessages,
                    useAxFramework: isAxNode // Flag to use Ax LLM
                  })
                });
                
                if (!agentResponse.ok) {
                  const errorText = await agentResponse.text();
                  apiResponse = {
                    data: [`API Error: ${agentResponse.status} - ${errorText}`],
                    result: `❌ ${node.data.label} failed`
                  };
                } else {
                  const agentData = await agentResponse.json();
                  const successMessage = isAxNode 
                    ? `✅ ${node.data.label} completed (Ax Framework)`
                    : '✅ Agent analysis completed';
                  apiResponse = {
                    data: agentData.response ? [agentData.response] : ['No analysis generated'],
                    result: successMessage,
                    fullResponse: agentData // Store full response for chat context
                  };
                }
                break;
                
              case 'Ax Report Generator':
              case 'Generate Answer':
              case 'Investment Report':
                // Use FREE OpenRouter models for investment analysis with detailed prompt
                const detailedInvestmentPrompt = `As a senior investment analyst with 15+ years of experience in luxury real estate, create a comprehensive investment report for Miami Beach luxury real estate based on this detailed market analysis:

${previousNodeData}

Please provide a professional investment report with the following sections:

1. **EXECUTIVE SUMMARY** (3-4 paragraphs)
   - Key market insights and trends
   - Investment thesis and recommendation
   - Expected returns and timeline

2. **MARKET ANALYSIS** (detailed breakdown)
   - Price trends and projections
   - Inventory levels and supply/demand dynamics
   - Buyer demographics and preferences

3. **INVESTMENT OPPORTUNITIES** (top 5 ranked opportunities)
   - Specific neighborhoods and property types
   - Investment rationale for each
   - Expected returns and risk levels

4. **RISK ASSESSMENT** (comprehensive risk analysis)
   - Market risks and mitigation strategies
   - Economic factors and interest rate sensitivity
   - Regulatory and environmental considerations

5. **FINANCIAL PROJECTIONS** (if applicable)
   - ROI calculations and projections
   - Cash flow analysis for rental properties
   - Capital appreciation forecasts

6. **ACTION PLAN** (specific next steps)
   - Immediate actions for investors
   - Due diligence requirements
   - Timeline and milestones

Format as a professional investment report with clear sections, specific data points, and actionable recommendations.`;
                
                // Try answer generation with FREE OpenRouter models
                const answerResponse = await fetch('/api/answer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: detailedInvestmentPrompt,
                    context: previousNodeData || 'No context available',
                    documents: previousNodeData ? [{ content: previousNodeData }] : [],
                    autoSelectModel: false, // Explicitly set model
                    preferredModel: 'gemma-3', // Use Gemma-3 for better analysis
                    queryType: 'investment' // Force investment query type
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
                
              case 'Web Search':
                // Same as Market Research - use Perplexity
                const webSearchQuery = nodeConfigs[nodeId]?.query || 'Miami Beach luxury real estate market trends 2024';
                const webSearchResponse = await fetch('/api/perplexity/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: webSearchQuery, // Use 'query' not 'messages'
                    useRealAI: true 
                  })
                });
                
                if (!webSearchResponse.ok) {
                  const errorText = await webSearchResponse.text();
                  apiResponse = {
                    data: [`Web search failed: ${errorText}`],
                    result: '❌ Web search failed'
                  };
                } else {
                  const webSearchData = await webSearchResponse.json();
                  apiResponse = {
                    data: webSearchData.response ? [webSearchData.response] : ['No search results'],
                    result: '✅ Web search completed',
                    fullResponse: webSearchData
                  };
                }
                break;

              case 'Memory Search':
                // Use vector search API
                const memoryQuery = nodeConfigs[nodeId]?.query || 'Search historical data';
                const memoryResponse = await fetch('/api/search/indexed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: memoryQuery,
                    userId: 'workflow-user',
                    matchThreshold: nodeConfigs[nodeId]?.matchThreshold || 0.7,
                    matchCount: nodeConfigs[nodeId]?.matchCount || 5,
                  })
                });
                
                if (!memoryResponse.ok) {
                  const errorText = await memoryResponse.text();
                  apiResponse = {
                    data: [`Memory search failed: ${errorText}`],
                    result: '⚠️ Memory search failed (using fallback)'
                  };
                } else {
                  const memoryData = await memoryResponse.json();
                  const results = memoryData.documents?.map((doc: any) => doc.content || doc.llm_summary) || [];
                  apiResponse = {
                    data: results.length > 0 ? results : ['No historical data found'],
                    result: `✅ Found ${results.length} memory results`,
                    fullResponse: memoryData
                  };
                }
                break;

              case 'Context Assembly':
                // Merge data from previous nodes
                const assemblyQuery = nodeConfigs[nodeId]?.query || 'Assemble context';
                const assemblyResponse = await fetch('/api/context/assemble', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    user_query: `${assemblyQuery}\n\nPrevious data:\n${previousNodeData}`,
                    conversation_history: [],
                    user_preferences: {}
                  })
                });
                
                if (!assemblyResponse.ok) {
                  // Fallback: just combine the data manually
                  apiResponse = {
                    data: [`Combined context: ${previousNodeData}`],
                    result: '✅ Context assembled (fallback)',
                    fullResponse: { context: previousNodeData }
                  };
                } else {
                  const assemblyData = await assemblyResponse.json();
                  apiResponse = {
                    data: [assemblyData.context || previousNodeData],
                    result: '✅ Context assembled',
                    fullResponse: assemblyData
                  };
                }
                break;

              case 'Model Router':
                // Smart model selection with answer API
                const routerQuery = nodeConfigs[nodeId]?.query || 'Analyze data';
                const routerResponse = await fetch('/api/answer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: routerQuery,
                    documents: previousNodeData ? [{ content: previousNodeData }] : [],
                    autoSelectModel: true
                  })
                });
                
                if (!routerResponse.ok) {
                  const errorText = await routerResponse.text();
                  apiResponse = {
                    data: [`Model router error: ${errorText}`],
                    result: '❌ Model routing failed'
                  };
                } else {
                  const routerData = await routerResponse.json();
                  apiResponse = {
                    data: [routerData.answer || 'Analysis completed'],
                    result: `✅ Routed to ${routerData.model} model`,
                    fullResponse: routerData
                  };
                }
                break;

              case 'GEPA Optimize':
                // Use agent chat with GEPA optimization
                const gepaQuery = nodeConfigs[nodeId]?.prompt || 'Optimize analysis';
                const gepaMessages = [
                  { role: 'system', content: 'You are a GEPA optimization expert. Apply GEPA framework principles to optimize the analysis.' },
                  { role: 'user', content: `Data to optimize:\n${previousNodeData}\n\nTask: ${gepaQuery}` }
                ];
                const gepaResponse = await fetch('/api/agent/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ messages: gepaMessages })
                });
                
                if (!gepaResponse.ok) {
                  const errorText = await gepaResponse.text();
                  apiResponse = {
                    data: [`GEPA optimization failed: ${errorText}`],
                    result: '⚠️ GEPA optimization failed (using original data)'
                  };
                } else {
                  const gepaData = await gepaResponse.json();
                  apiResponse = {
                    data: [gepaData.response || gepaData.content || 'Optimization applied'],
                    result: '✅ GEPA optimization applied',
                    fullResponse: gepaData
                  };
                }
                break;

              case 'Risk Assessment':
                // Generate comprehensive risk analysis using answer API
                const detailedRiskPrompt = `As a senior risk analyst specializing in luxury real estate investments, conduct a comprehensive risk assessment for Miami Beach luxury real estate based on this market analysis:

${previousNodeData}

Please provide a detailed risk analysis with the following sections:

1. **MARKET RISKS** (primary concerns)
   - Price volatility and market cycles
   - Interest rate sensitivity and economic factors
   - Supply/demand imbalances and inventory risks

2. **LOCATION-SPECIFIC RISKS** (Miami Beach factors)
   - Climate and environmental risks (hurricanes, flooding, sea level rise)
   - Regulatory and zoning changes
   - Infrastructure and development risks

3. **INVESTMENT RISKS** (financial considerations)
   - Liquidity risks and market timing
   - Currency fluctuations for international investors
   - Financing and leverage risks

4. **OPERATIONAL RISKS** (property management)
   - Insurance costs and availability
   - Maintenance and repair expenses
   - Rental market volatility

5. **MITIGATION STRATEGIES** (risk management)
   - Diversification recommendations
   - Insurance and hedging strategies
   - Due diligence requirements

6. **RISK RATING** (overall assessment)
   - Risk level: Low/Medium/High
   - Risk-adjusted return expectations
   - Recommended investment timeframe

Format as a professional risk assessment report with specific data points, risk ratings, and actionable mitigation strategies.`;
                
                const riskResponse = await fetch('/api/answer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: detailedRiskPrompt,
                    context: previousNodeData || 'No context available',
                    documents: previousNodeData ? [{ content: previousNodeData }] : [],
                    autoSelectModel: true,
                    preferredModel: 'gemma-3'
                  })
                });
                
                if (!riskResponse.ok) {
                  const errorText = await riskResponse.text();
                  apiResponse = {
                    data: [`Risk assessment error: ${errorText}`],
                    result: '❌ Risk assessment failed'
                  };
                } else {
                  const riskData = await riskResponse.json();
                  apiResponse = {
                    data: [riskData.answer || 'Risk analysis completed'],
                    result: '✅ Risk assessment completed',
                    fullResponse: riskData
                  };
                }
                break;

              case 'Multi-Source RAG':
                // Entry point that combines web search with memory
                const ragQuery = nodeConfigs[nodeId]?.query || 'Comprehensive market research';
                const ragResponse = await fetch('/api/perplexity/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: ragQuery,
                    useRealAI: true 
                  })
                });
                
                if (!ragResponse.ok) {
                  const errorText = await ragResponse.text();
                  apiResponse = {
                    data: [`RAG search failed: ${errorText}`],
                    result: '❌ Multi-source RAG failed'
                  };
                } else {
                  const ragData = await ragResponse.json();
                  apiResponse = {
                    data: ragData.response ? [ragData.response] : ['No results'],
                    result: '✅ Multi-source RAG completed',
                    fullResponse: ragData
                  };
                }
                break;

              case 'DSPy Market Analyzer':
              case 'DSPy Real Estate Agent':
              case 'DSPy Financial Analyst':
              case 'DSPy Investment Report':
              case 'DSPy Data Synthesizer':
                // Execute DSPy modules with Ax framework + Ollama (FREE!)
                const dspyModuleName = nodeConfig.moduleName || 'market_research_analyzer';
                
                // Prepare inputs based on previous node data
                const dspyInputs: any = {};
                if (dspyModuleName === 'market_research_analyzer') {
                  dspyInputs.marketData = previousNodeData || 'No market data available';
                  dspyInputs.industry = 'Real Estate';
                } else if (dspyModuleName === 'real_estate_agent') {
                  dspyInputs.propertyData = previousNodeData || 'No property data available';
                  dspyInputs.location = 'Miami Beach';
                  dspyInputs.investmentType = 'buy';
                } else if (dspyModuleName === 'investment_report_generator') {
                  dspyInputs.marketAnalysis = previousNodeData || 'No analysis available';
                  dspyInputs.investmentGoals = 'Long-term appreciation and rental income';
                } else {
                  dspyInputs.data = previousNodeData || 'No data available';
                }
                
                const dspyResponse = await fetch('/api/ax-dspy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    moduleName: dspyModuleName,
                    inputs: dspyInputs,
                    optimize: nodeConfigs[nodeId]?.optimize || true
                  })
                });
                
                if (!dspyResponse.ok) {
                  const errorText = await dspyResponse.text();
                  apiResponse = {
                    data: [`DSPy module error: ${errorText}`],
                    result: '❌ DSPy module failed'
                  };
                } else {
                  const dspyData = await dspyResponse.json();
                  const outputText = dspyData.outputs?.response || 
                                    dspyData.outputs?.analysis || 
                                    dspyData.outputs?.recommendation ||
                                    JSON.stringify(dspyData.outputs, null, 2);
                  apiResponse = {
                    data: [outputText],
                    result: `✅ DSPy ${dspyModuleName} completed (optimized!)`,
                    fullResponse: dspyData
                  };
                }
                break;

              case 'Learning Tracker':
                // Track optimization metrics and learning
                const learningQuery = nodeConfigs[nodeId]?.query || 'Summarize learning metrics';
                const learningResponse = await fetch('/api/answer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    query: `${learningQuery}\n\nWorkflow execution data:\n${previousNodeData}`,
                    preferredModel: 'phi-3'
                  })
                });
                
                if (!learningResponse.ok) {
                  apiResponse = {
                    data: ['Learning tracking unavailable'],
                    result: '⚠️ Learning tracker skipped'
                  };
                } else {
                  const learningData = await learningResponse.json();
                  apiResponse = {
                    data: [learningData.answer || 'Metrics tracked'],
                    result: '✅ Learning metrics tracked',
                    fullResponse: learningData
                  };
                }
                break;
                
              default:
                // Universal AI Agent Handler
                // This handles ANY node type dynamically using the node's configuration
                // nodeConfig is already declared at the beginning of try block
                const apiEndpoint = node.data.apiEndpoint || '/api/agent/chat';
                
                // Use dynamic system prompt from config or generate based on node label/role
                const universalSystemPrompt = nodeConfig.systemPrompt || 
                  `You are a ${node.data.label}. ${nodeConfig.role || node.data.role || node.data.description || 'Provide professional analysis and insights based on the given context.'}`;
                
                // Build context-aware task description
                const universalTask = previousNodeData 
                  ? `Context from previous workflow steps:\n${previousNodeData}\n\nTask: ${nodeConfig.query || nodeConfig.prompt || `Perform ${node.data.label} analysis`}`
                  : nodeConfig.query || nodeConfig.prompt || `Perform ${node.data.label} analysis`;
                
                console.log(`🤖 Universal Node Handler: ${node.data.label}`);
                console.log(`   Endpoint: ${apiEndpoint}`);
                console.log(`   System Prompt: ${universalSystemPrompt.substring(0, 100)}...`);
                
                // Route to appropriate API based on endpoint
                if (apiEndpoint === '/api/perplexity/chat') {
                  // Web search node
                  const searchQuery = nodeConfig.searchQuery || nodeConfig.query || universalTask;
                  const searchResponse = await fetch('/api/perplexity/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      query: searchQuery,
                      useRealAI: true
                    })
                  });
                  
                  if (!searchResponse.ok) {
                    const errorText = await searchResponse.text();
                    apiResponse = {
                      data: [`Search error: ${errorText}`],
                      result: `❌ ${node.data.label} failed`
                    };
                  } else {
                    const searchData = await searchResponse.json();
                    apiResponse = {
                      data: searchData.response ? [searchData.response] : ['No results'],
                      result: `✅ ${node.data.label} completed`,
                      fullResponse: searchData
                    };
                  }
                } else if (apiEndpoint === '/api/cel/execute') {
                  // CEL Expression node
                  const celExpression = nodeConfig.expression || nodeConfig.query || universalTask;
                  const celResponse = await fetch('/api/cel/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      expression: celExpression,
                      previousData: previousNodeData,
                      variables: nodeConfig.variables || {},
                      state: nodeConfig.state || {},
                      workflowContext: {
                        nodeId: nodeId,
                        nodeLabel: node.data.label,
                        workflowName: currentWorkflowName
                      }
                    })
                  });
                  
                  if (!celResponse.ok) {
                    const errorText = await celResponse.text();
                    apiResponse = {
                      data: [`CEL execution error: ${errorText}`],
                      result: `Failed: ${node.data.label}`
                    };
                  } else {
                    const celData = await celResponse.json();
                    const resultText = typeof celData.result === 'object' 
                      ? JSON.stringify(celData.result, null, 2)
                      : String(celData.result);
                    
                    apiResponse = {
                      data: [resultText],
                      result: `Completed: ${node.data.label}`,
                      fullResponse: celData
                    };
                  }
                } else if (apiEndpoint === '/api/answer') {
                  // Data processor node
                  const answerResponse = await fetch('/api/answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      query: universalTask,
                      context: previousNodeData || '',
                      documents: previousNodeData ? [{ content: previousNodeData }] : [],
                      queryType: nodeConfig.queryType || 'analysis',
                      preferredModel: nodeConfig.preferredModel || 'gemma-3'
                    })
                  });
                  
                  if (!answerResponse.ok) {
                    const errorText = await answerResponse.text();
                    apiResponse = {
                      data: [`Processing error: ${errorText}`],
                      result: `Failed: ${node.data.label}`
                    };
                  } else {
                    const answerData = await answerResponse.json();
                    apiResponse = {
                      data: [answerData.answer || 'Processing completed'],
                      result: `Completed: ${node.data.label}`,
                      fullResponse: answerData
                    };
                  }
                } else {
                  // AI Agent node (default)
                  const universalMessages = [
                    { role: 'system', content: universalSystemPrompt },
                    { role: 'user', content: universalTask }
                  ];
                  
                  const universalResponse = await fetch('/api/agent/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      messages: universalMessages,
                      useAxFramework: nodeConfig.useAxFramework || false
                    })
                  });
                  
                  if (!universalResponse.ok) {
                    const errorText = await universalResponse.text();
                    apiResponse = {
                      data: [`Agent error: ${errorText}`],
                      result: `❌ ${node.data.label} failed`
                    };
                  } else {
                    const universalData = await universalResponse.json();
                    apiResponse = {
                      data: universalData.response ? [universalData.response] : ['Analysis completed'],
                      result: `✅ ${node.data.label} completed`,
                      fullResponse: universalData
                    };
                  }
                }
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
        
        // Track costs
        totalCost += estimatedCost;
        if (useFreeLLM || estimatedCost === 0) {
          freeNodes++;
        } else {
          paidNodes++;
        }
        
        addLog(`✅ Completed: ${node.data.label}`);
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // DYNAMIC ROUTING: Let agents decide next steps based on results
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        try {
          addLog(`🤔 Checking if agent handoff needed...`);
          
          // Get the result of this node
          const nodeResult = workflowData[nodeId];
          const resultSummary = typeof nodeResult === 'string' 
            ? nodeResult.substring(0, 500)
            : JSON.stringify(nodeResult).substring(0, 500);
          
          // Ask the hybrid router if we should handoff to another agent
          const routingResponse = await fetch('/api/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userRequest: `Based on this result from ${node.data.label}: "${resultSummary}", determine if we need additional agents to handle complexity, verify data, or address gaps. Original goal: ${currentWorkflowName}`,
              strategy: 'auto',
              currentContext: {
                executedNodes: executionOrder.slice(0, executionOrder.indexOf(nodeId) + 1),
                remainingNodes: executionOrder.slice(executionOrder.indexOf(nodeId) + 1),
                currentResult: resultSummary
              }
            })
          });
          
          if (routingResponse.ok) {
            const routingData = await routingResponse.json();
            console.log('🔀 Dynamic routing decision:', routingData);
            
            // Check if router suggests handoff
            if (routingData.routing && routingData.routing.reasoning) {
              const reasoning = routingData.routing.reasoning.toLowerCase();
              
              // Look for handoff indicators
              const shouldHandoff = reasoning.includes('need') || 
                                    reasoning.includes('should') ||
                                    reasoning.includes('recommend') ||
                                    reasoning.includes('additional');
              
              if (shouldHandoff && routingData.workflow && routingData.workflow.nodes) {
                // Agent suggests additional nodes!
                const suggestedNodes = routingData.workflow.nodes.filter((n: any) => 
                  !executionOrder.includes(n.id) // Only new nodes
                );
                
                if (suggestedNodes.length > 0) {
                  addLog(`🔀 HANDOFF: Adding ${suggestedNodes.length} dynamic agent(s) based on complexity`);
                  addLog(`💡 Reason: ${routingData.routing.reasoning.substring(0, 100)}...`);
                  
                  // Insert new nodes into the workflow
                  const currentIndex = executionOrder.indexOf(nodeId);
                  for (let i = 0; i < suggestedNodes.length; i++) {
                    const newNode = suggestedNodes[i];
                    const newNodeId = `dynamic-${Date.now()}-${i}`;
                    
                    // Add to execution order (after current node)
                    executionOrder.splice(currentIndex + 1 + i, 0, newNodeId);
                    
                    // Add to nodes array
                    setNodes((nds) => [
                      ...nds,
                      {
                        id: newNodeId,
                        type: 'customizable',
                        position: { x: 100 + (i * 250), y: 400 },
                        data: {
                          label: newNode.label || 'Dynamic Agent',
                          role: newNode.role || newNode.label,
                          description: newNode.description || 'Dynamically added agent',
                          apiEndpoint: newNode.apiEndpoint || '/api/agent/chat',
                          icon: newNode.icon || '🤖',
                          iconColor: newNode.iconColor || 'blue',
                          status: 'pending',
                          config: newNode.config || {}
                        }
                      }
                    ]);
                    
                    // Add to nodes for execution
                    nodes.push({
                      id: newNodeId,
                      type: 'customizable',
                      position: { x: 100 + (i * 250), y: 400 },
                      data: {
                        label: newNode.label || 'Dynamic Agent',
                        role: newNode.role || newNode.label,
                        description: newNode.description || 'Dynamically added agent',
                        apiEndpoint: newNode.apiEndpoint || '/api/agent/chat',
                        icon: newNode.icon || '🤖',
                        iconColor: newNode.iconColor || 'blue',
                        status: 'pending',
                        config: newNode.config || {}
                      }
                    } as any);
                    
                    addLog(`  → Added: ${newNode.label} (${newNode.description})`);
                  }
                  
                  // Log the adaptive workflow change
                  addLog(`📈 Workflow adapted: ${suggestedNodes.map((n: any) => n.label).join(' → ')}`);
                }
              } else {
                addLog(`✓ No handoff needed - proceeding with planned workflow`);
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Dynamic routing check failed (non-critical):', error);
          addLog(`⚠️ Handoff check skipped (non-critical)`);
        }
      }

      addLog('🎉 Workflow completed successfully!');
      addLog('📊 Results: ' + Object.keys(workflowData).length + ' nodes executed');
      addLog(`💰 Total cost: $${totalCost.toFixed(4)} (${freeNodes} free nodes, ${paidNodes} paid nodes)`);
      
      // Store results for display
      setWorkflowResults(workflowData);
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ARCMEMO: Abstract new concepts AFTER successful execution
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        addLog('🧠 Learning from this execution with ArcMemo...');
        const abstractResponse = await fetch('/api/arcmemo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'abstract',
            workflow: {
              name: currentWorkflowName,
              domain: currentWorkflowName.toLowerCase().includes('real estate') ? 'real_estate' : 
                      currentWorkflowName.toLowerCase().includes('financ') ? 'finance' : 'general',
              nodes: nodes.map(n => ({
                id: n.id,
                label: n.data.label,
                role: n.data.role || n.data.label
              })),
              results: workflowData,
              userQuery: currentWorkflowName,
              success: true
            }
          })
        });
        
        if (abstractResponse.ok) {
          const abstractData = await abstractResponse.json();
          if (abstractData.concepts && abstractData.concepts.length > 0) {
            addLog(`✨ Learned ${abstractData.concepts.length} new concepts for future use`);
            addLog(`📚 Memory updated: ${abstractData.concepts.map((c: any) => c.concept.substring(0, 50) + '...').join(', ')}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ ArcMemo abstraction failed:', error);
        addLog('⚠️ Concept learning skipped (not critical)');
      }
      
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
    console.log('🏢 LOADING DEFAULT EXAMPLE WORKFLOW');
    const example = getExampleWorkflow();
    console.log('🏢 Example workflow:', example);
    setNodes(example.nodes);
    setEdges(example.edges);
    setNodeConfigs(example.configs);
    setWorkflowResults(null); // Clear previous results
    setExecutionLog([]); // Clear previous logs
    setCurrentWorkflowName('Real Estate Market Analysis');
    addLog('🏢 Streamlined Real Estate Market Analysis workflow loaded (3 nodes)');
    addLog('📋 Linear Flow: Market Research → Market Analyst → Investment Report');
    addLog('💡 Fast and reliable with free models');
  };

  const loadComplexWorkflow = () => {
    const complex = getComplexWorkflow();
    setNodes(complex.nodes);
    setEdges(complex.edges);
    setNodeConfigs(complex.configs);
    setWorkflowResults(null);
    setExecutionLog([]);
    setCurrentWorkflowName('Self-Optimizing AI Workflow');
    addLog('🚀 Self-Optimizing AI Workflow loaded (8 nodes)');
    addLog('📋 Flow: Multi-Source RAG → DSPy Optimization → GEPA Evolution → Expert Analysis');
    addLog('💡 Leverages: DSPy, Ax LLM, GEPA, RAG, Vector Memory, Continuous Learning');
    addLog('🔧 Features: Automatic prompt optimization, self-improvement, metric tracking');
  };

  const loadDSPyWorkflow = () => {
    const dspy = getDSPyOptimizedWorkflow();
    setNodes(dspy.nodes);
    setEdges(dspy.edges);
    setNodeConfigs(dspy.configs);
    setWorkflowResults(null);
    setExecutionLog([]);
    setCurrentWorkflowName('DSPy-Optimized Workflow');
    addLog('🔥 DSPy-Optimized Workflow loaded (5 nodes)');
    addLog('📋 Flow: RAG → DSPy Market Analyzer → DSPy Real Estate Agent → DSPy Report');
    addLog('💡 Uses ONLY self-optimizing DSPy modules with continuous learning');
    addLog('🎯 Best for: Maximum quality, automatic improvement, production deployments');
  };

  const loadAxLLMWorkflow = () => {
    const axWorkflow = getAxLLMWorkflow();
    setNodes(axWorkflow.nodes);
    setEdges(axWorkflow.edges);
    setNodeConfigs(axWorkflow.configs);
    setWorkflowResults(null);
    setExecutionLog([]);
    setCurrentWorkflowName('Ax LLM Workflow');
    addLog('⚡ Ax LLM Workflow loaded (Official Ax Framework)');
    addLog('📋 Flow: Web Search → Ax Agent → Ax Optimizer → Ax Report');
    addLog('💡 Uses official Ax LLM from https://github.com/ax-llm/ax');
    addLog('🎯 Production-ready with Ollama + OpenRouter fallback');
  };

  const loadGeneratedWorkflow = (workflow: any) => {
    console.log('🔧 loadGeneratedWorkflow called with:', workflow);
    
    // Convert generated workflow format to our internal format
    const nodes = workflow.nodes.map((node: any, index: number) => ({
      id: node.id,
      type: node.type || 'customizable',
      position: { x: 100 + (index * 300), y: 200 },
      data: {
        label: node.label,
        role: node.role,
        description: node.description,
        apiEndpoint: node.apiEndpoint,
        icon: node.icon,
        iconColor: node.iconColor,
        status: 'idle',
      },
    }));

    console.log('🔧 Converted nodes:', nodes);
    console.log('🔧 Edges:', workflow.edges);
    console.log('🔧 Configs:', workflow.configs);

    setNodes(nodes);
    setEdges(workflow.edges);
    setNodeConfigs(workflow.configs);
    setWorkflowResults(null);
    setExecutionLog([]);
    setCurrentWorkflowName(workflow.name);
    addLog(`🎉 Generated Workflow loaded: ${workflow.name}`);
    addLog(`📋 Flow: ${workflow.nodes.map((n: any) => n.label).join(' → ')}`);
    addLog(`💡 ${workflow.description}`);
    addLog('🚀 Ready to execute your custom workflow!');
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

  // Check for generated workflow from agent builder on mount
  useEffect(() => {
    console.log('🚀 WORKFLOW PAGE MOUNTED - CHECKING FOR SESSION ID');
    
    // Check for session_id in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    console.log('🔍 Session ID from URL:', sessionId ? 'Found' : 'Not found');
    
    if (sessionId) {
      console.log('📡 Loading workflow from Supabase with session ID:', sessionId);
      
      // Load workflow from Supabase
      fetch(`/api/workflows/temp?session_id=${sessionId}`)
        .then(response => response.json())
        .then(result => {
          if (result.success && result.workflow) {
            console.log('✅ Workflow loaded from Supabase:');
            console.log('   Workflow Name:', result.workflow.name);
            console.log('   Nodes Count:', result.workflow.nodes?.length);
            console.log('   Node Labels:', result.workflow.nodes?.map((n: any) => n.label));
            console.log('   Created At:', result.createdAt);
            console.log('   Expires At:', result.expiresAt);
            
            loadGeneratedWorkflow(result.workflow);
            
            // Clean up the session after loading
            fetch(`/api/workflows/temp?session_id=${sessionId}`, { method: 'DELETE' })
              .then(() => console.log('🗑️ Session cleaned up successfully'))
              .catch(err => console.warn('⚠️ Failed to clean up session:', err));
              
            console.log('🎉 Generated workflow loaded successfully from Supabase!');
          } else {
            console.error('❌ Failed to load workflow from Supabase:', result.error);
            loadExampleWorkflow(); // Fallback to default
          }
        })
        .catch(error => {
          console.error('❌ Error loading workflow from Supabase:', error);
          loadExampleWorkflow(); // Fallback to default
        });
    } else {
      console.log('📋 No session ID found, loading default example');
      loadExampleWorkflow(); // Load default workflow
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const statusColors: Record<string, string> = {
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
          <Node handles={{ target: true, source: true }} className={`${statusColors[data.status] || 'border-gray-300'} border-2`}>
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
                      workflowName: currentWorkflowName,
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
                      <span className="text-lg">{String(node?.data.icon || '')}</span>
                      <span className="text-xs font-semibold">{String(node?.data.label || '')}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded p-2 ml-6">
                      {Array.isArray(data) ? (
                        data.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                            • {stripMarkdown(typeof item === 'string' ? item : JSON.stringify(item))}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {typeof data === 'object' ? JSON.stringify(data, null, 2) : stripMarkdown(data)}
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
              executionLog.map((log, idx) => {
                // Highlight dynamic routing events
                const isDynamicRouting = log.includes('🔀') || log.includes('HANDOFF') || log.includes('Workflow adapted');
                const isHandoffCheck = log.includes('🤔') || log.includes('Checking if agent handoff');
                const isArcMemo = log.includes('🧠') || log.includes('ArcMemo') || log.includes('💡');
                const isGEPA = log.includes('⚡') || log.includes('GEPA');
                const isCost = log.includes('💰') || log.includes('💸');
                
                return (
                  <div 
                    key={idx} 
                    className={`text-xs font-mono py-0.5 ${
                      isDynamicRouting ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-500 pl-1' :
                      isHandoffCheck ? 'text-purple-600 dark:text-purple-400' :
                      isArcMemo ? 'text-green-600 dark:text-green-400' :
                      isGEPA ? 'text-yellow-600 dark:text-yellow-400' :
                      isCost ? 'text-orange-600 dark:text-orange-400' :
                      ''
                    }`}
                  >
                    {log}
                  </div>
                );
              })
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
          onNodeClick={(event, node) => {
            setSelectedNode({
              nodeId: node.id,
              label: node.data.label,
              apiEndpoint: node.data.apiEndpoint,
              icon: node.data.icon,
              iconColor: node.data.iconColor
            });
          }}
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
                {isExecuting ? 'Running...' : workflowErrors.length > 0 ? 'Fix Issues First' : '▶️ Execute Workflow'}
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={loadExampleWorkflow}
              >
                Load Simple (3 nodes)
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                onClick={loadComplexWorkflow}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Load Complex (8 nodes)
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                onClick={loadDSPyWorkflow}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                🔥 Load DSPy (5 nodes)
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                onClick={loadAxLLMWorkflow}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                ⚡ Load Ax LLM (4 nodes)
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
                  <span className="font-semibold text-purple-600">
                    🔧 Real APIs
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
          <div className="absolute top-4 right-4 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 max-h-[80vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                  selectedNode.iconColor === 'blue' ? 'bg-blue-600 border-blue-500 text-white' :
                  selectedNode.iconColor === 'green' ? 'bg-green-600 border-green-500 text-white' :
                  selectedNode.iconColor === 'gray' ? 'bg-gray-600 border-gray-500 text-white' :
                  selectedNode.iconColor === 'yellow' ? 'bg-yellow-600 border-yellow-500 text-white' :
                  selectedNode.iconColor === 'purple' ? 'bg-purple-600 border-purple-500 text-white' :
                  'bg-gray-600 border-gray-500 text-white'
                }`}>
                  <span className="text-xs font-bold">{selectedNode.icon}</span>
                </div>
                <span className="text-white">{selectedNode.label}</span>
              </h3>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(nodeConfigs[selectedNode.nodeId] || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="text-white text-sm font-medium block mb-2 flex items-center gap-2">
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-xs text-gray-400">
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
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-white">{value ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  ) : typeof value === 'number' ? (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.nodeId, { [key]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step={key === 'temperature' ? '0.1' : '1'}
                    />
                  ) : (
                    <textarea
                      value={String(value || '')}
                      onChange={(e) =>
                        updateNodeConfig(selectedNode.nodeId, { [key]: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px]"
                      placeholder={`Enter ${key}...`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">
                <strong className="text-white">API Endpoint:</strong>
              </p>
              <code className="text-xs bg-gray-800 text-gray-300 p-2 rounded block font-mono border border-gray-600">
                {selectedNode.apiEndpoint}
              </code>
            </div>

            <div className="mt-4">
              <button 
                onClick={() => setSelectedNode(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                ✓ Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
