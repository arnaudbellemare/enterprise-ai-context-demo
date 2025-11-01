/**
 * Optimized ACE Framework with PromptMII+GEPA
 * 
 * Wraps ACEFramework to use OptimizedACEGenerator
 */

import { ACEFramework } from './ace-framework';
import { OptimizedACEGenerator } from './ace-optimized';

export interface OptimizedACEFrameworkConfig {
  enableOptimization: boolean;
  minImprovement: number;
  cacheOptimizations: boolean;
}

/**
 * Optimized ACE Framework that uses PromptMII+GEPA for reasoning generation
 */
export class OptimizedACEFramework extends ACEFramework {
  private optimizedConfig: OptimizedACEFrameworkConfig;
  private optimizedGenerator: OptimizedACEGenerator;
  
  constructor(model: any, initialPlaybook?: any, config: Partial<OptimizedACEFrameworkConfig> = {}) {
    super(model, initialPlaybook);
    
    this.optimizedConfig = {
      enableOptimization: true,
      minImprovement: 10,
      cacheOptimizations: true,
      ...config
    };
    
    // Create optimized generator
    this.optimizedGenerator = new OptimizedACEGenerator(model, this.optimizedConfig);
    
    // Override the generator used by ACEFramework
    // We'll need to access the private generator property
    // For now, we'll use a workaround by overriding processQuery
  }
  
  /**
   * Process query with optimized reasoning generation
   */
  async processQuery(query: string, domain?: string): Promise<any> {
    // Get playbook (from parent)
    const playbook = (this as any).playbook;
    
    // Use optimized generator for trajectory
    if (this.optimizedConfig.enableOptimization) {
      const trajectory = await this.optimizedGenerator.generateTrajectory(query, playbook, true);
      
      // Use parent's reflector and curator
      const reflector = (this as any).reflector;
      const curator = (this as any).curator;
      
      const reflection = await reflector.reflect(trajectory);
      const curation = await curator.curate(reflection, playbook, query);
      
      return {
        generator: {
          trajectory,
          actions: trajectory.actions
        },
        reflector: {
          reflection,
          insights: [reflection.key_insight]
        },
        curator: {
          curation,
          bullets: curation.operations.map((op: any) => op.content)
        },
        optimized: true,
        optimizationApplied: this.optimizedConfig.enableOptimization
      };
    }
    
    // Fallback to parent implementation
    return await super.processQuery(query, domain);
  }
}

