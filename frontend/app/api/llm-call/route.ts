import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let prompt: string = '';
  
  try {
    const body = await request.json();
    prompt = body.prompt;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt parameter' },
        { status: 400 }
      );
    }

    // Make real OpenAI API call
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using cost-effective model for real testing
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI assistant focused on task execution and analysis. Provide concise, accurate responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent results
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openaiResponse.json();
    const response = data.choices[0]?.message?.content || 'No response generated';

    // Log the API usage for cost tracking
    console.log(`LLM API Call - Tokens used: ${data.usage?.total_tokens || 'unknown'}`);

    return NextResponse.json({ 
      response,
      usage: data.usage || null
    });

  } catch (error: any) {
    console.error('Error in /api/llm-call:', error);
    
    // Return mock response if API fails (for development)
    const errorMessage = error?.message || '';
    
    if (errorMessage.includes('API key') || errorMessage.includes('OpenAI')) {
      return NextResponse.json({
        response: `Mock LLM response for development: ${prompt.substring(0, Math.min(100, prompt.length))}...`,
        usage: { total_tokens: 50, prompt_tokens: 25, completion_tokens: 25 },
        mock: true
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to process LLM request' },
      { status: 500 }
    );
  }
}
