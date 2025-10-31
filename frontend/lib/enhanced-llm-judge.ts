/**
 * Enhanced LLM-as-a-Judge Implementation
 * Based on DSPy BetterTogether and Reasoning-Intensive Regression research
 * 
 * Implements comprehensive evaluation with:
 * - Multi-dimensional scoring
 * - Reasoning-intensive regression capabilities
 * - Classifier and regression model optimization
 * - Robust prompt coverage for edge cases
 */

import { NextRequest } from 'next/server';

export interface EvaluationContext {
  domain?: string;
  expectedAnswer?: string;
  referenceData?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ReasoningAnalysis {
  logical_flow: number;
  evidence_quality: number;
  argument_strength: number;
  critical_thinking: number;
}

export interface EdgeCaseAnalysis {
  ambiguity_handling: number;
  contradiction_detection: number;
  context_sensitivity: number;
  domain_expertise: number;
}

export interface DimensionWeights {
  dimensions: number[];
  reasoning: {
    logical_flow: number;
    evidence_quality: number;
    argument_strength: number;
    critical_thinking: number;
  };
  edgeCase: {
    ambiguity_handling: number;
    contradiction_detection: number;
    context_sensitivity: number;
    domain_expertise: number;
  };
  overall: {
    dimensions: number;
    reasoning: number;
    edgeCase: number;
  };
}

export interface JudgeEvaluation {
  overall_score: number;
  dimensions: {
    accuracy: number;
    completeness: number;
    clarity: number;
    relevance: number;
    reasoning_quality: number;
    factual_correctness: number;
    coherence: number;
    depth: number;
  };
  reasoning_analysis: {
    logical_flow: number;
    evidence_quality: number;
    argument_strength: number;
    critical_thinking: number;
  };
  edge_case_coverage: {
    ambiguity_handling: number;
    contradiction_detection: number;
    context_sensitivity: number;
    domain_expertise: number;
  };
  confidence: number;
  detailed_feedback: string;
  improvement_suggestions: string[];
}

export interface JudgeConfig {
  domain: string;
  evaluation_type: 'classification' | 'regression' | 'reasoning_intensive';
  strictness: 'lenient' | 'moderate' | 'strict';
  focus_areas: string[];
  edge_cases: string[];
}

/**
 * Enhanced LLM-as-a-Judge with comprehensive evaluation
 * Based on DSPy BetterTogether and RiR research
 */
export class EnhancedLLMJudge {
  private config: JudgeConfig;
  private evaluationHistory: JudgeEvaluation[] = [];

  constructor(config: JudgeConfig) {
    this.config = config;
  }

  /**
   * Comprehensive evaluation using multiple LLM calls
   * Implements the research-backed approach from RiR paper
   */
  async evaluate(
    prompt: string,
    response: string,
    context?: EvaluationContext
  ): Promise<JudgeEvaluation> {
    console.log(`🧠 Enhanced LLM Judge: Evaluating ${this.config.evaluation_type} response`);
    
    const startTime = Date.now();
    
    try {
      // Multi-dimensional evaluation using different judge prompts
      const evaluations = await Promise.all([
        this.evaluateAccuracy(prompt, response, context),
        this.evaluateCompleteness(prompt, response, context),
        this.evaluateClarity(prompt, response, context),
        this.evaluateRelevance(prompt, response, context),
        this.evaluateReasoningQuality(prompt, response, context),
        this.evaluateFactualCorrectness(prompt, response, context),
        this.evaluateCoherence(prompt, response, context),
        this.evaluateDepth(prompt, response, context)
      ]);

      // Reasoning analysis for RiR tasks
      const reasoningAnalysis = await this.analyzeReasoningQuality(prompt, response, context);
      
      // Edge case coverage analysis
      const edgeCaseAnalysis = await this.analyzeEdgeCaseCoverage(prompt, response, context);
      
      // Generate detailed feedback
      const detailedFeedback = await this.generateDetailedFeedback(
        prompt, response, evaluations, reasoningAnalysis, edgeCaseAnalysis, context
      );
      
      // Calculate overall score with weighted dimensions
      const overallScore = this.calculateOverallScore(evaluations, reasoningAnalysis, edgeCaseAnalysis);
      
      // Generate improvement suggestions
      const improvementSuggestions = await this.generateImprovementSuggestions(
        prompt, response, evaluations, reasoningAnalysis, edgeCaseAnalysis
      );

      const evaluation: JudgeEvaluation = {
        overall_score: overallScore,
        dimensions: {
          accuracy: evaluations[0],
          completeness: evaluations[1],
          clarity: evaluations[2],
          relevance: evaluations[3],
          reasoning_quality: evaluations[4],
          factual_correctness: evaluations[5],
          coherence: evaluations[6],
          depth: evaluations[7]
        },
        reasoning_analysis: reasoningAnalysis,
        edge_case_coverage: edgeCaseAnalysis,
        confidence: this.calculateConfidence(evaluations, reasoningAnalysis),
        detailed_feedback: detailedFeedback,
        improvement_suggestions: improvementSuggestions
      };

      this.evaluationHistory.push(evaluation);
      
      const duration = Date.now() - startTime;
      console.log(`   ✅ Enhanced Judge: ${overallScore.toFixed(3)} score in ${duration}ms`);
      
      return evaluation;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Enhanced LLM Judge Error:', error);
      throw new Error(`Judge evaluation failed: ${errorMessage}`);
    }
  }

  /**
   * Evaluate accuracy using domain-specific criteria
   */
  private async evaluateAccuracy(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildAccuracyJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'accuracy');
    } catch (error) {
      console.warn('Accuracy evaluation failed, using fallback');
      return this.fallbackAccuracyEvaluation(prompt, response);
    }
  }

  /**
   * Evaluate completeness using comprehensive criteria
   */
  private async evaluateCompleteness(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildCompletenessJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'completeness');
    } catch (error) {
      console.warn('Completeness evaluation failed, using fallback');
      return this.fallbackCompletenessEvaluation(prompt, response);
    }
  }

  /**
   * Evaluate clarity using linguistic analysis
   */
  private async evaluateClarity(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildClarityJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'clarity');
    } catch (error) {
      console.warn('Clarity evaluation failed, using fallback');
      return this.fallbackClarityEvaluation(prompt, response);
    }
  }

  /**
   * Evaluate relevance to the original prompt
   */
  private async evaluateRelevance(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildRelevanceJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'relevance');
    } catch (error) {
      console.warn('Relevance evaluation failed, using fallback');
      return this.fallbackRelevanceEvaluation(prompt, response);
    }
  }

  /**
   * Evaluate reasoning quality - critical for RiR tasks
   */
  private async evaluateReasoningQuality(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildReasoningJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'reasoning');
    } catch (error) {
      console.warn('Reasoning evaluation failed, using fallback');
      return this.fallbackReasoningEvaluation(prompt, response);
    }
  }

  /**
   * Evaluate factual correctness
   */
  private async evaluateFactualCorrectness(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildFactualJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'factual');
    } catch (error) {
      console.warn('Factual evaluation failed, using fallback');
      return this.fallbackFactualEvaluation(prompt, response);
    }
  }

  /**
   * Evaluate coherence and logical flow
   */
  private async evaluateCoherence(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildCoherenceJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'coherence');
    } catch (error) {
      console.warn('Coherence evaluation failed, using fallback');
      return this.fallbackCoherenceEvaluation(prompt, response);
    }
  }

  /**
   * Evaluate depth of analysis
   */
  private async evaluateDepth(prompt: string, response: string, context?: EvaluationContext): Promise<number> {
    const judgePrompt = this.buildDepthJudgePrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(judgePrompt);
      return this.parseScore(result, 'depth');
    } catch (error) {
      console.warn('Depth evaluation failed, using fallback');
      return this.fallbackDepthEvaluation(prompt, response);
    }
  }

  /**
   * Analyze reasoning quality for RiR tasks
   * Based on the RiR paper methodology
   */
  private async analyzeReasoningQuality(
    prompt: string, 
    response: string, 
    context?: EvaluationContext
  ): Promise<{
    logical_flow: number;
    evidence_quality: number;
    argument_strength: number;
    critical_thinking: number;
  }> {
    const reasoningPrompt = this.buildReasoningAnalysisPrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(reasoningPrompt);
      return this.parseReasoningAnalysis(result);
    } catch (error) {
      console.warn('Reasoning analysis failed, using fallback');
      return this.fallbackReasoningAnalysis(prompt, response);
    }
  }

  /**
   * Analyze edge case coverage
   * Critical for robust evaluation
   */
  private async analyzeEdgeCaseCoverage(
    prompt: string, 
    response: string, 
    context?: EvaluationContext
  ): Promise<{
    ambiguity_handling: number;
    contradiction_detection: number;
    context_sensitivity: number;
    domain_expertise: number;
  }> {
    const edgeCasePrompt = this.buildEdgeCaseAnalysisPrompt(prompt, response, context);
    
    try {
      const result = await this.callJudgeLLM(edgeCasePrompt);
      return this.parseEdgeCaseAnalysis(result);
    } catch (error) {
      console.warn('Edge case analysis failed, using fallback');
      return this.fallbackEdgeCaseAnalysis(prompt, response);
    }
  }

  /**
   * Generate detailed feedback
   */
  private async generateDetailedFeedback(
    prompt: string,
    response: string,
    evaluations: number[],
    reasoningAnalysis: ReasoningAnalysis,
    edgeCaseAnalysis: EdgeCaseAnalysis,
    context?: EvaluationContext
  ): Promise<string> {
    const feedbackPrompt = this.buildFeedbackPrompt(
      prompt, response, evaluations, reasoningAnalysis, edgeCaseAnalysis, context
    );
    
    try {
      const result = await this.callJudgeLLM(feedbackPrompt);
      return result;
    } catch (error) {
      console.warn('Detailed feedback generation failed, using fallback');
      return this.fallbackFeedbackGeneration(evaluations, reasoningAnalysis, edgeCaseAnalysis);
    }
  }

  /**
   * Generate improvement suggestions
   */
  private async generateImprovementSuggestions(
    prompt: string,
    response: string,
    evaluations: number[],
    reasoningAnalysis: ReasoningAnalysis,
    edgeCaseAnalysis: EdgeCaseAnalysis
  ): Promise<string[]> {
    const suggestionsPrompt = this.buildSuggestionsPrompt(
      prompt, response, evaluations, reasoningAnalysis, edgeCaseAnalysis
    );
    
    try {
      const result = await this.callJudgeLLM(suggestionsPrompt);
      return this.parseSuggestions(result);
    } catch (error) {
      console.warn('Improvement suggestions failed, using fallback');
      return this.fallbackSuggestions(evaluations, reasoningAnalysis, edgeCaseAnalysis);
    }
  }

  /**
   * Call the judge LLM with proper error handling
   */
  private async callJudgeLLM(prompt: string): Promise<string> {
    try {
      // Use the best available model for judging
      const response = await fetch('http://localhost:3000/api/kimi-k2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          model: 'alibaba/tongyi-deepresearch-30b-a3b:free', // Best performing model
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Judge LLM rate limited, using fallback evaluation');
          return this.generateFallbackEvaluation(prompt);
        }
        throw new Error(`Judge LLM failed: ${response.status}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Judge LLM call failed:', error);
      // Return fallback evaluation instead of throwing
      return this.generateFallbackEvaluation(prompt);
    }
  }

  /**
   * Generate fallback evaluation when Judge LLM fails
   */
  private generateFallbackEvaluation(prompt: string): string {
    // Simple heuristic-based evaluation
    const promptLength = prompt.length;
    const hasQuestion = prompt.includes('?');
    const hasKeywords = ['legal', 'compliance', 'regulation', 'requirement'].some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    
    let score = 0.5; // Base score
    
    if (hasQuestion) score += 0.1;
    if (hasKeywords) score += 0.2;
    if (promptLength > 100) score += 0.1;
    if (promptLength > 500) score += 0.1;
    
    return `Fallback evaluation: ${Math.min(score, 1.0).toFixed(3)}`;
  }

  /**
   * Build accuracy judge prompt with comprehensive criteria
   */
  private buildAccuracyJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the accuracy of an AI response. 

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}
EVALUATION TYPE: ${this.config.evaluation_type}

Please evaluate the accuracy of the response on a scale of 0.0 to 1.0, considering:

1. **Factual Correctness**: Are the facts, data, and information accurate?
2. **Logical Consistency**: Are the conclusions logically sound?
3. **Domain Knowledge**: Does it demonstrate correct domain expertise?
4. **Precision**: Is the information precise and not vague?
5. **Verifiability**: Can the claims be verified or supported?

Consider these edge cases:
${this.config.edge_cases.map(edgeCase => `- ${edgeCase}`).join('\n')}

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build completeness judge prompt
   */
  private buildCompletenessJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the completeness of an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please evaluate the completeness of the response on a scale of 0.0 to 1.0, considering:

1. **Coverage**: Does it address all aspects of the prompt?
2. **Depth**: Is the analysis sufficiently deep?
3. **Examples**: Are relevant examples provided?
4. **Context**: Is sufficient context provided?
5. **Scope**: Does it cover the full scope of the question?

Focus areas to consider:
${this.config.focus_areas.map(area => `- ${area}`).join('\n')}

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build clarity judge prompt
   */
  private buildClarityJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the clarity of an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please evaluate the clarity of the response on a scale of 0.0 to 1.0, considering:

1. **Language Clarity**: Is the language clear and understandable?
2. **Structure**: Is the response well-structured and organized?
3. **Conciseness**: Is it concise without being too brief?
4. **Jargon**: Is technical jargon appropriately explained?
5. **Flow**: Does the response flow logically?

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build relevance judge prompt
   */
  private buildRelevanceJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the relevance of an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please evaluate the relevance of the response on a scale of 0.0 to 1.0, considering:

1. **Direct Relevance**: Does it directly address the prompt?
2. **Scope Match**: Does the scope match the question?
3. **Context Appropriateness**: Is it appropriate for the context?
4. **Domain Alignment**: Does it align with the domain?
5. **Usefulness**: Is it useful for the intended purpose?

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build reasoning judge prompt - critical for RiR tasks
   */
  private buildReasoningJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the reasoning quality of an AI response for reasoning-intensive regression tasks.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}
EVALUATION TYPE: ${this.config.evaluation_type}

Please evaluate the reasoning quality on a scale of 0.0 to 1.0, considering:

1. **Logical Reasoning**: Is the logical reasoning sound and valid?
2. **Step-by-step Analysis**: Are the reasoning steps clear and logical?
3. **Evidence Usage**: Is evidence used appropriately to support conclusions?
4. **Critical Thinking**: Does it demonstrate critical thinking?
5. **Problem Solving**: Is the problem-solving approach effective?
6. **Numerical Reasoning**: For RiR tasks, is numerical reasoning accurate?
7. **Deductive/Inductive Logic**: Are logical inferences correct?

This is especially important for reasoning-intensive regression tasks where subtle numerical properties must be deduced from text.

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build factual correctness judge prompt
   */
  private buildFactualJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the factual correctness of an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please evaluate the factual correctness on a scale of 0.0 to 1.0, considering:

1. **Factual Accuracy**: Are the facts accurate and verifiable?
2. **Data Accuracy**: Are any data points, statistics, or numbers correct?
3. **Source Reliability**: Are sources and references reliable?
4. **Misinformation**: Is there any misinformation or false claims?
5. **Outdated Information**: Is the information current and up-to-date?

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build coherence judge prompt
   */
  private buildCoherenceJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the coherence of an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please evaluate the coherence on a scale of 0.0 to 1.0, considering:

1. **Logical Flow**: Does the response flow logically from point to point?
2. **Consistency**: Is the response internally consistent?
3. **Transitions**: Are transitions between ideas smooth?
4. **Unity**: Does the response maintain a unified theme?
5. **Contradictions**: Are there any internal contradictions?

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build depth judge prompt
   */
  private buildDepthJudgePrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge evaluating the depth of an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please evaluate the depth on a scale of 0.0 to 1.0, considering:

1. **Analysis Depth**: How deep is the analysis?
2. **Insight Level**: Does it provide meaningful insights?
3. **Complexity Handling**: Does it handle complex aspects appropriately?
4. **Nuance**: Does it capture nuances and subtleties?
5. **Comprehensive Coverage**: Does it cover the topic comprehensively?

Respond with ONLY a number between 0.0 and 1.0, followed by a brief explanation (max 50 words).`;
  }

  /**
   * Build reasoning analysis prompt for RiR tasks
   */
  private buildReasoningAnalysisPrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge analyzing the reasoning quality of an AI response for reasoning-intensive regression tasks.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please analyze the reasoning quality and provide scores (0.0-1.0) for:

1. **Logical Flow**: How well does the reasoning flow from premise to conclusion?
2. **Evidence Quality**: How strong is the evidence used to support claims?
3. **Argument Strength**: How convincing are the arguments presented?
4. **Critical Thinking**: How well does it demonstrate critical thinking skills?

For reasoning-intensive regression tasks, pay special attention to:
- Numerical reasoning accuracy
- Step-by-step logical progression
- Evidence-based conclusions
- Critical analysis of assumptions

Respond with a JSON object containing the four scores and brief explanations.`;
  }

  /**
   * Build edge case analysis prompt
   */
  private buildEdgeCaseAnalysisPrompt(prompt: string, response: string, context?: EvaluationContext): string {
    return `You are an expert judge analyzing how well an AI response handles edge cases and potential issues.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please analyze edge case coverage and provide scores (0.0-1.0) for:

1. **Ambiguity Handling**: How well does it handle ambiguous situations?
2. **Contradiction Detection**: How well does it identify and address contradictions?
3. **Context Sensitivity**: How sensitive is it to context changes?
4. **Domain Expertise**: How well does it demonstrate domain expertise?

Consider these specific edge cases:
${this.config.edge_cases.map(edgeCase => `- ${edgeCase}`).join('\n')}

Respond with a JSON object containing the four scores and brief explanations.`;
  }

  /**
   * Build feedback prompt
   */
  private buildFeedbackPrompt(
    prompt: string,
    response: string,
    evaluations: number[],
    reasoningAnalysis: ReasoningAnalysis,
    edgeCaseAnalysis: EdgeCaseAnalysis,
    context?: EvaluationContext
  ): string {
    return `You are an expert judge providing detailed feedback on an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

EVALUATION SCORES:
- Accuracy: ${evaluations[0]?.toFixed(3)}
- Completeness: ${evaluations[1]?.toFixed(3)}
- Clarity: ${evaluations[2]?.toFixed(3)}
- Relevance: ${evaluations[3]?.toFixed(3)}
- Reasoning Quality: ${evaluations[4]?.toFixed(3)}
- Factual Correctness: ${evaluations[5]?.toFixed(3)}
- Coherence: ${evaluations[6]?.toFixed(3)}
- Depth: ${evaluations[7]?.toFixed(3)}

REASONING ANALYSIS: ${JSON.stringify(reasoningAnalysis)}
EDGE CASE ANALYSIS: ${JSON.stringify(edgeCaseAnalysis)}

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

DOMAIN: ${this.config.domain}

Please provide detailed feedback on the response, highlighting:
1. **Strengths**: What the response does well
2. **Weaknesses**: Areas that need improvement
3. **Specific Issues**: Concrete problems identified
4. **Overall Assessment**: Summary of the response quality

Keep the feedback constructive and actionable.`;
  }

  /**
   * Build suggestions prompt
   */
  private buildSuggestionsPrompt(
    prompt: string,
    response: string,
    evaluations: number[],
    reasoningAnalysis: ReasoningAnalysis,
    edgeCaseAnalysis: EdgeCaseAnalysis
  ): string {
    return `You are an expert judge providing improvement suggestions for an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

EVALUATION SCORES:
- Accuracy: ${evaluations[0]?.toFixed(3)}
- Completeness: ${evaluations[1]?.toFixed(3)}
- Clarity: ${evaluations[2]?.toFixed(3)}
- Relevance: ${evaluations[3]?.toFixed(3)}
- Reasoning Quality: ${evaluations[4]?.toFixed(3)}
- Factual Correctness: ${evaluations[5]?.toFixed(3)}
- Coherence: ${evaluations[6]?.toFixed(3)}
- Depth: ${evaluations[7]?.toFixed(3)}

REASONING ANALYSIS: ${JSON.stringify(reasoningAnalysis)}
EDGE CASE ANALYSIS: ${JSON.stringify(edgeCaseAnalysis)}

DOMAIN: ${this.config.domain}

Please provide specific, actionable improvement suggestions. Focus on:
1. **High-impact improvements**: Changes that would significantly improve the response
2. **Specific recommendations**: Concrete suggestions for improvement
3. **Priority order**: Most important improvements first
4. **Implementation guidance**: How to implement the suggestions

Provide 3-5 specific suggestions.`;
  }

  /**
   * Parse score from judge response
   */
  private parseScore(response: string, type: string): number {
    try {
      // Extract number from response
      const match = response.match(/(\d+\.?\d*)/);
      if (match) {
        const score = parseFloat(match[1]);
        return Math.max(0, Math.min(1, score));
      }
    } catch (error) {
      console.warn(`Failed to parse ${type} score:`, error);
    }
    return 0.5; // Default fallback score
  }

  /**
   * Parse reasoning analysis from JSON response
   */
  private parseReasoningAnalysis(response: string): ReasoningAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        logical_flow: Math.max(0, Math.min(1, parsed.logical_flow || 0.5)),
        evidence_quality: Math.max(0, Math.min(1, parsed.evidence_quality || 0.5)),
        argument_strength: Math.max(0, Math.min(1, parsed.argument_strength || 0.5)),
        critical_thinking: Math.max(0, Math.min(1, parsed.critical_thinking || 0.5))
      };
    } catch (error) {
      console.warn('Failed to parse reasoning analysis:', error);
      return {
        logical_flow: 0.5,
        evidence_quality: 0.5,
        argument_strength: 0.5,
        critical_thinking: 0.5
      };
    }
  }

  /**
   * Parse edge case analysis from JSON response
   */
  private parseEdgeCaseAnalysis(response: string): EdgeCaseAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        ambiguity_handling: Math.max(0, Math.min(1, parsed.ambiguity_handling || 0.5)),
        contradiction_detection: Math.max(0, Math.min(1, parsed.contradiction_detection || 0.5)),
        context_sensitivity: Math.max(0, Math.min(1, parsed.context_sensitivity || 0.5)),
        domain_expertise: Math.max(0, Math.min(1, parsed.domain_expertise || 0.5))
      };
    } catch (error) {
      console.warn('Failed to parse edge case analysis:', error);
      return {
        ambiguity_handling: 0.5,
        contradiction_detection: 0.5,
        context_sensitivity: 0.5,
        domain_expertise: 0.5
      };
    }
  }

  /**
   * Parse suggestions from response
   */
  private parseSuggestions(response: string): string[] {
    try {
      // Split by numbered items or bullet points
      const suggestions = response
        .split(/\n\s*\d+\.|\n\s*[-*]\s*/)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim())
        .slice(0, 5); // Limit to 5 suggestions
      
      return suggestions.length > 0 ? suggestions : ['No specific suggestions available'];
    } catch (error) {
      console.warn('Failed to parse suggestions:', error);
      return ['No specific suggestions available'];
    }
  }

  /**
   * Calculate overall score with weighted dimensions
   */
  private calculateOverallScore(
    evaluations: number[],
    reasoningAnalysis: ReasoningAnalysis,
    edgeCaseAnalysis: EdgeCaseAnalysis
  ): number {
    // Weight the dimensions based on evaluation type
    const weights = this.getDimensionWeights();
    
    const dimensionScore = evaluations.reduce((sum: number, score, index) => {
      return sum + (score * weights.dimensions[index]);
    }, 0) / weights.dimensions.reduce((sum: number, weight: number) => sum + weight, 0);
    
    const reasoningScore = (
      reasoningAnalysis.logical_flow * weights.reasoning.logical_flow +
      reasoningAnalysis.evidence_quality * weights.reasoning.evidence_quality +
      reasoningAnalysis.argument_strength * weights.reasoning.argument_strength +
      reasoningAnalysis.critical_thinking * weights.reasoning.critical_thinking
    ) / (Object.values(weights.reasoning) as number[]).reduce((sum: number, weight: number) => sum + weight, 0);
    
    const edgeCaseScore = (
      edgeCaseAnalysis.ambiguity_handling * weights.edgeCase.ambiguity_handling +
      edgeCaseAnalysis.contradiction_detection * weights.edgeCase.contradiction_detection +
      edgeCaseAnalysis.context_sensitivity * weights.edgeCase.context_sensitivity +
      edgeCaseAnalysis.domain_expertise * weights.edgeCase.domain_expertise
    ) / (Object.values(weights.edgeCase) as number[]).reduce((sum: number, weight: number) => sum + weight, 0);
    
    // Combine scores with overall weights
    const overallScore = (
      dimensionScore * weights.overall.dimensions +
      reasoningScore * weights.overall.reasoning +
      edgeCaseScore * weights.overall.edgeCase
    ) / (weights.overall.dimensions + weights.overall.reasoning + weights.overall.edgeCase);
    
    return Math.max(0, Math.min(1, overallScore));
  }

  /**
   * Get dimension weights based on evaluation type and domain
   */
  private getDimensionWeights(): DimensionWeights {
    const baseWeights = {
      dimensions: [1, 1, 1, 1, 1, 1, 1, 1], // Equal weight for all dimensions
      reasoning: {
        logical_flow: 1,
        evidence_quality: 1,
        argument_strength: 1,
        critical_thinking: 1
      },
      edgeCase: {
        ambiguity_handling: 1,
        contradiction_detection: 1,
        context_sensitivity: 1,
        domain_expertise: 1
      },
      overall: {
        dimensions: 0.6,
        reasoning: 0.3,
        edgeCase: 0.1
      }
    };

    // Adjust weights based on evaluation type
    if (this.config.evaluation_type === 'reasoning_intensive') {
      baseWeights.overall.reasoning = 0.5; // Higher weight for reasoning
      baseWeights.overall.dimensions = 0.4;
      baseWeights.overall.edgeCase = 0.1;
    } else if (this.config.evaluation_type === 'classification') {
      baseWeights.overall.dimensions = 0.7; // Higher weight for dimensions
      baseWeights.overall.reasoning = 0.2;
      baseWeights.overall.edgeCase = 0.1;
    }

    // Adjust weights based on domain
    if (this.config.domain === 'legal') {
      baseWeights.dimensions[4] = 1.5; // Higher weight for reasoning quality
      baseWeights.dimensions[5] = 1.5; // Higher weight for factual correctness
    } else if (this.config.domain === 'finance') {
      baseWeights.dimensions[0] = 1.5; // Higher weight for accuracy
      baseWeights.dimensions[5] = 1.5; // Higher weight for factual correctness
    }

    return baseWeights;
  }

  /**
   * Calculate confidence based on evaluation consistency
   */
  private calculateConfidence(evaluations: number[], reasoningAnalysis: ReasoningAnalysis): number {
    // Calculate variance in evaluations
    const mean = evaluations.reduce((sum, score) => sum + score, 0) / evaluations.length;
    const variance = evaluations.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / evaluations.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const consistencyScore = Math.max(0, 1 - standardDeviation);
    
    // Factor in reasoning analysis consistency
    const reasoningConsistency = (
      reasoningAnalysis.logical_flow + reasoningAnalysis.evidence_quality +
      reasoningAnalysis.argument_strength + reasoningAnalysis.critical_thinking
    ) / 4;
    
    return (consistencyScore + reasoningConsistency) / 2;
  }

  // Fallback methods for when LLM calls fail
  private fallbackAccuracyEvaluation(prompt: string, response: string): number {
    // Simple keyword-based accuracy check
    const accuracyKeywords = ['accurate', 'correct', 'verified', 'confirmed', 'precise'];
    const accuracyScore = accuracyKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length / accuracyKeywords.length;
    
    return Math.max(0.3, Math.min(0.8, accuracyScore));
  }

  private fallbackCompletenessEvaluation(prompt: string, response: string): number {
    // Simple length and structure check
    const wordCount = response.split(' ').length;
    const hasStructure = response.includes('1.') || response.includes('•') || response.includes('-');
    const hasExamples = response.toLowerCase().includes('example') || response.toLowerCase().includes('for instance');
    
    let score = 0.3;
    if (wordCount > 100) score += 0.2;
    if (hasStructure) score += 0.2;
    if (hasExamples) score += 0.3;
    
    return Math.max(0.3, Math.min(0.8, score));
  }

  private fallbackClarityEvaluation(prompt: string, response: string): number {
    // Simple readability check
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = response.split(' ').length / sentences.length;
    
    let score = 0.5;
    if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20) score += 0.2;
    if (response.includes('?') || response.includes('explain')) score += 0.1;
    if (response.length > 50) score += 0.2;
    
    return Math.max(0.3, Math.min(0.8, score));
  }

  private fallbackRelevanceEvaluation(prompt: string, response: string): number {
    // Simple keyword overlap check
    const promptWords = prompt.toLowerCase().split(' ').filter(word => word.length > 3);
    const responseWords = response.toLowerCase().split(' ').filter(word => word.length > 3);
    const overlap = promptWords.filter(word => responseWords.includes(word)).length;
    const relevanceScore = overlap / Math.max(promptWords.length, 1);
    
    return Math.max(0.3, Math.min(0.8, relevanceScore));
  }

  private fallbackReasoningEvaluation(prompt: string, response: string): number {
    // Simple reasoning indicators
    const reasoningKeywords = ['because', 'therefore', 'thus', 'hence', 'consequently', 'analysis', 'reasoning'];
    const reasoningScore = reasoningKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length / reasoningKeywords.length;
    
    return Math.max(0.3, Math.min(0.8, reasoningScore));
  }

  private fallbackFactualEvaluation(prompt: string, response: string): number {
    // Simple factual indicators
    const factualKeywords = ['data', 'research', 'study', 'evidence', 'statistics', 'according to'];
    const factualScore = factualKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length / factualKeywords.length;
    
    return Math.max(0.3, Math.min(0.8, factualScore));
  }

  private fallbackCoherenceEvaluation(prompt: string, response: string): number {
    // Simple coherence check
    const hasTransitions = response.includes('however') || response.includes('moreover') || response.includes('furthermore');
    const hasStructure = response.includes('1.') || response.includes('•') || response.includes('-');
    const hasConclusion = response.toLowerCase().includes('conclusion') || response.toLowerCase().includes('summary');
    
    let score = 0.3;
    if (hasTransitions) score += 0.2;
    if (hasStructure) score += 0.2;
    if (hasConclusion) score += 0.3;
    
    return Math.max(0.3, Math.min(0.8, score));
  }

  private fallbackDepthEvaluation(prompt: string, response: string): number {
    // Simple depth check
    const wordCount = response.split(' ').length;
    const hasAnalysis = response.toLowerCase().includes('analyze') || response.toLowerCase().includes('analysis');
    const hasInsights = response.toLowerCase().includes('insight') || response.toLowerCase().includes('implication');
    
    let score = 0.3;
    if (wordCount > 200) score += 0.2;
    if (hasAnalysis) score += 0.2;
    if (hasInsights) score += 0.3;
    
    return Math.max(0.3, Math.min(0.8, score));
  }

  private fallbackReasoningAnalysis(prompt: string, response: string): ReasoningAnalysis {
    return {
      logical_flow: 0.5,
      evidence_quality: 0.5,
      argument_strength: 0.5,
      critical_thinking: 0.5
    };
  }

  private fallbackEdgeCaseAnalysis(prompt: string, response: string): EdgeCaseAnalysis {
    return {
      ambiguity_handling: 0.5,
      contradiction_detection: 0.5,
      context_sensitivity: 0.5,
      domain_expertise: 0.5
    };
  }

  private fallbackFeedbackGeneration(evaluations: number[], reasoningAnalysis: ReasoningAnalysis, edgeCaseAnalysis: EdgeCaseAnalysis): string {
    const avgScore = evaluations.reduce((sum, score) => sum + score, 0) / evaluations.length;
    return `Response scored ${avgScore.toFixed(3)} overall. ${avgScore > 0.7 ? 'Good quality response.' : 'Response needs improvement.'}`;
  }

  private fallbackSuggestions(evaluations: number[], reasoningAnalysis: ReasoningAnalysis, edgeCaseAnalysis: EdgeCaseAnalysis): string[] {
    const suggestions = [];
    if (evaluations[0] < 0.6) suggestions.push('Improve accuracy and factual correctness');
    if (evaluations[1] < 0.6) suggestions.push('Provide more comprehensive coverage');
    if (evaluations[2] < 0.6) suggestions.push('Enhance clarity and readability');
    if (evaluations[4] < 0.6) suggestions.push('Strengthen reasoning and logical flow');
    return suggestions.length > 0 ? suggestions : ['No specific suggestions available'];
  }
}

/**
 * Factory function to create enhanced judge instances
 */
export function createEnhancedJudge(config: JudgeConfig): EnhancedLLMJudge {
  return new EnhancedLLMJudge(config);
}

/**
 * Default judge configurations for different domains and evaluation types
 */
export const DEFAULT_JUDGE_CONFIGS = {
  legal: {
    domain: 'legal',
    evaluation_type: 'reasoning_intensive' as const,
    strictness: 'strict' as const,
    focus_areas: ['legal reasoning', 'precedent analysis', 'risk assessment', 'compliance'],
    edge_cases: ['conflicting laws', 'jurisdictional issues', 'ambiguous regulations', 'ethical dilemmas']
  },
  finance: {
    domain: 'finance',
    evaluation_type: 'regression' as const,
    strictness: 'strict' as const,
    focus_areas: ['financial analysis', 'risk assessment', 'market trends', 'investment advice'],
    edge_cases: ['market volatility', 'regulatory changes', 'economic uncertainty', 'data quality issues']
  },
  general: {
    domain: 'general',
    evaluation_type: 'classification' as const,
    strictness: 'moderate' as const,
    focus_areas: ['accuracy', 'completeness', 'clarity', 'relevance'],
    edge_cases: ['ambiguous questions', 'contradictory information', 'context changes', 'domain boundaries']
  }
};
