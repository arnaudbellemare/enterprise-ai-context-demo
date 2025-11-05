/**
 * Simple Test for Lite-GAMP Pipeline
 * Tests the complete optimization pipeline with all integrations:
 * - DO-RAG/REFRAG query reformulation
 * - PromptMII + GEPA compound optimization
 * - DSPy with PredictionStrategy
 * - Pareto sampling
 */

import { PermutationLiteGAMPPipeline } from './frontend/lib/permutation-lite/permutation-lite-gamp-pipeline';

async function testSimpleQuery() {
  console.log('🧪 Testing Lite-GAMP Pipeline with Simple Query');
  console.log('='.repeat(80));
  console.log('');

  const query = "What are the key considerations for setting up a business in Colombia?";
  const domain = 'general';

  console.log(`Query: ${query}`);
  console.log(`Domain: ${domain}`);
  console.log('');

  try {
    // Initialize pipeline with all optimizations enabled
    const pipeline = new PermutationLiteGAMPPipeline({
      enableGAMP: true,
      enableOptimization: true,
      enableLearning: true,
      enableVerification: false, // RVS removed
      enableTeacherStudent: true,
      useGEPAArborWorkflow: true, // Full GEPA + DSPy + Ax LLM
      enableREFRAG: true, // For query reformulation
      fastMode: false, // Full optimization
      gampConfig: {
        scientificDomains: [], // Activate for any domain based on difficulty
        maxPaths: 10,
        irtThreshold: 0.5,
      },
    });

    console.log('🚀 Starting pipeline execution...');
    console.log('');

    const startTime = Date.now();
    const result = await pipeline.execute(query, domain);
    const duration = Date.now() - startTime;

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ TEST RESULTS');
    console.log('='.repeat(80));
    console.log('');

    console.log(`📊 Execution Time: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`📈 Quality Score: ${result.metadata.quality_score.toFixed(3)}`);
    console.log(`💰 Cost: $${result.metadata.performance?.cost?.toFixed(4) || '0.0000'}`);
    console.log(`📍 Layers Executed: ${result.metadata.layers_executed.join(' → ')}`);
    console.log('');

    // Optimization results
    if (result.metadata.optimization) {
      console.log('🔬 Optimization Results:');
      console.log(`   - Optimized Prompt: ${result.metadata.optimization.optimizedPrompt.substring(0, 100)}...`);
      console.log(`   - Quality: ${result.metadata.optimization.quality.toFixed(3)}`);
      console.log(`   - Generations: ${result.metadata.optimization.generations}`);
      console.log('');
    }

    // GAMP results
    if (result.metadata.graphReasoning) {
      console.log('🔬 GAMP Results:');
      console.log(`   - Paths Discovered: ${result.metadata.graphReasoning.pathsDiscovered}`);
      if (result.metadata.graphReasoning.topPath) {
        console.log(`   - Top Path Score: ${result.metadata.graphReasoning.topPath.overallScore.toFixed(3)}`);
        console.log(`   - Novelty: ${result.metadata.graphReasoning.topPath.novelty.toFixed(2)}`);
      }
      console.log('');
    }

    // Learning results
    if (result.metadata.learning) {
      console.log('📚 Learning Results:');
      console.log(`   - Memories Stored: ${result.metadata.learning.memoriesStored}`);
      console.log(`   - Memories Used: ${result.metadata.learning.memoriesUsed}`);
      console.log('');
    }

    // Answer preview
    console.log('💬 Answer Preview:');
    console.log('-'.repeat(80));
    const answerPreview = result.answer.length > 500 
      ? result.answer.substring(0, 500) + '...'
      : result.answer;
    console.log(answerPreview);
    console.log('-'.repeat(80));
    console.log('');

    // Check for errors or warnings
    const hasErrors = result.metadata.performance?.errors?.length > 0;
    if (hasErrors) {
      console.log('⚠️  Errors/Warnings:');
      result.metadata.performance.errors.forEach((err: any) => {
        console.log(`   - ${err}`);
      });
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ Test Complete!');
    console.log('='.repeat(80));

    return result;

  } catch (error: any) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
testSimpleQuery()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

