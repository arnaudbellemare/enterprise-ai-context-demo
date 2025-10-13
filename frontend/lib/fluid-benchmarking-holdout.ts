/**
 * Fluid Benchmarking with Hold-Out Validation
 * PROPER scientific approach to prevent overfitting
 * 
 * Split items into:
 * - Calibration Set: Used to calibrate difficulty ratings
 * - Validation Set: NEVER used for calibration (proves no overfitting)
 */

import { FluidBenchmarking, IRTItem } from './fluid-benchmarking';

/**
 * Calibration Set (7 items)
 * These items can be recalibrated based on model performance
 */
export function getCalibrationSet(): IRTItem[] {
  return [
    // Easy (2 items)
    {
      id: 'cal-easy-1',
      text: 'Sarah is working on the AI project.',
      expected_entities: [
        { type: 'person', name: 'Sarah' },
        { type: 'project', name: 'AI project' }
      ],
      difficulty: -1.0,
      discrimination: 1.5
    },
    {
      id: 'cal-easy-2',
      text: 'John leads the Sales Dashboard project.',
      expected_entities: [
        { type: 'person', name: 'John' },
        { type: 'project', name: 'Sales Dashboard' }
      ],
      difficulty: -0.8,
      discrimination: 1.2
    },
    
    // Medium (3 items)
    {
      id: 'cal-medium-1',
      text: 'The Q3 2024 optimization initiative, led by Dr. Smith, improved efficiency by 40%.',
      expected_entities: [
        { type: 'person', name: 'Dr. Smith' },
        { type: 'project', name: 'optimization initiative' },
        { type: 'concept', name: 'efficiency' }
      ],
      difficulty: 0.0,
      discrimination: 1.8
    },
    {
      id: 'cal-medium-2',
      text: 'The API refactoring project started in January 2024 and is now 75% complete.',
      expected_entities: [
        { type: 'project', name: 'API refactoring' },
        { type: 'event', name: 'January 2024' }
      ],
      difficulty: 0.2,
      discrimination: 1.4
    },
    {
      id: 'cal-medium-3',
      text: 'Sarah collaborates with the engineering team on implementing machine learning algorithms for the analytics platform.',
      expected_entities: [
        { type: 'person', name: 'Sarah' },
        { type: 'organization', name: 'engineering team' },
        { type: 'concept', name: 'machine learning' },
        { type: 'project', name: 'analytics platform' }
      ],
      difficulty: 0.5, // Recalibrated based on IRT
      discrimination: 1.6
    },
    
    // Hard (2 items)
    {
      id: 'cal-hard-1',
      text: 'Invoice #INV-2024-0045 dated January 15, 2024, from Acme Corporation to TechStart Inc. for professional consulting services. Total: $12,450.75.',
      expected_entities: [
        { type: 'document', name: 'INV-2024-0045' },
        { type: 'organization', name: 'Acme Corporation' },
        { type: 'organization', name: 'TechStart Inc' },
        { type: 'concept', name: 'consulting services' }
      ],
      difficulty: 0.7, // Recalibrated
      discrimination: 2.0
    },
    {
      id: 'cal-hard-2',
      text: 'The polymorphic implementation of the visitor pattern leverages dependency injection via the abstract factory.',
      expected_entities: [
        { type: 'concept', name: 'visitor pattern' },
        { type: 'concept', name: 'dependency injection' },
        { type: 'concept', name: 'abstract factory' }
      ],
      difficulty: 1.8, // Recalibrated
      discrimination: 2.2
    }
  ];
}

/**
 * Validation Set (3 items)
 * NEVER recalibrate these! They prove we didn't overfit.
 */
export function getValidationSet(): IRTItem[] {
  return [
    // Easy validation item
    {
      id: 'val-easy-1',
      text: 'The Engineering team is implementing automation.',
      expected_entities: [
        { type: 'organization', name: 'Engineering team' },
        { type: 'concept', name: 'automation' }
      ],
      difficulty: -0.4, // FIXED - never change this
      discrimination: 1.3
    },
    
    // Medium validation item
    {
      id: 'val-medium-1',
      text: 'Patient Jane Doe presents with progressive dyspnea. PMH: Type 2 Diabetes Mellitus, Hypertension.',
      expected_entities: [
        { type: 'person', name: 'Jane Doe' },
        { type: 'concept', name: 'dyspnea' },
        { type: 'concept', name: 'Type 2 Diabetes Mellitus' },
        { type: 'concept', name: 'Hypertension' }
      ],
      difficulty: 0.8, // FIXED - never change this
      discrimination: 2.1
    },
    
    // Very hard validation item
    {
      id: 'val-very-hard-1',
      text: 'The heterogeneous computing paradigm encapsulates SIMD vectorization, thread-level parallelism, and memory coalescing across CUDA, OpenCL, and SYCL backends.',
      expected_entities: [
        { type: 'concept', name: 'heterogeneous computing' },
        { type: 'concept', name: 'SIMD vectorization' },
        { type: 'concept', name: 'thread-level parallelism' },
        { type: 'concept', name: 'memory coalescing' },
        { type: 'concept', name: 'CUDA' },
        { type: 'concept', name: 'OpenCL' },
        { type: 'concept', name: 'SYCL' }
      ],
      difficulty: 2.1, // FIXED - never change this
      discrimination: 1.8
    }
  ];
}

/**
 * Get combined test set (calibration + validation)
 */
export function getFullTestSet(): IRTItem[] {
  return [
    ...getCalibrationSet(),
    ...getValidationSet()
  ];
}

/**
 * Validate that calibration didn't overfit
 * 
 * Tests a NEW model on validation set (items that were NEVER calibrated)
 * If predictions are accurate → no overfitting
 * If predictions are off → we overfit to calibration models
 */
export async function validateCalibration(
  testFunction: (item: IRTItem) => Promise<boolean>,
  calibratedAbility: number
): Promise<{
  overfit: boolean;
  validationAccuracy: number;
  expectedAccuracy: number;
  discrepancy: number;
  conclusion: string;
}> {
  const validationSet = getValidationSet();
  const evaluator = new FluidBenchmarking(validationSet);
  
  console.log('\n🔬 OVERFITTING VALIDATION TEST');
  console.log('Testing on hold-out validation set (NEVER calibrated)');
  console.log(`Expected ability based on calibration: θ ≈ ${calibratedAbility.toFixed(2)}\n`);
  
  // Test on validation set
  let correct = 0;
  for (const item of validationSet) {
    const isCorrect = await testFunction(item);
    if (isCorrect) correct++;
    
    const expected_p = evaluator.probabilityCorrect(
      calibratedAbility,
      item.difficulty,
      item.discrimination
    );
    
    console.log(
      `   ${item.id}: ${isCorrect ? '✓' : '✗'} ` +
      `(expected: ${(expected_p * 100).toFixed(0)}%, difficulty: ${item.difficulty.toFixed(1)})`
    );
  }
  
  const validationAccuracy = correct / validationSet.length;
  
  // Calculate expected accuracy based on calibrated ability
  let expectedAccuracy = 0;
  for (const item of validationSet) {
    expectedAccuracy += evaluator.probabilityCorrect(
      calibratedAbility,
      item.difficulty,
      item.discrimination
    );
  }
  expectedAccuracy /= validationSet.length;
  
  const discrepancy = Math.abs(validationAccuracy - expectedAccuracy);
  
  // If discrepancy > 0.15 (15%), likely overfit
  const overfit = discrepancy > 0.15;
  
  let conclusion;
  if (discrepancy < 0.10) {
    conclusion = '✅ NO OVERFITTING - Calibration generalizes well!';
  } else if (discrepancy < 0.15) {
    conclusion = '⚠️ MINOR DISCREPANCY - Calibration mostly valid';
  } else {
    conclusion = '❌ OVERFITTING DETECTED - Calibration fits training models only!';
  }
  
  console.log('\n📊 VALIDATION RESULTS:');
  console.log(`   Validation Accuracy:  ${(validationAccuracy * 100).toFixed(1)}%`);
  console.log(`   Expected Accuracy:    ${(expectedAccuracy * 100).toFixed(1)}%`);
  console.log(`   Discrepancy:          ${(discrepancy * 100).toFixed(1)}%`);
  console.log(`   Overfitting:          ${overfit ? 'YES ❌' : 'NO ✅'}`);
  console.log(`\n   ${conclusion}\n`);
  
  return {
    overfit,
    validationAccuracy,
    expectedAccuracy,
    discrepancy,
    conclusion
  };
}

/**
 * Cross-validation: Test multiple models with hold-out validation
 */
export async function crossValidateModels(
  models: Array<{
    name: string;
    testFunction: (item: IRTItem) => Promise<boolean>;
  }>
): Promise<{
  calibrationAccurate: boolean;
  avgDiscrepancy: number;
  results: Array<any>;
}> {
  console.log('\n🔬 CROSS-VALIDATION TEST');
  console.log(`Testing ${models.length} models on hold-out validation set\n`);
  
  const results = [];
  let totalDiscrepancy = 0;
  
  for (const model of models) {
    console.log(`Testing: ${model.name}`);
    
    // First get ability from calibration set
    const calibrationSet = getCalibrationSet();
    const calibrationEvaluator = new FluidBenchmarking(calibrationSet);
    
    const calibrationResult = await calibrationEvaluator.fluidBenchmarking(
      model.name,
      model.testFunction,
      { n_max: 30 }
    );
    
    console.log(`   Calibration ability: θ = ${calibrationResult.final_ability.toFixed(2)}`);
    
    // Then validate on hold-out set
    const validationResult = await validateCalibration(
      model.testFunction,
      calibrationResult.final_ability
    );
    
    results.push({
      model: model.name,
      calibrationAbility: calibrationResult.final_ability,
      validationDiscrepancy: validationResult.discrepancy,
      overfit: validationResult.overfit
    });
    
    totalDiscrepancy += validationResult.discrepancy;
  }
  
  const avgDiscrepancy = totalDiscrepancy / models.length;
  const calibrationAccurate = avgDiscrepancy < 0.15;
  
  console.log('\n📊 CROSS-VALIDATION SUMMARY:');
  console.log(`   Average Discrepancy:  ${(avgDiscrepancy * 100).toFixed(1)}%`);
  console.log(`   Calibration Accurate: ${calibrationAccurate ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   Overfitting Risk:     ${calibrationAccurate ? 'LOW' : 'HIGH'}\n`);
  
  return {
    calibrationAccurate,
    avgDiscrepancy,
    results
  };
}

