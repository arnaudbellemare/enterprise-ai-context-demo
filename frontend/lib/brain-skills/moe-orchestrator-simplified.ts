/**
 * Simplified MoE Brain Orchestrator
 * 
 * Main orchestrator that coordinates MoE operations
 * Uses the execution engine for actual work
 */

import { moeSkillRouter } from '../moe-skill-router';
import { MoEExecutionEngine } from './moe-execution-engine';
import { BrainEvaluationSystem } from '../brain-evaluation-system';
import { logger } from '../logger';
import { 
  MoERequest, 
  MoEResponse, 
  MoEConfiguration,
  MoEMetrics,
  MoEHealthCheck,
  PromptEvolutionData,
  PerformanceTrackingData,
  SelfImprovementConfig
} from './moe-types';

export class MoEBrainOrchestrator {
  private router: any;
  private executionEngine: MoEExecutionEngine;
  private evaluationSystem: BrainEvaluationSystem;
  private promptHistory: Map<string, string[]> = new Map();
  private performanceMetrics: Map<string, { score: number; feedback: string }[]> = new Map();
  private selfImprovementConfig: SelfImprovementConfig;

  constructor(routerInstance?: any) {
    this.router = routerInstance || moeSkillRouter;
    this.executionEngine = new MoEExecutionEngine();
    this.evaluationSystem = new BrainEvaluationSystem();
    
    this.selfImprovementConfig = {
      evolutionThreshold: 0.6,
      minSamplesForEvolution: 5,
      performanceWindow: 100,
      axLLMEnabled: true,
      enablePromptEvolution: true,
      enablePerformanceTracking: true,
      enableAdaptiveRouting: true,
      trackingWindow: 5,
      adaptationRate: 0.1
    };
    
    logger.info('MoE Brain Orchestrator initialized', {
      operation: 'moe_initialization',
      metadata: {
        routerType: this.router.constructor.name,
        selfImprovementEnabled: this.selfImprovementConfig.enablePromptEvolution
      }
    });
  }

  /**
   * Execute a query using MoE optimization
   */
  async executeQuery(request: MoERequest): Promise<MoEResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('MoE query execution started', {
        operation: 'moe_execution',
        metadata: {
        query: request.query.substring(0, 100),
        priority: request.priority,
        sessionId: request.sessionId
      
        }});

      // Step 1: Select top-k skills
      const selectionStart = Date.now();
      const selectedSkills = await this.selectTopKSkills(request);
      const selectionTime = Date.now() - selectionStart;

      if (selectedSkills.length === 0) {
        logger.warn('No skills selected for MoE execution', {
          operation: 'moe_execution',
        metadata: {
          query: request.query.substring(0, 100)
        
        }});
        
        return this.createFallbackResponse(request, selectionTime);
      }

      // Step 2: Execute skills with optimization
      const executionStart = Date.now();
      const executionResults = await this.executionEngine.executeWithSmartBatching(
        selectedSkills,
        request
      );
      const executionTime = Date.now() - executionStart;

      // Step 3: Synthesize results
      const synthesisStart = Date.now();
      const synthesizedResponse = await this.synthesizeResults(
        executionResults,
        selectedSkills,
        request
      );
      const synthesisTime = Date.now() - synthesisStart;

      const totalTime = Date.now() - startTime;

      // Step 4: Self-improvement tracking (disabled for now - needs proper evaluation)
      // if (this.selfImprovementConfig.enablePerformanceTracking) {
      //   await this.trackPerformanceAndEvolve(selectedSkills, request, synthesizedResponse);
      // }

      const response: MoEResponse = {
        response: synthesizedResponse.response,
        metadata: {
          skillsActivated: selectedSkills.map(s => s.name),
          skillScores: selectedSkills.reduce((acc, s) => ({ ...acc, [s.name]: s.score }), {}),
          implementations: this.getImplementationInfo(executionResults),
          totalCost: this.calculateTotalCost(executionResults),
          averageQuality: this.calculateAverageQuality(executionResults),
          totalLatency: totalTime,
          moeOptimized: true,
          batchOptimized: !!this.executionEngine.getConfiguration().enableBatching,
          loadBalanced: !!this.executionEngine.getConfiguration().enableLoadBalancing,
          resourceOptimized: !!this.executionEngine.getConfiguration().enableResourceOptimization
        },
        performance: {
          selectionTime,
          executionTime,
          synthesisTime,
          totalTime
        }
      };

      logger.info('MoE query execution completed', {
        operation: 'moe_execution',
        metadata: {
        skillsActivated: selectedSkills.length,
        totalTime,
        success: true
      
        }});

      return response;

    } catch (error: any) {
      logger.error('MoE query execution failed', error, {
        operation: 'moe_execution',
        metadata: {
        query: request.query.substring(0, 100),
        duration: Date.now() - startTime
      
        }});
      
      return this.createErrorResponse(request, error, Date.now() - startTime);
    }
  }

  /**
   * Select top-k skills for execution
   */
  private async selectTopKSkills(request: MoERequest): Promise<Array<{ name: string; skill: any; score: number }>> {
    try {
      const routerResult = await this.router.routeQuery({
        query: request.query,
        domain: request.context?.domain || 'general',
        complexity: request.context?.complexity || 5,
        priority: request.priority || 'normal',
        budget: request.budget || 0.05,
        maxLatency: request.maxLatency || 30000,
        requiredQuality: request.requiredQuality || 0.8
      });

      if (!routerResult || !routerResult.experts || routerResult.experts.length === 0) {
        logger.warn('No experts selected by MoE router', {
          operation: 'moe_skill_selection',
        metadata: {
          query: request.query.substring(0, 100)
        
        }});
        return [];
      }

      const selectedSkills = routerResult.experts.map((expert: any) => ({
        name: expert.id,
        skill: expert,
        score: expert.relevanceScore || 0.5
      }));

      logger.info('Skills selected for MoE execution', {
        operation: 'moe_skill_selection',
        metadata: {
        skillCount: selectedSkills.length,
        skills: selectedSkills.map((s: any) => s.name)
      
        }});

      return selectedSkills;

    } catch (error: any) {
      logger.error('Skill selection failed', error, {
        operation: 'moe_skill_selection'
      });
      return [];
    }
  }

  /**
   * Synthesize results from multiple skills
   */
  private async synthesizeResults(
    executionResults: any[],
    selectedSkills: Array<{ name: string; skill: any; score: number }>,
    request: MoERequest
  ): Promise<{ response: string }> {
    try {
      const successfulResults = executionResults.filter(r => r.success);
      
      if (successfulResults.length === 0) {
        return {
          response: "I apologize, but I encountered an issue processing your request. Please try again or rephrase your question."
        };
      }

      // Simple synthesis - combine results
      const combinedResults = successfulResults.map(r => r.result).join('\n\n');
      
      // Use evaluation system for quality assessment
      const evaluationResults = await this.evaluationSystem.evaluateBrainResponse({
        query: request.query,
        response: combinedResults,
        domain: request.context?.domain || 'general',
        reasoningMode: 'multi-expert',
        patternsActivated: selectedSkills.map(s => s.name),
        metadata: {
          skillScores: selectedSkills.reduce((acc, s) => ({ ...acc, [s.name]: s.score }), {}),
          totalScore: selectedSkills.reduce((sum, s) => sum + s.score, 0) / selectedSkills.length,
          context: request.context
        }
      });

      // Track performance for self-improvement
      if (this.selfImprovementConfig.enablePerformanceTracking) {
        for (const skill of selectedSkills) {
          const evaluation = Array.isArray(evaluationResults) ? 
            evaluationResults.find((e: any) => e.name === skill.name) : undefined;
          
          if (evaluation) {
            await this.trackPerformanceAndEvolve(skill.name, request.query, combinedResults, evaluation);
          }
        }
      }

      return { response: combinedResults };

    } catch (error: any) {
      logger.error('Result synthesis failed', error, {
        operation: 'moe_synthesis'
      });
      
      return {
        response: "I apologize, but I encountered an issue synthesizing the results. Please try again."
      };
    }
  }

  /**
   * Track performance and evolve prompts
   */
  private async trackPerformanceAndEvolve(
    skillName: string,
    query: string,
    response: any,
    evaluation: any
  ): Promise<void> {
    try {
      const metrics = this.performanceMetrics.get(skillName) || [];
      metrics.push({
        score: evaluation.score || 0.5,
        feedback: evaluation.reason || 'No feedback available'
      });
      this.performanceMetrics.set(skillName, metrics);

      const avgScore = metrics.slice(-5).reduce((sum, m) => sum + m.score, 0) / Math.min(metrics.length, 5);

      if (avgScore < this.selfImprovementConfig.evolutionThreshold && metrics.length >= 3) {
        logger.info('Low performance detected, evolving prompt', {
          operation: 'moe_self_improvement',
          metadata: {
            skillName,
            avgScore,
            threshold: this.selfImprovementConfig.evolutionThreshold
          }
        });

        const latestFeedback = metrics[metrics.length - 1].feedback;
        const evolvedPrompt = await this.evolvePromptWithAxLLM(skillName, query, latestFeedback);
        
        logger.info('Prompt evolved successfully', {
          operation: 'moe_self_improvement',
        metadata: {
          skillName,
          evolvedPrompt: evolvedPrompt.substring(0, 100)
        
        }});
      }

    } catch (error: any) {
      logger.warn('Performance tracking failed', {
        operation: 'moe_self_improvement',
        metadata: {
          skillName,
          error: error.message
        }
      });
    }
  }

  /**
   * Evolve prompt using Ax LLM (direct fetch implementation)
   */
  private async evolvePromptWithAxLLM(skillName: string, query: string, feedback: string): Promise<string> {
    try {
      const history = this.promptHistory.get(skillName) || [];
      const metrics = this.performanceMetrics.get(skillName) || [];
      
      const analysisPrompt = `
        Analyze the following feedback and performance history to evolve the prompt:
        
        Current Query: "${query}"
        Feedback: "${feedback}"
        
        Recent Performance:
        ${metrics.slice(-5).map(m => `Score: ${m.score}, Feedback: ${m.feedback}`).join('\n')}
        
        Prompt History:
        ${history.slice(-3).join('\n')}
        
        Generate an improved prompt that addresses the failure patterns and builds on successful strategies.
        Focus on:
        1. What worked well in previous attempts
        2. What failed and why
        3. How to improve based on the feedback
        4. Specific prompt modifications
      `;
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemma-2-9b-it:free',
          messages: [
            { role: 'system', content: 'You are an expert prompt optimizer. Analyze feedback and evolve prompts to improve performance.' },
            { role: 'user', content: analysisPrompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const improvedPrompt = data.choices[0].message.content;
      
      history.push(improvedPrompt);
      this.promptHistory.set(skillName, history);
      
      return improvedPrompt;
      
    } catch (error: any) {
      logger.warn('Ax LLM prompt evolution failed', {
        operation: 'moe_self_improvement',
        metadata: {
          skillName,
          error: error.message
        }
      });
      return query; // Fallback to original query
    }
  }

  /**
   * Create fallback response when no skills are selected
   */
  private createFallbackResponse(request: MoERequest, selectionTime: number): MoEResponse {
    return {
      response: "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question.",
      metadata: {
        skillsActivated: [],
        skillScores: {},
        implementations: {},
        totalCost: 0,
        averageQuality: 0,
        totalLatency: selectionTime,
        moeOptimized: false,
        batchOptimized: false,
        loadBalanced: false,
        resourceOptimized: false
      },
      performance: {
        selectionTime,
        executionTime: 0,
        synthesisTime: 0,
        totalTime: selectionTime
      }
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(request: MoERequest, error: any, totalTime: number): MoEResponse {
    return {
      response: `I apologize, but I encountered an error processing your request: ${error.message}`,
      metadata: {
        skillsActivated: [],
        skillScores: {},
        implementations: {},
        totalCost: 0,
        averageQuality: 0,
        totalLatency: totalTime,
        moeOptimized: false,
        batchOptimized: false,
        loadBalanced: false,
        resourceOptimized: false
      },
      performance: {
        selectionTime: 0,
        executionTime: 0,
        synthesisTime: 0,
        totalTime
      }
    };
  }

  /**
   * Get implementation info from execution results
   */
  private getImplementationInfo(executionResults: any[]): Record<string, string> {
    return executionResults.reduce((acc, result) => {
      if (result.success) {
        acc[result.skillName] = 'executed';
      }
      return acc;
    }, {});
  }

  /**
   * Calculate total cost
   */
  private calculateTotalCost(executionResults: any[]): number {
    return executionResults.reduce((total, result) => total + (result.cost || 0), 0);
  }

  /**
   * Calculate average quality
   */
  private calculateAverageQuality(executionResults: any[]): number {
    const successfulResults = executionResults.filter(r => r.success);
    if (successfulResults.length === 0) return 0;
    
    const totalQuality = successfulResults.reduce((sum, result) => sum + (result.quality || 0), 0);
    return totalQuality / successfulResults.length;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<MoEHealthCheck> {
    try {
      const components = {
        router: !!this.router,
        batcher: true, // Execution engine handles this
        loadBalancer: true,
        resourceManager: true,
        dynamicRouter: true
      };

      const metrics: MoEMetrics = {
        totalQueries: 0,
        totalRequests: 0, // Would be tracked in production
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        averageResponseTime: 0,
        averageCost: 0,
        averageQuality: 0,
        skillUsageCount: {},
        errorRate: 0,
        cacheHitRate: 0,
        batchEfficiency: 0,
        loadBalancingEfficiency: 0,
        resourceOptimizationEfficiency: 0
      };

      return {
        status: Object.values(components).every(Boolean) ? 'healthy' : 'degraded',
        components,
        metrics,
        details: {},
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };

    } catch (error: any) {
      logger.error('Health check failed', error, {
        operation: 'moe_health_check'
      });
      
      return {
        status: 'unhealthy',
        components: {
          router: false,
          batcher: false,
          loadBalancer: false,
          resourceManager: false,
          dynamicRouter: false
        },
        metrics: {} as MoEMetrics,
        details: {},
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Get configuration
   */
  getConfiguration(): MoEConfiguration {
    return this.executionEngine.getConfiguration();
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<MoEConfiguration>): void {
    this.executionEngine.updateConfiguration(newConfig);
  }
}

/**
 * Factory function to create MoE orchestrator
 */
export function getMoEBrainOrchestrator(routerInstance?: any): MoEBrainOrchestrator {
  return new MoEBrainOrchestrator(routerInstance);
}
