/**
 * TRM (Tiny Recursive Model) Skill
 *
 * Multi-phase reasoning for complex queries
 */

import { BaseSkill } from './base-skill';
import { BrainContext, SkillResult } from './types';

export class TRMSkill extends BaseSkill {
  name = 'Multi-Phase Reasoning';
  description = 'Complex query decomposition and analysis';
  priority = 2;

  timeout = 45000; // 45 seconds for TRM
  cacheEnabled = true;
  cacheTTL = 1800000; // 30 minutes

  activation(context: BrainContext): boolean {
    return context.complexity > 5 || context.needsReasoning;
  }

  protected async executeImplementation(
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    console.log('   🧠 TRM: Subconscious activation');

    try {
      const response = await this.fetchWithTimeout(
        'http://localhost:3000/api/trm-engine',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            domain: context.domain,
            maxIterations: 3
          })
        }
      );

      if (!response.ok) {
        throw new Error(`TRM API failed: ${response.statusText}`);
      }

      const data = await response.json();

      return this.createSuccessResult(data, {
        processingTime: data.metadata?.duration_ms || 0,
        model: 'trm-engine',
        quality: data.confidence || 0.8
      });
    } catch (error: any) {
      console.log(`   ⚠️ TRM failed: ${error.message}`);
      throw error;
    }
  }
}
