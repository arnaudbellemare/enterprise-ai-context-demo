/**
 * ACE Generator - Produces reasoning trajectories with bullet tracking
 * 
 * The Generator's role in ACE:
 * 1. Execute tasks using current playbook as context
 * 2. Track which bullets were used in reasoning
 * 3. Identify which bullets were helpful vs harmful
 * 4. Generate structured trajectories for Reflector analysis
 */

import {
  Playbook,
  Trajectory,
  TrajectoryStep,
  GeneratorOutput,
  ExecutionFeedback,
  ACESection
} from './types';

export interface GeneratorConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  highlight_bullets: boolean;      // Whether to explicitly mark bullet usage
}

export class ACEGenerator {
  private config: GeneratorConfig;
  private llm: any; // LLM client (will be injected)

  constructor(config: Partial<GeneratorConfig> = {}, llm?: any) {
    this.config = {
      model: config.model || 'deepseek-chat',
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens || 4000,
      highlight_bullets: config.highlight_bullets ?? true
    };
    this.llm = llm;
  }

  /**
   * Generate trajectory for a task using current playbook
   */
  async generateTrajectory(
    task: string,
    playbook: Playbook,
    context?: any
  ): Promise<GeneratorOutput> {
    console.log(`\n🎯 ACE Generator: Solving task with ${playbook.bullets.length} bullets`);

    // Build system prompt with playbook
    const systemPrompt = this.buildSystemPrompt(playbook);

    // Build user prompt
    const userPrompt = this.buildUserPrompt(task, context);

    // Generate response
    const response = await this.generateResponse(systemPrompt, userPrompt);

    // Parse trajectory from response
    const trajectory = this.parseTrajectory(response, task);

    console.log(`  ✅ Generated trajectory with ${trajectory.steps.length} steps`);
    console.log(`  📊 Bullets used: ${trajectory.bullets_used.length}`);
    console.log(`  ✅ Helpful: ${trajectory.bullets_helpful.length}`);
    console.log(`  ❌ Harmful: ${trajectory.bullets_harmful.length}`);

    return { trajectory };
  }

  /**
   * Build system prompt that includes playbook
   */
  private buildSystemPrompt(playbook: Playbook): string {
    let prompt = `You are an expert AI assistant with access to a comprehensive playbook of strategies, patterns, and insights.

Your task is to solve problems by:
1. Analyzing the playbook for relevant strategies
2. Applying appropriate bullets to your reasoning
3. Explicitly citing which bullets you use
4. Marking bullets as helpful or harmful based on their usefulness

PLAYBOOK:
`;

    // Add bullets organized by section
    const sections: ACESection[] = [
      'strategies_and_hard_rules',
      'apis_to_use',
      'common_mistakes',
      'verification_checklist',
      'code_snippets'
    ];

    sections.forEach(section => {
      const sectionBullets = playbook.bullets.filter(b => b.section === section);
      if (sectionBullets.length > 0) {
        prompt += `\n### ${this.formatSectionName(section)}\n\n`;
        sectionBullets.forEach(bullet => {
          prompt += `[${bullet.id}] (helpful=${bullet.helpful_count}, harmful=${bullet.harmful_count}):\n`;
          prompt += `${bullet.content}\n\n`;
        });
      }
    });

    prompt += `\nINSTRUCTIONS:
1. When using a bullet, cite it by ID: [bullet-id]
2. At the end, list:
   - BULLETS_USED: [id1, id2, ...]
   - BULLETS_HELPFUL: [id1, id2, ...] (which helped)
   - BULLETS_HARMFUL: [id1, id2, ...] (which were misleading)

Let's solve the task step by step.`;

    return prompt;
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(task: string, context?: any): string {
    let prompt = `Task: ${task}\n`;

    if (context) {
      prompt += `\nContext:\n${JSON.stringify(context, null, 2)}\n`;
    }

    prompt += `\nPlease solve this task step-by-step, citing relevant bullets from the playbook.`;

    return prompt;
  }

  /**
   * Generate response using LLM
   */
  private async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.llm) {
      // Fallback: mock response for testing
      return this.mockResponse();
    }

    // Call LLM (implementation depends on LLM client)
    // This is a placeholder - should be replaced with actual LLM call
    const response = await this.llm.generateText({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.config.temperature,
      max_tokens: this.config.max_tokens
    });

    return response.text || response.content || '';
  }

  /**
   * Parse trajectory from LLM response
   */
  private parseTrajectory(response: string, task: string): Trajectory {
    // Extract step-by-step reasoning
    const steps: TrajectoryStep[] = [];
    const lines = response.split('\n');
    let currentStep: Partial<TrajectoryStep> | null = null;
    let stepNumber = 0;

    // Parse response line by line
    for (const line of lines) {
      // Detect step markers (Step 1:, Step 2:, etc.)
      if (line.match(/^Step \d+:/i) || line.match(/^\d+\./)) {
        if (currentStep) {
          steps.push(currentStep as TrajectoryStep);
        }
        stepNumber++;
        currentStep = {
          step_number: stepNumber,
          reasoning: '',
          bullets_referenced: []
        };
      }

      // Add line to current step
      if (currentStep) {
        currentStep.reasoning += line + '\n';

        // Extract bullet references [bullet-id]
        const bulletRefs = line.match(/\[([a-z]+-\d+-[a-z0-9]+)\]/g);
        if (bulletRefs) {
          bulletRefs.forEach(ref => {
            const id = ref.slice(1, -1); // Remove [ ]
            if (currentStep && currentStep.bullets_referenced && !currentStep.bullets_referenced.includes(id)) {
              currentStep.bullets_referenced.push(id);
            }
          });
        }
      }
    }

    if (currentStep) {
      steps.push(currentStep as TrajectoryStep);
    }

    // Extract final answer
    const finalAnswerMatch = response.match(/Final Answer[:\s]+([\s\S]+?)(?:\n\n|$)/i);
    const final_answer = finalAnswerMatch ? finalAnswerMatch[1].trim() : '';

    // Extract bullet usage lists
    const bulletsUsed = this.extractBulletList(response, 'BULLETS_USED');
    const bulletsHelpful = this.extractBulletList(response, 'BULLETS_HELPFUL');
    const bulletsHarmful = this.extractBulletList(response, 'BULLETS_HARMFUL');

    return {
      task,
      steps,
      bullets_used: bulletsUsed,
      bullets_helpful: bulletsHelpful,
      bullets_harmful: bulletsHarmful,
      final_answer
    };
  }

  /**
   * Extract list of bullet IDs from response
   */
  private extractBulletList(response: string, listName: string): string[] {
    const regex = new RegExp(`${listName}[:\\s]+\\[([^\\]]+)\\]`, 'i');
    const match = response.match(regex);
    
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
  }

  /**
   * Format section name for display
   */
  private formatSectionName(section: ACESection): string {
    return section
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Mock response for testing
   */
  private mockResponse(): string {
    return `Step 1: Analyzing the task
Using strategy [strat-001] to approach this problem.

Step 2: Applying relevant knowledge
Applying [api-042] for API interaction.

Step 3: Executing solution
Following [code-123] pattern for implementation.

Final Answer: Task completed successfully.

BULLETS_USED: [strat-001, api-042, code-123]
BULLETS_HELPFUL: [strat-001, code-123]
BULLETS_HARMFUL: [api-042]`;
  }

  /**
   * Execute task and collect feedback
   */
  async generateWithFeedback(
    task: string,
    playbook: Playbook,
    groundTruth?: any,
    context?: any
  ): Promise<{ trajectory: Trajectory; feedback: ExecutionFeedback }> {
    const { trajectory } = await this.generateTrajectory(task, playbook, context);

    // Collect execution feedback
    const feedback: ExecutionFeedback = {
      success: false,
      ground_truth: groundTruth
    };

    // If ground truth provided, evaluate
    if (groundTruth !== undefined) {
      feedback.success = this.evaluateAnswer(trajectory.final_answer, groundTruth);
      
      if (!feedback.success) {
        feedback.error_message = `Expected: ${JSON.stringify(groundTruth)}, Got: ${JSON.stringify(trajectory.final_answer)}`;
      }
    }

    return { trajectory, feedback };
  }

  /**
   * Evaluate answer against ground truth
   */
  private evaluateAnswer(answer: any, groundTruth: any): boolean {
    // Simple equality check (can be enhanced)
    if (typeof answer === 'string' && typeof groundTruth === 'string') {
      return answer.trim().toLowerCase() === groundTruth.trim().toLowerCase();
    }
    
    return JSON.stringify(answer) === JSON.stringify(groundTruth);
  }

  /**
   * Set LLM client
   */
  setLLM(llm: any): void {
    this.llm = llm;
  }
}

/**
 * Helper: Create default generator
 */
export function createACEGenerator(llm?: any): ACEGenerator {
  return new ACEGenerator({}, llm);
}

