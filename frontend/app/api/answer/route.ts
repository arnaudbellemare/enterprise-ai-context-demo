import { NextRequest, NextResponse } from 'next/server';

// Use OpenRouter API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Model configurations using OpenRouter
const MODEL_CONFIGS = {
  'llama-3.1': {
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    useCase: 'General-purpose, fast, high-accuracy model',
    speed: 'fast',
  },
  'claude-3-haiku': {
    model: 'anthropic/claude-3-haiku',
    useCase: 'Lightweight, fast model for quick responses',
    speed: 'very-fast',
  },
  'claude-3-sonnet': {
    model: 'anthropic/claude-3.5-sonnet',
    useCase: 'Balanced performance for complex queries',
    speed: 'medium',
  },
  'gpt-4o-mini': {
    model: 'openai/gpt-4o-mini',
    useCase: 'Fast, efficient model for general tasks',
    speed: 'fast',
  },
  'gpt-4o': {
    model: 'openai/gpt-4o',
    useCase: 'Advanced reasoning for complex queries',
    speed: 'medium',
  },
  'o1-mini': {
    model: 'openai/o1-mini',
    useCase: 'Reasoning model for math, code, science',
    speed: 'slow',
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
  
  // Scientific/technical
  if (/scientific|research|analysis|hypothesis|experiment|theory/.test(lowerQuery)) {
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
    'math': 'o1-mini',
    'code': 'gpt-4o',
    'scientific': 'claude-3-sonnet',
    'reasoning': 'claude-3-sonnet',
    'general': 'claude-3-haiku',
  };

  return modelSelection[queryType] || 'claude-3-haiku';
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
      : (preferredModel || 'claude-3-haiku');

    const modelConfig = MODEL_CONFIGS[selectedModelKey as keyof typeof MODEL_CONFIGS];

    if (!modelConfig) {
      return NextResponse.json(
        { error: `Invalid model: ${selectedModelKey}` },
        { status: 400 }
      );
    }

    // Check if we have the OpenRouter API key
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenRouter API key is required but not configured',
          missingKey: 'OPENROUTER_API_KEY'
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

    // 4. Generate answer using OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: [{
          role: 'user',
          content: context 
            ? `Based on the following documents, answer this question: ${query}\n\nDocuments:\n${context}\n\nProvide a clear, accurate answer based on the information provided.`
            : query
        }],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed: ${response.status}`);
    }

    const responseData = await response.json();
    const answer = responseData.choices[0]?.message?.content || '';

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

