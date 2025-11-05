import { DynamicContextManager } from './dynamic-context-manager';
import { ConversationMemory } from './conversation-memory';
import { ContextEvolutionTracker } from './context-evolution-tracker';
import { ContextOptimizer } from './context-optimizer';
import { ContextQualityMonitor } from './context-quality-monitor';
import { ContextDelta, ContextQuality, ConversationSession, ContextManagerConfig } from './types';
import {
  createEntropyReducer,
  createLayeredMemory,
  createContextIsolation,
  createContextAbstraction,
  createProactiveInference,
  createContextSelector,
  type EntropyReductionConfig,
  type LayeredMemoryConfig
} from './context-engineering-2';
import { extendedIntelligenceMetrics, type ContextQualityMetrics } from './extended-intelligence-metrics';
import { contextQualityDashboard } from './context-quality-dashboard';

export class AdvancedContextSystem {
  private contextManager: DynamicContextManager;
  private memory: ConversationMemory;
  private tracker: ContextEvolutionTracker;
  private optimizer: ContextOptimizer;
  private qualityMonitor: ContextQualityMonitor;
  private config: ContextManagerConfig;
  
  // Context Engineering 2.0 components
  private entropyReducer: ReturnType<typeof createEntropyReducer>;
  private layeredMemory: ReturnType<typeof createLayeredMemory>;
  private contextIsolation: ReturnType<typeof createContextIsolation>;
  private contextAbstraction: ReturnType<typeof createContextAbstraction>;
  private proactiveInference: ReturnType<typeof createProactiveInference>;
  private contextSelector: ReturnType<typeof createContextSelector>;

  constructor(config?: Partial<ContextManagerConfig>) {
    this.config = {
      maxTokens: 100000,
      compressionThreshold: 0.8,
      qualityThresholds: {
        relevance: 0.6,
        coherence: 0.5,
        completeness: 0.4,
        recency: 0.3,
        token_efficiency: 0.8
      },
      monitoringInterval: 30000,
      ...config
    };

    // Initialize components
    this.contextManager = new DynamicContextManager(this.config.maxTokens);
    this.memory = new ConversationMemory();
    this.tracker = new ContextEvolutionTracker();
    this.optimizer = new ContextOptimizer(this.contextManager, this.memory, this.tracker);
    this.qualityMonitor = new ContextQualityMonitor(this.config.qualityThresholds);

    // Initialize Context Engineering 2.0 components
    this.entropyReducer = createEntropyReducer({
      compressionRatio: 0.3,
      semanticPreservation: true,
      structurePreservation: true,
      enableSummarization: true
    });
    this.layeredMemory = createLayeredMemory({
      workingMemorySize: 10,
      episodicMemorySize: 100,
      semanticMemorySize: 1000,
      enableLifelongUpdate: true
    });
    this.contextIsolation = createContextIsolation();
    this.contextAbstraction = createContextAbstraction();
    this.proactiveInference = createProactiveInference();
    this.contextSelector = createContextSelector();

    // Start monitoring
    this.qualityMonitor.startMonitoring();

    console.log('🧠 Advanced Context System initialized with Context Engineering 2.0');
  }

  /**
   * Process a query with full context management
   */
  async processQuery(sessionId: string, query: string, userId?: string): Promise<{
    response: string;
    context: ContextDelta[];
    quality: ContextQuality;
    optimizations: any[];
    analytics: any;
  }> {
    console.log(`🧠 Processing query for session ${sessionId}: ${query.substring(0, 50)}...`);

    // 1. Get or create session
    const session = await this.memory.getSession(sessionId, userId);

    // 2. Add query to conversation history
    await this.memory.addMessage(sessionId, {
      role: 'user',
      content: query,
      metadata: { timestamp: new Date() }
    });

    // 3. Get relevant context (with Context Engineering 2.0)
    const rawContext = await this.memory.getContext(sessionId, query, 20);
    
    // Context Engineering 2.0: Select context for understanding
    const selectionResult = await this.contextSelector.selectForUnderstanding(
      query,
      rawContext,
      10
    );
    const relevantContext = selectionResult.selected;
    
    // Context Engineering 2.0: Proactive need inference (using session data)
    const sessionData = await this.memory.getSession(sessionId);
    const conversationHistory = sessionData?.conversationHistory || [];
    const inferredNeeds = await this.proactiveInference.inferNeeds(
      query,
      conversationHistory.map((m: any) => ({ content: m.content, timestamp: m.timestamp?.getTime() || Date.now() })),
      { domain: this.detectDomain(query) }
    );
    
    console.log(`📚 Retrieved ${relevantContext.length} relevant context bullets (Context Engineering 2.0)`);
    if (inferredNeeds.inferredNeeds.length > 0) {
      console.log(`🔮 Proactive inference: ${inferredNeeds.inferredNeeds.length} needs inferred (confidence: ${inferredNeeds.confidence.toFixed(2)})`);
    }

    // 4. Add new context delta (with entropy reduction)
    const domain = this.detectDomain(query);
    
    // Context Engineering 2.0: Reduce entropy before storing
    const entropyReduced = await this.entropyReducer.reduceEntropy(query, query, domain);
    
    // Context Engineering 2.0: Store in layered memory
    const memoryResult = await this.layeredMemory.storeContext(
      { content: entropyReduced.lowEntropyContext, query, domain },
      this.analyzeComplexity(query) > 0.7 ? 0.8 : 0.5, // Importance based on complexity
      1.0 // Recent (current query)
    );
    
    // Context Engineering 2.0: Create isolated context for task
    this.contextIsolation.createIsolatedContext(sessionId, domain);
    this.contextIsolation.storeInIsolatedContext(sessionId, domain, {
      query,
      reducedContext: entropyReduced.lowEntropyContext,
      entropyReduction: entropyReduced.entropyReduction
    });
    
    const newDelta = await this.contextManager.addToContext(entropyReduced.lowEntropyContext, {
      domain,
      complexity: this.analyzeComplexity(query),
      sessionId,
      userId,
      entropyReduction: entropyReduced.entropyReduction,
      memoryLayer: memoryResult.layer
    });

    await this.memory.addContextDelta(sessionId, newDelta);

    // 5. Track evolution
    await this.tracker.trackEvolution({
      type: 'add',
      bulletId: newDelta.id,
      content: query,
      metadata: { domain: newDelta.metadata.domain, complexity: newDelta.metadata.complexity }
    });

    // 6. Automatic optimization
    const optimizationResult = await this.optimizer.optimizeContext(sessionId, query);
    console.log(`🔧 Optimization: ${optimizationResult.optimized ? 'Applied' : 'Skipped'} (${optimizationResult.improvements.length} improvements)`);

    // 7. Quality monitoring
    const qualityReport = await this.qualityMonitor.performQualityCheck();
    console.log(`📊 Quality: ${qualityReport.qualityGrade} (${qualityReport.overallScore.toFixed(3)})`);

    // 8. Generate response (this would integrate with your existing response generation)
    const response = await this.generateResponse(query, relevantContext, session);

    // 9. Add response to conversation history
    await this.memory.addMessage(sessionId, {
      role: 'assistant',
      content: response,
      metadata: { 
        quality: qualityReport.overallScore,
        optimizations: optimizationResult.optimizations.length
      }
    });

    // 10. Get final context and analytics
    const finalContext = await this.memory.getContext(sessionId, query, 20);
    const analytics = await this.memory.getSessionAnalytics(sessionId);

    // 11. Record extended intelligence metrics
    const contextQuality: ContextQualityMetrics = {
      relevance: qualityReport.currentQuality.relevance || 0.5,
      coherence: qualityReport.currentQuality.coherence || 0.5,
      completeness: qualityReport.currentQuality.completeness || 0.5,
      efficiency: this.calculateContextEfficiency(finalContext, entropyReduced),
      freshness: this.calculateFreshness(finalContext),
      diversity: this.calculateDiversity(finalContext),
    };
    
    contextQualityDashboard.recordQuality(contextQuality);
    
    // Note: Full extended intelligence metrics require agent-only answer for comparison
    // This would be recorded in the pipeline when we have both agent-only and context-enhanced answers

    return {
      response,
      context: finalContext,
      quality: qualityReport.currentQuality,
      optimizations: optimizationResult.optimizations,
      analytics: {
        ...analytics,
        contextQuality,
        extendedIntelligence: {
          contextContribution: contextQuality,
          intelligenceExtension: contextQuality.efficiency,
        },
      },
    };
  }
  
  /**
   * Calculate context efficiency (quality improvement per token)
   */
  private calculateContextEfficiency(context: ContextDelta[], entropyReduced: any): number {
    if (context.length === 0) return 0;
    
    const totalTokens = context.reduce((sum, c) => sum + (c.content.length / 4), 0); // Approximate tokens
    const entropyReduction = entropyReduced.entropyReduction || 0;
    
    // Efficiency = entropy reduction / tokens (higher is better)
    return totalTokens > 0 ? Math.min(1, entropyReduction / (totalTokens / 100)) : 0;
  }
  
  /**
   * Calculate context freshness (how recent is the context)
   */
  private calculateFreshness(context: ContextDelta[]): number {
    if (context.length === 0) return 0;
    
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const freshnessScores = context.map(c => {
      const age = now - (c.metadata.timestamp || now);
      return Math.max(0, 1 - (age / maxAge));
    });
    
    return freshnessScores.reduce((sum, score) => sum + score, 0) / freshnessScores.length;
  }
  
  /**
   * Calculate context diversity (how diverse are the sources)
   */
  private calculateDiversity(context: ContextDelta[]): number {
    if (context.length === 0) return 0;
    
    const sources = new Set(context.map(c => c.metadata.domain || 'general'));
    const types = new Set(context.map(c => c.type));
    
    // Diversity = unique sources / total items (normalized)
    const sourceDiversity = Math.min(1, sources.size / context.length);
    const typeDiversity = Math.min(1, types.size / context.length);
    
    return (sourceDiversity * 0.6) + (typeDiversity * 0.4);
  }

  /**
   * Get context for a session
   */
  async getContext(sessionId: string, query?: string): Promise<ContextDelta[]> {
    return await this.memory.getContext(sessionId, query, 20);
  }

  /**
   * Update context feedback
   */
  async updateContextFeedback(sessionId: string, bulletId: string, helpful: boolean): Promise<void> {
    await this.contextManager.updateBulletFeedback(bulletId, helpful);
    
    // Track feedback evolution
    await this.tracker.trackEvolution({
      type: 'update',
      bulletId,
      content: `Feedback: ${helpful ? 'helpful' : 'harmful'}`,
      metadata: { feedback: helpful }
    });
  }

  /**
   * Get context analytics
   */
  async getContextAnalytics(sessionId: string): Promise<{
    session: ConversationSession;
    quality: ContextQuality;
    evolution: any;
    optimizations: any;
    recommendations: string[];
  }> {
    const session = await this.memory.getSession(sessionId);
    const analytics = await this.memory.getSessionAnalytics(sessionId);
    const evolution = this.tracker.getEvolutionAnalytics();
    const qualityDashboard = this.qualityMonitor.getQualityDashboard();

    return {
      session,
      quality: analytics.contextQuality,
      evolution,
      optimizations: qualityDashboard.recommendations,
      recommendations: [
        ...analytics.contextQuality ? [] : ['Improve context quality'],
        ...evolution.recommendations,
        ...qualityDashboard.recommendations
      ]
    };
  }

  /**
   * Get system-wide analytics
   */
  getSystemAnalytics(): {
    memory: any;
    evolution: any;
    quality: any;
    context: any;
  } {
    return {
      memory: this.memory.getStats(),
      evolution: this.tracker.getEvolutionSummary(),
      quality: this.qualityMonitor.getQualityStats(),
      context: this.contextManager.getStats()
    };
  }

  /**
   * Detect domain from query
   */
  private detectDomain(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('legal') || queryLower.includes('attorney') || queryLower.includes('lawyer')) {
      return 'legal';
    }
    if (queryLower.includes('finance') || queryLower.includes('financial') || queryLower.includes('investment')) {
      return 'finance';
    }
    if (queryLower.includes('tech') || queryLower.includes('technology') || queryLower.includes('software')) {
      return 'technology';
    }
    if (queryLower.includes('medical') || queryLower.includes('health') || queryLower.includes('doctor')) {
      return 'medical';
    }
    
    return 'general';
  }

  /**
   * Analyze query complexity
   */
  private analyzeComplexity(query: string): number {
    const queryLower = query.toLowerCase();
    let complexity = 0;
    
    // Length factor
    complexity += Math.min(1, query.length / 200);
    
    // Keyword factors
    const complexKeywords = ['analyze', 'compare', 'evaluate', 'synthesize', 'complex', 'detailed'];
    const keywordCount = complexKeywords.filter(keyword => queryLower.includes(keyword)).length;
    complexity += keywordCount * 0.2;
    
    // Question type factors
    if (queryLower.includes('why') || queryLower.includes('how')) complexity += 0.3;
    if (queryLower.includes('what if') || queryLower.includes('scenario')) complexity += 0.4;
    
    return Math.min(1, complexity);
  }

  /**
   * Generate response (placeholder - would integrate with your existing system)
   */
  private async generateResponse(query: string, context: ContextDelta[], session: ConversationSession): Promise<string> {
    // This would integrate with your existing response generation system
    // For now, return a placeholder response that doesn't call external APIs
    const contextSummary = context.map(bullet => `[${bullet.type}] ${bullet.content.substring(0, 50)}...`).join('\n');
    return `Response to: ${query}\n\nContext Summary (${context.length} bullets):\n${contextSummary}\n\nSession: ${session.id}`;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.qualityMonitor.stopMonitoring();
    console.log('🧠 Advanced Context System shutdown');
  }
}
