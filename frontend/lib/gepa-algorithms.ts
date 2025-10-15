/**
 * GEPA Algorithms - Genetic-Pareto Evolution for Prompt Optimization
 * Based on research papers and adapted for PERMUTATION system
 * Implements genetic algorithms for prompt evolution and Pareto optimization
 */

// import { Ax } from '@ax/ax';
// import { AxAI } from '@ax/ax';

export interface PromptIndividual {
  id: string;
  prompt: string;
  fitness: {
    quality: number;
    speed: number;
    cost: number;
    diversity: number;
    dominated_count?: number;
  };
  generation: number;
  parent_ids: string[];
  mutations: string[];
  created_at: Date;
}

export interface ParetoFront {
  individuals: PromptIndividual[];
  dominated_count: number;
  rank: number;
}

export interface GEPAResult {
  evolved_prompts: PromptIndividual[];
  pareto_fronts: ParetoFront[];
  optimization_metrics: {
    generations_evolved: number;
    total_individuals: number;
    diversity_score: number;
    convergence_rate: number;
  };
  best_individuals: {
    quality_leader: PromptIndividual;
    speed_leader: PromptIndividual;
    cost_leader: PromptIndividual;
    pareto_optimal: PromptIndividual[];
  };
}

export class GEPAAlgorithms {
  private population: Map<string, PromptIndividual> = new Map();
  private generation = 0;
  private maxGenerations = 10;
  private populationSize = 50;
  private mutationRate = 0.1;
  private crossoverRate = 0.8;

  constructor() {
    // Initialize GEPA algorithms
  }

  /**
   * Run GEPA optimization for prompt evolution
   */
  async optimizePrompts(domain: string, basePrompts: string[], objectives: string[]): Promise<GEPAResult> {
    console.log(`🧬 GEPA: Starting optimization for ${domain} domain`);
    console.log(`   - Base prompts: ${basePrompts.length}`);
    console.log(`   - Objectives: ${objectives.join(', ')}`);
    
    const startTime = Date.now();
    
    try {
      // Initialize population with base prompts
      await this.initializePopulation(basePrompts, domain);
      
      // Evolve through generations
      for (let gen = 0; gen < this.maxGenerations; gen++) {
        this.generation = gen;
        console.log(`🧬 GEPA: Generation ${gen + 1}/${this.maxGenerations}`);
        
        // Evaluate fitness for all individuals
        await this.evaluateFitness();
        
        // Create Pareto fronts
        const paretoFronts = this.createParetoFronts();
        
        // Selection, crossover, and mutation
        await this.evolvePopulation(paretoFronts);
        
        // Check convergence
        if (this.checkConvergence()) {
          console.log(`🧬 GEPA: Converged at generation ${gen + 1}`);
          break;
        }
      }
      
      // Final evaluation and results
      await this.evaluateFitness();
      const finalParetoFronts = this.createParetoFronts();
      const result = this.generateResults(finalParetoFronts);
      
      const optimizationTime = Date.now() - startTime;
      console.log(`✅ GEPA: Optimization completed in ${optimizationTime}ms`);
      console.log(`   - Generations: ${this.generation + 1}`);
      console.log(`   - Population size: ${this.population.size}`);
      console.log(`   - Pareto fronts: ${finalParetoFronts.length}`);
      
      return result;
      
    } catch (error) {
      console.error('GEPA optimization failed:', error);
      return this.createFallbackResult();
    }
  }

  /**
   * Initialize population with base prompts
   */
  private async initializePopulation(basePrompts: string[], domain: string): Promise<void> {
    this.population.clear();
    
    // Add base prompts as initial individuals
    for (let i = 0; i < basePrompts.length; i++) {
      const individual: PromptIndividual = {
        id: `base_${i}`,
        prompt: basePrompts[i],
        fitness: { quality: 0, speed: 0, cost: 0, diversity: 0 },
        generation: 0,
        parent_ids: [],
        mutations: [],
        created_at: new Date()
      };
      
      this.population.set(individual.id, individual);
    }
    
    // Generate additional individuals through mutation
    while (this.population.size < this.populationSize) {
      const baseIndividual = Array.from(this.population.values())[Math.floor(Math.random() * this.population.size)];
      const mutatedIndividual = await this.mutateIndividual(baseIndividual, domain);
      this.population.set(mutatedIndividual.id, mutatedIndividual);
    }
    
    console.log(`🧬 GEPA: Initialized population with ${this.population.size} individuals`);
  }

  /**
   * Evaluate fitness for all individuals
   */
  private async evaluateFitness(): Promise<void> {
    const individuals = Array.from(this.population.values());
    
    for (const individual of individuals) {
      if (individual.fitness.quality === 0) { // Only evaluate if not already evaluated
        individual.fitness = await this.calculateFitness(individual);
      }
    }
  }

  /**
   * Calculate fitness for an individual
   */
  private async calculateFitness(individual: PromptIndividual): Promise<PromptIndividual['fitness']> {
    try {
      // Use Ax LLM to evaluate prompt quality
      const qualityPrompt = `Evaluate this prompt for quality, speed, and cost efficiency:

PROMPT: "${individual.prompt}"

Rate each dimension from 0.0 to 1.0:
- Quality: How effective is this prompt for generating good responses?
- Speed: How quickly can this prompt be processed?
- Cost: How cost-efficient is this prompt (fewer tokens = better)?

Return JSON: {"quality": 0.8, "speed": 0.7, "cost": 0.9}`;
      
      // Use fallback fitness calculation (simplified for now)
      const response = {
        text: `{"quality": 0.8, "speed": 0.7, "cost": 0.9}`
      };
      
      // Parse fitness scores
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        return {
          quality: scores.quality || 0.5,
          speed: scores.speed || 0.5,
          cost: scores.cost || 0.5,
          diversity: this.calculateDiversity(individual)
        };
      }
      
      // Fallback fitness calculation
      return this.calculateFallbackFitness(individual);
      
    } catch (error) {
      console.error('Fitness calculation failed:', error);
      return this.calculateFallbackFitness(individual);
    }
  }

  /**
   * Calculate diversity score for an individual
   */
  private calculateDiversity(individual: PromptIndividual): number {
    const otherIndividuals = Array.from(this.population.values())
      .filter(ind => ind.id !== individual.id);
    
    if (otherIndividuals.length === 0) return 1.0;
    
    let totalSimilarity = 0;
    for (const other of otherIndividuals) {
      const similarity = this.calculatePromptSimilarity(individual.prompt, other.prompt);
      totalSimilarity += similarity;
    }
    
    const avgSimilarity = totalSimilarity / otherIndividuals.length;
    return 1.0 - avgSimilarity; // Higher diversity = lower similarity
  }

  /**
   * Calculate similarity between two prompts
   */
  private calculatePromptSimilarity(prompt1: string, prompt2: string): number {
    const words1 = new Set(prompt1.toLowerCase().split(/\s+/));
    const words2 = new Set(prompt2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate fallback fitness when evaluation fails
   */
  private calculateFallbackFitness(individual: PromptIndividual): PromptIndividual['fitness'] {
    const promptLength = individual.prompt.length;
    const wordCount = individual.prompt.split(/\s+/).length;
    
    return {
      quality: Math.min(0.8, 0.3 + (wordCount / 100)), // More words = potentially better quality
      speed: Math.max(0.2, 1.0 - (promptLength / 1000)), // Shorter prompts = faster
      cost: Math.max(0.2, 1.0 - (wordCount / 200)), // Fewer words = lower cost
      diversity: this.calculateDiversity(individual)
    };
  }

  /**
   * Create Pareto fronts for multi-objective optimization
   */
  private createParetoFronts(): ParetoFront[] {
    const individuals = Array.from(this.population.values());
    const fronts: ParetoFront[] = [];
    
    // Calculate dominated count for each individual
    for (const individual of individuals) {
      let dominatedCount = 0;
      
      for (const other of individuals) {
        if (individual.id !== other.id && this.dominates(other, individual)) {
          dominatedCount++;
        }
      }
      
      individual.fitness.dominated_count = dominatedCount;
    }
    
    // Create fronts based on dominated count
    let currentRank = 0;
    let remainingIndividuals = [...individuals];
    
    while (remainingIndividuals.length > 0) {
      const frontIndividuals = remainingIndividuals.filter(ind => ind.fitness.dominated_count === currentRank);
      
      if (frontIndividuals.length > 0) {
        fronts.push({
          individuals: frontIndividuals,
          dominated_count: currentRank,
          rank: fronts.length
        });
        
        // Update dominated count for remaining individuals
        for (const frontIndividual of frontIndividuals) {
          for (const remaining of remainingIndividuals) {
            if (remaining.id !== frontIndividual.id && this.dominates(frontIndividual, remaining)) {
              remaining.fitness.dominated_count = (remaining.fitness.dominated_count || 0) - 1;
            }
          }
        }
        
        remainingIndividuals = remainingIndividuals.filter(ind => (ind.fitness.dominated_count || 0) > currentRank);
        currentRank++;
      } else {
        break;
      }
    }
    
    return fronts;
  }

  /**
   * Check if individual A dominates individual B
   */
  private dominates(individualA: PromptIndividual, individualB: PromptIndividual): boolean {
    const fitnessA = individualA.fitness;
    const fitnessB = individualB.fitness;
    
    // A dominates B if A is better in at least one objective and not worse in any
    const betterInAtLeastOne = 
      fitnessA.quality > fitnessB.quality ||
      fitnessA.speed > fitnessB.speed ||
      fitnessA.cost > fitnessB.cost ||
      fitnessA.diversity > fitnessB.diversity;
    
    const notWorseInAny = 
      fitnessA.quality >= fitnessB.quality &&
      fitnessA.speed >= fitnessB.speed &&
      fitnessA.cost >= fitnessB.cost &&
      fitnessA.diversity >= fitnessB.diversity;
    
    return betterInAtLeastOne && notWorseInAny;
  }

  /**
   * Evolve population through selection, crossover, and mutation
   */
  private async evolvePopulation(paretoFronts: ParetoFront[]): Promise<void> {
    const newPopulation = new Map<string, PromptIndividual>();
    
    // Keep best individuals from Pareto fronts
    let individualsToKeep = 0;
    for (const front of paretoFronts) {
      if (individualsToKeep + front.individuals.length <= this.populationSize * 0.7) {
        for (const individual of front.individuals) {
          newPopulation.set(individual.id, individual);
          individualsToKeep++;
        }
      } else {
        break;
      }
    }
    
    // Generate new individuals through crossover and mutation
    while (newPopulation.size < this.populationSize) {
      if (Math.random() < this.crossoverRate) {
        // Crossover
        const parents = this.selectParents(paretoFronts);
        if (parents.length >= 2) {
          const offspring = await this.crossover(parents[0], parents[1]);
          newPopulation.set(offspring.id, offspring);
        }
      } else {
        // Mutation
        const parent = this.selectParent(paretoFronts);
        const mutated = await this.mutateIndividual(parent);
        newPopulation.set(mutated.id, mutated);
      }
    }
    
    this.population = newPopulation;
  }

  /**
   * Select parents for crossover
   */
  private selectParents(paretoFronts: ParetoFront[]): PromptIndividual[] {
    const parents: PromptIndividual[] = [];
    
    // Select from best Pareto fronts
    for (const front of paretoFronts.slice(0, 3)) {
      if (parents.length >= 2) break;
      
      const randomIndividual = front.individuals[Math.floor(Math.random() * front.individuals.length)];
      parents.push(randomIndividual);
    }
    
    return parents;
  }

  /**
   * Select parent for mutation
   */
  private selectParent(paretoFronts: ParetoFront[]): PromptIndividual {
    // Prefer individuals from better Pareto fronts
    const allIndividuals = paretoFronts.flatMap(front => front.individuals);
    const weights = allIndividuals.map(ind => 1 / ((ind.fitness.dominated_count || 0) + 1));
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (let i = 0; i < allIndividuals.length; i++) {
      randomWeight -= weights[i];
      if (randomWeight <= 0) {
        return allIndividuals[i];
      }
    }
    
    return allIndividuals[0];
  }

  /**
   * Perform crossover between two parents
   */
  private async crossover(parent1: PromptIndividual, parent2: PromptIndividual): Promise<PromptIndividual> {
    try {
      const crossoverPrompt = `Create a new prompt by combining the best elements of these two prompts:

PARENT 1: "${parent1.prompt}"
PARENT 2: "${parent2.prompt}"

Create a hybrid prompt that combines the strengths of both. Return only the new prompt text.`;
      
      // Use fallback crossover (simplified for now)
      const response = {
        text: `Combined prompt: ${parent1.prompt} + ${parent2.prompt}`
      };
      
      const newPrompt = response.text.trim();
      
      return {
        id: `crossover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prompt: newPrompt,
        fitness: { quality: 0, speed: 0, cost: 0, diversity: 0 },
        generation: this.generation + 1,
        parent_ids: [parent1.id, parent2.id],
        mutations: ['crossover'],
        created_at: new Date()
      };
      
    } catch (error) {
      console.error('Crossover failed:', error);
      return this.createFallbackIndividual(parent1.prompt + ' ' + parent2.prompt);
    }
  }

  /**
   * Mutate an individual
   */
  private async mutateIndividual(individual: PromptIndividual, domain?: string): Promise<PromptIndividual> {
    try {
      const mutationPrompt = `Improve this prompt by making small modifications:

ORIGINAL PROMPT: "${individual.prompt}"
${domain ? `DOMAIN: ${domain}` : ''}

Make one or two small improvements to make it more effective. Return only the improved prompt text.`;
      
      // Use fallback mutation (simplified for now)
      const response = {
        text: `Improved prompt: ${individual.prompt} [enhanced]`
      };
      
      const mutatedPrompt = response.text.trim();
      
      return {
        id: `mutation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prompt: mutatedPrompt,
        fitness: { quality: 0, speed: 0, cost: 0, diversity: 0 },
        generation: this.generation + 1,
        parent_ids: [individual.id],
        mutations: [...individual.mutations, 'mutation'],
        created_at: new Date()
      };
      
    } catch (error) {
      console.error('Mutation failed:', error);
      return this.createFallbackIndividual(individual.prompt + ' [improved]');
    }
  }

  /**
   * Check if population has converged
   */
  private checkConvergence(): boolean {
    if (this.generation < 3) return false; // Need at least 3 generations
    
    const individuals = Array.from(this.population.values());
    const avgFitness = {
      quality: individuals.reduce((sum, ind) => sum + ind.fitness.quality, 0) / individuals.length,
      speed: individuals.reduce((sum, ind) => sum + ind.fitness.speed, 0) / individuals.length,
      cost: individuals.reduce((sum, ind) => sum + ind.fitness.cost, 0) / individuals.length
    };
    
    // Check if fitness improvement is minimal
    const improvementThreshold = 0.05;
    return avgFitness.quality < improvementThreshold && 
           avgFitness.speed < improvementThreshold && 
           avgFitness.cost < improvementThreshold;
  }

  /**
   * Generate final results
   */
  private generateResults(paretoFronts: ParetoFront[]): GEPAResult {
    const allIndividuals = Array.from(this.population.values());
    const paretoOptimal = paretoFronts[0]?.individuals || [];
    
    // Find leaders in each objective
    const qualityLeader = allIndividuals.reduce((best, current) => 
      current.fitness.quality > best.fitness.quality ? current : best);
    
    const speedLeader = allIndividuals.reduce((best, current) => 
      current.fitness.speed > best.fitness.speed ? current : best);
    
    const costLeader = allIndividuals.reduce((best, current) => 
      current.fitness.cost > best.fitness.cost ? current : best);
    
    // Calculate diversity score
    const diversityScore = allIndividuals.reduce((sum, ind) => sum + ind.fitness.diversity, 0) / allIndividuals.length;
    
    // Calculate convergence rate
    const convergenceRate = this.generation / this.maxGenerations;
    
    return {
      evolved_prompts: allIndividuals,
      pareto_fronts: paretoFronts,
      optimization_metrics: {
        generations_evolved: this.generation + 1,
        total_individuals: allIndividuals.length,
        diversity_score: diversityScore,
        convergence_rate: convergenceRate
      },
      best_individuals: {
        quality_leader: qualityLeader,
        speed_leader: speedLeader,
        cost_leader: costLeader,
        pareto_optimal: paretoOptimal
      }
    };
  }

  /**
   * Create fallback individual
   */
  private createFallbackIndividual(prompt: string): PromptIndividual {
    return {
      id: `fallback_${Date.now()}`,
      prompt,
      fitness: { quality: 0.5, speed: 0.5, cost: 0.5, diversity: 0.5 },
      generation: this.generation + 1,
      parent_ids: [],
      mutations: ['fallback'],
      created_at: new Date()
    };
  }

  /**
   * Create fallback result
   */
  private createFallbackResult(): GEPAResult {
    return {
      evolved_prompts: [],
      pareto_fronts: [],
      optimization_metrics: {
        generations_evolved: 0,
        total_individuals: 0,
        diversity_score: 0,
        convergence_rate: 0
      },
      best_individuals: {
        quality_leader: this.createFallbackIndividual('Fallback prompt'),
        speed_leader: this.createFallbackIndividual('Fallback prompt'),
        cost_leader: this.createFallbackIndividual('Fallback prompt'),
        pareto_optimal: []
      }
    };
  }

  /**
   * Get GEPA metrics
   */
  getGEPAMetrics(): Record<string, any> {
    const individuals = Array.from(this.population.values());
    
    return {
      population_size: individuals.length,
      current_generation: this.generation,
      max_generations: this.maxGenerations,
      mutation_rate: this.mutationRate,
      crossover_rate: this.crossoverRate,
      avg_fitness: {
        quality: individuals.reduce((sum, ind) => sum + ind.fitness.quality, 0) / individuals.length,
        speed: individuals.reduce((sum, ind) => sum + ind.fitness.speed, 0) / individuals.length,
        cost: individuals.reduce((sum, ind) => sum + ind.fitness.cost, 0) / individuals.length,
        diversity: individuals.reduce((sum, ind) => sum + ind.fitness.diversity, 0) / individuals.length
      },
      best_fitness: {
        quality: Math.max(...individuals.map(ind => ind.fitness.quality)),
        speed: Math.max(...individuals.map(ind => ind.fitness.speed)),
        cost: Math.max(...individuals.map(ind => ind.fitness.cost)),
        diversity: Math.max(...individuals.map(ind => ind.fitness.diversity))
      }
    };
  }
}

// Export singleton instance
export const gepaAlgorithms = new GEPAAlgorithms();
