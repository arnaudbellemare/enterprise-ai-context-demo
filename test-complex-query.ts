/**
 * Complex Query Test for PERMUTATION System
 * 
 * Tests the complete PERMUTATION system with a complex multi-step query
 * that requires:
 * - SWiRL decomposition
 * - SRL enhancement (if enabled)
 * - Multi-query generation
 * - Teacher-student pattern
 * - Answer synthesis
 * - EBM refinement (if enabled)
 */

import { PermutationEngine } from './frontend/lib/permutation-engine';

async function testComplexQuery() {
  console.log('🧪 Testing PERMUTATION System with Complex Query\n');
  console.log('═'.repeat(80));

  // Initialize PERMUTATION engine with all features enabled
  const engine = new PermutationEngine({
    enableSWiRL: true,
    enableSRL: true,  // Enable SRL for expert trajectory matching
    enableTRM: true,
    enableMultiQuery: true,
    enableRAG: true,
    enableEBM: true,  // Enable EBM for answer refinement
    enableIRT: true,
    useEvolvedPrompts: true
  });

  // Complex query that requires multi-step reasoning
  const complexQuery = `Analyze the financial implications of implementing a new AI-powered customer service system for a mid-size e-commerce company. 
  
  Consider:
  1. Initial investment costs (software licensing, infrastructure, training)
  2. Expected ROI within the first 2 years
  3. Operational cost savings from reduced human support staff
  4. Potential risks and mitigation strategies
  5. Comparison with traditional customer service approaches
  
  Provide a comprehensive analysis with specific recommendations.`;

  console.log('📝 Complex Query:');
  console.log(complexQuery);
  console.log('\n🚀 Executing PERMUTATION pipeline...\n');

  try {
    const startTime = Date.now();
    
    const result = await engine.execute(complexQuery);
    
    const duration = Date.now() - startTime;

    console.log('\n' + '═'.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('═'.repeat(80));
    console.log(`\n⏱️  Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`\n📊 Components Used:`);
    console.log(`   ${result.metadata.components_used.join(', ')}`);
    
    console.log(`\n💡 Answer:`);
    console.log(result.answer);
    
    console.log(`\n📈 Quality Score: ${(result.metadata.quality_score * 100).toFixed(1)}%`);
    console.log(`💰 Cost: $${result.metadata.cost.toFixed(4)}`);
    
    // Check for SRL enhancement
    if (result.metadata.srl_used) {
      console.log(`\n🎯 SRL Enhancement Applied:`);
      console.log(`   Average Step Reward: ${result.metadata.srl_average_step_reward?.toFixed(3)}`);
    } else {
      console.log(`\n⚠️  SRL not used (may not have matching expert trajectory)`);
    }
    
    // Check for EBM refinement
    if (result.metadata.ebm_used) {
      console.log(`\n🔬 EBM Refinement Applied:`);
      console.log(`   Refinement Steps: ${result.metadata.ebm_refinement_steps}`);
      console.log(`   Energy Improvement: ${result.metadata.ebm_energy_improvement?.toFixed(4)}`);
    } else {
      console.log(`\n⚠️  EBM not used`);
    }
    
    // Show trace steps
    if (result.trace && result.trace.steps) {
      console.log(`\n🔍 Execution Trace (${result.trace.steps.length} steps):`);
      result.trace.steps.forEach((step: any, i: number) => {
        const status = step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⏭️';
        console.log(`   ${i + 1}. ${status} ${step.component} (${step.duration_ms}ms)`);
      });
    }
    
    // Validate result quality
    const hasAnswer = result.answer && result.answer.length > 50;
    const hasGoodQuality = result.metadata.quality_score >= 0.75;
    const hasComponents = result.metadata.components_used.length >= 3;
    
    console.log('\n' + '═'.repeat(80));
    console.log('🧪 VALIDATION');
    console.log('═'.repeat(80));
    console.log(`   ${hasAnswer ? '✅' : '❌'} Answer generated: ${hasAnswer ? 'YES' : 'NO'}`);
    console.log(`   ${hasGoodQuality ? '✅' : '❌'} Quality score: ${(result.metadata.quality_score * 100).toFixed(1)}% (threshold: 75%)`);
    console.log(`   ${hasComponents ? '✅' : '❌'} Components used: ${result.metadata.components_used.length} (minimum: 3)`);
    
    const allTestsPass = hasAnswer && hasGoodQuality && hasComponents;
    console.log(`\n   ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
    
    return {
      success: allTestsPass,
      result,
      duration,
      metrics: {
        quality: result.metadata.quality_score,
        cost: result.metadata.cost,
        components: result.metadata.components_used.length,
        srlUsed: result.metadata.srl_used,
        ebmUsed: result.metadata.ebm_used
      }
    };
    
  } catch (error) {
    console.error('\n❌ ERROR during test execution:');
    console.error(error);
    throw error;
  }
}

// Run test
if (require.main === module) {
  testComplexQuery()
    .then((result) => {
      console.log('\n✅ Test execution completed successfully');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { testComplexQuery };

