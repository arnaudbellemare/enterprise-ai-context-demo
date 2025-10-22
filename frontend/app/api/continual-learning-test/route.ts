/**
 * Continual Learning Test API
 * 
 * Tests the integration of continual learning with sparse memory updates
 * based on insights from "Continual Learning via Sparse Memory Finetuning"
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContinualLearningSystem } from '@/lib/continual-learning-integration';
import { ACEReasoningBank } from '@/lib/ace-reasoningbank';
import { ACE } from '@/lib/ace';

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      response, 
      domain = 'general',
      testType = 'single'
    } = await req.json();

    if (!query || !response) {
      return NextResponse.json({
        error: 'Query and response are required'
      }, { status: 400 });
    }

    // Initialize continual learning system
    const ace = new ACE();
    const reasoningBank = new ACEReasoningBank(ace);
    const continualLearning = new ContinualLearningSystem(reasoningBank, ace, {
      max_memory_slots: 1000,
      active_slots_per_query: 32,
      tf_idf_threshold: 0.1,
      learning_rate: 2.0,
      update_frequency: 10,
      forgetting_threshold: 0.3
    });

    if (testType === 'single') {
      // Single experience learning
      const experience = {
        task: query,
        trajectory: {
          query,
          response,
          domain
        },
        result: {
          response,
          domain,
          timestamp: new Date().toISOString()
        },
        feedback: {
          success: true,
          metrics: {
            accuracy: 0.8,
            latency: 100,
            cost: 0.01
          }
        },
        timestamp: new Date()
      };

      await continualLearning.learnFromExperience(experience);
      const stats = continualLearning.getStats();

      return NextResponse.json({
        success: true,
        experience: {
          task: experience.task,
          success: experience.feedback.success,
          metrics: experience.feedback.metrics
        },
        continualLearning: {
          totalSlots: stats.total_slots,
          activeSlots: stats.active_slots,
          memoryEfficiency: stats.memory_efficiency,
          forgettingRate: stats.forgetting_rate,
          learningRate: stats.learning_rate
        },
        metadata: {
          sparseUpdates: true,
          tfIdfRanking: true,
          sgdOptimization: true,
          timestamp: new Date().toISOString()
        }
      });
    } else if (testType === 'stream') {
      // Stream of experiences (simulating continual learning)
      const experiences = [
        {
          task: "What are the benefits of TypeScript?",
          response: "TypeScript provides static type checking, better IDE support, improved code maintainability, and helps catch errors at compile time.",
          domain: "technology"
        },
        {
          task: "How does React work?",
          response: "React is a JavaScript library for building user interfaces using a component-based architecture with virtual DOM for efficient updates.",
          domain: "technology"
        },
        {
          task: "What is machine learning?",
          response: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.",
          domain: "technology"
        }
      ];

      const results = [];
      for (const exp of experiences) {
        const experience = {
          task: exp.task,
          trajectory: {
            query: exp.task,
            response: exp.response,
            domain: exp.domain
          },
          result: {
            response: exp.response,
            domain: exp.domain,
            timestamp: new Date().toISOString()
          },
          feedback: {
            success: true,
            metrics: {
              accuracy: 0.8 + Math.random() * 0.2,
              latency: 100 + Math.random() * 50,
              cost: 0.01 + Math.random() * 0.005
            }
          },
          timestamp: new Date()
        };

        await continualLearning.learnFromExperience(experience);
        const stats = continualLearning.getStats();
        
        results.push({
          experience: exp.task,
          stats: {
            totalSlots: stats.total_slots,
            activeSlots: stats.active_slots,
            memoryEfficiency: stats.memory_efficiency,
            forgettingRate: stats.forgetting_rate
          }
        });
      }

      const finalStats = continualLearning.getStats();

      return NextResponse.json({
        success: true,
        streamResults: results,
        finalStats: {
          totalSlots: finalStats.total_slots,
          activeSlots: finalStats.active_slots,
          averageAccessCount: finalStats.average_access_count,
          memoryEfficiency: finalStats.memory_efficiency,
          forgettingRate: finalStats.forgetting_rate,
          learningRate: finalStats.learning_rate
        },
        metadata: {
          continualLearningEnabled: true,
          sparseMemoryUpdates: true,
          tfIdfRanking: true,
          sgdOptimization: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        error: 'Invalid testType. Use "single" or "stream"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Continual learning test failed:', error);
    return NextResponse.json({
      error: 'Continual learning test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Continual Learning Test API',
    description: 'Tests continual learning with sparse memory updates based on "Continual Learning via Sparse Memory Finetuning"',
    endpoints: {
      'POST /api/continual-learning-test': {
        description: 'Test continual learning system',
        parameters: {
          query: 'string (required) - The input query',
          response: 'string (required) - The AI response to learn from',
          domain: 'string (optional) - Domain for learning (default: general)',
          testType: 'string (optional) - Test type: "single" or "stream" (default: single)'
        },
        examples: {
          single: {
            query: "What are the benefits of TypeScript?",
            response: "TypeScript provides static type checking, better IDE support, improved code maintainability, and helps catch errors at compile time.",
            domain: "technology"
          },
          stream: {
            testType: "stream"
          }
        }
      }
    },
    features: [
      'Sparse memory updates (only relevant memory slots updated)',
      'TF-IDF ranking for slot selection',
      'SGD optimization for continual learning',
      'Memory slot pruning to prevent bloat',
      'Integration with ACE + ReasoningBank',
      'Performance tracking and statistics'
    ],
    insights: {
      paper: 'Continual Learning via Sparse Memory Finetuning',
      keyFindings: [
        'Memory layers enable sparse updates (0.03%-0.0002% of parameters)',
        'TF-IDF ranking identifies relevant memory slots',
        'SGD optimizer works better than Adam for continual learning',
        'Memory slots align with entity boundaries',
        '11% forgetting vs 89% with full finetuning, 71% with LoRA'
      ]
    }
  });
}
