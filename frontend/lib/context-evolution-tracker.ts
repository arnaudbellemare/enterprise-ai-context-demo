import { ContextDelta, ContextQuality, EvolutionEvent } from './types';

export class ContextEvolutionTracker {
  private evolutionHistory: EvolutionEvent[] = [];
  private qualityHistory: ContextQuality[] = [];
  private driftThreshold: number = 0.3;
  private evolutionWindow: number = 10; // Track last 10 changes

  constructor() {
    // Clean up old history periodically
    setInterval(() => this.cleanupHistory(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Track context evolution event
   */
  async trackEvolution(event: {
    type: 'add' | 'remove' | 'update' | 'compress' | 'merge';
    bulletId: string;
    content?: string;
    metadata?: any;
    qualityBefore?: ContextQuality;
    qualityAfter?: ContextQuality;
  }): Promise<void> {
    const evolutionEvent: EvolutionEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      type: event.type,
      bulletId: event.bulletId,
      content: event.content || '',
      metadata: event.metadata || {},
      qualityBefore: event.qualityBefore,
      qualityAfter: event.qualityAfter,
      impact: this.calculateImpact(event.qualityBefore, event.qualityAfter)
    };

    this.evolutionHistory.push(evolutionEvent);
    
    // Keep only recent history
    if (this.evolutionHistory.length > this.evolutionWindow * 2) {
      this.evolutionHistory = this.evolutionHistory.slice(-this.evolutionWindow * 2);
    }

    console.log(`📈 Tracked evolution: ${event.type} for bullet ${event.bulletId}`);
  }

  /**
   * Track quality evolution
   */
  async trackQualityEvolution(quality: ContextQuality): Promise<void> {
    this.qualityHistory.push(quality);
    
    // Keep only recent quality history
    if (this.qualityHistory.length > 50) {
      this.qualityHistory = this.qualityHistory.slice(-50);
    }

    // Check for quality drift
    await this.checkQualityDrift();
  }

  /**
   * Check for context drift
   */
  private async checkQualityDrift(): Promise<void> {
    if (this.qualityHistory.length < 5) return;

    const recent = this.qualityHistory.slice(-5);
    const older = this.qualityHistory.slice(-10, -5);
    
    if (older.length === 0) return;

    const recentAvg = this.calculateAverageQuality(recent);
    const olderAvg = this.calculateAverageQuality(older);
    
    const drift = Math.abs(recentAvg - olderAvg);
    
    if (drift > this.driftThreshold) {
      console.warn(`⚠️ Context drift detected: ${drift.toFixed(3)} (threshold: ${this.driftThreshold})`);
      
      // Emit drift warning
      await this.trackEvolution({
        type: 'update',
        bulletId: 'drift_warning',
        content: `Context drift detected: ${drift.toFixed(3)}`,
        metadata: { drift, threshold: this.driftThreshold }
      });
    }
  }

  /**
   * Get evolution analytics
   */
  getEvolutionAnalytics(): {
    totalEvents: number;
    eventDistribution: Record<string, number>;
    qualityTrend: number[];
    driftWarnings: number;
    evolutionPatterns: string[];
    recommendations: string[];
  } {
    const eventDistribution: Record<string, number> = {};
    this.evolutionHistory.forEach(event => {
      eventDistribution[event.type] = (eventDistribution[event.type] || 0) + 1;
    });

    const qualityTrend = this.qualityHistory.map(q => q.relevance);
    const driftWarnings = this.evolutionHistory.filter(e => e.content.includes('drift')).length;
    
    const evolutionPatterns = this.identifyPatterns();
    const recommendations = this.generateRecommendations();

    return {
      totalEvents: this.evolutionHistory.length,
      eventDistribution,
      qualityTrend,
      driftWarnings,
      evolutionPatterns,
      recommendations
    };
  }

  /**
   * Identify evolution patterns
   */
  private identifyPatterns(): string[] {
    const patterns: string[] = [];
    
    // Check for frequent compression
    const compressionEvents = this.evolutionHistory.filter(e => e.type === 'compress');
    if (compressionEvents.length > this.evolutionHistory.length * 0.3) {
      patterns.push('Frequent context compression - consider increasing context window');
    }

    // Check for quality degradation
    if (this.qualityHistory.length >= 10) {
      const recent = this.qualityHistory.slice(-5);
      const older = this.qualityHistory.slice(-10, -5);
      const recentAvg = this.calculateAverageQuality(recent);
      const olderAvg = this.calculateAverageQuality(older);
      
      if (recentAvg < olderAvg * 0.9) {
        patterns.push('Quality degradation detected - review context management strategy');
      }
    }

    // Check for bullet type distribution
    const bulletTypes = this.evolutionHistory
      .filter(e => e.metadata.type)
      .map(e => e.metadata.type);
    
    const typeCounts: Record<string, number> = {};
    bulletTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const totalBullets = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
    Object.entries(typeCounts).forEach(([type, count]) => {
      const percentage = (count / totalBullets) * 100;
      if (percentage > 60) {
        patterns.push(`Over-reliance on ${type} bullets (${percentage.toFixed(1)}%)`);
      }
    });

    return patterns;
  }

  /**
   * Generate recommendations based on evolution patterns
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Calculate analytics directly without calling getEvolutionAnalytics to avoid recursion
    const eventDistribution: Record<string, number> = {};
    this.evolutionHistory.forEach(event => {
      eventDistribution[event.type] = (eventDistribution[event.type] || 0) + 1;
    });

    const totalEvents = this.evolutionHistory.length;
    const driftWarnings = this.evolutionHistory.filter(e => e.content.includes('drift')).length;
    const evolutionPatterns = this.identifyPatterns();

    // Context window recommendations
    if (eventDistribution.compress > totalEvents * 0.2) {
      recommendations.push('Consider increasing context window size to reduce compression frequency');
    }

    // Quality recommendations
    if (driftWarnings > 0) {
      recommendations.push('Implement context quality monitoring to prevent drift');
    }

    // Pattern-based recommendations
    if (evolutionPatterns.includes('Frequent context compression')) {
      recommendations.push('Optimize context bullet relevance scoring to reduce compression needs');
    }

    if (evolutionPatterns.includes('Quality degradation detected')) {
      recommendations.push('Review context management strategy and bullet selection criteria');
    }

    // Diversity recommendations
    const typeDistribution = this.getTypeDistribution();
    const typeEntries = Object.entries(typeDistribution);
    
    if (typeEntries.length > 0) {
      const dominantType = typeEntries.reduce((a, b) => 
        typeDistribution[a[0]] > typeDistribution[b[0]] ? a : b
      );

      if (typeDistribution[dominantType[0]] > 0.6) {
        recommendations.push(`Diversify context bullet types - currently dominated by ${dominantType[0]}`);
      }
    }

    return recommendations;
  }

  /**
   * Get type distribution
   */
  private getTypeDistribution(): Record<string, number> {
    const typeCounts: Record<string, number> = {};
    
    this.evolutionHistory.forEach(event => {
      if (event.metadata.type) {
        typeCounts[event.metadata.type] = (typeCounts[event.metadata.type] || 0) + 1;
      }
    });

    return typeCounts;
  }

  /**
   * Calculate impact of evolution event
   */
  private calculateImpact(qualityBefore?: ContextQuality, qualityAfter?: ContextQuality): number {
    if (!qualityBefore || !qualityAfter) return 0;

    const beforeScore = this.calculateOverallScore(qualityBefore);
    const afterScore = this.calculateOverallScore(qualityAfter);
    
    return afterScore - beforeScore;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(quality: ContextQuality): number {
    return (
      quality.relevance * 0.3 +
      quality.coherence * 0.2 +
      quality.completeness * 0.2 +
      quality.recency * 0.2 +
      quality.token_efficiency * 0.1
    );
  }

  /**
   * Calculate average quality
   */
  private calculateAverageQuality(qualities: ContextQuality[]): number {
    if (qualities.length === 0) return 0;
    
    return qualities.reduce((sum, q) => sum + this.calculateOverallScore(q), 0) / qualities.length;
  }

  /**
   * Get evolution timeline
   */
  getEvolutionTimeline(): {
    events: EvolutionEvent[];
    qualityPoints: { timestamp: Date; quality: number }[];
    trends: {
      relevance: number[];
      coherence: number[];
      completeness: number[];
      recency: number[];
    };
  } {
    const qualityPoints = this.qualityHistory.map((q, index) => ({
      timestamp: new Date(Date.now() - (this.qualityHistory.length - index) * 60000), // Approximate timestamps
      quality: this.calculateOverallScore(q)
    }));

    const trends = {
      relevance: this.qualityHistory.map(q => q.relevance),
      coherence: this.qualityHistory.map(q => q.coherence),
      completeness: this.qualityHistory.map(q => q.completeness),
      recency: this.qualityHistory.map(q => q.recency)
    };

    return {
      events: this.evolutionHistory,
      qualityPoints,
      trends
    };
  }

  /**
   * Clean up old history
   */
  private cleanupHistory(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    this.evolutionHistory = this.evolutionHistory.filter(event => 
      event.timestamp > cutoff
    );
    
    this.qualityHistory = this.qualityHistory.slice(-100); // Keep last 100 quality measurements
    
    console.log(`🧹 Cleaned up evolution history: ${this.evolutionHistory.length} events, ${this.qualityHistory.length} quality points`);
  }

  private generateId(): string {
    return `evol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get evolution summary
   */
  getEvolutionSummary(): {
    totalEvents: number;
    qualityImprovement: number;
    driftWarnings: number;
    topPatterns: string[];
    recommendations: string[];
  } {
    const analytics = this.getEvolutionAnalytics();
    
    const qualityImprovement = this.qualityHistory.length >= 2 
      ? this.calculateOverallScore(this.qualityHistory[this.qualityHistory.length - 1]) - 
        this.calculateOverallScore(this.qualityHistory[0])
      : 0;

    return {
      totalEvents: analytics.totalEvents,
      qualityImprovement,
      driftWarnings: analytics.driftWarnings,
      topPatterns: analytics.evolutionPatterns.slice(0, 3),
      recommendations: analytics.recommendations.slice(0, 3)
    };
  }
}
