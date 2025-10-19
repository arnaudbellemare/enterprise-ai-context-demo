import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Kimi K2 Integration via OpenRouter
 * Provides access to MoonshotAI's Kimi K2 model
 */
export async function POST(request: NextRequest) {
  try {
    const { query, model = 'moonshotai/kimi-k2:free', max_tokens = 1000 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🤖 Kimi K2 Request: ${model}`);
    console.log(`   Query: ${query.substring(0, 100)}...`);

    const startTime = Date.now();

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: max_tokens,
          temperature: 0.7
        })
      });

      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({
          success: false,
          error: errorData.error?.message || `OpenRouter API failed: ${response.status}`,
          model: model,
          processingTimeMs: processingTime
        }, { status: response.status });
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      console.log(`   ✅ Kimi K2 Response: ${content.length} characters in ${processingTime}ms`);

      return NextResponse.json({
        success: true,
        model: model,
        response: content,
        processingTimeMs: processingTime,
        usage: data.usage || null,
        metadata: {
          provider: 'OpenRouter',
          model_family: 'MoonshotAI Kimi K2',
          timestamp: new Date().toISOString()
        }
      });

    } catch (apiError: any) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Kimi K2 API Error:', apiError.message);
      
      return NextResponse.json({
        success: false,
        error: apiError.message,
        model: model,
        processingTimeMs: processingTime
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Kimi K2 endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Kimi K2 processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Kimi K2 API is working',
    endpoints: {
      POST: '/api/kimi-k2 - Chat with Kimi K2 model'
    },
    available_models: [
      'moonshotai/kimi-k2:free',
      'moonshotai/kimi-k2',
      'moonshotai/kimi-k2-0905',
      'moonshotai/kimi-dev-72b:free',
      'moonshotai/kimi-dev-72b',
      'z-ai/glm-4.6',
      'z-ai/glm-4.5v',
      'deepseek/deepseek-chat-v3.1:free',
      'alibaba/tongyi-deepresearch-30b-a3b:free',
      'nvidia/nemotron-nano-9b-v2:free'
    ],
    requirements: [
      'OpenRouter API key configured',
      'Privacy settings configured for free models',
      'Credits purchased for paid models'
    ],
    usage: {
      free_models: 'Requires privacy settings configuration',
      paid_models: 'Requires OpenRouter credits',
      fallback: 'Use other free models like google/gemma-2-9b-it:free'
    }
  });
}
