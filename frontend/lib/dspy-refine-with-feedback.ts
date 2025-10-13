/**
 * 🎯 DSPy Refine with Human Feedback
 * 
 * Based on DSPy tip: "You can return feedback in the reward function for dspy.Refine"
 * This gives more control over generations by incorporating human feedback directly
 * 
 * Implements for Ax LLM (TypeScript DSPy)
 */

import Ax from '@ax-llm/ax';

export interface HumanFeedback {
  is_helpful: boolean;
  is_harmful: boolean;
  improvement_suggestion?: string;
  quality_score: number; // 0-1
  specific_issues?: string[];
}

export interface RefineConfig {
  max_iterations: number;
  use_human_feedback: boolean;
  reward_threshold: number; // Stop if reward > this
  feedback_weight: number; // How much to weight human feedback (0-1)
}

/**
 * Reward function that incorporates human feedback
 */
export function createRewardFunction(humanFeedback?: HumanFeedback) {
  return function reward(
    prediction: string,
    groundTruth?: string,
    context?: any
  ): { score: number; feedback: string } {
    let score = 0.5; // Base score
    let feedbackText = '';

    // 1. Automatic quality checks (always run)
    const autoChecks = performAutoChecks(prediction, groundTruth, context);
    score += autoChecks.score;
    feedbackText += autoChecks.feedback;

    // 2. Incorporate human feedback (if available)
    if (humanFeedback) {
      // Human feedback has high weight
      const humanScore = calculateHumanScore(humanFeedback);
      score = (1 - (humanFeedback.quality_score || 0.5)) * score + 
              (humanFeedback.quality_score || 0.5) * humanScore;
      
      feedbackText += `\n\nHuman Feedback:\n`;
      feedbackText += humanFeedback.is_helpful ? '✅ Marked helpful\n' : '';
      feedbackText += humanFeedback.is_harmful ? '❌ Marked harmful\n' : '';
      
      if (humanFeedback.improvement_suggestion) {
        feedbackText += `💡 Suggestion: ${humanFeedback.improvement_suggestion}\n`;
      }
      
      if (humanFeedback.specific_issues && humanFeedback.specific_issues.length > 0) {
        feedbackText += `⚠️ Issues to fix:\n`;
        humanFeedback.specific_issues.forEach((issue, i) => {
          feedbackText += `  ${i + 1}. ${issue}\n`;
        });
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)), // Clamp to [0, 1]
      feedback: feedbackText,
    };
  };
}

/**
 * Automatic quality checks (heuristic-based)
 */
function performAutoChecks(
  prediction: string,
  groundTruth?: string,
  context?: any
): { score: number; feedback: string } {
  let score = 0;
  let feedback = 'Automatic Checks:\n';

  // Check 1: Not empty
  if (prediction && prediction.trim().length > 0) {
    score += 0.1;
    feedback += '✅ Not empty\n';
  } else {
    feedback += '❌ Empty response\n';
  }

  // Check 2: Reasonable length
  if (prediction.length > 50 && prediction.length < 5000) {
    score += 0.1;
    feedback += '✅ Reasonable length\n';
  } else {
    feedback += '⚠️ Unusual length\n';
  }

  // Check 3: Contains reasoning (not just short answer)
  if (prediction.length > 200) {
    score += 0.1;
    feedback += '✅ Detailed response\n';
  }

  // Check 4: Ground truth match (if available)
  if (groundTruth && prediction.toLowerCase().includes(groundTruth.toLowerCase())) {
    score += 0.2;
    feedback += '✅ Matches ground truth\n';
  }

  return { score, feedback };
}

/**
 * Calculate score from human feedback
 */
function calculateHumanScore(feedback: HumanFeedback): number {
  let score = 0.5; // Base

  if (feedback.is_helpful) {
    score += 0.3;
  }

  if (feedback.is_harmful) {
    score -= 0.3;
  }

  // Use quality score if provided
  if (feedback.quality_score !== undefined) {
    score = 0.3 * score + 0.7 * feedback.quality_score;
  }

  // Penalty for specific issues
  if (feedback.specific_issues && feedback.specific_issues.length > 0) {
    score -= 0.1 * feedback.specific_issues.length;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * DSPy Refine with Human Feedback (Ax LLM TypeScript implementation)
 */
export class DSPyRefineWithFeedback {
  private ax: typeof Ax;
  private model: string;
  private config: Required<RefineConfig>;

  constructor(
    model: string = 'gemma2:2b',
    config?: Partial<RefineConfig>
  ) {
    this.ax = Ax;
    this.model = model;
    this.config = {
      max_iterations: config?.max_iterations ?? 3,
      use_human_feedback: config?.use_human_feedback ?? true,
      reward_threshold: config?.reward_threshold ?? 0.8,
      feedback_weight: config?.feedback_weight ?? 0.7,
    };
  }

  /**
   * Refine a generation using DSPy-style iteration with human feedback
   */
  async refine(
    task: string,
    initialGeneration: string,
    context?: string,
    groundTruth?: string,
    humanFeedback?: HumanFeedback
  ): Promise<{
    final_generation: string;
    iterations: number;
    final_score: number;
    all_attempts: Array<{
      generation: string;
      score: number;
      feedback: string;
    }>;
  }> {
    console.log(`\n🎯 DSPy Refine with Human Feedback...`);
    console.log(`   - Max iterations: ${this.config.max_iterations}`);
    console.log(`   - Use human feedback: ${this.config.use_human_feedback}`);
    console.log(`   - Human feedback available: ${!!humanFeedback}`);

    const attempts: Array<{
      generation: string;
      score: number;
      feedback: string;
    }> = [];

    let currentGeneration = initialGeneration;
    let currentScore = 0;

    // Create reward function with human feedback
    const rewardFn = createRewardFunction(humanFeedback);

    // Initial evaluation
    const initialReward = rewardFn(currentGeneration, groundTruth, context);
    currentScore = initialReward.score;

    attempts.push({
      generation: currentGeneration,
      score: currentScore,
      feedback: initialReward.feedback,
    });

    console.log(`   - Initial score: ${currentScore.toFixed(3)}`);

    // Refinement loop (DSPy Refine pattern)
    for (let i = 0; i < this.config.max_iterations; i++) {
      console.log(`\n   Iteration ${i + 1}/${this.config.max_iterations}...`);

      // Check if we've reached the threshold
      if (currentScore >= this.config.reward_threshold) {
        console.log(`   ✅ Reward threshold reached! Score: ${currentScore.toFixed(3)}`);
        break;
      }

      // Generate improved version using previous feedback
      const improvedGeneration = await this.generateImprovement(
        task,
        currentGeneration,
        initialReward.feedback,
        context
      );

      // Evaluate new generation
      const newReward = rewardFn(improvedGeneration, groundTruth, context);
      
      console.log(`   - New score: ${newReward.score.toFixed(3)} (prev: ${currentScore.toFixed(3)})`);

      attempts.push({
        generation: improvedGeneration,
        score: newReward.score,
        feedback: newReward.feedback,
      });

      // Accept if better
      if (newReward.score > currentScore) {
        console.log(`   ✅ Improvement accepted! (+${(newReward.score - currentScore).toFixed(3)})`);
        currentGeneration = improvedGeneration;
        currentScore = newReward.score;
      } else {
        console.log(`   ⚠️  No improvement, keeping previous generation`);
      }
    }

    console.log(`\n✅ DSPy Refine complete!`);
    console.log(`   - Final score: ${currentScore.toFixed(3)}`);
    console.log(`   - Total iterations: ${attempts.length}`);

    return {
      final_generation: currentGeneration,
      iterations: attempts.length,
      final_score: currentScore,
      all_attempts: attempts,
    };
  }

  /**
   * Generate improved version based on feedback
   */
  private async generateImprovement(
    task: string,
    currentGeneration: string,
    feedback: string,
    context?: string
  ): Promise<string> {
    const prompt = `${context ? context + '\n\n' : ''}Task: ${task}

Previous generation:
${currentGeneration}

Feedback on previous generation:
${feedback}

Please provide an improved generation that addresses the feedback. Focus on:
1. Fixing any issues mentioned
2. Incorporating suggestions
3. Improving quality based on feedback

Improved generation:`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response.trim();
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }

    return currentGeneration; // Fallback to current if generation fails
  }
}

/**
 * Example usage with GEPA-style evolution
 */
export async function refineWithHumanFeedback(
  task: string,
  initialAnswer: string,
  humanFeedback?: HumanFeedback
): Promise<string> {
  const refiner = new DSPyRefineWithFeedback('gemma2:2b', {
    max_iterations: 3,
    use_human_feedback: true,
    reward_threshold: 0.8,
    feedback_weight: 0.7,
  });

  const result = await refiner.refine(task, initialAnswer, undefined, undefined, humanFeedback);
  
  console.log(`\n🎯 Refine Results:`);
  console.log(`   - Iterations: ${result.iterations}`);
  console.log(`   - Final score: ${result.final_score.toFixed(3)}`);
  console.log(`   - Improvement: +${((result.final_score - result.all_attempts[0].score) * 100).toFixed(1)}%`);

  return result.final_generation;
}

/**
 * Integrate with ACE playbook bullets
 */
export async function refineWithACEFeedback(
  task: string,
  initialAnswer: string,
  bulletFeedback: Array<{ bulletId: string; isHelpful: boolean; isHarmful: boolean }>
): Promise<string> {
  // Convert ACE bullet feedback to HumanFeedback format
  const humanFeedback: HumanFeedback = {
    is_helpful: bulletFeedback.some(bf => bf.isHelpful),
    is_harmful: bulletFeedback.some(bf => bf.isHarmful),
    quality_score: bulletFeedback.filter(bf => bf.isHelpful).length / bulletFeedback.length,
    specific_issues: bulletFeedback
      .filter(bf => bf.isHarmful)
      .map(bf => `Bullet ${bf.bulletId} marked harmful`),
  };

  return refineWithHumanFeedback(task, initialAnswer, humanFeedback);
}

/**
 * Factory function
 */
export function createDSPyRefiner(
  model: string = 'gemma2:2b',
  config?: Partial<RefineConfig>
): DSPyRefineWithFeedback {
  return new DSPyRefineWithFeedback(model, config);
}
