/**
 * MoE Execution Engine
 * 
 * Handles the core execution logic for MoE operations
 * Extracted from moe-orchestrator.ts for better organization
 */

import { getSkillLoadBalancer } from './load-balancer';
import { getQueryBatcher } from './query-batcher';
import { getSkillResourceManager } from './resource-manager';
import { getDynamicSkillRouter } from './dynamic-router';
import { BrainEvaluationSystem } from '../brain-evaluation-system';
import { logger } from '../logger';
import { 
  MoERequest, 
  MoEResponse, 
  SkillExecutionResult, 
  BatchExecutionResult,
  LoadBalancingResult,
  ResourceOptimizationResult,
  MoEConfiguration,
  MoEMetrics,
  MoEOptimizationResult
} from './moe-types';

export class MoEExecutionEngine {
  private batcher: ReturnType<typeof getQueryBatcher>;
  private loadBalancer: ReturnType<typeof getSkillLoadBalancer>;
  private resourceManager: ReturnType<typeof getSkillResourceManager>;
  private dynamicRouter: ReturnType<typeof getDynamicSkillRouter>;
  private evaluationSystem: BrainEvaluationSystem;
  private configuration: MoEConfiguration;

  constructor() {
    this.batcher = getQueryBatcher();
    this.loadBalancer = getSkillLoadBalancer();
    this.resourceManager = getSkillResourceManager();
    this.dynamicRouter = getDynamicSkillRouter();
    this.evaluationSystem = new BrainEvaluationSystem();
    
    this.configuration = {
      maxSkills: 5,
      minRelevanceScore: 0.2,
      enableBatching: true,
      enableLoadBalancing: true,
      enableResourceOptimization: true,
      enableDynamicImplementation: true,
      batchSize: 3,
      batchTimeout: 5000,
      maxConcurrency: 3,
      costThreshold: 0.05,
      qualityThreshold: 0.8,
      latencyThreshold: 30000
    };
  }

  /**
   * Execute skills with smart batching
   */
  async executeWithSmartBatching(
    skills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<Array<SkillExecutionResult>> {
    const startTime = Date.now();
    
    try {
      if (!this.shouldUseBatching(request, skills)) {
        return this.executeSkillsIndividually(skills, request);
      }

      const batchableSkills = await this.executeBatchableSkills(skills, request);
      const individualSkills = skills.filter(skill => 
        !batchableSkills.some(bs => bs.name === skill.name)
      );

      const batchResults = await this.executeSkillBatches(batchableSkills, request);
      const individualResults = await this.executeSkillsIndividually(individualSkills, request);

      const executionTime = Date.now() - startTime;
      logger.performance('Smart batching execution', executionTime, {
        batchableCount: batchableSkills.length,
        individualCount: individualSkills.length,
        totalSkills: skills.length
      });

      return [...batchResults, ...individualResults];

    } catch (error: any) {
      logger.error('Smart batching execution failed', error, {
        operation: 'moe_execution',
        metadata: {
          skillCount: skills.length
        }
      });
      throw error;
    }
  }

  /**
   * Execute batchable skills
   */
  private async executeBatchableSkills(
    skills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<Array<{ name: string; skill: any; score: number }>> {
    const batchableSkills: Array<{ name: string; skill: any; score: number }> = [];
    
    for (const skill of skills) {
      if (this.isSkillBatchable(skill.name, request)) {
        batchableSkills.push(skill);
      }
    }
    
    return batchableSkills;
  }

  /**
   * Check if a skill is batchable
   */
  private isSkillBatchable(skillName: string, request: MoERequest): boolean {
    // Skills that support batching
    const batchableSkills = [
      'gepa_optimization',
      'ace_framework', 
      'trm_engine',
      'advanced_rag',
      'advanced_reranking'
    ];
    
    return batchableSkills.includes(skillName) && 
           request.priority !== 'high' && 
           (!request.maxLatency || request.maxLatency > 5000);
  }

  /**
   * Execute skills individually
   */
  private async executeSkillsIndividually(
    skills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<Array<SkillExecutionResult>> {
    const results: Array<SkillExecutionResult> = [];
    
    for (const skill of skills) {
      try {
        const startTime = Date.now();
        const result = await this.executeSingleSkill(skill, request);
        const executionTime = Date.now() - startTime;
        
        results.push({
          success: true,
          result: result,
          skillName: skill.name,
          executionTime,
          cost: this.calculateSkillCost(skill.name),
          quality: skill.score
        });
        
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          skillName: skill.name,
          executionTime: 0,
          cost: 0,
          quality: 0
        });
      }
    }
    
    return results;
  }

  /**
   * Execute skill batches
   */
  private async executeSkillBatches(
    skills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<Array<SkillExecutionResult>> {
    const skillGroups = this.groupSkillsForBatching(skills);
    const results: Array<SkillExecutionResult> = [];
    
    for (const group of skillGroups) {
      try {
        const batchResult = await this.executeSkillBatch(group, request);
        
        // Convert batch results to individual results
        for (let i = 0; i < group.length; i++) {
          const skill = group[i];
          const batchItem = batchResult.results[i];
          
          results.push({
            success: batchItem.success,
            result: batchItem.result,
            error: batchItem.error,
            skillName: skill.name,
            executionTime: batchResult.metadata.processingTime / group.length,
            cost: batchResult.metadata.cost / group.length,
            quality: skill.score
          });
        }
        
      } catch (error: any) {
        // If batch fails, execute individually
        const individualResults = await this.executeSkillsIndividually(group, request);
        results.push(...individualResults);
      }
    }
    
    return results;
  }

  /**
   * Group skills for batching
   */
  private groupSkillsForBatching(
    skills: Array<{ name: string; skill: any; score: number }>
  ): Array<Array<{ name: string; skill: any; score: number }>> {
    const groups: Array<Array<{ name: string; skill: any; score: number }>> = [];
    const batchSize = this.configuration.batchSize;
    
    for (let i = 0; i < skills.length; i += batchSize) {
      groups.push(skills.slice(i, i + batchSize));
    }
    
    return groups;
  }

  /**
   * Execute a skill batch
   */
  private async executeSkillBatch(
    skills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<BatchExecutionResult> {
    const startTime = Date.now();
    const skillName = skills[0].name; // Use first skill name for batch
    
    try {
      const executableSkill = this.getExecutableSkill(skillName);
      
      if (!executableSkill.executeBatch) {
        throw new Error(`Skill ${skillName} does not support batch execution`);
      }
      
      const batchQueries = skills.map(skill => ({
        query: request.query,
        context: request.context,
        skillName: skill.name
      }));
      
      const batchResult = await executableSkill.executeBatch(batchQueries);
      
      const processingTime = Date.now() - startTime;
      const cost = this.calculateBatchCost(skills);
      
      return {
        skillName,
        results: batchResult.results || skills.map(() => ({ success: true, result: batchResult })),
        metadata: {
          batchSize: skills.length,
          processingTime,
          cost
        }
      };
      
    } catch (error: any) {
      logger.error(`Batch execution failed for ${skillName}`, error, {
        operation: 'moe_batch_execution',
        metadata: {
          skillName,
          batchSize: skills.length
        }
      });
      
      return {
        skillName,
        results: skills.map(() => ({ 
          success: false, 
          error: error.message 
        })),
        metadata: {
          batchSize: skills.length,
          processingTime: Date.now() - startTime,
          cost: 0
        }
      };
    }
  }

  /**
   * Execute with load balancing
   */
  async executeWithLoadBalancing(
    skillName: string,
    executableSkill: any,
    request: MoERequest
  ): Promise<LoadBalancingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.configuration.enableLoadBalancing) {
        const result = await executableSkill.execute(request.query, request.context);
        return {
          skillName,
          result,
          executionTime: Date.now() - startTime,
          cost: this.calculateSkillCost(skillName),
          quality: 0.8,
          loadBalanced: false
        };
      }
      
      // Execute skill directly (load balancing is handled internally)
      const result = await executableSkill.execute(request.query, request.context);
      
      return {
        skillName,
        result: result.result,
        executionTime: result.executionTime,
        cost: result.cost,
        quality: result.quality,
        loadBalanced: true
      };
      
    } catch (error: any) {
      logger.error(`Load balancing execution failed for ${skillName}`, error, {
        operation: 'moe_load_balancing',
        metadata: {
          skillName
        }
      });
      
      throw error;
    }
  }

  /**
   * Execute with resource optimization
   */
  async executeWithResourceOptimization(
    skillName: string,
    executableSkill: any,
    request: MoERequest
  ): Promise<ResourceOptimizationResult> {
    const startTime = Date.now();
    
    try {
      if (!this.configuration.enableResourceOptimization) {
        const result = await executableSkill.execute(request.query, request.context);
        return {
          skillName,
          result,
          executionTime: Date.now() - startTime,
          cost: this.calculateSkillCost(skillName),
          quality: 0.8,
          resourceOptimized: false
        };
      }
      
      // Execute skill directly (resource optimization is handled internally)
      const result = await executableSkill.execute(request.query, request.context);
      const executionTime = Date.now() - startTime;
      
      return {
        skillName,
        result: result.result,
        executionTime,
        cost: this.calculateSkillCost(skillName),
        quality: result.quality || 0.8,
        resourceOptimized: true
      };
      
    } catch (error: any) {
      logger.error(`Resource optimization execution failed for ${skillName}`, error, {
        operation: 'moe_resource_optimization',
        metadata: {
          skillName
        }
      });
      
      throw error;
    }
  }

  /**
   * Execute a single skill
   */
  private async executeSingleSkill(
    skill: { name: string; skill: any; score: number },
    request: MoERequest
  ): Promise<any> {
    const executableSkill = this.getExecutableSkill(skill.name);
    
    if (this.configuration.enableResourceOptimization) {
      return this.executeWithResourceOptimization(skill.name, executableSkill, request);
    } else if (this.configuration.enableLoadBalancing) {
      return this.executeWithLoadBalancing(skill.name, executableSkill, request);
    } else {
      return executableSkill.execute(request.query, request.context);
    }
  }

  /**
   * Get executable skill implementation
   */
  private getExecutableSkill(skillId: string): any {
    // This would be implemented based on the actual skill registry
    // For now, return a mock implementation
    return {
      execute: async (query: string, context: any) => {
        // Mock implementation
        return { result: `Mock result for ${skillId}`, query, context };
      },
      executeBatch: async (queries: any[]) => {
        // Mock batch implementation
        return { results: queries.map(() => ({ success: true, result: 'Mock batch result' })) };
      }
    };
  }

  /**
   * Check if batching should be used
   */
  private shouldUseBatching(
    request: MoERequest, 
    skills: Array<{ name: string; skill: any; score: number }>
  ): boolean {
    if (!this.configuration.enableBatching) return false;
    if (request.priority === 'high') return false;
    if (request.maxLatency && request.maxLatency < 5000) return false;
    if (skills.length < 2) return false;
    
    return true;
  }

  /**
   * Calculate skill cost
   */
  private calculateSkillCost(skillName: string): number {
    // Mock cost calculation
    const costMap: Record<string, number> = {
      'gepa_optimization': 0.001,
      'ace_framework': 0.002,
      'trm_engine': 0.003,
      'advanced_rag': 0.004,
      'advanced_reranking': 0.002,
      'multilingual_business': 0.005,
      'quality_evaluation': 0.001,
      'legal_analysis': 0.006,
      'teacher_student': 0.008
    };
    
    return costMap[skillName] || 0.001;
  }

  /**
   * Calculate batch cost
   */
  private calculateBatchCost(skills: Array<{ name: string; skill: any; score: number }>): number {
    return skills.reduce((total, skill) => total + this.calculateSkillCost(skill.name), 0);
  }

  /**
   * Get configuration
   */
  getConfiguration(): MoEConfiguration {
    return { ...this.configuration };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<MoEConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
    logger.info('MoE configuration updated', {
      operation: 'moe_configuration',
      metadata: {
        newConfig
      }
    });
  }
}
