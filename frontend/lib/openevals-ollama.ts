import { createLogger } from './walt/logger';

const logger = createLogger('OpenEvalsOllama');

export interface EvaluationResult {
  score: boolean | number;
  comment: string;
  metadata?: Record<string, any>;
}

export interface EvaluationInputs {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  referenceOutputs?: Record<string, any>;
}

export interface OllamaEvaluator {
  (params: EvaluationInputs): Promise<EvaluationResult>;
}

/**
 * Custom Ollama-based evaluator system for PERMUTATION
 * Adapted from OpenEvals to use local Ollama models instead of OpenAI
 */
export class OllamaEvaluationSystem {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'gemma3:4b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  /**
   * Create an LLM-as-a-Judge evaluator using Ollama
   */
  createOllamaJudge(prompt: string, feedbackKey?: string): OllamaEvaluator {
    return async (params: EvaluationInputs): Promise<EvaluationResult> => {
      try {
        const { inputs, outputs, referenceOutputs } = params;
        
        // Format the evaluation prompt
        const evaluationPrompt = this.formatEvaluationPrompt(
          prompt,
          inputs,
          outputs,
          referenceOutputs
        );

        // Call Ollama for evaluation
        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            prompt: evaluationPrompt,
            stream: false,
            options: {
              temperature: 0.1, // Low temperature for consistent evaluation
              num_predict: 1000,
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const evaluationText = data.response || '';

        // Parse the evaluation result
        const result = this.parseEvaluationResult(evaluationText);
        
        logger.info('Ollama evaluation completed', {
          feedbackKey,
          score: result.score,
          commentLength: result.comment.length
        });

        return result;

      } catch (error: any) {
        logger.error('Ollama evaluation failed', { error: error.message });
        return {
          score: false,
          comment: `Evaluation failed: ${error.message}`,
          metadata: { error: true }
        };
      }
    };
  }

  /**
   * Format the evaluation prompt with inputs, outputs, and reference
   */
  private formatEvaluationPrompt(
    prompt: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    referenceOutputs?: Record<string, any>
  ): string {
    let formattedPrompt = prompt;

    // Replace placeholders in the prompt
    if (formattedPrompt.includes('{inputs}')) {
      formattedPrompt = formattedPrompt.replace('{inputs}', JSON.stringify(inputs, null, 2));
    }
    if (formattedPrompt.includes('{outputs}')) {
      formattedPrompt = formattedPrompt.replace('{outputs}', JSON.stringify(outputs, null, 2));
    }
    if (formattedPrompt.includes('{reference_outputs}') && referenceOutputs) {
      formattedPrompt = formattedPrompt.replace('{reference_outputs}', JSON.stringify(referenceOutputs, null, 2));
    }

    return formattedPrompt;
  }

  /**
   * Parse the evaluation result from Ollama response
   */
  private parseEvaluationResult(evaluationText: string): EvaluationResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score !== undefined ? parsed.score : parsed.correct !== undefined ? parsed.correct : false,
          comment: parsed.comment || parsed.reasoning || parsed.explanation || evaluationText,
          metadata: parsed.metadata
        };
      }

      // Fallback: try to extract score from text
      const scoreMatch = evaluationText.match(/(?:score|correct|pass):\s*(true|false|\d+\.?\d*)/i);
      const score = scoreMatch ? 
        (scoreMatch[1] === 'true' ? true : scoreMatch[1] === 'false' ? false : parseFloat(scoreMatch[1])) : 
        false;

      return {
        score,
        comment: evaluationText,
        metadata: { parsed: false }
      };

    } catch (error: any) {
      logger.warn('Failed to parse evaluation result', { error: error.message });
      return {
        score: false,
        comment: evaluationText,
        metadata: { parseError: true }
      };
    }
  }
}

/**
 * Pre-built evaluation prompts adapted for PERMUTATION
 */
export const PERMUTATION_PROMPTS = {
  CORRECTNESS: `You are an expert evaluator. Your task is to determine if the given output is correct based on the input and reference output.

Input: {inputs}
Output: {outputs}
Reference Output: {reference_outputs}

Evaluate the correctness of the output. Consider:
1. Factual accuracy
2. Completeness of information
3. Logical consistency
4. Adherence to the task requirements

Respond with a JSON object containing:
- "score": true/false (whether the output is correct)
- "comment": detailed explanation of your evaluation
- "metadata": any additional relevant information

JSON Response:`,
  
  CONCISENESS: `You are an expert evaluator. Your task is to evaluate the conciseness of the given output.

Input: {inputs}
Output: {outputs}

Evaluate the conciseness of the output. Consider:
1. Brevity without losing important information
2. Clarity and directness
3. Avoidance of unnecessary repetition
4. Appropriate level of detail for the task

Respond with a JSON object containing:
- "score": number between 0-1 (1 being most concise)
- "comment": detailed explanation of your evaluation
- "metadata": any additional relevant information

JSON Response:`,
  
  RELEVANCE: `You are an expert evaluator. Your task is to evaluate the relevance of the given output to the input.

Input: {inputs}
Output: {outputs}

Evaluate the relevance of the output. Consider:
1. Direct addressing of the input question/task
2. Appropriate scope and focus
3. Avoidance of tangential information
4. Alignment with user intent

Respond with a JSON object containing:
- "score": number between 0-1 (1 being most relevant)
- "comment": detailed explanation of your evaluation
- "metadata": any additional relevant information

JSON Response:`,
  
  QUALITY: `You are an expert evaluator. Your task is to evaluate the overall quality of the given output.

Input: {inputs}
Output: {outputs}

Evaluate the overall quality of the output. Consider:
1. Accuracy and correctness
2. Clarity and coherence
3. Completeness
4. Professional presentation
5. Usefulness to the user

Respond with a JSON object containing:
- "score": number between 0-1 (1 being highest quality)
- "comment": detailed explanation of your evaluation
- "metadata": any additional relevant information

JSON Response:`,
  
  PERMUTATION_SPECIFIC: `You are an expert evaluator for the PERMUTATION AI research stack. Your task is to evaluate the quality of a PERMUTATION system output.

Input: {inputs}
Output: {outputs}

Evaluate the PERMUTATION output quality. Consider:
1. Integration of multiple AI components (GEPA, DSPy, Semiotic Framework, etc.)
2. Proper use of advanced techniques (Knowledge Distillation, RAG, etc.)
3. Coherence across the 14-layer pipeline
4. Technical accuracy and depth
5. Innovation and research value
6. Practical applicability

Respond with a JSON object containing:
- "score": number between 0-1 (1 being highest quality)
- "comment": detailed explanation of your evaluation
- "metadata": any additional relevant information

JSON Response:`
};

/**
 * Create evaluators for PERMUTATION system
 */
export function createPermutationEvaluators(): Record<string, OllamaEvaluator> {
  const evaluationSystem = new OllamaEvaluationSystem();
  
  return {
    correctness: evaluationSystem.createOllamaJudge(PERMUTATION_PROMPTS.CORRECTNESS, 'correctness'),
    conciseness: evaluationSystem.createOllamaJudge(PERMUTATION_PROMPTS.CONCISENESS, 'conciseness'),
    relevance: evaluationSystem.createOllamaJudge(PERMUTATION_PROMPTS.RELEVANCE, 'relevance'),
    quality: evaluationSystem.createOllamaJudge(PERMUTATION_PROMPTS.QUALITY, 'quality'),
    permutationSpecific: evaluationSystem.createOllamaJudge(PERMUTATION_PROMPTS.PERMUTATION_SPECIFIC, 'permutation_specific')
  };
}

/**
 * Run comprehensive evaluation on PERMUTATION output
 */
export async function evaluatePermutationOutput(
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  referenceOutputs?: Record<string, any>
): Promise<Record<string, EvaluationResult>> {
  const evaluators = createPermutationEvaluators();
  const results: Record<string, EvaluationResult> = {};

  logger.info('Starting comprehensive PERMUTATION evaluation', {
    inputKeys: Object.keys(inputs),
    outputKeys: Object.keys(outputs),
    hasReference: !!referenceOutputs
  });

  // Run all evaluators in parallel
  const evaluationPromises = Object.entries(evaluators).map(async ([name, evaluator]) => {
    try {
      const result = await evaluator({ inputs, outputs, referenceOutputs });
      results[name] = result;
      logger.info(`Evaluation completed: ${name}`, { score: result.score });
    } catch (error: any) {
      logger.error(`Evaluation failed: ${name}`, { error: error.message });
      results[name] = {
        score: false,
        comment: `Evaluation failed: ${error.message}`,
        metadata: { error: true }
      };
    }
  });

  await Promise.all(evaluationPromises);

  logger.info('Comprehensive evaluation completed', {
    totalEvaluators: Object.keys(evaluators).length,
    successfulEvaluations: Object.values(results).filter(r => !r.metadata?.error).length
  });

  return results;
}
