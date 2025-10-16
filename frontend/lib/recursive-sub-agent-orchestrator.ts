/**
 * 🔄 Recursive Sub-Agent Orchestrator
 * 
 * Implements intelligent recursive sub-agent calling with:
 * - Dynamic agent selection based on task complexity
 * - Recursive depth control and cycle detection
 * - Parallel and sequential execution strategies
 * - Result aggregation and conflict resolution
 */

export interface SubAgent {
  id: string;
  name: string;
  capabilities: string[];
  cost: number;
  latency: number;
  maxDepth: number;
  dependencies: string[];
}

export interface SubAgentTask {
  id: string;
  query: string;
  domain: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxDepth: number;
  currentDepth: number;
  parentTaskId?: string;
  requiredCapabilities: string[];
  context: Record<string, any>;
}

export interface SubAgentResult {
  agentId: string;
  result: any;
  confidence: number;
  cost: number;
  latency: number;
  subTasks: SubAgentTask[];
  metadata: {
    depth: number;
    executionTime: number;
    tokensUsed: number;
    quality: number;
  };
}

export interface RecursiveExecutionPlan {
  strategy: 'parallel' | 'sequential' | 'hybrid';
  maxDepth: number;
  maxCost: number;
  maxLatency: number;
  agents: SubAgent[];
  executionOrder: string[];
  fallbackStrategy: string;
}

class RecursiveSubAgentOrchestrator {
  private agents: SubAgent[] = [
    {
      id: 'trm-engine',
      name: 'TRM Engine',
      capabilities: ['analysis', 'synthesis', 'optimization', 'reasoning'],
      cost: 0.05,
      latency: 2000,
      maxDepth: 3,
      dependencies: ['ace-framework', 'gepa-optimizer']
    },
    {
      id: 'ace-framework',
      name: 'ACE Framework',
      capabilities: ['context_adaptation', 'healthcare', 'reasoning', 'validation'],
      cost: 0.03,
      latency: 1500,
      maxDepth: 2,
      dependencies: ['synthesis-agent']
    },
    {
      id: 'gepa-optimizer',
      name: 'GEPA Optimizer',
      capabilities: ['optimization', 'iteration', 'improvement', 'refinement'],
      cost: 0.04,
      latency: 3000,
      maxDepth: 4,
      dependencies: ['trm-engine']
    },
    {
      id: 'synthesis-agent',
      name: 'Synthesis Agent',
      capabilities: ['synthesis', 'aggregation', 'conflict_resolution', 'integration'],
      cost: 0.02,
      latency: 1000,
      maxDepth: 2,
      dependencies: []
    },
    {
      id: 'irt-router',
      name: 'IRT Specialist Router',
      capabilities: ['routing', 'selection', 'probability', 'optimization'],
      cost: 0.01,
      latency: 500,
      maxDepth: 1,
      dependencies: []
    }
  ];

  private executionHistory: Map<string, SubAgentResult[]> = new Map();
  private cycleDetection: Set<string> = new Set();

  /**
   * Create execution plan for recursive sub-agent calls
   */
  public createExecutionPlan(
    task: SubAgentTask,
    requirements: {
      maxDepth?: number;
      maxCost?: number;
      maxLatency?: number;
      strategy?: 'parallel' | 'sequential' | 'hybrid';
    } = {}
  ): RecursiveExecutionPlan {
    
    const maxDepth = Math.min(requirements.maxDepth || 3, task.maxDepth);
    const maxCost = requirements.maxCost || 0.5;
    const maxLatency = requirements.maxLatency || 30000;
    const strategy = requirements.strategy || 'hybrid';

    // Select agents based on required capabilities
    const selectedAgents = this.selectAgents(task.requiredCapabilities, maxCost, maxLatency);
    
    // Create execution order based on dependencies and strategy
    const executionOrder = this.createExecutionOrder(selectedAgents, strategy);
    
    return {
      strategy,
      maxDepth,
      maxCost,
      maxLatency,
      agents: selectedAgents,
      executionOrder,
      fallbackStrategy: 'ollama-fallback'
    };
  }

  /**
   * Select agents based on capabilities and constraints
   */
  private selectAgents(
    requiredCapabilities: string[],
    maxCost: number,
    maxLatency: number
  ): SubAgent[] {
    return this.agents.filter(agent => {
      // Check if agent has required capabilities
      const hasCapabilities = requiredCapabilities.some(cap => 
        agent.capabilities.includes(cap)
      );
      
      // Check cost and latency constraints
      const withinConstraints = agent.cost <= maxCost && agent.latency <= maxLatency;
      
      return hasCapabilities && withinConstraints;
    });
  }

  /**
   * Create execution order based on dependencies and strategy
   */
  private createExecutionOrder(agents: SubAgent[], strategy: string): string[] {
    if (strategy === 'parallel') {
      return agents.map(agent => agent.id);
    }
    
    // Sequential or hybrid: resolve dependencies
    const ordered: string[] = [];
    const visited = new Set<string>();
    
    const visit = (agentId: string) => {
      if (visited.has(agentId)) return;
      
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      
      // Visit dependencies first
      agent.dependencies.forEach(dep => {
        if (agents.some(a => a.id === dep)) {
          visit(dep);
        }
      });
      
      visited.add(agentId);
      ordered.push(agentId);
    };
    
    agents.forEach(agent => visit(agent.id));
    return ordered;
  }

  /**
   * Execute recursive sub-agent calls
   */
  public async executeRecursive(
    task: SubAgentTask,
    plan: RecursiveExecutionPlan
  ): Promise<SubAgentResult[]> {
    
    const results: SubAgentResult[] = [];
    const taskKey = `${task.id}_${task.currentDepth}`;
    
    // Cycle detection
    if (this.cycleDetection.has(taskKey)) {
      console.warn(`🔄 Cycle detected for task ${task.id} at depth ${task.currentDepth}`);
      return results;
    }
    
    this.cycleDetection.add(taskKey);
    
    try {
      if (plan.strategy === 'parallel') {
        results.push(...await this.executeParallel(task, plan));
      } else if (plan.strategy === 'sequential') {
        results.push(...await this.executeSequential(task, plan));
      } else {
        results.push(...await this.executeHybrid(task, plan));
      }
    } finally {
      this.cycleDetection.delete(taskKey);
    }
    
    // Store execution history
    this.executionHistory.set(taskKey, results);
    
    return results;
  }

  /**
   * Execute agents in parallel
   */
  private async executeParallel(
    task: SubAgentTask,
    plan: RecursiveExecutionPlan
  ): Promise<SubAgentResult[]> {
    
    console.log(`🔄 Executing ${plan.executionOrder.length} agents in parallel for task ${task.id}`);
    
    const promises = plan.executionOrder.map(agentId => 
      this.executeAgent(task, agentId, plan)
    );
    
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<SubAgentResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequential(
    task: SubAgentTask,
    plan: RecursiveExecutionPlan
  ): Promise<SubAgentResult[]> {
    
    console.log(`🔄 Executing ${plan.executionOrder.length} agents sequentially for task ${task.id}`);
    
    const results: SubAgentResult[] = [];
    
    for (const agentId of plan.executionOrder) {
      try {
        const result = await this.executeAgent(task, agentId, plan);
        results.push(result);
        
        // Update task context with result
        task.context[`${agentId}_result`] = result.result;
      } catch (error) {
        console.error(`❌ Agent ${agentId} failed:`, error);
      }
    }
    
    return results;
  }

  /**
   * Execute agents in hybrid mode (parallel where possible, sequential where needed)
   */
  private async executeHybrid(
    task: SubAgentTask,
    plan: RecursiveExecutionPlan
  ): Promise<SubAgentResult[]> {
    
    console.log(`🔄 Executing agents in hybrid mode for task ${task.id}`);
    
    const results: SubAgentResult[] = [];
    const dependencyGroups = this.groupByDependencies(plan.agents);
    
    for (const group of dependencyGroups) {
      if (group.length === 1) {
        // Single agent - execute directly
        const result = await this.executeAgent(task, group[0].id, plan);
        results.push(result);
        task.context[`${group[0].id}_result`] = result.result;
      } else {
        // Multiple agents - execute in parallel
        const promises = group.map(agent => 
          this.executeAgent(task, agent.id, plan)
        );
        
        const groupResults = await Promise.allSettled(promises);
        
        groupResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            task.context[`${group[index].id}_result`] = result.value.result;
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Group agents by dependency levels
   */
  private groupByDependencies(agents: SubAgent[]): SubAgent[][] {
    const groups: SubAgent[][] = [];
    const visited = new Set<string>();
    
    const getDependencyLevel = (agent: SubAgent): number => {
      if (visited.has(agent.id)) return 0;
      
      visited.add(agent.id);
      
      if (agent.dependencies.length === 0) return 0;
      
      const maxDepLevel = Math.max(
        ...agent.dependencies
          .map(depId => agents.find(a => a.id === depId))
          .filter(Boolean)
          .map(dep => getDependencyLevel(dep!) + 1)
      );
      
      return maxDepLevel;
    };
    
    agents.forEach(agent => {
      const level = getDependencyLevel(agent);
      if (!groups[level]) groups[level] = [];
      groups[level].push(agent);
    });
    
    return groups.filter(Boolean);
  }

  /**
   * Execute individual agent
   */
  private async executeAgent(
    task: SubAgentTask,
    agentId: string,
    plan: RecursiveExecutionPlan
  ): Promise<SubAgentResult> {
    
    const startTime = Date.now();
    const agent = this.agents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Check depth limits
    if (task.currentDepth >= agent.maxDepth) {
      throw new Error(`Agent ${agentId} reached max depth ${agent.maxDepth}`);
    }
    
    console.log(`🤖 Executing ${agent.name} for task ${task.id} (depth: ${task.currentDepth})`);
    
    try {
      // Call the actual agent API
      const response = await fetch(`http://localhost:3003/api/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: task.query,
          domain: task.domain,
          context: task.context,
          depth: task.currentDepth,
          parentTaskId: task.parentTaskId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Agent ${agentId} returned ${response.status}`);
      }
      
      const data = await response.json();
      const executionTime = Date.now() - startTime;
      
      // Check if agent wants to spawn sub-tasks
      const subTasks = this.extractSubTasks(data, task, plan);
      
      const result: SubAgentResult = {
        agentId,
        result: data,
        confidence: data.confidence || 0.8,
        cost: agent.cost,
        latency: executionTime,
        subTasks,
        metadata: {
          depth: task.currentDepth,
          executionTime,
          tokensUsed: data.tokensUsed || 0,
          quality: data.quality || 0.7
        }
      };
      
      // Execute sub-tasks recursively if within depth limits
      if (subTasks.length > 0 && task.currentDepth < plan.maxDepth) {
        console.log(`🔄 Spawning ${subTasks.length} sub-tasks from ${agent.name}`);
        
        for (const subTask of subTasks) {
          const subResults = await this.executeRecursive(subTask, plan);
          result.subTasks.push(...subResults.flatMap(r => r.subTasks));
        }
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Agent ${agentId} execution failed:`, error);
      throw error;
    }
  }

  /**
   * Extract sub-tasks from agent response
   */
  private extractSubTasks(
    data: any,
    parentTask: SubAgentTask,
    plan: RecursiveExecutionPlan
  ): SubAgentTask[] {
    
    const subTasks: SubAgentTask[] = [];
    
    // Check if agent response contains sub-task requests
    if (data.subTasks && Array.isArray(data.subTasks)) {
      data.subTasks.forEach((subTaskData: any, index: number) => {
        subTasks.push({
          id: `${parentTask.id}_sub_${index}`,
          query: subTaskData.query || parentTask.query,
          domain: subTaskData.domain || parentTask.domain,
          priority: subTaskData.priority || 'medium',
          maxDepth: parentTask.maxDepth,
          currentDepth: parentTask.currentDepth + 1,
          parentTaskId: parentTask.id,
          requiredCapabilities: subTaskData.requiredCapabilities || [],
          context: { ...parentTask.context, ...subTaskData.context }
        });
      });
    }
    
    return subTasks;
  }

  /**
   * Get execution statistics
   */
  public getExecutionStats(): {
    totalExecutions: number;
    averageDepth: number;
    averageCost: number;
    averageLatency: number;
    agentUsage: Record<string, number>;
    successRate: number;
  } {
    const allResults = Array.from(this.executionHistory.values()).flat();
    
    const totalExecutions = allResults.length;
    const averageDepth = allResults.reduce((sum, r) => sum + r.metadata.depth, 0) / totalExecutions || 0;
    const averageCost = allResults.reduce((sum, r) => sum + r.cost, 0) / totalExecutions || 0;
    const averageLatency = allResults.reduce((sum, r) => sum + r.latency, 0) / totalExecutions || 0;
    
    const agentUsage: Record<string, number> = {};
    allResults.forEach(result => {
      agentUsage[result.agentId] = (agentUsage[result.agentId] || 0) + 1;
    });
    
    const successRate = allResults.filter(r => r.confidence > 0.5).length / totalExecutions || 0;
    
    return {
      totalExecutions,
      averageDepth,
      averageCost,
      averageLatency,
      agentUsage,
      successRate
    };
  }
}

export const recursiveSubAgentOrchestrator = new RecursiveSubAgentOrchestrator();
