/**
 * ACE Curator - Synthesizes insights into delta updates and merges deterministically
 * 
 * The Curator's role in ACE:
 * 1. Convert Reflector's insights into structured bullets
 * 2. Create delta context (incremental updates)
 * 3. Merge deltas into playbook deterministically (non-LLM!)
 * 4. Maintain playbook structure and organization
 * 
 * Key innovation: Deterministic merging (no LLM variance), localized updates
 */

import {
  Playbook,
  Bullet,
  DeltaContext,
  Insights,
  CuratorOutput,
  ACESection,
  createBullet,
  createEmptyDelta
} from './types';

export interface CuratorConfig {
  model?: string;                    // Only for initial delta creation
  temperature?: number;
  use_llm_for_categorization: boolean; // Whether to use LLM to categorize insights
}

export class ACECurator {
  private config: CuratorConfig;
  private llm?: any;

  constructor(config: Partial<CuratorConfig> = {}, llm?: any) {
    this.config = {
      model: config.model || 'deepseek-chat',
      temperature: config.temperature ?? 0.3,
      use_llm_for_categorization: config.use_llm_for_categorization ?? false
    };
    this.llm = llm;
  }

  /**
   * Create delta context from insights
   */
  async createDelta(
    insights: Insights,
    currentPlaybook: Playbook
  ): Promise<CuratorOutput> {
    console.log(`\n📝 ACE Curator: Creating delta from ${insights.key_insights.length} insights`);

    const delta: DeltaContext = createEmptyDelta();

    // 1. Tag existing bullets as helpful/harmful
    insights.bullet_tags.forEach(tag => {
      if (tag.tag === 'helpful') {
        delta.bullets_to_mark_helpful.push(tag.id);
      } else if (tag.tag === 'harmful') {
        delta.bullets_to_mark_harmful.push(tag.id);
      }
    });

    // 2. Convert key insights into new bullets
    for (const insight of insights.key_insights) {
      const section = await this.categorizeInsight(insight);
      const bullet = createBullet(insight, section);
      delta.new_bullets.push(bullet);
    }

    console.log(`  ✅ Delta created:`);
    console.log(`     New bullets: ${delta.new_bullets.length}`);
    console.log(`     Mark helpful: ${delta.bullets_to_mark_helpful.length}`);
    console.log(`     Mark harmful: ${delta.bullets_to_mark_harmful.length}`);

    return {
      delta,
      reasoning: insights.reasoning
    };
  }

  /**
   * Merge delta into playbook (DETERMINISTIC - no LLM!)
   */
  mergeDelta(
    currentPlaybook: Playbook,
    delta: DeltaContext
  ): Playbook {
    console.log(`\n🔄 ACE Curator: Merging delta into playbook`);
    console.log(`  Current bullets: ${currentPlaybook.bullets.length}`);

    // Clone playbook for immutability
    const newPlaybook: Playbook = {
      bullets: [...currentPlaybook.bullets],
      metadata: { ...currentPlaybook.metadata }
    };

    // 1. Update helpful counters
    delta.bullets_to_mark_helpful.forEach(bulletId => {
      const bullet = newPlaybook.bullets.find(b => b.id === bulletId);
      if (bullet) {
        bullet.helpful_count++;
        bullet.last_updated = new Date();
      }
    });

    // 2. Update harmful counters
    delta.bullets_to_mark_harmful.forEach(bulletId => {
      const bullet = newPlaybook.bullets.find(b => b.id === bulletId);
      if (bullet) {
        bullet.harmful_count++;
        bullet.last_updated = new Date();
      }
    });

    // 3. Add new bullets
    delta.new_bullets.forEach(newBullet => {
      // Check if similar bullet already exists (simple deduplication)
      const isDuplicate = this.findSimilarBullet(newBullet, newPlaybook.bullets);
      
      if (!isDuplicate) {
        newPlaybook.bullets.push(newBullet);
      } else {
        console.log(`  ⚠️  Skipping duplicate bullet: ${newBullet.content.substring(0, 50)}...`);
      }
    });

    // 4. Update metadata
    newPlaybook.metadata.total_bullets = newPlaybook.bullets.length;
    newPlaybook.metadata.version++;

    console.log(`  ✅ Merge complete:`);
    console.log(`     Final bullets: ${newPlaybook.bullets.length}`);
    console.log(`     Added: ${newPlaybook.bullets.length - currentPlaybook.bullets.length}`);
    console.log(`     Version: ${newPlaybook.metadata.version}`);

    return newPlaybook;
  }

  /**
   * Categorize insight into ACE section
   */
  private async categorizeInsight(insight: string): Promise<ACESection> {
    if (this.config.use_llm_for_categorization && this.llm) {
      return await this.categorizeDynamic(insight);
    }

    // Heuristic categorization (no LLM)
    return this.categorizeHeuristic(insight);
  }

  /**
   * Heuristic-based categorization (fast, no LLM)
   */
  private categorizeHeuristic(insight: string): ACESection {
    const lower = insight.toLowerCase();

    // Check for keywords
    if (lower.includes('api') || lower.includes('endpoint') || lower.includes('call')) {
      return 'apis_to_use';
    }

    if (lower.includes('mistake') || lower.includes('avoid') || lower.includes('error') || 
        lower.includes('pitfall') || lower.includes('wrong')) {
      return 'common_mistakes';
    }

    if (lower.includes('verify') || lower.includes('check') || lower.includes('validate') || 
        lower.includes('confirm')) {
      return 'verification_checklist';
    }

    if (lower.includes('code') || lower.includes('function') || lower.includes('snippet') ||
        lower.includes('def ') || lower.includes('const ')) {
      return 'code_snippets';
    }

    // Default: strategy
    return 'strategies_and_hard_rules';
  }

  /**
   * LLM-based categorization (slower, more accurate)
   */
  private async categorizeDynamic(insight: string): Promise<ACESection> {
    if (!this.llm) {
      return this.categorizeHeuristic(insight);
    }

    const prompt = `Categorize the following insight into one of these categories:
1. strategies_and_hard_rules - General strategies, patterns, hard rules
2. apis_to_use - API usage, endpoints, parameters
3. common_mistakes - Errors to avoid, pitfalls
4. verification_checklist - Validation steps, checks
5. code_snippets - Reusable code patterns

Insight: "${insight}"

Respond with ONLY the category name.`;

    try {
      const response = await this.llm.generateText({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 50
      });

      const category = response.text.trim().toLowerCase();
      
      // Map to ACESection
      if (category.includes('api')) return 'apis_to_use';
      if (category.includes('mistake')) return 'common_mistakes';
      if (category.includes('verification') || category.includes('checklist')) return 'verification_checklist';
      if (category.includes('code') || category.includes('snippet')) return 'code_snippets';
      return 'strategies_and_hard_rules';
    } catch (error) {
      console.warn('LLM categorization failed, using heuristic');
      return this.categorizeHeuristic(insight);
    }
  }

  /**
   * Find similar bullet (simple string matching)
   */
  private findSimilarBullet(newBullet: Bullet, existingBullets: Bullet[]): boolean {
    const newContent = newBullet.content.toLowerCase().trim();
    
    for (const existing of existingBullets) {
      const existingContent = existing.content.toLowerCase().trim();
      
      // Exact match
      if (newContent === existingContent) {
        return true;
      }

      // High similarity (>90% overlap)
      const similarity = this.calculateStringSimilarity(newContent, existingContent);
      if (similarity > 0.9) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate simple string similarity (Jaccard)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Batch merge multiple deltas (parallel processing)
   */
  batchMergeDeltas(
    currentPlaybook: Playbook,
    deltas: DeltaContext[]
  ): Playbook {
    console.log(`\n🔄 ACE Curator: Batch merging ${deltas.length} deltas`);
    
    let playbook = currentPlaybook;
    
    deltas.forEach((delta, index) => {
      console.log(`  Merging delta ${index + 1}/${deltas.length}...`);
      playbook = this.mergeDelta(playbook, delta);
    });

    console.log(`  ✅ Batch merge complete`);
    
    return playbook;
  }

  /**
   * Set LLM client
   */
  setLLM(llm: any): void {
    this.llm = llm;
  }
}

/**
 * Helper: Create default curator
 */
export function createACECurator(llm?: any): ACECurator {
  return new ACECurator({}, llm);
}

