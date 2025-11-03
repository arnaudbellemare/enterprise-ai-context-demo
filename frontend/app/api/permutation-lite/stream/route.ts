import { NextRequest } from 'next/server';
import { PermutationLitePipeline, type PermutationLiteConfig } from '../../../../lib/permutation-lite/permutation-lite-pipeline';
import { ArcMemoReasoningBank } from '../../../../lib/arcmemo-reasoning-bank';

/**
 * PERMUTATION Lite Streaming API
 * 
 * Returns initial answer immediately, then streams RVS refinement updates
 * Following /sc/research pattern: "Streaming/partial responses"
 * 
 * Request (≤7 fields):
 * - query (required)
 * - domain (optional)
 * - config (optional, ≤7 fields)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, domain, config } = body;

    // Validate input
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 PERMUTATION Lite Streaming API Request:', {
      query: query.substring(0, 60),
      domain: domain || 'auto-detect',
    });

    // Create pipeline instance
    const reasoningBank = new ArcMemoReasoningBank();
    const pipeline = new PermutationLitePipeline(config as Partial<PermutationLiteConfig>);

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch (error) {
            // Controller may be closed
          }
        };

        try {
          // Execute pipeline with streaming callbacks
          const result = await pipeline.executeWithStreaming(query, domain, {
            onInitialAnswer: (answer: string, metadata: any) => {
              // Send initial answer immediately (before RVS refinement)
              sendEvent('initial_answer', {
                answer,
                metadata: {
                  ...metadata,
                  status: 'initial',
                  note: 'Initial answer from Teacher-Student system. Refinement in progress...',
                },
              });
            },
            onVerificationProgress: (progress: {
              iteration: number;
              totalIterations: number;
              confidence: number;
              status: string;
            }) => {
              // Stream RVS refinement progress
              sendEvent('refinement_progress', {
                ...progress,
                message: `RVS refinement: ${progress.iteration}/${progress.totalIterations} iterations`,
              });
            },
            onRefinementComplete: (refinedAnswer: string, metadata: any) => {
              // Send refined answer when ready
              sendEvent('refined_answer', {
                answer: refinedAnswer,
                metadata: {
                  ...metadata,
                  status: 'refined',
                  note: 'Answer refined by RVS verification system',
                },
              });
            },
          });

          // Send final complete event
          sendEvent('complete', {
            result,
            message: 'PERMUTATION Lite execution complete',
          });

          controller.close();
        } catch (error) {
          console.error('Streaming execution error:', error);
          sendEvent('error', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ PERMUTATION Lite Streaming API error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

