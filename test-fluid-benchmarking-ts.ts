/**
 * Test Fluid Benchmarking - TypeScript Implementation
 * Demonstrates IRT-based evaluation with mislabel detection
 */

import { FluidBenchmarking, createDefaultTestDataset, type IRTItem } from './frontend/lib/fluid-benchmarking';

async function testFluidBenchmarkingTS() {
  console.log('\n🔬 FLUID BENCHMARKING - TypeScript Implementation Test\n');
  console.log('=' .repeat(80));
  
  // Create test dataset
  const testDataset = createDefaultTestDataset();
  console.log(`\n📊 Test Dataset: ${testDataset.length} items`);
  console.log(`   Easy (b < -0.5): ${testDataset.filter(i => i.difficulty < -0.5).length}`);
  console.log(`   Medium (-0.5 to 0.5): ${testDataset.filter(i => i.difficulty >= -0.5 && i.difficulty <= 0.5).length}`);
  console.log(`   Hard (b > 0.5): ${testDataset.filter(i => i.difficulty > 0.5).length}`);
  
  // Initialize evaluator
  const evaluator = new FluidBenchmarking(testDataset);
  
  // Mock test function (simulates Knowledge Graph with ability ~0.6)
  const mockKGTest = async (item: IRTItem): Promise<boolean> => {
    const kg_ability = 0.6;
    const p_correct = evaluator.probabilityCorrect(
      kg_ability,
      item.difficulty,
      item.discrimination
    );
    // Simulate probabilistic success
    return Math.random() < p_correct;
  };
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 Simulating Knowledge Graph Evaluation (ability ≈ 0.6)...\n');
  
  // Run fluid benchmarking
  const result = await evaluator.fluidBenchmarking(
    'knowledge_graph',
    mockKGTest,
    {
      start_ability: 0.0,
      n_max: 30,
      estimation_method: 'map',
      early_stop_threshold: 0.3
    }
  );
  
  console.log('\n✅ EVALUATION COMPLETE\n');
  console.log('=' .repeat(80));
  
  console.log('\n📈 Results:');
  console.log(`   Method: ${result.method}`);
  console.log(`   Final Ability: θ = ${result.final_ability.toFixed(3)}`);
  console.log(`   Standard Error: ±${result.standard_error.toFixed(3)}`);
  console.log(`   95% CI: [${result.ability_estimate.confidence_interval_95[0].toFixed(2)}, ${result.ability_estimate.confidence_interval_95[1].toFixed(2)}]`);
  console.log(`   Items Administered: ${result.items_administered}`);
  console.log(`   Items Correct: ${result.items_correct}`);
  console.log(`   Raw Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
  console.log(`   Processing Time: ${result.processing_time_ms}ms`);
  
  // Interpret ability
  console.log('\n🎯 Interpretation:');
  console.log(`   Ability Level: ${evaluator.interpretAbility(result.final_ability)}`);
  
  // Expected performance by difficulty
  const easyAccuracy = evaluator.expectedAccuracy(result.final_ability, [-2.0, -0.5]);
  const mediumAccuracy = evaluator.expectedAccuracy(result.final_ability, [-0.5, 0.5]);
  const hardAccuracy = evaluator.expectedAccuracy(result.final_ability, [0.5, 2.0]);
  
  console.log('\n   Expected Accuracy by Difficulty:');
  console.log(`   • Easy items (b < -0.5): ${(easyAccuracy * 100).toFixed(1)}%`);
  console.log(`   • Medium items (-0.5 to 0.5): ${(mediumAccuracy * 100).toFixed(1)}%`);
  console.log(`   • Hard items (b > 0.5): ${(hardAccuracy * 100).toFixed(1)}%`);
  
  // Simulate second method for comparison
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 Simulating LangStruct Evaluation (ability ≈ 1.4)...\n');
  
  const mockLSTest = async (item: IRTItem): Promise<boolean> => {
    const ls_ability = 1.4;
    const p_correct = evaluator.probabilityCorrect(
      ls_ability,
      item.difficulty,
      item.discrimination
    );
    return Math.random() < p_correct;
  };
  
  const lsResult = await evaluator.fluidBenchmarking(
    'langstruct',
    mockLSTest,
    {
      start_ability: 0.0,
      n_max: 30,
      estimation_method: 'map'
    }
  );
  
  console.log('\n✅ EVALUATION COMPLETE\n');
  console.log('=' .repeat(80));
  
  console.log('\n📈 Results:');
  console.log(`   Method: ${lsResult.method}`);
  console.log(`   Final Ability: θ = ${lsResult.final_ability.toFixed(3)}`);
  console.log(`   Standard Error: ±${lsResult.standard_error.toFixed(3)}`);
  console.log(`   95% CI: [${lsResult.ability_estimate.confidence_interval_95[0].toFixed(2)}, ${lsResult.ability_estimate.confidence_interval_95[1].toFixed(2)}]`);
  console.log(`   Items Administered: ${lsResult.items_administered}`);
  console.log(`   Items Correct: ${lsResult.items_correct}`);
  console.log(`   Raw Accuracy: ${(lsResult.accuracy * 100).toFixed(1)}%`);
  
  // Compare methods
  console.log('\n' + '=' .repeat(80));
  console.log('\n🏆 COMPARISON\n');
  
  const abilityDiff = lsResult.final_ability - result.final_ability;
  const seCombined = Math.sqrt(
    Math.pow(result.standard_error, 2) + Math.pow(lsResult.standard_error, 2)
  );
  const zScore = abilityDiff / seCombined;
  const isSignificant = Math.abs(zScore) > 1.96; // p < 0.05
  
  console.log(`   Knowledge Graph: θ = ${result.final_ability.toFixed(2)} ± ${result.standard_error.toFixed(2)}`);
  console.log(`   LangStruct: θ = ${lsResult.final_ability.toFixed(2)} ± ${lsResult.standard_error.toFixed(2)}`);
  console.log(`\n   Difference: ${abilityDiff.toFixed(2)}`);
  console.log(`   Z-score: ${zScore.toFixed(2)}`);
  console.log(`   Statistical Significance: ${isSignificant ? '✅ YES (p < 0.05)' : '❌ NO'}`);
  
  if (abilityDiff > 0.5) {
    console.log(`\n   💡 Recommendation: LangStruct significantly better for complex extractions`);
  } else if (abilityDiff < -0.5) {
    console.log(`\n   💡 Recommendation: Knowledge Graph surprisingly effective!`);
  } else {
    console.log(`\n   💡 Recommendation: Methods have similar performance`);
  }
  
  // Detect mislabeled items
  console.log('\n' + '=' .repeat(80));
  console.log('\n🔍 MISLABEL DETECTION\n');
  
  const mislabeled = evaluator.identifyMislabeledItems(0.3);
  
  if (mislabeled.length > 0) {
    console.log(`   Found ${mislabeled.length} potentially mislabeled items:\n`);
    mislabeled.slice(0, 3).forEach(item => {
      console.log(`   • ${item.id}:`);
      console.log(`     Text: "${item.text.substring(0, 60)}..."`);
      console.log(`     Mislabel Probability: ${(item.mislabeled_probability! * 100).toFixed(0)}%`);
      console.log(`     Recommendation: Review and relabel\n`);
    });
  } else {
    console.log(`   ✅ No mislabeled items detected (threshold: 30%)`);
  }
  
  console.log('=' .repeat(80));
  console.log('\n✅ TypeScript Fluid Benchmarking Test Complete!\n');
  
  // Summary
  console.log('📊 SUMMARY:\n');
  console.log(`   • IRT-based ability estimation: ✅`);
  console.log(`   • Adaptive item selection: ✅`);
  console.log(`   • Confidence intervals: ✅`);
  console.log(`   • Mislabel detection: ✅`);
  console.log(`   • Statistical comparison: ✅`);
  console.log(`   • All in TypeScript: ✅\n`);
  
  return { result, lsResult, mislabeled };
}

// Run test
testFluidBenchmarkingTS()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

