import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Use OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Model configurations using OpenAI models (affordable and high quality)
const MODEL_CONFIGS = {
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    useCase: 'Best for general tasks, analysis, and reports',
    speed: 'fast',
    cost: 'very low',
  },
  'gpt-4o': {
    model: 'gpt-4o',
    useCase: 'Best for complex reasoning and detailed analysis',
    speed: 'medium',
    cost: 'low',
  },
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    useCase: 'Fast and efficient for simple tasks',
    speed: 'very-fast',
    cost: 'very low',
  }
};

// Query type detection
function detectQueryType(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Math/calculation
  if (/\d+[\+\-\*\/\^]\d+|calculate|compute|solve|equation|formula/.test(lowerQuery)) {
    return 'math';
  }
  
  // Code-related
  if (/code|function|class|algorithm|debug|program|script|syntax/.test(lowerQuery)) {
    return 'code';
  }
  
  // Investment/financial
  if (/investment|financial|market|portfolio|risk|return|profit|loss|budget|revenue|earnings|stocks|bonds|real estate/.test(lowerQuery)) {
    return 'investment';
  }
  
  // Reports/summaries
  if (/report|summary|conclusion|recommendation|insight|findings|results|analysis/.test(lowerQuery)) {
    return 'report';
  }
  
  // Scientific/technical
  if (/scientific|research|hypothesis|experiment|theory/.test(lowerQuery)) {
    return 'scientific';
  }
  
  // Reasoning/complex
  if (/why|how does|explain|reasoning|logic|analyze|compare/.test(lowerQuery)) {
    return 'reasoning';
  }
  
  // Simple/general
  return 'general';
}

// Smart model selection based on query type
function selectModel(queryType: string, preferredModel?: string): string {
  if (preferredModel && MODEL_CONFIGS[preferredModel as keyof typeof MODEL_CONFIGS]) {
    return preferredModel;
  }

  const modelSelection: Record<string, string> = {
    'math': 'gpt-4o-mini',
    'code': 'gpt-4o-mini',
    'scientific': 'gpt-4o',
    'reasoning': 'gpt-4o',
    'general': 'gpt-4o-mini',
    'analysis': 'gpt-4o-mini',
    'investment': 'gpt-4o',
    'report': 'gpt-4o'
  };

  return modelSelection[queryType] || 'gpt-4o-mini';
}

export async function POST(req: NextRequest) {
  try {
    const { 
      query,
      documents,
      preferredModel,
      autoSelectModel = true
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // 1. Detect query type
    const queryType = detectQueryType(query);

    // 2. Select best model
    const selectedModelKey = autoSelectModel 
      ? selectModel(queryType, preferredModel)
      : (preferredModel || 'llama-3.1');

    const modelConfig = MODEL_CONFIGS[selectedModelKey as keyof typeof MODEL_CONFIGS];

    if (!modelConfig) {
      return NextResponse.json(
        { error: `Invalid model: ${selectedModelKey}` },
        { status: 400 }
      );
    }

    // Check if we have the OpenAI API key
    if (!OPENAI_API_KEY || !openai) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key is required but not configured',
          missingKey: 'OPENAI_API_KEY'
        },
        { status: 400 }
      );
    }

    // 3. Build context from documents
    const context = documents && documents.length > 0
      ? documents.map((doc: any, idx: number) => 
          `[Document ${idx + 1}]\n${doc.content}\n${doc.metadata ? `Metadata: ${JSON.stringify(doc.metadata)}` : ''}`
        ).join('\n\n')
      : '';

    // 4. Generate answer using OpenAI
    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [{
        role: 'user',
        content: context 
          ? `Based on the following documents, answer this question: ${query}\n\nDocuments:\n${context}\n\nProvide a clear, accurate answer based on the information provided.`
          : query
      }],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content || '';

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      answer,
      model: selectedModelKey,
      modelConfig: {
        model: modelConfig.model,
        useCase: modelConfig.useCase,
        speed: modelConfig.speed,
      },
      queryType,
      documentsUsed: documents?.length || 0,
      processingTime,
    });
  } catch (error: any) {
    console.error('Error generating answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate answer' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available models
export async function GET() {
  return NextResponse.json({
    models: Object.entries(MODEL_CONFIGS).map(([key, config]) => ({
      name: key,
      model: config.model,
      useCase: config.useCase,
      speed: config.speed,
    }))
  });
}

