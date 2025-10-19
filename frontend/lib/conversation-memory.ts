import { ContextDelta, ConversationSession, ContextQuality } from './types';

export class ConversationMemory {
  private sessions: Map<string, ConversationSession> = new Map();
  private maxSessions: number = 100;
  private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Get or create a conversation session
   */
  async getSession(sessionId: string, userId?: string): Promise<ConversationSession> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        userId: userId || 'anonymous',
        context: [],
        conversationHistory: [],
        metadata: {
          created_at: new Date(),
          last_accessed: new Date(),
          message_count: 0,
          domain_focus: 'general',
          complexity_trend: []
        }
      };
      this.sessions.set(sessionId, session);
    } else {
      session.metadata.last_accessed = new Date();
    }

    return session;
  }

  /**
   * Add context delta to session
   */
  async addContextDelta(sessionId: string, delta: ContextDelta): Promise<void> {
    const session = await this.getSession(sessionId);
    
    // Add delta to context
    session.context.push(delta);
    
    // Update session metadata
    session.metadata.message_count++;
    session.metadata.last_accessed = new Date();
    
    // Track domain focus
    if (delta.metadata.domain) {
      session.metadata.domain_focus = delta.metadata.domain;
    }
    
    // Track complexity trend
    if (delta.metadata.complexity) {
      session.metadata.complexity_trend.push({
        timestamp: new Date(),
        complexity: delta.metadata.complexity
      });
      
      // Keep only last 50 complexity measurements
      if (session.metadata.complexity_trend.length > 50) {
        session.metadata.complexity_trend = session.metadata.complexity_trend.slice(-50);
      }
    }
    
    console.log(`💾 Added context delta to session ${sessionId}: ${delta.type}`);
  }

  /**
   * Add conversation message to history
   */
  async addMessage(sessionId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    metadata?: any;
  }): Promise<void> {
    const session = await this.getSession(sessionId);
    
    session.conversationHistory.push({
      ...message,
      timestamp: new Date(),
      id: this.generateMessageId()
    });
    
    session.metadata.message_count++;
    session.metadata.last_accessed = new Date();
  }

  /**
   * Get context for a session with intelligent retrieval
   */
  async getContext(sessionId: string, query?: string, maxBullets: number = 20): Promise<ContextDelta[]> {
    const session = await this.getSession(sessionId);
    
    if (!query) {
      // Return most recent bullets
      return session.context
        .sort((a, b) => b.metadata.last_used.getTime() - a.metadata.last_used.getTime())
        .slice(0, maxBullets);
    }
    
    // Intelligent retrieval based on query relevance
    const relevantBullets = await this.findRelevantBullets(session.context, query);
    
    return relevantBullets.slice(0, maxBullets);
  }

  /**
   * Find relevant context bullets for a query
   */
  private async findRelevantBullets(bullets: ContextDelta[], query: string): Promise<ContextDelta[]> {
    // Simple relevance scoring (would ideally use semantic similarity)
    const scoredBullets = bullets.map(bullet => {
      const contentMatch = bullet.content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const typeMatch = this.getTypeRelevance(bullet.type, query);
      const recencyScore = this.getRecencyScore(bullet.metadata.last_used);
      const helpfulnessScore = bullet.metadata.helpful_count / (bullet.metadata.helpful_count + bullet.metadata.harmful_count + 1);
      
      const relevanceScore = (
        contentMatch * 0.4 +
        typeMatch * 0.3 +
        recencyScore * 0.2 +
        helpfulnessScore * 0.1
      );
      
      return { bullet, score: relevanceScore };
    });
    
    return scoredBullets
      .sort((a, b) => b.score - a.score)
      .map(item => item.bullet);
  }

  private getTypeRelevance(type: string, query: string): number {
    const queryLower = query.toLowerCase();
    
    if (type === 'strategy' && (queryLower.includes('how') || queryLower.includes('approach'))) return 1.0;
    if (type === 'concept' && (queryLower.includes('what') || queryLower.includes('define'))) return 1.0;
    if (type === 'failure_mode' && (queryLower.includes('error') || queryLower.includes('problem'))) return 1.0;
    if (type === 'precedent' && (queryLower.includes('example') || queryLower.includes('case'))) return 1.0;
    
    return 0.5; // Default relevance
  }

  private getRecencyScore(lastUsed: Date): number {
    const now = new Date();
    const hoursSinceUsed = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);
    
    // Decay over 24 hours
    return Math.max(0, 1 - (hoursSinceUsed / 24));
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<{
    session: ConversationSession;
    contextQuality: ContextQuality;
    domainEvolution: string[];
    complexityTrend: number[];
    engagementMetrics: {
      totalMessages: number;
      avgResponseTime: number;
      contextUtilization: number;
    };
  }> {
    const session = await this.getSession(sessionId);
    
    // Calculate context quality
    const contextQuality: ContextQuality = {
      relevance: this.calculateAvgRelevance(session.context),
      coherence: this.calculateCoherence(session.context),
      completeness: this.calculateCompleteness(session.context),
      recency: this.calculateAvgRecency(session.context),
      token_efficiency: this.calculateTokenEfficiency(session.context),
      bullet_count: session.context.length
    };
    
    // Domain evolution
    const domainEvolution = session.metadata.complexity_trend
      .map(t => t.domain || 'general')
      .filter((domain, index, arr) => arr.indexOf(domain) === index);
    
    // Complexity trend
    const complexityTrend = session.metadata.complexity_trend.map(t => t.complexity);
    
    // Engagement metrics
    const engagementMetrics = {
      totalMessages: session.metadata.message_count,
      avgResponseTime: this.calculateAvgResponseTime(session.conversationHistory),
      contextUtilization: session.context.length / 100 // Assuming 100 is max context bullets
    };
    
    return {
      session,
      contextQuality,
      domainEvolution,
      complexityTrend,
      engagementMetrics
    };
  }

  private calculateAvgRelevance(bullets: ContextDelta[]): number {
    if (bullets.length === 0) return 0;
    return bullets.reduce((sum, b) => sum + b.metadata.relevance_score, 0) / bullets.length;
  }

  private calculateCoherence(bullets: ContextDelta[]): number {
    if (bullets.length < 2) return 1.0;
    
    // Simple coherence based on type diversity
    const types = new Set(bullets.map(b => b.type));
    return Math.min(1.0, types.size / 4);
  }

  private calculateCompleteness(bullets: ContextDelta[]): number {
    const expectedTypes = ['strategy', 'concept', 'failure_mode', 'precedent'];
    const presentTypes = new Set(bullets.map(b => b.type));
    return presentTypes.size / expectedTypes.length;
  }

  private calculateAvgRecency(bullets: ContextDelta[]): number {
    if (bullets.length === 0) return 0;
    
    const now = new Date();
    const avgAge = bullets.reduce((sum, bullet) => {
      const age = (now.getTime() - bullet.metadata.last_used.getTime()) / (1000 * 60 * 60 * 24);
      return sum + age;
    }, 0) / bullets.length;
    
    return Math.max(0, 1 - (avgAge / 7)); // Decay over 7 days
  }

  private calculateTokenEfficiency(bullets: ContextDelta[]): number {
    const totalTokens = bullets.reduce((sum, b) => sum + b.metadata.token_count, 0);
    const maxTokens = 100000; // Max context window
    return Math.min(1.0, totalTokens / maxTokens);
  }

  private calculateAvgResponseTime(history: any[]): number {
    // Calculate average time between user and assistant messages
    let totalTime = 0;
    let responseCount = 0;
    
    for (let i = 1; i < history.length; i++) {
      if (history[i].role === 'assistant' && history[i-1].role === 'user') {
        const timeDiff = history[i].timestamp.getTime() - history[i-1].timestamp.getTime();
        totalTime += timeDiff;
        responseCount++;
      }
    }
    
    return responseCount > 0 ? totalTime / responseCount : 0;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      const timeSinceLastAccess = now.getTime() - session.metadata.last_accessed.getTime();
      
      if (timeSinceLastAccess > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
      console.log(`🧹 Cleaned up expired session: ${sessionId}`);
    });
    
    // Also clean up if we have too many sessions
    if (this.sessions.size > this.maxSessions) {
      const sessionsArray = Array.from(this.sessions.entries());
      sessionsArray.sort((a, b) => a[1].metadata.last_accessed.getTime() - b[1].metadata.last_accessed.getTime());
      
      const toRemove = sessionsArray.slice(0, sessionsArray.length - this.maxSessions);
      toRemove.forEach(([sessionId]) => {
        this.sessions.delete(sessionId);
        console.log(`🧹 Cleaned up old session: ${sessionId}`);
      });
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    avgContextSize: number;
    avgMessageCount: number;
    domainDistribution: Record<string, number>;
  } {
    const sessions = Array.from(this.sessions.values());
    
    const domainDistribution: Record<string, number> = {};
    sessions.forEach(session => {
      const domain = session.metadata.domain_focus;
      domainDistribution[domain] = (domainDistribution[domain] || 0) + 1;
    });
    
    return {
      totalSessions: sessions.length,
      avgContextSize: sessions.reduce((sum, s) => sum + s.context.length, 0) / sessions.length,
      avgMessageCount: sessions.reduce((sum, s) => sum + s.metadata.message_count, 0) / sessions.length,
      domainDistribution
    };
  }
}
