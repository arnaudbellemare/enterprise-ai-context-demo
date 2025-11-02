/**
 * Test Permutation Performance Comparison
 * 
 * Compares permutation pipeline with default vs optimized configurations
 */

import { executeUnifiedPipeline } from './frontend/lib/unified-permutation-pipeline';
import { executePermutationWithOptimalConfig } from './frontend/lib/optimized-permutation-adapter';
import { optimizedPermutationAdapter } from './frontend/lib/optimized-permutation-adapter';
import { SelfImprovingOptimizer } from './frontend/lib/self-improving-optimizer';
import { selfImprovingOptimizer } from './frontend/lib/self-improving-optimizer';

// Test queries with varying difficulty
const testQueries = [
  {
    query: 'What is the capital of France?',
    difficulty: 'low',
    expectedComponents: ['basic'],
  },
  {
    query: 'Explain how quantum computing differs from classical computing, including key algorithms like Shor\'s algorithm',
    difficulty: 'medium',
    expectedComponents: ['ACE', 'RVS'],
  },
  {
    query: 'Analyze the economic impact of renewable energy transition, considering market forces, technological innovation, policy frameworks, and global geopolitical implications',
    difficulty: 'high',
    expectedComponents: ['ACE', 'SWiRL', 'RVS'],
  },
];

/**
 * Mock evaluator for optimizer
 */
async function mockEvaluator(candidate: any, query: string): Promise<any> {
  // Simulate performance based on threshold optimization
  const baseExpressivity = 0.6;
  const baseEfficiency = 0.7;
  const baseStability = 0.75;
  
  // Better thresholds = better routing = better performance
  let thresholdBonus = 0;
  
  // Optimal ranges (learned from testing)
  const optimalAce = 0.55;
  const optimalSwirl = 0.75;
  const optimalRvs = 0.35;
  
  if (candidate.permutationParams.aceThreshold !== undefined) {
    const aceDiff = Math.abs(candidate.permutationParams.aceThreshold - optimalAce);
    thresholdBonus += (1 - aceDiff * 2) * 0.15;
  }
  
  if (candidate.permutationParams.swirlThreshold !== undefined) {
    const swirlDiff = Math.abs(candidate.permutationParams.swirlThreshold - optimalSwirl);
    thresholdBonus += (1 - swirlDiff * 2) * 0.15;
  }
  
  if (candidate.permutationParams.rvsThreshold !== undefined) {
    const rvsDiff = Math.abs(candidate.permutationParams.rvsThreshold - optimalRvs);
    thresholdBonus += (1 - rvsDiff * 2) * 0.1;
  }
  
  return {
    expressivity: Math.max(0, Math.min(1, baseExpressivity + thresholdBonus + Math.random() * 0.1)),
    efficiency: Math.max(0, Math.min(1, baseEfficiency + thresholdBonus * 0.5 + Math.random() * 0.1)),
    stability: Math.max(0, Math.min(1, baseStability + thresholdBonus * 0.3 + Math.random() * 0.1)),
    latency: 1000 + Math.random() * 200,
  };
}

/**
 * Initialize optimizer if needed
 */
async function ensureOptimizedConfig() {
  if (!optimizedPermutationAdapter.hasOptimizedConfig()) {
    console.log('🔧 Initializing optimizer...\n');
    
    const optimizer = new SelfImprovingOptimizer({
      populationSize: 5,
      mutationRate: 0.4,
      eliteRatio: 0.2,
      cmpHorizon: 2,
      asyncEvaluation: true,
      maxEvaluations: 2,
      diversityWeight: 0.3,
      archiveEnabled: true,
      archiveSize: 20,
    });
    
    const baselineId = optimizer.initializeBaseline(
      {},
      { aceThreshold: 0.5, swirlThreshold: 0.7, rvsThreshold: 0.3, optimizationMode: 'balanced' }
    );
    
    await optimizer.evaluateCandidate(baselineId, ['test'], mockEvaluator);
    
    // Evolve 2 generations
    for (let gen = 1; gen <= 2; gen++) {
      const newIds = await optimizer.evolveGeneration();
      const topCandidates = optimizer.getAllCandidatesSortedByCMP()
        .filter(c => c.generation === gen)
        .slice(0, 2);
      
      await Promise.all(
        topCandidates.map(c => optimizer.evaluateCandidate(c.id, ['test'], mockEvaluator))
      );
    }
    
    // Copy to singleton
    selfImprovingOptimizer['candidates'] = optimizer['candidates'];
    selfImprovingOptimizer['bestCandidateId'] = optimizer['bestCandidateId'];
    selfImprovingOptimizer['generationCounter'] = optimizer['generationCounter'];
    selfImprovingOptimizer['archive'] = optimizer['archive'];
    
    console.log('✅ Optimizer initialized\n');
  }
}

/**
 * Test performance comparison
 */
async function testPerformanceComparison() {
  console.log('📊 Permutation Performance Comparison Test\n');
  console.log('='.repeat(80));
  
  // Ensure we have optimized config
  await ensureOptimizedConfig();
  
  // Get config comparison
  const comparison = optimizedPermutationAdapter.compareConfigs();
  
  console.log('\n📋 Configuration Comparison:');
  console.log('-'.repeat(80));
  console.log('Default Config:');
  console.log(`  ACE: ${comparison.default.aceThreshold}, SWiRL: ${comparison.default.swirlThreshold}, RVS: ${comparison.default.rvsThreshold}`);
  
  if (comparison.optimized) {
    console.log('Optimized Config:');
    console.log(`  ACE: ${comparison.optimized.aceThreshold?.toFixed(3)}, SWiRL: ${comparison.optimized.swirlThreshold?.toFixed(3)}, RVS: ${comparison.optimized.rvsThreshold?.toFixed(3)}`);
    
    if (Object.keys(comparison.differences).length > 0) {
      console.log('\n🔀 Differences Found:');
      for (const [key, diff] of Object.entries(comparison.differences)) {
        const change = ((diff.optimized - diff.default) * 100).toFixed(1);
        console.log(`  ${key}: ${diff.default} → ${diff.optimized} (${change > 0 ? '+' : ''}${change}%)`);
      }
    }
  }
  
  // Test with sample queries
  console.log('\n🧪 Testing Query Execution:');
  console.log('-'.repeat(80));
  
  for (const testQuery of testQueries) {
    console.log(`\n📝 Query (${testQuery.difficulty} difficulty): "${testQuery.query.substring(0, 60)}..."`);
    
    try {
      // Test with default config
      const defaultStart = Date.now();
      const defaultResult = await executeUnifiedPipeline(
        testQuery.query,
        undefined,
        undefined,
        comparison.default
      );
      const defaultTime = Date.now() - defaultStart;
      
      console.log(`\n  Default Config:`);
      console.log(`    Components used: ${defaultResult.metadata.components_used.join(', ') || 'basic'}`);
      console.log(`    Quality score: ${defaultResult.metadata.quality_score.toFixed(3)}`);
      console.log(`    IRT difficulty: ${defaultResult.metadata.irt_difficulty.toFixed(3)}`);
      console.log(`    Time: ${defaultTime}ms`);
      
      // Test with optimized config (if different)
      if (comparison.optimized && Object.keys(comparison.differences).length > 0) {
        const optimizedStart = Date.now();
        const optimizedResult = await executePermutationWithOptimalConfig(
          testQuery.query,
          undefined,
          undefined,
          'optimizer'
        );
        const optimizedTime = Date.now() - optimizedStart;
        
        console.log(`\n  Optimized Config:`);
        console.log(`    Components used: ${optimizedResult.metadata.components_used.join(', ') || 'basic'}`);
        console.log(`    Quality score: ${optimizedResult.metadata.quality_score.toFixed(3)}`);
        console.log(`    IRT difficulty: ${optimizedResult.metadata.irt_difficulty.toFixed(3)}`);
        console.log(`    Time: ${optimizedTime}ms`);
        
        // Compare
        const qualityDiff = optimizedResult.metadata.quality_score - defaultResult.metadata.quality_score;
        const timeDiff = optimizedTime - defaultTime;
        
        console.log(`\n  📊 Comparison:`);
        console.log(`    Quality change: ${qualityDiff > 0 ? '+' : ''}${(qualityDiff * 100).toFixed(1)}%`);
        console.log(`    Time change: ${timeDiff > 0 ? '+' : ''}${timeDiff}ms`);
        
        // Show component activation differences
        const defaultComponents = new Set(defaultResult.metadata.components_used);
        const optimizedComponents = new Set(optimizedResult.metadata.components_used);
        
        const added = Array.from(optimizedComponents).filter(c => !defaultComponents.has(c));
        const removed = Array.from(defaultComponents).filter(c => !optimizedComponents.has(c));
        
        if (added.length > 0 || removed.length > 0) {
          console.log(`    Components: ${added.length > 0 ? `+${added.join(', ')}` : ''} ${removed.length > 0 ? `-${removed.join(', ')}` : ''}`);
        }
      } else {
        console.log(`\n  ℹ️ Using same config (no optimization differences)`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 Summary:');
  console.log('-'.repeat(80));
  
  if (optimizedPermutationAdapter.hasOptimizedConfig()) {
    const stats = selfImprovingOptimizer.getArchiveStats();
    console.log(`✅ Optimized configuration available`);
    console.log(`   Archive: ${stats.size} candidates, ${stats.branches} branches`);
    console.log(`   Avg diversity: ${stats.avgDiversity.toFixed(3)}`);
    
    const best = selfImprovingOptimizer.getBestCandidate();
    if (best) {
      const cmp = selfImprovingOptimizer.calculateCMP(best.id);
      console.log(`   Best CMP score: ${cmp.toFixed(3)}`);
    }
  } else {
    console.log(`ℹ️ Using default configuration`);
  }
  
  console.log('\n💡 Improvements with Optimized Config:');
  console.log('   1. Better component routing based on IRT difficulty');
  console.log('   2. Optimized thresholds from HGM/DGM evolution');
  console.log('   3. Adaptive configuration based on query patterns');
  console.log('   4. Continued improvement through self-optimization');
}

// Run test
if (require.main === module) {
  testPerformanceComparison().catch(console.error);
}

export { testPerformanceComparison };

