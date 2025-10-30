/**
 * Vector Store Adapter Interface
 *
 * Provides unified interface for multiple vector store backends:
 * - Supabase pgvector (primary)
 * - Qdrant (high-performance alternative)
 * - Weaviate (production-grade alternative)
 *
 * Features:
 * - Similarity search (semantic)
 * - Vector search (direct embeddings)
 * - Hybrid search (semantic + keyword fusion)
 * - Metadata filtering
 */

export interface Document {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  similarity?: number;
  rank?: number;
}

export interface CollectionInfo {
  name: string;
  count: number;
  dimension: number;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  filters?: Record<string, any>;
  minSimilarity?: number;
  includeEmbeddings?: boolean;
}

/**
 * Vector Store Interface
 *
 * All vector store implementations must satisfy this contract.
 */
export interface VectorStoreAdapter {
  /**
   * Semantic similarity search
   *
   * @param query - Text query to search for
   * @param k - Number of results to return
   * @param options - Search options (filters, thresholds)
   */
  similaritySearch(
    query: string,
    k: number,
    options?: SearchOptions
  ): Promise<Document[]>;

  /**
   * Direct vector search
   *
   * @param queryVector - Pre-computed embedding vector
   * @param k - Number of results to return
   * @param options - Search options
   */
  vectorSearch(
    queryVector: number[],
    k: number,
    options?: SearchOptions
  ): Promise<Document[]>;

  /**
   * Hybrid search (semantic + keyword)
   *
   * @param query - Text query
   * @param k - Number of results
   * @param alpha - Balance factor (0=keyword only, 1=semantic only)
   * @param options - Search options
   */
  hybridSearch(
    query: string,
    k: number,
    alpha: number,
    options?: SearchOptions
  ): Promise<Document[]>;

  /**
   * Get collection metadata
   */
  getCollectionInfo(): Promise<CollectionInfo>;

  /**
   * Insert documents
   */
  insert(documents: Document[]): Promise<void>;

  /**
   * Delete documents
   */
  delete(ids: string[]): Promise<void>;
}

/**
 * Supabase Vector Adapter
 *
 * Implementation using Supabase pgvector extension.
 * Integrates with existing PERMUTATION Supabase setup.
 */
export class SupabaseVectorAdapter implements VectorStoreAdapter {
  private supabase: any;
  private tableName: string;
  private embeddingModel: string;
  private embeddingCache: Map<string, number[]>;

  constructor(
    supabase: any,
    tableName: string = 'documents',
    embeddingModel: string = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'
  ) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.embeddingModel = embeddingModel;
    this.embeddingCache = new Map();
  }

  /**
   * Similarity search implementation
   */
  async similaritySearch(
    query: string,
    k: number = 10,
    options?: SearchOptions
  ): Promise<Document[]> {
    console.log(`🔍 Similarity search: "${query.substring(0, 50)}...", k=${k}`);

    // Try embeddings if provider available, otherwise fallback to keyword-only
    const canEmbed = Boolean(process.env.OLLAMA_HOST);

    if (!canEmbed) {
      console.log('  ⚠️ No embedding provider configured; falling back to keyword search');
      const results = await this.keywordSearch(query, k, options);
      // Map to similarity-less documents
      return results.map((row: any, index: number) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        rank: index + 1
      }));
    }

    // Get query embedding
    const queryEmbedding = await this.getEmbedding(query);

    // Call Supabase RPC function
    let rpcQuery = this.supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: k,
      filter: options?.filters || {}
    });

    // Apply minimum similarity filter
    if (options?.minSimilarity) {
      rpcQuery = rpcQuery.gte('similarity', options.minSimilarity);
    }

    const { data, error } = await rpcQuery;

    if (error) {
      console.error('Similarity search error:', error);
      throw new Error(`Similarity search failed: ${error.message}`);
    }

    console.log(`  ✅ Found ${data.length} documents`);

    return data.map((row: any, index: number) => ({
      id: row.id,
      content: row.content,
      embedding: options?.includeEmbeddings ? row.embedding : undefined,
      metadata: row.metadata,
      similarity: row.similarity,
      rank: index + 1
    }));
  }

  /**
   * Direct vector search implementation
   */
  async vectorSearch(
    queryVector: number[],
    k: number = 10,
    options?: SearchOptions
  ): Promise<Document[]> {
    console.log(`🔍 Vector search: embedding dim=${queryVector.length}, k=${k}`);

    const { data, error } = await this.supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_count: k,
      filter: options?.filters || {}
    });

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    console.log(`  ✅ Found ${data.length} documents`);

    return data.map((row: any, index: number) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      similarity: row.similarity,
      rank: index + 1
    }));
  }

  /**
   * Hybrid search implementation (RRF fusion)
   *
   * Combines semantic and keyword search using Reciprocal Rank Fusion.
   * RRF formula: score = sum(1 / (rank + k)) where k=60 (constant)
   */
  async hybridSearch(
    query: string,
    k: number = 10,
    alpha: number = 0.7,
    options?: SearchOptions
  ): Promise<Document[]> {
    console.log(`🔍 Hybrid search: "${query.substring(0, 50)}...", k=${k}, alpha=${alpha}`);

    const canEmbed = Boolean(process.env.OLLAMA_HOST);

    // Semantic search (alpha weight) if embeddings available
    const semanticResults = canEmbed
      ? await this.similaritySearch(query, k * 2, options)
      : [];

    // Keyword search ((1-alpha) weight)
    const keywordResults = await this.keywordSearch(query, k * 2, options);

    // If no embeddings, return keyword-only top k
    if (!canEmbed || alpha === 0) {
      return keywordResults.slice(0, k).map((row: any, index: number) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        rank: index + 1
      }));
    }

    // RRF fusion
    const fused = this.reciprocalRankFusion(
      semanticResults,
      keywordResults,
      alpha,
      k
    );

    console.log(`  ✅ Fused ${fused.length} documents`);

    return fused;
  }

  /**
   * Keyword search using Supabase full-text search
   */
  private async keywordSearch(
    query: string,
    k: number,
    options?: SearchOptions
  ): Promise<Document[]> {
    let queryBuilder = this.supabase
      .from(this.tableName)
      .select('id, content, metadata')
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(k);

    // Apply filters
    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        queryBuilder = queryBuilder.eq(`metadata->>${key}`, value);
      }
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.warn('Keyword search error (non-fatal):', error);
      return [];
    }

    return data.map((row: any, index: number) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      rank: index + 1
    }));
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   *
   * Combines rankings from multiple sources.
   * RRF formula: score = sum(1 / (rank + k)) where k=60
   *
   * Reference: "Reciprocal Rank Fusion outperforms Condorcet and
   * individual Rank Learning Methods" (SIGIR 2009)
   */
  private reciprocalRankFusion(
    semanticResults: Document[],
    keywordResults: Document[],
    alpha: number,
    k: number
  ): Document[] {
    const RRF_K = 60; // Standard RRF constant
    const scores = new Map<string, { doc: Document; score: number }>();

    // Add semantic scores (weighted by alpha)
    for (const doc of semanticResults) {
      const rrfScore = 1 / (doc.rank! + RRF_K);
      const weightedScore = alpha * rrfScore;

      scores.set(doc.id, {
        doc,
        score: weightedScore
      });
    }

    // Add keyword scores (weighted by 1-alpha)
    for (const doc of keywordResults) {
      const rrfScore = 1 / (doc.rank! + RRF_K);
      const weightedScore = (1 - alpha) * rrfScore;

      const existing = scores.get(doc.id);
      if (existing) {
        existing.score += weightedScore;
      } else {
        scores.set(doc.id, {
          doc,
          score: weightedScore
        });
      }
    }

    // Sort by fused score
    const fused = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((item, index) => ({
        ...item.doc,
        similarity: item.score,
        rank: index + 1
      }));

    return fused;
  }

  /**
   * Get embedding for text
   *
   * Uses Ollama embeddings when OLLAMA_HOST is set.
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache
    if (this.embeddingCache.has(text)) {
      console.log('  📦 Using cached embedding');
      return this.embeddingCache.get(text)!;
    }

    const ollamaHost = process.env.OLLAMA_HOST;
    if (!ollamaHost) {
      throw new Error('No embedding provider configured. Set OLLAMA_HOST to use local embeddings.');
    }

    console.log('  🔄 Generating embedding via Ollama...');

    const response = await fetch(`${ollamaHost}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.embeddingModel,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embeddings API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    // Cache for future use
    this.embeddingCache.set(text, embedding);

    return embedding;
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(): Promise<CollectionInfo> {
    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to get count: ${countError.message}`);
    }

    // Get dimension from first document
    const { data: sample, error: sampleError } = await this.supabase
      .from(this.tableName)
      .select('embedding')
      .limit(1)
      .single();

    const dimension = sample?.embedding?.length || 1536;

    return {
      name: this.tableName,
      count: count || 0,
      dimension,
      metadata: {
        embeddingModel: this.embeddingModel
      }
    };
  }

  /**
   * Insert documents
   */
  async insert(documents: Document[]): Promise<void> {
    console.log(`📥 Inserting ${documents.length} documents...`);

    // Generate embeddings for documents without them
    const docsWithEmbeddings = await Promise.all(
      documents.map(async (doc) => {
        if (!doc.embedding) {
          doc.embedding = await this.getEmbedding(doc.content);
        }
        return doc;
      })
    );

    // Insert into Supabase
    const { error } = await this.supabase
      .from(this.tableName)
      .insert(
        docsWithEmbeddings.map(doc => ({
          id: doc.id,
          content: doc.content,
          embedding: doc.embedding,
          metadata: doc.metadata
        }))
      );

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    console.log(`  ✅ Inserted ${documents.length} documents`);
  }

  /**
   * Delete documents
   */
  async delete(ids: string[]): Promise<void> {
    console.log(`🗑️ Deleting ${ids.length} documents...`);

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log(`  ✅ Deleted ${ids.length} documents`);
  }
}

/**
 * Helper: Create Supabase adapter from existing client
 */
export function createSupabaseAdapter(
  supabase: any,
  tableName?: string
): SupabaseVectorAdapter {
  return new SupabaseVectorAdapter(supabase, tableName);
}
