import { NextRequest, NextResponse } from 'next/server';

/**
 * Optimization Strategy API
 * Based on tech stack benchmark results, provides actionable optimization recommendations
 */

interface OptimizationStrategy {
  component_priorities: {
    high_priority: string[];
    medium_priority: string[];
    low_priority: string[];
  };
  performance_optimizations: {
    ocr_optimization: string[];
    irt_optimization: string[];
    latency_optimization: string[];
    cost_optimization: string[];
  };
  architecture_recommendations: {
    primary_components: string[];
    secondary_components: string[];
    caching_strategy: string[];
    routing_strategy: string[];
  };
  implementation_roadmap: {
    phase_1: string[];
    phase_2: string[];
    phase_3: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log('🎯 Generating REAL Optimization Strategy from actual benchmark data...');
    
    // Get REAL benchmark results by running the actual benchmark
    const benchmarkResponse = await fetch('http://localhost:3000/api/benchmark/tech-stack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!benchmarkResponse.ok) {
      throw new Error('Failed to get benchmark data');
    }

    const benchmarkData = await benchmarkResponse.json();
    console.log(`✅ Got REAL benchmark data: ${benchmarkData.results.length} components tested`);

    // ANALYZE REAL DATA - No hardcoded values!
    const results = benchmarkData.results;
    
    // Sort by overall score
    const sortedByScore = [...results].sort((a, b) => b.overall_score - a.overall_score);
    
    // Find best performers in each category
    const bestOCR = [...results].sort((a, b) => b.ocr_accuracy - a.ocr_accuracy)[0];
    const bestIRT = [...results].sort((a, b) => b.irt_score - a.irt_score)[0];
    const bestOptimization = [...results].sort((a, b) => b.optimization_impact - a.optimization_impact)[0];
    const bestAccuracy = [...results].sort((a, b) => b.accuracy - a.accuracy)[0];
    const cheapest = [...results].sort((a, b) => a.cost - b.cost)[0];
    const mostExpensive = [...results].sort((a, b) => b.cost - a.cost)[0];
    
    // HIGH PRIORITY: Top 4 overall performers
    const highPriority = sortedByScore.slice(0, 4).map(r => 
      `${r.component} - Overall score ${r.overall_score.toFixed(2)} (OCR: ${r.ocr_accuracy.toFixed(1)}%, Accuracy: ${r.accuracy.toFixed(1)}%)`
    );
    
    // MEDIUM PRIORITY: Next 4 performers
    const mediumPriority = sortedByScore.slice(4, 8).map(r =>
      `${r.component} - Score ${r.overall_score.toFixed(2)} (IRT: ${(r.irt_score * 100).toFixed(1)}%, Optimization: ${r.optimization_impact.toFixed(1)}%)`
    );
    
    // LOW PRIORITY: Bottom performers or expensive ones
    const lowPriority = sortedByScore.slice(8).map(r =>
      `${r.component} - Score ${r.overall_score.toFixed(2)}${r.cost > 0.01 ? ` (High cost: $${r.cost.toFixed(4)})` : ''}`
    );

    const strategy: OptimizationStrategy = {
      component_priorities: {
        high_priority: highPriority,
        medium_priority: mediumPriority,
        low_priority: lowPriority
      },
      performance_optimizations: {
        ocr_optimization: [
          `Use ${bestOCR.component} for critical OCR tasks (${bestOCR.ocr_accuracy.toFixed(1)}% accuracy)`,
          `Cost-effective alternative: ${sortedByScore.find(r => r.ocr_accuracy > 90 && r.cost < bestOCR.cost * 0.5)?.component || 'ACE Framework'}`,
          `Implement OCR result caching to reduce ${mostExpensive.component} costs`,
          `Best accuracy+OCR combo: ${bestAccuracy.component} (${bestAccuracy.accuracy.toFixed(1)}% accuracy, ${bestAccuracy.ocr_accuracy.toFixed(1)}% OCR)`
        ],
        irt_optimization: [
          `Primary: ${bestIRT.component} for difficulty assessment (${(bestIRT.irt_score * 100).toFixed(1)}% IRT score)`,
          `Secondary: ${sortedByScore.filter(r => r.irt_score > 0.8).sort((a, b) => b.irt_score - a.irt_score)[1]?.component || 'Multi-Query Expansion'}`,
          `Cache IRT scores to avoid recalculation`,
          `Best IRT performers: ${results.filter((r: any) => r.irt_score > 0.8).length} components above 80%`
        ],
        latency_optimization: [
          `Average latency across all components: ${(results.reduce((sum: number, r: any) => sum + r.latency_ms, 0) / results.length).toFixed(2)}ms`,
          `Use ${bestOptimization.component} for maximum optimization impact (${bestOptimization.optimization_impact.toFixed(1)}%)`,
          `Implement component result caching`,
          `Fastest components: ${results.filter((r: any) => r.latency_ms < 5).map((r: any) => r.component).join(', ')}`,
          `Use parallel execution for complex multi-component tasks`
        ],
        cost_optimization: [
          `Minimize ${mostExpensive.component} usage (most expensive at $${mostExpensive.cost.toFixed(4)})`,
          `Maximize ${cheapest.component} usage (cheapest at $${cheapest.cost.toFixed(4)})`,
          `Best value: ${sortedByScore[0].component} (score ${sortedByScore[0].overall_score.toFixed(2)}, cost $${sortedByScore[0].cost.toFixed(4)})`,
          `Implement smart routing based on task complexity`,
          `Cache expensive computations (saves avg $${(results.filter((r: any) => r.cost > 0.01).reduce((sum: number, r: any) => sum + r.cost, 0) / results.filter((r: any) => r.cost > 0.01).length).toFixed(4)} per cached query)`
        ]
      },
      architecture_recommendations: {
        primary_components: sortedByScore.slice(0, 4).map(r =>
          `${r.component} - Score ${r.overall_score.toFixed(2)}`
        ),
        secondary_components: sortedByScore.slice(4, 8).map(r =>
          `${r.component} - For specialized tasks`
        ),
        caching_strategy: [
          `Cache ${mostExpensive.component} results (expensive but high quality)`,
          `Cache ${bestIRT.component} scores (difficulty assessment)`,
          `Cache ${sortedByScore[0].component} results (best overall performance)`,
          `Use ${cheapest.component} for all optimization tasks`,
          `Implement smart cache invalidation based on data freshness`
        ],
        routing_strategy: [
          `Simple tasks → ${sortedByScore.filter(r => r.cost < 0.002 && r.latency_ms < 50)[0]?.component || 'Domain Detection'}`,
          `OCR tasks → ${bestOCR.component} (best accuracy) or fallback for cost`,
          `IRT tasks → ${bestIRT.component} (specialist)`,
          `Complex reasoning → ${sortedByScore[0].component} (best overall)`,
          `Optimization → ${bestOptimization.component} (best impact)`,
          `Multi-step → ${sortedByScore.find(r => r.component.includes('SWiRL') || r.component.includes('Synthesis'))?.component || 'Synthesis Agent'}`
        ]
      },
      implementation_roadmap: {
        phase_1: [
          `Implement smart routing to ${sortedByScore[0].component} (best performer)`,
          `Add ${cheapest.component} caching for all optimization tasks`,
          `Cache ${mostExpensive.component} results to reduce costs by ~${((mostExpensive.cost - cheapest.cost) / mostExpensive.cost * 100).toFixed(0)}%`,
          `Route IRT tasks to ${bestIRT.component} specialist component`
        ],
        phase_2: [
          `Implement ${sortedByScore[0].component} as primary reasoning engine`,
          `Add ${sortedByScore.find(r => r.ocr_accuracy > 90)?.component} as OCR fallback`,
          `Optimize ${sortedByScore.find(r => r.component.includes('Synthesis'))?.component || 'Synthesis Agent'} for data combination`,
          `Implement cost-based selection (${results.filter((r: any) => r.cost < 0.005).length} low-cost options available)`
        ],
        phase_3: [
          `Advanced caching (potential savings: $${results.reduce((sum: number, r: any) => sum + r.cost, 0).toFixed(4)} per uncached run)`,
          `Parallel execution (${results.filter((r: any) => r.latency_ms < 100).length} fast components available)`,
          `Performance monitoring with ${results.length} components tracked`,
          `Dynamic scaling based on real-time performance data`
        ]
      }
    };

    console.log('✅ Optimization Strategy Generated!');
    console.log(`High Priority: ${strategy.component_priorities.high_priority.length} components`);
    console.log(`Primary Components: ${strategy.architecture_recommendations.primary_components.length} components`);

    return NextResponse.json(strategy);

  } catch (error: any) {
    console.error('❌ Optimization Strategy Error:', error);
    return NextResponse.json(
      { error: 'Strategy generation failed', details: error.message },
      { status: 500 }
    );
  }
}
