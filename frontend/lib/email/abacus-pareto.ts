/**
 * Abacus Pareto-Cascades Optimization
 * Multi-objective optimization for email classification pipelines
 * Based on arXiv:2505.14661v2 - "Abacus: A Cost-Based Optimizer for Semantic Operator Systems"
 * 
 * Uses Pareto frontier to find optimal solutions balancing:
 * - Quality (accuracy/F1 score)
 * - Cost (token/API costs)
 * - Latency (processing time)
 */

export interface OptimizationObjective {
  quality: number; // 0-1, F1 score or accuracy
  cost: number; // USD cost per email
  latency: number; // milliseconds
}

export interface OperatorVariant {
  id: string;
  name: string;
  operator: string; // e.g., 'convert', 'retrieve', 'generate'
  config: Record<string, any>;
  estimated: OptimizationObjective;
  actual?: OptimizationObjective; // Measured after execution
}

export interface ParetoSolution {
  variant: OperatorVariant;
  dominates: string[]; // IDs of variants this dominates
  dominatedBy: string[]; // IDs that dominate this
  rank: number; // Pareto rank (0 = non-dominated)
}

/**
 * Check if solution A dominates solution B
 * A dominates B if A is better or equal in all objectives and strictly better in at least one
 */
function dominates(a: OptimizationObjective, b: OptimizationObjective): boolean {
  // For minimization: lower cost/latency is better
  // For maximization: higher quality is better
  const betterOrEqual = a.quality >= b.quality && a.cost <= b.cost && a.latency <= b.latency;
  const strictlyBetter = a.quality > b.quality || a.cost < b.cost || a.latency < b.latency;
  return betterOrEqual && strictlyBetter;
}

/**
 * Find Pareto frontier (non-dominated solutions)
 */
export function findParetoFrontier(variants: OperatorVariant[]): ParetoSolution[] {
  const solutions: ParetoSolution[] = variants.map(v => ({
    variant: v,
    dominates: [],
    dominatedBy: [],
    rank: 0
  }));

  // Compare all pairs
  for (let i = 0; i < solutions.length; i++) {
    for (let j = i + 1; j < solutions.length; j++) {
      const a = solutions[i].variant.estimated;
      const b = solutions[j].variant.estimated;

      if (dominates(a, b)) {
        solutions[i].dominates.push(solutions[j].variant.id);
        solutions[j].dominatedBy.push(solutions[i].variant.id);
      } else if (dominates(b, a)) {
        solutions[j].dominates.push(solutions[i].variant.id);
        solutions[i].dominatedBy.push(solutions[j].variant.id);
      }
    }
  }

  // Rank 0 = non-dominated (Pareto frontier)
  return solutions.filter(s => s.dominatedBy.length === 0);
}

/**
 * Multi-Armed Bandit (MAB) for efficient sampling
 * Samples operator variants to find Pareto-optimal solutions
 */
export class ParetoMAB {
  private variants: OperatorVariant[] = [];
  private samples: Map<string, OptimizationObjective[]> = new Map();
  private priors: Map<string, OptimizationObjective> = new Map();

  /**
   * Add variant to sample
   */
  addVariant(variant: OperatorVariant, prior?: OptimizationObjective) {
    this.variants.push(variant);
    this.samples.set(variant.id, []);
    if (prior) {
      this.priors.set(variant.id, prior);
    }
  }

  /**
   * Sample variant using UCB (Upper Confidence Bound) strategy
   */
  selectVariant(constraints?: {
    maxCost?: number;
    maxLatency?: number;
    minQuality?: number;
  }): OperatorVariant | null {
    // Filter variants that meet constraints
    let candidates = this.variants;
    
    if (constraints) {
      candidates = candidates.filter(v => {
        const est = v.estimated;
        if (constraints.maxCost && est.cost > constraints.maxCost) return false;
        if (constraints.maxLatency && est.latency > constraints.maxLatency) return false;
        if (constraints.minQuality && est.quality < constraints.minQuality) return false;
        return true;
      });
    }

    if (candidates.length === 0) return null;

    // If we have priors, use them for initial selection
    if (this.priors.size > 0) {
      const withPriors = candidates.filter(v => this.priors.has(v.id));
      if (withPriors.length > 0) {
        // Select from Pareto frontier of priors
        const pareto = findParetoFrontier(withPriors);
        if (pareto.length > 0) {
          return pareto[0].variant;
        }
      }
    }

    // UCB selection: balance exploration vs exploitation
    const totalSamples = Array.from(this.samples.values()).reduce((sum, samples) => sum + samples.length, 0);
    
    return candidates.reduce((best, variant) => {
      const samples = this.samples.get(variant.id) || [];
      const n = samples.length;
      
      if (n === 0) return variant; // Unexplored variant
      
      // Calculate average objective values
      const avg = samples.reduce((acc, obj) => ({
        quality: acc.quality + obj.quality,
        cost: acc.cost + obj.cost,
        latency: acc.latency + obj.latency
      }), { quality: 0, cost: 0, latency: 0 });
      
      const avgObj = {
        quality: avg.quality / n,
        cost: avg.cost / n,
        latency: avg.latency / n
      };
      
      // UCB: mean + confidence bound
      const confidence = Math.sqrt(2 * Math.log(totalSamples) / n);
      const ucbScore = avgObj.quality - avgObj.cost * 0.001 - avgObj.latency * 0.0001 + confidence;
      
      const bestSamples = this.samples.get(best.id) || [];
      const bestN = bestSamples.length;
      const bestAvg = bestN > 0 
        ? bestSamples.reduce((acc, obj) => ({
            quality: acc.quality + obj.quality,
            cost: acc.cost + obj.cost,
            latency: acc.latency + obj.latency
          }), { quality: 0, cost: 0, latency: 0 })
        : { quality: 0, cost: 0, latency: 0 };
      
      const bestAvgObj = bestN > 0 ? {
        quality: bestAvg.quality / bestN,
        cost: bestAvg.cost / bestN,
        latency: bestAvg.latency / bestN
      } : best.estimated;
      
      const bestConfidence = bestN > 0 ? Math.sqrt(2 * Math.log(totalSamples) / bestN) : 1;
      const bestUcbScore = bestAvgObj.quality - bestAvgObj.cost * 0.001 - bestAvgObj.latency * 0.0001 + bestConfidence;
      
      return ucbScore > bestUcbScore ? variant : best;
    }, candidates[0]);
  }

  /**
   * Record sample result
   */
  recordSample(variantId: string, result: OptimizationObjective) {
    const samples = this.samples.get(variantId) || [];
    samples.push(result);
    this.samples.set(variantId, samples);
  }

  /**
   * Get Pareto-optimal solutions
   */
  getParetoOptimal(): ParetoSolution[] {
    // Use actual results if available, otherwise use estimates
    const variantsWithResults = this.variants.map(v => ({
      ...v,
      estimated: v.actual || v.estimated
    }));
    
    return findParetoFrontier(variantsWithResults);
  }

  /**
   * Get best variant for given constraints
   */
  getBestVariant(constraints?: {
    maxCost?: number;
    maxLatency?: number;
    minQuality?: number;
    prioritize?: 'quality' | 'cost' | 'latency';
  }): OperatorVariant | null {
    const pareto = this.getParetoOptimal();
    
    // Filter by constraints
    let candidates = pareto.map(s => s.variant);
    
    if (constraints) {
      candidates = candidates.filter(v => {
        const obj = v.actual || v.estimated;
        if (constraints.maxCost && obj.cost > constraints.maxCost) return false;
        if (constraints.maxLatency && obj.latency > constraints.maxLatency) return false;
        if (constraints.minQuality && obj.quality < constraints.minQuality) return false;
        return true;
      });
    }

    if (candidates.length === 0) return null;

    // If prioritizing, select based on priority
    if (constraints?.prioritize) {
      return candidates.reduce((best, variant) => {
        const obj = variant.actual || variant.estimated;
        const bestObj = best.actual || best.estimated;
        
        if (constraints.prioritize === 'quality') {
          return obj.quality > bestObj.quality ? variant : best;
        } else if (constraints.prioritize === 'cost') {
          return obj.cost < bestObj.cost ? variant : best;
        } else if (constraints.prioritize === 'latency') {
          return obj.latency < bestObj.latency ? variant : best;
        }
        return best;
      });
    }

    // Default: return first Pareto-optimal solution
    return candidates[0];
  }
}

/**
 * Generate operator variants for email classification
 */
export function generateEmailClassificationVariants(): OperatorVariant[] {
  return [
    // Variant 1: Keyword-only (fastest, cheapest, lower quality)
    {
      id: 'keyword-only',
      name: 'Keyword Pre-filtering Only',
      operator: 'convert',
      config: { useCheapPreFilter: true, useLLM: false },
      estimated: {
        quality: 0.75,
        cost: 0.0001,
        latency: 10
      }
    },
    // Variant 2: Keyword + Gemma3:4b (free, fast, balanced)
    {
      id: 'keyword-gemma3:4b',
      name: 'Keyword + Gemma3:4b',
      operator: 'convert',
      config: { useCheapPreFilter: true, useLLM: true, model: 'gemma3:4b' },
      estimated: {
        quality: 0.85,
        cost: 0.0, // Free
        latency: 300
      }
    },
    // Variant 3: Gemma3:4b full (better quality, still free)
    {
      id: 'gemma3:4b-full',
      name: 'Gemma3:4b Full',
      operator: 'convert',
      config: { useCheapPreFilter: false, useLLM: true, model: 'gemma3:4b' },
      estimated: {
        quality: 0.88,
        cost: 0.0, // Free
        latency: 300
      }
    },
    // Variant 4: Perplexity Sonar Pro (best quality, web search, low cost)
    {
      id: 'perplexity-pro',
      name: 'Perplexity Sonar Pro',
      operator: 'convert',
      config: { useCheapPreFilter: false, useLLM: true, model: 'perplexity-sonar-pro' },
      estimated: {
        quality: 0.92,
        cost: 0.0015, // Low cost with web search
        latency: 1500
      }
    },
    // Variant 5: Hybrid (rule-based + LLM fallback)
    {
      id: 'hybrid',
      name: 'Hybrid Rule-Based + LLM',
      operator: 'classify',
      config: { method: 'hybrid', confidenceThreshold: 0.7 },
      estimated: {
        quality: 0.90,
        cost: 0.003,
        latency: 500
      }
    }
  ];
}

