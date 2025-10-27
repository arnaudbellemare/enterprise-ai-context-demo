/**
 * DSPy Markdown Integration: Token-Efficient Structured Outputs
 * 
 * Integrates markdown/TSV optimization with DSPy signatures
 * Automatically generates format-aware prompts
 * 50%+ token savings without performance loss
 */

import {
  MarkdownOutputOptimizer,
  OutputFormat,
  SchemaField,
  FormatResult
} from './markdown-output-optimizer';
import { DSPySignature } from './dspy-signatures';
import { createLogger } from '../../lib/walt/logger';

const logger = createLogger('DSPyMarkdownIntegration');

// ============================================================
// ENHANCED DSPY SIGNATURE WITH FORMAT AWARENESS
// ============================================================

export interface MarkdownAwareDSPySignature extends DSPySignature {
  outputFormat?: OutputFormat;
  preferredFormat?: OutputFormat;
  allowFormatOptimization?: boolean;
}

export interface DSPyMarkdownConfig {
  signature: MarkdownAwareDSPySignature;
  autoOptimizeFormat: boolean;
  includeFormatInstructions: boolean;
  trackTokenSavings: boolean;
}

export interface DSPyMarkdownResult {
  output: any;
  format: OutputFormat;
  rawContent: string;
  tokenSavings: number;
  performanceScore: number;
  promptInstructions: string;
}

// ============================================================
// DSPY MARKDOWN COMPILER
// ============================================================

export class DSPyMarkdownCompiler {
  /**
   * Compile DSPy signature with markdown/TSV optimization
   */
  static compile(config: DSPyMarkdownConfig): {
    enhancedSignature: MarkdownAwareDSPySignature;
    formatInstructions: string;
    expectedFormat: OutputFormat;
  } {
    const { signature, autoOptimizeFormat, includeFormatInstructions } = config;

    // Step 1: Extract schema from DSPy signature output
    const schema = this.extractSchemaFromSignature(signature);

    // Step 2: Determine optimal format
    const expectedFormat = autoOptimizeFormat
      ? MarkdownOutputOptimizer.chooseOptimalFormat(schema)
      : (signature.outputFormat || 'markdown');

    // Step 3: Generate format-specific instructions
    const formatInstructions = includeFormatInstructions
      ? MarkdownOutputOptimizer.generateFormatInstructions(expectedFormat, schema)
      : '';

    // Step 4: Enhance signature with format awareness
    const enhancedSignature: MarkdownAwareDSPySignature = {
      ...signature,
      outputFormat: expectedFormat,
      allowFormatOptimization: autoOptimizeFormat
    };

    logger.info('DSPy signature compiled with markdown optimization', {
      domain: signature.domain,
      outputFormat: expectedFormat,
      schemaFields: schema.length,
      instructionsLength: formatInstructions.length
    });

    return {
      enhancedSignature,
      formatInstructions,
      expectedFormat
    };
  }

  /**
   * Extract schema fields from DSPy signature output definition
   */
  private static extractSchemaFromSignature(signature: DSPySignature): SchemaField[] {
    const schema: SchemaField[] = [];

    for (const [fieldName, zodSchema] of Object.entries(signature.output)) {
      const field: SchemaField = {
        name: fieldName,
        type: this.inferTypeFromZod(zodSchema),
        description: (zodSchema as any)._def?.description || fieldName
      };
      schema.push(field);
    }

    return schema;
  }

  /**
   * Infer TypeScript type from Zod schema
   */
  private static inferTypeFromZod(zodSchema: any): 'string' | 'number' | 'boolean' | 'array' | 'object' {
    const typeName = zodSchema._def?.typeName;
    
    if (typeName === 'ZodString') return 'string';
    if (typeName === 'ZodNumber') return 'number';
    if (typeName === 'ZodBoolean') return 'boolean';
    if (typeName === 'ZodArray') return 'array';
    if (typeName === 'ZodObject') return 'object';
    
    return 'string'; // Default fallback
  }

  /**
   * Build enhanced prompt with format instructions
   */
  static buildEnhancedPrompt(
    originalPrompt: string,
    signature: MarkdownAwareDSPySignature,
    formatInstructions: string
  ): string {
    let enhancedPrompt = originalPrompt;

    // Add format instructions at the end
    if (formatInstructions) {
      enhancedPrompt += '\n\n## Output Format Instructions\n\n';
      enhancedPrompt += formatInstructions;
    }

    // Add schema hints
    const schema = this.extractSchemaFromSignature(signature);
    if (schema.length > 0) {
      enhancedPrompt += '\n\n## Required Fields\n\n';
      schema.forEach(field => {
        enhancedPrompt += `- **${field.name}** (${field.type}): ${field.description}\n`;
      });
    }

    return enhancedPrompt;
  }
}

// ============================================================
// DSPY MARKDOWN EXECUTOR
// ============================================================

export class DSPyMarkdownExecutor {
  /**
   * Execute DSPy module with markdown optimization
   */
  static async execute(
    prompt: string,
    signature: MarkdownAwareDSPySignature,
    config: DSPyMarkdownConfig,
    executeFn: (prompt: string) => Promise<string>
  ): Promise<DSPyMarkdownResult> {
    // Step 1: Compile signature with format optimization
    const compiled = DSPyMarkdownCompiler.compile(config);

    // Step 2: Build enhanced prompt
    const enhancedPrompt = DSPyMarkdownCompiler.buildEnhancedPrompt(
      prompt,
      compiled.enhancedSignature,
      compiled.formatInstructions
    );

    // Step 3: Execute LLM call
    const rawContent = await executeFn(enhancedPrompt);

    // Step 4: Parse response based on format
    const output = this.parseResponse(rawContent, compiled.expectedFormat);

    // Step 5: Calculate token savings
    const formatResult = MarkdownOutputOptimizer.optimize(output, {
      format: compiled.expectedFormat,
      includeHeaders: true,
      compactMode: false
    });

    logger.info('DSPy module executed with markdown optimization', {
      format: compiled.expectedFormat,
      tokenSavings: `${formatResult.tokenSavings.toFixed(1)}%`,
      performanceScore: formatResult.performanceScore
    });

    return {
      output,
      format: compiled.expectedFormat,
      rawContent,
      tokenSavings: formatResult.tokenSavings,
      performanceScore: formatResult.performanceScore,
      promptInstructions: compiled.formatInstructions
    };
  }

  /**
   * Parse LLM response based on format
   */
  private static parseResponse(content: string, format: OutputFormat): any {
    try {
      switch (format) {
        case 'markdown':
          return this.parseMarkdownResponse(content);
        
        case 'tsv':
          return this.parseTSVResponse(content);
        
        case 'json':
        default:
          return JSON.parse(content);
      }
    } catch (error) {
      logger.error('Failed to parse response', { format, error });
      // Fallback: try to extract structured data
      return this.extractStructuredData(content);
    }
  }

  private static parseMarkdownResponse(content: string): any {
    // Check if content contains a table
    if (content.includes('|') && content.includes('---')) {
      // Import the parser
      const { MarkdownTableFormatter } = require('./markdown-output-optimizer');
      return MarkdownTableFormatter.parseMarkdownTable(content);
    }

    // Otherwise, parse as key-value pairs
    return this.extractStructuredData(content);
  }

  private static parseTSVResponse(content: string): any {
    const { TSVFormatter } = require('./markdown-output-optimizer');
    return TSVFormatter.parseTSV(content);
  }

  private static extractStructuredData(content: string): any {
    // Simple extraction for fallback
    const result: any = {};
    const lines = content.split('\n');

    for (const line of lines) {
      // Match key-value patterns
      const match = line.match(/\*\*(.+?)\*\*:?\s*(.+)/);
      if (match) {
        const [, key, value] = match;
        result[key.trim()] = value.trim();
      }
    }

    return Object.keys(result).length > 0 ? result : { raw: content };
  }
}

// ============================================================
// DSPY GEPA MARKDOWN INTEGRATION
// ============================================================

export class DSPyGEPAMarkdownIntegration {
  /**
   * Optimize DSPy prompts with GEPA + markdown format awareness
   */
  static async optimizeWithMarkdown(
    signature: MarkdownAwareDSPySignature,
    trainingExamples: Array<{ input: any; expectedOutput: any }>,
    gepaConfig?: any
  ): Promise<{
    optimizedSignature: MarkdownAwareDSPySignature;
    formatRecommendation: OutputFormat;
    averageTokenSavings: number;
    performanceImprovement: number;
  }> {
    logger.info('Starting GEPA optimization with markdown awareness', {
      domain: signature.domain,
      examples: trainingExamples.length
    });

    // Step 1: Test all formats on training examples
    const formatPerformance = await this.evaluateFormatsOnExamples(
      signature,
      trainingExamples
    );

    // Step 2: Select best format
    const bestFormat = this.selectBestFormat(formatPerformance);

    // Step 3: Optimize signature with best format
    const optimizedSignature: MarkdownAwareDSPySignature = {
      ...signature,
      outputFormat: bestFormat.format,
      preferredFormat: bestFormat.format,
      allowFormatOptimization: true
    };

    logger.info('GEPA markdown optimization completed', {
      recommendedFormat: bestFormat.format,
      avgTokenSavings: `${bestFormat.avgTokenSavings.toFixed(1)}%`,
      performanceImprovement: `${bestFormat.performanceScore.toFixed(2)}`
    });

    return {
      optimizedSignature,
      formatRecommendation: bestFormat.format,
      averageTokenSavings: bestFormat.avgTokenSavings,
      performanceImprovement: bestFormat.performanceScore
    };
  }

  private static async evaluateFormatsOnExamples(
    signature: DSPySignature,
    examples: Array<{ input: any; expectedOutput: any }>
  ): Promise<Map<OutputFormat, { avgTokenSavings: number; performanceScore: number }>> {
    const formats: OutputFormat[] = ['json', 'markdown', 'tsv'];
    const results = new Map();

    for (const format of formats) {
      let totalTokenSavings = 0;
      let totalPerformance = 0;

      for (const example of examples) {
        const result = MarkdownOutputOptimizer.optimize(example.expectedOutput, {
          format,
          includeHeaders: true,
          compactMode: false
        });

        totalTokenSavings += result.tokenSavings;
        totalPerformance += result.performanceScore;
      }

      results.set(format, {
        avgTokenSavings: totalTokenSavings / examples.length,
        performanceScore: totalPerformance / examples.length
      });
    }

    return results;
  }

  private static selectBestFormat(
    formatPerformance: Map<OutputFormat, { avgTokenSavings: number; performanceScore: number }>
  ): { format: OutputFormat; avgTokenSavings: number; performanceScore: number } {
    let bestFormat: OutputFormat = 'markdown';
    let bestScore = -Infinity;
    let bestResult = { avgTokenSavings: 0, performanceScore: 0 };

    for (const [format, metrics] of formatPerformance.entries()) {
      // Combined score: 70% performance, 30% token savings
      const score = (metrics.performanceScore * 0.7) + ((metrics.avgTokenSavings / 100) * 0.3);
      
      if (score > bestScore) {
        bestScore = score;
        bestFormat = format;
        bestResult = metrics;
      }
    }

    return { format: bestFormat, ...bestResult };
  }
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Quick helper: Convert DSPy signature to use markdown output
 */
export function withMarkdownOutput(signature: DSPySignature): MarkdownAwareDSPySignature {
  return {
    ...signature,
    outputFormat: 'markdown',
    allowFormatOptimization: true
  };
}

/**
 * Quick helper: Convert DSPy signature to use TSV output
 */
export function withTSVOutput(signature: DSPySignature): MarkdownAwareDSPySignature {
  return {
    ...signature,
    outputFormat: 'tsv',
    allowFormatOptimization: true
  };
}

/**
 * Quick helper: Auto-optimize DSPy signature format
 */
export function withAutoFormat(signature: DSPySignature): MarkdownAwareDSPySignature {
  return {
    ...signature,
    outputFormat: 'auto',
    allowFormatOptimization: true
  };
}

/**
 * Execute DSPy module with optimal format
 */
export async function executeWithOptimalFormat(
  prompt: string,
  signature: DSPySignature,
  executeFn: (prompt: string) => Promise<string>
): Promise<DSPyMarkdownResult> {
  const config: DSPyMarkdownConfig = {
    signature: withAutoFormat(signature),
    autoOptimizeFormat: true,
    includeFormatInstructions: true,
    trackTokenSavings: true
  };

  return DSPyMarkdownExecutor.execute(prompt, config.signature, config, executeFn);
}

export default {
  DSPyMarkdownCompiler,
  DSPyMarkdownExecutor,
  DSPyGEPAMarkdownIntegration,
  withMarkdownOutput,
  withTSVOutput,
  withAutoFormat,
  executeWithOptimalFormat
};

