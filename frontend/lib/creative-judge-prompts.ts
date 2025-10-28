/**
 * Creative Judge Prompting System
 * 
 * Integrates powerful prompting patterns that unlock creative, non-formulaic evaluation:
 * 
 * 1. "Let's think about this differently" - Breaks cookie-cutter responses
 * 2. "What am I not seeing here?" - Finds blind spots and hidden assumptions
 * 3. "Break this down for me" - Forces deep, granular analysis
 * 4. "What would you do in my shoes?" - Gets opinionated, not neutral
 * 5. "Here's what I'm really asking" - Clarifies true evaluation intent
 * 6. "What else should I know?" - Surfaces unexpected insights
 * 
 * These patterns make the judge:
 * - More creative and less formulaic
 * - Better at finding edge cases
 * - More practical and actionable
 * - Less generic in feedback
 */

import { JudgeEvaluation, JudgeConfig } from './enhanced-llm-judge';

export interface CreativeJudgeEvaluation extends JudgeEvaluation {
  creative_insights: {
    different_perspective: string;
    blind_spots: string[];
    deep_breakdown: string;
    opinionated_advice: string;
    hidden_questions: string[];
    additional_context: string[];
  };
  non_obvious_issues: string[];
  unexpected_strengths: string[];
}

/**
 * Creative Judge Prompting System
 * Uses pattern-based prompts to unlock deeper evaluation
 */
export class CreativeJudgeSystem {
  private config: JudgeConfig;
  private evaluationHistory: CreativeJudgeEvaluation[] = [];
  
  constructor(config: JudgeConfig) {
    this.config = config;
  }
  
  /**
   * MAIN: Creative evaluation using pattern-based prompts
   */
  async evaluateCreatively(
    prompt: string,
    response: string,
    context?: any
  ): Promise<CreativeJudgeEvaluation> {
    console.log('🎨 Creative Judge: Using pattern-based prompts for evaluation');
    
    const startTime = Date.now();
    
    try {
      // Run all creative pattern evaluations in parallel
      const [
        differentPerspective,
        blindSpots,
        deepBreakdown,
        opinionatedAdvice,
        hiddenQuestions,
        additionalContext,
        nonObviousIssues,
        unexpectedStrengths
      ] = await Promise.all([
        this.pattern1_ThinkDifferently(prompt, response, context),
        this.pattern2_FindBlindSpots(prompt, response, context),
        this.pattern3_BreakItDown(prompt, response, context),
        this.pattern4_InYourShoes(prompt, response, context),
        this.pattern5_ReallyAsking(prompt, response, context),
        this.pattern6_WhatElse(prompt, response, context),
        this.findNonObviousIssues(prompt, response, context),
        this.findUnexpectedStrengths(prompt, response, context)
      ]);
      
      // Calculate comprehensive scores
      const dimensions = await this.calculateCreativeDimensions(
        prompt, response, differentPerspective, deepBreakdown, context
      );
      
      const reasoningAnalysis = await this.analyzeReasoningCreatively(
        prompt, response, blindSpots, deepBreakdown
      );
      
      const edgeCaseCoverage = await this.analyzeEdgeCasesCreatively(
        prompt, response, nonObviousIssues, blindSpots
      );
      
      // Generate detailed creative feedback
      const detailedFeedback = this.synthesizeCreativeFeedback(
        differentPerspective,
        blindSpots,
        deepBreakdown,
        opinionatedAdvice,
        hiddenQuestions,
        additionalContext
      );
      
      // Generate improvement suggestions
      const improvementSuggestions = this.generateCreativeImprovements(
        blindSpots,
        nonObviousIssues,
        opinionatedAdvice
      );
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        dimensions,
        reasoningAnalysis,
        edgeCaseCoverage,
        blindSpots.length,
        unexpectedStrengths.length
      );
      
      const evaluation: CreativeJudgeEvaluation = {
        overall_score: overallScore,
        dimensions,
        reasoning_analysis: reasoningAnalysis,
        edge_case_coverage: edgeCaseCoverage,
        confidence: this.calculateCreativeConfidence(
          differentPerspective,
          blindSpots,
          deepBreakdown
        ),
        detailed_feedback: detailedFeedback,
        improvement_suggestions: improvementSuggestions,
        creative_insights: {
          different_perspective: differentPerspective,
          blind_spots: blindSpots,
          deep_breakdown: deepBreakdown,
          opinionated_advice: opinionatedAdvice,
          hidden_questions: hiddenQuestions,
          additional_context: additionalContext
        },
        non_obvious_issues: nonObviousIssues,
        unexpected_strengths: unexpectedStrengths
      };
      
      this.evaluationHistory.push(evaluation);
      
      const duration = Date.now() - startTime;
      console.log(`   ✅ Creative Judge: ${overallScore.toFixed(3)} score with ${blindSpots.length} blind spots found in ${duration}ms`);
      
      return evaluation;
      
    } catch (error) {
      console.error('❌ Creative Judge Error:', error);
      throw error;
    }
  }
  
  /**
   * PATTERN 1: "Let's think about this differently"
   * Breaks cookie-cutter responses, gets creative evaluation
   */
  private async pattern1_ThinkDifferently(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string> {
    const creativePrompt = `You are evaluating an AI response, but I need you to approach this differently than usual.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

**Let's think about this differently.**

Instead of the standard "accuracy/completeness/clarity" checklist, I want you to:

1. **Question your assumptions**: What if this response is brilliant in a way you're not seeing?
2. **Consider alternative framings**: How would this look from a completely different perspective?
3. **Find the non-obvious**: What's interesting here that a formulaic evaluation would miss?
4. **Get creative**: What unconventional evaluation criteria actually matter here?

Don't give me a standard evaluation. Give me something that makes me think "I never considered that angle."

What's your unconventional take on this response?`;

    return await this.callCreativeJudgeLLM(creativePrompt);
  }
  
  /**
   * PATTERN 2: "What am I not seeing here?"
   * Finds blind spots and hidden assumptions
   */
  private async pattern2_FindBlindSpots(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string[]> {
    const blindSpotPrompt = `You are analyzing an AI response with fresh eyes.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

**What am I not seeing here?**

I need you to find the blind spots - the things that are easy to miss:

1. **Hidden assumptions**: What assumptions does this response make that might not hold?
2. **Unstated implications**: What are the consequences that aren't mentioned?
3. **Missing perspectives**: What viewpoints are completely absent?
4. **Edge cases**: What scenarios would break this response?
5. **Subtle biases**: What biases are lurking beneath the surface?
6. **Question quality**: Is the original prompt even asking the right question?

Be specific. List each blind spot as a separate insight. Format as:
- Blind spot 1: [specific issue]
- Blind spot 2: [specific issue]
etc.`;

    const result = await this.callCreativeJudgeLLM(blindSpotPrompt);
    return this.parseBlindSpots(result);
  }
  
  /**
   * PATTERN 3: "Break this down for me"
   * Forces deep, granular analysis
   */
  private async pattern3_BreakItDown(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string> {
    const breakdownPrompt = `You are doing a deep dive analysis of an AI response.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

**Break this down for me.**

Even though this might seem straightforward, I want you to break it down deeply:

1. **The science**: What underlying principles or research back this up (or don't)?
2. **The technique**: How is this response actually constructed? What strategies is it using?
3. **The assumptions**: What must be true for this response to work?
4. **The mechanics**: Step by step, how does each part contribute to the whole?
5. **The gaps**: Where are the cracks in the logic or evidence?
6. **The alternatives**: What other approaches could have been taken?

Don't summarize. BREAK IT DOWN. Get granular. Get specific.`;

    return await this.callCreativeJudgeLLM(breakdownPrompt);
  }
  
  /**
   * PATTERN 4: "What would you do in my shoes?"
   * Gets opinionated advice, not neutral evaluation
   */
  private async pattern4_InYourShoes(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string> {
    const opinionatedPrompt = `You are evaluating an AI response, but I need your actual opinion.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

**What would you do in my shoes?**

Stop being a neutral evaluator. I need your actual opinion:

1. **Would YOU use this response?** Why or why not?
2. **What would YOU do differently?** Be specific and opinionated.
3. **What's your gut feeling?** Does something feel off, even if you can't articulate it?
4. **What would YOU prioritize?** If you had to improve this, what matters most?
5. **What's your honest take?** No hedging, no "on one hand, on the other hand."

Give me actual opinions, not balanced academic assessment. What's your real advice?`;

    return await this.callCreativeJudgeLLM(opinionatedPrompt);
  }
  
  /**
   * PATTERN 5: "Here's what I'm really asking"
   * Clarifies the hidden intent behind the evaluation
   */
  private async pattern5_ReallyAsking(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string[]> {
    const intentPrompt = `You are evaluating an AI response, but let's clarify what we're REALLY asking.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

**Here's what I'm really asking:**

The surface question is: "Is this response good?"

But what am I REALLY asking? Consider:

1. **Will this actually help someone?** (not just "is it accurate")
2. **Does this solve the real problem?** (not just "does it answer the question")
3. **Is this actionable?** (not just "is it complete")
4. **Will this stand up in practice?** (not just "is it theoretically sound")
5. **Does this avoid causing problems?** (not just "is it correct")

For each hidden question, tell me:
- What's really being asked
- How the response addresses (or doesn't address) it

Format as separate insights.`;

    const result = await this.callCreativeJudgeLLM(intentPrompt);
    return this.parseHiddenQuestions(result);
  }
  
  /**
   * PATTERN 6: "What else should I know?"
   * The secret sauce - surfaces unexpected context and warnings
   */
  private async pattern6_WhatElse(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string[]> {
    const contextPrompt = `You are evaluating an AI response, but I need the context I didn't know to ask for.

ORIGINAL PROMPT: "${prompt}"

AI RESPONSE: "${response}"

${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

**What else should I know?**

This is the secret sauce. Tell me:

1. **Important warnings**: What could go wrong that I'm not thinking about?
2. **Missing context**: What background info would change how I see this?
3. **Hidden dependencies**: What does this rely on that isn't mentioned?
4. **Downstream effects**: What happens next that I should consider?
5. **Alternative interpretations**: What other ways could this be understood?
6. **Related issues**: What adjacent problems does this connect to?
7. **Timing considerations**: Is this advice time-sensitive in ways that aren't obvious?

Give me the context and warnings I never thought to ask for. Format as separate insights.`;

    const result = await this.callCreativeJudgeLLM(contextPrompt);
    return this.parseAdditionalContext(result);
  }
  
  /**
   * Find non-obvious issues using creative analysis
   */
  private async findNonObviousIssues(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string[]> {
    const issuesPrompt = `Find the NON-OBVIOUS issues with this response.

Don't tell me about obvious problems like "it's not complete" or "lacks examples."

Tell me about:
- Subtle logical flaws
- Hidden contradictions
- Questionable assumptions presented as facts
- Missing nuance in complex topics
- Over-simplifications that could mislead
- Implied biases or perspectives
- Gaps between what's said and what's needed

ORIGINAL PROMPT: "${prompt}"
AI RESPONSE: "${response}"

List each non-obvious issue separately.`;

    const result = await this.callCreativeJudgeLLM(issuesPrompt);
    return this.parseIssues(result);
  }
  
  /**
   * Find unexpected strengths
   */
  private async findUnexpectedStrengths(
    prompt: string,
    response: string,
    context?: any
  ): Promise<string[]> {
    const strengthsPrompt = `Find the UNEXPECTED strengths of this response.

Don't tell me "it's accurate" or "well-structured."

Tell me about:
- Clever approaches that aren't obvious
- Subtle insights buried in the text
- Connections that show deep understanding
- Preemptive handling of unstated concerns
- Creative framings that add value
- Second-order effects that are handled well

ORIGINAL PROMPT: "${prompt}"
AI RESPONSE: "${response}"

List each unexpected strength separately.`;

    const result = await this.callCreativeJudgeLLM(strengthsPrompt);
    return this.parseStrengths(result);
  }
  
  /**
   * Call LLM with creative prompt using Ollama
   */
  private async callCreativeJudgeLLM(prompt: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:4b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.8, // Higher temp for creativity
            max_tokens: 2000
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.response || '';
      
    } catch (error) {
      console.error('Creative Judge LLM call failed:', error);
      
      // Fallback: Return a basic evaluation if LLM fails
      return 'Creative evaluation unavailable. Using fallback scoring.';
    }
  }
  
  /**
   * Parse blind spots from response
   */
  private parseBlindSpots(response: string): string[] {
    const lines = response.split('\n');
    const blindSpots: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/[-•]\s*(?:Blind spot \d+:|Blind spot:)?\s*(.+)/i);
      if (match) {
        blindSpots.push(match[1].trim());
      }
    }
    
    return blindSpots.length > 0 ? blindSpots : [response.substring(0, 200)];
  }
  
  /**
   * Parse hidden questions from response
   */
  private parseHiddenQuestions(response: string): string[] {
    const lines = response.split('\n');
    const questions: string[] = [];
    
    for (const line of lines) {
      if (line.includes('really asking') || line.includes('What') || line.match(/[-•]/)) {
        const cleaned = line.replace(/^[-•]\s*/, '').trim();
        if (cleaned.length > 10) {
          questions.push(cleaned);
        }
      }
    }
    
    return questions.length > 0 ? questions : [response.substring(0, 200)];
  }
  
  /**
   * Parse additional context from response
   */
  private parseAdditionalContext(response: string): string[] {
    const lines = response.split('\n');
    const context: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^[-•]\s*(.+)/);
      if (match) {
        context.push(match[1].trim());
      }
    }
    
    return context.length > 0 ? context : [response];
  }
  
  /**
   * Parse issues from response
   */
  private parseIssues(response: string): string[] {
    return this.parseListItems(response);
  }
  
  /**
   * Parse strengths from response
   */
  private parseStrengths(response: string): string[] {
    return this.parseListItems(response);
  }
  
  /**
   * Generic list item parser
   */
  private parseListItems(response: string): string[] {
    const lines = response.split('\n');
    const items: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^[-•\d.)\]]\s*(.+)/);
      if (match && match[1].trim().length > 10) {
        items.push(match[1].trim());
      }
    }
    
    return items.length > 0 ? items : [response.substring(0, 200)];
  }
  
  /**
   * Calculate creative dimensions
   */
  private async calculateCreativeDimensions(
    prompt: string,
    response: string,
    differentPerspective: string,
    deepBreakdown: string,
    context?: any
  ): Promise<any> {
    // Analyze the creative insights to determine dimension scores
    const hasDepth = deepBreakdown.length > 200;
    const isCreative = differentPerspective.includes('unconventional') || 
                       differentPerspective.includes('interesting');
    
    return {
      accuracy: this.estimateScore(response, 'accurate'),
      completeness: this.estimateScore(response, 'complete'),
      clarity: this.estimateScore(response, 'clear'),
      relevance: this.estimateScore(response, 'relevant'),
      reasoning_quality: hasDepth ? 0.8 : 0.6,
      factual_correctness: this.estimateScore(response, 'factual'),
      coherence: this.estimateScore(response, 'coherent'),
      depth: hasDepth ? 0.85 : 0.6
    };
  }
  
  /**
   * Analyze reasoning creatively
   */
  private async analyzeReasoningCreatively(
    prompt: string,
    response: string,
    blindSpots: string[],
    deepBreakdown: string
  ): Promise<any> {
    return {
      logical_flow: blindSpots.length < 3 ? 0.8 : 0.6,
      evidence_quality: deepBreakdown.length > 300 ? 0.8 : 0.6,
      argument_strength: 0.75,
      critical_thinking: blindSpots.length > 0 ? 0.8 : 0.7
    };
  }
  
  /**
   * Analyze edge cases creatively
   */
  private async analyzeEdgeCasesCreatively(
    prompt: string,
    response: string,
    nonObviousIssues: string[],
    blindSpots: string[]
  ): Promise<any> {
    return {
      ambiguity_handling: nonObviousIssues.length < 2 ? 0.8 : 0.6,
      contradiction_detection: 0.75,
      context_sensitivity: blindSpots.length < 5 ? 0.8 : 0.6,
      domain_expertise: 0.7
    };
  }
  
  /**
   * Synthesize creative feedback
   */
  private synthesizeCreativeFeedback(
    differentPerspective: string,
    blindSpots: string[],
    deepBreakdown: string,
    opinionatedAdvice: string,
    hiddenQuestions: string[],
    additionalContext: string[]
  ): string {
    return `
## 🎨 Creative Evaluation

### Different Perspective
${differentPerspective}

### 🔍 Blind Spots Identified (${blindSpots.length})
${blindSpots.map((spot, i) => `${i + 1}. ${spot}`).join('\n')}

### 📊 Deep Breakdown
${deepBreakdown.substring(0, 500)}...

### 💡 Opinionated Advice
${opinionatedAdvice}

### ❓ Hidden Questions Being Asked (${hiddenQuestions.length})
${hiddenQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### ⚠️ Additional Context (${additionalContext.length})
${additionalContext.map((ctx, i) => `${i + 1}. ${ctx}`).join('\n')}
`.trim();
  }
  
  /**
   * Generate creative improvements
   */
  private generateCreativeImprovements(
    blindSpots: string[],
    nonObviousIssues: string[],
    opinionatedAdvice: string
  ): string[] {
    const improvements: string[] = [];
    
    // From blind spots
    blindSpots.slice(0, 3).forEach(spot => {
      improvements.push(`Address blind spot: ${spot.substring(0, 100)}`);
    });
    
    // From non-obvious issues
    nonObviousIssues.slice(0, 2).forEach(issue => {
      improvements.push(`Fix non-obvious issue: ${issue.substring(0, 100)}`);
    });
    
    // From opinionated advice
    if (opinionatedAdvice.includes('would') || opinionatedAdvice.includes('should')) {
      improvements.push(opinionatedAdvice.substring(0, 150));
    }
    
    return improvements;
  }
  
  /**
   * Calculate overall score with creative factors
   */
  private calculateOverallScore(
    dimensions: any,
    reasoningAnalysis: any,
    edgeCaseCoverage: any,
    blindSpotCount: number,
    unexpectedStrengthCount: number
  ): number {
    const avgDimension = (Object.values(dimensions) as number[]).reduce((a: number, b: number) => a + b, 0) / 
                         Object.keys(dimensions).length;
    const avgReasoning = (Object.values(reasoningAnalysis) as number[]).reduce((a: number, b: number) => a + b, 0) / 
                         Object.keys(reasoningAnalysis).length;
    const avgEdgeCase = (Object.values(edgeCaseCoverage) as number[]).reduce((a: number, b: number) => a + b, 0) / 
                        Object.keys(edgeCaseCoverage).length;
    
    let score = (avgDimension * 0.4 + avgReasoning * 0.3 + avgEdgeCase * 0.3);
    
    // Penalty for blind spots
    score -= Math.min(blindSpotCount * 0.02, 0.1);
    
    // Bonus for unexpected strengths
    score += Math.min(unexpectedStrengthCount * 0.02, 0.1);
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Calculate creative confidence
   */
  private calculateCreativeConfidence(
    differentPerspective: string,
    blindSpots: string[],
    deepBreakdown: string
  ): number {
    let confidence = 0.7; // Base
    
    if (differentPerspective.length > 200) confidence += 0.1;
    if (blindSpots.length > 3) confidence += 0.1;
    if (deepBreakdown.length > 300) confidence += 0.1;
    
    return Math.min(1, confidence);
  }
  
  /**
   * Simple score estimation helper
   */
  private estimateScore(text: string, criterion: string): number {
    const length = text.length;
    const hasKeywords = text.toLowerCase().includes(criterion);
    
    let score = 0.6;
    if (length > 500) score += 0.1;
    if (length > 1000) score += 0.1;
    if (hasKeywords) score += 0.1;
    
    return Math.min(1, score);
  }
  
  /**
   * Get evaluation history
   */
  getEvaluationHistory(): CreativeJudgeEvaluation[] {
    return this.evaluationHistory;
  }
}

/**
 * Create creative judge instance
 */
export function createCreativeJudge(config: JudgeConfig): CreativeJudgeSystem {
  return new CreativeJudgeSystem(config);
}

/**
 * Export convenience function
 */
export async function evaluateWithCreativePatterns(
  prompt: string,
  response: string,
  domain: string = 'general',
  context?: any
): Promise<CreativeJudgeEvaluation> {
  const judge = createCreativeJudge({
    domain,
    evaluation_type: 'reasoning_intensive',
    strictness: 'moderate',
    focus_areas: ['creativity', 'depth', 'practicality'],
    edge_cases: ['ambiguity', 'contradictions', 'assumptions']
  });
  
  return await judge.evaluateCreatively(prompt, response, context);
}

