/**
 * Enhanced DSPy Optimization API with Hints and Custom Metrics
 * 
 * Features:
 * - Pass hints to focus DSPy output
 * - Custom metrics for GEPA/SIMBA feedback
 * - Real-time optimization feedback
 * - Domain-specific optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { dspyEnhancedOptimizer, OptimizationRequest, OptimizationHint, CustomMetric } from '../../../../lib/dspy-enhanced-optimization';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      signature, 
      trainingData, 
      hints = [], 
      customMetrics = [],
      optimizationConfig = {
        maxGenerations: 10,
        populationSize: 20,
        mutationRate: 0.1,
        feedbackFrequency: 2
      }
    } = body;

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Enhanced DSPy optimization request:', {
      signature: signature.name,
      hintsCount: hints.length,
      customMetricsCount: customMetrics.length,
      trainingDataSize: trainingData?.length || 0
    });

    // Create optimization request
    const optimizationRequest: OptimizationRequest = {
      signature,
      trainingData: trainingData || [],
      hints: hints.map((hint: any) => ({
        id: hint.id || `hint_${Date.now()}_${Math.random()}`,
        type: hint.type || 'focus',
        content: hint.content,
        weight: hint.weight || 0.5,
        domain: hint.domain
      })),
      customMetrics: customMetrics.map((metric: any) => ({
        name: metric.name,
        description: metric.description,
        evaluator: metric.evaluator || ((output: any, expected: any) => 0.8), // Default evaluator
        weight: metric.weight || 0.3
      })),
      optimizationConfig
    };

    // Run optimization
    const result = await dspyEnhancedOptimizer.optimizeWithHints(optimizationRequest);

    console.log('✅ Enhanced DSPy optimization completed:', {
      bestScore: result.metrics.accuracy || 0,
      feedbackCount: result.feedback.length,
      suggestionsCount: result.suggestions.length
    });

    return NextResponse.json({
      success: true,
      data: {
        optimizedSignature: result.optimizedSignature,
        feedback: result.feedback,
        metrics: result.metrics,
        suggestions: result.suggestions,
        optimizationStats: dspyEnhancedOptimizer.getPopulationStats(),
        history: dspyEnhancedOptimizer.getOptimizationHistory()
      }
    });

  } catch (error) {
    console.error('❌ Enhanced DSPy optimization error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Optimization failed',
      data: null
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = dspyEnhancedOptimizer.getPopulationStats();
      const history = dspyEnhancedOptimizer.getOptimizationHistory();
      
      return NextResponse.json({
        success: true,
        data: {
          stats,
          history: history.slice(-10), // Last 10 feedback cycles
          description: {
            enhancedOptimization: 'DSPy optimization with hints and custom metrics',
            features: [
              'Pass hints to focus DSPy output',
              'Custom metrics for GEPA/SIMBA feedback',
              'Real-time optimization feedback',
              'Domain-specific optimization'
            ]
          }
        }
      });
    }

    if (action === 'examples') {
      return NextResponse.json({
        success: true,
        data: {
          exampleHints: [
            {
              id: 'focus_accuracy',
              type: 'focus',
              content: 'Focus on providing accurate valuations with detailed reasoning',
              weight: 0.8,
              domain: 'art'
            },
            {
              id: 'constraint_format',
              type: 'constraint',
              content: 'Output must be in JSON format with specific fields',
              weight: 0.9,
              domain: 'general'
            },
            {
              id: 'preference_style',
              type: 'preference',
              content: 'Use professional, technical language appropriate for insurance appraisals',
              weight: 0.7,
              domain: 'insurance'
            }
          ],
          exampleCustomMetrics: [
            {
              name: 'accuracy',
              description: 'How accurate are the outputs compared to expected results',
              weight: 0.4
            },
            {
              name: 'completeness',
              description: 'How complete are the responses (all required fields present)',
              weight: 0.3
            },
            {
              name: 'domain_relevance',
              description: 'How relevant are the outputs to the specific domain',
              weight: 0.3
            }
          ],
          exampleSignature: {
            name: 'ArtValuationExpert',
            input: 'artwork_data, market_context',
            output: 'valuation, confidence, reasoning, recommendations',
            instructions: 'Analyze artwork and provide comprehensive valuation',
            examples: [
              {
                input: { artist: 'Picasso', medium: 'Oil on Canvas', year: '1937' },
                output: { valuation: 5000000, confidence: 0.95, reasoning: 'Master artist, significant period' }
              }
            ]
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Enhanced DSPy Optimization API',
        endpoints: {
          'POST /': 'Run optimization with hints and custom metrics',
          'GET ?action=stats': 'Get optimization statistics',
          'GET ?action=examples': 'Get example hints, metrics, and signatures'
        }
      }
    });

  } catch (error) {
    console.error('❌ Enhanced DSPy optimization GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Request failed'
    }, { status: 500 });
  }
}
