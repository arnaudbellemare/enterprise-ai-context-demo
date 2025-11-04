/**
 * DO-RAG Hybrid Retrieval with GAMP Novelty Scoring
 * 
 * Combines:
 * - DO-RAG's hybrid retrieval (graph traversal + vector search)
 * - GAMP's novelty scoring for path prioritization
 * 
 * Fusion formula (from DO-RAG):
 * S = α · max(sim(Q, Ci)) + (1-α) · R(GQ)
 * 
 * Enhanced with:
 * - Novelty-weighted ranking
 * - Multi-hop graph traversal
 * - Path-based retrieval
 */

import { embeddingService } from '../embedding-service';
import { noveltyScorer } from './novelty-scorer';
import type { KnowledgeGraph, GraphNode, GraphEdge, Path } from './graph-path-explorer';

export interface HybridRetrievalResult {
  graphResults: Array<{
    node: GraphNode;
    relevance: number;
    path?: Path;
  }>;
  vectorResults: Array<{
    chunk: string;
    score: number;
    embedding?: number[];
  }>;
  fusedResults: Array<{
    content: string;
    source: 'graph' | 'vector' | 'hybrid';
    score: number;
    novelty?: number;
    metadata?: any;
  }>;
  statistics: {
    graphNodesRetrieved: number;
    vectorChunksRetrieved: number;
    fusedItems: number;
    avgNovelty: number;
  };
}

export interface HybridRetrievalConfig {
  alpha?: number; // Weight for vector search (1-alpha for graph)
  topK?: number;
  enableNoveltyScoring?: boolean;
  enableMultiHop?: boolean;
  maxHops?: number;
}

/**
 * Hybrid Retrieval System
 * Combines graph traversal with vector search, enhanced by novelty scoring
 */
export class DORAGHybridRetrieval {
  private config: Required<HybridRetrievalConfig>;
  
  constructor(config: HybridRetrievalConfig = {}) {
    this.config = {
      alpha: config.alpha ?? 0.6, // Default: 60% vector, 40% graph
      topK: config.topK ?? 10,
      enableNoveltyScoring: config.enableNoveltyScoring ?? true,
      enableMultiHop: config.enableMultiHop ?? true,
      maxHops: config.maxHops ?? 3,
    };
  }
  
  /**
   * Perform hybrid retrieval: graph + vector + novelty
   */
  async retrieve(
    query: string,
    knowledgeGraph: KnowledgeGraph,
    vectorChunks: Array<{ content: string; embedding?: number[]; metadata?: any }>,
    queryEmbedding?: number[]
  ): Promise<HybridRetrievalResult> {
    console.log(`🔍 Hybrid Retrieval: Query="${query.substring(0, 50)}..."`);
    
    // Step 1: Graph-based retrieval with multi-hop traversal
    const graphResults = await this.retrieveFromGraph(query, knowledgeGraph, queryEmbedding);
    
    // Step 2: Vector-based retrieval
    const vectorResults = await this.retrieveFromVectors(query, vectorChunks, queryEmbedding);
    
    // Step 3: Fuse results with novelty scoring
    const fusedResults = await this.fuseResults(
      graphResults,
      vectorResults,
      query,
      knowledgeGraph
    );
    
    const statistics = {
      graphNodesRetrieved: graphResults.length,
      vectorChunksRetrieved: vectorResults.length,
      fusedItems: fusedResults.length,
      avgNovelty: fusedResults.reduce((sum, r) => sum + (r.novelty || 0), 0) / fusedResults.length || 0,
    };
    
    console.log(`✅ Hybrid Retrieval: ${statistics.fusedItems} fused results, avg novelty: ${statistics.avgNovelty.toFixed(3)}`);
    
    return {
      graphResults,
      vectorResults,
      fusedResults,
      statistics,
    };
  }
  
  /**
   * Graph-based retrieval with multi-hop traversal
   */
  private async retrieveFromGraph(
    query: string,
    knowledgeGraph: KnowledgeGraph,
    queryEmbedding?: number[]
  ): Promise<Array<{ node: GraphNode; relevance: number; path?: Path }>> {
    // Get query embedding if not provided
    if (!queryEmbedding) {
      const result = await embeddingService.generate(query);
      queryEmbedding = result.embedding;
    }
    
    // Calculate similarity for each node
    const nodeScores: Array<{ node: GraphNode; relevance: number; path?: Path }> = [];
    
    for (const node of knowledgeGraph.nodes) {
      if (node.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, node.embedding);
        nodeScores.push({ node, relevance: similarity });
      }
    }
    
    // Sort by relevance
    nodeScores.sort((a, b) => b.relevance - a.relevance);
    
    // Multi-hop expansion if enabled
    if (this.config.enableMultiHop) {
      const topNodes = nodeScores.slice(0, 5);
      const expanded = this.expandMultiHop(topNodes, knowledgeGraph);
      nodeScores.push(...expanded);
    }
    
    // Return top K
    return nodeScores.slice(0, this.config.topK);
  }
  
  /**
   * Multi-hop graph traversal
   */
  private expandMultiHop(
    seedNodes: Array<{ node: GraphNode; relevance: number }>,
    knowledgeGraph: KnowledgeGraph
  ): Array<{ node: GraphNode; relevance: number; path?: Path }> {
    const expanded: Array<{ node: GraphNode; relevance: number; path?: Path }> = [];
    const visited = new Set(seedNodes.map(s => s.node.id));
    
    for (const seed of seedNodes) {
      // Find connected nodes
      const connectedEdges = knowledgeGraph.edges.filter(
        e => e.from === seed.node.id || e.to === seed.node.id
      );
      
      for (const edge of connectedEdges) {
        const neighborId = edge.from === seed.node.id ? edge.to : edge.from;
        if (visited.has(neighborId)) continue;
        
        const neighborNode = knowledgeGraph.nodes.find(n => n.id === neighborId);
        if (neighborNode) {
          visited.add(neighborId);

          // Create proper Path object with GraphNode[] and GraphEdge[]
          const pathNodes = [seed.node, neighborNode];
          const pathEdges = knowledgeGraph.edges.filter(e =>
            (e.from === seed.node.id && e.to === neighborId) ||
            (e.to === seed.node.id && e.from === neighborId)
          );

          expanded.push({
            node: neighborNode,
            relevance: seed.relevance * 0.7, // Decay for multi-hop
            path: {
              nodes: pathNodes,
              edges: pathEdges,
              score: seed.relevance * 0.7,
              length: 2,
            },
          });
        }
      }
    }
    
    return expanded;
  }
  
  /**
   * Vector-based retrieval
   */
  private async retrieveFromVectors(
    query: string,
    chunks: Array<{ content: string; embedding?: number[]; metadata?: any }>,
    queryEmbedding?: number[]
  ): Promise<Array<{ chunk: string; score: number; embedding?: number[] }>> {
    if (!queryEmbedding) {
      const result = await embeddingService.generate(query);
      queryEmbedding = result.embedding;
    }

    const scores: Array<{ chunk: string; score: number; embedding?: number[] }> = [];

    for (const chunk of chunks) {
      let score = 0;

      if (chunk.embedding) {
        score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        // Fallback: embed on-the-fly (slower)
        const result = await embeddingService.generate(chunk.content);
        const chunkEmbedding = result.embedding;
        score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      }
      
      scores.push({
        chunk: chunk.content,
        score,
        embedding: chunk.embedding,
      });
    }
    
    // Sort and return top K
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, this.config.topK);
  }
  
  /**
   * Fuse graph and vector results with novelty scoring
   */
  private async fuseResults(
    graphResults: Array<{ node: GraphNode; relevance: number; path?: Path }>,
    vectorResults: Array<{ chunk: string; score: number }>,
    query: string,
    knowledgeGraph: KnowledgeGraph
  ): Promise<Array<{
    content: string;
    source: 'graph' | 'vector' | 'hybrid';
    score: number;
    novelty?: number;
    metadata?: any;
  }>> {
    const fused: Array<{
      content: string;
      source: 'graph' | 'vector' | 'hybrid';
      score: number;
      novelty?: number;
      metadata?: any;
    }> = [];
    
    // Calculate novelty scores for graph results
    const graphWithNovelty = await Promise.all(
      graphResults.map(async (result) => {
        let novelty = 0.5; // Default
        
        if (this.config.enableNoveltyScoring && result.path) {
          try {
            // Convert GraphNode[] path to string[] path for NoveltyScorer
            const noveltyPath = {
              id: result.path.nodes.map(n => n.id).join('->'),
              nodes: result.path.nodes.map(n => n.id),
              edges: result.path.edges?.map(e => `${e.from}->${e.to}`),
              type: 'problem-solution-effect' as const
            };
            const noveltyResult = noveltyScorer.calculateNovelty(noveltyPath);
            novelty = noveltyResult.novelty;
          } catch (error) {
            console.warn('Novelty scoring failed:', error);
          }
        }
        
        // DO-RAG fusion formula: S = α · vector + (1-α) · graph
        // For graph results, we use (1-α) weight
        const graphScore = (1 - this.config.alpha) * result.relevance;
        const noveltyBoost = novelty * 0.2; // Boost novel paths
        
        return {
          content: result.node.label,
          source: 'graph' as const,
          score: graphScore + noveltyBoost,
          novelty,
          metadata: {
            nodeId: result.node.id,
            nodeType: result.node.type,
            path: result.path,
          },
        };
      })
    );
    
    // Vector results
    const vectorWithNovelty = vectorResults.map((result) => {
      // For vector results, use α weight
      const vectorScore = this.config.alpha * result.score;
      
      return {
        content: result.chunk,
        source: 'vector' as const,
        score: vectorScore,
        novelty: 0.5, // Default for vector (no path-based novelty)
        metadata: {},
      };
    });
    
    // Combine and deduplicate
    const allResults = [...graphWithNovelty, ...vectorWithNovelty];
    
    // Sort by fused score
    allResults.sort((a, b) => b.score - a.score);
    
    // Deduplicate by content similarity
    const deduplicated: typeof allResults = [];
    for (const result of allResults) {
      const isDuplicate = deduplicated.some(existing => {
        const similarity = this.textSimilarity(existing.content, result.content);
        return similarity > 0.8;
      });
      
      if (!isDuplicate) {
        deduplicated.push(result);
      }
    }
    
    // Mark hybrid results (appear in both)
    const hybrid = deduplicated.map(result => {
      const inGraph = graphResults.some(g => g.node.label === result.content);
      const inVector = vectorResults.some(v => v.chunk === result.content);
      
      if (inGraph && inVector) {
        return { ...result, source: 'hybrid' as const };
      }
      return result;
    });
    
    return hybrid.slice(0, this.config.topK);
  }
  
  /**
   * Cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Simple text similarity (Jaccard-based)
   */
  private textSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }
}

export const doragHybridRetrieval = new DORAGHybridRetrieval();

