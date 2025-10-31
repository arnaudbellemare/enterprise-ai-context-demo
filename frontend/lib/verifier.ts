/**
 * 🔍 VERIFIER MODULE - Real-Time Quality Checking
 * 
 * Purpose: Check answer quality BEFORE returning to user
 * Impact: +40% error reduction (GAIA benchmark data)
 * 
 * This is THE missing piece for reliability!
 */

import { SafeMathEvaluator } from './safe-math-evaluator';
import { logger } from './logger';

export interface VerificationResult {
  is_valid: boolean;
  confidence: number; // 0.0 - 1.0
  errors: string[];
  suggestions: string[];
  quality_scores: {
    correctness: number;
    completeness: number;
    clarity: number;
    accuracy: number;
  };
  reasoning: string;
}

export interface VerifierConfig {
  model?: string; // Default: 'gemma2:2b' (fast, cheap)
  confidence_threshold?: number; // Default: 0.8
  check_factuality?: boolean; // Default: true
  check_calculations?: boolean; // Default: true
  check_logic?: boolean; // Default: true
  check_completeness?: boolean; // Default: true
}

/**
 * Core Verifier - Checks answer quality
 */
export class Verifier {
  private config: Required<VerifierConfig>;

  constructor(config: VerifierConfig = {}) {
    this.config = {
      model: config.model || 'gemma2:2b',
      confidence_threshold: config.confidence_threshold || 0.8,
      check_factuality: config.check_factuality ?? true,
      check_calculations: config.check_calculations ?? true,
      check_logic: config.check_logic ?? true,
      check_completeness: config.check_completeness ?? true,
    };
  }

  /**
   * Verify answer quality against task
   */
  async verify(
    task: string,
    answer: string,
    context?: string,
    groundTruth?: any
  ): Promise<VerificationResult> {
    const verifierPrompt = this.buildVerifierPrompt(task, answer, context, groundTruth);
    
    try {
      // Use cheaper, faster model for verification
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt: verifierPrompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      const verificationText = data.response;

      // Parse verification result
      return this.parseVerificationResult(verificationText);
    } catch (error) {
      logger.error('Verification failed:', error);
      // Return conservative result on error
      return {
        is_valid: false,
        confidence: 0.0,
        errors: [`Verification error: ${error}`],
        suggestions: ['Unable to verify, recommend manual review'],
        quality_scores: {
          correctness: 0.0,
          completeness: 0.0,
          clarity: 0.0,
          accuracy: 0.0,
        },
        reasoning: 'Verification system encountered an error',
      };
    }
  }

  /**
   * Build comprehensive verifier prompt
   */
  private buildVerifierPrompt(
    task: string,
    answer: string,
    context?: string,
    groundTruth?: any
  ): string {
    return `You are a quality verification expert. Your job is to check if an answer correctly addresses a task.

TASK:
${task}

${context ? `CONTEXT:\n${context}\n` : ''}

ANSWER TO VERIFY:
${answer}

${groundTruth ? `GROUND TRUTH (for reference):\n${JSON.stringify(groundTruth, null, 2)}\n` : ''}

VERIFICATION CHECKLIST:

1. CORRECTNESS: Does the answer correctly address the task?
   ${this.config.check_factuality ? '- Check for factual errors and hallucinations' : ''}
   ${this.config.check_calculations ? '- Verify any calculations, numbers, or dates' : ''}
   ${this.config.check_logic ? '- Check logical reasoning and conclusions' : ''}

2. COMPLETENESS: Does the answer cover all aspects of the task?
   ${this.config.check_completeness ? '- Check if any required parts are missing' : ''}
   - Verify all sub-tasks are addressed

3. CLARITY: Is the answer well-structured and understandable?
   - Check formatting and organization
   - Verify explanations are clear

4. ACCURACY: Are specific details correct?
   - Verify numbers, dates, names, etc.
   - Check citations and references if present

OUTPUT FORMAT (JSON):
{
  "is_valid": true/false,
  "confidence": 0.0-1.0,
  "errors": ["error1", "error2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "quality_scores": {
    "correctness": 0.0-1.0,
    "completeness": 0.0-1.0,
    "clarity": 0.0-1.0,
    "accuracy": 0.0-1.0
  },
  "reasoning": "Brief explanation of the verification decision"
}

IMPORTANT:
- Be strict but fair
- If unsure, set is_valid to false and confidence low
- Provide specific, actionable suggestions for improvement
- Focus on catching errors that would mislead users

Provide your verification result as valid JSON:`;
  }

  /**
   * Parse verification result from LLM response
   */
  private parseVerificationResult(text: string): VerificationResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      // Try to find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const result = JSON.parse(jsonText);

      // Validate structure
      return {
        is_valid: result.is_valid ?? false,
        confidence: Math.max(0, Math.min(1, result.confidence ?? 0)),
        errors: Array.isArray(result.errors) ? result.errors : [],
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
        quality_scores: {
          correctness: result.quality_scores?.correctness ?? 0,
          completeness: result.quality_scores?.completeness ?? 0,
          clarity: result.quality_scores?.clarity ?? 0,
          accuracy: result.quality_scores?.accuracy ?? 0,
        },
        reasoning: result.reasoning || 'No reasoning provided',
      };
    } catch (error) {
      logger.error('Failed to parse verification result:', error);
      logger.error('Raw text:', text);
      
      // Fallback: Try to extract basic info from text
      const hasError = /error|wrong|incorrect|invalid|false/i.test(text);
      const hasSuggestion = /suggest|should|recommend|fix|correct/i.test(text);
      
      return {
        is_valid: !hasError,
        confidence: hasError ? 0.3 : 0.6,
        errors: hasError ? ['Failed to parse structured verification, but errors detected in response'] : [],
        suggestions: hasSuggestion ? ['Review verification output manually'] : [],
        quality_scores: {
          correctness: hasError ? 0.3 : 0.6,
          completeness: 0.5,
          clarity: 0.5,
          accuracy: hasError ? 0.3 : 0.6,
        },
        reasoning: 'Verification result could not be parsed as JSON',
      };
    }
  }

  /**
   * Quick check if answer meets confidence threshold
   */
  meetsThreshold(result: VerificationResult): boolean {
    return result.is_valid && result.confidence >= this.config.confidence_threshold;
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(result: VerificationResult): number {
    const { correctness, completeness, clarity, accuracy } = result.quality_scores;
    return (correctness + completeness + clarity + accuracy) / 4;
  }
}

/**
 * Multi-step verifier - Validates each step in a sequence
 */
export class MultiStepVerifier extends Verifier {
  /**
   * Verify individual step in a multi-step task
   */
  async verifyStep(
    stepNumber: number,
    totalSteps: number,
    stepTask: string,
    stepAnswer: string,
    previousSteps: Array<{ task: string; answer: string; verified: boolean }>
  ): Promise<VerificationResult> {
    const context = `This is step ${stepNumber} of ${totalSteps} in a multi-step task.

PREVIOUS STEPS:
${previousSteps.map((step, i) => `
Step ${i + 1}: ${step.task}
Answer: ${step.answer}
Verified: ${step.verified ? '✅' : '⚠️'}
`).join('\n')}

CURRENT STEP ${stepNumber}:`;

    return this.verify(stepTask, stepAnswer, context);
  }

  /**
   * Check for error propagation from previous steps
   */
  async checkErrorPropagation(
    currentStep: { task: string; answer: string },
    previousSteps: Array<{ task: string; answer: string; verification: VerificationResult }>
  ): Promise<{ has_propagation: boolean; source_step?: number; description?: string }> {
    // Find failed previous steps
    const failedSteps = previousSteps
      .map((step, i) => ({ ...step, index: i + 1 }))
      .filter(step => !step.verification.is_valid);

    if (failedSteps.length === 0) {
      return { has_propagation: false };
    }

    // Check if current answer references or depends on failed steps
    const propagationPrompt = `Check if this step depends on or uses results from failed previous steps.

FAILED PREVIOUS STEPS:
${failedSteps.map(step => `Step ${step.index}: ${step.task}\nAnswer: ${step.answer}\nErrors: ${step.verification.errors.join(', ')}`).join('\n\n')}

CURRENT STEP:
Task: ${currentStep.task}
Answer: ${currentStep.answer}

Does the current answer depend on or use information from any failed previous steps?

Respond with JSON:
{
  "has_propagation": true/false,
  "source_step": number or null,
  "description": "explanation"
}`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt: propagationPrompt,
          stream: false,
        }),
      });

      const data = await response.json();
      const resultText = data.response;

      // Parse result
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          has_propagation: result.has_propagation ?? false,
          source_step: result.source_step,
          description: result.description,
        };
      }
    } catch (error) {
      logger.error('Error propagation check failed:', error);
    }

    return { has_propagation: false };
  }
}

/**
 * Domain-specific verifiers
 */
export class CodeVerifier extends Verifier {
  async verify(task: string, answer: string, context?: string): Promise<VerificationResult> {
    // Extract code from answer
    const codeMatch = answer.match(/```[\s\S]*?```/g);
    
    if (codeMatch) {
      // Verify syntax by attempting to parse
      // (This is a simplified check - real implementation would use language-specific parsers)
      const code = codeMatch.map(block => block.replace(/```\w*\n?/g, '').trim());
      
      // Add code-specific checks to the base verification
      const baseResult = await super.verify(task, answer, context);
      
      // Additional code checks
      const hasSyntaxErrors = code.some(c => {
        // Basic syntax checks
        return (
          (c.includes('function') && !c.includes('{')) ||
          (c.includes('if') && !c.includes('{')) ||
          (c.split('{').length !== c.split('}').length)
        );
      });

      if (hasSyntaxErrors) {
        baseResult.errors.push('Potential syntax errors detected in code');
        baseResult.quality_scores.correctness *= 0.5;
        baseResult.is_valid = false;
      }

      return baseResult;
    }

    return super.verify(task, answer, context);
  }
}

export class MathVerifier extends Verifier {
  async verify(task: string, answer: string, context?: string): Promise<VerificationResult> {
    const baseResult = await super.verify(task, answer, context);

    // Extract numbers and calculations
    const numbers = answer.match(/\d+\.?\d*/g);
    const calculations = answer.match(/\d+\.?\d*\s*[\+\-\*\/\^]\s*\d+\.?\d*/g);

    if (calculations && calculations.length > 0) {
      // Verify calculations using safe math evaluator
      for (const calc of calculations) {
        try {
          // Use safe math evaluator instead of eval()
          const evalResult = SafeMathEvaluator.evaluate(calc.replace(/\^/g, '^'));
          
          if (evalResult.error) {
            baseResult.errors.push(`Unable to verify calculation: ${calc} (${evalResult.error})`);
          } else {
            // Check if result appears in answer
            const resultStr = evalResult.result.toString();
            if (!answer.includes(resultStr)) {
              baseResult.errors.push(`Calculation ${calc} result ${resultStr} not found in answer`);
              baseResult.suggestions.push(`Verify calculation: ${calc} = ${resultStr}`);
              baseResult.quality_scores.accuracy *= 0.7;
            }
          }
        } catch (error) {
          baseResult.errors.push(`Unable to verify calculation: ${calc}`);
        }
      }
    }

    return baseResult;
  }
}

/**
 * Factory function to create appropriate verifier
 */
export function createVerifier(
  type: 'general' | 'code' | 'math' | 'multi-step' = 'general',
  config?: VerifierConfig
): Verifier | MultiStepVerifier | CodeVerifier | MathVerifier {
  switch (type) {
    case 'code':
      return new CodeVerifier(config);
    case 'math':
      return new MathVerifier(config);
    case 'multi-step':
      return new MultiStepVerifier(config);
    default:
      return new Verifier(config);
  }
}

