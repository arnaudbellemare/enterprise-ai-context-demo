import { NextRequest } from 'next/server';
import { PermutationEngine } from '@/lib/permutation-engine';

// Initialize PERMUTATION Engine (singleton)
let permutationEngine: PermutationEngine | null = null;

function getPermutationEngine(): PermutationEngine {
  if (!permutationEngine) {
    // Use default config from PermutationEngine (optimized for speed)
    permutationEngine = new PermutationEngine();
  }
  return permutationEngine;
}

// Helper function for sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Streaming PERMUTATION response with real-time reasoning display
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Initialize REAL PERMUTATION Engine
          const engine = getPermutationEngine();
          
          // Helper to send SSE events
          const sendEvent = (event: string, data: any) => {
            try {
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
              );
            } catch (error) {
              // Silently fail if controller is closed
            }
          };

          // Execute FULL PERMUTATION system
          sendEvent('reasoning', {
            step: 'permutation_start',
            title: '🚀 PERMUTATION: Starting Full System Execution',
            content: 'Initializing components for integrated execution...',
            status: 'in_progress'
          });
          await sleep(200);

          // Run the REAL PERMUTATION engine
          let result;
          try {
            result = await engine.execute(message);
          } catch (error) {
            console.error('PERMUTATION engine execution error:', error);
            // Create fallback result
            result = {
              answer: 'I apologize, but I encountered an error while processing your request. Please try again.',
              trace: {
                steps: []
              },
              metadata: {
                components_used: ['error_handler'],
                duration_ms: 1000,
                cost: 0,
                quality_score: 0.1
              }
            };
          }

          // Stream each execution step as it completes
          for (const step of result.trace?.steps || []) {
            sendEvent('reasoning', {
              step: step.component.toLowerCase().replace(/\s+/g, '_'),
              title: `${getComponentEmoji(step.component)} ${step.component}`,
              content: `${step.description}\n\n**Status**: ${step.status}\n**Duration**: ${step.duration_ms}ms`,
              status: step.status === 'success' ? 'complete' : step.status,
              data: step.output
            });
            await sleep(100);
          }

          // Send final step
          sendEvent('reasoning', {
            step: 'final_generation',
            title: '📝 Answer Ready',
            content: 'Final answer generated',
            status: 'complete'
          });
          await sleep(100);

          // Send the final answer
          sendEvent('answer', {
            text: result.answer,
            metadata: result.metadata
          });
          await sleep(100);

          // Close the stream
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          try {
            controller.error(error);
          } catch (e) {
            // Controller already closed
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('PERMUTATION streaming error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function getComponentEmoji(component: string): string {
  const emojiMap: Record<string, string> = {
    'Domain Detection': '🎯',
    'ACE Framework': '🧠',
    'Multi-Query Expansion': '🔍',
    'IRT (Item Response Theory)': '📊',
    'ReasoningBank': '🗄️',
    'LoRA (Low-Rank Adaptation)': '⚡',
    'Teacher Model (Perplexity)': '🌐',
    'SWiRL (Step-Wise RL)': '🔄',
    'TRM (Tiny Recursion Model)': '✅',
    'DSPy Optimization': '🎨',
    'Student Model (Ollama)': '🤖'
  };
  return emojiMap[component] || '📦';
}
