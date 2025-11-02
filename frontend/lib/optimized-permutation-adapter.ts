/**
 * Optimized Permutation Adapter
 * 
 * Bridges the gap between self-improving optimizer and permutation pipeline.
 * Automatically applies optimized configurations from HGM/DGM optimizer.
 */

import { selfImprovingOptimizer, SelfImprovingOptimizer } from './self-improving-optimizer';
import { UnifiedPipelineConfig, executeUnifiedPipeline } from './unified-permutation-pipeline';
import { ContextSynthesisConfig } from './rag/context-synthesizer';

/**
 * Configuration Source
 */
export type ConfigSource = 
  | 'optimizer'      // Use best config from self-improving optimizer
  | 'default'        // Use default hardcoded values
  | 'custom';        // Use provided custom config

/**
 * Optimized Permutation Adapter
 * 
 * Automatically selects optimal configuration based on:
 * 1. Self-improving optimizer results (if available)
 * 2. Default values (fallback)
 * 3. Custom override (if provided)
 */
export class OptimizedPermutationAdapter {
  private optimizer: SelfImprovingOptimizer;
  private useOptimizedConfig: boolean;
  private customConfig?: Partial<UnifiedPipelineConfig>;
  
  constructor(
    optimizer?: SelfImprovingOptimizer,
    useOptimizedConfig: boolean = true,
    customConfig?: Partial<UnifiedPipelineConfig>
  ) {
    this.optimizer = optimizer || selfImprovingOptimizer;
    this.useOptimizedConfig = useOptimizedConfig;
    this.customConfig = customConfig;
  }
  
  /**
   * Get optimal permutation configuration
   * 
   * Priority:
   * 1. Custom config (if provided)
   * 2. Optimized config (from optimizer, if available)
   * 3. Default config
   */
  getOptimalConfig(source: ConfigSource = 'optimizer'): UnifiedPipelineConfig {
    // Priority 1: Custom config override
    if (this.customConfig && source !== 'optimizer') {
      return this.mergeWithDefaults(this.customConfig);
    }
    
    // Priority 2: Optimized config from self-improving optimizer
    if (source === 'optimizer' && this.useOptimizedConfig) {
      const optimized = this.getOptimizedConfig();
      if (optimized) {
        console.log('✅ Using optimized configuration from self-improving optimizer');
        return this.mergeWithDefaults(optimized);
      }
    }
    
    // Priority 3: Default config
    console.log('ℹ️ Using default configuration');
    return this.getDefaultConfig();
  }
  
  /**
   * Get optimized configuration from self-improving optimizer
   */
  private getOptimizedConfig(): Partial<UnifiedPipelineConfig> | null {
    try {
      const best = this.optimizer.getBestCandidate();
      if (!best) {
        console.log('⚠️ No best candidate found in optimizer - using defaults');
        return null;
      }
      
      // Check if candidate has been evaluated
      if (best.performance.evaluationCount === 0) {
        console.log('⚠️ Best candidate not evaluated yet - using defaults');
        return null;
      }
      
      // Export optimized permutation config
      const optimized = this.optimizer.exportBestPermutationConfig();
      
      console.log('📊 Optimized Permutation Config:', {
        aceThreshold: optimized.aceThreshold,
        swirlThreshold: optimized.swirlThreshold,
        rvsThreshold: optimized.rvsThreshold,
        optimizationMode: optimized.optimizationMode,
        candidateCMP: this.optimizer.calculateCMP(best.id),
      });
      
      return optimized;
    } catch (error) {
      console.error('❌ Error getting optimized config:', error);
      return null;
    }
  }
  
  /**
   * Get default configuration
   * 
   * These are the "safe" defaults that work well in most cases.
   * Based on testing and empirical results.
   */
  private getDefaultConfig(): UnifiedPipelineConfig {
    return {
      enableACE: true,
      enableGEPA: true,
      enableIRT: true,
      enableRVS: true,
      enableDSPy: true,
      enableSemiotic: true,
      enableTeacherStudent: true,
      enableSWiRL: true,
      enableSRL: true,
      enableEBM: true,
      enableToolSynthesis: true,
      enableSelfImprovingJudge: true,
      optimizationMode: 'balanced',
      
      // Thresholds (from testing)
      aceThreshold: 0.5,      // Optimal from testing
      swirlThreshold: 0.7,    // Optimal from testing
      rvsThreshold: 0.3,      // Optimal from testing
    };
  }
  
  /**
   * Merge partial config with defaults
   */
  private mergeWithDefaults(partial: Partial<UnifiedPipelineConfig>): UnifiedPipelineConfig {
    const defaults = this.getDefaultConfig();
    return {
      ...defaults,
      ...partial,
      // Ensure nested objects are merged correctly
      optimizationMode: partial.optimizationMode || defaults.optimizationMode,
    };
  }
  
  /**
   * Execute permutation pipeline with optimal configuration
   */
  async executeWithOptimalConfig(
    query: string,
    domain?: string,
    context?: any,
    source: ConfigSource = 'optimizer'
  ) {
    const config = this.getOptimalConfig(source);
    
    console.log('🚀 Executing with optimal config:', {
      aceThreshold: config.aceThreshold,
      swirlThreshold: config.swirlThreshold,
      rvsThreshold: config.rvsThreshold,
      optimizationMode: config.optimizationMode,
      source,
    });
    
    return await executeUnifiedPipeline(query, domain, context, config);
  }
  
  /**
   * Get configuration explanation
   * 
   * Explains why certain thresholds were chosen
   */
  getConfigExplanation(source: ConfigSource = 'optimizer'): string {
    const config = this.getOptimalConfig(source);
    const best = this.optimizer.getBestCandidate();
    
    let explanation = `Configuration Source: ${source}\n\n`;
    
    if (source === 'optimizer' && best) {
      const cmp = this.optimizer.calculateCMP(best.id);
      explanation += `Optimized by Self-Improving Optimizer:\n`;
      explanation += `  - Candidate CMP Score: ${cmp.toFixed(3)}\n`;
      explanation += `  - Evaluations: ${best.performance.evaluationCount}\n`;
      explanation += `  - Generation: ${best.generation}\n\n`;
    }
    
    explanation += `Threshold Configuration:\n`;
    explanation += `  - ACE Threshold: ${config.aceThreshold} (IRT difficulty > ${config.aceThreshold} → use ACE)\n`;
    explanation += `  - SWiRL Threshold: ${config.swirlThreshold} (IRT difficulty > ${config.swirlThreshold} → use SWiRL)\n`;
    explanation += `  - RVS Threshold: ${config.rvsThreshold} (IRT difficulty > ${config.rvsThreshold} → use RVS)\n\n`;
    
    explanation += `Routing Logic:\n`;
    explanation += `  1. Calculate IRT difficulty for query\n`;
    explanation += `  2. If difficulty > ${config.aceThreshold}: Use ACE for context enhancement\n`;
    explanation += `  3. If difficulty > ${config.swirlThreshold}: Use SWiRL for multi-step reasoning\n`;
    explanation += `  4. If difficulty > ${config.rvsThreshold}: Use RVS for verification\n`;
    explanation += `  5. Optimization mode: ${config.optimizationMode}\n`;
    
    return explanation;
  }
  
  /**
   * Check if optimized config is available
   */
  hasOptimizedConfig(): boolean {
    const best = this.optimizer.getBestCandidate();
    return best !== null && best.performance.evaluationCount > 0;
  }
  
  /**
   * Get configuration comparison
   * 
   * Shows difference between optimized and default config
   */
  compareConfigs(): {
    default: UnifiedPipelineConfig;
    optimized: Partial<UnifiedPipelineConfig> | null;
    differences: Record<string, { default: any; optimized: any }>;
  } {
    const defaultConfig = this.getDefaultConfig();
    const optimizedConfig = this.getOptimizedConfig();
    
    const differences: Record<string, { default: any; optimized: any }> = {};
    
    if (optimizedConfig) {
      // Compare thresholds
      if (optimizedConfig.aceThreshold !== undefined && 
          optimizedConfig.aceThreshold !== defaultConfig.aceThreshold) {
        differences.aceThreshold = {
          default: defaultConfig.aceThreshold,
          optimized: optimizedConfig.aceThreshold,
        };
      }
      
      if (optimizedConfig.swirlThreshold !== undefined && 
          optimizedConfig.swirlThreshold !== defaultConfig.swirlThreshold) {
        differences.swirlThreshold = {
          default: defaultConfig.swirlThreshold,
          optimized: optimizedConfig.swirlThreshold,
        };
      }
      
      if (optimizedConfig.rvsThreshold !== undefined && 
          optimizedConfig.rvsThreshold !== defaultConfig.rvsThreshold) {
        differences.rvsThreshold = {
          default: defaultConfig.rvsThreshold,
          optimized: optimizedConfig.rvsThreshold,
        };
      }
      
      if (optimizedConfig.optimizationMode && 
          optimizedConfig.optimizationMode !== defaultConfig.optimizationMode) {
        differences.optimizationMode = {
          default: defaultConfig.optimizationMode,
          optimized: optimizedConfig.optimizationMode,
        };
      }
    }
    
    return {
      default: defaultConfig,
      optimized: optimizedConfig,
      differences,
    };
  }
}

/**
 * Singleton instance
 */
export const optimizedPermutationAdapter = new OptimizedPermutationAdapter();

/**
 * Convenience function: Execute with optimal config
 */
export async function executePermutationWithOptimalConfig(
  query: string,
  domain?: string,
  context?: any,
  source: ConfigSource = 'optimizer'
) {
  return await optimizedPermutationAdapter.executeWithOptimalConfig(
    query,
    domain,
    context,
    source
  );
}

