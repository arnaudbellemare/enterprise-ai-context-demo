import { NextRequest, NextResponse } from 'next/server';
import { prepareStep, createHandoffTool, type AgentConfig, type ConversationState } from '@/lib/tool-based-handoff';

/**
 * STATEFUL AGENT CHAT WITH TOOL-BASED HANDOFFS
 * 
 * This is a COMPLETE implementation showing how tool-based handoffs work
 * 
 * Flow:
 * 1. User message arrives
 * 2. prepareStep() checks if last response had a tool call
 * 3. If yes → switch agent (update systemPrompt + tools)
 * 4. If no → continue with current agent
 * 5. Call LLM with appropriate agent config
 * 6. If LLM calls switchToXAgent → next turn will trigger handoff
 */

// Full agent registry with handoff tools
const AGENT_REGISTRY: Record<string, AgentConfig> = {
  webSearchAgent: {
    key: 'webSearchAgent',
    name: 'Web Search Agent',
    systemPrompt: `You are a web research specialist. Your job is to gather current information.

AVAILABLE ACTIONS:
- Gather web data yourself
- Call switchToMarketAnalyzer if market analysis is needed
- Call switchToFinancialAnalyst if financial calculations are needed
- Call switchToRealEstateAgent if property analysis is needed

Format tool calls as: TOOL_CALL: switchToMarketAnalyzer { "reason": "...", "data": "..." }`,
    
    tools: {
      switchToMarketAnalyzer: createHandoffTool(
        'dspyMarketAgent',
        'Market Analyzer',
        'Delegate to market intelligence specialist for competitive analysis',
        { marketData: 'string - Market data gathered' }
      ),
      switchToFinancialAnalyst: createHandoffTool(
        'dspyFinancialAgent',
        'Financial Analyst',
        'Delegate to financial specialist for ROI/profit analysis',
        { financialData: 'string - Financial data gathered' }
      ),
      switchToRealEstateAgent: createHandoffTool(
        'dspyRealEstateAgent',
        'Real Estate Agent',
        'Delegate to real estate specialist for property analysis',
        { propertyData: 'string - Property information' }
      )
    },
    apiEndpoint: '/api/perplexity/chat',
    modelPreference: 'perplexity'
  },
  
  dspyMarketAgent: {
    key: 'dspyMarketAgent',
    name: 'DSPy Market Analyzer',
    systemPrompt: `You are a market intelligence specialist using self-optimizing algorithms.

AVAILABLE ACTIONS:
- Perform deep market analysis
- Call switchToInvestmentReport to generate formal recommendations
- Call switchToDataSynthesizer to merge with other data

Provide competitive intelligence and trend analysis.`,
    
    tools: {
      switchToInvestmentReport: createHandoffTool(
        'dspyInvestmentReportAgent',
        'Investment Report Generator',
        'Generate formal investment report from analysis',
        { analysis: 'string - Market analysis results' }
      ),
      switchToDataSynthesizer: createHandoffTool(
        'dspyDataSynthesizer',
        'Data Synthesizer',
        'Combine market analysis with other data sources',
        { marketData: 'string - Market analysis' }
      )
    },
    apiEndpoint: '/api/ax-dspy',
    modelPreference: 'local'
  },
  
  dspyFinancialAgent: {
    key: 'dspyFinancialAgent',
    name: 'DSPy Financial Analyst',
    systemPrompt: `You are a financial modeling expert using self-optimizing algorithms.

AVAILABLE ACTIONS:
- Calculate ROI, NPV, IRR
- Perform risk assessment
- Call switchToInvestmentReport for formal recommendations

Focus on financial metrics and investment returns.`,
    
    tools: {
      switchToInvestmentReport: createHandoffTool(
        'dspyInvestmentReportAgent',
        'Investment Report Generator',
        'Generate investment report with financial projections',
        { financialAnalysis: 'string - Financial results' }
      )
    },
    apiEndpoint: '/api/ax-dspy',
    modelPreference: 'local'
  },
  
  dspyRealEstateAgent: {
    key: 'dspyRealEstateAgent',
    name: 'DSPy Real Estate Agent',
    systemPrompt: `You are a real estate specialist using self-optimizing algorithms.

AVAILABLE ACTIONS:
- Analyze property values and potential
- Call switchToFinancialAnalyst for financing analysis
- Call switchToInvestmentReport for recommendations

Provide property valuations and investment insights.`,
    
    tools: {
      switchToFinancialAnalyst: createHandoffTool(
        'dspyFinancialAgent',
        'Financial Analyst',
        'Analyze financing and ROI for real estate',
        { propertyFinancials: 'string - Property financial data' }
      ),
      switchToInvestmentReport: createHandoffTool(
        'dspyInvestmentReportAgent',
        'Investment Report Generator',
        'Generate real estate investment report',
        { propertyAnalysis: 'string - Property analysis' }
      )
    },
    apiEndpoint: '/api/ax-dspy',
    modelPreference: 'local'
  },
  
  dspyInvestmentReportAgent: {
    key: 'dspyInvestmentReportAgent',
    name: 'DSPy Investment Report Generator',
    systemPrompt: `You are a report generation specialist. Create comprehensive, professional investment reports.

This is the FINAL step - provide actionable recommendations.`,
    
    tools: {}, // No handoffs - this is the final agent
    apiEndpoint: '/api/ax-dspy',
    modelPreference: 'local'
  },
  
  dspyDataSynthesizer: {
    key: 'dspyDataSynthesizer',
    name: 'DSPy Data Synthesizer',
    systemPrompt: `You are a data integration specialist. Merge insights from multiple sources into coherent analysis.`,
    
    tools: {
      switchToInvestmentReport: createHandoffTool(
        'dspyInvestmentReportAgent',
        'Investment Report Generator',
        'Generate report from synthesized data',
        { synthesizedData: 'string - Integrated analysis' }
      )
    },
    apiEndpoint: '/api/ax-dspy',
    modelPreference: 'local'
  }
};

export async function POST(req: NextRequest) {
  try {
    const { 
      message,
      state = {
        currentAgent: 'webSearchAgent',
        conversationHistory: [],
        context: {}
      }
    }: { 
      message: string; 
      state: ConversationState 
    } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: prepareStep - Check for handoffs and get agent config
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const { systemPrompt, tools, currentAgent } = prepareStep(state, AGENT_REGISTRY);
    
    const agentConfig = AGENT_REGISTRY[currentAgent];
    
    console.log(`🤖 Current Agent: ${agentConfig.name}`);
    console.log(`🔧 Available Tools: ${Object.keys(tools).join(', ')}`);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Call appropriate API based on agent type
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let response: string;
    let detectedToolCall: any = null;
    
    if (agentConfig.apiEndpoint === '/api/ax-dspy') {
      // DSPy agent
      const moduleName = getDSPyModuleName(currentAgent);
      const apiResponse = await fetch(`http://localhost:3000${agentConfig.apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName,
          inputs: { 
            query: message,
            context: state.conversationHistory.slice(-5) // Last 5 messages
          },
          provider: 'ollama',
          optimize: false
        })
      });
      
      const data = await apiResponse.json();
      response = data.outputs?.analysis || data.outputs?.report || 'Analysis complete';
      
    } else {
      // Regular agent (Perplexity, etc)
      const apiResponse = await fetch(`http://localhost:3000${agentConfig.apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          context: systemPrompt,
          useRealAI: true
        })
      });
      
      const data = await apiResponse.json();
      response = data.response || 'Response generated';
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Detect tool calls in response (simple regex for demo)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const toolCallPattern = /TOOL_CALL:\s*(\w+)\s*({[^}]+})/;
    const toolMatch = response.match(toolCallPattern);
    
    if (toolMatch) {
      const [_, toolName, argsJson] = toolMatch;
      try {
        const args = JSON.parse(argsJson);
        detectedToolCall = {
          id: `call_${Date.now()}`,
          function: {
            name: toolName,
            arguments: JSON.stringify(args)
          }
        };
      } catch (e) {
        console.warn('Failed to parse tool call args:', e);
      }
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Update conversation history
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    state.conversationHistory.push(
      { role: 'user', content: message },
      {
        role: 'assistant',
        content: response,
        ...(detectedToolCall ? { tool_calls: [detectedToolCall] } : {})
      }
    );
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Return response + updated state
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return NextResponse.json({
      success: true,
      response,
      currentAgent: agentConfig.name,
      currentAgentKey: currentAgent,
      availableTools: Object.keys(tools),
      toolCallDetected: !!detectedToolCall,
      toolCall: detectedToolCall,
      state, // Return updated state for next call
      hint: detectedToolCall 
        ? `🔀 Tool call detected! Next message will be handled by ${tools[detectedToolCall.function.name]?.targetAgent}` 
        : undefined
    });
    
  } catch (error: any) {
    console.error('❌ Stateful agent chat error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function getDSPyModuleName(agentKey: string): string {
  const moduleMap: Record<string, string> = {
    dspyMarketAgent: 'market_research_analyzer',
    dspyRealEstateAgent: 'real_estate_agent',
    dspyFinancialAgent: 'financial_analyst',
    dspyInvestmentReportAgent: 'investment_report_generator',
    dspyDataSynthesizer: 'data_synthesizer'
  };
  return moduleMap[agentKey] || 'market_research_analyzer';
}

