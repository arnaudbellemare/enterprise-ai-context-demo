/**
 * Complex Art Insurance Query Test
 * Tests the complete lite-gamp pipeline with:
 * - GAMP graph reasoning
 * - Context Engineering 2.0
 * - REFRAG query reformulation
 * - GEPA + DSPy optimization
 * - Real answer generation
 */

import { PermutationLiteGAMPPipeline } from './frontend/lib/permutation-lite/permutation-lite-gamp-pipeline';

async function testArtInsuranceComplex() {
  console.log('🎨 Testing Complex Art Insurance Query');
  console.log('='.repeat(80));
  console.log('');

  const query = "I need to evaluate the insurance premium for a high-value Alec Monopoly contemporary painting (estimated value $850,000) that will be traveling from London to New York for an art gallery exhibition, then to Los Angeles for a private collector showcase. The artwork requires climate-controlled transport, specialized art handlers, and comprehensive coverage including transit, exhibition, and storage periods. What are the key insurance considerations, premium estimates, and risk mitigation strategies?";
  const domain = 'financial';

  console.log(`Query: ${query.substring(0, 150)}...`);
  console.log(`Domain: ${domain}`);
  console.log('');

  try {
    // Initialize pipeline with all optimizations enabled (same as lite-gamp mode)
    const pipeline = new PermutationLiteGAMPPipeline({
      enableGAMP: true,
      enableOptimization: true,
      enableLearning: true,
      enableVerification: false, // RVS removed
      enableTeacherStudent: true,
      useGEPAArborWorkflow: true, // Full GEPA + DSPy + Ax LLM
      enableREFRAG: true, // Query reformulation
      fastMode: false, // Context Engineering 2.0 always runs
      gampConfig: {
        scientificDomains: [], // Activate for any domain
        maxPaths: 10,
        irtThreshold: 0.3, // Lower threshold for activation
        minNoveltyThreshold: 0.5,
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

    // Check GAMP activation
    if (result.metadata.graphReasoning) {
      console.log('🔬 GAMP Results:');
      console.log(`   - Paths Discovered: ${result.metadata.graphReasoning.pathsDiscovered}`);
      console.log(`   - Graph Nodes: ${result.metadata.graphReasoning.graphStats?.nodes || 0}`);
      console.log(`   - Graph Edges: ${result.metadata.graphReasoning.graphStats?.edges || 0}`);
      if (result.metadata.graphReasoning.topPath) {
        console.log(`   - Top Path Score: ${result.metadata.graphReasoning.topPath.overallScore.toFixed(3)}`);
        console.log(`   - Novelty: ${result.metadata.graphReasoning.topPath.novelty.toFixed(2)}`);
        console.log(`   - Problem: ${result.metadata.graphReasoning.topPath.problem.substring(0, 100)}...`);
      }
      console.log('');
    } else {
      console.log('⚠️  GAMP did not activate - check IRT threshold and domain');
      console.log('');
    }

    // Check Context Engineering 2.0
    if (result.metadata.contextEngineering) {
      console.log('🧠 Context Engineering 2.0 Results:');
      console.log(`   - Contexts Enriched: ${result.metadata.contextEngineering.context?.length || 0}`);
      console.log(`   - Quality: Relevance ${(result.metadata.contextEngineering.quality?.relevance * 100).toFixed(0)}%`);
      console.log(`   - Proactive Inferences: ${result.metadata.contextEngineering.analytics?.inferredNeeds?.length || 0}`);
      console.log('');
    } else {
      console.log('⚠️  Context Engineering 2.0 results not found in metadata');
      console.log('');
    }

    // Optimization results
    if (result.metadata.optimization) {
      console.log('🔬 Optimization Results:');
      console.log(`   - Quality: ${result.metadata.optimization.quality.toFixed(3)}`);
      console.log(`   - Generations: ${result.metadata.optimization.generations}`);
      if (result.metadata.optimization.optimizedPrompt) {
        console.log(`   - Optimized Prompt: ${result.metadata.optimization.optimizedPrompt.substring(0, 100)}...`);
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
    const answerPreview = result.answer.length > 1000 
      ? result.answer.substring(0, 1000) + '...'
      : result.answer;
    console.log(answerPreview);
    console.log('-'.repeat(80));
    console.log('');
    console.log(`📝 Full answer length: ${result.answer.length} characters`);
    console.log('');

    // Validate answer quality
    const hasInsuranceTerms = /insurance|premium|coverage|policy|risk/i.test(result.answer);
    const hasArtTerms = /art|painting|artwork|gallery|exhibition/i.test(result.answer);
    const hasSpecificDetails = /\$|percent|%|USD|climate|transport|handler/i.test(result.answer);
    
    console.log('✅ Answer Quality Checks:');
    console.log(`   - Contains insurance terms: ${hasInsuranceTerms ? '✅' : '❌'}`);
    console.log(`   - Contains art terms: ${hasArtTerms ? '✅' : '❌'}`);
    console.log(`   - Contains specific details: ${hasSpecificDetails ? '✅' : '❌'}`);
    console.log(`   - Answer length adequate: ${result.answer.length > 500 ? '✅' : '❌'} (${result.answer.length} chars)`);
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
testArtInsuranceComplex()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

