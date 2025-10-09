import { NextRequest, NextResponse } from 'next/server';

// LLM Provider Configuration (Ollama Cloud/Local + OpenRouter fallback)
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED === 'true';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Model configurations with Ollama + OpenRouter fallback
const MODEL_CONFIGS = {
  'gemma-3': {
    ollama: 'gemma3:4b',
    openrouter: 'google/gemma-2-9b-it:free',
    useCase: 'Best for analysis and reports (MacBook Air optimized)',
    speed: 'fast',
  },
  'llama-3.2': {
    ollama: 'llama3.2:3b',
    openrouter: 'meta-llama/llama-3.2-3b-instruct:free',
    useCase: 'Good for general tasks',
    speed: 'fast',
  },
  'phi-3': {
    ollama: 'phi3:mini',
    openrouter: 'microsoft/phi-3-mini-128k-instruct:free',
    useCase: 'Good for code and technical tasks',
    speed: 'fast',
  },
  'gemma-2': {
    ollama: 'gemma2:9b',
    openrouter: 'google/gemma-2-9b-it:free',
    useCase: 'Best for reasoning and reports',
    speed: 'medium',
  },
  'qwen': {
    ollama: 'qwen2.5:3b',
    openrouter: 'qwen/qwen-2-7b-instruct:free',
    useCase: 'Fast for simple tasks',
    speed: 'very-fast',
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
    'scientific': 'gemma-3',
    'reasoning': 'gemma-3',
    'general': 'gemma-3',
    'analysis': 'gemma-3',
    'investment': 'gemma-3',
    'report': 'gemma-3'
  };

  return modelSelection[queryType] || 'gemma-3';
}

export async function POST(req: NextRequest) {
  try {
    const { 
      query,
      documents,
      preferredModel,
      autoSelectModel = true,
      queryType: explicitQueryType // Allow explicit query type from request
    } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // 1. Detect query type (use explicit if provided, otherwise detect)
    const queryType = explicitQueryType || detectQueryType(query);

    // 2. Select best model
    const selectedModelKey = autoSelectModel 
      ? selectModel(queryType, preferredModel)
      : (preferredModel || 'gemma-3');

    const modelConfig = MODEL_CONFIGS[selectedModelKey as keyof typeof MODEL_CONFIGS];

    if (!modelConfig) {
      return NextResponse.json(
        { error: `Invalid model: ${selectedModelKey}` },
        { status: 400 }
      );
    }

    // Check if we have at least one LLM provider configured
    const hasOllama = OLLAMA_ENABLED && (OLLAMA_API_KEY || OLLAMA_BASE_URL);
    const hasOpenRouter = !!OPENROUTER_API_KEY;
    
    if (!hasOllama && !hasOpenRouter) {
      return NextResponse.json(
        { 
          error: 'No LLM provider configured. Set OLLAMA_API_KEY or OPENROUTER_API_KEY',
          missingKeys: ['OLLAMA_API_KEY', 'OPENROUTER_API_KEY']
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

    // 4. Generate answer using Ollama (primary) or OpenRouter (fallback)
    let answer = '';
    let usedProvider = 'unknown';
    let usedModel = '';
    
    // Try Ollama first if enabled
    if (hasOllama) {
      try {
        console.log(`🦙 Trying Ollama: ${modelConfig.ollama}`);
        const ollamaUrl = OLLAMA_API_KEY 
          ? `${OLLAMA_BASE_URL}/v1/chat/completions`  // Ollama Cloud
          : `${OLLAMA_BASE_URL}/v1/chat/completions`; // Local Ollama
        
        const ollamaHeaders: any = { 'Content-Type': 'application/json' };
        if (OLLAMA_API_KEY) {
          ollamaHeaders['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
        }
        
        const ollamaResponse = await fetch(ollamaUrl, {
          method: 'POST',
          headers: ollamaHeaders,
          body: JSON.stringify({
            model: modelConfig.ollama,
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

        if (ollamaResponse.ok) {
          const data = await ollamaResponse.json();
          answer = data.choices[0]?.message?.content || '';
          usedProvider = OLLAMA_API_KEY ? 'Ollama Cloud' : 'Ollama Local';
          usedModel = modelConfig.ollama;
          console.log(`✅ Ollama success: ${usedModel}`);
        } else {
          throw new Error(`Ollama failed: ${ollamaResponse.status}`);
        }
      } catch (ollamaError) {
        console.warn(`⚠️ Ollama failed, falling back to OpenRouter:`, ollamaError);
        // Fall through to OpenRouter
      }
    }
    
    // Fallback to OpenRouter if Ollama failed or not enabled
    if (!answer && hasOpenRouter) {
      console.log(`🔄 Using OpenRouter: ${modelConfig.openrouter}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Enterprise AI Context Demo',
        },
        body: JSON.stringify({
          model: modelConfig.openrouter,
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
        throw new Error(`OpenRouter API failed: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      answer = responseData.choices[0]?.message?.content || '';
      usedProvider = 'OpenRouter';
      usedModel = modelConfig.openrouter;
      console.log(`✅ OpenRouter success: ${usedModel}`);
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      answer,
      model: selectedModelKey,
      modelConfig: {
        ollamaModel: modelConfig.ollama,
        openrouterModel: modelConfig.openrouter,
        useCase: modelConfig.useCase,
        speed: modelConfig.speed,
      },
      provider: usedProvider,
      actualModel: usedModel,
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

