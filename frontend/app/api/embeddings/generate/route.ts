import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI lazily (not during build time)
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }
  return openai;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { text, texts } = await req.json();

    // Support both single text and batch texts
    const inputTexts = texts || [text];

    if (!inputTexts || inputTexts.length === 0) {
      return NextResponse.json(
        { error: 'Text or texts array is required' },
        { status: 400 }
      );
    }

    // Generate embeddings using OpenAI's text-embedding-3-small model
    const response = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: inputTexts,
      encoding_format: 'float',
    });

    const embeddings = response.data.map((item) => item.embedding);

    // Return single embedding or array based on input
    return NextResponse.json({
      embeddings: texts ? embeddings : embeddings[0],
      model: 'text-embedding-3-small',
      dimensions: 1536,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}

