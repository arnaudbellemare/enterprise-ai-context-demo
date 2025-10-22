import { NextRequest, NextResponse } from 'next/server';
import { getSkillCache } from '@/lib/brain-skills/skill-cache';
import { getSkillRegistry } from '@/lib/brain-skills';

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
 * POST /api/brain/cache/warm
 * Warm cache with common queries
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json() as Partial<WarmingConfig>;

    const config: WarmingConfig = {
      queries: body.queries || COMMON_QUERIES,
      parallel: body.parallel ?? true,
      maxConcurrency: body.maxConcurrency || 3,
      skipExisting: body.skipExisting ?? true
    };

    console.log(`🔥 Cache Warming: Starting with ${config.queries.length} queries`);
    console.log(`   Parallel: ${config.parallel}, Max Concurrency: ${config.maxConcurrency}`);

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

    console.log(`🔥 Cache Warming: Complete`);
    console.log(`   Warmed: ${warmedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Cache Stats: ${cacheStats.size}/${cacheStats.maxSize} (${cacheStats.hitRate.toFixed(2)} hit rate)`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Cache Warming Error:', error);
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
    console.error('❌ Cache Status Error:', error);
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

    console.log(`🗑️ Cache Cleared: ${beforeStats.size} entries removed`);

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      entriesRemoved: beforeStats.size,
      beforeStats,
      afterStats
    });

  } catch (error: any) {
    console.error('❌ Cache Clear Error:', error);
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
          console.log(`   ⏭️ Skipping "${query.substring(0, 40)}..." (already cached)`);
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
    console.log(`   🔥 Warming: "${query.substring(0, 40)}..."`);

    await registry.executeActivatedSkills(query, context);

    return { success: true };

  } catch (error: any) {
    console.error(`   ❌ Failed to warm query: ${warmingQuery.query.substring(0, 40)}...`, error.message);
    return { success: false, error: error.message };
  }
}
