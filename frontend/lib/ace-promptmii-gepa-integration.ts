/**
 * ACE + PromptMII+GEPA Integration
 * 
 * Optimizes ACE framework prompts using compound optimization for better efficiency and quality
 */

import type { ACEFramework } from './ace-framework';
import { promptMIIGEPAOptimizer } from './promptmii-gepa-optimizer';

/**
 * Enhanced ACE Framework with PromptMII+GEPA optimization
 */
export class EnhancedACEWithOptimization {
  private aceFramework: ACEFramework;
  private optimizer: typeof promptMIIGEPAOptimizer;
  private optimizePrompts: boolean;
  
  constructor(
    aceFramework: ACEFramework,
    options: { enableOptimization?: boolean } = {}
  ) {
    this.aceFramework = aceFramework;
    this.optimizer = promptMIIGEPAOptimizer;
    this.optimizePrompts = options.enableOptimization ?? true;
  }
  
  /**
   * Process query with optimized prompts
   */
  async processQuery(query: string, domain: string = 'general'): Promise<any> {
    // If optimization is enabled, optimize the underlying prompts first
    if (this.optimizePrompts) {
      console.log('🔬 ACE: Applying PromptMII+GEPA optimization...');
      
      // Note: This would require access to ACE's internal prompts
      // For now, we'll add a wrapper that optimizes prompts when possible
      // Real integration would require modifying ACE framework internals
      console.log('⚠️ ACE prompt optimization requires framework modifications');
    }
    
    // Use standard ACE processing
    return await this.aceFramework.processQuery(query);
  }
  
  /**
   * Optimize a reasoning prompt using PromptMII+GEPA
   */
  async optimizeReasoningPrompt(originalPrompt: string, domain: string = 'general'): Promise<string> {
    if (!this.optimizePrompts) {
      return originalPrompt;
    }
    
    try {
      const result = await this.optimizer.optimize(originalPrompt, domain, 'reasoning');
      console.log(`✅ ACE: Optimized reasoning prompt (${result.metrics.tokenReductionPercent.toFixed(1)}% reduction)`);
      return result.finalPrompt;
    } catch (error) {
      console.warn('⚠️ ACE prompt optimization failed, using original:', error);
      return originalPrompt;
    }
  }
  
  /**
   * Optimize an action generation prompt using PromptMII+GEPA
   */
  async optimizeActionPrompt(originalPrompt: string, domain: string = 'general'): Promise<string> {
    if (!this.optimizePrompts) {
      return originalPrompt;
    }
    
    try {
      const result = await this.optimizer.optimize(originalPrompt, domain, 'action-generation');
      console.log(`✅ ACE: Optimized action prompt (${result.metrics.tokenReductionPercent.toFixed(1)}% reduction)`);
      return result.finalPrompt;
    } catch (error) {
      console.warn('⚠️ ACE action optimization failed, using original:', error);
      return originalPrompt;
    }
  }
}

