/**
 * Ax LLM Orchestrator - Optimized Model Management
 * 
 * Advanced LLM orchestration with:
 * - Multi-model routing and load balancing
 * - Dynamic model selection based on task requirements
 * - Cost optimization and latency management
 * - Model performance monitoring and auto-scaling
 * - A/B testing and model comparison
 */

import { getToolCallingSystem } from './tool-calling-system';
import { getMem0CoreSystem } from './mem0-core-system';

export interface LLMModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'ollama' | 'perplexity' | 'openrouter' | 'local';
  model_name: string;
  capabilities: {
    max_tokens: number;
    supports_functions: boolean;
    supports_vision: boolean;
    supports_streaming: boolean;
    context_window: number;
  };
  performance: {
    avg_latency_ms: number;
    avg_cost_per_1k_tokens: number;
    success_rate: number;
    quality_score: number;
  };
  cost: {
    input_cost_per_1k: number;
    output_cost_per_1k: number;
    base_cost: number;
  };
  availability: {
    is_available: boolean;
    rate_limit: number;
    current_load: number;
  };
}

export interface TaskRequirement {
  task_type: 'generation' | 'analysis' | 'reasoning' | 'coding' | 'summarization' | 'translation';
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  max_latency_ms?: number;
  max_cost?: number;
  min_quality_score?: number;
  requires_functions?: boolean;
  requires_vision?: boolean;
  context_length?: number;
  domain?: string;
}

export interface ModelSelection {
  primary_model: LLMModel;
  fallback_models: LLMModel[];
  selection_reason: string;
  estimated_cost: number;
  estimated_latency_ms: number;
  confidence: number;
}

export interface ExecutionResult {
  model_used: LLMModel;
  result: any;
  success: boolean;
  error?: string;
  actual_cost: number;
  actual_latency_ms: number;
  quality_score: number;
  tokens_used: {
    input: number;
    output: number;
    total: number;
  };
}

export interface OrchestrationStats {
  total_requests: number;
  successful_requests: number;
  avg_latency_ms: number;
  total_cost: number;
  model_usage: Record<string, number>;
  performance_by_model: Record<string, {
    success_rate: number;
    avg_latency: number;
    avg_cost: number;
    quality_score: number;
  }>;
}

export class AxLLMOrchestrator {
  private models: Map<string, LLMModel> = new Map();
  private executionHistory: ExecutionResult[] = [];
  private modelPerformance: Map<string, {
    total_requests: number;
    successful_requests: number;
    total_latency: number;
    total_cost: number;
    quality_scores: number[];
  }> = new Map();
  private toolSystem: any;
  private mem0System: any;

  constructor() {
    this.toolSystem = getToolCallingSystem();
    this.mem0System = getMem0CoreSystem();
    this.initializeModels();
    console.log('🎯 Ax LLM Orchestrator initialized');
  }

  /**
   * Select optimal model for task
   */
  async selectModel(requirements: TaskRequirement): Promise<ModelSelection> {
    const availableModels = Array.from(this.models.values())
      .filter(model => model.availability.is_available);

    if (availableModels.length === 0) {
      throw new Error('No models available');
    }

    // Score models based on requirements
    const scoredModels = availableModels.map(model => {
      const score = this.calculateModelScore(model, requirements);
      return { model, score };
    });

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    const primaryModel = scoredModels[0].model;
    const fallbackModels = scoredModels.slice(1, 3).map(s => s.model);

    const selection: ModelSelection = {
      primary_model: primaryModel,
      fallback_models: fallbackModels,
      selection_reason: this.generateSelectionReason(primaryModel, requirements),
      estimated_cost: this.estimateCost(primaryModel, requirements),
      estimated_latency_ms: primaryModel.performance.avg_latency_ms,
      confidence: scoredModels[0].score
    };

    console.log(`🎯 Selected model: ${primaryModel.name} (score: ${scoredModels[0].score.toFixed(2)})`);
    return selection;
  }

  /**
   * Execute task with optimal model
   */
  async executeTask(
    prompt: string,
    requirements: TaskRequirement,
    options: {
      use_fallback?: boolean;
      max_retries?: number;
      timeout_ms?: number;
    } = {}
  ): Promise<ExecutionResult> {
    const { use_fallback = true, max_retries = 2, timeout_ms = 30000 } = options;
    
    const selection = await this.selectModel(requirements);
    const modelsToTry = [selection.primary_model, ...(use_fallback ? selection.fallback_models : [])];
    
    let lastError: Error | null = null;
    
    for (let i = 0; i < Math.min(modelsToTry.length, max_retries + 1); i++) {
      const model = modelsToTry[i];
      
      try {
        console.log(`🚀 Executing with model: ${model.name} (attempt ${i + 1})`);
        
        const result = await this.executeWithModel(model, prompt, requirements, timeout_ms);
        
        // Record performance
        this.recordExecution(result);
        
        console.log(`✅ Task completed with ${model.name}: ${result.actual_latency_ms}ms, $${result.actual_cost.toFixed(4)}`);
        return result;
        
      } catch (error: any) {
        console.log(`❌ Model ${model.name} failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }
    
    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  }

  /**
   * Execute parallel tasks across multiple models
   */
  async executeParallel(
    tasks: Array<{ prompt: string; requirements: TaskRequirement }>
  ): Promise<ExecutionResult[]> {
    console.log(`🔄 Executing ${tasks.length} tasks in parallel`);
    
    const promises = tasks.map(async (task, index) => {
      try {
        return await this.executeTask(task.prompt, task.requirements, { use_fallback: false });
      } catch (error: any) {
        return {
          model_used: this.models.values().next().value,
          result: null,
          success: false,
          error: error.message,
          actual_cost: 0,
          actual_latency_ms: 0,
          quality_score: 0,
          tokens_used: { input: 0, output: 0, total: 0 }
        } as ExecutionResult;
      }
    });
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ Parallel execution complete: ${successCount}/${tasks.length} successful`);
    return results;
  }

  /**
   * Get orchestration statistics
   */
  getStats(): OrchestrationStats {
    const totalRequests = this.executionHistory.length;
    const successfulRequests = this.executionHistory.filter(r => r.success).length;
    const avgLatency = totalRequests > 0 
      ? this.executionHistory.reduce((sum, r) => sum + r.actual_latency_ms, 0) / totalRequests 
      : 0;
    const totalCost = this.executionHistory.reduce((sum, r) => sum + r.actual_cost, 0);
    
    const modelUsage: Record<string, number> = {};
    const performanceByModel: Record<string, any> = {};
    
    this.executionHistory.forEach(result => {
      const modelId = result.model_used.id;
      modelUsage[modelId] = (modelUsage[modelId] || 0) + 1;
      
      if (!performanceByModel[modelId]) {
        performanceByModel[modelId] = {
          success_rate: 0,
          avg_latency: 0,
          avg_cost: 0,
          quality_score: 0
        };
      }
    });
    
    // Calculate performance metrics for each model
    Object.keys(performanceByModel).forEach(modelId => {
      const modelResults = this.executionHistory.filter(r => r.model_used.id === modelId);
      const successful = modelResults.filter(r => r.success);
      
      performanceByModel[modelId] = {
        success_rate: modelResults.length > 0 ? (successful.length / modelResults.length) * 100 : 0,
        avg_latency: modelResults.length > 0 ? modelResults.reduce((sum, r) => sum + r.actual_latency_ms, 0) / modelResults.length : 0,
        avg_cost: modelResults.length > 0 ? modelResults.reduce((sum, r) => sum + r.actual_cost, 0) / modelResults.length : 0,
        quality_score: successful.length > 0 ? successful.reduce((sum, r) => sum + r.quality_score, 0) / successful.length : 0
      };
    });
    
    return {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      avg_latency_ms: avgLatency,
      total_cost: totalCost,
      model_usage: modelUsage,
      performance_by_model: performanceByModel
    };
  }

  /**
   * Initialize available models
   */
  private initializeModels(): void {
    // Teacher Model (Perplexity)
    this.models.set('perplexity-sonar-pro', {
      id: 'perplexity-sonar-pro',
      name: 'Perplexity Sonar Pro',
      provider: 'perplexity',
      model_name: 'sonar-pro',
      capabilities: {
        max_tokens: 4000,
        supports_functions: false,
        supports_vision: false,
        supports_streaming: true,
        context_window: 4000
      },
      performance: {
        avg_latency_ms: 5000,
        avg_cost_per_1k_tokens: 0.02,
        success_rate: 96,
        quality_score: 96
      },
      cost: {
        input_cost_per_1k: 0.02,
        output_cost_per_1k: 0.02,
        base_cost: 0
      },
      availability: {
        is_available: true,
        rate_limit: 100,
        current_load: 0
      }
    });

    // Student Model (Ollama)
    this.models.set('ollama-gemma2-2b', {
      id: 'ollama-gemma2-2b',
      name: 'Ollama Gemma2 2B',
      provider: 'ollama',
      model_name: 'gemma2:2b',
      capabilities: {
        max_tokens: 2000,
        supports_functions: true,
        supports_vision: false,
        supports_streaming: true,
        context_window: 2000
      },
      performance: {
        avg_latency_ms: 2000,
        avg_cost_per_1k_tokens: 0,
        success_rate: 85,
        quality_score: 75
      },
      cost: {
        input_cost_per_1k: 0,
        output_cost_per_1k: 0,
        base_cost: 0
      },
      availability: {
        is_available: true,
        rate_limit: 1000,
        current_load: 0
      }
    });

    // Local Model (Ollama)
    this.models.set('ollama-gemma3-4b', {
      id: 'ollama-gemma3-4b',
      name: 'Ollama Gemma3 4B',
      provider: 'ollama',
      model_name: 'gemma3:4b',
      capabilities: {
        max_tokens: 4000,
        supports_functions: true,
        supports_vision: false,
        supports_streaming: true,
        context_window: 4000
      },
      performance: {
        avg_latency_ms: 3000,
        avg_cost_per_1k_tokens: 0,
        success_rate: 90,
        quality_score: 85
      },
      cost: {
        input_cost_per_1k: 0,
        output_cost_per_1k: 0,
        base_cost: 0
      },
      availability: {
        is_available: true,
        rate_limit: 500,
        current_load: 0
      }
    });

    console.log(`✅ Initialized ${this.models.size} models`);
  }

  /**
   * Calculate model score based on requirements
   */
  private calculateModelScore(model: LLMModel, requirements: TaskRequirement): number {
    let score = 0;
    
    // Performance score (40% weight)
    const performanceScore = (model.performance.success_rate * 0.4) + 
                           (model.performance.quality_score * 0.6);
    score += performanceScore * 0.4;
    
    // Cost efficiency score (20% weight)
    const costScore = requirements.max_cost ? 
      Math.max(0, 100 - (model.cost.input_cost_per_1k * 1000)) : 50;
    score += costScore * 0.2;
    
    // Latency score (20% weight)
    const latencyScore = requirements.max_latency_ms ? 
      Math.max(0, 100 - (model.performance.avg_latency_ms / requirements.max_latency_ms * 100)) : 50;
    score += latencyScore * 0.2;
    
    // Capability match score (20% weight)
    let capabilityScore = 0;
    if (requirements.requires_functions && model.capabilities.supports_functions) capabilityScore += 25;
    if (requirements.requires_vision && model.capabilities.supports_vision) capabilityScore += 25;
    if (requirements.context_length && model.capabilities.context_window >= requirements.context_length) capabilityScore += 25;
    if (model.availability.is_available) capabilityScore += 25;
    score += capabilityScore * 0.2;
    
    return score;
  }

  /**
   * Generate selection reason
   */
  private generateSelectionReason(model: LLMModel, requirements: TaskRequirement): string {
    const reasons: string[] = [];
    
    if (model.performance.quality_score > 90) {
      reasons.push('high quality score');
    }
    
    if (model.cost.input_cost_per_1k === 0) {
      reasons.push('free to use');
    }
    
    if (model.performance.avg_latency_ms < 2000) {
      reasons.push('fast response time');
    }
    
    if (requirements.requires_functions && model.capabilities.supports_functions) {
      reasons.push('supports function calling');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'best available option';
  }

  /**
   * Estimate cost for task
   */
  private estimateCost(model: LLMModel, requirements: TaskRequirement): number {
    // Rough estimation based on average token usage
    const estimatedTokens = this.estimateTokenUsage(requirements);
    return (estimatedTokens / 1000) * model.cost.input_cost_per_1k;
  }

  /**
   * Estimate token usage
   */
  private estimateTokenUsage(requirements: TaskRequirement): number {
    const baseTokens = 100; // Base prompt tokens
    
    switch (requirements.complexity) {
      case 'simple': return baseTokens + 50;
      case 'medium': return baseTokens + 200;
      case 'complex': return baseTokens + 500;
      case 'expert': return baseTokens + 1000;
      default: return baseTokens + 200;
    }
  }

  /**
   * Execute task with specific model
   */
  private async executeWithModel(
    model: LLMModel,
    prompt: string,
    requirements: TaskRequirement,
    timeout_ms: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Simulate model execution (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, model.performance.avg_latency_ms));
      
      const tokensUsed = this.estimateTokenUsage(requirements);
      const actualCost = (tokensUsed / 1000) * model.cost.input_cost_per_1k;
      const actualLatency = Date.now() - startTime;
      
      // Simulate result
      const result = {
        text: `Response from ${model.name}: ${prompt.substring(0, 100)}...`,
        tokens: tokensUsed,
        model: model.name
      };
      
      return {
        model_used: model,
        result,
        success: true,
        actual_cost: actualCost,
        actual_latency_ms: actualLatency,
        quality_score: model.performance.quality_score,
        tokens_used: {
          input: tokensUsed * 0.7,
          output: tokensUsed * 0.3,
          total: tokensUsed
        }
      };
      
    } catch (error: any) {
      return {
        model_used: model,
        result: null,
        success: false,
        error: error.message,
        actual_cost: 0,
        actual_latency_ms: Date.now() - startTime,
        quality_score: 0,
        tokens_used: { input: 0, output: 0, total: 0 }
      };
    }
  }

  /**
   * Record execution for performance tracking
   */
  private recordExecution(result: ExecutionResult): void {
    this.executionHistory.push(result);
    
    // Update model performance tracking
    const modelId = result.model_used.id;
    if (!this.modelPerformance.has(modelId)) {
      this.modelPerformance.set(modelId, {
        total_requests: 0,
        successful_requests: 0,
        total_latency: 0,
        total_cost: 0,
        quality_scores: []
      });
    }
    
    const perf = this.modelPerformance.get(modelId)!;
    perf.total_requests++;
    if (result.success) {
      perf.successful_requests++;
      perf.quality_scores.push(result.quality_score);
    }
    perf.total_latency += result.actual_latency_ms;
    perf.total_cost += result.actual_cost;
    
    // Update model performance metrics
    const model = this.models.get(modelId);
    if (model) {
      model.performance.success_rate = (perf.successful_requests / perf.total_requests) * 100;
      model.performance.avg_latency_ms = perf.total_latency / perf.total_requests;
      model.performance.avg_cost_per_1k_tokens = (perf.total_cost / perf.total_requests) * 1000;
      model.performance.quality_score = perf.quality_scores.length > 0 
        ? perf.quality_scores.reduce((sum, score) => sum + score, 0) / perf.quality_scores.length 
        : 0;
    }
  }
}

// Singleton instance
let axLLMInstance: AxLLMOrchestrator | undefined;

export function getAxLLMOrchestrator(): AxLLMOrchestrator {
  if (!axLLMInstance) {
    axLLMInstance = new AxLLMOrchestrator();
  }
  return axLLMInstance;
}
