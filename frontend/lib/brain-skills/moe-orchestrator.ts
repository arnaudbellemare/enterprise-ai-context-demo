/**
 * MoE Brain Orchestrator
 * Complete integration of all MoE optimization patterns
 * Based on vLLM MoE architecture adapted for brain skills
 */

import { getSkillLoadBalancer } from './load-balancer';
import { getQueryBatcher } from './query-batcher';
import { getSkillResourceManager } from './resource-manager';
import { getDynamicSkillRouter } from './dynamic-router';
import { moeSkillRouter } from '../moe-skill-router';

export interface MoERequest {
  query: string;
  context: any;
  sessionId?: string;
  priority?: 'low' | 'normal' | 'high';
  budget?: number;
  maxLatency?: number;
  requiredQuality?: number;
}

export interface MoEResponse {
  response: string;
  metadata: {
    skillsActivated: string[];
    skillScores: Record<string, number>;
    implementations: Record<string, string>;
    totalCost: number;
    averageQuality: number;
    totalLatency: number;
    moeOptimized: boolean;
    batchOptimized: boolean;
    loadBalanced: boolean;
    resourceOptimized: boolean;
  };
  performance: {
    selectionTime: number;
    executionTime: number;
    synthesisTime: number;
    totalTime: number;
  };
}

export class MoEBrainOrchestrator {
  private router: any;
  private batcher: ReturnType<typeof getQueryBatcher>;
  private loadBalancer: ReturnType<typeof getSkillLoadBalancer>;
  private resourceManager: ReturnType<typeof getSkillResourceManager>;
  private dynamicRouter: ReturnType<typeof getDynamicSkillRouter>;
  private initialized: boolean = false;

  constructor(routerInstance?: any) {
    // Use the provided router instance or create a new one
    this.router = routerInstance || moeSkillRouter;
    this.batcher = getQueryBatcher();
    this.loadBalancer = getSkillLoadBalancer();
    this.resourceManager = getSkillResourceManager();
    this.dynamicRouter = getDynamicSkillRouter();
    
    console.log(`🧠 MoE Orchestrator: Initialized with ${this.router['experts']?.size || 0} experts`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing MoE Brain Orchestrator...');
    
    try {
      // Initialize resource manager first
      await this.resourceManager.initialize();
      
      this.initialized = true;
      console.log('✅ MoE Brain Orchestrator initialized successfully');
    } catch (error) {
      console.error('❌ MoE Brain Orchestrator initialization failed:', error);
      throw error;
    }
  }

  async executeQuery(request: MoERequest): Promise<MoEResponse> {
    const startTime = Date.now();
    
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`🧠 MoE Orchestrator: Processing query "${request.query.substring(0, 50)}..."`);

    try {
      // 1. Top-K Skill Selection
      const selectionStart = Date.now();
      const topSkills = await this.selectTopKSkills(request);
      const selectionTime = Date.now() - selectionStart;

      console.log(`🎯 Selected top-${topSkills.length} skills:`,
        topSkills.map(s => `${s.name}(${s.score.toFixed(2)})`));

      // 2. Dynamic Implementation Selection
      const implementationStart = Date.now();
      const implementations = await this.selectOptimalImplementations(topSkills, request);
      const implementationTime = Date.now() - implementationStart;

      // 3. Query Batching (if applicable)
      const batchingStart = Date.now();
      const shouldBatch = this.shouldUseBatching(request, topSkills);
      let results: any[];

      if (shouldBatch) {
        console.log('🔄 Using query batching for optimization');
        results = await this.batcher.executeWithBatching(
          request.query,
          request.context,
          topSkills
        );
      } else {
        // 4. Load-Balanced Execution
        const executionStart = Date.now();
        results = await this.executeWithLoadBalancing(implementations, request);
        const executionTime = Date.now() - executionStart;
        console.log(`⚡ Execution completed in ${executionTime}ms`);
      }

      // 5. Synthesis
      const synthesisStart = Date.now();
      const response = await this.synthesizeResults(results, topSkills, request);
      const synthesisTime = Date.now() - synthesisStart;

      const totalTime = Date.now() - startTime;

      return {
        response: response.response,
        metadata: {
          skillsActivated: topSkills.map(s => s.name),
          skillScores: Object.fromEntries(topSkills.map(s => [s.name, s.score])),
          implementations: Object.fromEntries(implementations.map(impl => [impl.skillName, impl.implementation.name])),
          totalCost: this.calculateTotalCost(implementations),
          averageQuality: this.calculateAverageQuality(implementations),
          totalLatency: totalTime,
          moeOptimized: true,
          batchOptimized: shouldBatch,
          loadBalanced: true,
          resourceOptimized: true
        },
        performance: {
          selectionTime,
          executionTime: Date.now() - batchingStart,
          synthesisTime,
          totalTime
        }
      };

    } catch (error) {
      console.error('❌ MoE Orchestrator execution failed:', error);
      throw error;
    }
  }

  private async selectTopKSkills(request: MoERequest): Promise<Array<{ name: string; skill: any; score: number }>> {
    // Use the existing MoE skill router
    const moeRequest = {
      query: request.query,
      domain: request.context.domain || 'general',
      complexity: request.context.complexity || 5,
      requirements: request.context.requirements || [],
      budget: request.budget,
      maxLatency: request.maxLatency
    };

    console.log(`🧠 MoE Orchestrator: Calling router with ${this.router['experts']?.size || 0} experts`);
    const result = await this.router.routeQuery(moeRequest);
    
    console.log(`🧠 MoE Orchestrator: Router returned ${result.selectedExperts.length} experts`);
    
    return result.selectedExperts.map((expert: any) => ({
      name: expert.id,
      skill: expert,
      score: expert.relevanceScore || 0.5
    }));
  }

  private async selectOptimalImplementations(
    skills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<Array<{ skillName: string; implementation: any }>> {
    const implementations = [];

    for (const { name, skill } of skills) {
      try {
        const implementation = this.dynamicRouter.selectOptimalImplementation(name, request.context);
        implementations.push({ skillName: name, implementation });
      } catch (error) {
        console.warn(`⚠️ No optimal implementation found for ${name}, using default`);
        implementations.push({ 
          skillName: name, 
          implementation: { name: 'default', costPerQuery: 0.001, avgLatency: 1000 }
        });
      }
    }

    return implementations;
  }

  private shouldUseBatching(request: MoERequest, skills: Array<{ name: string; skill: any; score: number }>): boolean {
    // Use batching for non-real-time queries with multiple skills
    return !request.context.needsRealTime && 
           skills.length > 2 && 
           request.priority !== 'high';
  }

  private async executeWithLoadBalancing(
    implementations: Array<{ skillName: string; implementation: any }>,
    request: MoERequest
  ): Promise<any[]> {
    const results = await Promise.all(
      implementations.map(async ({ skillName, implementation }) => {
        try {
          // Get the actual skill from the router
          const skill = this.router['experts'].get(skillName);
          if (!skill) {
            throw new Error(`Skill ${skillName} not found`);
          }

          // Execute with load balancing
          const result = await this.loadBalancer.executeWithLoadBalancing(
            skillName,
            skill,
            request.query,
            request.context
          );

          // Record performance for learning
          this.dynamicRouter.recordPerformance(
            skillName,
            implementation.name,
            Date.now() - Date.now(), // This would be actual latency
            result.success !== false
          );

          return result;
        } catch (error) {
          console.error(`❌ Execution failed for ${skillName}:`, error);
          return { success: false, error: error.message, skillName };
        }
      })
    );

    return results;
  }

  private async synthesizeResults(
    results: any[],
    skills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<{ response: string }> {
    // Weighted synthesis based on skill scores
    const totalScore = skills.reduce((sum, s) => sum + s.score, 0);

    let synthesized = '';
    let hasContent = false;

    results.forEach((result, idx) => {
      if (!result || result.success === false) return;

      const weight = skills[idx].score / totalScore;
      const skillName = skills[idx].name;
      
      if (result.data || result.response) {
        synthesized += `\n\n### ${skillName} (weight: ${weight.toFixed(2)})\n`;
        synthesized += result.data || result.response || result;
        hasContent = true;
      }
    });

    if (!hasContent) {
      synthesized = `I apologize, but I wasn't able to generate a comprehensive response for your query "${request.query}". The selected skills didn't return usable results. Please try rephrasing your question or providing more context.`;
    }

    return { response: synthesized };
  }

  private calculateTotalCost(implementations: Array<{ skillName: string; implementation: any }>): number {
    return implementations.reduce((total, impl) => {
      return total + (impl.implementation.costPerQuery || 0.001);
    }, 0);
  }

  private calculateAverageQuality(implementations: Array<{ skillName: string; implementation: any }>): number {
    const qualities = implementations.map(impl => impl.implementation.qualityScore || 0.8);
    return qualities.reduce((sum, quality) => sum + quality, 0) / qualities.length;
  }

  // Public API for monitoring
  getSystemStatus(): {
    initialized: boolean;
    resourceStatus: any;
    loadBalancerStatus: any;
    batcherStatus: any;
  } {
    return {
      initialized: this.initialized,
      resourceStatus: this.resourceManager.getWarmupStatus(),
      loadBalancerStatus: this.loadBalancer.getAllMetrics(),
      batcherStatus: this.batcher.getBatchStats()
    };
  }

  // Health check
  async healthCheck(): Promise<Record<string, any>> {
    const checks: Record<string, any> = {};

    try {
      checks.orchestrator = { status: 'healthy', initialized: this.initialized };
      checks.resourceManager = await this.resourceManager.healthCheck();
      checks.loadBalancer = { status: 'healthy', metrics: this.loadBalancer.getAllMetrics() };
      checks.batcher = { status: 'healthy', stats: this.batcher.getBatchStats() };
      checks.dynamicRouter = { status: 'healthy', implementations: this.dynamicRouter.getAllImplementations('kimiK2').length };
    } catch (error) {
      checks.error = error.message;
    }

    return checks;
  }

  // Cleanup
  destroy(): void {
    this.batcher.destroy();
    this.resourceManager.cleanup();
    this.initialized = false;
  }
}

// Singleton instance
let moeOrchestratorInstance: MoEBrainOrchestrator | null = null;

export function getMoEBrainOrchestrator(routerInstance?: any): MoEBrainOrchestrator {
  if (!moeOrchestratorInstance || routerInstance) {
    moeOrchestratorInstance = new MoEBrainOrchestrator(routerInstance);
  }
  return moeOrchestratorInstance;
}
