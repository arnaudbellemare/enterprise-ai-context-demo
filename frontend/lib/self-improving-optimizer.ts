/**
 * HGM-Style Self-Improving Optimizer
 * 
 * Based on: "Huxley-Gödel Machine: Human-Level Coding Agent Development 
 * by an Approximation of the Optimal Self-Improving Machine"
 * arXiv:2510.21614
 * 
 * Applies self-improvement concepts to optimize:
 * - Delta rule parameters (residualClipValue, stabilityThreshold, etc.)
 * - Permutation system configuration (thresholds, component flags)
 * 
 * Key Features:
 * 1. Clade-level Metaproductivity (CMP) - evaluates long-term improvement potential
 * 2. Asynchronous execution - parallel parameter exploration
 * 3. Self-modification - evolves configurations based on performance
 */

import { ContextSynthesisConfig } from './rag/context-synthesizer';
import { UnifiedPipelineConfig } from './unified-permutation-pipeline';

/**
 * Candidate Configuration
 * Represents a parameter configuration that can evolve
 */
export interface OptimizerCandidate {
  id: string;
  parentId?: string;
  generation: number;
  
  // Delta rule parameters
  deltaRuleParams: {
    enableResidual: boolean;
    residualClipValue: number;
    enableDataDependentGating: boolean;
    gatingNetworkDim: number;
    adaptiveBeta: boolean;
    stabilityThreshold: number;
    gatingStrategy: 'uniform' | 'data-dependent' | 'per-dimension' | 'kimi-enhanced';
  };
  
  // Permutation system parameters
  permutationParams: {
    aceThreshold?: number;
    swirlThreshold?: number;
    rvsThreshold?: number;
    optimizationMode: 'quality' | 'speed' | 'balanced';
  };
  
  // Performance metrics
  performance: {
    immediateScore: number;        // Direct evaluation score
    descendantScore: number;      // Average of descendant scores (CMP)
    cladeScore: number;            // CMP metric: aggregated descendant performance
    evaluationCount: number;       // How many times evaluated
    lastEvaluatedAt: number;       // Timestamp
  };
  
  // Metadata
  metadata: {
    createdAt: number;
    modifiedAt: number;
    mutationHistory: string[];      // Track what changed
    evaluationHistory: number[];   // Score history over time
  };
}

/**
 * Archive Entry (DGM-style tree structure)
 */
interface ArchiveEntry {
  candidate: OptimizerCandidate;
  children: string[];           // Child candidate IDs
  siblings: string[];           // Sibling candidate IDs
  depth: number;                // Depth in tree
  branchQuality: number;        // Quality of this branch
  diversityScore: number;       // Diversity relative to archive
}

/**
 * Evaluation Result
 */
export interface EvaluationResult {
  candidateId: string;
  score: number;
  metrics: {
    expressivity: number;          // Context synthesis quality
    efficiency: number;             // Memory/resource usage
    stability: number;              // Consistency across queries
    latency: number;                // Response time
    compressionRatio?: number;      // For delta rule
    residualMagnitude?: number;     // For residual learning
    gatingEfficiency?: number;     // For enhanced gating
  };
  query?: string;                  // Query used for evaluation
  timestamp: number;
}

/**
 * Self-Improving Optimizer
 */
export class SelfImprovingOptimizer {
  private candidates: Map<string, OptimizerCandidate> = new Map();
  private evaluationResults: Map<string, EvaluationResult[]> = new Map();
  private generationCounter: number = 0;
  private bestCandidateId: string | null = null;
  private maxArchiveSize: number = 100;
  
  // DGM archive structure
  private archive: Map<string, ArchiveEntry> = new Map();
  private rootId: string | null = null;
  private convergenceHistory: number[] = [];
  private stagnationCount: number = 0;
  
  // Configuration
  private config: {
    populationSize: number;         // Number of candidates per generation
    mutationRate: number;            // Probability of mutation
    crossoverRate: number;           // Probability of crossover
    eliteRatio: number;              // Top candidates to preserve
    cmpHorizon: number;              // Number of generations to track for CMP
    asyncEvaluation: boolean;        // Enable parallel evaluation
    maxEvaluations: number;          // Max evaluations per candidate
    // DGM enhancements
    diversityWeight?: number;        // Weight for diversity in selection
    archiveEnabled?: boolean;        // Enable DGM-style archive
    archiveSize?: number;            // Max archive size
    qualityDiversitySelection?: boolean; // Use quality-diversity selection
    openEndedExploration?: boolean;   // Enable open-ended exploration
    convergenceThreshold?: number;   // Convergence detection threshold
    stagnationLimit?: number;        // Generations before considering stagnation
  };
  
  constructor(config?: Partial<SelfImprovingOptimizer['config']>) {
    this.config = {
      populationSize: config?.populationSize ?? 10,
      mutationRate: config?.mutationRate ?? 0.3,
      crossoverRate: config?.crossoverRate ?? 0.5,
      eliteRatio: config?.eliteRatio ?? 0.2,
      cmpHorizon: config?.cmpHorizon ?? 3,
      asyncEvaluation: config?.asyncEvaluation ?? true,
      maxEvaluations: config?.maxEvaluations ?? 5,
      // DGM enhancements
      diversityWeight: config?.diversityWeight ?? 0.3,
      archiveEnabled: config?.archiveEnabled ?? true,
      archiveSize: config?.archiveSize ?? 100,
      qualityDiversitySelection: config?.qualityDiversitySelection ?? true,
      openEndedExploration: config?.openEndedExploration ?? true,
      convergenceThreshold: config?.convergenceThreshold ?? 0.01,
      stagnationLimit: config?.stagnationLimit ?? 5,
      ...config
    };
    
    this.maxArchiveSize = this.config.archiveSize ?? 100;
  }
  
  /**
   * Initialize with baseline configuration
   */
  initializeBaseline(
    deltaRuleConfig: Partial<ContextSynthesisConfig>,
    permutationConfig: Partial<UnifiedPipelineConfig>
  ): string {
    const candidate: OptimizerCandidate = {
      id: `gen-0-baseline-${Date.now()}`,
      generation: 0,
      deltaRuleParams: {
        enableResidual: deltaRuleConfig.enableResidual ?? false,
        residualClipValue: deltaRuleConfig.residualClipValue ?? 0.5,
        enableDataDependentGating: deltaRuleConfig.enableDataDependentGating ?? false,
        gatingNetworkDim: deltaRuleConfig.gatingNetworkDim ?? 64,
        adaptiveBeta: deltaRuleConfig.adaptiveBeta ?? false,
        stabilityThreshold: deltaRuleConfig.stabilityThreshold ?? 0.1,
        gatingStrategy: deltaRuleConfig.gatingStrategy ?? 'data-dependent',
      },
      permutationParams: {
        aceThreshold: permutationConfig.aceThreshold ?? 0.5,
        swirlThreshold: permutationConfig.swirlThreshold ?? 0.7,
        rvsThreshold: permutationConfig.rvsThreshold ?? 0.3,
        optimizationMode: permutationConfig.optimizationMode ?? 'balanced',
      },
      performance: {
        immediateScore: 0,
        descendantScore: 0,
        cladeScore: 0,
        evaluationCount: 0,
        lastEvaluatedAt: 0,
      },
      metadata: {
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        mutationHistory: [],
        evaluationHistory: [],
      },
    };
    
    this.candidates.set(candidate.id, candidate);
    this.bestCandidateId = candidate.id;
    
    // Add to archive as root
    if (this.config.archiveEnabled) {
      this.addToArchive(candidate);
      this.rootId = candidate.id;
    }
    
    return candidate.id;
  }
  
  /**
   * DGM: Add candidate to tree-based archive
   */
  private addToArchive(candidate: OptimizerCandidate, parentId?: string): void {
    if (!this.archive) {
      this.archive = new Map();
    }
    
    const parentDepth = parentId && this.archive.has(parentId) 
      ? this.archive.get(parentId)!.depth 
      : -1;
    
    const entry: ArchiveEntry = {
      candidate,
      children: [],
      siblings: [],
      depth: parentDepth + 1,
      branchQuality: 0,
      diversityScore: 0,
    };
    
    // Update parent
    if (parentId && this.archive.has(parentId)) {
      const parentEntry = this.archive.get(parentId)!;
      parentEntry.children.push(candidate.id);
      entry.branchQuality = this.calculateBranchQuality(candidate.id);
      parentEntry.branchQuality = Math.max(
        parentEntry.branchQuality,
        entry.branchQuality
      );
    }
    
    // Update siblings
    if (parentId && this.archive.has(parentId)) {
      const parentEntry = this.archive.get(parentId)!;
      const siblings = parentEntry.children
        .filter(id => id !== candidate.id);
      entry.siblings = siblings;
      
      // Update sibling references
      for (const siblingId of siblings) {
        if (this.archive.has(siblingId)) {
          const sibling = this.archive.get(siblingId)!;
          if (!sibling.siblings.includes(candidate.id)) {
            sibling.siblings.push(candidate.id);
          }
        }
      }
    }
    
    // Calculate diversity relative to archive
    entry.diversityScore = this.calculateArchiveDiversity(candidate);
    
    this.archive.set(candidate.id, entry);
    
    // Prune archive if too large (keep best and most diverse)
    if (this.archive.size > this.maxArchiveSize) {
      this.pruneArchive();
    }
  }
  
  /**
   * DGM: Calculate branch quality (CMP of best descendant in branch)
   */
  private calculateBranchQuality(candidateId: string): number {
    const entry = this.archive.get(candidateId);
    if (!entry) return 0;
    
    if (entry.children.length === 0) {
      return this.calculateCMP(candidateId);
    }
    
    // Branch quality = max of own CMP and child branch qualities
    const childQualities = entry.children.map(id => 
      this.calculateBranchQuality(id)
    );
    const ownCMP = this.calculateCMP(candidateId);
    
    return Math.max(ownCMP, ...childQualities);
  }
  
  /**
   * DGM: Calculate diversity relative to archive
   */
  private calculateArchiveDiversity(candidate: OptimizerCandidate): number {
    if (!this.archive || this.archive.size <= 1) return 1.0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    for (const [id, entry] of this.archive.entries()) {
      if (id === candidate.id) continue;
      
      const distance = this.configurationDistance(candidate, entry.candidate);
      totalDistance += distance;
      comparisons++;
    }
    
    return comparisons > 0 ? totalDistance / comparisons : 1.0;
  }
  
  /**
   * DGM: Prune archive keeping best and most diverse
   */
  private pruneArchive(): void {
    const entries = Array.from(this.archive.entries())
      .map(([id, entry]) => ({ id, entry }));
    
    // Score each entry: quality + diversity
    const scored = entries.map(({ id, entry }) => {
      const quality = this.calculateBranchQuality(id);
      const diversity = entry.diversityScore;
      const score = 0.6 * quality + 0.4 * diversity;
      return { id, entry, score, quality, diversity };
    });
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    // Keep top entries
    const keepIds = new Set(scored.slice(0, this.maxArchiveSize).map(s => s.id));
    
    // Remove entries not in keep set (and update references)
    for (const [id, entry] of this.archive.entries()) {
      if (!keepIds.has(id)) {
        // Remove from parent's children
        const allEntries = Array.from(this.archive.values());
        for (const e of allEntries) {
          e.children = e.children.filter(cid => cid !== id);
          e.siblings = e.siblings.filter(sid => sid !== id);
        }
        
        this.archive.delete(id);
        this.candidates.delete(id);
      }
    }
  }
  
  /**
   * Evaluate candidate performance
   * 
   * This is the key evaluation function - in production, this would
   * run actual synthesis queries and measure quality metrics
   */
  async evaluateCandidate(
    candidateId: string,
    testQueries: string[],
    evaluator: (candidate: OptimizerCandidate, query: string) => Promise<EvaluationResult['metrics']>
  ): Promise<EvaluationResult> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }
    
    // Check evaluation limit
    if (candidate.performance.evaluationCount >= this.config.maxEvaluations) {
      // Return cached best result
      const results = this.evaluationResults.get(candidateId) || [];
      const bestResult = results.reduce((best, r) => r.score > best.score ? r : best, results[0]);
      return bestResult || this.createEmptyResult(candidateId);
    }
    
    // Evaluate on test queries
    const allMetrics: EvaluationResult['metrics'][] = [];
    
    if (this.config.asyncEvaluation) {
      // Parallel evaluation
      const evaluationPromises = testQueries.map(query =>
        evaluator(candidate, query)
      );
      const metrics = await Promise.all(evaluationPromises);
      allMetrics.push(...metrics);
    } else {
      // Sequential evaluation
      for (const query of testQueries) {
        const metrics = await evaluator(candidate, query);
        allMetrics.push(metrics);
      }
    }
    
    // Aggregate metrics
    const aggregatedMetrics = this.aggregateMetrics(allMetrics);
    const score = this.calculateScore(aggregatedMetrics);
    
    const result: EvaluationResult = {
      candidateId,
      score,
      metrics: aggregatedMetrics,
      timestamp: Date.now(),
    };
    
    // Store result
    if (!this.evaluationResults.has(candidateId)) {
      this.evaluationResults.set(candidateId, []);
    }
    this.evaluationResults.get(candidateId)!.push(result);
    
    // Update candidate performance
    candidate.performance.immediateScore = score;
    candidate.performance.evaluationCount++;
    candidate.performance.lastEvaluatedAt = Date.now();
    candidate.metadata.evaluationHistory.push(score);
    
    return result;
  }
  
  /**
   * CMP: Clade-level Metaproductivity
   * 
   * Evaluates candidate based on aggregated performance of its descendants
   * This captures long-term improvement potential, not just immediate performance
   */
  calculateCMP(candidateId: string): number {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) return 0;
    
    // Get all descendants
    const descendants = Array.from(this.candidates.values())
      .filter(c => this.isDescendant(c, candidateId));
    
    if (descendants.length === 0) {
      // No descendants yet - return immediate score
      return candidate.performance.immediateScore;
    }
    
    // Calculate descendant average score
    const descendantScores = descendants
      .map(d => d.performance.immediateScore)
      .filter(s => s > 0);
    
    if (descendantScores.length === 0) {
      return candidate.performance.immediateScore;
    }
    
    const avgDescendantScore = descendantScores.reduce((sum, s) => sum + s, 0) / descendantScores.length;
    
    // CMP = weighted combination of immediate and descendant performance
    // Weight immediate performance less if we have many successful descendants
    const descendantWeight = Math.min(0.7, descendants.length / 10);
    const immediateWeight = 1 - descendantWeight;
    
    const cladeScore = immediateWeight * candidate.performance.immediateScore + 
                      descendantWeight * avgDescendantScore;
    
    // Update candidate CMP
    candidate.performance.descendantScore = avgDescendantScore;
    candidate.performance.cladeScore = cladeScore;
    
    return cladeScore;
  }
  
  /**
   * Generate next generation via mutation and crossover
   */
  async evolveGeneration(): Promise<string[]> {
    this.generationCounter++;
    const currentGeneration = Array.from(this.candidates.values())
      .filter(c => c.generation === this.generationCounter - 1);
    
    if (currentGeneration.length === 0) {
      throw new Error('No candidates to evolve');
    }
    
    // Calculate CMP for all candidates
    for (const candidate of currentGeneration) {
      this.calculateCMP(candidate.id);
    }
    
    // Sort by CMP (not just immediate score!)
    const sorted = [...currentGeneration].sort((a, b) => 
      b.performance.cladeScore - a.performance.cladeScore
    );
    
    // Elite selection (preserve top candidates)
    const eliteCount = Math.ceil(currentGeneration.length * this.config.eliteRatio);
    const elite = sorted.slice(0, eliteCount);
    
    const newCandidates: OptimizerCandidate[] = [];
    
    // Preserve elite (with small mutations)
    for (const eliteCandidate of elite) {
      const mutated = this.mutate(eliteCandidate);
      newCandidates.push(mutated);
    }
    
    // Generate rest via crossover and mutation
    while (newCandidates.length < this.config.populationSize) {
      const parent1 = this.selectParent(currentGeneration);
      const parent2 = this.selectParent(currentGeneration);
      
      const offspring = this.crossover(parent1, parent2);
      const mutated = this.mutate(offspring);
      newCandidates.push(mutated);
    }
    
    // Add to population and archive
    const newIds: string[] = [];
    for (const candidate of newCandidates) {
      this.candidates.set(candidate.id, candidate);
      
      // Add to archive (DGM)
      if (this.config.archiveEnabled) {
        this.addToArchive(candidate, candidate.parentId);
      }
      
      newIds.push(candidate.id);
    }
    
    // Update best candidate
    const allCandidates = Array.from(this.candidates.values());
    const best = allCandidates.reduce((best, c) => {
      const bestCMP = this.calculateCMP(best.id);
      const candidateCMP = this.calculateCMP(c.id);
      return candidateCMP > bestCMP ? c : best;
    }, allCandidates[0]);
    
    this.bestCandidateId = best.id;
    
    // Track convergence
    this.updateConvergenceTracking();
    
    // Open-ended exploration if converged (DGM)
    if (this.config.openEndedExploration && this.isConverged()) {
      this.exploreNovelRegions();
    }
    
    return newIds;
  }
  
  /**
   * DGM: Update convergence tracking
   */
  private updateConvergenceTracking(): void {
    if (!this.convergenceHistory) {
      this.convergenceHistory = [];
    }
    
    const currentBest = this.getBestCandidate();
    if (!currentBest) return;
    
    const currentCMP = this.calculateCMP(currentBest.id);
    
    if (this.convergenceHistory.length > 0) {
      const lastBest = this.convergenceHistory[this.convergenceHistory.length - 1];
      const improvement = currentCMP - lastBest;
      
      if (improvement < (this.config.convergenceThreshold ?? 0.01)) {
        this.stagnationCount++;
      } else {
        this.stagnationCount = 0;
      }
    }
    
    this.convergenceHistory.push(currentCMP);
    
    // Keep only recent history
    if (this.convergenceHistory.length > 10) {
      this.convergenceHistory.shift();
    }
  }
  
  /**
   * DGM: Check if optimization has converged
   */
  isConverged(): boolean {
    return this.stagnationCount >= (this.config.stagnationLimit ?? 5);
  }
  
  /**
   * DGM: Explore novel regions when converged (open-ended exploration)
   */
  private exploreNovelRegions(): void {
    if (this.archive.size === 0) return;
    
    console.log(`🔍 DGM: Exploring novel regions (stagnation: ${this.stagnationCount})`);
    
    // Get diverse candidates from different branches
    const diverseCandidates = this.getDiverseCandidatesFromArchive(3);
    
    // Generate novel variants with increased mutation rate
    const originalMutationRate = this.config.mutationRate;
    this.config.mutationRate = Math.min(0.8, originalMutationRate * 1.5);
    
    // Mutate diverse candidates more aggressively
    for (const candidate of diverseCandidates) {
      const mutated = this.mutate(candidate);
      mutated.metadata.mutationHistory.push('[DGM] Novel region exploration');
      
      this.candidates.set(mutated.id, mutated);
      if (this.config.archiveEnabled) {
        this.addToArchive(mutated, candidate.id);
      }
    }
    
    // Restore mutation rate
    this.config.mutationRate = originalMutationRate;
    
    // Reset stagnation counter
    this.stagnationCount = 0;
  }
  
  /**
   * DGM: Get diverse candidates from different archive branches
   */
  private getDiverseCandidatesFromArchive(n: number): OptimizerCandidate[] {
    if (this.archive.size === 0) {
      return Array.from(this.candidates.values()).slice(0, n);
    }
    
    // Group by branches (depth-based)
    const branches = new Map<number, ArchiveEntry[]>();
    for (const entry of this.archive.values()) {
      if (!branches.has(entry.depth)) {
        branches.set(entry.depth, []);
      }
      branches.get(entry.depth)!.push(entry);
    }
    
    // Select from different branches
    const selected: OptimizerCandidate[] = [];
    const branchDepths = Array.from(branches.keys()).sort();
    
    for (const depth of branchDepths) {
      const branchCandidates = branches.get(depth)!;
      
      // Sort by diversity within branch
      branchCandidates.sort((a, b) => b.diversityScore - a.diversityScore);
      
      // Take most diverse from this branch
      selected.push(branchCandidates[0].candidate);
      
      if (selected.length >= n) break;
    }
    
    // If we need more, fill with most diverse overall
    if (selected.length < n) {
      const allEntries = Array.from(this.archive.values())
        .filter(e => !selected.includes(e.candidate))
        .sort((a, b) => b.diversityScore - a.diversityScore);
      
      for (const entry of allEntries) {
        selected.push(entry.candidate);
        if (selected.length >= n) break;
      }
    }
    
    return selected.slice(0, n);
  }
  
  /**
   * Mutate candidate parameters
   */
  private mutate(candidate: OptimizerCandidate): OptimizerCandidate {
    const mutated: OptimizerCandidate = {
      ...candidate,
      id: `gen-${this.generationCounter}-mut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      parentId: candidate.id,
      generation: this.generationCounter,
      deltaRuleParams: { ...candidate.deltaRuleParams },
      permutationParams: { ...candidate.permutationParams },
      performance: {
        immediateScore: 0,
        descendantScore: 0,
        cladeScore: 0,
        evaluationCount: 0,
        lastEvaluatedAt: 0,
      },
      metadata: {
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        mutationHistory: [...candidate.metadata.mutationHistory],
        evaluationHistory: [],
      },
    };
    
    // Mutate delta rule parameters
    if (Math.random() < this.config.mutationRate) {
      const mutations: string[] = [];
      
      // Residual clip value: ±20%
      if (Math.random() < 0.5) {
        const oldValue = mutated.deltaRuleParams.residualClipValue;
        mutated.deltaRuleParams.residualClipValue = Math.max(0.1, Math.min(1.0, 
          oldValue * (1 + (Math.random() - 0.5) * 0.4)
        ));
        mutations.push(`residualClipValue: ${oldValue.toFixed(3)} → ${mutated.deltaRuleParams.residualClipValue.toFixed(3)}`);
      }
      
      // Stability threshold: ±30%
      if (Math.random() < 0.5) {
        const oldValue = mutated.deltaRuleParams.stabilityThreshold;
        mutated.deltaRuleParams.stabilityThreshold = Math.max(0.01, Math.min(0.5,
          oldValue * (1 + (Math.random() - 0.5) * 0.6)
        ));
        mutations.push(`stabilityThreshold: ${oldValue.toFixed(3)} → ${mutated.deltaRuleParams.stabilityThreshold.toFixed(3)}`);
      }
      
      // Toggle features
      if (Math.random() < 0.3) {
        mutated.deltaRuleParams.enableResidual = !mutated.deltaRuleParams.enableResidual;
        mutations.push(`enableResidual: ${!mutated.deltaRuleParams.enableResidual} → ${mutated.deltaRuleParams.enableResidual}`);
      }
      
      if (Math.random() < 0.3) {
        mutated.deltaRuleParams.adaptiveBeta = !mutated.deltaRuleParams.adaptiveBeta;
        mutations.push(`adaptiveBeta: ${!mutated.deltaRuleParams.adaptiveBeta} → ${mutated.deltaRuleParams.adaptiveBeta}`);
      }
      
      // Gating strategy
      if (Math.random() < 0.4) {
        const strategies: OptimizerCandidate['deltaRuleParams']['gatingStrategy'][] = 
          ['uniform', 'data-dependent', 'per-dimension', 'kimi-enhanced'];
        const currentIdx = strategies.indexOf(mutated.deltaRuleParams.gatingStrategy);
        const newIdx = (currentIdx + 1) % strategies.length;
        mutated.deltaRuleParams.gatingStrategy = strategies[newIdx];
        mutations.push(`gatingStrategy: ${strategies[currentIdx]} → ${strategies[newIdx]}`);
      }
      
      mutated.metadata.mutationHistory.push(...mutations);
    }
    
    // Mutate permutation parameters
    if (Math.random() < this.config.mutationRate * 0.5) {
      if (mutated.permutationParams.aceThreshold !== undefined && Math.random() < 0.5) {
        const oldValue = mutated.permutationParams.aceThreshold;
        mutated.permutationParams.aceThreshold = Math.max(0.1, Math.min(0.9,
          oldValue + (Math.random() - 0.5) * 0.2
        ));
        mutated.metadata.mutationHistory.push(`aceThreshold: ${oldValue.toFixed(3)} → ${mutated.permutationParams.aceThreshold.toFixed(3)}`);
      }
    }
    
    return mutated;
  }
  
  /**
   * Crossover: combine two parent candidates
   */
  private crossover(parent1: OptimizerCandidate, parent2: OptimizerCandidate): OptimizerCandidate {
    const offspring: OptimizerCandidate = {
      id: `gen-${this.generationCounter}-cross-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      parentId: Math.random() < 0.5 ? parent1.id : parent2.id,
      generation: this.generationCounter,
      deltaRuleParams: {
        enableResidual: Math.random() < 0.5 ? parent1.deltaRuleParams.enableResidual : parent2.deltaRuleParams.enableResidual,
        residualClipValue: Math.random() < 0.5 ? parent1.deltaRuleParams.residualClipValue : parent2.deltaRuleParams.residualClipValue,
        enableDataDependentGating: Math.random() < 0.5 ? parent1.deltaRuleParams.enableDataDependentGating : parent2.deltaRuleParams.enableDataDependentGating,
        gatingNetworkDim: Math.random() < 0.5 ? parent1.deltaRuleParams.gatingNetworkDim : parent2.deltaRuleParams.gatingNetworkDim,
        adaptiveBeta: Math.random() < 0.5 ? parent1.deltaRuleParams.adaptiveBeta : parent2.deltaRuleParams.adaptiveBeta,
        stabilityThreshold: (parent1.deltaRuleParams.stabilityThreshold + parent2.deltaRuleParams.stabilityThreshold) / 2,
        gatingStrategy: Math.random() < 0.5 ? parent1.deltaRuleParams.gatingStrategy : parent2.deltaRuleParams.gatingStrategy,
      },
      permutationParams: {
        aceThreshold: parent1.permutationParams.aceThreshold !== undefined && parent2.permutationParams.aceThreshold !== undefined
          ? (parent1.permutationParams.aceThreshold + parent2.permutationParams.aceThreshold) / 2
          : parent1.permutationParams.aceThreshold ?? parent2.permutationParams.aceThreshold,
        swirlThreshold: parent1.permutationParams.swirlThreshold !== undefined && parent2.permutationParams.swirlThreshold !== undefined
          ? (parent1.permutationParams.swirlThreshold + parent2.permutationParams.swirlThreshold) / 2
          : parent1.permutationParams.swirlThreshold ?? parent2.permutationParams.swirlThreshold,
        rvsThreshold: parent1.permutationParams.rvsThreshold !== undefined && parent2.permutationParams.rvsThreshold !== undefined
          ? (parent1.permutationParams.rvsThreshold + parent2.permutationParams.rvsThreshold) / 2
          : parent1.permutationParams.rvsThreshold ?? parent2.permutationParams.rvsThreshold,
        optimizationMode: Math.random() < 0.5 ? parent1.permutationParams.optimizationMode : parent2.permutationParams.optimizationMode,
      },
      performance: {
        immediateScore: 0,
        descendantScore: 0,
        cladeScore: 0,
        evaluationCount: 0,
        lastEvaluatedAt: 0,
      },
      metadata: {
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        mutationHistory: [`crossover: ${parent1.id} × ${parent2.id}`],
        evaluationHistory: [],
      },
    };
    
    return offspring;
  }
  
  /**
   * Select parent using tournament selection
   * Enhanced with quality-diversity if enabled
   */
  private selectParent(candidates: OptimizerCandidate[]): OptimizerCandidate {
    if (this.config.qualityDiversitySelection && this.archive.size > 0) {
      // Use quality-diversity selection
      return this.selectWithQualityDiversity(candidates, 1)[0];
    }
    
    // Standard tournament selection
    const tournamentSize = 3;
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    
    // Return candidate with highest CMP
    return tournament.reduce((best, c) => {
      const bestCMP = this.calculateCMP(best.id);
      const candidateCMP = this.calculateCMP(c.id);
      return candidateCMP > bestCMP ? c : best;
    }, tournament[0]);
  }
  
  /**
   * DGM: Quality-Diversity Selection
   * Combines CMP (quality) with diversity metrics
   */
  private selectWithQualityDiversity(
    candidates: OptimizerCandidate[],
    n: number
  ): OptimizerCandidate[] {
    if (candidates.length === 0) return [];
    
    // Calculate scores for all candidates
    const scored = candidates.map(c => {
      const quality = this.calculateCMP(c.id);
      const diversity = this.calculateDiversity(c, candidates);
      const diversityWeight = this.config.diversityWeight ?? 0.3;
      const combinedScore = (1 - diversityWeight) * quality + 
                            diversityWeight * diversity;
      
      return { candidate: c, score: combinedScore, quality, diversity };
    });
    
    // Sort by combined score
    scored.sort((a, b) => b.score - a.score);
    
    // Return top n
    return scored.slice(0, n).map(s => s.candidate);
  }
  
  /**
   * DGM: Calculate diversity relative to other candidates
   */
  private calculateDiversity(
    candidate: OptimizerCandidate,
    others: OptimizerCandidate[]
  ): number {
    if (others.length === 0) return 1.0;
    
    let totalDistance = 0;
    let comparisons = 0;
    
    for (const other of others) {
      if (other.id === candidate.id) continue;
      
      const distance = this.configurationDistance(candidate, other);
      totalDistance += distance;
      comparisons++;
    }
    
    return comparisons > 0 ? totalDistance / comparisons : 1.0;
  }
  
  /**
   * Calculate distance between two configurations
   */
  private configurationDistance(
    a: OptimizerCandidate,
    b: OptimizerCandidate
  ): number {
    let distance = 0;
    
    // Delta rule parameters
    distance += Math.abs(a.deltaRuleParams.residualClipValue - 
                        b.deltaRuleParams.residualClipValue);
    distance += Math.abs(a.deltaRuleParams.stabilityThreshold - 
                        b.deltaRuleParams.stabilityThreshold);
    distance += Math.abs((a.deltaRuleParams.gatingNetworkDim || 64) - 
                        (b.deltaRuleParams.gatingNetworkDim || 64)) / 100;
    distance += a.deltaRuleParams.enableResidual !== 
                b.deltaRuleParams.enableResidual ? 1 : 0;
    distance += a.deltaRuleParams.enableDataDependentGating !== 
                b.deltaRuleParams.enableDataDependentGating ? 1 : 0;
    distance += a.deltaRuleParams.adaptiveBeta !== 
                b.deltaRuleParams.adaptiveBeta ? 1 : 0;
    distance += a.deltaRuleParams.gatingStrategy !== 
                b.deltaRuleParams.gatingStrategy ? 0.5 : 0;
    
    // Permutation parameters
    if (a.permutationParams.aceThreshold && b.permutationParams.aceThreshold) {
      distance += Math.abs(a.permutationParams.aceThreshold - 
                          b.permutationParams.aceThreshold);
    }
    if (a.permutationParams.swirlThreshold && b.permutationParams.swirlThreshold) {
      distance += Math.abs(a.permutationParams.swirlThreshold - 
                          b.permutationParams.swirlThreshold);
    }
    if (a.permutationParams.rvsThreshold && b.permutationParams.rvsThreshold) {
      distance += Math.abs(a.permutationParams.rvsThreshold - 
                          b.permutationParams.rvsThreshold);
    }
    distance += a.permutationParams.optimizationMode !== 
                b.permutationParams.optimizationMode ? 0.5 : 0;
    
    return distance;
  }
  
  /**
   * Check if candidate is descendant of another
   */
  private isDescendant(candidate: OptimizerCandidate, ancestorId: string): boolean {
    let current: OptimizerCandidate | undefined = candidate;
    let depth = 0;
    const maxDepth = 10; // Prevent infinite loops
    
    while (current && depth < maxDepth) {
      if (current.parentId === ancestorId) {
        return true;
      }
      if (current.parentId) {
        current = this.candidates.get(current.parentId);
      } else {
        break;
      }
      depth++;
    }
    
    return false;
  }
  
  /**
   * Aggregate metrics from multiple evaluations
   */
  private aggregateMetrics(metrics: EvaluationResult['metrics'][]): EvaluationResult['metrics'] {
    if (metrics.length === 0) {
      return {
        expressivity: 0,
        efficiency: 0,
        stability: 0,
        latency: 0,
      };
    }
    
    const aggregated = {
      expressivity: metrics.reduce((sum, m) => sum + m.expressivity, 0) / metrics.length,
      efficiency: metrics.reduce((sum, m) => sum + m.efficiency, 0) / metrics.length,
      stability: metrics.reduce((sum, m) => sum + m.stability, 0) / metrics.length,
      latency: metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length,
      compressionRatio: metrics[0].compressionRatio,
      residualMagnitude: metrics[0].residualMagnitude,
      gatingEfficiency: metrics[0].gatingEfficiency,
    };
    
    return aggregated;
  }
  
  /**
   * Calculate overall score from metrics
   */
  private calculateScore(metrics: EvaluationResult['metrics']): number {
    // Weighted combination: prioritize expressivity and efficiency
    const expressivityWeight = 0.4;
    const efficiencyWeight = 0.3;
    const stabilityWeight = 0.2;
    const latencyWeight = 0.1;
    
    // Normalize latency (lower is better)
    const normalizedLatency = Math.max(0, 1 - metrics.latency / 5000); // 5s max
    
    const score = 
      expressivityWeight * metrics.expressivity +
      efficiencyWeight * metrics.efficiency +
      stabilityWeight * metrics.stability +
      latencyWeight * normalizedLatency;
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Get best candidate
   */
  getBestCandidate(): OptimizerCandidate | null {
    if (!this.bestCandidateId) return null;
    return this.candidates.get(this.bestCandidateId) || null;
  }
  
  /**
   * Get candidate
   */
  getCandidate(id: string): OptimizerCandidate | null {
    return this.candidates.get(id) || null;
  }
  
  /**
   * Get all candidates sorted by CMP
   */
  getAllCandidatesSortedByCMP(): OptimizerCandidate[] {
    const all = Array.from(this.candidates.values());
    return all.sort((a, b) => {
      const aCMP = this.calculateCMP(a.id);
      const bCMP = this.calculateCMP(b.id);
      return bCMP - aCMP;
    });
  }
  
  /**
   * Create empty result for uninstantiated candidates
   */
  private createEmptyResult(candidateId: string): EvaluationResult {
    return {
      candidateId,
      score: 0,
      metrics: {
        expressivity: 0,
        efficiency: 0,
        stability: 0,
        latency: 0,
      },
      timestamp: Date.now(),
    };
  }
  
  /**
   * Export best configuration as ContextSynthesisConfig
   */
  exportBestDeltaRuleConfig(): Partial<ContextSynthesisConfig> {
    const best = this.getBestCandidate();
    if (!best) {
      throw new Error('No best candidate found');
    }
    
    return {
      enableResidual: best.deltaRuleParams.enableResidual,
      residualClipValue: best.deltaRuleParams.residualClipValue,
      enableDataDependentGating: best.deltaRuleParams.enableDataDependentGating,
      gatingNetworkDim: best.deltaRuleParams.gatingNetworkDim,
      adaptiveBeta: best.deltaRuleParams.adaptiveBeta,
      stabilityThreshold: best.deltaRuleParams.stabilityThreshold,
      gatingStrategy: best.deltaRuleParams.gatingStrategy,
    };
  }
  
  /**
   * Export best configuration as UnifiedPipelineConfig
   */
  exportBestPermutationConfig(): Partial<UnifiedPipelineConfig> {
    const best = this.getBestCandidate();
    if (!best) {
      throw new Error('No best candidate found');
    }
    
    return {
      aceThreshold: best.permutationParams.aceThreshold,
      swirlThreshold: best.permutationParams.swirlThreshold,
      rvsThreshold: best.permutationParams.rvsThreshold,
      optimizationMode: best.permutationParams.optimizationMode,
    };
  }
  
  /**
   * Get archive statistics (DGM)
   */
  getArchiveStats(): {
    size: number;
    maxDepth: number;
    branches: number;
    avgDiversity: number;
    avgBranchQuality: number;
  } {
    if (this.archive.size === 0) {
      return {
        size: 0,
        maxDepth: 0,
        branches: 0,
        avgDiversity: 0,
        avgBranchQuality: 0,
      };
    }
    
    const entries = Array.from(this.archive.values());
    const depths = entries.map(e => e.depth);
    const diversities = entries.map(e => e.diversityScore);
    const branchQualities = entries.map(e => e.branchQuality);
    
    // Count branches (entries with different parent branches)
    const rootEntries = entries.filter(e => e.depth === 0);
    const branches = rootEntries.length;
    
    return {
      size: this.archive.size,
      maxDepth: Math.max(...depths, 0),
      branches: branches || 1,
      avgDiversity: diversities.reduce((sum, d) => sum + d, 0) / diversities.length,
      avgBranchQuality: branchQualities.reduce((sum, q) => sum + q, 0) / branchQualities.length,
    };
  }
  
  /**
   * Get diverse candidates from archive (DGM)
   */
  getDiverseCandidates(n: number): OptimizerCandidate[] {
    if (this.archive.size === 0) {
      // Fallback to regular candidates
      return this.getAllCandidatesSortedByCMP().slice(0, n);
    }
    
    return this.getDiverseCandidatesFromArchive(n);
  }
  
  /**
   * Reset optimizer state
   */
  reset(): void {
    this.candidates.clear();
    this.evaluationResults.clear();
    this.generationCounter = 0;
    this.bestCandidateId = null;
    
    // DGM: Reset archive
    this.archive.clear();
    this.rootId = null;
    this.convergenceHistory = [];
    this.stagnationCount = 0;
  }
}

/**
 * Singleton instance
 */
export const selfImprovingOptimizer = new SelfImprovingOptimizer();

