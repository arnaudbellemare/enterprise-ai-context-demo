/**
 * GEPA: Reflective Prompt Evolution
 * 
 * Implements the full GEPA process from the flowchart:
 * 1. Budget-controlled iteration
 * 2. Reflective Prompt Mutation
 * 3. System Aware Merge
 * 4. Pareto-based Candidate Filtering
 * 5. Evolutionary lineage tracking
 */

export interface PromptCandidate {
  id: string;
  text: string;
  parent_ids: string[]; // For lineage tracking
  generation: number;
  performance: {
    accuracy: number;
    latency_ms: number;
    cost_per_call: number;
    risk_score: number;
  };
  evaluation_results: {
    [taskId: string]: {
      success: boolean;
      score: number;
      feedback: string;
    };
  };
  metadata: {
    created_at: string;
    strategy_used: 'mutation' | 'merge' | 'initial';
    mutation_source?: string;
    merge_parents?: string[];
  };
}

export interface CandidatePool {
  candidates: PromptCandidate[];
  scores_matrix: {
    [candidateId: string]: {
      [taskId: string]: boolean; // true = good performance, false = poor
    };
  };
  pareto_frontier: string[]; // IDs of non-dominated candidates
  evolution_budget: number;
  current_generation: number;
}

export interface EvolutionConfig {
  budget: number;
  minibatch_size: number;
  mutation_probability: number;
  merge_probability: number;
  performance_threshold: number;
  tasks: string[];
}

export interface ExecutionFeedback {
  task_id: string;
  success: boolean;
  score: number;
  feedback_text: string;
  execution_time_ms: number;
  cost: number;
}

/**
 * GEPA Evolution Engine
 * Implements the full reflective prompt evolution process
 */
export class GEPAEvolutionEngine {
  private pool: CandidatePool;
  private config: EvolutionConfig;
  private training_data: any[];

  constructor(config: EvolutionConfig, initialPrompts: string[] = []) {
    this.config = config;
    this.training_data = this.generateTrainingData();
    
    // Initialize candidate pool
    this.pool = {
      candidates: this.initializeCandidates(initialPrompts),
      scores_matrix: {},
      pareto_frontier: [],
      evolution_budget: config.budget,
      current_generation: 0
    };

    this.evaluateAllCandidates();
    this.updateParetoFrontier();
  }

  /**
   * Main evolution loop - "While Budget > 0"
   */
  async evolve(): Promise<CandidatePool> {
    console.log('🧬 Starting GEPA Evolution Process');
    console.log(`Initial budget: ${this.pool.evolution_budget}`);
    console.log(`Initial candidates: ${this.pool.candidates.length}`);

    while (this.pool.evolution_budget > 0) {
      console.log(`\n🔄 Generation ${this.pool.current_generation + 1}`);
      console.log(`Budget remaining: ${this.pool.evolution_budget}`);

      // Propose new candidate
      const pNew = await this.proposeNewCandidate();
      
      // Perform minibatch evaluation
      const minibatchResults = await this.performMinibatchEval(pNew);
      
      // Check if performance improved
      const performanceImproved = this.checkPerformanceImprovement(pNew, minibatchResults);
      
      if (performanceImproved) {
        console.log(`✅ Performance improved - adding ${pNew.id} to pool`);
        
        // Eval on all tasks + Add to pool
        await this.evaluateOnAllTasks(pNew);
        this.pool.candidates.push(pNew);
        
        // Update scores matrix and Pareto frontier
        this.updateScoresMatrix(pNew);
        this.updateParetoFrontier();
        
        console.log(`📊 Pool size: ${this.pool.candidates.length}, Pareto frontier: ${this.pool.pareto_frontier.length}`);
      } else {
        console.log(`❌ Performance not improved - discarding ${pNew.id}`);
      }

      // Consume budget
      this.pool.evolution_budget -= this.config.minibatch_size;
      this.pool.current_generation++;
    }

    console.log('\n🎉 Evolution complete!');
    console.log(`Final pool size: ${this.pool.candidates.length}`);
    console.log(`Final Pareto frontier: ${this.pool.pareto_frontier.length} candidates`);
    
    return this.pool;
  }

  /**
   * Propose new candidate using mutation or merge strategy
   */
  private async proposeNewCandidate(): Promise<PromptCandidate> {
    const strategy = Math.random() < this.config.mutation_probability ? 'mutation' : 'merge';
    
    if (strategy === 'mutation') {
      return this.reflectivePromptMutation();
    } else {
      return this.systemAwareMerge();
    }
  }

  /**
   * Reflective Prompt Mutation
   * 1. Sample 1 candidate for mutation
   * 2. Rollouts: Execute on minibatch
   * 3. Obtain text feedbacks using μt
   * 4. Reflect and propose new prompt
   */
  private async reflectivePromptMutation(): Promise<PromptCandidate> {
    // Sample 1 candidate from Pareto frontier
    const parent = this.sampleFromParetoFrontier();
    console.log(`🧬 Mutating candidate: ${parent.id}`);

    // Sample minibatch
    const minibatch = this.sampleMinibatch();
    
    // Execute parent on minibatch to get feedback
    const feedback = await this.executeOnMinibatch(parent, minibatch);
    
    // Reflect and propose new prompt based on feedback
    const mutatedText = this.reflectAndMutate(parent.text, feedback);
    
    const newCandidate: PromptCandidate = {
      id: `P${this.pool.candidates.length + 1}`,
      text: mutatedText,
      parent_ids: [parent.id],
      generation: this.pool.current_generation + 1,
      performance: { ...parent.performance }, // Will be updated during evaluation
      evaluation_results: {},
      metadata: {
        created_at: new Date().toISOString(),
        strategy_used: 'mutation',
        mutation_source: parent.id
      }
    };

    console.log(`🔄 Generated mutation: ${newCandidate.id} from ${parent.id}`);
    return newCandidate;
  }

  /**
   * System Aware Merge
   * 1. Sample 2 candidates to merge
   * 2. Strategically select prompt for each module
   * 3. If module evolved in P1 but not P2, select from P1
   */
  private async systemAwareMerge(): Promise<PromptCandidate> {
    // Sample 2 candidates from Pareto frontier
    const [parent1, parent2] = this.sampleTwoFromParetoFrontier();
    console.log(`🔗 Merging candidates: ${parent1.id} + ${parent2.id}`);

    // Strategically merge modules
    const mergedText = this.strategicModuleMerge(parent1, parent2);
    
    const newCandidate: PromptCandidate = {
      id: `P${this.pool.candidates.length + 1}`,
      text: mergedText,
      parent_ids: [parent1.id, parent2.id],
      generation: this.pool.current_generation + 1,
      performance: { ...parent1.performance }, // Will be updated during evaluation
      evaluation_results: {},
      metadata: {
        created_at: new Date().toISOString(),
        strategy_used: 'merge',
        merge_parents: [parent1.id, parent2.id]
      }
    };

    console.log(`🔗 Generated merge: ${newCandidate.id} from ${parent1.id} + ${parent2.id}`);
    return newCandidate;
  }

  /**
   * Perform minibatch evaluation
   */
  private async performMinibatchEval(candidate: PromptCandidate): Promise<ExecutionFeedback[]> {
    const minibatch = this.sampleMinibatch();
    return this.executeOnMinibatch(candidate, minibatch);
  }

  /**
   * Check if performance improved compared to parent(s)
   */
  private checkPerformanceImprovement(
    candidate: PromptCandidate, 
    results: ExecutionFeedback[]
  ): boolean {
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const successRate = results.filter(r => r.success).length / results.length;
    
    // Check against parents
    for (const parentId of candidate.parent_ids) {
      const parent = this.pool.candidates.find(c => c.id === parentId);
      if (!parent) continue;
      
      const parentAvgScore = this.getAverageScore(parent);
      const parentSuccessRate = this.getSuccessRate(parent);
      
      // Improvement if better score OR better success rate
      if (avgScore > parentAvgScore * 1.05 || successRate > parentSuccessRate * 1.05) {
        return true;
      }
    }
    
    // Also check against current Pareto frontier average
    const frontierAvg = this.getParetoFrontierAverage();
    return avgScore > frontierAvg * 1.02;
  }

  /**
   * Evaluate candidate on all tasks
   */
  private async evaluateOnAllTasks(candidate: PromptCandidate): Promise<void> {
    for (const taskId of this.config.tasks) {
      const result = await this.evaluateOnTask(candidate, taskId);
      candidate.evaluation_results[taskId] = result;
    }
  }

  /**
   * Update Pareto frontier based on non-dominance
   */
  private updateParetoFrontier(): void {
    const candidates = this.pool.candidates;
    const frontier: string[] = [];
    
    for (let i = 0; i < candidates.length; i++) {
      let dominated = false;
      
      for (let j = 0; j < candidates.length; j++) {
        if (i === j) continue;
        
        if (this.dominates(candidates[j], candidates[i])) {
          dominated = true;
          break;
        }
      }
      
      if (!dominated) {
        frontier.push(candidates[i].id);
      }
    }
    
    this.pool.pareto_frontier = frontier;
  }

  /**
   * Check if candidate1 dominates candidate2
   */
  private dominates(c1: PromptCandidate, c2: PromptCandidate): boolean {
    const score1 = this.getAverageScore(c1);
    const score2 = this.getAverageScore(c2);
    const success1 = this.getSuccessRate(c1);
    const success2 = this.getSuccessRate(c2);
    
    return score1 >= score2 && success1 >= success2 && 
           (score1 > score2 || success1 > success2);
  }

  /**
   * Strategic module merge - evolve modules independently
   */
  private strategicModuleMerge(parent1: PromptCandidate, parent2: PromptCandidate): string {
    // Parse prompts into modules (simplified)
    const modules1 = this.parseIntoModules(parent1.text);
    const modules2 = this.parseIntoModules(parent2.text);
    
    const mergedModules: string[] = [];
    
    // For each module position, choose the "more evolved" one
    for (let i = 0; i < Math.max(modules1.length, modules2.length); i++) {
      const module1 = modules1[i] || '';
      const module2 = modules2[i] || '';
      
      // Heuristic: if module evolved in P1 but not P2, select P1
      const module1Evolution = this.getModuleEvolutionLevel(module1);
      const module2Evolution = this.getModuleEvolutionLevel(module2);
      
      if (module1Evolution > module2Evolution) {
        mergedModules.push(module1);
      } else if (module2Evolution > module1Evolution) {
        mergedModules.push(module2);
      } else {
        // Equal evolution - choose randomly or combine
        mergedModules.push(Math.random() < 0.5 ? module1 : module2);
      }
    }
    
    return mergedModules.join('\n\n');
  }

  /**
   * Reflect and mutate based on execution feedback
   */
  private reflectAndMutate(originalText: string, feedback: ExecutionFeedback[]): string {
    // Analyze feedback to identify weaknesses
    const weaknesses = this.analyzeWeaknesses(feedback);
    const strengths = this.analyzeStrengths(feedback);
    
    let mutatedText = originalText;
    
    // Apply mutations based on feedback
    if (weaknesses.includes('accuracy')) {
      mutatedText = this.addAccuracyImprovements(mutatedText);
    }
    
    if (weaknesses.includes('clarity')) {
      mutatedText = this.addClarityImprovements(mutatedText);
    }
    
    if (weaknesses.includes('completeness')) {
      mutatedText = this.addCompletenessImprovements(mutatedText);
    }
    
    // Preserve strengths
    if (strengths.includes('structure')) {
      mutatedText = this.preserveStructure(mutatedText);
    }
    
    return mutatedText;
  }

  // Helper methods
  private initializeCandidates(initialPrompts: string[]): PromptCandidate[] {
    return initialPrompts.map((prompt, index) => ({
      id: `P${index}`,
      text: prompt,
      parent_ids: [],
      generation: 0,
      performance: {
        accuracy: 0.5,
        latency_ms: 1000,
        cost_per_call: 0.01,
        risk_score: 0.3
      },
      evaluation_results: {},
      metadata: {
        created_at: new Date().toISOString(),
        strategy_used: 'initial'
      }
    }));
  }

  private sampleFromParetoFrontier(): PromptCandidate {
    const frontierCandidates = this.pool.candidates.filter(c => 
      this.pool.pareto_frontier.includes(c.id)
    );
    return frontierCandidates[Math.floor(Math.random() * frontierCandidates.length)];
  }

  private sampleTwoFromParetoFrontier(): [PromptCandidate, PromptCandidate] {
    const frontierCandidates = this.pool.candidates.filter(c => 
      this.pool.pareto_frontier.includes(c.id)
    );
    
    const idx1 = Math.floor(Math.random() * frontierCandidates.length);
    let idx2 = Math.floor(Math.random() * frontierCandidates.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * frontierCandidates.length);
    }
    
    return [frontierCandidates[idx1], frontierCandidates[idx2]];
  }

  private sampleMinibatch(): any[] {
    const size = Math.min(this.config.minibatch_size, this.training_data.length);
    const shuffled = [...this.training_data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
  }

  private async executeOnMinibatch(
    candidate: PromptCandidate, 
    minibatch: any[]
  ): Promise<ExecutionFeedback[]> {
    // Simulate execution on minibatch
    return minibatch.map((item, index) => ({
      task_id: `task_${index}`,
      success: Math.random() > 0.3, // 70% success rate
      score: Math.random() * 100,
      feedback_text: this.generateFeedback(candidate, item),
      execution_time_ms: candidate.performance.latency_ms + (Math.random() * 200 - 100),
      cost: candidate.performance.cost_per_call
    }));
  }

  private async evaluateOnTask(candidate: PromptCandidate, taskId: string) {
    // Simulate task evaluation
    const success = Math.random() > 0.2; // 80% success rate
    const score = Math.random() * 100;
    
    return {
      success,
      score,
      feedback: this.generateTaskFeedback(candidate, taskId)
    };
  }

  private evaluateAllCandidates(): void {
    for (const candidate of this.pool.candidates) {
      for (const taskId of this.config.tasks) {
        candidate.evaluation_results[taskId] = {
          success: Math.random() > 0.3,
          score: Math.random() * 100,
          feedback: `Initial evaluation for ${taskId}`
        };
      }
    }
  }

  private updateScoresMatrix(candidate: PromptCandidate): void {
    this.pool.scores_matrix[candidate.id] = {};
    
    for (const [taskId, result] of Object.entries(candidate.evaluation_results)) {
      this.pool.scores_matrix[candidate.id][taskId] = result.success;
    }
  }

  private generateTrainingData(): any[] {
    // Generate synthetic training data
    const data = [];
    for (let i = 0; i < 100; i++) {
      data.push({
        id: i,
        content: `Training sample ${i}`,
        task_type: ['analysis', 'classification', 'generation'][i % 3]
      });
    }
    return data;
  }

  private generateFeedback(candidate: PromptCandidate, item: any): string {
    const feedbacks = [
      'Good structure but could be more detailed',
      'Accurate but lacks clarity',
      'Comprehensive but too verbose',
      'Clear and concise, well done',
      'Good analysis but missing key points',
      'Excellent reasoning, very thorough'
    ];
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  }

  private generateTaskFeedback(candidate: PromptCandidate, taskId: string): string {
    return `Evaluation feedback for ${taskId}: ${this.generateFeedback(candidate, {})}`;
  }

  private getAverageScore(candidate: PromptCandidate): number {
    const scores = Object.values(candidate.evaluation_results).map(r => r.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private getSuccessRate(candidate: PromptCandidate): number {
    const results = Object.values(candidate.evaluation_results);
    return results.filter(r => r.success).length / results.length;
  }

  private getParetoFrontierAverage(): number {
    const frontierCandidates = this.pool.candidates.filter(c => 
      this.pool.pareto_frontier.includes(c.id)
    );
    
    if (frontierCandidates.length === 0) return 0;
    
    const avgScores = frontierCandidates.map(c => this.getAverageScore(c));
    return avgScores.reduce((sum, score) => sum + score, 0) / avgScores.length;
  }

  private parseIntoModules(text: string): string[] {
    // Simple module parsing - split by double newlines
    return text.split('\n\n').filter(module => module.trim().length > 0);
  }

  private getModuleEvolutionLevel(module: string): number {
    // Heuristic: longer, more detailed modules are "more evolved"
    const length = module.length;
    const detailIndicators = (module.match(/[0-9]+\.|•|✓|→/g) || []).length;
    const technicalTerms = (module.match(/\b(analysis|evaluate|assess|comprehensive|detailed|thorough)\b/gi) || []).length;
    
    return length * 0.1 + detailIndicators * 2 + technicalTerms * 1;
  }

  private analyzeWeaknesses(feedback: ExecutionFeedback[]): string[] {
    const weaknesses = [];
    const lowScores = feedback.filter(f => f.score < 60);
    const failures = feedback.filter(f => !f.success);
    
    if (lowScores.length > feedback.length * 0.3) weaknesses.push('accuracy');
    if (failures.length > feedback.length * 0.2) weaknesses.push('reliability');
    
    // Analyze feedback text
    const feedbackText = feedback.map(f => f.feedback_text).join(' ').toLowerCase();
    if (feedbackText.includes('unclear') || feedbackText.includes('confusing')) {
      weaknesses.push('clarity');
    }
    if (feedbackText.includes('missing') || feedbackText.includes('incomplete')) {
      weaknesses.push('completeness');
    }
    
    return weaknesses;
  }

  private analyzeStrengths(feedback: ExecutionFeedback[]): string[] {
    const strengths = [];
    const highScores = feedback.filter(f => f.score > 80);
    
    if (highScores.length > feedback.length * 0.5) strengths.push('accuracy');
    
    const feedbackText = feedback.map(f => f.feedback_text).join(' ').toLowerCase();
    if (feedbackText.includes('clear') || feedbackText.includes('well-structured')) {
      strengths.push('structure');
    }
    if (feedbackText.includes('comprehensive') || feedbackText.includes('thorough')) {
      strengths.push('completeness');
    }
    
    return strengths;
  }

  private addAccuracyImprovements(text: string): string {
    return text + '\n\nEnsure all analysis is data-driven and supported by evidence.';
  }

  private addClarityImprovements(text: string): string {
    return text + '\n\nUse clear, concise language. Avoid jargon when possible.';
  }

  private addCompletenessImprovements(text: string): string {
    return text + '\n\nCover all relevant aspects comprehensively.';
  }

  private preserveStructure(text: string): string {
    // Don't modify well-structured text
    return text;
  }

  // Public methods for accessing results
  getPool(): CandidatePool {
    return this.pool;
  }

  getEvolutionHistory(): any[] {
    return this.pool.candidates.map(c => ({
      id: c.id,
      generation: c.generation,
      parent_ids: c.parent_ids,
      strategy: c.metadata.strategy_used,
      average_score: this.getAverageScore(c),
      success_rate: this.getSuccessRate(c)
    }));
  }
}
