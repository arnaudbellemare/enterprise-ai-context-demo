import { NextRequest, NextResponse } from 'next/server';
import { executeRLM } from '../../../lib/recursive-language-model';

/**
 * Recursive Language Model (RLM) API
 * 
 * Based on: "Recursive Language Models" by Alex Zhang & Omar Khattab (October 2025)
 * Paper: https://alexzhang13.github.io/blog/2025/rlm/
 * 
 * Handles unbounded context (10M+ tokens) without context rot by:
 * - Storing context as REPL variable (not loading into LM)
 * - Spawning recursive LM sub-queries programmatically
 * - Adaptive chunking and decomposition strategies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      context,
      metadata,
      config
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required for RLM' },
        { status: 400 }
      );
    }

    const contextSize = context.length;
    console.log('🔄 RLM API Request:', {
      query: query.substring(0, 60),
      contextSize,
      contextTokens: Math.ceil(contextSize / 4)
    });

    // Execute RLM
    const result = await executeRLM(query, context, metadata, config);

    console.log('✅ RLM execution completed:', {
      totalCalls: result.performance.total_calls,
      maxDepth: result.performance.total_depth,
      strategy: result.context_strategy,
      tokensProcessed: result.performance.context_tokens_processed
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ RLM API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint to show API documentation
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Recursive Language Model (RLM) API',
    description: 'Handle unbounded context lengths without context rot',
    paper: {
      title: 'Recursive Language Models',
      authors: 'Alex Zhang & Omar Khattab',
      date: 'October 2025',
      url: 'https://alexzhang13.github.io/blog/2025/rlm/'
    },
    keyInnovation: {
      problem: 'Context rot - LMs degrade with long contexts',
      solution: 'Store context as REPL variable, spawn recursive LM sub-queries',
      result: 'RLM(GPT-4o-mini) outperforms GPT-4o on long-context benchmarks'
    },
    howItWorks: [
      '1. Context stored as Python variable in REPL (not loaded into LM)',
      '2. Root LM (depth=0) can write code to: search, slice, analyze context',
      '3. Root LM spawns recursive LM calls: rlm_query(sub_query, context_slice)',
      '4. Recursive LMs (depth>0) process focused sub-queries',
      '5. Results combined programmatically to generate final answer'
    ],
    benefits: [
      'Handle 10M+ tokens without degradation',
      'No context rot (context never fully loaded into single LM call)',
      'Adaptive chunking strategies (LM decides how to decompose)',
      'Test-time compute scaling (more recursion = better results)',
      'Cheaper than loading full context into large model'
    ],
    differenceFromRVS: {
      RVS: 'Iterative verification loop for refinement (same context)',
      RLM: 'Recursive decomposition for unbounded context (context split programmatically)'
    },
    usage: {
      method: 'POST',
      endpoint: '/api/rlm',
      body: {
        query: 'string (required) - The question to answer',
        context: 'string (required) - The potentially huge context (up to 1M+ tokens)',
        metadata: 'object (optional) - Metadata about the context',
        config: {
          max_depth: 'number (default: 5) - Maximum recursion depth',
          max_iterations: 'number (default: 10) - Max iterations per level',
          context_chunk_size: 'number (default: 4000) - Default chunk size',
          enable_code_execution: 'boolean (default: true) - Enable REPL',
          max_context_tokens: 'number (default: 1000000) - Max total context',
          llm_provider: '"openai" | "anthropic" | "ollama"',
          model: 'string (default: "gpt-4o")'
        }
      }
    },
    examples: [
      {
        useCase: 'Needle-in-haystack over 100k tokens',
        strategy: 'Root LM uses regex to search, spawns rlm_query on matches'
      },
      {
        useCase: 'Multi-hop reasoning across long document',
        strategy: 'Break into sub-questions, spawn rlm_query for each, combine'
      },
      {
        useCase: 'Summarize 1M token corpus',
        strategy: 'Chunk adaptively, spawn rlm_query per chunk, aggregate summaries'
      },
      {
        useCase: 'Long generation task (e.g., generate BibTeX for 1000 papers)',
        strategy: 'Build incrementally in REPL variable, use FINAL_VAR()'
      }
    ],
    benchmarks: {
      OOLONG: 'RLM(GPT-4o-mini) > 2x GPT-4o on difficult long-context tasks',
      BrowseComp: 'RLM outperforms ReAct + retrieval',
      LoCoDiff: 'RLM handles 75k+ token git diffs programmatically'
    },
    limitations: [
      'Not optimized for speed (blocking, no prefix caching)',
      'No guarantees on total cost or runtime',
      'Requires LM with good code generation ability'
    ],
    futureWork: [
      'Train models explicitly for recursive reasoning',
      'Async/parallel recursive calls',
      'RL-based optimization of decomposition strategies',
      'Integration with test-time compute scaling'
    ]
  });
}

