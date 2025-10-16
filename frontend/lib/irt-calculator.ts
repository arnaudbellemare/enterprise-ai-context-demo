/**
 * IRT (Item Response Theory) Calculator
 * Standalone module for calculating task difficulty using 2PL model
 * Extracted from PermutationEngine for independent benchmarking
 */

export interface IRTCalculation {
  difficulty: number;
  discrimination: number;
  ability: number;
  expectedAccuracy: number;
  confidenceInterval: [number, number];
  level: string;
  factors: {
    domainDifficulty: number;
    queryComplexity: number;
    complexityFactors: number;
    wordCount: number;
  };
}

export async function calculateIRT(query: string, domain: string = 'general'): Promise<number> {
  // REAL IRT 2PL MODEL CALCULATION
  // P(θ, b, a) = 1 / (1 + exp(-a(θ - b)))
  // where:
  //   θ = ability parameter (PERMUTATION's ability = 0.85)
  //   b = difficulty parameter (what we're calculating)
  //   a = discrimination parameter (how well task differentiates ability)
  
  // Calculate difficulty based on multiple factors
  const wordCount = query.split(' ').length;
  const queryComplexity = Math.min(wordCount / 20, 1.0); // Normalize [0, 1]
  
  // Domain-specific difficulty modifiers
  const domainDifficulty: Record<string, number> = {
    crypto: 0.8,        // High volatility, complex calculations
    financial: 0.7,     // Requires precision, regulatory knowledge
    legal: 0.9,         // Highly specialized, citation-heavy
    healthcare: 0.85,   // Life-critical, complex terminology
    real_estate: 0.6,   // Moderate complexity
    general: 0.5        // Baseline difficulty
  };
  
  // Detect query features that increase difficulty
  let complexityFactors = 0;
  
  // Multi-step reasoning required
  if (query.includes('and then') || query.includes('after that') || query.includes('followed by')) {
    complexityFactors += 0.2;
  }
  
  // Comparison/analysis required
  if (query.includes('compare') || query.includes('versus') || query.includes('vs') || 
      query.includes('difference') || query.includes('better')) {
    complexityFactors += 0.15;
  }
  
  // Calculation/quantitative reasoning
  if (query.includes('calculate') || query.includes('how much') || query.includes('percentage') ||
      query.includes('roi') || query.includes('profit')) {
    complexityFactors += 0.1;
  }
  
  // Time-sensitive/real-time data
  if (query.includes('latest') || query.includes('current') || query.includes('today') ||
      query.includes('now') || query.includes('recent')) {
    complexityFactors += 0.1;
  }
  
  // Prediction/forecasting
  if (query.includes('predict') || query.includes('forecast') || query.includes('will') ||
      query.includes('future') || query.includes('expect')) {
    complexityFactors += 0.25;
  }
  
  // Calculate final IRT difficulty parameter (b)
  const baseDifficulty = domainDifficulty[domain] || domainDifficulty.general;
  const taskDifficulty = (queryComplexity + complexityFactors) / 2;
  const b = Math.min((baseDifficulty + taskDifficulty) / 2, 1.5); // Cap at 1.5
  
  return b;
}

export async function calculateIRTWithDetails(query: string, domain: string = 'general'): Promise<IRTCalculation> {
  const difficulty = await calculateIRT(query, domain);
  
  // Discrimination parameter (a) - how well this task type differentiates ability
  const a = domain === 'general' ? 1.0 : 1.5; // Specialized domains have higher discrimination
  
  // Expected accuracy using 2PL model with PERMUTATION's ability (θ = 0.85)
  const theta = 0.85; // PERMUTATION's estimated ability
  const expectedAccuracy = 1 / (1 + Math.exp(-a * (theta - difficulty)));
  
  // Calculate factors
  const wordCount = query.split(' ').length;
  const queryComplexity = Math.min(wordCount / 20, 1.0);
  
  let complexityFactors = 0;
  if (query.includes('and then') || query.includes('after that') || query.includes('followed by')) {
    complexityFactors += 0.2;
  }
  if (query.includes('compare') || query.includes('versus') || query.includes('vs') || 
      query.includes('difference') || query.includes('better')) {
    complexityFactors += 0.15;
  }
  if (query.includes('calculate') || query.includes('how much') || query.includes('percentage') ||
      query.includes('roi') || query.includes('profit')) {
    complexityFactors += 0.1;
  }
  if (query.includes('latest') || query.includes('current') || query.includes('today') ||
      query.includes('now') || query.includes('recent')) {
    complexityFactors += 0.1;
  }
  if (query.includes('predict') || query.includes('forecast') || query.includes('will') ||
      query.includes('future') || query.includes('expect')) {
    complexityFactors += 0.25;
  }
  
  const domainDifficulty: Record<string, number> = {
    crypto: 0.8,
    financial: 0.7,
    legal: 0.9,
    healthcare: 0.85,
    real_estate: 0.6,
    general: 0.5
  };
  
  const baseDifficulty = domainDifficulty[domain] || domainDifficulty.general;
  
  return {
    difficulty,
    discrimination: a,
    ability: theta,
    expectedAccuracy,
    confidenceInterval: [theta - 0.15, theta + 0.15],
    level: difficulty < 0 ? 'Easy' : difficulty < 0.5 ? 'Medium-Easy' : difficulty < 0.8 ? 'Medium' : difficulty < 1.2 ? 'Hard' : 'Very Hard',
    factors: {
      domainDifficulty: baseDifficulty,
      queryComplexity,
      complexityFactors,
      wordCount
    }
  };
}


