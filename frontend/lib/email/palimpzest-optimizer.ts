/**
 * PALIMPZEST Physical Optimizer
 * Auto-selects models, trims tokens, and optimizes batch processing
 * Based on arXiv:2405.14696v2
 */

import { TenantEmailSchema, ModelSelection, TokenTrimmingConfig } from './palimpzest-schemas';

/**
 * Model cost estimates (per 1K tokens, approximate)
 */
const MODEL_COSTS = {
  'gpt-3.5-turbo': 0.0015, // $0.0015 per 1K tokens
  'gpt-4o-mini': 0.003,    // $0.003 per 1K tokens
  'gpt-4': 0.03,          // $0.03 per 1K tokens
  'grok-4': 0.01          // Estimated
};

/**
 * Model latency estimates (ms per request, approximate)
 */
const MODEL_LATENCY = {
  'gpt-3.5-turbo': 200,
  'gpt-4o-mini': 300,
  'gpt-4': 1000,
  'grok-4': 500
};

export class EmailOptimizer {
  /**
   * Select optimal model based on email characteristics (PALIMPZEST optimization)
   * 
   * Strategy:
   * - Cheap model (GPT-3.5) for high-confidence, simple queries
   * - Medium model (GPT-4o-mini) for structured extraction
   * - Expensive model (GPT-4) only for complex, low-confidence queries
   */
  selectModel(email: Partial<TenantEmailSchema>, complexity: number = 0.5): ModelSelection {
    const confidence = email.confidence || 0.5;
    const emailClass = email.class || 'general';
    
    // High confidence + simple class = cheap model
    if (confidence > 0.8 && emailClass !== 'general' && complexity < 0.3) {
      return {
        model: 'gpt-3.5-turbo',
        reasoning: 'High confidence classification, simple query',
        cost_estimate: MODEL_COSTS['gpt-3.5-turbo'] * 0.5, // ~500 tokens
        latency_estimate: MODEL_LATENCY['gpt-3.5-turbo']
      };
    }
    
    // Structured extraction needed = medium model
    if (email.extracted_slots?.unit && email.extracted_slots?.issue_type) {
      return {
        model: 'gpt-4o-mini',
        reasoning: 'Structured extraction needed, balanced cost/quality',
        cost_estimate: MODEL_COSTS['gpt-4o-mini'] * 0.8, // ~800 tokens
        latency_estimate: MODEL_LATENCY['gpt-4o-mini']
      };
    }
    
    // Complex queries = expensive model
    if (emailClass === 'general' || confidence < 0.6 || complexity > 0.7) {
      return {
        model: 'gpt-4',
        reasoning: 'Complex query, low confidence, or high complexity',
        cost_estimate: MODEL_COSTS['gpt-4'] * 1.5, // ~1500 tokens
        latency_estimate: MODEL_LATENCY['gpt-4']
      };
    }
    
    // Default to cheap model
    return {
      model: 'gpt-3.5-turbo',
      reasoning: 'Default to cost-effective model',
      cost_estimate: MODEL_COSTS['gpt-3.5-turbo'] * 0.5,
      latency_estimate: MODEL_LATENCY['gpt-3.5-turbo']
    };
  }

  /**
   * Token trimming optimization (PALIMPZEST input reduction)
   * Removes boilerplate while preserving important context
   */
  trimTokens(text: string, config: TokenTrimmingConfig): string {
    let trimmed = text;
    
    // Remove email headers
    if (config.remove_boilerplate) {
      trimmed = this.removeEmailHeaders(trimmed);
      trimmed = this.removeEmailSignatures(trimmed);
      trimmed = this.removeQuotedText(trimmed);
    }
    
    // Estimate token count (rough: 1 token ≈ 4 characters)
    const estimatedTokens = trimmed.length / 4;
    
    // If still too long, truncate intelligently
    if (estimatedTokens > config.max_tokens) {
      trimmed = this.intelligentTruncate(trimmed, config.max_tokens, config.preserve_context);
    }
    
    return trimmed;
  }

  /**
   * Remove email headers (From, To, Subject, Date, etc.)
   */
  private removeEmailHeaders(text: string): string {
    return text.replace(/^(From|To|Subject|Date|Cc|Bcc):\s*.*$/gmi, '').trim();
  }

  /**
   * Remove email signatures (common patterns)
   */
  private removeEmailSignatures(text: string): string {
    // Remove common signature patterns
    const signaturePatterns = [
      /^--\s*$/m, // --
      /^Best regards,?$/mi,
      /^Sincerely,?$/mi,
      /^Sent from.*$/mi,
      /^Gestion Velora$/mi
    ];
    
    let cleaned = text;
    signaturePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned.trim();
  }

  /**
   * Remove quoted/replied text (lines starting with >)
   */
  private removeQuotedText(text: string): string {
    return text.split('\n')
      .filter(line => !line.trim().startsWith('>'))
      .join('\n')
      .trim();
  }

  /**
   * Intelligent truncation preserving important context
   */
  private intelligentTruncate(text: string, maxTokens: number, preserveContext: boolean): string {
    const maxChars = maxTokens * 4; // Rough token-to-char conversion
    
    if (text.length <= maxChars) return text;
    
    if (preserveContext) {
      // Preserve beginning (most important) and try to keep entity mentions
      const firstHalf = text.substring(0, maxChars * 0.7);
      const entityPattern = /\b(unit|Unit|UNIT|#\d{4}|\$\d+|\d{1,2}\/\d{1,2}\/\d{4})\b/g;
      const importantMatches = [...text.matchAll(entityPattern)].slice(-5);
      
      if (importantMatches.length > 0) {
        const lastImportant = importantMatches[importantMatches.length - 1];
        const startPos = Math.max(0, lastImportant.index! - 100);
        return text.substring(startPos, startPos + maxChars);
      }
    }
    
    // Simple truncation
    return text.substring(0, maxChars) + '...';
  }

  /**
   * Batch optimization: Group similar emails for parallel processing
   * PALIMPZEST optimization: Group by class for KV cache reuse
   */
  createBatches(emails: TenantEmailSchema[], batchSize: number = 50): TenantEmailSchema[][] {
    // Group by class for KV cache reuse (major PALIMPZEST optimization)
    const grouped = emails.reduce((acc, email) => {
      const key = email.class;
      if (!acc[key]) acc[key] = [];
      acc[key].push(email);
      return acc;
    }, {} as Record<string, TenantEmailSchema[]>);
    
    // Create batches from groups
    const batches: TenantEmailSchema[][] = [];
    Object.values(grouped).forEach(group => {
      for (let i = 0; i < group.length; i += batchSize) {
        batches.push(group.slice(i, i + batchSize));
      }
    });
    
    return batches;
  }

  /**
   * Calculate complexity score for email (0-1)
   */
  calculateComplexity(email: Partial<TenantEmailSchema>): number {
    let complexity = 0;
    
    // Longer emails are more complex
    const length = email.content?.length || 0;
    complexity += Math.min(length / 5000, 0.3); // Max 0.3 for length
    
    // More extracted slots = more complex
    const slotCount = Object.keys(email.extracted_slots || {}).length;
    complexity += Math.min(slotCount / 10, 0.2); // Max 0.2 for slots
    
    // General class = more complex
    if (email.class === 'general') complexity += 0.3;
    
    // Low confidence = more complex
    if ((email.confidence || 0.5) < 0.6) complexity += 0.2;
    
    return Math.min(complexity, 1.0);
  }
}

