/**
 * Reality-Check Layer for Enriched Chunks
 * 
 * Based on Daoist Cybernetics: "Models should not be mistaken for reality itself.
 * Data and models both mirror reality (faithful reflection) and mould future outcomes."
 * 
 * Verifies that enriched chunks maintain original meaning and don't distort reality.
 */

export interface VerificationCriteria {
  faithfulness: number; // 0-1: How faithful is enriched to original?
  completeness: number; // 0-1: Does enriched contain all key info?
  accuracy: number; // 0-1: Are facts accurate?
  distortion: number; // 0-1: How much distortion? (lower is better)
}

export interface VerificationResult {
  passed: boolean;
  criteria: VerificationCriteria;
  score: number; // Overall score (0-1)
  issues: string[];
  recommendations: string[];
  originalLength: number;
  enrichedLength: number;
  contextLength: number;
}

export class RealityCheckLayer {
  private model: string = 'gemma3:4b';
  private minFaithfulnessThreshold = 0.8;
  private minCompletenessThreshold = 0.7;
  private minAccuracyThreshold = 0.8;
  
  /**
   * Verify that enriched content doesn't distort original meaning
   */
  async verifyEnrichment(
    original: string,
    enriched: string,
    context?: string
  ): Promise<VerificationResult> {
    const originalLength = original.length;
    const enrichedLength = enriched.length;
    const contextLength = context?.length || 0;
    
    // Basic checks
    if (originalLength === 0) {
      return {
        passed: false,
        criteria: {
          faithfulness: 0,
          completeness: 0,
          accuracy: 0,
          distortion: 1,
        },
        score: 0,
        issues: ['Original content is empty'],
        recommendations: ['Provide valid original content'],
        originalLength: 0,
        enrichedLength,
        contextLength,
      };
    }
    
    // Check if enriched starts with original (good sign)
    const startsWithOriginal = enriched.includes(original) || 
                              enriched.substring(0, originalLength * 1.2).includes(original.substring(0, originalLength * 0.8));
    
    // LLM-based verification
    const llmVerification = await this.verifyWithLLM(original, enriched, context);
    
    // Combine results
    const criteria: VerificationCriteria = {
      faithfulness: llmVerification.faithfulness,
      completeness: llmVerification.completeness,
      accuracy: llmVerification.accuracy,
      distortion: 1 - llmVerification.faithfulness, // Inverse of faithfulness
    };
    
    const score = (criteria.faithfulness + criteria.completeness + criteria.accuracy) / 3;
    
    const passed = criteria.faithfulness >= this.minFaithfulnessThreshold &&
                   criteria.completeness >= this.minCompletenessThreshold &&
                   criteria.accuracy >= this.minAccuracyThreshold;
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (criteria.faithfulness < this.minFaithfulnessThreshold) {
      issues.push(`Faithfulness score ${(criteria.faithfulness * 100).toFixed(1)}% is below threshold ${(this.minFaithfulnessThreshold * 100)}%`);
      recommendations.push('Review context generation to ensure it doesn\'t distort original meaning');
    }
    
    if (criteria.completeness < this.minCompletenessThreshold) {
      issues.push(`Completeness score ${(criteria.completeness * 100).toFixed(1)}% is below threshold ${(this.minCompletenessThreshold * 100)}%`);
      recommendations.push('Ensure all key information from original is preserved');
    }
    
    if (criteria.accuracy < this.minAccuracyThreshold) {
      issues.push(`Accuracy score ${(criteria.accuracy * 100).toFixed(1)}% is below threshold ${(this.minAccuracyThreshold * 100)}%`);
      recommendations.push('Verify that enriched content maintains factual accuracy');
    }
    
    if (!startsWithOriginal && criteria.faithfulness < 0.9) {
      issues.push('Enriched content may have reordered or significantly modified original');
      recommendations.push('Ensure original content is preserved in enriched version');
    }
    
    return {
      passed,
      criteria,
      score,
      issues,
      recommendations,
      originalLength,
      enrichedLength,
      contextLength,
    };
  }
  
  /**
   * Verify with LLM (using gemma3:4b for cost efficiency)
   */
  private async verifyWithLLM(
    original: string,
    enriched: string,
    context?: string
  ): Promise<{ faithfulness: number; completeness: number; accuracy: number }> {
    const prompt = `You are verifying that enriched content maintains the original meaning without distortion.

Original Content:
${original}

${context ? `Context Added:\n${context}\n\n` : ''}
Enriched Content:
${enriched}

Evaluate the enriched content on three dimensions (0-1 scale):
1. Faithfulness: How faithful is the enriched content to the original? Does it preserve the original meaning without distortion?
2. Completeness: Does the enriched content contain all key information from the original?
3. Accuracy: Are facts and claims in the enriched content accurate and consistent with the original?

Respond with JSON only:
{
  "faithfulness": 0.0-1.0,
  "completeness": 0.0-1.0,
  "accuracy": 0.0-1.0,
  "reasoning": "Brief explanation"
}`;

    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an expert at verifying content faithfulness. Respond only with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent verification
          max_tokens: 300,
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API returned status ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      return {
        faithfulness: Math.max(0, Math.min(1, result.faithfulness || 0.5)),
        completeness: Math.max(0, Math.min(1, result.completeness || 0.5)),
        accuracy: Math.max(0, Math.min(1, result.accuracy || 0.5)),
      };
    } catch (error) {
      console.warn('LLM verification failed, using fallback:', error);
      
      // Fallback: Simple heuristic-based verification
      return this.fallbackVerification(original, enriched);
    }
  }
  
  /**
   * Fallback verification using heuristics
   */
  private fallbackVerification(
    original: string,
    enriched: string
  ): { faithfulness: number; completeness: number; accuracy: number } {
    // Simple heuristics
    const originalWords = original.toLowerCase().split(/\s+/);
    const enrichedWords = enriched.toLowerCase().split(/\s+/);
    
    // Faithfulness: How many original words appear in enriched?
    const originalWordsInEnriched = originalWords.filter(w => 
      enrichedWords.includes(w) && w.length > 3 // Ignore short words
    ).length;
    const faithfulness = originalWords.length > 0 
      ? originalWordsInEnriched / originalWords.length 
      : 0.5;
    
    // Completeness: Ratio of original length to enriched length (accounting for context)
    const lengthRatio = original.length / enriched.length;
    const completeness = Math.min(1, lengthRatio * 1.2); // Allow 20% expansion for context
    
    // Accuracy: Assume high if faithfulness is high (heuristic)
    const accuracy = faithfulness * 0.9; // Slightly lower than faithfulness
    
    return {
      faithfulness: Math.max(0.5, Math.min(1, faithfulness)),
      completeness: Math.max(0.5, Math.min(1, completeness)),
      accuracy: Math.max(0.5, Math.min(1, accuracy)),
    };
  }
  
  /**
   * Batch verify multiple enriched chunks
   */
  async batchVerify(
    chunks: Array<{ original: string; enriched: string; context?: string }>
  ): Promise<VerificationResult[]> {
    const results = await Promise.all(
      chunks.map(chunk => this.verifyEnrichment(chunk.original, chunk.enriched, chunk.context))
    );
    
    return results;
  }
  
  /**
   * Get verification statistics
   */
  getVerificationStats(results: VerificationResult[]): {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    avgFaithfulness: number;
    avgCompleteness: number;
    avgAccuracy: number;
  } {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const avgFaithfulness = results.reduce((sum, r) => sum + r.criteria.faithfulness, 0) / results.length;
    const avgCompleteness = results.reduce((sum, r) => sum + r.criteria.completeness, 0) / results.length;
    const avgAccuracy = results.reduce((sum, r) => sum + r.criteria.accuracy, 0) / results.length;
    
    return {
      total: results.length,
      passed,
      failed,
      avgScore,
      avgFaithfulness,
      avgCompleteness,
      avgAccuracy,
    };
  }
}

// Singleton instance
export const realityCheckLayer = new RealityCheckLayer();

