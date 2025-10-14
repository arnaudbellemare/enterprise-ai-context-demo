/**
 * 🔄 SWiRL TASK DECOMPOSER
 * 
 * Based on: "Synthetic Data Generation & Multi-Step RL for Reasoning & Tool Use"
 * (Stanford + Google DeepMind - arXiv:2504.04736)
 * 
 * SWiRL's Key Innovation: Multi-step decomposition with tool integration
 */

export interface SWiRLStep {
  step_number: number;
  description: string;
  reasoning: string; // Chain of thought
  tools_needed: string[];
  tool_calls?: Array<{
    tool: string;
    query: string;
    result?: any;
  }>;
  complexity_score: number; // 0-1 scale
  depends_on: number[]; // Previous step numbers
}

export interface SWiRLTrajectory {
  task_id: string;
  original_task: string;
  steps: SWiRLStep[];
  total_complexity: number;
  estimated_time_ms: number;
  tools_required: string[];
}

export interface SWiRLDecompositionResult {
  trajectory: SWiRLTrajectory;
  sub_trajectories: SWiRLTrajectory[]; // Overlapping sub-trajectories for learning
  synthesis_plan: string;
}

/**
 * SWiRL Task Decomposer
 * Breaks down complex tasks into manageable steps with tool integration
 */
export class SWiRLDecomposer {
  private llm: any; // Ollama client
  private model: string;

  constructor(model: string = 'qwen2.5:14b') {
    this.model = model;
  }

  /**
   * Decompose task using SWiRL approach
   */
  async decompose(task: string, availableTools: string[] = []): Promise<SWiRLDecompositionResult> {
    console.log(`\n🔄 SWiRL: Decomposing task into multi-step trajectory...`);
    console.log(`   - Task: ${task.substring(0, 80)}...`);
    console.log(`   - Available tools: ${availableTools.join(', ')}`);

    // SWiRL Step 1: Generate initial trajectory
    const trajectory = await this.generateTrajectory(task, availableTools);

    // SWiRL Step 2: Generate overlapping sub-trajectories for learning
    const subTrajectories = this.generateSubTrajectories(trajectory);

    // SWiRL Step 3: Create synthesis plan
    const synthesisPlan = await this.createSynthesisPlan(trajectory);

    console.log(`\n✅ SWiRL: Decomposition complete!`);
    console.log(`   - Main trajectory: ${trajectory.steps.length} steps`);
    console.log(`   - Sub-trajectories: ${subTrajectories.length}`);
    console.log(`   - Total complexity: ${trajectory.total_complexity.toFixed(2)}`);

    return {
      trajectory,
      sub_trajectories: subTrajectories,
      synthesis_plan: synthesisPlan,
    };
  }

  /**
   * Generate main trajectory (SWiRL's synthetic data generation)
   */
  private async generateTrajectory(task: string, availableTools: string[]): Promise<SWiRLTrajectory> {
    const prompt = `You are a multi-step reasoning expert. Break down this task into clear, sequential steps.

Task: ${task}

Available Tools:
${availableTools.map(tool => `- ${tool}`).join('\n')}

For each step, provide:
1. Step description
2. Internal reasoning (chain of thought)
3. Tools needed (if any)
4. Complexity score (0-1)
5. Dependencies on previous steps

Format your response as JSON:
{
  "steps": [
    {
      "step_number": 1,
      "description": "...",
      "reasoning": "...",
      "tools_needed": ["..."],
      "complexity_score": 0.5,
      "depends_on": []
    }
  ]
}`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json',
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.response);

      const steps: SWiRLStep[] = parsed.steps.map((step: any) => ({
        step_number: step.step_number,
        description: step.description,
        reasoning: step.reasoning || '',
        tools_needed: step.tools_needed || [],
        complexity_score: step.complexity_score || 0.5,
        depends_on: step.depends_on || [],
      }));

      const totalComplexity = steps.reduce((sum, step) => sum + step.complexity_score, 0) / steps.length;
      const estimatedTime = steps.length * 2000; // 2s per step estimate

      return {
        task_id: `swirl-${Date.now()}`,
        original_task: task,
        steps,
        total_complexity: totalComplexity,
        estimated_time_ms: estimatedTime,
        tools_required: [...new Set(steps.flatMap(s => s.tools_needed))],
      };
    } catch (error) {
      console.error('SWiRL trajectory generation failed:', error);
      
      // Fallback: Simple decomposition
      return {
        task_id: `swirl-${Date.now()}`,
        original_task: task,
        steps: [
          {
            step_number: 1,
            description: task,
            reasoning: 'Single-step fallback',
            tools_needed: availableTools,
            complexity_score: 0.8,
            depends_on: [],
          },
        ],
        total_complexity: 0.8,
        estimated_time_ms: 2000,
        tools_required: availableTools,
      };
    }
  }

  /**
   * Generate overlapping sub-trajectories (SWiRL's learning approach)
   */
  private generateSubTrajectories(mainTrajectory: SWiRLTrajectory): SWiRLTrajectory[] {
    const subTrajectories: SWiRLTrajectory[] = [];
    const steps = mainTrajectory.steps;

    // Generate all possible sub-sequences (SWiRL's approach)
    for (let start = 0; start < steps.length; start++) {
      for (let end = start + 1; end <= steps.length; end++) {
        const subSteps = steps.slice(start, end);
        
        subTrajectories.push({
          task_id: `${mainTrajectory.task_id}-sub-${start}-${end}`,
          original_task: mainTrajectory.original_task,
          steps: subSteps,
          total_complexity: subSteps.reduce((sum, s) => sum + s.complexity_score, 0) / subSteps.length,
          estimated_time_ms: subSteps.length * 2000,
          tools_required: [...new Set(subSteps.flatMap(s => s.tools_needed))],
        });
      }
    }

    console.log(`   - Generated ${subTrajectories.length} overlapping sub-trajectories`);
    return subTrajectories;
  }

  /**
   * Create synthesis plan (SWiRL's approach)
   */
  private async createSynthesisPlan(trajectory: SWiRLTrajectory): Promise<string> {
    const prompt = `Given these steps, how should the final answer be synthesized?

Steps:
${trajectory.steps.map(s => `${s.step_number}. ${s.description}`).join('\n')}

Provide a brief synthesis plan (1-2 sentences):`;

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

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      return `Combine results from all ${trajectory.steps.length} steps sequentially.`;
    }
  }

  /**
   * Execute a single step with tool integration (SWiRL's approach)
   */
  async executeStep(step: SWiRLStep, context: string = ''): Promise<any> {
    console.log(`\n🔄 SWiRL: Executing step ${step.step_number}...`);
    console.log(`   - Description: ${step.description}`);
    console.log(`   - Tools needed: ${step.tools_needed.join(', ') || 'none'}`);

    // If tools needed, execute tool calls
    if (step.tools_needed.length > 0) {
      const toolResults = [];
      
      for (const tool of step.tools_needed) {
        console.log(`   - Using tool: ${tool}`);
        
        // Execute tool call (implement tool-specific logic here)
        const toolResult = await this.useTool(tool, step.description, context);
        toolResults.push({
          tool,
          query: step.description,
          result: toolResult,
        });
      }

      step.tool_calls = toolResults;
      
      // Synthesize tool results
      return this.synthesizeToolResults(step, toolResults);
    }

    // No tools needed - direct reasoning
    return this.reasonDirectly(step, context);
  }

  /**
   * Use a specific tool (SWiRL's tool integration)
   */
  private async useTool(tool: string, query: string, context: string): Promise<any> {
    // Implement tool-specific logic
    switch (tool.toLowerCase()) {
      case 'search':
      case 'web_search':
      case 'perplexity':
        return this.useWebSearch(query);
      
      case 'calculator':
      case 'math':
        return this.useCalculator(query);
      
      case 'sql':
      case 'database':
        return this.useSQLQuery(query);
      
      default:
        console.log(`   - Unknown tool: ${tool}, using direct reasoning`);
        return { tool, result: 'Tool not available', fallback: true };
    }
  }

  /**
   * Web search tool
   */
  private async useWebSearch(query: string): Promise<any> {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityKey) {
      return { result: 'Web search unavailable (no API key)', fallback: true };
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: query }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          result: data.choices?.[0]?.message?.content || 'No result',
          source: 'Perplexity',
        };
      }
    } catch (error) {
      console.error('Web search failed:', error);
    }

    return { result: 'Web search failed', fallback: true };
  }

  /**
   * Calculator tool
   */
  private async useCalculator(query: string): Promise<any> {
    // Simple math evaluation (for demo)
    try {
      // Extract math expression from query
      const mathMatch = query.match(/[\d\s+\-*/().]+/);
      if (mathMatch) {
        const expr = mathMatch[0];
        // Use Function constructor for safe eval (limited scope)
        const result = new Function(`return ${expr}`)();
        return {
          result,
          expression: expr,
          source: 'Calculator',
        };
      }
    } catch (error) {
      console.error('Calculator failed:', error);
    }

    return { result: 'Calculation failed', fallback: true };
  }

  /**
   * SQL query tool
   */
  private async useSQLQuery(query: string): Promise<any> {
    // Generate SQL query
    const { SQLGenerationRetrieval } = await import('./sql-generation-retrieval');
    const sqlGen = new SQLGenerationRetrieval();
    const dataSource = { name: 'general', type: 'database' as const, schema: [], sample_data: [] };
    const sqlResult = await sqlGen.generateSQL(query, dataSource);
    
    return {
      result: sqlResult,
      source: 'SQL Generator',
    };
  }

  /**
   * Synthesize tool results
   */
  private async synthesizeToolResults(step: SWiRLStep, toolResults: any[]): Promise<any> {
    const prompt = `Synthesize these tool results for step: ${step.description}

Tool Results:
${toolResults.map(tr => `- ${tr.tool}: ${JSON.stringify(tr.result)}`).join('\n')}

Reasoning: ${step.reasoning}

Provide a concise synthesis (2-3 sentences):`;

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

      const data = await response.json();
      return {
        synthesis: data.response.trim(),
        tool_results: toolResults,
      };
    } catch (error) {
      return {
        synthesis: `Combined results from ${toolResults.length} tools.`,
        tool_results: toolResults,
      };
    }
  }

  /**
   * Direct reasoning (no tools)
   */
  private async reasonDirectly(step: SWiRLStep, context: string): Promise<any> {
    const prompt = `${context ? context + '\n\n' : ''}Step: ${step.description}

Reasoning: ${step.reasoning}

Provide your answer:`;

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

      const data = await response.json();
      return {
        answer: data.response.trim(),
        reasoning: step.reasoning,
      };
    } catch (error) {
      return {
        answer: 'Reasoning failed',
        reasoning: step.reasoning,
      };
    }
  }
}

/**
 * Factory function
 */
export function createSWiRLDecomposer(model: string = 'qwen2.5:14b'): SWiRLDecomposer {
  return new SWiRLDecomposer(model);
}
