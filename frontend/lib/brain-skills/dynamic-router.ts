/**
 * Dynamic Skill Router
 * Chooses optimal skill backend based on context
 * Based on vLLM MoE dynamic implementation selection patterns
 */

export interface SkillImplementation {
  name: string;
  qualityScore: number;
  costPerQuery: number;
  avgLatency: number;
  optimalComplexity: number;
  reliability: number;
  description: string;
}

export interface ImplementationScore {
  implementation: SkillImplementation;
  score: number;
  reasoning: string;
}

export class DynamicSkillRouter {
  private implementations: Map<string, SkillImplementation[]> = new Map();
  private performanceHistory: Map<string, Array<{ timestamp: number; latency: number; success: boolean }>> = new Map();

  constructor() {
    this.initializeImplementations();
  }

  private initializeImplementations(): void {
    // Kimi K2 implementations
    this.implementations.set('kimiK2', [
      {
        name: 'tongyi-deepresearch',
        qualityScore: 0.95,
        costPerQuery: 0.05,
        avgLatency: 2000,
        optimalComplexity: 8,
        reliability: 0.92,
        description: 'High-quality research model for complex queries'
      },
      {
        name: 'nvidia-nemotron',
        qualityScore: 0.90,
        costPerQuery: 0.02,
        avgLatency: 1500,
        optimalComplexity: 6,
        reliability: 0.88,
        description: 'Balanced performance and cost for medium complexity'
      },
      {
        name: 'gemini-flash',
        qualityScore: 0.85,
        costPerQuery: 0.01,
        avgLatency: 800,
        optimalComplexity: 4,
        reliability: 0.95,
        description: 'Fast and cheap for simple queries'
      }
    ]);

    // TRM Engine implementations
    this.implementations.set('trm', [
      {
        name: 'internal-reasoning',
        qualityScore: 0.88,
        costPerQuery: 0.001,
        avgLatency: 500,
        optimalComplexity: 5,
        reliability: 0.98,
        description: 'Internal reasoning engine for moderate complexity'
      },
      {
        name: 'advanced-reasoning',
        qualityScore: 0.95,
        costPerQuery: 0.005,
        avgLatency: 1200,
        optimalComplexity: 8,
        reliability: 0.90,
        description: 'Advanced reasoning for complex queries'
      }
    ]);

    // GEPA implementations
    this.implementations.set('gepa', [
      {
        name: 'fast-optimization',
        qualityScore: 0.80,
        costPerQuery: 0.01,
        avgLatency: 1000,
        optimalComplexity: 4,
        reliability: 0.95,
        description: 'Quick optimization for simple prompts'
      },
      {
        name: 'deep-optimization',
        qualityScore: 0.95,
        costPerQuery: 0.03,
        avgLatency: 3000,
        optimalComplexity: 8,
        reliability: 0.85,
        description: 'Deep optimization for complex prompts'
      }
    ]);

    // ACE implementations
    this.implementations.set('ace', [
      {
        name: 'basic-context',
        qualityScore: 0.85,
        costPerQuery: 0.002,
        avgLatency: 300,
        optimalComplexity: 3,
        reliability: 0.98,
        description: 'Basic context management for simple queries'
      },
      {
        name: 'advanced-context',
        qualityScore: 0.92,
        costPerQuery: 0.008,
        avgLatency: 800,
        optimalComplexity: 7,
        reliability: 0.90,
        description: 'Advanced context management for complex queries'
      }
    ]);

    // MoE Router implementations
    this.implementations.set('moeSkillRouter', [
      {
        name: 'balanced-routing',
        qualityScore: 0.88,
        costPerQuery: 0.001,
        avgLatency: 200,
        optimalComplexity: 5,
        reliability: 0.95,
        description: 'Balanced routing for moderate complexity'
      },
      {
        name: 'precision-routing',
        qualityScore: 0.95,
        costPerQuery: 0.003,
        avgLatency: 500,
        optimalComplexity: 8,
        reliability: 0.90,
        description: 'Precision routing for complex queries'
      }
    ]);

    // Initialize performance history
    this.implementations.forEach((impls, skillName) => {
      this.performanceHistory.set(skillName, []);
    });
  }

  selectOptimalImplementation(
    skillName: string,
    context: any
  ): SkillImplementation {
    const implementations = this.getAvailableImplementations(skillName);
    
    if (implementations.length === 0) {
      throw new Error(`No implementations available for skill: ${skillName}`);
    }

    if (implementations.length === 1) {
      return implementations[0];
    }

    // Score each implementation
    const scored = implementations.map(impl => ({
      impl,
      score: this.scoreImplementation(impl, context),
      reasoning: this.generateReasoning(impl, context)
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);
    
    const selected = scored[0];
    console.log(`🎯 Selected ${selected.impl.name} for ${skillName} (score: ${selected.score.toFixed(2)})`);
    console.log(`   Reasoning: ${selected.reasoning}`);

    return selected.impl;
  }

  private scoreImplementation(
    impl: SkillImplementation,
    context: any
  ): number {
    let score = 0;

    // 1. Quality requirement (must meet minimum quality)
    const requiredQuality = context.requiredQuality || 0.8;
    if (impl.qualityScore < requiredQuality) {
      return 0; // Doesn't meet minimum quality
    }
    score += impl.qualityScore * 100; // Quality is most important

    // 2. Cost efficiency (inverse relationship)
    const costScore = (1 / (impl.costPerQuery + 0.001)) * 10;
    score += costScore;

    // 3. Speed bonus (inverse relationship with latency)
    const speedScore = (1000 / (impl.avgLatency + 100)) * 5;
    score += speedScore;

    // 4. Complexity alignment
    const complexityDiff = Math.abs(impl.optimalComplexity - (context.complexity || 5));
    const complexityScore = Math.max(0, 20 - complexityDiff * 2);
    score += complexityScore;

    // 5. Reliability bonus
    score += impl.reliability * 15;

    // 6. Historical performance (if available)
    const historicalScore = this.getHistoricalPerformanceScore(impl.name);
    score += historicalScore * 10;

    // 7. Context-specific bonuses
    if (context.domain && impl.description.toLowerCase().includes(context.domain)) {
      score += 5; // Domain-specific bonus
    }

    if (context.budget && impl.costPerQuery <= context.budget) {
      score += 3; // Budget compliance bonus
    }

    return score;
  }

  private generateReasoning(impl: SkillImplementation, context: any): string {
    const reasons: string[] = [];
    
    if (impl.qualityScore >= 0.9) {
      reasons.push('high quality');
    }
    
    if (impl.costPerQuery <= 0.01) {
      reasons.push('cost effective');
    }
    
    if (impl.avgLatency <= 1000) {
      reasons.push('fast response');
    }
    
    const complexityDiff = Math.abs(impl.optimalComplexity - (context.complexity || 5));
    if (complexityDiff <= 1) {
      reasons.push('complexity match');
    }
    
    if (impl.reliability >= 0.9) {
      reasons.push('reliable');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'default selection';
  }

  private getAvailableImplementations(skillName: string): SkillImplementation[] {
    return this.implementations.get(skillName) || [];
  }

  private getHistoricalPerformanceScore(implName: string): number {
    // This would typically look up historical performance data
    // For now, return a neutral score
    return 0.5;
  }

  // Record performance for learning
  recordPerformance(
    skillName: string,
    implName: string,
    latency: number,
    success: boolean
  ): void {
    const history = this.performanceHistory.get(skillName) || [];
    history.push({
      timestamp: Date.now(),
      latency,
      success
    });

    // Keep only last 100 records
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.performanceHistory.set(skillName, history);
  }

  // Get performance analytics
  getPerformanceAnalytics(skillName: string): {
    avgLatency: number;
    successRate: number;
    totalRequests: number;
  } {
    const history = this.performanceHistory.get(skillName) || [];
    
    if (history.length === 0) {
      return { avgLatency: 0, successRate: 0, totalRequests: 0 };
    }

    const totalRequests = history.length;
    const successfulRequests = history.filter(h => h.success).length;
    const avgLatency = history.reduce((sum, h) => sum + h.latency, 0) / totalRequests;
    const successRate = successfulRequests / totalRequests;

    return {
      avgLatency: Math.round(avgLatency),
      successRate: Math.round(successRate * 100) / 100,
      totalRequests
    };
  }

  // Get all implementations for a skill
  getAllImplementations(skillName: string): SkillImplementation[] {
    return this.getAvailableImplementations(skillName);
  }

  // Get implementation by name
  getImplementation(skillName: string, implName: string): SkillImplementation | null {
    const implementations = this.getAvailableImplementations(skillName);
    return implementations.find(impl => impl.name === implName) || null;
  }

  // Add custom implementation
  addImplementation(skillName: string, implementation: SkillImplementation): void {
    const implementations = this.getAvailableImplementations(skillName);
    implementations.push(implementation);
    this.implementations.set(skillName, implementations);
  }

  // Remove implementation
  removeImplementation(skillName: string, implName: string): boolean {
    const implementations = this.getAvailableImplementations(skillName);
    const index = implementations.findIndex(impl => impl.name === implName);
    
    if (index !== -1) {
      implementations.splice(index, 1);
      this.implementations.set(skillName, implementations);
      return true;
    }
    
    return false;
  }

  // Get recommendations for optimization
  getOptimizationRecommendations(skillName: string, context: any): string[] {
    const recommendations: string[] = [];
    const implementations = this.getAvailableImplementations(skillName);
    
    if (implementations.length === 0) {
      recommendations.push(`No implementations available for ${skillName}`);
      return recommendations;
    }

    // Check for cost optimization opportunities
    const expensiveImpls = implementations.filter(impl => impl.costPerQuery > 0.02);
    if (expensiveImpls.length > 0 && context.budget < 0.02) {
      recommendations.push(`Consider cheaper implementations for ${skillName} (budget: $${context.budget})`);
    }

    // Check for latency optimization
    const slowImpls = implementations.filter(impl => impl.avgLatency > 2000);
    if (slowImpls.length > 0 && context.requiresRealTime) {
      recommendations.push(`Consider faster implementations for ${skillName} (real-time required)`);
    }

    // Check for quality optimization
    const lowQualityImpls = implementations.filter(impl => impl.qualityScore < 0.9);
    if (lowQualityImpls.length > 0 && context.requiredQuality > 0.9) {
      recommendations.push(`Consider higher quality implementations for ${skillName} (quality required: ${context.requiredQuality})`);
    }

    return recommendations;
  }
}

// Singleton instance
let dynamicRouterInstance: DynamicSkillRouter | null = null;

export function getDynamicSkillRouter(): DynamicSkillRouter {
  if (!dynamicRouterInstance) {
    dynamicRouterInstance = new DynamicSkillRouter();
  }
  return dynamicRouterInstance;
}
