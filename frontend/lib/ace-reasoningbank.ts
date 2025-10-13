/**
 * ACE-Enhanced ReasoningBank
 * 
 * Combines ReasoningBank's memory concepts with ACE's incremental delta updates
 * and grow-and-refine mechanism for superior performance.
 * 
 * Key enhancements:
 * - Structured bullet-based memory (not monolithic)
 * - Incremental updates (prevents context collapse)
 * - Semantic deduplication (prevents redundancy)
 * - Multi-iteration refinement (higher quality insights)
 * - Lazy refinement (efficient scaling)
 */

import { ACE } from './ace';
import { Playbook, Bullet, ACESection, createBullet } from './ace/types';

export interface Experience {
  task: string;
  trajectory: any;
  result: any;
  feedback: {
    success: boolean;
    error?: string;
    metrics?: {
      accuracy?: number;
      latency?: number;
      cost?: number;
    };
  };
  timestamp: Date;
}

export interface ReasoningBankConfig {
  max_experiences: number;           // How many experiences to keep
  enable_ace_optimization: boolean;  // Whether to use ACE's grow-and-refine
  auto_refine_interval: number;      // How often to refine (number of experiences)
}

/**
 * ACE-Enhanced ReasoningBank
 */
export class ACEReasoningBank {
  private ace: ACE;
  private experiences: Experience[] = [];
  private config: ReasoningBankConfig;

  constructor(
    ace: ACE,
    config: Partial<ReasoningBankConfig> = {}
  ) {
    this.ace = ace;
    this.config = {
      max_experiences: config.max_experiences || 1000,
      enable_ace_optimization: config.enable_ace_optimization ?? true,
      auto_refine_interval: config.auto_refine_interval || 50
    };

    console.log('🧠 ACE-Enhanced ReasoningBank initialized');
  }

  /**
   * Learn from an experience using ACE
   */
  async learnFromExperience(experience: Experience): Promise<void> {
    console.log(`\n📚 Learning from experience: ${experience.task.substring(0, 60)}...`);

    // Store experience
    this.experiences.push(experience);
    
    // Trim old experiences if needed
    if (this.experiences.length > this.config.max_experiences) {
      this.experiences.shift();
    }

    // Use ACE to extract insights and update playbook
    await this.ace.adaptOnline(
      experience.task,
      experience.result,
      {
        trajectory: experience.trajectory,
        feedback: experience.feedback
      }
    );

    // Auto-refine periodically
    if (this.config.enable_ace_optimization && 
        this.experiences.length % this.config.auto_refine_interval === 0) {
      console.log(`\n🔧 Auto-refinement triggered (${this.experiences.length} experiences)`);
      const stats = this.ace.getStats();
      console.log(`   Current quality: ${(stats.quality_score * 100).toFixed(1)}%`);
    }

    console.log(`✅ Experience stored (total: ${this.experiences.length})`);
  }

  /**
   * Retrieve relevant strategies for a task
   */
  async retrieveRelevant(task: string, topK: number = 5): Promise<Bullet[]> {
    const playbook = this.ace.getPlaybook();
    
    // Simple relevance: return most helpful bullets
    const sortedBullets = [...playbook.bullets].sort((a, b) => {
      const scoreA = a.helpful_count - a.harmful_count;
      const scoreB = b.helpful_count - b.harmful_count;
      return scoreB - scoreA;
    });

    return sortedBullets.slice(0, topK);
  }

  /**
   * Get all strategies by section
   */
  getStrategiesBySection(section: ACESection): Bullet[] {
    const playbook = this.ace.getPlaybook();
    return playbook.bullets.filter(b => b.section === section);
  }

  /**
   * Add a manual strategy (for seeding)
   */
  addStrategy(content: string, section: ACESection): void {
    const playbook = this.ace.getPlaybook();
    const bullet = createBullet(content, section);
    playbook.bullets.push(bullet);
    this.ace.setPlaybook(playbook);
    
    console.log(`✅ Manual strategy added to ${section}`);
  }

  /**
   * Batch learn from multiple experiences
   */
  async batchLearn(experiences: Experience[]): Promise<void> {
    console.log(`\n📚 Batch learning from ${experiences.length} experiences`);

    const trainingData = experiences.map(exp => ({
      task: exp.task,
      ground_truth: exp.result,
      context: {
        trajectory: exp.trajectory,
        feedback: exp.feedback
      }
    }));

    // Use ACE's offline adaptation (with epochs)
    await this.ace.adaptOffline(trainingData, 1);

    // Store experiences
    this.experiences.push(...experiences);
    
    // Trim if needed
    while (this.experiences.length > this.config.max_experiences) {
      this.experiences.shift();
    }

    console.log(`✅ Batch learning complete (total: ${this.experiences.length} experiences)`);
  }

  /**
   * Get statistics
   */
  getStats() {
    const aceStats = this.ace.getStats();
    
    return {
      total_experiences: this.experiences.length,
      playbook_bullets: aceStats.total_bullets,
      quality_score: aceStats.quality_score,
      bullets_by_section: aceStats.bullets_by_section,
      avg_helpful: aceStats.avg_helpful_count,
      avg_harmful: aceStats.avg_harmful_count,
      success_rate: this.calculateSuccessRate()
    };
  }

  /**
   * Calculate success rate from recent experiences
   */
  private calculateSuccessRate(): number {
    if (this.experiences.length === 0) return 0;
    
    const recentCount = Math.min(100, this.experiences.length);
    const recent = this.experiences.slice(-recentCount);
    const successful = recent.filter(exp => exp.feedback.success).length;
    
    return successful / recentCount;
  }

  /**
   * Get playbook for inspection
   */
  getPlaybook(): Playbook {
    return this.ace.getPlaybook();
  }

  /**
   * Save to JSON
   */
  save(): string {
    return JSON.stringify({
      playbook: this.ace.savePlaybook(),
      experiences: this.experiences,
      config: this.config
    }, null, 2);
  }

  /**
   * Load from JSON
   */
  load(json: string): void {
    const data = JSON.parse(json);
    this.ace.loadPlaybook(data.playbook);
    this.experiences = data.experiences || [];
    this.config = { ...this.config, ...data.config };
    
    console.log('✅ ACE-ReasoningBank loaded');
    console.log(`   Experiences: ${this.experiences.length}`);
    console.log(`   Bullets: ${this.ace.getPlaybook().bullets.length}`);
  }

  /**
   * Reset everything
   */
  reset(): void {
    this.ace.reset();
    this.experiences = [];
    console.log('🔄 ACE-ReasoningBank reset');
  }

  /**
   * Get ACE instance for advanced usage
   */
  getACE(): ACE {
    return this.ace;
  }
}

/**
 * Create ACE-Enhanced ReasoningBank
 */
export function createACEReasoningBank(
  llm?: any,
  embeddingClient?: any,
  config?: Partial<ReasoningBankConfig>
): ACEReasoningBank {
  const ace = new ACE({}, llm, embeddingClient);
  return new ACEReasoningBank(ace, config);
}

/**
 * Migrate from old ReasoningBank to ACE-Enhanced
 * (For backward compatibility)
 */
export async function migrateReasoningBank(
  oldMemories: Array<{ content: string; type: string }>,
  llm?: any,
  embeddingClient?: any
): Promise<ACEReasoningBank> {
  const aceRB = createACEReasoningBank(llm, embeddingClient);

  console.log(`\n🔄 Migrating ${oldMemories.length} old memories to ACE format`);

  // Convert old memories to ACE bullets
  oldMemories.forEach(memory => {
    let section: ACESection = 'strategies_and_hard_rules';
    
    // Categorize based on type
    if (memory.type.includes('api') || memory.type.includes('tool')) {
      section = 'apis_to_use';
    } else if (memory.type.includes('error') || memory.type.includes('mistake')) {
      section = 'common_mistakes';
    } else if (memory.type.includes('code')) {
      section = 'code_snippets';
    }

    aceRB.addStrategy(memory.content, section);
  });

  console.log(`✅ Migration complete`);
  
  return aceRB;
}

