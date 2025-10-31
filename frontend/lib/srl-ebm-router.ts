/**
 * SRL/EBM Auto-Detection Router
 * 
 * Intelligently determines when to use SRL (multi-step supervision) or EBM (answer refinement)
 * based on query characteristics, domain, and complexity.
 * 
 * Query-oriented approach - no hardcoded business types.
 */

import { loadExpertTrajectories } from './srl/swirl-srl-enhancer';

export interface QueryAnalysis {
  isMultiStep: boolean;
  isVerificationNeeded: boolean;
  needsRefinement: boolean;
  domain: string;
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  estimatedSteps: number;
  hasExpertTrajectories: boolean;
  shouldUseSRL: boolean;
  shouldUseEBM: boolean;
}

export interface RoutingDecision {
  useSRL: boolean;
  useEBM: boolean;
  useCombined: boolean;
  reasoning: string;
  confidence: number;
}

/**
 * Analyze query to determine SRL/EBM routing
 */
export async function analyzeQueryForSRL_EBM(
  query: string,
  domain?: string
): Promise<QueryAnalysis> {
  const queryLower = query.toLowerCase();
  
  // Detect domain if not provided
  const detectedDomain = domain || detectDomain(query);
  
  // Multi-step indicators
  const multiStepPatterns = [
    /\b(step|steps|first|then|next|finally|after|before|sequence|process|pipeline|workflow)\b/i,
    /\b(calculate|analyze|compare|evaluate).*and.*(adjust|explain|consider|include)\b/i,
    /\b(multiple|several|various|different|across|throughout)\b/i,
    /\b(how|what|why|when|where).*\?.*and.*\?/i, // Multiple questions
    /\b(beginning|middle|end|start|finish|complete)\b/i,
  ];
  
  const isMultiStep = multiStepPatterns.some(pattern => pattern.test(query)) ||
                      countSteps(query) >= 2;
  
  // Verification/refinement indicators
  const verificationPatterns = [
    /\b(verify|check|validate|confirm|ensure|prove|demonstrate)\b/i,
    /\b(is.*correct|is.*accurate|is.*valid|is.*true)\b/i,
    /\b(double.*check|review|audit|examine|inspect)\b/i,
  ];
  
  const refinementPatterns = [
    /\b(improve|enhance|refine|polish|optimize|better|perfect|complete)\b/i,
    /\b(more.*detail|additional|expand|elaborate|clarify)\b/i,
    /\b(revision|revision|updated|corrected|fixed)\b/i,
  ];
  
  const isVerificationNeeded = verificationPatterns.some(pattern => pattern.test(query));
  const needsRefinement = refinementPatterns.some(pattern => pattern.test(query));
  
  // Estimate complexity
  const complexity = estimateComplexity(query, detectedDomain);
  
  // Estimate number of steps
  const estimatedSteps = estimateStepCount(query, isMultiStep);
  
  // Check for expert trajectories
  const expertTrajectories = await loadExpertTrajectories(detectedDomain);
  const hasExpertTrajectories = expertTrajectories.length > 0;
  
  // Decision logic
  const shouldUseSRL = isMultiStep && hasExpertTrajectories && estimatedSteps >= 3;
  const shouldUseEBM = (isVerificationNeeded || needsRefinement || complexity >= 'high');
  
  return {
    isMultiStep,
    isVerificationNeeded,
    needsRefinement,
    domain: detectedDomain,
    complexity,
    estimatedSteps,
    hasExpertTrajectories,
    shouldUseSRL,
    shouldUseEBM
  };
}

/**
 * Make routing decision for SRL/EBM
 */
export async function decideSRL_EBM_Routing(
  query: string,
  domain?: string,
  context?: {
    initialAnswer?: string;
    answerQuality?: number;
    swirlSteps?: number;
  }
): Promise<RoutingDecision> {
  const analysis = await analyzeQueryForSRL_EBM(query, domain);
  
  let useSRL = false;
  let useEBM = false;
  let useCombined = false;
  let reasoning = '';
  let confidence = 0.5;
  
  // SRL Decision
  if (analysis.shouldUseSRL) {
    useSRL = true;
    reasoning += `SRL: Multi-step query (${analysis.estimatedSteps} steps) with expert trajectories available. `;
    confidence += 0.2;
  }
  
  // EBM Decision
  if (analysis.shouldUseEBM) {
    useEBM = true;
    reasoning += `EBM: ${analysis.isVerificationNeeded ? 'Verification' : 'Refinement'} needed. `;
    confidence += 0.15;
  }
  
  // Combined approach (high complexity multi-step with refinement needs)
  if (useSRL && useEBM && analysis.complexity === 'very_high') {
    useCombined = true;
    reasoning += `Combined: Complex multi-step query requiring both supervision and refinement. `;
    confidence += 0.1;
  }
  
  // Context-based adjustments
  if (context) {
    // If initial answer quality is low, prefer EBM
    if (context.answerQuality && context.answerQuality < 0.7 && !useEBM) {
      useEBM = true;
      reasoning += `EBM: Low initial answer quality (${context.answerQuality.toFixed(2)}). `;
      confidence += 0.1;
    }
    
    // If SWiRL already generated many steps, SRL is more valuable
    if (context.swirlSteps && context.swirlSteps >= 4 && !useSRL && analysis.hasExpertTrajectories) {
      useSRL = true;
      reasoning += `SRL: High step count (${context.swirlSteps}) benefits from expert supervision. `;
      confidence += 0.1;
    }
  }
  
  // Final confidence normalization
  confidence = Math.min(1.0, confidence);
  
  if (!reasoning) {
    reasoning = 'No SRL/EBM enhancement needed for this query.';
    confidence = 0.3;
  }
  
  return {
    useSRL,
    useEBM,
    useCombined,
    reasoning: reasoning.trim(),
    confidence
  };
}

/**
 * Detect domain from query
 */
function detectDomain(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Financial
  if (/\b(roi|return|investment|portfolio|financial|market|trading|bitcoin|crypto|stocks|bonds|valuation|revenue|profit|loss|budget)\b/i.test(query)) {
    return 'financial';
  }
  
  // Legal
  if (/\b(legal|law|contract|agreement|compliance|regulatory|litigation|attorney|clause|enforceable|jurisdiction)\b/i.test(query)) {
    return 'legal';
  }
  
  // Scientific
  if (/\b(experiment|hypothesis|research|scientific|methodology|data.*analysis|statistical|peer.*review)\b/i.test(query)) {
    return 'science';
  }
  
  // Healthcare
  if (/\b(medical|health|diagnosis|treatment|patient|clinical|therapeutic|drug|medication)\b/i.test(query)) {
    return 'healthcare';
  }
  
  // Business
  if (/\b(business|strategy|operations|management|marketing|sales|customer|market.*analysis|competitive)\b/i.test(query)) {
    return 'business';
  }
  
  // Technical
  if (/\b(code|programming|software|algorithm|system|architecture|technical|implementation|design)\b/i.test(query)) {
    return 'technical';
  }
  
  // Default
  return 'general';
}

/**
 * Count steps in query
 */
function countSteps(query: string): number {
  // Look for step indicators
  const stepKeywords = [
    /\b(step\s+\d+|first|second|third|fourth|fifth|sixth|then|next|finally|after|before)\b/gi,
    /\b(calculate|analyze|compare|evaluate|explain|consider|include|adjust|synthesize)\b/gi,
  ];
  
  let stepCount = 0;
  for (const pattern of stepKeywords) {
    const matches = query.match(pattern);
    if (matches) {
      stepCount = Math.max(stepCount, matches.length);
    }
  }
  
  // Minimum 2 if we see any step indicators
  return stepCount >= 1 ? Math.max(2, stepCount) : 0;
}

/**
 * Estimate step count more accurately
 */
function estimateStepCount(query: string, isMultiStep: boolean): number {
  if (!isMultiStep) {
    return 1;
  }
  
  // Count explicit steps
  const explicitSteps = countSteps(query);
  
  // Estimate from query complexity
  const queryLength = query.length;
  const hasMultipleActions = (/\b(and|then|after|before|next|also|additionally)\b/gi.test(query));
  const complexityMultiplier = hasMultipleActions ? 1.5 : 1.0;
  
  // Base estimate
  let estimated = Math.max(2, Math.floor(queryLength / 100) * complexityMultiplier);
  
  // Use explicit count if available
  if (explicitSteps > 0) {
    estimated = Math.max(estimated, explicitSteps);
  }
  
  // Cap at reasonable maximum
  return Math.min(10, Math.round(estimated));
}

/**
 * Estimate complexity level
 */
function estimateComplexity(query: string, domain: string): 'low' | 'medium' | 'high' | 'very_high' {
  const length = query.length;
  const wordCount = query.split(/\s+/).length;
  
  // Complexity indicators
  const highComplexityIndicators = [
    /\b(comprehensive|detailed|thorough|complex|sophisticated|advanced|extensive)\b/i,
    /\b(analyze|evaluate|assess|compare|synthesize|integrate|optimize)\b/i,
    /\b(multiple|various|several|different|across|throughout)\b/i,
  ];
  
  const veryHighIndicators = [
    /\b(publication|peer.*review|rigorous|methodology|statistical|validation|experimental)\b/i,
    /\b(comprehensive.*analysis|detailed.*evaluation|thorough.*assessment)\b/i,
  ];
  
  let score = 0;
  
  // Length-based
  if (length > 300) score += 2;
  else if (length > 150) score += 1;
  
  // Word count
  if (wordCount > 50) score += 2;
  else if (wordCount > 25) score += 1;
  
  // High complexity indicators
  if (highComplexityIndicators.some(p => p.test(query))) score += 2;
  
  // Very high indicators
  if (veryHighIndicators.some(p => p.test(query))) score += 3;
  
  // Domain-specific complexity
  const domainComplexity: Record<string, number> = {
    'financial': 1,
    'legal': 1,
    'science': 2,
    'healthcare': 1,
    'business': 0,
    'technical': 1,
    'general': 0
  };
  
  score += domainComplexity[domain] || 0;
  
  // Determine level
  if (score >= 6) return 'very_high';
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

