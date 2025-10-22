import { NextRequest, NextResponse } from 'next/server';
import { getSkillCache } from '@/lib/brain-skills/skill-cache';
import { getSkillRegistry } from '@/lib/brain-skills';
import { rateLimiter, RATE_LIMITS, generateRateLimitKey } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

/**
 * Cache Warming System
 *
 * Pre-populates cache with common queries to improve hit rates
 * and reduce cold-start latency for production workloads.
 */

interface WarmingQuery {
  query: string;
  domain?: string;
  complexity?: number;
  skills?: string[];
}

interface WarmingConfig {
  queries: WarmingQuery[];
  parallel?: boolean;
  maxConcurrency?: number;
  skipExisting?: boolean;
}

interface WarmingResult {
  success: boolean;
  queriesWarmed: number;
  queriesSkipped: number;
  queriesFailed: number;
  duration: number;
  cacheStats: any;
  errors?: string[];
}

/**
 * Common production queries for cache warming
 */
const COMMON_QUERIES: WarmingQuery[] = [
  // Technology domain
  {
    query: 'Explain the latest trends in artificial intelligence',
    domain: 'technology',
    complexity: 5,
    skills: ['ace_framework', 'trm_engine']
  },
  {
    query: 'What is machine learning and how does it work?',
    domain: 'technology',
    complexity: 4,
    skills: ['trm_engine']
  },
  {
    query: 'Compare different neural network architectures',
    domain: 'technology',
    complexity: 7,
    skills: ['trm_engine', 'gepa_optimization']
  },

  // Business domain
  {
    query: 'Analyze the financial implications of cloud migration',
    domain: 'business',
    complexity: 6,
    skills: ['advanced_rag', 'quality_evaluation']
  },
  {
    query: 'What are the key considerations for digital transformation?',
    domain: 'business',
    complexity: 5,
    skills: ['ace_framework', 'advanced_rag']
  },

  // Legal domain
  {
    query: 'Explain the legal framework for data privacy regulations',
    domain: 'legal',
    complexity: 8,
    skills: ['legal_analysis', 'advanced_rag']
  },
  {
    query: 'What are the key compliance requirements for GDPR?',
    domain: 'legal',
    complexity: 7,
    skills: ['legal_analysis']
  },

  // General queries
  {
    query: 'How can I optimize system performance?',
    domain: 'technology',
    complexity: 5,
    skills: ['gepa_optimization', 'trm_engine']
  },
  {
    query: 'What are best practices for software development?',
    domain: 'technology',
    complexity: 4,
    skills: ['ace_framework', 'quality_evaluation']
  },
  {
    query: 'Explain the benefits of microservices architecture',
    domain: 'technology',
    complexity: 6,
    skills: ['trm_engine', 'advanced_rag']
  }
];

/**
 * Input validation for cache warming queries
 */
function validateWarmingInput(body: any): { valid: boolean; error?: string; sanitized?: WarmingConfig } {
  // Check if body is valid JSON object
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }

  // Validate queries array if provided
  if (body.queries) {
    if (!Array.isArray(body.queries)) {
      return { valid: false, error: 'Queries must be an array' };
    }

    if (body.queries.length > 50) {
      return { valid: false, error: 'Maximum 50 queries allowed per request' };
    }

    // Validate each query
    for (let i = 0; i < body.queries.length; i++) {
      const query = body.queries[i];
      
      if (!query || typeof query !== 'object') {
        return { valid: false, error: `Query ${i + 1} must be an object` };
      }

      if (!query.query || typeof query.query !== 'string') {
        return { valid: false, error: `Query ${i + 1} must have a valid query string` };
      }

      // Sanitize query string
      const sanitizedQuery = query.query.trim();
      if (sanitizedQuery.length === 0) {
        return { valid: false, error: `Query ${i + 1} cannot be empty` };
      }

      if (sanitizedQuery.length > 1000) {
        return { valid: false, error: `Query ${i + 1} exceeds maximum length of 1000 characters` };
      }

      // Validate domain if provided
      if (query.domain && typeof query.domain !== 'string') {
        return { valid: false, error: `Query ${i + 1} domain must be a string` };
      }

      // Validate complexity if provided
      if (query.complexity !== undefined) {
        if (typeof query.complexity !== 'number' || query.complexity < 1 || query.complexity > 10) {
          return { valid: false, error: `Query ${i + 1} complexity must be a number between 1 and 10` };
        }
      }

      // Validate skills array if provided
      if (query.skills) {
        if (!Array.isArray(query.skills)) {
          return { valid: false, error: `Query ${i + 1} skills must be an array` };
        }
        
        if (query.skills.length > 10) {
          return { valid: false, error: `Query ${i + 1} cannot have more than 10 skills` };
        }

        for (const skill of query.skills) {
          if (typeof skill !== 'string' || skill.length === 0) {
            return { valid: false, error: `Query ${i + 1} skills must be non-empty strings` };
          }
        }
      }
    }
  }

  // Validate other parameters
  if (body.parallel !== undefined && typeof body.parallel !== 'boolean') {
    return { valid: false, error: 'Parallel must be a boolean' };
  }

  if (body.maxConcurrency !== undefined) {
    if (typeof body.maxConcurrency !== 'number' || body.maxConcurrency < 1 || body.maxConcurrency > 10) {
      return { valid: false, error: 'Max concurrency must be a number between 1 and 10' };
    }
  }

  if (body.skipExisting !== undefined && typeof body.skipExisting !== 'boolean') {
    return { valid: false, error: 'Skip existing must be a boolean' };
  }

  // Create sanitized config
  const sanitized: WarmingConfig = {
    queries: body.queries?.map((q: any) => ({
      query: q.query.trim(),
      domain: q.domain?.trim() || undefined,
      complexity: q.complexity || undefined,
      skills: q.skills?.map((s: string) => s.trim()) || undefined
    })) || COMMON_QUERIES,
    parallel: body.parallel ?? true,
    maxConcurrency: body.maxConcurrency || 3,
    skipExisting: body.skipExisting ?? true
  };

  return { valid: true, sanitized };
}

/**
 * POST /api/brain/cache/warm
 * Warm cache with common queries
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting check
    const rateLimitKey = generateRateLimitKey(request, 'cache-warming');
    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey, RATE_LIMITS.CACHE_WARMING);
    
    if (!rateLimitResult.allowed) {
      logger.security('Rate limit exceeded for cache warming', {
        key: rateLimitKey,
        retryAfter: rateLimitResult.retryAfter
      });
      
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many cache warming requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '300'
        }
      });
    }

    const body = await request.json() as Partial<WarmingConfig>;
    
    // Validate input
    const validation = validateWarmingInput(body);
    if (!validation.valid) {
      logger.security('Invalid cache warming input', {
        error: validation.error,
        key: rateLimitKey
      });
      
      return NextResponse.json({
        success: false,
        error: validation.error,
        queriesWarmed: 0,
        queriesSkipped: 0,
        queriesFailed: 0,
        duration: Date.now() - startTime
      }, { status: 400 });
    }

    const config = validation.sanitized!;

    logger.info('Cache warming started', {
      operation: 'cache_warming',
      metadata: {
        queryCount: config.queries.length,
        parallel: config.parallel,
        maxConcurrency: config.maxConcurrency
      }
    });

    const cache = getSkillCache();
    const registry = getSkillRegistry();

    let warmedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    if (config.parallel) {
      // Parallel warming with concurrency limit
      const results = await warmQueriesParallel(
        config.queries,
        config.maxConcurrency || 3,
        config.skipExisting || false,
        cache,
        registry
      );

      warmedCount = results.warmed;
      skippedCount = results.skipped;
      failedCount = results.failed;
      errors.push(...results.errors);
    } else {
      // Sequential warming
      for (const warmingQuery of config.queries) {
        const result = await warmSingleQuery(
          warmingQuery,
          config.skipExisting || false,
          cache,
          registry
        );

        if (result.success) {
          if (result.skipped) {
            skippedCount++;
          } else {
            warmedCount++;
          }
        } else {
          failedCount++;
          if (result.error) {
            errors.push(result.error);
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    const cacheStats = cache.getStats();

    const result: WarmingResult = {
      success: true,
      queriesWarmed: warmedCount,
      queriesSkipped: skippedCount,
      queriesFailed: failedCount,
      duration,
      cacheStats,
      errors: errors.length > 0 ? errors : undefined
    };

    logger.info('Cache warming completed', {
      operation: 'cache_warming',
      metadata: {
        warmed: warmedCount,
        skipped: skippedCount,
        failed: failedCount,
        duration,
        cacheStats: {
          size: cacheStats.size,
          maxSize: cacheStats.maxSize,
          hitRate: cacheStats.hitRate
        }
      }
    });

    return NextResponse.json(result);

  } catch (error: any) {
    logger.error('Cache warming failed', error, {
      operation: 'cache_warming',
      metadata: {
        duration: Date.now() - startTime
      }
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      queriesWarmed: 0,
      queriesSkipped: 0,
      queriesFailed: 0,
      duration: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * GET /api/brain/cache/warm
 * Get warming status and default queries
 */
export async function GET(request: NextRequest) {
  try {
    const cache = getSkillCache();
    const stats = cache.getStats();

    return NextResponse.json({
      success: true,
      status: {
        cacheSize: stats.size,
        maxSize: stats.maxSize,
        hitRate: stats.hitRate,
        utilizationPercent: stats.utilizationPercent,
        recommendWarmup: stats.utilizationPercent < 20
      },
      defaultQueries: COMMON_QUERIES.map(q => ({
        query: q.query,
        domain: q.domain,
        complexity: q.complexity,
        skillCount: q.skills?.length || 0
      })),
      warmingEndpoint: '/api/brain/cache/warm (POST)'
    });

  } catch (error: any) {
    logger.error('Cache status check failed', error, {
      operation: 'cache_status'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/brain/cache/warm
 * Clear warmed cache entries
 */
export async function DELETE(request: NextRequest) {
  try {
    const cache = getSkillCache();
    const beforeStats = cache.getStats();

    cache.clear();

    const afterStats = cache.getStats();

    logger.info('Cache cleared', {
      operation: 'cache_clear',
      metadata: {
        entriesRemoved: beforeStats.size,
        beforeStats,
        afterStats
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      entriesRemoved: beforeStats.size,
      beforeStats,
      afterStats
    });

  } catch (error: any) {
    logger.error('Cache clear failed', error, {
      operation: 'cache_clear'
    });
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Warm queries in parallel with concurrency limit
 */
async function warmQueriesParallel(
  queries: WarmingQuery[],
  maxConcurrency: number,
  skipExisting: boolean,
  cache: any,
  registry: any
): Promise<{ warmed: number; skipped: number; failed: number; errors: string[] }> {
  let warmed = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in batches
  for (let i = 0; i < queries.length; i += maxConcurrency) {
    const batch = queries.slice(i, i + maxConcurrency);

    const results = await Promise.all(
      batch.map(query => warmSingleQuery(query, skipExisting, cache, registry))
    );

    results.forEach((result, idx) => {
      if (result.success) {
        if (result.skipped) {
          skipped++;
        } else {
          warmed++;
        }
      } else {
        failed++;
        if (result.error) {
          errors.push(`Query ${i + idx}: ${result.error}`);
        }
      }
    });
  }

  return { warmed, skipped, failed, errors };
}

/**
 * Warm a single query
 */
async function warmSingleQuery(
  warmingQuery: WarmingQuery,
  skipExisting: boolean,
  cache: any,
  registry: any
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    const { query, domain, complexity, skills } = warmingQuery;

    // Check if already cached
    if (skipExisting && skills) {
      for (const skillName of skills) {
        const cached = cache.get(skillName, query, { domain, complexity });
        if (cached) {
          logger.debug('Skipping cached query', {
            operation: 'cache_warming',
            metadata: {
              query: query.substring(0, 40) + '...',
              reason: 'already_cached'
            }
          });
          return { success: true, skipped: true };
        }
      }
    }

    // Create context
    const context = {
      domain: domain || 'general',
      complexity: complexity || 5,
      needsReasoning: true,
      needsOptimization: complexity && complexity >= 6
    };

    // Execute through registry to populate cache
    logger.debug('Warming query', {
      operation: 'cache_warming',
      metadata: {
        query: query.substring(0, 40) + '...',
        domain,
        complexity,
        skills
      }
    });

    await registry.executeActivatedSkills(query, context);

    return { success: true };

  } catch (error: any) {
    logger.error('Failed to warm query', error, {
      operation: 'cache_warming',
      metadata: {
        query: warmingQuery.query.substring(0, 40) + '...',
        domain: warmingQuery.domain,
        complexity: warmingQuery.complexity
      }
    });
    
    return { success: false, error: error.message };
  }
}
