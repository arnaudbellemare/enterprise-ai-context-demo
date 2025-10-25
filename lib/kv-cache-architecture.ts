/**
 * KV Cache Architecture for Continual Learning
 * 
 * Based on the paper: "Sparse Updates for Continual Learning"
 * - Replaces FFN with fixed-size KV cache
 * - Sparse updates using TF-IDF scoring
 * - Prevents catastrophic forgetting (11% vs 71-89% with LoRA)
 * - Hardware-efficient personalization
 */

import { createLogger } from './walt/logger';

const logger = createLogger('KVCacheArchitecture');

export interface KVCacheSlot {
  key: string;
  value: any;
  importanceScore: number;
  lastUpdated: Date;
  domain: string;
  accessCount: number;
  relevanceScore: number;
}

export interface KVCacheConfig {
  maxSlots: number;
  importanceThreshold: number;
  relevanceThreshold: number;
  updateFrequency: number;
  domainSpecific: boolean;
}

export interface SparseUpdateResult {
  updatedSlots: number;
  totalSlots: number;
  importanceScores: number[];
  relevanceScores: number[];
  forgettingRate: number;
  learningEfficiency: number;
}

export interface TFIDFScore {
  term: string;
  tfScore: number;
  idfScore: number;
  combinedScore: number;
  importance: number;
}

export class KVCacheArchitecture {
  private cache: Map<string, KVCacheSlot[]> = new Map();
  private config: KVCacheConfig;
  private domainCorpus: Map<string, any[]> = new Map();
  private updateHistory: any[] = [];

  constructor(config?: Partial<KVCacheConfig>) {
    this.config = {
      maxSlots: 1000,
      importanceThreshold: 0.7,
      relevanceThreshold: 0.6,
      updateFrequency: 10,
      domainSpecific: true,
      ...config
    };

    this.initializeCache();
    logger.info('KV Cache Architecture initialized', { config: this.config });
  }

  /**
   * Initialize KV cache with domain-specific slots
   */
  private initializeCache(): void {
    const domains = ['art', 'legal', 'insurance', 'business', 'general'];
    
    domains.forEach(domain => {
      this.cache.set(domain, []);
      this.domainCorpus.set(domain, []);
    });

    logger.info('KV Cache initialized with domains', { domains });
  }

  /**
   * Retrieve relevant knowledge from KV cache
   */
  async retrieveKnowledge(query: string, domain: string, topK: number = 10): Promise<any[]> {
    try {
      const domainCache = this.cache.get(domain) || [];
      
      // Calculate relevance scores for each slot
      const scoredSlots = domainCache.map(slot => ({
        ...slot,
        relevanceScore: this.calculateRelevanceScore(query, slot)
      }));

      // Sort by relevance and importance
      const sortedSlots = scoredSlots
        .filter(slot => slot.relevanceScore >= this.config.relevanceThreshold)
        .sort((a, b) => (b.relevanceScore * b.importanceScore) - (a.relevanceScore * a.importanceScore))
        .slice(0, topK);

      // Update access counts
      sortedSlots.forEach(slot => {
        slot.accessCount++;
      });

      logger.info('Knowledge retrieved from KV cache', {
        domain,
        query: query.substring(0, 50),
        retrievedSlots: sortedSlots.length,
        totalSlots: domainCache.length
      });

      return sortedSlots.map(slot => slot.value);

    } catch (error) {
      logger.error('Failed to retrieve knowledge from KV cache', {
        error: error instanceof Error ? error.message : String(error),
        domain,
        query: query.substring(0, 50)
      });
      return [];
    }
  }

  /**
   * Calculate relevance score between query and cache slot
   */
  private calculateRelevanceScore(query: string, slot: KVCacheSlot): number {
    // Simple cosine similarity for now
    const queryTerms = query.toLowerCase().split(' ');
    const slotTerms = slot.key.toLowerCase().split(' ');
    
    const intersection = queryTerms.filter(term => slotTerms.includes(term));
    const union = [...new Set([...queryTerms, ...slotTerms])];
    
    return intersection.length / union.length;
  }

  /**
   * Add new knowledge to KV cache with sparse updates
   */
  async addKnowledge(
    knowledge: any, 
    domain: string, 
    context: any = {}
  ): Promise<SparseUpdateResult> {
    try {
      const domainCache = this.cache.get(domain) || [];
      const domainCorpus = this.domainCorpus.get(domain) || [];

      // Calculate TF-IDF scores for new knowledge
      const tfidfScores = this.calculateTFIDFScores(knowledge, domainCorpus);
      
      // Identify slots to update based on importance
      const slotsToUpdate = this.selectSlotsForUpdate(tfidfScores, domainCache);
      
      // Perform sparse updates
      const updatedSlots = await this.performSparseUpdates(
        slotsToUpdate, 
        knowledge, 
        domain, 
        context
      );

      // Update domain corpus
      domainCorpus.push(knowledge);
      this.domainCorpus.set(domain, domainCorpus);

      // Calculate metrics
      const result: SparseUpdateResult = {
        updatedSlots: updatedSlots.length,
        totalSlots: domainCache.length,
        importanceScores: tfidfScores.map(s => s.importance),
        relevanceScores: slotsToUpdate.map(s => s.relevanceScore),
        forgettingRate: this.calculateForgettingRate(domain),
        learningEfficiency: this.calculateLearningEfficiency(domain)
      };

      // Record update history
      this.updateHistory.push({
        timestamp: new Date(),
        domain,
        knowledge: knowledge.toString().substring(0, 100),
        result
      });

      logger.info('Knowledge added to KV cache with sparse updates', {
        domain,
        updatedSlots: updatedSlots.length,
        totalSlots: domainCache.length,
        forgettingRate: result.forgettingRate,
        learningEfficiency: result.learningEfficiency
      });

      return result;

    } catch (error) {
      logger.error('Failed to add knowledge to KV cache', {
        error: error instanceof Error ? error.message : String(error),
        domain,
        knowledge: knowledge.toString().substring(0, 100)
      });
      throw error;
    }
  }

  /**
   * Calculate TF-IDF scores for new knowledge
   */
  private calculateTFIDFScores(knowledge: any, corpus: any[]): TFIDFScore[] {
    const knowledgeText = this.extractText(knowledge);
    const terms = knowledgeText.toLowerCase().split(' ');
    const uniqueTerms = [...new Set(terms)];
    
    const tfidfScores: TFIDFScore[] = uniqueTerms.map(term => {
      // Term Frequency (TF)
      const tf = terms.filter(t => t === term).length / terms.length;
      
      // Inverse Document Frequency (IDF)
      const documentsContainingTerm = corpus.filter(doc => 
        this.extractText(doc).toLowerCase().includes(term)
      ).length;
      const idf = Math.log(corpus.length / (documentsContainingTerm + 1));
      
      const combinedScore = tf * idf;
      const importance = this.calculateImportance(term, combinedScore);
      
      return {
        term,
        tfScore: tf,
        idfScore: idf,
        combinedScore,
        importance
      };
    });

    return tfidfScores.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Extract text from knowledge object
   */
  private extractText(knowledge: any): string {
    if (typeof knowledge === 'string') return knowledge;
    if (typeof knowledge === 'object') {
      return JSON.stringify(knowledge);
    }
    return String(knowledge);
  }

  /**
   * Calculate importance score for a term
   */
  private calculateImportance(term: string, tfidfScore: number): number {
    // Domain-specific importance weights
    const domainWeights: { [key: string]: number } = {
      'art': 1.0,
      'legal': 1.2,
      'insurance': 1.1,
      'business': 0.9,
      'general': 0.8
    };

    // Term-specific importance
    const termImportance: { [key: string]: number } = {
      'valuation': 1.5,
      'compliance': 1.3,
      'risk': 1.2,
      'market': 1.1,
      'analysis': 1.0
    };

    const domainWeight = domainWeights['general'] || 1.0;
    const termWeight = termImportance[term] || 1.0;
    
    return tfidfScore * domainWeight * termWeight;
  }

  /**
   * Select slots for update based on importance scores
   */
  private selectSlotsForUpdate(tfidfScores: TFIDFScore[], domainCache: KVCacheSlot[]): KVCacheSlot[] {
    const highImportanceTerms = tfidfScores
      .filter(score => score.importance >= this.config.importanceThreshold)
      .map(score => score.term);

    // Find slots that match high-importance terms
    const slotsToUpdate = domainCache.filter(slot => {
      const slotTerms = slot.key.toLowerCase().split(' ');
      return highImportanceTerms.some(term => slotTerms.includes(term));
    });

    // If no slots match, select least important slots for replacement
    if (slotsToUpdate.length === 0) {
      return domainCache
        .sort((a, b) => a.importanceScore - b.importanceScore)
        .slice(0, Math.min(5, domainCache.length));
    }

    return slotsToUpdate;
  }

  /**
   * Perform sparse updates to selected slots
   */
  private async performSparseUpdates(
    slotsToUpdate: KVCacheSlot[],
    knowledge: any,
    domain: string,
    context: any
  ): Promise<KVCacheSlot[]> {
    const updatedSlots: KVCacheSlot[] = [];

    for (const slot of slotsToUpdate) {
      // Update slot with new knowledge
      const updatedSlot: KVCacheSlot = {
        ...slot,
        value: this.mergeKnowledge(slot.value, knowledge),
        importanceScore: Math.max(slot.importanceScore, this.calculateSlotImportance(knowledge)),
        lastUpdated: new Date(),
        accessCount: slot.accessCount + 1
      };

      updatedSlots.push(updatedSlot);
    }

    // Update cache
    const domainCache = this.cache.get(domain) || [];
    const updatedCache = domainCache.map(slot => {
      const updated = updatedSlots.find(us => us.key === slot.key);
      return updated || slot;
    });

    this.cache.set(domain, updatedCache);

    return updatedSlots;
  }

  /**
   * Merge new knowledge with existing knowledge
   */
  private mergeKnowledge(existing: any, newKnowledge: any): any {
    if (typeof existing === 'string' && typeof newKnowledge === 'string') {
      return `${existing}\n${newKnowledge}`;
    }
    
    if (typeof existing === 'object' && typeof newKnowledge === 'object') {
      return { ...existing, ...newKnowledge };
    }
    
    return newKnowledge;
  }

  /**
   * Calculate importance score for a slot
   */
  private calculateSlotImportance(knowledge: any): number {
    const knowledgeText = this.extractText(knowledge);
    const terms = knowledgeText.toLowerCase().split(' ');
    
    // Calculate importance based on term frequency and domain relevance
    const importanceTerms = ['valuation', 'compliance', 'risk', 'market', 'analysis'];
    const importanceScore = terms.filter(term => importanceTerms.includes(term)).length / terms.length;
    
    return Math.min(1.0, importanceScore + 0.5);
  }

  /**
   * Calculate forgetting rate for a domain
   */
  private calculateForgettingRate(domain: string): number {
    const domainCache = this.cache.get(domain) || [];
    const recentUpdates = this.updateHistory
      .filter(update => update.domain === domain)
      .slice(-10);

    if (recentUpdates.length === 0) return 0;

    // Calculate forgetting based on importance score degradation
    const avgImportance = domainCache.reduce((sum, slot) => sum + slot.importanceScore, 0) / domainCache.length;
    const recentAvgImportance = recentUpdates.reduce((sum, update) => sum + update.result.learningEfficiency, 0) / recentUpdates.length;
    
    return Math.max(0, (avgImportance - recentAvgImportance) / avgImportance);
  }

  /**
   * Calculate learning efficiency for a domain
   */
  private calculateLearningEfficiency(domain: string): number {
    const domainCache = this.cache.get(domain) || [];
    const recentUpdates = this.updateHistory
      .filter(update => update.domain === domain)
      .slice(-5);

    if (recentUpdates.length === 0) return 0;

    // Calculate efficiency based on update success and knowledge retention
    const successfulUpdates = recentUpdates.filter(update => update.result.updatedSlots > 0).length;
    const avgImportance = domainCache.reduce((sum, slot) => sum + slot.importanceScore, 0) / domainCache.length;
    
    return (successfulUpdates / recentUpdates.length) * avgImportance;
  }

  /**
   * Get cache statistics for a domain
   */
  getCacheStats(domain: string): any {
    const domainCache = this.cache.get(domain) || [];
    const recentUpdates = this.updateHistory
      .filter(update => update.domain === domain)
      .slice(-10);

    return {
      totalSlots: domainCache.length,
      avgImportance: domainCache.reduce((sum, slot) => sum + slot.importanceScore, 0) / domainCache.length,
      avgRelevance: domainCache.reduce((sum, slot) => sum + slot.relevanceScore, 0) / domainCache.length,
      forgettingRate: this.calculateForgettingRate(domain),
      learningEfficiency: this.calculateLearningEfficiency(domain),
      recentUpdates: recentUpdates.length,
      lastUpdated: domainCache.length > 0 ? 
        Math.max(...domainCache.map(slot => slot.lastUpdated.getTime())) : null
    };
  }

  /**
   * Get all cache statistics
   */
  getAllCacheStats(): any {
    const domains = Array.from(this.cache.keys());
    const stats: any = {};

    domains.forEach(domain => {
      stats[domain] = this.getCacheStats(domain);
    });

    return {
      domains,
      stats,
      totalSlots: Array.from(this.cache.values()).reduce((sum, cache) => sum + cache.length, 0),
      totalUpdates: this.updateHistory.length
    };
  }

  /**
   * Clear cache for a domain
   */
  clearCache(domain: string): void {
    this.cache.set(domain, []);
    this.domainCorpus.set(domain, []);
    logger.info('Cache cleared for domain', { domain });
  }

  /**
   * Export cache data for backup
   */
  exportCache(): any {
    return {
      cache: Object.fromEntries(this.cache),
      domainCorpus: Object.fromEntries(this.domainCorpus),
      updateHistory: this.updateHistory,
      config: this.config
    };
  }

  /**
   * Import cache data from backup
   */
  importCache(data: any): void {
    this.cache = new Map(Object.entries(data.cache));
    this.domainCorpus = new Map(Object.entries(data.domainCorpus));
    this.updateHistory = data.updateHistory;
    this.config = { ...this.config, ...data.config };
    logger.info('Cache imported from backup');
  }
}

// Export singleton instance
export const kvCacheArchitecture = new KVCacheArchitecture();
