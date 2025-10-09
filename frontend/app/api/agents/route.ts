import { NextResponse } from 'next/server';

/**
 * AGENT REGISTRY - Inspired by Vercel AI SDK
 * Each agent declares:
 * - capabilities (what it does)
 * - matchesOn (keywords for fast routing)
 * - handoffTo (which agents it can delegate to)
 */

const AGENT_REGISTRY = {
  // === RESEARCH & DATA GATHERING ===
  webSearchAgent: {
    name: 'Web Search Agent',
    role: 'Research Analyst',
    capabilities: ['web research', 'data gathering', 'market analysis', 'current trends'],
    matchesOn: ['research', 'search', 'find', 'latest', 'current', 'trends', 'market'],
    apiEndpoint: '/api/perplexity/chat',
    modelPreference: 'perplexity', // PAID - requires web search
    estimatedCost: 0.003,
    icon: '🌐',
    iconColor: 'bg-blue-500',
    handoffTo: ['dspyMarketAgent', 'dspyRealEstateAgent', 'customAgent'],
    priority: 1 // Higher priority = checked first
  },

  // === DSPy SELF-OPTIMIZING AGENTS ===
  dspyMarketAgent: {
    name: 'DSPy Market Analyzer',
    role: 'Market Intelligence Specialist',
    capabilities: ['market analysis', 'trend forecasting', 'competitive intelligence', 'self-optimization'],
    matchesOn: ['market', 'competition', 'trends', 'forecast', 'intelligence'],
    apiEndpoint: '/api/dspy/execute',
    modelPreference: 'local', // FREE - can use Ollama for analysis
    estimatedCost: 0,
    icon: 'M',
    iconColor: 'bg-purple-600',
    config: { moduleName: 'market_research_analyzer', optimize: true },
    handoffTo: ['dspyDataSynthesizer', 'gepaAgent'],
    priority: 2
  },

  dspyRealEstateAgent: {
    name: 'DSPy Real Estate Agent',
    role: 'Real Estate Specialist',
    capabilities: ['property analysis', 'real estate valuation', 'investment recommendations', 'self-optimization'],
    matchesOn: ['real estate', 'property', 'housing', 'condo', 'apartment', 'building'],
    apiEndpoint: '/api/dspy/execute',
    icon: 'R',
    iconColor: 'bg-green-600',
    config: { moduleName: 'real_estate_agent', optimize: true },
    handoffTo: ['dspyFinancialAgent', 'dspyInvestmentReportAgent'],
    priority: 2
  },

  dspyFinancialAgent: {
    name: 'DSPy Financial Analyst',
    role: 'Financial Modeling Expert',
    capabilities: ['financial analysis', 'ROI calculation', 'risk assessment', 'self-optimization'],
    matchesOn: ['financial', 'finance', 'roi', 'return', 'investment', 'profit', 'revenue'],
    apiEndpoint: '/api/dspy/execute',
    icon: 'F',
    iconColor: 'bg-yellow-600',
    config: { moduleName: 'financial_analyst', optimize: true },
    handoffTo: ['dspyInvestmentReportAgent'],
    priority: 2
  },

  dspyInvestmentReportAgent: {
    name: 'DSPy Investment Report Generator',
    role: 'Investment Report Specialist',
    capabilities: ['report generation', 'investment recommendations', 'comprehensive analysis', 'self-optimization'],
    matchesOn: ['report', 'summary', 'recommendations', 'investment plan'],
    apiEndpoint: '/api/dspy/execute',
    icon: 'I',
    iconColor: 'bg-indigo-600',
    config: { moduleName: 'investment_report_generator', optimize: true },
    handoffTo: ['answerAgent'],
    priority: 3
  },

  dspyDataSynthesizer: {
    name: 'DSPy Data Synthesizer',
    role: 'Data Fusion Specialist',
    capabilities: ['data synthesis', 'multi-source integration', 'comprehensive analysis', 'self-optimization'],
    matchesOn: ['synthesize', 'combine', 'merge', 'integrate', 'comprehensive'],
    apiEndpoint: '/api/dspy/execute',
    icon: 'D',
    iconColor: 'bg-pink-600',
    config: { moduleName: 'data_synthesizer', optimize: true },
    handoffTo: ['gepaAgent', 'langStructAgent'],
    priority: 2
  },

  // === SPECIALIZED TOOLS ===
  gepaAgent: {
    name: 'GEPA Optimizer',
    role: 'Prompt Evolution Specialist',
    capabilities: ['prompt optimization', 'quality improvement', 'evolutionary refinement'],
    matchesOn: ['optimize', 'improve', 'enhance', 'refine', 'quality'],
    apiEndpoint: '/api/gepa/optimize',
    icon: '⚡',
    iconColor: 'bg-orange-600',
    handoffTo: ['customAgent'],
    priority: 3
  },

  langStructAgent: {
    name: 'LangStruct Extractor',
    role: 'Structured Data Specialist',
    capabilities: ['data extraction', 'structured output', 'schema validation'],
    matchesOn: ['extract', 'structure', 'parse', 'format', 'schema'],
    apiEndpoint: '/api/langstruct/process',
    icon: 'SEARCH',
    iconColor: 'bg-teal-600',
    handoffTo: ['celAgent', 'customAgent'],
    priority: 3
  },

  memorySearchAgent: {
    name: 'Memory Search',
    role: 'Knowledge Retrieval Specialist',
    capabilities: ['vector search', 'semantic retrieval', 'knowledge lookup'],
    matchesOn: ['remember', 'recall', 'previous', 'history', 'similar'],
    apiEndpoint: '/api/search/indexed',
    icon: 'SEARCH',
    iconColor: 'bg-gray-600',
    handoffTo: ['customAgent'],
    priority: 2
  },

  contextAssemblyAgent: {
    name: 'Context Assembly',
    role: 'Context Engineering Specialist',
    capabilities: ['context merging', 'data integration', 'information synthesis'],
    matchesOn: ['context', 'merge', 'assemble', 'integrate'],
    apiEndpoint: '/api/context/assemble',
    icon: '📦',
    iconColor: 'bg-indigo-600',
    handoffTo: ['customAgent', 'answerAgent'],
    priority: 3
  },

  celAgent: {
    name: 'CEL Expression Evaluator',
    role: 'Data Transformation Specialist',
    capabilities: ['expression evaluation', 'data transformation', 'conditional logic', 'state management'],
    matchesOn: ['transform', 'calculate', 'evaluate', 'condition', 'expression'],
    apiEndpoint: '/api/cel/execute',
    icon: 'CEL',
    iconColor: 'bg-indigo-600',
    handoffTo: ['customAgent', 'answerAgent'],
    priority: 3
  },

  // === GENERIC & FALLBACK ===
  customAgent: {
    name: 'Custom AI Agent',
    role: 'General Purpose Specialist',
    capabilities: ['general analysis', 'flexible processing', 'custom tasks'],
    matchesOn: [], // No keywords - acts as fallback
    apiEndpoint: '/api/agent/chat',
    icon: '▶',
    iconColor: 'bg-blue-500',
    handoffTo: ['answerAgent'],
    priority: 10 // Lowest priority - fallback
  },

  answerAgent: {
    name: 'Answer Generator',
    role: 'Final Synthesizer',
    capabilities: ['final synthesis', 'response generation', 'output formatting'],
    matchesOn: ['final', 'answer', 'result', 'output'],
    apiEndpoint: '/api/answer',
    icon: 'OK',
    iconColor: 'bg-green-500',
    handoffTo: [], // Terminal agent
    priority: 99 // Always last
  }
};

/**
 * HYBRID ROUTER - Fast keyword matching with LLM fallback
 * Strategy: "auto" - 90% keyword match (instant) → 10% LLM (smart)
 */
async function routeToAgent(
  userRequest: string,
  context: any = {},
  strategy: 'auto' | 'keyword' | 'llm' = 'auto'
): Promise<{
  selectedAgent: keyof typeof AGENT_REGISTRY;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'keyword' | 'llm';
}> {
  
  console.log('🔀 Routing request:', userRequest);
  console.log('📊 Strategy:', strategy);
  
  // Step 1: Try keyword matching (fast path - 90% of cases)
  if (strategy === 'auto' || strategy === 'keyword') {
    const keywordMatch = matchByKeywords(userRequest);
    if (keywordMatch) {
      console.log('✅ Keyword match found:', keywordMatch.agent);
      return {
        selectedAgent: keywordMatch.agent,
        reasoning: `Keyword match: "${keywordMatch.matchedKeywords.join(', ')}"`,
        confidence: 'high',
        method: 'keyword'
      };
    }
  }
  
  // Step 2: Fallback to LLM (smart path - 10% of cases)
  if (strategy === 'auto' || strategy === 'llm') {
    console.log('🧠 Falling back to LLM routing...');
    const llmMatch = await matchByLLM(userRequest, context);
    return {
      selectedAgent: llmMatch.agent,
      reasoning: llmMatch.reasoning,
      confidence: llmMatch.confidence,
      method: 'llm'
    };
  }
  
  // Step 3: Ultimate fallback
  return {
    selectedAgent: 'customAgent',
    reasoning: 'No specific match - using general purpose agent',
    confidence: 'low',
    method: 'keyword'
  };
}

/**
 * Fast keyword-based routing (90% of cases)
 */
function matchByKeywords(userRequest: string): {
  agent: keyof typeof AGENT_REGISTRY;
  matchedKeywords: string[];
} | null {
  const requestLower = userRequest.toLowerCase();
  
  // Sort agents by priority (higher priority = checked first)
  const sortedAgents = Object.entries(AGENT_REGISTRY)
    .sort(([, a], [, b]) => (a.priority || 10) - (b.priority || 10));
  
  for (const [agentKey, agent] of sortedAgents) {
    if (agent.matchesOn.length === 0) continue; // Skip agents without keywords
    
    const matchedKeywords = agent.matchesOn.filter(keyword => 
      requestLower.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      return {
        agent: agentKey as keyof typeof AGENT_REGISTRY,
        matchedKeywords
      };
    }
  }
  
  return null;
}

/**
 * LLM-powered routing (10% of complex cases)
 */
async function matchByLLM(userRequest: string, context: any): Promise<{
  agent: keyof typeof AGENT_REGISTRY;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}> {
  try {
    // Build agent descriptions for LLM
    const agentDescriptions = Object.entries(AGENT_REGISTRY)
      .map(([key, agent]) => 
        `- ${key}: ${agent.name} - ${agent.capabilities.join(', ')}`
      )
      .join('\n');
    
    const systemPrompt = `You are an expert AI routing agent. Select the BEST agent for this request.

AVAILABLE AGENTS:
${agentDescriptions}

Respond with JSON:
{
  "agent": "agentKey",
  "reasoning": "why this agent is best",
  "confidence": "high|medium|low"
}`;

    const response = await fetch('http://localhost:3000/api/perplexity/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `Select the best agent for: "${userRequest}"`,
        context: systemPrompt,
        useRealAI: true
      })
    });
    
    const data = await response.json();
    const llmResponse = data.response || data.content || '';
    
    // Parse JSON from response
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        agent: result.agent || 'customAgent',
        reasoning: result.reasoning || 'LLM routing',
        confidence: result.confidence || 'medium'
      };
    }
    
  } catch (error) {
    console.error('LLM routing failed:', error);
  }
  
  // Fallback
  return {
    agent: 'customAgent',
    reasoning: 'LLM routing failed - using fallback',
    confidence: 'low'
  };
}

/**
 * Build multi-agent workflow with handoffs
 */
function buildAgentWorkflow(
  initialAgent: keyof typeof AGENT_REGISTRY,
  userRequest: string,
  maxDepth: number = 4
): Array<keyof typeof AGENT_REGISTRY> {
  const workflow: Array<keyof typeof AGENT_REGISTRY> = [initialAgent];
  let currentAgent = AGENT_REGISTRY[initialAgent];
  
  // Build workflow by following handoffs
  while (workflow.length < maxDepth) {
    if (currentAgent.handoffTo.length === 0) break; // Terminal agent
    
    // Pick next agent based on handoff options
    const nextAgentKey = selectNextAgent(currentAgent.handoffTo, userRequest);
    workflow.push(nextAgentKey);
    currentAgent = AGENT_REGISTRY[nextAgentKey];
    
    // Break if we reach answer agent
    if (nextAgentKey === 'answerAgent') break;
  }
  
  return workflow;
}

/**
 * Select next agent from handoff options
 */
function selectNextAgent(
  handoffOptions: string[],
  userRequest: string
): keyof typeof AGENT_REGISTRY {
  // Try keyword matching on handoff options
  const requestLower = userRequest.toLowerCase();
  
  for (const agentKey of handoffOptions) {
    const agent = AGENT_REGISTRY[agentKey as keyof typeof AGENT_REGISTRY];
    if (!agent) continue;
    
    const hasMatch = agent.matchesOn.some(keyword => 
      requestLower.includes(keyword.toLowerCase())
    );
    
    if (hasMatch) return agentKey as keyof typeof AGENT_REGISTRY;
  }
  
  // Default to first option
  return handoffOptions[0] as keyof typeof AGENT_REGISTRY;
}

/**
 * API Route - Test the routing system
 */
export async function POST(request: Request) {
  try {
    const { userRequest, strategy = 'auto' } = await request.json();
    
    // Route to initial agent
    const routing = await routeToAgent(userRequest, {}, strategy);
    
    // Build workflow with handoffs
    const workflow = buildAgentWorkflow(routing.selectedAgent, userRequest);
    
    // Convert to node format
    const nodes = workflow.map((agentKey, index) => {
      const agent = AGENT_REGISTRY[agentKey];
      return {
        id: `${agentKey}-${Date.now()}-${index}`,
        type: 'customizable',
        label: agent.name,
        role: agent.role,
        description: agent.capabilities.join(', '),
        apiEndpoint: agent.apiEndpoint,
        icon: agent.icon,
        iconColor: agent.iconColor,
        config: ('config' in agent && agent.config) ? agent.config : {}
      };
    });
    
    // Calculate cost estimation
    const costBreakdown = nodes.map(node => {
      const agent = Object.values(AGENT_REGISTRY).find((a: any) => a.name === node.label) as any;
      return {
        role: node.role,
        modelPreference: agent?.modelPreference || 'perplexity',
        cost: agent?.estimatedCost || 0.003
      };
    });
    
    const totalCost = costBreakdown.reduce((sum, item) => sum + item.cost, 0);
    const freeNodes = costBreakdown.filter(n => n.cost === 0).length;
    const paidNodes = costBreakdown.filter(n => n.cost > 0).length;
    
    return NextResponse.json({
      success: true,
      routing: {
        method: routing.method,
        confidence: routing.confidence,
        reasoning: routing.reasoning
      },
      workflow: {
        name: `${AGENT_REGISTRY[routing.selectedAgent].name} Workflow`,
        description: `Auto-routed workflow: ${routing.reasoning}`,
        nodes,
        strategy: strategy
      },
      costEstimate: {
        total: totalCost,
        freeNodes: freeNodes,
        paidNodes: paidNodes,
        breakdown: costBreakdown,
        savings: `${freeNodes} free agents, ${paidNodes} paid API calls`,
        recommendation: totalCost === 0 ? '✅ Fully optimized - zero API costs!' : `💰 Estimated cost: $${totalCost.toFixed(4)}`
      }
    });
    
  } catch (error) {
    console.error('Agent routing error:', error);
    return NextResponse.json({ error: 'Routing failed' }, { status: 500 });
  }
}

