import { ContextDelta, ContextQuality, ConversationSession } from './types';
import { DynamicContextManager } from './dynamic-context-manager';
import { ConversationMemory } from './conversation-memory';
import { ContextEvolutionTracker } from './context-evolution-tracker';

export class ContextOptimizer {
  private contextManager: DynamicContextManager;
  private memory: ConversationMemory;
  private tracker: ContextEvolutionTracker;
  private optimizationThreshold: number = 0.7;
  private maxOptimizationAttempts: number = 3;

  constructor(
    contextManager: DynamicContextManager,
    memory: ConversationMemory,
    tracker: ContextEvolutionTracker
  ) {
    this.contextManager = contextManager;
    this.memory = memory;
    this.tracker = tracker;
  }

  /**
   * Automatically optimize context for a session
   */
  async optimizeContext(sessionId: string, query: string): Promise<{
    optimized: boolean;
    improvements: string[];
    qualityBefore: ContextQuality;
    qualityAfter: ContextQuality;
    optimizations: OptimizationResult[];
  }> {
    const session = await this.memory.getSession(sessionId);
    const qualityBefore = this.contextManager.getContextQuality();
    
    console.log(`🔧 Starting automatic context optimization for session ${sessionId}`);
    
    const optimizations: OptimizationResult[] = [];
    const improvements: string[] = [];

    // 1. Relevance Optimization
    const relevanceOpt = await this.optimizeRelevance(session, query);
    if (relevanceOpt.improved) {
      optimizations.push(relevanceOpt);
      improvements.push('Improved context relevance');
    }

    // 2. Coherence Optimization
    const coherenceOpt = await this.optimizeCoherence(session);
    if (coherenceOpt.improved) {
      optimizations.push(coherenceOpt);
      improvements.push('Improved context coherence');
    }

    // 3. Completeness Optimization
    const completenessOpt = await this.optimizeCompleteness(session, query);
    if (completenessOpt.improved) {
      optimizations.push(completenessOpt);
      improvements.push('Improved context completeness');
    }

    // 4. Token Efficiency Optimization
    const efficiencyOpt = await this.optimizeTokenEfficiency(session);
    if (efficiencyOpt.improved) {
      optimizations.push(efficiencyOpt);
      improvements.push('Improved token efficiency');
    }

    // 5. Recency Optimization
    const recencyOpt = await this.optimizeRecency(session);
    if (recencyOpt.improved) {
      optimizations.push(recencyOpt);
      improvements.push('Improved context recency');
    }

    const qualityAfter = this.contextManager.getContextQuality();
    const overallImprovement = this.calculateOverallImprovement(qualityBefore, qualityAfter);

    // Track optimization event
    await this.tracker.trackEvolution({
      type: 'update',
      bulletId: 'optimization',
      content: `Automatic optimization: ${improvements.length} improvements`,
      metadata: { 
        optimizations: optimizations.length,
        improvements: improvements,
        overallImprovement
      },
      qualityBefore,
      qualityAfter
    });

    console.log(`🔧 Context optimization complete: ${improvements.length} improvements, ${overallImprovement.toFixed(3)} overall improvement`);

    return {
      optimized: optimizations.length > 0,
      improvements,
      qualityBefore,
      qualityAfter,
      optimizations
    };
  }

  /**
   * Optimize context relevance
   */
  private async optimizeRelevance(session: ConversationSession, query: string): Promise<OptimizationResult> {
    const relevantBullets = await this.memory.getContext(session.id, query, 10);
    const currentRelevance = this.calculateRelevanceScore(session.context, query);
    
    // Remove low-relevance bullets
    const optimizedContext = session.context.filter(bullet => {
      const relevance = this.calculateBulletRelevance(bullet, query);
      return relevance > 0.3; // Keep bullets with relevance > 30%
    });

    const newRelevance = this.calculateRelevanceScore(optimizedContext, query);
    const improved = newRelevance > currentRelevance;

    if (improved) {
      session.context = optimizedContext;
      await this.memory.addContextDelta(session.id, {
        id: 'relevance_optimization',
        content: 'Context relevance optimized',
        metadata: { 
          helpful_count: 0,
          harmful_count: 0,
          last_used: new Date(),
          relevance_score: newRelevance,
          token_count: 0,
          type: 'optimization', 
          relevance_improvement: newRelevance - currentRelevance 
        },
        type: 'strategy',
        created_at: new Date()
      });
    }

    return {
      type: 'relevance',
      improved,
      improvement: newRelevance - currentRelevance,
      details: `Relevance: ${currentRelevance.toFixed(3)} → ${newRelevance.toFixed(3)}`
    };
  }

  /**
   * Optimize context coherence
   */
  private async optimizeCoherence(session: ConversationSession): Promise<OptimizationResult> {
    const currentCoherence = this.calculateCoherence(session.context);
    
    // Group bullets by topic and merge similar ones
    const topicGroups = this.groupBulletsByTopic(session.context);
    const optimizedContext: ContextDelta[] = [];

    for (const [topic, bullets] of topicGroups) {
      if (bullets.length > 1) {
        // Merge similar bullets
        const mergedBullet = this.mergeBullets(bullets);
        optimizedContext.push(mergedBullet);
      } else {
        optimizedContext.push(bullets[0]);
      }
    }

    const newCoherence = this.calculateCoherence(optimizedContext);
    const improved = newCoherence > currentCoherence;

    if (improved) {
      session.context = optimizedContext;
    }

    return {
      type: 'coherence',
      improved,
      improvement: newCoherence - currentCoherence,
      details: `Coherence: ${currentCoherence.toFixed(3)} → ${newCoherence.toFixed(3)}`
    };
  }

  /**
   * Optimize context completeness
   */
  private async optimizeCompleteness(session: ConversationSession, query: string): Promise<OptimizationResult> {
    const currentCompleteness = this.calculateCompleteness(session.context);
    const requiredTypes = this.identifyRequiredTypes(query);
    const missingTypes = requiredTypes.filter(type => 
      !session.context.some(bullet => bullet.type === type)
    );

    if (missingTypes.length === 0) {
      return {
        type: 'completeness',
        improved: false,
        improvement: 0,
        details: 'Context already complete'
      };
    }

    // Generate missing bullet types
    for (const type of missingTypes) {
      const newBullet = await this.generateBulletForType(type, query, session);
      if (newBullet) {
        session.context.push(newBullet);
        await this.memory.addContextDelta(session.id, newBullet);
      }
    }

    const newCompleteness = this.calculateCompleteness(session.context);
    const improved = newCompleteness > currentCompleteness;

    return {
      type: 'completeness',
      improved,
      improvement: newCompleteness - currentCompleteness,
      details: `Completeness: ${currentCompleteness.toFixed(3)} → ${newCompleteness.toFixed(3)}`
    };
  }

  /**
   * Optimize token efficiency
   */
  private async optimizeTokenEfficiency(session: ConversationSession): Promise<OptimizationResult> {
    const currentEfficiency = this.calculateTokenEfficiency(session.context);
    
    // Compress long bullets
    const optimizedContext = session.context.map(bullet => {
      if (bullet.metadata.token_count > 500) { // Compress long bullets
        return this.compressBullet(bullet);
      }
      return bullet;
    });

    const newEfficiency = this.calculateTokenEfficiency(optimizedContext);
    const improved = newEfficiency > currentEfficiency;

    if (improved) {
      session.context = optimizedContext;
    }

    return {
      type: 'token_efficiency',
      improved,
      improvement: newEfficiency - currentEfficiency,
      details: `Token efficiency: ${currentEfficiency.toFixed(3)} → ${newEfficiency.toFixed(3)}`
    };
  }

  /**
   * Optimize context recency
   */
  private async optimizeRecency(session: ConversationSession): Promise<OptimizationResult> {
    const currentRecency = this.calculateRecency(session.context);
    
    // Remove old bullets
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const optimizedContext = session.context.filter(bullet => 
      bullet.metadata.last_used > cutoffDate
    );

    const newRecency = this.calculateRecency(optimizedContext);
    const improved = newRecency > currentRecency;

    if (improved) {
      session.context = optimizedContext;
    }

    return {
      type: 'recency',
      improved,
      improvement: newRecency - currentRecency,
      details: `Recency: ${currentRecency.toFixed(3)} → ${newRecency.toFixed(3)}`
    };
  }

  /**
   * Calculate relevance score for context
   */
  private calculateRelevanceScore(context: ContextDelta[], query: string): number {
    if (context.length === 0) return 0;
    
    const totalScore = context.reduce((sum, bullet) => 
      sum + this.calculateBulletRelevance(bullet, query), 0
    );
    
    return totalScore / context.length;
  }

  /**
   * Calculate relevance for a single bullet
   */
  private calculateBulletRelevance(bullet: ContextDelta, query: string): number {
    const queryWords = query.toLowerCase().split(' ');
    const contentWords = bullet.content.toLowerCase().split(' ');
    
    const matches = queryWords.filter(word => 
      contentWords.some(contentWord => contentWord.includes(word))
    );
    
    return matches.length / queryWords.length;
  }

  /**
   * Calculate coherence score
   */
  private calculateCoherence(context: ContextDelta[]): number {
    if (context.length < 2) return 1.0;
    
    // Simple coherence based on type diversity and content similarity
    const types = new Set(context.map(b => b.type));
    const typeDiversity = types.size / 4; // 4 expected types
    
    // Content similarity (simplified)
    const contentSimilarity = this.calculateContentSimilarity(context);
    
    return (typeDiversity + contentSimilarity) / 2;
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(context: ContextDelta[]): number {
    if (context.length < 2) return 1.0;
    
    // Simplified similarity calculation
    const words = context.flatMap(bullet => bullet.content.toLowerCase().split(' '));
    const uniqueWords = new Set(words);
    
    return uniqueWords.size / words.length;
  }

  /**
   * Calculate completeness score
   */
  private calculateCompleteness(context: ContextDelta[]): number {
    const expectedTypes = ['strategy', 'concept', 'failure_mode', 'precedent'];
    const presentTypes = new Set(context.map(b => b.type));
    
    return presentTypes.size / expectedTypes.length;
  }

  /**
   * Calculate token efficiency
   */
  private calculateTokenEfficiency(context: ContextDelta[]): number {
    const totalTokens = context.reduce((sum, b) => sum + b.metadata.token_count, 0);
    const maxTokens = 100000;
    
    return Math.min(1.0, totalTokens / maxTokens);
  }

  /**
   * Calculate recency score
   */
  private calculateRecency(context: ContextDelta[]): number {
    if (context.length === 0) return 0;
    
    const now = new Date();
    const avgAge = context.reduce((sum, bullet) => {
      const age = (now.getTime() - bullet.metadata.last_used.getTime()) / (1000 * 60 * 60 * 24);
      return sum + age;
    }, 0) / context.length;
    
    return Math.max(0, 1 - (avgAge / 7)); // Decay over 7 days
  }

  /**
   * Group bullets by topic
   */
  private groupBulletsByTopic(context: ContextDelta[]): Map<string, ContextDelta[]> {
    const groups = new Map<string, ContextDelta[]>();
    
    context.forEach(bullet => {
      const topic = this.extractTopic(bullet.content);
      if (!groups.has(topic)) {
        groups.set(topic, []);
      }
      groups.get(topic)!.push(bullet);
    });
    
    return groups;
  }

  /**
   * Extract topic from content
   */
  private extractTopic(content: string): string {
    // Simple topic extraction (would ideally use NLP)
    const words = content.toLowerCase().split(' ');
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const meaningfulWords = words.filter(word => 
      word.length > 3 && !stopWords.includes(word)
    );
    
    return meaningfulWords.slice(0, 2).join('_');
  }

  /**
   * Merge similar bullets
   */
  private mergeBullets(bullets: ContextDelta[]): ContextDelta {
    const mergedContent = bullets.map(b => b.content).join(' | ');
    const mergedMetadata = {
      helpful_count: bullets.reduce((sum, b) => sum + b.metadata.helpful_count, 0),
      harmful_count: bullets.reduce((sum, b) => sum + b.metadata.harmful_count, 0),
      last_used: new Date(Math.max(...bullets.map(b => b.metadata.last_used.getTime()))),
      relevance_score: bullets.reduce((sum, b) => sum + b.metadata.relevance_score, 0) / bullets.length,
      token_count: bullets.reduce((sum, b) => sum + b.metadata.token_count, 0)
    };
    
    return {
      id: `merged_${Date.now()}`,
      content: mergedContent,
      metadata: mergedMetadata,
      type: bullets[0].type,
      created_at: new Date()
    };
  }

  /**
   * Identify required types for query
   */
  private identifyRequiredTypes(query: string): string[] {
    const queryLower = query.toLowerCase();
    const types: string[] = [];
    
    if (queryLower.includes('how') || queryLower.includes('approach')) {
      types.push('strategy');
    }
    if (queryLower.includes('what') || queryLower.includes('define')) {
      types.push('concept');
    }
    if (queryLower.includes('error') || queryLower.includes('problem')) {
      types.push('failure_mode');
    }
    if (queryLower.includes('example') || queryLower.includes('case')) {
      types.push('precedent');
    }
    
    return types.length > 0 ? types : ['strategy', 'concept'];
  }

  /**
   * Generate bullet for missing type
   */
  private async generateBulletForType(type: string, query: string, session: ConversationSession): Promise<ContextDelta | null> {
    // This would ideally use AI to generate relevant content
    const content = this.generateContentForType(type, query);
    
    // Ensure type is valid
    const validType = (type === 'strategy' || type === 'concept' || type === 'failure_mode' || type === 'precedent') 
      ? type as 'strategy' | 'concept' | 'failure_mode' | 'precedent'
      : 'strategy';
    
    return {
      id: `generated_${Date.now()}`,
      content,
      metadata: {
        helpful_count: 0,
        harmful_count: 0,
        last_used: new Date(),
        relevance_score: 0.8,
        token_count: this.countTokens(content)
      },
      type: validType,
      created_at: new Date()
    };
  }

  /**
   * Generate content for bullet type
   */
  private generateContentForType(type: string, query: string): string {
    const templates = {
      strategy: `Strategy for ${query}: Analyze the problem systematically, break it down into manageable steps, and implement a structured approach.`,
      concept: `Concept for ${query}: This involves understanding the fundamental principles and underlying mechanisms.`,
      failure_mode: `Common failure modes for ${query}: Watch out for these potential issues and how to avoid them.`,
      precedent: `Example for ${query}: Here's a relevant case study or example that demonstrates the concept.`
    };
    
    return templates[type as keyof typeof templates] || `Content for ${query}`;
  }

  /**
   * Compress long bullet
   */
  private compressBullet(bullet: ContextDelta): ContextDelta {
    const compressedContent = bullet.content.length > 200 
      ? bullet.content.substring(0, 200) + '...'
      : bullet.content;
    
    return {
      ...bullet,
      content: compressedContent,
      metadata: {
        ...bullet.metadata,
        token_count: this.countTokens(compressedContent)
      }
    };
  }

  /**
   * Count tokens in text
   */
  private countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate overall improvement
   */
  private calculateOverallImprovement(before: ContextQuality, after: ContextQuality): number {
    const beforeScore = (
      before.relevance * 0.3 +
      before.coherence * 0.2 +
      before.completeness * 0.2 +
      before.recency * 0.2 +
      before.token_efficiency * 0.1
    );
    
    const afterScore = (
      after.relevance * 0.3 +
      after.coherence * 0.2 +
      after.completeness * 0.2 +
      after.recency * 0.2 +
      after.token_efficiency * 0.1
    );
    
    return afterScore - beforeScore;
  }
}

interface OptimizationResult {
  type: string;
  improved: boolean;
  improvement: number;
  details: string;
}
