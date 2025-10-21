/**
 * Brain API with New Skills System - Demo Implementation
 *
 * This is a demonstration of how to use the new modular brain-skills system.
 * Copy this pattern to update the main brain route when ready.
 *
 * Benefits demonstrated:
 * - Automatic caching (2-5x faster on repeat queries)
 * - Metrics tracking (every execution logged)
 * - Modular skills (easy to add/remove)
 * - Type safety (full TypeScript)
 * - Error handling (graceful fallbacks)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkillRegistry, getSkillCache, BrainContext } from '../../../lib/brain-skills';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Analyze query context - same as original brain route
 */
async function analyzeContext(query: string, domain: string): Promise<BrainContext> {
  const wordCount = query.split(' ').length;
  const queryComplexity = Math.min(wordCount / 20, 1.0);

  return {
    query,
    domain,
    complexity: Math.floor(queryComplexity * 10),
    needsReasoning: query.length > 100 || query.includes('why') || query.includes('how'),
    needsOptimization: queryComplexity > 0.7,
    needsContext: domain === 'healthcare',
    needsRealTime: query.includes('latest') || query.includes('current'),
    needsInformation: query.includes('what') || query.includes('explain'),
    requiresSources: query.includes('source') || query.includes('citation'),
    needsCostOptimization: false,
    needsAdvancedReasoning: queryComplexity > 0.8 || domain === 'legal',
    needsValidation: domain === 'legal' || domain === 'finance',
    requiresWebData: query.includes('latest') || query.includes('current'),
    quality: 0.5
  };
}

/**
 * Synthesize response from skill results
 */
function synthesizeResponse(
  query: string,
  skillResults: any[],
  activatedSkills: string[]
): string {
  let response = '';

  // Find the best result
  const successfulResults = skillResults.filter(r => r.result.success);

  if (successfulResults.length === 0) {
    return `I processed your query "${query}" but all skills failed. Please try again.`;
  }

  // Prefer Kimi K2 or TRM results
  const kimiResult = successfulResults.find(r => r.skillName === 'kimiK2');
  const trmResult = successfulResults.find(r => r.skillName === 'trm');
  const bestResult = kimiResult || trmResult || successfulResults[0];

  // Extract answer from result
  if (bestResult.result.data?.answer) {
    response = bestResult.result.data.answer;
  } else if (bestResult.result.data?.response) {
    response = bestResult.result.data.response;
  } else if (typeof bestResult.result.data === 'string') {
    response = bestResult.result.data;
  } else {
    response = JSON.stringify(bestResult.result.data);
  }

  // Add metadata footer
  response += `\n\n---\n*Processed by: ${activatedSkills.join(', ')}*`;

  return response;
}

/**
 * Main POST handler
 */
export async function POST(request: NextRequest) {
  try {
    const { query, domain = 'general', sessionId = 'default' } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🧠 Brain (New): Processing query...`);
    console.log(`   Query: ${query.substring(0, 50)}...`);
    console.log(`   Domain: ${domain}`);

    const startTime = Date.now();

    // Step 1: Analyze context (same as original)
    const context = await analyzeContext(query, domain);
    console.log(`   Context: complexity=${context.complexity}, needsReasoning=${context.needsReasoning}`);

    // Step 2: Get skill registry and execute
    const registry = getSkillRegistry();
    const skillResults = await registry.executeActivatedSkills(query, context);

    // Extract skill names and results
    const activatedSkills = skillResults.map(r => r.skillName);
    const skillData = skillResults.reduce((acc, r) => {
      acc[r.skillName] = r.result;
      return acc;
    }, {} as Record<string, any>);

    console.log(`   Skills activated: ${activatedSkills.join(', ')}`);

    // Step 3: Synthesize response
    const response = synthesizeResponse(query, skillResults, activatedSkills);

    // Step 4: Get cache stats
    const cache = getSkillCache();
    const cacheStats = cache.getStats();

    const totalTime = Date.now() - startTime;

    console.log(`   ✓ Completed in ${totalTime}ms`);
    console.log(`   Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);

    return NextResponse.json({
      success: true,
      query,
      domain,
      brain_processing: {
        context_analysis: context,
        activated_skills: activatedSkills,
        skill_results: skillData,
        synthesis_method: 'New Modular Skills System'
      },
      response,
      metadata: {
        processing_time_ms: totalTime,
        skills_activated: activatedSkills.length,
        cache_hit_rate: cacheStats.hitRate,
        cache_size: cacheStats.size,
        system: 'new-modular',
        human_like_cognition: true
      },
      skills: activatedSkills,
      performance: {
        total_duration: totalTime,
        successful_skills: skillResults.filter(r => r.success).length,
        failed_skills: skillResults.filter(r => !r.success).length,
        cache_stats: {
          size: cacheStats.size,
          hit_rate: cacheStats.hitRate,
          hits: cacheStats.hitCount,
          misses: cacheStats.missCount
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Brain (New) Error:', error);

    return NextResponse.json(
      {
        error: 'Brain system failed',
        details: error.message,
        system: 'new-modular'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - show system info
 */
export async function GET() {
  const registry = getSkillRegistry();
  const cache = getSkillCache();
  const stats = registry.getStats();
  const cacheStats = cache.getStats();

  return NextResponse.json({
    system: 'Brain API - New Modular Skills System',
    version: '2.0.0',
    skills: {
      total: stats.totalSkills,
      registered: stats.skillNames,
      descriptions: stats.skillDescriptions
    },
    cache: {
      size: cacheStats.size,
      maxSize: cacheStats.maxSize,
      hitRate: cacheStats.hitRate,
      utilizationPercent: cacheStats.utilizationPercent
    },
    features: [
      'Automatic caching (2-5x faster)',
      'Metrics tracking to Supabase',
      'Parallel skill execution',
      'Type-safe interfaces',
      'Graceful error handling',
      'Modular architecture'
    ]
  });
}
