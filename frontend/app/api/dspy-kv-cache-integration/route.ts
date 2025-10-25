/**
 * DSPy-KV Cache Integration API for Enhanced Continual Learning
 * 
 * Features:
 * - Domain-specific knowledge retention
 * - Sparse updates during optimization
 * - TF-IDF scoring for importance
 * - Prevents catastrophic forgetting
 * - Enhanced optimization with retained knowledge
 */

import { NextRequest, NextResponse } from 'next/server';
import { dspyKVCacheIntegration } from '../../../lib/dspy-kv-cache-integration';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action,
      signature, 
      trainingData, 
      hints = [], 
      customMetrics = [],
      domain = 'general',
      userContext = {},
      optimizationConfig = {
        maxGenerations: 10,
        populationSize: 20,
        mutationRate: 0.1,
        feedbackFrequency: 2
      }
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log('🧠 DSPy-KV Cache Integration request:', {
      action,
      domain,
      signature: signature?.name,
      hintsCount: hints.length,
      customMetricsCount: customMetrics.length
    });

    switch (action) {
      case 'optimize':
        if (!signature) {
          return NextResponse.json(
            { error: 'Signature is required for optimization' },
            { status: 400 }
          );
        }

        const optimizationRequest = {
          signature,
          trainingData: trainingData || [],
          hints,
          customMetrics,
          optimizationConfig,
          domain,
          userContext,
          knowledgeRetention: true,
          sparseUpdates: true
        };

        const result = await dspyKVCacheIntegration.optimizeWithKVCache(optimizationRequest);

        return NextResponse.json({
          success: true,
          data: {
            optimizedSignature: result.optimizedSignature,
            feedback: result.feedback,
            metrics: result.metrics,
            suggestions: result.suggestions,
            kvCacheStats: result.kvCacheStats,
            learningEfficiency: result.learningEfficiency,
            forgettingRate: result.forgettingRate,
            domain,
            userContext
          }
        });

      case 'stats':
        const stats = dspyKVCacheIntegration.getComprehensiveStats(domain);

        return NextResponse.json({
          success: true,
          data: {
            stats,
            domain: domain || 'all',
            description: {
              dspyKVCacheIntegration: 'Enhanced DSPy optimization with KV cache for continual learning',
              features: [
                'Domain-specific knowledge retention',
                'Sparse updates during optimization',
                'TF-IDF scoring for importance',
                'Prevents catastrophic forgetting',
                'Enhanced optimization with retained knowledge'
              ],
              performance: {
                learningEfficiency: stats.performance.learningEfficiency,
                forgettingRate: stats.performance.forgettingRate,
                knowledgeRetention: stats.performance.knowledgeRetention
              }
            }
          }
        });

      case 'clear':
        if (!domain) {
          return NextResponse.json(
            { error: 'Domain is required for clearing knowledge' },
            { status: 400 }
          );
        }

        dspyKVCacheIntegration.clearDomainKnowledge(domain);

        return NextResponse.json({
          success: true,
          data: {
            message: `Domain knowledge cleared for: ${domain}`,
            domain
          }
        });

      case 'export':
        const exportData = dspyKVCacheIntegration.exportDomainKnowledge();

        return NextResponse.json({
          success: true,
          data: {
            exportData,
            timestamp: new Date().toISOString(),
            description: 'Complete domain knowledge export for backup'
          }
        });

      case 'import':
        if (!body.importData) {
          return NextResponse.json(
            { error: 'Import data is required' },
            { status: 400 }
          );
        }

        dspyKVCacheIntegration.importDomainKnowledge(body.importData);

        return NextResponse.json({
          success: true,
          data: {
            message: 'Domain knowledge imported successfully',
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: optimize, stats, clear, export, import' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ DSPy-KV Cache Integration error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'DSPy-KV Cache operation failed',
      data: null
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const domain = searchParams.get('domain');

    if (action === 'stats') {
      const stats = dspyKVCacheIntegration.getComprehensiveStats(domain || undefined);

      return NextResponse.json({
        success: true,
        data: {
          stats,
          domain: domain || 'all',
          description: {
            dspyKVCacheIntegration: 'Enhanced DSPy optimization with KV cache for continual learning',
            features: [
              'Domain-specific knowledge retention',
              'Sparse updates during optimization',
              'TF-IDF scoring for importance',
              'Prevents catastrophic forgetting',
              'Enhanced optimization with retained knowledge'
            ],
            performance: {
              learningEfficiency: stats.performance.learningEfficiency,
              forgettingRate: stats.performance.forgettingRate,
              knowledgeRetention: stats.performance.knowledgeRetention
            }
          }
        }
      });
    }

    if (action === 'examples') {
      return NextResponse.json({
        success: true,
        data: {
          exampleOptimize: {
            action: 'optimize',
            signature: {
              name: 'ArtValuationExpert',
              input: 'artwork_data, market_context, purpose',
              output: 'valuation, confidence, reasoning, recommendations',
              instructions: 'Analyze artwork and provide comprehensive valuation'
            },
            domain: 'art',
            hints: [
              {
                type: 'focus',
                content: 'Focus on USPAP compliance and detailed market analysis',
                weight: 0.9
              }
            ],
            customMetrics: [
              {
                name: 'uspap_compliance',
                weight: 0.4,
                evaluator: 'function(output, expected) { return 0.8; }'
              }
            ],
            userContext: {
              userId: 'art_collector_001',
              preferences: {
                riskTolerance: 'conservative',
                expertise: 'intermediate'
              }
            }
          },
          exampleStats: {
            action: 'stats',
            domain: 'art'
          },
          domains: ['art', 'legal', 'insurance', 'business', 'general'],
          description: {
            dspyKVCacheIntegration: 'Enhanced DSPy optimization with KV cache for continual learning',
            useCases: [
              'Domain-specific optimization with knowledge retention',
              'User personalization with continual learning',
              'Prevent catastrophic forgetting during optimization',
              'Efficient sparse updates for hardware efficiency',
              'Enhanced optimization with retained domain knowledge'
            ]
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'DSPy-KV Cache Integration API',
        endpoints: {
          'POST /': 'Perform DSPy-KV Cache operations (optimize, stats, clear, export, import)',
          'GET ?action=stats': 'Get comprehensive statistics',
          'GET ?action=examples': 'Get usage examples'
        },
        actions: {
          optimize: 'Enhanced DSPy optimization with KV cache integration',
          stats: 'Get comprehensive statistics including learning efficiency',
          clear: 'Clear domain knowledge',
          export: 'Export domain knowledge for backup',
          import: 'Import domain knowledge from backup'
        }
      }
    });

  } catch (error) {
    console.error('❌ DSPy-KV Cache Integration GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Request failed'
    }, { status: 500 });
  }
}
