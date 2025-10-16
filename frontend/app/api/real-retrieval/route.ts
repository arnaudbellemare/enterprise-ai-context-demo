import { NextRequest, NextResponse } from 'next/server';
import RealRetrievalSystem, { Document } from '../../../lib/real-retrieval-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize the real retrieval system
const retrievalSystem = new RealRetrievalSystem();

// Sample documents for testing (replace with your actual documents)
const SAMPLE_DOCUMENTS: Document[] = [
  {
    id: 'doc1',
    content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.',
    metadata: { category: 'AI', source: 'ML Basics' }
  },
  {
    id: 'doc2', 
    content: 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes that process information.',
    metadata: { category: 'AI', source: 'Neural Networks' }
  },
  {
    id: 'doc3',
    content: 'Deep learning uses neural networks with multiple layers to model and understand complex patterns in data.',
    metadata: { category: 'AI', source: 'Deep Learning' }
  },
  {
    id: 'doc4',
    content: 'Natural language processing (NLP) is a field of AI that focuses on the interaction between computers and humans through natural language.',
    metadata: { category: 'NLP', source: 'Language Processing' }
  },
  {
    id: 'doc5',
    content: 'Computer vision is a field of AI that trains computers to interpret and understand visual information from the world.',
    metadata: { category: 'Vision', source: 'Image Processing' }
  },
  {
    id: 'doc6',
    content: 'Reinforcement learning is a type of machine learning where agents learn to make decisions by taking actions in an environment.',
    metadata: { category: 'RL', source: 'Learning Algorithms' }
  },
  {
    id: 'doc7',
    content: 'Supervised learning uses labeled training data to learn a mapping from inputs to outputs.',
    metadata: { category: 'ML', source: 'Learning Types' }
  },
  {
    id: 'doc8',
    content: 'Unsupervised learning finds hidden patterns in data without labeled examples.',
    metadata: { category: 'ML', source: 'Learning Types' }
  },
  {
    id: 'doc9',
    content: 'Feature engineering is the process of selecting and transforming variables to improve model performance.',
    metadata: { category: 'ML', source: 'Data Processing' }
  },
  {
    id: 'doc10',
    content: 'Model evaluation metrics like accuracy, precision, recall, and F1-score help assess model performance.',
    metadata: { category: 'ML', source: 'Evaluation' }
  }
];

// Initialize with sample documents
retrievalSystem.addDocuments(SAMPLE_DOCUMENTS);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      query, 
      method = 'hybrid',
      limit = 5,
      expansionMethod = 'synonyms'
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Real Retrieval: Processing query "${query}" with method "${method}"`);

    let result: any = {};

    switch (method) {
      case 'hybrid':
        result = await retrievalSystem.hybridSearch(query, limit);
        break;
      
      case 'expanded':
        result = await retrievalSystem.expandedSearch(query, limit, expansionMethod);
        break;
      
      case 'vector':
        const vectorResults = await retrievalSystem['documentStore'].searchDocuments(query, limit);
        result = {
          documents: vectorResults,
          query,
          totalResults: vectorResults.length,
          searchTime: 0,
          method: 'vector-search'
        };
        break;
      
      case 'keyword':
        const keywordResults = await retrievalSystem['documentStore'].keywordSearch(query, limit);
        result = {
          documents: keywordResults,
          query,
          totalResults: keywordResults.length,
          searchTime: 0,
          method: 'keyword-search'
        };
        break;
      
      case 'stats':
        result = retrievalSystem.getStats();
        break;
      
      default:
        result = await retrievalSystem.hybridSearch(query, limit);
    }

    return NextResponse.json({
      success: true,
      method,
      query,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Real Retrieval API Error:', error);
    return NextResponse.json(
      { 
        error: 'Real retrieval processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = retrievalSystem.getStats();
    
    return NextResponse.json({
      success: true,
      message: 'Real Retrieval System',
      description: 'Actual retrieval implementation without mock data',
      features: [
        'Real embedding generation using Ollama',
        'Actual vector similarity search',
        'Real keyword matching',
        'LLM-based query expansion',
        'LLM-based relevance reranking',
        'Hybrid search combining multiple methods'
      ],
      stats,
      availableMethods: [
        'hybrid - Combines vector and keyword search with reranking',
        'expanded - Uses LLM to expand queries before searching',
        'vector - Pure vector similarity search',
        'keyword - Traditional keyword matching',
        'stats - Get system statistics'
      ],
      expansionMethods: [
        'synonyms - Generate synonym variations',
        'context - Generate contextual variations', 
        'reasoning - Break into sub-questions'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Real Retrieval GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get real retrieval info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
