import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize clients conditionally to avoid errors on missing API keys
function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Model configurations
const MODEL_CONFIGS = {
  'llama-3.1': {
    provider: 'openai',
    model: 'meta-llama/Llama-3.1-8B-Instruct',
    useCase: 'General-purpose, fast, high-accuracy model',
    speed: 'fast',
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    useCase: 'Lightweight, fast model for quick responses',
    speed: 'very-fast',
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    useCase: 'Balanced performance for complex queries',
    speed: 'medium',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    useCase: 'Fast, efficient model for general tasks',
    speed: 'fast',
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    useCase: 'Advanced reasoning for complex queries',
    speed: 'medium',
  },
  'o1-mini': {
    provider: 'openai',
    model: 'o1-mini',
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

    // Check if we have the required API keys
    const anthropic = getAnthropicClient();
    const openai = getOpenAIClient();

    if (modelConfig.provider === 'anthropic' && !anthropic) {
      return NextResponse.json(
        { 
          error: 'Anthropic API key is required but not configured',
          missingKey: 'ANTHROPIC_API_KEY'
        },
        { status: 400 }
      );
    }

    if (modelConfig.provider === 'openai' && !openai) {
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

    // 4. Generate answer using selected model
    let answer = '';
    
    if (modelConfig.provider === 'anthropic' && anthropic) {
      const response = await anthropic.messages.create({
        model: modelConfig.model,
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: context 
            ? `Based on the following documents, answer this question: ${query}\n\nDocuments:\n${context}\n\nProvide a clear, accurate answer based on the information provided.`
            : query
        }]
      });

      answer = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
    } else if (modelConfig.provider === 'openai' && openai) {
      const response = await openai.chat.completions.create({
        model: modelConfig.model,
        messages: [{
          role: 'user',
          content: context 
            ? `Based on the following documents, answer this question: ${query}\n\nDocuments:\n${context}\n\nProvide a clear, accurate answer based on the information provided.`
            : query
        }],
        max_tokens: 2048,
      });

      answer = response.choices[0].message.content || '';
    } else {
      return NextResponse.json(
        { 
          error: `API client not available for provider: ${modelConfig.provider}`,
          selectedModel: selectedModelKey,
          provider: modelConfig.provider
        },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      answer,
      model: selectedModelKey,
      modelConfig: {
        provider: modelConfig.provider,
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
      provider: config.provider,
      model: config.model,
      useCase: config.useCase,
      speed: config.speed,
    }))
  });
}

