/**
 * Live Test: Optimized Permutation System
 * 
 * Tests the permutation system with optimized configurations on real queries
 */

import { executePermutationWithOptimalConfig } from './frontend/lib/optimized-permutation-adapter';
import { optimizedPermutationAdapter } from './frontend/lib/optimized-permutation-adapter';
import { SelfImprovingOptimizer } from './frontend/lib/self-improving-optimizer';
import { selfImprovingOptimizer } from './frontend/lib/self-improving-optimizer';

// Real test queries
const testQueries = [
  {
    query: 'What is the capital of France?',
    expectedDifficulty: 'low',
  },
  {
    query: 'Explain how machine learning neural networks work, including backpropagation and gradient descent',
    expectedDifficulty: 'medium',
  },
  {
    query: 'Analyze the economic impact of climate change on global supply chains, considering geopolitical factors, technological adaptation, and policy responses across different regions',
    expectedDifficulty: 'high',
  },
];

/**
 * Mock evaluator for quick optimization
 */
async function quickEvaluator(candidate: any, query: string): Promise<any> {
  // Simulate realistic performance
  const baseScore = 0.65;
  
  // Threshold optimization bonus
  let bonus = 0;
  
  if (candidate.permutationParams.aceThreshold !== undefined) {
    const optimal = 0.55;
    const diff = Math.abs(candidate.permutationParams.aceThreshold - optimal);
    bonus += (1 - diff * 2) * 0.15;
  }
  
  if (candidate.permutationParams.swirlThreshold !== undefined) {
    const optimal = 0.75;
    const diff = Math.abs(candidate.permutationParams.swirlThreshold - optimal);
    bonus += (1 - diff * 2) * 0.15;
  }
  
  return {
    expressivity: Math.max(0, Math.min(1, baseScore + bonus + Math.random() * 0.1)),
    efficiency: Math.max(0, Math.min(1, 0.7 + bonus * 0.5 + Math.random() * 0.1)),
    stability: Math.max(0, Math.min(1, 0.75 + bonus * 0.3 + Math.random() * 0.1)),
    latency: 1000 + Math.random() * 200,
  };
}

/**
 * Initialize optimizer quickly
 */
async function quickOptimization() {
  console.log('🔧 Running quick optimization...\n');
  
  const optimizer = new SelfImprovingOptimizer({
    populationSize: 4,
    mutationRate: 0.4,
    eliteRatio: 0.25,
    cmpHorizon: 2,
    asyncEvaluation: true,
    maxEvaluations: 1,
    diversityWeight: 0.3,
    archiveEnabled: true,
    archiveSize: 15,
  });
  
  const baselineId = optimizer.initializeBaseline(
    {},
    { aceThreshold: 0.5, swirlThreshold: 0.7, rvsThreshold: 0.3, optimizationMode: 'balanced' }
  );
  
  await optimizer.evaluateCandidate(baselineId, ['test'], quickEvaluator);
  
  // Evolve 2 generations
  for (let gen = 1; gen <= 2; gen++) {
    const newIds = await optimizer.evolveGeneration();
    const topCandidates = optimizer.getAllCandidatesSortedByCMP()
      .filter(c => c.generation === gen)
      .slice(0, 2);
    
    await Promise.all(
      topCandidates.map(c => optimizer.evaluateCandidate(c.id, ['test'], quickEvaluator))
    );
  }
  
  // Copy to singleton
  selfImprovingOptimizer['candidates'] = optimizer['candidates'];
  selfImprovingOptimizer['bestCandidateId'] = optimizer['bestCandidateId'];
  selfImprovingOptimizer['generationCounter'] = optimizer['generationCounter'];
  selfImprovingOptimizer['archive'] = optimizer['archive'];
  
  const best = optimizer.getBestCandidate();
  if (best) {
    const cmp = optimizer.calculateCMP(best.id);
    console.log(`✅ Optimization complete`);
    console.log(`   Best CMP: ${cmp.toFixed(3)}`);
    console.log(`   ACE: ${best.permutationParams.aceThreshold?.toFixed(3)}`);
    console.log(`   SWiRL: ${best.permutationParams.swirlThreshold?.toFixed(3)}`);
    console.log(`   RVS: ${best.permutationParams.rvsThreshold?.toFixed(3)}\n`);
  }
}

/**
 * Main live test
 */
async function runLiveTest() {
  console.log('🚀 Live Test: Optimized Permutation System\n');
  console.log('='.repeat(80));
  
  // Ensure optimized config available
  if (!optimizedPermutationAdapter.hasOptimizedConfig()) {
    await quickOptimization();
  }
  
  // Show config status
  const comparison = optimizedPermutationAdapter.compareConfigs();
  console.log('📊 Configuration Status:');
  console.log('-'.repeat(80));
  console.log('Default:', {
    ACE: comparison.default.aceThreshold,
    SWiRL: comparison.default.swirlThreshold,
    RVS: comparison.default.rvsThreshold,
  });
  
  if (comparison.optimized) {
    console.log('Optimized:', {
      ACE: comparison.optimized.aceThreshold?.toFixed(3),
      SWiRL: comparison.optimized.swirlThreshold?.toFixed(3),
      RVS: comparison.optimized.rvsThreshold?.toFixed(3),
    });
  }
  
  // Test queries
  console.log('\n🧪 Testing Queries with Optimized Configuration:\n');
  console.log('='.repeat(80));
  
  for (let i = 0; i < testQueries.length; i++) {
    const testQuery = testQueries[i];
    console.log(`\n📝 Query ${i + 1}: "${testQuery.query}"`);
    console.log(`   Expected Difficulty: ${testQuery.expectedDifficulty}`);
    console.log('-'.repeat(80));
    
    try {
      const startTime = Date.now();
      
      const result = await executePermutationWithOptimalConfig(
        testQuery.query,
        undefined,
        undefined,
        'optimizer'
      );
      
      const executionTime = Date.now() - startTime;
      
      console.log(`\n✅ Execution Complete:`);
      console.log(`   IRT Difficulty: ${result.metadata.irt_difficulty.toFixed(3)}`);
      console.log(`   Quality Score: ${result.metadata.quality_score.toFixed(3)}`);
      console.log(`   Confidence: ${result.metadata.confidence.toFixed(3)}`);
      console.log(`   Execution Time: ${executionTime}ms`);
      
      console.log(`\n📦 Components Used:`);
      if (result.metadata.components_used.length > 0) {
        result.metadata.components_used.forEach((component: string) => {
          console.log(`   ✓ ${component}`);
        });
      } else {
        console.log(`   (Basic pipeline)`);
      }
      
      // Show routing decisions
      console.log(`\n🎯 Routing Decisions:`);
      const difficulty = result.metadata.irt_difficulty;
      const config = optimizedPermutationAdapter.getOptimalConfig('optimizer');
      
      console.log(`   Difficulty: ${difficulty.toFixed(3)}`);
      console.log(`   ACE: ${difficulty > (config.aceThreshold || 0.5) ? '✅ Activated' : '❌ Skipped'} (threshold: ${config.aceThreshold})`);
      console.log(`   SWiRL: ${difficulty > (config.swirlThreshold || 0.7) ? '✅ Activated' : '❌ Skipped'} (threshold: ${config.swirlThreshold})`);
      console.log(`   RVS: ${difficulty > (config.rvsThreshold || 0.3) ? '✅ Activated' : '❌ Skipped'} (threshold: ${config.rvsThreshold})`);
      
      // Show answer preview
      if (result.answer) {
        const preview = result.answer.substring(0, 200);
        console.log(`\n📄 Answer Preview:`);
        console.log(`   ${preview}${result.answer.length > 200 ? '...' : ''}`);
      }
      
      // Performance metrics
      console.log(`\n⏱️ Performance:`);
      console.log(`   Total Time: ${result.metadata.performance.total_time_ms}ms`);
      console.log(`   Teacher Calls: ${result.metadata.performance.teacher_calls}`);
      console.log(`   Student Calls: ${result.metadata.performance.student_calls}`);
      if (result.metadata.performance.cost !== undefined) {
        console.log(`   Cost: $${result.metadata.performance.cost.toFixed(4)}`);
      }
      
    } catch (error) {
      console.error(`\n❌ Error executing query:`);
      console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 Summary:');
  console.log('-'.repeat(80));
  
  const stats = selfImprovingOptimizer.getArchiveStats();
  console.log(`✅ Optimized configuration active`);
  console.log(`   Archive: ${stats.size} candidates, ${stats.branches} branches`);
  console.log(`   Diversity: ${stats.avgDiversity.toFixed(3)}`);
  
  const best = selfImprovingOptimizer.getBestCandidate();
  if (best) {
    const cmp = selfImprovingOptimizer.calculateCMP(best.id);
    console.log(`   Best CMP: ${cmp.toFixed(3)}`);
  }
  
  console.log('\n💡 The permutation system is now:');
  console.log('   1. Using optimized thresholds from self-improving optimizer');
  console.log('   2. Automatically routing queries to best components');
  console.log('   3. Improving over time through evolution');
  console.log('   4. Maintaining diverse configurations for exploration');
}

// Run test
if (require.main === module) {
  runLiveTest().catch(console.error);
}

export { runLiveTest };

