/**
 * Document Retrieval Stage (RAG Stage 2)
 *
 * Implements GEPA RAG document retrieval with multi-query expansion
 * and hybrid search using Reciprocal Rank Fusion (RRF).
 *
 * Features:
 * - Multi-query expansion from reformulations
 * - Parallel hybrid search (semantic + keyword)
 * - RRF fusion with GEPA-optimized weights
 * - Metadata filtering and domain-specific retrieval
 * - Deduplication and diversity scoring
 * - Query-document relevance scoring
 *
 * References:
 * - GEPA RAG: https://github.com/gepa-ai/gepa/blob/main/src/gepa/adapters/generic_rag_adapter/GEPA_RAG.md
 * - RRF: https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf
 */

import { VectorStoreAdapter, Document, SearchOptions } from './vector-store-adapter';
import { QueryReformulator, ReformulatedQuery, type ReformulationStrategy } from './query-reformulator';

export interface RetrievalConfig {
  /**
   * Number of documents to retrieve per query
   */
  k: number;

  /**
   * Whether to use query reformulation
   */
  useReformulation?: boolean;

  /**
   * Number of reformulations if enabled
   */
  numReformulations?: number;

  /**
   * Reformulation strategies
   */
  reformulationStrategies?: ReformulationStrategy[];

  /**
   * Hybrid search alpha (semantic weight)
   * 0.0 = keyword only, 1.0 = semantic only, 0.7 = balanced
   */
  hybridAlpha?: number;

  /**
   * Whether to enable parallel retrieval
   */
  parallel?: boolean;

  /**
   * Metadata filters
   */
  filters?: Record<string, any>;

  /**
   * Minimum similarity threshold
   */
  minSimilarity?: number;

  /**
   * Maximum diversity (Jaccard distance threshold)
   */
  maxDiversity?: number;

  /**
   * RRF k constant (default: 60)
   */
  rrfK?: number;
}

export interface RetrievalResult {
  query: string;
  documents: Document[];
  reformulations?: ReformulatedQuery[];
  diversity: number;
  avgSimilarity: number;
  latency: number;
  queriesUsed: number;
}

/**
 * Document Retriever
 *
 * Retrieves documents using multi-query expansion and hybrid search.
 */
export class DocumentRetriever {
  private vectorStore: VectorStoreAdapter;
  private reformulator: QueryReformulator;

  constructor(vectorStore: VectorStoreAdapter, reformulator?: QueryReformulator) {
    this.vectorStore = vectorStore;
    this.reformulator = reformulator || new QueryReformulator();
  }

  /**
   * Retrieve documents with optional query reformulation
   */
  async retrieve(
    query: string,
    config: RetrievalConfig
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    const {
      k,
      useReformulation = true,
      numReformulations = 3,
      reformulationStrategies = ['expansion', 'clarification'],
      hybridAlpha = 0.7,
      parallel = true,
      filters,
      minSimilarity = 0.0,
      maxDiversity = 1.0,
      rrfK = 60,
    } = config;

    console.log(`🔍 Retrieving documents for: "${query.substring(0, 60)}..."`);

    // Step 1: Query reformulation (if enabled)
    let queries: Array<{ query: string; weight: number }> = [{ query, weight: 1.0 }];
    let reformulations: ReformulatedQuery[] | undefined;

    if (useReformulation) {
      const reformulationResult = await this.reformulator.reformulate(query, {
        numReformulations,
        strategies: reformulationStrategies,
        includeOriginal: true,
      });

      reformulations = reformulationResult.reformulations;

      // Weight queries by quality score
      queries = reformulations.map(r => ({
        query: r.query,
        weight: r.quality,
      }));

      console.log(`   📋 Generated ${queries.length} queries`);
    }

    // Step 2: Multi-query retrieval
    const searchOptions: SearchOptions = { filters };

    let allDocuments: Document[];

    if (parallel && queries.length > 1) {
      // Parallel retrieval
      allDocuments = await this.parallelRetrieve(
        queries,
        k * 2, // Retrieve more for better fusion
        hybridAlpha,
        searchOptions
      );
    } else {
      // Sequential retrieval
      allDocuments = await this.sequentialRetrieve(
        queries,
        k * 2,
        hybridAlpha,
        searchOptions
      );
    }

    console.log(`   📚 Retrieved ${allDocuments.length} documents (before fusion)`);

    // Step 3: RRF fusion across all queries
    const fusedDocs = this.rrfFusion(allDocuments, queries, rrfK);

    console.log(`   🔀 Fused to ${fusedDocs.length} unique documents`);

    // Step 4: Filter by similarity and diversity
    const filtered = this.filterDocuments(fusedDocs, minSimilarity, maxDiversity);

    console.log(`   🎯 Filtered to ${filtered.length} documents`);

    // Step 5: Select top-k
    const topK = filtered
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, k);

    // Calculate metrics
    const diversity = this.calculateDiversity(topK.map(d => d.content));
    const avgSimilarity = topK.reduce((sum, d) => sum + (d.similarity || 0), 0) / topK.length;
    const latency = Date.now() - startTime;

    console.log(`   ✅ Retrieved ${topK.length} documents in ${latency}ms`);
    console.log(`   📊 Diversity: ${diversity.toFixed(3)}, Avg Similarity: ${avgSimilarity.toFixed(3)}`);

    return {
      query,
      documents: topK,
      reformulations,
      diversity,
      avgSimilarity,
      latency,
      queriesUsed: queries.length,
    };
  }

  /**
   * Parallel retrieval for multiple queries
   */
  private async parallelRetrieve(
    queries: Array<{ query: string; weight: number }>,
    k: number,
    alpha: number,
    options?: SearchOptions
  ): Promise<Document[]> {
    const results = await Promise.all(
      queries.map(async ({ query, weight }) => {
        const docs = await this.vectorStore.hybridSearch(query, k, alpha, options);

        // Tag with source query and weight
        return docs.map(doc => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            sourceQuery: query,
            queryWeight: weight,
          },
        }));
      })
    );

    return results.flat();
  }

  /**
   * Sequential retrieval for multiple queries
   */
  private async sequentialRetrieve(
    queries: Array<{ query: string; weight: number }>,
    k: number,
    alpha: number,
    options?: SearchOptions
  ): Promise<Document[]> {
    const allDocs: Document[] = [];

    for (const { query, weight } of queries) {
      const docs = await this.vectorStore.hybridSearch(query, k, alpha, options);

      // Tag with source query and weight
      allDocs.push(
        ...docs.map(doc => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            sourceQuery: query,
            queryWeight: weight,
          },
        }))
      );
    }

    return allDocs;
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   *
   * Combines rankings from multiple queries using RRF formula:
   * score(d) = Σ_q weight(q) * 1 / (k + rank_q(d))
   */
  private rrfFusion(
    documents: Document[],
    queries: Array<{ query: string; weight: number }>,
    rrfK: number = 60
  ): Document[] {
    // Group documents by ID
    const docGroups = new Map<string, Document[]>();

    for (const doc of documents) {
      const existing = docGroups.get(doc.id) || [];
      existing.push(doc);
      docGroups.set(doc.id, existing);
    }

    // Calculate RRF scores
    const scored: Array<{ doc: Document; score: number }> = [];

    for (const [docId, docVersions] of docGroups.entries()) {
      let rrfScore = 0;

      for (const docVersion of docVersions) {
        const queryWeight = docVersion.metadata?.queryWeight || 1.0;
        const rank = docVersion.rank || 1;

        rrfScore += queryWeight / (rrfK + rank);
      }

      // Use first version as canonical
      const canonicalDoc = docVersions[0];

      scored.push({
        doc: {
          ...canonicalDoc,
          similarity: rrfScore, // Store RRF score as similarity
          metadata: {
            ...canonicalDoc.metadata,
            rrfScore,
            seenInQueries: docVersions.length,
          },
        },
        score: rrfScore,
      });
    }

    // Sort by RRF score
    return scored
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item.doc,
        rank: index + 1,
      }));
  }

  /**
   * Filter documents by similarity and diversity
   */
  private filterDocuments(
    documents: Document[],
    minSimilarity: number,
    maxDiversity: number
  ): Document[] {
    const filtered: Document[] = [];

    for (const doc of documents) {
      // Filter by minimum similarity
      if ((doc.similarity || 0) < minSimilarity) {
        continue;
      }

      // Filter by diversity (avoid near-duplicates)
      let isDuplicate = false;

      for (const existing of filtered) {
        const similarity = this.calculateTextSimilarity(doc.content, existing.content);

        if (similarity > (1 - maxDiversity)) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        filtered.push(doc);
      }
    }

    return filtered;
  }

  /**
   * Calculate text similarity (Jaccard)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));

    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  /**
   * Calculate diversity across documents
   */
  private calculateDiversity(contents: string[]): number {
    if (contents.length <= 1) return 0;

    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        const similarity = this.calculateTextSimilarity(contents[i], contents[j]);
        totalDistance += 1 - similarity;
        comparisons++;
      }
    }

    return totalDistance / comparisons;
  }
}

/**
 * Factory function
 */
export function createDocumentRetriever(
  vectorStore: VectorStoreAdapter,
  reformulator?: QueryReformulator
): DocumentRetriever {
  return new DocumentRetriever(vectorStore, reformulator);
}

/**
 * Convenience function for simple retrieval
 */
export async function retrieveDocuments(
  vectorStore: VectorStoreAdapter,
  query: string,
  k: number = 10,
  useReformulation: boolean = true
): Promise<Document[]> {
  const retriever = new DocumentRetriever(vectorStore);

  const result = await retriever.retrieve(query, {
    k,
    useReformulation,
    hybridAlpha: 0.7,
  });

  return result.documents;
}
