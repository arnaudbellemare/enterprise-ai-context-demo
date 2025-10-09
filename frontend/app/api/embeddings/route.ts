import { NextResponse } from 'next/server';

/**
 * EMBEDDING GENERATION API
 * Generates vector embeddings for semantic search
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 */

export async function POST(request: Request) {
  try {
    const { text, texts } = await request.json();
    
    // Support both single and batch embedding generation
    const inputTexts = texts || [text];
    
    if (!inputTexts || inputTexts.length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }
    
    console.log(`🔢 Generating embeddings for ${inputTexts.length} text(s)`);
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured - using mock embeddings');
      return NextResponse.json({
        success: true,
        embeddings: inputTexts.map(() => generateMockEmbedding()),
        model: 'mock-embedding',
        dimensions: 1536,
        note: 'Using mock embeddings - configure OPENAI_API_KEY for real embeddings'
      });
    }
    
    // Call OpenAI Embeddings API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: inputTexts,
        model: 'text-embedding-3-small', // 1536 dimensions, cost-effective
        encoding_format: 'float'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI API error:', error);
      
      // Fallback to mock embeddings
      return NextResponse.json({
        success: true,
        embeddings: inputTexts.map(() => generateMockEmbedding()),
        model: 'mock-embedding-fallback',
        dimensions: 1536,
        note: 'OpenAI API failed - using mock embeddings'
      });
    }
    
    const data = await response.json();
    const embeddings = data.data.map((item: any) => item.embedding);
    
    console.log(`✅ Generated ${embeddings.length} embeddings`);
    
    return NextResponse.json({
      success: true,
      embeddings: embeddings,
      embedding: embeddings[0], // For single text requests
      model: 'text-embedding-3-small',
      dimensions: 1536,
      usage: data.usage
    });
    
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock embedding for testing/fallback
 * Creates a random but normalized 1536-dimensional vector
 */
function generateMockEmbedding(): number[] {
  const dimensions = 1536;
  const embedding = Array.from({ length: dimensions }, () => Math.random() - 0.5);
  
  // Normalize to unit length (as real embeddings are)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * GET endpoint for testing
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testText = searchParams.get('text') || 'Test embedding';
  
  const response = await POST(
    new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText })
    })
  );
  
  return response;
}

