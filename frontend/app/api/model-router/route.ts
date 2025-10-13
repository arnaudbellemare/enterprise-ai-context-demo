/**
 * SMART MODEL ROUTER API
 * Automatically select best model for task
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { task, context, options } = await req.json();
    
    if (!task) {
      return NextResponse.json(
        { error: 'Missing task' },
        { status: 400 }
      );
    }
    
    console.log(`[Model Router] Routing task: ${task.substring(0, 100)}...`);
    
    // Detect requirements
    const requirements = detectRequirements(task, context);
    
    // Select best model
    const model = selectModel(requirements);
    
    // Estimate cost
    const estimatedCost = estimateCost(task, model);
    
    // Estimate quality
    const estimatedQuality = estimateQuality(requirements, model);
    
    // Explain selection
    const reason = explainSelection(requirements, model);
    
    const selection = {
      model: model,
      reason: reason,
      estimatedCost: estimatedCost,
      estimatedQuality: estimatedQuality,
      requirements: requirements
    };
    
    console.log(`[Model Router] Selected: ${model} (${reason})`);
    console.log(`[Model Router] Estimated cost: $${estimatedCost.toFixed(6)}, Quality: ${estimatedQuality.toFixed(2)}`);
    
    return NextResponse.json(selection);
    
  } catch (error) {
    console.error('[Model Router] Error:', error);
    return NextResponse.json(
      { error: 'Model routing failed' },
      { status: 500 }
    );
  }
}

function detectRequirements(task: string, context?: string) {
  const fullText = (task + ' ' + (context || '')).toLowerCase();
  
  const needsVision = 
    fullText.includes('image') ||
    fullText.includes('video') ||
    fullText.includes('chart') ||
    fullText.includes('diagram') ||
    fullText.includes('visual');
  
  const needsWeb =
    fullText.includes('search') ||
    fullText.includes('latest') ||
    fullText.includes('current') ||
    fullText.includes('trends');
  
  const complexity = detectComplexity(task);
  
  return {
    needsVision,
    needsWeb,
    complexity,
    costBudget: 'cheap'
  };
}

function detectComplexity(task: string): 'easy' | 'medium' | 'hard' | 'very_hard' {
  const lowerTask = task.toLowerCase();
  
  if (lowerTask.includes('complex') || lowerTask.includes('sophisticated')) {
    return 'very_hard';
  }
  
  if (lowerTask.includes('analyze') || lowerTask.includes('evaluate')) {
    return 'hard';
  }
  
  if (lowerTask.includes('summarize') || lowerTask.includes('extract')) {
    return 'medium';
  }
  
  return 'easy';
}

function selectModel(requirements: any): string {
  if (requirements.needsVision) {
    return 'gemini-2.0-flash';
  }
  
  if (requirements.needsWeb) {
    return 'perplexity';
  }
  
  if (requirements.complexity === 'very_hard') {
    return 'claude-sonnet-4';
  }
  
  if (requirements.complexity === 'hard') {
    return 'gpt-4o-mini';
  }
  
  return 'ollama/gemma3:4b';
}

function estimateCost(task: string, model: string): number {
  const costs: Record<string, number> = {
    'ollama/gemma3:4b': 0,
    'perplexity': 0.001,
    'gemini-2.0-flash': 0.002,
    'gpt-4o-mini': 0.150,
    'claude-sonnet-4': 3.000
  };
  
  const estimatedTokens = (task.length * 4) + 500;
  return (estimatedTokens / 1000000) * (costs[model] || 0);
}

function estimateQuality(requirements: any, model: string): number {
  let quality = 0.7;
  
  if (requirements.needsVision && model === 'gemini-2.0-flash') quality += 0.2;
  if (requirements.needsWeb && model === 'perplexity') quality += 0.2;
  if (requirements.complexity === 'very_hard' && model === 'claude-sonnet-4') quality += 0.3;
  
  return Math.min(quality, 1.0);
}

function explainSelection(requirements: any, model: string): string {
  if (requirements.needsVision) {
    return 'Task requires vision capabilities';
  }
  
  if (requirements.needsWeb) {
    return 'Task requires web/real-time data';
  }
  
  if (requirements.complexity === 'very_hard') {
    return 'Very challenging task requires best reasoning model';
  }
  
  if (requirements.complexity === 'hard') {
    return 'Challenging task requires good reasoning model';
  }
  
  return 'Straightforward task - using free local model';
}
