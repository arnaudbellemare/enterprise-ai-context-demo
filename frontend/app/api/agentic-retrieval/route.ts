/**
 * Agentic Retrieval API
 * 
 * Demonstrates advanced agent-driven information retrieval that addresses:
 * - Agents have information needs expressed by LLMs, not humans
 * - LLMs drive query traffic comparable to human-generated queries
 * - Organizations need relevant search for agents to work
 * - Retrieval needed despite long context windows (1M+ tokens)
 * - Agentic loops with multiple tool calls create cumulative token constraints
 */

import { NextRequest, NextResponse } from 'next/server';
import { agenticRetrievalSystem } from '../../../../lib/agentic-retrieval-system';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      agentId,
      needType,
      urgency,
      context,
      constraints,
      metadata
    } = body;

    if (!agentId || !needType || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, needType, context' },
        { status: 400 }
      );
    }

    console.log('🤖 Agentic Retrieval starting...', { 
      agentId,
      needType,
      urgency,
      context: context.substring(0, 100)
    });

    // Create agent information need
    const agentNeed = {
      id: `need-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      needType,
      urgency: urgency || 'medium',
      context,
      constraints: constraints || {
        maxTokens: 50000,
        timeLimit: 30000,
        accuracyThreshold: 0.8
      },
      metadata: metadata || {
        sessionId: `session-${Date.now()}`,
        toolChain: [],
        cumulativeTokens: 0
      }
    };

    // Register the agent need
    await agenticRetrievalSystem.registerAgentNeed(agentNeed);

    // Process the agent information need
    const retrievalResult = await agenticRetrievalSystem.processAgentInformationNeed(agentNeed);

    console.log('✅ Agentic Retrieval completed', {
      success: true,
      needId: agentNeed.id,
      strategy: retrievalResult.strategy,
      tokenUsage: retrievalResult.tokenUsage,
      accuracy: retrievalResult.accuracy,
      confidence: retrievalResult.confidence,
      processingTime: retrievalResult.processingTime
    });

    return NextResponse.json({
      success: true,
      data: {
        agentNeed,
        retrievalResult,
        performance: {
          tokenUsage: retrievalResult.tokenUsage,
          accuracy: retrievalResult.accuracy,
          confidence: retrievalResult.confidence,
          processingTime: retrievalResult.processingTime,
          toolChain: retrievalResult.toolChain
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        description: {
          purpose: 'Advanced agentic retrieval system for agent-driven information needs',
          capabilities: [
            'Agent Information Needs: Processes needs expressed by LLMs/agents',
            'Retrieval Strategies: 5 specialized strategies for different use cases',
            'Tool Chain Execution: Sequential tool usage for complex needs',
            'Token Management: Efficient token usage despite long context windows',
            'Performance Tracking: Real-time performance monitoring and optimization',
            'Strategy Selection: Intelligent strategy selection based on need analysis'
          ],
          strategies: [
            'Direct Knowledge Retrieval: For factual queries and definitions',
            'Contextual Search: For complex queries with rich context',
            'Tool Chain Retrieval: For log analysis and data extraction',
            'Hybrid Retrieval: Combines multiple retrieval methods',
            'Real-time Retrieval: For live data and current information'
          ],
          solutions: [
            'Context Limits: Intelligent strategy selection and token management',
            'Agent Needs: Specialized handling of LLM-driven information needs',
            'Tool Chains: Sequential tool usage for complex information gathering',
            'Performance: Real-time tracking and optimization'
          ]
        }
      }
    });

  } catch (error: any) {
    console.error('Agentic Retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Agentic retrieval failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const performanceMetrics = agenticRetrievalSystem.getPerformanceMetrics();
    const strategyEffectiveness = agenticRetrievalSystem.getStrategyEffectiveness();
    const strategies = await agenticRetrievalSystem.getRetrievalStrategies();

    return NextResponse.json({
      success: true,
      data: {
        performanceMetrics,
        strategyEffectiveness,
        strategies: strategies.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          tools: s.tools,
          useCases: s.useCases,
          tokenEfficiency: s.tokenEfficiency,
          accuracy: s.accuracy,
          speed: s.speed
        }))
      },
      metadata: {
        timestamp: new Date().toISOString(),
        description: {
          purpose: 'Agentic Retrieval System Analytics',
          capabilities: [
            'Performance Metrics: Real-time performance tracking',
            'Strategy Effectiveness: Effectiveness analysis for each strategy',
            'Available Strategies: List of all available retrieval strategies',
            'Tool Registry: Available tools and their capabilities'
          ]
        }
      }
    });

  } catch (error: any) {
    console.error('Agentic Retrieval analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
