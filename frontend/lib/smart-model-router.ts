/**
 * SMART MODEL ROUTER (Inspired by Mix SDK)
 * 
 * Multi-model routing for cost AND quality optimization
 * - Use cheap models (Ollama) for easy tasks
 * - Use expensive models (Claude) for hard tasks
 * - Use specialized models (Gemini) for vision tasks
 * - Use web-connected models (Perplexity) for research
 */

export interface ModelCapabilities {
  name: string;
  cost: number;  // Per 1M tokens
  capabilities: {
    vision: boolean;
    web: boolean;
    reasoning: 'basic' | 'good' | 'excellent';
    speed: 'slow' | 'medium' | 'fast';
  };
  bestFor: string[];
}

export interface TaskRequirements {
  needsVision: boolean;
  needsWeb: boolean;
  complexity: 'easy' | 'medium' | 'hard' | 'very_hard';
  costBudget?: 'free' | 'cheap' | 'medium' | 'expensive';
  speedRequirement?: 'fast' | 'balanced' | 'quality';
}

export interface ModelSelection {
  model: string;
  reason: string;
  estimatedCost: number;
  estimatedQuality: number;
}

/**
 * SmartModelRouter - Automatic model selection
 * 
 * Models available:
 * 1. Ollama (gemma3:4b) - Free, fast, local
 * 2. Perplexity - Web-connected, research
 * 3. Gemini 2.0 Flash - Vision, multimodal
 * 4. GPT-4o-mini - Good reasoning, affordable
 * 5. Claude Sonnet 4 - Best reasoning, expensive
 */
export class SmartModelRouter {
  private models: Record<string, ModelCapabilities> = {
    'ollama/gemma3:4b': {
      name: 'Ollama Gemma 3 4B',
      cost: 0,  // FREE!
      capabilities: {
        vision: false,
        web: false,
        reasoning: 'good',
        speed: 'fast'
      },
      bestFor: ['easy tasks', 'simple extraction', 'formatting', 'basic analysis']
    },
    
    'perplexity': {
      name: 'Perplexity',
      cost: 0.001,  // $1 per 1M tokens
      capabilities: {
        vision: false,
        web: true,
        reasoning: 'excellent',
        speed: 'medium'
      },
      bestFor: ['web search', 'real-time data', 'research', 'current events']
    },
    
    'gemini-2.0-flash': {
      name: 'Gemini 2.0 Flash',
      cost: 0.002,  // $2 per 1M tokens
      capabilities: {
        vision: true,
        web: false,
        reasoning: 'good',
        speed: 'fast'
      },
      bestFor: ['image analysis', 'video analysis', 'chart reading', 'diagram understanding']
    },
    
    'gpt-4o-mini': {
      name: 'GPT-4o Mini',
      cost: 0.150,  // $150 per 1M tokens
      capabilities: {
        vision: false,
        web: false,
        reasoning: 'excellent',
        speed: 'fast'
      },
      bestFor: ['complex reasoning', 'hard problems', 'analysis', 'synthesis']
    },
    
    'claude-sonnet-4': {
      name: 'Claude Sonnet 4',
      cost: 3.000,  // $3,000 per 1M tokens
      capabilities: {
        vision: false,
        web: false,
        reasoning: 'excellent',
        speed: 'medium'
      },
      bestFor: ['very hard problems', 'complex reasoning', 'edge cases', 'sophisticated analysis']
    }
  };
  
  /**
   * Route task to optimal model
   */
  async routeTask(
    task: string,
    context?: string
  ): Promise<ModelSelection> {
    // Detect requirements
    const requirements = await this.detectRequirements(task, context);
    
    // Select best model
    const model = this.selectModel(requirements);
    
    // Estimate cost
    const estimatedCost = this.estimateCost(task, model);
    
    // Estimate quality
    const estimatedQuality = this.estimateQuality(requirements, model);
    
    return {
      model: model,
      reason: this.explainSelection(requirements, model),
      estimatedCost: estimatedCost,
      estimatedQuality: estimatedQuality
    };
  }
  
  /**
   * Detect task requirements
   */
  private async detectRequirements(
    task: string,
    context?: string
  ): Promise<TaskRequirements> {
    const lowerTask = task.toLowerCase();
    const fullText = (task + ' ' + (context || '')).toLowerCase();
    
    // Detect if needs vision
    const needsVision = 
      fullText.includes('image') ||
      fullText.includes('video') ||
      fullText.includes('chart') ||
      fullText.includes('diagram') ||
      fullText.includes('screenshot') ||
      fullText.includes('visual') ||
      fullText.includes('photo') ||
      fullText.includes('picture');
    
    // Detect if needs web
    const needsWeb =
      fullText.includes('search') ||
      fullText.includes('latest') ||
      fullText.includes('current') ||
      fullText.includes('recent') ||
      fullText.includes('news') ||
      fullText.includes('trends') ||
      fullText.includes('real-time');
    
    // Detect complexity (use your IRT system!)
    const complexity = this.detectComplexity(task);
    
    return {
      needsVision: needsVision,
      needsWeb: needsWeb,
      complexity: complexity,
      costBudget: 'cheap',  // Default to cheap
      speedRequirement: 'balanced'
    };
  }
  
  /**
   * Select model based on requirements
   */
  private selectModel(requirements: TaskRequirements): string {
    // Priority 1: Vision needs
    if (requirements.needsVision) {
      return 'gemini-2.0-flash';  // Only model with vision
    }
    
    // Priority 2: Web needs
    if (requirements.needsWeb) {
      return 'perplexity';  // Only model with web access
    }
    
    // Priority 3: Complexity
    if (requirements.complexity === 'very_hard') {
      // Very hard: Use best reasoning model (if budget allows)
      if (requirements.costBudget !== 'free') {
        return 'claude-sonnet-4';  // Best reasoning
      }
      return 'gpt-4o-mini';  // Good reasoning, cheaper
    }
    
    if (requirements.complexity === 'hard') {
      // Hard: Use good reasoning model
      if (requirements.costBudget === 'free') {
        return 'ollama/gemma3:4b';  // Free but decent
      }
      return 'gpt-4o-mini';  // Good balance
    }
    
    // Easy/Medium: Use free model
    return 'ollama/gemma3:4b';  // FREE!
  }
  
  /**
   * Detect complexity from task
   */
  private detectComplexity(task: string): TaskRequirements['complexity'] {
    const lowerTask = task.toLowerCase();
    
    // Very hard indicators
    const veryHardKeywords = [
      'complex derivatives', 'advanced algorithm', 'sophisticated analysis',
      'intricate', 'comprehensive evaluation', 'multi-step reasoning'
    ];
    
    if (veryHardKeywords.some(kw => lowerTask.includes(kw))) {
      return 'very_hard';
    }
    
    // Hard indicators
    const hardKeywords = [
      'analyze', 'complex', 'algorithm', 'optimize', 'sophisticated',
      'comprehensive', 'detailed', 'in-depth'
    ];
    
    if (hardKeywords.some(kw => lowerTask.includes(kw))) {
      return 'hard';
    }
    
    // Medium indicators
    const mediumKeywords = [
      'summarize', 'extract', 'identify', 'compare', 'evaluate'
    ];
    
    if (mediumKeywords.some(kw => lowerTask.includes(kw))) {
      return 'medium';
    }
    
    // Default: Easy
    return 'easy';
  }
  
  /**
   * Estimate cost
   */
  private estimateCost(task: string, model: string): number {
    const estimatedTokens = (task.length * 4) + 500;  // Input + output estimate
    const costPer1M = this.models[model]?.cost || 0;
    
    return (estimatedTokens / 1000000) * costPer1M;
  }
  
  /**
   * Estimate quality
   */
  private estimateQuality(
    requirements: TaskRequirements,
    model: string
  ): number {
    const modelCaps = this.models[model];
    
    if (!modelCaps) return 0.5;
    
    let quality = 0.7;  // Base quality
    
    // Check if model meets requirements
    if (requirements.needsVision && modelCaps.capabilities.vision) {
      quality += 0.2;
    }
    
    if (requirements.needsWeb && modelCaps.capabilities.web) {
      quality += 0.2;
    }
    
    // Reasoning match
    if (requirements.complexity === 'very_hard' && modelCaps.capabilities.reasoning === 'excellent') {
      quality += 0.3;
    } else if (requirements.complexity === 'hard' && modelCaps.capabilities.reasoning === 'good') {
      quality += 0.2;
    }
    
    return Math.min(quality, 1.0);
  }
  
  /**
   * Explain why model was selected
   */
  private explainSelection(
    requirements: TaskRequirements,
    model: string
  ): string {
    if (requirements.needsVision) {
      return `Selected ${model} because task requires vision capabilities`;
    }
    
    if (requirements.needsWeb) {
      return `Selected ${model} because task requires web/real-time data`;
    }
    
    if (requirements.complexity === 'very_hard') {
      return `Selected ${model} for superior reasoning on very challenging task`;
    }
    
    if (requirements.complexity === 'hard') {
      return `Selected ${model} for good reasoning on challenging task`;
    }
    
    return `Selected ${model} for cost-effectiveness on straightforward task`;
  }
  
  /**
   * Execute with auto-selected model
   */
  async executeWithBestModel(
    task: string,
    context?: string
  ): Promise<{
    result: any;
    modelUsed: string;
    cost: number;
    reason: string;
  }> {
    // Route to best model
    const selection = await this.routeTask(task, context);
    
    console.log(`[Model Router] ${selection.reason}`);
    console.log(`[Model Router] Estimated cost: $${selection.estimatedCost.toFixed(6)}`);
    
    // Execute with selected model
    const result = await this.executeWithModel(task, selection.model);
    
    return {
      result: result,
      modelUsed: selection.model,
      cost: selection.estimatedCost,
      reason: selection.reason
    };
  }
  
  /**
   * Execute with specific model
   */
  private async executeWithModel(task: string, model: string): Promise<any> {
    // Call appropriate API based on model
    if (model === 'ollama/gemma3:4b') {
      return await fetch('/api/ax-dspy/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, useRealGEPA: true })
      }).then(r => r.json());
    }
    
    if (model === 'perplexity') {
      return await fetch('/api/perplexity/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: task })
      }).then(r => r.json());
    }
    
    if (model === 'gemini-2.0-flash') {
      return await fetch('/api/multimodal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, model: 'gemini' })
      }).then(r => r.json());
    }
    
    // Fallback to DSPy
    return await fetch('/api/ax-dspy/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task })
    }).then(r => r.json());
  }
  
  /**
   * Get routing stats
   */
  async getRoutingStats(): Promise<{
    totalRequests: number;
    byModel: Record<string, number>;
    totalCost: number;
    avgCost: number;
    costSavings: number;
  }> {
    // In production: Track actual routing decisions
    return {
      totalRequests: 0,
      byModel: {},
      totalCost: 0,
      avgCost: 0,
      costSavings: 0
    };
  }
}

/**
 * Quick helper function
 */
export async function executeWithSmartRouting(
  task: string,
  context?: string
): Promise<any> {
  const router = new SmartModelRouter();
  const result = await router.executeWithBestModel(task, context);
  
  console.log(`[Smart Router] Used ${result.modelUsed} (cost: $${result.cost.toFixed(6)})`);
  
  return result.result;
}

/**
 * Model comparison utility
 */
export async function compareModels(
  task: string,
  models: string[]
): Promise<Array<{
  model: string;
  cost: number;
  quality: number;
  speed: number;
}>> {
  const router = new SmartModelRouter();
  
  // This would execute same task on different models
  // For cost/quality comparison
  
  return [];  // Implement when needed
}

