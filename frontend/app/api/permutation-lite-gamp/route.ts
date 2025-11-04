/**
 * Permutation-Lite GAMP Pipeline API Route
 *
 * Demonstrates using the GAMP-integrated pipeline for scientific queries.
 *
 * Features:
 * - Automatic GAMP activation for scientific domains (biology, chemistry, physics)
 * - IRT-based routing (activates when difficulty > 0.7)
 * - Parallel execution (GEPA + GAMP + Learning)
 * - Comprehensive metadata with graph reasoning results
 *
 * Usage:
 * POST /api/permutation-lite-gamp
 * {
 *   "query": "How can CRISPR be used to treat genetic diseases?",
 *   "domain": "biology",
 *   "enableGAMP": true,
 *   "enableOptimization": true,
 *   "enableLearning": true
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { PermutationLiteGAMPPipeline } from '../../../lib/permutation-lite/permutation-lite-gamp-pipeline';
import type { PermutationLiteGAMPConfig } from '../../../lib/permutation-lite/permutation-lite-gamp-pipeline';

// Default configuration
const DEFAULT_CONFIG: PermutationLiteGAMPConfig = {
  enableGAMP: true,
  enableOptimization: true,
  enableLearning: true,
  enableVerification: true,

  gampConfig: {
    maxGraphNodes: 50,
    maxGraphEdges: 100,
    maxPaths: 5,
    scientificDomains: [
      'biology',
      'chemistry',
      'physics',
      'medicine',
      'neuroscience',
      'genetics',
      'materials_science',
      'quantum',
      'astronomy'
    ],
    irtThreshold: 0.7
  }
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await req.json();
    const {
      query,
      domain = 'general',
      enableGAMP = true,
      enableOptimization = true,
      enableLearning = true,
      enableVerification = true,
      gampConfig,
      ...otherConfig
    } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      );
    }

    if (query.length > 10000) {
      return NextResponse.json(
        { error: 'Query is too long (max 10000 characters)' },
        { status: 400 }
      );
    }

    // Build configuration
    const config: PermutationLiteGAMPConfig = {
      ...DEFAULT_CONFIG,
      ...otherConfig,
      enableGAMP,
      enableOptimization,
      enableLearning,
      enableVerification,
      gampConfig: {
        ...DEFAULT_CONFIG.gampConfig,
        ...gampConfig
      }
    };

    console.log('🚀 GAMP Pipeline execution started', {
      query: query.substring(0, 100),
      domain,
      enableGAMP,
      scientificDomains: config.gampConfig?.scientificDomains ?? [],
      irtThreshold: config.gampConfig?.irtThreshold ?? 0.7
    });

    // Create pipeline
    const pipeline = new PermutationLiteGAMPPipeline(config);

    // Execute
    const result = await pipeline.execute(query, domain);

    const totalTime = Date.now() - startTime;

    // Log results
    console.log('✅ GAMP Pipeline execution completed', {
      totalTime: `${totalTime}ms`,
      qualityScore: result.metadata.quality_score.toFixed(3),
      gampActivated: !!result.metadata.graphReasoning,
      pathsDiscovered: result.metadata.graphReasoning?.pathsDiscovered || 0,
      layers: {
        routing: !!result.metadata.routing,
        optimization: !!result.metadata.optimization,
        graphReasoning: !!result.metadata.graphReasoning,
        learning: !!result.metadata.learning,
        verification: !!result.metadata.verification
      }
    });

    // Format response
    const response = {
      success: true,
      result: {
        query,
        domain,
        response: result.answer,
        qualityScore: result.metadata.quality_score,

        // Layer metadata
        routing: result.metadata.routing,

        optimization: result.metadata.optimization ? {
          strategy: result.metadata.optimization.strategy,
          qualityScore: result.metadata.optimization.qualityScore,
          cost: result.metadata.optimization.cost,
          latency: result.metadata.optimization.latency
        } : undefined,

        graphReasoning: result.metadata.graphReasoning ? {
          activated: true,
          pathsDiscovered: result.metadata.graphReasoning.pathsDiscovered,
          topPath: result.metadata.graphReasoning.topPath,
          graphStats: result.metadata.graphReasoning.graphStats,
          agentEvaluations: result.metadata.graphReasoning.agentEvaluations,
          executionTime: result.metadata.graphReasoning.executionTime
        } : {
          activated: false,
          reason: determineNonActivationReason(result.metadata.routing, config)
        },

        learning: result.metadata.learning ? {
          memoriesRetrieved: result.metadata.learning.memoriesRetrieved,
          patternsApplied: result.metadata.learning.patternsApplied,
          stored: result.metadata.learning.stored
        } : undefined,

        verification: result.metadata.verification ? {
          verified: result.metadata.verification.verified,
          score: result.metadata.verification.score,
          refinementCount: result.metadata.verification.refinementCount,
          depth: result.metadata.verification.depth
        } : undefined,

        // Performance metrics
        performance: {
          totalTime,
          layerTimes: {
            routing: result.metadata.routing?.executionTime,
            optimization: result.metadata.optimization?.latency,
            graphReasoning: result.metadata.graphReasoning?.executionTime,
            learning: result.metadata.learning?.retrievalTime,
            verification: result.metadata.verification?.verificationTime
          }
        }
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('❌ GAMP Pipeline execution failed', {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Internal server error',
          type: error.name || 'Error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Determine why GAMP was not activated
 */
function determineNonActivationReason(
  routing: any,
  config: PermutationLiteGAMPConfig
): string {
  if (!config.enableGAMP) {
    return 'GAMP is disabled in configuration';
  }

  if (!routing) {
    return 'Routing information not available';
  }

  const domain = routing.domain?.toLowerCase() || '';
  const difficulty = routing.difficulty || 0;

  const isScientificDomain = config.gampConfig.scientificDomains?.some(
    d => domain.includes(d.toLowerCase())
  );

  const isHighDifficulty = difficulty > (config.gampConfig.irtThreshold || 0.7);

  if (!isScientificDomain) {
    return `Domain "${domain}" is not a scientific domain. Scientific domains: ${config.gampConfig.scientificDomains.join(', ')}`;
  }

  if (!isHighDifficulty) {
    return `Query difficulty (${difficulty.toFixed(2)}) is below threshold (${config.gampConfig.irtThreshold}). GAMP only activates for high-difficulty queries.`;
  }

  return 'Unknown reason - check configuration and routing metadata';
}

/**
 * GET endpoint for health check and configuration info
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Permutation-Lite GAMP Pipeline',
    version: '1.0.0',

    features: {
      gamp: 'Graph-based Agent Multi-agent Pathfinding',
      gepa: 'Genetic-Pareto Optimization',
      ace: 'Agentic Context Engineering',
      irt: 'Item Response Theory Routing',
      trm: 'Recursive Verification System'
    },

    defaultConfig: {
      enableGAMP: true,
      enableOptimization: true,
      enableLearning: true,
      enableVerification: true,

      gampConfig: {
        maxGraphNodes: 50,
        maxGraphEdges: 100,
        maxPaths: 5,
        scientificDomains: DEFAULT_CONFIG.gampConfig.scientificDomains,
        irtThreshold: 0.7
      }
    },

    usage: {
      endpoint: '/api/permutation-lite-gamp',
      method: 'POST',

      requestBody: {
        query: 'string (required, max 10000 chars)',
        domain: 'string (optional, default: "general")',
        enableGAMP: 'boolean (optional, default: true)',
        enableOptimization: 'boolean (optional, default: true)',
        enableLearning: 'boolean (optional, default: true)',
        enableVerification: 'boolean (optional, default: true)',

        gampConfig: {
          maxGraphNodes: 'number (optional, default: 50)',
          maxGraphEdges: 'number (optional, default: 100)',
          maxPaths: 'number (optional, default: 5)',
          scientificDomains: 'string[] (optional)',
          irtThreshold: 'number (optional, default: 0.7, range: 0-1)'
        }
      },

      example: {
        query: 'How can CRISPR be used to treat genetic diseases?',
        domain: 'biology',
        enableGAMP: true,
        enableOptimization: true,
        enableLearning: true
      }
    },

    gampActivation: {
      conditions: [
        'Query domain must be scientific (biology, chemistry, physics, etc.)',
        'Query difficulty (IRT) must be > threshold (default: 0.7)',
        'enableGAMP must be true in configuration'
      ],

      scientificDomains: DEFAULT_CONFIG.gampConfig.scientificDomains,

      examples: {
        willActivate: [
          { query: 'How can CRISPR treat genetic diseases?', domain: 'biology', irt: 0.85 },
          { query: 'Explain quantum entanglement mechanisms', domain: 'physics', irt: 0.92 },
          { query: 'Design novel polymer for drug delivery', domain: 'chemistry', irt: 0.78 }
        ],

        willNotActivate: [
          { query: 'What is DNA?', domain: 'biology', irt: 0.3, reason: 'Low difficulty' },
          { query: 'Complex business strategy', domain: 'business', irt: 0.85, reason: 'Non-scientific domain' },
          { query: 'Simple weather question', domain: 'general', irt: 0.2, reason: 'Both' }
        ]
      }
    },

    performanceMetrics: {
      typical: {
        withGAMP: {
          time: '25-35s',
          breakdown: {
            routing: '0.5-1s',
            parallel: '25-30s (GEPA + GAMP + Learning)',
            verification: '2-4s'
          }
        },
        withoutGAMP: {
          time: '8-12s',
          breakdown: {
            routing: '0.5-1s',
            parallel: '5-8s (GEPA + Learning)',
            verification: '2-4s'
          }
        }
      },

      qualityImpact: {
        withGAMP: 'Quality score typically 0.85-0.95 for scientific queries',
        withoutGAMP: 'Quality score typically 0.75-0.85 for general queries'
      }
    },

    documentation: {
      readme: '/lib/permutation-lite/GAMP_PIPELINE_README.md',
      implementation: '/lib/permutation-lite/permutation-lite-gamp-pipeline.ts',
      tests: '/__tests__/lib/permutation-lite/permutation-lite-gamp-pipeline.test.ts',
      integration: '/docs/GAMP_PERMUTATION_LITE_INTEGRATION.md'
    }
  });
}
