import { NextRequest, NextResponse } from 'next/server';

// Multi-source search with graceful error handling
export async function POST(req: NextRequest) {
  try {
    const { 
      query,
      sources = ['vault'],
      options = {},
      answer = false,
      answerModel = 'claude-3-haiku',
      userId
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const errors: Array<{ error: string; message: string; source: string }> = [];
    let allDocuments: any[] = [];

    // Process each source in parallel with error handling
    const sourcePromises = sources.map(async (source: string) => {
      try {
        switch (source) {
          case 'vault':
            return await searchVault(query, userId, options.vault || {});
          
          case 'web':
            return await searchWeb(query, options.web || {});
          
          case 'indexed':
            return await searchIndexed(query, userId, options.indexed || {});
          
          default:
            throw new Error(`Unknown source: ${source}`);
        }
      } catch (error: any) {
        errors.push({
          error: error.name || 'SourceError',
          message: error.message || `Failed to search ${source}`,
          source: source
        });
        return { documents: [], source };
      }
    });

    // Wait for all sources to complete (or fail gracefully)
    const results = await Promise.allSettled(sourcePromises);

    // Collect documents from successful sources
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value?.documents) {
        allDocuments = [...allDocuments, ...result.value.documents];
      }
    });

    // Remove duplicates based on content similarity
    const uniqueDocuments = deduplicateDocuments(allDocuments);

    // Sort by relevance (similarity score if available)
    uniqueDocuments.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    const response: any = {
      documents: uniqueDocuments,
      errors,
      query,
      sources,
      totalResults: uniqueDocuments.length,
      processingTime: Date.now() - startTime,
    };

    // Generate answer if requested
    if (answer && uniqueDocuments.length > 0) {
      try {
        const answerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            documents: uniqueDocuments.slice(0, 5), // Top 5 documents
            preferredModel: answerModel,
          }),
        });

        if (answerResponse.ok) {
          const answerData = await answerResponse.json();
          response.answer = answerData.answer;
          response.answerModel = answerData.model;
          response.answerMetadata = {
            queryType: answerData.queryType,
            documentsUsed: answerData.documentsUsed,
          };
        } else {
          errors.push({
            error: 'AnswerGenerationError',
            message: 'Failed to generate answer',
            source: 'answer_api'
          });
        }
      } catch (error: any) {
        errors.push({
          error: 'AnswerGenerationError',
          message: error.message || 'Failed to generate answer',
          source: 'answer_api'
        });
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in memories search:', error);
    return NextResponse.json(
      { 
        documents: [],
        errors: [{
          error: 'SearchError',
          message: error.message || 'Failed to search memories'
        }],
        query: '',
      },
      { status: 500 }
    );
  }
}

// Helper function to search vault (indexed memories)
async function searchVault(query: string, userId: string, options: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/search/indexed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      userId,
      collection: options.collection,
      matchThreshold: options.matchThreshold || 0.7,
      matchCount: options.matchCount || 10,
    }),
  });

  if (!response.ok) {
    throw new Error('Vault search failed');
  }

  const data = await response.json();
  return { documents: data.documents, source: 'vault' };
}

// Helper function to search web (using Perplexity)
async function searchWeb(query: string, options: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/perplexity/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: query }],
      searchRecencyFilter: options.recencyFilter || 'month',
    }),
  });

  if (!response.ok) {
    throw new Error('Web search failed');
  }

  const data = await response.json();
  
  // Convert Perplexity response to documents format
  const documents = data.citations?.map((citation: string, idx: number) => ({
    id: `web-${idx}`,
    content: citation,
    source: 'web',
    metadata: { url: citation },
    llm_summary: `Web search result: ${citation}`
  })) || [];

  return { documents, source: 'web' };
}

// Helper function to search indexed data
async function searchIndexed(query: string, userId: string, options: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/search/indexed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      userId,
      collection: options.collection,
      source: options.source,
      matchThreshold: options.matchThreshold || 0.7,
      matchCount: options.matchCount || 10,
    }),
  });

  if (!response.ok) {
    throw new Error('Indexed search failed');
  }

  const data = await response.json();
  return { documents: data.documents, source: 'indexed' };
}

// Helper function to deduplicate documents
function deduplicateDocuments(documents: any[]) {
  const seen = new Set();
  return documents.filter((doc) => {
    const key = doc.content.substring(0, 100); // Use first 100 chars as key
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

