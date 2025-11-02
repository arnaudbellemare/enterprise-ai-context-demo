/**
 * Test HGM-Style Self-Improving Optimizer
 * 
 * Demonstrates how the self-improving optimizer evolves delta rule
 * and permutation system parameters based on performance.
 */

import { SelfImprovingOptimizer, type OptimizerCandidate } from './frontend/lib/self-improving-optimizer';
import { ContextSynthesizer } from './frontend/lib/rag/context-synthesizer';
import { Document } from './frontend/lib/rag/vector-store-adapter';

// Test queries for evaluation
const testQueries = [
  'What is the capital of France?',
  'Explain quantum computing in simple terms',
  'What are the benefits of renewable energy?',
  'How does machine learning work?',
  'Describe the water cycle',
];

// Mock documents for synthesis
const mockDocuments: Document[] = [
  { id: '1', content: 'Sample document content for testing synthesis quality.' },
  { id: '2', content: 'Another document with relevant information for the query.' },
  { id: '3', content: 'Third document providing additional context and details.' },
];

/**
 * Mock evaluator function
 * In production, this would:
 * 1. Run actual synthesis with candidate parameters
 * 2. Measure expressivity (quality), efficiency (memory usage), stability, latency
 * 3. Return comprehensive metrics
 */
async function mockEvaluator(
  candidate: OptimizerCandidate,
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
  // Simulate synthesis latency (faster with better configs)
  const baseLatency = 1000;
  const efficiencyBoost = candidate.deltaRuleParams.enableResidual ? 0.8 : 1.0;
  const latency = baseLatency * efficiencyBoost + Math.random() * 200;
  
  // Expressivity: higher with residual learning and Kimi gating
  let expressivity = 0.5;
  if (candidate.deltaRuleParams.enableResidual) expressivity += 0.2;
  if (candidate.deltaRuleParams.gatingStrategy === 'kimi-enhanced') expressivity += 0.15;
  if (candidate.deltaRuleParams.adaptiveBeta) expressivity += 0.1;
  expressivity += Math.random() * 0.1; // Add noise
  
  // Efficiency: better with optimized parameters
  let efficiency = 0.6;
  if (candidate.deltaRuleParams.enableResidual) efficiency += 0.15;
  if (candidate.deltaRuleParams.gatingStrategy !== 'uniform') efficiency += 0.1;
  efficiency += Math.random() * 0.1;
  
  // Stability: better with appropriate thresholds
  let stability = 0.7;
  if (candidate.deltaRuleParams.stabilityThreshold > 0.05 && 
      candidate.deltaRuleParams.stabilityThreshold < 0.2) {
    stability += 0.1;
  }
  stability += Math.random() * 0.1;
  
  // Additional metrics for residual learning
  const compressionRatio = candidate.deltaRuleParams.enableResidual 
    ? 2.5 + Math.random() * 0.5 
    : undefined;
  const residualMagnitude = candidate.deltaRuleParams.enableResidual
    ? 0.1 + Math.random() * 0.05
    : undefined;
  const gatingEfficiency = candidate.deltaRuleParams.gatingStrategy === 'kimi-enhanced'
    ? 0.75 + Math.random() * 0.15
    : undefined;
  
  return {
    expressivity: Math.max(0, Math.min(1, expressivity)),
    efficiency: Math.max(0, Math.min(1, efficiency)),
    stability: Math.max(0, Math.min(1, stability)),
    latency,
    compressionRatio,
    residualMagnitude,
    gatingEfficiency,
  };
}

/**
 * Main test function
 */
async function testSelfImprovement() {
  console.log('🧬 HGM-Style Self-Improving Optimizer Test\n');
  console.log('=' .repeat(80));
  
  const optimizer = new SelfImprovingOptimizer({
    populationSize: 8,
    mutationRate: 0.4,
    crossoverRate: 0.6,
    eliteRatio: 0.25,
    cmpHorizon: 3,
    asyncEvaluation: true,
    maxEvaluations: 3,
    // DGM enhancements
    diversityWeight: 0.3,
    archiveEnabled: true,
    archiveSize: 50,
    qualityDiversitySelection: true,
    openEndedExploration: true,
    convergenceThreshold: 0.01,
    stagnationLimit: 3,
  });
  
  // Initialize baseline
  console.log('\n📊 Step 1: Initialize Baseline Configuration');
  console.log('-'.repeat(80));
  
  const baselineId = optimizer.initializeBaseline(
    {
      enableResidual: false,
      residualClipValue: 0.5,
      enableDataDependentGating: false,
      adaptiveBeta: false,
      stabilityThreshold: 0.1,
      gatingStrategy: 'data-dependent',
    },
    {
      aceThreshold: 0.5,
      swirlThreshold: 0.7,
      rvsThreshold: 0.3,
      optimizationMode: 'balanced',
    }
  );
  
  const baseline = optimizer.getCandidate(baselineId)!;
  console.log(`✅ Baseline created: ${baselineId}`);
  console.log(`   Delta Rule: residual=${baseline.deltaRuleParams.enableResidual}, ` +
              `gating=${baseline.deltaRuleParams.gatingStrategy}`);
  console.log(`   Permutation: aceThreshold=${baseline.permutationParams.aceThreshold}`);
  
  // Evaluate baseline
  console.log('\n📊 Step 2: Evaluate Baseline');
  console.log('-'.repeat(80));
  
  const baselineResult = await optimizer.evaluateCandidate(
    baselineId,
    testQueries,
    mockEvaluator
  );
  
  console.log(`✅ Baseline Evaluation:`);
  console.log(`   Score: ${baselineResult.score.toFixed(3)}`);
  console.log(`   Expressivity: ${baselineResult.metrics.expressivity.toFixed(3)}`);
  console.log(`   Efficiency: ${baselineResult.metrics.efficiency.toFixed(3)}`);
  console.log(`   Stability: ${baselineResult.metrics.stability.toFixed(3)}`);
  console.log(`   Latency: ${baselineResult.metrics.latency.toFixed(0)}ms`);
  
  // Evolve for 3 generations
  const numGenerations = 3;
  
  for (let gen = 1; gen <= numGenerations; gen++) {
    console.log(`\n🧬 Step ${2 + gen}: Generation ${gen} Evolution`);
    console.log('-'.repeat(80));
    
    // Evolve
    const newCandidateIds = await optimizer.evolveGeneration();
    console.log(`✅ Generated ${newCandidateIds.length} new candidates`);
    
    // Evaluate new candidates (async)
    console.log(`\n📊 Evaluating generation ${gen} candidates...`);
    const evaluationPromises = newCandidateIds.map(id =>
      optimizer.evaluateCandidate(id, testQueries, mockEvaluator)
    );
    
    const results = await Promise.all(evaluationPromises);
    
    // Show top performers
    const sorted = optimizer.getAllCandidatesSortedByCMP();
    const top5 = sorted.slice(0, 5);
    
    console.log(`\n🏆 Top 5 Candidates (by CMP):`);
    top5.forEach((c, idx) => {
      const cmp = optimizer.calculateCMP(c.id);
      console.log(`   ${idx + 1}. ${c.id.substring(0, 30)}...`);
      console.log(`      Immediate Score: ${c.performance.immediateScore.toFixed(3)}`);
      console.log(`      CMP Score: ${cmp.toFixed(3)}`);
      console.log(`      Residual: ${c.deltaRuleParams.enableResidual}, ` +
                  `Gating: ${c.deltaRuleParams.gatingStrategy}`);
      if (c.metadata.mutationHistory.length > 0) {
        console.log(`      Last mutation: ${c.metadata.mutationHistory[c.metadata.mutationHistory.length - 1]}`);
      }
    });
  }
  
  // Final results
  console.log('\n🎯 Final Results');
  console.log('='.repeat(80));
  
  const best = optimizer.getBestCandidate();
  if (!best) {
    console.log('❌ No best candidate found');
    return;
  }
  
  const bestCMP = optimizer.calculateCMP(best.id);
  
  console.log(`\n✅ Best Candidate: ${best.id}`);
  console.log(`   Generation: ${best.generation}`);
  console.log(`   Immediate Score: ${best.performance.immediateScore.toFixed(3)}`);
  console.log(`   CMP Score: ${bestCMP.toFixed(3)}`);
  console.log(`   Evaluation Count: ${best.performance.evaluationCount}`);
  
  console.log(`\n📐 Optimized Delta Rule Parameters:`);
  console.log(`   enableResidual: ${best.deltaRuleParams.enableResidual}`);
  console.log(`   residualClipValue: ${best.deltaRuleParams.residualClipValue.toFixed(3)}`);
  console.log(`   enableDataDependentGating: ${best.deltaRuleParams.enableDataDependentGating}`);
  console.log(`   gatingStrategy: ${best.deltaRuleParams.gatingStrategy}`);
  console.log(`   adaptiveBeta: ${best.deltaRuleParams.adaptiveBeta}`);
  console.log(`   stabilityThreshold: ${best.deltaRuleParams.stabilityThreshold.toFixed(3)}`);
  
  console.log(`\n⚙️ Optimized Permutation Parameters:`);
  console.log(`   aceThreshold: ${best.permutationParams.aceThreshold?.toFixed(3)}`);
  console.log(`   swirlThreshold: ${best.permutationParams.swirlThreshold?.toFixed(3)}`);
  console.log(`   rvsThreshold: ${best.permutationParams.rvsThreshold?.toFixed(3)}`);
  console.log(`   optimizationMode: ${best.permutationParams.optimizationMode}`);
  
  // Export configurations
  const deltaRuleConfig = optimizer.exportBestDeltaRuleConfig();
  const permutationConfig = optimizer.exportBestPermutationConfig();
  
  console.log(`\n💾 Export Best Configurations:`);
  console.log(`   Delta Rule Config:`, JSON.stringify(deltaRuleConfig, null, 2));
  console.log(`   Permutation Config:`, JSON.stringify(permutationConfig, null, 2));
  
  // Show improvement over baseline
  const improvement = bestCMP - baselineResult.score;
  const percentImprovement = (improvement / baselineResult.score) * 100;
  
    console.log(`\n📈 Improvement Over Baseline:`);
    console.log(`   Baseline Score: ${baselineResult.score.toFixed(3)}`);
    console.log(`   Best CMP Score: ${bestCMP.toFixed(3)}`);
    console.log(`   Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(3)} ` +
                `(${percentImprovement > 0 ? '+' : ''}${percentImprovement.toFixed(1)}%)`);
    
    // DGM: Archive statistics
    const archiveStats = optimizer.getArchiveStats();
    console.log(`\n🌳 DGM Archive Statistics:`);
    console.log(`   Archive Size: ${archiveStats.size}`);
    console.log(`   Max Depth: ${archiveStats.maxDepth}`);
    console.log(`   Branches: ${archiveStats.branches}`);
    console.log(`   Avg Diversity: ${archiveStats.avgDiversity.toFixed(3)}`);
    console.log(`   Avg Branch Quality: ${archiveStats.avgBranchQuality.toFixed(3)}`);
    
    // Convergence status
    const isConverged = optimizer.isConverged();
    console.log(`\n🔄 Convergence Status:`);
    console.log(`   Converged: ${isConverged ? 'Yes' : 'No'}`);
    if (isConverged) {
      console.log(`   Open-ended exploration enabled - will continue exploring novel regions`);
    }
  
  // Show mutation history
  if (best.metadata.mutationHistory.length > 0) {
    console.log(`\n🔬 Mutation History (last 5):`);
    best.metadata.mutationHistory.slice(-5).forEach((mutation, idx) => {
      console.log(`   ${idx + 1}. ${mutation}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Self-Improvement Test Complete');
}

// Run test
if (require.main === module) {
  testSelfImprovement().catch(console.error);
}

export { testSelfImprovement };

