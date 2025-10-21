/**
 * ACE (Agentic Context Engineering) Skill
 *
 * Advanced context assembly and refinement
 */

import { BaseSkill } from './base-skill';
import { BrainContext, SkillResult } from './types';

export class ACESkill extends BaseSkill {
  name = 'Context Engineering';
  description = 'Advanced context assembly and refinement';
  priority = 1; // High priority

  timeout = 30000; // 30 seconds
  cacheEnabled = true;
  cacheTTL = 1800000; // 30 minutes

  activation(context: BrainContext): boolean {
    return context.needsContext && context.domain === 'healthcare';
  }

  protected async executeImplementation(
    query: string,
    context: BrainContext
  ): Promise<SkillResult> {
    console.log('   🎯 ACE: Subconscious activation');

    try {
      const response = await this.fetchWithTimeout(
        'http://localhost:3000/api/ace/enhanced',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            domain: context.domain,
            usePlaybook: true
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ACE API failed: ${response.statusText}`);
      }

      const data = await response.json();

      return this.createSuccessResult(data, {
        processingTime: data.metadata?.duration_ms || 0,
        model: 'ace-framework',
        quality: data.quality_score || 0.9
      });
    } catch (error: any) {
      console.log(`   ⚠️ ACE failed: ${error.message}`);
      throw error;
    }
  }
}
