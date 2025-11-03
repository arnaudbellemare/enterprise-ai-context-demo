/**
 * Competence Tracker
 * 
 * Based on: "From Language to Cognition: How LLMs Outgrow the Human Language Network"
 * https://arxiv.org/pdf/2503.01830
 * 
 * Tracks formal vs functional linguistic competence separately:
 * - Formal: Grammar, syntax, compositional rules (saturates ~4B tokens)
 * - Functional: World knowledge, reasoning, pragmatics (continues improving)
 * 
 * Key insight: Brain alignment tracks formal competence more closely.
 */

export interface FormalCompetenceMetrics {
  syntacticAccuracy: number;        // 0-1: Grammar, syntax correctness
  compositionalStructure: number;    // 0-1: Well-formed sentence structure
  semanticCoherence: number;         // 0-1: Logical sentence structure
  overall: number;                  // Weighted average
}

export interface FunctionalCompetenceMetrics {
  reasoningQuality: number;          // 0-1: Logical reasoning ability
  worldKnowledge: number;            // 0-1: Factual accuracy
  pragmaticInference: number;        // 0-1: Context understanding
  discourseCoherence: number;        // 0-1: Multi-sentence coherence
  overall: number;                  // Weighted average
}

export interface CompetenceTracking {
  formal: FormalCompetenceMetrics;
  functional: FunctionalCompetenceMetrics;
  formalSaturated: boolean;         // True if formal competence has plateaued
  saturationPoint?: number;          // Token/iteration count when formal saturated
  brainAlignmentScore: number;       // Combined score (formal weighted higher)
}

export class CompetenceTracker {
  private history: CompetenceTracking[] = [];
  private saturationThreshold: number = 0.01; // Improvement < 1% = saturated
  private saturationWindow: number = 10;       // Check last 10 measurements
  
  /**
   * Calculate formal competence from components
   */
  calculateFormalCompetence(components: {
    semiotic?: { deduction?: { confidence?: number } };
    aceResult?: { generator?: { actions?: any[] } };
    irtDifficulty?: number;
  }): FormalCompetenceMetrics {
    // Deduction confidence = formal logic competence
    const syntacticAccuracy = components.semiotic?.deduction?.confidence || 0.7;
    
    // ACE generator actions indicate compositional structure
    const hasStructuredActions = (components.aceResult?.generator?.actions?.length ?? 0) > 0;
    const compositionalStructure = hasStructuredActions ? 0.85 : 0.6;
    
    // IRT difficulty (low = simple syntax, high = complex structure)
    // Low difficulty with high deduction = good formal competence
    const irtDifficulty = components.irtDifficulty || 0.5;
    const semanticCoherence = irtDifficulty < 0.5 ? syntacticAccuracy : Math.max(0.5, syntacticAccuracy - (irtDifficulty - 0.5));
    
    // Weighted average (paper shows formal competence correlates with brain alignment)
    const overall = (
      syntacticAccuracy * 0.4 +
      compositionalStructure * 0.3 +
      semanticCoherence * 0.3
    );
    
    return {
      syntacticAccuracy,
      compositionalStructure,
      semanticCoherence,
      overall
    };
  }
  
  /**
   * Calculate functional competence from components
   */
  calculateFunctionalCompetence(components: {
    semiotic?: { induction?: { confidence?: number }; abduction?: { confidence?: number } };
    teacherResponse?: { confidence?: number };
    rvsResult?: { confidence?: number; verified?: boolean };
    qualityScore?: number;
  }): FunctionalCompetenceMetrics {
    // Induction = experience-based patterns (functional)
    const inductionConfidence = components.semiotic?.induction?.confidence || 0.6;
    
    // Abduction = creative reasoning (functional)
    const abductionConfidence = components.semiotic?.abduction?.confidence || 0.5;
    
    // Teacher response = world knowledge
    const worldKnowledge = components.teacherResponse?.confidence || 0.7;
    
    // RVS verification = reasoning quality
    const reasoningQuality = components.rvsResult?.verified 
      ? Math.min(1.0, (components.rvsResult.confidence || 0.5) * 1.2)
      : (components.rvsResult?.confidence || 0.5);
    
    // Quality score = overall functional competence
    const qualityScore = components.qualityScore || 0.7;
    
    // Pragmatic inference from induction + abduction
    const pragmaticInference = (inductionConfidence + abductionConfidence) / 2;
    
    // Discourse coherence from RVS and quality
    const discourseCoherence = (reasoningQuality + qualityScore) / 2;
    
    // Weighted average (functional continues improving)
    const overall = (
      reasoningQuality * 0.3 +
      worldKnowledge * 0.25 +
      pragmaticInference * 0.2 +
      discourseCoherence * 0.25
    );
    
    return {
      reasoningQuality,
      worldKnowledge,
      pragmaticInference,
      discourseCoherence,
      overall
    };
  }
  
  /**
   * Track competence over time
   */
  trackCompetence(formal: FormalCompetenceMetrics, functional: FunctionalCompetenceMetrics, iteration: number): CompetenceTracking {
    const tracking: CompetenceTracking = {
      formal,
      functional,
      formalSaturated: this.checkFormalSaturation(),
      brainAlignmentScore: this.calculateBrainAlignment(formal, functional),
    };
    
    if (this.history.length > 0) {
      const last = this.history[this.history.length - 1];
      if (!last.formalSaturated && tracking.formalSaturated) {
        tracking.saturationPoint = iteration;
      }
    }
    
    this.history.push(tracking);
    return tracking;
  }
  
  /**
   * Check if formal competence has saturated (plateaued)
   * Based on paper: formal competence saturates ~4B tokens
   */
  private checkFormalSaturation(): boolean {
    if (this.history.length < this.saturationWindow) {
      return false;
    }
    
    const recent = this.history.slice(-this.saturationWindow);
    const improvements = recent.slice(1).map((curr, idx) => {
      const prev = recent[idx];
      return curr.formal.overall - prev.formal.overall;
    });
    
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    return avgImprovement < this.saturationThreshold;
  }
  
  /**
   * Calculate brain alignment score
   * Paper shows formal competence correlates better with brain alignment
   */
  calculateBrainAlignment(formal: FormalCompetenceMetrics, functional: FunctionalCompetenceMetrics): number {
    // Weight formal higher (70%) as paper shows it tracks brain alignment better
    return formal.overall * 0.7 + functional.overall * 0.3;
  }
  
  /**
   * Get optimization strategy based on competence state
   */
  getOptimizationStrategy(): {
    formalStrategy: 'freeze' | 'light-update' | 'full-optimize';
    functionalStrategy: 'continuous' | 'aggressive' | 'standard';
    reasoning: string;
  } {
    const last = this.history[this.history.length - 1];
    if (!last) {
      return {
        formalStrategy: 'full-optimize',
        functionalStrategy: 'standard',
        reasoning: 'Early training: optimize both'
      };
    }
    
    if (last.formalSaturated) {
      return {
        formalStrategy: 'light-update',
        functionalStrategy: 'continuous',
        reasoning: 'Formal competence saturated: reduce formal optimization, focus on functional'
      };
    }
    
    // Early training: optimize both
    if (this.history.length < 10) {
      return {
        formalStrategy: 'full-optimize',
        functionalStrategy: 'standard',
        reasoning: 'Early training: optimize both formal and functional'
      };
    }
    
    return {
      formalStrategy: 'full-optimize',
      functionalStrategy: 'continuous',
      reasoning: 'Mid-training: continue optimizing both'
    };
  }
  
  /**
   * Get current competence summary
   */
  getSummary(): {
    formal: number;
    functional: number;
    brainAlignment: number;
    formalSaturated: boolean;
    recommendation: string;
  } {
    const last = this.history[this.history.length - 1];
    if (!last) {
      return {
        formal: 0,
        functional: 0,
        brainAlignment: 0,
        formalSaturated: false,
        recommendation: 'Start tracking'
      };
    }
    
    const strategy = this.getOptimizationStrategy();
    
    return {
      formal: last.formal.overall,
      functional: last.functional.overall,
      brainAlignment: last.brainAlignmentScore,
      formalSaturated: last.formalSaturated,
      recommendation: strategy.reasoning
    };
  }
  
  /**
   * Reset tracker
   */
  reset(): void {
    this.history = [];
  }
}

export const competenceTracker = new CompetenceTracker();

