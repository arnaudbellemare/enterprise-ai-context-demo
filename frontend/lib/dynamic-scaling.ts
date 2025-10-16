/**
 * ⚡ Dynamic Scaling System
 * 
 * Implements real-time auto-scaling based on system load, performance metrics,
 * and resource utilization with predictive scaling and cost optimization
 */

export interface ScalingMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  queueLength: number;
}

export interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  reason: string;
  confidence: number;
  targetInstances: number;
  estimatedCost: number;
  expectedPerformance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  scalingStrategy: string;
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetCpuUsage: number;
  targetMemoryUsage: number;
  targetResponseTime: number;
  maxErrorRate: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
  costPerInstance: number;
}

export interface ScalingHistory {
  timestamp: number;
  action: string;
  instances: number;
  metrics: ScalingMetrics;
  decision: ScalingDecision;
  actualPerformance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

class DynamicScaler {
  private config: ScalingConfig = {
    minInstances: 1,
    maxInstances: 10,
    targetCpuUsage: 70,
    targetMemoryUsage: 80,
    targetResponseTime: 2000,
    maxErrorRate: 0.05,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.3,
    cooldownPeriod: 300000, // 5 minutes
    costPerInstance: 0.1
  };

  private currentInstances = 1;
  private lastScalingTime = 0;
  private metricsHistory: ScalingMetrics[] = [];
  private scalingHistory: ScalingHistory[] = [];
  private predictiveModel: {
    weights: number[];
    bias: number;
    learningRate: number;
  } = {
    weights: [0.3, 0.2, 0.2, 0.15, 0.1, 0.05], // CPU, Memory, RequestRate, ResponseTime, ErrorRate, Connections
    bias: 0.1,
    learningRate: 0.01
  };

  /**
   * Update scaling configuration
   */
  public updateConfig(newConfig: Partial<ScalingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Record system metrics
   */
  public recordMetrics(metrics: ScalingMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Keep only last 100 metrics for performance
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
    
    // Update predictive model
    this.updatePredictiveModel(metrics);
  }

  /**
   * Update predictive model based on new metrics
   */
  private updatePredictiveModel(metrics: ScalingMetrics): void {
    if (this.metricsHistory.length < 2) return;
    
    const previous = this.metricsHistory[this.metricsHistory.length - 2];
    const current = metrics;
    
    // Calculate actual load change
    const actualLoadChange = this.calculateLoadChange(previous, current);
    
    // Calculate predicted load change
    const predictedLoadChange = this.predictLoadChange(previous);
    
    // Update model weights based on prediction error
    const error = actualLoadChange - predictedLoadChange;
    const features = this.extractFeatures(previous);
    
    for (let i = 0; i < this.predictiveModel.weights.length; i++) {
      this.predictiveModel.weights[i] += this.predictiveModel.learningRate * error * features[i];
    }
    
    this.predictiveModel.bias += this.predictiveModel.learningRate * error;
  }

  /**
   * Calculate load change between two metric points
   */
  private calculateLoadChange(previous: ScalingMetrics, current: ScalingMetrics): number {
    const cpuChange = (current.cpuUsage - previous.cpuUsage) / 100;
    const memoryChange = (current.memoryUsage - previous.memoryUsage) / 100;
    const requestChange = (current.requestRate - previous.requestRate) / 1000;
    const responseChange = (current.responseTime - previous.responseTime) / 1000;
    const errorChange = current.errorRate - previous.errorRate;
    const connectionChange = (current.activeConnections - previous.activeConnections) / 100;
    
    return (cpuChange + memoryChange + requestChange + responseChange + errorChange + connectionChange) / 6;
  }

  /**
   * Extract features for predictive model
   */
  private extractFeatures(metrics: ScalingMetrics): number[] {
    return [
      metrics.cpuUsage / 100,
      metrics.memoryUsage / 100,
      metrics.requestRate / 1000,
      metrics.responseTime / 1000,
      metrics.errorRate,
      metrics.activeConnections / 100
    ];
  }

  /**
   * Predict load change using the predictive model
   */
  private predictLoadChange(metrics: ScalingMetrics): number {
    const features = this.extractFeatures(metrics);
    let prediction = this.predictiveModel.bias;
    
    for (let i = 0; i < features.length; i++) {
      prediction += this.predictiveModel.weights[i] * features[i];
    }
    
    return prediction;
  }

  /**
   * Make scaling decision based on current metrics
   */
  public makeScalingDecision(): ScalingDecision {
    if (this.metricsHistory.length === 0) {
      return this.createDecision('maintain', 'No metrics available', 0.5);
    }
    
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const loadScore = this.calculateLoadScore(currentMetrics);
    const predictedLoad = this.predictLoadChange(currentMetrics);
    
    // Check cooldown period
    const timeSinceLastScaling = Date.now() - this.lastScalingTime;
    if (timeSinceLastScaling < this.config.cooldownPeriod) {
      return this.createDecision('maintain', 'In cooldown period', 0.8);
    }
    
    // Determine scaling action
    let action: 'scale_up' | 'scale_down' | 'maintain';
    let reason: string;
    let confidence: number;
    
    if (loadScore > this.config.scaleUpThreshold && this.currentInstances < this.config.maxInstances) {
      action = 'scale_up';
      reason = `High load detected (${(loadScore * 100).toFixed(1)}%), predicted load: ${(predictedLoad * 100).toFixed(1)}%`;
      confidence = Math.min(0.95, loadScore + 0.1);
    } else if (loadScore < this.config.scaleDownThreshold && this.currentInstances > this.config.minInstances) {
      action = 'scale_down';
      reason = `Low load detected (${(loadScore * 100).toFixed(1)}%), predicted load: ${(predictedLoad * 100).toFixed(1)}%`;
      confidence = Math.min(0.95, (1 - loadScore) + 0.1);
    } else {
      action = 'maintain';
      reason = `Load is within acceptable range (${(loadScore * 100).toFixed(1)}%)`;
      confidence = 0.7;
    }
    
    return this.createDecision(action, reason, confidence, predictedLoad);
  }

  /**
   * Calculate overall load score from metrics
   */
  private calculateLoadScore(metrics: ScalingMetrics): number {
    const cpuScore = metrics.cpuUsage / 100;
    const memoryScore = metrics.memoryUsage / 100;
    const requestScore = Math.min(1, metrics.requestRate / 1000);
    const responseScore = Math.min(1, metrics.responseTime / this.config.targetResponseTime);
    const errorScore = Math.min(1, metrics.errorRate / this.config.maxErrorRate);
    const connectionScore = Math.min(1, metrics.activeConnections / 1000);
    
    // Weighted average
    return (cpuScore * 0.3 + memoryScore * 0.2 + requestScore * 0.2 + 
            responseScore * 0.15 + errorScore * 0.1 + connectionScore * 0.05);
  }

  /**
   * Create scaling decision object
   */
  private createDecision(
    action: 'scale_up' | 'scale_down' | 'maintain',
    reason: string,
    confidence: number,
    predictedLoad?: number
  ): ScalingDecision {
    let targetInstances = this.currentInstances;
    let scalingStrategy = 'reactive';
    
    if (action === 'scale_up') {
      targetInstances = Math.min(this.config.maxInstances, this.currentInstances + 1);
      scalingStrategy = predictedLoad && predictedLoad > 0.8 ? 'predictive' : 'reactive';
    } else if (action === 'scale_down') {
      targetInstances = Math.max(this.config.minInstances, this.currentInstances - 1);
      scalingStrategy = predictedLoad && predictedLoad < 0.3 ? 'predictive' : 'reactive';
    }
    
    const estimatedCost = targetInstances * this.config.costPerInstance;
    
    // Estimate performance based on target instances
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const performanceMultiplier = this.currentInstances / targetInstances;
    
    return {
      action,
      reason,
      confidence,
      targetInstances,
      estimatedCost,
      expectedPerformance: {
        responseTime: currentMetrics.responseTime * performanceMultiplier,
        throughput: currentMetrics.requestRate / performanceMultiplier,
        errorRate: Math.max(0, currentMetrics.errorRate - (performanceMultiplier - 1) * 0.01)
      },
      scalingStrategy
    };
  }

  /**
   * Execute scaling decision
   */
  public executeScaling(decision: ScalingDecision): boolean {
    if (decision.action === 'maintain') {
      return true;
    }
    
    // Simulate scaling execution
    const previousInstances = this.currentInstances;
    this.currentInstances = decision.targetInstances;
    this.lastScalingTime = Date.now();
    
    // Record scaling history
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    this.scalingHistory.push({
      timestamp: Date.now(),
      action: decision.action,
      instances: this.currentInstances,
      metrics: currentMetrics,
      decision,
      actualPerformance: {
        responseTime: 0, // Would be updated after scaling
        throughput: 0,
        errorRate: 0
      }
    });
    
    console.log(`🔄 Scaling ${decision.action}: ${previousInstances} → ${this.currentInstances} instances`);
    console.log(`   Reason: ${decision.reason}`);
    console.log(`   Strategy: ${decision.scalingStrategy}`);
    console.log(`   Expected cost: $${decision.estimatedCost.toFixed(2)}/hour`);
    
    return true;
  }

  /**
   * Get scaling statistics
   */
  public getScalingStats(): {
    currentInstances: number;
    totalScalings: number;
    averageLoadScore: number;
    costSavings: number;
    performanceImprovement: number;
    scalingHistory: ScalingHistory[];
  } {
    const totalScalings = this.scalingHistory.length;
    const averageLoadScore = this.metricsHistory.length > 0 
      ? this.metricsHistory.reduce((sum, m) => sum + this.calculateLoadScore(m), 0) / this.metricsHistory.length
      : 0;
    
    // Calculate cost savings (simplified)
    const costSavings = this.scalingHistory
      .filter(h => h.action === 'scale_down')
      .reduce((sum, h) => sum + this.config.costPerInstance, 0);
    
    // Calculate performance improvement (simplified)
    const performanceImprovement = this.scalingHistory
      .filter(h => h.action === 'scale_up')
      .reduce((sum, h) => sum + 0.1, 0); // 10% improvement per scale-up
    
    return {
      currentInstances: this.currentInstances,
      totalScalings,
      averageLoadScore,
      costSavings,
      performanceImprovement,
      scalingHistory: this.scalingHistory.slice(-10) // Last 10 scaling events
    };
  }

  /**
   * Get current system status
   */
  public getSystemStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    loadScore: number;
    instances: number;
    recommendations: string[];
  } {
    if (this.metricsHistory.length === 0) {
      return {
        status: 'warning',
        loadScore: 0,
        instances: this.currentInstances,
        recommendations: ['No metrics available - check monitoring']
      };
    }
    
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const loadScore = this.calculateLoadScore(currentMetrics);
    
    let status: 'healthy' | 'warning' | 'critical';
    const recommendations: string[] = [];
    
    if (loadScore > 0.9) {
      status = 'critical';
      recommendations.push('Immediate scaling required');
    } else if (loadScore > 0.7) {
      status = 'warning';
      recommendations.push('Consider scaling up');
    } else {
      status = 'healthy';
    }
    
    if (currentMetrics.errorRate > this.config.maxErrorRate) {
      status = 'critical';
      recommendations.push('High error rate detected');
    }
    
    if (currentMetrics.responseTime > this.config.targetResponseTime * 1.5) {
      status = 'warning';
      recommendations.push('Response time exceeds target');
    }
    
    return {
      status,
      loadScore,
      instances: this.currentInstances,
      recommendations
    };
  }
}

export const dynamicScaler = new DynamicScaler();
