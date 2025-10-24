/**
 * Multi-LLM Orchestrated Search API
 * 
 * Demonstrates advanced search capabilities that solve:
 * 1. Context limits with multiple searches
 * 2. Communication between multiple LLMs
 * 3. Scalable agentic search with FTS in Meilisearch
 */

import { NextRequest, NextResponse } from 'next/server';
import { multiLLMOrchestrator } from '../../../../lib/multi-llm-orchestrator';
import { agenticSearchEngine } from '../../../../lib/agentic-search-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      query, 
      maxTokens = 100000, 
      useCache = true,
      searchStrategy = 'parallel',
      contextLimit = 50000
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Multi-LLM Orchestrated Search starting...', { 
      query: query.substring(0, 100),
      maxTokens,
      searchStrategy 
    });

    // Execute multi-LLM orchestrated search
    const searchResult = await multiLLMOrchestrator.orchestrateSearch(
      query,
      maxTokens,
      useCache
    );

    // Execute agentic search with Meilisearch FTS
    const agenticSearch = await agenticSearchEngine.executeAgenticSearch(query, {
      maxResults: 50,
      contextLimit,
      searchStrategy: searchStrategy as 'parallel' | 'sequential' | 'hierarchical',
      useCache
    });

    console.log('✅ Multi-LLM Orchestrated Search completed', {
      success: true,
      totalTokens: searchResult.totalTokens,
      processingTime: searchResult.processingTime,
      confidence: searchResult.confidence,
      agenticResults: agenticSearch.results.length,
      contextCompression: agenticSearch.contextCompression
    });

    return NextResponse.json({
      success: true,
      data: {
        multiLLMResult: searchResult,
        agenticSearch: agenticSearch,
        performance: {
          totalTokens: searchResult.totalTokens,
          processingTime: searchResult.processingTime,
          confidence: searchResult.confidence,
          contextCompression: agenticSearch.contextCompression,
          searchStrategy: searchStrategy
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        description: {
          purpose: 'Advanced multi-LLM orchestrated search with agentic capabilities',
          capabilities: [
            'Multi-LLM Orchestration: Coordinates multiple specialized LLMs',
            'Context-Aware Communication: Intelligent context sharing between LLMs',
            'Agentic Search: FTS in Meilisearch with intelligent query decomposition',
            'Context Compression: Dynamic compression to fit within token limits',
            'Parallel Processing: Executes searches in parallel for efficiency',
            'Result Aggregation: Combines and ranks results from multiple sources'
          ],
          solutions: [
            'Context Limits: Intelligent compression and context sharing',
            'LLM Communication: Structured communication protocol between LLMs',
            'Scalable Search: Hierarchical search with priority-based execution',
            'Performance: Parallel processing with intelligent caching'
          ]
        }
      }
    });

  } catch (error: any) {
    console.error('Multi-LLM Orchestrated Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Multi-LLM orchestrated search failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    description: {
      purpose: 'Multi-LLM Orchestrated Search API',
      capabilities: [
        'Multi-LLM Orchestration: Coordinates multiple specialized LLMs',
        'Context-Aware Communication: Intelligent context sharing between LLMs',
        'Agentic Search: FTS in Meilisearch with intelligent query decomposition',
        'Context Compression: Dynamic compression to fit within token limits',
        'Parallel Processing: Executes searches in parallel for efficiency',
        'Result Aggregation: Combines and ranks results from multiple sources'
      ],
      solutions: [
        'Context Limits: Intelligent compression and context sharing',
        'LLM Communication: Structured communication protocol between LLMs',
        'Scalable Search: Hierarchical search with priority-based execution',
        'Performance: Parallel processing with intelligent caching'
      ],
      usage: 'POST with query and optional parameters to execute advanced search'
    }
  });
}
