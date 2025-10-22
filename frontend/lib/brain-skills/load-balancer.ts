/**
 * Skill Load Balancer
 * Balances query distribution across skills to prevent overload
 * Based on vLLM MoE load balancing patterns
 */

export interface QueryQueueItem {
  query: string;
  context: any;
  skill: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class QueryQueue {
  private queue: QueryQueueItem[] = [];

  enqueue(query: string, context: any, skill: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        query,
        context,
        skill,
        resolve,
        reject,
        timestamp: Date.now()
      });
    });
  }

  dequeue(): QueryQueueItem | null {
    return this.queue.shift() || null;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  size(): number {
    return this.queue.length;
  }

  // Remove expired items (older than 30 seconds)
  cleanup(): void {
    const now = Date.now();
    const expired = this.queue.filter(item => now - item.timestamp > 30000);
    
    expired.forEach(item => {
      item.reject(new Error('Queue timeout'));
    });
    
    this.queue = this.queue.filter(item => now - item.timestamp <= 30000);
  }
}

export class SkillLoadBalancer {
  private activeExecutions: Map<string, number> = new Map();
  private maxConcurrent: Map<string, number> = new Map();
  private queues: Map<string, QueryQueue> = new Map();
  private metrics: Map<string, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatency: number;
    lastReset: number;
  }> = new Map();

  constructor() {
    // Configure per-skill concurrency limits based on API constraints
    this.maxConcurrent.set('kimiK2', 5);      // OpenRouter has rate limits
    this.maxConcurrent.set('trm', 10);        // Internal, can handle more
    this.maxConcurrent.set('gepa', 3);        // Expensive, limit carefully
    this.maxConcurrent.set('ace', 8);         // Moderate load
    this.maxConcurrent.set('moeSkillRouter', 5); // MoE router itself
    this.maxConcurrent.set('teacher_student', 4); // Teacher-Student pattern
    this.maxConcurrent.set('advanced_rag', 6);    // RAG operations
    this.maxConcurrent.set('advanced_reranking', 4); // Reranking operations
    this.maxConcurrent.set('multilingual_business', 5); // Multilingual processing
    this.maxConcurrent.set('quality_evaluation', 6); // Quality assessment

    // Initialize metrics
    this.initializeMetrics();

    // Start cleanup interval
    setInterval(() => this.cleanupQueues(), 10000); // Clean every 10 seconds
  }

  private initializeMetrics(): void {
    const skillNames = Array.from(this.maxConcurrent.keys());
    skillNames.forEach(skillName => {
      this.metrics.set(skillName, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatency: 0,
        lastReset: Date.now()
      });
    });
  }

  async executeWithLoadBalancing(
    skillName: string,
    skill: any,
    query: string,
    context: any
  ): Promise<any> {
    const startTime = Date.now();
    const current = this.activeExecutions.get(skillName) || 0;
    const max = this.maxConcurrent.get(skillName) || 10;

    // Update metrics
    this.updateMetrics(skillName, 'request');

    if (current >= max) {
      // Skill is at capacity, queue the request
      console.log(`⏳ ${skillName} at capacity (${current}/${max}), queueing`);
      return this.enqueue(skillName, skill, query, context);
    }

    // Track execution
    this.activeExecutions.set(skillName, current + 1);

    try {
      const result = await skill.execute(query, context);
      
      // Update success metrics
      this.updateMetrics(skillName, 'success', Date.now() - startTime);
      
      return result;
    } catch (error) {
      // Update failure metrics
      this.updateMetrics(skillName, 'failure');
      throw error;
    } finally {
      // Release and process queue
      const newCurrent = (this.activeExecutions.get(skillName) || 1) - 1;
      this.activeExecutions.set(skillName, newCurrent);
      this.processQueue(skillName);
    }
  }

  private async enqueue(
    skillName: string,
    skill: any,
    query: string,
    context: any
  ): Promise<any> {
    let queue = this.queues.get(skillName);
    if (!queue) {
      queue = new QueryQueue();
      this.queues.set(skillName, queue);
    }

    return queue.enqueue(query, context, skill);
  }

  private processQueue(skillName: string): void {
    const queue = this.queues.get(skillName);
    if (!queue || queue.isEmpty()) return;

    const current = this.activeExecutions.get(skillName) || 0;
    const max = this.maxConcurrent.get(skillName) || 10;

    if (current < max) {
      const next = queue.dequeue();
      if (next) {
        console.log(`🔄 Processing queued request for ${skillName}`);
        this.executeWithLoadBalancing(
          skillName,
          next.skill,
          next.query,
          next.context
        ).then(result => next.resolve(result))
         .catch(error => next.reject(error));
      }
    }
  }

  private cleanupQueues(): void {
    this.queues.forEach((queue, skillName) => {
      queue.cleanup();
      if (queue.isEmpty()) {
        this.queues.delete(skillName);
      }
    });
  }

  private updateMetrics(skillName: string, type: 'request' | 'success' | 'failure', latency?: number): void {
    const metrics = this.metrics.get(skillName);
    if (!metrics) return;

    if (type === 'request') {
      metrics.totalRequests++;
    } else if (type === 'success') {
      metrics.successfulRequests++;
      if (latency) {
        // Update average latency (exponential moving average)
        metrics.avgLatency = metrics.avgLatency === 0 
          ? latency 
          : (metrics.avgLatency * 0.9) + (latency * 0.1);
      }
    } else if (type === 'failure') {
      metrics.failedRequests++;
    }
  }

  // Public API for monitoring
  getUtilization(skillName: string): number {
    const current = this.activeExecutions.get(skillName) || 0;
    const max = this.maxConcurrent.get(skillName) || 10;
    return current / max;
  }

  getQueueDepth(skillName: string): number {
    return this.queues.get(skillName)?.size() || 0;
  }

  getMetrics(skillName: string): any {
    return this.metrics.get(skillName) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      lastReset: Date.now()
    };
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    this.metrics.forEach((metrics, skillName) => {
      result[skillName] = {
        ...metrics,
        utilization: this.getUtilization(skillName),
        queueDepth: this.getQueueDepth(skillName)
      };
    });
    return result;
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.initializeMetrics();
  }
}

// Singleton instance
let loadBalancerInstance: SkillLoadBalancer | null = null;

export function getSkillLoadBalancer(): SkillLoadBalancer {
  if (!loadBalancerInstance) {
    loadBalancerInstance = new SkillLoadBalancer();
  }
  return loadBalancerInstance;
}
