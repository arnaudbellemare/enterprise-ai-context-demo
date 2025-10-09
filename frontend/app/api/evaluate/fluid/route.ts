/**
 * Fluid Benchmarking API - TypeScript Implementation
 * Based on AllenAI's fluid-benchmarking with IRT
 * 
 * Identifies mislabeled test cases and adaptively evaluates extraction methods
 * Reference: https://github.com/allenai/fluid-benchmarking
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  FluidBenchmarking, 
  createDefaultTestDataset, 
  testExtractionOnItem,
  compareExtractionMethods,
  type IRTItem
} from '@/lib/fluid-benchmarking';

export async function POST(req: NextRequest) {
  try {
    const {
      method = 'knowledge_graph',
      userId = 'eval-user',
      n_max = 50,
      start_ability = 0.0,
      test_items = null,
      compare_methods = false
    } = await req.json();

    const testDataset = test_items || createDefaultTestDataset();

    // If comparing multiple methods
    if (compare_methods) {
      const methods = ['knowledge_graph', 'smart_extract'];
      const comparison = await compareExtractionMethods(methods, testDataset, n_max);

      return NextResponse.json({
        mode: 'comparison',
        results: comparison.results,
        best_method: comparison.comparison.best_method,
        ranking: comparison.comparison.ability_ranking,
        mislabeled_items: comparison.comparison.mislabeled_items.slice(0, 5),
        interpretation: {
          winner: comparison.comparison.best_method,
          ability_difference: 
            comparison.comparison.ability_ranking[0].ability - 
            comparison.comparison.ability_ranking[1].ability,
          statistical_significance: 
            Math.abs(
              comparison.comparison.ability_ranking[0].ability - 
              comparison.comparison.ability_ranking[1].ability
            ) > 0.5 ? 'Significant' : 'Not significant'
        }
      });
    }

    // Single method evaluation
    const evaluator = new FluidBenchmarking(testDataset);

    const testFn = async (item: IRTItem) => 
      await testExtractionOnItem(method as any, item, userId);

    const result = await evaluator.fluidBenchmarking(method, testFn, {
      start_ability,
      n_max,
      estimation_method: 'map',
      early_stop_threshold: 0.3
    });

    // Detect mislabeled items
    const mislabeled = evaluator.identifyMislabeledItems(0.3);

    // Calculate expected accuracies by difficulty
    const easyAccuracy = evaluator.expectedAccuracy(result.final_ability, [-2.0, -0.5]);
    const mediumAccuracy = evaluator.expectedAccuracy(result.final_ability, [-0.5, 0.5]);
    const hardAccuracy = evaluator.expectedAccuracy(result.final_ability, [0.5, 2.0]);

    return NextResponse.json({
      ...result,
      interpretation: {
        ability_level: evaluator.interpretAbility(result.final_ability),
        confidence: result.standard_error < 0.3 ? 'High' : 
                    result.standard_error < 0.5 ? 'Medium' : 'Low',
        expected_performance: {
          easy_items: `${(easyAccuracy * 100).toFixed(0)}%`,
          medium_items: `${(mediumAccuracy * 100).toFixed(0)}%`,
          hard_items: `${(hardAccuracy * 100).toFixed(0)}%`
        }
      },
      mislabeled_items: mislabeled.slice(0, 5).map(item => ({
        id: item.id,
        text: item.text.substring(0, 100) + '...',
        probability: item.mislabeled_probability,
        recommendation: 'Review and potentially relabel'
      })),
      fluid_benchmarking: true,
      typescript_implementation: true
    });

  } catch (error: any) {
    console.error('Fluid evaluation error:', error);
    return NextResponse.json(
      { error: error.message || 'Evaluation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Show evaluation info
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: 'Fluid Benchmarking API',
    description: 'IRT-based adaptive evaluation for entity extraction',
    reference: 'https://github.com/allenai/fluid-benchmarking',
    paper: 'https://arxiv.org/abs/2509.11106',
    features: {
      adaptive_testing: 'Select most informative items based on current ability',
      mislabel_detection: 'Identify potentially mislabeled test cases',
      efficient_evaluation: 'Reduce test overhead while maintaining accuracy',
      ability_estimation: 'Precise ability estimates with confidence intervals'
    },
    irt_model: {
      type: '2PL (Two-Parameter Logistic)',
      parameters: {
        difficulty: 'How hard the item is (-3 to 3)',
        discrimination: 'How well item separates abilities (0 to 3)'
      }
    },
    usage: {
      endpoint: 'POST /api/evaluate/fluid',
      example: {
        method: 'knowledge_graph',
        userId: 'eval-user',
        n_max: 50,
        start_ability: 0.0
      }
    }
  });
}

