/**
 * Extended Intelligence Metrics
 * 
 * Measures intelligence as agent+context, not just agent alone.
 * Based on extended intelligence theory: intelligence is a property of agents-in-context.
 */

export interface ExtendedIntelligenceMetrics {
  // Agent contribution (baseline)
  agentContribution: {
    quality: number;           // 0-1: Answer quality without context
    relevance: number;         // 0-1: Relevance to query
    coherence: number;         // 0-1: Internal coherence
    completeness: number;      // 0-1: Answer completeness
  };
  
  // Context contribution (extension)
  contextContribution: {
    qualityImprovement: number;    // Improvement in quality (0-1)
    relevanceImprovement: number;  // Improvement in relevance (0-1)
    coherenceImprovement: number;   // Improvement in coherence (0-1)
    completenessImprovement: number;// Improvement in completeness (0-1)
    entropyReduction: number;       // Entropy reduction achieved (0-1)
    contextRelevance: number;       // Relevance of context to query (0-1)
    contextEfficiency: number;      // Tokens used per quality improvement (lower is better)
  };
  
  // Extended intelligence (agent+context)
  extendedIntelligence: {
    overallQuality: number;        // Final answer quality (0-1)
    interactionQuality: number;    // How well agent+context work together (0-1)
    contextEfficiency: number;     // Efficiency of context extension (0-1)
    intelligenceExtension: number;  // How much context extends intelligence (0-1)
  };
  
  // Metadata
  metadata: {
    query: string;
    domain: string;
    agent: string;                  // Model used (e.g., 'gemma3:4b', 'claude')
    contextTokens: number;
    agentTokens: number;
    totalTokens: number;
    timestamp: number;
    sessionId: string;
  };
}

export interface ContextQualityMetrics {
  relevance: number;           // 0-1: How relevant is context to query
  coherence: number;           // 0-1: How coherent is context internally
  completeness: number;        // 0-1: How complete is context
  efficiency: number;          // 0-1: Token efficiency (lower tokens for same quality = higher)
  freshness: number;           // 0-1: How fresh/recent is context
  diversity: number;           // 0-1: How diverse are context sources
}

export class ExtendedIntelligenceMetricsCollector {
  private metrics: ExtendedIntelligenceMetrics[] = [];
  private contextQualityHistory: ContextQualityMetrics[] = [];
  
  /**
   * Record extended intelligence metrics for a query
   */
  async recordMetrics(params: {
    query: string;
    domain: string;
    agent: string;
    agentAnswer: string;              // Answer without context
    contextAnswer: string;            // Answer with context
    contextQuality: ContextQualityMetrics;
    agentQuality: {
      quality: number;
      relevance: number;
      coherence: number;
      completeness: number;
    };
    contextTokens: number;
    agentTokens: number;
    sessionId: string;
  }): Promise<ExtendedIntelligenceMetrics> {
    const { query, domain, agent, agentAnswer, contextAnswer, contextQuality, agentQuality, contextTokens, agentTokens, sessionId } = params;
    
    // Calculate answer quality for both
    const agentAnswerQuality = this.calculateAnswerQuality(agentAnswer, query);
    const contextAnswerQuality = this.calculateAnswerQuality(contextAnswer, query);
    
    // Calculate improvements
    const qualityImprovement = Math.max(0, contextAnswerQuality.quality - agentAnswerQuality.quality);
    const relevanceImprovement = Math.max(0, contextAnswerQuality.relevance - agentAnswerQuality.relevance);
    const coherenceImprovement = Math.max(0, contextAnswerQuality.coherence - agentAnswerQuality.coherence);
    const completenessImprovement = Math.max(0, contextAnswerQuality.completeness - agentAnswerQuality.completeness);
    
    // Calculate context efficiency (improvement per token)
    const totalImprovement = qualityImprovement + relevanceImprovement + coherenceImprovement + completenessImprovement;
    const contextEfficiency = contextTokens > 0 ? totalImprovement / contextTokens : 0;
    
    // Calculate intelligence extension
    const intelligenceExtension = Math.min(1, totalImprovement / 4); // Normalize to 0-1
    
    // Calculate interaction quality (how well agent+context work together)
    const interactionQuality = Math.min(1, 
      (contextAnswerQuality.quality * 0.4) + 
      (contextQuality.relevance * 0.3) + 
      (contextQuality.coherence * 0.3)
    );
    
    const metrics: ExtendedIntelligenceMetrics = {
      agentContribution: {
        quality: agentAnswerQuality.quality,
        relevance: agentAnswerQuality.relevance,
        coherence: agentAnswerQuality.coherence,
        completeness: agentAnswerQuality.completeness,
      },
      contextContribution: {
        qualityImprovement,
        relevanceImprovement,
        coherenceImprovement,
        completenessImprovement,
        entropyReduction: contextQuality.efficiency, // Use efficiency as proxy
        contextRelevance: contextQuality.relevance,
        contextEfficiency,
      },
      extendedIntelligence: {
        overallQuality: contextAnswerQuality.quality,
        interactionQuality,
        contextEfficiency: 1 / (1 + contextTokens / 1000), // Inverse of token usage
        intelligenceExtension,
      },
      metadata: {
        query,
        domain,
        agent,
        contextTokens,
        agentTokens,
        totalTokens: contextTokens + agentTokens,
        timestamp: Date.now(),
        sessionId,
      },
    };
    
    this.metrics.push(metrics);
    this.contextQualityHistory.push(contextQuality);
    
    return metrics;
  }
  
  /**
   * Calculate answer quality metrics
   */
  private calculateAnswerQuality(answer: string, query: string): {
    quality: number;
    relevance: number;
    coherence: number;
    completeness: number;
  } {
    // Relevance: keyword overlap and semantic similarity
    const relevance = this.calculateRelevance(answer, query);
    
    // Coherence: internal structure and flow
    const coherence = this.calculateCoherence(answer);
    
    // Completeness: answer length and detail
    const completeness = this.calculateCompleteness(answer, query);
    
    // Overall quality: weighted average
    const quality = (relevance * 0.4) + (coherence * 0.3) + (completeness * 0.3);
    
    return { quality, relevance, coherence, completeness };
  }
  
  private calculateRelevance(answer: string, query: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const answerWords = new Set(answer.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    // Jaccard similarity (intersection over union)
    const intersection = [...queryWords].filter(w => answerWords.has(w)).length;
    const union = queryWords.size + answerWords.size - intersection;
    
    // Also consider query coverage (how many query words are in answer)
    const queryCoverage = queryWords.size > 0 ? intersection / queryWords.size : 0;
    
    // Combined relevance: Jaccard similarity + query coverage
    const jaccard = union > 0 ? intersection / union : 0;
    return (jaccard * 0.6) + (queryCoverage * 0.4);
  }
  
  private calculateCoherence(answer: string): number {
    // Check for sentence structure, transitions, logical flow
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    // Penalize very short or very long sentences (incoherent)
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const lengthScore = Math.max(0, 1 - Math.abs(avgLength - 50) / 50);
    
    // Check for transition words
    const transitions = ['however', 'therefore', 'furthermore', 'additionally', 'moreover', 'consequently'];
    const transitionCount = transitions.filter(t => answer.toLowerCase().includes(t)).length;
    const transitionScore = Math.min(1, transitionCount / 3);
    
    return (lengthScore * 0.6) + (transitionScore * 0.4);
  }
  
  private calculateCompleteness(answer: string, query: string): number {
    // Check if answer is substantive (not too short)
    // More nuanced: very short answers are incomplete, but very long answers aren't necessarily better
    const idealLength = 200; // Ideal answer length
    const lengthScore = Math.min(1, 1 - Math.abs(answer.length - idealLength) / idealLength);
    
    // Check if answer addresses question types
    const isQuestion = query.includes('?');
    const hasAnswerStructure = answer.includes(':') || answer.split('\n').length > 1 || 
                                answer.match(/\d+\)/g) || // Numbered lists
                                answer.match(/[-•]/g); // Bullet points
    const structureScore = isQuestion ? (hasAnswerStructure ? 1 : 0.5) : 0.8;
    
    // Check for detailed information (numbers, specific facts)
    const hasDetails = /\d+/.test(answer) || answer.split('.').length > 2;
    const detailScore = hasDetails ? 1 : 0.7;
    
    return (lengthScore * 0.4) + (structureScore * 0.3) + (detailScore * 0.3);
  }
  
  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(timeWindow?: number): {
    avgAgentContribution: number;
    avgContextContribution: number;
    avgExtendedIntelligence: number;
    avgIntelligenceExtension: number;
    contextEfficiency: number;
    totalQueries: number;
  } {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const recent = this.metrics.filter(m => m.metadata.timestamp >= cutoff);
    
    if (recent.length === 0) {
      return {
        avgAgentContribution: 0,
        avgContextContribution: 0,
        avgExtendedIntelligence: 0,
        avgIntelligenceExtension: 0,
        contextEfficiency: 0,
        totalQueries: 0,
      };
    }
    
    const avgAgentContribution = recent.reduce((sum, m) => 
      sum + m.agentContribution.quality, 0) / recent.length;
    
    const avgContextContribution = recent.reduce((sum, m) => 
      sum + m.contextContribution.qualityImprovement, 0) / recent.length;
    
    const avgExtendedIntelligence = recent.reduce((sum, m) => 
      sum + m.extendedIntelligence.overallQuality, 0) / recent.length;
    
    const avgIntelligenceExtension = recent.reduce((sum, m) => 
      sum + m.extendedIntelligence.intelligenceExtension, 0) / recent.length;
    
    const contextEfficiency = recent.reduce((sum, m) => 
      sum + m.contextContribution.contextEfficiency, 0) / recent.length;
    
    return {
      avgAgentContribution,
      avgContextContribution,
      avgExtendedIntelligence,
      avgIntelligenceExtension,
      contextEfficiency,
      totalQueries: recent.length,
    };
  }
  
  /**
   * Get context quality trends
   */
  getContextQualityTrends(): {
    avgRelevance: number;
    avgCoherence: number;
    avgEfficiency: number;
    trends: {
      relevance: 'improving' | 'stable' | 'declining';
      coherence: 'improving' | 'stable' | 'declining';
      efficiency: 'improving' | 'stable' | 'declining';
    };
  } {
    if (this.contextQualityHistory.length === 0) {
      return {
        avgRelevance: 0,
        avgCoherence: 0,
        avgEfficiency: 0,
        trends: {
          relevance: 'stable',
          coherence: 'stable',
          efficiency: 'stable',
        },
      };
    }
    
    const recent = this.contextQualityHistory.slice(-20);
    const older = this.contextQualityHistory.slice(-40, -20);
    
    const avgRelevance = recent.reduce((sum, m) => sum + m.relevance, 0) / recent.length;
    const avgCoherence = recent.reduce((sum, m) => sum + m.coherence, 0) / recent.length;
    const avgEfficiency = recent.reduce((sum, m) => sum + m.efficiency, 0) / recent.length;
    
    const getTrend = (recent: number[], older: number[]): 'improving' | 'stable' | 'declining' => {
      if (older.length === 0) return 'stable';
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const diff = recentAvg - olderAvg;
      if (diff > 0.05) return 'improving';
      if (diff < -0.05) return 'declining';
      return 'stable';
    };
    
    const relevanceTrend = getTrend(
      recent.map(m => m.relevance),
      older.map(m => m.relevance)
    );
    const coherenceTrend = getTrend(
      recent.map(m => m.coherence),
      older.map(m => m.coherence)
    );
    const efficiencyTrend = getTrend(
      recent.map(m => m.efficiency),
      older.map(m => m.efficiency)
    );
    
    return {
      avgRelevance,
      avgCoherence,
      avgEfficiency,
      trends: {
        relevance: relevanceTrend,
        coherence: coherenceTrend,
        efficiency: efficiencyTrend,
      },
    };
  }
  
  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
    this.contextQualityHistory = [];
  }
}

export const extendedIntelligenceMetrics = new ExtendedIntelligenceMetricsCollector();

