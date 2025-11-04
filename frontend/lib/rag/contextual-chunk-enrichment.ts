/**
 * Contextual Chunk Enrichment (Preprocessing)
 * 
 * Adds context to chunks before indexing to improve retrieval accuracy.
 * Based on research showing "Adding context to chunks improves retrieval accuracy a lot"
 * 
 * Process:
 * 1. For each chunk, run an LLM prompt to situate it within the document
 * 2. LLM responds with 50-100 tokens of context (using gemma3:4b for cost efficiency)
 * 3. Prepend context to the corresponding chunk
 * 4. Result: "Context 1 + Chunk 1", "Context 2 + Chunk 2", etc.
 * 5. Generate embeddings from ENRICHED content (not original)
 * 
 * This happens during preprocessing (before indexing), not at query time.
 * 
 * Usage:
 * - Call during document ingestion/processing
 * - Use API: /api/documents/ingest-with-context
 * - Store enriched chunks in vector database
 * - Retrieval will automatically benefit from enriched embeddings
 * 
 * Benefits:
 * - Significantly improves retrieval accuracy
 * - Better semantic understanding of chunk position in document
 * - Works with any embedding model (BGE-small-en-v1.5, etc.)
 * - Cost-effective using Ollama (gemma3:4b)
 */

import { embeddingService } from '../embedding-service';
import { realityCheckLayer } from '../reality-check-layer';
import { problemSolutionEffectExtractor } from './problem-solution-effect-extractor';

export interface Chunk {
  id?: string;
  content: string;
  index: number;
  metadata?: Record<string, any>;
}

export interface EnrichedChunk extends Chunk {
  originalContent: string;
  context: string;
  enrichedContent: string; // context + original content
  verification?: {
    passed: boolean;
    score: number;
    criteria: {
      faithfulness: number;
      completeness: number;
      accuracy: number;
      distortion: number;
    };
  };
  problemSolutionEffect?: {
    problem: string;
    solution: string;
    effect: string;
    confidence: number;
  };
}

export interface EnrichmentConfig {
  /**
   * Model to use for context generation
   */
  model?: string;
  
  /**
   * Whether to enable enrichment (can be disabled for speed)
   */
  enabled?: boolean;
  
  /**
   * Target context length (50-100 tokens as per research)
   */
  contextLength?: number;
  
  /**
   * Document metadata to help with context
   */
  documentMetadata?: {
    title?: string;
    domain?: string;
    type?: string;
  };
}

export class ContextualChunkEnricher {
  private model: string;
  
  constructor(model: string = 'gemma3:4b') {
    this.model = model;
  }
  
  /**
   * Enrich chunks with contextual information
   * This is the preprocessing step that should run before indexing
   */
  async enrichChunks(
    chunks: Chunk[],
    fullDocument: string,
    config: EnrichmentConfig = {}
  ): Promise<EnrichedChunk[]> {
    const {
      enabled = true,
      contextLength = 75, // Target 50-100 tokens, use 75 as middle
      documentMetadata = {},
    } = config;
    
    if (!enabled) {
      console.log('⚠️ Contextual enrichment disabled, returning original chunks');
      return chunks.map(chunk => ({
        ...chunk,
        originalContent: chunk.content,
        context: '',
        enrichedContent: chunk.content,
      }));
    }
    
    console.log(`📚 Enriching ${chunks.length} chunks with contextual information...`);
    console.log(`   Model: ${this.model}`);
    console.log(`   Target context: ${contextLength} tokens`);
    
    const enriched: EnrichedChunk[] = [];
    
    // Process chunks in parallel for efficiency
    const enrichmentPromises = chunks.map(async (chunk, index) => {
      try {
        const context = await this.generateContextForChunk(
          chunk,
          fullDocument,
          documentMetadata,
          contextLength
        );
        
        const enrichedContent = `${context}\n\n${chunk.content}`;
        
        // Reality-check: Verify enriched content maintains original meaning
        const verification = await realityCheckLayer.verifyEnrichment(
          chunk.content,
          enrichedContent,
          context
        );
        
        if (!verification.passed) {
          console.warn(`⚠️ Reality-check failed for chunk ${index}:`, verification.issues);
          // Still return enriched content, but log the warning
          // In production, you might want to reject or request regeneration
        }
        
        // Extract Problem-Solution-Effect triplets (GAMP framework)
        const pseTriplet = await problemSolutionEffectExtractor.extractFromChunk(
          chunk.content,
          chunk.id?.toString(),
          documentMetadata.domain
        );
        
        if (pseTriplet) {
          console.log(`✅ Extracted P-S-E triplet from chunk ${index}:`, {
            problem: pseTriplet.problem.substring(0, 50),
            solution: pseTriplet.solution.substring(0, 50),
            effect: pseTriplet.effect.substring(0, 50),
            confidence: pseTriplet.confidence.toFixed(2),
          });
        }
        
        return {
          ...chunk,
          originalContent: chunk.content,
          context,
          enrichedContent,
          verification, // Include verification result
          problemSolutionEffect: pseTriplet ? {
            problem: pseTriplet.problem,
            solution: pseTriplet.solution,
            effect: pseTriplet.effect,
            confidence: pseTriplet.confidence,
          } : undefined,
        };
      } catch (error) {
        console.warn(`⚠️ Failed to enrich chunk ${index}, using original:`, error);
        // Fallback to original chunk
        return {
          ...chunk,
          originalContent: chunk.content,
          context: '',
          enrichedContent: chunk.content,
        };
      }
    });
    
    const results = await Promise.all(enrichmentPromises);
    enriched.push(...results);
    
    const avgContextLength = enriched.reduce((sum, c) => sum + c.context.length, 0) / enriched.length;
    console.log(`✅ Enriched ${enriched.length} chunks`);
    console.log(`   Average context length: ${avgContextLength.toFixed(0)} characters`);
    
    return enriched;
  }
  
  /**
   * Generate contextual information for a single chunk
   * Uses LLM to situate the chunk within the document
   */
  private async generateContextForChunk(
    chunk: Chunk,
    fullDocument: string,
    documentMetadata: EnrichmentConfig['documentMetadata'],
    targetLength: number
  ): Promise<string> {
    // Build prompt to generate context
    const prompt = this.buildContextPrompt(chunk, fullDocument, documentMetadata, targetLength);
    
    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are an expert at analyzing documents and providing concise contextual summaries. Generate 50-100 tokens of context that situates a chunk within its document."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent context
          max_tokens: targetLength + 20, // Allow some variance
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API returned status ${response.status}`);
      }
      
      const data = await response.json();
      const context = data.choices[0].message.content.trim();
      
      return context;
    } catch (error) {
      console.warn(`Failed to generate context for chunk ${chunk.index}:`, error);
      // Fallback: generate simple context from metadata
      return this.generateFallbackContext(chunk, documentMetadata);
    }
  }
  
  /**
   * Build prompt for context generation
   */
  private buildContextPrompt(
    chunk: Chunk,
    fullDocument: string,
    documentMetadata: EnrichmentConfig['documentMetadata'],
    targetLength: number
  ): string {
    const { title, domain, type } = documentMetadata || {};
    
    // Get surrounding context (previous and next chunks if available)
    const chunkStart = fullDocument.indexOf(chunk.content);
    const beforeContext = chunkStart > 0 
      ? fullDocument.substring(Math.max(0, chunkStart - 500), chunkStart)
      : '';
    const afterContext = chunkStart + chunk.content.length < fullDocument.length
      ? fullDocument.substring(
          chunkStart + chunk.content.length,
          Math.min(fullDocument.length, chunkStart + chunk.content.length + 500)
        )
      : '';
    
    return `You are analyzing a document and need to provide contextual information for a specific chunk.

Document Information:
${title ? `Title: ${title}` : ''}
${domain ? `Domain: ${domain}` : ''}
${type ? `Type: ${type}` : ''}

Context Before Chunk:
${beforeContext || '(Beginning of document)'}

Chunk Content:
${chunk.content}

Context After Chunk:
${afterContext || '(End of document)'}

Generate 50-100 tokens of context that:
1. Situates this chunk within the document
2. Explains what comes before and after
3. Identifies the chunk's role in the document structure
4. Highlights key themes or topics relevant to this chunk

Keep it concise (target: ${targetLength} tokens) and focused on retrieval-relevant context.`;
  }
  
  /**
   * Fallback context generation (if LLM fails)
   */
  private generateFallbackContext(
    chunk: Chunk,
    documentMetadata: EnrichmentConfig['documentMetadata']
  ): string {
    const parts: string[] = [];
    
    if (documentMetadata?.title) {
      parts.push(`From: ${documentMetadata.title}`);
    }
    if (documentMetadata?.domain) {
      parts.push(`Domain: ${documentMetadata.domain}`);
    }
    parts.push(`Chunk ${chunk.index + 1}`);
    
    return parts.join('. ');
  }
  
  /**
   * Generate embeddings for enriched chunks
   * Note: Embeddings should be generated from enriched content, not original
   */
  async generateEmbeddingsForEnrichedChunks(
    enrichedChunks: EnrichedChunk[]
  ): Promise<Array<{ chunk: EnrichedChunk; embedding: number[] }>> {
    console.log(`🔢 Generating embeddings for ${enrichedChunks.length} enriched chunks...`);
    
    const results = await Promise.all(
      enrichedChunks.map(async (chunk) => {
        // Generate embedding from ENRICHED content (not original)
        const embedding = await embeddingService.generate(chunk.enrichedContent);
        
        return {
          chunk,
          embedding: embedding.embedding,
        };
      })
    );
    
    console.log(`✅ Generated embeddings for ${results.length} chunks`);
    
    return results;
  }
}

/**
 * Factory function
 */
export function createContextualChunkEnricher(model?: string): ContextualChunkEnricher {
  return new ContextualChunkEnricher(model);
}

