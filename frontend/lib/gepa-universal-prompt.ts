/**
 * GEPA Universal Prompt Discovery
 *
 * Uses Genetic-Pareto optimization to find prompts that generalize across
 * multiple unrelated benchmarks. Searches the Pareto frontier to find the
 * "one prompt to rule them all" vs domain-specific specialists.
 *
 * Research Question: Can a single prompt perform well across diverse domains,
 * or do we always need specialists?
 */

import { GEPAAlgorithms, PromptIndividual } from './gepa-algorithms';

// ============================================================================
// Benchmark Definitions
// ============================================================================

export interface Benchmark {
  name: string;
  domain: string;
  testCases: BenchmarkTestCase[];
  evaluator: (response: string, expected: string) => number; // Returns 0-1 score
}

export interface BenchmarkTestCase {
  input: string;
  expected: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Multi-Domain Fitness
// ============================================================================

export interface MultiDomainFitness {
  // Individual benchmark scores (0-1 scale)
  mathReasoning: number;
  codeGeneration: number;
  creativeWriting: number;
  legalAnalysis: number;
  scientificReasoning: number;
  businessStrategy: number;

  // Aggregate metrics
  averageScore: number;           // Mean across all benchmarks
  harmonicMean: number;           // Penalizes poor performance in any domain
  worstCaseScore: number;         // Min score (robustness metric)
  variance: number;               // Low variance = consistent generalization

  // Specialization vs Generalization
  isSpecialist: boolean;          // High score in 1-2 domains, low in others
  isGeneralist: boolean;          // Consistent medium-high scores across all
  specializationIndex: number;    // 0 = generalist, 1 = specialist

  // Traditional objectives
  cost: number;
  latency: number;
  tokenCount: number;
}

// ============================================================================
// Universal Prompt Individual
// ============================================================================

export interface UniversalPromptIndividual extends PromptIndividual {
  multiDomainFitness: MultiDomainFitness;
  paretoRank: number;             // 0 = Pareto optimal
  crowdingDistance: number;       // Diversity metric in objective space
  dominatedBy: string[];          // IDs of individuals that dominate this one
  dominates: string[];            // IDs of individuals this one dominates
}

// ============================================================================
// Main Algorithm
// ============================================================================

export class UniversalPromptDiscovery {
  private benchmarks: Map<string, Benchmark> = new Map();
  private universalPopulation: Map<string, UniversalPromptIndividual> = new Map();

  /**
   * Add a benchmark to the multi-domain optimization
   */
  addBenchmark(benchmark: Benchmark): void {
    this.benchmarks.set(benchmark.name, benchmark);
    console.log(`📊 Added benchmark: ${benchmark.name} (${benchmark.testCases.length} test cases)`);
  }

  /**
   * Evaluate a prompt across ALL benchmarks
   */
  async evaluatePromptAcrossBenchmarks(
    prompt: string,
    llmEndpoint: (prompt: string, input: string) => Promise<string>
  ): Promise<MultiDomainFitness> {

    const benchmarkScores: Record<string, number> = {};
    let totalCost = 0;
    let totalLatency = 0;
    let totalTokens = 0;

    // Run prompt on each benchmark
    for (const [name, benchmark] of this.benchmarks.entries()) {
      const scores: number[] = [];

      for (const testCase of benchmark.testCases) {
        const startTime = Date.now();

        // Apply prompt template to test case
        const fullPrompt = this.applyPromptTemplate(prompt, testCase.input);

        // Get LLM response
        const response = await llmEndpoint(fullPrompt, testCase.input);

        // Evaluate response
        const score = benchmark.evaluator(response, testCase.expected);
        scores.push(score);

        // Track metrics
        totalLatency += (Date.now() - startTime);
        totalTokens += this.estimateTokens(fullPrompt + response);
        totalCost += this.estimateCost(fullPrompt + response);
      }

      // Average score for this benchmark
      benchmarkScores[name] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    // Calculate aggregate metrics
    const scores = Object.values(benchmarkScores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const harmonicMean = scores.length / scores.reduce((sum, s) => sum + (1 / (s + 0.001)), 0);
    const worstCaseScore = Math.min(...scores);
    const variance = this.calculateVariance(scores);

    // Specialization vs Generalization metrics
    const specializationIndex = this.calculateSpecializationIndex(scores);
    const isSpecialist = specializationIndex > 0.7;
    const isGeneralist = specializationIndex < 0.3 && worstCaseScore > 0.6;

    return {
      mathReasoning: benchmarkScores['math'] || 0,
      codeGeneration: benchmarkScores['code'] || 0,
      creativeWriting: benchmarkScores['creative'] || 0,
      legalAnalysis: benchmarkScores['legal'] || 0,
      scientificReasoning: benchmarkScores['science'] || 0,
      businessStrategy: benchmarkScores['business'] || 0,

      averageScore,
      harmonicMean,
      worstCaseScore,
      variance,

      isSpecialist,
      isGeneralist,
      specializationIndex,

      cost: totalCost,
      latency: totalLatency / this.getTotalTestCases(),
      tokenCount: totalTokens
    };
  }

  /**
   * Find Pareto frontier in multi-dimensional objective space
   *
   * A prompt P1 dominates P2 if:
   * - P1 is better or equal on ALL objectives
   * - P1 is strictly better on AT LEAST ONE objective
   */
  findMultiDomainParetoFrontier(
    population: UniversalPromptIndividual[]
  ): UniversalPromptIndividual[][] {

    const fronts: UniversalPromptIndividual[][] = [];
    const dominated = new Set<string>();

    // Calculate domination relationships
    for (const p1 of population) {
      p1.dominatedBy = [];
      p1.dominates = [];

      for (const p2 of population) {
        if (p1.id === p2.id) continue;

        if (this.dominates(p1, p2)) {
          p1.dominates.push(p2.id);
        } else if (this.dominates(p2, p1)) {
          p1.dominatedBy.push(p2.id);
          dominated.add(p1.id);
        }
      }
    }

    // First front: non-dominated individuals
    const firstFront = population.filter(p => p.dominatedBy.length === 0);
    firstFront.forEach(p => p.paretoRank = 0);
    fronts.push(firstFront);

    // Subsequent fronts
    let currentFront = firstFront;
    let rank = 1;

    while (currentFront.length > 0) {
      const nextFront: UniversalPromptIndividual[] = [];

      for (const p1 of currentFront) {
        for (const dominatedId of p1.dominates) {
          const p2 = population.find(p => p.id === dominatedId);
          if (!p2) continue;

          p2.dominatedBy = p2.dominatedBy.filter(id => id !== p1.id);

          if (p2.dominatedBy.length === 0 && !nextFront.includes(p2)) {
            p2.paretoRank = rank;
            nextFront.push(p2);
          }
        }
      }

      if (nextFront.length > 0) {
        fronts.push(nextFront);
      }
      currentFront = nextFront;
      rank++;
    }

    // Calculate crowding distance for each front
    fronts.forEach(front => this.calculateCrowdingDistance(front));

    return fronts;
  }

  /**
   * Check if p1 dominates p2 (Pareto dominance)
   *
   * Optimization objectives:
   * 1. Maximize: averageScore, harmonicMean, worstCaseScore
   * 2. Minimize: variance, cost, latency
   * 3. Special: Prefer generalists (low specializationIndex) for universal prompts
   */
  private dominates(
    p1: UniversalPromptIndividual,
    p2: UniversalPromptIndividual
  ): boolean {

    const f1 = p1.multiDomainFitness;
    const f2 = p2.multiDomainFitness;

    // Check all objectives
    const objectives = [
      // Maximize
      f1.averageScore >= f2.averageScore,
      f1.harmonicMean >= f2.harmonicMean,
      f1.worstCaseScore >= f2.worstCaseScore,

      // Minimize
      f1.variance <= f2.variance,
      f1.cost <= f2.cost,
      f1.latency <= f2.latency,
      f1.specializationIndex <= f2.specializationIndex, // Prefer generalists
    ];

    // All must be >= or <= (depending on direction)
    const allBetterOrEqual = objectives.every(cond => cond);

    // At least one must be strictly better
    const strictlyBetter = [
      f1.averageScore > f2.averageScore,
      f1.harmonicMean > f2.harmonicMean,
      f1.worstCaseScore > f2.worstCaseScore,
      f1.variance < f2.variance,
      f1.cost < f2.cost,
      f1.latency < f2.latency,
      f1.specializationIndex < f2.specializationIndex,
    ].some(cond => cond);

    return allBetterOrEqual && strictlyBetter;
  }

  /**
   * Calculate crowding distance for diversity preservation
   */
  private calculateCrowdingDistance(front: UniversalPromptIndividual[]): void {
    if (front.length === 0) return;

    // Initialize distances
    front.forEach(p => p.crowdingDistance = 0);

    // For each objective, sort and calculate distances
    const objectives = [
      'averageScore', 'harmonicMean', 'worstCaseScore',
      'variance', 'cost', 'latency', 'specializationIndex'
    ];

    for (const obj of objectives) {
      // Sort by this objective
      const sorted = [...front].sort((a, b) => {
        const aVal = (a.multiDomainFitness as any)[obj];
        const bVal = (b.multiDomainFitness as any)[obj];
        return aVal - bVal;
      });

      // Boundary points get infinite distance
      sorted[0].crowdingDistance = Infinity;
      sorted[sorted.length - 1].crowdingDistance = Infinity;

      // Calculate distances for middle points
      const maxVal = (sorted[sorted.length - 1].multiDomainFitness as any)[obj];
      const minVal = (sorted[0].multiDomainFitness as any)[obj];
      const range = maxVal - minVal;

      if (range === 0) continue;

      for (let i = 1; i < sorted.length - 1; i++) {
        const prev = (sorted[i - 1].multiDomainFitness as any)[obj];
        const next = (sorted[i + 1].multiDomainFitness as any)[obj];
        sorted[i].crowdingDistance += (next - prev) / range;
      }
    }
  }

  /**
   * Find "The One Prompt to Rule Them All"
   *
   * Strategy: Look for prompts on the Pareto frontier that:
   * 1. Are generalists (low specializationIndex)
   * 2. Have high worst-case performance (robust)
   * 3. Have low variance (consistent across domains)
   */
  async findUniversalPrompt(
    basePrompts: string[],
    llmEndpoint: (prompt: string, input: string) => Promise<string>,
    options?: {
      generations?: number;
      populationSize?: number;
      preferGeneralist?: boolean; // Bias toward generalists vs specialists
    }
  ): Promise<{
    universalPrompt: UniversalPromptIndividual | null;
    paretoFrontier: UniversalPromptIndividual[];
    specialists: Record<string, UniversalPromptIndividual>; // Best per domain
    analysis: UniversalPromptAnalysis;
  }> {

    console.log('\n🔍 GEPA Universal Prompt Discovery');
    console.log(`📊 Benchmarks: ${this.benchmarks.size}`);
    console.log(`🧬 Population: ${options?.populationSize || 50}`);
    console.log(`🔄 Generations: ${options?.generations || 10}`);
    console.log(`🎯 Goal: ${options?.preferGeneralist ? 'Universal Generalist' : 'Balanced Optimization'}\n`);

    // TODO: Implement GEPA evolution loop
    // For now, return structure

    return {
      universalPrompt: null,
      paretoFrontier: [],
      specialists: {},
      analysis: {
        generalistExists: false,
        bestGeneralistScore: 0,
        bestSpecialistScores: {},
        tradeoffAnalysis: '',
        recommendation: ''
      }
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private applyPromptTemplate(template: string, input: string): string {
    return template.replace('{input}', input);
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private estimateCost(text: string): number {
    const tokens = this.estimateTokens(text);
    // GPT-4 pricing: ~$0.03 per 1K tokens
    return (tokens / 1000) * 0.03;
  }

  private getTotalTestCases(): number {
    let total = 0;
    for (const benchmark of this.benchmarks.values()) {
      total += benchmark.testCases.length;
    }
    return total;
  }

  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Specialization Index: How concentrated is performance across domains?
   *
   * 0.0 = Perfect generalist (equal performance everywhere)
   * 1.0 = Perfect specialist (all performance in one domain)
   *
   * Uses Gini coefficient
   */
  private calculateSpecializationIndex(scores: number[]): number {
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;

    let numerator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i + 1) * sorted[i];
    }

    const sum = sorted.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;

    const gini = (2 * numerator) / (n * sum) - (n + 1) / n;
    return Math.max(0, Math.min(1, gini));
  }
}

// ============================================================================
// Analysis & Reporting
// ============================================================================

export interface UniversalPromptAnalysis {
  generalistExists: boolean;
  bestGeneralistScore: number;
  bestSpecialistScores: Record<string, number>;
  tradeoffAnalysis: string;
  recommendation: string;
}

/**
 * Analyze Pareto frontier to understand universal vs specialist trade-offs
 */
export function analyzeUniversalVsSpecialist(
  paretoFrontier: UniversalPromptIndividual[]
): UniversalPromptAnalysis {

  const generalists = paretoFrontier.filter(p => p.multiDomainFitness.isGeneralist);
  const specialists = paretoFrontier.filter(p => p.multiDomainFitness.isSpecialist);

  const bestGeneralist = generalists.reduce((best, p) =>
    p.multiDomainFitness.worstCaseScore > (best?.multiDomainFitness.worstCaseScore || 0) ? p : best,
    null as UniversalPromptIndividual | null
  );

  const bestSpecialistScores: Record<string, number> = {};
  const domains = ['mathReasoning', 'codeGeneration', 'creativeWriting', 'legalAnalysis', 'scientificReasoning', 'businessStrategy'];

  for (const domain of domains) {
    const best = paretoFrontier.reduce((best, p) =>
      (p.multiDomainFitness as any)[domain] > ((best?.multiDomainFitness as any)[domain] || 0) ? p : best,
      null as UniversalPromptIndividual | null
    );
    bestSpecialistScores[domain] = (best?.multiDomainFitness as any)[domain] || 0;
  }

  // Analysis
  const generalistExists = bestGeneralist !== null && bestGeneralist.multiDomainFitness.worstCaseScore > 0.7;
  const bestGeneralistScore = bestGeneralist?.multiDomainFitness.averageScore || 0;

  let tradeoffAnalysis = '';
  let recommendation = '';

  if (generalistExists) {
    const avgSpecialistScore = Object.values(bestSpecialistScores).reduce((a, b) => a + b, 0) / Object.keys(bestSpecialistScores).length;
    const performanceGap = avgSpecialistScore - bestGeneralistScore;

    tradeoffAnalysis = `
A universal generalist prompt was found with ${(bestGeneralistScore * 100).toFixed(1)}% average performance.
Specialists achieve ${(avgSpecialistScore * 100).toFixed(1)}% on average in their domains.
Performance gap: ${(performanceGap * 100).toFixed(1)}% (${performanceGap > 0.1 ? 'significant' : 'small'}).
    `.trim();

    if (performanceGap < 0.1) {
      recommendation = '✅ Use the universal prompt - minimal performance loss vs specialists.';
    } else {
      recommendation = '⚠️ Trade-off exists - use universal for general tasks, specialists for critical domains.';
    }
  } else {
    tradeoffAnalysis = 'No universal generalist found. Domains require specialized prompts.';
    recommendation = '🎯 Use domain-specific specialists from the Pareto frontier.';
  }

  return {
    generalistExists,
    bestGeneralistScore,
    bestSpecialistScores,
    tradeoffAnalysis,
    recommendation
  };
}
