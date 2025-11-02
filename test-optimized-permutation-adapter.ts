/**
 * Test Optimized Permutation Adapter
 * 
 * Demonstrates how the permutation system uses optimized configurations
 * from the self-improving optimizer.
 */

import { SelfImprovingOptimizer } from './frontend/lib/self-improving-optimizer';
import { optimizedPermutationAdapter, executePermutationWithOptimalConfig } from './frontend/lib/optimized-permutation-adapter';
import { selfImprovingOptimizer } from './frontend/lib/self-improving-optimizer';

// Test queries for evaluation
const testQueries = [
  'What is the capital of France?',
  'Explain quantum computing in simple terms',
  'What are the benefits of renewable energy?',
  'How does machine learning work?',
  'Describe the water cycle',
];

/**
 * Mock evaluator function
 */
async function mockEvaluator(
  candidate: any,
  query: string
): Promise<{
  expressivity: number;
  efficiency: number;
  stability: number;
  latency: number;
  compressionRatio?: number;
  residualMagnitude?: number;
  gatingEfficiency?: number;
}> {
  // Simulate synthesis latency
  const baseLatency = 1000;
  const efficiencyBoost = candidate.deltaRuleParams.enableResidual ? 0.8 : 1.0;
  const latency = baseLatency * efficiencyBoost + Math.random() * 200;
  
  // Expressivity
  let expressivity = 0.5;
  if (candidate.deltaRuleParams.enableResidual) expressivity += 0.2;
  if (candidate.deltaRuleParams.gatingStrategy === 'kimi-enhanced') expressivity += 0.15;
  if (candidate.deltaRuleParams.adaptiveBeta) expressivity += 0.1;
  expressivity += Math.random() * 0.1;
  
  // Efficiency
  let efficiency = 0.6;
  if (candidate.deltaRuleParams.enableResidual) efficiency += 0.15;
  if (candidate.deltaRuleParams.gatingStrategy !== 'uniform') efficiency += 0.1;
  efficiency += Math.random() * 0.1;
  
  // Stability
  let stability = 0.7;
  if (candidate.deltaRuleParams.stabilityThreshold > 0.05 && 
      candidate.deltaRuleParams.stabilityThreshold < 0.2) {
    stability += 0.1;
  }
  stability += Math.random() * 0.1;
  
  // Threshold optimization: Better thresholds lead to better routing
  let thresholdBonus = 0;
  
  // Optimal thresholds (learned):
  // - aceThreshold: 0.5-0.6 works well
  // - swirlThreshold: 0.7-0.8 works well
  // - rvsThreshold: 0.3-0.4 works well
  
  if (candidate.permutationParams.aceThreshold !== undefined) {
    const optimalAce = 0.55;
    const aceDiff = Math.abs(candidate.permutationParams.aceThreshold - optimalAce);
    thresholdBonus += (1 - aceDiff * 2) * 0.2; // Reward closeness to optimal
  }
  
  if (candidate.permutationParams.swirlThreshold !== undefined) {
    const optimalSwirl = 0.75;
    const swirlDiff = Math.abs(candidate.permutationParams.swirlThreshold - optimalSwirl);
    thresholdBonus += (1 - swirlDiff * 2) * 0.2;
  }
  
  if (candidate.permutationParams.rvsThreshold !== undefined) {
    const optimalRvs = 0.35;
    const rvsDiff = Math.abs(candidate.permutationParams.rvsThreshold - optimalRvs);
    thresholdBonus += (1 - rvsDiff * 2) * 0.1;
  }
  
  expressivity += thresholdBonus;
  efficiency += thresholdBonus * 0.5;
  stability += thresholdBonus * 0.3;
  
  return {
    expressivity: Math.max(0, Math.min(1, expressivity)),
    efficiency: Math.max(0, Math.min(1, efficiency)),
    stability: Math.max(0, Math.min(1, stability)),
    latency,
    compressionRatio: candidate.deltaRuleParams.enableResidual 
      ? 2.5 + Math.random() * 0.5 
      : undefined,
    residualMagnitude: candidate.deltaRuleParams.enableResidual
      ? 0.1 + Math.random() * 0.05
      : undefined,
    gatingEfficiency: candidate.deltaRuleParams.gatingStrategy === 'kimi-enhanced'
      ? 0.75 + Math.random() * 0.15
      : undefined,
  };
}

/**
 * Main test function
 */
async function testOptimizedAdapter() {
  console.log('🧪 Testing Optimized Permutation Adapter\n');
  console.log('='.repeat(80));
  
  // Step 1: Check initial state
  console.log('\n📊 Step 1: Initial State');
  console.log('-'.repeat(80));
  
  const hasOptimized = optimizedPermutationAdapter.hasOptimizedConfig();
  console.log(`Has optimized config: ${hasOptimized ? '✅ Yes' : '❌ No'}`);
  
  if (!hasOptimized) {
    console.log('\n🔧 Step 2: Running Optimization');
    console.log('-'.repeat(80));
    
    const optimizer = new SelfImprovingOptimizer({
      populationSize: 6,
      mutationRate: 0.4,
      eliteRatio: 0.25,
      cmpHorizon: 2,
      asyncEvaluation: true,
      maxEvaluations: 2,
      // DGM enhancements
      diversityWeight: 0.3,
      archiveEnabled: true,
      archiveSize: 30,
      qualityDiversitySelection: true,
      openEndedExploration: true,
    });
    
    // Initialize baseline
    const baselineId = optimizer.initializeBaseline(
      {},
      {
        aceThreshold: 0.5,
        swirlThreshold: 0.7,
        rvsThreshold: 0.3,
        optimizationMode: 'balanced',
      }
    );
    
    console.log(`✅ Baseline created: ${baselineId}`);
    
    // Evaluate baseline
    await optimizer.evaluateCandidate(baselineId, testQueries.slice(0, 3), mockEvaluator);
    console.log('✅ Baseline evaluated');
    
    // Evolve for 2 generations
    for (let gen = 1; gen <= 2; gen++) {
      console.log(`\n🧬 Evolving generation ${gen}...`);
      const newIds = await optimizer.evolveGeneration();
      
      // Evaluate top candidates
      const topCandidates = optimizer.getAllCandidatesSortedByCMP()
        .filter(c => c.generation === gen)
        .slice(0, 3);
      
      await Promise.all(
        topCandidates.map(c => 
          optimizer.evaluateCandidate(c.id, testQueries.slice(0, 3), mockEvaluator)
        )
      );
      
      console.log(`✅ Generation ${gen} evaluated (${topCandidates.length} candidates)`);
    }
    
    // Update the singleton with optimized config
    const best = optimizer.getBestCandidate();
    if (best) {
      // Copy best candidate to singleton (for adapter to use)
      const singleton = selfImprovingOptimizer;
      singleton['candidates'] = optimizer['candidates'];
      singleton['bestCandidateId'] = optimizer['bestCandidateId'];
      singleton['generationCounter'] = optimizer['generationCounter'];
      singleton['archive'] = optimizer['archive'];
      
      console.log(`\n✅ Best candidate: ${best.id}`);
      console.log(`   CMP Score: ${optimizer.calculateCMP(best.id).toFixed(3)}`);
      console.log(`   ACE Threshold: ${best.permutationParams.aceThreshold?.toFixed(3)}`);
      console.log(`   SWiRL Threshold: ${best.permutationParams.swirlThreshold?.toFixed(3)}`);
      console.log(`   RVS Threshold: ${best.permutationParams.rvsThreshold?.toFixed(3)}`);
    }
  }
  
  // Step 3: Test adapter
  console.log('\n🔌 Step 3: Testing Optimized Adapter');
  console.log('-'.repeat(80));
  
  // Check if optimized config available
  const hasOptimizedNow = optimizedPermutationAdapter.hasOptimizedConfig();
  console.log(`Has optimized config: ${hasOptimizedNow ? '✅ Yes' : '❌ No'}`);
  
  // Get config comparison
  const comparison = optimizedPermutationAdapter.compareConfigs();
  console.log('\n📊 Configuration Comparison:');
  console.log('Default Config:');
  console.log(`  ACE Threshold: ${comparison.default.aceThreshold}`);
  console.log(`  SWiRL Threshold: ${comparison.default.swirlThreshold}`);
  console.log(`  RVS Threshold: ${comparison.default.rvsThreshold}`);
  console.log(`  Optimization Mode: ${comparison.default.optimizationMode}`);
  
  if (comparison.optimized) {
    console.log('\nOptimized Config:');
    console.log(`  ACE Threshold: ${comparison.optimized.aceThreshold?.toFixed(3) || 'N/A'}`);
    console.log(`  SWiRL Threshold: ${comparison.optimized.swirlThreshold?.toFixed(3) || 'N/A'}`);
    console.log(`  RVS Threshold: ${comparison.optimized.rvsThreshold?.toFixed(3) || 'N/A'}`);
    console.log(`  Optimization Mode: ${comparison.optimized.optimizationMode || 'N/A'}`);
    
    if (Object.keys(comparison.differences).length > 0) {
      console.log('\n🔀 Differences:');
      for (const [key, diff] of Object.entries(comparison.differences)) {
        console.log(`  ${key}:`);
        console.log(`    Default: ${diff.default}`);
        console.log(`    Optimized: ${diff.optimized}`);
        console.log(`    Change: ${((diff.optimized - diff.default) * 100).toFixed(1)}%`);
      }
    } else {
      console.log('\n✅ No differences - optimized config matches defaults');
    }
  } else {
    console.log('\n⚠️ No optimized config available');
  }
  
  // Step 4: Get configuration explanation
  console.log('\n📖 Step 4: Configuration Explanation');
  console.log('-'.repeat(80));
  const explanation = optimizedPermutationAdapter.getConfigExplanation('optimizer');
  console.log(explanation);
  
  // Step 5: Test config retrieval
  console.log('\n⚙️ Step 5: Testing Config Retrieval');
  console.log('-'.repeat(80));
  
  const defaultConfig = optimizedPermutationAdapter.getOptimalConfig('default');
  console.log('Default Config:', {
    aceThreshold: defaultConfig.aceThreshold,
    swirlThreshold: defaultConfig.swirlThreshold,
    rvsThreshold: defaultConfig.rvsThreshold,
    optimizationMode: defaultConfig.optimizationMode,
  });
  
  const optimizerConfig = optimizedPermutationAdapter.getOptimalConfig('optimizer');
  console.log('\nOptimizer Config:', {
    aceThreshold: optimizerConfig.aceThreshold,
    swirlThreshold: optimizerConfig.swirlThreshold,
    rvsThreshold: optimizerConfig.rvsThreshold,
    optimizationMode: optimizerConfig.optimizationMode,
  });
  
  // Step 6: Show routing logic example
  console.log('\n🎯 Step 6: Routing Logic Example');
  console.log('-'.repeat(80));
  
  const exampleQueries = [
    { query: 'What is 2+2?', difficulty: 0.2 },
    { query: 'Explain quantum mechanics', difficulty: 0.6 },
    { query: 'Solve this complex multi-step reasoning problem', difficulty: 0.8 },
  ];
  
  console.log('\nRouting decisions with current config:');
  for (const example of exampleQueries) {
    const config = optimizerConfig;
    const decisions: string[] = [];
    
    if (example.difficulty > (config.aceThreshold || 0.5)) {
      decisions.push('ACE');
    }
    if (example.difficulty > (config.swirlThreshold || 0.7)) {
      decisions.push('SWiRL');
    }
    if (example.difficulty > (config.rvsThreshold || 0.3)) {
      decisions.push('RVS');
    }
    
    console.log(`\n  Query: "${example.query}"`);
    console.log(`  IRT Difficulty: ${example.difficulty.toFixed(2)}`);
    console.log(`  Components activated: ${decisions.length > 0 ? decisions.join(', ') : 'None (basic pipeline)'}`);
    
    if (comparison.optimized && Object.keys(comparison.differences).length > 0) {
      // Show what would happen with default
      const defaultDecisions: string[] = [];
      if (example.difficulty > comparison.default.aceThreshold) defaultDecisions.push('ACE');
      if (example.difficulty > comparison.default.swirlThreshold) defaultDecisions.push('SWiRL');
      if (example.difficulty > comparison.default.rvsThreshold) defaultDecisions.push('RVS');
      
      if (defaultDecisions.join(', ') !== decisions.join(', ')) {
        console.log(`  With default: ${defaultDecisions.length > 0 ? defaultDecisions.join(', ') : 'None'}`);
        console.log(`  ⚡ Difference: Optimized config changes routing!`);
      }
    }
  }
  
  // Step 7: Archive statistics (DGM)
  console.log('\n🌳 Step 7: Archive Statistics (DGM)');
  console.log('-'.repeat(80));
  
  if (hasOptimizedNow) {
    const stats = selfImprovingOptimizer.getArchiveStats();
    console.log(`Archive Size: ${stats.size}`);
    console.log(`Max Depth: ${stats.maxDepth}`);
    console.log(`Branches: ${stats.branches}`);
    console.log(`Avg Diversity: ${stats.avgDiversity.toFixed(3)}`);
    console.log(`Avg Branch Quality: ${stats.avgBranchQuality.toFixed(3)}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Optimized Permutation Adapter Test Complete');
  console.log('\n💡 Key Takeaways:');
  console.log('  1. The adapter automatically uses optimized config when available');
  console.log('  2. Falls back to defaults if no optimization has been run');
  console.log('  3. Can compare default vs optimized configurations');
  console.log('  4. Provides explanations of routing logic');
  console.log('  5. Shows how thresholds affect component activation');
}

// Run test
if (require.main === module) {
  testOptimizedAdapter().catch(console.error);
}

export { testOptimizedAdapter };

