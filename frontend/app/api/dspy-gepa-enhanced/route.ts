/**
 * Enhanced DSPy-GEPA API Route
 * 
 * Based on: https://github.com/raja-patnaik/dspy-examples/tree/main/dspy-gepa-researcher
 * 
 * Features:
 * - Real DSPy integration with GEPA optimization
 * - Advanced prompt evolution for art valuation
 * - Multi-objective optimization
 * - Research-specific prompt patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { dspyGEPAEnhanced } from '../../../../lib/dspy-gepa-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body: {
      initialPrompts: string[];
      context: any;
      config?: any;
    } = await request.json();
    
    console.log('🧬 Enhanced DSPy-GEPA optimization starting...', {
      initialPrompts: body.initialPrompts.length,
      context: Object.keys(body.context || {}),
      config: body.config
    });

    // Run DSPy-GEPA optimization
    const optimizedPrompts = await dspyGEPAEnhanced.optimizePrompts(
      body.initialPrompts,
      body.context || {}
    );
    
    // Get optimization statistics
    const stats = dspyGEPAEnhanced.getOptimizationStats();
    
    // Export optimized prompts
    const exportedPrompts = dspyGEPAEnhanced.exportOptimizedPrompts();
    
    console.log('✅ Enhanced DSPy-GEPA optimization completed', {
      optimizedPrompts: optimizedPrompts.length,
      bestFitness: stats.bestPrompt.fitness,
      improvement: stats.improvement
    });

    return NextResponse.json({
      success: true,
      data: {
        optimizedPrompts,
        statistics: stats,
        exportedPrompts,
        description: {
          source: 'DSPy-GEPA Researcher Example',
          url: 'https://github.com/raja-patnaik/dspy-examples/tree/main/dspy-gepa-researcher',
          features: [
            'Real DSPy integration with GEPA optimization',
            'Advanced prompt evolution for art valuation',
            'Multi-objective optimization (accuracy, efficiency, clarity)',
            'Research-specific prompt patterns',
            'Academic-grade optimization',
            'Genetic algorithm-based prompt evolution',
            'Pareto optimization for multiple objectives',
            'Tournament selection and crossover',
            'Mutation and elite preservation',
            'Comprehensive evaluation metrics'
          ]
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Enhanced DSPy-GEPA optimization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Enhanced DSPy-GEPA optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'stats') {
      // Get current optimization statistics
      const stats = dspyGEPAEnhanced.getOptimizationStats();
      
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            bestFitness: stats.bestPrompt.fitness,
            averageFitness: stats.averageFitness,
            improvement: stats.improvement,
            generations: stats.generations,
            populationSize: stats.populationSize
          },
          bestPrompt: stats.bestPrompt,
          topPrompts: stats.topPrompts,
          objectiveStats: stats.objectiveStats,
          fitnessHistory: stats.fitnessHistory,
          description: {
            source: 'DSPy-GEPA Researcher Example',
            url: 'https://github.com/raja-patnaik/dspy-examples/tree/main/dspy-gepa-researcher',
            methodology: [
              'Genetic Algorithm-based prompt evolution',
              'Multi-objective optimization using Pareto fronts',
              'Tournament selection for parent selection',
              'Crossover and mutation operations',
              'Elite preservation strategy',
              'Comprehensive fitness evaluation',
              'Research-specific prompt patterns',
              'Academic-grade optimization techniques'
            ]
          }
        }
      });
    } else if (action === 'export') {
      // Export optimized prompts
      const exportedPrompts = dspyGEPAEnhanced.exportOptimizedPrompts();
      
      return NextResponse.json({
        success: true,
        data: {
          exportedPrompts,
          description: {
            source: 'DSPy-GEPA Researcher Example',
            url: 'https://github.com/raja-patnaik/dspy-examples/tree/main/dspy-gepa-researcher',
            usage: 'These optimized prompts can be used in production for enhanced art valuation'
          }
        }
      });
    } else {
      // Get general information
      return NextResponse.json({
        success: true,
        data: {
          description: {
            source: 'DSPy-GEPA Researcher Example',
            url: 'https://github.com/raja-patnaik/dspy-examples/tree/main/dspy-gepa-researcher',
            features: [
              'Real DSPy integration with GEPA optimization',
              'Advanced prompt evolution for art valuation',
              'Multi-objective optimization (accuracy, efficiency, clarity)',
              'Research-specific prompt patterns',
              'Academic-grade optimization',
              'Genetic algorithm-based prompt evolution',
              'Pareto optimization for multiple objectives',
              'Tournament selection and crossover',
              'Mutation and elite preservation',
              'Comprehensive evaluation metrics'
            ],
            endpoints: {
              'POST /api/dspy-gepa-enhanced': 'Run DSPy-GEPA optimization',
              'GET /api/dspy-gepa-enhanced?action=stats': 'Get optimization statistics',
              'GET /api/dspy-gepa-enhanced?action=export': 'Export optimized prompts'
            }
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Enhanced DSPy-GEPA request failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Enhanced DSPy-GEPA request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
