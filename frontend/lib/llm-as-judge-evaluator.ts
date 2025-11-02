/**
 * LLM-as-a-Judge Evaluation System
 * 
 * Based on recent research (2024-2025):
 * - Pointwise evaluation with Chain-of-Thought reasoning
 * - Criteria-based assessment (relevance, completeness, correctness, clarity)
 * - ~90% agreement with human judgments when properly implemented
 * 
 * Papers referenced:
 * - "LLM-as-a-Judge: Scalable Evaluation" (2024)
 * - "Enhancing LLM-as-a-Judge with Crowd Comparative Reasoning" (2025)
 * - "CheckEval: Checklist-Based Evaluation" (2024)
 */

export interface EvaluationCriteria {
  relevance: number;      // How well answer addresses the query (0-1)
  completeness: number;   // Whether all aspects are covered (0-1)
  correctness: number;   // Factual accuracy (0-1)
  clarity: number;       // Clarity and coherence (0-1)
}

export interface LLMJudgment {
  overallScore: number;          // 0-1 composite score
  criteria: EvaluationCriteria;
  reasoning: string;              // Chain-of-Thought explanation
  confidence: number;             // Judge's confidence (0-1)
  recommendation?: string;        // Suggestions for improvement
}

export interface EvaluationConfig {
  model?: string;                // LLM model to use (default: gemma3:4b)
  temperature?: number;          // 0.0 for deterministic, 0.3 for slight variation
  useChainOfThought?: boolean;   // Include step-by-step reasoning
  includeRecommendations?: boolean; // Suggest improvements
  domain?: string;               // Domain-specific evaluation
}

/**
 * LLM-as-a-Judge Evaluator
 * Evaluates response quality using LLM with research-backed methodology
 */
export class LLMAsJudgeEvaluator {
  private config: Required<EvaluationConfig>;
  
  constructor(config: EvaluationConfig = {}) {
    this.config = {
      model: config.model || 'gemma3:4b',
      temperature: config.temperature ?? 0.0, // Deterministic by default
      useChainOfThought: config.useChainOfThought ?? true,
      includeRecommendations: config.includeRecommendations ?? true,
      domain: config.domain || 'general'
    };
  }
  
  /**
   * Pointwise evaluation: Score a single response
   * 
   * Research-backed approach with ~90% human agreement
   */
  async evaluatePointwise(
    query: string,
    response: string,
    context?: {
      expectedCriteria?: string[];
      referenceResponse?: string;
      domain?: string;
    }
  ): Promise<LLMJudgment> {
    const prompt = this.buildEvaluationPrompt(query, response, context);
    
    try {
      const llmResponse = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "You are an expert evaluator of AI-generated responses. Your task is to assess response quality based on clear, objective criteria."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: 1500
        })
      });
      
      const data = await llmResponse.json();
      const content = data.choices[0].message.content;
      
      return this.parseJudgment(content, query, response);
    } catch (error) {
      console.error('❌ LLM-as-judge evaluation failed:', error);
      // Fallback: Return neutral score
      return this.createFallbackJudgment();
    }
  }
  
  /**
   * Pairwise evaluation: Compare two responses
   * 
   * Often more reliable than pointwise for relative quality
   */
  async evaluatePairwise(
    query: string,
    responseA: string,
    responseB: string,
    whichIsBetter?: 'A' | 'B'
  ): Promise<{
    winner: 'A' | 'B' | 'tie';
    scores: { A: number; B: number };
    reasoning: string;
  }> {
    const prompt = `You are an expert evaluator comparing two responses to the same query.

Query: ${query}

Response A:
${responseA}

Response B:
${responseB}

Evaluate which response is better based on:
1. **Relevance**: How well it addresses the query
2. **Completeness**: Whether all aspects are covered
3. **Correctness**: Factual accuracy
4. **Clarity**: Clear and coherent presentation

${this.config.useChainOfThought ? `Provide step-by-step reasoning before making your judgment.` : ''}

Format your response as:
Reasoning: <your analysis>
Winner: "A" or "B" or "tie"
Score A: <0-1>
Score B: <0-1>`;

    try {
      const llmResponse = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "You are an expert at comparing and evaluating AI responses."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: 1000
        })
      });
      
      const data = await llmResponse.json();
      const content = data.choices[0].message.content;
      
      return this.parsePairwiseJudgment(content);
    } catch (error) {
      console.error('❌ LLM-as-judge pairwise evaluation failed:', error);
      return {
        winner: 'tie',
        scores: { A: 0.5, B: 0.5 },
        reasoning: 'Evaluation unavailable'
      };
    }
  }
  
  /**
   * Build evaluation prompt with research-backed structure
   */
  private buildEvaluationPrompt(
    query: string,
    response: string,
    context?: {
      expectedCriteria?: string[];
      referenceResponse?: string;
      domain?: string;
    }
  ): string {
    const domain = context?.domain || this.config.domain;
    
    let prompt = `Evaluate the quality of this AI-generated response.

Query: ${query}

Response to Evaluate:
${response}
`;

    if (context?.referenceResponse) {
      prompt += `\nReference Response (for comparison):
${context.referenceResponse}
`;
    }

    prompt += `
## Evaluation Criteria

Assess the response on four dimensions (each 0-1 scale):

1. **Relevance** (0-1): How well does the response address the query?
   - Does it answer what was asked?
   - Is it on-topic and appropriate?

2. **Completeness** (0-1): Are all important aspects covered?
   - Does it address all parts of the query?
   - Is information sufficient and thorough?

3. **Correctness** (0-1): Is the information factually accurate?
   - Are claims supported and accurate?
   - Are there obvious errors or contradictions?

4. **Clarity** (0-1): Is the response clear and well-structured?
   - Is it easy to understand?
   - Is it well-organized and coherent?

${context?.expectedCriteria ? `\nAdditional Criteria to Consider:\n${context.expectedCriteria.map(c => `- ${c}`).join('\n')}\n` : ''}

${this.config.useChainOfThought ? `
## Your Evaluation Process

Think through each criterion step-by-step:
1. Analyze the query requirements
2. Examine how well the response addresses each criterion
3. Assign scores for each dimension
4. Calculate overall score (weighted average: relevance 0.3, completeness 0.3, correctness 0.25, clarity 0.15)
5. Provide reasoning for your scores
` : ''}

## Output Format

Your response must follow this exact format:

\`\`\`
REASONING:
<your step-by-step analysis>

CRITERIA SCORES:
Relevance: <0-1>
Completeness: <0-1>
Correctness: <0-1>
Clarity: <0-1>

OVERALL SCORE: <0-1>

CONFIDENCE: <0-1>
${this.config.includeRecommendations ? `
RECOMMENDATION:
<optional suggestions for improvement>
` : ''}
\`\`\`

Domain: ${domain}`;

    return prompt;
  }
  
  /**
   * Parse LLM judgment response
   */
  private parseJudgment(
    content: string,
    query: string,
    response: string
  ): LLMJudgment {
    try {
      // Extract reasoning
      const reasoningMatch = content.match(/REASONING:\s*(.+?)(?=CRITERIA SCORES:|OVERALL SCORE:|$)/s);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Evaluation completed';
      
      // Extract criteria scores
      const relevanceMatch = content.match(/Relevance:\s*([0-9.]+)/);
      const completenessMatch = content.match(/Completeness:\s*([0-9.]+)/);
      const correctnessMatch = content.match(/Correctness:\s*([0-9.]+)/);
      const clarityMatch = content.match(/Clarity:\s*([0-9.]+)/);
      
      const criteria: EvaluationCriteria = {
        relevance: parseFloat(relevanceMatch?.[1] || '0.5'),
        completeness: parseFloat(completenessMatch?.[1] || '0.5'),
        correctness: parseFloat(correctnessMatch?.[1] || '0.5'),
        clarity: parseFloat(clarityMatch?.[1] || '0.5')
      };
      
      // Extract overall score
      const overallMatch = content.match(/OVERALL SCORE:\s*([0-9.]+)/);
      const overallScore = overallMatch 
        ? parseFloat(overallMatch[1])
        : (criteria.relevance * 0.3 + criteria.completeness * 0.3 + criteria.correctness * 0.25 + criteria.clarity * 0.15);
      
      // Extract confidence
      const confidenceMatch = content.match(/CONFIDENCE:\s*([0-9.]+)/);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;
      
      // Extract recommendation
      const recommendationMatch = content.match(/RECOMMENDATION:\s*(.+?)(?=\n\n|$)/s);
      const recommendation = this.config.includeRecommendations && recommendationMatch
        ? recommendationMatch[1].trim()
        : undefined;
      
      // Validate scores are in range
      const validatedCriteria: EvaluationCriteria = {
        relevance: Math.max(0, Math.min(1, criteria.relevance)),
        completeness: Math.max(0, Math.min(1, criteria.completeness)),
        correctness: Math.max(0, Math.min(1, criteria.correctness)),
        clarity: Math.max(0, Math.min(1, criteria.clarity))
      };
      
      return {
        overallScore: Math.max(0, Math.min(1, overallScore)),
        criteria: validatedCriteria,
        reasoning,
        confidence: Math.max(0, Math.min(1, confidence)),
        recommendation
      };
    } catch (error) {
      console.error('❌ Failed to parse LLM judgment:', error);
      return this.createFallbackJudgment();
    }
  }
  
  /**
   * Parse pairwise judgment
   */
  private parsePairwiseJudgment(content: string): {
    winner: 'A' | 'B' | 'tie';
    scores: { A: number; B: number };
    reasoning: string;
  } {
    try {
      const reasoningMatch = content.match(/Reasoning:\s*(.+?)(?=Winner:|$)/s);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Evaluation completed';
      
      const winnerMatch = content.match(/Winner:\s*["']?(A|B|tie)["']?/i);
      const winner = (winnerMatch?.[1]?.toUpperCase() || 'tie') as 'A' | 'B' | 'tie';
      
      const scoreAMatch = content.match(/Score A:\s*([0-9.]+)/);
      const scoreBMatch = content.match(/Score B:\s*([0-9.]+)/);
      
      return {
        winner,
        scores: {
          A: Math.max(0, Math.min(1, parseFloat(scoreAMatch?.[1] || '0.5'))),
          B: Math.max(0, Math.min(1, parseFloat(scoreBMatch?.[1] || '0.5')))
        },
        reasoning
      };
    } catch (error) {
      return {
        winner: 'tie',
        scores: { A: 0.5, B: 0.5 },
        reasoning: 'Failed to parse judgment'
      };
    }
  }
  
  /**
   * Create fallback judgment when LLM evaluation fails
   */
  private createFallbackJudgment(): LLMJudgment {
    return {
      overallScore: 0.5,
      criteria: {
        relevance: 0.5,
        completeness: 0.5,
        correctness: 0.5,
        clarity: 0.5
      },
      reasoning: 'LLM evaluation unavailable, using fallback',
      confidence: 0.3
    };
  }
  
  /**
   * Quick evaluation (faster, less detailed)
   */
  async evaluateQuick(
    query: string,
    response: string
  ): Promise<number> {
    const judgment = await this.evaluatePointwise(query, response, {
      expectedCriteria: [],
      domain: this.config.domain
    });
    return judgment.overallScore;
  }
}

/**
 * Singleton instance
 */
export const llmAsJudgeEvaluator = new LLMAsJudgeEvaluator({
  useChainOfThought: true,
  includeRecommendations: false, // Disable for performance
  temperature: 0.0 // Deterministic
});

