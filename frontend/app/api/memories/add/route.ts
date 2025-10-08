import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { 
      text, 
      collection, 
      source = 'vault',
      metadata = {},
      tags = [],
      userId 
    } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 1. Get or create collection if specified
    let collectionId = null;
    if (collection) {
      const { data: existingCollection } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId)
        .eq('name', collection)
        .single();

      if (existingCollection) {
        collectionId = existingCollection.id;
      } else {
        const { data: newCollection, error: collectionError } = await supabase
          .from('collections')
          .insert({
            user_id: userId,
            name: collection,
            description: `Auto-created collection: ${collection}`,
          })
          .select('id')
          .single();

        if (collectionError) throw collectionError;
        collectionId = newCollection.id;
      }
    }

    // 2. Generate embedding for the text
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 3. Insert memory into database
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        user_id: userId,
        collection_id: collectionId,
        content: text,
        embedding: embedding,
        source: source,
        metadata: metadata,
        tags: tags,
        status: 'ready',
        content_type: 'text',
      })
      .select()
      .single();

    if (memoryError) throw memoryError;

    return NextResponse.json({
      success: true,
      resource_id: memory.id,
      collection: collection,
      status: 'ready',
      message: 'Memory added successfully',
    });
  } catch (error: any) {
    console.error('Error adding memory:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to add memory',
        status: 'failed'
      },
      { status: 500 }
    );
  }
}

