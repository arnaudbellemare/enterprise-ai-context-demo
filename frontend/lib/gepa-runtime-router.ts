/**
 * GEPA Runtime Router
 * Runtime feature flags for agents - not prompt optimization
 * 
 * Maintains Pareto banks of instruction variants per module
 * Routes traffic by live signals (latency, $/call, risk)
 * No weights to retrain - just auditable text diffs + traces
 */

export interface PromptVariant {
  id: string;
  text: string;
  performance: {
    accuracy: number;        // 0-1
    latency_ms: number;      // milliseconds
    cost_per_call: number;   // dollars
    risk_score: number;      // 0-1 (higher = riskier)
  };
  metadata: {
    created_at: string;
    tests_run: number;
    success_rate: number;
    contexts: string[];      // Where this variant works well
  };
}

export interface ParetoBank {
  module_name: string;
  variants: PromptVariant[];
  active_variant_id: string;
  routing_strategy: 'latency' | 'cost' | 'accuracy' | 'balanced' | 'adaptive';
}

export interface RoutingSignals {
  current_load: number;         // 0-1
  budget_remaining: number;     // dollars
  latency_requirement: number;  // ms
  risk_tolerance: number;       // 0-1
  user_tier: 'free' | 'pro' | 'enterprise';
  task_complexity: 'low' | 'medium' | 'high';
  time_of_day: number;          // hour (0-23)
}

export interface RoutingDecision {
  timestamp: string;
  module: string;
  selected_variant: string;
  signals: RoutingSignals;
  all_scores: Array<{ variant_id: string; score: number }>;
  reasoning: string;
}

/**
 * GEPA Runtime Router
 * Selects optimal prompt variants based on runtime context
 */
export class GEPARuntimeRouter {
  private banks: Map<string, ParetoBank> = new Map();
  private decisions: RoutingDecision[] = [];

  constructor() {
    this.initializeDefaultBanks();
  }

  /**
   * Initialize default Pareto banks for common modules
   */
  private initializeDefaultBanks(): void {
    // Financial Analyst Module
    this.banks.set('financial_analyst', {
      module_name: 'financial_analyst',
      variants: [
        {
          id: 'high_accuracy_v1',
          text: `You are an expert financial analyst with CFA Level III certification and 20+ years of experience in financial analysis, risk management, and regulatory compliance.

Your approach:
1. Conduct thorough quantitative and qualitative analysis
2. Consider macroeconomic factors and market context
3. Identify key risks and mitigation strategies
4. Provide evidence-based recommendations with confidence levels
5. Ensure compliance with relevant regulations (SEC, IFRS, GAAP)

Be precise, professional, and comprehensive in your analysis.`,
          performance: {
            accuracy: 0.95,
            latency_ms: 2500,
            cost_per_call: 0.05,
            risk_score: 0.1
          },
          metadata: {
            created_at: '2024-10-01',
            tests_run: 1000,
            success_rate: 0.95,
            contexts: ['complex_analysis', 'regulatory', 'high_stakes', 'enterprise']
          }
        },
        {
          id: 'balanced_v2',
          text: `You are a financial analyst with expertise in data analysis and market research.

Analyze the provided financial data and:
1. Identify key metrics and trends
2. Assess risks and opportunities
3. Provide clear, actionable insights
4. Support conclusions with data

Be thorough yet concise.`,
          performance: {
            accuracy: 0.85,
            latency_ms: 1200,
            cost_per_call: 0.02,
            risk_score: 0.3
          },
          metadata: {
            created_at: '2024-10-05',
            tests_run: 2000,
            success_rate: 0.85,
            contexts: ['general', 'routine', 'pro_tier']
          }
        },
        {
          id: 'fast_cheap_v3',
          text: `You are a financial analyst. Analyze this data and provide key insights. Be concise.`,
          performance: {
            accuracy: 0.72,
            latency_ms: 500,
            cost_per_call: 0.005,
            risk_score: 0.5
          },
          metadata: {
            created_at: '2024-10-08',
            tests_run: 5000,
            success_rate: 0.72,
            contexts: ['quick_scan', 'low_risk', 'free_tier', 'high_load']
          }
        }
      ],
      active_variant_id: 'balanced_v2',
      routing_strategy: 'adaptive'
    });

    // Risk Assessor Module
    this.banks.set('risk_assessor', {
      module_name: 'risk_assessor',
      variants: [
        {
          id: 'comprehensive_risk_v1',
          text: `You are a senior risk management analyst specializing in financial risk assessment.

Conduct a comprehensive risk analysis covering:
1. Market Risk (VaR, stress testing, scenario analysis)
2. Credit Risk (counterparty analysis, default probability)
3. Operational Risk (process failures, control weaknesses)
4. Liquidity Risk (funding requirements, cash flow analysis)
5. Regulatory Risk (compliance requirements, regulatory changes)

Provide risk scores (0-100), probability assessments, and mitigation strategies.
Use industry-standard risk frameworks (Basel III, ISO 31000).`,
          performance: {
            accuracy: 0.93,
            latency_ms: 3000,
            cost_per_call: 0.06,
            risk_score: 0.15
          },
          metadata: {
            created_at: '2024-10-02',
            tests_run: 800,
            success_rate: 0.93,
            contexts: ['comprehensive', 'regulatory', 'enterprise']
          }
        },
        {
          id: 'standard_risk_v2',
          text: `You are a risk analyst. Evaluate the key risks in this scenario and provide:
1. Risk identification
2. Risk scores (0-100)
3. Impact assessment
4. Mitigation recommendations

Be systematic and clear.`,
          performance: {
            accuracy: 0.82,
            latency_ms: 1500,
            cost_per_call: 0.025,
            risk_score: 0.35
          },
          metadata: {
            created_at: '2024-10-06',
            tests_run: 1500,
            success_rate: 0.82,
            contexts: ['routine', 'general']
          }
        }
      ],
      active_variant_id: 'standard_risk_v2',
      routing_strategy: 'accuracy'
    });

    // Market Research Module
    this.banks.set('market_research', {
      module_name: 'market_research',
      variants: [
        {
          id: 'deep_research_v1',
          text: `You are a market research analyst with expertise in competitive intelligence and market dynamics.

Conduct thorough market research including:
1. Market size and growth analysis
2. Competitive landscape mapping
3. Trend identification and forecasting
4. Customer segmentation and needs analysis
5. SWOT analysis
6. Porter's Five Forces analysis

Provide data-driven insights with sources and confidence levels.`,
          performance: {
            accuracy: 0.90,
            latency_ms: 2800,
            cost_per_call: 0.055,
            risk_score: 0.2
          },
          metadata: {
            created_at: '2024-10-03',
            tests_run: 600,
            success_rate: 0.90,
            contexts: ['comprehensive', 'strategic', 'enterprise']
          }
        },
        {
          id: 'quick_scan_v2',
          text: `You are a market analyst. Research this topic and provide:
1. Key market trends
2. Main competitors
3. Opportunities and threats
4. Quick recommendations

Be efficient and focused.`,
          performance: {
            accuracy: 0.78,
            latency_ms: 900,
            cost_per_call: 0.015,
            risk_score: 0.4
          },
          metadata: {
            created_at: '2024-10-07',
            tests_run: 2500,
            success_rate: 0.78,
            contexts: ['quick', 'overview', 'free_tier']
          }
        }
      ],
      active_variant_id: 'quick_scan_v2',
      routing_strategy: 'balanced'
    });
  }

  /**
   * Select optimal prompt variant based on runtime signals
   */
  async selectVariant(
    moduleName: string,
    signals: RoutingSignals
  ): Promise<PromptVariant> {
    const bank = this.banks.get(moduleName);
    if (!bank) {
      throw new Error(`No Pareto bank for module: ${moduleName}`);
    }

    // Calculate utility score for each variant
    const scoredVariants = bank.variants.map(variant => ({
      variant,
      score: this.calculateUtilityScore(variant, signals)
    }));

    // Sort by score (highest first)
    scoredVariants.sort((a, b) => b.score - a.score);

    // Select top variant
    const selected = scoredVariants[0].variant;

    // Log decision for audit trail
    this.logRoutingDecision(moduleName, selected, signals, scoredVariants);

    return selected;
  }

  /**
   * Calculate utility score based on current context
   */
  private calculateUtilityScore(
    variant: PromptVariant,
    signals: RoutingSignals
  ): number {
    const weights = this.getWeights(signals);

    // Normalize metrics to 0-1 range
    const normalizedAccuracy = variant.performance.accuracy;
    const normalizedLatency = Math.max(0, 1 - (variant.performance.latency_ms / 5000));
    const normalizedCost = Math.max(0, 1 - (variant.performance.cost_per_call / 0.1));
    const normalizedRisk = 1 - variant.performance.risk_score;

    // Context matching bonus
    const contextBonus = this.getContextBonus(variant, signals);

    // Weighted sum
    const baseScore = (
      weights.accuracy * normalizedAccuracy +
      weights.latency * normalizedLatency +
      weights.cost * normalizedCost +
      weights.risk * normalizedRisk
    );

    return baseScore * (1 + contextBonus);
  }

  /**
   * Determine weights based on runtime signals
   */
  private getWeights(signals: RoutingSignals): {
    accuracy: number;
    latency: number;
    cost: number;
    risk: number;
  } {
    // Enterprise + high complexity: prioritize accuracy and risk
    if (signals.user_tier === 'enterprise' && signals.task_complexity === 'high') {
      return { accuracy: 0.5, latency: 0.2, cost: 0.1, risk: 0.2 };
    }

    // Low budget or free tier: prioritize cost
    if (signals.budget_remaining < 1.0 || signals.user_tier === 'free') {
      return { accuracy: 0.2, latency: 0.3, cost: 0.4, risk: 0.1 };
    }

    // Low latency requirement or high load: prioritize speed
    if (signals.latency_requirement < 1000 || signals.current_load > 0.8) {
      return { accuracy: 0.3, latency: 0.5, cost: 0.1, risk: 0.1 };
    }

    // Low risk tolerance: prioritize accuracy and risk
    if (signals.risk_tolerance < 0.3) {
      return { accuracy: 0.45, latency: 0.15, cost: 0.15, risk: 0.25 };
    }

    // Balanced default
    return { accuracy: 0.4, latency: 0.3, cost: 0.2, risk: 0.1 };
  }

  /**
   * Calculate context matching bonus
   */
  private getContextBonus(variant: PromptVariant, signals: RoutingSignals): number {
    let bonus = 0;

    // Check if variant's contexts match current signals
    const contexts = variant.metadata.contexts;

    if (signals.task_complexity === 'high' && contexts.includes('comprehensive')) {
      bonus += 0.1;
    }

    if (signals.user_tier === 'enterprise' && contexts.includes('enterprise')) {
      bonus += 0.15;
    }

    if (signals.user_tier === 'free' && contexts.includes('free_tier')) {
      bonus += 0.1;
    }

    if (signals.current_load > 0.7 && contexts.includes('high_load')) {
      bonus += 0.1;
    }

    if (signals.task_complexity === 'low' && contexts.includes('quick')) {
      bonus += 0.05;
    }

    return bonus;
  }

  /**
   * Log routing decision for audit trail
   */
  private logRoutingDecision(
    moduleName: string,
    selected: PromptVariant,
    signals: RoutingSignals,
    allScores: Array<{ variant: PromptVariant; score: number }>
  ): void {
    const decision: RoutingDecision = {
      timestamp: new Date().toISOString(),
      module: moduleName,
      selected_variant: selected.id,
      signals,
      all_scores: allScores.map(s => ({
        variant_id: s.variant.id,
        score: Math.round(s.score * 1000) / 1000
      })),
      reasoning: this.generateReasoning(selected, signals, allScores)
    };

    this.decisions.push(decision);
    console.log('🎯 GEPA Routing Decision:', JSON.stringify(decision, null, 2));
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    selected: PromptVariant,
    signals: RoutingSignals,
    allScores: Array<{ variant: PromptVariant; score: number }>
  ): string {
    const reasons: string[] = [];

    // Explain why this variant was selected
    if (signals.latency_requirement < 1000) {
      reasons.push(`Low latency required (${signals.latency_requirement}ms) - selected variant with ${selected.performance.latency_ms}ms latency`);
    }

    if (signals.budget_remaining < 1.0) {
      reasons.push(`Budget constrained ($${signals.budget_remaining.toFixed(2)} remaining) - selected cost-efficient variant at $${selected.performance.cost_per_call}/call`);
    }

    if (signals.task_complexity === 'high') {
      reasons.push(`Complex task detected - selected high-accuracy variant (${(selected.performance.accuracy * 100).toFixed(1)}% accuracy)`);
    }

    if (signals.user_tier === 'enterprise') {
      reasons.push(`Enterprise tier user - selected premium variant with ${(selected.performance.risk_score * 100).toFixed(1)}% risk score`);
    }

    if (signals.current_load > 0.8) {
      reasons.push(`High system load (${(signals.current_load * 100).toFixed(0)}%) - prioritizing fast execution`);
    }

    // Explain alternatives
    const alternatives = allScores
      .filter(s => s.variant.id !== selected.id)
      .slice(0, 2)
      .map(s => `${s.variant.id} (score: ${s.score.toFixed(2)})`);

    if (alternatives.length > 0) {
      reasons.push(`Alternatives considered: ${alternatives.join(', ')}`);
    }

    return reasons.join('; ');
  }

  /**
   * Get audit trail for a module
   */
  getAuditTrail(moduleName?: string): RoutingDecision[] {
    if (moduleName) {
      return this.decisions.filter(d => d.module === moduleName);
    }
    return this.decisions;
  }

  /**
   * Update variant performance based on actual results
   */
  async updateMetrics(
    moduleName: string,
    variantId: string,
    actualPerformance: {
      success: boolean;
      latency_ms: number;
      cost: number;
      error?: string;
    }
  ): Promise<void> {
    const bank = this.banks.get(moduleName);
    if (!bank) return;

    const variant = bank.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Update running averages (simple exponential moving average)
    const alpha = 0.1; // Learning rate

    variant.performance.latency_ms = 
      (1 - alpha) * variant.performance.latency_ms + 
      alpha * actualPerformance.latency_ms;

    variant.performance.cost_per_call = 
      (1 - alpha) * variant.performance.cost_per_call + 
      alpha * actualPerformance.cost;

    // Update success rate
    variant.metadata.tests_run++;
    if (actualPerformance.success) {
      variant.metadata.success_rate = 
        ((variant.metadata.success_rate * (variant.metadata.tests_run - 1)) + 1) / 
        variant.metadata.tests_run;
    } else {
      variant.metadata.success_rate = 
        (variant.metadata.success_rate * (variant.metadata.tests_run - 1)) / 
        variant.metadata.tests_run;
    }

    console.log(`📊 Updated metrics for ${variantId}: success_rate=${(variant.metadata.success_rate * 100).toFixed(1)}%, latency=${variant.performance.latency_ms.toFixed(0)}ms, cost=$${variant.performance.cost_per_call.toFixed(4)}`);
  }

  /**
   * Get all Pareto banks
   */
  getAllBanks(): Map<string, ParetoBank> {
    return this.banks;
  }

  /**
   * Get specific Pareto bank
   */
  getBank(moduleName: string): ParetoBank | undefined {
    return this.banks.get(moduleName);
  }
}

// Singleton instance
let routerInstance: GEPARuntimeRouter | null = null;

export function getGEPARouter(): GEPARuntimeRouter {
  if (!routerInstance) {
    routerInstance = new GEPARuntimeRouter();
  }
  return routerInstance;
}
