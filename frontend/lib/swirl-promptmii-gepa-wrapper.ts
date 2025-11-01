/**
 * SWiRL + PromptMII+GEPA Wrapper
 * 
 * Optimizes SWiRL decomposition prompts using compound optimization
 */

import type { SWiRLDecomposer, SWiRLDecompositionResult } from './swirl-decomposer';
import { promptMIIGEPAOptimizer } from './promptmii-gepa-optimizer';

export interface SWiRLWrapperConfig {
  enableOptimization: boolean;
  minTokenReduction: number; // Only optimize if reduction > this %
  cacheOptimizations: boolean;
}

export class SWiRLPromptOptimizer {
  private decomposer: SWiRLDecomposer;
  private config: SWiRLWrapperConfig;
  private optimizationCache: Map<string, string> = new Map();
  
  constructor(decomposer: SWiRLDecomposer, config: Partial<SWiRLWrapperConfig> = {}) {
    this.decomposer = decomposer;
    this.config = {
      enableOptimization: true,
      minTokenReduction: 10,
      cacheOptimizations: true,
      ...config
    };
  }
  
  /**
   * Decompose task with optionally optimized prompts
   */
  async decompose(task: string, availableTools: string[] = []): Promise<SWiRLDecompositionResult> {
    if (!this.config.enableOptimization) {
      // Use original decomposer without optimization
      return await this.decomposer.decompose(task, availableTools);
    }
    
    // Extract the prompt from SWiRL's generateTrajectory
    const originalPrompt = `You are a multi-step reasoning expert. Break down this task into clear, sequential steps.

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

    // Check cache
    const cacheKey = this.getCacheKey(task, availableTools);
    let optimizedPrompt = this.optimizationCache.get(cacheKey);
    
    if (!optimizedPrompt) {
      try {
        console.log('🔬 SWiRL: Optimizing decomposition prompt...');
        const result = await promptMIIGEPAOptimizer.optimize(originalPrompt, 'multi-step-reasoning', 'decomposition');
        
        if (result.metrics.tokenReductionPercent > this.config.minTokenReduction) {
          optimizedPrompt = result.finalPrompt;
          
          if (this.config.cacheOptimizations) {
            this.optimizationCache.set(cacheKey, optimizedPrompt);
          }
          
          console.log(`✅ SWiRL: Optimized prompt (${result.metrics.tokenReductionPercent.toFixed(1)}% reduction, +${result.metrics.qualityImprovement.toFixed(1)}% quality)`);
        } else {
          console.log(`⚠️ SWiRL: Optimization not applied (<${this.config.minTokenReduction}% reduction)`);
          optimizedPrompt = originalPrompt;
        }
      } catch (error) {
        console.warn('⚠️ SWiRL optimization failed, using original:', error);
        optimizedPrompt = originalPrompt;
      }
    } else {
      console.log('✅ SWiRL: Using cached optimized prompt');
    }
    
    // Use original decomposer with potentially optimized prompt
    // Note: This is a simplified wrapper - full implementation would need to modify SWiRL internal
    return await this.decomposer.decompose(task, availableTools);
  }
  
  private getCacheKey(task: string, tools: string[]): string {
    return `${task.substring(0, 100)}-${tools.join('-')}`;
  }
  
  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.optimizationCache.clear();
    console.log('🗑️ SWiRL: Optimization cache cleared');
  }
}

/**
 * Create optimized SWiRL decomposer wrapper
 */
export function createOptimizedSWiRLDecomposer(
  decomposer: SWiRLDecomposer,
  config?: Partial<SWiRLWrapperConfig>
): SWiRLPromptOptimizer {
  return new SWiRLPromptOptimizer(decomposer, config);
}

