import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use OpenRouter for embeddings
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize Supabase client only if credentials are available
function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  
  // Check if it's a placeholder URL
  if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    return null;
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(req: NextRequest) {
  try {
    const { 
      query,
      userId,
      collection,
      source,
      matchThreshold = 0.7,
      matchCount = 10,
      includeMetadata = true
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if Supabase is available
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Return mock data when Supabase is not available
      return NextResponse.json({
        documents: [
          {
            id: 'mock-1',
            content: `Mock property data for: ${query}. This would normally search your indexed property database.`,
            similarity: 0.95,
            metadata: { source: 'mock', collection: 'properties' },
            source: 'indexed',
            llm_summary: `Mock property search results for: ${query}`
          },
          {
            id: 'mock-2', 
            content: `Additional mock property information related to: ${query}. Configure Supabase for real data.`,
            similarity: 0.87,
            metadata: { source: 'mock', collection: 'properties' },
            source: 'indexed',
            llm_summary: `More mock property data for: ${query}`
          }
        ],
        errors: [],
        query: query,
        source: 'indexed',
        totalResults: 2,
        processingTime: 50,
        searchMetadata: {
          model: 'mock-data',
          matchThreshold,
          collection: collection || 'all',
          note: 'Using mock data - configure Supabase for real search'
        }
      });
    }

    const startTime = Date.now();

    // 1. Generate embedding for the query using OpenRouter
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({
        documents: [],
        errors: [{
          error: 'OpenRouterAPIKeyMissing',
          message: 'OpenRouter API key is required but not configured'
        }],
        query: query,
        source: 'indexed'
      }, { status: 400 });
    }

    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float',
      }),
    });

    if (!embeddingResponse.ok) {
      console.error('OpenRouter embedding failed:', embeddingResponse.status);
      // Fall back to mock data if embedding generation fails
      return NextResponse.json({
        documents: [
          {
            id: 'mock-1',
            content: `Mock property data for: ${query}. Embedding generation failed - using mock data.`,
            similarity: 0.95,
            metadata: { source: 'mock', collection: 'properties' },
            source: 'indexed',
            llm_summary: `Mock property search results for: ${query}`
          },
          {
            id: 'mock-2', 
            content: `Additional mock property information related to: ${query}. Configure OpenRouter for real embeddings.`,
            similarity: 0.87,
            metadata: { source: 'mock', collection: 'properties' },
            source: 'indexed',
            llm_summary: `More mock property data for: ${query}`
          }
        ],
        errors: [],
        query: query,
        source: 'indexed',
        totalResults: 2,
        processingTime: 50,
        searchMetadata: {
          model: 'mock-data',
          matchThreshold,
          collection: collection || 'all',
          note: 'Using mock data - embedding generation failed'
        }
      });
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // 2. Get collection ID if specified
    let collectionId = null;
    if (collection) {
      const { data: collectionData } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId)
        .eq('name', collection)
        .single();

      collectionId = collectionData?.id;

      if (!collectionId) {
        return NextResponse.json({
          documents: [],
          errors: [{
            error: 'CollectionNotFound',
            message: `Collection '${collection}' not found for this user`
          }],
          query: query,
          source: 'indexed',
          processingTime: Date.now() - startTime
        });
      }
    }

    // 3. Perform vector similarity search using the match_memories function
    const { data: matches, error: searchError } = await supabase
      .rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_user_id: userId,
        filter_collection_id: collectionId,
        filter_source: source
      });

    if (searchError) {
      console.error('Supabase search error:', searchError);
      // Fall back to mock data if database is not properly configured
      return NextResponse.json({
        documents: [
          {
            id: 'mock-1',
            content: `Mock property data for: ${query}. Database not configured - using mock data.`,
            similarity: 0.95,
            metadata: { source: 'mock', collection: 'properties' },
            source: 'indexed',
            llm_summary: `Mock property search results for: ${query}`
          },
          {
            id: 'mock-2', 
            content: `Additional mock property information related to: ${query}. Configure database for real data.`,
            similarity: 0.87,
            metadata: { source: 'mock', collection: 'properties' },
            source: 'indexed',
            llm_summary: `More mock property data for: ${query}`
          }
        ],
        errors: [],
        query: query,
        source: 'indexed',
        totalResults: 2,
        processingTime: 50,
        searchMetadata: {
          model: 'mock-data',
          matchThreshold,
          collection: collection || 'all',
          note: 'Using mock data - database not configured'
        }
      });
    }

    // 4. Format results
    const documents = matches.map((match: any) => ({
      id: match.id,
      content: match.content,
      similarity: match.similarity,
      metadata: includeMetadata ? match.metadata : undefined,
      source: 'indexed',
      llm_summary: `Relevant content from your indexed data: ${match.content.substring(0, 200)}...`
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      documents,
      errors: [],
      query: query,
      source: 'indexed',
      totalResults: documents.length,
      processingTime,
      searchMetadata: {
        model: 'text-embedding-3-small',
        matchThreshold,
        collection: collection || 'all',
        vectorDimensions: 1536
      }
    });
  } catch (error: any) {
    console.error('Error in indexed search:', error);
    
    // Return mock data when any error occurs
    return NextResponse.json({
      documents: [
        {
          id: 'mock-1',
          content: `Mock property data. Search failed - using mock data: ${error.message || 'Unknown error'}`,
          similarity: 0.95,
          metadata: { source: 'mock', collection: 'properties' },
          source: 'indexed',
          llm_summary: `Mock property search results`
        },
        {
          id: 'mock-2', 
          content: `Additional mock property information. Configure services for real data.`,
          similarity: 0.87,
          metadata: { source: 'mock', collection: 'properties' },
          source: 'indexed',
          llm_summary: `More mock property data`
        }
      ],
      errors: [],
      query: query || 'unknown query',
      source: 'indexed',
      totalResults: 2,
      processingTime: 50,
      searchMetadata: {
        model: 'mock-data',
        matchThreshold: 0.7,
        collection: 'all',
        note: 'Using mock data - search failed'
      }
    });
  }
}

