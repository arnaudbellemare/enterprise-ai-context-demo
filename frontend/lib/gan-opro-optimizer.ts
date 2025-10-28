/**
 * GAN-OPRO: Adversarial Optimization by Prompting Framework
 * 
 * Integration of GAN principles with OPRO (Optimization by PROmpting) to enhance
 * DSPy optimization capabilities in PERMUTATION AI system.
 * 
 * Based on:
 * - OPRO: Optimization by PROmpting (Google DeepMind, 2023)
 * - GANPrompt: Adversarial prompt generation (2024)
 * - Adversarial In-Context Learning (adv-ICL, 2024)
 * - GAN Game for Prompt Engineering (2025)
 */

export enum OptimizationStrategy {
  EXPLORATION = 'exploration',
  EXPLOITATION = 'exploitation',
  ADVERSARIAL = 'adversarial',
  DIVERSITY = 'diversity'
}

export interface PromptCandidate {
  id: string;
  prompt: string;
  score: number;
  generation: number;
  parentIds: string[];
  metadata: Record<string, any>;
  diversityScore: number;
  robustnessScore: number;
  adversarialScore: number;
  realismScore?: number;
}

export interface OptimizationTrajectory {
  candidates: PromptCandidate[];
  bestCandidate: PromptCandidate | null;
  iteration: number;
  convergenceThreshold: number;
  maxIterations: number;
}

export interface GANOPROConfig {
  temperature: number;
  maxCandidates: number;
  diversityWeight: number;
  realismWeight: number;
  robustnessWeight: number;
  maxIterations: number;
  convergenceThreshold: number;
  ganTrainingInterval: number;
  learnedPatterns?: Record<string, any>;
  performancePatterns?: Record<string, any>;
  lastUpdate?: number;
}

export class GANOPROGenerator {
  private llmClient: any;
  private config: GANOPROConfig;

  constructor(llmClient: any, config: Partial<GANOPROConfig> = {}) {
    this.llmClient = llmClient;
    this.config = {
      temperature: 0.7,
      maxCandidates: 8,
      diversityWeight: 0.3,
      realismWeight: 0.4,
      robustnessWeight: 0.3,
      maxIterations: 50,
      convergenceThreshold: 0.01,
      ganTrainingInterval: 5,
      ...config
    };
  }

  async generateCandidates(
    trajectory: OptimizationTrajectory,
    strategy: OptimizationStrategy = OptimizationStrategy.EXPLORATION
  ): Promise<PromptCandidate[]> {
    // Build meta-prompt for OPRO
    const metaPrompt = this.buildMetaPrompt(trajectory, strategy);

    // Generate candidates using LLM
    const candidates: PromptCandidate[] = [];
    
    for (let i = 0; i < this.config.maxCandidates; i++) {
      try {
        // Vary temperature for diversity
        const temp = this.config.temperature + (i * 0.1) % 0.3;

        const response = await this.llmClient.generate({
          prompt: metaPrompt,
          temperature: temp,
          maxTokens: 200
        });

        // Extract prompt from response
        const prompt = this.extractPrompt(response);

        const candidate: PromptCandidate = {
          id: `gen_${trajectory.iteration}_${i}`,
          prompt,
          score: 0.0, // Will be evaluated later
          generation: trajectory.iteration,
          parentIds: [],
          metadata: {
            strategy: strategy,
            temperature: temp,
            generatedAt: Date.now()
          },
          diversityScore: 0.0,
          robustnessScore: 0.0,
          adversarialScore: 0.0
        };

        candidates.push(candidate);
      } catch (error) {
        console.error(`Error generating candidate ${i}:`, error);
        continue;
      }
    }

    return candidates;
  }

  private buildMetaPrompt(trajectory: OptimizationTrajectory, strategy: OptimizationStrategy): string {
    // Get top performers for trajectory
    const topCandidates = trajectory.candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Build trajectory description
    const trajectoryDesc = topCandidates
      .map(c => `Score: ${c.score.toFixed(3)} | Prompt: ${c.prompt.substring(0, 100)}...`)
      .join('\n');

    // Strategy-specific instructions
    const strategyInstructions: Record<OptimizationStrategy, string> = {
      [OptimizationStrategy.EXPLORATION]: "Generate diverse, novel prompts that explore new approaches",
      [OptimizationStrategy.EXPLOITATION]: "Generate prompts that build on the highest-scoring examples",
      [OptimizationStrategy.ADVERSARIAL]: "Generate prompts that challenge current assumptions and test robustness",
      [OptimizationStrategy.DIVERSITY]: "Generate prompts with varied structures while maintaining effectiveness"
    };

    const metaPrompt = `
You are an expert prompt optimizer. Your task is to generate effective prompts for AI systems.

OPTIMIZATION TRAJECTORY (Top Performers):
${trajectoryDesc}

STRATEGY: ${strategyInstructions[strategy]}

TASK DESCRIPTION: Generate prompts that maximize performance on reasoning tasks while maintaining clarity and robustness.

INSTRUCTIONS:
1. Analyze the top-performing prompts above
2. Identify patterns that lead to success
3. Generate ${this.config.maxCandidates} new prompt variations
4. Each prompt should be concise but effective
5. Vary structure and approach while maintaining quality

FORMAT: Return each prompt on a new line, prefixed with "PROMPT:"

EXAMPLES:
PROMPT: Let's think step by step to solve this problem.
PROMPT: Break down the problem into smaller parts and solve each part systematically.
PROMPT: Consider multiple approaches and choose the most logical one.
`;

    return metaPrompt;
  }

  private extractPrompt(response: string): string {
    const lines = response.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('PROMPT:')) {
        return line.replace('PROMPT:', '').trim();
      }
    }

    // Fallback: return first line if no PROMPT: prefix found
    return lines[0]?.trim() || "Let's solve this step by step.";
  }
}

export class GANOPRODiscriminator {
  private llmClient: any;
  private config: GANOPROConfig;

  constructor(llmClient: any, config: Partial<GANOPROConfig> = {}) {
    this.llmClient = llmClient;
    this.config = {
      temperature: 0.7,
      maxCandidates: 8,
      diversityWeight: 0.3,
      realismWeight: 0.4,
      robustnessWeight: 0.3,
      maxIterations: 50,
      convergenceThreshold: 0.01,
      ganTrainingInterval: 5,
      ...config
    };
  }

  async evaluateCandidates(
    candidates: PromptCandidate[],
    referenceCandidates: PromptCandidate[]
  ): Promise<PromptCandidate[]> {
    const evaluatedCandidates: PromptCandidate[] = [];

    for (const candidate of candidates) {
      // Evaluate realism (alignment with human-like instructions)
      const realismScore = await this.evaluateRealism(candidate);

      // Evaluate diversity (uniqueness compared to reference set)
      const diversityScore = this.evaluateDiversity(candidate, referenceCandidates);

      // Evaluate robustness (resistance to variations)
      const robustnessScore = await this.evaluateRobustness(candidate);

      // Calculate adversarial score
      const adversarialScore = (
        realismScore * this.config.realismWeight +
        diversityScore * this.config.diversityWeight +
        robustnessScore * this.config.robustnessWeight
      );

      // Update candidate with scores
      const evaluatedCandidate: PromptCandidate = {
        ...candidate,
        realismScore,
        diversityScore,
        robustnessScore,
        adversarialScore
      };

      evaluatedCandidates.push(evaluatedCandidate);
    }

    return evaluatedCandidates;
  }

  private async evaluateRealism(candidate: PromptCandidate): Promise<number> {
    const evaluationPrompt = `
Evaluate this prompt for realism and human-like quality on a scale of 0-1:

PROMPT: ${candidate.prompt}

Consider:
- Natural language flow
- Appropriate complexity
- Human-like instruction style
- Clarity and coherence

Respond with only a number between 0 and 1.
`;

    try {
      const response = await this.llmClient.generate({
        prompt: evaluationPrompt,
        temperature: 0.1,
        maxTokens: 10
      });

      // Extract score from response
      const score = parseFloat(response.trim());
      return Math.max(0.0, Math.min(1.0, score));
    } catch (error) {
      console.error('Error evaluating realism:', error);
      return 0.5; // Default score
    }
  }

  private evaluateDiversity(candidate: PromptCandidate, referenceCandidates: PromptCandidate[]): number {
    if (referenceCandidates.length === 0) {
      return 1.0; // Maximum diversity if no references
    }

    // Simple diversity based on word overlap
    const candidateWords = new Set(candidate.prompt.toLowerCase().split(' '));

    const similarities: number[] = [];
    for (const ref of referenceCandidates) {
      const refWords = new Set(ref.prompt.toLowerCase().split(' '));
      if (candidateWords.size > 0 && refWords.size > 0) {
        const intersection = new Set([...candidateWords].filter(x => refWords.has(x)));
        const union = new Set([...candidateWords, ...refWords]);
        const similarity = intersection.size / union.size;
        similarities.push(similarity);
      }
    }

    if (similarities.length > 0) {
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const diversityScore = 1.0 - avgSimilarity;
      return Math.max(0.0, Math.min(1.0, diversityScore));
    }

    return 1.0;
  }

  private async evaluateRobustness(candidate: PromptCandidate): Promise<number> {
    // Generate variations of the prompt
    const variations = this.generateVariations(candidate.prompt);

    const robustnessScores: number[] = [];
    for (const variation of variations) {
      // Evaluate if variation maintains effectiveness
      const robustnessPrompt = `
Compare these two prompts for effectiveness:

ORIGINAL: ${candidate.prompt}
VARIATION: ${variation}

Rate the variation's effectiveness relative to the original (0-1):
- 1.0 = Equally effective
- 0.5 = Somewhat effective
- 0.0 = Not effective

Respond with only a number between 0 and 1.
`;

      try {
        const response = await this.llmClient.generate({
          prompt: robustnessPrompt,
          temperature: 0.1,
          maxTokens: 10
        });

        const score = parseFloat(response.trim());
        robustnessScores.push(Math.max(0.0, Math.min(1.0, score)));
      } catch (error) {
        console.error('Error evaluating robustness variation:', error);
        robustnessScores.push(0.5);
      }
    }

    return robustnessScores.length > 0 
      ? robustnessScores.reduce((a, b) => a + b, 0) / robustnessScores.length 
      : 0.5;
  }

  private generateVariations(prompt: string): string[] {
    const variations: string[] = [];

    // Add/remove words
    const words = prompt.split(' ');
    if (words.length > 2) {
      variations.push(words.slice(0, -1).join(' ')); // Remove last word
      variations.push(words.slice(1).join(' '));     // Remove first word
    }

    // Change punctuation
    if (prompt.endsWith('.')) {
      variations.push(prompt.slice(0, -1) + '!');
    } else if (prompt.endsWith('!')) {
      variations.push(prompt.slice(0, -1) + '.');
    }

    // Add filler words
    variations.push(`Please ${prompt.toLowerCase()}`);
    variations.push(`Kindly ${prompt.toLowerCase()}`);

    return variations.slice(0, 3); // Limit to 3 variations
  }
}

export class GANOPROOptimizer {
  private generator: GANOPROGenerator;
  private discriminator: GANOPRODiscriminator;
  private config: GANOPROConfig;

  constructor(
    generator: GANOPROGenerator, 
    discriminator: GANOPRODiscriminator, 
    config: Partial<GANOPROConfig> = {}
  ) {
    this.generator = generator;
    this.discriminator = discriminator;
    this.config = {
      temperature: 0.7,
      maxCandidates: 8,
      diversityWeight: 0.3,
      realismWeight: 0.4,
      robustnessWeight: 0.3,
      maxIterations: 50,
      convergenceThreshold: 0.01,
      ganTrainingInterval: 5,
      ...config
    };
  }

  async optimize(
    initialPrompt: string,
    evaluationFunction: (prompt: string) => Promise<number>,
    trainingData?: any[]
  ): Promise<{
    optimizedPrompt: string;
    finalScore: number;
    iterations: number;
    optimizationHistory: any[];
    totalCandidates: number;
    convergenceReached: boolean;
  }> {
    console.log(`Starting GAN-OPRO optimization with initial prompt: ${initialPrompt.substring(0, 50)}...`);

    // Initialize trajectory
    const initialCandidate: PromptCandidate = {
      id: 'initial',
      prompt: initialPrompt,
      score: await evaluationFunction(initialPrompt),
      generation: 0,
      parentIds: [],
      metadata: {},
      diversityScore: 0.0,
      robustnessScore: 0.0,
      adversarialScore: 0.0
    };

    const trajectory: OptimizationTrajectory = {
      candidates: [initialCandidate],
      bestCandidate: initialCandidate,
      iteration: 0,
      convergenceThreshold: this.config.convergenceThreshold,
      maxIterations: this.config.maxIterations
    };

    const optimizationHistory: any[] = [];
    let bestScore = initialCandidate.score;

    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      console.log(`GAN-OPRO Iteration ${iteration + 1}/${this.config.maxIterations}`);

      // Choose optimization strategy
      const strategy = this.chooseStrategy(iteration, trajectory);

      // Generate candidates using generator
      const newCandidates = await this.generator.generateCandidates(trajectory, strategy);

      // Evaluate candidates using discriminator
      const evaluatedCandidates = await this.discriminator.evaluateCandidates(
        newCandidates,
        trajectory.candidates
      );

      // Score candidates using evaluation function
      for (const candidate of evaluatedCandidates) {
        candidate.score = await evaluationFunction(candidate.prompt);
      }

      // Update trajectory
      trajectory.candidates.push(...evaluatedCandidates);
      trajectory.iteration = iteration + 1;

      // Find best candidate
      const bestCandidate = trajectory.candidates.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      trajectory.bestCandidate = bestCandidate;

      // Record optimization step
      optimizationHistory.push({
        iteration: iteration + 1,
        bestScore: bestCandidate.score,
        bestPrompt: bestCandidate.prompt,
        strategy: strategy,
        candidatesGenerated: newCandidates.length,
        adversarialScores: evaluatedCandidates.map(c => c.adversarialScore),
        timestamp: Date.now()
      });

      // Check for convergence
      if (Math.abs(bestCandidate.score - bestScore) < this.config.convergenceThreshold) {
        console.log(`Converged at iteration ${iteration + 1}`);
        break;
      }

      bestScore = bestCandidate.score;

      // GAN training every N iterations
      if ((iteration + 1) % this.config.ganTrainingInterval === 0) {
        await this.ganTrainingStep(trajectory);
      }
    }

    return {
      optimizedPrompt: trajectory.bestCandidate!.prompt,
      finalScore: trajectory.bestCandidate!.score,
      iterations: trajectory.iteration,
      optimizationHistory,
      totalCandidates: trajectory.candidates.length,
      convergenceReached: trajectory.iteration < this.config.maxIterations
    };
  }

  private chooseStrategy(iteration: number, trajectory: OptimizationTrajectory): OptimizationStrategy {
    // Early iterations: exploration
    if (iteration < 10) {
      return OptimizationStrategy.EXPLORATION;
    }
    // Middle iterations: adversarial
    else if (iteration < 30) {
      return OptimizationStrategy.ADVERSARIAL;
    }
    // Late iterations: exploitation
    else {
      return OptimizationStrategy.EXPLOITATION;
    }
  }

  private async ganTrainingStep(trajectory: OptimizationTrajectory): Promise<void> {
    console.log('Performing GAN training step...');

    // Get recent candidates for training
    const recentCandidates = trajectory.candidates.slice(-20); // Last 20 candidates

    // Separate high and low performers
    const scores = recentCandidates.map(c => c.score);
    const highThreshold = this.percentile(scores, 75);
    const lowThreshold = this.percentile(scores, 25);

    const highPerformers = recentCandidates.filter(c => c.score > highThreshold);
    const lowPerformers = recentCandidates.filter(c => c.score < lowThreshold);

    // Update generator based on high performers
    if (highPerformers.length > 0) {
      await this.updateGenerator(highPerformers);
    }

    // Update discriminator based on performance differences
    if (highPerformers.length > 0 && lowPerformers.length > 0) {
      await this.updateDiscriminator(highPerformers, lowPerformers);
    }
  }

  private async updateGenerator(highPerformers: PromptCandidate[]): Promise<void> {
    console.log(`Updating generator based on ${highPerformers.length} high performers`);

    // Analyze patterns in high performers
    const commonPatterns = this.analyzePatterns(highPerformers);

    // Update generator configuration
    this.generator['config'] = {
      ...this.generator['config'],
      learnedPatterns: commonPatterns,
      lastUpdate: Date.now()
    };
  }

  private async updateDiscriminator(
    highPerformers: PromptCandidate[], 
    lowPerformers: PromptCandidate[]
  ): Promise<void> {
    console.log(`Updating discriminator based on ${highPerformers.length} high and ${lowPerformers.length} low performers`);

    // Analyze differences between high and low performers
    const performanceDifferences = this.analyzePerformanceDifferences(highPerformers, lowPerformers);

    // Update discriminator configuration
    this.discriminator['config'] = {
      ...this.discriminator['config'],
      performancePatterns: performanceDifferences,
      lastUpdate: Date.now()
    };
  }

  private analyzePatterns(candidates: PromptCandidate[]): Record<string, any> {
    const patterns: Record<string, any> = {
      commonWords: {} as Record<string, number>,
      commonPhrases: {} as Record<string, number>,
      lengthDistribution: [] as number[],
      structurePatterns: [] as string[]
    };

    for (const candidate of candidates) {
      const words = candidate.prompt.toLowerCase().split(' ');
      patterns.lengthDistribution.push(words.length);

      for (const word of words) {
        patterns.commonWords[word] = (patterns.commonWords[word] || 0) + 1;
      }
    }

    return patterns;
  }

  private analyzePerformanceDifferences(
    highPerformers: PromptCandidate[], 
    lowPerformers: PromptCandidate[]
  ): Record<string, any> {
    const highScores = highPerformers.map(c => c.score);
    const lowScores = lowPerformers.map(c => c.score);
    const highDiversity = highPerformers.map(c => c.diversityScore);
    const lowDiversity = lowPerformers.map(c => c.diversityScore);
    const highRobustness = highPerformers.map(c => c.robustnessScore);
    const lowRobustness = lowPerformers.map(c => c.robustnessScore);

    return {
      scoreGap: this.mean(highScores) - this.mean(lowScores),
      diversityGap: this.mean(highDiversity) - this.mean(lowDiversity),
      robustnessGap: this.mean(highRobustness) - this.mean(lowRobustness)
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private mean(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
}
