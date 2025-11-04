/**
 * Adaptive Threshold Sensing System
 * 
 * Based on Daoist Cybernetics: "Threshold sensing and gradual interventions
 * to avoid abrupt disturbances"
 * 
 * Dynamic thresholds that adapt to system state (not just fixed limits).
 */

export interface ThresholdConfig {
  metric: string;
  baseThreshold: number;
  adaptiveMultiplier: number; // 0.8 = 80% of base threshold triggers warning
  historyWindow: number; // Time window for history (ms)
  minThreshold: number; // Never go below this
  maxThreshold: number; // Never go above this
}

export interface ThresholdState {
  metric: string;
  currentValue: number;
  threshold: number;
  adaptiveThreshold: number;
  status: 'normal' | 'warning' | 'critical' | 'exceeded';
  history: Array<{ timestamp: number; value: number }>;
}

export interface InterventionStrategy {
  type: 'gradual' | 'immediate';
  severity: 'low' | 'medium' | 'high';
  actions: string[];
}

export class AdaptiveThresholdManager {
  private thresholds: Map<string, ThresholdConfig> = new Map();
  private history: Map<string, Array<{ timestamp: number; value: number }>> = new Map();
  private states: Map<string, ThresholdState> = new Map();
  
  /**
   * Register a threshold configuration
   */
  registerThreshold(config: ThresholdConfig): void {
    this.thresholds.set(config.metric, config);
    this.history.set(config.metric, []);
    this.states.set(config.metric, {
      metric: config.metric,
      currentValue: 0,
      threshold: config.baseThreshold,
      adaptiveThreshold: config.baseThreshold,
      status: 'normal',
      history: [],
    });
  }
  
  /**
   * Update threshold with current value
   */
  async updateThreshold(metric: string, currentValue: number): Promise<ThresholdState> {
    const config = this.thresholds.get(metric);
    if (!config) {
      throw new Error(`Threshold not registered: ${metric}`);
    }
    
    const now = Date.now();
    const history = this.history.get(metric) || [];
    
    // Add to history
    history.push({ timestamp: now, value: currentValue });
    
    // Trim old history
    const cutoff = now - config.historyWindow;
    const trimmedHistory = history.filter(h => h.timestamp >= cutoff);
    this.history.set(metric, trimmedHistory);
    
    // Calculate adaptive threshold
    const adaptiveThreshold = this.calculateAdaptiveThreshold(config, trimmedHistory, currentValue);
    
    // Determine status
    const status = this.determineStatus(currentValue, adaptiveThreshold, config.baseThreshold);
    
    // Update state
    const state: ThresholdState = {
      metric,
      currentValue,
      threshold: config.baseThreshold,
      adaptiveThreshold,
      status,
      history: trimmedHistory,
    };
    
    this.states.set(metric, state);
    
    return state;
  }
  
  /**
   * Calculate adaptive threshold based on history
   */
  private calculateAdaptiveThreshold(
    config: ThresholdConfig,
    history: Array<{ timestamp: number; value: number }>,
    currentValue: number
  ): number {
    if (history.length < 2) {
      return config.baseThreshold;
    }
    
    // Calculate statistics
    const values = history.map(h => h.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Adaptive threshold based on:
    // 1. Historical mean (if stable)
    // 2. Standard deviation (if variable)
    // 3. Current trend (if increasing/decreasing)
    
    let adaptiveThreshold = config.baseThreshold;
    
    // If system is stable (low variance), use mean-based threshold
    if (stdDev < config.baseThreshold * 0.1) {
      adaptiveThreshold = mean * 1.2; // 20% above mean
    } else {
      // If variable, use percentile-based threshold
      const sorted = [...values].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      adaptiveThreshold = p95 * 1.1; // 10% above 95th percentile
    }
    
    // Apply trend adjustment
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const trend = (recent[recent.length - 1].value - recent[0].value) / recent.length;
      
      if (trend > 0) {
        // Increasing trend - lower threshold to catch early
        adaptiveThreshold *= 0.9;
      } else if (trend < 0) {
        // Decreasing trend - can raise threshold slightly
        adaptiveThreshold *= 1.05;
      }
    }
    
    // Clamp to min/max
    adaptiveThreshold = Math.max(config.minThreshold, Math.min(config.maxThreshold, adaptiveThreshold));
    
    return adaptiveThreshold;
  }
  
  /**
   * Determine status based on value vs thresholds
   */
  private determineStatus(
    currentValue: number,
    adaptiveThreshold: number,
    baseThreshold: number
  ): 'normal' | 'warning' | 'critical' | 'exceeded' {
    const warningThreshold = adaptiveThreshold * 0.8;
    const criticalThreshold = adaptiveThreshold * 0.95;
    
    if (currentValue >= baseThreshold) {
      return 'exceeded';
    } else if (currentValue >= criticalThreshold) {
      return 'critical';
    } else if (currentValue >= warningThreshold) {
      return 'warning';
    } else {
      return 'normal';
    }
  }
  
  /**
   * Get intervention strategy based on threshold state
   */
  getInterventionStrategy(state: ThresholdState): InterventionStrategy {
    const strategies: Record<string, InterventionStrategy> = {
      normal: {
        type: 'gradual',
        severity: 'low',
        actions: ['Continue monitoring'],
      },
      warning: {
        type: 'gradual',
        severity: 'medium',
        actions: [
          'Reduce load if possible',
          'Increase monitoring frequency',
          'Prepare fallback mechanisms',
        ],
      },
      critical: {
        type: 'immediate',
        severity: 'high',
        actions: [
          'Activate rate limiting',
          'Enable circuit breakers',
          'Scale back non-critical operations',
          'Alert operators',
        ],
      },
      exceeded: {
        type: 'immediate',
        severity: 'high',
        actions: [
          'Emergency rate limiting',
          'Circuit breaker activation',
          'Graceful degradation',
          'Emergency alert',
        ],
      },
    };
    
    return strategies[state.status] || strategies.normal;
  }
  
  /**
   * Get current state for a metric
   */
  getState(metric: string): ThresholdState | null {
    return this.states.get(metric) || null;
  }
  
  /**
   * Get all states
   */
  getAllStates(): ThresholdState[] {
    return Array.from(this.states.values());
  }
}

// Singleton instance
export const adaptiveThresholdManager = new AdaptiveThresholdManager();

// Initialize common thresholds
adaptiveThresholdManager.registerThreshold({
  metric: 'latency',
  baseThreshold: 10000, // 10s
  adaptiveMultiplier: 0.8,
  historyWindow: 60 * 60 * 1000, // 1 hour
  minThreshold: 5000,
  maxThreshold: 30000,
});

adaptiveThresholdManager.registerThreshold({
  metric: 'error_rate',
  baseThreshold: 0.1, // 10%
  adaptiveMultiplier: 0.8,
  historyWindow: 60 * 60 * 1000,
  minThreshold: 0.05,
  maxThreshold: 0.2,
});

adaptiveThresholdManager.registerThreshold({
  metric: 'cost_per_request',
  baseThreshold: 0.01, // $0.01
  adaptiveMultiplier: 0.8,
  historyWindow: 24 * 60 * 60 * 1000, // 24 hours
  minThreshold: 0.005,
  maxThreshold: 0.05,
});

