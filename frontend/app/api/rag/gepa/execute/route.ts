/**
 * GEPA RAG Execution API
 *
 * Production endpoint for complete GEPA RAG pipeline with:
 * - Query Reformulation (inference sampling)
 * - Multi-query Retrieval (RRF fusion)
 * - Listwise Reranking (inference sampling)
 * - Context Synthesis (Delta Rule memory)
 * - Answer Generation (verification loops)
 *
 * Usage:
 * POST /api/rag/gepa/execute
 * {
 *   "query": "What was Q4 2024 revenue?",
 *   "config": { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorAdapter } from '@/lib/rag/vector-store-adapter';
import { RAGPipeline, type RAGPipelineConfig } from '@/lib/rag/complete-rag-pipeline';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize vector store and pipeline
const vectorStore = new SupabaseVectorAdapter(supabase, 'documents');
const ragModel = process.env.RAG_MODEL || 'perplexity/sonar-pro';
const pipeline = new RAGPipeline(vectorStore, ragModel);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { query, config } = body as {
      query: string;
      config?: RAGPipelineConfig;
    };

    // Validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query parameter' },
        { status: 400 }
      );
    }

    if (query.length < 3) {
      return NextResponse.json(
        { error: 'Query too short (minimum 3 characters)' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query too long (maximum 500 characters)' },
        { status: 400 }
      );
    }

    // Execute RAG pipeline
    console.log(`[GEPA RAG] Executing query: "${query.substring(0, 60)}..."`);

    const result = await pipeline.execute(query, config);

    // Log metrics
    console.log(`[GEPA RAG] Success:`);
    console.log(`  Latency: ${result.metrics.totalLatency}ms`);
    console.log(`  Cost: $${result.metrics.cost.toFixed(4)}`);
    console.log(`  Docs: ${result.retrievedDocs.length}`);
    console.log(`  Confidence: ${result.verification?.confidence.toFixed(3)}`);

    // Store execution log
    await logExecution(query, result);

    return NextResponse.json({
      success: true,
      query: result.query,
      answer: result.answer,
      metrics: result.metrics,
      verification: result.verification,
      deltaState: result.deltaState,
      metadata: {
        numReformulations: result.reformulations?.length || 1,
        numDocs: result.retrievedDocs.length,
        contextLength: result.synthesizedContext.length,
        answerLength: result.answer.length,
      },
    });
  } catch (error: any) {
    console.error('[GEPA RAG] Error:', error);

    return NextResponse.json(
      {
        error: 'RAG pipeline execution failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Log execution to database
 */
async function logExecution(query: string, result: any) {
  try {
    await supabase.from('gepa_rag_executions').insert({
      query,
      answer: result.answer,
      latency: result.metrics.totalLatency,
      cost: result.metrics.cost,
      confidence: result.verification?.confidence || 0,
      faithful: result.verification?.faithful || false,
      consistent: result.verification?.consistent || false,
      complete: result.verification?.complete || false,
      num_docs: result.retrievedDocs.length,
      num_reformulations: result.reformulations?.length || 1,
      context_length: result.synthesizedContext?.length || 0,
      answer_length: result.answer?.length || 0,
      topic_shift: result.deltaState?.topicShift || 0,
      alpha_value: typeof result.deltaState?.alpha === 'number' ? result.deltaState.alpha : null,
      beta_value: result.deltaState?.beta || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GEPA RAG] Failed to log execution:', error);
  }
}
