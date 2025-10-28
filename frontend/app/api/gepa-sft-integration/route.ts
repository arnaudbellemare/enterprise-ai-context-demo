import { NextRequest, NextResponse } from 'next/server';
import { GEPASFTOptimizer, optimizeWithGEPASFT, type GEPASFTResult } from '@/lib/gepa-sft-integration';
import { dspyRegistry } from '@/lib/dspy-signatures';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for full GEPA + SFT pipeline

/**
 * GEPA + SFT Integration API
 * 
 * Implements the BootstrapFinetune approach from LessWrong research:
 * "Prompt optimization can enable AI control research"
 * 
 * Process:
 * 1. GEPA prompt optimization (genetic-pareto search)
 * 2. Bootstrap training data generation from optimized prompts
 * 3. Supervised fine-tuning using high-quality training pairs
 * 4. Final performance evaluation
 * 
 * This achieves better performance than GEPA alone, as validated by research.
 */

export async function POST(request: NextRequest) {
  try {
    const { 
      moduleName,
      taskType = 'analysis',
      config = {},
      trainset = null
    } = await request.json();

    if (!moduleName) {
      return NextResponse.json(
        { error: 'moduleName is required' },
        { status: 400 }
      );
    }

    console.log('🚀 GEPA + SFT Integration Starting...');
    console.log(`   Module: ${moduleName}`);
    console.log(`   Task Type: ${taskType}`);
    console.log(`   Config:`, config);

    const startTime = Date.now();

    // Get or create training set
    const trainingSet = trainset || generateTrainingSet(taskType);
    console.log(`   Training Set: ${trainingSet.length} examples`);

    // Run GEPA + SFT optimization
    const result: GEPASFTResult = await optimizeWithGEPASFT(
      moduleName,
      trainingSet,
      {
        // GEPA Phase
        gepa_iterations: config.gepa_iterations || 3,
        gepa_candidates: config.gepa_candidates || 8,
        gepa_objectives: config.gepa_objectives || ['quality', 'speed', 'cost'],
        
        // SFT Phase
        sft_epochs: config.sft_epochs || 2,
        sft_learning_rate: config.sft_learning_rate || 1e-5,
        sft_batch_size: config.sft_batch_size || 4,
        sft_weight_decay: config.sft_weight_decay || 1e-5,
        
        // Bootstrap Phase
        bootstrap_threshold: config.bootstrap_threshold || 0.8,
        bootstrap_samples: config.bootstrap_samples || 20,
        
        // General
        use_reflection_llm: config.use_reflection_llm !== false,
        reflection_model: config.reflection_model || 'gpt-4o',
        
        ...config
      }
    );

    const totalTime = Date.now() - startTime;

    console.log('✅ GEPA + SFT Integration Complete!');
    console.log(`   Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`   Improvement over Baseline: ${result.improvement_over_baseline.toFixed(1)}%`);
    console.log(`   Improvement over GEPA: ${result.improvement_over_gepa.toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      result: {
        // Overall Results
        improvement_over_baseline: result.improvement_over_baseline,
        improvement_over_gepa: result.improvement_over_gepa,
        final_performance: result.final_performance,
        total_time_ms: totalTime,
        
        // GEPA Phase Results
        gepa_phase: {
          original_performance: result.gepa_result.original_performance,
          optimized_performance: result.gepa_result.optimized_performance,
          improvement: result.gepa_result.improvement,
          final_prompts_count: result.gepa_result.final_prompts.length,
          best_prompt: result.gepa_result.final_prompts[0]?.prompt || 'N/A'
        },
        
        // Bootstrap Phase Results
        bootstrap_phase: {
          filtered_samples: result.bootstrap_result.filtered_samples,
          quality_threshold_met: result.bootstrap_result.quality_threshold_met,
          training_pairs_generated: result.bootstrap_result.training_pairs_generated,
          bootstrap_effectiveness: result.bootstrap_result.bootstrap_effectiveness
        },
        
        // SFT Phase Results
        sft_phase: {
          epochs_completed: result.sft_result.epochs_completed,
          final_training_loss: result.sft_result.training_loss[result.sft_result.training_loss.length - 1],
          final_validation_accuracy: result.sft_result.validation_accuracy[result.sft_result.validation_accuracy.length - 1],
          training_pairs_used: result.sft_result.training_pairs.length
        },
        
        // Research Validation
        research_validation: {
          gepa_alone_performance: result.gepa_result.optimized_performance.quality_score,
          gepa_sft_performance: result.final_performance.quality_score,
          improvement_from_sft: result.improvement_over_gepa,
          validates_research: result.improvement_over_gepa > 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('GEPA + SFT Integration error:', error);
    return NextResponse.json(
      { error: error.message || 'GEPA + SFT optimization failed' },
      { status: 500 }
    );
  }
}

/**
 * Generate synthetic training set for testing
 */
function generateTrainingSet(taskType: string): any[] {
  const baseExamples = [
    {
      input: { query: `Analyze the market trends for ${taskType} sector` },
      expected_output: { 
        insights: ['Market shows positive growth', 'Key players expanding', 'Regulatory changes expected'],
        recommendations: ['Consider strategic investments', 'Monitor regulatory updates'],
        confidence: 0.85
      }
    },
    {
      input: { query: `What are the risks in ${taskType} investments?` },
      expected_output: { 
        insights: ['Volatility concerns', 'Regulatory uncertainty', 'Competition increasing'],
        recommendations: ['Diversify portfolio', 'Stay informed on regulations'],
        confidence: 0.78
      }
    },
    {
      input: { query: `How to optimize ${taskType} operations?` },
      expected_output: { 
        insights: ['Process automation opportunities', 'Cost reduction potential', 'Efficiency improvements'],
        recommendations: ['Implement automation', 'Review cost structures'],
        confidence: 0.92
      }
    },
    {
      input: { query: `Evaluate ${taskType} performance metrics` },
      expected_output: { 
        insights: ['Above average performance', 'Strong growth indicators', 'Market share expanding'],
        recommendations: ['Maintain current strategy', 'Consider scaling up'],
        confidence: 0.88
      }
    },
    {
      input: { query: `What are the opportunities in ${taskType}?` },
      expected_output: { 
        insights: ['Emerging market segments', 'Technology integration', 'Partnership potential'],
        recommendations: ['Explore new segments', 'Invest in technology', 'Seek strategic partnerships'],
        confidence: 0.81
      }
    }
  ];

  // Add more examples based on task type
  const additionalExamples = [];
  for (let i = 0; i < 10; i++) {
    additionalExamples.push({
      input: { query: `${taskType} analysis example ${i + 1}` },
      expected_output: { 
        insights: [`Insight ${i + 1}`, `Trend ${i + 1}`, `Pattern ${i + 1}`],
        recommendations: [`Recommendation ${i + 1}`, `Action ${i + 1}`],
        confidence: 0.7 + Math.random() * 0.25
      }
    });
  }

  return [...baseExamples, ...additionalExamples];
}
