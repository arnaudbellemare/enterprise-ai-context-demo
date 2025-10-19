import { ContextDelta, ContextQuality, ConversationSession } from './types';

export class DynamicContextManager {
  private maxTokens: number = 100000;
  private currentTokens: number = 0;
  private contextBullets: ContextDelta[] = [];
  private compressionThreshold: number = 0.8;

  constructor(maxTokens: number = 100000) {
    this.maxTokens = maxTokens;
  }

  /**
   * Add new content to context with automatic management
   */
  async addToContext(content: string, metadata: any = {}): Promise<ContextDelta> {
    const delta: ContextDelta = {
      id: this.generateId(),
      content,
      metadata: {
        helpful_count: 0,
        harmful_count: 0,
        last_used: new Date(),
        relevance_score: 1.0,
        token_count: this.countTokens(content),
        ...metadata
      },
      type: 'strategy',
      created_at: new Date()
    };

    // Check if we need to compress context
    if (this.currentTokens + delta.metadata.token_count > this.maxTokens * this.compressionThreshold) {
      await this.compressContext();
    }

    this.contextBullets.push(delta);
    this.currentTokens += delta.metadata.token_count;
    
    return delta;
  }

  /**
   * Intelligent context compression
   */
  private async compressContext(): Promise<void> {
    console.log('🗜️ Compressing context...');
    
    // Sort by relevance and recency
    const sortedBullets = this.contextBullets.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreB - scoreA;
    });

    // Remove least relevant bullets until we're under threshold
    const targetTokens = this.maxTokens * 0.6; // Compress to 60% of max
    let removedTokens = 0;
    const bulletsToRemove: ContextDelta[] = [];

    for (let i = sortedBullets.length - 1; i >= 0; i--) {
      if (this.currentTokens - removedTokens <= targetTokens) break;
      
      bulletsToRemove.push(sortedBullets[i]);
      removedTokens += sortedBullets[i].metadata.token_count;
    }

    // Remove bullets and update context
    this.contextBullets = this.contextBullets.filter(
      bullet => !bulletsToRemove.includes(bullet)
    );
    
    this.currentTokens -= removedTokens;
    
    console.log(`🗜️ Compressed context: removed ${bulletsToRemove.length} bullets, ${removedTokens} tokens`);
  }

  /**
   * Calculate relevance score for a context bullet
   */
  private calculateRelevanceScore(bullet: ContextDelta): number {
    const now = new Date();
    const daysSinceLastUsed = (now.getTime() - bullet.metadata.last_used.getTime()) / (1000 * 60 * 60 * 24);
    
    // Weighted score: relevance + recency + helpfulness
    const relevanceWeight = 0.4;
    const recencyWeight = 0.3;
    const helpfulnessWeight = 0.3;
    
    const recencyScore = Math.max(0, 1 - (daysSinceLastUsed / 30)); // Decay over 30 days
    const helpfulnessScore = bullet.metadata.helpful_count / (bullet.metadata.helpful_count + bullet.metadata.harmful_count + 1);
    
    return (
      bullet.metadata.relevance_score * relevanceWeight +
      recencyScore * recencyWeight +
      helpfulnessScore * helpfulnessWeight
    );
  }

  /**
   * Get current context as formatted string
   */
  getContextString(): string {
    return this.contextBullets
      .map(bullet => `[${bullet.type.toUpperCase()}] ${bullet.content}`)
      .join('\n\n');
  }

  /**
   * Update bullet feedback
   */
  async updateBulletFeedback(bulletId: string, helpful: boolean): Promise<void> {
    const bullet = this.contextBullets.find(b => b.id === bulletId);
    if (bullet) {
      if (helpful) {
        bullet.metadata.helpful_count++;
      } else {
        bullet.metadata.harmful_count++;
      }
      bullet.metadata.last_used = new Date();
    }
  }

  /**
   * Get context quality metrics
   */
  getContextQuality(): ContextQuality {
    const totalBullets = this.contextBullets.length;
    const avgRelevance = this.contextBullets.reduce((sum, b) => sum + b.metadata.relevance_score, 0) / totalBullets;
    const avgHelpfulness = this.contextBullets.reduce((sum, b) => {
      const total = b.metadata.helpful_count + b.metadata.harmful_count;
      return sum + (total > 0 ? b.metadata.helpful_count / total : 0.5);
    }, 0) / totalBullets;
    
    return {
      relevance: avgRelevance,
      coherence: this.calculateCoherence(),
      completeness: this.calculateCompleteness(),
      recency: this.calculateRecency(),
      token_efficiency: this.currentTokens / this.maxTokens,
      bullet_count: totalBullets
    };
  }

  private calculateCoherence(): number {
    // Simple coherence based on content similarity
    if (this.contextBullets.length < 2) return 1.0;
    
    // This would ideally use semantic similarity
    // For now, return a placeholder
    return 0.8;
  }

  private calculateCompleteness(): number {
    // Check if we have diverse bullet types
    const types = new Set(this.contextBullets.map(b => b.type));
    return Math.min(1.0, types.size / 4); // 4 expected types
  }

  private calculateRecency(): number {
    const now = new Date();
    const avgAge = this.contextBullets.reduce((sum, bullet) => {
      const age = (now.getTime() - bullet.metadata.last_used.getTime()) / (1000 * 60 * 60 * 24);
      return sum + age;
    }, 0) / this.contextBullets.length;
    
    return Math.max(0, 1 - (avgAge / 7)); // Decay over 7 days
  }

  private countTokens(text: string): number {
    // Simple token estimation (4 chars per token)
    return Math.ceil(text.length / 4);
  }

  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get context statistics
   */
  getStats() {
    return {
      totalTokens: this.currentTokens,
      maxTokens: this.maxTokens,
      utilizationPercent: (this.currentTokens / this.maxTokens) * 100,
      bulletCount: this.contextBullets.length,
      quality: this.getContextQuality()
    };
  }
}
