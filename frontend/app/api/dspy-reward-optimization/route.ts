import { NextRequest, NextResponse } from 'next/server';
import { DSPyRewardOptimizer, createRewardOptimizer } from '@/lib/dspy-reward-optimization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DSPy Reward-Based Optimization API
 * 
 * Implements reward-based optimization for open-ended tasks without requiring
 * labeled training data. Based on "Reasoning-Intensive Regression" paper.
 */

export async function POST(request: NextRequest) {
  try {
    const { taskType, basePrompt, maxIterations = 3, context } = await request.json();

    if (!taskType || !basePrompt) {
      return NextResponse.json(
        { error: 'taskType and basePrompt are required' },
        { status: 400 }
      );
    }

    // Accept any task type for maximum flexibility
    const validTaskTypes = ['summarization', 'presentation', 'creative', 'analysis', 'research', 'writing', 'coding', 'reasoning', 'problem-solving', 'decision-making'];
    if (!validTaskTypes.includes(taskType)) {
      console.log(`⚠️ Unknown task type: ${taskType}, using 'analysis' as default`);
    }

    console.log(`🎯 DSPy Reward Optimization - Task: ${taskType}`);
    console.log(`   Base Prompt: ${basePrompt.substring(0, 100)}...`);
    console.log(`   Max Iterations: ${maxIterations}`);

    // Create reward optimizer
    const optimizer = createRewardOptimizer(taskType);

    // Optimize the prompt
    const result = await optimizer.optimizePrompt(basePrompt, taskType, maxIterations);

    console.log(`   ✅ Optimization completed`);
    console.log(`   📈 Improvement: ${result.improvement_percentage.toFixed(1)}%`);
    console.log(`   🏆 Best Reward: ${(result.best_performance.overall_score * 100).toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      result: {
        optimized_prompt: result.optimized_prompt,
        improvement_percentage: result.improvement_percentage,
        best_reward_score: result.best_performance.overall_score,
        reward_history: result.reward_scores,
        iterations_completed: result.iterations,
        best_performance: result.best_performance,
        optimization_stats: optimizer.getOptimizationStats()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('DSPy Reward Optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Reward optimization failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      description: 'DSPy Reward-Based Optimization API',
      supported_task_types: [
        {
          type: 'summarization',
          description: 'Text summarization with reward-based optimization',
          reward_dimensions: ['coherence', 'completeness', 'conciseness', 'readability', 'factual_accuracy']
        },
        {
          type: 'presentation',
          description: 'Presentation generation with reward-based optimization',
          reward_dimensions: ['structure', 'engagement', 'clarity', 'visual_appeal', 'persuasiveness']
        },
        {
          type: 'creative',
          description: 'Creative writing with reward-based optimization',
          reward_dimensions: ['originality', 'creativity', 'coherence', 'emotional_impact', 'technical_quality']
        }
      ],
      paper_reference: 'https://arxiv.org/pdf/2508.21762',
      methodology: 'Reasoning-Intensive Regression with LLM-as-a-Judge',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('DSPy Reward Optimization info error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get API info' },
      { status: 500 }
    );
  }
}
