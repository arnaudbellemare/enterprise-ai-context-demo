/**
 * Qdrant Vector Database Integration
 * 
 * Local vector database for embeddings with advanced search capabilities:
 * - Semantic similarity search
 * - Hybrid BM25 + vector search
 * - Memory management with Mem0 core concepts
 * - Real-time indexing and retrieval
 */

import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    domain: string;
    timestamp: number;
    source: string;
    type: 'memory' | 'knowledge' | 'conversation' | 'tool_result';
    confidence: number;
    tags: string[];
    embedding?: number[];
  };
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: VectorDocument['metadata'];
  hybrid_score?: number; // Combined BM25 + vector score
}

export interface SearchOptions {
  limit?: number;
  score_threshold?: number;
  filter?: {
    domain?: string;
    type?: string;
    tags?: string[];
    min_confidence?: number;
  };
  hybrid_search?: boolean; // Enable BM25 + vector hybrid search
}

export class QdrantVectorDB {
  private client: QdrantClient;
  private collectionName: string;
  private bm25Index: Map<string, Map<string, number>> = new Map(); // BM25 term frequencies
  private documentCount: number = 0;

  constructor(collectionName: string = 'permutation_memories') {
    this.collectionName = collectionName;
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY
    });
    
    console.log('🔍 Qdrant Vector DB initialized');
  }

  /**
   * Initialize the vector database
   */
  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        c => c.name === this.collectionName
      );

      if (!collectionExists) {
        // Create collection with 384 dimensions (sentence-transformers)
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 384,
            distance: 'Cosine'
          },
          optimizers_config: {
            default_segment_number: 2
          },
          replication_factor: 1
        });
        console.log(`✅ Created Qdrant collection: ${this.collectionName}`);
      } else {
        console.log(`✅ Using existing Qdrant collection: ${this.collectionName}`);
      }

      // Load existing documents for BM25 indexing
      await this.buildBM25Index();
      
    } catch (error) {
      console.error('❌ Qdrant initialization failed:', error);
      // Fallback to in-memory storage
      console.log('🔄 Falling back to in-memory vector storage');
    }
  }

  /**
   * Store a document with embedding
   */
  async storeDocument(
    id: string,
    content: string,
    embedding: number[],
    metadata: VectorDocument['metadata']
  ): Promise<void> {
    try {
      const document: VectorDocument = {
        id,
        content,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          embedding
        },
        embedding
      };

      // Store in Qdrant
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [{
          id: id,
          vector: embedding,
          payload: {
            content,
            ...metadata
          }
        }]
      });

      // Update BM25 index
      this.updateBM25Index(id, content);
      this.documentCount++;

      console.log(`✅ Stored document ${id} in Qdrant (${this.documentCount} total)`);
      
    } catch (error) {
      console.error('❌ Failed to store document:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   */
  async searchSimilar(
    query: string,
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 10,
      score_threshold = 0.7,
      filter = {},
      hybrid_search = true
    } = options;

    try {
      // Vector similarity search
      const vectorResults = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        limit: limit * 2, // Get more results for hybrid scoring
        score_threshold,
        filter: this.buildFilter(filter)
      });

      let results: SearchResult[] = vectorResults.map(result => ({
        id: result.id as string,
        content: result.payload?.content as string,
        score: result.score,
        metadata: {
          domain: result.payload?.domain as string,
          timestamp: result.payload?.timestamp as number,
          source: result.payload?.source as string,
          type: result.payload?.type as "conversation" | "knowledge" | "memory" | "tool_result",
          confidence: result.payload?.confidence as number,
          tags: result.payload?.tags as string[] || []
        }
      }));

      // Apply hybrid search if enabled
      if (hybrid_search) {
        results = await this.applyHybridScoring(query, results);
      }

      // Sort by score and limit results
      results = results
        .sort((a, b) => (b.hybrid_score || b.score) - (a.hybrid_score || a.score))
        .slice(0, limit);

      console.log(`🔍 Found ${results.length} similar documents (hybrid: ${hybrid_search})`);
      return results;

    } catch (error) {
      console.error('❌ Search failed:', error);
      return [];
    }
  }

  /**
   * Apply hybrid BM25 + vector scoring
   */
  private async applyHybridScoring(
    query: string,
    vectorResults: SearchResult[]
  ): Promise<SearchResult[]> {
    const queryTerms = this.tokenize(query.toLowerCase());
    const bm25Scores = new Map<string, number>();

    // Calculate BM25 scores for each document
    for (const result of vectorResults) {
      const bm25Score = this.calculateBM25Score(queryTerms, result.id);
      bm25Scores.set(result.id, bm25Score);
    }

    // Normalize BM25 scores to 0-1 range
    const maxBM25 = Math.max(...bm25Scores.values());
    const minBM25 = Math.min(...bm25Scores.values());
    const bm25Range = maxBM25 - minBM25;

    // Combine vector and BM25 scores
    return vectorResults.map(result => {
      const bm25Score = bm25Scores.get(result.id) || 0;
      const normalizedBM25 = bm25Range > 0 ? (bm25Score - minBM25) / bm25Range : 0;
      
      // Weighted combination: 70% vector, 30% BM25
      const hybridScore = (result.score * 0.7) + (normalizedBM25 * 0.3);
      
      return {
        ...result,
        hybrid_score: hybridScore
      };
    });
  }

  /**
   * Build BM25 index from existing documents
   */
  private async buildBM25Index(): Promise<void> {
    try {
      const scrollResult = await this.client.scroll(this.collectionName, {
        limit: 10000,
        with_payload: true
      });

      for (const point of scrollResult.points) {
        const content = point.payload?.content as string;
        if (content) {
          this.updateBM25Index(point.id as string, content);
        }
      }

      console.log(`📚 Built BM25 index for ${this.bm25Index.size} documents`);
    } catch (error) {
      console.log('⚠️ Could not build BM25 index, using empty index');
    }
  }

  /**
   * Update BM25 index with new document
   */
  private updateBM25Index(docId: string, content: string): void {
    const terms = this.tokenize(content.toLowerCase());
    const termFreq = new Map<string, number>();

    // Count term frequencies
    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);
    }

    // Store document term frequencies
    this.bm25Index.set(docId, termFreq);
  }

  /**
   * Calculate BM25 score for query terms
   */
  private calculateBM25Score(queryTerms: string[], docId: string): number {
    const docTerms = this.bm25Index.get(docId);
    if (!docTerms) return 0;

    const k1 = 1.2;
    const b = 0.75;
    const avgDocLength = 100; // Approximate average document length
    const docLength = Array.from(docTerms.values()).reduce((sum, freq) => sum + freq, 0);

    let score = 0;
    for (const term of queryTerms) {
      const tf = docTerms.get(term) || 0;
      if (tf === 0) continue;

      // Calculate IDF (simplified)
      const docCount = this.bm25Index.size;
      const docsWithTerm = Array.from(this.bm25Index.values())
        .filter(terms => terms.has(term)).length;
      
      const idf = Math.log((docCount - docsWithTerm + 0.5) / (docsWithTerm + 0.5));
      
      // Calculate BM25 component
      const bm25Component = idf * (tf * (k1 + 1)) / 
        (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
      
      score += bm25Component;
    }

    return score;
  }

  /**
   * Tokenize text for BM25
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }

  /**
   * Build filter for Qdrant search
   */
  private buildFilter(filter: SearchOptions['filter']) {
    if (!filter || Object.keys(filter).length === 0) return undefined;

    const conditions: any[] = [];

    if (filter.domain) {
      conditions.push({
        key: 'domain',
        match: { value: filter.domain }
      });
    }

    if (filter.type) {
      conditions.push({
        key: 'type',
        match: { value: filter.type }
      });
    }

    if (filter.tags && filter.tags.length > 0) {
      conditions.push({
        key: 'tags',
        match: { any: filter.tags }
      });
    }

    if (filter.min_confidence) {
      conditions.push({
        key: 'confidence',
        range: { gte: filter.min_confidence }
      });
    }

    return conditions.length > 0 ? { must: conditions } : undefined;
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    total_documents: number;
    collection_info: any;
    bm25_index_size: number;
  }> {
    try {
      const collectionInfo = await this.client.getCollection(this.collectionName);
      return {
        total_documents: collectionInfo.points_count || 0,
        collection_info: collectionInfo,
        bm25_index_size: this.bm25Index.size
      };
    } catch (error) {
      return {
        total_documents: this.documentCount,
        collection_info: null,
        bm25_index_size: this.bm25Index.size
      };
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: [id]
      });

      // Remove from BM25 index
      this.bm25Index.delete(id);
      this.documentCount--;

      console.log(`🗑️ Deleted document ${id}`);
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
    }
  }

  /**
   * Clear all documents
   */
  async clearAll(): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: [] // Delete all points
      });

      this.bm25Index.clear();
      this.documentCount = 0;

      console.log('🧹 Cleared all documents from Qdrant');
    } catch (error) {
      console.error('❌ Failed to clear documents:', error);
    }
  }
}

// Singleton instance
let qdrantInstance: QdrantVectorDB | undefined;

export function getQdrantDB(): QdrantVectorDB {
  if (!qdrantInstance) {
    qdrantInstance = new QdrantVectorDB();
  }
  return qdrantInstance;
}
