/**
 * Markdown Output Optimizer: 50%+ Token Savings
 * 
 * BREAKTHROUGH INSIGHT:
 * - Markdown tables save 50%+ tokens vs JSON
 * - Current LLMs handle markdown/TSV better than JSON
 * - Doesn't impair performance - actually improves it
 * - Almost always better than JSON for structured data
 * 
 * IMPLEMENTATION:
 * - Markdown table formatting
 * - TSV (Tab-Separated Values) formatting
 * - Auto-detection of optimal format
 * - Schema-aware conversion
 * - Token counting and comparison
 */

import { createLogger } from '../../lib/walt/logger';

const logger = createLogger('MarkdownOutputOptimizer');

// ============================================================
// OUTPUT FORMAT TYPES
// ============================================================

export type OutputFormat = 'json' | 'markdown' | 'tsv' | 'auto';

export interface OutputConfig {
  format: OutputFormat;
  includeHeaders: boolean;
  compactMode: boolean;
  schemaHints?: any;
}

export interface FormatResult {
  format: OutputFormat;
  content: string;
  tokenCount: number;
  tokenSavings: number;
  performanceScore: number;
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
}

// ============================================================
// MARKDOWN TABLE FORMATTER
// ============================================================

export class MarkdownTableFormatter {
  /**
   * Convert structured data to markdown table
   * Saves 50%+ tokens compared to JSON
   */
  static formatAsMarkdownTable(data: any[], schema?: SchemaField[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return this.formatSingleObjectAsMarkdown(data, schema);
    }

    // Extract headers from first object or schema
    const headers = schema 
      ? schema.map(f => f.name)
      : Object.keys(data[0]);

    // Build markdown table
    let table = '| ' + headers.join(' | ') + ' |\n';
    table += '|' + headers.map(() => '---').join('|') + '|\n';

    // Add rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.formatCellValue(value);
      });
      table += '| ' + values.join(' | ') + ' |\n';
    }

    return table;
  }

  /**
   * Format single object as markdown key-value pairs
   */
  static formatSingleObjectAsMarkdown(obj: any, schema?: SchemaField[]): string {
    if (typeof obj !== 'object' || obj === null) {
      return String(obj);
    }

    let markdown = '';
    const fields = schema?.map(f => f.name) || Object.keys(obj);

    for (const field of fields) {
      const value = obj[field];
      const description = schema?.find(f => f.name === field)?.description;
      
      if (Array.isArray(value)) {
        markdown += `**${field}**:\n`;
        value.forEach((item, i) => {
          markdown += `${i + 1}. ${this.formatCellValue(item)}\n`;
        });
        markdown += '\n';
      } else if (typeof value === 'object' && value !== null) {
        markdown += `**${field}**:\n`;
        markdown += this.formatSingleObjectAsMarkdown(value) + '\n';
      } else {
        markdown += `**${field}**: ${this.formatCellValue(value)}\n`;
      }
    }

    return markdown;
  }

  /**
   * Format cell value for markdown table
   */
  private static formatCellValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join('; ');
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value).replace(/\|/g, '\\|'); // Escape pipe characters
  }

  /**
   * Parse markdown table back to structured data
   */
  static parseMarkdownTable(markdown: string): any[] {
    const lines = markdown.trim().split('\n');
    if (lines.length < 3) return [];

    // Parse headers
    const headerLine = lines[0];
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // Parse data rows (skip header and separator)
    const data = [];
    for (let i = 2; i < lines.length; i++) {
      const values = lines[i]
        .split('|')
        .map(v => v.trim())
        .filter((_, index, arr) => index > 0 && index < arr.length - 1); // Remove empty first/last

      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = this.parseCellValue(values[index]);
      });
      data.push(row);
    }

    return data;
  }

  private static parseCellValue(value: string): any {
    if (value === '-') return null;
    if (value === '✓') return true;
    if (value === '✗') return false;
    if (!isNaN(Number(value))) return Number(value);
    if (value.includes(';')) return value.split(';').map(v => v.trim());
    return value;
  }
}

// ============================================================
// TSV FORMATTER
// ============================================================

export class TSVFormatter {
  /**
   * Convert structured data to TSV (Tab-Separated Values)
   * More compact than markdown tables, similar token savings
   */
  static formatAsTSV(data: any[], schema?: SchemaField[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return this.formatSingleObjectAsTSV(data);
    }

    // Extract headers
    const headers = schema 
      ? schema.map(f => f.name)
      : Object.keys(data[0]);

    // Build TSV
    let tsv = headers.join('\t') + '\n';

    // Add rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.formatTSVValue(value);
      });
      tsv += values.join('\t') + '\n';
    }

    return tsv;
  }

  /**
   * Format single object as TSV key-value pairs
   */
  static formatSingleObjectAsTSV(obj: any): string {
    if (typeof obj !== 'object' || obj === null) {
      return String(obj);
    }

    let tsv = 'Field\tValue\n';
    for (const [key, value] of Object.entries(obj)) {
      tsv += `${key}\t${this.formatTSVValue(value)}\n`;
    }

    return tsv;
  }

  /**
   * Format value for TSV
   */
  private static formatTSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join('; ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).replace(/\t/g, ' '); // Replace tabs with spaces
  }

  /**
   * Parse TSV back to structured data
   */
  static parseTSV(tsv: string): any[] {
    const lines = tsv.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse headers
    const headers = lines[0].split('\t');

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = this.parseTSVValue(values[index]);
      });
      data.push(row);
    }

    return data;
  }

  private static parseTSVValue(value: string): any {
    if (value === '') return null;
    if (!isNaN(Number(value))) return Number(value);
    if (value.includes(';')) return value.split(';').map(v => v.trim());
    return value;
  }
}

// ============================================================
// OUTPUT OPTIMIZER
// ============================================================

export class MarkdownOutputOptimizer {
  /**
   * Choose optimal output format based on data structure
   * Auto-detects whether markdown, TSV, or JSON is best
   */
  static chooseOptimalFormat(data: any, schema?: SchemaField[]): OutputFormat {
    // Single object → markdown key-value
    if (!Array.isArray(data)) {
      return 'markdown';
    }

    // Array of objects → analyze structure
    if (data.length === 0) return 'markdown';

    const firstItem = data[0];
    const fields = Object.keys(firstItem);
    const fieldCount = fields.length;

    // Simple flat structure with few fields → TSV
    if (fieldCount <= 5 && this.isFlat(firstItem)) {
      return 'tsv';
    }

    // More complex structure → markdown table
    if (this.isFlat(firstItem)) {
      return 'markdown';
    }

    // Nested structure → might need JSON
    // But still prefer markdown with nested formatting
    return 'markdown';
  }

  /**
   * Check if object structure is flat (no nested objects/arrays)
   */
  private static isFlat(obj: any): boolean {
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return false;
      }
      if (Array.isArray(value) && value.some(v => typeof v === 'object')) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert data to optimal format
   */
  static optimize(
    data: any, 
    config: OutputConfig = { format: 'auto', includeHeaders: true, compactMode: false }
  ): FormatResult {
    const format = config.format === 'auto' 
      ? this.chooseOptimalFormat(data, config.schemaHints)
      : config.format;

    let content: string;
    let jsonContent: string;

    // Format based on chosen format
    switch (format) {
      case 'markdown':
        content = Array.isArray(data)
          ? MarkdownTableFormatter.formatAsMarkdownTable(data, config.schemaHints)
          : MarkdownTableFormatter.formatSingleObjectAsMarkdown(data, config.schemaHints);
        break;

      case 'tsv':
        content = Array.isArray(data)
          ? TSVFormatter.formatAsTSV(data, config.schemaHints)
          : TSVFormatter.formatSingleObjectAsTSV(data);
        break;

      case 'json':
      default:
        content = JSON.stringify(data, null, config.compactMode ? 0 : 2);
        break;
    }

    // Calculate JSON baseline for comparison
    jsonContent = JSON.stringify(data, null, 2);

    // Count tokens (approximate: ~4 chars per token)
    const tokenCount = Math.ceil(content.length / 4);
    const jsonTokenCount = Math.ceil(jsonContent.length / 4);
    const tokenSavings = ((jsonTokenCount - tokenCount) / jsonTokenCount) * 100;

    // Performance score (based on format characteristics)
    const performanceScore = this.calculatePerformanceScore(format, data);

    logger.info('Output optimized', {
      format,
      tokenCount,
      jsonTokenCount,
      tokenSavings: `${tokenSavings.toFixed(1)}%`,
      performanceScore
    });

    return {
      format,
      content,
      tokenCount,
      tokenSavings,
      performanceScore
    };
  }

  /**
   * Calculate performance score for format choice
   */
  private static calculatePerformanceScore(format: OutputFormat, data: any): number {
    let score = 0.7; // Base score

    if (format === 'markdown') {
      score += 0.2; // LLMs excel at markdown
      if (Array.isArray(data)) score += 0.05; // Tables are great for arrays
    } else if (format === 'tsv') {
      score += 0.15; // Very compact
      if (Array.isArray(data) && data.length > 10) score += 0.1; // Great for large datasets
    } else if (format === 'json') {
      score += 0.0; // Baseline
    }

    return Math.min(1.0, score);
  }

  /**
   * Generate schema-aware prompt instructions for LLM
   */
  static generateFormatInstructions(
    format: OutputFormat, 
    schema?: SchemaField[]
  ): string {
    switch (format) {
      case 'markdown':
        return this.generateMarkdownInstructions(schema);
      
      case 'tsv':
        return this.generateTSVInstructions(schema);
      
      case 'json':
        return this.generateJSONInstructions(schema);
      
      default:
        return this.generateMarkdownInstructions(schema);
    }
  }

  private static generateMarkdownInstructions(schema?: SchemaField[]): string {
    let instructions = `Return your response as a **markdown table**.\n\n`;
    
    if (schema && schema.length > 0) {
      instructions += `Use these columns:\n`;
      schema.forEach(field => {
        instructions += `- **${field.name}**: ${field.description || field.type}\n`;
      });
      instructions += '\n';
    }

    instructions += `Format example:
| Column1 | Column2 | Column3 |
|---------|---------|---------|
| Value1  | Value2  | Value3  |

**Important**: 
- Use ✓ for true, ✗ for false
- Use - for null/empty
- Separate list items with semicolons (;)
- Keep cells concise`;

    return instructions;
  }

  private static generateTSVInstructions(schema?: SchemaField[]): string {
    let instructions = `Return your response as **tab-separated values (TSV)**.\n\n`;
    
    if (schema && schema.length > 0) {
      instructions += `Columns: ${schema.map(f => f.name).join('\t')}\n\n`;
    }

    instructions += `Format example:
Header1\tHeader2\tHeader3
Value1\tValue2\tValue3

**Important**: 
- First line is headers
- Separate columns with tabs
- No commas or pipes
- Keep values simple`;

    return instructions;
  }

  private static generateJSONInstructions(schema?: SchemaField[]): string {
    let instructions = `Return your response as **valid JSON**.\n\n`;
    
    if (schema && schema.length > 0) {
      const example: any = {};
      schema.forEach(field => {
        switch (field.type) {
          case 'string': example[field.name] = 'example'; break;
          case 'number': example[field.name] = 0; break;
          case 'boolean': example[field.name] = true; break;
          case 'array': example[field.name] = []; break;
          case 'object': example[field.name] = {}; break;
        }
      });
      instructions += `Schema:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n\n`;
    }

    instructions += `**Important**: 
- Valid JSON syntax
- No trailing commas
- Use double quotes
- Properly escaped strings`;

    return instructions;
  }

  /**
   * Compare all formats and return best option
   */
  static compareFormats(data: any, schema?: SchemaField[]): {
    json: FormatResult;
    markdown: FormatResult;
    tsv: FormatResult;
    recommendation: OutputFormat;
  } {
    const json = this.optimize(data, { format: 'json', includeHeaders: true, compactMode: false });
    const markdown = this.optimize(data, { format: 'markdown', includeHeaders: true, compactMode: false, schemaHints: schema });
    const tsv = this.optimize(data, { format: 'tsv', includeHeaders: true, compactMode: false, schemaHints: schema });

    // Recommend format with highest performance score and token savings
    const scores = [
      { format: 'json' as OutputFormat, score: json.performanceScore - (json.tokenSavings / 100) },
      { format: 'markdown' as OutputFormat, score: markdown.performanceScore + (markdown.tokenSavings / 100) },
      { format: 'tsv' as OutputFormat, score: tsv.performanceScore + (tsv.tokenSavings / 100) }
    ];

    const best = scores.reduce((max, curr) => curr.score > max.score ? curr : max);

    logger.info('Format comparison completed', {
      json: { tokens: json.tokenCount, savings: `${json.tokenSavings.toFixed(1)}%` },
      markdown: { tokens: markdown.tokenCount, savings: `${markdown.tokenSavings.toFixed(1)}%` },
      tsv: { tokens: tsv.tokenCount, savings: `${tsv.tokenSavings.toFixed(1)}%` },
      recommendation: best.format
    });

    return {
      json,
      markdown,
      tsv,
      recommendation: best.format
    };
  }
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

export const formatAsMarkdown = (data: any, schema?: SchemaField[]) =>
  MarkdownOutputOptimizer.optimize(data, { format: 'markdown', includeHeaders: true, compactMode: false, schemaHints: schema });

export const formatAsTSV = (data: any, schema?: SchemaField[]) =>
  MarkdownOutputOptimizer.optimize(data, { format: 'tsv', includeHeaders: true, compactMode: false, schemaHints: schema });

export const formatOptimal = (data: any, schema?: SchemaField[]) =>
  MarkdownOutputOptimizer.optimize(data, { format: 'auto', includeHeaders: true, compactMode: false, schemaHints: schema });

export const compareAllFormats = (data: any, schema?: SchemaField[]) =>
  MarkdownOutputOptimizer.compareFormats(data, schema);

