import { NextRequest, NextResponse } from 'next/server';
import { axLLMEnhancedSystem, QueryAnalysisSignature, MarketAnalysisSignature, ResponseGenerationSignature, TRMReasoningSystem } from '../../../../lib/ax-llm-enhanced';
import { ai } from '@ax-llm/ax';

export const runtime = 'nodejs';

// Initialize LLM for testing
function getLLM() {
  try {
    if (process.env.OPENAI_API_KEY) {
      return ai({ name: 'openai', apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.OPENROUTER_API_KEY) {
      return ai({ 
        name: 'openai', 
        apiKey: process.env.OPENROUTER_API_KEY,
        config: { baseURL: 'https://openrouter.ai/api/v1' }
      });
    }
    return null;
  } catch (error) {
    console.error('Failed to initialize LLM:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context, testType } = body;

    console.log('🚀 AX-LLM Enhanced System Test:', { query, testType });

    if (testType === 'dspy-signatures') {
      // Test DSPy signatures individually
      const llm = getLLM();
      
      if (!llm) {
        return NextResponse.json({
          success: false,
          error: 'No LLM provider configured',
          details: 'Please set OPENAI_API_KEY or OPENROUTER_API_KEY environment variable',
          fallback: 'System will use basic reasoning as fallback'
        }, { status: 500 });
      }

      const queryAnalysis = await QueryAnalysisSignature.forward(llm, {
        query: query || 'artificial intelligence applications',
        context: context || {}
      });

      const marketAnalysis = await MarketAnalysisSignature.forward(llm, {
        auctionData: context?.auctionData || [
          { title: 'Test Artwork', artist: 'Test Artist', price_realized_usd: 1000000 }
        ],
        query: query || 'artificial intelligence applications'
      });

      const responseGeneration = await ResponseGenerationSignature.forward(llm, {
        analysis: queryAnalysis.analysis,
        marketData: marketAnalysis.marketAnalysis,
        query: query || 'artificial intelligence applications'
      });

      return NextResponse.json({
        success: true,
        testType: 'dspy-signatures',
        results: {
          queryAnalysis: queryAnalysis.analysis,
          marketAnalysis: marketAnalysis.marketAnalysis,
          responseGeneration: responseGeneration.finalResponse
        },
        components: [
          'QueryAnalysisSignature',
          'MarketAnalysisSignature', 
          'ResponseGenerationSignature'
        ]
      });

    } else if (testType === 'trm-reasoning') {
      // Test TRM recursive reasoning
      const trmSystem = new TRMReasoningSystem();
      const trmResult = await trmSystem.recursiveReasoning(
        query || 'How does quantum computing work?',
        context || { complexity: 'high', domain: 'science' }
      );

      return NextResponse.json({
        success: true,
        testType: 'trm-reasoning',
        results: {
          finalAnswer: trmResult.finalAnswer,
          confidence: trmResult.confidence,
          iterations: trmResult.iterations,
          reasoningChain: trmResult.reasoningChain
        },
        components: [
          'TRM Recursive Reasoning',
          'TRM Adaptive Computation',
          'TRM Confidence Scoring'
        ]
      });

    } else {
      // Test full enhanced system
      const enhancedResult = await axLLMEnhancedSystem.processWithEnhancedReasoning(
        query || 'artificial intelligence applications',
        context || {
          auctionData: [
            { title: 'AI Artwork', artist: 'AI Artist', price_realized_usd: 2000000 }
          ],
          sources: ['Perplexity AI', 'Auction House Data'],
          complexity: 'moderate'
        }
      );

      return NextResponse.json({
        success: true,
        testType: 'full-enhanced-system',
        results: {
          dspyResult: enhancedResult.dspyResult,
          trmResult: enhancedResult.trmResult,
          finalAnswer: enhancedResult.finalAnswer,
          confidence: enhancedResult.confidence
        },
        components: enhancedResult.components,
        summary: {
          dspyModules: enhancedResult.dspyResult.dspyModules,
          trmIterations: enhancedResult.trmResult.iterations,
          finalConfidence: enhancedResult.confidence,
          totalComponents: enhancedResult.components.length
        }
      });
    }

  } catch (error) {
    console.error('❌ AX-LLM Enhanced System Test Failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'AX-LLM Enhanced System test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'System will use basic reasoning as fallback'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AX-LLM Enhanced System API',
    capabilities: [
      '✅ DSPy Signatures Implementation',
      '✅ TRM Recursive Reasoning',
      '✅ Enhanced Query Analysis',
      '✅ Market Data Processing',
      '✅ Response Generation',
      '✅ Adaptive Computation',
      '✅ Multi-Modal Integration'
    ],
    testTypes: [
      'dspy-signatures - Test individual DSPy signatures',
      'trm-reasoning - Test TRM recursive reasoning',
      'full-enhanced-system - Test complete integrated system'
    ],
    usage: {
      method: 'POST',
      body: {
        query: 'string (optional)',
        context: 'object (optional)',
        testType: 'dspy-signatures | trm-reasoning | full-enhanced-system'
      }
    }
  });
}
