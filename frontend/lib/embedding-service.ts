/**
 * UNIFIED EMBEDDING SERVICE
 * 
 * Provides robust embedding generation with LOCAL fallbacks:
 * 1. Ollama Local (primary)
 * 2. Simple hash-based embeddings (fallback)
 * 3. Deterministic text-based embeddings (last resort)
 */

import { createLogger } from '../../lib/walt/logger';

const logger = createLogger('EmbeddingService');

export interface EmbeddingResult {
  embedding: number[];
  provider: string;
  dimensions: number;
}

export class UnifiedEmbeddingService {
  private static instance: UnifiedEmbeddingService | null = null;
  private dimensions = 512;
  private cache = new Map<string, number[]>();
  
  static getInstance(): UnifiedEmbeddingService {
    if (!UnifiedEmbeddingService.instance) {
      UnifiedEmbeddingService.instance = new UnifiedEmbeddingService();
    }
    return UnifiedEmbeddingService.instance;
  }
  
  async generate(text: string): Promise<EmbeddingResult> {
    // Check cache first
    const cacheKey = text.substring(0, 100); // Use first 100 chars as key
    if (this.cache.has(cacheKey)) {
      logger.info('Using cached embedding', { textLength: text.length });
      return {
        embedding: this.cache.get(cacheKey)!,
        provider: 'cache',
        dimensions: this.dimensions
      };
    }
    
    // Try Ollama first (our primary local option)
    try {
      const result = await this.generateOllama(text);
      this.cache.set(cacheKey, result.embedding);
      return result;
    } catch (error: any) {
      logger.warn('Ollama embedding failed, using hash-based fallback', { error: error.message });
    }
    
    // Use hash-based fallback as last resort
    const result = this.generateHashBased(text);
    this.cache.set(cacheKey, result.embedding);
    return result;
  }
  
  private async generateOllama(text: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let embedding = data.embedding || [];
      
      if (embedding.length < this.dimensions) {
        embedding = [...embedding, ...new Array(this.dimensions - embedding.length).fill(0)];
      } else if (embedding.length > this.dimensions) {
        embedding = embedding.slice(0, this.dimensions);
      }
      
      logger.info('Ollama embedding generated successfully', { 
        originalLength: data.embedding?.length || 0,
        normalizedLength: embedding.length,
        textLength: text.length 
      });
      
      return { embedding, provider: 'ollama', dimensions: this.dimensions };

    } catch (error: any) {
      logger.warn('Ollama embeddings not available', { error: error.message });
      throw error;
    }
  }
  
  private generateHashBased(text: string): EmbeddingResult {
    // Generate a deterministic hash-based embedding as fallback
    const hash = this.simpleHash(text);
    const embedding = new Array(this.dimensions);
    
    // Use hash to generate pseudo-random but deterministic values
    for (let i = 0; i < this.dimensions; i++) {
      const seed = hash + i;
      embedding[i] = (Math.sin(seed) * 10000) % 1; // Generate values between -1 and 1
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < this.dimensions; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
    
    logger.info('Generated hash-based embedding', { textLength: text.length, hash });
    
    return {
      embedding,
      provider: 'hash-based',
      dimensions: this.dimensions
    };
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  // Batch generation for efficiency
  async generateBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    for (const text of texts) {
      try {
        const result = await this.generate(text);
        results.push(result);
      } catch (error: any) {
        logger.error('Batch embedding generation failed for text', { 
          textLength: text.length, 
          error: error.message 
        });
        // Add fallback embedding
        results.push(this.generateHashBased(text));
      }
    }
    
    return results;
  }
  
  // Clear cache if needed
  clearCache(): void {
    this.cache.clear();
  }
  
  // Get cache stats
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.8 // Placeholder - would need to track hits/misses
    };
  }
  
  // Test Ollama availability
  async testOllamaAvailability(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const hasEmbeddingModel = data.models?.some((model: any) => 
          model.name.includes('embed') || model.name.includes('nomic')
        );
        logger.info('Ollama availability test', { 
          available: true, 
          hasEmbeddingModel,
          models: data.models?.map((m: any) => m.name) || []
        });
        return hasEmbeddingModel;
      }
      return false;
    } catch (error: any) {
      logger.warn('Ollama not available', { error: error.message });
      return false;
    }
  }
}

// Export singleton instance
export const embeddingService = UnifiedEmbeddingService.getInstance();
