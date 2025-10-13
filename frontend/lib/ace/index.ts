/**
 * ACE Framework - Main Orchestrator
 * 
 * Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models
 * Based on arXiv:2510.04618v1
 * 
 * Main orchestrator that coordinates Generator, Reflector, Curator, and Refiner
 * for both offline and online context adaptation.
 */

import { ACEGenerator } from './generator';
import { ACEReflector } from './reflector';
import { ACECurator } from './curator';
import { PlaybookRefiner, LazyRefiner } from './refiner';
import {
  Playbook,
  DeltaContext,
  ACEConfig,
  ACEAdaptationResult,
  ExecutionFeedback,
  DEFAULT_ACE_CONFIG,
  createEmptyPlaybook,
  calculatePlaybookStats
} from './types';

export * from './types';
export * from './generator';
export * from './reflector';
export * from './curator';
export * from './refiner';

/**
 * ACE - Main Framework Class
 */
export class ACE {
  private generator: ACEGenerator;
  private reflector: ACEReflector;
  private curator: ACECurator;
  private refiner: PlaybookRefiner;
  private lazyRefiner: LazyRefiner;
  private config: ACEConfig;
  private playbook: Playbook;

  constructor(
    config: Partial<ACEConfig> = {},
    llm?: any,
    embeddingClient?: any
  ) {
    this.config = { ...DEFAULT_ACE_CONFIG, ...config };

    // Initialize components
    this.generator = new ACEGenerator({}, llm);
    this.reflector = new ACEReflector({ max_iterations: this.config.max_reflector_iterations }, llm);
    this.curator = new ACECurator({}, llm);
    this.refiner = new PlaybookRefiner({
      deduplication_threshold: this.config.deduplication_threshold,
      prune_threshold: this.config.prune_threshold
    }, embeddingClient);
    this.lazyRefiner = new LazyRefiner(this.refiner, this.config.max_context_tokens);

    // Initialize empty playbook
    this.playbook = createEmptyPlaybook();

    console.log('🚀 ACE Framework initialized');
    console.log(`   Max reflector iterations: ${this.config.max_reflector_iterations}`);
    console.log(`   Max context tokens: ${this.config.max_context_tokens}`);
    console.log(`   Deduplication threshold: ${this.config.deduplication_threshold}`);
  }

  /**
   * Offline Adaptation: Learn from training dataset
   */
  async adaptOffline(
    trainingData: Array<{ task: string; ground_truth?: any; context?: any }>,
    epochs: number = this.config.max_epochs
  ): Promise<ACEAdaptationResult> {
    console.log(`\n📚 ACE Offline Adaptation`);
    console.log(`   Training samples: ${trainingData.length}`);
    console.log(`   Epochs: ${epochs}`);

    const startTime = Date.now();
    const initialPlaybook = { ...this.playbook };
    let deltasApplied = 0;
    let bulletsAdded = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      console.log(`\n📖 Epoch ${epoch + 1}/${epochs}`);

      for (let i = 0; i < trainingData.length; i++) {
        const sample = trainingData[i];
        console.log(`\n  Sample ${i + 1}/${trainingData.length}: ${sample.task.substring(0, 60)}...`);

        // Generate trajectory
        const { trajectory, feedback } = await this.generator.generateWithFeedback(
          sample.task,
          this.playbook,
          sample.ground_truth,
          sample.context
        );

        // Extract insights
        const { insights } = await this.reflector.extractInsights(trajectory, feedback, this.playbook);

        // Create delta
        const { delta } = await this.curator.createDelta(insights, this.playbook);

        // Merge delta
        const bulletsBefore = this.playbook.bullets.length;
        this.playbook = this.curator.mergeDelta(this.playbook, delta);
        const bulletsAfter = this.playbook.bullets.length;

        deltasApplied++;
        bulletsAdded += (bulletsAfter - bulletsBefore);

        // Lazy refinement
        this.playbook = await this.lazyRefiner.refineIfNeeded(this.playbook);
      }

      // Full refinement after each epoch
      console.log(`\n  🔧 End-of-epoch refinement...`);
      this.playbook = await this.refiner.refine(this.playbook);
    }

    const endTime = Date.now();
    const stats = calculatePlaybookStats(this.playbook);

    console.log(`\n✅ Offline Adaptation Complete`);
    console.log(`   Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log(`   Deltas applied: ${deltasApplied}`);
    console.log(`   Bullets added: ${bulletsAdded}`);
    console.log(`   Final playbook: ${this.playbook.bullets.length} bullets`);
    console.log(`   Quality score: ${(stats.quality_score * 100).toFixed(1)}%`);

    return {
      initial_playbook: initialPlaybook,
      final_playbook: this.playbook,
      num_samples_processed: trainingData.length * epochs,
      num_deltas_applied: deltasApplied,
      total_bullets_added: bulletsAdded,
      total_bullets_pruned: 0, // TODO: track this
      performance_improvement: 0, // TODO: measure this
      adaptation_time_ms: endTime - startTime
    };
  }

  /**
   * Online Adaptation: Learn from test-time examples
   */
  async adaptOnline(
    task: string,
    ground_truth?: any,
    context?: any
  ): Promise<{ result: any; playbook: Playbook }> {
    console.log(`\n🔄 ACE Online Adaptation`);

    // Generate trajectory with current playbook
    const { trajectory, feedback } = await this.generator.generateWithFeedback(
      task,
      this.playbook,
      ground_truth,
      context
    );

    // Extract insights
    const { insights } = await this.reflector.extractInsights(trajectory, feedback, this.playbook);

    // Create and merge delta
    const { delta } = await this.curator.createDelta(insights, this.playbook);
    this.playbook = this.curator.mergeDelta(this.playbook, delta);

    // Lazy refinement
    this.playbook = await this.lazyRefiner.refineIfNeeded(this.playbook);

    return {
      result: trajectory.final_answer,
      playbook: this.playbook
    };
  }

  /**
   * Execute task with current playbook (no learning)
   */
  async execute(
    task: string,
    context?: any
  ): Promise<any> {
    const { trajectory } = await this.generator.generateTrajectory(task, this.playbook, context);
    return trajectory.final_answer;
  }

  /**
   * Get current playbook
   */
  getPlaybook(): Playbook {
    return this.playbook;
  }

  /**
   * Set playbook
   */
  setPlaybook(playbook: Playbook): void {
    this.playbook = playbook;
  }

  /**
   * Get playbook statistics
   */
  getStats() {
    return calculatePlaybookStats(this.playbook);
  }

  /**
   * Save playbook to JSON
   */
  savePlaybook(): string {
    return JSON.stringify(this.playbook, null, 2);
  }

  /**
   * Load playbook from JSON
   */
  loadPlaybook(json: string): void {
    this.playbook = JSON.parse(json);
  }

  /**
   * Reset playbook
   */
  reset(): void {
    this.playbook = createEmptyPlaybook();
    console.log('🔄 ACE playbook reset');
  }
}

/**
 * Create ACE instance with default configuration
 */
export function createACE(llm?: any, embeddingClient?: any): ACE {
  return new ACE({}, llm, embeddingClient);
}

/**
 * Create ACE instance with custom configuration
 */
export function createACEWithConfig(
  config: Partial<ACEConfig>,
  llm?: any,
  embeddingClient?: any
): ACE {
  return new ACE(config, llm, embeddingClient);
}

