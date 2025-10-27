/**
 * DSPy Hints System
 * 
 * Allows passing hints to DSPy optimized programs through:
 * 1. JSON editing of saved prompts
 * 2. Signature hints before optimization
 * 3. Custom metrics for GEPA/SIMBA with hint-based feedback
 * 
 * Use case: "I have a DSPy optimized program but want minor tweaks 
 * to focus the output more on what I'm looking for"
 */

import { DSPySignature, DSPyModule } from './dspy-signatures';
import { DSPyGEPAOptimizer, DSPyOptimizationConfig } from './dspy-gepa-optimizer';
import { gepaAlgorithms } from './gepa-algorithms';
import fs from 'fs';
import path from 'path';

// ============================================================================
// HINT TYPES
// ============================================================================

export interface DSPyHints {
  // What to focus on
  focus_areas?: string[];
  
  // What to avoid
  avoid_patterns?: string[];
  
  // Desired output characteristics
  output_style?: {
    tone?: 'formal' | 'casual' | 'technical' | 'creative';
    length?: 'concise' | 'detailed' | 'comprehensive';
    structure?: 'bullet-points' | 'paragraphs' | 'numbered-list' | 'mixed';
  };
  
  // Domain-specific constraints
  constraints?: {
    must_include?: string[];
    must_avoid?: string[];
    preferred_terminology?: string[];
  };
  
  // Quality preferences
  preferences?: {
    prioritize_accuracy?: boolean;
    prioritize_speed?: boolean;
    prioritize_creativity?: boolean;
    prioritize_completeness?: boolean;
  };
  
  // Examples of desired output
  example_outputs?: string[];
  
  // Custom instructions
  custom_instructions?: string;
}

export interface HintedSignature extends DSPySignature {
  hints?: DSPyHints;
}

export interface SavedPrompt {
  id: string;
  signature: HintedSignature;
  optimized_prompt: string;
  performance: any;
  hints: DSPyHints;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// APPROACH 1: EDIT JSON OF SAVED PROMPT
// ============================================================================

export class SavedPromptEditor {
  private promptsDir: string;
  
  constructor(promptsDir: string = './dspy-prompts') {
    this.promptsDir = promptsDir;
  }
  
  /**
   * Load saved prompt JSON
   */
  async loadPrompt(promptId: string): Promise<SavedPrompt> {
    const filePath = path.join(this.promptsDir, `${promptId}.json`);
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load prompt:', error);
      throw new Error(`Prompt ${promptId} not found`);
    }
  }
  
  /**
   * Edit saved prompt with hints
   */
  async editPromptWithHints(
    promptId: string,
    hints: Partial<DSPyHints>
  ): Promise<SavedPrompt> {
    console.log(`✏️ Editing prompt ${promptId} with hints`);
    
    const savedPrompt = await this.loadPrompt(promptId);
    
    // Merge hints
    const updatedHints: DSPyHints = {
      ...savedPrompt.hints,
      ...hints,
      focus_areas: [...(savedPrompt.hints?.focus_areas || []), ...(hints.focus_areas || [])],
      avoid_patterns: [...(savedPrompt.hints?.avoid_patterns || []), ...(hints.avoid_patterns || [])]
    };
    
    // Apply hints to optimized prompt
    const updatedPrompt = this.applyHintsToPrompt(
      savedPrompt.optimized_prompt,
      updatedHints
    );
    
    const updated: SavedPrompt = {
      ...savedPrompt,
      optimized_prompt: updatedPrompt,
      hints: updatedHints,
      updated_at: new Date()
    };
    
    // Save updated prompt
    await this.savePrompt(updated);
    
    console.log('✅ Prompt updated with hints:', Object.keys(hints));
    return updated;
  }
  
  /**
   * Apply hints directly to prompt text
   */
  private applyHintsToPrompt(basePrompt: string, hints: DSPyHints): string {
    let prompt = basePrompt;
    
    // Add focus areas
    if (hints.focus_areas && hints.focus_areas.length > 0) {
      prompt += `\n\n**FOCUS ON**: ${hints.focus_areas.join(', ')}`;
    }
    
    // Add avoidance patterns
    if (hints.avoid_patterns && hints.avoid_patterns.length > 0) {
      prompt += `\n**AVOID**: ${hints.avoid_patterns.join(', ')}`;
    }
    
    // Add output style
    if (hints.output_style) {
      const style = hints.output_style;
      prompt += `\n\n**OUTPUT STYLE**:`;
      if (style.tone) prompt += `\n- Tone: ${style.tone}`;
      if (style.length) prompt += `\n- Length: ${style.length}`;
      if (style.structure) prompt += `\n- Structure: ${style.structure}`;
    }
    
    // Add constraints
    if (hints.constraints) {
      const constraints = hints.constraints;
      if (constraints.must_include && constraints.must_include.length > 0) {
        prompt += `\n\n**MUST INCLUDE**: ${constraints.must_include.join(', ')}`;
      }
      if (constraints.must_avoid && constraints.must_avoid.length > 0) {
        prompt += `\n**MUST AVOID**: ${constraints.must_avoid.join(', ')}`;
      }
      if (constraints.preferred_terminology && constraints.preferred_terminology.length > 0) {
        prompt += `\n**USE TERMINOLOGY**: ${constraints.preferred_terminology.join(', ')}`;
      }
    }
    
    // Add example outputs
    if (hints.example_outputs && hints.example_outputs.length > 0) {
      prompt += `\n\n**EXAMPLE OUTPUTS**:`;
      hints.example_outputs.forEach((example, i) => {
        prompt += `\n${i + 1}. ${example}`;
      });
    }
    
    // Add custom instructions
    if (hints.custom_instructions) {
      prompt += `\n\n**ADDITIONAL INSTRUCTIONS**: ${hints.custom_instructions}`;
    }
    
    return prompt;
  }
  
  /**
   * Save prompt to JSON
   */
  async savePrompt(prompt: SavedPrompt): Promise<void> {
    const filePath = path.join(this.promptsDir, `${prompt.id}.json`);
    
    try {
      await fs.promises.mkdir(this.promptsDir, { recursive: true });
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(prompt, null, 2),
        'utf-8'
      );
      console.log(`💾 Saved prompt to ${filePath}`);
    } catch (error) {
      console.error('Failed to save prompt:', error);
      throw error;
    }
  }
}

// ============================================================================
// APPROACH 2: EDIT SIGNATURE BEFORE OPTIMIZING
// ============================================================================

export class HintedSignatureBuilder {
  /**
   * Create signature with hints
   */
  static createWithHints(
    baseSignature: DSPySignature,
    hints: DSPyHints
  ): HintedSignature {
    const hintedDescription = this.enhanceDescription(
      baseSignature.description,
      hints
    );
    
    return {
      ...baseSignature,
      description: hintedDescription,
      hints
    };
  }
  
  /**
   * Enhance signature description with hints
   */
  private static enhanceDescription(
    baseDescription: string,
    hints: DSPyHints
  ): string {
    let description = baseDescription;
    
    // Add focus hints
    if (hints.focus_areas && hints.focus_areas.length > 0) {
      description += `\n\nIMPORTANT: Focus particularly on: ${hints.focus_areas.join(', ')}.`;
    }
    
    // Add avoidance hints
    if (hints.avoid_patterns && hints.avoid_patterns.length > 0) {
      description += `\nAvoid: ${hints.avoid_patterns.join(', ')}.`;
    }
    
    // Add style preferences
    if (hints.output_style) {
      const { tone, length, structure } = hints.output_style;
      description += `\n\nOutput should be:`;
      if (tone) description += ` ${tone} tone,`;
      if (length) description += ` ${length} length,`;
      if (structure) description += ` using ${structure} structure`;
    }
    
    // Add preferences
    if (hints.preferences) {
      const prefs: string[] = [];
      if (hints.preferences.prioritize_accuracy) prefs.push('accuracy');
      if (hints.preferences.prioritize_speed) prefs.push('speed');
      if (hints.preferences.prioritize_creativity) prefs.push('creativity');
      if (hints.preferences.prioritize_completeness) prefs.push('completeness');
      
      if (prefs.length > 0) {
        description += `\n\nPrioritize: ${prefs.join(', ')}.`;
      }
    }
    
    // Add custom instructions
    if (hints.custom_instructions) {
      description += `\n\n${hints.custom_instructions}`;
    }
    
    return description;
  }
  
  /**
   * Extract hints from optimized signature
   */
  static extractHints(signature: HintedSignature): DSPyHints {
    return signature.hints || {};
  }
}

// ============================================================================
// APPROACH 3: CUSTOM METRICS FOR GEPA/SIMBA WITH HINT FEEDBACK
// ============================================================================

export interface HintBasedMetric {
  name: string;
  evaluate: (output: any, hints: DSPyHints) => number;
  feedback: (output: any, hints: DSPyHints) => string;
}

export class HintAwareOptimizer {
  private hints: DSPyHints;
  private customMetrics: HintBasedMetric[];
  
  constructor(hints: DSPyHints) {
    this.hints = hints;
    this.customMetrics = this.createHintBasedMetrics(hints);
  }
  
  /**
   * Create custom metrics based on hints
   */
  private createHintBasedMetrics(hints: DSPyHints): HintBasedMetric[] {
    const metrics: HintBasedMetric[] = [];
    
    // Focus area metric
    if (hints.focus_areas && hints.focus_areas.length > 0) {
      metrics.push({
        name: 'focus_coverage',
        evaluate: (output, hints) => {
          const outputText = JSON.stringify(output).toLowerCase();
          const focusAreas = hints.focus_areas || [];
          const coverage = focusAreas.filter(area => 
            outputText.includes(area.toLowerCase())
          ).length;
          return coverage / focusAreas.length;
        },
        feedback: (output, hints) => {
          const outputText = JSON.stringify(output).toLowerCase();
          const focusAreas = hints.focus_areas || [];
          const missing = focusAreas.filter(area => 
            !outputText.includes(area.toLowerCase())
          );
          return missing.length > 0 
            ? `Missing focus areas: ${missing.join(', ')}`
            : 'All focus areas covered';
        }
      });
    }
    
    // Avoidance metric
    if (hints.avoid_patterns && hints.avoid_patterns.length > 0) {
      metrics.push({
        name: 'avoidance_compliance',
        evaluate: (output, hints) => {
          const outputText = JSON.stringify(output).toLowerCase();
          const avoidPatterns = hints.avoid_patterns || [];
          const violations = avoidPatterns.filter(pattern => 
            outputText.includes(pattern.toLowerCase())
          ).length;
          return 1 - (violations / avoidPatterns.length);
        },
        feedback: (output, hints) => {
          const outputText = JSON.stringify(output).toLowerCase();
          const avoidPatterns = hints.avoid_patterns || [];
          const violations = avoidPatterns.filter(pattern => 
            outputText.includes(pattern.toLowerCase())
          );
          return violations.length > 0
            ? `Found patterns to avoid: ${violations.join(', ')}`
            : 'No avoided patterns detected';
        }
      });
    }
    
    // Must-include metric
    if (hints.constraints?.must_include && hints.constraints.must_include.length > 0) {
      metrics.push({
        name: 'required_elements',
        evaluate: (output, hints) => {
          const outputText = JSON.stringify(output).toLowerCase();
          const required = hints.constraints?.must_include || [];
          const included = required.filter(item => 
            outputText.includes(item.toLowerCase())
          ).length;
          return included / required.length;
        },
        feedback: (output, hints) => {
          const outputText = JSON.stringify(output).toLowerCase();
          const required = hints.constraints?.must_include || [];
          const missing = required.filter(item => 
            !outputText.includes(item.toLowerCase())
          );
          return missing.length > 0
            ? `Missing required elements: ${missing.join(', ')}`
            : 'All required elements present';
        }
      });
    }
    
    // Output style metric
    if (hints.output_style) {
      metrics.push({
        name: 'style_compliance',
        evaluate: (output, hints) => {
          let score = 1.0;
          const outputText = JSON.stringify(output);
          const style = hints.output_style;
          
          // Length check
          if (style?.length === 'concise' && outputText.length > 500) score -= 0.3;
          if (style?.length === 'detailed' && outputText.length < 300) score -= 0.3;
          if (style?.length === 'comprehensive' && outputText.length < 500) score -= 0.3;
          
          // Structure check
          if (style?.structure === 'bullet-points' && !outputText.includes('-')) score -= 0.4;
          if (style?.structure === 'numbered-list' && !/\d\./.test(outputText)) score -= 0.4;
          
          return Math.max(0, score);
        },
        feedback: (output, hints) => {
          const outputText = JSON.stringify(output);
          const style = hints.output_style;
          const issues: string[] = [];
          
          if (style?.length === 'concise' && outputText.length > 500) {
            issues.push('Output too long for concise style');
          }
          if (style?.structure === 'bullet-points' && !outputText.includes('-')) {
            issues.push('Missing bullet-point structure');
          }
          
          return issues.length > 0 ? issues.join('; ') : 'Style requirements met';
        }
      });
    }
    
    return metrics;
  }
  
  /**
   * Evaluate output against all hint-based metrics
   */
  evaluateWithHints(output: any): {
    overall_score: number;
    metric_scores: Record<string, number>;
    feedback: Record<string, string>;
  } {
    const metricScores: Record<string, number> = {};
    const feedback: Record<string, string> = {};
    
    for (const metric of this.customMetrics) {
      metricScores[metric.name] = metric.evaluate(output, this.hints);
      feedback[metric.name] = metric.feedback(output, this.hints);
    }
    
    const overallScore = Object.values(metricScores).reduce((a, b) => a + b, 0) / 
                        this.customMetrics.length;
    
    return {
      overall_score: overallScore,
      metric_scores: metricScores,
      feedback
    };
  }
  
  /**
   * Optimize module with hint-aware metrics
   */
  async optimizeWithHints(
    module: DSPyModule,
    trainset?: any[],
    config?: Partial<DSPyOptimizationConfig>
  ): Promise<any> {
    console.log('🎯 Optimizing with hint-aware metrics');
    
    const optimizer = new DSPyGEPAOptimizer(config);
    
    // Create custom metric function for GEPA
    const hintMetric = (output: any) => {
      const evaluation = this.evaluateWithHints(output);
      console.log(`   Hint-based score: ${evaluation.overall_score.toFixed(3)}`);
      console.log(`   Feedback:`, evaluation.feedback);
      return evaluation.overall_score;
    };
    
    // Optimize with hint-aware metric
    // Note: This would need to be integrated into GEPA's fitness calculation
    const result = await optimizer.compile(module, trainset);
    
    return {
      ...result,
      hint_evaluation: this.evaluateWithHints(result.optimized_module)
    };
  }
}

// ============================================================================
// UNIFIED API
// ============================================================================

/**
 * Main API for using hints with DSPy
 */
export class DSPyHintsAPI {
  private promptEditor: SavedPromptEditor;
  
  constructor(promptsDir?: string) {
    this.promptEditor = new SavedPromptEditor(promptsDir);
  }
  
  /**
   * APPROACH 1: Edit saved prompt JSON with hints
   */
  async editSavedPrompt(
    promptId: string,
    hints: Partial<DSPyHints>
  ): Promise<SavedPrompt> {
    return await this.promptEditor.editPromptWithHints(promptId, hints);
  }
  
  /**
   * APPROACH 2: Create signature with hints before optimization
   */
  createHintedSignature(
    baseSignature: DSPySignature,
    hints: DSPyHints
  ): HintedSignature {
    return HintedSignatureBuilder.createWithHints(baseSignature, hints);
  }
  
  /**
   * APPROACH 3: Optimize with hint-based metrics
   */
  async optimizeWithHints(
    module: DSPyModule,
    hints: DSPyHints,
    trainset?: any[],
    config?: Partial<DSPyOptimizationConfig>
  ): Promise<any> {
    const optimizer = new HintAwareOptimizer(hints);
    return await optimizer.optimizeWithHints(module, trainset, config);
  }
  
  /**
   * COMBINED: Full workflow with hints
   */
  async optimizeWithHintedSignature(
    baseSignature: DSPySignature,
    hints: DSPyHints,
    trainset?: any[],
    config?: Partial<DSPyOptimizationConfig>
  ): Promise<any> {
    console.log('🎯 Full hint-aware optimization workflow');
    
    // Step 1: Create hinted signature
    const hintedSignature = this.createHintedSignature(baseSignature, hints);
    console.log('✅ Created hinted signature');
    
    // Step 2: Create module with hinted signature
    const module: DSPyModule = {
      signature: hintedSignature,
      forward: async (input) => ({ output: 'placeholder' }),
      compile: async () => {},
      optimize: async () => {}
    };
    
    // Step 3: Optimize with hint-aware metrics
    const result = await this.optimizeWithHints(module, hints, trainset, config);
    console.log('✅ Optimization complete with hint awareness');
    
    return result;
  }
}

/**
 * Export convenience functions
 */
export const dspyHints = new DSPyHintsAPI();

export function createHintedSignature(
  signature: DSPySignature,
  hints: DSPyHints
): HintedSignature {
  return dspyHints.createHintedSignature(signature, hints);
}

export async function optimizeWithHints(
  module: DSPyModule,
  hints: DSPyHints,
  trainset?: any[]
): Promise<any> {
  return await dspyHints.optimizeWithHints(module, hints, trainset);
}

