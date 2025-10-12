/**
 * GEPA Code Evolution Engine for Ollama
 * 
 * Evolves entire agent code (not just prompts) using GEPA.
 * Inspired by: https://github.com/gepa-ai/gepa
 * 
 * Key insight: "GEPA is a text evolution engine - the text can be agent code"
 */

export interface CodeCandidate {
  id: string;
  code: string;
  score: number;
  generation: number;
  parentId?: string;
  mutationStrategy?: string;
  metrics?: {
    accuracy: number;
    completeness: number;
    reasoning: number;
    compliance: number;
    executionTime: number;
  };
}

export interface EvolutionConfig {
  budget: number;
  targetMetric: 'accuracy' | 'sharpe_ratio' | 'f1_score' | 'balanced';
  evaluationFunction: (code: string) => Promise<number>;
  detailedEvaluation?: (code: string) => Promise<{
    score: number;
    metrics: any;
  }>;
}

export interface EvolutionResult {
  baselineScore: number;
  finalScore: number;
  improvement: number;
  improvementPercent: string;
  bestAgentCode: string;
  evolutionHistory: CodeCandidate[];
  discoveredPatterns: string[];
  paretoFrontier: CodeCandidate[];
}

export class GEPACodeEvolutionEngine {
  private budget: number;
  private targetMetric: string;
  private evaluate: (code: string) => Promise<number>;
  private detailedEvaluate?: (code: string) => Promise<{ score: number; metrics: any }>;
  private population: CodeCandidate[] = [];
  private generationCount: number = 0;
  private rolloutsUsed: number = 0;

  constructor(config: EvolutionConfig) {
    this.budget = config.budget;
    this.targetMetric = config.targetMetric;
    this.evaluate = config.evaluationFunction;
    this.detailedEvaluate = config.detailedEvaluation;
  }

  async evolve(initialCode: string): Promise<EvolutionResult> {
    console.log('🧬 Starting GEPA Code Evolution...');
    console.log(`Budget: ${this.budget} rollouts`);
    console.log(`Target metric: ${this.targetMetric}`);

    // Evaluate baseline
    const baselineEval = this.detailedEvaluate
      ? await this.detailedEvaluate(initialCode)
      : { score: await this.evaluate(initialCode), metrics: {} };

    const baseCandidate: CodeCandidate = {
      id: 'gen0_candidate0',
      code: initialCode,
      score: baselineEval.score,
      generation: 0,
      metrics: baselineEval.metrics,
      mutationStrategy: 'baseline'
    };

    this.population = [baseCandidate];
    this.rolloutsUsed = 1;

    console.log(`📊 Baseline score: ${baselineEval.score.toFixed(3)}`);

    // Evolution loop
    while (this.rolloutsUsed < this.budget) {
      this.generationCount++;
      console.log(`\n🔄 Generation ${this.generationCount} (Rollouts: ${this.rolloutsUsed}/${this.budget})`);

      // Select parent using tournament selection
      const parent = this.selectParent();

      // Choose mutation strategy
      const strategy = this.chooseMutationStrategy();

      // Mutate agent code
      console.log(`   🧬 Mutating with strategy: ${strategy}`);
      const mutatedCode = await this.mutateAgentCode(parent.code, strategy);

      // Evaluate mutated agent
      try {
        const evalResult = this.detailedEvaluate
          ? await this.detailedEvaluate(mutatedCode)
          : { score: await this.evaluate(mutatedCode), metrics: {} };

        this.rolloutsUsed++;

        const newCandidate: CodeCandidate = {
          id: `gen${this.generationCount}_candidate${this.population.length}`,
          code: mutatedCode,
          score: evalResult.score,
          generation: this.generationCount,
          parentId: parent.id,
          mutationStrategy: strategy,
          metrics: evalResult.metrics
        };

        // Add to population if improved or for diversity
        if (evalResult.score > parent.score) {
          this.population.push(newCandidate);
          console.log(`   ✅ Improvement! Score: ${parent.score.toFixed(3)} → ${evalResult.score.toFixed(3)} (+${((evalResult.score - parent.score) / parent.score * 100).toFixed(1)}%)`);
        } else if (this.population.length < 10 && Math.random() < 0.2) {
          // Keep some diversity
          this.population.push(newCandidate);
          console.log(`   📊 Added for diversity. Score: ${evalResult.score.toFixed(3)}`);
        } else {
          console.log(`   ❌ No improvement. Score: ${evalResult.score.toFixed(3)} (parent: ${parent.score.toFixed(3)})`);
        }

      } catch (error: any) {
        console.error(`   ❌ Evaluation failed: ${error.message}`);
        this.rolloutsUsed++;
      }
    }

    // Get best candidate
    const best = this.getBestCandidate();
    const improvement = best.score - baseCandidate.score;
    const improvementPercent = ((improvement / baseCandidate.score) * 100).toFixed(1);

    // Analyze discovered patterns
    const discoveredPatterns = this.analyzeDiscoveredPatterns(best.code, initialCode);

    // Build Pareto frontier
    const paretoFrontier = this.buildParetoFrontier();

    console.log(`\n🎉 Evolution Complete!`);
    console.log(`📊 Final score: ${best.score.toFixed(3)} (baseline: ${baseCandidate.score.toFixed(3)})`);
    console.log(`📈 Improvement: +${improvementPercent}%`);
    console.log(`🧬 Generations: ${this.generationCount}`);
    console.log(`🔬 Discovered patterns: ${discoveredPatterns.length}`);

    return {
      baselineScore: baseCandidate.score,
      finalScore: best.score,
      improvement: improvement,
      improvementPercent: `+${improvementPercent}%`,
      bestAgentCode: best.code,
      evolutionHistory: this.population,
      discoveredPatterns,
      paretoFrontier
    };
  }

  private async mutateAgentCode(code: string, strategy: string): Promise<string> {
    // Use Ollama to mutate the agent code
    const mutationPrompts = {
      'add_reflection': `Add a self-reflection loop to this agent code. The agent should critique its own output and refine it if needed.

Current agent code:
\`\`\`typescript
${code}
\`\`\`

Add a reflection step that:
1. Critiques the initial output
2. Identifies weaknesses or missing elements
3. Refines the output if quality is below threshold

Return ONLY the improved code, no explanation.`,

      'add_multistep': `Convert this agent to use multi-step reasoning. Break the task into logical steps.

Current agent code:
\`\`\`typescript
${code}
\`\`\`

Add multi-step reasoning:
1. Understanding step
2. Planning step
3. Execution step(s)
4. Synthesis step

Return ONLY the improved code, no explanation.`,

      'add_tools': `Add tool use capabilities to this agent. Integrate external calculations or data processing.

Current agent code:
\`\`\`typescript
${code}
\`\`\`

Add tool integration:
1. Identify where calculations are needed
2. Use helper functions for numeric operations
3. Validate tool outputs before using them

Return ONLY the improved code, no explanation.`,

      'add_validation': `Add validation and compliance checking to this agent.

Current agent code:
\`\`\`typescript
${code}
\`\`\`

Add validation:
1. Input validation
2. Output format checking
3. Compliance verification
4. Error handling

Return ONLY the improved code, no explanation.`,

      'improve_prompts': `Improve the prompts within this agent code to be more specific and effective.

Current agent code:
\`\`\`typescript
${code}
\`\`\`

Improve prompts by:
1. Making them more specific
2. Adding context and examples
3. Using structured output formats
4. Adding chain-of-thought reasoning

Return ONLY the improved code, no explanation.`,

      'add_early_stopping': `Add early stopping logic to this agent to improve efficiency.

Current agent code:
\`\`\`typescript
${code}
\`\`\`

Add early stopping:
1. Quality threshold checks
2. Confidence-based stopping
3. Iteration limits
4. Resource management

Return ONLY the improved code, no explanation.`
    };

    const prompt = mutationPrompts[strategy as keyof typeof mutationPrompts] || mutationPrompts.improve_prompts;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.8,
            num_predict: 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const mutatedCode = this.extractCode(data.response);

      return mutatedCode;

    } catch (error: any) {
      console.error(`Mutation failed: ${error.message}`);
      // Return original code if mutation fails
      return code;
    }
  }

  private chooseMutationStrategy(): string {
    const strategies = [
      'add_reflection',
      'add_multistep',
      'add_tools',
      'add_validation',
      'improve_prompts',
      'add_early_stopping'
    ];

    // Weighted selection based on generation
    if (this.generationCount < 10) {
      // Early: Try structural changes
      return strategies[Math.floor(Math.random() * 3)];
    } else {
      // Later: Try refinements
      return strategies[3 + Math.floor(Math.random() * 3)];
    }
  }

  private selectParent(): CodeCandidate {
    // Tournament selection
    const tournamentSize = Math.min(3, this.population.length);
    const tournament = [];

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[randomIndex]);
    }

    return tournament.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  }

  private getBestCandidate(): CodeCandidate {
    return this.population.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  }

  private extractCode(response: string): string {
    // Try to extract code from markdown blocks
    const codeBlockMatch = response.match(/```(?:typescript|javascript|python)?\s*\n([\s\S]+?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // If no code block, return cleaned response
    return response.trim();
  }

  private analyzeDiscoveredPatterns(finalCode: string, initialCode: string): string[] {
    const patterns: string[] = [];

    // Check for reflection loops
    if (finalCode.includes('critique') || finalCode.includes('reflect')) {
      patterns.push('Self-reflection loop');
    }

    // Check for multi-step reasoning
    if (finalCode.match(/step\s*\d+/gi) || finalCode.includes('planning')) {
      patterns.push('Multi-step reasoning');
    }

    // Check for tool use
    if (finalCode.includes('calculate') || finalCode.includes('tool')) {
      patterns.push('Tool integration');
    }

    // Check for validation
    if (finalCode.includes('validate') || finalCode.includes('check')) {
      patterns.push('Validation logic');
    }

    // Check for early stopping
    if (finalCode.includes('threshold') || finalCode.includes('early')) {
      patterns.push('Early stopping');
    }

    // Check for error handling
    if (finalCode.includes('try') && finalCode.includes('catch')) {
      patterns.push('Error handling');
    }

    return patterns;
  }

  private buildParetoFrontier(): CodeCandidate[] {
    // Build Pareto frontier based on score and complexity
    const frontier: CodeCandidate[] = [];

    for (const candidate of this.population) {
      const isDominated = this.population.some(other => {
        return (
          other.score >= candidate.score &&
          other.code.length <= candidate.code.length &&
          (other.score > candidate.score || other.code.length < candidate.code.length)
        );
      });

      if (!isDominated) {
        frontier.push(candidate);
      }
    }

    return frontier.sort((a, b) => b.score - a.score);
  }
}

