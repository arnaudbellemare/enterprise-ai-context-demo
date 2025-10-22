import { NextRequest, NextResponse } from 'next/server';

/**
 * Unified Brain API
 * Consolidates all brain systems with strategy selection
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      strategy = 'auto', // 'original', 'modular', 'moe', 'auto'
      context = {},
      sessionId,
      priority = 'normal',
      budget,
      maxLatency,
      requiredQuality
    } = await request.json();

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    console.log(`🧠 Unified Brain: Processing "${query.substring(0, 50)}..." with strategy: ${strategy}`);

    // Strategy selection logic
    let selectedStrategy = strategy;
    if (strategy === 'auto') {
      selectedStrategy = await selectOptimalStrategy(query, context, {
        priority,
        budget,
        maxLatency,
        requiredQuality
      });
    }

    console.log(`🧠 Unified Brain: Selected strategy: ${selectedStrategy}`);

    // Route to appropriate system
    let response;
    switch (selectedStrategy) {
      case 'original':
        response = await callOriginalBrain(query, context);
        break;
      case 'modular':
        response = await callModularBrain(query, context);
        break;
      case 'moe':
        response = await callMoEBrain(query, context, sessionId, priority, budget, maxLatency, requiredQuality);
        break;
      default:
        response = await callMoEBrain(query, context, sessionId, priority, budget, maxLatency, requiredQuality);
    }

    // Add unified metadata
    response.metadata = {
      ...response.metadata,
      strategy: selectedStrategy,
      unified: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Unified Brain API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'Unified brain system unavailable'
    }, { status: 500 });
  }
}

/**
 * Auto-select optimal strategy based on query characteristics
 */
async function selectOptimalStrategy(
  query: string, 
  context: any, 
  constraints: any
): Promise<string> {
  // Simple heuristic-based selection
  const queryLength = query.length;
  const complexity = context.complexity || 5;
  const domain = context.domain || 'general';
  
  // High complexity + technical domain = MoE
  if (complexity >= 7 && ['technology', 'science', 'engineering'].includes(domain)) {
    return 'moe';
  }
  
  // Simple queries = Original (fastest)
  if (queryLength < 50 && complexity <= 3) {
    return 'original';
  }
  
  // Medium complexity = Modular (balanced)
  if (complexity >= 4 && complexity <= 6) {
    return 'modular';
  }
  
  // Default to MoE for best quality
  return 'moe';
}

/**
 * Call Original Brain System
 */
async function callOriginalBrain(query: string, context: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/brain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, context })
  });
  
  return await response.json();
}

/**
 * Call Modular Brain System
 */
async function callModularBrain(query: string, context: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/brain-enhanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, context })
  });
  
  return await response.json();
}

/**
 * Call MoE Brain System
 */
async function callMoEBrain(
  query: string, 
  context: any, 
  sessionId?: string, 
  priority?: string, 
  budget?: number, 
  maxLatency?: number, 
  requiredQuality?: number
) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/brain-moe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      context,
      sessionId,
      priority,
      budget,
      maxLatency,
      requiredQuality
    })
  });
  
  return await response.json();
}

/**
 * GET /api/brain-unified
 * System status and capabilities
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    system: 'Unified Brain API',
    version: '1.0.0',
    strategies: {
      original: {
        description: 'Original stable brain system',
        features: ['fast', 'reliable', 'no-caching'],
        cost: 'low',
        quality: 'medium'
      },
      modular: {
        description: 'New modular system with caching',
        features: ['caching', 'metrics', 'optimization'],
        cost: 'medium',
        quality: 'high'
      },
      moe: {
        description: 'MoE advanced orchestration',
        features: ['self-improvement', 'multi-expert', 'load-balancing'],
        cost: 'medium',
        quality: 'highest'
      },
      auto: {
        description: 'Automatic strategy selection',
        features: ['intelligent-routing', 'optimization'],
        cost: 'variable',
        quality: 'optimized'
      }
    },
    recommendations: {
      simple_queries: 'original',
      complex_queries: 'moe',
      production_use: 'moe',
      cost_optimization: 'modular'
    }
  });
}
