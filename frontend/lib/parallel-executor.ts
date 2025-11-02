/**
 * Parallel Execution Coordinator
 * 
 * Enables parallel execution of independent pipeline phases
 * while respecting dependencies between phases
 */

interface Phase {
  name: string;
  dependencies: string[];
  execute: () => Promise<any>;
  phase: number;
}

interface ExecutionResult<T> {
  phase: string;
  result: T;
  duration: number;
  error?: Error;
}

export class ParallelExecutor {
  /**
   * Execute phases in parallel where possible, sequential where required
   */
  async executePhases<T extends Record<string, any>>(
    phases: Phase[]
  ): Promise<Map<string, ExecutionResult<any>>> {
    const results = new Map<string, ExecutionResult<any>>();
    const completed = new Set<string>();
    
    // Organize phases by dependency depth
    const phaseGroups: Phase[][] = this.groupByDependencyDepth(phases);
    
    // Execute groups sequentially, phases within group in parallel
    for (const group of phaseGroups) {
      const groupPromises = group.map(async (phase) => {
        const startTime = Date.now();
        try {
          const result = await phase.execute();
          const duration = Date.now() - startTime;
          
          results.set(phase.name, {
            phase: phase.name,
            result,
            duration,
          });
          
          completed.add(phase.name);
          return { phase: phase.name, result, duration };
        } catch (error) {
          const duration = Date.now() - startTime;
          results.set(phase.name, {
            phase: phase.name,
            result: null,
            duration,
            error: error instanceof Error ? error : new Error(String(error)),
          });
          completed.add(phase.name);
          throw error;
        }
      });
      
      // Wait for all phases in this group to complete
      await Promise.allSettled(groupPromises);
    }
    
    return results;
  }

  /**
   * Group phases by dependency depth (phases at same depth can run in parallel)
   */
  private groupByDependencyDepth(phases: Phase[]): Phase[][] {
    const groups: Phase[][] = [];
    const completed = new Set<string>();
    
    // Find phases with no dependencies or all dependencies completed
    let remaining = [...phases];
    
    while (remaining.length > 0) {
      const ready: Phase[] = [];
      
      for (const phase of remaining) {
        const allDependenciesMet = phase.dependencies.every(dep => completed.has(dep));
        if (allDependenciesMet) {
          ready.push(phase);
        }
      }
      
      if (ready.length === 0) {
        // Circular dependency or missing dependency - execute remaining sequentially
        console.warn('⚠️  Circular or missing dependencies detected, executing sequentially');
        ready.push(...remaining);
      }
      
      groups.push(ready);
      ready.forEach(p => completed.add(p.name));
      remaining = remaining.filter(p => !ready.includes(p));
    }
    
    return groups;
  }

  /**
   * Execute two independent operations in parallel
   */
  async executeParallel<T1, T2>(
    op1: () => Promise<T1>,
    op2: () => Promise<T2>,
    name1: string = 'op1',
    name2: string = 'op2'
  ): Promise<[T1, T2]> {
    const [result1, result2] = await Promise.all([
      op1().catch(error => {
        console.error(`❌ ${name1} failed:`, error);
        throw error;
      }),
      op2().catch(error => {
        console.error(`❌ ${name2} failed:`, error);
        throw error;
      }),
    ]);
    
    return [result1, result2];
  }

  /**
   * Execute operations with timeout
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'operation'
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }
}

export const parallelExecutor = new ParallelExecutor();

