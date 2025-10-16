/**
 * 🧠 IRT (Item Response Theory) Specialist Routing
 * 
 * Implements real IRT-based routing for optimal component selection
 * based on query difficulty, user ability, and component discrimination
 */

export interface IRTParameters {
  difficulty: number;        // How hard the query is (0-1)
  discrimination: number;    // How well component can handle this type (0-1)
  guessing: number;         // Base success probability (0-1)
}

export interface IRTComponent {
  id: string;
  name: string;
  parameters: IRTParameters;
  domain: string;
  cost: number;
  latency: number;
}

export interface IRTRoutingDecision {
  selectedComponent: string;
  probability: number;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    component: string;
    probability: number;
    reason: string;
  }>;
}

class IRTSpecialistRouter {
  private components: IRTComponent[] = [
    {
      id: 'trm-engine',
      name: 'TRM Engine',
      parameters: { difficulty: 0.7, discrimination: 0.9, guessing: 0.1 },
      domain: 'finance',
      cost: 0.05,
      latency: 2000
    },
    {
      id: 'ace-framework',
      name: 'ACE Framework',
      parameters: { difficulty: 0.6, discrimination: 0.8, guessing: 0.15 },
      domain: 'healthcare',
      cost: 0.03,
      latency: 1500
    },
    {
      id: 'gepa-optimizer',
      name: 'GEPA Optimizer',
      parameters: { difficulty: 0.8, discrimination: 0.7, guessing: 0.2 },
      domain: 'technology',
      cost: 0.04,
      latency: 3000
    },
    {
      id: 'ollama-student',
      name: 'Ollama Student',
      parameters: { difficulty: 0.3, discrimination: 0.5, guessing: 0.3 },
      domain: 'general',
      cost: 0.01,
      latency: 1000
    }
  ];

  /**
   * Calculate IRT probability using 3-parameter logistic model
   * P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))
   */
  private calculateIRTProbability(ability: number, component: IRTComponent): number {
    const { difficulty, discrimination, guessing } = component.parameters;
    
    // 3-parameter logistic model
    const exponent = -discrimination * (ability - difficulty);
    const probability = guessing + (1 - guessing) / (1 + Math.exp(exponent));
    
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Estimate user ability based on query characteristics
   */
  private estimateUserAbility(query: string, domain: string): number {
    let ability = 0.5; // Base ability
    
    // Query complexity indicators
    const complexityIndicators = [
      /\b(analyze|evaluate|compare|assess|optimize)\b/i,
      /\b(risk|return|portfolio|strategy|framework)\b/i,
      /\b(technical|architectural|systematic|comprehensive)\b/i,
      /\b(regulatory|compliance|legal|policy)\b/i
    ];
    
    const complexityScore = complexityIndicators.reduce((score, pattern) => {
      return score + (pattern.test(query) ? 0.2 : 0);
    }, 0);
    
    // Domain expertise indicators
    const domainExpertise = {
      finance: 0.8,
      healthcare: 0.7,
      technology: 0.9,
      legal: 0.6,
      education: 0.4,
      general: 0.3
    };
    
    const domainScore = domainExpertise[domain as keyof typeof domainExpertise] || 0.3;
    
    // Combine scores
    ability = Math.min(0.95, (complexityScore + domainScore) / 2);
    
    return ability;
  }

  /**
   * Route query using IRT-based component selection
   */
  public routeQuery(query: string, domain: string, requirements: {
    maxCost?: number;
    maxLatency?: number;
    minAccuracy?: number;
  } = {}): IRTRoutingDecision {
    
    const userAbility = this.estimateUserAbility(query, domain);
    
    // Filter components by requirements
    let candidateComponents = this.components.filter(component => {
      if (requirements.maxCost && component.cost > requirements.maxCost) return false;
      if (requirements.maxLatency && component.latency > requirements.maxLatency) return false;
      return true;
    });
    
    // Calculate IRT probabilities for each component
    const componentScores = candidateComponents.map(component => {
      const probability = this.calculateIRTProbability(userAbility, component);
      const confidence = Math.abs(probability - 0.5) * 2; // Higher confidence for extreme probabilities
      
      return {
        component,
        probability,
        confidence,
        score: probability * confidence // Weighted score
      };
    });
    
    // Sort by score (probability * confidence)
    componentScores.sort((a, b) => b.score - a.score);
    
    const selected = componentScores[0];
    const alternatives = componentScores.slice(1, 4).map(item => ({
      component: item.component.name,
      probability: item.probability,
      reason: `IRT probability: ${(item.probability * 100).toFixed(1)}%, confidence: ${(item.confidence * 100).toFixed(1)}%`
    }));
    
    return {
      selectedComponent: selected.component.name,
      probability: selected.probability,
      confidence: selected.confidence,
      reasoning: `IRT routing: User ability ${(userAbility * 100).toFixed(1)}%, ${selected.component.name} has ${(selected.probability * 100).toFixed(1)}% success probability with ${(selected.confidence * 100).toFixed(1)}% confidence`,
      alternatives
    };
  }

  /**
   * Update component parameters based on performance feedback
   */
  public updateComponentParameters(componentId: string, success: boolean, latency: number): void {
    const component = this.components.find(c => c.id === componentId);
    if (!component) return;
    
    // Simple parameter adjustment based on feedback
    const adjustment = success ? 0.05 : -0.05;
    
    // Update discrimination (how well it handles this type)
    component.parameters.discrimination = Math.max(0.1, Math.min(1.0, 
      component.parameters.discrimination + adjustment
    ));
    
    // Update difficulty based on latency
    const latencyAdjustment = (latency - component.latency) / component.latency * 0.1;
    component.parameters.difficulty = Math.max(0.1, Math.min(1.0,
      component.parameters.difficulty + latencyAdjustment
    ));
  }

  /**
   * Get IRT statistics for monitoring
   */
  public getIRTStats(): {
    components: Array<{
      name: string;
      parameters: IRTParameters;
      performance: string;
    }>;
    averageDiscrimination: number;
    averageDifficulty: number;
  } {
    const components = this.components.map(component => ({
      name: component.name,
      parameters: component.parameters,
      performance: `${(component.parameters.discrimination * 100).toFixed(1)}% discrimination, ${(component.parameters.difficulty * 100).toFixed(1)}% difficulty`
    }));
    
    const averageDiscrimination = this.components.reduce((sum, c) => sum + c.parameters.discrimination, 0) / this.components.length;
    const averageDifficulty = this.components.reduce((sum, c) => sum + c.parameters.difficulty, 0) / this.components.length;
    
    return {
      components,
      averageDiscrimination,
      averageDifficulty
    };
  }
}

export const irtSpecialistRouter = new IRTSpecialistRouter();
