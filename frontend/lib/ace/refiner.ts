/**
 * ACE Playbook Refiner - Semantic deduplication and quality pruning
 * 
 * The Refiner's role in ACE:
 * 1. Compute embeddings for bullets
 * 2. Find semantically similar bullets (cosine similarity > threshold)
 * 3. Merge duplicates (keep higher helpful_count)
 * 4. Prune low-quality bullets (harmful > helpful)
 * 5. Support lazy and proactive refinement strategies
 * 
 * Key innovation: Prevents information accumulation from becoming noise
 */

import {
  Playbook,
  Bullet,
  ACEConfig,
  DEFAULT_ACE_CONFIG,
  calculatePlaybookStats
} from './types';

export interface RefinerConfig {
  deduplication_threshold: number;   // Cosine similarity threshold (0.9 in paper)
  prune_threshold: number;           // Prune if harmful - helpful > threshold
  embedding_model: string;           // Model for embeddings
  use_lazy_refinement: boolean;      // Lazy vs proactive
}

export class PlaybookRefiner {
  private config: RefinerConfig;
  private embeddingClient?: any;     // OpenAI or similar for embeddings

  constructor(config: Partial<RefinerConfig> = {}, embeddingClient?: any) {
    this.config = {
      deduplication_threshold: config.deduplication_threshold || DEFAULT_ACE_CONFIG.deduplication_threshold,
      prune_threshold: config.prune_threshold || DEFAULT_ACE_CONFIG.prune_threshold,
      embedding_model: config.embedding_model || 'text-embedding-3-small',
      use_lazy_refinement: config.use_lazy_refinement ?? true
    };
    this.embeddingClient = embeddingClient;
  }

  /**
   * Deduplicate bullets using semantic similarity
   */
  async deduplicateBullets(bullets: Bullet[]): Promise<Bullet[]> {
    if (bullets.length <= 1) {
      return bullets;
    }

    console.log(`\n🔧 ACE Refiner: Deduplicating ${bullets.length} bullets`);

    // 1. Compute embeddings for all bullets
    const embeddings = await this.computeEmbeddings(bullets);

    // 2. Find duplicate pairs (cosine similarity > threshold)
    const duplicatePairs = this.findDuplicatePairs(bullets, embeddings);

    console.log(`  Found ${duplicatePairs.length} duplicate pairs`);

    // 3. Merge duplicates (keep higher quality bullet)
    const deduplicated = this.mergeDuplicates(bullets, duplicatePairs);

    console.log(`  ✅ Deduplicated: ${bullets.length} → ${deduplicated.length} bullets`);

    return deduplicated;
  }

  /**
   * Prune low-quality bullets
   */
  pruneLowQuality(bullets: Bullet[]): Bullet[] {
    console.log(`\n🔧 ACE Refiner: Pruning low-quality bullets`);

    const before = bullets.length;

    // Remove bullets where harmful significantly exceeds helpful
    const pruned = bullets.filter(bullet => {
      const quality = bullet.helpful_count - bullet.harmful_count;
      return quality >= -this.config.prune_threshold;
    });

    const removed = before - pruned.length;
    console.log(`  ✅ Pruned: ${before} → ${pruned.length} bullets (removed ${removed})`);

    return pruned;
  }

  /**
   * Full refinement: deduplicate + prune
   */
  async refine(playbook: Playbook): Promise<Playbook> {
    console.log(`\n🔧 ACE Refiner: Full refinement`);
    console.log(`  Initial: ${playbook.bullets.length} bullets`);

    const stats = calculatePlaybookStats(playbook);
    console.log(`  Quality score: ${(stats.quality_score * 100).toFixed(1)}%`);

    // 1. Deduplicate
    let refined = await this.deduplicateBullets(playbook.bullets);

    // 2. Prune low quality
    refined = this.pruneLowQuality(refined);

    const newPlaybook: Playbook = {
      bullets: refined,
      metadata: {
        ...playbook.metadata,
        total_bullets: refined.length,
        last_refined: new Date()
      }
    };

    const newStats = calculatePlaybookStats(newPlaybook);
    console.log(`  Final: ${refined.length} bullets`);
    console.log(`  Quality score: ${(newStats.quality_score * 100).toFixed(1)}%`);

    return newPlaybook;
  }

  /**
   * Compute embeddings for bullets
   */
  private async computeEmbeddings(bullets: Bullet[]): Promise<number[][]> {
    if (!this.embeddingClient) {
      // Fallback: use simple TF-IDF-like vectors
      return this.computeTFIDFVectors(bullets);
    }

    try {
      const texts = bullets.map(b => b.content);
      
      const response = await this.embeddingClient.embeddings.create({
        model: this.config.embedding_model,
        input: texts
      });

      return response.data.map((item: any) => item.embedding);
    } catch (error) {
      console.warn('Embedding API failed, using TF-IDF fallback');
      return this.computeTFIDFVectors(bullets);
    }
  }

  /**
   * Compute TF-IDF-like vectors (fallback when no embedding client)
   */
  private computeTFIDFVectors(bullets: Bullet[]): number[][] {
    // Build vocabulary
    const vocabulary = new Set<string>();
    const documents = bullets.map(b => b.content.toLowerCase().split(/\s+/));
    
    documents.forEach(doc => {
      doc.forEach(word => {
        if (word.length > 3) { // Filter out very short words
          vocabulary.add(word);
        }
      });
    });

    const vocabArray = Array.from(vocabulary);
    const vocabIndex = new Map(vocabArray.map((word, idx) => [word, idx]));

    // Compute term frequencies
    const vectors = documents.map(doc => {
      const vector = new Array(vocabArray.length).fill(0);
      doc.forEach(word => {
        const idx = vocabIndex.get(word);
        if (idx !== undefined) {
          vector[idx]++;
        }
      });
      
      // Normalize
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return vector.map(val => norm > 0 ? val / norm : 0);
    });

    return vectors;
  }

  /**
   * Find duplicate pairs using cosine similarity
   */
  private findDuplicatePairs(
    bullets: Bullet[],
    embeddings: number[][]
  ): Array<[number, number]> {
    const pairs: Array<[number, number]> = [];

    for (let i = 0; i < bullets.length - 1; i++) {
      for (let j = i + 1; j < bullets.length; j++) {
        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
        
        if (similarity >= this.config.deduplication_threshold) {
          pairs.push([i, j]);
        }
      }
    }

    return pairs;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Merge duplicate bullets (keep higher quality)
   */
  private mergeDuplicates(
    bullets: Bullet[],
    duplicatePairs: Array<[number, number]>
  ): Bullet[] {
    // Build merge groups (transitive closure)
    const mergeGroups: number[][] = [];
    const processed = new Set<number>();

    duplicatePairs.forEach(([i, j]) => {
      // Find existing group containing i or j
      let group = mergeGroups.find(g => g.includes(i) || g.includes(j));
      
      if (!group) {
        group = [i, j];
        mergeGroups.push(group);
      } else {
        if (!group.includes(i)) group.push(i);
        if (!group.includes(j)) group.push(j);
      }
    });

    // For each group, keep the highest quality bullet
    const toKeep = new Set<number>();
    
    mergeGroups.forEach(group => {
      let best = group[0];
      let bestScore = this.qualityScore(bullets[best]);
      
      for (let i = 1; i < group.length; i++) {
        const score = this.qualityScore(bullets[group[i]]);
        if (score > bestScore) {
          best = group[i];
          bestScore = score;
        }
      }
      
      toKeep.add(best);
      group.forEach(idx => processed.add(idx));
    });

    // Keep all bullets not involved in merging + best from each group
    const result: Bullet[] = [];
    
    bullets.forEach((bullet, idx) => {
      if (!processed.has(idx) || toKeep.has(idx)) {
        result.push(bullet);
      }
    });

    return result;
  }

  /**
   * Calculate quality score for a bullet
   */
  private qualityScore(bullet: Bullet): number {
    // Quality = helpful - harmful, with bonus for higher total usage
    const net = bullet.helpful_count - bullet.harmful_count;
    const total = bullet.helpful_count + bullet.harmful_count;
    
    // Combine net quality with total usage (more data = more reliable)
    return net + (total * 0.1);
  }

  /**
   * Set embedding client
   */
  setEmbeddingClient(client: any): void {
    this.embeddingClient = client;
  }
}

/**
 * Lazy Refiner - Only refines when needed
 */
export class LazyRefiner {
  private refiner: PlaybookRefiner;
  private maxTokens: number;
  private refinementThreshold: number; // Percentage of max tokens

  constructor(
    refiner: PlaybookRefiner,
    maxTokens: number = DEFAULT_ACE_CONFIG.max_context_tokens,
    refinementThreshold: number = 0.9
  ) {
    this.refiner = refiner;
    this.maxTokens = maxTokens;
    this.refinementThreshold = refinementThreshold;
  }

  /**
   * Check if refinement is needed
   */
  shouldRefine(playbook: Playbook): boolean {
    const currentTokens = this.estimateTokens(playbook);
    const threshold = this.maxTokens * this.refinementThreshold;
    
    return currentTokens > threshold;
  }

  /**
   * Refine only if needed
   */
  async refineIfNeeded(playbook: Playbook): Promise<Playbook> {
    if (!this.shouldRefine(playbook)) {
      console.log(`  ℹ️  Lazy refinement: Not needed (${this.estimateTokens(playbook)} / ${this.maxTokens} tokens)`);
      return playbook;
    }

    console.log(`  ⚠️  Lazy refinement: Triggered (${this.estimateTokens(playbook)} / ${this.maxTokens} tokens)`);
    return await this.refiner.refine(playbook);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(playbook: Playbook): number {
    // Rough estimate: 1 token ≈ 4 characters
    let totalChars = 0;
    
    playbook.bullets.forEach(bullet => {
      totalChars += bullet.id.length;
      totalChars += bullet.content.length;
      totalChars += 50; // Metadata overhead
    });

    return Math.ceil(totalChars / 4);
  }
}

/**
 * Helper: Create default refiner
 */
export function createPlaybookRefiner(embeddingClient?: any): PlaybookRefiner {
  return new PlaybookRefiner({}, embeddingClient);
}

/**
 * Helper: Create lazy refiner
 */
export function createLazyRefiner(embeddingClient?: any): LazyRefiner {
  const refiner = createPlaybookRefiner(embeddingClient);
  return new LazyRefiner(refiner);
}

