/**
 * PERMUTATION Skills System
 * 
 * Inspired by: https://github.com/intellectronica/skillz
 * 
 * Adapts Claude-style skills (SKILL.md + resources) for PERMUTATION
 * with deep integration into:
 * - DSPy signatures and modules
 * - Semiotic observability
 * - MoE (Mixture of Experts) architecture
 * - Teacher-Student learning
 * - Continual Learning KV Cache
 * - Inference KV Cache Compression
 * 
 * KEY DIFFERENCES FROM SKILLZ:
 * 1. Native PERMUTATION integration (not just MCP)
 * 2. Semiotic context awareness
 * 3. KV cache integration (both types)
 * 4. DSPy module wrapping
 * 5. MoE expert composition
 * 6. Observability tracking
 * 
 * SKILL STRUCTURE:
 * ```
 * ~/.permutation-skills/
 * ├── art-valuation/
 * │   ├── SKILL.md              (YAML frontmatter + instructions)
 * │   ├── signature.json        (DSPy signature definition)
 * │   ├── examples.json         (Few-shot examples)
 * │   ├── resources/            (Scripts, data, prompts)
 * │   │   ├── valuation.py
 * │   │   └── market_data.json
 * │   └── semiotic-context.json (Semiotic positioning)
 * ```
 */

import { createLogger } from '../../lib/walt/logger';
import type { DSPySignature } from './dspy-signatures';
import type { SemioticContext } from './picca-semiotic-framework';
import { SemioticTracer } from './semiotic-observability';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

const logger = createLogger('PermutationSkillsSystem');

// ============================================================
// TYPES
// ============================================================

/**
 * Skill Metadata (from SKILL.md frontmatter)
 */
export interface SkillMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  tags: string[];
  category: string;
  
  // PERMUTATION-specific
  domain?: string;                    // Domain specialization
  semioticZone?: string;             // Where it operates in semiosphere
  requiresKVCache?: boolean;         // Needs continual learning KV?
  requiresInferenceKV?: boolean;     // Needs inference compression?
  compatibleWithMoE?: boolean;       // Can be MoE expert?
  
  // Capabilities
  capabilities: {
    input: string[];                 // What it accepts
    output: string[];                // What it produces
    dependencies: string[];          // Required skills
    optional: string[];              // Optional skills
  };
  
  // Performance hints
  performance?: {
    avgTokens?: number;
    avgTimeMs?: number;
    complexity?: 'low' | 'medium' | 'high';
  };
}

/**
 * Complete Skill Definition
 */
export interface Skill {
  id: string;
  metadata: SkillMetadata;
  instructions: string;              // Main skill instructions
  signature?: DSPySignature;         // DSPy signature if available
  examples?: any[];                  // Few-shot examples
  semioticContext?: SemioticContext; // Semiotic positioning
  resources: SkillResource[];        // Additional files
  path: string;                      // Filesystem path
}

export interface SkillResource {
  name: string;
  type: 'script' | 'data' | 'prompt' | 'config' | 'other';
  path: string;
  description?: string;
}

/**
 * Skill Execution Request
 */
export interface SkillExecutionRequest {
  skillId: string;
  input: any;
  context?: any;
  options?: {
    enableSemioticTracking?: boolean;
    enableKVCache?: boolean;
    compressionRatio?: number;
    traceId?: string;
  };
}

export interface SkillExecutionResult {
  output: any;
  metadata: {
    skillId: string;
    duration: number;
    tokensUsed?: number;
    semioticTrace?: any;
    kvCacheStats?: any;
  };
}

/**
 * Skill Composition (combine multiple skills)
 */
export interface SkillComposition {
  name: string;
  skills: string[];                  // Skill IDs in execution order
  routing?: 'sequential' | 'parallel' | 'conditional';
  conditions?: Record<string, string>; // For conditional routing
}

// ============================================================
// SKILL LOADER
// ============================================================

/**
 * Loads and manages PERMUTATION skills
 */
export class SkillLoader {
  private skillsRoot: string;
  private skills: Map<string, Skill> = new Map();
  private loaded = false;

  constructor(skillsRoot?: string) {
    this.skillsRoot = skillsRoot || path.join(
      process.env.HOME || '~',
      '.permutation-skills'
    );
    logger.info('SkillLoader initialized', { skillsRoot: this.skillsRoot });
  }

  /**
   * Load all skills from root directory
   */
  async loadSkills(): Promise<void> {
    logger.info('Loading skills from', this.skillsRoot);

    try {
      // Ensure directory exists
      await fs.mkdir(this.skillsRoot, { recursive: true });

      // Discover skill directories
      const entries = await fs.readdir(this.skillsRoot, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadSkillFromDirectory(
            path.join(this.skillsRoot, entry.name)
          );
        } else if (entry.name.endsWith('.zip')) {
          await this.loadSkillFromZip(
            path.join(this.skillsRoot, entry.name)
          );
        }
      }

      this.loaded = true;
      logger.info('Skills loaded', { count: this.skills.size });

    } catch (error: any) {
      logger.error('Failed to load skills', { error: error.message });
      throw error;
    }
  }

  /**
   * Load skill from directory
   */
  private async loadSkillFromDirectory(skillPath: string): Promise<void> {
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    try {
      const skillMd = await fs.readFile(skillMdPath, 'utf-8');
      const skill = await this.parseSkillMd(skillMd, skillPath);
      
      this.skills.set(skill.id, skill);
      logger.info('Skill loaded', { id: skill.id, path: skillPath });

    } catch (error: any) {
      logger.warn('Failed to load skill', { path: skillPath, error: error.message });
    }
  }

  /**
   * Load skill from zip (future implementation)
   */
  private async loadSkillFromZip(zipPath: string): Promise<void> {
    logger.info('Zip skills not yet implemented', { path: zipPath });
    // TODO: Implement zip extraction and loading
  }

  /**
   * Parse SKILL.md file
   */
  private async parseSkillMd(content: string, skillPath: string): Promise<Skill> {
    // Split frontmatter and content
    const parts = content.split('---').filter(p => p.trim());
    
    if (parts.length < 2) {
      throw new Error('Invalid SKILL.md format: missing frontmatter');
    }

    const frontmatter = yaml.parse(parts[0]);
    const instructions = parts.slice(1).join('---').trim();

    // Load optional files
    const signature = await this.loadOptionalFile(
      skillPath,
      'signature.json',
      JSON.parse
    );
    
    const examples = await this.loadOptionalFile(
      skillPath,
      'examples.json',
      JSON.parse
    );
    
    const semioticContext = await this.loadOptionalFile(
      skillPath,
      'semiotic-context.json',
      JSON.parse
    );

    // Discover resources
    const resources = await this.discoverResources(skillPath);

    const skill: Skill = {
      id: frontmatter.name.toLowerCase().replace(/\s+/g, '-'),
      metadata: frontmatter as SkillMetadata,
      instructions,
      signature,
      examples,
      semioticContext,
      resources,
      path: skillPath
    };

    return skill;
  }

  /**
   * Load optional file
   */
  private async loadOptionalFile<T>(
    skillPath: string,
    filename: string,
    parser: (content: string) => T
  ): Promise<T | undefined> {
    try {
      const filePath = path.join(skillPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return parser(content);
    } catch {
      return undefined;
    }
  }

  /**
   * Discover resource files
   */
  private async discoverResources(skillPath: string): Promise<SkillResource[]> {
    const resources: SkillResource[] = [];
    const resourcesPath = path.join(skillPath, 'resources');

    try {
      const files = await fs.readdir(resourcesPath);
      
      for (const file of files) {
        const filePath = path.join(resourcesPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          resources.push({
            name: file,
            type: this.inferResourceType(file),
            path: filePath
          });
        }
      }
    } catch {
      // No resources directory
    }

    return resources;
  }

  /**
   * Infer resource type from filename
   */
  private inferResourceType(filename: string): SkillResource['type'] {
    if (filename.endsWith('.py') || filename.endsWith('.js') || filename.endsWith('.sh')) {
      return 'script';
    } else if (filename.endsWith('.json') || filename.endsWith('.csv')) {
      return 'data';
    } else if (filename.includes('prompt')) {
      return 'prompt';
    } else if (filename.endsWith('.yaml') || filename.endsWith('.toml')) {
      return 'config';
    }
    return 'other';
  }

  /**
   * Get skill by ID
   */
  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /**
   * List all skills
   */
  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Search skills by criteria
   */
  searchSkills(criteria: {
    domain?: string;
    category?: string;
    tags?: string[];
    capabilities?: string[];
  }): Skill[] {
    return this.listSkills().filter(skill => {
      if (criteria.domain && skill.metadata.domain !== criteria.domain) {
        return false;
      }
      if (criteria.category && skill.metadata.category !== criteria.category) {
        return false;
      }
      if (criteria.tags && !criteria.tags.some(tag => 
        skill.metadata.tags.includes(tag)
      )) {
        return false;
      }
      if (criteria.capabilities && !criteria.capabilities.some(cap =>
        skill.metadata.capabilities.input.includes(cap) ||
        skill.metadata.capabilities.output.includes(cap)
      )) {
        return false;
      }
      return true;
    });
  }
}

// ============================================================
// SKILL EXECUTOR
// ============================================================

/**
 * Executes PERMUTATION skills with full integration
 */
export class SkillExecutor {
  private loader: SkillLoader;
  private semioticTracer: SemioticTracer | null = null;

  constructor(loader: SkillLoader) {
    this.loader = loader;
    logger.info('SkillExecutor initialized');
  }

  /**
   * Execute a skill
   */
  async execute(request: SkillExecutionRequest): Promise<SkillExecutionResult> {
    const skill = this.loader.getSkill(request.skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${request.skillId}`);
    }

    logger.info('Executing skill', { skillId: request.skillId });

    const startTime = Date.now();
    let traceId: string | undefined;

    try {
      // Start semiotic tracking if enabled
      if (request.options?.enableSemioticTracking) {
        this.semioticTracer = new SemioticTracer(true);
        traceId = request.options.traceId || this.semioticTracer.startTrace();
      }

      // Execute skill based on type
      let output: any;
      
      if (skill.signature) {
        // Execute as DSPy module
        output = await this.executeDSPySkill(skill, request, traceId);
      } else {
        // Execute as prompt-based skill
        output = await this.executePromptSkill(skill, request, traceId);
      }

      const duration = Date.now() - startTime;

      // Get semiotic trace if enabled
      let semioticTrace;
      if (traceId && this.semioticTracer) {
        semioticTrace = await this.semioticTracer.endTrace(traceId);
      }

      logger.info('Skill executed', { 
        skillId: request.skillId, 
        duration 
      });

      return {
        output,
        metadata: {
          skillId: request.skillId,
          duration,
          semioticTrace
        }
      };

    } catch (error: any) {
      logger.error('Skill execution failed', { 
        skillId: request.skillId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Execute DSPy-based skill
   */
  private async executeDSPySkill(
    skill: Skill,
    request: SkillExecutionRequest,
    traceId?: string
  ): Promise<any> {
    // Simulate DSPy execution
    // In real implementation, would use actual DSPy module
    
    logger.info('Executing DSPy skill', { 
      skillId: skill.id,
      signature: skill.signature?.description 
    });

    // If semiotic tracking enabled, start span
    if (traceId && this.semioticTracer && skill.semioticContext) {
      const spanId = this.semioticTracer.startSpan(
        traceId,
        skill.id,
        JSON.stringify(request.input),
        skill.semioticContext
      );

      // Simulate execution
      const output = await this.simulateExecution(skill, request.input);

      // End span
      await this.semioticTracer.endSpan(
        spanId,
        JSON.stringify(output),
        skill.semioticContext // Simplified: same context
      );

      return output;
    }

    return await this.simulateExecution(skill, request.input);
  }

  /**
   * Execute prompt-based skill
   */
  private async executePromptSkill(
    skill: Skill,
    request: SkillExecutionRequest,
    traceId?: string
  ): Promise<any> {
    logger.info('Executing prompt skill', { skillId: skill.id });

    // Build prompt from instructions + input
    const prompt = `${skill.instructions}\n\nInput: ${JSON.stringify(request.input)}`;

    // If semiotic tracking enabled, start span
    if (traceId && this.semioticTracer && skill.semioticContext) {
      const spanId = this.semioticTracer.startSpan(
        traceId,
        skill.id,
        prompt,
        skill.semioticContext
      );

      // Simulate execution
      const output = await this.simulateExecution(skill, request.input);

      // End span
      await this.semioticTracer.endSpan(
        spanId,
        JSON.stringify(output),
        skill.semioticContext
      );

      return output;
    }

    return await this.simulateExecution(skill, request.input);
  }

  /**
   * Simulate skill execution (placeholder)
   */
  private async simulateExecution(skill: Skill, input: any): Promise<any> {
    // In real implementation, this would:
    // 1. Call LLM with skill instructions + input
    // 2. Use DSPy module if available
    // 3. Run helper scripts from resources
    // 4. Apply KV cache if needed
    
    return {
      result: `Processed by ${skill.id}`,
      input: input,
      skill: skill.metadata.name
    };
  }

  /**
   * Execute skill composition
   */
  async executeComposition(
    composition: SkillComposition,
    input: any,
    options?: SkillExecutionRequest['options']
  ): Promise<SkillExecutionResult> {
    logger.info('Executing skill composition', { 
      name: composition.name,
      skills: composition.skills 
    });

    let currentOutput = input;
    const results: any[] = [];

    for (const skillId of composition.skills) {
      const result = await this.execute({
        skillId,
        input: currentOutput,
        options
      });

      results.push(result);
      currentOutput = result.output;
    }

    return {
      output: currentOutput,
      metadata: {
        skillId: composition.name,
        duration: results.reduce((sum, r) => sum + r.metadata.duration, 0),
        semioticTrace: results.map(r => r.metadata.semioticTrace).filter(Boolean)
      }
    };
  }
}

// ============================================================
// SKILL BUILDER (Create new skills)
// ============================================================

/**
 * Helper to create new PERMUTATION skills
 */
export class SkillBuilder {
  private skillsRoot: string;

  constructor(skillsRoot?: string) {
    this.skillsRoot = skillsRoot || path.join(
      process.env.HOME || '~',
      '.permutation-skills'
    );
  }

  /**
   * Create new skill from template
   */
  async createSkill(
    name: string,
    options: {
      description: string;
      category: string;
      domain?: string;
      instructions: string;
      signature?: DSPySignature;
      semioticContext?: SemioticContext;
      examples?: any[];
      resources?: { name: string; content: string }[];
    }
  ): Promise<string> {
    const skillId = name.toLowerCase().replace(/\s+/g, '-');
    const skillPath = path.join(this.skillsRoot, skillId);

    logger.info('Creating skill', { name, path: skillPath });

    // Create skill directory
    await fs.mkdir(skillPath, { recursive: true });

    // Create SKILL.md with frontmatter
    const metadata: SkillMetadata = {
      name,
      version: '1.0.0',
      author: 'PERMUTATION',
      description: options.description,
      tags: [],
      category: options.category,
      domain: options.domain,
      semioticZone: options.semioticContext?.semioticZone,
      capabilities: {
        input: [],
        output: [],
        dependencies: [],
        optional: []
      }
    };

    const frontmatter = yaml.stringify(metadata);
    const skillMd = `---\n${frontmatter}---\n\n${options.instructions}`;
    await fs.writeFile(path.join(skillPath, 'SKILL.md'), skillMd);

    // Write optional files
    if (options.signature) {
      await fs.writeFile(
        path.join(skillPath, 'signature.json'),
        JSON.stringify(options.signature, null, 2)
      );
    }

    if (options.examples) {
      await fs.writeFile(
        path.join(skillPath, 'examples.json'),
        JSON.stringify(options.examples, null, 2)
      );
    }

    if (options.semioticContext) {
      await fs.writeFile(
        path.join(skillPath, 'semiotic-context.json'),
        JSON.stringify(options.semioticContext, null, 2)
      );
    }

    // Create resources directory and add files
    if (options.resources && options.resources.length > 0) {
      const resourcesPath = path.join(skillPath, 'resources');
      await fs.mkdir(resourcesPath, { recursive: true });

      for (const resource of options.resources) {
        await fs.writeFile(
          path.join(resourcesPath, resource.name),
          resource.content
        );
      }
    }

    logger.info('Skill created', { skillId, path: skillPath });

    return skillId;
  }
}

// ============================================================
// SKILL REGISTRY (MoE Integration)
// ============================================================

/**
 * Registry for organizing skills as MoE experts
 */
export class SkillRegistry {
  private loader: SkillLoader;
  private expertGroups: Map<string, string[]> = new Map();

  constructor(loader: SkillLoader) {
    this.loader = loader;
  }

  /**
   * Organize skills into expert groups
   */
  organizeAsExperts(): void {
    const skills = this.loader.listSkills();

    // Group by domain
    for (const skill of skills) {
      if (skill.metadata.compatibleWithMoE) {
        const domain = skill.metadata.domain || 'general';
        
        if (!this.expertGroups.has(domain)) {
          this.expertGroups.set(domain, []);
        }
        
        this.expertGroups.get(domain)!.push(skill.id);
      }
    }

    logger.info('Skills organized as MoE experts', {
      groups: Array.from(this.expertGroups.keys()),
      totalExperts: skills.filter(s => s.metadata.compatibleWithMoE).length
    });
  }

  /**
   * Get expert group for domain
   */
  getExpertsForDomain(domain: string): Skill[] {
    const skillIds = this.expertGroups.get(domain) || [];
    return skillIds.map(id => this.loader.getSkill(id)).filter(Boolean) as Skill[];
  }

  /**
   * Route to appropriate expert
   */
  routeToExpert(query: string, domain?: string): Skill | null {
    if (!domain) {
      // Auto-detect domain from query
      domain = this.detectDomain(query);
    }

    const experts = this.getExpertsForDomain(domain);
    
    if (experts.length === 0) {
      logger.warn('No experts found for domain', { domain });
      return null;
    }

    // Simple routing: return first expert
    // In real implementation, would use IRT or other routing
    return experts[0];
  }

  private detectDomain(query: string): string {
    // Simplified domain detection
    // In real implementation, would use classifier
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('art') || queryLower.includes('valuation')) {
      return 'art';
    } else if (queryLower.includes('legal') || queryLower.includes('contract')) {
      return 'legal';
    } else if (queryLower.includes('insurance')) {
      return 'insurance';
    }
    
    return 'general';
  }
}

// ============================================================
// EXPORTS
// ============================================================

export {
  SkillLoader,
  SkillExecutor,
  SkillBuilder,
  SkillRegistry
};

export default SkillLoader;

