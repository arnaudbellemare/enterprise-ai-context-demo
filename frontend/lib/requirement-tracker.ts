/**
 * Explicit Performance Requirement Tracking
 * 
 * Track accuracy/latency/cost targets and stop optimization when ALL satisfied.
 * This prevents over-optimization and saves computational resources.
 * 
 * Based on CoTune research (arXiv:2509.24694) showing 2.9× improvement
 * with explicit requirement tracking.
 */

export interface PerformanceRequirement {
  metric: string;
  target: number;
  current: number;
  satisfied: boolean;
  priority: 'must' | 'should' | 'nice';
  tolerance?: number; // e.g., 0.05 = ±5%
  direction?: 'higher' | 'lower'; // higher is better (accuracy) or lower is better (latency)
}

export interface RequirementSet {
  id: string;
  name: string;
  requirements: PerformanceRequirement[];
  allSatisfied: boolean;
  satisfactionRate: number; // 0.0-1.0
  createdAt: Date;
  lastUpdated: Date;
  history: Array<{
    timestamp: Date;
    satisfactionRate: number;
    values: Record<string, number>;
  }>;
}

export class RequirementTracker {
  private requirements: Map<string, RequirementSet> = new Map();
  
  /**
   * Create a new requirement set
   */
  async createRequirementSet(
    name: string,
    requirements: Omit<PerformanceRequirement, 'current' | 'satisfied'>[]
  ): Promise<string> {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const set: RequirementSet = {
      id,
      name,
      requirements: requirements.map(r => ({
        ...r,
        current: 0,
        satisfied: false,
        direction: r.direction || 'higher'
      })),
      allSatisfied: false,
      satisfactionRate: 0,
      createdAt: new Date(),
      lastUpdated: new Date(),
      history: []
    };
    
    this.requirements.set(id, set);
    
    console.log(`\n✅ Created requirement set: ${name} (${id})`);
    console.log(`Requirements: ${requirements.length}`);
    requirements.forEach(r => {
      const dir = r.direction === 'lower' ? '≤' : '≥';
      console.log(`  • ${r.metric}: ${dir} ${r.target} [${r.priority.toUpperCase()}]`);
    });
    console.log('');
    
    return id;
  }
  
  /**
   * Update current values and check satisfaction
   */
  async updateRequirements(
    setId: string,
    currentValues: Record<string, number>
  ): Promise<{
    allSatisfied: boolean;
    satisfactionRate: number;
    details: PerformanceRequirement[];
    shouldStop: boolean;
  }> {
    const set = this.requirements.get(setId);
    if (!set) {
      throw new Error(`Requirement set ${setId} not found`);
    }
    
    // Update each requirement
    set.requirements.forEach(req => {
      if (currentValues[req.metric] !== undefined) {
        req.current = currentValues[req.metric];
        req.satisfied = this.checkSatisfaction(req);
      }
    });
    
    // Calculate satisfaction rate
    const satisfied = set.requirements.filter(r => r.satisfied).length;
    const total = set.requirements.length;
    set.satisfactionRate = satisfied / total;
    
    // Check if all MUST requirements are satisfied
    const mustReqs = set.requirements.filter(r => r.priority === 'must');
    const mustSatisfied = mustReqs.every(r => r.satisfied);
    set.allSatisfied = mustSatisfied;
    
    set.lastUpdated = new Date();
    
    // Add to history
    set.history.push({
      timestamp: new Date(),
      satisfactionRate: set.satisfactionRate,
      values: { ...currentValues }
    });
    
    // LOG EXPLICITLY (as research shows this improves stakeholder communication)
    this.logSatisfactionStatus(set);
    
    // Determine if optimization should stop
    const shouldStop = this.shouldStopOptimization(setId);
    
    return {
      allSatisfied: set.allSatisfied,
      satisfactionRate: set.satisfactionRate,
      details: set.requirements,
      shouldStop
    };
  }
  
  /**
   * Check if a single requirement is satisfied
   */
  private checkSatisfaction(req: PerformanceRequirement): boolean {
    const tolerance = req.tolerance || 0;
    
    if (req.direction === 'lower') {
      // Lower is better (e.g., latency, cost)
      const upperBound = req.target * (1 + tolerance);
      return req.current <= upperBound;
    } else {
      // Higher is better (e.g., accuracy, throughput)
      const lowerBound = req.target * (1 - tolerance);
      return req.current >= lowerBound;
    }
  }
  
  /**
   * Log satisfaction status with clear formatting
   */
  private logSatisfactionStatus(set: RequirementSet) {
    console.log(`\n📊 Requirement Satisfaction Status: ${set.name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    set.requirements.forEach(req => {
      const icon = req.satisfied ? '✅' : '❌';
      const status = req.satisfied ? 'SATISFIED' : 'NOT SATISFIED';
      
      let comparison: string;
      if (req.direction === 'lower') {
        const percentage = ((req.target / req.current) * 100).toFixed(1);
        comparison = `${req.current.toFixed(4)} ≤ ${req.target} (${percentage}% of target)`;
      } else {
        const percentage = ((req.current / req.target) * 100).toFixed(1);
        comparison = `${req.current.toFixed(4)} ≥ ${req.target} (${percentage}%)`;
      }
      
      console.log(
        `${icon} ${req.metric}: ${comparison} - ${status} [${req.priority.toUpperCase()}]`
      );
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      `Overall: ${(set.satisfactionRate * 100).toFixed(1)}% satisfied ` +
      `(${set.requirements.filter(r => r.satisfied).length}/${set.requirements.length})`
    );
    
    if (set.allSatisfied) {
      console.log('🎉 ALL MUST REQUIREMENTS SATISFIED! Can stop optimization.');
      console.log('💰 Resource savings achieved by stopping early!');
    } else {
      const unsatisfied = set.requirements.filter(r => !r.satisfied && r.priority === 'must');
      console.log(`⚠️  ${unsatisfied.length} MUST requirement(s) not satisfied. Continue optimization.`);
      unsatisfied.forEach(r => {
        console.log(`   → ${r.metric} needs improvement`);
      });
    }
    console.log('');
  }
  
  /**
   * Should we stop optimization?
   */
  shouldStopOptimization(setId: string): boolean {
    const set = this.requirements.get(setId);
    if (!set) return false;
    
    // Stop if all MUST requirements are satisfied
    return set.allSatisfied;
  }
  
  /**
   * Get satisfaction report
   */
  getReport(setId: string): RequirementSet | undefined {
    return this.requirements.get(setId);
  }
  
  /**
   * Get satisfaction history for visualization
   */
  getHistory(setId: string): RequirementSet['history'] | undefined {
    const set = this.requirements.get(setId);
    return set?.history;
  }
  
  /**
   * Export report as JSON
   */
  exportReport(setId: string): string {
    const set = this.requirements.get(setId);
    if (!set) {
      throw new Error(`Requirement set ${setId} not found`);
    }
    
    return JSON.stringify({
      name: set.name,
      created: set.createdAt,
      lastUpdated: set.lastUpdated,
      satisfactionRate: set.satisfactionRate,
      allSatisfied: set.allSatisfied,
      requirements: set.requirements,
      history: set.history
    }, null, 2);
  }
  
  /**
   * List all requirement sets
   */
  listSets(): Array<{ id: string; name: string; satisfactionRate: number }> {
    return Array.from(this.requirements.values()).map(set => ({
      id: set.id,
      name: set.name,
      satisfactionRate: set.satisfactionRate
    }));
  }
}

/**
 * Example usage: Track LoRA requirements
 */
export async function trackLoRARequirements(domain: string = 'financial') {
  const tracker = new RequirementTracker();
  
  // Create requirements for LoRA training
  const reqId = await tracker.createRequirementSet(`${domain}_lora_training`, [
    { 
      metric: 'accuracy', 
      target: 0.90, 
      priority: 'must', 
      tolerance: 0.02,
      direction: 'higher'
    },
    { 
      metric: 'latency', 
      target: 2.0, 
      priority: 'must', 
      tolerance: 0.1,
      direction: 'lower'
    },
    { 
      metric: 'cost', 
      target: 0.01, 
      priority: 'should', 
      tolerance: 0.2,
      direction: 'lower'
    },
    { 
      metric: 'f1_score', 
      target: 0.85, 
      priority: 'nice', 
      tolerance: 0.05,
      direction: 'higher'
    }
  ]);
  
  console.log('🎯 Starting training with requirement tracking...\n');
  
  // Simulation: Update as training progresses
  for (let epoch = 1; epoch <= 15; epoch++) {
    // Simulate improvement over epochs
    const currentValues = {
      accuracy: 0.70 + (epoch * 0.025),     // Improves ~2.5% per epoch
      latency: 3.5 - (epoch * 0.15),        // Decreases ~0.15s per epoch
      cost: 0.020 - (epoch * 0.0008),       // Decreases slightly
      f1_score: 0.68 + (epoch * 0.022)      // Improves ~2.2% per epoch
    };
    
    console.log(`\n📈 Epoch ${epoch}:`);
    const result = await tracker.updateRequirements(reqId, currentValues);
    
    console.log(`Satisfaction Rate: ${(result.satisfactionRate * 100).toFixed(1)}%`);
    
    // STOP when requirements satisfied!
    if (result.shouldStop) {
      console.log(`\n🎯 STOPPING at epoch ${epoch} - requirements satisfied!`);
      console.log(`💰 Saved ${15 - epoch} epochs of training cost!`);
      console.log(`⏱️  Time saved: ${(15 - epoch) * 10} minutes`);
      break;
    }
  }
  
  // Export final report
  console.log('\n📄 Final Report:');
  console.log(tracker.exportReport(reqId));
  
  return tracker;
}

/**
 * Convenience function: Track generic optimization
 */
export async function trackOptimization(
  name: string,
  requirements: Omit<PerformanceRequirement, 'current' | 'satisfied'>[],
  updateFn: (iteration: number) => Promise<Record<string, number>>,
  maxIterations: number = 100
): Promise<{
  stopped: boolean;
  iteration: number;
  finalValues: Record<string, number>;
  savedIterations: number;
}> {
  const tracker = new RequirementTracker();
  const reqId = await tracker.createRequirementSet(name, requirements);
  
  let finalValues: Record<string, number> = {};
  let stopped = false;
  let finalIteration = maxIterations;
  
  for (let i = 1; i <= maxIterations; i++) {
    finalValues = await updateFn(i);
    const result = await tracker.updateRequirements(reqId, finalValues);
    
    if (result.shouldStop) {
      stopped = true;
      finalIteration = i;
      console.log(`\n✅ Optimization stopped at iteration ${i}/${maxIterations}`);
      console.log(`💰 Saved ${maxIterations - i} iterations!`);
      break;
    }
  }
  
  return {
    stopped,
    iteration: finalIteration,
    finalValues,
    savedIterations: maxIterations - finalIteration
  };
}

