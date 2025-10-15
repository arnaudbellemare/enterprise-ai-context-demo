/**
 * Parallel Execution Engine - Phase 3 Implementation
 * 
 * Features:
 * - Parallel component execution
 * - Smart task distribution
 * - Result aggregation
 * - Performance monitoring
 * - Dynamic scaling
 */

import { SmartRouter, TaskType, RoutingDecision, getSmartRouter } from './smart-router';
import { getAdvancedCache } from './advanced-cache-system';

export interface ParallelTask {
  id: string;
  type: TaskType;
  query: string;
  component?: string; // Optional: force specific component
}

export interface ParallelResult {
  task_id: string;
  component: string;
  result: any;
  latency_ms: number;
  cost: number;
  success: boolean;
  error?: string;
  cached: boolean;
}

export interface ParallelExecutionReport {
  tasks: ParallelResult[];
  total_latency_ms: number;
  total_cost: number;
  success_rate: number;
  cache_hit_rate: number;
  parallel_efficiency: number; // Speedup compared to sequential
  aggregated_result?: any;
}

export class ParallelExecutionEngine {
  private smartRouter: SmartRouter;
  private advancedCache: any;
  private maxParallelTasks: number = 10;
  private executionHistory: ParallelExecutionReport[] = [];

  constructor() {
    this.smartRouter = getSmartRouter();
    this.advancedCache = getAdvancedCache();
    console.log('⚡ Parallel Execution Engine initialized');
  }

  /**
   * PHASE 3: Execute multiple tasks in parallel
   */
  public async executeParallel(tasks: ParallelTask[]): Promise<ParallelExecutionReport> {
    console.log(`⚡ Executing ${tasks.length} tasks in parallel...`);
    const startTime = Date.now();

    // Limit concurrent tasks
    const chunks = this.chunkTasks(tasks, this.maxParallelTasks);
    const allResults: ParallelResult[] = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(task => this.executeTask(task))
      );
      allResults.push(...chunkResults);
    }

    const totalLatency = Date.now() - startTime;
    const totalCost = allResults.reduce((sum, r) => sum + r.cost, 0);
    const successCount = allResults.filter(r => r.success).length;
    const cacheHits = allResults.filter(r => r.cached).length;

    // Calculate parallel efficiency
    const sequentialLatency = allResults.reduce((sum, r) => sum + r.latency_ms, 0);
    const parallelEfficiency = sequentialLatency / totalLatency;

    const report: ParallelExecutionReport = {
      tasks: allResults,
      total_latency_ms: totalLatency,
      total_cost: totalCost,
      success_rate: successCount / allResults.length,
      cache_hit_rate: cacheHits / allResults.length,
      parallel_efficiency: parallelEfficiency,
      aggregated_result: this.aggregateResults(allResults)
    };

    // Store in history
    this.executionHistory.push(report);
    if (this.executionHistory.length > 100) {
      this.executionHistory.shift();
    }

    console.log(`✅ Parallel execution complete: ${totalLatency}ms, ${(parallelEfficiency).toFixed(2)}x speedup`);
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}, Success rate: ${(report.success_rate * 100).toFixed(1)}%`);

    return report;
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: ParallelTask): Promise<ParallelResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = `task:${task.id}:${task.query.substring(0, 30)}`;
      const cached = this.advancedCache.get(cacheKey);

      if (cached) {
        return {
          task_id: task.id,
          component: 'Cache',
          result: cached,
          latency_ms: Date.now() - startTime,
          cost: 0.0001,
          success: true,
          cached: true
        };
      }

      // Route task to best component
      const routing = task.component
        ? this.createForcedRouting(task.component)
        : this.smartRouter.route(task.type, task.query);

      // Simulate component execution
      const result = await this.executeComponent(routing, task.query);
      const latency = Date.now() - startTime;

      // Cache the result
      this.advancedCache.set(cacheKey, result, 1800, {
        component: routing.primary_component,
        task_type: task.type.type,
        priority: task.type.priority,
        cost_saved: routing.estimated_cost,
        latency_saved_ms: latency
      });

      // Record performance
      this.smartRouter.recordPerformance(routing.primary_component, latency, true);

      return {
        task_id: task.id,
        component: routing.primary_component,
        result,
        latency_ms: latency,
        cost: routing.estimated_cost,
        success: true,
        cached: false
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      // Record failure
      if (task.component) {
        this.smartRouter.recordPerformance(task.component, latency, false);
      }

      return {
        task_id: task.id,
        component: task.component || 'Unknown',
        result: null,
        latency_ms: latency,
        cost: 0,
        success: false,
        error: error.message,
        cached: false
      };
    }
  }

  /**
   * Execute component (simulated)
   */
  private async executeComponent(routing: RoutingDecision, query: string): Promise<any> {
    // Simulate component execution time
    await new Promise(resolve => setTimeout(resolve, routing.estimated_latency_ms));

    return {
      component: routing.primary_component,
      query,
      answer: `Result from ${routing.primary_component}`,
      confidence: 0.9 + Math.random() * 0.1,
      reasoning: routing.reasoning
    };
  }

  /**
   * Create forced routing
   */
  private createForcedRouting(component: string): RoutingDecision {
    const capabilities = this.smartRouter.getComponentCapabilities(component);
    
    if (!capabilities) {
      throw new Error(`Unknown component: ${component}`);
    }

    return {
      primary_component: component,
      use_cache: true,
      estimated_cost: capabilities.cost,
      estimated_latency_ms: capabilities.latency_ms,
      reasoning: `Forced routing to ${component}`
    };
  }

  /**
   * PHASE 3: Aggregate results from multiple components
   */
  private aggregateResults(results: ParallelResult[]): any {
    const successful = results.filter(r => r.success);

    if (successful.length === 0) {
      return { error: 'All tasks failed', total_failures: results.length };
    }

    // Group by component
    const byComponent: Record<string, ParallelResult[]> = {};
    for (const result of successful) {
      if (!byComponent[result.component]) {
        byComponent[result.component] = [];
      }
      byComponent[result.component].push(result);
    }

    // Calculate aggregate metrics
    const aggregated = {
      total_results: successful.length,
      components_used: Object.keys(byComponent),
      average_confidence: successful.reduce((sum, r) => {
        return sum + (r.result?.confidence || 0);
      }, 0) / successful.length,
      results_by_component: byComponent,
      combined_answer: this.combineAnswers(successful),
      performance_summary: {
        fastest_component: successful.reduce((prev, curr) => 
          curr.latency_ms < prev.latency_ms ? curr : prev
        ).component,
        most_cost_effective: successful.reduce((prev, curr) =>
          curr.cost < prev.cost ? curr : prev
        ).component,
        highest_confidence: successful.reduce((prev, curr) =>
          (curr.result?.confidence || 0) > (prev.result?.confidence || 0) ? curr : prev
        ).component
      }
    };

    return aggregated;
  }

  /**
   * Combine answers from multiple components
   */
  private combineAnswers(results: ParallelResult[]): string {
    // Use weighted voting based on confidence
    const answers = results.map(r => ({
      answer: r.result?.answer || '',
      confidence: r.result?.confidence || 0,
      component: r.component
    }));

    // Sort by confidence
    answers.sort((a, b) => b.confidence - a.confidence);

    // Return highest confidence answer with attribution
    if (answers.length > 0) {
      const best = answers[0];
      return `${best.answer} (${best.component}, ${(best.confidence * 100).toFixed(1)}% confidence)`;
    }

    return 'No answer available';
  }

  /**
   * Chunk tasks for parallel execution
   */
  private chunkTasks(tasks: ParallelTask[], chunkSize: number): ParallelTask[][] {
    const chunks: ParallelTask[][] = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
      chunks.push(tasks.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * PHASE 3: Get execution statistics
   */
  public getExecutionStats(): {
    total_executions: number;
    average_latency_ms: number;
    average_cost: number;
    average_success_rate: number;
    average_cache_hit_rate: number;
    average_parallel_efficiency: number;
  } {
    if (this.executionHistory.length === 0) {
      return {
        total_executions: 0,
        average_latency_ms: 0,
        average_cost: 0,
        average_success_rate: 0,
        average_cache_hit_rate: 0,
        average_parallel_efficiency: 0
      };
    }

    return {
      total_executions: this.executionHistory.length,
      average_latency_ms: this.executionHistory.reduce((sum, r) => sum + r.total_latency_ms, 0) / this.executionHistory.length,
      average_cost: this.executionHistory.reduce((sum, r) => sum + r.total_cost, 0) / this.executionHistory.length,
      average_success_rate: this.executionHistory.reduce((sum, r) => sum + r.success_rate, 0) / this.executionHistory.length,
      average_cache_hit_rate: this.executionHistory.reduce((sum, r) => sum + r.cache_hit_rate, 0) / this.executionHistory.length,
      average_parallel_efficiency: this.executionHistory.reduce((sum, r) => sum + r.parallel_efficiency, 0) / this.executionHistory.length
    };
  }

  /**
   * PHASE 3: Set maximum parallel tasks (dynamic scaling)
   */
  public setMaxParallelTasks(max: number): void {
    this.maxParallelTasks = Math.max(1, Math.min(max, 50));
    console.log(`⚖️ Max parallel tasks set to: ${this.maxParallelTasks}`);
  }

  /**
   * PHASE 3: Auto-scale based on system load
   */
  public autoScale(): void {
    const stats = this.getExecutionStats();
    
    // If success rate is low, reduce parallelism
    if (stats.average_success_rate < 0.8) {
      this.setMaxParallelTasks(Math.max(1, this.maxParallelTasks - 2));
      console.log(`⚖️ Auto-scale DOWN: Success rate ${(stats.average_success_rate * 100).toFixed(1)}%`);
    }
    // If success rate is high and efficiency is good, increase parallelism
    else if (stats.average_success_rate > 0.95 && stats.average_parallel_efficiency > 2) {
      this.setMaxParallelTasks(Math.min(50, this.maxParallelTasks + 2));
      console.log(`⚖️ Auto-scale UP: Success rate ${(stats.average_success_rate * 100).toFixed(1)}%`);
    }
  }
}

// Singleton instance
let parallelEngineInstance: ParallelExecutionEngine | undefined;

export function getParallelEngine(): ParallelExecutionEngine {
  if (typeof window === 'undefined') {
    // Server-side: create new instance each time
    return new ParallelExecutionEngine();
  }
  
  if (!parallelEngineInstance) {
    parallelEngineInstance = new ParallelExecutionEngine();
  }
  return parallelEngineInstance;
}

