/**
 * Query Batcher
 * Groups similar queries to same skills for efficient processing
 * Based on vLLM MoE batching patterns
 */

export interface QueryBatch {
  queries: Array<{
    query: string;
    context: any;
    resolve: (results: any[]) => void;
    reject: (error: any) => void;
  }>;
  skills: Array<{
    name: string;
    skill: any;
    score: number;
  }>;
  window: number;
  createdAt: number;
}

export interface BatchedSkillResult {
  skillName: string;
  results: any[];
  metadata: {
    batchSize: number;
    processingTime: number;
    cost: number;
  };
}

export class QueryBatcher {
  private batches: Map<string, QueryBatch> = new Map();
  private batchWindow: number = 100; // 100ms batching window
  private maxBatchSize: number = 10; // Maximum queries per batch
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Start cleanup interval for expired batches
    this.cleanupInterval = setInterval(() => this.cleanupExpiredBatches(), 5000);
  }

  async executeWithBatching(
    query: string,
    context: any,
    skills: Array<{ name: string; skill: any; score: number }>
  ): Promise<any[]> {
    const batchKey = this.getBatchKey(context, skills);

    // Create or get existing batch
    let batch = this.batches.get(batchKey);
    if (!batch) {
      batch = {
        queries: [],
        skills,
        window: this.batchWindow,
        createdAt: Date.now()
      };
      this.batches.set(batchKey, batch);

      // Schedule batch execution
      setTimeout(() => this.executeBatch(batchKey), this.batchWindow);
    }

    // Add query to batch and wait for result
    return new Promise((resolve, reject) => {
      batch!.queries.push({
        query,
        context,
        resolve,
        reject
      });

      // If batch is full, execute immediately
      if (batch!.queries.length >= this.maxBatchSize) {
        this.executeBatch(batchKey);
      }
    });
  }

  private getBatchKey(context: any, skills: Array<{ name: string; skill: any; score: number }>): string {
    const skillNames = skills.map(s => s.name).sort().join(',');
    const domain = context.domain || 'general';
    const complexity = Math.floor(context.complexity || 0);
    
    return `${domain}:${skillNames}:${complexity}`;
  }

  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.queries.length === 0) return;

    console.log(`🔄 Executing batch: ${batchKey} (${batch.queries.length} queries)`);

    try {
      // Execute all skills with batched queries
      const skillResults = await this.executeBatchedSkills(batch);
      
      // Distribute results back to individual queries
      batch.queries.forEach((queryItem, idx) => {
        const results = skillResults.map(sr => sr.results[idx]);
        queryItem.resolve(results);
      });

    } catch (error) {
      // Reject all queries in the batch
      batch.queries.forEach(queryItem => {
        queryItem.reject(error);
      });
    } finally {
      // Cleanup
      this.batches.delete(batchKey);
    }
  }

  private async executeBatchedSkills(batch: QueryBatch): Promise<BatchedSkillResult[]> {
    const startTime = Date.now();
    
    // Execute each skill with all queries in the batch
    const skillResults = await Promise.all(
      batch.skills.map(async ({ name, skill }) => {
        const skillStartTime = Date.now();
        
        try {
          // Check if skill supports batch execution
          if (skill.executeBatch && typeof skill.executeBatch === 'function') {
            const results = await skill.executeBatch(
              batch.queries.map(q => q.query),
              batch.queries[0].context // Use representative context
            );
            
            return {
              skillName: name,
              results,
              metadata: {
                batchSize: batch.queries.length,
                processingTime: Date.now() - skillStartTime,
                cost: this.calculateBatchCost(name, batch.queries.length)
              }
            };
          } else {
            // Fallback to individual execution
            console.log(`⚠️ ${name} doesn't support batch execution, using individual calls`);
            const results = await Promise.all(
              batch.queries.map(queryItem => 
                skill.execute(queryItem.query, queryItem.context)
              )
            );
            
            return {
              skillName: name,
              results,
              metadata: {
                batchSize: batch.queries.length,
                processingTime: Date.now() - skillStartTime,
                cost: this.calculateBatchCost(name, batch.queries.length)
              }
            };
          }
        } catch (error) {
          console.error(`❌ Batch execution failed for ${name}:`, error);
          // Return empty results for failed skill
          return {
            skillName: name,
            results: batch.queries.map(() => ({ success: false, error: error.message })),
            metadata: {
              batchSize: batch.queries.length,
              processingTime: Date.now() - skillStartTime,
              cost: 0
            }
          };
        }
      })
    );

    const totalTime = Date.now() - startTime;
    console.log(`✅ Batch completed: ${batch.queries.length} queries, ${totalTime}ms, ${skillResults.length} skills`);

    return skillResults;
  }

  private calculateBatchCost(skillName: string, batchSize: number): number {
    // Cost calculation based on skill type and batch size
    const baseCosts: Record<string, number> = {
      'kimiK2': 0.01,
      'trm': 0.001,
      'gepa': 0.02,
      'ace': 0.005,
      'moeSkillRouter': 0.001,
      'teacher_student': 0.01,
      'advanced_rag': 0.003,
      'advanced_reranking': 0.002,
      'multilingual_business': 0.004,
      'quality_evaluation': 0.002
    };

    const baseCost = baseCosts[skillName] || 0.001;
    // Batch discount: 20% reduction for batches > 3 queries
    const discount = batchSize > 3 ? 0.8 : 1.0;
    
    return baseCost * batchSize * discount;
  }

  private cleanupExpiredBatches(): void {
    const now = Date.now();
    const expiredBatches: string[] = [];

    this.batches.forEach((batch, key) => {
      // Remove batches older than 5 seconds
      if (now - batch.createdAt > 5000) {
        expiredBatches.push(key);
        
        // Reject all queries in expired batch
        batch.queries.forEach(queryItem => {
          queryItem.reject(new Error('Batch timeout'));
        });
      }
    });

    expiredBatches.forEach(key => {
      this.batches.delete(key);
    });

    if (expiredBatches.length > 0) {
      console.log(`🧹 Cleaned up ${expiredBatches.length} expired batches`);
    }
  }

  // Public API for monitoring
  getBatchStats(): {
    activeBatches: number;
    totalQueries: number;
    avgBatchSize: number;
  } {
    const activeBatches = this.batches.size;
    const totalQueries = Array.from(this.batches.values())
      .reduce((sum, batch) => sum + batch.queries.length, 0);
    const avgBatchSize = activeBatches > 0 ? totalQueries / activeBatches : 0;

    return {
      activeBatches,
      totalQueries,
      avgBatchSize: Math.round(avgBatchSize * 100) / 100
    };
  }

  // Configuration
  setBatchWindow(windowMs: number): void {
    this.batchWindow = windowMs;
  }

  setMaxBatchSize(maxSize: number): void {
    this.maxBatchSize = maxSize;
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Reject all pending queries
    this.batches.forEach(batch => {
      batch.queries.forEach(queryItem => {
        queryItem.reject(new Error('Batcher destroyed'));
      });
    });
    
    this.batches.clear();
  }
}

// Singleton instance
let queryBatcherInstance: QueryBatcher | null = null;

export function getQueryBatcher(): QueryBatcher {
  if (!queryBatcherInstance) {
    queryBatcherInstance = new QueryBatcher();
  }
  return queryBatcherInstance;
}
