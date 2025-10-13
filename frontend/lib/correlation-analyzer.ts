/**
 * Kendall's Rank Correlation Analysis
 * 
 * Removes highly correlated features (redundant) to improve prediction quality.
 * Uses Kendall's τ (tau) correlation coefficient which is more robust than Pearson
 * for non-linear relationships and ordinal data.
 * 
 * Research shows that removing correlated features (τ > 0.7) improves prediction
 * reliability by ensuring predictors are independent.
 * 
 * Based on: Cengiz et al. (2023) - Kendall's rank correlation for feature selection
 */

import { ConfigurationEncoder } from './configuration-encoder';

export interface CorrelationResult {
  feature1: string;
  feature2: string;
  correlation: number; // Kendall's τ (-1 to 1)
  pValue: number;      // Statistical significance
  shouldRemove: boolean;
  interpretation: string;
}

export interface CorrelationMatrix {
  features: string[];
  matrix: number[][];  // τ values
  pValues: number[][]; // Statistical significance
}

export class CorrelationAnalyzer {
  private encoder: ConfigurationEncoder;
  
  constructor(encoder: ConfigurationEncoder) {
    this.encoder = encoder;
  }
  
  /**
   * Analyze correlations and identify redundant features
   */
  async analyzeCorrelations(
    configurations: Record<string, any>[],
    threshold: number = 0.7,
    pValueThreshold: number = 0.05
  ): Promise<{
    correlations: CorrelationResult[];
    redundantFeatures: Set<string>;
    reducedFeatures: string[];
    correlationMatrix: CorrelationMatrix;
  }> {
    console.log('\n🔍 Analyzing Feature Correlations (Kendall\'s τ)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Threshold: τ > ${threshold} (p < ${pValueThreshold})`);
    console.log(`Configurations: ${configurations.length}\n`);
    
    // Encode all configurations
    const encoded = this.encoder.encodeBatch(configurations);
    const featureNames = this.encoder.getFeatureNames();
    const n = featureNames.length;
    
    console.log(`Features to analyze: ${n}\n`);
    
    // Compute correlation matrix
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const pValues: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const correlations: CorrelationResult[] = [];
    
    // Compute Kendall's τ for all pairs
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1.0;
      pValues[i][i] = 0.0;
      
      for (let j = i + 1; j < n; j++) {
        const feature1Data = encoded.map(row => row[i]);
        const feature2Data = encoded.map(row => row[j]);
        
        const { tau, pValue } = this.kendallsTau(feature1Data, feature2Data);
        
        matrix[i][j] = tau;
        matrix[j][i] = tau;
        pValues[i][j] = pValue;
        pValues[j][i] = pValue;
        
        const shouldRemove = Math.abs(tau) > threshold && pValue < pValueThreshold;
        
        const result: CorrelationResult = {
          feature1: featureNames[i],
          feature2: featureNames[j],
          correlation: tau,
          pValue,
          shouldRemove,
          interpretation: this.interpretCorrelation(tau)
        };
        
        correlations.push(result);
        
        if (shouldRemove) {
          console.log(
            `⚠️  High correlation: ${result.feature1} ↔ ${result.feature2}`
          );
          console.log(
            `   τ = ${tau.toFixed(3)} (${result.interpretation}), ` +
            `p = ${pValue.toFixed(4)} (significant)`
          );
        }
      }
    }
    
    // Identify redundant features
    const redundantFeatures = this.identifyRedundant(correlations, threshold, pValueThreshold);
    const reducedFeatures = featureNames.filter(f => !redundantFeatures.has(f));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Original features: ${featureNames.length}`);
    console.log(`Redundant features: ${redundantFeatures.size}`);
    console.log(`Reduced features: ${reducedFeatures.length}`);
    
    if (redundantFeatures.size > 0) {
      console.log(`\nRemoved: ${Array.from(redundantFeatures).join(', ')}`);
    }
    
    console.log('');
    
    return {
      correlations,
      redundantFeatures,
      reducedFeatures,
      correlationMatrix: {
        features: featureNames,
        matrix,
        pValues
      }
    };
  }
  
  /**
   * Compute Kendall's τ correlation coefficient
   * 
   * τ = (concordant - discordant) / (n * (n-1) / 2)
   * 
   * Concordant: pairs where both increase or both decrease together
   * Discordant: pairs where one increases while other decreases
   */
  private kendallsTau(
    x: number[],
    y: number[]
  ): { tau: number; pValue: number } {
    const n = x.length;
    let concordant = 0;
    let discordant = 0;
    let ties = 0;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const xDiff = x[i] - x[j];
        const yDiff = y[i] - y[j];
        
        if (xDiff === 0 && yDiff === 0) {
          ties++;
        } else if ((xDiff > 0 && yDiff > 0) || (xDiff < 0 && yDiff < 0)) {
          concordant++;
        } else if ((xDiff > 0 && yDiff < 0) || (xDiff < 0 && yDiff > 0)) {
          discordant++;
        }
      }
    }
    
    const total = (n * (n - 1)) / 2;
    const tau = (concordant - discordant) / total;
    
    // Compute p-value
    const pValue = this.computePValue(tau, n);
    
    return { tau, pValue };
  }
  
  /**
   * Compute p-value for Kendall's τ using normal approximation
   */
  private computePValue(tau: number, n: number): number {
    // For large n, τ ~ N(0, 2(2n+5)/(9n(n-1)))
    if (n < 10) {
      // Too small for normal approximation
      return 0.5;
    }
    
    const variance = (2 * (2 * n + 5)) / (9 * n * (n - 1));
    const zScore = Math.abs(tau) / Math.sqrt(variance);
    
    // Two-tailed p-value
    const pValue = 2 * (1 - this.normalCDF(zScore));
    
    return Math.max(0, Math.min(1, pValue));
  }
  
  /**
   * Standard normal cumulative distribution function
   */
  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }
  
  /**
   * Error function (Abramowitz and Stegun approximation)
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
  
  /**
   * Identify redundant features using greedy algorithm
   * 
   * Strategy: Remove feature with most high correlations
   */
  private identifyRedundant(
    correlations: CorrelationResult[],
    threshold: number,
    pValueThreshold: number
  ): Set<string> {
    const redundant = new Set<string>();
    
    // Build correlation graph
    const graph = new Map<string, Set<string>>();
    
    correlations.forEach(c => {
      if (c.shouldRemove && Math.abs(c.correlation) > threshold && c.pValue < pValueThreshold) {
        if (!graph.has(c.feature1)) graph.set(c.feature1, new Set());
        if (!graph.has(c.feature2)) graph.set(c.feature2, new Set());
        graph.get(c.feature1)!.add(c.feature2);
        graph.get(c.feature2)!.add(c.feature1);
      }
    });
    
    // Greedy removal: remove feature with most connections
    while (graph.size > 0) {
      let maxConnections = 0;
      let maxFeature = '';
      
      graph.forEach((connections, feature) => {
        if (connections.size > maxConnections) {
          maxConnections = connections.size;
          maxFeature = feature;
        }
      });
      
      if (maxConnections === 0) break;
      
      redundant.add(maxFeature);
      graph.delete(maxFeature);
      
      // Remove this feature from other connections
      graph.forEach((connections) => {
        connections.delete(maxFeature);
      });
    }
    
    return redundant;
  }
  
  /**
   * Interpret correlation strength
   */
  private interpretCorrelation(tau: number): string {
    const absTau = Math.abs(tau);
    
    if (absTau >= 0.9) return 'very strong';
    if (absTau >= 0.7) return 'strong';
    if (absTau >= 0.5) return 'moderate';
    if (absTau >= 0.3) return 'weak';
    return 'very weak';
  }
  
  /**
   * Get top N correlated pairs
   */
  getTopCorrelations(
    correlations: CorrelationResult[],
    n: number = 10
  ): CorrelationResult[] {
    return correlations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, n);
  }
  
  /**
   * Export correlation matrix as CSV
   */
  exportMatrix(matrix: CorrelationMatrix): string {
    const lines: string[] = [];
    
    // Header
    lines.push(['', ...matrix.features].join(','));
    
    // Data rows
    matrix.features.forEach((feature, i) => {
      const row = [feature, ...matrix.matrix[i].map(v => v.toFixed(4))];
      lines.push(row.join(','));
    });
    
    return lines.join('\n');
  }
}

/**
 * Example: Analyze LoRA configuration correlations
 */
export async function demonstrateCorrelationAnalysis() {
  console.log('🔬 Correlation Analysis Demonstration');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const { ConfigurationEncoder } = await import('./configuration-encoder');
  const encoder = new ConfigurationEncoder();
  
  // Sample configurations with correlated features
  // (rank and alpha are typically correlated: alpha = rank * 2)
  const configs = [
    { rank: 4, alpha: 8, weight_decay: 1e-6, model: 'ollama' },
    { rank: 8, alpha: 16, weight_decay: 1e-5, model: 'ollama' },
    { rank: 16, alpha: 32, weight_decay: 5e-5, model: 'gpt-4o-mini' },
    { rank: 32, alpha: 64, weight_decay: 1e-4, model: 'claude' },
    { rank: 64, alpha: 128, weight_decay: 1e-3, model: 'gemini' }
  ];
  
  // Fit encoder
  encoder.fit(configs);
  
  // Analyze correlations
  const analyzer = new CorrelationAnalyzer(encoder);
  const result = await analyzer.analyzeCorrelations(configs, 0.7, 0.05);
  
  // Show top correlations
  console.log('Top 5 Correlations:');
  const top5 = analyzer.getTopCorrelations(result.correlations, 5);
  top5.forEach((c, i) => {
    console.log(
      `  ${i + 1}. ${c.feature1} ↔ ${c.feature2}: ` +
      `τ = ${c.correlation.toFixed(3)} (${c.interpretation})`
    );
  });
  console.log('');
  
  return result;
}

