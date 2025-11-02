/**
 * Unified Pipeline Streaming API
 * 
 * Provides Server-Sent Events (SSE) streaming for progressive result updates
 * Improves perceived performance by showing results as they become available
 */

import { NextRequest } from 'next/server';
import { executeUnifiedPipeline } from '@/lib/unified-permutation-pipeline';
import { streamingHandler } from '@/lib/streaming-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const domain = searchParams.get('domain') || undefined;

  if (!query) {
    return new Response('Query parameter is required', { status: 400 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection event
      controller.enqueue(encoder.encode(': connected\n\n'));

      try {
          // Stream execution events
          await executeUnifiedPipeline(
            query,
            domain,
            undefined,
            undefined,
            (event) => {
              const streamEvent = {
                type: event.type as 'phase_start' | 'phase_complete' | 'progress' | 'result' | 'error' | 'complete',
                phase: event.phase,
                component: event.phase,
                data: event.data,
                timestamp: Date.now()
              };
              const eventString = streamingHandler.sendEvent(streamEvent);
              controller.enqueue(encoder.encode(eventString));
            }
          );

        // Send completion event
        const completeEvent = streamingHandler.sendComplete({ success: true });
        controller.enqueue(encoder.encode(completeEvent));
      } catch (error) {
        const errorEvent = streamingHandler.sendError(
          error instanceof Error ? error : new Error(String(error))
        );
        controller.enqueue(encoder.encode(errorEvent));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, domain, context } = body;

    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection event
        controller.enqueue(encoder.encode(': connected\n\n'));

        try {
          // Stream execution events
          await executeUnifiedPipeline(
            query,
            domain,
            context,
            undefined,
            (event) => {
              const streamEvent = {
                type: event.type as 'phase_start' | 'phase_complete' | 'progress' | 'result' | 'error' | 'complete',
                phase: event.phase,
                component: event.phase,
                data: event.data,
                timestamp: Date.now()
              };
              const eventString = streamingHandler.sendEvent(streamEvent);
              controller.enqueue(encoder.encode(eventString));
            }
          );

          // Send completion event
          const completeEvent = streamingHandler.sendComplete({ success: true });
          controller.enqueue(encoder.encode(completeEvent));
        } catch (error) {
          const errorEvent = streamingHandler.sendError(
            error instanceof Error ? error : new Error(String(error))
          );
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

