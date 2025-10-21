/**
 * GEPA (Genetic-Pareto) Optimization Skill
 *
 * Iterative prompt improvement and refinement
 */

import { BaseSkill } from './base-skill';
import { BrainContext, SkillResult } from './types';

export class GEPASkill extends BaseSkill {
  name = 'Prompt Optimization';
  description = 'Iterative prompt improvement and refinement';
  priority = 3;

  timeout = 60000; // 60 seconds for GEPA
  cacheEnabled = true;
  cacheTTL = 3600000; // 1 hour

  activation(context: BrainContext): boolean {
    return context.needsOptimization && (context.quality || 1.0) < 0.7;
  }

  protected async executeImplementation(
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    console.log('   🔧 GEPA: Subconscious activation');

    try {
      const response = await this.fetchWithTimeout(
        'http://localhost:3000/api/gepa-optimization',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            domain: context.domain,
            populationSize: 5,
            generations: 3
          })
        }
      );

      if (!response.ok) {
        throw new Error(`GEPA API failed: ${response.statusText}`);
      }

      const data = await response.json();

      return this.createSuccessResult(data, {
        processingTime: data.metadata?.duration_ms || 0,
        model: 'gepa-optimizer',
        quality: data.best_score || 0.85,
        cost: data.metadata?.total_cost
      });
    } catch (error: any) {
      console.log(`   ⚠️ GEPA failed: ${error.message}`);
      throw error;
    }
  }
}
