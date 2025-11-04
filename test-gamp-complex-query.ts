/**
 * Test Complex Query with GAMP Pipeline
 * 
 * This script tests a complex scientific query that will activate GAMP
 * and displays full query, answer, and performance metrics.
 */

import { PermutationLiteGAMPPipeline } from './frontend/lib/permutation-lite/permutation-lite-gamp-pipeline';

// Load environment variables
try {
  const dotenv = require('dotenv');
  const { resolve } = require('path');
  dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: resolve(process.cwd(), '.env') });
} catch (e) {
  // dotenv not available - ignore
}

async function testComplexQuery() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING COMPLEX QUERY WITH GAMP PIPELINE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📦 Initializing pipeline...');
  const initStart = Date.now();
  
  // Create pipeline with GAMP enabled
  const pipeline = new PermutationLiteGAMPPipeline({
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
      irtThreshold: 0.5  // Lower threshold to ensure GAMP activates for this complex query
    }
  });

  const initTime = Date.now() - initStart;
  console.log(`✅ Pipeline initialized in ${initTime}ms\n`);

  // Complex scientific query that should activate GAMP
  const complexQuery = `How can CRISPR-Cas9 gene editing technology be combined with stem cell therapy to develop personalized treatments for genetic diseases like Duchenne muscular dystrophy? Specifically, what are the key challenges in ensuring off-target effects are minimized and how can we validate the therapeutic efficacy in preclinical models?`;

  console.log('📝 QUERY:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(complexQuery);
  console.log('───────────────────────────────────────────────────────────────\n');

  console.log('🚀 EXECUTING PIPELINE...\n');
  console.log('⏱️  Timeout set to 180 seconds (3 minutes) - GAMP may take longer\n');

  const startTime = Date.now();
  
  try {
    // Add timeout to prevent hanging (GAMP agent evaluation can take time)
    const TIMEOUT_MS = 180000; // 3 minutes - GAMP agent system needs more time
    console.log('⏳ Starting execution with timeout...\n');
    
    const executePromise = pipeline.execute(complexQuery, 'biology');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => {
        console.error(`\n⏰ TIMEOUT: Pipeline execution exceeded ${TIMEOUT_MS / 1000} seconds`);
        reject(new Error(`Pipeline execution timed out after ${TIMEOUT_MS / 1000} seconds`));
      }, TIMEOUT_MS)
    );
    
    const result = await Promise.race([executePromise, timeoutPromise]) as any;
    console.log('✅ Pipeline execution completed\n');

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Display results
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('⏱️  PERFORMANCE:');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    console.log(`Cost: $${result.metadata.performance.cost.toFixed(4)}`);
    console.log(`Quality Score: ${result.metadata.quality_score.toFixed(3)}`);
    console.log(`Layers Executed: ${result.metadata.layers_executed.join(' → ')}`);
    console.log('───────────────────────────────────────────────────────────────\n');

    console.log('📋 METADATA:');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`Domain: ${result.metadata.domain}`);
    console.log(`Difficulty (IRT): ${result.metadata.difficulty.toFixed(3)}`);
    console.log(`Route: ${result.metadata.routing?.route || 'N/A'}`);
    
    if (result.metadata.optimization) {
      console.log(`\nOptimization:`);
      console.log(`  - Quality: ${result.metadata.optimization.quality.toFixed(3)}`);
      console.log(`  - Generations: ${result.metadata.optimization.generations}`);
    }

    if (result.metadata.graphReasoning) {
      console.log(`\n🔬 GAMP Graph Reasoning:`);
      console.log(`  - Activated: ✅ YES`);
      console.log(`  - Paths Discovered: ${result.metadata.graphReasoning.pathsDiscovered}`);
      console.log(`  - Execution Time: ${result.metadata.graphReasoning.executionTime}ms`);
      console.log(`  - Graph Stats:`);
      console.log(`    - Nodes: ${result.metadata.graphReasoning.graphStats.nodes}`);
      console.log(`    - Edges: ${result.metadata.graphReasoning.graphStats.edges}`);
      console.log(`    - Triplets: ${result.metadata.graphReasoning.graphStats.triplets}`);
      console.log(`  - Agent Evaluations: ${result.metadata.graphReasoning.agentEvaluations}`);
      
      if (result.metadata.graphReasoning.topPath) {
        console.log(`\n  Top Path:`);
        console.log(`    - Problem: ${result.metadata.graphReasoning.topPath.problem}`);
        console.log(`    - Solution: ${result.metadata.graphReasoning.topPath.solution}`);
        console.log(`    - Effect: ${result.metadata.graphReasoning.topPath.effect}`);
        console.log(`    - Novelty: ${result.metadata.graphReasoning.topPath.novelty.toFixed(3)}`);
        console.log(`    - Scientific Rationality: ${result.metadata.graphReasoning.topPath.scientificRationality.toFixed(3)}`);
        console.log(`    - Factuality: ${result.metadata.graphReasoning.topPath.factuality.toFixed(3)}`);
        console.log(`    - Overall Score: ${result.metadata.graphReasoning.topPath.overallScore.toFixed(3)}`);
      }
    } else {
      console.log(`\n🔬 GAMP Graph Reasoning: ❌ NOT ACTIVATED`);
      console.log(`  (Domain: ${result.metadata.domain}, IRT: ${result.metadata.difficulty.toFixed(3)})`);
    }

    if (result.metadata.learning) {
      console.log(`\nLearning:`);
      console.log(`  - Memories Used: ${result.metadata.learning.memoriesUsed}`);
      console.log(`  - Success Rate: ${result.metadata.learning.successRate.toFixed(3)}`);
    }

    if (result.metadata.verification) {
      console.log(`\nVerification:`);
      console.log(`  - Verified: ${result.metadata.verification.verified ? '✅' : '❌'}`);
      console.log(`  - Confidence: ${result.metadata.verification.confidence.toFixed(3)}`);
      console.log(`  - Iterations: ${result.metadata.verification.iterations}`);
    }
    console.log('───────────────────────────────────────────────────────────────\n');

    console.log('💬 FULL ANSWER:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(result.answer);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Summary
    console.log('📈 SUMMARY:');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`✅ Query processed successfully`);
    console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📊 Quality score: ${result.metadata.quality_score.toFixed(3)}`);
    console.log(`🔬 GAMP activated: ${result.metadata.graphReasoning ? '✅ YES' : '❌ NO'}`);
    if (result.metadata.graphReasoning) {
      console.log(`   - ${result.metadata.graphReasoning.pathsDiscovered} paths discovered`);
      console.log(`   - Top path score: ${result.metadata.graphReasoning.topPath?.overallScore.toFixed(3) || 'N/A'}`);
    }
    console.log('───────────────────────────────────────────────────────────────\n');

    // Force exit after a short delay to allow cleanup
    setTimeout(() => {
      console.log('\n✅ Test completed successfully. Exiting...');
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('───────────────────────────────────────────────────────────────');
    console.error(error);
    console.error('───────────────────────────────────────────────────────────────\n');
    setTimeout(() => process.exit(1), 500);
  }
}

// Run the test
testComplexQuery().catch((error) => {
  console.error('Fatal error:', error);
  setTimeout(() => process.exit(1), 500);
});

