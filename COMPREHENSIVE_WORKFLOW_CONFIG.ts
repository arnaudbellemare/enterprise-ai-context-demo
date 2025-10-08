// ================================================================================================
// COMPREHENSIVE WORKFLOW - Uses ALL 8 Features
// ================================================================================================
// This workflow demonstrates the complete power of the AI system by using every feature:
// 1. Memory Search (Vector similarity search)
// 2. Web Search (Live Perplexity search)  
// 3. Context Assembly (Merge results)
// 4. Model Router (Select best AI model)
// 5. GEPA Optimize (Prompt evolution)
// 6. LangStruct (Extract structured data)
// 7. Custom Agent (Customizable task agent)
// 8. Generate Answer (Final AI response)
// ================================================================================================

export const getComprehensiveWorkflow = () => {
  const timestamp = Date.now();
  
  // COMPREHENSIVE WORKFLOW - Uses ALL 8 Features
  const nodes = [
    // 1. Memory Search (Vector similarity search)
    {
      id: `memorySearch-${timestamp}`,
      type: 'customizable',
      position: { x: 50, y: 100 },
      data: {
        id: 'memorySearch',
        label: 'Memory Search',
        description: 'Vector similarity search',
        icon: '🔍',
        iconColor: 'yellow',
        apiEndpoint: '/api/search/indexed',
        nodeId: `memorySearch-${timestamp}`,
        status: 'ready',
        config: {
          query: 'real estate market trends luxury properties investment opportunities',
          collection: 'Market Research',
          matchThreshold: 0.7,
          matchCount: 5,
        }
      },
    },
    // 2. Web Search (Live Perplexity search)
    {
      id: `webSearch-${timestamp}`,
      type: 'customizable',
      position: { x: 350, y: 100 },
      data: {
        id: 'webSearch',
        label: 'Web Search',
        description: 'Live Perplexity search',
        icon: '🌐',
        iconColor: 'blue',
        apiEndpoint: '/api/perplexity/chat',
        nodeId: `webSearch-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Real estate market trends 2024 luxury properties investment opportunities current market analysis',
          recencyFilter: 'month',
          maxResults: 8,
        }
      },
    },
    // 3. Context Assembly (Merge results)
    {
      id: `contextAssembly-${timestamp}`,
      type: 'customizable',
      position: { x: 650, y: 100 },
      data: {
        id: 'contextAssembly',
        label: 'Context Assembly',
        description: 'Merge results',
        icon: '📦',
        iconColor: 'purple',
        apiEndpoint: '/api/context/assemble',
        nodeId: `contextAssembly-${timestamp}`,
        status: 'ready',
        config: {
          user_query: 'Consolidate memory search and web search results for comprehensive market analysis',
          conversation_history: [],
          user_preferences: {
            analysis_depth: 'comprehensive',
            focus_areas: ['market_trends', 'investment_opportunities', 'risk_assessment']
          }
        }
      },
    },
    // 4. Model Router (Select best AI model)
    {
      id: `modelRouter-${timestamp}`,
      type: 'customizable',
      position: { x: 950, y: 100 },
      data: {
        id: 'modelRouter',
        label: 'Model Router',
        description: 'Select best AI model',
        icon: '🤖',
        iconColor: 'blue',
        apiEndpoint: '/api/answer',
        nodeId: `modelRouter-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Analyze the consolidated market data and select the most appropriate AI model for detailed analysis',
          autoSelectModel: true,
          preferredModel: 'claude-3-sonnet',
          documents: [],
        }
      },
    },
    // 5. GEPA Optimize (Prompt evolution)
    {
      id: `gepaOptimize-${timestamp}`,
      type: 'customizable',
      position: { x: 1250, y: 100 },
      data: {
        id: 'gepaOptimize',
        label: 'GEPA Optimize',
        description: 'Prompt evolution',
        icon: '⚡',
        iconColor: 'purple',
        apiEndpoint: '/api/agent/chat',
        nodeId: `gepaOptimize-${timestamp}`,
        status: 'ready',
        config: {
          taskDescription: 'Apply GEPA optimization to enhance the analysis prompt based on the consolidated data',
          systemPrompt: 'You are a GEPA optimization specialist. Analyze the provided market data and evolve the prompt to maximize analysis quality and insights generation.',
          temperature: 0.2,
          model: 'claude-3-sonnet',
          maxTokens: 1500,
        }
      },
    },
    // 6. LangStruct (Extract structured data)
    {
      id: `langStruct-${timestamp}`,
      type: 'customizable',
      position: { x: 1550, y: 100 },
      data: {
        id: 'langStruct',
        label: 'LangStruct',
        description: 'Extract structured data',
        icon: '🔍',
        iconColor: 'gray',
        apiEndpoint: '/api/answer',
        nodeId: `langStruct-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Extract structured data from the market analysis: property prices, market trends, investment metrics, risk factors, and recommendations',
          preferredModel: 'claude-3-sonnet',
          temperature: 0.1,
          maxTokens: 2000,
        }
      },
    },
    // 7. Custom Agent (Customizable task agent)
    {
      id: `customAgent-${timestamp}`,
      type: 'customizable',
      position: { x: 1850, y: 100 },
      data: {
        id: 'customAgent',
        label: 'Custom Agent',
        description: 'Customizable task agent',
        icon: '▶',
        iconColor: 'blue',
        apiEndpoint: '/api/agent/chat',
        nodeId: `customAgent-${timestamp}`,
        status: 'ready',
        config: {
          taskDescription: 'Act as a senior real estate investment advisor. Analyze all the processed data and provide comprehensive investment recommendations with specific actionable insights.',
          systemPrompt: 'You are a world-class real estate investment advisor with 20 years of experience. Based on the comprehensive market analysis, provide: 1) Executive summary, 2) Market assessment, 3) Investment opportunities ranked by ROI, 4) Risk analysis, 5) Specific recommendations with timelines and expected returns.',
          temperature: 0.3,
          model: 'claude-3-sonnet',
          maxTokens: 3000,
        }
      },
    },
    // 8. Generate Answer (Final AI response)
    {
      id: `generateAnswer-${timestamp}`,
      type: 'customizable',
      position: { x: 2150, y: 100 },
      data: {
        id: 'generateAnswer',
        label: 'Generate Answer',
        description: 'Final AI response',
        icon: '✅',
        iconColor: 'green',
        apiEndpoint: '/api/answer',
        nodeId: `generateAnswer-${timestamp}`,
        status: 'ready',
        config: {
          query: 'Generate the final comprehensive real estate investment report incorporating all analysis, structured data, and recommendations',
          preferredModel: 'claude-3-sonnet',
          temperature: 0.4,
          maxTokens: 4000,
        }
      },
    }
  ];

  const edges = [
    // Connect all 8 nodes in sequence
    {
      id: `edge-${timestamp}-1`,
      source: `memorySearch-${timestamp}`,
      target: `webSearch-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-2`,
      source: `webSearch-${timestamp}`,
      target: `contextAssembly-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-3`,
      source: `contextAssembly-${timestamp}`,
      target: `modelRouter-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-4`,
      source: `modelRouter-${timestamp}`,
      target: `gepaOptimize-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-5`,
      source: `gepaOptimize-${timestamp}`,
      target: `langStruct-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-6`,
      source: `langStruct-${timestamp}`,
      target: `customAgent-${timestamp}`,
      type: 'animated',
    },
    {
      id: `edge-${timestamp}-7`,
      source: `customAgent-${timestamp}`,
      target: `generateAnswer-${timestamp}`,
      type: 'animated',
    },
  ];

  const configs: Record<string, any> = {};
  nodes.forEach(node => {
    configs[node.id] = node.data.config;
  });

  return { nodes, edges, configs };
};

// ================================================================================================
// WORKFLOW FEATURES BREAKDOWN
// ================================================================================================

export const workflowFeatures = {
  memorySearch: {
    description: "Vector similarity search across your knowledge base",
    api: "/api/search/indexed",
    features: ["Vector embeddings", "Semantic search", "Metadata filtering", "Similarity scoring"],
    useCase: "Find relevant information from your stored data"
  },
  
  webSearch: {
    description: "Live internet search using Perplexity AI",
    api: "/api/perplexity/chat",
    features: ["Real-time data", "Source citations", "Recency filtering", "Multi-source aggregation"],
    useCase: "Get current market trends and live data"
  },
  
  contextAssembly: {
    description: "Intelligent merging of multiple data sources",
    api: "/api/context/assemble", 
    features: ["Multi-source consolidation", "Context prioritization", "Information synthesis", "Conflict resolution"],
    useCase: "Combine and organize information from different sources"
  },
  
  modelRouter: {
    description: "Smart selection of the best AI model for the task",
    api: "/api/answer",
    features: ["Auto-model selection", "Performance optimization", "Cost efficiency", "Task-specific routing"],
    useCase: "Choose the optimal AI model for your specific analysis"
  },
  
  gepaOptimize: {
    description: "Advanced prompt optimization using GEPA methodology",
    api: "/api/agent/chat",
    features: ["Prompt evolution", "Performance tracking", "Iterative improvement", "Reflective optimization"],
    useCase: "Continuously improve AI prompt effectiveness"
  },
  
  langStruct: {
    description: "Structured data extraction from unstructured text",
    api: "/api/answer",
    features: ["Schema extraction", "Data normalization", "Pattern recognition", "Structured output"],
    useCase: "Extract organized data from complex text analysis"
  },
  
  customAgent: {
    description: "Specialized AI agent with domain expertise",
    api: "/api/agent/chat",
    features: ["Domain specialization", "Custom instructions", "Context awareness", "Expert-level analysis"],
    useCase: "Get professional-grade analysis from specialized AI agents"
  },
  
  generateAnswer: {
    description: "Final synthesis and report generation",
    api: "/api/answer",
    features: ["Report formatting", "Executive summaries", "Actionable insights", "Professional output"],
    useCase: "Create comprehensive, professional reports and recommendations"
  }
};

// ================================================================================================
// INDUSTRY TEMPLATES
// ================================================================================================

export const industryTemplates = {
  realEstate: {
    name: "Real Estate Investment Analysis",
    description: "Comprehensive property market analysis and investment recommendations",
    nodes: [
      "Memory Search: Property database queries",
      "Web Search: Market trends and pricing",
      "Context Assembly: Combine market data",
      "Model Router: Select analysis model",
      "GEPA Optimize: Enhance property analysis prompts",
      "LangStruct: Extract pricing and metrics",
      "Custom Agent: Real estate investment advisor",
      "Generate Answer: Investment report"
    ]
  },
  
  healthcare: {
    name: "Medical Research & Analysis",
    description: "Healthcare data analysis and treatment recommendations",
    nodes: [
      "Memory Search: Medical literature database",
      "Web Search: Latest research and studies",
      "Context Assembly: Combine medical data",
      "Model Router: Select medical AI model",
      "GEPA Optimize: Enhance diagnostic prompts",
      "LangStruct: Extract medical metrics",
      "Custom Agent: Medical specialist",
      "Generate Answer: Treatment recommendations"
    ]
  },
  
  finance: {
    name: "Financial Market Analysis",
    description: "Investment portfolio analysis and market predictions",
    nodes: [
      "Memory Search: Portfolio and market data",
      "Web Search: Financial news and trends",
      "Context Assembly: Combine financial data",
      "Model Router: Select financial AI model",
      "GEPA Optimize: Enhance analysis prompts",
      "LangStruct: Extract financial metrics",
      "Custom Agent: Financial advisor",
      "Generate Answer: Investment strategy"
    ]
  },
  
  legal: {
    name: "Legal Research & Case Analysis",
    description: "Legal document analysis and case strategy",
    nodes: [
      "Memory Search: Case law database",
      "Web Search: Legal precedents and updates",
      "Context Assembly: Combine legal data",
      "Model Router: Select legal AI model",
      "GEPA Optimize: Enhance legal prompts",
      "LangStruct: Extract legal structures",
      "Custom Agent: Legal specialist",
      "Generate Answer: Case strategy"
    ]
  },
  
  technology: {
    name: "Technology Market Analysis",
    description: "Tech industry trends and innovation analysis",
    nodes: [
      "Memory Search: Tech database and patents",
      "Web Search: Industry trends and news",
      "Context Assembly: Combine tech data",
      "Model Router: Select tech AI model",
      "GEPA Optimize: Enhance analysis prompts",
      "LangStruct: Extract tech metrics",
      "Custom Agent: Technology analyst",
      "Generate Answer: Innovation report"
    ]
  }
};
