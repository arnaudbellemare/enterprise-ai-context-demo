/**
 * ACE Reflector - Extracts insights from trajectories through multi-iteration refinement
 * 
 * The Reflector's role in ACE:
 * 1. Analyze Generator's trajectory and execution feedback
 * 2. Identify what went wrong (or right) and why
 * 3. Extract actionable insights for future tasks
 * 4. Tag existing bullets as helpful/harmful/neutral
 * 5. Refine insights over multiple iterations (up to 5)
 * 
 * Key innovation: Separated from generation for higher quality insights
 */

import {
  Trajectory,
  ExecutionFeedback,
  Insights,
  BulletTag,
  ReflectorOutput,
  Playbook
} from './types';

export interface ReflectorConfig {
  model: string;
  temperature: number;
  max_iterations: number;          // Paper uses 5
  require_ground_truth: boolean;    // Whether GT is required
}

export class ACEReflector {
  private config: ReflectorConfig;
  private llm: any;

  constructor(config: Partial<ReflectorConfig> = {}, llm?: any) {
    this.config = {
      model: config.model || 'deepseek-chat',
      temperature: config.temperature ?? 0.3,  // Lower for more focused reflection
      max_iterations: config.max_iterations || 5,
      require_ground_truth: config.require_ground_truth ?? false
    };
    this.llm = llm;
  }

  /**
   * Extract insights from trajectory with multi-iteration refinement
   */
  async extractInsights(
    trajectory: Trajectory,
    feedback: ExecutionFeedback,
    playbook?: Playbook
  ): Promise<ReflectorOutput> {
    console.log(`\n🔍 ACE Reflector: Analyzing trajectory (max ${this.config.max_iterations} iterations)`);

    let insights: Insights = {
      reasoning: '',
      key_insights: [],
      bullet_tags: []
    };

    // Initial reflection
    insights = await this.reflectOnTrajectory(trajectory, feedback, playbook);
    let iterations = 1;

    console.log(`  Iteration 1: ${insights.key_insights.length} insights extracted`);

    // Iterative refinement (up to max_iterations)
    for (let i = 1; i < this.config.max_iterations; i++) {
      // Check if refinement is needed
      if (this.shouldStopRefinement(insights, i)) {
        console.log(`  ✅ Stopping at iteration ${i} (sufficient quality)`);
        break;
      }

      console.log(`  🔄 Iteration ${i + 1}: Refining insights...`);
      
      // Refine previous insights
      insights = await this.refineInsights(insights, trajectory, feedback);
      iterations = i + 1;

      console.log(`  Iteration ${i + 1}: ${insights.key_insights.length} insights (refined)`);
    }

    console.log(`  ✅ Reflection complete after ${iterations} iterations`);
    console.log(`  📊 Final: ${insights.key_insights.length} insights, ${insights.bullet_tags.length} bullets tagged`);

    return {
      insights,
      refinement_iterations: iterations
    };
  }

  /**
   * Initial reflection on trajectory
   */
  private async reflectOnTrajectory(
    trajectory: Trajectory,
    feedback: ExecutionFeedback,
    playbook?: Playbook
  ): Promise<Insights> {
    const systemPrompt = this.buildReflectorSystemPrompt();
    const userPrompt = this.buildReflectorUserPrompt(trajectory, feedback, playbook);

    const response = await this.generateResponse(systemPrompt, userPrompt);

    return this.parseInsights(response);
  }

  /**
   * Refine existing insights
   */
  private async refineInsights(
    previousInsights: Insights,
    trajectory: Trajectory,
    feedback: ExecutionFeedback
  ): Promise<Insights> {
    const systemPrompt = `You are an expert analyst refining previous insights for better quality and actionability.

Your goal is to:
1. Review the previous insights critically
2. Identify gaps, vagueness, or redundancy
3. Make insights more specific and actionable
4. Ensure insights are grounded in the trajectory and feedback`;

    const userPrompt = `Previous Insights:
${JSON.stringify(previousInsights, null, 2)}

Task:
${trajectory.task}

Success: ${feedback.success}
${feedback.error_message ? `Error: ${feedback.error_message}` : ''}

Please refine these insights to be:
- More specific and actionable
- Better grounded in evidence
- Non-redundant
- Clearly categorized

Provide refined insights in the same JSON format.`;

    const response = await this.generateResponse(systemPrompt, userPrompt);

    return this.parseInsights(response);
  }

  /**
   * Build reflector system prompt
   */
  private buildReflectorSystemPrompt(): string {
    return `You are an expert analyst and educator. Your job is to diagnose why a model's reasoning succeeded or failed.

Your analysis should:
1. Carefully examine the model's reasoning trace
2. Compare predicted answers with ground truth (if available)
3. Identify specific errors or effective strategies
4. Determine root causes (conceptual errors, calculation mistakes, etc.)
5. Provide actionable insights for future tasks
6. Tag bullets used as helpful, harmful, or neutral

Instructions:
- Be specific about what went wrong or right
- Focus on root causes, not surface-level symptoms
- Provide actionable guidance that prevents future mistakes
- Ground insights in evidence from the trajectory
- Tag each bullet used with helpful/harmful/neutral

Output Format (JSON):
{
  "reasoning": "Your detailed chain of thought analysis",
  "error_identification": "What specifically went wrong (if failed)",
  "root_cause_analysis": "Why did this occur? What was misunderstood?",
  "correct_approach": "What should have been done instead?",
  "key_insights": [
    "Actionable insight 1",
    "Actionable insight 2",
    ...
  ],
  "bullet_tags": [
    {"id": "bullet-id-1", "tag": "helpful"},
    {"id": "bullet-id-2", "tag": "harmful"},
    ...
  ]
}`;
  }

  /**
   * Build reflector user prompt
   */
  private buildReflectorUserPrompt(
    trajectory: Trajectory,
    feedback: ExecutionFeedback,
    playbook?: Playbook
  ): string {
    let prompt = `Task: ${trajectory.task}\n\n`;

    prompt += `Trajectory (${trajectory.steps.length} steps):\n`;
    trajectory.steps.forEach(step => {
      prompt += `\nStep ${step.step_number}:\n`;
      prompt += step.reasoning;
      if (step.action) prompt += `\nAction: ${step.action}`;
      if (step.observation) prompt += `\nObservation: ${step.observation}`;
      if (step.bullets_referenced.length > 0) {
        prompt += `\nBullets used: ${step.bullets_referenced.join(', ')}`;
      }
    });

    prompt += `\n\nFinal Answer: ${JSON.stringify(trajectory.final_answer)}\n`;

    prompt += `\nExecution Feedback:\n`;
    prompt += `Success: ${feedback.success}\n`;
    if (feedback.ground_truth !== undefined) {
      prompt += `Ground Truth: ${JSON.stringify(feedback.ground_truth)}\n`;
    }
    if (feedback.error_message) {
      prompt += `Error: ${feedback.error_message}\n`;
    }
    if (feedback.test_results) {
      prompt += `Test Results: ${JSON.stringify(feedback.test_results)}\n`;
    }

    prompt += `\nBullets Used in Trajectory:\n`;
    if (playbook) {
      trajectory.bullets_used.forEach(bulletId => {
        const bullet = playbook.bullets.find(b => b.id === bulletId);
        if (bullet) {
          prompt += `\n[${bullet.id}] (helpful=${bullet.helpful_count}, harmful=${bullet.harmful_count}):\n`;
          prompt += `${bullet.content}\n`;
        }
      });
    } else {
      prompt += trajectory.bullets_used.join(', ') || 'None';
    }

    prompt += `\n\nPlease analyze this trajectory and provide insights.`;

    return prompt;
  }

  /**
   * Generate response using LLM
   */
  private async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.llm) {
      return this.mockReflectorResponse();
    }

    const response = await this.llm.generateText({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.config.temperature,
      max_tokens: 4000
    });

    return response.text || response.content || '';
  }

  /**
   * Parse insights from response
   */
  private parseInsights(response: string): Insights {
    try {
      // Try to extract JSON block
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          reasoning: parsed.reasoning || '',
          error_identification: parsed.error_identification,
          root_cause_analysis: parsed.root_cause_analysis,
          correct_approach: parsed.correct_approach,
          key_insights: parsed.key_insights || [],
          bullet_tags: parsed.bullet_tags || []
        };
      }
    } catch (error) {
      console.warn('Failed to parse insights as JSON, using fallback');
    }

    // Fallback: extract key insights from text
    const insights: string[] = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      // Look for bullet points or numbered lists
      if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
        const insight = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
        if (insight.length > 10) {
          insights.push(insight);
        }
      }
    });

    return {
      reasoning: response,
      key_insights: insights,
      bullet_tags: []
    };
  }

  /**
   * Determine if refinement should stop
   */
  private shouldStopRefinement(insights: Insights, iteration: number): boolean {
    // Stop if we have sufficient high-quality insights
    const hasEnoughInsights = insights.key_insights.length >= 3;
    const hasErrorAnalysis = !!insights.error_identification || !!insights.correct_approach;
    
    // Stop after iteration 2 if quality is good
    if (iteration >= 2 && hasEnoughInsights && hasErrorAnalysis) {
      return true;
    }

    // Always allow at least 2 iterations, stop after 5
    return false;
  }

  /**
   * Mock reflector response for testing
   */
  private mockReflectorResponse(): string {
    return JSON.stringify({
      reasoning: "The trajectory shows effective use of strategy [strat-001] but encountered issues with API usage [api-042]",
      error_identification: "API call used incorrect parameter format",
      root_cause_analysis: "The model referenced an outdated API schema",
      correct_approach: "Should have verified current API documentation before calling",
      key_insights: [
        "Always verify API schemas before making calls",
        "Strategy [strat-001] was effective for initial planning",
        "Need to add API validation checklist"
      ],
      bullet_tags: [
        { id: "strat-001", tag: "helpful" },
        { id: "api-042", tag: "harmful" },
        { id: "code-123", tag: "helpful" }
      ]
    }, null, 2);
  }

  /**
   * Set LLM client
   */
  setLLM(llm: any): void {
    this.llm = llm;
  }
}

/**
 * Helper: Create default reflector
 */
export function createACEReflector(llm?: any): ACEReflector {
  return new ACEReflector({}, llm);
}

