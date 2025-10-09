import { NextRequest, NextResponse } from 'next/server';

/**
 * AGENT CHAT WITH TOOL-BASED HANDOFFS
 * Implements Vercel AI SDK style agent switching via tools
 * 
 * How it works:
 * 1. AgentA has tools: [switchToAgentB, switchToAgentC]
 * 2. AgentA calls: switchToAgentB({ reason: "Need financial expertise" })
 * 3. prepareStep detects tool call
 * 4. System switches: prompt → AgentB prompt, tools → AgentB tools
 * 5. AgentB continues the conversation
 */

// Import AGENT_REGISTRY (would need to be exported from agents/route.ts)
// For now, define minimal registry here
const AGENT_TOOLS = {
  webSearchAgent: {
    name: 'Web Search Agent',
    systemPrompt: `You are a web research specialist. Your job is to gather current, accurate information from the web.

After gathering data, you can delegate to specialists:
- If market analysis is needed, call switchToMarketAnalyzer
- If financial calculations are needed, call switchToFinancialAnalyst
- If real estate expertise is needed, call switchToRealEstateAgent

Always explain what you found before delegating.`,
    
    tools: {
      switchToMarketAnalyzer: {
        description: 'Delegate to market analysis specialist for deep competitive intelligence',
        targetAgent: 'dspyMarketAgent',
        parameters: {
          data: 'string - The market data to analyze',
          focusArea: 'string - What aspect to focus on'
        }
      },
      switchToFinancialAnalyst: {
        description: 'Delegate to financial specialist for ROI and financial analysis',
        targetAgent: 'dspyFinancialAgent',
        parameters: {
          data: 'string - The financial data to analyze',
          goal: 'string - Investment goal or question'
        }
      },
      switchToRealEstateAgent: {
        description: 'Delegate to real estate specialist for property analysis',
        targetAgent: 'dspyRealEstateAgent',
        parameters: {
          propertyData: 'string - Property information',
          investmentType: 'string - buy, sell, rent, etc'
        }
      }
    }
  },
  
  dspyMarketAgent: {
    name: 'DSPy Market Analyzer',
    systemPrompt: `You are a market intelligence specialist using self-optimizing DSPy algorithms.

After analysis, you can:
- Call switchToInvestmentReport to generate a formal report
- Call switchToDataSynthesizer to combine with other data sources

Provide deep market insights using competitive intelligence frameworks.`,
    
    tools: {
      switchToInvestmentReport: {
        description: 'Generate formal investment report from analysis',
        targetAgent: 'dspyInvestmentReportAgent',
        parameters: {
          analysis: 'string - Market analysis results',
          recommendations: 'string - Key recommendations'
        }
      },
      switchToDataSynthesizer: {
        description: 'Combine market analysis with other data sources',
        targetAgent: 'dspyDataSynthesizer',
        parameters: {
          marketData: 'string - Market analysis',
          additionalSources: 'string[] - Other data to merge'
        }
      }
    }
  },
  
  dspyFinancialAgent: {
    name: 'DSPy Financial Analyst',
    systemPrompt: `You are a financial modeling expert using self-optimizing DSPy algorithms.

After financial analysis, you can:
- Call switchToInvestmentReport to create detailed investment recommendations
- Call switchToLegalAgent if regulatory/compliance review is needed

Focus on ROI, risk assessment, and financial projections.`,
    
    tools: {
      switchToInvestmentReport: {
        description: 'Generate comprehensive investment report',
        targetAgent: 'dspyInvestmentReportAgent',
        parameters: {
          financialAnalysis: 'string - Financial analysis results',
          riskAssessment: 'string - Risk evaluation'
        }
      }
    }
  },
  
  dspyRealEstateAgent: {
    name: 'DSPy Real Estate Agent',
    systemPrompt: `You are a real estate specialist using self-optimizing DSPy algorithms.

After property analysis, you can:
- Call switchToFinancialAnalyst for ROI and financing analysis
- Call switchToInvestmentReport for formal recommendations

Provide detailed property valuations and investment potential.`,
    
    tools: {
      switchToFinancialAnalyst: {
        description: 'Analyze financial aspects of real estate investment',
        targetAgent: 'dspyFinancialAgent',
        parameters: {
          propertyFinancials: 'string - Property financial data',
          investmentScenario: 'string - Investment scenario to analyze'
        }
      },
      switchToInvestmentReport: {
        description: 'Generate real estate investment report',
        targetAgent: 'dspyInvestmentReportAgent',
        parameters: {
          propertyAnalysis: 'string - Property analysis results'
        }
      }
    }
  }
};

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const { 
      messages, 
      currentAgent = 'webSearchAgent',
      conversationHistory = []
    } = await req.json();
    
    // Get current agent config
    let agentConfig = AGENT_TOOLS[currentAgent as keyof typeof AGENT_TOOLS];
    
    if (!agentConfig) {
      return NextResponse.json(
        { error: `Agent ${currentAgent} not found` },
        { status: 404 }
      );
    }
    
    // Build messages with current agent's system prompt
    const fullMessages: Message[] = [
      {
        role: 'system',
        content: agentConfig.systemPrompt
      },
      ...conversationHistory,
      ...messages
    ];
    
    // Call LLM with tools available
    // For now, we'll simulate tool detection
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Simple tool detection (real implementation would parse LLM response)
    let toolCall: { name: string; args: any; targetAgent: string } | null = null;
    
    for (const [toolName, tool] of Object.entries(agentConfig.tools || {})) {
      // Check if user message suggests this tool should be called
      const shouldSwitch = 
        userMessage.toLowerCase().includes('switch to') ||
        userMessage.toLowerCase().includes('delegate to') ||
        userMessage.toLowerCase().includes('hand off') ||
        userMessage.toLowerCase().includes('need') && userMessage.toLowerCase().includes(tool.targetAgent.toLowerCase());
      
      if (shouldSwitch) {
        toolCall = {
          name: toolName,
          args: { reason: userMessage, data: userMessage },
          targetAgent: tool.targetAgent
        };
        break;
      }
    }
    
    // If tool was called, prepare for agent switch
    if (toolCall) {
      const nextAgentConfig = AGENT_TOOLS[toolCall.targetAgent as keyof typeof AGENT_TOOLS];
      
      return NextResponse.json({
        success: true,
        message: `Switching from ${agentConfig.name} to ${nextAgentConfig.name}`,
        toolCall: {
          name: toolCall.name,
          targetAgent: toolCall.targetAgent,
          reason: toolCall.args.reason
        },
        nextAgent: {
          key: toolCall.targetAgent,
          name: nextAgentConfig.name,
          systemPrompt: nextAgentConfig.systemPrompt,
          tools: Object.keys(nextAgentConfig.tools || {})
        },
        // prepareStep: Update for next turn
        prepareNextStep: {
          currentAgent: toolCall.targetAgent,
          prompt: nextAgentConfig.systemPrompt,
          availableTools: nextAgentConfig.tools
        }
      });
    }
    
    // No tool call - regular response
    // Call the appropriate API based on agent type
    let apiResponse;
    
    if (currentAgent.startsWith('dspy')) {
      // Use Ax DSPy
      apiResponse = await fetch('http://localhost:3000/api/ax-dspy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: getModuleName(currentAgent),
          inputs: { query: userMessage, context: conversationHistory },
          provider: 'ollama',
          optimize: false
        })
      });
    } else {
      // Use regular agent chat
      apiResponse = await fetch('http://localhost:3000/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: fullMessages
        })
      });
    }
    
    const responseData = await apiResponse.json();
    
    return NextResponse.json({
      success: true,
      response: responseData.response || responseData.outputs?.analysis || 'Analysis complete',
      currentAgent,
      availableTools: Object.keys(agentConfig.tools || {}),
      conversationHistory: [
        ...conversationHistory,
        ...messages,
        {
          role: 'assistant',
          content: responseData.response || responseData.outputs?.analysis || 'Analysis complete'
        }
      ]
    });
    
  } catch (error: any) {
    console.error('❌ Agent chat with tools error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function getModuleName(agentKey: string): string {
  const moduleMap: Record<string, string> = {
    dspyMarketAgent: 'market_research_analyzer',
    dspyRealEstateAgent: 'real_estate_agent',
    dspyFinancialAgent: 'financial_analyst',
    dspyInvestmentReportAgent: 'investment_report_generator',
    dspyDataSynthesizer: 'data_synthesizer'
  };
  return moduleMap[agentKey] || 'market_research_analyzer';
}

