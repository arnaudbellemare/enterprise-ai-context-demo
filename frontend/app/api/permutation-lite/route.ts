import { NextRequest, NextResponse } from 'next/server';
import { executePermutationLite, type PermutationLiteConfig } from '../../../lib/permutation-lite/permutation-lite-pipeline';

/**
 * PERMUTATION Lite API
 * 
 * Simplified 4-layer architecture respecting Miller's Law (7±2 items):
 * Route → Optimize → Learn → Verify
 * 
 * Request (≤7 fields):
 * - query (required)
 * - domain (optional)
 * - config (optional, ≤7 fields)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, domain, config } = body;

    // Validate input (≤7 validation checks)
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.length > 2000) {
      return NextResponse.json(
        { error: 'Query too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    if (domain && typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain must be a string' },
        { status: 400 }
      );
    }

    console.log('🚀 PERMUTATION Lite API Request:', {
      query: query.substring(0, 60),
      domain: domain || 'auto-detect',
      hasConfig: !!config,
    });

    // Execute pipeline
    const result = await executePermutationLite(query, domain, config as Partial<PermutationLiteConfig>);

    console.log('✅ PERMUTATION Lite completed:', {
      qualityScore: result.metadata.quality_score.toFixed(3),
      layers: result.metadata.layers_executed.length,
      totalTime: result.metadata.performance.total_time_ms,
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ PERMUTATION Lite API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * GET endpoint - API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'PERMUTATION Lite API',
    description: 'Simplified 4-layer AI pipeline respecting Miller\'s Law (7±2 items)',
    version: '1.0',
    architecture: {
      layers: 4,
      components: 4,
      mentalModel: 'Route → Optimize → Learn → Verify',
      millersLaw: '7±2 compliant',
    },
    endpoint: 'POST /api/permutation-lite',
    request: {
      query: 'string (required) - The query to process',
      domain: 'string (optional) - Domain hint (auto-detected if not provided)',
      config: {
        enableOptimization: 'boolean (optional, default: true)',
        enableLearning: 'boolean (optional, default: true)',
        enableVerification: 'boolean (optional, default: true)',
        difficultyThreshold: 'number (optional, default: 0.5)',
        maxVerificationIterations: 'number (optional, default: 3)',
      },
    },
    response: {
      success: 'boolean',
      result: {
        answer: 'string',
        metadata: {
          domain: 'string',
          difficulty: 'number',
          quality_score: 'number',
          layers_executed: 'string[]',
          performance: {
            total_time_ms: 'number',
            cost: 'number',
          },
        },
      },
      timestamp: 'ISO string',
    },
    example: {
      request: {
        query: 'What are current crypto market trends?',
        domain: 'crypto',
      },
      response: {
        success: true,
        result: {
          answer: '...',
          metadata: {
            domain: 'crypto',
            difficulty: 0.65,
            quality_score: 0.85,
            layers_executed: ['routing', 'optimization', 'learning', 'verification'],
            performance: {
              total_time_ms: 1500,
              cost: 0.002,
            },
          },
        },
      },
    },
  });
}

