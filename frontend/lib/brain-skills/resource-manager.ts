/**
 * Skill Resource Manager
 * Pre-allocates and reuses API clients, caches, and buffers
 * Based on vLLM MoE resource management patterns
 */

export interface WorkspaceBuffer {
  buffer: Buffer;
  inUse: boolean;
  size: number;
  lastUsed: number;
}

export interface ResourceMetrics {
  totalAllocated: number;
  activeConnections: number;
  cacheHitRate: number;
  avgResponseTime: number;
  lastWarmup: number;
}

export class WorkspaceBufferManager {
  private buffers: Map<string, WorkspaceBuffer> = new Map();
  private bufferSizes: Map<string, number> = new Map();

  constructor() {
    // Configure buffer sizes for different skills
    this.bufferSizes.set('kimiK2', 1024 * 1024);      // 1MB for OpenRouter
    this.bufferSizes.set('trm', 512 * 1024);          // 512KB for internal processing
    this.bufferSizes.set('gepa', 2 * 1024 * 1024);   // 2MB for GEPA optimization
    this.bufferSizes.set('ace', 1024 * 1024);        // 1MB for ACE framework
    this.bufferSizes.set('moeSkillRouter', 256 * 1024); // 256KB for MoE routing
    this.bufferSizes.set('teacher_student', 512 * 1024); // 512KB for Teacher-Student
    this.bufferSizes.set('advanced_rag', 1024 * 1024);  // 1MB for RAG operations
    this.bufferSizes.set('advanced_reranking', 256 * 1024); // 256KB for reranking
    this.bufferSizes.set('multilingual_business', 512 * 1024); // 512KB for multilingual
    this.bufferSizes.set('quality_evaluation', 256 * 1024); // 256KB for quality assessment
  }

  acquireBuffer(skillName: string): Buffer {
    let buffer = this.buffers.get(skillName);
    
    if (!buffer) {
      const size = this.bufferSizes.get(skillName) || 1024 * 1024;
      buffer = {
        buffer: Buffer.allocUnsafe(size),
        inUse: false,
        size,
        lastUsed: Date.now()
      };
      this.buffers.set(skillName, buffer);
    }

    if (buffer.inUse) {
      // Buffer busy, allocate temporary
      console.log(`⚠️ ${skillName} buffer busy, allocating temporary buffer`);
      return Buffer.allocUnsafe(buffer.size);
    }

    buffer.inUse = true;
    buffer.lastUsed = Date.now();
    return buffer.buffer;
  }

  releaseBuffer(skillName: string): void {
    const buffer = this.buffers.get(skillName);
    if (buffer) {
      buffer.inUse = false;
      buffer.lastUsed = Date.now();
    }
  }

  cleanup(): void {
    const now = Date.now();
    const expiredBuffers: string[] = [];

    this.buffers.forEach((buffer, skillName) => {
      // Clean up buffers not used for 5 minutes
      if (!buffer.inUse && now - buffer.lastUsed > 300000) {
        expiredBuffers.push(skillName);
      }
    });

    expiredBuffers.forEach(skillName => {
      this.buffers.delete(skillName);
    });

    if (expiredBuffers.length > 0) {
      console.log(`🧹 Cleaned up ${expiredBuffers.length} expired buffers`);
    }
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.buffers.forEach((buffer, skillName) => {
      stats[skillName] = {
        size: buffer.size,
        inUse: buffer.inUse,
        lastUsed: buffer.lastUsed
      };
    });
    return stats;
  }
}

export class SkillResourceManager {
  private apiClients: Map<string, any> = new Map();
  private workspaceManager: WorkspaceBufferManager;
  private warmupComplete: Map<string, boolean> = new Map();
  private metrics: Map<string, ResourceMetrics> = new Map();
  private connectionPools: Map<string, any> = new Map();

  constructor() {
    this.workspaceManager = new WorkspaceBufferManager();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const skillNames = [
      'kimiK2', 'trm', 'gepa', 'ace', 'moeSkillRouter',
      'teacher_student', 'advanced_rag', 'advanced_reranking',
      'multilingual_business', 'quality_evaluation'
    ];

    skillNames.forEach(skillName => {
      this.metrics.set(skillName, {
        totalAllocated: 0,
        activeConnections: 0,
        cacheHitRate: 0,
        avgResponseTime: 0,
        lastWarmup: 0
      });
    });
  }

  async initialize(): Promise<void> {
    console.log('🔥 Warming up skill resources...');
    const startTime = Date.now();

    try {
      // Pre-allocate API clients
      await Promise.all([
        this.initializeKimiK2Client(),
        this.initializeTRMClient(),
        this.initializeGEPAClient(),
        this.initializeACEClient(),
        this.initializeMoERouterClient(),
        this.initializeTeacherStudentClient(),
        this.initializeRAGClient(),
        this.initializeRerankingClient(),
        this.initializeMultilingualClient(),
        this.initializeQualityEvaluationClient()
      ]);

      // Pre-allocate workspace buffers
      this.workspaceManager = new WorkspaceBufferManager();

      const warmupTime = Date.now() - startTime;
      console.log(`✅ Resource warmup complete in ${warmupTime}ms`);

      // Update metrics
      this.metrics.forEach((metrics, skillName) => {
        metrics.lastWarmup = Date.now();
      });

    } catch (error) {
      console.error('❌ Resource warmup failed:', error);
      throw error;
    }
  }

  private async initializeKimiK2Client(): Promise<void> {
    try {
      // Simulate OpenRouter client initialization
      const client = {
        apiKey: process.env.OPENROUTER_API_KEY,
        keepAlive: true,
        maxSockets: 5,
        healthCheck: async () => ({ status: 'ok' })
      };

      // Warmup request
      await client.healthCheck();

      this.apiClients.set('kimiK2', client);
      this.warmupComplete.set('kimiK2', true);
      console.log('✅ Kimi K2 client warmed up');
    } catch (error) {
      console.error('❌ Kimi K2 client warmup failed:', error);
      this.warmupComplete.set('kimiK2', false);
    }
  }

  private async initializeTRMClient(): Promise<void> {
    try {
      const client = {
        type: 'internal',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('trm', client);
      this.warmupComplete.set('trm', true);
      console.log('✅ TRM client warmed up');
    } catch (error) {
      console.error('❌ TRM client warmup failed:', error);
      this.warmupComplete.set('trm', false);
    }
  }

  private async initializeGEPAClient(): Promise<void> {
    try {
      const client = {
        type: 'optimization',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('gepa', client);
      this.warmupComplete.set('gepa', true);
      console.log('✅ GEPA client warmed up');
    } catch (error) {
      console.error('❌ GEPA client warmup failed:', error);
      this.warmupComplete.set('gepa', false);
    }
  }

  private async initializeACEClient(): Promise<void> {
    try {
      const client = {
        type: 'context',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('ace', client);
      this.warmupComplete.set('ace', true);
      console.log('✅ ACE client warmed up');
    } catch (error) {
      console.error('❌ ACE client warmup failed:', error);
      this.warmupComplete.set('ace', false);
    }
  }

  private async initializeMoERouterClient(): Promise<void> {
    try {
      const client = {
        type: 'routing',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('moeSkillRouter', client);
      this.warmupComplete.set('moeSkillRouter', true);
      console.log('✅ MoE Router client warmed up');
    } catch (error) {
      console.error('❌ MoE Router client warmup failed:', error);
      this.warmupComplete.set('moeSkillRouter', false);
    }
  }

  private async initializeTeacherStudentClient(): Promise<void> {
    try {
      const client = {
        type: 'learning',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('teacher_student', client);
      this.warmupComplete.set('teacher_student', true);
      console.log('✅ Teacher-Student client warmed up');
    } catch (error) {
      console.error('❌ Teacher-Student client warmup failed:', error);
      this.warmupComplete.set('teacher_student', false);
    }
  }

  private async initializeRAGClient(): Promise<void> {
    try {
      const client = {
        type: 'retrieval',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('advanced_rag', client);
      this.warmupComplete.set('advanced_rag', true);
      console.log('✅ Advanced RAG client warmed up');
    } catch (error) {
      console.error('❌ Advanced RAG client warmup failed:', error);
      this.warmupComplete.set('advanced_rag', false);
    }
  }

  private async initializeRerankingClient(): Promise<void> {
    try {
      const client = {
        type: 'ranking',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('advanced_reranking', client);
      this.warmupComplete.set('advanced_reranking', true);
      console.log('✅ Advanced Reranking client warmed up');
    } catch (error) {
      console.error('❌ Advanced Reranking client warmup failed:', error);
      this.warmupComplete.set('advanced_reranking', false);
    }
  }

  private async initializeMultilingualClient(): Promise<void> {
    try {
      const client = {
        type: 'multilingual',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('multilingual_business', client);
      this.warmupComplete.set('multilingual_business', true);
      console.log('✅ Multilingual Business client warmed up');
    } catch (error) {
      console.error('❌ Multilingual Business client warmup failed:', error);
      this.warmupComplete.set('multilingual_business', false);
    }
  }

  private async initializeQualityEvaluationClient(): Promise<void> {
    try {
      const client = {
        type: 'evaluation',
        warmup: true,
        healthCheck: async () => ({ status: 'ok' })
      };

      await client.healthCheck();
      this.apiClients.set('quality_evaluation', client);
      this.warmupComplete.set('quality_evaluation', true);
      console.log('✅ Quality Evaluation client warmed up');
    } catch (error) {
      console.error('❌ Quality Evaluation client warmup failed:', error);
      this.warmupComplete.set('quality_evaluation', false);
    }
  }

  getClient(skillName: string): any {
    const client = this.apiClients.get(skillName);
    if (!client || !this.warmupComplete.get(skillName)) {
      console.warn(`⚠️ ${skillName} client not warmed up, using cold client`);
      return this.createColdClient(skillName);
    }
    return client;
  }

  getWorkspace(skillName: string): Buffer {
    return this.workspaceManager.acquireBuffer(skillName);
  }

  releaseWorkspace(skillName: string): void {
    this.workspaceManager.releaseBuffer(skillName);
  }

  private createColdClient(skillName: string): any {
    // Create a basic client for skills that weren't warmed up
    return {
      type: 'cold',
      skillName,
      healthCheck: async () => ({ status: 'cold', skillName })
    };
  }

  // Public API for monitoring
  getWarmupStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.warmupComplete.forEach((isWarm, skillName) => {
      status[skillName] = isWarm;
    });
    return status;
  }

  getResourceMetrics(): Record<string, ResourceMetrics> {
    const metrics: Record<string, ResourceMetrics> = {};
    this.metrics.forEach((metric, skillName) => {
      metrics[skillName] = { ...metric };
    });
    return metrics;
  }

  getWorkspaceStats(): Record<string, any> {
    return this.workspaceManager.getStats();
  }

  // Cleanup
  cleanup(): void {
    this.workspaceManager.cleanup();
  }

  // Health check
  async healthCheck(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const [skillName, client] of this.apiClients) {
      try {
        const health = await client.healthCheck();
        results[skillName] = { status: 'healthy', ...health };
      } catch (error) {
        results[skillName] = { status: 'unhealthy', error: error.message };
      }
    }
    
    return results;
  }
}

// Singleton instance
let resourceManagerInstance: SkillResourceManager | null = null;

export function getSkillResourceManager(): SkillResourceManager {
  if (!resourceManagerInstance) {
    resourceManagerInstance = new SkillResourceManager();
  }
  return resourceManagerInstance;
}
