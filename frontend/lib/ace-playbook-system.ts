/**
 * ACE Playbook System - Complete Generator-Reflector-Curator Integration
 * Based on https://github.com/jmanhype/ace-playbook
 * Adapted for PERMUTATION system with Ax LLM, DSPy, and GEPA integration
 */

import { acePlaybookGenerator, GeneratorResult } from './ace-playbook-generator';
import { acePlaybookReflector, ExecutionOutcome, ReflectionResult } from './ace-playbook-reflector';
import { acePlaybookCurator, PlaybookBullet, CurationResult } from './ace-playbook-curator';

export interface PlaybookSystemConfig {
  enableGenerator: boolean;
  enableReflector: boolean;
  enableCurator: boolean;
  enableGEPA: boolean;
  performanceBudget: {
    maxPlaybookRetrievalMs: number;
    maxOverheadPercent: number;
  };
  similarityThreshold: number;
  maxPlaybookSize: number;
}

export interface PlaybookSystemResult {
  query: string;
  domain: string;
  generator_result: GeneratorResult;
  reflection_result: ReflectionResult;
  curation_result: CurationResult;
  playbook_bullets: PlaybookBullet[];
  performance_metrics: {
    total_time_ms: number;
    generator_time_ms: number;
    reflection_time_ms: number;
    curation_time_ms: number;
    playbook_retrieval_ms: number;
    overhead_percent: number;
  };
  gepa_optimization?: {
    prompt_evolution: any;
    pareto_optimization: any;
    genetic_improvements: any;
  };
}

export class ACEPlaybookSystem {
  private config: PlaybookSystemConfig;
  private performanceHistory: number[] = [];
  private playbookRetrievalHistory: number[] = [];

  constructor(config: Partial<PlaybookSystemConfig> = {}) {
    this.config = {
      enableGenerator: true,
      enableReflector: true,
      enableCurator: true,
      enableGEPA: false, // Will implement GEPA integration
      performanceBudget: {
        maxPlaybookRetrievalMs: 10, // ≤10ms P50 playbook retrieval
        maxOverheadPercent: 15 // ≤+15% end-to-end overhead
      },
      similarityThreshold: 0.8,
      maxPlaybookSize: 10000,
      ...config
    };
  }

  /**
   * Execute complete Generator-Reflector-Curator workflow
   */
  async execute(query: string, domain: string, context?: any): Promise<PlaybookSystemResult> {
    console.log(`🚀 ACE Playbook System: Starting execution for ${domain} domain`);
    const systemStartTime = Date.now();
    
    try {
      // ============================================
      // STEP 1: GENERATOR - Execute task with DSPy ReAct/CoT
      // ============================================
      let generatorResult: GeneratorResult;
      let generatorTime = 0;
      
      if (this.config.enableGenerator) {
        const generatorStart = Date.now();
        generatorResult = await acePlaybookGenerator.executeTask(query, domain, context);
        generatorTime = Date.now() - generatorStart;
        console.log(`✅ Generator: Completed in ${generatorTime}ms`);
      } else {
        generatorResult = this.createFallbackGeneratorResult(query, domain);
      }
      
      // ============================================
      // STEP 2: REFLECTOR - Analyze outcome and extract insights
      // ============================================
      let reflectionResult: ReflectionResult;
      let reflectionTime = 0;
      
      if (this.config.enableReflector) {
        const reflectionStart = Date.now();
        const executionOutcome = this.createExecutionOutcome(query, domain, generatorResult);
        reflectionResult = await acePlaybookReflector.reflect(executionOutcome);
        reflectionTime = Date.now() - reflectionStart;
        console.log(`✅ Reflector: Completed in ${reflectionTime}ms`);
      } else {
        reflectionResult = this.createFallbackReflectionResult();
      }
      
      // ============================================
      // STEP 3: CURATOR - Semantic deduplication and playbook management
      // ============================================
      let curationResult: CurationResult;
      let curationTime = 0;
      
      if (this.config.enableCurator) {
        const curationStart = Date.now();
        curationResult = await acePlaybookCurator.curate(reflectionResult.insights, domain);
        curationTime = Date.now() - curationStart;
        console.log(`✅ Curator: Completed in ${curationTime}ms`);
      } else {
        curationResult = this.createFallbackCurationResult();
      }
      
      // ============================================
      // STEP 4: PLAYBOOK RETRIEVAL - Get relevant bullets
      // ============================================
      const playbookStart = Date.now();
      const playbookBullets = await this.retrieveRelevantBullets(query, domain);
      const playbookRetrievalTime = Date.now() - playbookStart;
      
      // Track performance metrics
      this.playbookRetrievalHistory.push(playbookRetrievalTime);
      if (this.playbookRetrievalHistory.length > 100) {
        this.playbookRetrievalHistory.shift();
      }
      
      // ============================================
      // STEP 5: GEPA OPTIMIZATION (if enabled)
      // ============================================
      let gepaOptimization;
      if (this.config.enableGEPA) {
        gepaOptimization = await this.runGEPAOptimization(query, domain, generatorResult, reflectionResult);
      }
      
      // ============================================
      // STEP 6: PERFORMANCE VALIDATION
      // ============================================
      const totalTime = Date.now() - systemStartTime;
      const overheadPercent = this.calculateOverheadPercent(totalTime, generatorTime);
      
      // Validate performance budgets
      this.validatePerformanceBudgets(playbookRetrievalTime, overheadPercent);
      
      // Track overall performance
      this.performanceHistory.push(totalTime);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }
      
      const result: PlaybookSystemResult = {
        query,
        domain,
        generator_result: generatorResult,
        reflection_result: reflectionResult,
        curation_result: curationResult,
        playbook_bullets: playbookBullets,
        performance_metrics: {
          total_time_ms: totalTime,
          generator_time_ms: generatorTime,
          reflection_time_ms: reflectionTime,
          curation_time_ms: curationTime,
          playbook_retrieval_ms: playbookRetrievalTime,
          overhead_percent: overheadPercent
        },
        gepa_optimization: gepaOptimization
      };
      
      console.log(`🎯 ACE Playbook System: Execution completed in ${totalTime}ms`);
      console.log(`   - Playbook retrieval: ${playbookRetrievalTime}ms`);
      console.log(`   - Overhead: ${overheadPercent.toFixed(1)}%`);
      console.log(`   - Bullets retrieved: ${playbookBullets.length}`);
      
      return result;
      
    } catch (error) {
      console.error('ACE Playbook System execution failed:', error);
      
      // Return fallback result
      return this.createFallbackResult(query, domain, Date.now() - systemStartTime);
    }
  }

  /**
   * Retrieve relevant playbook bullets for query
   */
  private async retrieveRelevantBullets(query: string, domain: string): Promise<PlaybookBullet[]> {
    try {
      // Get most relevant bullets using semantic search
      const relevantBullets = await acePlaybookCurator.searchBullets(domain, query, 20);
      
      // Also get high-usage bullets
      const highUsageBullets = acePlaybookCurator.getPlaybookBullets(domain, 10);
      
      // Combine and deduplicate
      const allBullets = [...relevantBullets, ...highUsageBullets];
      const uniqueBullets = new Map<string, PlaybookBullet>();
      
      allBullets.forEach(bullet => {
        if (!uniqueBullets.has(bullet.id)) {
          uniqueBullets.set(bullet.id, bullet);
        }
      });
      
      return Array.from(uniqueBullets.values())
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 15); // Return top 15 bullets
      
    } catch (error) {
      console.error('Playbook retrieval failed:', error);
      return [];
    }
  }

  /**
   * Run GEPA optimization (placeholder for future implementation)
   */
  private async runGEPAOptimization(query: string, domain: string, generatorResult: GeneratorResult, reflectionResult: ReflectionResult): Promise<any> {
    // TODO: Implement GEPA algorithms for prompt evolution and optimization
    console.log('🧬 GEPA: Optimization not yet implemented');
    
    return {
      prompt_evolution: {
        status: 'not_implemented',
        message: 'GEPA prompt evolution will be implemented in future version'
      },
      pareto_optimization: {
        status: 'not_implemented',
        message: 'GEPA Pareto optimization will be implemented in future version'
      },
      genetic_improvements: {
        status: 'not_implemented',
        message: 'GEPA genetic improvements will be implemented in future version'
      }
    };
  }

  /**
   * Create execution outcome from generator result
   */
  private createExecutionOutcome(query: string, domain: string, generatorResult: GeneratorResult): ExecutionOutcome {
    return {
      query,
      domain,
      strategy_used: generatorResult.strategy_used.id,
      result: generatorResult.reasoning,
      confidence: generatorResult.confidence,
      execution_time_ms: generatorResult.performance_metrics.execution_time_ms,
      tokens_used: generatorResult.performance_metrics.tokens_used,
      cost: generatorResult.performance_metrics.cost,
      error_occurred: generatorResult.confidence < 0.3
    };
  }

  /**
   * Calculate overhead percentage
   */
  private calculateOverheadPercent(totalTime: number, generatorTime: number): number {
    if (generatorTime === 0) return 0;
    return ((totalTime - generatorTime) / generatorTime) * 100;
  }

  /**
   * Validate performance budgets
   */
  private validatePerformanceBudgets(playbookRetrievalTime: number, overheadPercent: number): void {
    if (playbookRetrievalTime > this.config.performanceBudget.maxPlaybookRetrievalMs) {
      console.warn(`⚠️ Performance Budget Violation: Playbook retrieval ${playbookRetrievalTime}ms > ${this.config.performanceBudget.maxPlaybookRetrievalMs}ms`);
    }
    
    if (overheadPercent > this.config.performanceBudget.maxOverheadPercent) {
      console.warn(`⚠️ Performance Budget Violation: Overhead ${overheadPercent.toFixed(1)}% > ${this.config.performanceBudget.maxOverheadPercent}%`);
    }
  }

  /**
   * Create fallback generator result
   */
  private createFallbackGeneratorResult(query: string, domain: string): GeneratorResult {
    return {
      strategy_used: {
        id: 'fallback',
        name: 'Fallback Strategy',
        description: 'Fallback strategy when generator is disabled',
        domain,
        template: 'Fallback template',
        success_rate: 0.5,
        usage_count: 0,
        last_used: new Date()
      },
      execution_trace: ['Generator disabled - using fallback'],
      confidence: 0.5,
      reasoning: 'Fallback reasoning',
      performance_metrics: {
        execution_time_ms: 0,
        tokens_used: 0,
        cost: 0
      }
    };
  }

  /**
   * Create fallback reflection result
   */
  private createFallbackReflectionResult(): ReflectionResult {
    return {
      insights: [],
      overall_assessment: {
        success_rate: 0.5,
        performance_score: 0.5,
        improvement_areas: ['Reflector disabled'],
        strengths: []
      },
      strategy_recommendations: []
    };
  }

  /**
   * Create fallback curation result
   */
  private createFallbackCurationResult(): CurationResult {
    return {
      bullets_added: [],
      bullets_updated: [],
      duplicates_found: 0,
      curation_time_ms: 0,
      playbook_stats: {
        total_bullets: 0,
        helpful_bullets: 0,
        harmful_bullets: 0,
        neutral_bullets: 0,
        last_updated: new Date()
      }
    };
  }

  /**
   * Create fallback system result
   */
  private createFallbackResult(query: string, domain: string, totalTime: number): PlaybookSystemResult {
    return {
      query,
      domain,
      generator_result: this.createFallbackGeneratorResult(query, domain),
      reflection_result: this.createFallbackReflectionResult(),
      curation_result: this.createFallbackCurationResult(),
      playbook_bullets: [],
      performance_metrics: {
        total_time_ms: totalTime,
        generator_time_ms: 0,
        reflection_time_ms: 0,
        curation_time_ms: 0,
        playbook_retrieval_ms: 0,
        overhead_percent: 0
      }
    };
  }

  /**
   * Get system performance metrics
   */
  getPerformanceMetrics(): Record<string, any> {
    const avgTotalTime = this.performanceHistory.length > 0 
      ? this.performanceHistory.reduce((sum, time) => sum + time, 0) / this.performanceHistory.length 
      : 0;
    
    const avgPlaybookRetrievalTime = this.playbookRetrievalHistory.length > 0
      ? this.playbookRetrievalHistory.reduce((sum, time) => sum + time, 0) / this.playbookRetrievalHistory.length
      : 0;
    
    const p50PlaybookRetrieval = this.playbookRetrievalHistory.length > 0
      ? this.playbookRetrievalHistory.sort((a, b) => a - b)[Math.floor(this.playbookRetrievalHistory.length * 0.5)]
      : 0;
    
    return {
      avg_total_time_ms: avgTotalTime,
      avg_playbook_retrieval_ms: avgPlaybookRetrievalTime,
      p50_playbook_retrieval_ms: p50PlaybookRetrieval,
      performance_budget_compliance: {
        playbook_retrieval: p50PlaybookRetrieval <= this.config.performanceBudget.maxPlaybookRetrievalMs,
        max_playbook_retrieval_ms: this.config.performanceBudget.maxPlaybookRetrievalMs,
        max_overhead_percent: this.config.performanceBudget.maxOverheadPercent
      },
      system_config: this.config,
      generator_metrics: acePlaybookGenerator.getStrategyMetrics(),
      reflector_metrics: acePlaybookReflector.getPerformanceMetrics(),
      curator_metrics: acePlaybookCurator.getCuratorMetrics()
    };
  }

  /**
   * Update system configuration
   */
  updateConfig(newConfig: Partial<PlaybookSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 ACE Playbook System: Configuration updated');
  }
}

// Export singleton instance
export const acePlaybookSystem = new ACEPlaybookSystem();
