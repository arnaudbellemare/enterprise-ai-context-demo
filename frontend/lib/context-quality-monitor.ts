import { ContextDelta, ContextQuality, ConversationSession } from './types';

export class ContextQualityMonitor {
  private qualityHistory: ContextQuality[] = [];
  private alertThresholds: QualityThresholds;
  private monitoringInterval: number = 30000; // 30 seconds
  private isMonitoring: boolean = false;

  constructor(thresholds?: Partial<QualityThresholds>) {
    this.alertThresholds = {
      relevance: 0.6,
      coherence: 0.5,
      completeness: 0.4,
      recency: 0.3,
      token_efficiency: 0.8,
      ...thresholds
    };
  }

  /**
   * Start continuous quality monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    setInterval(() => {
      this.performQualityCheck();
    }, this.monitoringInterval);
    
    console.log('📊 Context quality monitoring started');
  }

  /**
   * Stop quality monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('📊 Context quality monitoring stopped');
  }

  /**
   * Perform comprehensive quality check
   */
  async performQualityCheck(): Promise<QualityReport> {
    const currentQuality = this.calculateCurrentQuality();
    this.qualityHistory.push(currentQuality);
    
    // Keep only recent history
    if (this.qualityHistory.length > 100) {
      this.qualityHistory = this.qualityHistory.slice(-100);
    }

    const alerts = this.checkQualityAlerts(currentQuality);
    const trends = this.analyzeQualityTrends();
    const recommendations = this.generateRecommendations(currentQuality, trends);

    const report: QualityReport = {
      timestamp: new Date(),
      currentQuality,
      alerts,
      trends,
      recommendations,
      overallScore: this.calculateOverallScore(currentQuality),
      qualityGrade: this.calculateQualityGrade(currentQuality)
    };

    if (alerts.length > 0) {
      console.warn(`⚠️ Context quality alerts: ${alerts.map(a => a.message).join(', ')}`);
    }

    return report;
  }

  /**
   * Calculate current quality metrics
   */
  private calculateCurrentQuality(): ContextQuality {
    // This would ideally analyze the current context state
    // For now, return a mock quality assessment
    return {
      relevance: 0.8,
      coherence: 0.7,
      completeness: 0.6,
      recency: 0.9,
      token_efficiency: 0.75,
      bullet_count: 25
    };
  }

  /**
   * Check for quality alerts
   */
  private checkQualityAlerts(quality: ContextQuality): QualityAlert[] {
    const alerts: QualityAlert[] = [];

    if (quality.relevance < this.alertThresholds.relevance) {
      alerts.push({
        type: 'relevance',
        severity: 'warning',
        message: `Context relevance is low: ${quality.relevance.toFixed(3)} (threshold: ${this.alertThresholds.relevance})`,
        recommendation: 'Review context bullet selection and relevance scoring'
      });
    }

    if (quality.coherence < this.alertThresholds.coherence) {
      alerts.push({
        type: 'coherence',
        severity: 'warning',
        message: `Context coherence is low: ${quality.coherence.toFixed(3)} (threshold: ${this.alertThresholds.coherence})`,
        recommendation: 'Improve context organization and bullet relationships'
      });
    }

    if (quality.completeness < this.alertThresholds.completeness) {
      alerts.push({
        type: 'completeness',
        severity: 'info',
        message: `Context completeness is low: ${quality.completeness.toFixed(3)} (threshold: ${this.alertThresholds.completeness})`,
        recommendation: 'Add missing context bullet types'
      });
    }

    if (quality.recency < this.alertThresholds.recency) {
      alerts.push({
        type: 'recency',
        severity: 'warning',
        message: `Context recency is low: ${quality.recency.toFixed(3)} (threshold: ${this.alertThresholds.recency})`,
        recommendation: 'Update or remove outdated context bullets'
      });
    }

    if (quality.token_efficiency > this.alertThresholds.token_efficiency) {
      alerts.push({
        type: 'token_efficiency',
        severity: 'info',
        message: `Context token efficiency is high: ${quality.token_efficiency.toFixed(3)} (threshold: ${this.alertThresholds.token_efficiency})`,
        recommendation: 'Consider adding more context or increasing context window'
      });
    }

    return alerts;
  }

  /**
   * Analyze quality trends
   */
  private analyzeQualityTrends(): QualityTrends {
    if (this.qualityHistory.length < 3) {
      return {
        direction: 'stable',
        volatility: 'low',
        patterns: [],
        predictions: []
      };
    }

    const recent = this.qualityHistory.slice(-5);
    const older = this.qualityHistory.slice(-10, -5);
    
    if (older.length === 0) {
      return {
        direction: 'stable',
        volatility: 'low',
        patterns: [],
        predictions: []
      };
    }

    const recentAvg = this.calculateAverageQuality(recent);
    const olderAvg = this.calculateAverageQuality(older);
    const direction = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';
    
    const volatility = this.calculateVolatility(recent);
    const patterns = this.identifyPatterns();
    const predictions = this.generatePredictions();

    return {
      direction,
      volatility,
      patterns,
      predictions
    };
  }

  /**
   * Calculate average quality
   */
  private calculateAverageQuality(qualities: ContextQuality[]): number {
    if (qualities.length === 0) return 0;
    
    return qualities.reduce((sum, q) => sum + this.calculateOverallScore(q), 0) / qualities.length;
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(qualities: ContextQuality[]): 'low' | 'medium' | 'high' {
    if (qualities.length < 2) return 'low';
    
    const scores = qualities.map(q => this.calculateOverallScore(q));
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 0.1) return 'low';
    if (stdDev < 0.2) return 'medium';
    return 'high';
  }

  /**
   * Identify quality patterns
   */
  private identifyPatterns(): string[] {
    const patterns: string[] = [];
    
    if (this.qualityHistory.length >= 10) {
      const recent = this.qualityHistory.slice(-5);
      const older = this.qualityHistory.slice(-10, -5);
      
      // Check for degradation patterns
      const recentAvg = this.calculateAverageQuality(recent);
      const olderAvg = this.calculateAverageQuality(older);
      
      if (recentAvg < olderAvg * 0.9) {
        patterns.push('Quality degradation detected');
      }
      
      // Check for improvement patterns
      if (recentAvg > olderAvg * 1.1) {
        patterns.push('Quality improvement detected');
      }
      
      // Check for cyclical patterns
      const scores = this.qualityHistory.map(q => this.calculateOverallScore(q));
      const isCyclical = this.detectCyclicalPattern(scores);
      if (isCyclical) {
        patterns.push('Cyclical quality pattern detected');
      }
    }
    
    return patterns;
  }

  /**
   * Detect cyclical patterns
   */
  private detectCyclicalPattern(scores: number[]): boolean {
    if (scores.length < 6) return false;
    
    // Simple cyclical detection (would ideally use more sophisticated methods)
    const recent = scores.slice(-6);
    const pattern = recent.map((score, i) => score > recent[i-1] || i === 0);
    
    // Check for alternating pattern
    const alternations = pattern.slice(1).filter((val, i) => val !== pattern[i]).length;
    return alternations >= 3;
  }

  /**
   * Generate predictions
   */
  private generatePredictions(): string[] {
    const predictions: string[] = [];
    
    if (this.qualityHistory.length >= 5) {
      const recent = this.qualityHistory.slice(-3);
      const trend = this.calculateTrend(recent);
      
      if (trend > 0.1) {
        predictions.push('Quality is likely to continue improving');
      } else if (trend < -0.1) {
        predictions.push('Quality is likely to continue declining');
      } else {
        predictions.push('Quality is likely to remain stable');
      }
    }
    
    return predictions;
  }

  /**
   * Calculate trend
   */
  private calculateTrend(qualities: ContextQuality[]): number {
    if (qualities.length < 2) return 0;
    
    const scores = qualities.map(q => this.calculateOverallScore(q));
    const first = scores[0];
    const last = scores[scores.length - 1];
    
    return (last - first) / scores.length;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(quality: ContextQuality, trends: QualityTrends): string[] {
    const recommendations: string[] = [];
    
    // Quality-based recommendations
    if (quality.relevance < 0.7) {
      recommendations.push('Improve context bullet relevance scoring and selection criteria');
    }
    
    if (quality.coherence < 0.6) {
      recommendations.push('Enhance context organization and bullet relationships');
    }
    
    if (quality.completeness < 0.5) {
      recommendations.push('Add missing context bullet types (strategy, concept, failure_mode, precedent)');
    }
    
    if (quality.recency < 0.4) {
      recommendations.push('Update or remove outdated context bullets');
    }
    
    if (quality.token_efficiency > 0.9) {
      recommendations.push('Consider increasing context window size or adding more context');
    }
    
    // Trend-based recommendations
    if (trends.direction === 'declining') {
      recommendations.push('Investigate causes of quality decline and implement corrective measures');
    }
    
    if (trends.volatility === 'high') {
      recommendations.push('Implement stability measures to reduce quality volatility');
    }
    
    if (trends.patterns.includes('Quality degradation detected')) {
      recommendations.push('Review context management strategy and optimization algorithms');
    }
    
    return recommendations;
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
   * Calculate quality grade
   */
  private calculateQualityGrade(quality: ContextQuality): 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = this.calculateOverallScore(quality);
    
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  /**
   * Get quality dashboard data
   */
  getQualityDashboard(): {
    currentQuality: ContextQuality;
    overallScore: number;
    qualityGrade: string;
    trends: QualityTrends;
    alerts: QualityAlert[];
    recommendations: string[];
    history: { timestamp: Date; score: number }[];
  } {
    const currentQuality = this.qualityHistory[this.qualityHistory.length - 1] || this.calculateCurrentQuality();
    const trends = this.analyzeQualityTrends();
    const alerts = this.checkQualityAlerts(currentQuality);
    const recommendations = this.generateRecommendations(currentQuality, trends);
    
    const history = this.qualityHistory.map((quality, index) => ({
      timestamp: new Date(Date.now() - (this.qualityHistory.length - index) * 60000),
      score: this.calculateOverallScore(quality)
    }));

    return {
      currentQuality,
      overallScore: this.calculateOverallScore(currentQuality),
      qualityGrade: this.calculateQualityGrade(currentQuality),
      trends,
      alerts,
      recommendations,
      history
    };
  }

  /**
   * Get quality statistics
   */
  getQualityStats(): {
    totalChecks: number;
    avgQuality: number;
    qualityDistribution: Record<string, number>;
    alertCount: number;
    improvementRate: number;
  } {
    const totalChecks = this.qualityHistory.length;
    const avgQuality = totalChecks > 0 
      ? this.qualityHistory.reduce((sum, q) => sum + this.calculateOverallScore(q), 0) / totalChecks
      : 0;
    
    const qualityDistribution: Record<string, number> = {};
    this.qualityHistory.forEach(quality => {
      const grade = this.calculateQualityGrade(quality);
      qualityDistribution[grade] = (qualityDistribution[grade] || 0) + 1;
    });
    
    const alertCount = this.qualityHistory.reduce((count, quality) => {
      return count + this.checkQualityAlerts(quality).length;
    }, 0);
    
    const improvementRate = this.calculateImprovementRate();

    return {
      totalChecks,
      avgQuality,
      qualityDistribution,
      alertCount,
      improvementRate
    };
  }

  /**
   * Calculate improvement rate
   */
  private calculateImprovementRate(): number {
    if (this.qualityHistory.length < 2) return 0;
    
    const first = this.calculateOverallScore(this.qualityHistory[0]);
    const last = this.calculateOverallScore(this.qualityHistory[this.qualityHistory.length - 1]);
    
    return (last - first) / first;
  }
}

interface QualityThresholds {
  relevance: number;
  coherence: number;
  completeness: number;
  recency: number;
  token_efficiency: number;
}

interface QualityAlert {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  recommendation: string;
}

interface QualityTrends {
  direction: 'improving' | 'declining' | 'stable';
  volatility: 'low' | 'medium' | 'high';
  patterns: string[];
  predictions: string[];
}

interface QualityReport {
  timestamp: Date;
  currentQuality: ContextQuality;
  alerts: QualityAlert[];
  trends: QualityTrends;
  recommendations: string[];
  overallScore: number;
  qualityGrade: string;
}
