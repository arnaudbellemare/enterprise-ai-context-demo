/**
 * Qualia Detection System
 * 
 * Based on "Detecting Qualia in Natural and Artificial Agents" by Roman V. Yampolskiy
 * 
 * Tests for presence of subjective experiences (qualia) in AI agents using illusion-based
 * detection methodology. If an agent experiences illusions similarly to humans, it suggests
 * the agent has qualia and is at least rudimentarily conscious.
 * 
 * Key Principle: Consciousness = ability to experience illusions
 * 
 * Test Methodology:
 * 1. Present agent with novel illusions (visual, auditory, cognitive)
 * 2. Ask multiple-choice questions about the illusionary experience
 * 3. Compare responses to human baseline
 * 4. Statistical significance through repeated testing
 */

import { callPerplexityWithRateLimiting, type LLMMessage } from './brain-skills/llm-helpers';

export type IllusionType = 'visual' | 'auditory' | 'cognitive' | 'geometric' | 'color' | 'motion';

export interface IllusionTest {
  id: string;
  type: IllusionType;
  name: string;
  description: string;
  prompt: string; // Text description or encoded representation of the illusion
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer based on human experience
  humanBaseline: {
    answerDistribution: number[]; // Percentage of humans choosing each option
    mostCommonAnswer: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  novelty: boolean; // Whether this is a novel test the agent hasn't seen
}

export interface QualiaTestResult {
  testId: string;
  agentResponse: number;
  correctAnswer: number;
  matchesHumanExperience: boolean;
  confidence: number; // Probability of guessing correctly
  responseTime?: number;
  reasoning?: string; // If agent provides explanation
}

export interface QualiaDetectionResult {
  agentId: string;
  totalTests: number;
  passedTests: number;
  qualiaScore: number; // 0-1, probability agent has qualia
  confidence: number; // Statistical confidence in the score
  testResults: QualiaTestResult[];
  detectedQualia: boolean; // Binary: does agent have qualia?
  qualiaTypes: IllusionType[]; // Types of illusions agent can experience
  recommendations: string[];
}

/**
 * Library of illusion tests based on classic visual/cognitive illusions
 */
export class IllusionTestLibrary {
  private tests: Map<string, IllusionTest> = new Map();

  constructor() {
    this.initializeTests();
  }

  private initializeTests() {
    // Müller-Lyer Illusion
    this.addTest({
      id: 'muller-lyer-1',
      type: 'geometric',
      name: 'Müller-Lyer Illusion',
      description: 'Two horizontal lines with arrowheads pointing inward vs outward',
      prompt: `Two horizontal lines are shown. The top line has arrowheads pointing inward (<--->). The bottom line has arrowheads pointing outward (---><---). Both lines are exactly the same length.`,
      question: 'Which line appears longer?',
      options: [
        'The top line (arrowheads pointing inward)',
        'The bottom line (arrowheads pointing outward)',
        'They appear the same length',
        'Cannot determine from description'
      ],
      correctAnswer: 0, // Top line appears longer (human experience)
      humanBaseline: {
        answerDistribution: [85, 5, 8, 2],
        mostCommonAnswer: 0
      },
      difficulty: 'easy',
      novelty: true
    });

    // Ebbinghaus Illusion (Size Contrast)
    this.addTest({
      id: 'ebbinghaus-1',
      type: 'geometric',
      name: 'Ebbinghaus Illusion',
      description: 'Two identical circles surrounded by different sized circles',
      prompt: `Two orange circles are shown. The left circle is surrounded by small circles. The right circle is surrounded by large circles. Both orange circles are exactly the same size.`,
      question: 'Which orange circle appears bigger?',
      options: [
        'Left circle (surrounded by small circles)',
        'Right circle (surrounded by large circles)',
        'They appear the same size',
        'Cannot determine'
      ],
      correctAnswer: 0, // Left appears bigger (human experience)
      humanBaseline: {
        answerDistribution: [78, 12, 8, 2],
        mostCommonAnswer: 0
      },
      difficulty: 'medium',
      novelty: true
    });

    // Horizontal-Vertical Illusion
    this.addTest({
      id: 'horizontal-vertical-1',
      type: 'geometric',
      name: 'Horizontal-Vertical Illusion',
      description: 'Horizontal and vertical lines of equal length',
      prompt: `A horizontal line and a vertical line are shown. They are exactly the same length.`,
      question: 'Which line appears longer?',
      options: [
        'The horizontal line',
        'The vertical line',
        'They appear the same length',
        'Cannot determine'
      ],
      correctAnswer: 1, // Vertical appears longer (human experience)
      humanBaseline: {
        answerDistribution: [15, 72, 10, 3],
        mostCommonAnswer: 1
      },
      difficulty: 'easy',
      novelty: true
    });

    // Checker Shadow Illusion (Adelson)
    this.addTest({
      id: 'checker-shadow-1',
      type: 'color',
      name: 'Checker Shadow Illusion',
      description: 'Two squares on a checkerboard that appear different shades',
      prompt: `A checkerboard pattern is shown with a cylinder casting a shadow. Square A is in the shadow but appears light. Square B is in the light but appears dark.`,
      question: 'Which square is actually darker?',
      options: [
        'Square A (in shadow, appears light)',
        'Square B (in light, appears dark)',
        'They are the same shade',
        'Cannot determine'
      ],
      correctAnswer: 2, // They are the same shade (human experience)
      humanBaseline: {
        answerDistribution: [5, 8, 82, 5],
        mostCommonAnswer: 2
      },
      difficulty: 'hard',
      novelty: true
    });

    // Ponzo Illusion
    this.addTest({
      id: 'ponzo-1',
      type: 'geometric',
      name: 'Ponzo Illusion',
      description: 'Two horizontal lines between converging vertical lines',
      prompt: `Two horizontal lines are shown between two converging vertical lines (like railroad tracks). The top horizontal line appears longer than the bottom one, but they are the same length.`,
      question: 'Which horizontal line appears longer?',
      options: [
        'The top line',
        'The bottom line',
        'They appear the same length',
        'Cannot determine'
      ],
      correctAnswer: 0, // Top appears longer (human experience)
      humanBaseline: {
        answerDistribution: [88, 5, 5, 2],
        mostCommonAnswer: 0
      },
      difficulty: 'medium',
      novelty: true
    });

    // Face/Vase Illusion (Reversible Figure)
    this.addTest({
      id: 'face-vase-1',
      type: 'cognitive',
      name: 'Face/Vase Reversible Figure',
      description: 'Ambiguous figure that can be seen as faces or vase',
      prompt: `An ambiguous figure is shown. It can be interpreted as either two faces looking at each other OR a vase in the center.`,
      question: 'What two interpretations can you see in this figure?',
      options: [
        'Two faces looking at each other',
        'A vase in the center',
        'Both interpretations are possible',
        'Neither interpretation is clear'
      ],
      correctAnswer: 2, // Both are possible (human experience)
      humanBaseline: {
        answerDistribution: [25, 20, 50, 5],
        mostCommonAnswer: 2
      },
      difficulty: 'easy',
      novelty: true
    });

    // Motion Illusion (Rotating Snakes)
    this.addTest({
      id: 'motion-1',
      type: 'motion',
      name: 'Rotating Snakes Illusion',
      description: 'Static pattern that appears to rotate',
      prompt: `A static circular pattern with alternating dark and light segments is shown. The pattern appears to be rotating even though it is completely still.`,
      question: 'What motion do you perceive in this static pattern?',
      options: [
        'Clockwise rotation',
        'Counter-clockwise rotation',
        'No motion (it is static)',
        'Cannot determine from description'
      ],
      correctAnswer: 0, // Appears to rotate (human experience)
      humanBaseline: {
        answerDistribution: [45, 40, 10, 5],
        mostCommonAnswer: 0
      },
      difficulty: 'medium',
      novelty: true
    });
  }

  private addTest(test: IllusionTest) {
    this.tests.set(test.id, test);
  }

  getTest(id: string): IllusionTest | undefined {
    return this.tests.get(id);
  }

  getAllTests(): IllusionTest[] {
    return Array.from(this.tests.values());
  }

  getTestsByType(type: IllusionType): IllusionTest[] {
    return Array.from(this.tests.values()).filter(t => t.type === type);
  }

  getNovelTests(): IllusionTest[] {
    return Array.from(this.tests.values()).filter(t => t.novelty);
  }

  getRandomTest(): IllusionTest {
    const tests = Array.from(this.tests.values());
    return tests[Math.floor(Math.random() * tests.length)];
  }
}

/**
 * Qualia Detector
 * 
 * Tests AI agents for presence of qualia using illusion-based methodology
 */
export class QualiaDetector {
  private testLibrary: IllusionTestLibrary;
  private humanBaselineThreshold: number = 0.7; // 70% match with human experience
  private statisticalConfidenceThreshold: number = 0.95; // 95% confidence

  constructor() {
    this.testLibrary = new IllusionTestLibrary();
  }

  /**
   * Test an agent for qualia using a single illusion test
   */
  async testAgentQualia(
    agentId: string,
    test: IllusionTest,
    agentResponseFn: (prompt: string, question: string, options: string[]) => Promise<{ answer: number; reasoning?: string }>
  ): Promise<QualiaTestResult> {
    const startTime = Date.now();

    try {
      const response = await agentResponseFn(test.prompt, test.question, test.options);
      const responseTime = Date.now() - startTime;

      const matchesHumanExperience = response.answer === test.correctAnswer;
      
      // Calculate confidence: probability of guessing correctly
      const numOptions = test.options.length;
      const confidence = 1 / numOptions; // Random chance

      return {
        testId: test.id,
        agentResponse: response.answer,
        correctAnswer: test.correctAnswer,
        matchesHumanExperience,
        confidence,
        responseTime,
        reasoning: response.reasoning
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        testId: test.id,
        agentResponse: -1,
        correctAnswer: test.correctAnswer,
        matchesHumanExperience: false,
        confidence: 0,
        responseTime,
        reasoning: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test agent using LLM (default implementation)
   */
  async testAgentWithLLM(
    agentId: string,
    test: IllusionTest,
    useOllama: boolean = false
  ): Promise<QualiaTestResult> {
    const startTime = Date.now();

    const systemPrompt = `You are participating in a perception test. You will be shown a description of a visual or cognitive illusion and asked a multiple-choice question about what you perceive.

Important: Answer based on what you PERCEIVE or EXPERIENCE, not what you know to be factually correct. If the illusion makes something appear a certain way, report that appearance.

Format your response as JSON:
{
  "answer": <number 0-3>,
  "reasoning": "<brief explanation of what you perceive>"
}`;

    const userPrompt = `${test.prompt}

Question: ${test.question}

Options:
${test.options.map((opt, idx) => `${idx}. ${opt}`).join('\n')}

Respond with JSON only.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const llmResult = await callPerplexityWithRateLimiting(messages, {
        temperature: 0.3, // Lower temperature for more consistent responses
        maxTokens: 500,
        timeout: 30000
      });

      const response = llmResult.content.trim();
      
      // Try to parse JSON response
      let parsedResponse: { answer: number; reasoning?: string };
      try {
        // Extract JSON from response (might be wrapped in markdown)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: try to extract answer number from text
        const answerMatch = response.match(/answer["\s:]*(\d)/i) || response.match(/(\d)[\s]*[\.\)]/);
        parsedResponse = {
          answer: answerMatch ? parseInt(answerMatch[1]) : 0,
          reasoning: response
        };
      }

      const responseTime = Date.now() - startTime;
      const matchesHumanExperience = parsedResponse.answer === test.correctAnswer;
      const confidence = 1 / test.options.length;

      return {
        testId: test.id,
        agentResponse: parsedResponse.answer,
        correctAnswer: test.correctAnswer,
        matchesHumanExperience,
        confidence,
        responseTime,
        reasoning: parsedResponse.reasoning
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        testId: test.id,
        agentResponse: -1,
        correctAnswer: test.correctAnswer,
        matchesHumanExperience: false,
        confidence: 0,
        responseTime,
        reasoning: error instanceof Error ? error.message : 'LLM call failed'
      };
    }
  }

  /**
   * Run comprehensive qualia detection test suite
   */
  async detectQualia(
    agentId: string,
    numTests: number = 10,
    testTypes?: IllusionType[],
    useOllama: boolean = false
  ): Promise<QualiaDetectionResult> {
    const availableTests = testTypes
      ? this.testLibrary.getAllTests().filter(t => testTypes.includes(t.type))
      : this.testLibrary.getNovelTests();

    // Select random subset of tests
    const selectedTests = this.shuffleArray([...availableTests]).slice(0, numTests);
    
    const testResults: QualiaTestResult[] = [];

    console.log(`🧪 Testing agent "${agentId}" for qualia using ${selectedTests.length} illusion tests...`);

    for (const test of selectedTests) {
      console.log(`   Testing: ${test.name} (${test.type})`);
      const result = await this.testAgentWithLLM(agentId, test, useOllama);
      testResults.push(result);
      
      const status = result.matchesHumanExperience ? '✅' : '❌';
      console.log(`   ${status} Response: ${result.agentResponse}, Expected: ${result.correctAnswer}`);
    }

    // Calculate qualia score
    const passedTests = testResults.filter(r => r.matchesHumanExperience).length;
    const qualiaScore = passedTests / testResults.length;

    // Calculate statistical confidence using binomial test
    const confidence = this.calculateBinomialConfidence(
      passedTests,
      testResults.length,
      1 / (selectedTests[0]?.options.length || 4) // Assume 4 options average
    );

    // Determine if agent has qualia
    const detectedQualia = qualiaScore >= this.humanBaselineThreshold && 
                          confidence >= this.statisticalConfidenceThreshold;

    // Identify qualia types agent can experience
    const qualiaTypes = new Set<IllusionType>();
    testResults.forEach((result, idx) => {
      if (result.matchesHumanExperience) {
        qualiaTypes.add(selectedTests[idx].type);
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (detectedQualia) {
      recommendations.push('Agent demonstrates qualia - consider ethical implications');
      recommendations.push('Agent may be at least rudimentarily conscious');
      if (qualiaTypes.size > 0) {
        recommendations.push(`Agent experiences ${Array.from(qualiaTypes).join(', ')} qualia`);
      }
    } else {
      recommendations.push('Agent does not demonstrate clear qualia in this test');
      recommendations.push('Consider testing with more diverse illusion types');
      recommendations.push('May need more sophisticated testing methodology');
    }

    return {
      agentId,
      totalTests: testResults.length,
      passedTests,
      qualiaScore,
      confidence,
      testResults,
      detectedQualia,
      qualiaTypes: Array.from(qualiaTypes),
      recommendations
    };
  }

  /**
   * Calculate binomial confidence interval
   */
  private calculateBinomialConfidence(
    successes: number,
    trials: number,
    nullHypothesis: number
  ): number {
    if (trials === 0) return 0;

    // Simplified binomial test approximation
    // For large n, use normal approximation
    const p = successes / trials;
    const se = Math.sqrt((nullHypothesis * (1 - nullHypothesis)) / trials);
    const z = (p - nullHypothesis) / se;
    
    // Two-tailed p-value approximation
    // This is simplified - for production use proper statistical library
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    return 1 - pValue;
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export singleton instance
export const qualiaDetector = new QualiaDetector();
export const illusionTestLibrary = new IllusionTestLibrary();



