import { z } from 'zod';

// Model capabilities and characteristics
export interface ModelProfile {
  provider: string;
  model: string;
  avgLatencyMs: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  capabilities: {
    reasoning: 'low' | 'medium' | 'high' | 'very_high';
    speed: 'slow' | 'medium' | 'fast' | 'very_fast';
    contextWindow: number;
    maxOutput: number;
  };
  bestFor: string[];
}

// Available models in our system
export const MODEL_PROFILES: Record<string, ModelProfile> = {
  'gpt-4.1': {
    provider: 'openai',
    model: 'gpt-4.1',
    avgLatencyMs: 2000,
    costPer1kTokens: {
      input: 0.03,
      output: 0.06
    },
    capabilities: {
      reasoning: 'high',
      speed: 'fast',
      contextWindow: 128000,
      maxOutput: 4096
    },
    bestFor: ['chat', 'classification', 'extraction', 'general']
  },
  
  'gpt-5-mini': {
    provider: 'openai',
    model: 'gpt-5-mini',
    avgLatencyMs: 12000,
    costPer1kTokens: {
      input: 0.05,
      output: 0.15
    },
    capabilities: {
      reasoning: 'very_high',
      speed: 'slow',
      contextWindow: 128000,
      maxOutput: 16384
    },
    bestFor: ['reasoning', 'complex_analysis', 'debugging', 'planning']
  },
  
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    avgLatencyMs: 1200,
    costPer1kTokens: {
      input: 0.0015,
      output: 0.002
    },
    capabilities: {
      reasoning: 'medium',
      speed: 'very_fast',
      contextWindow: 16385,
      maxOutput: 4096
    },
    bestFor: ['simple_chat', 'quick_classification', 'basic_extraction']
  },
  
  'claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    avgLatencyMs: 2500,
    costPer1kTokens: {
      input: 0.003,
      output: 0.015
    },
    capabilities: {
      reasoning: 'high',
      speed: 'fast',
      contextWindow: 200000,
      maxOutput: 4096
    },
    bestFor: ['writing', 'analysis', 'creative']
  },
  
  'perplexity-online': {
    provider: 'perplexity',
    model: 'llama-3.1-sonar-small-128k-online',
    avgLatencyMs: 3000,
    costPer1kTokens: {
      input: 0.0002,
      output: 0.0002
    },
    capabilities: {
      reasoning: 'medium',
      speed: 'fast',
      contextWindow: 128000,
      maxOutput: 4096
    },
    bestFor: ['web_search', 'current_events', 'factual']
  }
};

// Task configuration
export const RouterConfigSchema = z.object({
  task: z.enum([
    'chat',
    'classification',
    'summarization',
    'extraction',
    'reasoning',
    'complex_analysis',
    'code_generation',
    'web_search',
    'creative_writing'
  ]),
  priority: z.enum(['cost', 'speed', 'quality', 'balanced']),
  maxLatencyMs: z.number().optional(),
  estimatedTokens: z.number().optional(),
  requiresStreaming: z.boolean().default(true),
  userWillWait: z.boolean().default(false)
});

export type RouterConfig = z.infer<typeof RouterConfigSchema>;

// Telemetry data
interface ModelTelemetry {
  modelKey: string;
  calls: number;
  avgLatency: number;
  successRate: number;
  avgCost: number;
  lastUsed: Date;
}

class ModelRouter {
  private telemetry: Map<string, ModelTelemetry> = new Map();
  
  /**
   * Select the optimal model based on task and constraints
   */
  selectModel(config: RouterConfig): string {
    const { task, priority, maxLatencyMs, userWillWait } = config;
    
    // Filter models by capability
    const candidateModels = Object.entries(MODEL_PROFILES).filter(([_, profile]) => {
      return profile.bestFor.includes(task);
    });
    
    if (candidateModels.length === 0) {
      // Fallback to general-purpose model
      return 'openai/gpt-4.1';
    }
    
    // Score each model based on priority
    const reasoningScores = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'very_high': 4
    };
    
    const scoredModels = candidateModels.map(([key, profile]) => {
      let score = 0;
      
      switch (priority) {
        case 'cost':
          // Lower cost = higher score
          score = 1 / ((profile.costPer1kTokens.input + profile.costPer1kTokens.output) / 2);
          break;
          
        case 'speed':
          // Lower latency = higher score
          score = 1 / profile.avgLatencyMs * 10000;
          // Bonus for fast models
          if (profile.capabilities.speed === 'very_fast') score *= 1.5;
          if (profile.capabilities.speed === 'fast') score *= 1.2;
          break;
          
        case 'quality':
          // Higher reasoning = higher score
          score = reasoningScores[profile.capabilities.reasoning];
          break;
          
        case 'balanced':
          // Balance all factors
          const costScore = 1 / ((profile.costPer1kTokens.input + profile.costPer1kTokens.output) / 2);
          const speedScore = 1 / profile.avgLatencyMs * 10000;
          const qualityScore = reasoningScores[profile.capabilities.reasoning];
          score = (costScore + speedScore + qualityScore) / 3;
          break;
      }
      
      // Apply constraints
      if (maxLatencyMs && profile.avgLatencyMs > maxLatencyMs) {
        score *= 0.5; // Penalize slow models if latency constraint
      }
      
      if (!userWillWait && profile.avgLatencyMs > 5000) {
        score *= 0.3; // Heavy penalty for slow models if user won't wait
      }
      
      // Apply telemetry bonus
      const telemetry = this.telemetry.get(key);
      if (telemetry && telemetry.successRate > 0.9) {
        score *= 1.1; // Bonus for reliable models
      }
      
      return { key, profile, score };
    });
    
    // Sort by score and return best
    scoredModels.sort((a, b) => b.score - a.score);
    const selected = scoredModels[0];
    
    console.log(`🎯 Selected model: ${selected.key} (score: ${selected.score.toFixed(2)})`);
    
    return `${selected.profile.provider}/${selected.profile.model}`;
  }
  
  /**
   * Log telemetry data for a model call
   */
  logCall(modelKey: string, latency: number, success: boolean, cost: number) {
    const current = this.telemetry.get(modelKey) || {
      modelKey,
      calls: 0,
      avgLatency: 0,
      successRate: 1,
      avgCost: 0,
      lastUsed: new Date()
    };
    
    // Update running averages
    const totalCalls = current.calls + 1;
    current.avgLatency = (current.avgLatency * current.calls + latency) / totalCalls;
    current.avgCost = (current.avgCost * current.calls + cost) / totalCalls;
    current.successRate = (current.successRate * current.calls + (success ? 1 : 0)) / totalCalls;
    current.calls = totalCalls;
    current.lastUsed = new Date();
    
    this.telemetry.set(modelKey, current);
  }
  
  /**
   * Get telemetry stats for visualization
   */
  getStats() {
    return Array.from(this.telemetry.values()).map(t => ({
      model: t.modelKey,
      calls: t.calls,
      avgLatency: Math.round(t.avgLatency),
      successRate: (t.successRate * 100).toFixed(1) + '%',
      avgCost: t.avgCost.toFixed(4),
      lastUsed: t.lastUsed.toISOString()
    }));
  }
}

// Singleton instance
export const modelRouter = new ModelRouter();

// Helper function for common use cases
export function selectModelForTask(
  task: RouterConfig['task'],
  options: Partial<Omit<RouterConfig, 'task'>> = {}
): string {
  return modelRouter.selectModel({
    task,
    priority: options.priority || 'balanced',
    maxLatencyMs: options.maxLatencyMs,
    estimatedTokens: options.estimatedTokens,
    requiresStreaming: options.requiresStreaming ?? true,
    userWillWait: options.userWillWait ?? false
  });
}

// Cost estimation
export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  model: string;
}

export function estimateCost(
  inputText: string,
  expectedOutputTokens: number,
  modelKey: string
): CostEstimate {
  const profile = MODEL_PROFILES[modelKey];
  
  if (!profile) {
    throw new Error(`Unknown model: ${modelKey}`);
  }
  
  // Rough token estimation (4 chars ≈ 1 token)
  const inputTokens = Math.ceil(inputText.length / 4);
  const outputTokens = expectedOutputTokens;
  
  const inputCost = (inputTokens / 1000) * profile.costPer1kTokens.input;
  const outputCost = (outputTokens / 1000) * profile.costPer1kTokens.output;
  
  return {
    inputTokens,
    outputTokens,
    totalCost: inputCost + outputCost,
    model: modelKey
  };
}

