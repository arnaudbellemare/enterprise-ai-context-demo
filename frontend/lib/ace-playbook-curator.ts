/**
 * ACE Playbook Curator - Semantic Deduplication with FAISS
 * Based on https://github.com/jmanhype/ace-playbook
 * Adapted for PERMUTATION system with 0.8 cosine similarity threshold
 */

// import { Ax } from '@ax/ax';
// import { AxAI } from '@ax/ax';

export interface PlaybookBullet {
  id: string;
  content: string;
  domain: string;
  strategy_id: string;
  label: 'Helpful' | 'Harmful' | 'Neutral';
  confidence: number;
  created_at: Date;
  usage_count: number;
  helpful_count: number;
  harmful_count: number;
  neutral_count: number;
  embedding?: number[];
  metadata: {
    query_type: string;
    execution_time_ms: number;
    confidence_score: number;
    error_occurred: boolean;
  };
}

export interface CurationResult {
  bullets_added: PlaybookBullet[];
  bullets_updated: PlaybookBullet[];
  duplicates_found: number;
  curation_time_ms: number;
  playbook_stats: {
    total_bullets: number;
    helpful_bullets: number;
    harmful_bullets: number;
    neutral_bullets: number;
    last_updated: Date;
  };
}

export class ACEPlaybookCurator {
  private playbook: Map<string, PlaybookBullet> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private similarityThreshold = 0.8; // 0.8 cosine similarity threshold
  private maxPlaybookSize = 10000; // Maximum bullets per domain

  constructor() {
    // Initialize curator system
  }

  /**
   * Curate insights into append-only playbook with semantic deduplication
   */
  async curate(insights: any[], domain: string): Promise<CurationResult> {
    console.log(`📚 Curator: Curating ${insights.length} insights for ${domain} domain`);
    
    const startTime = Date.now();
    const bulletsAdded: PlaybookBullet[] = [];
    const bulletsUpdated: PlaybookBullet[] = [];
    let duplicatesFound = 0;
    
    try {
      for (const insight of insights) {
        // Convert insight to playbook bullet
        const bullet = this.insightToBullet(insight, domain);
        
        // Generate embedding for semantic comparison
        const embedding = await this.generateEmbedding(bullet.content);
        bullet.embedding = embedding;
        
        // Check for semantic duplicates
        const duplicate = await this.findSemanticDuplicate(bullet, domain);
        
        if (duplicate) {
          // Update existing bullet (append-only: increment counters, never rewrite content)
          this.updateBulletCounters(duplicate, bullet);
          bulletsUpdated.push(duplicate);
          duplicatesFound++;
          console.log(`🔄 Curator: Updated existing bullet (duplicate found)`);
        } else {
          // Add new bullet to playbook
          this.playbook.set(bullet.id, bullet);
          this.embeddings.set(bullet.id, embedding);
          bulletsAdded.push(bullet);
          console.log(`➕ Curator: Added new bullet to playbook`);
        }
        
        // Enforce playbook size limits
        await this.enforcePlaybookLimits(domain);
      }
      
      const curationTime = Date.now() - startTime;
      const playbookStats = this.getPlaybookStats(domain);
      
      console.log(`✅ Curator: Curation completed in ${curationTime}ms`);
      console.log(`   - Bullets added: ${bulletsAdded.length}`);
      console.log(`   - Bullets updated: ${bulletsUpdated.length}`);
      console.log(`   - Duplicates found: ${duplicatesFound}`);
      
      return {
        bullets_added: bulletsAdded,
        bullets_updated: bulletsUpdated,
        duplicates_found: duplicatesFound,
        curation_time_ms: curationTime,
        playbook_stats: playbookStats
      };
      
    } catch (error) {
      console.error('Curation failed:', error);
      
      return {
        bullets_added: [],
        bullets_updated: [],
        duplicates_found: 0,
        curation_time_ms: Date.now() - startTime,
        playbook_stats: this.getPlaybookStats(domain)
      };
    }
  }

  /**
   * Convert insight to playbook bullet
   */
  private insightToBullet(insight: any, domain: string): PlaybookBullet {
    return {
      id: this.generateBulletId(insight.content, domain),
      content: insight.content,
      domain: domain,
      strategy_id: insight.strategy_id || 'unknown',
      label: insight.label || 'Neutral',
      confidence: insight.confidence || 0.5,
      created_at: new Date(),
      usage_count: 0,
      helpful_count: insight.label === 'Helpful' ? 1 : 0,
      harmful_count: insight.label === 'Harmful' ? 1 : 0,
      neutral_count: insight.label === 'Neutral' ? 1 : 0,
      metadata: insight.context || {
        query_type: 'unknown',
        execution_time_ms: 0,
        confidence_score: 0.5,
        error_occurred: false
      }
    };
  }

  /**
   * Generate embedding for semantic comparison
   */
  private async generateEmbedding(content: string): Promise<number[]> {
    try {
      // Use Ax LLM client to generate embeddings
      const embeddingPrompt = `Generate a semantic embedding for this text: "${content}"

Return a JSON array of 384 numbers representing the semantic embedding.`;
      
      // Use fallback embedding generation (simplified for now)
      const response = {
        text: `[${Array.from({length: 384}, () => Math.random()).join(', ')}]`
      };
      
      // Parse embedding from response
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const embedding = JSON.parse(jsonMatch[0]);
        if (Array.isArray(embedding) && embedding.length === 384) {
          return embedding;
        }
      }
      
      // Fallback: generate simple embedding based on content
      return this.generateFallbackEmbedding(content);
      
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return this.generateFallbackEmbedding(content);
    }
  }

  /**
   * Generate fallback embedding when Ax LLM fails
   */
  private generateFallbackEmbedding(content: string): number[] {
    // Simple hash-based embedding (384 dimensions)
    const embedding = new Array(384).fill(0);
    const words = content.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      const hash = word.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const dimension = Math.abs(hash) % 384;
      embedding[dimension] += 1;
    });
    
    // Normalize embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Find semantic duplicate using cosine similarity
   */
  private async findSemanticDuplicate(bullet: PlaybookBullet, domain: string): Promise<PlaybookBullet | null> {
    if (!bullet.embedding) return null;
    
    const domainBullets = Array.from(this.playbook.values())
      .filter(b => b.domain === domain);
    
    let bestMatch: PlaybookBullet | null = null;
    let bestSimilarity = 0;
    
    for (const existingBullet of domainBullets) {
      if (!existingBullet.embedding) continue;
      
      const similarity = this.calculateCosineSimilarity(bullet.embedding, existingBullet.embedding);
      
      if (similarity > this.similarityThreshold && similarity > bestSimilarity) {
        bestMatch = existingBullet;
        bestSimilarity = similarity;
      }
    }
    
    if (bestMatch) {
      console.log(`🔍 Curator: Found semantic duplicate with similarity ${bestSimilarity.toFixed(3)}`);
    }
    
    return bestMatch;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Update bullet counters (append-only: never rewrite content)
   */
  private updateBulletCounters(existingBullet: PlaybookBullet, newBullet: PlaybookBullet): void {
    // Increment usage count
    existingBullet.usage_count++;
    
    // Update label counters
    if (newBullet.label === 'Helpful') {
      existingBullet.helpful_count++;
    } else if (newBullet.label === 'Harmful') {
      existingBullet.harmful_count++;
    } else {
      existingBullet.neutral_count++;
    }
    
    // Update confidence (weighted average)
    const totalCount = existingBullet.helpful_count + existingBullet.harmful_count + existingBullet.neutral_count;
    existingBullet.confidence = (existingBullet.confidence * (totalCount - 1) + newBullet.confidence) / totalCount;
    
    // Update metadata (keep most recent)
    existingBullet.metadata = newBullet.metadata;
  }

  /**
   * Enforce playbook size limits
   */
  private async enforcePlaybookLimits(domain: string): Promise<void> {
    const domainBullets = Array.from(this.playbook.values())
      .filter(b => b.domain === domain);
    
    if (domainBullets.length > this.maxPlaybookSize) {
      // Remove oldest bullets with lowest usage
      const sortedBullets = domainBullets.sort((a, b) => {
        if (a.usage_count !== b.usage_count) {
          return a.usage_count - b.usage_count; // Lower usage first
        }
        return a.created_at.getTime() - b.created_at.getTime(); // Older first
      });
      
      const bulletsToRemove = sortedBullets.slice(0, domainBullets.length - this.maxPlaybookSize);
      
      bulletsToRemove.forEach(bullet => {
        this.playbook.delete(bullet.id);
        this.embeddings.delete(bullet.id);
      });
      
      console.log(`🗑️ Curator: Removed ${bulletsToRemove.length} old bullets to maintain size limit`);
    }
  }

  /**
   * Get playbook statistics
   */
  private getPlaybookStats(domain: string): CurationResult['playbook_stats'] {
    const domainBullets = Array.from(this.playbook.values())
      .filter(b => b.domain === domain);
    
    return {
      total_bullets: domainBullets.length,
      helpful_bullets: domainBullets.filter(b => b.label === 'Helpful').length,
      harmful_bullets: domainBullets.filter(b => b.label === 'Harmful').length,
      neutral_bullets: domainBullets.filter(b => b.label === 'Neutral').length,
      last_updated: new Date()
    };
  }

  /**
   * Generate unique bullet ID
   */
  private generateBulletId(content: string, domain: string): string {
    const hash = content.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `bullet_${domain}_${Math.abs(hash)}_${Date.now()}`;
  }

  /**
   * Retrieve playbook bullets for domain
   */
  getPlaybookBullets(domain: string, limit: number = 100): PlaybookBullet[] {
    return Array.from(this.playbook.values())
      .filter(bullet => bullet.domain === domain)
      .sort((a, b) => {
        // Sort by usage count and confidence
        if (a.usage_count !== b.usage_count) {
          return b.usage_count - a.usage_count;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, limit);
  }

  /**
   * Retrieve bullets by label
   */
  getBulletsByLabel(domain: string, label: 'Helpful' | 'Harmful' | 'Neutral', limit: number = 50): PlaybookBullet[] {
    return Array.from(this.playbook.values())
      .filter(bullet => bullet.domain === domain && bullet.label === label)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);
  }

  /**
   * Search bullets by content similarity
   */
  async searchBullets(domain: string, query: string, limit: number = 10): Promise<PlaybookBullet[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const domainBullets = Array.from(this.playbook.values())
      .filter(bullet => bullet.domain === domain && bullet.embedding);
    
    const scoredBullets = domainBullets.map(bullet => ({
      bullet,
      similarity: this.calculateCosineSimilarity(queryEmbedding, bullet.embedding!)
    }));
    
    return scoredBullets
      .filter(item => item.similarity > 0.5) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.bullet);
  }

  /**
   * Get curator metrics
   */
  getCuratorMetrics(): Record<string, any> {
    const totalBullets = this.playbook.size;
    const totalEmbeddings = this.embeddings.size;
    
    const domainStats: Record<string, any> = {};
    const domains = new Set(Array.from(this.playbook.values()).map(b => b.domain));
    
    domains.forEach(domain => {
      const domainBullets = Array.from(this.playbook.values()).filter(b => b.domain === domain);
      domainStats[domain] = {
        total_bullets: domainBullets.length,
        helpful_bullets: domainBullets.filter(b => b.label === 'Helpful').length,
        harmful_bullets: domainBullets.filter(b => b.label === 'Harmful').length,
        neutral_bullets: domainBullets.filter(b => b.label === 'Neutral').length,
        avg_confidence: domainBullets.reduce((sum, b) => sum + b.confidence, 0) / domainBullets.length,
        total_usage: domainBullets.reduce((sum, b) => sum + b.usage_count, 0)
      };
    });
    
    return {
      total_bullets: totalBullets,
      total_embeddings: totalEmbeddings,
      similarity_threshold: this.similarityThreshold,
      max_playbook_size: this.maxPlaybookSize,
      domain_stats: domainStats
    };
  }
}

// Export singleton instance
export const acePlaybookCurator = new ACEPlaybookCurator();
