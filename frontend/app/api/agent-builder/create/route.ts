import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface WorkflowRecommendation {
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    role: string;
    description: string;
    apiEndpoint: string;
    icon: string;
    iconColor: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  configs: Record<string, any>;
}

// ============================================================================
// COMPREHENSIVE TOOL LIBRARY
// Each tool has detailed capability descriptions for LLM-powered selection
// ============================================================================

const TOOL_LIBRARY = {
  // === RESEARCH & DATA GATHERING ===
  web_search: {
    id: 'webSearch',
    label: 'Web Search',
    description: 'Real-time web research using Perplexity AI',
    apiEndpoint: '/api/perplexity/chat',
    icon: '🌐',
    iconColor: 'bg-blue-500',
    capabilities: [
      'Gather current information from the web',
      'Research market trends, news, and publications',
      'Find real-time data and statistics',
      'Discover industry best practices and benchmarks',
      'Access recent research and expert opinions'
    ],
    bestFor: ['market research', 'trend analysis', 'current events', 'industry insights', 'fact-finding'],
    limitations: ['Cannot access private/paywalled content', 'Limited to publicly available web information']
  },
  
  memory_search: {
    id: 'memorySearch',
    label: 'Memory Search',
    description: 'Vector similarity search across stored knowledge base',
    apiEndpoint: '/api/search/indexed',
    icon: 'SEARCH',
    iconColor: 'bg-yellow-500',
    capabilities: [
      'Search through previously indexed information',
      'Find semantically similar content',
      'Retrieve relevant past conversations or documents',
      'Access organizational knowledge'
    ],
    bestFor: ['retrieving past data', 'finding similar cases', 'knowledge base queries'],
    limitations: ['Only searches pre-indexed data', 'Requires existing knowledge base setup']
  },
  
  // === SELF-OPTIMIZING AI AGENTS (DSPy) ===
  dspy_market_analyzer: {
    id: 'dspyMarketAnalyzer',
    label: 'DSPy Market Analyzer',
    description: 'Self-optimizing market analysis with continuous learning',
    apiEndpoint: '/api/dspy/execute',
    icon: 'M',
    iconColor: 'bg-purple-600',
    capabilities: [
      'Analyze market trends and competitive landscapes',
      'Identify market opportunities and threats',
      'Assess industry dynamics and growth potential',
      'Self-optimizes analysis quality over time'
    ],
    bestFor: ['market research', 'competitive analysis', 'industry trends', 'market sizing', 'SWOT analysis'],
    limitations: ['Requires quality training data for optimization'],
    config: { moduleName: 'market_research_analyzer', optimize: true }
  },
  
  dspy_real_estate: {
    id: 'dspyRealEstateAgent',
    label: 'DSPy Real Estate Agent',
    description: 'Self-optimizing real estate and property analysis',
    apiEndpoint: '/api/dspy/execute',
    icon: 'R',
    iconColor: 'bg-blue-600',
    capabilities: [
      'Evaluate property values and market conditions',
      'Analyze real estate investment opportunities',
      'Assess rental yields and appreciation potential',
      'Compare properties and neighborhoods',
      'Self-improves accuracy with each analysis'
    ],
    bestFor: ['property evaluation', 'real estate investment analysis', 'market condition assessment'],
    limitations: ['Focused on real estate domain'],
    config: { moduleName: 'real_estate_agent', optimize: true }
  },
  
  dspy_financial: {
    id: 'dspyFinancialAnalyst',
    label: 'DSPy Financial Analyst',
    description: 'Self-optimizing financial modeling and analysis',
    apiEndpoint: '/api/dspy/execute',
    icon: 'F',
    iconColor: 'bg-green-600',
    capabilities: [
      'Perform financial modeling and projections',
      'Calculate ROI, NPV, IRR, and other metrics',
      'Assess investment risks and returns',
      'Analyze cash flows and profitability',
      'Self-optimizes financial accuracy'
    ],
    bestFor: ['financial modeling', 'ROI calculation', 'investment analysis', 'risk assessment'],
    limitations: ['Requires numerical/financial data'],
    config: { moduleName: 'financial_analyst', optimize: true }
  },
  
  dspy_investment_report: {
    id: 'dspyInvestmentReport',
    label: 'DSPy Investment Report Generator',
    description: 'Self-optimizing comprehensive report generation',
    apiEndpoint: '/api/dspy/execute',
    icon: 'I',
    iconColor: 'bg-indigo-600',
    capabilities: [
      'Generate comprehensive investment reports',
      'Synthesize multiple data sources into coherent narratives',
      'Provide actionable recommendations',
      'Create executive summaries',
      'Self-improves report quality and relevance'
    ],
    bestFor: ['report generation', 'investment recommendations', 'executive summaries', 'decision support'],
    limitations: ['Works best with structured input data'],
    config: { moduleName: 'investment_report_generator', optimize: true }
  },
  
  dspy_data_synthesizer: {
    id: 'dspyDataSynthesizer',
    label: 'DSPy Data Synthesizer',
    description: 'Self-optimizing multi-source data fusion and synthesis',
    apiEndpoint: '/api/dspy/execute',
    icon: 'D',
    iconColor: 'bg-orange-600',
    capabilities: [
      'Merge and synthesize data from multiple sources',
      'Resolve conflicts and inconsistencies',
      'Create unified comprehensive views',
      'Extract key insights from diverse data',
      'Self-optimizes synthesis logic'
    ],
    bestFor: ['data fusion', 'multi-source synthesis', 'comprehensive analysis', 'insight extraction'],
    limitations: ['Requires multiple input sources to be effective'],
    config: { moduleName: 'data_synthesizer', optimize: true }
  },
  
  // === DATA PROCESSING & TRANSFORMATION ===
  context_assembly: {
    id: 'contextAssembly',
    label: 'Context Assembly',
    description: 'Merge and assemble context from multiple sources',
    apiEndpoint: '/api/context/assemble',
    icon: '📦',
    iconColor: 'bg-purple-500',
    capabilities: [
      'Combine results from multiple sources',
      'Build comprehensive context',
      'Aggregate and organize information'
    ],
    bestFor: ['data fusion', 'result merging', 'context building'],
    limitations: ['Requires well-structured input data']
  },
  
  langstruct: {
    id: 'langstruct',
    label: 'LangStruct',
    description: 'Extract and structure data from unstructured text',
    apiEndpoint: '/api/langstruct/process',
    icon: 'SEARCH',
    iconColor: 'bg-gray-600',
    capabilities: [
      'Extract structured data from unstructured text',
      'Parse documents into defined schemas',
      'Convert free-form text into structured formats',
      'Validate and clean extracted data'
    ],
    bestFor: ['data extraction', 'document parsing', 'format conversion', 'schema mapping'],
    limitations: ['Requires clear schema definition']
  },
  
  cel_expression: {
    id: 'celExpression',
    label: 'CEL Expression Evaluator',
    description: 'Execute data transformations and calculations',
    apiEndpoint: '/api/cel/execute',
    icon: 'CEL',
    iconColor: 'bg-indigo-600',
    capabilities: [
      'Perform mathematical calculations',
      'Transform and manipulate data',
      'Execute conditional logic',
      'Manage workflow state'
    ],
    bestFor: ['data transformation', 'calculations', 'conditional logic', 'state management'],
    limitations: ['Limited to CEL expression syntax']
  },
  
  // === OPTIMIZATION & QUALITY ===
  gepa_optimize: {
    id: 'gepaOptimize',
    label: 'GEPA Prompt Optimizer',
    description: 'Evolutionary prompt optimization for quality enhancement',
    apiEndpoint: '/api/gepa/optimize',
    icon: '⚡',
    iconColor: 'bg-yellow-600',
    capabilities: [
      'Optimize prompts through evolution',
      'Improve output quality iteratively',
      'Enhance response accuracy',
      'Adapt prompts to specific use cases'
    ],
    bestFor: ['prompt optimization', 'quality enhancement', 'iterative improvement'],
    limitations: ['Requires multiple iterations', 'Adds processing time']
  },
  
  // === GENERIC & OUTPUT ===
  custom_agent: {
    id: 'customAgent',
    label: 'Custom AI Agent',
    description: 'Flexible AI agent that can be specialized for any task',
    apiEndpoint: '/api/agent/chat',
    icon: '▶',
    iconColor: 'bg-blue-500',
    capabilities: [
      'Perform any AI-powered task',
      'Can be specialized with custom prompts',
      'Flexible and adaptable',
      'Supports various domains and use cases'
    ],
    bestFor: ['custom tasks', 'specialized domains', 'flexible processing', 'general-purpose AI'],
    limitations: ['May not be as optimized as specialized tools']
  },
  
  answer_generator: {
    id: 'answer',
    label: 'Final Answer Generator',
    description: 'Generate final synthesized response',
    apiEndpoint: '/api/answer',
    icon: 'OK',
    iconColor: 'bg-green-500',
    capabilities: [
      'Synthesize all previous outputs',
      'Generate final user-facing response',
      'Format output appropriately'
    ],
    bestFor: ['final output', 'response generation', 'result synthesis'],
    limitations: ['Should be last step in workflow']
  }
};

/**
 * LLM-POWERED WORKFLOW PLANNER
 * Uses AI to understand the request and select optimal tools
 */
async function planWorkflowWithLLM(userRequest: string): Promise<{
  goal: string;
  reasoning: string;
  requiredCapabilities: string[];
  selectedTools: Array<{
    toolKey: string;
    role: string;
    purpose: string;
    reasoning: string;
  }>;
  workflowStructure: 'linear' | 'parallel' | 'complex';
}> {
  
  // Create a prompt that describes all available tools
  const toolDescriptions = Object.entries(TOOL_LIBRARY).map(([key, tool]) => {
    return `**${key}** - ${tool.label}:
- Description: ${tool.description}
- Capabilities: ${tool.capabilities.join('; ')}
- Best for: ${tool.bestFor.join(', ')}
- Limitations: ${tool.limitations.join(', ')}`;
  }).join('\n\n');

  const systemPrompt = `You are an expert AI workflow architect. Your job is to analyze user requests and design optimal multi-agent workflows.

AVAILABLE TOOLS:
${toolDescriptions}

Your task:
1. Understand the user's goal
2. Identify required capabilities
3. Select the BEST tools from the library above
4. Design an optimal workflow structure
5. Explain your reasoning

GUIDELINES:
- Use specialized tools (DSPy agents) when available for better quality
- Start with data gathering (web_search or memory_search) if needed
- Use custom_agent for tasks without specialized tools
- Always end with answer_generator
- Aim for 3-5 nodes (not too simple, not too complex)
- Provide clear reasoning for each tool selection

Respond in JSON format:
{
  "goal": "Clear statement of what user wants to achieve",
  "reasoning": "Overall strategy and approach",
  "requiredCapabilities": ["capability1", "capability2"],
  "selectedTools": [
    {
      "toolKey": "web_search",
      "role": "Market Researcher",
      "purpose": "Gather current market data",
      "reasoning": "Need real-time information"
    }
  ],
  "workflowStructure": "linear"
}`;

  const userPrompt = `User Request: "${userRequest}"

Design an optimal workflow to accomplish this goal. Select the best tools and explain your choices.`;

  try {
    console.log('🧠 Using REAL LLM-powered workflow planning!');
    
    // Call the LLM to analyze request and select optimal tools
    const response = await fetch('http://localhost:3000/api/perplexity/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userPrompt,
        context: systemPrompt,
        useRealAI: true // Use real Perplexity AI
      })
    });

    if (!response.ok) {
      console.warn('LLM API call failed, using fallback');
      throw new Error('LLM planning API failed');
    }

    const data = await response.json();
    const llmResponse = data.response || data.content || data.message || '';
    
    console.log('🤖 LLM Raw Response:', llmResponse.substring(0, 500));
    console.log('📦 Full API Response Keys:', Object.keys(data));
    
    // Parse JSON from LLM response (handle markdown code blocks)
    let plan;
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = llmResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the whole response as JSON
        plan = JSON.parse(llmResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      console.log('LLM Response:', llmResponse);
      throw new Error('LLM returned invalid JSON');
    }
    
    console.log('✅ LLM Plan parsed successfully!');
    console.log('🎯 Goal:', plan.goal);
    console.log('💭 Reasoning:', plan.reasoning);
    console.log('🔧 Tools:', plan.selectedTools?.length || 0);
    
    // Validate the plan structure
    if (!plan.selectedTools || !Array.isArray(plan.selectedTools) || plan.selectedTools.length === 0) {
      console.warn('LLM plan missing selectedTools, using fallback');
      throw new Error('Invalid plan structure');
    }
    
    return {
      goal: plan.goal || userRequest,
      reasoning: plan.reasoning || 'LLM-powered workflow planning',
      requiredCapabilities: plan.requiredCapabilities || plan.selectedTools.map((t: any) => t.purpose),
      selectedTools: plan.selectedTools,
      workflowStructure: plan.workflowStructure || 'linear'
    };
    
  } catch (error) {
    console.error('❌ Error in LLM workflow planning:', error);
    throw error; // Let it fall back to keyword-based
  }
}

/**
 * Determine primary role based on request content
 * @deprecated - Use LLM planning instead
 */
function determinePrimaryRole(request: string, analysis: any): string {
  // Education & Learning
  if (request.includes('course') || request.includes('training') || request.includes('teach') || request.includes('learn')) {
    return 'Educational Content Specialist';
  }
  // Sales & Communication
  if (request.includes('sales') || request.includes('communicate') || request.includes('pitch') || request.includes('convince')) {
    return 'Sales Communication Expert';
  }
  // Strategy & Planning
  if (request.includes('strategy') || request.includes('plan') || request.includes('roadmap')) {
    return 'Strategic Planning Analyst';
  }
  // Research & Analysis
  if (request.includes('research') || request.includes('find') || request.includes('discover')) {
    return 'Research Analyst';
  }
  // Content Creation
  if (request.includes('write') || request.includes('content') || request.includes('create')) {
    return 'Content Strategist';
  }
  // Default
  return 'Domain Expert';
}

/**
 * Determine secondary/synthesis role based on primary role and request
 */
function determineSecondaryRole(request: string, analysis: any, primaryRole: string): string {
  // Course/Training related
  if (request.includes('course') || request.includes('training') || request.includes('curriculum')) {
    return 'Course Design Architect';
  }
  // Implementation & Execution
  if (request.includes('implement') || request.includes('execute') || request.includes('build')) {
    return 'Implementation Strategist';
  }
  // Communication & Messaging
  if (request.includes('communicate') || request.includes('message') || request.includes('present')) {
    return 'Communication Framework Designer';
  }
  // Strategy & Framework
  if (request.includes('framework') || request.includes('system') || request.includes('methodology')) {
    return 'Framework Architect';
  }
  // Content & Documentation
  if (request.includes('document') || request.includes('guide') || request.includes('manual')) {
    return 'Documentation Specialist';
  }
  // Default synthesis role
  return 'Strategy Synthesizer';
}

/**
 * INTELLIGENT NODE SELECTOR
 * Matches user requirements to the BEST specialized nodes
 */
function selectOptimalNodes(analysis: any, request: string): any[] {
  const selectedNodes: any[] = [];
  const requestLower = request.toLowerCase();
  
  // Helper function to calculate relevance score
  const calculateRelevance = (node: any) => {
    let score = 0;
    node.keywords.forEach((keyword: string) => {
      if (requestLower.includes(keyword)) score += 2;
    });
    node.useCases.forEach((useCase: string) => {
      if (requestLower.includes(useCase.toLowerCase())) score += 3;
    });
    return score;
  };
  
  // Step 1: Always start with data gathering (web search)
  // Most workflows benefit from current real-world data
  if (analysis.requiresWebSearch || requestLower.includes('research') || requestLower.includes('market') || 
      requestLower.includes('analyze') || requestLower.includes('analysis') || requestLower.includes('current') ||
      requestLower.includes('plan') || requestLower.includes('strategy') || requestLower.includes('develop') ||
      analysis.domain === 'property' || analysis.domain === 'market_research' || analysis.domain === 'finance' ||
      analysis.domain === 'business_planning' || analysis.domain === 'marketing') {
    selectedNodes.push({
      ...TOOL_LIBRARY.web_search,
      role: 'Web Researcher',
      stage: 'research'
    });
  }
  
  // Step 2: Domain-Specific Analysis - Use DSPy specialized nodes when possible
  
  // REAL ESTATE & PROPERTY
  if (analysis.domain === 'property' || requestLower.includes('real estate') || requestLower.includes('property') || 
      requestLower.includes('housing') || requestLower.includes('rental') || requestLower.includes('lease')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.dspy_real_estate,
      role: 'Real Estate Analyst',
      stage: 'analysis'
    });
    
    if (requestLower.includes('investment') || requestLower.includes('roi') || requestLower.includes('profit')) {
      selectedNodes.push({
        ...TOOL_LIBRARY.dspy_financial,
        role: 'Investment Analyst',
        stage: 'financial_analysis'
      });
    }
  } 
  
  // MARKET RESEARCH (Any industry/domain) - but NOT marketing
  else if ((analysis.domain === 'market_research' || requestLower.includes('market research') || 
            requestLower.includes('industry') || requestLower.includes('competitive')) && 
            analysis.domain !== 'marketing') {
    selectedNodes.push({
      ...TOOL_LIBRARY.dspy_market_analyzer,
      role: 'Market Analyst',
      stage: 'analysis'
    });
  } 
  
  // FINANCIAL ANALYSIS (Any financial task)
  else if (analysis.domain === 'finance' || requestLower.includes('financial') || 
           requestLower.includes('investment') || requestLower.includes('roi') || 
           requestLower.includes('budget') || requestLower.includes('cost') || 
           requestLower.includes('revenue') || requestLower.includes('profit')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.dspy_financial,
      role: 'Financial Analyst',
      stage: 'analysis'
    });
  } 
  
  // CONTENT GENERATION (Marketing, writing, social media)
  else if (requestLower.includes('content') || requestLower.includes('write') || 
           requestLower.includes('blog') || requestLower.includes('article') || 
           requestLower.includes('social media') || requestLower.includes('copy') || 
           requestLower.includes('marketing')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Content Creator',
      stage: 'creation'
    });
  } 
  
  // BUSINESS PLANNING & STRATEGY (check BEFORE customer support which matches "help")
  else if (analysis.domain === 'business_planning' || (requestLower.includes('business') && requestLower.includes('plan'))) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Business Strategy Analyst',
      stage: 'strategy'
    });
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Business Plan Architect',
      stage: 'design'
    });
  }
  
  // CUSTOMER SUPPORT & SERVICE
  else if (requestLower.includes('customer') || requestLower.includes('support') || 
           requestLower.includes('service') || requestLower.includes('help') || 
           requestLower.includes('ticket') || requestLower.includes('complaint')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Customer Support Agent',
      stage: 'support'
    });
  } 
  
  // LEGAL & COMPLIANCE
  else if (requestLower.includes('legal') || requestLower.includes('law') || 
           requestLower.includes('compliance') || requestLower.includes('regulation') || 
           requestLower.includes('contract') || requestLower.includes('policy')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Legal Analyst',
      stage: 'legal_analysis'
    });
  } 
  
  // HEALTHCARE & MEDICAL
  else if (requestLower.includes('medical') || requestLower.includes('healthcare') || 
           requestLower.includes('patient') || requestLower.includes('diagnosis') || 
           requestLower.includes('treatment') || requestLower.includes('health')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Healthcare Assistant',
      stage: 'medical_analysis'
    });
  } 
  
  // EDUCATION & TRAINING - Build multi-stage course creation workflow
  else if (requestLower.includes('course') || (requestLower.includes('teach') && requestLower.includes('build'))) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Educational Content Specialist',
      stage: 'analysis'
    });
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Course Design Architect',
      stage: 'design'
    });
  } 
  else if (requestLower.includes('teach') || requestLower.includes('learn') || 
           requestLower.includes('education') || requestLower.includes('training') || 
           requestLower.includes('tutor')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Educational Assistant',
      stage: 'education'
    });
  } 
  
  // HR & RECRUITMENT
  else if (requestLower.includes('recruit') || requestLower.includes('hire') || 
           requestLower.includes('resume') || requestLower.includes('candidate') || 
           requestLower.includes('interview') || requestLower.includes('hr')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'HR Assistant',
      stage: 'recruitment'
    });
  } 
  
  // SALES & BUSINESS DEVELOPMENT
  else if (requestLower.includes('sales') || requestLower.includes('lead') || 
           requestLower.includes('prospect') || requestLower.includes('pipeline') || 
           requestLower.includes('crm') || requestLower.includes('deal')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Sales Assistant',
      stage: 'sales'
    });
  } 
  
  // OPERATIONS & PROJECT MANAGEMENT
  else if (requestLower.includes('project') || requestLower.includes('manage') || 
           requestLower.includes('operations') || requestLower.includes('workflow') || 
           requestLower.includes('process') || requestLower.includes('task')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'Operations Manager',
      stage: 'operations'
    });
  } 
  
  // GENERIC ANALYSIS (Catch-all for any analytical task)
  else if (requestLower.includes('analyze') || requestLower.includes('analysis') || 
           requestLower.includes('evaluate') || requestLower.includes('assess')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'AI Analyst',
      stage: 'analysis'
    });
  }
  
  // If we haven't added any specialized nodes yet, create a multi-stage workflow
  const needsMultiStage = selectedNodes.length <= 1 || 
                          (selectedNodes.length === 1 && selectedNodes[0].stage === 'research');
  
  if (needsMultiStage) {
    // Add a research/analysis stage
    const primaryRole = determinePrimaryRole(requestLower, analysis);
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: primaryRole,
      stage: 'analysis'
    });
    
    // Add a synthesis/strategy stage if the task is complex
    if (requestLower.includes('how to') || requestLower.includes('strategy') || 
        requestLower.includes('plan') || requestLower.includes('build') || 
        requestLower.includes('create') || requestLower.includes('develop') ||
        requestLower.includes('comprehensive') || requestLower.includes('detailed')) {
      const secondaryRole = determineSecondaryRole(requestLower, analysis, primaryRole);
      selectedNodes.push({
        ...TOOL_LIBRARY.custom_agent,
        role: secondaryRole,
        stage: 'strategy'
      });
    }
  }
  
  // Step 3: Add data synthesis if multiple sources
  if (selectedNodes.length > 2 && (requestLower.includes('comprehensive') || requestLower.includes('detailed'))) {
    selectedNodes.push({
      ...TOOL_LIBRARY.dspy_data_synthesizer,
      role: 'Data Synthesizer',
      stage: 'synthesis'
    });
  }
  
  // Step 4: Report generation if needed
  if (analysis.outputType === 'report' || requestLower.includes('report') || requestLower.includes('recommendation')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.dspy_investment_report,
      role: 'Report Generator',
      stage: 'reporting'
    });
  }
  
  // Step 5: Add GEPA optimization for quality enhancement
  if (analysis.complexity === 'high' && (requestLower.includes('best') || requestLower.includes('optimal') || requestLower.includes('quality'))) {
    selectedNodes.push({
      ...TOOL_LIBRARY.gepa_optimize,
      role: 'Quality Optimizer',
      stage: 'optimization'
    });
  }
  
  // Step 6: Add LangStruct for structured extraction if needed
  if (requestLower.includes('extract') || requestLower.includes('structure') || requestLower.includes('parse')) {
    selectedNodes.push({
      ...TOOL_LIBRARY.langstruct,
      role: 'Data Extractor',
      stage: 'extraction'
    });
  }
  
  // Step 7: Fallback to generic if no specialized nodes matched
  if (selectedNodes.length === 0) {
    selectedNodes.push({
      ...TOOL_LIBRARY.custom_agent,
      role: 'General Assistant',
      stage: 'processing'
    });
  }
  
  // Step 8: Always add final answer generator
  selectedNodes.push({
    ...TOOL_LIBRARY.answer_generator,
    role: 'Final Output',
    stage: 'output'
  });
  
  return selectedNodes;
}

// Icon mapping based on role keywords - using text labels instead of emojis
const ROLE_ICONS: Record<string, { icon: string; color: string }> = {
  search: { icon: 'SEARCH', color: 'bg-blue-500' },
  research: { icon: 'RESEARCH', color: 'bg-purple-500' },
  web: { icon: 'WEB', color: 'bg-cyan-500' },
  legal: { icon: 'LEGAL', color: 'bg-slate-600' },
  property: { icon: 'PROPERTY', color: 'bg-amber-600' },
  finance: { icon: 'FINANCE', color: 'bg-green-600' },
  investment: { icon: 'INVEST', color: 'bg-emerald-600' },
  market: { icon: 'MARKET', color: 'bg-orange-500' },
  analysis: { icon: 'ANALYZE', color: 'bg-indigo-500' },
  risk: { icon: 'RISK', color: 'bg-red-500' },
  email: { icon: 'EMAIL', color: 'bg-pink-500' },
  content: { icon: 'CONTENT', color: 'bg-violet-500' },
  customer: { icon: 'SUPPORT', color: 'bg-teal-500' },
  support: { icon: 'HELP', color: 'bg-sky-500' },
  medical: { icon: 'MEDICAL', color: 'bg-rose-500' },
  healthcare: { icon: 'HEALTH', color: 'bg-red-400' },
  data: { icon: 'DATA', color: 'bg-blue-600' },
  report: { icon: 'REPORT', color: 'bg-gray-600' },
  document: { icon: 'DOC', color: 'bg-stone-500' },
  social: { icon: 'SOCIAL', color: 'bg-purple-400' },
  marketing: { icon: 'MARKETING', color: 'bg-orange-400' },
  strategy: { icon: 'STRATEGY', color: 'bg-indigo-600' },
  tech: { icon: 'TECH', color: 'bg-slate-500' },
  code: { icon: 'CODE', color: 'bg-gray-700' },
  expression: { icon: 'CEL', color: 'bg-indigo-600' },
  transform: { icon: 'TRANSFORM', color: 'bg-cyan-600' },
  route: { icon: 'ROUTE', color: 'bg-orange-600' },
  state: { icon: 'STATE', color: 'bg-purple-600' },
  cel: { icon: 'CEL', color: 'bg-indigo-600' },
  conditional: { icon: 'IF/ELSE', color: 'bg-orange-600' },
  default: { icon: 'AI', color: 'bg-blue-500' }
};

/**
 * AI-powered workflow generation
 * Analyzes user request and intelligently creates optimal workflow
 */
/**
 * MAIN WORKFLOW GENERATOR - Uses LLM planner with keyword-based fallback
 */
async function generateIntelligentWorkflow(userRequest: string, conversationHistory: any[]): Promise<WorkflowRecommendation> {
  console.log('🤖 Starting intelligent workflow generation...');
  console.log('📝 Request:', userRequest);
  
  try {
    // Try LLM-powered planning first
    console.log('🧠 Attempting LLM-powered workflow planning...');
    const llmPlan = await planWorkflowWithLLM(userRequest);
    
    console.log('✅ LLM planning successful!');
    console.log('🎯 Goal:', llmPlan.goal);
    console.log('💭 Reasoning:', llmPlan.reasoning);
    console.log('🔧 Selected tools:', llmPlan.selectedTools.map(t => t.toolKey).join(', '));
    
    // Build workflow from LLM's plan
    return buildWorkflowFromLLMPlan(llmPlan, userRequest);
    
  } catch (error) {
    console.warn('⚠️ LLM planning failed, falling back to keyword-based approach');
    console.error('Error:', error);
    
    // Fallback to keyword-based approach
    return generateWorkflowKeywordBased(userRequest, conversationHistory);
  }
}

/**
 * Build workflow from LLM's plan
 */
function buildWorkflowFromLLMPlan(plan: any, originalRequest: string): WorkflowRecommendation {
  // Map LLM's tool selections to actual nodes
  const nodes = plan.selectedTools.map((tool: any, index: number) => {
    const toolDef = TOOL_LIBRARY[tool.toolKey as keyof typeof TOOL_LIBRARY];
    if (!toolDef) {
      console.warn(`Tool ${tool.toolKey} not found in library, using custom_agent`);
      const fallback = TOOL_LIBRARY.custom_agent;
      return {
        id: `${fallback.id}-${Date.now()}-${index}`,
        type: 'customizable',
        label: fallback.label,
        role: tool.role,
        description: tool.purpose,
        apiEndpoint: fallback.apiEndpoint,
        icon: fallback.icon,
        iconColor: fallback.iconColor
      };
    }
    
    return {
      id: `${toolDef.id}-${Date.now()}-${index}`,
      type: 'customizable',
      label: toolDef.label,
      role: tool.role,
      description: tool.purpose,
      apiEndpoint: toolDef.apiEndpoint,
      icon: toolDef.icon,
      iconColor: toolDef.iconColor
    };
  });
  
  // Always ensure we end with answer generator
  const hasAnswerGen = nodes.some((n: any) => n.apiEndpoint === '/api/answer');
  if (!hasAnswerGen) {
    const answerGen = TOOL_LIBRARY.answer_generator;
    nodes.push({
      id: `${answerGen.id}-${Date.now()}-${nodes.length}`,
      type: 'customizable',
      label: answerGen.label,
      role: 'Final Output',
      description: answerGen.description,
      apiEndpoint: answerGen.apiEndpoint,
      icon: answerGen.icon,
      iconColor: answerGen.iconColor
    });
  }
  
  // Create edges
  const edges = generateEdges(nodes);
  
  // Generate configs (create full analysis object to match expected structure)
  const simpleAnalysis = {
    domain: 'general',
    purpose: '',
    locations: [],
    specializations: [],
    outputType: 'analysis',
    complexity: 'medium',
    requiresWebSearch: nodes.some((n: any) => n.apiEndpoint === '/api/perplexity/chat'),
    requiresLegalAdvice: false,
    requiresEmailGeneration: false,
    requiresDataAnalysis: false,
    requiresDataTransformation: false
  };
  const configs = generateNodeConfigurations(nodes, simpleAnalysis);
  
  return {
    name: plan.goal.length > 50 ? plan.goal.substring(0, 50) + '...' : plan.goal,
    description: `${plan.reasoning}\n\nSelected Tools: ${plan.selectedTools.map((t: any) => t.role).join(' → ')}`,
    nodes,
    edges,
    configs
  };
}

/**
 * KEYWORD-BASED FALLBACK (original implementation)
 */
function generateWorkflowKeywordBased(userRequest: string, conversationHistory: any[]): WorkflowRecommendation {
  const request = userRequest.toLowerCase();
  
  // Step 1: Analyze the user's intent and extract key information
  const analysis = analyzeUserIntent(request);
  
  // Step 2: INTELLIGENTLY SELECT THE BEST SPECIALIZED NODES
  const optimalNodes = selectOptimalNodes(analysis, request);
  
  // Step 3: Generate node objects from selected specialized nodes
  const nodes = optimalNodes.map((nodeTemplate, index) => {
    const nodeId = `${nodeTemplate.id}-${Date.now()}-${index}`;
    return {
      id: nodeId,
      type: 'customizable',
      label: nodeTemplate.label,
      role: nodeTemplate.role,
      description: nodeTemplate.description,
      apiEndpoint: nodeTemplate.apiEndpoint,
      icon: nodeTemplate.icon,
      iconColor: nodeTemplate.iconColor
    };
  });
  
  // Step 4: Create edges (connections between nodes)
  const edges = generateEdges(nodes);
  
  // Step 5: Generate intelligent configurations for each node
  const configs = generateNodeConfigurations(nodes, analysis);
  
  // Step 6: Generate workflow name and description
  const workflowInfo = generateWorkflowInfo(analysis, optimalNodes);
  
  return {
    name: workflowInfo.name,
    description: workflowInfo.description,
    nodes,
    edges,
    configs
  };
}

/**
 * Generate workflow name and description based on analysis and selected nodes
 */
function generateWorkflowInfo(analysis: any, nodes: any[]) {
  const locationStr = analysis.locations.length > 0 ? ` (${analysis.locations.join(', ')})` : '';
  const nodeTypes = nodes.map(n => n.label).join(' + ');
  
  // Create descriptive name based on domain and nodes
  let name = '';
  let description = '';
  
  switch (analysis.domain) {
    case 'property':
      name = `Real Estate Analysis${locationStr}`;
      description = `Intelligent real estate market analysis and investment evaluation using DSPy-optimized agents`;
      break;
    case 'finance':
      name = 'Financial Intelligence System';
      description = 'Self-optimizing financial analysis with investment insights and risk assessment';
      break;
    case 'market_research':
      name = 'Market Intelligence Platform';
      description = 'AI-powered market research with self-optimizing trend analysis';
      break;
    case 'marketing':
      name = 'Marketing Automation Engine';
      description = 'Content generation and campaign optimization workflow';
      break;
    case 'customer_service':
      name = 'Customer Support AI';
      description = 'Intelligent customer inquiry handling and response system';
      break;
    case 'legal':
      name = `Legal Research Assistant${locationStr}`;
      description = `Automated legal research and compliance analysis`;
      break;
    case 'healthcare':
      name = 'Healthcare Intelligence System';
      description = 'Medical research and patient data analysis workflow';
      break;
    case 'technology':
      name = 'Tech Intelligence Platform';
      description = 'Software development and technology trend analysis';
      break;
    case 'business_planning':
      name = 'Business Strategy Platform';
      description = 'Comprehensive business planning and strategic development system';
      break;
    default:
      // Generate a descriptive name from the request
      if (nodes.length > 0 && nodes[0].role) {
        const mainRole = nodes.find(n => n.stage === 'analysis' || n.stage === 'strategy')?.role || nodes[0].role;
        name = `${mainRole} System`;
        description = `Multi-stage intelligent workflow for ${analysis.domain || 'specialized tasks'}`;
      } else {
        name = 'Intelligent AI Workflow';
        description = `Custom AI workflow: ${nodeTypes}`;
      }
  }
  
  // Add "powered by DSPy" if using DSPy nodes
  const usesDSPy = nodes.some(n => n.label && n.label.includes('DSPy'));
  if (usesDSPy && !description.includes('DSPy')) {
    description += ' (Powered by DSPy self-optimization)';
  }
  
  return { name, description };
}

/**
 * Analyze user intent to understand what they want to build
 */
function analyzeUserIntent(request: string) {
  const analysis: any = {
    domain: 'general',
    purpose: '',
    locations: [],
    specializations: [],
    outputType: 'analysis',
    complexity: 'medium',
    requiresWebSearch: false,
    requiresLegalAdvice: false,
    requiresEmailGeneration: false,
    requiresDataAnalysis: false
  };
  
  // Detect domain/industry (order matters - most specific first)
  // Business & Strategy Planning (check first before customer service catches "help")
  if (request.includes('business') && request.includes('plan')) {
    analysis.domain = 'business_planning';
  } else if (request.includes('property') || request.includes('real estate') || request.includes('housing')) {
    analysis.domain = 'property';
    if (request.includes('legal') || request.includes('law') || request.includes('co-ownership') || request.includes('condo')) {
      analysis.specializations.push('legal');
      analysis.requiresLegalAdvice = true;
    }
    if (request.includes('manage') || request.includes('tenant') || request.includes('maintenance')) {
      analysis.specializations.push('management');
    }
  } else if (request.includes('marketing') || request.includes('social media') || request.includes('content creation') || request.includes('campaign') || request.includes('brand')) {
    analysis.domain = 'marketing';
  } else if (request.includes('customer service') || request.includes('customer support') || request.includes('help desk') || 
             (request.includes('support') && !request.includes('help me'))) {
    analysis.domain = 'customer_service';
  } else if (request.includes('finance') || request.includes('investment') || request.includes('trading') || request.includes('stock') || request.includes('portfolio')) {
    analysis.domain = 'finance';
    analysis.requiresDataAnalysis = true;
  } else if (request.includes('legal') || request.includes('law') || request.includes('regulation') || request.includes('compliance')) {
    analysis.domain = 'legal';
    analysis.requiresLegalAdvice = true;
  } else if (request.includes('medical') || request.includes('healthcare') || request.includes('health') || request.includes('patient')) {
    analysis.domain = 'healthcare';
  } else if (request.includes('tech') || request.includes('software') || request.includes('code') || request.includes('development')) {
    analysis.domain = 'technology';
  } else if (request.includes('market') || request.includes('business') || request.includes('industry') || request.includes('competitive')) {
    analysis.domain = 'market_research';
    analysis.requiresWebSearch = true;
  }
  
  // Detect locations for geo-specific advice
  const locationPatterns = [
    { pattern: /(quebec|québec|qc)/i, location: 'Quebec' },
    { pattern: /montreal/i, location: 'Montreal' },
    { pattern: /miami/i, location: 'Miami' },
    { pattern: /new york|nyc/i, location: 'New York' },
    { pattern: /(toronto|ontario)/i, location: 'Toronto' },
    { pattern: /(vancouver|bc)/i, location: 'Vancouver' }
  ];
  
  locationPatterns.forEach(({ pattern, location }) => {
    if (pattern.test(request)) {
      analysis.locations.push(location);
    }
  });
  
  // Detect if web search is needed
  if (request.includes('research') || request.includes('find') || request.includes('search') || 
      request.includes('latest') || request.includes('current') || request.includes('trend')) {
    analysis.requiresWebSearch = true;
  }
  
  // Detect if email generation is needed
  if (request.includes('email') || request.includes('respond') || request.includes('reply') || 
      request.includes('communication') || request.includes('message')) {
    analysis.requiresEmailGeneration = true;
  }
  
  // Detect if data analysis is needed
  if (request.includes('analyze') || request.includes('data') || request.includes('metrics') || 
      request.includes('statistics') || request.includes('report')) {
    analysis.requiresDataAnalysis = true;
  }
  
  // Detect if CEL/data manipulation is needed
  if (request.includes('transform') || request.includes('calculate') || request.includes('expression') || 
      request.includes('conditional') || request.includes('route') || request.includes('state') ||
      request.includes('variables') || request.includes('logic') || request.includes('cel')) {
    analysis.requiresDataTransformation = true;
  }
  
  // Determine output type
  if (request.includes('report')) analysis.outputType = 'report';
  else if (request.includes('email')) analysis.outputType = 'email';
  else if (request.includes('summary')) analysis.outputType = 'summary';
  else if (request.includes('recommendation')) analysis.outputType = 'recommendation';
  else if (request.includes('advice')) analysis.outputType = 'advice';
  
  // Determine complexity based on multiple factors
  const complexityFactors = [
    analysis.requiresWebSearch,
    analysis.requiresLegalAdvice,
    analysis.requiresEmailGeneration,
    analysis.requiresDataAnalysis,
    analysis.locations.length > 0,
    analysis.specializations.length > 1
  ].filter(Boolean).length;
  
  if (complexityFactors >= 4) analysis.complexity = 'high';
  else if (complexityFactors >= 2) analysis.complexity = 'medium';
  else analysis.complexity = 'simple';
  
  return analysis;
}

/**
 * Plan the workflow structure based on analysis
 */
function planWorkflowStructure(analysis: any, request: string) {
  const plan: any = {
    name: 'AI Workflow',
    description: 'Custom AI workflow',
    stages: []
  };
  
  // Generate workflow name and description based on domain and purpose
  const locationStr = analysis.locations.length > 0 ? ` (${analysis.locations.join(', ')})` : '';
  
  switch (analysis.domain) {
    case 'property':
      if (analysis.specializations.includes('legal')) {
        plan.name = `Property Legal Assistant${locationStr}`;
        plan.description = `Legal guidance and property management operations${locationStr ? ' for ' + analysis.locations.join(', ') : ''}`;
      } else {
        plan.name = `Property Management Workflow${locationStr}`;
        plan.description = `Complete property management and tenant relations system`;
      }
      break;
    case 'finance':
      plan.name = 'Financial Analysis Workflow';
      plan.description = 'Investment analysis and financial decision support system';
      break;
    case 'market_research':
      plan.name = 'Market Intelligence System';
      plan.description = 'Market research and competitive analysis workflow';
      break;
    case 'legal':
      plan.name = `Legal Advisory System${locationStr}`;
      plan.description = `Legal research and advice${locationStr ? ' for ' + analysis.locations.join(', ') : ''}`;
      break;
    case 'marketing':
      plan.name = 'Marketing Automation Workflow';
      plan.description = 'Content creation and marketing campaign management';
      break;
    case 'customer_service':
      plan.name = 'Customer Support Assistant';
      plan.description = 'Intelligent customer inquiry handling and response system';
      break;
    case 'healthcare':
      plan.name = 'Healthcare Research Assistant';
      plan.description = 'Medical research and healthcare analysis workflow';
      break;
    case 'technology':
      plan.name = 'Tech Research & Development';
      plan.description = 'Technology research and software development insights';
      break;
    default:
      plan.name = 'Custom AI Assistant';
      plan.description = 'Intelligent multi-stage workflow for your specific needs';
  }
  
  // Define workflow stages based on requirements
  if (analysis.requiresWebSearch) {
    plan.stages.push({
      role: 'Web Researcher',
      purpose: 'Gather real-time information and current data',
      endpoint: 'web_search'
    });
  }
  
  // Add domain-specific processing stages
  if (analysis.requiresLegalAdvice) {
    plan.stages.push({
      role: `Legal Expert${analysis.locations.length > 0 ? ' (' + analysis.locations[0] + ')' : ''}`,
      purpose: `Provide legal analysis and regulatory guidance${analysis.locations.length > 0 ? ' specific to ' + analysis.locations[0] : ''}`,
      endpoint: 'ai_agent'
    });
  }
  
  if (analysis.domain === 'property' && analysis.specializations.includes('management')) {
    plan.stages.push({
      role: `Property Manager${analysis.locations.length > 0 ? ' (' + analysis.locations[0] + ')' : ''}`,
      purpose: 'Property management operations and tenant relations',
      endpoint: 'ai_agent'
    });
  } else if (analysis.domain === 'finance') {
    plan.stages.push({
      role: 'Financial Analyst',
      purpose: 'Financial analysis and investment evaluation',
      endpoint: 'ai_agent'
    });
  } else if (analysis.domain === 'market_research') {
    plan.stages.push({
      role: 'Market Analyst',
      purpose: 'Market trend analysis and competitive intelligence',
      endpoint: 'ai_agent'
    });
  } else if (analysis.domain === 'marketing') {
    plan.stages.push({
      role: 'Marketing Strategist',
      purpose: 'Marketing strategy and campaign planning',
      endpoint: 'ai_agent'
    });
  } else if (analysis.domain === 'customer_service') {
    plan.stages.push({
      role: 'Customer Support Specialist',
      purpose: 'Customer inquiry analysis and response formulation',
      endpoint: 'ai_agent'
    });
  } else if (analysis.domain === 'healthcare') {
    plan.stages.push({
      role: 'Healthcare Researcher',
      purpose: 'Medical research and healthcare data analysis',
      endpoint: 'ai_agent'
    });
  } else if (analysis.domain === 'technology') {
    plan.stages.push({
      role: 'Tech Analyst',
      purpose: 'Technology research and development insights',
      endpoint: 'ai_agent'
    });
  } else {
    // Generic analysis stage
    plan.stages.push({
      role: 'AI Analyst',
      purpose: 'Comprehensive analysis and insights generation',
      endpoint: 'ai_agent'
    });
  }
  
  // Add data analysis if needed
  if (analysis.requiresDataAnalysis && !plan.stages.some((s: any) => s.role.includes('Analyst'))) {
    plan.stages.push({
      role: 'Data Analyst',
      purpose: 'Statistical analysis and data interpretation',
      endpoint: 'data_processor'
    });
  }
  
  // Add CEL/data transformation stages if needed
  if (analysis.requiresDataTransformation) {
    if (request.includes('transform') || request.includes('calculate')) {
      plan.stages.push({
        role: 'Data Transformer',
        purpose: 'Transform and manipulate data using expressions',
        endpoint: 'data_transformer'
      });
    }
    
    if (request.includes('conditional') || request.includes('route') || request.includes('if')) {
      plan.stages.push({
        role: 'Conditional Router',
        purpose: 'Route workflow based on conditions and logic',
        endpoint: 'conditional_router'
      });
    }
    
    if (request.includes('state') || request.includes('variables') || request.includes('global')) {
      plan.stages.push({
        role: 'State Manager',
        purpose: 'Manage global state and variables across workflow',
        endpoint: 'state_manager'
      });
    }
    
    // Generic CEL expression stage if no specific type detected
    if (!request.includes('transform') && !request.includes('conditional') && !request.includes('state')) {
      plan.stages.push({
        role: 'CEL Expression Evaluator',
        purpose: 'Execute Common Expression Language expressions',
        endpoint: 'cel_expression'
      });
    }
  }
  
  // Add output generation stage based on output type
  if (analysis.requiresEmailGeneration || analysis.outputType === 'email') {
    plan.stages.push({
      role: 'Communication Specialist',
      purpose: 'Professional email and communication drafting',
      endpoint: 'ai_agent'
    });
  } else if (analysis.outputType === 'report') {
    plan.stages.push({
      role: 'Report Generator',
      purpose: 'Comprehensive report compilation and formatting',
      endpoint: 'data_processor'
    });
  } else {
    // Generic synthesis stage
    plan.stages.push({
      role: 'Insight Synthesizer',
      purpose: 'Synthesize findings into actionable insights',
      endpoint: 'ai_agent'
    });
  }
  
  // Ensure minimum 2 stages for meaningful workflow
  if (plan.stages.length < 2) {
    plan.stages.unshift({
      role: 'Information Gatherer',
      purpose: 'Collect and organize relevant information',
      endpoint: 'ai_agent'
    });
  }
  
  return plan;
}

/**
 * Generate adaptive nodes based on workflow plan
 */
function generateAdaptiveNodes(plan: any, analysis: any) {
  return plan.stages.map((stage: any, index: number) => {
    const nodeId = `node-${index + 1}`;
    const icon = determineNodeIcon(stage.role);
    
    return {
      id: nodeId,
      type: 'customizable',
      label: stage.role,
      role: stage.role,
      description: stage.purpose,
      apiEndpoint: stage.endpoint || '/api/agent/chat',
      icon: icon.icon,
      iconColor: icon.color
    };
  });
}

/**
 * Determine appropriate icon based on role keywords
 */
function determineNodeIcon(role: string): { icon: string; color: string } {
  const roleLower = role.toLowerCase();
  
  for (const [keyword, iconConfig] of Object.entries(ROLE_ICONS)) {
    if (roleLower.includes(keyword)) {
      return iconConfig;
    }
  }
  
  return ROLE_ICONS.default;
}

/**
 * Generate edges (connections) between nodes
 */
function generateEdges(nodes: any[]) {
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${i + 1}`,
      source: nodes[i].id,
      target: nodes[i + 1].id
    });
  }
  return edges;
}

/**
 * Generate intelligent node configurations with dynamic system prompts
 */
function generateNodeConfigurations(nodes: any[], analysis: any) {
  const configs: Record<string, any> = {};
  
  nodes.forEach((node, index) => {
    const nodeId = node.id;
    const isFirstNode = index === 0;
    const isLastNode = index === nodes.length - 1;
    const previousNode = index > 0 ? nodes[index - 1] : null;
    const nextNode = index < nodes.length - 1 ? nodes[index + 1] : null;
    
    // Generate dynamic system prompt based on role, position, and context
    const systemPrompt = generateSystemPrompt(node, analysis, {
      isFirst: isFirstNode,
      isLast: isLastNode,
      previous: previousNode,
      next: nextNode
    });
    
    configs[nodeId] = {
      query: generateDefaultQuery(node, analysis),
      useRealAI: true,
      systemPrompt: systemPrompt,
      preferredModel: 'gemma-3',
      role: node.role,
      context: {
        domain: analysis.domain,
        locations: analysis.locations,
        outputType: analysis.outputType,
        position: index + 1,
        totalNodes: nodes.length
      }
    };
    
    // Special configuration for DSPy nodes
    if (node.apiEndpoint === '/api/dspy/execute') {
      // Extract moduleName from the node config
      const nodeTemplate = Object.values(TOOL_LIBRARY).find(n => n.label === node.label);
      if (nodeTemplate && 'config' in nodeTemplate && nodeTemplate.config) {
        configs[nodeId].moduleName = nodeTemplate.config.moduleName;
        configs[nodeId].optimize = nodeTemplate.config.optimize;
      }
      // Override query with proper analysis query (not CEL expression)
      configs[nodeId].query = `${node.role} ${analysis.outputType} for ${analysis.domain}${analysis.locations.length > 0 ? ' in ' + analysis.locations.join(' and ') : ''}`;
    }
    
    // Special configuration for web search nodes
    if (node.apiEndpoint === '/api/perplexity/chat') {
      configs[nodeId].searchQuery = generateSearchQuery(analysis);
      configs[nodeId].query = generateSearchQuery(analysis);
    }
    
    // Special configuration for CEL nodes
    if (node.apiEndpoint === '/api/cel/execute') {
      configs[nodeId].expression = generateDefaultQuery(node, analysis);
      configs[nodeId].variables = {};
      configs[nodeId].state = {};
      
      // Add domain-specific CEL expressions
      if (analysis.domain === 'property') {
        configs[nodeId].expression = `input.property_value * 1.15`; // Property value calculation
        configs[nodeId].variables = { tax_rate: 0.15, location_multiplier: 1.0 };
      } else if (analysis.domain === 'finance') {
        configs[nodeId].expression = `(input.return_rate * 100) - input.risk_score`; // Investment score
        configs[nodeId].variables = { risk_threshold: 0.7, return_target: 0.12 };
      } else if (analysis.domain === 'marketing') {
        configs[nodeId].expression = `input.engagement_score * input.reach_score`; // Marketing effectiveness
        configs[nodeId].variables = { engagement_weight: 0.6, reach_weight: 0.4 };
      }
    }
  });
  
  return configs;
}

/**
 * Generate dynamic system prompt based on node role and context
 */
function generateSystemPrompt(node: any, analysis: any, position: any): string {
  const locationContext = analysis.locations.length > 0 
    ? ` You specialize in ${analysis.locations.join(' and ')} regulations and practices.` 
    : '';
  
  const role = node.role.toLowerCase();
  
  // Build context-aware prompt
  let prompt = `You are a ${node.role}.`;
  
  // Add role-specific expertise
  if (role.includes('legal')) {
    prompt += ` You provide accurate legal analysis and regulatory guidance based on current laws and regulations.${locationContext}`;
    if (analysis.domain === 'property') {
      prompt += ` You specialize in property law, co-ownership regulations, and landlord-tenant relations.`;
    }
  } else if (role.includes('property manager')) {
    prompt += ` You provide professional property management advice, handle tenant relations, and ensure building operations comply with local regulations.${locationContext}`;
  } else if (role.includes('financial') || role.includes('investment')) {
    prompt += ` You provide expert financial analysis, investment evaluation, and risk assessment.`;
  } else if (role.includes('market')) {
    prompt += ` You analyze market trends, competitive landscapes, and business opportunities.`;
  } else if (role.includes('marketing')) {
    prompt += ` You develop marketing strategies, create campaigns, and optimize brand presence.`;
  } else if (role.includes('customer') || role.includes('support')) {
    prompt += ` You handle customer inquiries professionally, provide helpful solutions, and maintain positive customer relationships.`;
  } else if (role.includes('researcher') || role.includes('research')) {
    prompt += ` You conduct thorough research, analyze information, and provide evidence-based insights.`;
  } else if (role.includes('communication') || role.includes('email')) {
    prompt += ` You write clear, professional, and effective communications.${locationContext}`;
  } else if (role.includes('cel') || role.includes('expression')) {
    prompt += ` You execute Common Expression Language (CEL) expressions to manipulate data, perform calculations, and manage workflow state. You handle data transformation, conditional logic, and variable management.`;
  } else if (role.includes('transform') || role.includes('data transformer')) {
    prompt += ` You transform and manipulate data between workflow nodes using expressions and calculations. You ensure data integrity and proper formatting.`;
  } else if (role.includes('conditional') || role.includes('router')) {
    prompt += ` You evaluate conditions and route workflow execution based on data values and business logic. You make intelligent routing decisions.`;
  } else if (role.includes('state') || role.includes('manager')) {
    prompt += ` You manage global state and variables across the entire workflow. You maintain persistent data and enable cross-node communication.`;
  }
  
  // Add position context
  if (position.isFirst) {
    prompt += ` As the first step in this workflow, you set the foundation by gathering and organizing key information.`;
  } else if (position.isLast) {
    prompt += ` As the final step, you synthesize all previous analysis into ${analysis.outputType === 'email' ? 'a professional email' : analysis.outputType === 'report' ? 'a comprehensive report' : 'clear, actionable insights'}.`;
  } else {
    prompt += ` You build upon the findings from the ${position.previous?.role} and prepare insights for the ${position.next?.role}.`;
  }
  
  // Add output expectations
  prompt += ` Provide detailed, professional, and actionable ${analysis.outputType}.`;
  
  return prompt;
}

/**
 * Generate default query for node
 */
function generateDefaultQuery(node: any, analysis: any): string {
  const locationStr = analysis.locations.length > 0 ? ` in ${analysis.locations.join(' and ')}` : '';
  
  // CEL-specific query generation
  if (node.role.toLowerCase().includes('cel') || node.role.toLowerCase().includes('expression')) {
    return `input.score * 100`; // Default CEL expression
  } else if (node.role.toLowerCase().includes('transform')) {
    return `input.processed = input.raw * 1.1; input.status = "transformed"`;
  } else if (node.role.toLowerCase().includes('conditional') || node.role.toLowerCase().includes('router')) {
    return `input.score > 0.7 ? "high_priority" : "normal_priority"`;
  } else if (node.role.toLowerCase().includes('state') || node.role.toLowerCase().includes('manager')) {
    return `state.workflow_status = "active"; state.domain = "${analysis.domain}"; state.timestamp = now()`;
  }
  
  return `${node.role} analysis for ${analysis.domain}${locationStr}`;
}

/**
 * Generate optimized search query for web research
 */
function generateSearchQuery(analysis: any): string {
  const components = [];
  
  components.push(analysis.domain);
  
  if (analysis.locations.length > 0) {
    components.push(analysis.locations[0]);
  }
  
  if (analysis.specializations.length > 0) {
    components.push(analysis.specializations.join(' '));
  }
  
  if (analysis.requiresLegalAdvice) {
    components.push('regulations laws');
  }
  
  components.push('current trends');
  
  return components.join(' ');
}

/**
 * Check if clarification is needed - VERY PERMISSIVE
 */
function shouldAskForClarification(userRequest: string, conversationHistory: any[]): boolean {
  const request = userRequest.toLowerCase().trim();
  
  console.log('  🔍 shouldAskForClarification called');
  console.log('  📏 Request length:', request.length);
  console.log('  📊 Word count:', request.split(' ').length);
  
  // Only ask for clarification if request is extremely short or completely empty
  if (request.length < 10) {
    console.log('  ❌ Too short (< 10 chars)');
    return true;
  }
  if (request.split(' ').length < 3) {
    console.log('  ❌ Too few words (< 3 words)');
    return true;
  }
  
  // Check for completely vague requests only
  const extremelyVague = ['help', 'what', 'how', '?', 'workflow', 'agent', 'ai'];
  const isExtremelyVague = extremelyVague.some(vague => 
    request === vague || request === `${vague}?` || request === `${vague} `
  );
  
  if (isExtremelyVague) {
    console.log('  ❌ Extremely vague (single word request)');
    return true;
  }
  
  // If we get here, the request has enough content to work with
  // Let the AI figure out what to build - that's the whole point!
  console.log('  ✅ Request has sufficient detail');
  return false;
}

/**
 * Generate clarifying questions
 */
function generateClarifyingQuestions(userRequest: string): string {
  return `I'd love to help you build a custom workflow! To create the perfect system for you, could you provide more details?\n\n**Please describe:**\n\n1. **What's your main goal?** (e.g., "analyze real estate markets", "manage property tenants", "generate marketing content")\n\n2. **What specific tasks do you need?** (e.g., "legal advice", "email responses", "data analysis")\n\n3. **Any specific location or industry?** (e.g., "Quebec real estate", "US stock market", "healthcare")\n\n**Example requests:**\n- "Property management in Montreal with legal advice for co-ownership and email drafting"\n- "Financial portfolio analysis with risk assessment and investment recommendations"\n- "Marketing content creation for social media with campaign planning"\n\n**What would you like your workflow to do?**`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userRequest, conversationHistory = [] } = body;
    
    if (!userRequest || typeof userRequest !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userRequest parameter' },
        { status: 400 }
      );
    }
    
    // Check if we need clarification
    console.log('');
    console.log('='.repeat(80));
    console.log('🔍 CLARIFICATION CHECK START');
    console.log('='.repeat(80));
    console.log('📥 User Request:', userRequest);
    console.log('📏 Request Length:', userRequest.length);
    console.log('📊 Word Count:', userRequest.split(' ').length);
    console.log('🔤 Lowercase Request:', userRequest.toLowerCase().trim());
    
    const needsClarification = shouldAskForClarification(userRequest, conversationHistory);
    
    console.log('❓ Needs Clarification Result:', needsClarification);
    console.log('='.repeat(80));
    console.log('');
    
    if (needsClarification) {
      console.log('❌ RETURNING CLARIFICATION REQUEST');
      return NextResponse.json({
        needsClarification: true,
        message: generateClarifyingQuestions(userRequest)
      });
    }
    
    console.log('✅ REQUEST APPROVED - GENERATING WORKFLOW');
    
    // Generate intelligent workflow (now with LLM planning!)
    console.log('🔍 Processing request:', userRequest);
    const recommendation = await generateIntelligentWorkflow(userRequest, conversationHistory);
    console.log('✅ Generated workflow:', recommendation.name);
    console.log('📋 Nodes:', recommendation.nodes.map(n => n.label).join(' → '));
    
    return NextResponse.json({ recommendation });
    
  } catch (error) {
    console.error('Error in agent-builder/create:', error);
    return NextResponse.json(
      { error: 'Failed to generate workflow recommendation' },
      { status: 500 }
    );
  }
}
