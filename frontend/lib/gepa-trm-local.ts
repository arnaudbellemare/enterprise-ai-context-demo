/**
 * GEPA + TRM Integration with Local Gemma3:4b
 *
 * Integrates GEPA prompt optimization with TRM (Tiny Recursive Model) verification
 * using local Ollama Gemma3:4b for cost-effective fallback.
 *
 * Flow:
 * 1. GEPA evolves prompts using teacher model (Perplexity)
 * 2. TRM verifies evolved prompts using student model (Ollama Gemma3:4b)
 * 3. Local fallback when teacher unavailable
 */

import { GEPAEngine, type GEPAConfig, type PromptIndividual } from './gepa-ax-integration';
import { createLogger } from './walt/logger';

const logger = createLogger('GEPA-TRM-Local', 'info');

// ============================================================================
// TRM Configuration
// ============================================================================

interface TRMConfig {
  maxRecursionDepth: number;
  confidenceThreshold: number;
  localModel: {
    provider: 'ollama';
    model: 'gemma3:4b';
    host: string;
  };
  teacherModel: {
    provider: 'perplexity';
    model: 'sonar-pro';
    apiKey: string;
  };
}

interface TRMVerificationResult {
  isValid: boolean;
  confidence: number;
  recursionDepth: number;
  verificationSteps: string[];
  cost: number;
  latency: number;
  modelUsed: 'teacher' | 'student';
}

// ============================================================================
// GEPA + TRM Integration
// ============================================================================

export class GEPATRMIntegration {
  private gepaEngine: GEPAEngine;
  private trmConfig: TRMConfig;

  constructor(gepaConfig: GEPAConfig, trmConfig: TRMConfig) {
    this.gepaEngine = new GEPAEngine(gepaConfig);
    this.trmConfig = trmConfig;

    logger.info('GEPA-TRM Integration initialized', {
      gepaModel: gepaConfig.llmConfig.model,
      trmTeacher: trmConfig.teacherModel.model,
      trmStudent: trmConfig.localModel.model
    });
  }

  /**
   * Optimize prompts with GEPA and verify with TRM
   */
  async optimizeAndVerify(initialPrompts: string[]): Promise<{
    optimizedPrompts: PromptIndividual[];
    verificationResults: Map<string, TRMVerificationResult>;
    recommendations: {
      bestVerified: PromptIndividual | null;
      costEfficient: PromptIndividual | null;
      localOnly: PromptIndividual | null;
    };
  }> {

    logger.info('Starting GEPA optimization + TRM verification');

    // Step 1: Run GEPA optimization
    logger.info('Running GEPA optimization...');
    const gepaResult = await this.gepaEngine.optimize(initialPrompts);

    logger.info('GEPA optimization complete', {
      paretoFrontierSize: gepaResult.paretoFrontier.length,
      generations: gepaResult.convergenceMetrics.generationsToConverge
    });

    // Step 2: Verify each Pareto-optimal prompt with TRM
    logger.info('Starting TRM verification...');
    const verificationResults = new Map<string, TRMVerificationResult>();

    for (const prompt of gepaResult.paretoFrontier) {
      const verification = await this.verifyPromptWithTRM(prompt);
      verificationResults.set(prompt.id, verification);

      logger.info('Prompt verified', {
        promptId: prompt.id.substring(0, 12),
        isValid: verification.isValid,
        confidence: verification.confidence.toFixed(3),
        modelUsed: verification.modelUsed
      });
    }

    // Step 3: Find best prompts by different criteria
    const recommendations = this.generateRecommendations(
      gepaResult.paretoFrontier,
      verificationResults
    );

    return {
      optimizedPrompts: gepaResult.paretoFrontier,
      verificationResults,
      recommendations
    };
  }

  /**
   * Verify a prompt using TRM (Tiny Recursive Model)
   *
   * Flow:
   * 1. Try teacher model (Perplexity) for high-accuracy verification
   * 2. Fallback to student model (Ollama Gemma3:4b) if teacher unavailable
   * 3. Use recursive verification with confidence thresholds
   */
  private async verifyPromptWithTRM(prompt: PromptIndividual): Promise<TRMVerificationResult> {
    const startTime = Date.now();
    let modelUsed: 'teacher' | 'student' = 'teacher';
    let totalCost = 0;

    // Test cases for verification
    const testCases = [
      { input: 'What is 2+2?', expected: '4' },
      { input: 'Explain recursion briefly', expected: 'recursion' },
      { input: 'Write hello in Python', expected: 'print' }
    ];

    const verificationSteps: string[] = [];
    let recursionDepth = 0;
    let isValid = true;
    let totalConfidence = 0;

    // Recursive verification loop
    for (let depth = 0; depth < this.trmConfig.maxRecursionDepth; depth++) {
      recursionDepth++;
      verificationSteps.push(`Recursion depth ${depth + 1}`);

      // Try teacher model first
      let responses: string[];
      try {
        responses = await this.callTeacherModel(prompt, testCases);
        modelUsed = 'teacher';
        totalCost += 0.01; // Perplexity cost estimate
        verificationSteps.push('Used teacher model (Perplexity)');
      } catch (error) {
        // Fallback to student model (local Ollama)
        logger.warn('Teacher model unavailable, using local student model', {
          error: error instanceof Error ? error.message : String(error)
        });

        responses = await this.callStudentModel(prompt, testCases);
        modelUsed = 'student';
        totalCost += 0.0001; // Ollama local cost (minimal)
        verificationSteps.push('Fallback to student model (Ollama Gemma3:4b)');
      }

      // Evaluate responses
      const correctCount = responses.filter((response, idx) => {
        const expected = testCases[idx].expected.toLowerCase();
        return response.toLowerCase().includes(expected);
      }).length;

      const confidence = correctCount / testCases.length;
      totalConfidence += confidence;

      verificationSteps.push(`Confidence at depth ${depth + 1}: ${(confidence * 100).toFixed(1)}%`);

      // Check if confidence threshold met
      if (confidence >= this.trmConfig.confidenceThreshold) {
        verificationSteps.push(`Confidence threshold met (${(confidence * 100).toFixed(1)}% >= ${(this.trmConfig.confidenceThreshold * 100).toFixed(1)}%)`);
        break;
      }

      // If confidence is very low, mark as invalid
      if (confidence < 0.5 && depth > 0) {
        isValid = false;
        verificationSteps.push('Low confidence detected, marking as invalid');
        break;
      }
    }

    const avgConfidence = totalConfidence / recursionDepth;
    const latency = Date.now() - startTime;

    return {
      isValid: isValid && avgConfidence >= this.trmConfig.confidenceThreshold,
      confidence: avgConfidence,
      recursionDepth,
      verificationSteps,
      cost: totalCost,
      latency,
      modelUsed
    };
  }

  /**
   * Call teacher model (Perplexity Sonar Pro)
   */
  private async callTeacherModel(
    prompt: PromptIndividual,
    testCases: Array<{ input: string; expected: string }>
  ): Promise<string[]> {

    const responses: string[] = [];

    for (const testCase of testCases) {
      const fullPrompt = prompt.prompt.replace('{input}', testCase.input);

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.trmConfig.teacherModel.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: 200,
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Teacher model error: ${response.status}`);
      }

      const data = await response.json();
      responses.push(data.choices[0].message.content);
    }

    return responses;
  }

  /**
   * Call student model (Ollama Gemma3:4b) - Local fallback
   */
  private async callStudentModel(
    prompt: PromptIndividual,
    testCases: Array<{ input: string; expected: string }>
  ): Promise<string[]> {

    const ollamaHost = this.trmConfig.localModel.host || 'http://localhost:11434';
    const responses: string[] = [];

    for (const testCase of testCases) {
      const fullPrompt = prompt.prompt.replace('{input}', testCase.input);

      try {
        const response = await fetch(`${ollamaHost}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma3:4b',
            prompt: fullPrompt,
            stream: false,
            options: {
              temperature: 0.1,
              num_predict: 200
            }
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          throw new Error(`Student model error: ${response.status}`);
        }

        const data = await response.json();
        responses.push(data.response || '');

      } catch (error) {
        logger.error('Student model call failed', {
          error: error instanceof Error ? error.message : String(error),
          host: ollamaHost
        });

        // Return empty response on failure
        responses.push('');
      }
    }

    return responses;
  }

  /**
   * Generate recommendations based on verification results
   */
  private generateRecommendations(
    prompts: PromptIndividual[],
    verifications: Map<string, TRMVerificationResult>
  ): {
    bestVerified: PromptIndividual | null;
    costEfficient: PromptIndividual | null;
    localOnly: PromptIndividual | null;
  } {

    // Best verified: Highest confidence among valid prompts
    let bestVerified: PromptIndividual | null = null;
    let maxConfidence = 0;

    for (const prompt of prompts) {
      const verification = verifications.get(prompt.id);
      if (verification && verification.isValid && verification.confidence > maxConfidence) {
        maxConfidence = verification.confidence;
        bestVerified = prompt;
      }
    }

    // Cost efficient: Lowest total cost (GEPA + TRM) with valid verification
    let costEfficient: PromptIndividual | null = null;
    let minCost = Infinity;

    for (const prompt of prompts) {
      const verification = verifications.get(prompt.id);
      if (verification && verification.isValid) {
        const totalCost = prompt.fitness.cost + verification.cost;
        if (totalCost < minCost) {
          minCost = totalCost;
          costEfficient = prompt;
        }
      }
    }

    // Local only: Prompts verified using only student model (Ollama)
    let localOnly: PromptIndividual | null = null;
    let maxLocalConfidence = 0;

    for (const prompt of prompts) {
      const verification = verifications.get(prompt.id);
      if (verification && verification.isValid && verification.modelUsed === 'student') {
        if (verification.confidence > maxLocalConfidence) {
          maxLocalConfidence = verification.confidence;
          localOnly = prompt;
        }
      }
    }

    return {
      bestVerified,
      costEfficient,
      localOnly
    };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

export async function runGEPATRMOptimization() {
  const gepaConfig: GEPAConfig = {
    populationSize: 10,
    maxGenerations: 3,
    mutationRate: 0.3,
    crossoverRate: 0.7,
    elitismCount: 2,

    llmConfig: {
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY || '',
      temperature: 0.7,
      maxTokens: 2000
    },

    objectives: {
      maximize: ['quality', 'token_efficiency'],
      minimize: ['cost', 'latency']
    },

    evaluationBenchmarks: [
      {
        name: 'math',
        domain: 'Mathematical Reasoning',
        testCases: [
          { input: 'What is 15% of 80?', expected: '12' },
          { input: 'Solve for x: 2x + 5 = 15', expected: 'x = 5' }
        ],
        evaluator: (response, expected) => {
          return response.toLowerCase().includes(expected.toLowerCase()) ? 1.0 : 0.0;
        }
      }
    ]
  };

  const trmConfig: TRMConfig = {
    maxRecursionDepth: 3,
    confidenceThreshold: 0.8,
    localModel: {
      provider: 'ollama',
      model: 'gemma3:4b',
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    },
    teacherModel: {
      provider: 'perplexity',
      model: 'sonar-pro',
      apiKey: process.env.PERPLEXITY_API_KEY || ''
    }
  };

  const integration = new GEPATRMIntegration(gepaConfig, trmConfig);

  const initialPrompts = [
    'Answer the following question: {input}',
    'Let\'s solve this step by step:\n{input}',
    'Question: {input}\n\nAnswer:'
  ];

  const result = await integration.optimizeAndVerify(initialPrompts);

  console.log('\n🎯 GEPA + TRM Optimization Results\n');
  console.log(`Optimized prompts: ${result.optimizedPrompts.length}`);
  console.log(`Verified prompts: ${Array.from(result.verificationResults.values()).filter(v => v.isValid).length}\n`);

  if (result.recommendations.bestVerified) {
    console.log('🏆 Best Verified Prompt:');
    const verification = result.verificationResults.get(result.recommendations.bestVerified.id)!;
    console.log(`   Confidence: ${(verification.confidence * 100).toFixed(1)}%`);
    console.log(`   Model: ${verification.modelUsed === 'teacher' ? 'Perplexity Sonar Pro' : 'Ollama Gemma3:4b'}`);
    console.log(`   Cost: $${verification.cost.toFixed(4)}`);
    console.log(`   Prompt: "${result.recommendations.bestVerified.prompt.substring(0, 80)}..."\n`);
  }

  if (result.recommendations.localOnly) {
    console.log('🏠 Local-Only Verified Prompt (Ollama Gemma3:4b):');
    const verification = result.verificationResults.get(result.recommendations.localOnly.id)!;
    console.log(`   Confidence: ${(verification.confidence * 100).toFixed(1)}%`);
    console.log(`   Cost: $${verification.cost.toFixed(6)} (nearly free!)`);
    console.log(`   Prompt: "${result.recommendations.localOnly.prompt.substring(0, 80)}..."\n`);
  }

  return result;
}
