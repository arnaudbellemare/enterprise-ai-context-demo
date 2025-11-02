/**
 * Streaming Response Handler
 * 
 * Handles Server-Sent Events (SSE) for progressive result streaming
 * Enables better perceived performance by streaming intermediate results
 */

export interface StreamEvent {
  type: 'phase_start' | 'phase_complete' | 'progress' | 'result' | 'error' | 'complete';
  phase?: string;
  component?: string;
  data?: any;
  progress?: number; // 0-100
  timestamp?: number;
}

export class StreamingHandler {
  private encoder: TextEncoder;
  
  constructor() {
    this.encoder = new TextEncoder();
  }

  /**
   * Send SSE event to client
   */
  sendEvent(event: StreamEvent): string {
    const data = JSON.stringify(event);
    return `data: ${data}\n\n`;
  }

  /**
   * Send phase start event
   */
  sendPhaseStart(phase: string, component?: string): string {
    return this.sendEvent({
      type: 'phase_start',
      phase,
      component,
      timestamp: Date.now(),
    });
  }

  /**
   * Send phase complete event
   */
  sendPhaseComplete(phase: string, duration: number, result?: any): string {
    return this.sendEvent({
      type: 'phase_complete',
      phase,
      data: { duration, result },
      timestamp: Date.now(),
    });
  }

  /**
   * Send progress update
   */
  sendProgress(progress: number, message?: string): string {
    return this.sendEvent({
      type: 'progress',
      progress: Math.max(0, Math.min(100, progress)),
      data: { message },
      timestamp: Date.now(),
    });
  }

  /**
   * Send partial result
   */
  sendResult(result: any, component?: string): string {
    return this.sendEvent({
      type: 'result',
      component,
      data: result,
      timestamp: Date.now(),
    });
  }

  /**
   * Send error event
   */
  sendError(error: Error | string, phase?: string): string {
    return this.sendEvent({
      type: 'error',
      phase,
      data: {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Send completion event
   */
  sendComplete(finalResult: any): string {
    return this.sendEvent({
      type: 'complete',
      data: finalResult,
      timestamp: Date.now(),
    });
  }

  /**
   * Write event to a Response stream (for Next.js)
   */
  async writeToStream(
    stream: WritableStreamDefaultWriter,
    event: StreamEvent
  ): Promise<void> {
    const eventString = this.sendEvent(event);
    const chunk = this.encoder.encode(eventString);
    await stream.write(chunk);
  }

  /**
   * Create SSE Response (for Next.js API routes)
   */
  createSSEResponse(): Response {
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection event
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(': connected\n\n'));
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  }
}

export const streamingHandler = new StreamingHandler();

