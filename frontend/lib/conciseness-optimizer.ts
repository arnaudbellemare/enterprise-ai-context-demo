/**
 * CONCISENESS OPTIMIZER
 * 
 * Addresses the 47% conciseness issue by implementing aggressive output compression
 * while maintaining quality and readability.
 */

import { createLogger } from '../../lib/walt/logger';

const logger = createLogger('ConcisenessOptimizer');

export interface ConcisenessConfig {
  targetCompressionRatio: number; // Target compression ratio (e.g., 0.6 = 40% reduction)
  preserveStructure: boolean;     // Keep headings, lists, etc.
  preserveCitations: boolean;     // Keep academic citations
  aggressiveMode: boolean;        // More aggressive compression
}

export class ConcisenessOptimizer {
  private config: ConcisenessConfig;

  constructor(config: Partial<ConcisenessConfig> = {}) {
    this.config = {
      targetCompressionRatio: 0.6,
      preserveStructure: true,
      preserveCitations: true,
      aggressiveMode: false,
      ...config
    };
  }

  /**
   * Optimize text for conciseness while maintaining quality
   */
  async optimizeText(text: string, context?: string): Promise<{
    optimizedText: string;
    compressionRatio: number;
    tokenSavings: number;
    qualityScore: number;
  }> {
    logger.info('Starting conciseness optimization', { 
      originalLength: text.length,
      targetRatio: this.config.targetCompressionRatio 
    });

    const originalTokens = this.estimateTokens(text);
    let optimizedText = text;

    // Step 1: Remove redundant phrases and verbose constructions
    optimizedText = this.removeRedundantPhrases(optimizedText);

    // Step 2: Compress repetitive content
    optimizedText = this.compressRepetitiveContent(optimizedText);

    // Step 3: Optimize sentence structure
    optimizedText = this.optimizeSentenceStructure(optimizedText);

    // Step 4: Remove unnecessary qualifiers
    optimizedText = this.removeUnnecessaryQualifiers(optimizedText);

    // Step 5: Compress lists and bullet points
    optimizedText = this.compressLists(optimizedText);

    // Step 6: Academic-specific optimizations
    if (context?.includes('academic') || context?.includes('research')) {
      optimizedText = this.optimizeAcademicWriting(optimizedText);
    }

    const finalTokens = this.estimateTokens(optimizedText);
    const compressionRatio = finalTokens / originalTokens;
    const tokenSavings = originalTokens - finalTokens;
    const qualityScore = this.assessQuality(optimizedText, text);

    logger.info('Conciseness optimization complete', {
      compressionRatio: compressionRatio.toFixed(3),
      tokenSavings,
      qualityScore: qualityScore.toFixed(3)
    });

    return {
      optimizedText,
      compressionRatio,
      tokenSavings,
      qualityScore
    };
  }

  /**
   * Remove redundant phrases and verbose constructions
   */
  private removeRedundantPhrases(text: string): string {
    const redundantPatterns = [
      // Verbose constructions
      { pattern: /\b(it is important to note that)\b/gi, replacement: 'Note:' },
      { pattern: /\b(it should be noted that)\b/gi, replacement: 'Note:' },
      { pattern: /\b(it is worth mentioning that)\b/gi, replacement: 'Note:' },
      { pattern: /\b(it is clear that)\b/gi, replacement: '' },
      { pattern: /\b(it is evident that)\b/gi, replacement: '' },
      { pattern: /\b(it is obvious that)\b/gi, replacement: '' },
      
      // Redundant phrases
      { pattern: /\b(in order to)\b/gi, replacement: 'to' },
      { pattern: /\b(due to the fact that)\b/gi, replacement: 'because' },
      { pattern: /\b(for the purpose of)\b/gi, replacement: 'to' },
      { pattern: /\b(with regard to)\b/gi, replacement: 'regarding' },
      { pattern: /\b(in the case of)\b/gi, replacement: 'for' },
      { pattern: /\b(in terms of)\b/gi, replacement: 'in' },
      
      // Unnecessary qualifiers
      { pattern: /\b(very|quite|rather|somewhat|fairly|relatively)\s+/gi, replacement: '' },
      { pattern: /\b(extremely|incredibly|tremendously|significantly)\s+/gi, replacement: '' },
      
      // Redundant words
      { pattern: /\b(completely finished)\b/gi, replacement: 'finished' },
      { pattern: /\b(totally complete)\b/gi, replacement: 'complete' },
      { pattern: /\b(absolutely certain)\b/gi, replacement: 'certain' },
      { pattern: /\b(perfectly clear)\b/gi, replacement: 'clear' },
    ];

    let result = text;
    for (const { pattern, replacement } of redundantPatterns) {
      result = result.replace(pattern, replacement);
    }

    return result;
  }

  /**
   * Compress repetitive content
   */
  private compressRepetitiveContent(text: string): string {
    // Remove repeated sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueSentences = [...new Set(sentences.map(s => s.trim()))];
    
    if (uniqueSentences.length < sentences.length) {
      logger.info('Removed repetitive sentences', { 
        original: sentences.length, 
        unique: uniqueSentences.length 
      });
    }

    return uniqueSentences.join('. ') + (text.endsWith('.') ? '.' : '');
  }

  /**
   * Optimize sentence structure
   */
  private optimizeSentenceStructure(text: string): string {
    return text
      // Split long sentences
      .replace(/([.!?])\s+([A-Z][^.!?]{100,}[.!?])/g, '$1\n\n$2')
      // Remove unnecessary commas
      .replace(/,\s+and\s+/g, ' and ')
      .replace(/,\s+but\s+/g, ' but ')
      // Simplify complex constructions
      .replace(/\b(the fact that)\b/gi, 'that')
      .replace(/\b(there is|there are)\b/gi, '')
      .replace(/\b(it is|it was)\b/gi, '');
  }

  /**
   * Remove unnecessary qualifiers
   */
  private removeUnnecessaryQualifiers(text: string): string {
    const qualifierPatterns = [
      /\b(quite|rather|somewhat|fairly|relatively|pretty)\s+/gi,
      /\b(very|extremely|incredibly|tremendously|significantly)\s+/gi,
      /\b(completely|totally|absolutely|perfectly)\s+/gi,
    ];

    let result = text;
    for (const pattern of qualifierPatterns) {
      result = result.replace(pattern, '');
    }

    return result;
  }

  /**
   * Compress lists and bullet points
   */
  private compressLists(text: string): string {
    return text
      // Compress bullet points
      .replace(/^[\s]*[-*•]\s+/gm, '• ')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Compress numbered lists
      .replace(/^[\s]*\d+\.\s+/gm, (match, offset) => {
        const prevChar = text[offset - 1];
        return prevChar === '\n' ? match : '• ';
      });
  }

  /**
   * Academic-specific optimizations
   */
  private optimizeAcademicWriting(text: string): string {
    return text
      // Compress academic phrases
      .replace(/\b(in this study|in this research|in this paper)\b/gi, 'here')
      .replace(/\b(previous research|prior studies|earlier work)\b/gi, 'previous work')
      .replace(/\b(future research|future studies|future work)\b/gi, 'future work')
      .replace(/\b(results show|findings indicate|data suggests)\b/gi, 'results indicate')
      .replace(/\b(it can be seen that|it is observed that)\b/gi, '')
      .replace(/\b(as can be seen|as observed|as shown)\b/gi, '')
      // Compress methodology descriptions
      .replace(/\b(we used|we employed|we utilized)\b/gi, 'we used')
      .replace(/\b(we conducted|we performed|we carried out)\b/gi, 'we conducted')
      // Compress conclusion phrases
      .replace(/\b(in conclusion|to conclude|to summarize)\b/gi, 'conclusion:')
      .replace(/\b(in summary|to sum up|in brief)\b/gi, 'summary:');
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Assess quality of optimized text
   */
  private assessQuality(optimized: string, original: string): number {
    const originalSentences = original.split(/[.!?]+/).length;
    const optimizedSentences = optimized.split(/[.!?]+/).length;
    
    // Penalize if too many sentences were removed
    const sentenceRatio = optimizedSentences / originalSentences;
    if (sentenceRatio < 0.5) return 0.3;
    if (sentenceRatio < 0.7) return 0.6;
    if (sentenceRatio < 0.9) return 0.8;
    
    // Check for readability
    const avgSentenceLength = optimized.length / optimizedSentences;
    if (avgSentenceLength > 100) return 0.7; // Too long
    if (avgSentenceLength < 20) return 0.6;   // Too short
    
    return 0.9; // Good quality
  }
}

/**
 * Create a conciseness optimizer instance
 */
export function createConcisenessOptimizer(config?: Partial<ConcisenessConfig>): ConcisenessOptimizer {
  return new ConcisenessOptimizer(config);
}
