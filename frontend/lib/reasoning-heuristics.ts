/**
 * Reasoning Heuristics Library
 * 
 * 39 reasoning heuristics from Self-Discovery Prompting
 * Used to guide GEPA optimization and enhance step descriptions
 * 
 * Selection uses Jaccard similarity (word overlap) for fast, dependency-free matching
 * No external APIs required - pure semantic similarity based on token overlap
 */

export const REASONING_HEURISTICS = [
  "How could I devise an experiment to help solve that problem?",
  "Make a list of ideas for solving this problem, and apply them one by one to the problem to see if any progress can be made.",
  "How could I measure progress on this problem?",
  "How can I simplify the problem so that it is easier to solve?",
  "What are the key assumptions underlying this problem?",
  "What are the potential risks and drawbacks of each solution?",
  "What are the alternative perspectives or viewpoints on this problem?",
  "What are the long-term implications of this problem and its solutions?",
  "How can I break down this problem into smaller, more manageable parts?",
  "Critical Thinking: This style involves analyzing the problem from different perspectives, questioning assumptions, and evaluating the evidence or information available. It focuses on logical reasoning, evidence-based decision-making, and identifying potential biases or flaws in thinking.",
  "Try creative thinking, generate innovative and out-of-the-box ideas to solve the problem. Explore unconventional solutions, thinking beyond traditional boundaries, and encouraging imagination and originality.",
  "Seek input and collaboration from others to solve the problem. Emphasize teamwork, open communication, and leveraging the diverse perspectives and expertise of a group to come up with effective solutions.",
  "Use systems thinking: Consider the problem as part of a larger system and understanding the interconnectedness of various elements. Focuses on identifying the underlying causes, feedback loops, and interdependencies that influence the problem, and developing holistic solutions that address the system as a whole.",
  "Use Risk Analysis: Evaluate potential risks, uncertainties, and tradeoffs associated with different solutions or approaches to a problem. Emphasize assessing the potential consequences and likelihood of success or failure, and making informed decisions based on a balanced analysis of risks and benefits.",
  "Use Reflective Thinking: Step back from the problem, take the time for introspection and self-reflection. Examine personal biases, assumptions, and mental models that may influence problem-solving, and being open to learning from past experiences to improve future approaches.",
  "What is the core issue or problem that needs to be addressed?",
  "What are the underlying causes or factors contributing to the problem?",
  "Are there any potential solutions or strategies that have been tried before? If yes, what were the outcomes and lessons learned?",
  "What are the potential obstacles or challenges that might arise in solving this problem?",
  "Are there any relevant data or information that can provide insights into the problem? If yes, what data sources are available, and how can they be analyzed?",
  "Are there any stakeholders or individuals who are directly affected by the problem? What are their perspectives and needs?",
  "What resources (financial, human, technological, etc.) are needed to tackle the problem effectively?",
  "How can progress or success in solving the problem be measured or evaluated?",
  "What indicators or metrics can be used?",
  "Is the problem a technical or practical one that requires a specific expertise or skill set? Or is it more of a conceptual or theoretical problem?",
  "Does the problem involve a physical constraint, such as limited resources, infrastructure, or space?",
  "Is the problem related to human behavior, such as a social, cultural, or psychological issue?",
  "Does the problem involve decision-making or planning, where choices need to be made under uncertainty or with competing objectives?",
  "Is the problem an analytical one that requires data analysis, modeling, or optimization techniques?",
  "Is the problem a design challenge that requires creative solutions and innovation?",
  "Does the problem require addressing systemic or structural issues rather than just individual instances?",
  "Is the problem time-sensitive or urgent, requiring immediate attention and action?",
  "What kinds of solution typically are produced for this kind of problem specification?",
  "Given the problem specification and the current best solution, have a guess about other possible solutions.",
  "Let's imagine the current best solution is totally wrong, what other ways are there to think about the problem specification?",
  "What is the best way to modify this current best solution, given what you know about these kinds of problem specification?",
  "Ignoring the current best solution, create an entirely new solution to the problem.",
  "Let's think step by step.",
  "Let's make a step by step plan and implement it with good notion and explanation."
] as const;

export type ReasoningHeuristic = typeof REASONING_HEURISTICS[number];

/**
 * Stop words to filter during tokenization
 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 
  'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 
  'its', 'let', 'put', 'say', 'she', 'too', 'use'
]);

/**
 * Domain-specific boost configuration
 */
const DOMAIN_BOOST_CONFIG: Record<string, { keywords: string[]; boost: number }> = {
  mathematical: { keywords: ['measure', 'calculate', 'step'], boost: 0.15 },
  analytical: { keywords: ['analyze', 'data', 'modeling'], boost: 0.15 },
  creative: { keywords: ['creative', 'innovative', 'design'], boost: 0.15 },
  optimization: { keywords: ['simplify', 'optimize', 'modify'], boost: 0.15 }
};

/**
 * Tokenize text for similarity calculation
 * Results are cached for performance (same text = same tokens)
 */
const tokenizationCache = new Map<string, string[]>();

function tokenize(text: string): string[] {
  const cacheKey = text.toLowerCase();
  if (tokenizationCache.has(cacheKey)) {
    return tokenizationCache.get(cacheKey)!;
  }
  
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
  
  // Cache with size limit to prevent memory issues
  if (tokenizationCache.size < 1000) {
    tokenizationCache.set(cacheKey, tokens);
  }
  
  return tokens;
}

/**
 * Calculate Jaccard similarity (word overlap) between two texts
 * Returns similarity score between 0 and 1
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  if (tokens1.size === 0 && tokens2.size === 0) {
    return 0;
  }
  
  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}

/**
 * Calculate enhanced semantic similarity with domain weighting
 */
function calculateSemanticSimilarity(query: string, heuristic: string, domain: string): number {
  // Base Jaccard similarity
  const baseSimilarity = jaccardSimilarity(query, heuristic);
  
  // Extract meaningful tokens (length > 3)
  const queryTokens = new Set(tokenize(query).filter(t => t.length > 3));
  const heuristicTokens = new Set(tokenize(heuristic).filter(t => t.length > 3));
  
  // Domain-specific boost (configuration-based)
  let domainBoost = 0;
  const domainLower = domain.toLowerCase();
  const config = DOMAIN_BOOST_CONFIG[domainLower];
  
  if (config) {
    const heuristicLower = heuristic.toLowerCase();
    const hasRelevantKeyword = config.keywords.some(keyword => heuristicLower.includes(keyword));
    if (hasRelevantKeyword) {
      domainBoost = config.boost;
    }
  }
  
  // Meaningful term overlap boost
  const meaningfulOverlap = new Set([...queryTokens].filter(t => heuristicTokens.has(t)));
  const meaningfulBoost = meaningfulOverlap.size > 0 ? Math.min(0.1 * meaningfulOverlap.size, 0.2) : 0;
  
  // Combine scores (capped at 1.0)
  return Math.min(baseSimilarity + domainBoost + meaningfulBoost, 1.0);
}

/**
 * Select relevant reasoning heuristics for a query/domain using semantic similarity
 * Uses Jaccard similarity (word overlap) - no external APIs required
 */
export class ReasoningHeuristicSelector {
  /**
   * Select relevant heuristics based on semantic similarity to query
   * Uses Jaccard similarity (word overlap) for fast, dependency-free matching
   * 
   * Note: Returns Promise for API compatibility, but operations are synchronous
   */
  static async select(
    query: string,
    domain: string,
    maxHeuristics: number = 3
  ): Promise<ReasoningHeuristic[]> {
    // Calculate similarity for each heuristic
    const similarities: Array<{ heuristic: ReasoningHeuristic; similarity: number }> = [];
    
    for (const heuristic of REASONING_HEURISTICS) {
      const similarity = calculateSemanticSimilarity(query, heuristic, domain);
      similarities.push({ heuristic, similarity });
      }
    
    // Sort by similarity (highest first) and take top N
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities
      .slice(0, maxHeuristics)
      .map(item => item.heuristic);
  }

  /**
   * Map heuristic to GEPA mutation strategy
   */
  static mapHeuristicToGEPAStrategy(heuristic: ReasoningHeuristic): {
    mutationFocus: 'simplify' | 'expand' | 'reframe' | 'analyze' | 'creative' | 'stepwise';
    mutationHint: string;
  } {
    const h = heuristic.toLowerCase();

    if (h.includes('simplify') || h.includes('break down')) {
      return { mutationFocus: 'simplify', mutationHint: 'Simplify the prompt while maintaining core meaning' };
    }
    
    if (h.includes('creative') || h.includes('innovative') || h.includes('out-of-the-box')) {
      return { mutationFocus: 'creative', mutationHint: 'Explore unconventional phrasings and approaches' };
    }
    
    if (h.includes('system') || h.includes('holistic') || h.includes('interconnected')) {
      return { mutationFocus: 'expand', mutationHint: 'Add systemic context and connections' };
    }
    
    if (h.includes('analyze') || h.includes('data') || h.includes('modeling')) {
      return { mutationFocus: 'analyze', mutationHint: 'Emphasize analytical and data-driven approach' };
    }
    
    if (h.includes('step') || h.includes('plan') || h.includes('stepwise')) {
      return { mutationFocus: 'stepwise', mutationHint: 'Structure prompt for step-by-step reasoning' };
    }
    
    if (h.includes('alternative') || h.includes('other ways') || h.includes('reframe')) {
      return { mutationFocus: 'reframe', mutationHint: 'Reframe the prompt from different angles' };
    }

    // Default: stepwise
    return { mutationFocus: 'stepwise', mutationHint: 'Enhance prompt for structured reasoning' };
  }

  /**
   * Get description for a heuristic (shortened for PipelineStep)
   */
  static getDescription(heuristic: ReasoningHeuristic | string): string {
    // Extract key phrase from heuristic
    if (heuristic.length > 60) {
      return heuristic.substring(0, 57) + '...';
    }
    return heuristic;
  }
}

