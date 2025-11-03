/**
 * Context Engineering 2.0 Implementation
 * 
 * Based on: "Context Engineering 2.0: The Context of Context Engineering"
 * Paper: https://arxiv.org/pdf/2510.26493
 * 
 * Key Principles:
 * 1. Context as Entropy Reduction: Transform high-entropy contexts into low-entropy representations
 * 2. Layered Memory Architecture: Working memory, episodic, semantic layers
 * 3. Context Isolation: Separate contexts for different tasks/domains
 * 4. Context Abstraction: Hierarchical abstraction levels
 * 5. Proactive User Need Inference: Anticipate user needs before they ask
 * 6. Lifelong Context Preservation: Long-term context maintenance and update
 * 7. Context Selection for Understanding: Active selection of relevant context
 */

import { createLogger } from './walt/logger';

const logger = createLogger('ContextEngineering2');

// ============================================================
// ENTROPY REDUCTION: High-entropy → Low-entropy
// ============================================================

export interface EntropyReductionConfig {
  compressionRatio: number;        // Target compression (default: 0.3)
  semanticPreservation: boolean;   // Preserve semantic meaning
  structurePreservation: boolean;   // Preserve logical structure
  enableSummarization: boolean;    // Use summarization for reduction
}

export class EntropyReducer {
  private config: EntropyReductionConfig;

  constructor(config?: Partial<EntropyReductionConfig>) {
    this.config = {
      compressionRatio: 0.3,
      semanticPreservation: true,
      structurePreservation: true,
      enableSummarization: true,
      ...config
    };
  }

  /**
   * Reduce entropy of context for machine understanding
   * Transform high-entropy natural language into low-entropy structured representation
   */
  async reduceEntropy(
    context: string,
    query: string,
    domain: string
  ): Promise<{
    lowEntropyContext: string;
    entropyReduction: number;  // 0-1, how much entropy was reduced
    structurePreserved: boolean;
    semanticPreserved: boolean;
  }> {
    logger.info('Reducing context entropy', { 
      originalLength: context.length,
      domain 
    });

    // 1. Extract key information (structure preservation)
    const structured = this.extractStructure(context);
    
    // 2. Summarize while preserving semantics
    const summarized = this.config.enableSummarization
      ? await this.summarizePreservingSemantics(context, query, domain)
      : context;

    // 3. Calculate entropy reduction
    const originalEntropy = this.calculateEntropy(context);
    const reducedEntropy = this.calculateEntropy(summarized);
    const entropyReduction = Math.max(0, (originalEntropy - reducedEntropy) / originalEntropy);

    const lowEntropyContext = this.config.structurePreservation
      ? `${structured}\n\n${summarized}`
      : summarized;

    logger.info('Entropy reduction completed', {
      entropyReduction: entropyReduction.toFixed(3),
      originalLength: context.length,
      reducedLength: lowEntropyContext.length,
      compressionRatio: (lowEntropyContext.length / context.length).toFixed(3)
    });

    return {
      lowEntropyContext,
      entropyReduction,
      structurePreserved: this.config.structurePreservation,
      semanticPreserved: this.config.semanticPreservation
    };
  }

  private extractStructure(context: string): string {
    // Extract structured information (entities, relationships, actions)
    const entities = this.extractEntities(context);
    const relationships = this.extractRelationships(context);
    const actions = this.extractActions(context);

    return `Structured Context:\n- Entities: ${entities.join(', ')}\n- Relationships: ${relationships.join(', ')}\n- Actions: ${actions.join(', ')}`;
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction (could be enhanced with NER)
    const capitalized = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const nouns = text.match(/\b\w+(?:tion|ment|ness|ity)\b/g) || [];
    return [...new Set([...capitalized, ...nouns])].slice(0, 10);
  }

  private extractRelationships(text: string): string[] {
    // Extract relationship patterns
    const patterns = [
      /\b(\w+)\s+(?:is|are|was|were)\s+(\w+)/gi,
      /\b(\w+)\s+(?:has|have|had)\s+(\w+)/gi,
      /\b(\w+)\s+(?:uses?|used?)\s+(\w+)/gi,
    ];
    
    const relationships: string[] = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[2]) {
          relationships.push(`${match[1]} → ${match[2]}`);
        }
      }
    }
    
    return [...new Set(relationships)].slice(0, 10);
  }

  private extractActions(text: string): string[] {
    // Extract action verbs
    const actionPatterns = /\b(?:analyze|create|update|delete|retrieve|process|generate|execute|implement|optimize)\w*/gi;
    const actions = text.match(actionPatterns) || [];
    return [...new Set(actions)].slice(0, 10);
  }

  private async summarizePreservingSemantics(
    context: string,
    query: string,
    domain: string
  ): Promise<string> {
    // Placeholder: Would use LLM for semantic-aware summarization
    // Key: Preserve information relevant to query and domain
    const targetLength = Math.floor(context.length * this.config.compressionRatio);
    
    // Simple heuristic: Keep sentences with query-related keywords
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const queryKeywords = query.toLowerCase().split(/\s+/);
    
    const relevantSentences = sentences
      .filter(sentence => {
        const lower = sentence.toLowerCase();
        return queryKeywords.some(keyword => lower.includes(keyword));
      })
      .slice(0, Math.ceil(targetLength / 50)); // Approximate sentence length
    
    return relevantSentences.join('. ') || context.substring(0, targetLength);
  }

  private calculateEntropy(text: string): number {
    // Shannon entropy calculation
    const charFreq: Record<string, number> = {};
    for (const char of text) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const length = text.length;
    for (const freq of Object.values(charFreq)) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }
}

// ============================================================
// LAYERED MEMORY ARCHITECTURE
// ============================================================

export interface LayeredMemoryConfig {
  workingMemorySize: number;      // Short-term (default: 10 items)
  episodicMemorySize: number;     // Medium-term (default: 100 items)
  semanticMemorySize: number;     // Long-term (default: 1000 items)
  enableLifelongUpdate: boolean;  // Update memories over time
}

export class LayeredMemoryArchitecture {
  private config: LayeredMemoryConfig;
  private workingMemory: Map<string, any> = new Map();  // Current session
  private episodicMemory: Map<string, any> = new Map();  // Recent experiences
  private semanticMemory: Map<string, any> = new Map();  // Long-term knowledge

  constructor(config?: Partial<LayeredMemoryConfig>) {
    this.config = {
      workingMemorySize: 10,
      episodicMemorySize: 100,
      semanticMemorySize: 1000,
      enableLifelongUpdate: true,
      ...config
    };
  }

  /**
   * Store context in appropriate layer based on importance and recency
   */
  async storeContext(
    context: any,
    importance: number,  // 0-1
    recency: number      // 0-1, how recent
  ): Promise<{
    layer: 'working' | 'episodic' | 'semantic';
    id: string;
  }> {
    const id = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Decision: Which layer?
    if (recency > 0.8) {
      // Very recent → Working memory
      this.storeInWorkingMemory(id, context);
      return { layer: 'working', id };
    } else if (importance > 0.7) {
      // Important → Semantic memory
      this.storeInSemanticMemory(id, context);
      return { layer: 'semantic', id };
    } else {
      // Medium → Episodic memory
      this.storeInEpisodicMemory(id, context);
      return { layer: 'episodic', id };
    }
  }

  /**
   * Retrieve context from multiple layers based on query
   */
  async retrieveContext(
    query: string,
    domain: string
  ): Promise<{
    working: any[];
    episodic: any[];
    semantic: any[];
    combined: any[];
  }> {
    const working = Array.from(this.workingMemory.values())
      .filter(ctx => this.isRelevant(ctx, query, domain));
    
    const episodic = Array.from(this.episodicMemory.values())
      .filter(ctx => this.isRelevant(ctx, query, domain))
      .sort((a, b) => (b.recency || 0) - (a.recency || 0))
      .slice(0, 5);
    
    const semantic = Array.from(this.semanticMemory.values())
      .filter(ctx => this.isRelevant(ctx, query, domain))
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, 10);

    const combined = [...working, ...episodic, ...semantic];

    logger.info('Retrieved context from layered memory', {
      working: working.length,
      episodic: episodic.length,
      semantic: semantic.length,
      total: combined.length
    });

    return { working, episodic, semantic, combined };
  }

  private storeInWorkingMemory(id: string, context: any): void {
    // Evict oldest if full
    if (this.workingMemory.size >= this.config.workingMemorySize) {
      const oldestKey = Array.from(this.workingMemory.keys())[0];
      this.workingMemory.delete(oldestKey);
    }
    this.workingMemory.set(id, { ...context, id, layer: 'working', timestamp: Date.now() });
  }

  private storeInEpisodicMemory(id: string, context: any): void {
    if (this.episodicMemory.size >= this.config.episodicMemorySize) {
      const oldestKey = Array.from(this.episodicMemory.keys())[0];
      this.episodicMemory.delete(oldestKey);
    }
    this.episodicMemory.set(id, { ...context, id, layer: 'episodic', timestamp: Date.now() });
  }

  private storeInSemanticMemory(id: string, context: any): void {
    if (this.semanticMemory.size >= this.config.semanticMemorySize) {
      // Evict least important
      const leastImportant = Array.from(this.semanticMemory.entries())
        .sort((a, b) => (a[1].importance || 0) - (b[1].importance || 0))[0];
      this.semanticMemory.delete(leastImportant[0]);
    }
    this.semanticMemory.set(id, { ...context, id, layer: 'semantic', timestamp: Date.now() });
  }

  private isRelevant(context: any, query: string, domain: string): boolean {
    const queryLower = query.toLowerCase();
    const contextText = JSON.stringify(context).toLowerCase();
    const domainMatch = context.domain === domain || !context.domain;
    
    return contextText.includes(queryLower) || domainMatch;
  }

  /**
   * Update memory (lifelong learning)
   */
  async updateMemory(id: string, updates: Partial<any>): Promise<void> {
    // Find and update in any layer
    if (this.workingMemory.has(id)) {
      const existing = this.workingMemory.get(id);
      this.workingMemory.set(id, { ...existing, ...updates });
    } else if (this.episodicMemory.has(id)) {
      const existing = this.episodicMemory.get(id);
      this.episodicMemory.set(id, { ...existing, ...updates });
    } else if (this.semanticMemory.has(id)) {
      const existing = this.semanticMemory.get(id);
      this.semanticMemory.set(id, { ...existing, ...updates });
    }
  }
}

// ============================================================
// CONTEXT ISOLATION
// ============================================================

export class ContextIsolation {
  private isolatedContexts: Map<string, Map<string, any>> = new Map();

  /**
   * Create isolated context for a specific task/domain
   */
  createIsolatedContext(taskId: string, domain: string): void {
    const key = `${taskId}_${domain}`;
    if (!this.isolatedContexts.has(key)) {
      this.isolatedContexts.set(key, new Map());
    }
    logger.info('Created isolated context', { taskId, domain });
  }

  /**
   * Store context in isolated space
   */
  storeInIsolatedContext(taskId: string, domain: string, context: any): void {
    const key = `${taskId}_${domain}`;
    const isolated = this.isolatedContexts.get(key);
    if (isolated) {
      isolated.set(`ctx_${Date.now()}`, context);
    }
  }

  /**
   * Retrieve context from isolated space
   */
  retrieveFromIsolatedContext(taskId: string, domain: string): any[] {
    const key = `${taskId}_${domain}`;
    const isolated = this.isolatedContexts.get(key);
    return isolated ? Array.from(isolated.values()) : [];
  }

  /**
   * Merge isolated contexts (for cross-domain queries)
   */
  mergeIsolatedContexts(taskIds: string[], domains: string[]): any[] {
    const merged: any[] = [];
    for (const taskId of taskIds) {
      for (const domain of domains) {
        const isolated = this.retrieveFromIsolatedContext(taskId, domain);
        merged.push(...isolated);
      }
    }
    return merged;
  }
}

// ============================================================
// CONTEXT ABSTRACTION
// ============================================================

export interface ContextAbstractionLevel {
  level: 'concrete' | 'abstract' | 'meta';
  abstraction: number;  // 0-1
  content: string;
}

export class ContextAbstraction {
  /**
   * Create hierarchical abstraction levels
   */
  async abstractContext(
    context: string,
    levels: ('concrete' | 'abstract' | 'meta')[] = ['concrete', 'abstract', 'meta']
  ): Promise<ContextAbstractionLevel[]> {
    const abstractions: ContextAbstractionLevel[] = [];

    for (const level of levels) {
      const abstracted = await this.abstractToLevel(context, level);
      abstractions.push({
        level,
        abstraction: this.getAbstractionValue(level),
        content: abstracted
      });
    }

    return abstractions;
  }

  private async abstractToLevel(context: string, level: 'concrete' | 'abstract' | 'meta'): Promise<string> {
    switch (level) {
      case 'concrete':
        return context; // Keep as-is
      case 'abstract':
        // Extract key concepts and relationships
        return this.extractAbstract(context);
      case 'meta':
        // Extract patterns and principles
        return this.extractMeta(context);
    }
  }

  private extractAbstract(context: string): string {
    // Extract high-level concepts
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keySentences = sentences
      .filter(s => s.length > 50) // Longer sentences often contain abstractions
      .slice(0, Math.ceil(sentences.length * 0.3));
    return keySentences.join('. ');
  }

  private extractMeta(context: string): string {
    // Extract patterns, principles, rules
    const patterns = [
      /(?:principle|pattern|rule|strategy|approach|method|technique)/gi,
      /(?:always|never|should|must|typically|usually)/gi
    ];
    
    const metaSentences: string[] = [];
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      if (patterns.some(pattern => pattern.test(sentence))) {
        metaSentences.push(sentence);
      }
    }
    
    return metaSentences.join('. ') || 'No meta-level patterns found';
  }

  private getAbstractionValue(level: 'concrete' | 'abstract' | 'meta'): number {
    switch (level) {
      case 'concrete': return 0.0;
      case 'abstract': return 0.5;
      case 'meta': return 1.0;
    }
  }
}

// ============================================================
// PROACTIVE USER NEED INFERENCE
// ============================================================

export class ProactiveNeedInference {
  private userPatterns: Map<string, any[]> = new Map();
  private inferenceHistory: any[] = [];

  /**
   * Infer user needs before they ask
   */
  async inferNeeds(
    currentQuery: string,
    conversationHistory: any[],
    userProfile: any
  ): Promise<{
    inferredNeeds: string[];
    confidence: number;
    reasoning: string;
  }> {
    // Analyze patterns
    const patterns = this.analyzePatterns(conversationHistory);
    const inferredNeeds: string[] = [];

    // Pattern 1: Sequential queries (user often asks follow-ups)
    if (conversationHistory.length > 0) {
      const lastQuery = conversationHistory[conversationHistory.length - 1].content;
      const followUp = this.inferFollowUp(currentQuery, lastQuery);
      if (followUp) {
        inferredNeeds.push(followUp);
      }
    }

    // Pattern 2: Domain-specific needs
    const domainNeeds = this.inferDomainNeeds(currentQuery, userProfile);
    inferredNeeds.push(...domainNeeds);

    // Pattern 3: Temporal patterns (time-based needs)
    const temporalNeeds = this.inferTemporalNeeds(conversationHistory);
    inferredNeeds.push(...temporalNeeds);

    const confidence = this.calculateConfidence(inferredNeeds, patterns);
    const reasoning = this.buildReasoning(inferredNeeds, patterns);

    logger.info('Proactive need inference', {
      inferredNeeds: inferredNeeds.length,
      confidence: confidence.toFixed(3)
    });

    return {
      inferredNeeds,
      confidence,
      reasoning
    };
  }

  private analyzePatterns(history: any[]): any {
    return {
      averageQueryLength: history.reduce((sum, h) => sum + h.content.length, 0) / Math.max(1, history.length),
      commonDomains: this.extractDomains(history),
      queryFrequency: history.length
    };
  }

  private inferFollowUp(current: string, last: string): string | null {
    // Check if current query is a follow-up
    const followUpKeywords = ['also', 'additionally', 'what about', 'how about', 'and', 'more'];
    if (followUpKeywords.some(kw => current.toLowerCase().includes(kw))) {
      return `Follow-up to: ${last.substring(0, 50)}`;
    }
    return null;
  }

  private inferDomainNeeds(query: string, profile: any): string[] {
    const needs: string[] = [];
    const domainKeywords: Record<string, string[]> = {
      financial: ['tax', 'investment', 'portfolio', 'asset'],
      legal: ['contract', 'agreement', 'compliance', 'regulation'],
      technical: ['code', 'api', 'implementation', 'algorithm']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => query.toLowerCase().includes(kw))) {
        needs.push(`Domain-specific: ${domain}`);
      }
    }

    return needs;
  }

  private inferTemporalNeeds(history: any[]): string[] {
    // Check if queries follow temporal patterns
    if (history.length >= 2) {
      const recent = history.slice(-2);
      const timeDiff = recent[1].timestamp - recent[0].timestamp;
      if (timeDiff < 60000) { // Less than 1 minute
        return ['Rapid follow-up detected - user may need immediate assistance'];
      }
    }
    return [];
  }

  private extractDomains(history: any[]): string[] {
    const domains = new Set<string>();
    for (const item of history) {
      if (item.domain) {
        domains.add(item.domain);
      }
    }
    return Array.from(domains);
  }

  private calculateConfidence(needs: string[], patterns: any): number {
    // More needs = higher confidence (if patterns are strong)
    const baseConfidence = Math.min(0.9, needs.length * 0.2);
    const patternStrength = patterns.queryFrequency > 3 ? 0.1 : 0;
    return Math.min(1.0, baseConfidence + patternStrength);
  }

  private buildReasoning(needs: string[], patterns: any): string {
    return `Inferred ${needs.length} needs based on ${patterns.queryFrequency} previous queries in domains: ${patterns.commonDomains.join(', ')}`;
  }
}

// ============================================================
// CONTEXT SELECTION FOR UNDERSTANDING
// ============================================================

export class ContextSelector {
  /**
   * Actively select relevant context for understanding
   */
  async selectForUnderstanding(
    query: string,
    availableContexts: any[],
    maxContexts: number = 5
  ): Promise<{
    selected: any[];
    selectionReasoning: string;
    relevanceScores: number[];
  }> {
    // Score each context for relevance
    const scored = availableContexts.map(ctx => ({
      context: ctx,
      score: this.calculateRelevance(ctx, query)
    }));

    // Sort by relevance
    scored.sort((a, b) => b.score - a.score);

    // Select top contexts
    const selected = scored.slice(0, maxContexts).map(s => s.context);
    const relevanceScores = scored.slice(0, maxContexts).map(s => s.score);

    const reasoning = this.buildSelectionReasoning(selected, scored);

    logger.info('Context selection for understanding', {
      available: availableContexts.length,
      selected: selected.length,
      avgRelevance: (relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length).toFixed(3)
    });

    return {
      selected,
      selectionReasoning: reasoning,
      relevanceScores
    };
  }

  private calculateRelevance(context: any, query: string): number {
    const queryLower = query.toLowerCase();
    const contextText = JSON.stringify(context).toLowerCase();

    // Keyword overlap
    const queryWords = queryLower.split(/\s+/);
    const contextWords = contextText.split(/\s+/);
    const overlap = queryWords.filter(w => contextWords.includes(w)).length;
    const keywordScore = overlap / Math.max(1, queryWords.length);

    // Domain match
    const domainScore = context.domain ? 0.2 : 0;

    // Recency (if available)
    const recencyScore = context.timestamp 
      ? Math.max(0, 1 - (Date.now() - context.timestamp) / (7 * 24 * 60 * 60 * 1000)) * 0.2
      : 0;

    return Math.min(1.0, keywordScore + domainScore + recencyScore);
  }

  private buildSelectionReasoning(selected: any[], scored: any[]): string {
    const topScore = scored[0]?.score || 0;
    const avgScore = scored.slice(0, selected.length).reduce((sum, s) => sum + s.score, 0) / Math.max(1, selected.length);
    
    return `Selected ${selected.length} contexts with relevance scores: ${topScore.toFixed(3)} (top), ${avgScore.toFixed(3)} (avg)`;
  }
}

// ============================================================
// FACTORY FUNCTIONS
// ============================================================

export function createEntropyReducer(config?: Partial<EntropyReductionConfig>): EntropyReducer {
  return new EntropyReducer(config);
}

export function createLayeredMemory(config?: Partial<LayeredMemoryConfig>): LayeredMemoryArchitecture {
  return new LayeredMemoryArchitecture(config);
}

export function createContextIsolation(): ContextIsolation {
  return new ContextIsolation();
}

export function createContextAbstraction(): ContextAbstraction {
  return new ContextAbstraction();
}

export function createProactiveInference(): ProactiveNeedInference {
  return new ProactiveNeedInference();
}

export function createContextSelector(): ContextSelector {
  return new ContextSelector();
}

