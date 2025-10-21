import { NextRequest, NextResponse } from 'next/server';

/**
 * DSPy RAG Testing API
 * 
 * "Like writing tests for traditional apps"
 * 
 * Test each module independently:
 * - Retrieve (BM25, embedding, or LLM)
 * - Extract (rule-based or LLM)
 * - Decide (rule-based or LLM)
 * 
 * With real metrics (no LLM required for evaluation!)
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      query, 
      documents, 
      retrieve_method = 'embedding',
      extract_method = 'rule',
      decide_method = 'rule',
      ground_truth 
    } = body;

    if (!query || !documents) {
      return NextResponse.json(
        { error: 'query and documents required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing DSPy RAG Pipeline...');
    console.log(`   Query: "${query}"`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Config: retrieve=${retrieve_method}, extract=${extract_method}, decide=${decide_method}`);

    // Dynamically import to avoid SSR issues
    const { getDSPyRAGPipeline } = await import('@/lib/dspy-rag-modules');
    const { evaluatePipeline } = await import('@/lib/dspy-evaluators');

    // Initialize pipeline with config
    const pipeline = getDSPyRAGPipeline({
      retrieve_method,
      extract_method,
      decide_method
    });

    // Execute pipeline
    const pipelineStart = performance.now();
    const results = await pipeline.execute(query, documents);
    const pipelineDuration = performance.now() - pipelineStart;

    console.log(`✅ Pipeline executed in ${pipelineDuration.toFixed(2)}ms`);
    console.log(`   Retrieved: ${results.spans.length} spans`);
    console.log(`   Extracted: ${results.keywords.length} keywords, ${results.entities.length} entities`);
    console.log(`   Validated: ${results.validated_insights.length} insights`);

    // Evaluate if ground truth provided
    let evaluation = null;
    if (ground_truth) {
      evaluation = evaluatePipeline(results, ground_truth);
      
      console.log(`📊 Evaluation Results:`);
      console.log(`   Retrieve F1: ${(evaluation.retrieve.f1 * 100).toFixed(1)}%`);
      console.log(`   Extract Score: ${(evaluation.extract.overall_score * 100).toFixed(1)}%`);
      console.log(`   Decide F1: ${(evaluation.decide.f1 * 100).toFixed(1)}%`);
      console.log(`   Overall: ${(evaluation.overall_score * 100).toFixed(1)}%`);
      console.log(`   Bottleneck: ${evaluation.bottleneck}`);
      console.log(`   Recommendation: ${evaluation.recommendation}`);
    }

    return NextResponse.json({
      query,
      results,
      evaluation,
      config: {
        retrieve_method,
        extract_method,
        decide_method
      },
      performance: {
        total_duration_ms: pipelineDuration,
        ...results.metrics
      }
    });

  } catch (error: any) {
    console.error('❌ DSPy RAG test failed:', error);
    return NextResponse.json(
      { error: 'DSPy RAG test failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Return example test case
  return NextResponse.json({
    message: 'DSPy RAG Testing Endpoint',
    example_request: {
      query: 'What are the key insights from sales transcripts?',
      documents: [
        'Sales call transcript 1: Customer mentioned pricing concerns...',
        'Sales call transcript 2: Great interest in feature X...',
        'Sales call transcript 3: Competitor comparison with Product Y...'
      ],
      retrieve_method: 'embedding',  // or 'bm25', 'llm'
      extract_method: 'rule',        // or 'llm'
      decide_method: 'rule',         // or 'llm'
      ground_truth: {
        relevant_spans: ['pricing concerns', 'feature X'],
        keywords: ['pricing', 'feature', 'competitor'],
        entities: ['Product Y'],
        insights: [
          { insight: 'Pricing is a concern', should_hold_up: true },
          { insight: 'Users love feature X', should_hold_up: true }
        ]
      }
    },
    modules: {
      retrieve: ['bm25', 'embedding', 'llm'],
      extract: ['rule', 'llm'],
      decide: ['rule', 'llm']
    },
    swappable: true,
    metrics: ['precision', 'recall', 'f1', 'accuracy']
  });
}



