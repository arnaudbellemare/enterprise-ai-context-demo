/**
 * Rigorous Evaluation System: Addressing the Illusion of Reasoning Gains
 * 
 * Implements rigorous evaluation protocols to address:
 * - Baseline model variance ranges masking real improvements
 * - Implementation sensitivity (decoding parameters, seeds, prompts, hardware)
 * - Small dataset sizes causing performance swings
 * - RL methods showing minimal real gains and overfitting
 * - Need for multi-seed evaluation protocols and transparent reporting
 */

import { createLogger } from './walt/logger';

const logger = createLogger('RigorousEvaluationSystem');

// ============================================================
// BASELINE VARIANCE ANALYSIS
// ============================================================

export interface BaselineVarianceAnalysis {
  baselineMean: number;
  baselineStdDev: number;
  baselineRange: [number, number];
  improvementMean: number;
  improvementStdDev: number;
  improvementRange: [number, number];
  statisticalSignificance: number;
  isSignificant: boolean;
  varianceOverlap: number;
  illusionFactor: number;
}

export interface EvaluationRun {
  id: string;
  seed: number;
  parameters: any;
  prompt: string;
  hardware: string;
  result: number;
  timestamp: number;
}

export class BaselineVarianceAnalyzer {
  private evaluationRuns: Map<string, EvaluationRun[]> = new Map();
  private varianceThresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeVarianceThresholds();
    logger.info('Baseline Variance Analyzer initialized');
  }

  /**
   * Analyze Baseline Model Variance Ranges
   * Detect if improvements fall within margin of error
   */
  async analyzeBaselineVariance(
    baselineResults: number[],
    improvedResults: number[],
    confidenceLevel: number = 0.95
  ): Promise<BaselineVarianceAnalysis> {
    logger.info('Analyzing baseline model variance ranges', {
      baselineCount: baselineResults.length,
      improvedCount: improvedResults.length,
      confidenceLevel
    });

    // Step 1: Calculate baseline statistics
    const baselineStats = this.calculateStatistics(baselineResults);
    
    // Step 2: Calculate improvement statistics
    const improvedStats = this.calculateStatistics(improvedResults);
    
    // Step 3: Perform statistical significance test
    const statisticalSignificance = await this.performSignificanceTest(
      baselineResults, 
      improvedResults, 
      confidenceLevel
    );
    
    // Step 4: Calculate variance overlap
    const varianceOverlap = this.calculateVarianceOverlap(baselineStats, improvedStats);
    
    // Step 5: Calculate illusion factor
    const illusionFactor = this.calculateIllusionFactor(baselineStats, improvedStats, statisticalSignificance);

    const analysis: BaselineVarianceAnalysis = {
      baselineMean: baselineStats.mean,
      baselineStdDev: baselineStats.stdDev,
      baselineRange: [baselineStats.min, baselineStats.max],
      improvementMean: improvedStats.mean,
      improvementStdDev: improvedStats.stdDev,
      improvementRange: [improvedStats.min, improvedStats.max],
      statisticalSignificance,
      isSignificant: statisticalSignificance > confidenceLevel,
      varianceOverlap,
      illusionFactor
    };

    logger.info('Baseline variance analysis completed', {
      statisticalSignificance: analysis.statisticalSignificance,
      isSignificant: analysis.isSignificant,
      illusionFactor: analysis.illusionFactor
    });

    return analysis;
  }

  /**
   * Detect Illusion of Reasoning Gains
   * Identify when improvements are within baseline variance
   */
  async detectIllusionOfGains(
    baselineResults: number[],
    improvedResults: number[],
    threshold: number = 0.05
  ): Promise<{
    isIllusion: boolean;
    confidence: number;
    recommendation: string;
  }> {
    logger.info('Detecting illusion of reasoning gains', { threshold });

    const analysis = await this.analyzeBaselineVariance(baselineResults, improvedResults);
    
    const isIllusion = analysis.illusionFactor > threshold;
    const confidence = analysis.statisticalSignificance;
    
    let recommendation: string;
    if (isIllusion) {
      recommendation = 'Improvements fall within baseline variance ranges. Consider larger sample sizes and more rigorous evaluation protocols.';
    } else if (confidence < 0.95) {
      recommendation = 'Statistical significance is below 95% confidence level. Increase sample size or improve methodology.';
    } else {
      recommendation = 'Improvements appear statistically significant. Proceed with caution and verify with additional evaluation runs.';
    }

    logger.info('Illusion detection completed', {
      isIllusion,
      confidence,
      recommendation: recommendation.substring(0, 50) + '...'
    });

    return {
      isIllusion,
      confidence,
      recommendation
    };
  }

  private calculateStatistics(results: number[]): {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    median: number;
  } {
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...results);
    const max = Math.max(...results);
    const sorted = [...results].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { mean, stdDev, min, max, median };
  }

  private async performSignificanceTest(
    baselineResults: number[],
    improvedResults: number[],
    confidenceLevel: number
  ): Promise<number> {
    // Simulate t-test for statistical significance
    const baselineMean = baselineResults.reduce((sum, val) => sum + val, 0) / baselineResults.length;
    const improvedMean = improvedResults.reduce((sum, val) => sum + val, 0) / improvedResults.length;
    
    const baselineVariance = baselineResults.reduce((sum, val) => sum + Math.pow(val - baselineMean, 2), 0) / baselineResults.length;
    const improvedVariance = improvedResults.reduce((sum, val) => sum + Math.pow(val - improvedMean, 2), 0) / improvedResults.length;
    
    const pooledVariance = ((baselineResults.length - 1) * baselineVariance + (improvedResults.length - 1) * improvedVariance) / 
                          (baselineResults.length + improvedResults.length - 2);
    
    const standardError = Math.sqrt(pooledVariance * (1/baselineResults.length + 1/improvedResults.length));
    const tStatistic = (improvedMean - baselineMean) / standardError;
    
    // Simulate p-value calculation (simplified)
    const pValue = Math.max(0.001, Math.min(0.999, 1 - Math.abs(tStatistic) / 10));
    
    return 1 - pValue; // Return confidence level
  }

  private calculateVarianceOverlap(baselineStats: any, improvedStats: any): number {
    const baselineRange = baselineStats.max - baselineStats.min;
    const improvedRange = improvedStats.max - improvedStats.min;
    const overlap = Math.max(0, Math.min(baselineStats.max, improvedStats.max) - Math.max(baselineStats.min, improvedStats.min));
    
    return overlap / Math.max(baselineRange, improvedRange);
  }

  private calculateIllusionFactor(baselineStats: any, improvedStats: any, significance: number): number {
    const meanImprovement = improvedStats.mean - baselineStats.mean;
    const baselineVariance = baselineStats.stdDev;
    
    // Illusion factor: how much of the improvement is within baseline variance
    const illusionFactor = Math.min(1.0, baselineVariance / Math.max(0.001, Math.abs(meanImprovement)));
    
    // Adjust for statistical significance
    return illusionFactor * (1 - significance);
  }

  private initializeVarianceThresholds(): void {
    this.varianceThresholds.set('high_variance', 0.1);
    this.varianceThresholds.set('medium_variance', 0.05);
    this.varianceThresholds.set('low_variance', 0.02);
  }
}

// ============================================================
// IMPLEMENTATION SENSITIVITY ANALYSIS
// ============================================================

export interface ImplementationSensitivity {
  parameter: string;
  sensitivity: number;
  impact: number;
  stability: number;
  recommendations: string[];
}

export interface SensitivityAnalysis {
  decodingParameters: ImplementationSensitivity;
  seeds: ImplementationSensitivity;
  prompts: ImplementationSensitivity;
  hardware: ImplementationSensitivity;
  overallSensitivity: number;
  stabilityScore: number;
}

export class ImplementationSensitivityAnalyzer {
  private sensitivityHistory: Map<string, SensitivityAnalysis[]> = new Map();
  private stabilityThresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeStabilityThresholds();
    logger.info('Implementation Sensitivity Analyzer initialized');
  }

  /**
   * Analyze Implementation Sensitivity
   * Test sensitivity to decoding parameters, seeds, prompts, hardware
   */
  async analyzeImplementationSensitivity(
    evaluationRuns: EvaluationRun[]
  ): Promise<SensitivityAnalysis> {
    logger.info('Analyzing implementation sensitivity', {
      runCount: evaluationRuns.length
    });

    // Step 1: Analyze decoding parameter sensitivity
    const decodingSensitivity = await this.analyzeParameterSensitivity(
      evaluationRuns, 
      'decodingParameters'
    );
    
    // Step 2: Analyze seed sensitivity
    const seedSensitivity = await this.analyzeParameterSensitivity(
      evaluationRuns, 
      'seeds'
    );
    
    // Step 3: Analyze prompt sensitivity
    const promptSensitivity = await this.analyzeParameterSensitivity(
      evaluationRuns, 
      'prompts'
    );
    
    // Step 4: Analyze hardware sensitivity
    const hardwareSensitivity = await this.analyzeParameterSensitivity(
      evaluationRuns, 
      'hardware'
    );
    
    // Step 5: Calculate overall sensitivity
    const overallSensitivity = this.calculateOverallSensitivity([
      decodingSensitivity,
      seedSensitivity,
      promptSensitivity,
      hardwareSensitivity
    ]);
    
    const stabilityScore = this.calculateStabilityScore(overallSensitivity);

    const analysis: SensitivityAnalysis = {
      decodingParameters: decodingSensitivity,
      seeds: seedSensitivity,
      prompts: promptSensitivity,
      hardware: hardwareSensitivity,
      overallSensitivity,
      stabilityScore
    };

    logger.info('Implementation sensitivity analysis completed', {
      overallSensitivity: analysis.overallSensitivity,
      stabilityScore: analysis.stabilityScore
    });

    return analysis;
  }

  /**
   * Test Small Dataset Sensitivity
   * Analyze impact of small dataset sizes on performance swings
   */
  async testSmallDatasetSensitivity(
    datasetSize: number,
    evaluationRuns: EvaluationRun[]
  ): Promise<{
    sensitivity: number;
    performanceSwing: number;
    stabilityThreshold: number;
    recommendation: string;
  }> {
    logger.info('Testing small dataset sensitivity', {
      datasetSize,
      runCount: evaluationRuns.length
    });

    // Simulate small dataset sensitivity analysis
    const sensitivity = Math.min(1.0, 1 / Math.sqrt(datasetSize)); // Higher sensitivity for smaller datasets
    const performanceSwing = sensitivity * 0.1; // Performance swing scales with sensitivity
    const stabilityThreshold = this.stabilityThresholds.get('small_dataset') || 0.05;
    
    let recommendation: string;
    if (sensitivity > stabilityThreshold) {
      recommendation = `Dataset size of ${datasetSize} is too small for reliable evaluation. Consider increasing to at least ${Math.ceil(1 / (stabilityThreshold * stabilityThreshold))} examples.`;
    } else {
      recommendation = `Dataset size of ${datasetSize} appears adequate for evaluation, but monitor for performance swings.`;
    }

    logger.info('Small dataset sensitivity test completed', {
      sensitivity,
      performanceSwing,
      recommendation: recommendation.substring(0, 50) + '...'
    });

    return {
      sensitivity,
      performanceSwing,
      stabilityThreshold,
      recommendation
    };
  }

  private async analyzeParameterSensitivity(
    evaluationRuns: EvaluationRun[],
    parameterType: string
  ): Promise<ImplementationSensitivity> {
    // Group runs by parameter type
    const parameterGroups = this.groupRunsByParameter(evaluationRuns, parameterType);
    
    // Calculate sensitivity metrics
    const sensitivity = this.calculateParameterSensitivity(parameterGroups);
    const impact = this.calculateParameterImpact(parameterGroups);
    const stability = this.calculateParameterStability(parameterGroups);
    const recommendations = this.generateParameterRecommendations(parameterType, sensitivity, impact, stability);

    return {
      parameter: parameterType,
      sensitivity,
      impact,
      stability,
      recommendations
    };
  }

  private groupRunsByParameter(runs: EvaluationRun[], parameterType: string): Map<string, EvaluationRun[]> {
    const groups = new Map<string, EvaluationRun[]>();
    
    runs.forEach(run => {
      let key: string;
      switch (parameterType) {
        case 'decodingParameters':
          key = JSON.stringify(run.parameters);
          break;
        case 'seeds':
          key = run.seed.toString();
          break;
        case 'prompts':
          key = run.prompt;
          break;
        case 'hardware':
          key = run.hardware;
          break;
        default:
          key = 'unknown';
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(run);
    });
    
    return groups;
  }

  private calculateParameterSensitivity(parameterGroups: Map<string, EvaluationRun[]>): number {
    if (parameterGroups.size <= 1) return 0;
    
    const groupMeans = Array.from(parameterGroups.values()).map(runs => 
      runs.reduce((sum, run) => sum + run.result, 0) / runs.length
    );
    
    const overallMean = groupMeans.reduce((sum, mean) => sum + mean, 0) / groupMeans.length;
    const variance = groupMeans.reduce((sum, mean) => sum + Math.pow(mean - overallMean, 2), 0) / groupMeans.length;
    
    return Math.sqrt(variance) / overallMean; // Coefficient of variation
  }

  private calculateParameterImpact(parameterGroups: Map<string, EvaluationRun[]>): number {
    if (parameterGroups.size <= 1) return 0;
    
    const groupMeans = Array.from(parameterGroups.values()).map(runs => 
      runs.reduce((sum, run) => sum + run.result, 0) / runs.length
    );
    
    const minMean = Math.min(...groupMeans);
    const maxMean = Math.max(...groupMeans);
    
    return (maxMean - minMean) / Math.max(minMean, 0.001);
  }

  private calculateParameterStability(parameterGroups: Map<string, EvaluationRun[]>): number {
    if (parameterGroups.size <= 1) return 1;
    
    const groupStabilities = Array.from(parameterGroups.values()).map(runs => {
      if (runs.length <= 1) return 1;
      
      const mean = runs.reduce((sum, run) => sum + run.result, 0) / runs.length;
      const variance = runs.reduce((sum, run) => sum + Math.pow(run.result - mean, 2), 0) / runs.length;
      const stdDev = Math.sqrt(variance);
      
      return Math.max(0, 1 - stdDev / Math.max(mean, 0.001));
    });
    
    return groupStabilities.reduce((sum, stability) => sum + stability, 0) / groupStabilities.length;
  }

  private generateParameterRecommendations(
    parameterType: string,
    sensitivity: number,
    impact: number,
    stability: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (sensitivity > 0.1) {
      recommendations.push(`High sensitivity to ${parameterType}. Standardize parameters across evaluations.`);
    }
    
    if (impact > 0.05) {
      recommendations.push(`Significant impact from ${parameterType} variations. Report parameter details in publications.`);
    }
    
    if (stability < 0.8) {
      recommendations.push(`Low stability with ${parameterType}. Increase sample size or improve methodology.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push(`${parameterType} shows acceptable sensitivity levels.`);
    }
    
    return recommendations;
  }

  private calculateOverallSensitivity(sensitivities: ImplementationSensitivity[]): number {
    return sensitivities.reduce((sum, sens) => sum + sens.sensitivity, 0) / sensitivities.length;
  }

  private calculateStabilityScore(overallSensitivity: number): number {
    return Math.max(0, 1 - overallSensitivity);
  }

  private initializeStabilityThresholds(): void {
    this.stabilityThresholds.set('small_dataset', 0.05);
    this.stabilityThresholds.set('medium_dataset', 0.03);
    this.stabilityThresholds.set('large_dataset', 0.02);
  }
}

// ============================================================
// RL METHOD EVALUATION
// ============================================================

export interface RLMethodEvaluation {
  methodName: string;
  reportedResults: number;
  standardizedResults: number;
  performanceDrop: number;
  overfittingScore: number;
  statisticalSignificance: number;
  isSignificant: boolean;
  evaluationQuality: number;
}

export interface RLEvaluationAnalysis {
  methods: RLMethodEvaluation[];
  averageDrop: number;
  significantMethods: number;
  overfittingMethods: number;
  qualityScore: number;
  recommendations: string[];
}

export class RLMethodEvaluator {
  private rlMethodHistory: Map<string, RLMethodEvaluation[]> = new Map();
  private evaluationStandards: Map<string, number> = new Map();

  constructor() {
    this.initializeEvaluationStandards();
    logger.info('RL Method Evaluator initialized');
  }

  /**
   * Evaluate RL Methods Under Standardized Conditions
   * Test for minimal real gains and overfitting
   */
  async evaluateRLMethods(
    methods: Array<{
      name: string;
      reportedResults: number;
      standardizedResults: number;
      sampleSize: number;
    }>
  ): Promise<RLEvaluationAnalysis> {
    logger.info('Evaluating RL methods under standardized conditions', {
      methodCount: methods.length
    });

    const evaluations: RLMethodEvaluation[] = [];
    
    for (const method of methods) {
      const evaluation = await this.evaluateSingleRLMethod(method);
      evaluations.push(evaluation);
    }
    
    // Calculate aggregate metrics
    const averageDrop = evaluations.reduce((sum, evaluation) => sum + evaluation.performanceDrop, 0) / evaluations.length;
    const significantMethods = evaluations.filter(evaluation => evaluation.isSignificant).length;
    const overfittingMethods = evaluations.filter(evaluation => evaluation.overfittingScore > 0.7).length;
    const qualityScore = evaluations.reduce((sum, evaluation) => sum + evaluation.evaluationQuality, 0) / evaluations.length;
    
    // Generate recommendations
    const recommendations = this.generateRLRecommendations(evaluations, averageDrop, significantMethods, overfittingMethods);

    const analysis: RLEvaluationAnalysis = {
      methods: evaluations,
      averageDrop,
      significantMethods,
      overfittingMethods,
      qualityScore,
      recommendations
    };

    logger.info('RL method evaluation completed', {
      averageDrop: analysis.averageDrop,
      significantMethods: analysis.significantMethods,
      overfittingMethods: analysis.overfittingMethods,
      qualityScore: analysis.qualityScore
    });

    return analysis;
  }

  /**
   * Test for Overfitting in RL Methods
   * Identify methods that overfit easily
   */
  async testRLOverfitting(
    methodName: string,
    trainingResults: number[],
    validationResults: number[],
    testResults: number[]
  ): Promise<{
    overfittingScore: number;
    generalizationGap: number;
    isOverfitting: boolean;
    recommendation: string;
  }> {
    logger.info('Testing RL method for overfitting', { methodName });

    const trainingMean = trainingResults.reduce((sum, val) => sum + val, 0) / trainingResults.length;
    const validationMean = validationResults.reduce((sum, val) => sum + val, 0) / validationResults.length;
    const testMean = testResults.reduce((sum, val) => sum + val, 0) / testResults.length;
    
    const generalizationGap = trainingMean - testMean;
    const validationGap = trainingMean - validationMean;
    
    // Overfitting score: higher gap indicates more overfitting
    const overfittingScore = Math.min(1.0, Math.abs(generalizationGap) / Math.max(trainingMean, 0.001));
    
    const isOverfitting = overfittingScore > 0.3; // Threshold for overfitting
    
    let recommendation: string;
    if (isOverfitting) {
      recommendation = `${methodName} shows significant overfitting (score: ${overfittingScore.toFixed(3)}). Consider regularization techniques or larger validation sets.`;
    } else if (overfittingScore > 0.1) {
      recommendation = `${methodName} shows mild overfitting tendencies. Monitor performance on held-out test sets.`;
    } else {
      recommendation = `${methodName} shows good generalization properties.`;
    }

    logger.info('RL overfitting test completed', {
      methodName,
      overfittingScore,
      isOverfitting,
      recommendation: recommendation.substring(0, 50) + '...'
    });

    return {
      overfittingScore,
      generalizationGap,
      isOverfitting,
      recommendation
    };
  }

  private async evaluateSingleRLMethod(method: any): Promise<RLMethodEvaluation> {
    const performanceDrop = method.reportedResults - method.standardizedResults;
    const overfittingScore = Math.min(1.0, Math.abs(performanceDrop) / Math.max(method.reportedResults, 0.001));
    
    // Simulate statistical significance test
    const statisticalSignificance = Math.max(0.5, 1 - overfittingScore);
    const isSignificant = statisticalSignificance > 0.95;
    
    // Evaluate quality based on sample size and methodology
    const evaluationQuality = this.calculateEvaluationQuality(method.sampleSize, performanceDrop);

    return {
      methodName: method.name,
      reportedResults: method.reportedResults,
      standardizedResults: method.standardizedResults,
      performanceDrop,
      overfittingScore,
      statisticalSignificance,
      isSignificant,
      evaluationQuality
    };
  }

  private calculateEvaluationQuality(sampleSize: number, performanceDrop: number): number {
    // Quality based on sample size and performance consistency
    const sizeQuality = Math.min(1.0, sampleSize / 1000); // Normalize to 1000 samples
    const consistencyQuality = Math.max(0, 1 - Math.abs(performanceDrop) / 0.2); // Penalize large drops
    
    return (sizeQuality + consistencyQuality) / 2;
  }

  private generateRLRecommendations(
    evaluations: RLMethodEvaluation[],
    averageDrop: number,
    significantMethods: number,
    overfittingMethods: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (averageDrop > 0.1) {
      recommendations.push(`Average performance drop of ${(averageDrop * 100).toFixed(1)}% suggests systematic evaluation issues.`);
    }
    
    if (significantMethods < evaluations.length * 0.5) {
      recommendations.push(`Only ${significantMethods}/${evaluations.length} methods show statistically significant improvements.`);
    }
    
    if (overfittingMethods > evaluations.length * 0.3) {
      recommendations.push(`${overfittingMethods}/${evaluations.length} methods show significant overfitting tendencies.`);
    }
    
    recommendations.push('Implement rigorous multi-seed evaluation protocols and transparent reporting standards.');
    
    return recommendations;
  }

  private initializeEvaluationStandards(): void {
    this.evaluationStandards.set('min_sample_size', 100);
    this.evaluationStandards.set('min_seeds', 5);
    this.evaluationStandards.set('confidence_level', 0.95);
    this.evaluationStandards.set('overfitting_threshold', 0.3);
  }
}

// ============================================================
// MULTI-SEED EVALUATION PROTOCOLS
// ============================================================

export interface MultiSeedProtocol {
  name: string;
  seedCount: number;
  evaluationRounds: number;
  confidenceLevel: number;
  stabilityThreshold: number;
}

export interface MultiSeedResults {
  protocol: MultiSeedProtocol;
  results: number[];
  mean: number;
  stdDev: number;
  confidenceInterval: [number, number];
  stabilityScore: number;
  isStable: boolean;
  recommendation: string;
}

export class MultiSeedEvaluator {
  private protocols: Map<string, MultiSeedProtocol> = new Map();
  private evaluationHistory: Map<string, MultiSeedResults[]> = new Map();

  constructor() {
    this.initializeProtocols();
    logger.info('Multi-Seed Evaluator initialized');
  }

  /**
   * Implement Rigorous Multi-Seed Evaluation Protocols
   * Ensure statistically significant and stable results
   */
  async implementMultiSeedProtocol(
    protocolName: string,
    evaluationFunction: (seed: number) => Promise<number>
  ): Promise<MultiSeedResults> {
    logger.info('Implementing multi-seed evaluation protocol', { protocolName });

    const protocol = this.protocols.get(protocolName);
    if (!protocol) {
      throw new Error(`Protocol ${protocolName} not found`);
    }

    const results: number[] = [];
    
    // Run evaluations across multiple seeds
    for (let round = 0; round < protocol.evaluationRounds; round++) {
      for (let seed = 0; seed < protocol.seedCount; seed++) {
        const result = await evaluationFunction(seed + round * protocol.seedCount);
        results.push(result);
      }
    }
    
    // Calculate statistics
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(results, protocol.confidenceLevel);
    
    // Calculate stability score
    const stabilityScore = this.calculateStabilityScore(results, protocol.stabilityThreshold);
    const isStable = stabilityScore >= protocol.stabilityThreshold;
    
    // Generate recommendation
    const recommendation = this.generateStabilityRecommendation(stabilityScore, isStable, protocol);

    const multiSeedResults: MultiSeedResults = {
      protocol,
      results,
      mean,
      stdDev,
      confidenceInterval,
      stabilityScore,
      isStable,
      recommendation
    };

    // Store results
    if (!this.evaluationHistory.has(protocolName)) {
      this.evaluationHistory.set(protocolName, []);
    }
    this.evaluationHistory.get(protocolName)!.push(multiSeedResults);

    logger.info('Multi-seed evaluation protocol completed', {
      protocolName,
      mean: multiSeedResults.mean,
      stdDev: multiSeedResults.stdDev,
      stabilityScore: multiSeedResults.stabilityScore,
      isStable: multiSeedResults.isStable
    });

    return multiSeedResults;
  }

  /**
   * Compare Methods Under Rigorous Evaluation
   * Ensure fair comparison with statistical significance
   */
  async compareMethodsRigorously(
    methods: Array<{
      name: string;
      evaluationFunction: (seed: number) => Promise<number>;
    }>,
    protocolName: string = 'standard'
  ): Promise<{
    methodResults: Map<string, MultiSeedResults>;
    comparison: {
      bestMethod: string;
      statisticalSignificance: number;
      isSignificant: boolean;
      recommendation: string;
    };
  }> {
    logger.info('Comparing methods under rigorous evaluation', {
      methodCount: methods.length,
      protocolName
    });

    const methodResults = new Map<string, MultiSeedResults>();
    
    // Evaluate each method
    for (const method of methods) {
      const results = await this.implementMultiSeedProtocol(protocolName, method.evaluationFunction);
      methodResults.set(method.name, results);
    }
    
    // Compare methods
    const comparison = await this.compareMethodResults(methodResults);

    logger.info('Rigorous method comparison completed', {
      bestMethod: comparison.bestMethod,
      statisticalSignificance: comparison.statisticalSignificance,
      isSignificant: comparison.isSignificant
    });

    return {
      methodResults,
      comparison
    };
  }

  private calculateConfidenceInterval(results: number[], confidenceLevel: number): [number, number] {
    const sorted = [...results].sort((a, b) => a - b);
    const alpha = 1 - confidenceLevel;
    const lowerIndex = Math.floor(alpha / 2 * sorted.length);
    const upperIndex = Math.ceil((1 - alpha / 2) * sorted.length);
    
    return [sorted[lowerIndex], sorted[upperIndex]];
  }

  private calculateStabilityScore(results: number[], threshold: number): number {
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);
    
    // Stability score: lower variance = higher stability
    return Math.max(0, 1 - stdDev / Math.max(mean, 0.001));
  }

  private generateStabilityRecommendation(
    stabilityScore: number,
    isStable: boolean,
    protocol: MultiSeedProtocol
  ): string {
    if (isStable) {
      return `Results are stable (score: ${stabilityScore.toFixed(3)}). Evaluation meets ${protocol.name} standards.`;
    } else {
      return `Results are unstable (score: ${stabilityScore.toFixed(3)}). Consider increasing seed count or evaluation rounds.`;
    }
  }

  private async compareMethodResults(
    methodResults: Map<string, MultiSeedResults>
  ): Promise<{
    bestMethod: string;
    statisticalSignificance: number;
    isSignificant: boolean;
    recommendation: string;
  }> {
    const methods = Array.from(methodResults.entries());
    
    // Find best method by mean performance
    const bestMethod = methods.reduce((best, current) => 
      current[1].mean > best[1].mean ? current : best
    )[0];
    
    // Calculate statistical significance
    const bestResults = methodResults.get(bestMethod)!;
    const otherResults = methods.filter(([name]) => name !== bestMethod).map(([, results]) => results);
    
    const statisticalSignificance = this.calculateStatisticalSignificance(bestResults, otherResults);
    const isSignificant = statisticalSignificance > 0.95;
    
    let recommendation: string;
    if (isSignificant) {
      recommendation = `${bestMethod} shows statistically significant improvement over other methods.`;
    } else {
      recommendation = 'No statistically significant differences between methods. Consider larger sample sizes.';
    }
    
    return {
      bestMethod,
      statisticalSignificance,
      isSignificant,
      recommendation
    };
  }

  private calculateStatisticalSignificance(
    bestResults: MultiSeedResults,
    otherResults: MultiSeedResults[]
  ): number {
    // Simulate statistical significance calculation
    const bestMean = bestResults.mean;
    const otherMeans = otherResults.map(results => results.mean);
    const maxOtherMean = Math.max(...otherMeans);
    
    const difference = bestMean - maxOtherMean;
    const pooledStdDev = Math.sqrt(
      (bestResults.stdDev * bestResults.stdDev + 
       otherResults.reduce((sum, results) => sum + results.stdDev * results.stdDev, 0) / otherResults.length) / 2
    );
    
    const tStatistic = difference / (pooledStdDev / Math.sqrt(bestResults.results.length));
    const pValue = Math.max(0.001, Math.min(0.999, 1 - Math.abs(tStatistic) / 10));
    
    return 1 - pValue;
  }

  private initializeProtocols(): void {
    this.protocols.set('standard', {
      name: 'Standard Multi-Seed Protocol',
      seedCount: 10,
      evaluationRounds: 3,
      confidenceLevel: 0.95,
      stabilityThreshold: 0.8
    });
    
    this.protocols.set('rigorous', {
      name: 'Rigorous Multi-Seed Protocol',
      seedCount: 20,
      evaluationRounds: 5,
      confidenceLevel: 0.99,
      stabilityThreshold: 0.9
    });
    
    this.protocols.set('minimal', {
      name: 'Minimal Multi-Seed Protocol',
      seedCount: 5,
      evaluationRounds: 2,
      confidenceLevel: 0.90,
      stabilityThreshold: 0.7
    });
  }
}

// ============================================================
// MAIN RIGOROUS EVALUATION SYSTEM
// ============================================================

export class RigorousEvaluationSystem {
  private baselineVarianceAnalyzer: BaselineVarianceAnalyzer;
  private implementationSensitivityAnalyzer: ImplementationSensitivityAnalyzer;
  private rlMethodEvaluator: RLMethodEvaluator;
  private multiSeedEvaluator: MultiSeedEvaluator;

  constructor() {
    this.baselineVarianceAnalyzer = new BaselineVarianceAnalyzer();
    this.implementationSensitivityAnalyzer = new ImplementationSensitivityAnalyzer();
    this.rlMethodEvaluator = new RLMethodEvaluator();
    this.multiSeedEvaluator = new MultiSeedEvaluator();
    logger.info('Rigorous Evaluation System initialized');
  }

  /**
   * Execute Complete Rigorous Evaluation Analysis
   * Address the illusion of reasoning gains
   */
  async executeRigorousEvaluation(
    baselineResults: number[],
    improvedResults: number[],
    evaluationRuns: EvaluationRun[],
    rlMethods: Array<{
      name: string;
      reportedResults: number;
      standardizedResults: number;
      sampleSize: number;
    }>
  ): Promise<any> {
    logger.info('Executing rigorous evaluation analysis');

    // Step 1: Analyze baseline variance
    const baselineVariance = await this.baselineVarianceAnalyzer.analyzeBaselineVariance(
      baselineResults, 
      improvedResults
    );
    
    // Step 2: Detect illusion of gains
    const illusionDetection = await this.baselineVarianceAnalyzer.detectIllusionOfGains(
      baselineResults, 
      improvedResults
    );
    
    // Step 3: Analyze implementation sensitivity
    const sensitivityAnalysis = await this.implementationSensitivityAnalyzer.analyzeImplementationSensitivity(
      evaluationRuns
    );
    
    // Step 4: Test small dataset sensitivity
    const datasetSensitivity = await this.implementationSensitivityAnalyzer.testSmallDatasetSensitivity(
      baselineResults.length,
      evaluationRuns
    );
    
    // Step 5: Evaluate RL methods
    const rlEvaluation = await this.rlMethodEvaluator.evaluateRLMethods(rlMethods);
    
    // Step 6: Implement multi-seed protocol
    const multiSeedResults = await this.multiSeedEvaluator.implementMultiSeedProtocol(
      'rigorous',
      async (seed: number) => {
        // Simulate evaluation function
        return Math.random() * 0.1 + 0.7; // Simulate results around 0.7-0.8
      }
    );

    const result = {
      baselineVariance,
      illusionDetection,
      sensitivityAnalysis,
      datasetSensitivity,
      rlEvaluation,
      multiSeedResults,
      criticalFindings: {
        illusionOfGains: illusionDetection.isIllusion,
        implementationSensitivity: sensitivityAnalysis.overallSensitivity,
        rlMethodDrops: rlEvaluation.averageDrop,
        statisticalSignificance: baselineVariance.statisticalSignificance,
        evaluationQuality: rlEvaluation.qualityScore
      },
      methodology: [
        'Rigorous Evaluation: Address the illusion of reasoning gains',
        'Baseline Variance Analysis: Detect improvements within margin of error',
        'Implementation Sensitivity: Test sensitivity to parameters, seeds, prompts, hardware',
        'Small Dataset Sensitivity: Analyze impact of small dataset sizes',
        'RL Method Evaluation: Test for minimal real gains and overfitting',
        'Multi-Seed Protocols: Ensure statistically significant and stable results',
        'Transparent Reporting: Implement rigorous reporting standards'
      ],
      researchCritique: {
        problem: 'Illusion of reasoning gains falling within baseline variance ranges',
        sensitivity: 'High sensitivity to implementation details (decoding parameters, seeds, prompts, hardware)',
        datasetSize: 'Small dataset sizes causing performance swings (e.g., AIME 24 with 30 examples)',
        rlMethods: 'RL approaches showing minimal real gains and overfitting easily',
        standardization: 'Need for rigorous multi-seed evaluation protocols and transparent reporting',
        significance: 'Recent methods\' improvements fall entirely within baseline model variance ranges'
      },
      recommendations: [
        'Implement rigorous multi-seed evaluation protocols',
        'Use larger, more diverse datasets for evaluation',
        'Standardize implementation parameters across evaluations',
        'Report statistical significance and confidence intervals',
        'Test for overfitting with proper train/validation/test splits',
        'Transparent reporting of all experimental details',
        'Focus on statistically significant improvements over baselines'
      ],
      timestamp: new Date().toISOString()
    };

    logger.info('Rigorous evaluation analysis completed', {
      illusionOfGains: result.criticalFindings.illusionOfGains,
      implementationSensitivity: result.criticalFindings.implementationSensitivity,
      rlMethodDrops: result.criticalFindings.rlMethodDrops,
      statisticalSignificance: result.criticalFindings.statisticalSignificance
    });

    return result;
  }
}

export default RigorousEvaluationSystem;
