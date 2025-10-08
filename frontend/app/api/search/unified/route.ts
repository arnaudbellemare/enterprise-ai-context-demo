import { NextRequest, NextResponse } from 'next/server';

/**
 * Unified Search API
 * Combines indexed search (vector embeddings) and live search (web, real-time data)
 * with intelligent result merging and ranking
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      query,
      userId,
      sources = ['indexed', 'web'],
      options = {
        indexed: {},
        web: {}
      },
      answer = false,
      answerModel = 'claude-3-haiku',
      mergeStrategy = 'hybrid', // 'indexed-first', 'live-first', 'hybrid'
      maxResults = 20
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const errors: Array<{ error: string; message: string; source: string }> = [];
    const results: {
      indexed: any[];
      live: any[];
    } = {
      indexed: [],
      live: []
    };

    // Parallel search execution with error handling
    const searchPromises: Promise<void>[] = [];

    // Indexed search (if requested)
    if (sources.includes('indexed') || sources.includes('vault')) {
      searchPromises.push(
        (async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/search/indexed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query,
                userId,
                ...options.indexed,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              results.indexed = data.documents || [];
            } else {
              throw new Error('Indexed search failed');
            }
          } catch (error: any) {
            errors.push({
              error: 'IndexedSearchError',
              message: error.message || 'Failed to perform indexed search',
              source: 'indexed'
            });
          }
        })()
      );
    }

    // Live web search (if requested)
    if (sources.includes('web') || sources.includes('live')) {
      searchPromises.push(
        (async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/perplexity/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [{ role: 'user', content: query }],
                searchRecencyFilter: options.web?.recencyFilter || 'month',
              }),
            });

            if (response.ok) {
              const data = await response.json();
              
              // Convert web results to unified format
              const webDocuments = data.citations?.map((citation: string, idx: number) => ({
                id: `web-${idx}`,
                content: citation,
                source: 'web',
                similarity: 0.8, // Default similarity for web results
                metadata: { 
                  url: citation,
                  type: 'web_search'
                },
                llm_summary: `Live web search result: ${citation}`
              })) || [];

              results.live = webDocuments;
            } else {
              throw new Error('Web search failed');
            }
          } catch (error: any) {
            errors.push({
              error: 'WebSearchError',
              message: error.message || 'Failed to perform web search',
              source: 'web'
            });
          }
        })()
      );
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    // Merge and rank results based on strategy
    let mergedDocuments = mergeResults(
      results.indexed,
      results.live,
      mergeStrategy,
      maxResults
    );

    // Build response
    const response: any = {
      documents: mergedDocuments,
      errors,
      query,
      sources,
      totalResults: mergedDocuments.length,
      sourceBreakdown: {
        indexed: results.indexed.length,
        live: results.live.length,
      },
      mergeStrategy,
      processingTime: Date.now() - startTime,
    };

    // Generate answer if requested
    if (answer && mergedDocuments.length > 0) {
      try {
        const answerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            documents: mergedDocuments.slice(0, 5), // Top 5 documents
            preferredModel: answerModel,
            autoSelectModel: true,
          }),
        });

        if (answerResponse.ok) {
          const answerData = await answerResponse.json();
          response.answer = answerData.answer;
          response.answerModel = answerData.model;
          response.answerMetadata = {
            queryType: answerData.queryType,
            documentsUsed: answerData.documentsUsed,
            modelConfig: answerData.modelConfig,
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
    console.error('Error in unified search:', error);
    return NextResponse.json(
      { 
        documents: [],
        errors: [{
          error: 'UnifiedSearchError',
          message: error.message || 'Failed to perform unified search'
        }],
        query: '',
      },
      { status: 500 }
    );
  }
}

/**
 * Merge results from indexed and live searches
 */
function mergeResults(
  indexedDocs: any[],
  liveDocs: any[],
  strategy: string,
  maxResults: number
): any[] {
  let merged: any[] = [];

  switch (strategy) {
    case 'indexed-first':
      // Prioritize indexed results
      merged = [
        ...indexedDocs.slice(0, Math.floor(maxResults * 0.7)),
        ...liveDocs.slice(0, Math.floor(maxResults * 0.3))
      ];
      break;

    case 'live-first':
      // Prioritize live results
      merged = [
        ...liveDocs.slice(0, Math.floor(maxResults * 0.7)),
        ...indexedDocs.slice(0, Math.floor(maxResults * 0.3))
      ];
      break;

    case 'hybrid':
    default:
      // Interleave results based on similarity scores
      const allDocs = [...indexedDocs, ...liveDocs];
      
      // Sort by similarity score (if available)
      allDocs.sort((a, b) => (b.similarity || 0.5) - (a.similarity || 0.5));
      
      // Remove duplicates based on content similarity
      merged = deduplicateDocuments(allDocs);
      break;
  }

  return merged.slice(0, maxResults);
}

/**
 * Deduplicate documents based on content similarity
 */
function deduplicateDocuments(documents: any[]): any[] {
  const seen = new Set<string>();
  return documents.filter((doc) => {
    // Use first 150 characters as fingerprint
    const fingerprint = doc.content.substring(0, 150).toLowerCase().trim();
    
    if (seen.has(fingerprint)) {
      return false;
    }
    
    seen.add(fingerprint);
    return true;
  });
}

/**
 * GET endpoint to show available search options
 */
export async function GET() {
  return NextResponse.json({
    description: 'Unified search API combining indexed and live search',
    sources: [
      {
        name: 'indexed',
        description: 'Pre-indexed vector embeddings from your vault',
        type: 'indexed'
      },
      {
        name: 'web',
        description: 'Live web search using Perplexity',
        type: 'live'
      }
    ],
    mergeStrategies: [
      {
        name: 'hybrid',
        description: 'Intelligent mixing of indexed and live results based on relevance'
      },
      {
        name: 'indexed-first',
        description: 'Prioritize indexed results (70% indexed, 30% live)'
      },
      {
        name: 'live-first',
        description: 'Prioritize live results (70% live, 30% indexed)'
      }
    ]
  });
}

