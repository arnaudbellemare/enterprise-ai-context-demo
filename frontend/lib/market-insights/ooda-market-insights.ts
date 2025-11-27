/**
 * OODA Loop Integration for Market Insights
 * 
 * Integrates OODA loop into market insights generation:
 * - Observe: Market conditions, price movements, news
 * - Orient: Understand trends, identify opportunities/threats
 * - Decide: Choose what insights to generate
 * - Act: Generate market pulse report
 */

import { OODALoop, type OODAState, type ObservationFn, type OrientationFn, type DecisionFn, type ActionFn } from '../ooda-loop';
import { marketInsightsService, type MarketInsightsConfig, type MarketInsightsResult } from './market-insights-service';
import { callPerplexityWithRateLimiting, type LLMMessage } from '../brain-skills/llm-helpers';

/**
 * Create OODA loop specifically for market insights generation
 */
export function createMarketInsightsOODA(config: MarketInsightsConfig): OODALoop {
  const agentId = `market-insights-${config.category}-${config.frequency}`;

  // OBSERVE: Gather market data and conditions
  const observationFn: ObservationFn = async (state) => {
    console.log('👁️  Observing market conditions...');
    
    const observationPrompt = `Observe current market conditions for ${config.category} collectibles.
    
What information do you need to observe?
- Current market prices and trends
- Recent sales and transactions
- Market sentiment and news
- Price indices and market indicators

Return structured observation data.`;

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a market observer specializing in collectibles. Observe and report current market conditions objectively.'
      },
      {
        role: 'user',
        content: observationPrompt
      }
    ];

    try {
      const llmResult = await callPerplexityWithRateLimiting(messages, {
        temperature: 0.3,
        maxTokens: 500,
        timeout: 30000
      });

      return {
        rawData: {
          category: config.category,
          frequency: config.frequency,
          timestamp: new Date().toISOString(),
          marketSnapshot: llmResult.content
        },
        processedData: {
          marketConditions: 'analyzing...',
          trends: [],
          sentiment: 'neutral'
        },
        sources: ['market-data', 'price-indices', 'news-feeds'],
        confidence: 0.8
      };
    } catch (error) {
      return {
        rawData: {
          category: config.category,
          frequency: config.frequency,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Observation failed'
        },
        processedData: {},
        sources: [],
        confidence: 0.3
      };
    }
  };

  // ORIENT: Process market information and understand context
  const orientationFn: OrientationFn = async (observation, previousState) => {
    console.log('🧭 Orienting to market context...');
    
    const orientationPrompt = `Orient yourself to the ${config.category} collectibles market based on this observation:

${JSON.stringify(observation.rawData, null, 2)}

Analyze:
- What patterns do you see?
- What threats or risks exist?
- What opportunities are present?
- What is the current market phase?

Return structured orientation with patterns, threats, and opportunities.`;

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a market analyst. Orient yourself to market conditions by identifying patterns, threats, and opportunities.'
      },
      {
        role: 'user',
        content: orientationPrompt
      }
    ];

    try {
      const llmResult = await callPerplexityWithRateLimiting(messages, {
        temperature: 0.4,
        maxTokens: 800,
        timeout: 30000
      });

      // Parse orientation from LLM response
      const orientationText = llmResult.content.toLowerCase();
      
      const patterns: string[] = [];
      if (orientationText.includes('bullish') || orientationText.includes('rising')) patterns.push('bullish-trend');
      if (orientationText.includes('bearish') || orientationText.includes('declining')) patterns.push('bearish-trend');
      if (orientationText.includes('volatile') || orientationText.includes('volatility')) patterns.push('high-volatility');
      if (orientationText.includes('stable') || orientationText.includes('consolidation')) patterns.push('stability');

      const threats: string[] = [];
      if (orientationText.includes('risk') || orientationText.includes('threat')) threats.push('market-risk');
      if (orientationText.includes('correction') || orientationText.includes('crash')) threats.push('correction-risk');
      if (orientationText.includes('liquidity')) threats.push('liquidity-risk');

      const opportunities: string[] = [];
      if (orientationText.includes('opportunity') || orientationText.includes('value')) opportunities.push('value-opportunity');
      if (orientationText.includes('momentum') || orientationText.includes('growth')) opportunities.push('momentum-opportunity');

      return {
        context: {
          marketState: patterns.includes('bullish-trend') ? 'bullish' : patterns.includes('bearish-trend') ? 'bearish' : 'neutral',
          volatility: patterns.includes('high-volatility') ? 'high' : 'moderate',
          trends: patterns
        },
        patterns,
        threats,
        opportunities,
        mentalModel: {
          marketPhase: 'analysis',
          confidence: 0.85,
          analysis: llmResult.content
        },
        confidence: 0.85
      };
    } catch (error) {
      return {
        context: {
          marketState: 'unknown',
          volatility: 'unknown',
          trends: []
        },
        patterns: [],
        threats: ['observation-failed'],
        opportunities: [],
        mentalModel: {
          marketPhase: 'error',
          confidence: 0.3
        },
        confidence: 0.3
      };
    }
  };

  // DECIDE: Choose what insights to generate
  const decisionFn: DecisionFn = async (orientation, previousState) => {
    console.log('🎯 Deciding on market insights to generate...');
    
    const decisionPrompt = `Based on this market orientation, decide what insights to generate:

Patterns: ${orientation.patterns.join(', ')}
Threats: ${orientation.threats.join(', ')}
Opportunities: ${orientation.opportunities.join(', ')}

What type of market insights report should be generated?
- Comprehensive analysis (if many patterns/threats/opportunities)
- Focused analysis (if specific trends)
- Quick update (if stable conditions)

Return decision with reasoning.`;

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a decision-maker for market insights generation. Choose the best type of report based on market conditions.'
      },
      {
        role: 'user',
        content: decisionPrompt
      }
    ];

    try {
      const llmResult = await callPerplexityWithRateLimiting(messages, {
        temperature: 0.3,
        maxTokens: 500,
        timeout: 30000
      });

      // Determine report type based on orientation
      const needsComprehensive = orientation.patterns.length > 2 || orientation.threats.length > 0 || orientation.opportunities.length > 0;
      const reportType = needsComprehensive ? 'comprehensive' : 'focused';

      const selectedOption = {
        id: `generate-${reportType}-insights`,
        description: `Generate ${reportType} market pulse report for ${config.category}`,
        expectedOutcome: 'Detailed market analysis with trends, items, and outlook',
        confidence: 0.9,
        risk: 0.2,
        cost: 0.1,
        priority: 1,
        type: 'generate-report',
        reasoning: llmResult.content.substring(0, 200)
      };

      return {
        selectedOption,
        options: [
          {
            id: 'comprehensive',
            description: 'Comprehensive report with all sections',
            expectedOutcome: 'Full market analysis',
            confidence: 0.9,
            risk: 0.1,
            cost: 0.2,
            priority: 1
          },
          {
            id: 'focused',
            description: 'Focused report on key trends',
            expectedOutcome: 'Targeted market analysis',
            confidence: 0.85,
            risk: 0.15,
            cost: 0.1,
            priority: 2
          }
        ],
        reasoning: llmResult.content.substring(0, 200)
      };
    } catch (error) {
      const defaultOption = {
        id: 'generate-market-insights-default',
        description: 'Generate market insights report',
        expectedOutcome: 'Market analysis report',
        confidence: 0.7,
        risk: 0.3,
        cost: 0.1,
        priority: 1,
        type: 'generate-report'
      };

      return {
        selectedOption: defaultOption,
        options: [defaultOption],
        reasoning: 'Default decision due to error'
      };
    }
  };

  // ACT: Generate market insights report
  const actionFn: ActionFn = async (decision, state) => {
    console.log('⚡ Acting: Generating market insights...');
    
    try {
      const insights = await marketInsightsService.generateMarketInsights(config);
      
      return {
        success: true,
        insights,
        reportGenerated: true,
        timestamp: new Date().toISOString(),
        decisionUsed: decision.description
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Action failed',
        timestamp: new Date().toISOString()
      };
    }
  };

  return new OODALoop(
    {
      agentId,
      maxIterations: 3, // Market insights typically need 1-3 cycles
      enableAdaptation: true,
      convergenceThreshold: 0.9
    },
    observationFn,
    orientationFn,
    decisionFn,
    actionFn
  );
}

/**
 * Generate market insights using OODA loop
 */
export async function generateMarketInsightsWithOODA(
  config: MarketInsightsConfig
): Promise<{
  insights: MarketInsightsResult;
  oodaCycles: OODAState[];
}> {
  const oodaLoop = createMarketInsightsOODA(config);
  const cycles = await oodaLoop.executeLoop();
  
  // Extract insights from final action result
  const finalState = cycles[cycles.length - 1];
  const insights = finalState.action.result?.insights;

  if (!insights) {
    throw new Error('Failed to generate insights through OODA loop');
  }

  return {
    insights,
    oodaCycles: cycles
  };
}

