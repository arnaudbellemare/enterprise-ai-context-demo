/**
 * Brain Skills Registry
 *
 * Central registry for all brain skills.
 * Manages skill lifecycle, execution, and dependencies.
 */

import { BrainSkill, BrainContext, SkillExecutionResult } from './types';

// Import all skills
import { TRMSkill } from './trm-skill';
import { GEPASkill } from './gepa-skill';
import { ACESkill } from './ace-skill';
import { KimiK2Skill } from './kimi-k2-skill';

/**
 * Registry of all available brain skills
 */
export class SkillRegistry {
  private skills: Map<string, BrainSkill>;

  constructor() {
    this.skills = new Map();
    this.registerDefaultSkills();
  }

  /**
   * Register default brain skills
   */
  private registerDefaultSkills(): void {
    this.register('trm', new TRMSkill());
    this.register('gepa', new GEPASkill());
    this.register('ace', new ACESkill());
    this.register('kimiK2', new KimiK2Skill());

    console.log(`🧠 Registered ${this.skills.size} brain skills`);
  }

  /**
   * Register a new skill
   */
  register(key: string, skill: BrainSkill): void {
    this.skills.set(key, skill);
  }

  /**
   * Get a skill by key
   */
  get(key: string): BrainSkill | undefined {
    return this.skills.get(key);
  }

  /**
   * Get all registered skills
   */
  getAll(): Map<string, BrainSkill> {
    return this.skills;
  }

  /**
   * Get skills activated for a given context
   */
  getActivatedSkills(context: BrainContext): Array<[string, BrainSkill]> {
    const activated: Array<[string, BrainSkill]> = [];

    for (const [key, skill] of this.skills) {
      if (skill.activation(context)) {
        activated.push([key, skill]);
      }
    }

    // Sort by priority (lower number = higher priority)
    activated.sort((a, b) => a[1].priority - b[1].priority);

    return activated;
  }

  /**
   * Execute activated skills in parallel
   */
  async executeActivatedSkills(
    query: string,
    context: BrainContext
  ): Promise<SkillExecutionResult[]> {
    const activatedSkills = this.getActivatedSkills(context);

    if (activatedSkills.length === 0) {
      console.log('   ⚠️ No skills activated for this context');
      return [];
    }

    console.log(`   🚀 Executing ${activatedSkills.length} skills in parallel...`);

    // Execute all skills in parallel
    const skillPromises = activatedSkills.map(async ([skillName, skill]) => {
      const startTime = Date.now();

      try {
        const result = await skill.execute(query, context);
        const duration = Date.now() - startTime;

        console.log(`   ✅ ${skill.name}: Completed (${duration}ms)`);

        return {
          skillName,
          result,
          success: result.success,
          duration
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;

        console.log(`   ❌ ${skill.name}: Failed - ${error.message}`);

        return {
          skillName,
          result: {
            success: false,
            fallback: true,
            message: `Skill ${skill.name} failed: ${error.message}`,
            metadata: {
              processingTime: duration,
              fallback: true
            },
            timestamp: new Date().toISOString()
          },
          success: false,
          duration
        };
      }
    });

    // Wait for all skills to complete
    const results = await Promise.allSettled(skillPromises);

    // Extract results
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const [skillName, skill] = activatedSkills[index];
        return {
          skillName,
          result: {
            success: false,
            fallback: true,
            message: `Skill ${skill.name} rejected: ${result.reason}`,
            metadata: {
              processingTime: 0,
              fallback: true
            },
            timestamp: new Date().toISOString()
          },
          success: false,
          duration: 0
        };
      }
    });
  }

  /**
   * Get skill statistics
   */
  getStats() {
    return {
      totalSkills: this.skills.size,
      skillNames: Array.from(this.skills.keys()),
      skillDescriptions: Array.from(this.skills.values()).map(s => ({
        name: s.name,
        description: s.description,
        priority: s.priority
      }))
    };
  }

  /**
   * Validate skill dependencies
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, skill] of this.skills) {
      if (skill.dependencies) {
        for (const dep of skill.dependencies) {
          if (!this.skills.has(dep)) {
            errors.push(`Skill '${key}' depends on missing skill '${dep}'`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Global registry instance
let globalRegistry: SkillRegistry | null = null;

/**
 * Get or create global skill registry
 */
export function getSkillRegistry(): SkillRegistry {
  if (!globalRegistry) {
    globalRegistry = new SkillRegistry();
  }
  return globalRegistry;
}

/**
 * Reset global registry (for testing)
 */
export function resetSkillRegistry(): void {
  globalRegistry = null;
}
