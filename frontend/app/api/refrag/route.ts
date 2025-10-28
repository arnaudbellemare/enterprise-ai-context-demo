/**
 * REFRAG API Route
 * 
 * Direct access to REFRAG system for:
 * - Document retrieval
 * - Sensor strategy testing
 * - Optimization memory inspection
 * - Benchmarking
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFRAGSystem, type REFRAGConfig } from '../../../lib/refrag-system';
import { createVectorRetriever } from '../../../lib/vector-databases';
import { REFRAGBenchmarkRunner, DEFAULT_BENCHMARK_CONFIG } from '../../../lib/refrag-benchmarking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, sensorMode, k, budget, mmrLambda, enableOptimizationMemory, benchmarkConfig } = body;

    switch (action) {
      case 'retrieve':
        {
          if (!query) {
            return NextResponse.json(
              { error: 'query is required for retrieval' },
              { status: 400 }
            );
          }

          const refragConfig: REFRAGConfig = {
            sensorMode: sensorMode || 'adaptive',
            k: k || 10,
            budget: budget || 3,
            mmrLambda: mmrLambda || 0.7,
            uncertaintyThreshold: 0.5,
            enableOptimizationMemory: enableOptimizationMemory !== false,
            vectorDB: {
              type: 'inmemory',
              config: {}
            }
          };

          const vectorRetriever = createVectorRetriever('inmemory', {});
          const refragSystem = new REFRAGSystem(refragConfig, vectorRetriever);

          // Add some test documents
          await vectorRetriever.upsert([
            {
              id: 'doc1',
              content: 'Microservices architecture provides scalability and maintainability by breaking applications into small, independent services.',
              metadata: { domain: 'architecture', source: 'test' }
            },
            {
              id: 'doc2',
              content: 'Service mesh technologies like Istio provide advanced traffic management and security for microservices.',
              metadata: { domain: 'architecture', source: 'test' }
            },
            {
              id: 'doc3',
              content: 'Database indexing strategies significantly improve query performance for large datasets.',
              metadata: { domain: 'database', source: 'test' }
            },
            {
              id: 'doc4',
              content: 'API security best practices include authentication, authorization, input validation, and rate limiting.',
              metadata: { domain: 'security', source: 'test' }
            },
            {
              id: 'doc5',
              content: 'Event-driven architecture enables loose coupling between services through asynchronous communication.',
              metadata: { domain: 'architecture', source: 'test' }
            }
          ]);

          const result = await refragSystem.retrieve(query);

          return NextResponse.json({
            success: true,
            action: 'retrieve',
            result: {
              chunks: result.chunks,
              metadata: result.metadata
            }
          });
        }

      case 'compareStrategies':
        {
          if (!query) {
            return NextResponse.json(
              { error: 'query is required for strategy comparison' },
              { status: 400 }
            );
          }

          const strategies = ['mmr', 'uncertainty', 'adaptive', 'topk'];
          const results = [];

          for (const strategy of strategies) {
            const refragConfig: REFRAGConfig = {
              sensorMode: strategy as any,
              k: 10,
              budget: 3,
              mmrLambda: 0.7,
              uncertaintyThreshold: 0.5,
              enableOptimizationMemory: false,
              vectorDB: { type: 'inmemory', config: {} }
            };

            const vectorRetriever = createVectorRetriever('inmemory', {});
            const refragSystem = new REFRAGSystem(refragConfig, vectorRetriever);

            // Add test documents
            await vectorRetriever.upsert([
              {
                id: 'doc1',
                content: 'Microservices architecture provides scalability and maintainability by breaking applications into small, independent services.',
                metadata: { domain: 'architecture' }
              },
              {
                id: 'doc2',
                content: 'Service mesh technologies like Istio provide advanced traffic management and security for microservices.',
                metadata: { domain: 'architecture' }
              },
              {
                id: 'doc3',
                content: 'Database indexing strategies significantly improve query performance for large datasets.',
                metadata: { domain: 'database' }
              },
              {
                id: 'doc4',
                content: 'API security best practices include authentication, authorization, input validation, and rate limiting.',
                metadata: { domain: 'security' }
              },
              {
                id: 'doc5',
                content: 'Event-driven architecture enables loose coupling between services through asynchronous communication.',
                metadata: { domain: 'architecture' }
              }
            ]);

            const result = await refragSystem.retrieve(query);
            
            results.push({
              strategy,
              chunks: result.chunks.length,
              diversityScore: result.metadata.diversityScore,
              processingTimeMs: result.metadata.processingTimeMs,
              avgScore: result.chunks.reduce((sum, chunk) => sum + (chunk.score || 0), 0) / result.chunks.length
            });
          }

          return NextResponse.json({
            success: true,
            action: 'compareStrategies',
            query,
            results
          });
        }

      case 'runBenchmark':
        {
          const config = benchmarkConfig || {
            ...DEFAULT_BENCHMARK_CONFIG,
            models: ['openai_gpt-4o-mini'], // Single model for API
            queries: DEFAULT_BENCHMARK_CONFIG.queries.slice(0, 3), // 3 queries
            iterations: 2, // 2 iterations
            saveResults: false
          };

          const benchmarkRunner = new REFRAGBenchmarkRunner(config);
          const results = await benchmarkRunner.runBenchmark();

          return NextResponse.json({
            success: true,
            action: 'runBenchmark',
            config,
            results: results.slice(0, 10), // Return first 10 results
            summary: {
              totalResults: results.length,
              models: config.models.length,
              sensorModes: config.sensorModes.length,
              queries: config.queries.length
            }
          });
        }

      case 'getOptimizationStats':
        {
          const refragConfig: REFRAGConfig = {
            sensorMode: 'adaptive',
            k: 10,
            budget: 3,
            mmrLambda: 0.7,
            uncertaintyThreshold: 0.5,
            enableOptimizationMemory: true,
            vectorDB: { type: 'inmemory', config: {} }
          };

          const vectorRetriever = createVectorRetriever('inmemory', {});
          const refragSystem = new REFRAGSystem(refragConfig, vectorRetriever);

          // Run a few queries to build some stats
          const testQueries = [
            'What are microservices best practices?',
            'How to design scalable architecture?',
            'What are database optimization techniques?'
          ];

          for (const testQuery of testQueries) {
            await refragSystem.retrieve(testQuery);
          }

          const stats = refragSystem.getOptimizationStats();

          return NextResponse.json({
            success: true,
            action: 'getOptimizationStats',
            stats
          });
        }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('REFRAG API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'strategies') {
      return NextResponse.json({
        success: true,
        strategies: ['mmr', 'uncertainty', 'adaptive', 'ensemble', 'topk'],
        descriptions: {
          mmr: 'Maximal Marginal Relevance - ensures diversity in retrieved chunks',
          uncertainty: 'Uncertainty Sampling - selects chunks where model is most uncertain',
          adaptive: 'Adaptive Strategy - chooses strategy based on query characteristics',
          ensemble: 'Ensemble Strategy - combines multiple strategies',
          topk: 'Top-K Selection - traditional highest scoring chunks'
        }
      });
    }

    if (action === 'config') {
      return NextResponse.json({
        success: true,
        defaultConfig: {
          sensorMode: 'adaptive',
          k: 10,
          budget: 3,
          mmrLambda: 0.7,
          uncertaintyThreshold: 0.5,
          enableOptimizationMemory: true
        },
        availableModels: Object.keys({
          'openai_gpt-4o-mini': 'OpenAI GPT-4o Mini',
          'openai_gpt-4o': 'OpenAI GPT-4o',
          'anthropic_claude-sonnet-4': 'Anthropic Claude Sonnet 4',
          'anthropic_claude-haiku': 'Anthropic Claude Haiku',
          'google_gemini-2.5-flash': 'Google Gemini 2.5 Flash',
          'ollama_gemma3:4b': 'Ollama Gemma3:4b',
          'ollama_llama3.1:8b': 'Ollama Llama3.1:8b'
        })
      });
    }

    return NextResponse.json({
      success: true,
      message: 'REFRAG API is running',
      availableActions: ['retrieve', 'compareStrategies', 'runBenchmark', 'getOptimizationStats'],
      endpoints: {
        'POST /api/refrag': 'Main REFRAG operations',
        'GET /api/refrag?action=strategies': 'Get available sensor strategies',
        'GET /api/refrag?action=config': 'Get default configuration'
      }
    });
  } catch (error: any) {
    console.error('REFRAG API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
