import { NextRequest, NextResponse } from 'next/server';
import { GEPAEvolutionEngine, type EvolutionConfig } from '@/lib/gepa-evolution';

/**
 * GEPA Evolution Demo
 * Demonstrates the full GEPA process: Reflective Prompt Evolution
 */

export async function POST(request: NextRequest) {
  try {
    const {
      budget = 50,
      minibatch_size = 5,
      mutation_probability = 0.7,
      tasks = ['financial_analysis', 'risk_assessment', 'market_research']
    } = await request.json();

    console.log('🧬 Starting GEPA Evolution Demo');
    console.log('Budget:', budget);
    console.log('Tasks:', tasks);

    // Initial prompt candidates
    const initialPrompts = [
      `You are a financial analyst. Analyze the data and provide insights.`,
      `You are an expert in financial analysis. Examine the provided information carefully and deliver comprehensive analysis with actionable recommendations.`,
      `Analyze financial data. Be accurate and thorough.`
    ];

    // Evolution configuration
    const config: EvolutionConfig = {
      budget,
      minibatch_size,
      mutation_probability,
      merge_probability: 1 - mutation_probability,
      performance_threshold: 70,
      tasks
    };

    // Create evolution engine
    const evolutionEngine = new GEPAEvolutionEngine(config, initialPrompts);

    // Run evolution process
    const finalPool = await evolutionEngine.evolve();

    // Get evolution history
    const history = evolutionEngine.getEvolutionHistory();

    // Analyze results
    const results = {
      evolution_summary: {
        initial_candidates: initialPrompts.length,
        final_candidates: finalPool.candidates.length,
        generations: finalPool.current_generation,
        budget_consumed: config.budget - finalPool.evolution_budget,
        pareto_frontier_size: finalPool.pareto_frontier.length
      },
      
      best_candidates: finalPool.candidates
        .map(c => ({
          id: c.id,
          generation: c.generation,
          parent_ids: c.parent_ids,
          strategy: c.metadata.strategy_used,
          text_preview: c.text.substring(0, 150) + '...',
          performance: {
            avg_score: evolutionEngine['getAverageScore'](c).toFixed(2),
            success_rate: (evolutionEngine['getSuccessRate'](c) * 100).toFixed(1) + '%'
          }
        }))
        .sort((a, b) => parseFloat(b.performance.avg_score) - parseFloat(a.performance.avg_score))
        .slice(0, 5),

      pareto_frontier: finalPool.pareto_frontier.map(id => {
        const candidate = finalPool.candidates.find(c => c.id === id);
        return {
          id: candidate?.id,
          text_preview: candidate?.text.substring(0, 100) + '...',
          parent_lineage: candidate?.parent_ids.join(' → ') || 'initial',
          generation: candidate?.generation
        };
      }),

      evolution_history: history,

      scores_matrix: Object.entries(finalPool.scores_matrix).map(([candidateId, scores]) => ({
        candidate_id: candidateId,
        task_performance: scores
      })),

      key_insights: [
        'GEPA evolved prompts through reflective mutation and strategic merging',
        `Generated ${finalPool.candidates.length - initialPrompts.length} new candidates across ${finalPool.current_generation} generations`,
        `Pareto frontier contains ${finalPool.pareto_frontier.length} non-dominated candidates`,
        'Each evolution step used execution feedback to guide prompt improvement',
        'System aware merge preserved evolved modules from parent candidates',
        'Budget-controlled iteration ensured efficient evolution process'
      ],

      evolution_process: [
        '1. Initialize with seed prompts',
        '2. While budget > 0:',
        '   a. Propose new candidate (mutation or merge)',
        '   b. Evaluate on minibatch',
        '   c. If performance improved: add to pool',
        '   d. Update Pareto frontier',
        '3. Return evolved candidate pool'
      ]
    };

    return NextResponse.json({
      success: true,
      result: results
    });

  } catch (error) {
    console.error('GEPA evolution demo error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute GEPA evolution demo'
    }, { status: 500 });
  }
}
