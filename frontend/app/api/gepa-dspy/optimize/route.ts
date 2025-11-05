import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Real GEPA + DSPy optimization endpoint
 * Uses actual DSPy framework with GEPA optimizer, Graph RAG, and Langstruct
 */
export async function POST(req: Request) {
  try {
    const { query, trainset, num_candidates = 10, max_iterations = 5 } = await req.json();

    console.log('🚀 Real GEPA + DSPy optimization request:', {
      query: query?.substring(0, 50),
      trainset_size: trainset?.length || 0,
      num_candidates,
      max_iterations
    });

    // Call real backend with DSPy + GEPA
    const backendResponse = await fetch('http://localhost:8000/gepa-dspy/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        trainset,
        num_candidates,
        max_iterations,
        use_graph_rag: true,
        use_langstruct: true
      })
    });

    if (!backendResponse.ok) {
      // Fail gracefully instead of simulating
      const errorText = await backendResponse.text().catch(() => 'Unknown error');
      console.error('❌ GEPA-DSPy backend unavailable:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'GEPA-DSPy backend is unavailable',
        details: `Backend returned status ${backendResponse.status}: ${errorText}`,
        message: 'Please ensure the GEPA-DSPy backend service is running on http://localhost:8000'
      }, { status: 503 }); // Service Unavailable
    }

    const data = await backendResponse.json();
    
    console.log('✅ Real GEPA + DSPy optimization complete');
    
    return NextResponse.json({
      success: true,
      response: data.response,
      graph_rag_context: data.graph_rag_context,
      langstruct_patterns: data.langstruct_patterns,
      langstruct_intent: data.langstruct_intent,
      systems_used: data.systems_used,
      optimization_score: data.confidence,
      processing_time: data.processing_time,
      is_real: true
    });

  } catch (error) {
    console.error('❌ GEPA + DSPy optimization error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to optimize with GEPA + DSPy',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// REMOVED: generateSimulatedResponse
// This function is no longer used - we return errors instead of simulating responses
// Simulation was misleading and provided no real value
