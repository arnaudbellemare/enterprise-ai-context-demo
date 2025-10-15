import { NextRequest, NextResponse } from 'next/server';
import { WeaviateRetrieveDSPyIntegration } from '../../../lib/weaviate-retrieve-dspy-integration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const integration = new WeaviateRetrieveDSPyIntegration({
  baseUrl: process.env.WEAVIATE_URL || 'http://localhost:8080',
  apiKey: process.env.WEAVIATE_API_KEY,
  collection: process.env.WEAVIATE_COLLECTION || 'documents'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      domain, 
      method = 'enhanced',
      expansionMethod = 'RAGFusion',
      rerankingMethod = 'CrossEncoder'
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Weaviate Retrieve-DSPy: Processing query "${query}"`);

    let result: any = {};

    switch (method) {
      case 'enhanced':
        result = await integration.enhancedRetrieval(query, domain);
        break;
      
      case 'expansion':
        const expansion = await integration.queryExpansion.ragFusion(query);
        result = { expansion };
        break;
      
      case 'hybrid':
        const hybrid = await integration.hybridSearch.hybridSearch(query);
        result = { hybrid };
        break;
      
      case 'reranking':
        // Mock some results for reranking
        const mockResults = [
          { id: '1', content: 'Sample result 1', metadata: {} },
          { id: '2', content: 'Sample result 2', metadata: {} },
          { id: '3', content: 'Sample result 3', metadata: {} }
        ];
        const reranking = await integration.reranking.crossEncoderReranking(mockResults, query);
        result = { reranking };
        break;
      
      case 'methods':
        result = integration.getAvailableMethods();
        break;
      
      default:
        result = await integration.enhancedRetrieval(query, domain);
    }

    return NextResponse.json({
      success: true,
      method,
      query,
      domain,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Weaviate Retrieve-DSPy API Error:', error);
    return NextResponse.json(
      { 
        error: 'Weaviate Retrieve-DSPy processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const methods = integration.getAvailableMethods();
    
    return NextResponse.json({
      success: true,
      message: 'Weaviate Retrieve-DSPy Integration',
      availableMethods: methods,
      description: 'Advanced compound retrieval systems from https://github.com/weaviate/retrieve-dspy',
      features: [
        '26+ advanced retrieval strategies',
        'Query expansion (HyDE, LameR, ThinkQE, RAGFusion)',
        'Advanced reranking (CrossEncoder, Listwise, Layered)',
        'Hybrid search (Vector + Keyword)',
        'Multi-query generation',
        'Compound AI systems'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Weaviate Retrieve-DSPy GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get Weaviate Retrieve-DSPy info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
