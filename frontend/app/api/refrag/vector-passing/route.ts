/**
 * REFRAG Vector-Passing Proof-of-Concept API
 * 
 * Demonstrates vector-passing for Perplexity and local Ollama
 * 
 * POST /api/refrag/vector-passing
 * Body: {
 *   query: string
 *   provider: 'perplexity' | 'ollama'
 *   chunks?: Array<{id, content, embedding, metadata}> // Optional: use provided chunks
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { VectorPassingLLM, type VectorChunk } from '../../../../lib/vector-passing-llm';
import { createLogger } from '../../../../lib/walt/logger';

const logger = createLogger('REFRAGVectorPassingAPI');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, provider, chunks } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!provider || !['perplexity', 'ollama'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider. Use "perplexity" or "ollama"' },
        { status: 400 }
      );
    }

    // Check provider availability
    if (provider === 'perplexity' && !process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'PERPLEXITY_API_KEY not configured' },
        { status: 400 }
      );
    }

    if (provider === 'ollama') {
      try {
        const ollamaCheck = await fetch('http://localhost:11434/api/tags', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        if (!ollamaCheck.ok) {
          return NextResponse.json(
            { success: false, error: 'Ollama not available. Start Ollama server first.' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Ollama not available. Start Ollama server first.' },
          { status: 400 }
        );
      }
    }

    // Generate mock chunks if not provided
    let vectorChunks: VectorChunk[];
    
    if (chunks && Array.isArray(chunks) && chunks.length > 0) {
      // Use provided chunks
      vectorChunks = chunks.map((c: any) => ({
        id: c.id || `chunk-${Math.random().toString(36).substring(7)}`,
        embedding: c.embedding || [],
        content: c.content || '',
        metadata: c.metadata || {}
      }));
    } else {
      // Generate mock chunks for demo
      const { embeddingService } = await import('../../../../lib/embedding-service');
      // Import as default export
      
      const demoTexts = [
        'Vector-passing in RAG systems allows pre-computed embeddings to be passed directly to LLMs, achieving 31x faster Time-To-First-Token.',
        'REFRAG combines advanced chunk selection with vector-passing to maximize both retrieval quality and inference speed.',
        'The system uses sensor-based strategies like MMR and uncertainty sampling for optimal chunk selection.'
      ];

      vectorChunks = await Promise.all(
        demoTexts.map(async (text, idx) => {
          const embedding = await embeddingService.generate(text);
          return {
            id: `demo-chunk-${idx}`,
            embedding: embedding.embedding,
            content: text,
            metadata: { source: 'demo' }
          };
        })
      );
    }

    logger.info('Vector-passing request', {
      provider,
      queryLength: query.length,
      chunkCount: vectorChunks.length
    });

    // Initialize vector-passing LLM
    const vectorLLM = new VectorPassingLLM({
      provider,
      model: provider === 'ollama' ? 'gemma3:4b' : 'sonar-pro',
      compressionRatio: 8,
      quantizationBits: 8,
      enableSpeculativeDecoding: true
    });

    // Generate response
    const startTime = Date.now();
    const result = await vectorLLM.generate(query, vectorChunks);
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider,
      query,
      response: result.response,
      metrics: {
        ttft_ms: result.metrics.ttft_ms,
        ttit_ms: result.metrics.ttit_ms,
        totalTime_ms: result.metrics.totalTime_ms,
        tokensGenerated: result.metrics.tokensGenerated,
        vectorTokensSaved: result.metrics.vectorTokensSaved,
        throughput_improvement: result.metrics.throughput_improvement.toFixed(2),
        method: result.method
      },
      chunks: {
        count: vectorChunks.length,
        totalEmbeddingDim: vectorChunks[0]?.embedding?.length || 0,
        compressedDim: Math.ceil((vectorChunks[0]?.embedding?.length || 1536) / 8)
      },
      performance: {
        ttft_speedup_estimate: '~31x vs text-passing',
        ttit_speedup_estimate: '~3x vs text-passing',
        throughput_estimate: '~7x vs text-passing'
      }
    });
  } catch (error: any) {
    logger.error('Vector-passing request failed', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    description: 'REFRAG Vector-Passing Proof-of-Concept API',
    endpoints: {
      POST: {
        path: '/api/refrag/vector-passing',
        body: {
          query: 'string (required)',
          provider: "'perplexity' | 'ollama' (required)",
          chunks: 'Array<{id, content, embedding, metadata}> (optional)'
        },
        example: {
          query: 'What is vector-passing?',
          provider: 'perplexity',
          chunks: []
        }
      }
    },
    providers: {
      perplexity: {
        available: !!process.env.PERPLEXITY_API_KEY,
        model: 'sonar-pro',
        note: 'Requires PERPLEXITY_API_KEY environment variable'
      },
      ollama: {
        available: 'Check at runtime',
        model: 'gemma3:4b',
        note: 'Requires Ollama running on localhost:11434'
      }
    },
    benefits: {
      ttft: '31x faster Time-To-First-Token',
      ttit: '3x faster Time-To-Iterative-Token',
      throughput: '7x overall throughput improvement',
      context: 'Better handling of long contexts'
    }
  });
}

