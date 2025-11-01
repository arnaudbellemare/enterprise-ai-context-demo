/**
 * SWiRL with PromptMII+GEPA Optimization
 * 
 * Enhances SWiRL decomposition prompts with compound optimization for better efficiency
 */

import type { SWiRLDecomposer, SWiRLDecompositionResult } from './swirl-decomposer';
import { createSWiRLDecomposer } from './swirl-decomposer';
import { promptMIIGEPAOptimizer } from './promptmii-gepa-optimizer';

export interface OptimizedSWiRLConfig {
  enableOptimization: boolean;
  minImprovement: number; // Only use if >X% token reduction
  cacheOptimizations: boolean;
}

/**
 * Optimized SWiRL Decomposer with PromptMII+GEPA
 */
export class OptimizedSWiRLDecomposer {
  private decomposer: SWiRLDecomposer;
  private config: OptimizedSWiRLConfig;
  private promptCache: Map<string, string> = new Map();
  
  constructor(config: Partial<OptimizedSWiRLConfig> = {}) {
    this.decomposer = createSWiRLDecomposer('qwen2.5:14b');
    this.config = {
      enableOptimization: true,
      minImprovement: 10, // Only apply if >10% improvement
      cacheOptimizations: true,
      ...config
    };
  }
  
  /**
   * Decompose with optimized prompts
   */
  async decompose(task: string, availableTools: string[] = []): Promise<SWiRLDecompositionResult> {
    if (!this.config.enableOptimization) {
      return await this.decomposer.decompose(task, availableTools);
    }
    
    // Get the base prompt that SWiRL would use
    const basePrompt = this.buildBasePrompt(task, availableTools);
    
    // Check cache
    const cacheKey = this.getCacheKey(task, availableTools);
    let optimizedPrompt = this.promptCache.get(cacheKey);
    
    if (!optimizedPrompt) {
      try {
        console.log('🔬 SWiRL: Optimizing decomposition prompt...');
        const result = await promptMIIGEPAOptimizer.optimize(basePrompt, 'multi-step-reasoning', 'decomposition');
        
        if (result.metrics.tokenReductionPercent > this.config.minImprovement) {
          optimizedPrompt = result.finalPrompt;
          
          if (this.config.cacheOptimizations) {
            this.promptCache.set(cacheKey, optimizedPrompt);
          }
          
          console.log(`✅ SWiRL: Using optimized prompt (${result.metrics.tokenReductionPercent.toFixed(1)}% reduction, +${result.metrics.qualityImprovement.toFixed(1)}% quality)`);
        } else {
          console.log(`⚠️ SWiRL: Optimization benefit too small (<${this.config.minImprovement}%), using base prompt`);
          optimizedPrompt = basePrompt;
        }
      } catch (error) {
        console.warn('⚠️ SWiRL optimization failed, using base:', error);
        optimizedPrompt = basePrompt;
      }
    } else {
      console.log('✅ SWiRL: Using cached optimized prompt');
    }
    
    // Use optimized prompt by calling Ollama directly with it
    return await this.decomposeWithPrompt(task, availableTools, optimizedPrompt);
  }
  
  /**
   * Build the base prompt that SWiRL uses
   */
  private buildBasePrompt(task: string, availableTools: string[]): string {
    return `You are a multi-step reasoning expert. Break down this task into clear, sequential steps.

Task: ${task}

Available Tools:
${availableTools.map(tool => `- ${tool}`).join('\n')}

For each step, provide:
1. Step description
2. Internal reasoning (chain of thought)
3. Tools needed (if any)
4. Complexity score (0-1)
5. Dependencies on previous steps

Format your response as JSON:
{
  "steps": [
    {
      "step_number": 1,
      "description": "...",
      "reasoning": "...",
      "tools_needed": ["..."],
      "complexity_score": 0.5,
      "depends_on": []
    }
  ]
}`;
  }
  
  /**
   * Decompose using a specific prompt
   */
  private async decomposeWithPrompt(task: string, availableTools: string[], prompt: string): Promise<SWiRLDecompositionResult> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:14b',
          prompt,
          stream: false,
          format: 'json',
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.response);

      const steps = parsed.steps.map((step: any) => ({
        step_number: step.step_number,
        description: step.description,
        reasoning: step.reasoning || '',
        tools_needed: step.tools_needed || [],
        complexity_score: step.complexity_score || 0.5,
        depends_on: step.depends_on || [],
      }));

      const totalComplexity = steps.reduce((sum: number, step: any) => sum + step.complexity_score, 0) / steps.length;
      const estimatedTime = steps.length * 2000;

      return {
        trajectory: {
          task_id: `swirl-opt-${Date.now()}`,
          original_task: task,
          steps,
          total_complexity: totalComplexity,
          estimated_time_ms: estimatedTime,
          tools_required: [...new Set(steps.flatMap((s: any) => s.tools_needed))] as string[],
        },
        sub_trajectories: [], // Would generate these similarly
        synthesis_plan: 'Synthesize results from decomposed steps.',
      };
    } catch (error) {
      console.error('SWiRL optimized decomposition failed:', error);
      // Fallback to original
      return await this.decomposer.decompose(task, availableTools);
    }
  }
  
  private getCacheKey(task: string, tools: string[]): string {
    return `swirl-${task.substring(0, 100)}-${tools.join('-')}`;
  }
  
  clearCache(): void {
    this.promptCache.clear();
    console.log('🗑️ SWiRL: Optimization cache cleared');
  }
}

/**
 * Create optimized SWiRL decomposer
 */
export function createOptimizedSWiRLDecomposer(config?: Partial<OptimizedSWiRLConfig>): OptimizedSWiRLDecomposer {
  return new OptimizedSWiRLDecomposer(config);
}

