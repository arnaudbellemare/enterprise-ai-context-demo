/**
 * Stagnation Detection for Optimization
 * 
 * Detects when optimization stalls (no improvement) and recommends
 * adaptive strategies like increasing exploration or relaxing requirements.
 * 
 * Prevents wasted computational cycles on plateaued optimizations.
 */

export interface StagnationConfig {
  windowSize: number;      // Number of recent scores to consider
  threshold: number;       // Minimum improvement threshold (e.g., 0.01 = 1%)
  patience: number;        // Iterations to wait before declaring stagnation
  minDataPoints: number;   // Minimum data points needed for analysis
}

export interface StagnationResult {
  isStagnating: boolean;
  iterationsSinceImprovement: number;
  recentImprovement: number;
  recommendation: string;
  stats: {
    mean: number;
    variance: number;
    best: number;
    worst: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export class StagnationDetector {
  private scores: number[] = [];
  private config: StagnationConfig;
  private stagnantIterations: number = 0;
  private totalIterations: number = 0;
  
  constructor(config: Partial<StagnationConfig> = {}) {
    this.config = {
      windowSize: config.windowSize || 10,
      threshold: config.threshold || 0.01,      // 1% improvement required
      patience: config.patience || 5,
      minDataPoints: config.minDataPoints || 3
    };
  }
  
  /**
   * Add a new score and check for stagnation
   */
  addScore(score: number): StagnationResult {
    this.scores.push(score);
    this.totalIterations++;
    
    // Keep only recent scores within window
    if (this.scores.length > this.config.windowSize) {
      this.scores.shift();
    }
    
    // Need enough data
    if (this.scores.length < this.config.minDataPoints) {
      return {
        isStagnating: false,
        iterationsSinceImprovement: 0,
        recentImprovement: 0,
        recommendation: `Collecting data... (${this.scores.length}/${this.config.minDataPoints})`,
        stats: this.computeStats()
      };
    }
    
    // Calculate improvement
    const recentBest = Math.max(...this.scores.slice(-this.config.patience));
    const overallBest = Math.max(...this.scores);
    const improvement = (recentBest - overallBest) / Math.max(Math.abs(overallBest), 1e-10);
    
    // Check stagnation
    const isStagnating = improvement < this.config.threshold;
    
    if (isStagnating) {
      this.stagnantIterations++;
    } else {
      this.stagnantIterations = 0;
    }
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      this.stagnantIterations,
      improvement,
      this.computeStats()
    );
    
    return {
      isStagnating: this.stagnantIterations >= this.config.patience,
      iterationsSinceImprovement: this.stagnantIterations,
      recentImprovement: improvement,
      recommendation,
      stats: this.computeStats()
    };
  }
  
  /**
   * Generate adaptive recommendation based on stagnation state
   */
  private generateRecommendation(
    stagnantIters: number,
    improvement: number,
    stats: StagnationResult['stats']
  ): string {
    if (stagnantIters >= this.config.patience) {
      // Stagnated - provide specific recommendations
      if (stats.variance < 0.001) {
        return '🔄 STAGNANT (low variance): Increase exploration radius or try new search strategy';
      } else if (stats.trend === 'declining') {
        return '🔄 STAGNANT (declining): Consider reverting to previous best or adjusting learning rate';
      } else {
        return '🔄 STAGNANT: Relax requirements, increase exploration, or try different initialization';
      }
    } else if (stagnantIters > 0) {
      const patienceLeft = this.config.patience - stagnantIters;
      return `⚠️  Potential stagnation (${stagnantIters}/${this.config.patience}) - ${patienceLeft} more iteration(s) before action`;
    } else {
      if (improvement > 0.05) {
        return '✅ Excellent progress! Continue current strategy';
      } else if (improvement > 0.02) {
        return '✅ Good progress! Consider maintaining current approach';
      } else {
        return '✅ Steady progress, but monitor closely';
      }
    }
  }
  
  /**
   * Compute statistics on recent scores
   */
  private computeStats(): StagnationResult['stats'] {
    if (this.scores.length === 0) {
      return {
        mean: 0,
        variance: 0,
        best: 0,
        worst: 0,
        trend: 'stable'
      };
    }
    
    const mean = this.scores.reduce((a, b) => a + b) / this.scores.length;
    const variance = this.scores.reduce(
      (sum, x) => sum + Math.pow(x - mean, 2),
      0
    ) / this.scores.length;
    
    const best = Math.max(...this.scores);
    const worst = Math.min(...this.scores);
    
    // Determine trend using linear regression
    const trend = this.computeTrend();
    
    return { mean, variance, best, worst, trend };
  }
  
  /**
   * Compute trend using simple linear regression
   */
  private computeTrend(): 'improving' | 'stable' | 'declining' {
    if (this.scores.length < 3) return 'stable';
    
    const n = this.scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = this.scores;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.01) return 'improving';
    if (slope < -0.01) return 'declining';
    return 'stable';
  }
  
  /**
   * Reset the detector
   */
  reset() {
    this.scores = [];
    this.stagnantIterations = 0;
    this.totalIterations = 0;
  }
  
  /**
   * Get current configuration
   */
  getConfig(): StagnationConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StagnationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Get all scores history
   */
  getScores(): number[] {
    return [...this.scores];
  }
  
  /**
   * Get summary report
   */
  getSummary(): {
    totalIterations: number;
    currentStagnation: number;
    scores: number[];
    stats: StagnationResult['stats'];
  } {
    return {
      totalIterations: this.totalIterations,
      currentStagnation: this.stagnantIterations,
      scores: this.getScores(),
      stats: this.computeStats()
    };
  }
}

/**
 * Example: Use stagnation detection in optimization loop
 */
export async function optimizeWithStagnationDetection(
  evaluateFn: (iteration: number) => Promise<number>,
  maxIterations: number = 100,
  detectorConfig?: Partial<StagnationConfig>
): Promise<{
  bestScore: number;
  bestIteration: number;
  totalIterations: number;
  stagnationOccurred: boolean;
  finalRecommendation: string;
}> {
  const detector = new StagnationDetector(detectorConfig);
  
  let bestScore = -Infinity;
  let bestIteration = 0;
  let stagnationOccurred = false;
  let finalRecommendation = '';
  
  console.log('\n🎯 Starting Optimization with Stagnation Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  for (let i = 1; i <= maxIterations; i++) {
    // Evaluate current iteration
    const score = await evaluateFn(i);
    
    // Check stagnation
    const result = detector.addScore(score);
    
    // Update best
    if (score > bestScore) {
      bestScore = score;
      bestIteration = i;
    }
    
    // Log progress
    console.log(
      `Iteration ${i}: Score = ${score.toFixed(4)}, ` +
      `Best = ${bestScore.toFixed(4)}, ` +
      `Improvement = ${(result.recentImprovement * 100).toFixed(2)}%`
    );
    console.log(`  ${result.recommendation}`);
    
    // Check if stagnated
    if (result.isStagnating) {
      console.log(`\n⚠️  STAGNATION DETECTED after ${i} iterations`);
      console.log(`  Iterations without improvement: ${result.iterationsSinceImprovement}`);
      console.log(`  Recent improvement: ${(result.recentImprovement * 100).toFixed(2)}%`);
      console.log(`  Trend: ${result.stats.trend}`);
      console.log(`  Recommendation: ${result.recommendation}\n`);
      
      stagnationOccurred = true;
      finalRecommendation = result.recommendation;
      
      // Optional: Break early if stagnated
      // break;
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Best Score: ${bestScore.toFixed(4)} (iteration ${bestIteration})`);
  console.log(`Stagnation: ${stagnationOccurred ? 'Yes' : 'No'}`);
  
  if (stagnationOccurred) {
    console.log(`Action: ${finalRecommendation}`);
  }
  
  console.log('');
  
  return {
    bestScore,
    bestIteration,
    totalIterations: maxIterations,
    stagnationOccurred,
    finalRecommendation
  };
}

/**
 * Adaptive exploration rate based on stagnation
 */
export class AdaptiveExploration {
  private detector: StagnationDetector;
  private baseExplorationRate: number;
  private currentExplorationRate: number;
  
  constructor(
    baseExplorationRate: number = 0.1,
    detectorConfig?: Partial<StagnationConfig>
  ) {
    this.detector = new StagnationDetector(detectorConfig);
    this.baseExplorationRate = baseExplorationRate;
    this.currentExplorationRate = baseExplorationRate;
  }
  
  /**
   * Update exploration rate based on stagnation
   */
  update(score: number): {
    explorationRate: number;
    stagnationResult: StagnationResult;
  } {
    const result = this.detector.addScore(score);
    
    if (result.isStagnating) {
      // Increase exploration when stagnating
      this.currentExplorationRate = Math.min(
        0.5,
        this.baseExplorationRate * (1 + result.iterationsSinceImprovement * 0.2)
      );
    } else {
      // Decrease exploration when improving
      this.currentExplorationRate = Math.max(
        this.baseExplorationRate * 0.5,
        this.currentExplorationRate * 0.9
      );
    }
    
    return {
      explorationRate: this.currentExplorationRate,
      stagnationResult: result
    };
  }
  
  getExplorationRate(): number {
    return this.currentExplorationRate;
  }
  
  reset() {
    this.detector.reset();
    this.currentExplorationRate = this.baseExplorationRate;
  }
}

