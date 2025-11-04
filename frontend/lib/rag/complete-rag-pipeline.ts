/**
 * Complete GEPA RAG Pipeline
 *
 * Orchestrates all 5 RAG stages with inference sampling and Delta Rule:
 * 1. Query Reformulation
 * 2. Document Retrieval (150 candidates)
 * 3. Document Reranking (150 → 20)
 * 4. Context Synthesis (with Delta Rule)
 * 5. Answer Generation
 *
 * Features:
 * - End-to-end RAG pipeline
 * - Explicit 150 → 20 reranking flow (research-based)
 * - Comprehensive metrics tracking
 * - Cost and latency monitoring
 * - Delta Rule memory management
 * - Inference sampling at every stage
 * - Production-ready error handling
 *
 * Best Practices Implemented:
 * - Retrieve 150 candidates, rerank to top 20 (as per research)
 * - Contextual chunk enrichment during preprocessing (use /api/documents/ingest-with-context)
 * - BGE-small-en-v1.5 embeddings (better than nomic-embed-text)
 * - Hybrid search (Embeddings + BM25)
 * - Reranking with listwise method
 *
 * References:
 * - GEPA RAG: https://github.com/gepa-ai/gepa
 * - Research: "Embeddings+BM25 is better than embeddings on their own"
 * - Research: "Reranking is better than no reranking"
 * - Research: "Adding context to chunks improves retrieval accuracy a lot"
 */

import { VectorStoreAdapter, Document } from './vector-store-adapter';
import { QueryReformulator, type ReformulationStrategy } from './query-reformulator';
import { DocumentRetriever } from './document-retriever';
import { DocumentReranker } from './document-reranker';
import { ContextSynthesizer } from './context-synthesizer';
import { AnswerGenerator } from './answer-generator';
import { evaluateEndToEnd, type EndToEndMetrics } from './evaluation-metrics';
import { graphPathExplorer, type KnowledgeGraph, type GraphNode } from '../gamp/graph-path-explorer';
import { problemSolutionEffectExtractor } from './problem-solution-effect-extractor';
import { gampAgentSystem } from '../gamp/gamp-agent-system';
import { knowledgeGraphBuilder } from '../gamp/knowledge-graph-builder';

export interface RAGPipelineConfig {
  // Stage 1: Query Reformulation
  reformulation?: {
    enabled?: boolean;
    numReformulations?: number;
    strategies?: ReformulationStrategy[];
    beta?: number;
  };

  // Stage 2: Document Retrieval
  retrieval?: {
    k?: number;
    hybridAlpha?: number;
    parallel?: boolean;
    filters?: Record<string, any>;
  };

  // Stage 3: Document Reranking
  reranking?: {
    enabled?: boolean;
    method?: 'listwise' | 'pairwise' | 'pointwise';
    numHypotheses?: number;
    beta?: number;
  };

  // Stage 4: Context Synthesis
  synthesis?: {
    maxLength?: number;
    useDeltaRule?: boolean;
    gatingStrategy?: 'uniform' | 'data-dependent' | 'per-dimension';
    topicShiftThreshold?: number;
    beta?: number;
  };

  // Stage 5: Answer Generation
  generation?: {
    maxLength?: number;
    numCandidates?: number;
    beta?: number;
    verifyFaithfulness?: boolean;
    useSelfConsistency?: boolean;
    confidenceThreshold?: number;
  };

  // Global
  model?: string;
  temperature?: number;
}

export interface RAGPipelineResult {
  query: string;
  answer: string;

  // Stage outputs
  reformulations?: string[];
  retrievedDocs: Document[];
  rerankedDocs?: Document[];
  synthesizedContext: string;

  // Metrics
  metrics: {
    stage1Latency: number;
    stage2Latency: number;
    stage3Latency: number;
    stage4Latency: number;
    stage5Latency: number;
    totalLatency: number;
    cost: number;
  };

  // Verification
  verification?: {
    faithful: boolean;
    consistent: boolean;
    complete: boolean;
    confidence: number;
  };

  // Delta Rule state
  deltaState?: {
    topicShift: number;
    alpha: number | number[];
    beta: number;
  };
}

/**
 * Complete RAG Pipeline
 */
export class RAGPipeline {
  private vectorStore: VectorStoreAdapter;
  private reformulator: QueryReformulator;
  private retriever: DocumentRetriever;
  private reranker: DocumentReranker;
  private synthesizer: ContextSynthesizer;
  private generator: AnswerGenerator;

  constructor(vectorStore: VectorStoreAdapter, model: string = 'gpt-4o-mini') {
    this.vectorStore = vectorStore;
    this.reformulator = new QueryReformulator(model);
    this.retriever = new DocumentRetriever(vectorStore, this.reformulator);
    this.reranker = new DocumentReranker(model);
    this.synthesizer = new ContextSynthesizer();
    this.generator = new AnswerGenerator(model);
  }

  /**
   * Execute complete RAG pipeline
   */
  async execute(
    query: string,
    config: RAGPipelineConfig = {}
  ): Promise<RAGPipelineResult> {
    const pipelineStart = Date.now();

    console.log('═'.repeat(80));
    console.log('🚀 GEPA RAG PIPELINE EXECUTION');
    console.log('═'.repeat(80));
    console.log(`Query: "${query}"\n`);

    // Extract config
    const {
      reformulation = { enabled: true, numReformulations: 3, strategies: ['expansion', 'clarification'], beta: 1.5 },
      retrieval = { k: 20, hybridAlpha: 0.7, parallel: true }, // Default to 20 (after reranking from 150)
      reranking = { enabled: true, method: 'listwise', numHypotheses: 5, beta: 1.5 },
      synthesis = { maxLength: 2000, useDeltaRule: true, gatingStrategy: 'data-dependent', beta: 0.8 },
      generation = { maxLength: 500, numCandidates: 5, beta: 1.5, verifyFaithfulness: true, useSelfConsistency: true, confidenceThreshold: 0.7 },
      model = 'gpt-4o-mini',
    } = config;

    // Stage 1: Query Reformulation
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ STAGE 1: QUERY REFORMULATION                           │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const stage1Start = Date.now();

    const reformulationResult = reformulation.enabled
      ? await this.reformulator.reformulate(query, {
          numReformulations: reformulation.numReformulations || 3,
          strategies: reformulation.strategies,
          beta: reformulation.beta,
          includeOriginal: true,
        })
      : { reformulations: [{ query, strategy: 'variation' as const, quality: 1.0, similarity: 1.0, rank: 1 }], diversity: 0, avgQuality: 1, strategiesUsed: [], latency: 0, originalQuery: query };

    const stage1Latency = Date.now() - stage1Start;

    console.log(`✅ Stage 1 complete (${stage1Latency}ms)\n`);

    // Stage 2: Document Retrieval (Retrieve 150 candidates)
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ STAGE 2: DOCUMENT RETRIEVAL (150 → 20 flow)             │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const stage2Start = Date.now();

    // Step 1: Retrieve top 150 candidates (as per research)
    const INITIAL_RETRIEVAL_COUNT = 150;
    const FINAL_RERANKED_COUNT = retrieval.k! || 20; // Default to 20 as per research

    console.log(`   📥 Step 1: Retrieving top ${INITIAL_RETRIEVAL_COUNT} candidates...`);

    const retrievalResult = await this.retriever.retrieve(query, {
      k: INITIAL_RETRIEVAL_COUNT, // Retrieve 150 for reranking
      useReformulation: reformulation.enabled,
      numReformulations: reformulation.numReformulations || 3,
      reformulationStrategies: reformulation.strategies,
      hybridAlpha: retrieval.hybridAlpha,
      parallel: retrieval.parallel,
      filters: retrieval.filters,
    });

    console.log(`   ✅ Retrieved ${retrievalResult.documents.length} candidates`);

    const stage2Latency = Date.now() - stage2Start;

    console.log(`✅ Stage 2 complete (${stage2Latency}ms)\n`);

    // Stage 3: Document Reranking (150 → 20)
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ STAGE 3: DOCUMENT RERANKING (150 → 20)                 │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const stage3Start = Date.now();

    let finalRerankingResult: any;

    if (reranking.enabled) {
      console.log(`   📊 Step 2: Reranking ${retrievalResult.documents.length} candidates to top ${FINAL_RERANKED_COUNT}...`);

      const rerankingResult = await this.reranker.rerank(query, retrievalResult.documents, {
        method: reranking.method,
        numHypotheses: reranking.numHypotheses,
        beta: reranking.beta,
        useInferenceSampling: true,
        maxDocuments: INITIAL_RETRIEVAL_COUNT, // Rerank all 150
      });

      // Step 3: Graph-based path exploration (GAMP framework)
      // Build knowledge graph from enriched chunks and explore paths
      console.log(`   🔍 Step 3: Building knowledge graph and exploring graph paths...`);
      
      const enrichedDocs = rerankingResult.documents.filter(d => 
        d.metadata?.problemSolutionEffect || d.metadata?.enriched
      );
      
      let graphPathsMetadata: any = {};
      
      if (enrichedDocs.length > 0) {
        // Convert documents to enriched chunks format
        const enrichedChunks = enrichedDocs.map(doc => ({
          id: doc.id || `doc_${Date.now()}`,
          content: doc.content,
          enrichedContent: doc.metadata?.enrichedContent || doc.content,
          problemSolutionEffect: doc.metadata?.problemSolutionEffect ? {
            problem: doc.metadata.problemSolutionEffect.problem,
            solution: doc.metadata.problemSolutionEffect.solution,
            effect: doc.metadata.problemSolutionEffect.effect,
            confidence: doc.metadata.problemSolutionEffect.confidence,
            source: doc.id,
            metadata: doc.metadata,
          } : undefined,
          metadata: {
            domain: doc.metadata?.domain,
            documentId: doc.id,
          },
        }));
        
        // Build knowledge graph from enriched chunks
        const knowledgeGraph = await knowledgeGraphBuilder.buildFromEnrichedChunks(enrichedChunks);
        
        // Get graph statistics
        const stats = knowledgeGraphBuilder.getStatistics();
        console.log(`   ✅ Built knowledge graph: ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);
        console.log(`   📊 Graph breakdown: ${stats.problemNodes} problems, ${stats.solutionNodes} solutions, ${stats.effectNodes} effects, ${stats.entityNodes} entities`);
        console.log(`   📈 Average node degree: ${stats.averageNodeDegree.toFixed(2)}`);
        
        graphPathExplorer.setKnowledgeGraph(knowledgeGraph);
        
        // Explore paths from query-relevant nodes
        if (knowledgeGraph.nodes.length > 0) {
          // Find most relevant start node based on query
          const startNode = this.findBestStartNode(knowledgeGraph, query);
          
          if (startNode) {
            console.log(`   🎯 Starting path exploration from: "${startNode.label}"`);
            
            const graphPaths = await graphPathExplorer.explorePaths(
              startNode.id,
              query,
              {
                maxDepth: 3,
                maxPaths: 10,
                useBFS: true,
                useLLMGuided: true, // Enhanced with non-obvious connection prediction
                useGeneticAlgorithm: false,
                noveltyWeight: 0.3,
              }
            );
            
            if (graphPaths.length > 0) {
              console.log(`   ✅ Found ${graphPaths.length} graph-based paths`);
              
              // Use GAMP multi-agent system to evaluate and rank paths
              console.log(`   🤖 GAMP Multi-Agent System: Evaluating paths with domain experts...`);
              const gampPaths = await gampAgentSystem.discoverPaths(
                query,
                knowledgeGraph,
                enrichedDocs,
                undefined // domain
              );
              
              graphPathsMetadata = {
                graphPaths: graphPaths.map(p => ({
                  nodes: p.nodes.map(n => n.label),
                  score: p.score,
                  novelty: p.novelty,
                })),
                gampEvaluatedPaths: gampPaths.slice(0, 5).map(p => ({
                  problem: p.problem,
                  solution: p.solution,
                  effect: p.effect,
                  novelty: p.novelty,
                  scientificRationality: p.scientificRationality,
                  factuality: p.factuality,
                  overallScore: p.overallScore,
                  verified: p.verified || false,
                })),
                graphStatistics: stats,
              };
              
              console.log(`   ✅ GAMP evaluated ${gampPaths.length} paths with multi-agent collaboration`);
            }
          }
        }
      }
      
      // Step 4: Select top-K (20) from reranked results
      const finalDocuments = rerankingResult.documents.slice(0, FINAL_RERANKED_COUNT);
      
      console.log(`   ✅ Reranked to top ${finalDocuments.length} documents`);
      console.log(`   📈 Quality improvement: ${rerankingResult.qualityScore > 0 ? (rerankingResult.qualityScore * 100).toFixed(1) + '%' : 'N/A'}`);

      // Update reranking result with final documents
      finalRerankingResult = {
        ...rerankingResult,
        documents: finalDocuments,
        metadata: {
          ...(rerankingResult.metadata || {}),
          ...graphPathsMetadata,
        },
      };
    } else {
      // If reranking disabled, just take top 20 from initial retrieval
      console.log(`   ⚠️ Reranking disabled, selecting top ${FINAL_RERANKED_COUNT} from initial retrieval`);
      const finalDocuments = retrievalResult.documents.slice(0, FINAL_RERANKED_COUNT);
      
      finalRerankingResult = {
        documents: finalDocuments,
        query,
        originalRanks: [],
        newRanks: [],
        diversityScore: 0,
        qualityScore: 0,
        latency: 0,
        method: 'none',
      };
    }

    const stage3Latency = Date.now() - stage3Start;

    console.log(`✅ Stage 3 complete (${stage3Latency}ms)\n`);

    // Stage 4: Context Synthesis (with Delta Rule)
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ STAGE 4: CONTEXT SYNTHESIS (DELTA RULE)                │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const stage4Start = Date.now();

    const synthesisResult = await this.synthesizer.synthesize(query, finalRerankingResult.documents, {
      maxContextLength: synthesis.maxLength,
      useDeltaRule: synthesis.useDeltaRule,
      gatingStrategy: synthesis.gatingStrategy,
      topicShiftThreshold: synthesis.topicShiftThreshold,
      beta: synthesis.beta,
      useInferenceSampling: true,
    });

    const stage4Latency = Date.now() - stage4Start;

    console.log(`✅ Stage 4 complete (${stage4Latency}ms)\n`);

    // Stage 5: Answer Generation
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ STAGE 5: ANSWER GENERATION                             │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    const stage5Start = Date.now();

    const generationResult = await this.generator.generate(query, synthesisResult.context, {
      maxAnswerLength: generation.maxLength,
      useInferenceSampling: true,
      numCandidates: generation.numCandidates,
      beta: generation.beta,
      verifyFaithfulness: generation.verifyFaithfulness,
      useSelfConsistency: generation.useSelfConsistency,
      confidenceThreshold: generation.confidenceThreshold,
    });

    const stage5Latency = Date.now() - stage5Start;

    console.log(`✅ Stage 5 complete (${stage5Latency}ms)\n`);

    // Calculate total metrics
    const totalLatency = Date.now() - pipelineStart;

    // Estimate cost (simplified)
    const cost = this.estimateCost(
      reformulationResult.reformulations?.length || 1,
      retrievalResult.documents.length,
      synthesisResult.context.length,
      generationResult.answer.length
    );

    console.log('═'.repeat(80));
    console.log('📊 PIPELINE SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total Latency: ${totalLatency}ms`);
    console.log(`Estimated Cost: $${cost.toFixed(4)}`);
    console.log(`Retrieved Docs: ${retrievalResult.documents.length} (initial: 150, final: ${finalRerankingResult.documents.length})`);
    console.log(`Context Length: ${synthesisResult.context.length} chars`);
    console.log(`Answer Length: ${generationResult.answer.length} chars`);
    console.log(`Confidence: ${generationResult.confidence.toFixed(3)}`);
    console.log(`Faithful: ${generationResult.verification.faithful ? 'YES' : 'NO'}`);
    console.log(`Topic Shift: ${synthesisResult.topicShift.toFixed(3)}`);
    console.log('═'.repeat(80) + '\n');

    return {
      query,
      answer: generationResult.answer,
      reformulations: reformulationResult.reformulations?.map(r => r.query),
      retrievedDocs: retrievalResult.documents,
      rerankedDocs: reranking.enabled ? finalRerankingResult.documents : undefined,
      synthesizedContext: synthesisResult.context,
      metrics: {
        stage1Latency,
        stage2Latency,
        stage3Latency,
        stage4Latency,
        stage5Latency,
        totalLatency,
        cost,
      },
      verification: {
        faithful: generationResult.verification.faithful,
        consistent: generationResult.verification.consistent,
        complete: generationResult.verification.complete,
        confidence: generationResult.confidence,
      },
      deltaState: {
        topicShift: synthesisResult.topicShift,
        alpha: synthesisResult.alpha,
        beta: synthesisResult.beta,
      },
    };
  }

  /**
   * Estimate cost (simplified)
   */
  private estimateCost(
    numReformulations: number,
    numDocs: number,
    contextLength: number,
    answerLength: number
  ): number {
    // GPT-4o-mini pricing: $0.15/1M input, $0.6/1M output
    const inputCostPer1K = 0.00015;
    const outputCostPer1K = 0.0006;

    // Stage 1: Reformulation
    const reformulationTokens = numReformulations * 150;  // ~150 tokens per reformulation

    // Stage 2: Retrieval (embedding)
    const retrievalTokens = numReformulations * 50;  // ~50 tokens per query

    // Stage 3: Reranking
    const rerankingTokens = numDocs * 300;  // ~300 tokens per doc

    // Stage 4: Synthesis
    const synthesisInputTokens = numDocs * 300;
    const synthesisOutputTokens = contextLength / 4;  // ~4 chars per token

    // Stage 5: Generation
    const generationInputTokens = contextLength / 4;
    const generationOutputTokens = answerLength / 4;

    const totalInputTokens = reformulationTokens + retrievalTokens + rerankingTokens + synthesisInputTokens + generationInputTokens;
    const totalOutputTokens = synthesisOutputTokens + generationOutputTokens;

    const inputCost = (totalInputTokens / 1000) * inputCostPer1K;
    const outputCost = (totalOutputTokens / 1000) * outputCostPer1K;

    return inputCost + outputCost;
  }

  /**
   * Reset Delta Rule memory
   */
  reset(): void {
    this.synthesizer.reset();
  }
  
  /**
   * Find best start node for path exploration based on query relevance
   */
  private findBestStartNode(graph: KnowledgeGraph, query: string): GraphNode | null {
    if (graph.nodes.length === 0) return null;
    
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    
    // Score nodes by query relevance
    const scoredNodes = graph.nodes.map(node => {
      const nodeText = node.label.toLowerCase();
      let score = 0;
      
      // Exact match
      if (nodeText.includes(query.toLowerCase())) {
        score += 10;
      }
      
      // Term matches
      for (const term of queryTerms) {
        if (nodeText.includes(term)) {
          score += 2;
        }
      }
      
      // Prefer problem nodes (good starting points)
      if (node.type === 'problem') {
        score += 3;
      }
      
      return { node, score };
    });
    
    // Sort by score and return top node
    scoredNodes.sort((a, b) => b.score - a.score);
    
    return scoredNodes[0]?.node || graph.nodes[0];
  }
}

/**
 * Factory function
 */
export function createRAGPipeline(
  vectorStore: VectorStoreAdapter,
  model?: string
): RAGPipeline {
  return new RAGPipeline(vectorStore, model);
}

/**
 * Convenience function for simple RAG execution
 */
export async function executeRAG(
  vectorStore: VectorStoreAdapter,
  query: string,
  config?: RAGPipelineConfig
): Promise<string> {
  const pipeline = new RAGPipeline(vectorStore);

  const result = await pipeline.execute(query, config);

  return result.answer;
}
