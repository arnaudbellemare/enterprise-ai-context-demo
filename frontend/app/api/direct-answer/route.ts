import { NextRequest, NextResponse } from 'next/server';

/**
 * Direct Answer Generation API
 *
 * Generates actual answers using Perplexity API for Spanish legal queries
 * Bypasses the complex routing system for immediate results
 */

export async function POST(req: NextRequest) {
  try {
    const { query, domain = 'general', language = 'en', options = {} } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 Direct Answer: Generating response for ${language} ${domain} query`);
    console.log(`📝 Query length: ${query.length} characters`);

    const startTime = Date.now();

    // Use Perplexity API for high-quality responses
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

    if (!perplexityApiKey) {
      return NextResponse.json(
        {
          error: 'PERPLEXITY_API_KEY not configured',
          answer: 'API configuration required. Please set PERPLEXITY_API_KEY in .env.local',
          metadata: {
            generated: false,
            reason: 'missing_api_key'
          }
        },
        { status: 500 }
      );
    }

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are an expert in ${domain}. Provide detailed, accurate, and well-structured responses in ${language}. Use markdown formatting with headers (###), bullet points (•), and proper citations.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: domain === 'legal' ? ['legal', 'gov'] : []
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Perplexity API error: ${response.status} ${errorText}`);

      return NextResponse.json(
        {
          error: 'Perplexity API request failed',
          details: errorText,
          answer: `Error generating response: ${response.status}`,
          metadata: {
            generated: false,
            reason: 'api_error',
            status: response.status
          }
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // Extract answer from Perplexity response
    const answer = result.choices?.[0]?.message?.content || 'No response generated';
    const citations = result.citations || [];

    console.log(`✅ Direct Answer generated in ${executionTime}ms`);
    console.log(`📊 Answer length: ${answer.length} characters`);
    console.log(`📚 Citations: ${citations.length}`);

    return NextResponse.json({
      success: true,
      answer,
      metadata: {
        generated: true,
        model: 'llama-3.1-sonar-large-128k-online',
        provider: 'perplexity',
        language,
        domain,
        execution_time_ms: executionTime,
        answer_length: answer.length,
        citations_count: citations.length,
        citations: citations.slice(0, 5), // Top 5 citations
        usage: result.usage
      },
      performance: {
        latency_ms: executionTime,
        cost: (result.usage?.total_tokens || 0) * 0.000001, // Rough estimate
        cached: false
      },
      quality: {
        confidence: 0.9,
        accuracy_estimate: 0.85
      }
    });

  } catch (error: any) {
    console.error('❌ Direct Answer Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate answer',
        details: error.message,
        answer: `Error: ${error.message}`,
        metadata: {
          generated: false,
          reason: 'exception',
          error_type: error.name
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'Direct Answer API',
    description: 'Generates direct answers using Perplexity API',
    features: [
      'Multilingual support',
      'Domain-specific expertise',
      'Structured markdown output',
      'Citation support',
      'Fast response times'
    ],
    supported_languages: ['en', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ko', 'ar'],
    supported_domains: ['legal', 'medical', 'technical', 'business', 'general']
  });
}
