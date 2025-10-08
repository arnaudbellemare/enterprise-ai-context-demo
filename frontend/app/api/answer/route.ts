import { NextRequest, NextResponse } from 'next/server';

// Use OpenRouter API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Model configurations using ACTUALLY FREE OpenRouter models (no credits required!)
const MODEL_CONFIGS = {
  'llama-3.2': {
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    useCase: 'Best for general tasks and analysis',
    speed: 'fast',
    cost: 'FREE',
  },
  'phi-3': {
    model: 'microsoft/phi-3-mini-128k-instruct:free',
    useCase: 'Good for code and technical tasks',
    speed: 'fast',
    cost: 'FREE',
  },
  'gemma-2': {
    model: 'google/gemma-2-9b-it:free',
    useCase: 'Best for reasoning and reports',
    speed: 'medium',
    cost: 'FREE',
  },
  'qwen': {
    model: 'qwen/qwen-2-7b-instruct:free',
    useCase: 'Fast for simple tasks',
    speed: 'very-fast',
    cost: 'FREE',
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
    'math': 'qwen',
    'code': 'phi-3',
    'scientific': 'gemma-2',
    'reasoning': 'gemma-2',
    'general': 'llama-3.2',
    'analysis': 'gemma-2',
    'investment': 'gemma-2',
    'report': 'gemma-2'
  };

  return modelSelection[queryType] || 'llama-3.2';
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

    // 4. Generate answer using OpenRouter (with GPT-4o-mini access!)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Enterprise AI Context Demo',
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
      const errorText = await response.text();
      console.error('❌ OpenRouter error:', response.status, errorText);
      console.error('❌ Model used:', modelConfig.model);
      console.error('❌ Selected model key:', selectedModelKey);
      throw new Error(`OpenRouter API failed: ${response.status} - ${errorText}`);
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

