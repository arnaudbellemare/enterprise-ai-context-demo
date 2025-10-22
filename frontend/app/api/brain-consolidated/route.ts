/**
 * Consolidated Brain API Route
 * 
 * Single endpoint that consolidates all brain functionality
 * Replaces 8 fragmented routes with one unified interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMoEBrainOrchestrator } from '../../../lib/brain-skills/moe-orchestrator-simplified';
import { moeSkillRouter } from '../../../lib/moe-skill-router';
import { getSkillCache } from '../../../lib/brain-skills/skill-cache';
import { PermutationEngine } from '../../../lib/permutation-engine';
import { rateLimiter, RATE_LIMITS, generateRateLimitKey } from '../../../lib/rate-limiter';
import { logger } from '../../../lib/logger';
import { apiKeyManager } from '../../../lib/api-key-manager';

/**
 * Brain Strategy Types
 */
type BrainStrategy = 'original' | 'modular' | 'moe' | 'auto';

interface BrainRequest {
  query: string;
  context?: any;
  sessionId?: string;
  strategy?: BrainStrategy;
  priority?: 'low' | 'normal' | 'high';
  budget?: number;
  maxLatency?: number;
  requiredQuality?: number;
  enableCaching?: boolean;
  enableOptimization?: boolean;
}

interface BrainResponse {
  success: boolean;
  response: string;
  metadata: {
    strategyUsed: BrainStrategy;
    totalTime: number;
    queryComplexity: number;
    queryDomain: string;
    skillsActivated?: string[];
    skillScores?: Record<string, number>;
    implementations?: Record<string, string>;
    totalCost?: number;
    averageQuality?: number;
    moeOptimized?: boolean;
    batchOptimized?: boolean;
    loadBalanced?: boolean;
    resourceOptimized?: boolean;
    cached?: boolean;
    cacheHitRate?: number;
  };
  performance?: {
    selectionTime?: number;
    executionTime?: number;
    synthesisTime?: number;
    totalTime: number;
  };
  error?: string;
  fallback?: string;
}

/**
 * Initialize MoE Router with expert registration
 */
const initializeMoERouter = () => {
  const brainSkills = [
    {
      id: 'gepa_optimization',
      name: 'GEPA Optimization',
      domain: 'optimization',
      description: 'Generative Prompt Evolution Agent for iterative optimization',
      capabilities: ['prompt_evolution', 'performance_tracking', 'adaptive_learning'],
      performance: {
        accuracy: 0.85,
        speed: 0.9,
        reliability: 0.88,
        cost: 0.001
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.85,
        avgResponseTime: 1500
      }
    },
    {
      id: 'ace_framework',
      name: 'ACE Framework',
      domain: 'reasoning',
      description: 'Agentic Context Engineering for contextual analysis',
      capabilities: ['context_analysis', 'domain_detection', 'complexity_assessment'],
      performance: {
        accuracy: 0.9,
        speed: 0.85,
        reliability: 0.92,
        cost: 0.002
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.9,
        avgResponseTime: 1200
      }
    },
    {
      id: 'trm_engine',
      name: 'TRM Engine',
      domain: 'reasoning',
      description: 'Tiny Recursion Model for multi-phase reasoning',
      capabilities: ['multi_phase_reasoning', 'recursive_analysis', 'deep_thinking'],
      performance: {
        accuracy: 0.88,
        speed: 0.8,
        reliability: 0.9,
        cost: 0.003
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.88,
        avgResponseTime: 2000
      }
    },
    {
      id: 'teacher_student',
      name: 'Teacher-Student',
      domain: 'learning',
      description: 'Cost-effective learning with teacher-student pattern',
      capabilities: ['knowledge_transfer', 'cost_optimization', 'quality_learning'],
      performance: {
        accuracy: 0.82,
        speed: 0.85,
        reliability: 0.85,
        cost: 0.008
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.82,
        avgResponseTime: 3000
      }
    },
    {
      id: 'advanced_rag',
      name: 'Advanced RAG',
      domain: 'retrieval',
      description: 'Retrieval-Augmented Generation with vector search',
      capabilities: ['vector_search', 'semantic_retrieval', 'context_enhancement'],
      performance: {
        accuracy: 0.87,
        speed: 0.9,
        reliability: 0.88,
        cost: 0.004
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.87,
        avgResponseTime: 1000
      }
    },
    {
      id: 'advanced_reranking',
      name: 'Advanced Reranking',
      domain: 'retrieval',
      description: 'Multi-strategy reranking for result optimization',
      capabilities: ['result_reranking', 'relevance_optimization', 'quality_filtering'],
      performance: {
        accuracy: 0.85,
        speed: 0.95,
        reliability: 0.9,
        cost: 0.002
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.85,
        avgResponseTime: 800
      }
    },
    {
      id: 'multilingual_business',
      name: 'Multilingual Business',
      domain: 'business',
      description: 'Multilingual business intelligence and analysis',
      capabilities: ['language_detection', 'business_analysis', 'cross_lingual'],
      performance: {
        accuracy: 0.9,
        speed: 0.85,
        reliability: 0.88,
        cost: 0.005
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.9,
        avgResponseTime: 1500
      }
    },
    {
      id: 'quality_evaluation',
      name: 'Quality Evaluation',
      domain: 'evaluation',
      description: 'Comprehensive quality assessment and validation',
      capabilities: ['quality_assessment', 'validation', 'performance_metrics'],
      performance: {
        accuracy: 0.92,
        speed: 0.8,
        reliability: 0.95,
        cost: 0.001
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.92,
        avgResponseTime: 1800
      }
    },
    {
      id: 'legal_analysis',
      name: 'Legal Analysis',
      domain: 'legal',
      description: 'Specialized legal analysis and compliance checking',
      capabilities: ['legal_analysis', 'compliance_checking', 'regulatory_guidance'],
      performance: {
        accuracy: 0.88,
        speed: 0.75,
        reliability: 0.9,
        cost: 0.006
      },
      metadata: {
        lastUsed: new Date(),
        usageCount: 0,
        successRate: 0.88,
        avgResponseTime: 2500
      }
    }
  ];

  brainSkills.forEach(skill => {
    moeSkillRouter.registerExpert(skill);
  });

  logger.info('MoE Router initialized for consolidated brain', {
    operation: 'moe_initialization',
    metadata: {
      expertCount: brainSkills.length
    }
  });
};

// Initialize on module load
initializeMoERouter();

/**
 * Analyze context for query processing
 */
async function analyzeContext(query: string, sessionId?: string): Promise<any> {
  // Simple context analysis
  const complexity = Math.min(10, Math.max(1, 
    (query.length / 50) + 
    (query.match(/\?/g) || []).length * 0.5 +
    (query.match(/complex|advanced|detailed|comprehensive/gi) || []).length * 0.5
  ));

  const domain = detectDomain(query);
  
  return {
    complexity,
    domain,
    needsMoERouting: complexity >= 6 || domain === 'legal' || domain === 'technical',
    hasComplexRequirements: complexity >= 7,
    requiresOptimalSkillSelection: complexity >= 5,
    estimatedCacheHit: Math.random() * 0.6, // Mock cache hit estimation
    sessionId
  };
}

/**
 * Detect domain from query
 */
function detectDomain(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('legal') || lowerQuery.includes('law') || lowerQuery.includes('compliance')) {
    return 'legal';
  }
  if (lowerQuery.includes('technical') || lowerQuery.includes('code') || lowerQuery.includes('programming')) {
    return 'technical';
  }
  if (lowerQuery.includes('business') || lowerQuery.includes('finance') || lowerQuery.includes('market')) {
    return 'business';
  }
  if (lowerQuery.includes('medical') || lowerQuery.includes('health') || lowerQuery.includes('clinical')) {
    return 'medical';
  }
  
  return 'general';
}

/**
 * POST /api/brain-consolidated
 * Unified brain endpoint with strategy selection
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting check
    const rateLimitKey = generateRateLimitKey(request, 'brain-consolidated');
    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey, RATE_LIMITS.BRAIN_API);
    
    if (!rateLimitResult.allowed) {
      logger.security('Rate limit exceeded for brain API', {
        key: rateLimitKey,
        retryAfter: rateLimitResult.retryAfter
      });
      
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      });
    }

    const body = await request.json() as BrainRequest;
    const { 
      query, 
      context = {}, 
      sessionId, 
      strategy = 'auto',
      priority = 'normal',
      budget = 0.05,
      maxLatency = 30000,
      requiredQuality = 0.8,
      enableCaching = true,
      enableOptimization = true
    } = body;

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    // Analyze context
    const contextResult = await analyzeContext(query, sessionId);
    const fullContext = { ...contextResult, ...context, sessionId };

    // Auto-select strategy if needed
    const selectedStrategy = strategy === 'auto' ? 
      selectOptimalStrategy(fullContext, enableCaching, enableOptimization) : 
      strategy;

    logger.info('Brain request processing started', {
      operation: 'brain_consolidated',
      metadata: {
        query: query.substring(0, 100),
        strategy: selectedStrategy,
        complexity: fullContext.complexity,
        domain: fullContext.domain
      }
    });

    let response: BrainResponse;
    let brainResult: any;

    // Execute based on selected strategy
    switch (selectedStrategy) {
      case 'moe':
        brainResult = await executeMoEStrategy(query, fullContext, {
          sessionId,
          priority,
          budget,
          maxLatency,
          requiredQuality
        });
        break;

      case 'modular':
        brainResult = await executeModularStrategy(query, fullContext, enableCaching);
        break;

      case 'original':
      default:
        brainResult = await executeOriginalStrategy(query, fullContext);
        break;
    }

    const totalTime = Date.now() - startTime;

    response = {
      success: true,
      response: brainResult.response,
      metadata: {
        strategyUsed: selectedStrategy,
        totalTime,
        queryComplexity: fullContext.complexity,
        queryDomain: fullContext.domain,
        ...brainResult.metadata
      },
      performance: brainResult.performance ? {
        ...brainResult.performance,
        totalTime
      } : {
        totalTime
      }
    };

    logger.info('Brain request processing completed', {
      operation: 'brain_consolidated',
      metadata: {
        strategy: selectedStrategy,
        totalTime,
        success: true
      }
    });

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('Brain request processing failed', error, {
      operation: 'brain_consolidated',
      metadata: {
        duration: Date.now() - startTime
      }
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'Brain system unavailable, please try again'
    }, { status: 500 });
  }
}

/**
 * GET /api/brain-consolidated
 * Get system status and capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const healthCheck = await performHealthCheck();
    
    return NextResponse.json({
      success: true,
      status: 'operational',
      capabilities: {
        strategies: ['original', 'modular', 'moe', 'auto'],
        features: [
          'intelligent_routing',
          'caching',
          'load_balancing',
          'resource_optimization',
          'self_improvement',
          'rate_limiting',
          'structured_logging'
        ],
        endpoints: {
          primary: '/api/brain-consolidated',
          legacy: [
            '/api/brain',
            '/api/brain-moe',
            '/api/brain-enhanced'
          ]
        }
      },
      health: healthCheck,
      documentation: {
        usage: 'POST with { "query": "your question", "strategy": "auto" }',
        strategies: {
          auto: 'Automatically select optimal strategy',
          original: 'Original brain system',
          modular: 'Modular brain with caching',
          moe: 'Mixture of Experts optimization'
        }
      }
    });

  } catch (error: any) {
    logger.error('Status check failed', error, {
      operation: 'brain_status'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Select optimal strategy based on context
 */
function selectOptimalStrategy(
  context: any, 
  enableCaching: boolean, 
  enableOptimization: boolean
): BrainStrategy {
  // High complexity or advanced requirements → MoE
  if (context.complexity >= 7 || context.budget || context.requiredQuality > 0.85) {
    return 'moe';
  }

  // Caching enabled and likely cache hit → Modular
  if (enableCaching && context.estimatedCacheHit > 0.6) {
    return 'modular';
  }

  // Optimization enabled and complex query → MoE
  if (enableOptimization && context.complexity >= 5) {
    return 'moe';
  }

  // Default: Original (most stable)
  return 'original';
}

/**
 * Execute MoE strategy
 */
async function executeMoEStrategy(
  query: string, 
  context: any, 
  options: any
): Promise<any> {
  try {
    const orchestrator = getMoEBrainOrchestrator(moeSkillRouter);
    
    const moeResponse = await orchestrator.executeQuery({
      query,
      context,
      sessionId: options.sessionId,
      priority: options.priority,
      budget: options.budget,
      maxLatency: options.maxLatency,
      requiredQuality: options.requiredQuality
    });

    return {
      response: moeResponse.response,
      metadata: {
        skillsActivated: moeResponse.metadata.skillsActivated,
        skillScores: moeResponse.metadata.skillScores,
        implementations: moeResponse.metadata.implementations,
        totalCost: moeResponse.metadata.totalCost,
        averageQuality: moeResponse.metadata.averageQuality,
        moeOptimized: moeResponse.metadata.moeOptimized,
        batchOptimized: moeResponse.metadata.batchOptimized,
        loadBalanced: moeResponse.metadata.loadBalanced,
        resourceOptimized: moeResponse.metadata.resourceOptimized
      },
      performance: moeResponse.performance
    };

  } catch (error: any) {
    logger.warn('MoE strategy failed, falling back to modular', {
      operation: 'moe_execution',
      metadata: { error: error.message }
    });
    
    // Fallback to modular strategy
    return executeModularStrategy(query, context, true);
  }
}

/**
 * Execute modular strategy
 */
async function executeModularStrategy(
  query: string, 
  context: any, 
  enableCaching: boolean
): Promise<any> {
  try {
    if (enableCaching) {
      const cache = getSkillCache();
      const cachedResponse = cache.get('modular', query, context);
      
      if (cachedResponse) {
        return {
          response: cachedResponse,
          metadata: { cached: true },
          performance: { totalTime: 0 }
        };
      }
    }

    const modularEngine = new PermutationEngine();
    const result = await modularEngine.execute(query, context.domain);
    
    if (enableCaching) {
      const cache = getSkillCache();
      cache.set('modular', query, {
        success: true,
        data: result.answer,
        result: result.answer,
        metadata: {
          processingTime: result.metadata?.duration_ms || 0,
          model: 'permutation-engine',
          cost: result.metadata?.cost || 0,
          quality: result.metadata?.quality_score || 0.8,
          tokensUsed: 0,
          cacheHit: false
        },
        timestamp: new Date().toISOString()
      }, context);
    }

    return {
      response: result.answer,
      metadata: { cached: false },
      performance: { totalTime: result.metadata?.duration_ms || 0 }
    };

  } catch (error: any) {
    logger.warn('Modular strategy failed, falling back to original', {
      operation: 'modular_execution',
      metadata: { error: error.message }
    });
    
    // Fallback to original strategy
    return executeOriginalStrategy(query, context);
  }
}

/**
 * Execute original strategy
 */
async function executeOriginalStrategy(
  query: string, 
  context: any
): Promise<any> {
  try {
    const originalEngine = new PermutationEngine();
    const result = await originalEngine.execute(query, context.domain);

    return {
      response: result.answer,
      metadata: { cached: false },
      performance: { totalTime: result.metadata?.duration_ms || 0 }
    };

  } catch (error: any) {
    logger.error('All strategies failed', error, {
      operation: 'original_execution'
    });
    
    throw error;
  }
}

/**
 * Perform health check
 */
async function performHealthCheck(): Promise<any> {
  try {
    const orchestrator = getMoEBrainOrchestrator(moeSkillRouter);
    const healthCheck = await orchestrator.healthCheck();
    
    return {
      moe: healthCheck.status,
      components: healthCheck.components,
      lastChecked: new Date().toISOString()
    };

  } catch (error: any) {
    logger.error('Health check failed', error, {
      operation: 'health_check'
    });
    
    return {
      moe: 'unhealthy',
      components: {
        router: false,
        batcher: false,
        loadBalancer: false,
        resourceManager: false,
        dynamicRouter: false
      },
      lastChecked: new Date().toISOString()
    };
  }
}
