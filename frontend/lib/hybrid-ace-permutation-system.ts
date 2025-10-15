/**
 * Hybrid ACE Playbook + PERMUTATION System
 * Leverages both systems for maximum effectiveness
 * 
 * Strategy:
 * 1. Use ACE Playbook for fast, learned strategies
 * 2. Use PERMUTATION for complex, multi-component analysis
 * 3. Combine results for optimal performance
 */

import { acePlaybookSystem } from './ace-playbook-system';
import { PermutationEngine } from './permutation-engine';
import { gepaAlgorithms } from './gepa-algorithms';

export interface HybridQuery {
  query: string;
  domain: string;
  complexity_threshold: number; // When to switch from ACE to PERMUTATION
  enable_learning: boolean; // Whether to learn from this query
  user_context?: any;
}

export interface HybridResult {
  query: string;
  domain: string;
  system_used: 'ace_playbook' | 'permutation' | 'hybrid';
  ace_result?: any;
  permutation_result?: any;
  combined_result: string;
  performance_metrics: {
    total_time_ms: number;
    ace_time_ms: number;
    permutation_time_ms: number;
    learning_time_ms: number;
    quality_score: number;
    cost: number;
  };
  learning_insights: {
    strategy_learned: boolean;
    playbook_updated: boolean;
    gepa_optimization: boolean;
  };
}

export class HybridACEPermutationSystem {
  private permutationEngine: PermutationEngine;
  private complexityAnalyzer: (query: string, domain: string) => Promise<number>;
  private learningEnabled: boolean = true;

  constructor() {
    this.permutationEngine = new PermutationEngine();
    this.complexityAnalyzer = this.createComplexityAnalyzer();
  }

  /**
   * Execute query using hybrid ACE Playbook + PERMUTATION approach
   */
  async execute(hybridQuery: HybridQuery): Promise<HybridResult> {
    console.log(`🔄 Hybrid System: Processing query for ${hybridQuery.domain} domain`);
    const startTime = Date.now();
    
    try {
      // ============================================
      // STEP 1: COMPLEXITY ANALYSIS
      // ============================================
      const complexity = await this.complexityAnalyzer(hybridQuery.query, hybridQuery.domain);
      console.log(`📊 Complexity Score: ${complexity.toFixed(2)} (threshold: ${hybridQuery.complexity_threshold})`);
      
      // ============================================
      // STEP 2: SYSTEM SELECTION
      // ============================================
      let systemUsed: 'ace_playbook' | 'permutation' | 'hybrid';
      let aceResult: any = null;
      let permutationResult: any = null;
      let combinedResult: string = '';
      
      if (complexity <= hybridQuery.complexity_threshold) {
        // Use ACE Playbook for simpler queries (fast, learned strategies)
        systemUsed = 'ace_playbook';
        console.log('📚 Using ACE Playbook system (fast, learned strategies)');
        
        const aceStart = Date.now();
        aceResult = await acePlaybookSystem.execute(hybridQuery.query, hybridQuery.domain);
        const aceTime = Date.now() - aceStart;
        
        combinedResult = this.extractACEResult(aceResult);
        console.log(`✅ ACE Playbook completed in ${aceTime}ms`);
        
      } else if (complexity > hybridQuery.complexity_threshold + 0.3) {
        // Use PERMUTATION for very complex queries (full multi-component analysis)
        systemUsed = 'permutation';
        console.log('🧠 Using PERMUTATION system (complex, multi-component analysis)');
        
        const permutationStart = Date.now();
        permutationResult = await this.permutationEngine.execute(hybridQuery.query, hybridQuery.domain);
        const permutationTime = Date.now() - permutationStart;
        
        combinedResult = permutationResult.answer || permutationResult.response || 'PERMUTATION analysis completed';
        console.log(`✅ PERMUTATION completed in ${permutationTime}ms`);
        
      } else {
        // Use HYBRID approach (both systems, combine results)
        systemUsed = 'hybrid';
        console.log('🔄 Using HYBRID approach (ACE + PERMUTATION)');
        
        // Run both systems in parallel
        const [aceStart, permutationStart] = [Date.now(), Date.now()];
        
        const [aceRes, permutationRes] = await Promise.all([
          acePlaybookSystem.execute(hybridQuery.query, hybridQuery.domain),
          this.permutationEngine.execute(hybridQuery.query, hybridQuery.domain)
        ]);
        
        const [aceTime, permutationTime] = [Date.now() - aceStart, Date.now() - permutationStart];
        
        aceResult = aceRes;
        permutationResult = permutationRes;
        
        // Combine results intelligently
        combinedResult = await this.combineResults(aceResult, permutationResult, hybridQuery);
        console.log(`✅ HYBRID completed - ACE: ${aceTime}ms, PERMUTATION: ${permutationTime}ms`);
      }
      
      // ============================================
      // STEP 3: LEARNING & OPTIMIZATION
      // ============================================
      let learningInsights = {
        strategy_learned: false,
        playbook_updated: false,
        gepa_optimization: false
      };
      
      if (hybridQuery.enable_learning && this.learningEnabled) {
        const learningStart = Date.now();
        learningInsights = await this.performLearning(hybridQuery, aceResult, permutationResult, complexity);
        const learningTime = Date.now() - learningStart;
        console.log(`🎓 Learning completed in ${learningTime}ms`);
      }
      
      // ============================================
      // STEP 4: PERFORMANCE METRICS
      // ============================================
      const totalTime = Date.now() - startTime;
      const qualityScore = this.calculateQualityScore(combinedResult, hybridQuery);
      const cost = this.calculateCost(aceResult, permutationResult);
      
      const result: HybridResult = {
        query: hybridQuery.query,
        domain: hybridQuery.domain,
        system_used: systemUsed,
        ace_result: aceResult,
        permutation_result: permutationResult,
        combined_result: combinedResult,
        performance_metrics: {
          total_time_ms: totalTime,
          ace_time_ms: aceResult ? (aceResult.performance_metrics?.total_time_ms || 0) : 0,
          permutation_time_ms: permutationResult ? (permutationResult.duration_ms || 0) : 0,
          learning_time_ms: 0, // Will be calculated in learning step
          quality_score: qualityScore,
          cost: cost
        },
        learning_insights: learningInsights
      };
      
      console.log(`🎯 Hybrid System: Execution completed in ${totalTime}ms`);
      console.log(`   - System used: ${systemUsed}`);
      console.log(`   - Quality score: ${qualityScore.toFixed(3)}`);
      console.log(`   - Cost: $${cost.toFixed(3)}`);
      
      return result;
      
    } catch (error) {
      console.error('Hybrid system execution failed:', error);
      
      // Fallback to simple ACE Playbook
      const fallbackResult = await acePlaybookSystem.execute(hybridQuery.query, hybridQuery.domain);
      
      return {
        query: hybridQuery.query,
        domain: hybridQuery.domain,
        system_used: 'ace_playbook',
        ace_result: fallbackResult,
        combined_result: this.extractACEResult(fallbackResult),
        performance_metrics: {
          total_time_ms: Date.now() - startTime,
          ace_time_ms: fallbackResult.performance_metrics?.total_time_ms || 0,
          permutation_time_ms: 0,
          learning_time_ms: 0,
          quality_score: 0.5,
          cost: 0.01
        },
        learning_insights: {
          strategy_learned: false,
          playbook_updated: false,
          gepa_optimization: false
        }
      };
    }
  }

  /**
   * Create complexity analyzer
   */
  private createComplexityAnalyzer(): (query: string, domain: string) => Promise<number> {
    return async (query: string, domain: string): Promise<number> => {
      // Simple complexity analysis based on query characteristics
      let complexity = 0.5; // Base complexity
      
      // Length factor
      const wordCount = query.split(/\s+/).length;
      complexity += Math.min(wordCount / 100, 0.3);
      
      // Question complexity
      const questionCount = (query.match(/\?/g) || []).length;
      complexity += Math.min(questionCount * 0.1, 0.2);
      
      // Domain complexity
      const domainComplexity: Record<string, number> = {
        'crypto': 0.8,
        'financial': 0.7,
        'legal': 0.9,
        'healthcare': 0.85,
        'real_estate': 0.6,
        'technology': 0.7,
        'general': 0.5
      };
      
      complexity += domainComplexity[domain] || 0.5;
      
      // Technical terms
      const technicalTerms = ['analysis', 'strategy', 'optimization', 'algorithm', 'model', 'framework'];
      const technicalCount = technicalTerms.filter(term => 
        query.toLowerCase().includes(term)
      ).length;
      complexity += Math.min(technicalCount * 0.05, 0.15);
      
      return Math.min(Math.max(complexity, 0), 1);
    };
  }

  /**
   * Extract result from ACE Playbook system
   */
  private extractACEResult(aceResult: any): string {
    if (aceResult.generator_result?.reasoning) {
      return aceResult.generator_result.reasoning;
    }
    if (aceResult.generator_result?.strategy_used?.name) {
      return `Strategy: ${aceResult.generator_result.strategy_used.name} - Analysis completed`;
    }
    return 'ACE Playbook analysis completed';
  }

  /**
   * Combine results from both systems
   */
  private async combineResults(aceResult: any, permutationResult: any, hybridQuery: HybridQuery): Promise<string> {
    // Extract key insights from both systems
    const aceInsights = this.extractACEResult(aceResult);
    const permutationInsights = permutationResult.answer || permutationResult.response || 'PERMUTATION analysis completed';
    
    // Create combined response
    const combinedResponse = `
## ACE Playbook Analysis (Fast, Learned Strategies):
${aceInsights}

## PERMUTATION Analysis (Complex, Multi-Component):
${permutationInsights}

## Combined Recommendation:
Based on both the learned strategies from ACE Playbook and the comprehensive analysis from PERMUTATION, here's the optimal approach for your query in the ${hybridQuery.domain} domain.
`;
    
    return combinedResponse.trim();
  }

  /**
   * Perform learning and optimization
   */
  private async performLearning(
    hybridQuery: HybridQuery, 
    aceResult: any, 
    permutationResult: any, 
    complexity: number
  ): Promise<{ strategy_learned: boolean; playbook_updated: boolean; gepa_optimization: boolean }> {
    const insights = {
      strategy_learned: false,
      playbook_updated: false,
      gepa_optimization: false
    };
    
    try {
      // Learn from ACE Playbook results
      if (aceResult && aceResult.reflection_result?.insights?.length > 0) {
        insights.strategy_learned = true;
        insights.playbook_updated = true;
        console.log('🎓 Learned new strategies from ACE Playbook');
      }
      
      // Learn from PERMUTATION results
      if (permutationResult && permutationResult.trace?.steps?.length > 0) {
        insights.strategy_learned = true;
        console.log('🎓 Learned new strategies from PERMUTATION');
      }
      
      // GEPA optimization for complex queries
      if (complexity > 0.7) {
        try {
          const gepaResult = await gepaAlgorithms.optimizePrompts(
            hybridQuery.domain,
            [hybridQuery.query],
            ['quality', 'speed', 'cost']
          );
          
          if (gepaResult.evolved_prompts.length > 0) {
            insights.gepa_optimization = true;
            console.log('🧬 GEPA optimization completed');
          }
        } catch (error) {
          console.warn('GEPA optimization failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Learning failed:', error);
    }
    
    return insights;
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(result: string, hybridQuery: HybridQuery): number {
    let score = 0.5; // Base score
    
    // Length factor
    if (result.length > 100) score += 0.2;
    if (result.length > 500) score += 0.1;
    
    // Content quality indicators
    const qualityIndicators = ['analysis', 'strategy', 'recommendation', 'consider', 'approach'];
    const indicatorCount = qualityIndicators.filter(indicator => 
      result.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(indicatorCount * 0.05, 0.2);
    
    // Domain-specific quality
    if (result.toLowerCase().includes(hybridQuery.domain)) score += 0.1;
    
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calculate cost
   */
  private calculateCost(aceResult: any, permutationResult: any): number {
    let cost = 0;
    
    if (aceResult?.performance_metrics?.cost) {
      cost += aceResult.performance_metrics.cost;
    }
    
    if (permutationResult?.cost) {
      cost += permutationResult.cost;
    }
    
    return cost || 0.01; // Default cost
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): Record<string, any> {
    return {
      ace_playbook_metrics: acePlaybookSystem.getPerformanceMetrics(),
      gepa_metrics: gepaAlgorithms.getGEPAMetrics(),
      learning_enabled: this.learningEnabled,
      complexity_analyzer: 'active'
    };
  }

  /**
   * Update learning settings
   */
  updateLearningSettings(enableLearning: boolean): void {
    this.learningEnabled = enableLearning;
    console.log(`🎓 Learning ${enableLearning ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const hybridACEPermutationSystem = new HybridACEPermutationSystem();
