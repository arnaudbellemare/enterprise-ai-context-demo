/**
 * Test Complex Art Insurance Premium Query
 * 
 * Tests the unified permutation pipeline with Alita-G improvements
 * on a complex, domain-specific art insurance case
 */

import { executeUnifiedPipeline } from './frontend/lib/unified-permutation-pipeline';

const COMPLEX_QUERY = `
I need to calculate insurance premiums for a high-value art collection including:
- A 1920s Art Deco Cartier diamond necklace valued at $2.5M
- A 1960s Pop Art painting by Andy Warhol valued at $8M
- A collection of rare vintage watches valued at $1.2M
- Various sculptures and installations valued at $3M

The collection will be:
- Displayed in a private gallery with advanced security
- Occasionally loaned to museums for exhibitions
- Stored in a climate-controlled vault when not on display
- Transported internationally for exhibitions 2-3 times per year

I need:
1. Premium calculations for each category
2. Risk assessment considering:
   - Theft risk factors
   - Damage during transportation
   - Climate control failure risks
   - Market value fluctuations
3. Recommended coverage limits and deductibles
4. Comparison of different insurance providers
5. Cost optimization strategies

Please provide detailed analysis with supporting calculations.
`;

async function testArtInsurancePremium() {
  console.log('🎨 ===========================================');
  console.log('🎨 ART INSURANCE PREMIUM COMPLEX QUERY TEST');
  console.log('🎨 ===========================================\n');

  console.log('📋 Query:');
  console.log(COMPLEX_QUERY.substring(0, 200) + '...\n');

  const startTime = Date.now();

  try {
    const result = await executeUnifiedPipeline(
      COMPLEX_QUERY,
      'insurance', // Should auto-detect as insurance domain
      undefined, // context
      {
        enableACE: true,
        enableGEPA: true,
        enableIRT: true,
        enableRVS: true,
        enableDSPy: true,
        enableSemiotic: true,
        enableTeacherStudent: true,
        enableSWiRL: true,
        enableSRL: true,
        enableEBM: true,
        enableToolSynthesis: true, // Alita-G: Enable tool synthesis
        toolSynthesisIterations: 1, // Single execution for now
        enableSelfImprovingJudge: true,
        optimizationMode: 'quality' as const
      },
      undefined // streamWriter
    );

    const duration = Date.now() - startTime;

    console.log('\n✅ ===========================================');
    console.log('✅ RESULTS');
    console.log('✅ ===========================================\n');

    console.log('📊 Answer:');
    console.log(result.answer.substring(0, 500));
    if (result.answer.length > 500) {
      console.log(`\n... (${result.answer.length - 500} more characters)`);
    }

    console.log('\n📈 Performance Metrics:');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Quality Score: ${(result.metadata?.quality_score || 0).toFixed(3)}`);
    console.log(`   Cost: $${(result.metadata?.total_cost || 0).toFixed(6)}`);
    console.log(`   Tokens: ${result.metadata?.total_tokens || 'N/A'}`);

    console.log('\n🔧 Components Used:');
    if (result.metadata.ace_used) console.log('   ✅ ACE (Adaptive Context Enhancement)');
    if (result.metadata.gepa_used) console.log('   ✅ GEPA (Genetic-Pareto Evolution)');
    if (result.metadata.irt_score !== undefined) console.log(`   ✅ IRT Score: ${result.metadata.irt_score.toFixed(3)}`);
    if (result.metadata.rvs_used) console.log('   ✅ RVS (Reliability Verification System)');
    if (result.metadata.dspy_optimized) console.log('   ✅ DSPy Optimization');
    if (result.metadata.semiotic_analysis) console.log('   ✅ Semiotic Analysis');
    if (result.metadata.teacher_student_used) console.log('   ✅ Teacher-Student Learning');
    if (result.metadata.swirl_decomposition) console.log('   ✅ SWiRL (Multi-step Reasoning)');
    if (result.metadata.ebm_refined) console.log('   ✅ EBM (Energy-Based Refinement)');

    console.log('\n🧠 Domain Detection:');
    if (result.metadata.domain_detected) {
      console.log(`   Detected Domain: ${result.metadata.domain_detected}`);
      if (result.metadata.domain_confidence) {
        console.log(`   Confidence: ${(result.metadata.domain_confidence * 100).toFixed(1)}%`);
      }
    }

    console.log('\n🔧 Alita-G Tool Synthesis:');
    if (result.metadata.tools_synthesized) {
      console.log(`   Tools Synthesized: ${result.metadata.tools_synthesized}`);
      if (result.metadata.tool_names) {
        console.log(`   Tool Names: ${result.metadata.tool_names.join(', ')}`);
      }
      if (result.metadata.tool_synthesis_iterations) {
        console.log(`   Synthesis Iterations: ${result.metadata.tool_synthesis_iterations}`);
      }
    } else {
      console.log('   No tools synthesized (query may not have generated reusable tools)');
    }

    console.log('\n📚 Reasoning Bank:');
    if (result.metadata.reasoningbank_memories_used) {
      console.log(`   Memories Used: ${result.metadata.reasoningbank_memories_used}`);
      if (result.metadata.reasoningbank_memory_titles) {
        console.log(`   Memory Titles: ${result.metadata.reasoningbank_memory_titles.join(', ')}`);
      }
    }

    console.log('\n🎯 Judge Learning:');
    if (result.metadata.judge_learned_from_outcome) {
      console.log('   ✅ Judge learned from this execution');
      if (result.metadata.judge_calibration_accuracy) {
        console.log(`   Calibration Accuracy: ${(result.metadata.judge_calibration_accuracy * 100).toFixed(1)}%`);
      }
    }

    console.log('\n📝 Trace Summary:');
    if (result.trace && result.trace.steps) {
      console.log(`   Total Steps: ${result.trace.steps.length}`);
      const stepTypes = result.trace.steps.reduce((acc: Record<string, number>, step) => {
        acc[step.component] = (acc[step.component] || 0) + 1;
        return acc;
      }, {});
      console.log('   Components:', Object.entries(stepTypes).map(([k, v]) => `${k}:${v}`).join(', '));
    }

    console.log('\n✅ Test completed successfully!\n');

    return result;

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

// Run test
testArtInsurancePremium()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
