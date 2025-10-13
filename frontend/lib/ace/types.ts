/**
 * ACE Framework - Core Type Definitions
 * 
 * Based on: "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models"
 * Paper: arXiv:2510.04618v1
 * 
 * ACE treats contexts as evolving playbooks that accumulate, refine, and organize
 * strategies through incremental delta updates, preventing context collapse and brevity bias.
 */

// ============================================================================
// CORE ACE TYPES
// ============================================================================

/**
 * ACE Section categories for organizing bullets
 */
export type ACESection =
  | 'strategies_and_hard_rules'       // Domain-specific strategies, hard rules, patterns
  | 'apis_to_use'                     // Which APIs solve which problems, return formats
  | 'common_mistakes'                 // Frequent errors, how to avoid them
  | 'verification_checklist'          // Steps to verify solution correctness
  | 'code_snippets';                  // Reusable code patterns

/**
 * Structured bullet with metadata tracking
 * Core innovation: Each insight is an independent, trackable item
 */
export interface Bullet {
  id: string;                         // e.g., "ctx-00001", "strat-00042"
  helpful_count: number;              // Incremented when bullet helps solve a task
  harmful_count: number;              // Incremented when bullet misleads or fails
  content: string;                    // The actual insight/strategy/rule
  section: ACESection;                // Category for organization
  created_at: Date;                   // When this bullet was first added
  last_updated: Date;                 // When counters were last modified
  tags?: string[];                    // Optional tags for fine-grained retrieval
  embedding?: number[];               // Optional: for semantic deduplication
}

/**
 * Playbook: Collection of structured bullets organized by section
 * Innovation: Not a monolithic prompt, but a structured, evolving knowledge base
 */
export interface Playbook {
  bullets: Bullet[];
  metadata: {
    total_bullets: number;
    last_refined: Date;
    version: number;
  };
}

/**
 * Delta Context: Incremental updates to playbook
 * Innovation: Localized changes instead of full rewrites
 */
export interface DeltaContext {
  new_bullets: Bullet[];              // New insights to add
  updated_bullet_ids: string[];       // IDs of bullets to update (increment counters)
  bullets_to_mark_helpful: string[];  // Mark as helpful
  bullets_to_mark_harmful: string[];  // Mark as harmful
}

/**
 * Trajectory: Generator's reasoning path with bullet usage tracking
 */
export interface Trajectory {
  task: string;                       // The task being solved
  steps: TrajectoryStep[];            // Step-by-step reasoning
  bullets_used: string[];             // Which bullets were referenced
  bullets_helpful: string[];          // Which bullets were helpful
  bullets_harmful: string[];          // Which bullets were misleading
  final_answer: any;                  // The final output
  execution_feedback?: ExecutionFeedback; // Optional: environment feedback
}

export interface TrajectoryStep {
  step_number: number;
  reasoning: string;
  action?: string;                    // e.g., API call, code execution
  observation?: string;               // Result of action
  bullets_referenced: string[];       // Bullets used in this step
}

/**
 * Execution Feedback: Signals from environment/evaluation
 */
export interface ExecutionFeedback {
  success: boolean;
  ground_truth?: any;                 // If available
  error_message?: string;
  test_results?: any;                 // Unit tests, validation results
  performance_metrics?: {
    accuracy?: number;
    latency?: number;
    cost?: number;
  };
}

/**
 * Insights: Reflector's extracted lessons
 */
export interface Insights {
  reasoning: string;                  // Chain of thought analysis
  error_identification?: string;      // What went wrong
  root_cause_analysis?: string;       // Why it went wrong
  correct_approach?: string;          // What should have been done
  key_insights: string[];             // Actionable lessons (will become bullets)
  bullet_tags: BulletTag[];           // Feedback on existing bullets used
}

export interface BulletTag {
  id: string;                         // Bullet ID
  tag: 'helpful' | 'harmful' | 'neutral';
}

/**
 * ACE Configuration
 */
export interface ACEConfig {
  max_reflector_iterations: number;   // How many times Reflector refines (paper uses 5)
  max_context_tokens: number;         // When to trigger lazy refinement
  deduplication_threshold: number;    // Cosine similarity threshold (paper uses 0.9)
  prune_threshold: number;            // When to prune (harmful_count > helpful_count)
  batch_size: number;                 // How many samples per delta (paper uses 1)
  max_epochs: number;                 // For offline adaptation (paper uses 5)
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Generator Output
 */
export interface GeneratorOutput {
  trajectory: Trajectory;
  confidence?: number;
}

/**
 * Reflector Output
 */
export interface ReflectorOutput {
  insights: Insights;
  refinement_iterations: number;
}

/**
 * Curator Output
 */
export interface CuratorOutput {
  delta: DeltaContext;
  reasoning: string;
}

/**
 * ACE Adaptation Result
 */
export interface ACEAdaptationResult {
  initial_playbook: Playbook;
  final_playbook: Playbook;
  num_samples_processed: number;
  num_deltas_applied: number;
  total_bullets_added: number;
  total_bullets_pruned: number;
  performance_improvement: number;
  adaptation_time_ms: number;
}

// ============================================================================
// PROMPTS CONFIGURATION
// ============================================================================

/**
 * ACE Prompts: Can be customized per domain
 */
export interface ACEPrompts {
  generator_system_prompt: string;
  reflector_system_prompt: string;
  curator_system_prompt: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a new empty playbook
 */
export function createEmptyPlaybook(): Playbook {
  return {
    bullets: [],
    metadata: {
      total_bullets: 0,
      last_refined: new Date(),
      version: 1
    }
  };
}

/**
 * Create a new bullet
 */
export function createBullet(
  content: string,
  section: ACESection,
  id?: string
): Bullet {
  return {
    id: id || `${section.substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    helpful_count: 0,
    harmful_count: 0,
    content,
    section,
    created_at: new Date(),
    last_updated: new Date()
  };
}

/**
 * Create empty delta context
 */
export function createEmptyDelta(): DeltaContext {
  return {
    new_bullets: [],
    updated_bullet_ids: [],
    bullets_to_mark_helpful: [],
    bullets_to_mark_harmful: []
  };
}

/**
 * Default ACE configuration (from paper)
 */
export const DEFAULT_ACE_CONFIG: ACEConfig = {
  max_reflector_iterations: 5,      // Paper uses up to 5 iterations
  max_context_tokens: 100000,       // Adjust based on model
  deduplication_threshold: 0.9,     // Cosine similarity > 0.9 = duplicate
  prune_threshold: 0,               // Prune if harmful > helpful
  batch_size: 1,                    // Paper uses batch size of 1
  max_epochs: 5                     // Paper uses 5 epochs for offline
};

/**
 * Playbook statistics for monitoring
 */
export interface PlaybookStats {
  total_bullets: number;
  bullets_by_section: Record<ACESection, number>;
  avg_helpful_count: number;
  avg_harmful_count: number;
  quality_score: number;            // helpful / (helpful + harmful)
}

/**
 * Calculate playbook statistics
 */
export function calculatePlaybookStats(playbook: Playbook): PlaybookStats {
  const stats: PlaybookStats = {
    total_bullets: playbook.bullets.length,
    bullets_by_section: {
      'strategies_and_hard_rules': 0,
      'apis_to_use': 0,
      'common_mistakes': 0,
      'verification_checklist': 0,
      'code_snippets': 0
    },
    avg_helpful_count: 0,
    avg_harmful_count: 0,
    quality_score: 0
  };

  let total_helpful = 0;
  let total_harmful = 0;

  playbook.bullets.forEach(bullet => {
    stats.bullets_by_section[bullet.section]++;
    total_helpful += bullet.helpful_count;
    total_harmful += bullet.harmful_count;
  });

  if (playbook.bullets.length > 0) {
    stats.avg_helpful_count = total_helpful / playbook.bullets.length;
    stats.avg_harmful_count = total_harmful / playbook.bullets.length;
  }

  if (total_helpful + total_harmful > 0) {
    stats.quality_score = total_helpful / (total_helpful + total_harmful);
  }

  return stats;
}

