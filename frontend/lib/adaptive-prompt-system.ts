/**
 * Adaptive Prompt System for PERMUTATION
 * 
 * "If the task changes, so should the prompt"
 * 
 * Features:
 * - Auto-adapts prompts based on task type
 * - Learns from successful executions (GEPA-style)
 * - Caches winning prompts in KV Cache
 * - Easily switchable prompt strategies
 * - No retraining needed - just adapt once and reuse
 * 
 * Integrates:
 * - ACE Framework (prompt evolution)
 * - GEPA (optimization)
 * - KV Cache (storage)
 * - IRT (difficulty-based adaptation)
 */

import { kvCacheManager } from './kv-cache-manager';

export interface PromptTemplate {
  id: string;
  name: string;
  task_type: string;
  difficulty_range: { min: number; max: number };
  template: string;
  variables: string[];
  performance: {
    success_rate: number;
    avg_quality: number;
    avg_latency_ms: number;
    usage_count: number;
    last_used: number;
  };
  metadata: {
    created_at: number;
    updated_at: number;
    optimized_by: 'ace' | 'gepa' | 'manual';
    domain?: string;
  };
}

export interface AdaptivePromptResult {
  prompt: string;
  template_used: PromptTemplate;
  adaptations_applied: string[];
  confidence: number;
}

export class AdaptivePromptSystem {
  private templates: Map<string, PromptTemplate> = new Map();
  private KV_CACHE_PREFIX = 'adaptive_prompt:';
  private CACHE_TTL = 86400 * 7; // 7 days

  constructor() {
    console.log('🧠 Adaptive Prompt System initialized');
    this.loadCachedTemplates();
    this.initializeBaseTemplates();
  }

  /**
   * Get adaptive prompt for a task
   * Auto-selects and adapts the best prompt template
   */
  public async getAdaptivePrompt(
    query: string,
    context: {
      task_type: string;
      difficulty: number;
      domain: string;
      previous_attempts?: number;
    }
  ): Promise<AdaptivePromptResult> {
    console.log(`🎯 Getting adaptive prompt for ${context.task_type} task (difficulty: ${context.difficulty})`);

    // Find best matching template
    const template = this.selectBestTemplate(context);
    
    if (!template) {
      console.log('⚠️ No matching template, using general');
      return this.getGeneralPrompt(query, context);
    }

    console.log(`✅ Selected template: ${template.name} (success rate: ${(template.performance.success_rate * 100).toFixed(1)}%)`);

    // Apply adaptations based on context
    const adaptations: string[] = [];
    let prompt = template.template;

    // 1. Difficulty-based adaptation
    if (context.difficulty > 0.7) {
      prompt = this.adaptForComplexity(prompt, 'high');
      adaptations.push('Complexity adaptation: high difficulty');
    } else if (context.difficulty < 0.3) {
      prompt = this.adaptForComplexity(prompt, 'low');
      adaptations.push('Complexity adaptation: low difficulty');
    }

    // 2. Domain-specific adaptation
    if (context.domain && context.domain !== 'general') {
      prompt = this.adaptForDomain(prompt, context.domain);
      adaptations.push(`Domain adaptation: ${context.domain}`);
    }

    // 3. Retry adaptation (if previous attempts failed)
    if (context.previous_attempts && context.previous_attempts > 0) {
      prompt = this.adaptForRetry(prompt, context.previous_attempts);
      adaptations.push(`Retry adaptation: attempt ${context.previous_attempts + 1}`);
    }

    // Fill in variables
    prompt = this.fillVariables(prompt, {
      query,
      domain: context.domain,
      difficulty: context.difficulty
    });

    return {
      prompt,
      template_used: template,
      adaptations_applied: adaptations,
      confidence: template.performance.success_rate
    };
  }

  /**
   * Record prompt performance (learn from execution)
   */
  public recordPerformance(
    templateId: string,
    success: boolean,
    quality: number,
    latency_ms: number
  ): void {
    const template = this.templates.get(templateId);
    if (!template) return;

    // Update performance metrics (exponential moving average)
    const alpha = 0.3; // Learning rate
    template.performance.usage_count++;
    template.performance.last_used = Date.now();
    
    // Update success rate
    const oldSuccessRate = template.performance.success_rate;
    template.performance.success_rate = 
      oldSuccessRate * (1 - alpha) + (success ? 1 : 0) * alpha;

    // Update quality
    const oldQuality = template.performance.avg_quality;
    template.performance.avg_quality = 
      oldQuality * (1 - alpha) + quality * alpha;

    // Update latency
    const oldLatency = template.performance.avg_latency_ms;
    template.performance.avg_latency_ms = 
      oldLatency * (1 - alpha) + latency_ms * alpha;

    template.metadata.updated_at = Date.now();

    console.log(`📊 Template performance updated: ${template.name}`);
    console.log(`   Success rate: ${(oldSuccessRate * 100).toFixed(1)}% → ${(template.performance.success_rate * 100).toFixed(1)}%`);
    console.log(`   Quality: ${(oldQuality * 100).toFixed(1)}% → ${(template.performance.avg_quality * 100).toFixed(1)}%`);

    // Save to KV Cache
    this.saveTemplate(template);
  }

  /**
   * Create new optimized template (GEPA-style evolution)
   */
  public evolveTemplate(
    baseTemplateId: string,
    successfulPrompt: string,
    performance: { success: boolean; quality: number; latency_ms: number }
  ): PromptTemplate | null {
    const baseTemplate = this.templates.get(baseTemplateId);
    if (!baseTemplate) return null;

    // Only evolve if new prompt significantly outperforms base
    if (performance.quality < baseTemplate.performance.avg_quality * 1.2) {
      console.log('⚠️ New prompt not significantly better, skipping evolution');
      return null;
    }

    const newTemplate: PromptTemplate = {
      id: `${baseTemplate.id}-evolved-${Date.now()}`,
      name: `${baseTemplate.name} (Evolved)`,
      task_type: baseTemplate.task_type,
      difficulty_range: baseTemplate.difficulty_range,
      template: successfulPrompt,
      variables: baseTemplate.variables,
      performance: {
        success_rate: performance.success ? 1.0 : 0.0,
        avg_quality: performance.quality,
        avg_latency_ms: performance.latency_ms,
        usage_count: 1,
        last_used: Date.now()
      },
      metadata: {
        created_at: Date.now(),
        updated_at: Date.now(),
        optimized_by: 'gepa',
        domain: baseTemplate.metadata.domain
      }
    };

    this.templates.set(newTemplate.id, newTemplate);
    this.saveTemplate(newTemplate);

    console.log(`🧬 Evolved new template: ${newTemplate.name}`);
    console.log(`   Quality improvement: ${((performance.quality / baseTemplate.performance.avg_quality - 1) * 100).toFixed(1)}%`);

    return newTemplate;
  }

  /**
   * Switch between prompt strategies easily
   */
  public switchStrategy(
    taskType: string,
    strategyName: 'conservative' | 'aggressive' | 'balanced' | 'custom'
  ): void {
    console.log(`🔄 Switching ${taskType} strategy to: ${strategyName}`);

    const templates = Array.from(this.templates.values())
      .filter(t => t.task_type === taskType);

    switch (strategyName) {
      case 'conservative':
        // Prioritize highest success rate
        templates.sort((a, b) => b.performance.success_rate - a.performance.success_rate);
        break;
      case 'aggressive':
        // Prioritize highest quality (risk of lower success rate)
        templates.sort((a, b) => b.performance.avg_quality - a.performance.avg_quality);
        break;
      case 'balanced':
        // Balance success rate and quality
        templates.sort((a, b) => {
          const scoreA = (a.performance.success_rate * 0.6) + (a.performance.avg_quality * 0.4);
          const scoreB = (b.performance.success_rate * 0.6) + (b.performance.avg_quality * 0.4);
          return scoreB - scoreA;
        });
        break;
    }

    if (templates.length > 0) {
      console.log(`✅ Strategy switched to: ${templates[0].name}`);
      console.log(`   Success rate: ${(templates[0].performance.success_rate * 100).toFixed(1)}%`);
      console.log(`   Quality: ${(templates[0].performance.avg_quality * 100).toFixed(1)}%`);
    }
  }

  /**
   * Get all templates for a task type
   */
  public getTemplates(taskType?: string): PromptTemplate[] {
    const allTemplates = Array.from(this.templates.values());
    if (taskType) {
      return allTemplates.filter(t => t.task_type === taskType);
    }
    return allTemplates;
  }

  /**
   * Export template for reuse
   */
  public exportTemplate(templateId: string): string | null {
    const template = this.templates.get(templateId);
    if (!template) return null;
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template
   */
  public importTemplate(templateJson: string): boolean {
    try {
      const template = JSON.parse(templateJson) as PromptTemplate;
      this.templates.set(template.id, template);
      this.saveTemplate(template);
      console.log(`✅ Imported template: ${template.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to import template:', error);
      return false;
    }
  }

  /**
   * Select best template based on context
   */
  private selectBestTemplate(context: {
    task_type: string;
    difficulty: number;
    domain: string;
  }): PromptTemplate | null {
    const candidates = Array.from(this.templates.values()).filter(t => {
      // Match task type
      if (t.task_type !== context.task_type && t.task_type !== 'general') return false;
      
      // Match difficulty range
      if (context.difficulty < t.difficulty_range.min || context.difficulty > t.difficulty_range.max) {
        return false;
      }
      
      return true;
    });

    if (candidates.length === 0) return null;

    // Sort by combined performance score
    candidates.sort((a, b) => {
      const scoreA = (a.performance.success_rate * 0.5) + (a.performance.avg_quality * 0.3) - (a.performance.avg_latency_ms / 1000 * 0.2);
      const scoreB = (b.performance.success_rate * 0.5) + (b.performance.avg_quality * 0.3) - (b.performance.avg_latency_ms / 1000 * 0.2);
      return scoreB - scoreA;
    });

    return candidates[0];
  }

  /**
   * Adapt prompt for complexity
   */
  private adaptForComplexity(prompt: string, level: 'low' | 'high'): string {
    if (level === 'high') {
      // Add more structure and guidance for complex tasks
      return prompt + `\n\nFor this complex task:
1. Break down the problem step-by-step
2. Consider edge cases and nuances
3. Provide detailed reasoning
4. Include multiple perspectives if relevant`;
    } else {
      // Simplify for easy tasks
      return prompt + `\n\nProvide a clear, concise answer.`;
    }
  }

  /**
   * Adapt prompt for domain
   */
  private adaptForDomain(prompt: string, domain: string): string {
    const domainInstructions: Record<string, string> = {
      technical: '\n\nUse precise technical terminology. Include code examples if relevant.',
      financial: '\n\nInclude numerical analysis and risk considerations. Cite data sources.',
      medical: '\n\nBe cautious and evidence-based. Recommend consulting professionals.',
      legal: '\n\nNote that this is general information, not legal advice.',
      creative: '\n\nBe innovative and explore multiple creative angles.'
    };

    return prompt + (domainInstructions[domain] || '');
  }

  /**
   * Adapt prompt for retry
   */
  private adaptForRetry(prompt: string, attemptNumber: number): string {
    return prompt + `\n\n[RETRY ATTEMPT ${attemptNumber + 1}]
The previous attempt may have been insufficient. Please:
1. Take a different approach
2. Be more thorough
3. Double-check your reasoning`;
  }

  /**
   * Fill template variables
   */
  private fillVariables(template: string, vars: Record<string, any>): string {
    let filled = template;
    
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = `{{${key}}}`;
      filled = filled.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return filled;
  }

  /**
   * Initialize base templates
   */
  private initializeBaseTemplates(): void {
    const baseTemplates: PromptTemplate[] = [
      {
        id: 'general-default',
        name: 'General Purpose',
        task_type: 'general',
        difficulty_range: { min: 0, max: 1 },
        template: `You are a helpful AI assistant. Answer the following query accurately and comprehensively.

Query: {{query}}

Provide a clear, well-structured answer.`,
        variables: ['query'],
        performance: {
          success_rate: 0.85,
          avg_quality: 0.80,
          avg_latency_ms: 200,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'manual'
        }
      },
      {
        id: 'realtime-search',
        name: 'Real-Time Web Search',
        task_type: 'real_time',
        difficulty_range: { min: 0, max: 1 },
        template: `You are a real-time information assistant with access to current web data.

Query: {{query}}

Provide:
1. Most recent and relevant information
2. Specific data points (numbers, dates, names)
3. Sources or context for the information
4. Current trends or patterns

Focus on accuracy and recency.`,
        variables: ['query'],
        performance: {
          success_rate: 0.90,
          avg_quality: 0.92,
          avg_latency_ms: 500,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'ace'
        }
      },
      {
        id: 'analytical-deep',
        name: 'Deep Analytical Reasoning',
        task_type: 'analytical',
        difficulty_range: { min: 0.5, max: 1 },
        template: `You are an analytical reasoning expert. Provide thorough analysis for complex questions.

Query: {{query}}

Structure your analysis:

**1. Understanding the Question**
- Identify key components
- Clarify assumptions

**2. Analysis**
- Examine multiple perspectives
- Consider tradeoffs
- Evaluate evidence

**3. Synthesis**
- Draw conclusions
- Provide recommendations
- Note limitations

Be thorough but clear.`,
        variables: ['query'],
        performance: {
          success_rate: 0.88,
          avg_quality: 0.93,
          avg_latency_ms: 800,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'gepa'
        }
      },
      {
        id: 'structured-analysis',
        name: 'Structured Analysis & Output',
        task_type: 'analytical',
        difficulty_range: { min: 0.3, max: 1 },
        template: `You are an expert analyst. Provide a structured, comprehensive analysis.

Query: {{query}}

**RESPONSE FORMAT:**
1. **EXECUTIVE SUMMARY** (2-3 sentences)
2. **KEY FINDINGS** (bullet points)
3. **DETAILED ANALYSIS** (organized sections)
4. **RECOMMENDATIONS** (actionable items)
5. **RISKS & LIMITATIONS** (potential issues)

**QUALITY REQUIREMENTS:**
- Use specific data points and examples
- Include relevant metrics or percentages
- Provide clear reasoning for conclusions
- Structure information logically
- Use professional language

Focus on accuracy, completeness, and actionable insights.`,
        variables: ['query'],
        performance: {
          success_rate: 0.92,
          avg_quality: 0.95,
          avg_latency_ms: 1200,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'manual',
          domain: 'structured_output'
        }
      },
      {
        id: 'financial-analysis',
        name: 'Financial Analysis Expert',
        task_type: 'financial',
        difficulty_range: { min: 0.4, max: 1 },
        template: `You are a financial analysis expert. Provide comprehensive financial insights.

Query: {{query}}

**RESPONSE STRUCTURE:**
1. **OVERVIEW** - Brief context and scope
2. **QUANTITATIVE ANALYSIS** - Numbers, ratios, metrics
3. **QUALITATIVE FACTORS** - Market conditions, risks, opportunities
4. **COMPARATIVE ANALYSIS** - Benchmarks, alternatives, historical data
5. **RECOMMENDATIONS** - Specific, actionable advice
6. **RISK ASSESSMENT** - Potential downsides and mitigation

**REQUIREMENTS:**
- Include specific financial metrics where applicable
- Reference current market conditions
- Provide clear risk-return analysis
- Use professional financial terminology
- Support conclusions with data

Be precise, data-driven, and practical.`,
        variables: ['query'],
        performance: {
          success_rate: 0.90,
          avg_quality: 0.94,
          avg_latency_ms: 1500,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'manual',
          domain: 'financial'
        }
      },
      {
        id: 'technical-analysis',
        name: 'Technical Analysis Expert',
        task_type: 'technical',
        difficulty_range: { min: 0.5, max: 1 },
        template: `You are a technical analysis expert. Provide detailed technical insights.

Query: {{query}}

**RESPONSE FORMAT:**
1. **TECHNICAL OVERVIEW** - Current state and context
2. **DETAILED ANALYSIS** - Technical components, processes, systems
3. **PERFORMANCE METRICS** - Specific measurements and benchmarks
4. **OPTIMIZATION OPPORTUNITIES** - Areas for improvement
5. **IMPLEMENTATION GUIDANCE** - Practical steps and considerations
6. **TECHNICAL RISKS** - Potential issues and mitigation strategies

**QUALITY STANDARDS:**
- Use precise technical terminology
- Include specific metrics and measurements
- Provide step-by-step analysis
- Reference industry standards or best practices
- Support recommendations with technical rationale

Be thorough, accurate, and technically sound.`,
        variables: ['query'],
        performance: {
          success_rate: 0.88,
          avg_quality: 0.93,
          avg_latency_ms: 1800,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'manual',
          domain: 'technical'
        }
      },
      {
        id: 'computational-precise',
        name: 'Computational & Precise',
        task_type: 'computational',
        difficulty_range: { min: 0, max: 0.8 },
        template: `You are a precise computational assistant. Calculate accurately and show your work.

Query: {{query}}

Provide:
1. **Step-by-step calculation**
2. **Formula used**
3. **Final answer with units**
4. **Verification** (double-check)

Be mathematically rigorous.`,
        variables: ['query'],
        performance: {
          success_rate: 0.95,
          avg_quality: 0.98,
          avg_latency_ms: 150,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'manual'
        }
      },
      {
        id: 'factual-quick',
        name: 'Quick Factual Answer',
        task_type: 'factual',
        difficulty_range: { min: 0, max: 0.3 },
        template: `Answer this factual question concisely and accurately.

Query: {{query}}

Provide a direct, verified answer.`,
        variables: ['query'],
        performance: {
          success_rate: 0.98,
          avg_quality: 0.95,
          avg_latency_ms: 100,
          usage_count: 0,
          last_used: 0
        },
        metadata: {
          created_at: Date.now(),
          updated_at: Date.now(),
          optimized_by: 'manual'
        }
      }
    ];

    for (const template of baseTemplates) {
      if (!this.templates.has(template.id)) {
        this.templates.set(template.id, template);
      }
    }

    console.log(`✅ Initialized ${baseTemplates.length} base templates`);
  }

  /**
   * Get general fallback prompt
   */
  private getGeneralPrompt(query: string, context: any): AdaptivePromptResult {
    const template = this.templates.get('general-default')!;
    
    return {
      prompt: this.fillVariables(template.template, { query }),
      template_used: template,
      adaptations_applied: ['Using general fallback'],
      confidence: 0.75
    };
  }

  /**
   * Save template to KV Cache
   */
  private saveTemplate(template: PromptTemplate): void {
    const key = `${this.KV_CACHE_PREFIX}${template.id}`;
    kvCacheManager.store(key, JSON.stringify(template), this.estimateTokens(JSON.stringify(template)), true);
    console.log(`💾 Saved template to KV Cache: ${template.name}`);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Load cached templates from KV Cache
   */
  private loadCachedTemplates(): void {
    // In a real implementation, we'd scan KV Cache for all saved templates
    // For now, we rely on base templates
    console.log('💾 Checking KV Cache for saved templates...');
  }

  /**
   * Get template performance stats
   */
  public getPerformanceStats(): {
    total_templates: number;
    avg_success_rate: number;
    best_performing: PromptTemplate | null;
    most_used: PromptTemplate | null;
  } {
    const allTemplates = Array.from(this.templates.values());
    
    if (allTemplates.length === 0) {
      return {
        total_templates: 0,
        avg_success_rate: 0,
        best_performing: null,
        most_used: null
      };
    }

    const avgSuccessRate = allTemplates.reduce((sum, t) => sum + t.performance.success_rate, 0) / allTemplates.length;
    
    const bestPerforming = allTemplates.reduce((best, current) => {
      const bestScore = (best.performance.success_rate * 0.5) + (best.performance.avg_quality * 0.5);
      const currentScore = (current.performance.success_rate * 0.5) + (current.performance.avg_quality * 0.5);
      return currentScore > bestScore ? current : best;
    });

    const mostUsed = allTemplates.reduce((most, current) => 
      current.performance.usage_count > most.performance.usage_count ? current : most
    );

    return {
      total_templates: allTemplates.length,
      avg_success_rate: avgSuccessRate,
      best_performing: bestPerforming,
      most_used: mostUsed
    };
  }
}

// Singleton instance
let adaptivePromptInstance: AdaptivePromptSystem | undefined;

export function getAdaptivePromptSystem(): AdaptivePromptSystem {
  if (typeof window === 'undefined') {
    // Server-side: create new instance each time
    return new AdaptivePromptSystem();
  }
  
  if (!adaptivePromptInstance) {
    adaptivePromptInstance = new AdaptivePromptSystem();
  }
  return adaptivePromptInstance;
}

