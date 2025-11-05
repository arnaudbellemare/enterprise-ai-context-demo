/**
 * Context Quality Dashboard
 * 
 * Tracks and visualizes context quality metrics: relevance, coherence, efficiency.
 * Based on extended intelligence: measure context quality independently of agent.
 */

import { ContextQualityMetrics } from './extended-intelligence-metrics';

export interface ContextQualityDashboardData {
  current: ContextQualityMetrics;
  trends: {
    relevance: number[];      // Historical relevance scores
    coherence: number[];       // Historical coherence scores
    efficiency: number[];      // Historical efficiency scores
    completeness: number[];    // Historical completeness scores
    freshness: number[];       // Historical freshness scores
    diversity: number[];       // Historical diversity scores
  };
  summary: {
    avgRelevance: number;
    avgCoherence: number;
    avgEfficiency: number;
    avgCompleteness: number;
    avgFreshness: number;
    avgDiversity: number;
    overallQuality: number;
  };
  alerts: Array<{
    type: 'low_relevance' | 'low_coherence' | 'low_efficiency' | 'quality_degradation';
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
  }>;
  recommendations: string[];
}

export class ContextQualityDashboard {
  private qualityHistory: ContextQualityMetrics[] = [];
  private maxHistorySize = 100;
  
  /**
   * Record context quality metrics
   */
  recordQuality(quality: ContextQualityMetrics): void {
    this.qualityHistory.push(quality);
    
    // Keep history size limited
    if (this.qualityHistory.length > this.maxHistorySize) {
      this.qualityHistory.shift();
    }
  }
  
  /**
   * Get dashboard data
   */
  getDashboardData(): ContextQualityDashboardData {
    if (this.qualityHistory.length === 0) {
      const empty: ContextQualityMetrics = {
        relevance: 0,
        coherence: 0,
        completeness: 0,
        efficiency: 0,
        freshness: 0,
        diversity: 0,
      };
      return {
        current: empty,
        trends: {
          relevance: [],
          coherence: [],
          efficiency: [],
          completeness: [],
          freshness: [],
          diversity: [],
        },
        summary: {
          avgRelevance: 0,
          avgCoherence: 0,
          avgEfficiency: 0,
          avgCompleteness: 0,
          avgFreshness: 0,
          avgDiversity: 0,
          overallQuality: 0,
        },
        alerts: [],
        recommendations: [],
      };
    }
    
    const current = this.qualityHistory[this.qualityHistory.length - 1];
    
    // Calculate trends (last 20 entries)
    const recent = this.qualityHistory.slice(-20);
    const trends = {
      relevance: recent.map(q => q.relevance),
      coherence: recent.map(q => q.coherence),
      efficiency: recent.map(q => q.efficiency),
      completeness: recent.map(q => q.completeness),
      freshness: recent.map(q => q.freshness),
      diversity: recent.map(q => q.diversity),
    };
    
    // Calculate summary
    const avgRelevance = this.qualityHistory.reduce((sum, q) => sum + q.relevance, 0) / this.qualityHistory.length;
    const avgCoherence = this.qualityHistory.reduce((sum, q) => sum + q.coherence, 0) / this.qualityHistory.length;
    const avgEfficiency = this.qualityHistory.reduce((sum, q) => sum + q.efficiency, 0) / this.qualityHistory.length;
    const avgCompleteness = this.qualityHistory.reduce((sum, q) => sum + q.completeness, 0) / this.qualityHistory.length;
    const avgFreshness = this.qualityHistory.reduce((sum, q) => sum + q.freshness, 0) / this.qualityHistory.length;
    const avgDiversity = this.qualityHistory.reduce((sum, q) => sum + q.diversity, 0) / this.qualityHistory.length;
    
    const overallQuality = (
      avgRelevance * 0.25 +
      avgCoherence * 0.20 +
      avgEfficiency * 0.20 +
      avgCompleteness * 0.15 +
      avgFreshness * 0.10 +
      avgDiversity * 0.10
    );
    
    // Generate alerts
    const alerts = this.generateAlerts(current, {
      avgRelevance,
      avgCoherence,
      avgEfficiency,
      avgCompleteness,
      avgFreshness,
      avgDiversity,
      overallQuality,
    });
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(current, {
      avgRelevance,
      avgCoherence,
      avgEfficiency,
      avgCompleteness,
      avgFreshness,
      avgDiversity,
      overallQuality,
    });
    
    return {
      current,
      trends,
      summary: {
        avgRelevance,
        avgCoherence,
        avgEfficiency,
        avgCompleteness,
        avgFreshness,
        avgDiversity,
        overallQuality,
      },
      alerts,
      recommendations,
    };
  }
  
  /**
   * Generate alerts based on quality metrics
   */
  private generateAlerts(
    current: ContextQualityMetrics,
    summary: ContextQualityDashboardData['summary']
  ): ContextQualityDashboardData['alerts'] {
    const alerts: ContextQualityDashboardData['alerts'] = [];
    
    if (current.relevance < 0.5) {
      alerts.push({
        type: 'low_relevance',
        message: `Context relevance is low (${(current.relevance * 100).toFixed(1)}%). Consider improving context selection.`,
        severity: current.relevance < 0.3 ? 'high' : 'medium',
        timestamp: Date.now(),
      });
    }
    
    if (current.coherence < 0.5) {
      alerts.push({
        type: 'low_coherence',
        message: `Context coherence is low (${(current.coherence * 100).toFixed(1)}%). Consider improving context organization.`,
        severity: current.coherence < 0.3 ? 'high' : 'medium',
        timestamp: Date.now(),
      });
    }
    
    if (current.efficiency < 0.3) {
      alerts.push({
        type: 'low_efficiency',
        message: `Context efficiency is low (${(current.efficiency * 100).toFixed(1)}%). Consider reducing context tokens.`,
        severity: current.efficiency < 0.2 ? 'high' : 'medium',
        timestamp: Date.now(),
      });
    }
    
    // Quality degradation detection
    if (this.qualityHistory.length >= 10) {
      const recent = this.qualityHistory.slice(-5);
      const older = this.qualityHistory.slice(-10, -5);
      
      const recentAvg = recent.reduce((sum, q) => sum + q.relevance + q.coherence, 0) / (recent.length * 2);
      const olderAvg = older.reduce((sum, q) => sum + q.relevance + q.coherence, 0) / (older.length * 2);
      
      if (recentAvg < olderAvg * 0.9) {
        alerts.push({
          type: 'quality_degradation',
          message: `Context quality has degraded by ${((1 - recentAvg / olderAvg) * 100).toFixed(1)}%. Review recent changes.`,
          severity: recentAvg < olderAvg * 0.8 ? 'high' : 'medium',
          timestamp: Date.now(),
        });
      }
    }
    
    return alerts;
  }
  
  /**
   * Generate recommendations based on quality metrics
   */
  private generateRecommendations(
    current: ContextQualityMetrics,
    summary: ContextQualityDashboardData['summary']
  ): string[] {
    const recommendations: string[] = [];
    
    if (current.relevance < 0.6) {
      recommendations.push('Improve context selection: Use semantic search with better query understanding.');
    }
    
    if (current.coherence < 0.6) {
      recommendations.push('Improve context organization: Use hierarchical memory and context isolation.');
    }
    
    if (current.efficiency < 0.4) {
      recommendations.push('Improve context efficiency: Reduce context tokens through better compression and selection.');
    }
    
    if (current.completeness < 0.6) {
      recommendations.push('Improve context completeness: Include more relevant context sources.');
    }
    
    if (current.freshness < 0.5) {
      recommendations.push('Improve context freshness: Update context more frequently and prioritize recent information.');
    }
    
    if (current.diversity < 0.5) {
      recommendations.push('Improve context diversity: Include context from multiple sources and domains.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Context quality is good. Continue monitoring and optimizing.');
    }
    
    return recommendations;
  }
  
  /**
   * Get quality trends
   */
  getQualityTrends(timeWindow: number = 3600000): {
    relevance: 'improving' | 'stable' | 'declining';
    coherence: 'improving' | 'stable' | 'declining';
    efficiency: 'improving' | 'stable' | 'declining';
  } {
    const cutoff = Date.now() - timeWindow;
    const recent = this.qualityHistory.filter(q => q.relevance > 0).slice(-20);
    const older = this.qualityHistory.filter(q => q.relevance > 0).slice(-40, -20);
    
    if (recent.length === 0 || older.length === 0) {
      return {
        relevance: 'stable',
        coherence: 'stable',
        efficiency: 'stable',
      };
    }
    
    const getTrend = (metric: keyof ContextQualityMetrics): 'improving' | 'stable' | 'declining' => {
      const recentAvg = recent.reduce((sum, q) => sum + q[metric], 0) / recent.length;
      const olderAvg = older.reduce((sum, q) => sum + q[metric], 0) / older.length;
      const diff = recentAvg - olderAvg;
      if (diff > 0.05) return 'improving';
      if (diff < -0.05) return 'declining';
      return 'stable';
    };
    
    return {
      relevance: getTrend('relevance'),
      coherence: getTrend('coherence'),
      efficiency: getTrend('efficiency'),
    };
  }
  
  /**
   * Clear dashboard data
   */
  clear(): void {
    this.qualityHistory = [];
  }
}

export const contextQualityDashboard = new ContextQualityDashboard();

