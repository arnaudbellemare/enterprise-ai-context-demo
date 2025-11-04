/**
 * Wu Wei Metrics System
 * 
 * Based on Daoist Cybernetics: "Wu wei (non-action) - minimal intervention,
 * with feedback frameworks for self-regulation"
 * 
 * Tracks intervention frequency and measures success of non-intervention.
 */

export interface InterventionLog {
  id: string;
  timestamp: Date;
  type: string; // 'rate_limit', 'circuit_breaker', 'fallback', 'manual', etc.
  necessary: boolean; // Was intervention actually needed?
  outcome: 'success' | 'failure' | 'neutral';
  outcomeScore: number; // 0-1 score
  nonInterventionOutcome?: 'success' | 'failure'; // What would have happened without intervention?
  context: any;
  duration?: number; // How long did intervention last (ms)
}

export interface WuWeiMetrics {
  totalInterventions: number;
  necessaryInterventions: number;
  unnecessaryInterventions: number;
  nonInterventionSuccessRate: number;
  interventionSuccessRate: number;
  wuWeiScore: number; // (1 - intervention_rate) * non_intervention_success_rate
  interventionRate: number; // Interventions per time period
  lastCalculated: Date;
}

export class WuWeiMetricsTracker {
  private interventions: InterventionLog[] = [];
  private maxLogSize = 5000;
  private timeWindow = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Record an intervention
   */
  async recordIntervention(
    type: string,
    necessary: boolean,
    outcome: 'success' | 'failure' | 'neutral',
    outcomeScore: number,
    context: any = {},
    nonInterventionOutcome?: 'success' | 'failure',
    duration?: number
  ): Promise<InterventionLog> {
    const log: InterventionLog = {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      necessary,
      outcome,
      outcomeScore,
      nonInterventionOutcome,
      context,
      duration,
    };
    
    this.interventions.push(log);
    
    // Trim old interventions
    const cutoff = Date.now() - this.timeWindow;
    this.interventions = this.interventions.filter(i => i.timestamp.getTime() >= cutoff);
    
    // Trim if still too large
    if (this.interventions.length > this.maxLogSize) {
      this.interventions = this.interventions.slice(-this.maxLogSize);
    }
    
    return log;
  }
  
  /**
   * Record a non-intervention event (system handled itself)
   */
  async recordNonIntervention(
    type: string,
    outcome: 'success' | 'failure',
    context: any = {}
  ): Promise<void> {
    // Record as a "non-intervention" intervention
    await this.recordIntervention(
      `non_intervention_${type}`,
      false, // Not necessary
      outcome,
      outcome === 'success' ? 1.0 : 0.0,
      { ...context, wasNonIntervention: true }
    );
  }
  
  /**
   * Calculate Wu Wei metrics
   */
  calculateWuWeiMetrics(timeWindow?: number): WuWeiMetrics {
    const window = timeWindow || this.timeWindow;
    const cutoff = Date.now() - window;
    const recentInterventions = this.interventions.filter(
      i => i.timestamp.getTime() >= cutoff
    );
    
    const totalInterventions = recentInterventions.length;
    const necessaryInterventions = recentInterventions.filter(i => i.necessary).length;
    const unnecessaryInterventions = recentInterventions.filter(i => !i.necessary).length;
    
    // Calculate success rates
    const interventionSuccesses = recentInterventions.filter(
      i => i.necessary && i.outcome === 'success'
    ).length;
    const interventionSuccessRate = necessaryInterventions > 0
      ? interventionSuccesses / necessaryInterventions
      : 1.0;
    
    // Calculate non-intervention success rate
    const nonInterventions = recentInterventions.filter(
      i => !i.necessary || i.context?.wasNonIntervention
    );
    const nonInterventionSuccesses = nonInterventions.filter(
      i => i.outcome === 'success' || i.nonInterventionOutcome === 'success'
    ).length;
    const nonInterventionSuccessRate = nonInterventions.length > 0
      ? nonInterventionSuccesses / nonInterventions.length
      : 1.0;
    
    // Calculate intervention rate (interventions per hour)
    const hoursInWindow = window / (60 * 60 * 1000);
    const interventionRate = hoursInWindow > 0 ? totalInterventions / hoursInWindow : 0;
    
    // Wu Wei Score: (1 - normalized_intervention_rate) * non_intervention_success_rate
    // Lower intervention rate + higher non-intervention success = higher score
    const normalizedInterventionRate = Math.min(interventionRate / 10, 1.0); // Normalize to 0-1
    const wuWeiScore = (1 - normalizedInterventionRate) * nonInterventionSuccessRate;
    
    return {
      totalInterventions,
      necessaryInterventions,
      unnecessaryInterventions,
      nonInterventionSuccessRate,
      interventionSuccessRate,
      wuWeiScore,
      interventionRate,
      lastCalculated: new Date(),
    };
  }
  
  /**
   * Get intervention history
   */
  getInterventionHistory(limit: number = 100): InterventionLog[] {
    return this.interventions.slice(-limit).reverse();
  }
  
  /**
   * Get interventions by type
   */
  getInterventionsByType(type: string): InterventionLog[] {
    return this.interventions.filter(i => i.type === type);
  }
  
  /**
   * Get unnecessary interventions (should have been non-intervention)
   */
  getUnnecessaryInterventions(): InterventionLog[] {
    return this.interventions.filter(i => !i.necessary);
  }
  
  /**
   * Analyze intervention effectiveness
   */
  analyzeInterventionEffectiveness(): {
    mostEffective: string[];
    leastEffective: string[];
    unnecessaryTypes: string[];
  } {
    const byType = new Map<string, { total: number; successful: number; necessary: number }>();
    
    for (const intervention of this.interventions) {
      const stats = byType.get(intervention.type) || { total: 0, successful: 0, necessary: 0 };
      stats.total++;
      if (intervention.outcome === 'success') stats.successful++;
      if (intervention.necessary) stats.necessary++;
      byType.set(intervention.type, stats);
    }
    
    const effectiveness = Array.from(byType.entries()).map(([type, stats]) => ({
      type,
      successRate: stats.total > 0 ? stats.successful / stats.total : 0,
      necessityRate: stats.total > 0 ? stats.necessary / stats.total : 0,
      effectiveness: stats.total > 0 ? (stats.successful / stats.total) * (stats.necessary / stats.total) : 0,
    }));
    
    effectiveness.sort((a, b) => b.effectiveness - a.effectiveness);
    
    const mostEffective = effectiveness.slice(0, 5).map(e => e.type);
    const leastEffective = effectiveness.slice(-5).reverse().map(e => e.type);
    const unnecessaryTypes = effectiveness
      .filter(e => e.necessityRate < 0.3)
      .map(e => e.type);
    
    return {
      mostEffective,
      leastEffective,
      unnecessaryTypes,
    };
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.interventions = [];
  }
  
  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      interventions: this.interventions,
      metrics: this.calculateWuWeiMetrics(),
      analysis: this.analyzeInterventionEffectiveness(),
    }, null, 2);
  }
}

// Singleton instance
export const wuWeiMetrics = new WuWeiMetricsTracker();

