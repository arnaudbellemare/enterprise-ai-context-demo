/**
 * ACE (Agentic Context Engineering) Framework Implementation
 * Evolving contexts for self-improving language models
 * 
 * Based on: "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models"
 * Qizheng Zhang, Changran Hu, et al. (Stanford, SambaNova Systems, UC Berkeley)
 * 
 * Enhanced with:
 * - KV Cache optimization for reusable context prefixes
 * - DOM-based markdown extraction for efficient information retrieval
 * - Concise action space (10-15 tokens per action)
 */

import { kvCacheManager, DOMMarkdownExtractor, ConciseActionSpace } from './kv-cache-manager';

export interface ContextBullet {
  id: string;
  content: string;
  metadata: {
    helpful_count: number;
    harmful_count: number;
    last_used: Date;
    created_at: Date;
    tags: string[];
  };
}

export interface Playbook {
  bullets: ContextBullet[];
  sections: Record<string, string[]>;
  stats: {
    total_bullets: number;
    helpful_bullets: number;
    harmful_bullets: number;
    last_updated: Date;
  };
}

export interface ExecutionTrace {
  query: string;
  reasoning: string;
  actions: string[];
  outcome: 'success' | 'failure' | 'partial';
  feedback: string;
  used_bullets: string[];
  timestamp: Date;
}

export interface Reflection {
  reasoning: string;
  error_identification: string;
  root_cause_analysis: string;
  correct_approach: string;
  key_insight: string;
  bullet_tags: Array<{
    id: string;
    tag: 'helpful' | 'harmful' | 'neutral';
  }>;
}

export interface CuratorOperation {
  type: 'ADD' | 'UPDATE' | 'REMOVE';
  section: string;
  content: string;
  bullet_id?: string;
}

export interface CuratorResponse {
  reasoning: string;
  operations: CuratorOperation[];
}

/**
 * ACE Generator: Produces reasoning trajectories for new queries
 * Enhanced with KV cache optimization and concise action space
 */
export class ACEGenerator {
  private model: any;
  
  constructor(model: any) {
    this.model = model;
  }

  async generateTrajectory(query: string, playbook: Playbook, useCache: boolean = true): Promise<ExecutionTrace> {
    // Select relevant bullets from playbook
    const relevantBullets = this.selectRelevantBullets(query, playbook);
    
    // Build cache-friendly prompt structure
    const cacheKey = `ace-playbook-${this.hashPlaybook(playbook)}`;
    const playbookContext = this.buildPlaybookContext(relevantBullets);
    
    let reasoning: string;
    let tokensReused = 0;
    
    if (useCache) {
      // Use KV cache for reusable playbook prefix
      const cachedPrompt = kvCacheManager.buildCachedPrompt(
        "You are an expert AI agent with access to a curated playbook of strategies.",
        playbookContext,
        query,
        cacheKey
      );
      
      tokensReused = cachedPrompt.tokensReused;
      console.log(`💾 KV Cache: Reusing ${tokensReused} tokens from playbook prefix`);
      
      reasoning = await this.generateReasoning(query, relevantBullets, cachedPrompt.cachedPrefix);
    } else {
      reasoning = await this.generateReasoning(query, relevantBullets);
    }
    
    // Generate concise actions (10-15 tokens each)
    const actions = await this.generateConciseActions(query, reasoning, relevantBullets);
    
    return {
      query,
      reasoning,
      actions,
      outcome: 'partial', // Will be updated based on execution feedback
      feedback: `KV Cache: ${tokensReused} tokens reused`,
      used_bullets: relevantBullets.map(b => b.id),
      timestamp: new Date()
    };
  }
  
  /**
   * Generate concise actions using minimal token action space
   */
  private async generateConciseActions(query: string, reasoning: string, bullets: ContextBullet[]): Promise<string[]> {
    // Map reasoning to concise action format
    // Each action: 10-15 tokens max
    const actions: string[] = [];
    
    // Example: ext(q) - Extract with query
    if (query.includes('price') || query.includes('cost')) {
      actions.push(ConciseActionSpace.format('ext', { q: 'price' }));
    }
    
    if (query.includes('date') || query.includes('when')) {
      actions.push(ConciseActionSpace.format('ext', { q: 'date' }));
    }
    
    // Default: analyze and extract
    if (actions.length === 0) {
      actions.push(ConciseActionSpace.format('ext', { q: query.substring(0, 50) }));
    }
    
    return actions;
  }
  
  /**
   * Build playbook context from bullets
   */
  private buildPlaybookContext(bullets: ContextBullet[]): string {
    return bullets.map(b => `[${b.id}] ${b.content}`).join('\n');
  }
  
  /**
   * Hash playbook for cache key generation
   */
  private hashPlaybook(playbook: Playbook): string {
    return `${playbook.stats.total_bullets}-${playbook.stats.last_updated.getTime()}`;
  }

  private selectRelevantBullets(query: string, playbook: Playbook): ContextBullet[] {
    // Simple relevance scoring based on content similarity
    // In production, this would use embeddings or more sophisticated matching
    return playbook.bullets
      .filter(bullet => 
        bullet.content.toLowerCase().includes(query.toLowerCase()) ||
        bullet.metadata.tags.some(tag => query.toLowerCase().includes(tag.toLowerCase()))
      )
      .sort((a, b) => (b.metadata.helpful_count - b.metadata.harmful_count) - 
                     (a.metadata.helpful_count - a.metadata.harmful_count))
      .slice(0, 10); // Top 10 most relevant bullets
  }

  private async generateReasoning(query: string, bullets: ContextBullet[], cachedPrefix?: string): Promise<string> {
    if (cachedPrefix) {
      // Use cached prefix for efficiency
      const prompt = `${cachedPrefix}\n\nQuery: ${query}\n\nProvide your reasoning step-by-step, referencing specific playbook items when applicable.`;
      // In production, this would call the actual LLM with cache-aware prompt
      return `[Using cached context] Based on the playbook context, I need to analyze this query systematically...`;
    }
    
    const bulletContext = bullets.map(b => `[${b.id}] ${b.content}`).join('\n');
    
    const prompt = `You are an expert analysis agent. Use the provided playbook to reason through this query.

Playbook Context:
${bulletContext}

Query: ${query}

Provide your reasoning step-by-step, referencing specific playbook items when applicable.`;

    // In production, this would call the actual LLM
    return `Based on the playbook context, I need to analyze this query systematically...`;
  }

  private async generateActions(query: string, reasoning: string, bullets: ContextBullet[]): Promise<string[]> {
    // Generate actionable steps based on reasoning and playbook
    return [
      'Analyze the query requirements',
      'Apply relevant playbook strategies',
      'Execute the solution',
      'Verify results against playbook criteria'
    ];
  }
}

/**
 * ACE Reflector: Distills concrete insights from successes and errors
 */
export class ACEReflector {
  private model: any;
  
  constructor(model: any) {
    this.model = model;
  }

  async reflect(
    trace: ExecutionTrace,
    groundTruth?: string,
    testResults?: any
  ): Promise<Reflection> {
    const analysis = await this.analyzeTrace(trace, groundTruth, testResults);
    
    return {
      reasoning: analysis.reasoning,
      error_identification: analysis.error_identification,
      root_cause_analysis: analysis.root_cause_analysis,
      correct_approach: analysis.correct_approach,
      key_insight: analysis.key_insight,
      bullet_tags: this.tagBullets(trace.used_bullets, analysis)
    };
  }

  private async analyzeTrace(
    trace: ExecutionTrace,
    groundTruth?: string,
    testResults?: any
  ): Promise<any> {
    const prompt = `Analyze this execution trace and identify what went wrong or could be improved.

Execution Trace:
- Query: ${trace.query}
- Reasoning: ${trace.reasoning}
- Actions: ${trace.actions.join(', ')}
- Outcome: ${trace.outcome}
- Feedback: ${trace.feedback}
${groundTruth ? `- Ground Truth: ${groundTruth}` : ''}
${testResults ? `- Test Results: ${JSON.stringify(testResults)}` : ''}

Provide analysis in this JSON format:
{
  "reasoning": "Your chain of thought analysis",
  "error_identification": "What specifically went wrong",
  "root_cause_analysis": "Why this error occurred",
  "correct_approach": "What should have been done instead",
  "key_insight": "Key principle to remember"
}`;

    // In production, this would call the actual LLM and parse JSON response
    return {
      reasoning: "Analyzing the execution trace to identify improvement opportunities...",
      error_identification: "Potential issues in reasoning or execution",
      root_cause_analysis: "Root cause of the identified issues",
      correct_approach: "Correct approach that should have been taken",
      key_insight: "Key insight to prevent similar issues"
    };
  }

  private tagBullets(usedBullets: string[], analysis: any): Array<{id: string, tag: 'helpful' | 'harmful' | 'neutral'}> {
    // Simple tagging logic - in production this would be more sophisticated
    return usedBullets.map(id => ({
      id,
      tag: 'neutral' as const // Default to neutral, would be determined by analysis
    }));
  }
}

/**
 * ACE Curator: Integrates insights into structured context updates
 */
export class ACECurator {
  private model: any;
  
  constructor(model: any) {
    this.model = model;
  }

  async curate(
    reflection: Reflection,
    currentPlaybook: Playbook,
    questionContext: string
  ): Promise<CuratorResponse> {
    const operations = await this.determineOperations(reflection, currentPlaybook, questionContext);
    
    return {
      reasoning: "Analyzing reflection to determine playbook updates needed",
      operations
    };
  }

  private async determineOperations(
    reflection: Reflection,
    currentPlaybook: Playbook,
    questionContext: string
  ): Promise<CuratorOperation[]> {
    const operations: CuratorOperation[] = [];
    
    // Add new insights from reflection
    if (reflection.key_insight && !this.insightExists(currentPlaybook, reflection.key_insight)) {
      operations.push({
        type: 'ADD',
        section: 'strategies_and_insights',
        content: reflection.key_insight
      });
    }
    
    // Update bullet metadata based on tags
    reflection.bullet_tags.forEach(tag => {
      if (tag.tag !== 'neutral') {
        operations.push({
          type: 'UPDATE',
          section: 'bullet_metadata',
          content: tag.tag,
          bullet_id: tag.id
        });
      }
    });
    
    return operations;
  }

  private insightExists(playbook: Playbook, insight: string): boolean {
    return playbook.bullets.some(bullet => 
      bullet.content.toLowerCase().includes(insight.toLowerCase())
    );
  }
}

/**
 * Main ACE Framework orchestrator
 */
export class ACEFramework {
  private generator: ACEGenerator;
  private reflector: ACEReflector;
  private curator: ACECurator;
  private playbook: Playbook;
  
  constructor(model: any, initialPlaybook?: Playbook) {
    this.generator = new ACEGenerator(model);
    this.reflector = new ACEReflector(model);
    this.curator = new ACECurator(model);
    
    this.playbook = initialPlaybook || {
      bullets: [],
      sections: {
        'strategies_and_insights': [],
        'common_mistakes': [],
        'apis_to_use': [],
        'verification_checklist': []
      },
      stats: {
        total_bullets: 0,
        helpful_bullets: 0,
        harmful_bullets: 0,
        last_updated: new Date()
      }
    };
  }

  /**
   * Main ACE workflow: Generate -> Execute -> Reflect -> Curate
   */
  async processQuery(
    query: string,
    groundTruth?: string,
    testResults?: any
  ): Promise<{
    trace: ExecutionTrace;
    reflection: Reflection;
    updatedPlaybook: Playbook;
  }> {
    // Step 1: Generate trajectory
    const trace = await this.generator.generateTrajectory(query, this.playbook);
    
    // Step 2: Reflect on the trace
    const reflection = await this.reflector.reflect(trace, groundTruth, testResults);
    
    // Step 3: Curate playbook updates
    const curatorResponse = await this.curator.curate(reflection, this.playbook, query);
    
    // Step 4: Apply updates to playbook
    const updatedPlaybook = this.applyUpdates(curatorResponse.operations);
    
    return {
      trace,
      reflection,
      updatedPlaybook
    };
  }

  /**
   * Apply curator operations to update the playbook
   */
  private applyUpdates(operations: CuratorOperation[]): Playbook {
    const newPlaybook = { ...this.playbook };
    
    operations.forEach(op => {
      switch (op.type) {
        case 'ADD':
          const newBullet: ContextBullet = {
            id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: op.content,
            metadata: {
              helpful_count: 0,
              harmful_count: 0,
              last_used: new Date(),
              created_at: new Date(),
              tags: this.extractTags(op.content)
            }
          };
          newPlaybook.bullets.push(newBullet);
          newPlaybook.sections[op.section] = newPlaybook.sections[op.section] || [];
          newPlaybook.sections[op.section].push(newBullet.id);
          break;
          
        case 'UPDATE':
          if (op.bullet_id) {
            const bullet = newPlaybook.bullets.find(b => b.id === op.bullet_id);
            if (bullet && op.content === 'helpful') {
              bullet.metadata.helpful_count++;
            } else if (bullet && op.content === 'harmful') {
              bullet.metadata.harmful_count++;
            }
            bullet!.metadata.last_used = new Date();
          }
          break;
          
        case 'REMOVE':
          newPlaybook.bullets = newPlaybook.bullets.filter(b => b.id !== op.bullet_id);
          Object.keys(newPlaybook.sections).forEach(section => {
            newPlaybook.sections[section] = newPlaybook.sections[section].filter(id => id !== op.bullet_id);
          });
          break;
      }
    });
    
    // Update stats
    newPlaybook.stats = {
      total_bullets: newPlaybook.bullets.length,
      helpful_bullets: newPlaybook.bullets.filter(b => b.metadata.helpful_count > b.metadata.harmful_count).length,
      harmful_bullets: newPlaybook.bullets.filter(b => b.metadata.harmful_count > b.metadata.helpful_count).length,
      last_updated: new Date()
    };
    
    this.playbook = newPlaybook;
    return newPlaybook;
  }

  private extractTags(content: string): string[] {
    // Simple tag extraction - in production this would be more sophisticated
    const commonTags = ['api', 'authentication', 'pagination', 'error_handling', 'validation', 'optimization'];
    return commonTags.filter(tag => content.toLowerCase().includes(tag));
  }

  /**
   * Get current playbook state
   */
  getPlaybook(): Playbook {
    return this.playbook;
  }

  /**
   * Export playbook for persistence
   */
  exportPlaybook(): string {
    return JSON.stringify(this.playbook, null, 2);
  }

  /**
   * Import playbook from persistence
   */
  importPlaybook(playbookJson: string): void {
    this.playbook = JSON.parse(playbookJson);
  }
}

/**
 * Utility functions for ACE integration
 */
export const ACEUtils = {
  /**
   * Create initial playbook from existing workflow knowledge
   */
  createInitialPlaybook(workflowKnowledge: any[]): Playbook {
    const bullets: ContextBullet[] = workflowKnowledge.map((knowledge, index) => ({
      id: `init-${index}`,
      content: knowledge.description || knowledge.content,
      metadata: {
        helpful_count: 0,
        harmful_count: 0,
        last_used: new Date(),
        created_at: new Date(),
        tags: knowledge.tags || []
      }
    }));

    return {
      bullets,
      sections: {
        'strategies_and_insights': bullets.map(b => b.id),
        'common_mistakes': [],
        'apis_to_use': [],
        'verification_checklist': []
      },
      stats: {
        total_bullets: bullets.length,
        helpful_bullets: 0,
        harmful_bullets: 0,
        last_updated: new Date()
      }
    };
  },

  /**
   * Merge multiple playbooks
   */
  mergePlaybooks(playbooks: Playbook[]): Playbook {
    const mergedBullets: ContextBullet[] = [];
    const mergedSections: Record<string, string[]> = {};
    
    playbooks.forEach(playbook => {
      mergedBullets.push(...playbook.bullets);
      Object.keys(playbook.sections).forEach(section => {
        mergedSections[section] = [
          ...(mergedSections[section] || []),
          ...playbook.sections[section]
        ];
      });
    });
    
    // Remove duplicates
    const uniqueBullets = mergedBullets.filter((bullet, index, self) => 
      index === self.findIndex(b => b.id === bullet.id)
    );
    
    return {
      bullets: uniqueBullets,
      sections: mergedSections,
      stats: {
        total_bullets: uniqueBullets.length,
        helpful_bullets: uniqueBullets.filter(b => b.metadata.helpful_count > b.metadata.harmful_count).length,
        harmful_bullets: uniqueBullets.filter(b => b.metadata.harmful_count > b.metadata.helpful_count).length,
        last_updated: new Date()
      }
    };
  }
};
