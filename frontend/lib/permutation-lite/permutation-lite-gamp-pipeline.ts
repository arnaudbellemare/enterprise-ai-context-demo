/**
 * PERMUTATION LITE PIPELINE WITH GAMP INTEGRATION
 *
 * Extended 5-layer architecture with GAMP (Graph-based Agent Multi-agent Pathfinding):
 *
 * 1. ROUTING (Layer 1): IRT + Domain Detector
 * 2. OPTIMIZATION (Layer 2): GEPA
 * 2.5 GRAPH REASONING (Layer 2.5): GAMP (optional, opt-in)
 * 3. LEARNING (Layer 3): ReasoningBank
 * 4. VERIFICATION (Layer 4): RVS
 *
 * Mental Model: Route → Optimize → [Graph Reasoning] → Learn → Verify
 *
 * GAMP Activation:
 * - ✅ Scientific domains (biology, chemistry, physics, medicine)
 * - ✅ High difficulty (IRT > 0.7)
 * - ✅ Multi-step reasoning requirements
 * - ⚙️ Runs in parallel with GEPA and Learning for minimal latency impact
 */

// Load environment variables
try {
  const dotenv = require('dotenv');
  const { resolve } = require('path');
  dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: resolve(process.cwd(), '.env') });
} catch (e) {
  // dotenv not available - ignore
}

import { calculateIRT } from '../irt-calculator';
import { detectDomain, type Domain } from '../domain-detector';
import { RVS, type RVSResult } from '../trm';
import { ArcMemoReasoningBank, type Experience } from '../arcmemo-reasoning-bank';
import { teacherStudentSystem } from '../teacher-student-system';
import { AdvancedContextSystem } from '../advanced-context-system';

// GAMP imports
import { gampAgentSystem } from '../gamp/gamp-agent-system';
import { knowledgeGraphBuilder, type EnrichedChunkWithPSE } from '../gamp/knowledge-graph-builder';
import { problemSolutionEffectExtractor, type ProblemSolutionEffect } from '../rag/problem-solution-effect-extractor';
import type { KnowledgeGraph, Path, GraphNode } from '../gamp/graph-path-explorer';

// DO-RAG integration imports
import { doragMultiLevelExtractor } from '../gamp/dorag-multilevel-extractor';
import { doragRefinement } from '../gamp/dorag-refinement';
import { doragHybridRetrieval } from '../gamp/dorag-hybrid-retrieval';

// Chain Association Activation imports
import { chainAssociationActivation } from '../gamp/chain-association-activation';
import { pipelineCache } from '../pipeline-cache';

// ============================================================
// INTERFACES
// ============================================================

interface RoutingResult {
  difficulty: number;
  domain: string;
  confidence: number;
  route: 'simple' | 'complex';
}

interface OptimizationResult {
  optimizedPrompt: string;
  quality: number;
  cost: number;
  generations: number;
}

interface GraphReasoningResult {
  pathsDiscovered: number;
  topPath: {
    problem: string;
    solution: string;
    effect: string;
    novelty: number;
    scientificRationality: number;
    factuality: number;
    overallScore: number;
  } | null;
  graphStats: {
    nodes: number;
    edges: number;
    triplets: number;
  };
  agentEvaluations: number;
  executionTime: number;
}

interface LearningResult {
  memoriesStored: number;
  memoriesUsed: number;
  successRate: number;
  teacherStudent?: {
    teacherResponse?: any;
    studentResponse?: any;
    learningEffectiveness?: number;
  };
  alitaG?: {
    toolsSynthesized?: number;
    toolNames?: string[];
    toolsRetrieved?: number;
  };
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  iterations: number;
  refinedAnswer: string;
}

export interface PermutationLiteGAMPConfig {
  // Core layers
  enableOptimization?: boolean;
  enableGAMP?: boolean;  // NEW: Enable GAMP graph reasoning
  enableLearning?: boolean;
  enableVerification?: boolean;

  // Optional enhancements
  enableTeacherStudent?: boolean;
  enableToolSynthesis?: boolean;
  enableREFRAG?: boolean;
  enableVectorPassing?: boolean;
  vectorPassingProvider?: 'perplexity' | 'ollama';

  // Thresholds
  difficultyThreshold?: number;
  maxVerificationIterations?: number;

  // GAMP-specific config
  gampConfig?: {
    maxGraphNodes?: number;  // Max nodes in lightweight graph (default: 50)
    maxGraphEdges?: number;  // Max edges (default: 100)
    maxPaths?: number;       // Max paths to discover (default: 5)
    scientificDomains?: string[]; // Domains to activate GAMP (default: biology, chemistry, physics, medicine)
    irtThreshold?: number;   // IRT threshold for activation (default: 0.7)
  };

  // GEPA-Arbor Workflow
  useGEPAArborWorkflow?: boolean;
  gepaArborConfig?: any;
}

export interface PermutationLiteGAMPResult {
  answer: string;
  metadata: {
    domain: string;
    difficulty: number;
    quality_score: number;
    layers_executed: string[];
    performance: {
      total_time_ms: number;
      cost: number;
    };
    routing?: RoutingResult;
    optimization?: OptimizationResult;
    graphReasoning?: GraphReasoningResult;  // NEW: GAMP results
    learning?: LearningResult;
    verification?: VerificationResult;
    toolsSynthesized?: number;
    toolsRetrieved?: number;
  };
}

// ============================================================
// PERMUTATION LITE PIPELINE WITH GAMP
// ============================================================

export class PermutationLiteGAMPPipeline {
  private config: Required<PermutationLiteGAMPConfig>;
  private reasoningBank: ArcMemoReasoningBank;
  private refragSystem: any = null;
  private gepaArborWorkflow: any = null;
  private contextSystem: AdvancedContextSystem;

  constructor(config?: Partial<PermutationLiteGAMPConfig>) {
    this.config = {
      enableOptimization: config?.enableOptimization ?? true,
      enableGAMP: config?.enableGAMP ?? false,  // Off by default (opt-in)
      enableLearning: config?.enableLearning ?? true,
      enableVerification: config?.enableVerification ?? true,
      enableTeacherStudent: config?.enableTeacherStudent ?? false,
      enableToolSynthesis: config?.enableToolSynthesis ?? true,
      enableREFRAG: config?.enableREFRAG ?? false,
      enableVectorPassing: config?.enableVectorPassing ?? false,
      vectorPassingProvider: config?.vectorPassingProvider ?? 'ollama',
      difficultyThreshold: config?.difficultyThreshold ?? 0.5,
      maxVerificationIterations: config?.maxVerificationIterations ?? 3,
      useGEPAArborWorkflow: config?.useGEPAArborWorkflow ?? false,
      gepaArborConfig: config?.gepaArborConfig ?? {},
      gampConfig: {
        maxGraphNodes: config?.gampConfig?.maxGraphNodes ?? 50,
        maxGraphEdges: config?.gampConfig?.maxGraphEdges ?? 100,
        maxPaths: config?.gampConfig?.maxPaths ?? 5,
        scientificDomains: config?.gampConfig?.scientificDomains ?? [
          'biology',
          'chemistry',
          'physics',
          'medicine',
          'neuroscience',
          'pharmacology',
        ],
        irtThreshold: config?.gampConfig?.irtThreshold ?? 0.7,
      },
    };

    this.reasoningBank = new ArcMemoReasoningBank();
    this.contextSystem = new AdvancedContextSystem();

    // Initialize REFRAG if enabled
    if (this.config.enableREFRAG || this.config.enableVectorPassing) {
      this.initializeREFRAG();
    }

    // Initialize GEPA-Arbor if enabled
    if (this.config.useGEPAArborWorkflow) {
      this.initializeGEPAArbor();
    }

    const componentCount = 4 +
      (this.config.enableGAMP ? 1 : 0) +
      (this.config.enableTeacherStudent ? 1 : 0) +
      (this.config.enableREFRAG ? 1 : 0) +
      (this.config.useGEPAArborWorkflow ? 1 : 0);

    console.log('🔧 PERMUTATION Lite + GAMP initialized', {
      layers: this.config.enableGAMP ? 5 : 4,
      components: componentCount,
      millersLaw: componentCount <= 7 ? '7±2 compliant' : '⚠️ exceeds 7±2',
      gamp: this.config.enableGAMP && this.config.gampConfig ? `enabled (IRT>${this.config.gampConfig.irtThreshold})` : 'disabled',
      optimization: this.config.enableOptimization ? 'enabled' : 'disabled',
      learning: this.config.enableLearning ? 'enabled' : 'disabled',
      verification: this.config.enableVerification ? 'enabled' : 'disabled',
    });
  }

  private async initializeREFRAG() {
    try {
      const refragModule = await import('../refrag-system');
      const { createVectorRetriever } = await import('../vector-databases');

      const retriever = createVectorRetriever('inmemory', {});

      const refragConfig = {
        sensorMode: 'adaptive' as const,
        k: 5,
        budget: 3,
        mmrLambda: 0.7,
        uncertaintyThreshold: 0.5,
        enableOptimizationMemory: false,
        enableVectorPassing: this.config.enableVectorPassing,
        vectorPassingProvider: this.config.vectorPassingProvider,
        vectorDB: { type: 'inmemory' as const, config: {} }
      };

      this.refragSystem = new refragModule.REFRAGSystem(refragConfig, retriever);
      console.log('   ✅ REFRAG initialized');
    } catch (error) {
      console.warn('⚠️ REFRAG initialization failed (non-fatal):', error);
    }
  }

  private async initializeGEPAArbor() {
    try {
      const { createGEPAArborWorkflow } = await import('../gepa-arbor-workflow');

      const baseLM = {
        generate: async (prompt: string) => {
          const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
          const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gemma3:4b',
              prompt,
              stream: false
            })
          });
          const data = await response.json();
          return data.response || '';
        }
      };

      const workflowConfig = {
        gepa: {
          num_iterations: this.config.gepaArborConfig?.gepa?.num_iterations || 10,
          convergence_threshold: this.config.gepaArborConfig?.gepa?.convergence_threshold || 0.01,
          max_iterations: this.config.gepaArborConfig?.gepa?.max_iterations || 20
        },
        arbor: {
          prediction_threshold: this.config.gepaArborConfig?.arbor?.prediction_threshold || 0.1,
          use_planning: this.config.gepaArborConfig?.arbor?.use_planning ?? true,
          use_joint_embeddings: this.config.gepaArborConfig?.arbor?.use_joint_embeddings ?? true,
          rl_update_frequency: this.config.gepaArborConfig?.arbor?.rl_update_frequency || 5
        },
        enable_arbor: true,
        auto_switch: true,
        enable_monitoring: true
      };

      this.gepaArborWorkflow = await createGEPAArborWorkflow(baseLM, workflowConfig);
      console.log('   ✅ GEPA-Arbor workflow initialized');
    } catch (error) {
      console.warn('⚠️ GEPA-Arbor initialization failed (non-fatal):', error);
      this.config.useGEPAArborWorkflow = false;
    }
  }

  /**
   * MAIN EXECUTION: 5-Layer Pipeline with GAMP
   * Route → Optimize → [Graph Reasoning] → Learn → Verify
   */
  async execute(
    query: string,
    domain?: string
  ): Promise<PermutationLiteGAMPResult> {
    const startTime = Date.now();
    const layersExecuted: string[] = [];
    let totalCost = 0;

    // ============================================================
    // CONTEXT ENGINEERING 2.0
    // ============================================================
    const sessionId = `permutation-lite-gamp-${Date.now()}`;
    try {
      const contextResult = await this.contextSystem.processQuery(sessionId, query);
      const qualityScore = contextResult.quality.relevance || 0.5;
      console.log(`🧠 Context Engineering 2.0: ${contextResult.context.length} contexts, ${qualityScore.toFixed(2)} quality`);
    } catch (error) {
      console.warn('⚠️ Context Engineering 2.0 failed (non-fatal):', error);
    }

    // ============================================================
    // LAYER 1: ROUTING
    // ============================================================
    console.log('\n📍 LAYER 1: ROUTING');
    const routingResult = await this.executeRouting(query, domain);
    layersExecuted.push('routing');

    console.log(`   ✓ Difficulty: ${routingResult.difficulty.toFixed(2)}`);
    console.log(`   ✓ Domain: ${routingResult.domain}`);
    console.log(`   ✓ Route: ${routingResult.route}`);

    // Check if GAMP should be activated
    const shouldActivateGAMP = this.shouldActivateGAMP(routingResult);
    if (this.config.enableGAMP && shouldActivateGAMP) {
      console.log(`   🔬 GAMP activation: YES (scientific domain + IRT ${routingResult.difficulty.toFixed(2)} > ${this.config.gampConfig?.irtThreshold ?? 0.7})`);
    } else if (this.config.enableGAMP) {
      console.log(`   ⏭️  GAMP activation: NO (domain: ${routingResult.domain}, IRT: ${routingResult.difficulty.toFixed(2)})`);
    }

    // ============================================================
    // LAYER 2, 2.5, 3: PARALLEL OPTIMIZATION + GRAPH REASONING + LEARNING
    // GEPA, GAMP, and Learning are independent - run concurrently
    // ============================================================
    let optimizationResult: OptimizationResult | undefined;
    let graphReasoningResult: GraphReasoningResult | undefined;
    let learningResult: LearningResult | undefined;

    if (this.config.enableOptimization || (this.config.enableGAMP && shouldActivateGAMP) || this.config.enableLearning) {
      console.log('\n⚙️  LAYER 2, 2.5, 3: OPTIMIZATION + GRAPH REASONING + LEARNING (Parallel Execution)');
      const parallelStartTime = Date.now();

      // Parallel execution: GEPA, GAMP, Learning run concurrently
      const [optResult, graphResult, learnResult] = await Promise.all([
        this.config.enableOptimization
          ? this.executeOptimization(query, routingResult)
          : Promise.resolve(undefined),
        (this.config.enableGAMP && shouldActivateGAMP)
          ? this.executeGraphReasoning(query, routingResult.domain)
          : Promise.resolve(undefined),
        this.config.enableLearning
          ? this.executeLearning(query, routingResult.domain)
          : Promise.resolve(undefined),
      ]);

      optimizationResult = optResult;
      graphReasoningResult = graphResult;
      learningResult = learnResult;
      const parallelDuration = Date.now() - parallelStartTime;

      if (optimizationResult) {
        layersExecuted.push('optimization');
        console.log(`   ✓ GEPA Quality: ${optimizationResult.quality.toFixed(3)}`);
        totalCost += optimizationResult.cost;
      }

      if (graphReasoningResult) {
        layersExecuted.push('graph-reasoning');
        console.log(`   ✓ GAMP Paths: ${graphReasoningResult.pathsDiscovered}`);
        if (graphReasoningResult.topPath) {
          console.log(`   ✓ Top Path Score: ${graphReasoningResult.topPath.overallScore.toFixed(3)}`);
          console.log(`   ✓ Novelty: ${graphReasoningResult.topPath.novelty.toFixed(2)}`);
        }
      }

      if (learningResult) {
        layersExecuted.push('learning');
        console.log(`   ✓ Memories used: ${learningResult.memoriesUsed}`);
      }

      // Show time savings from parallelization
      const estimatedSequential =
        (optimizationResult ? 30000 : 0) +
        (graphReasoningResult ? 15000 : 0) +  // GAMP adds 15s estimated
        (learningResult ? 5000 : 0);
      const timeSaved = estimatedSequential > 0 ? estimatedSequential - parallelDuration : 0;
      if (timeSaved > 0) {
        console.log(`   ⚡ Parallelization saved ~${Math.round(timeSaved)}ms (${parallelDuration}ms vs ~${estimatedSequential}ms sequential)`);
      }
    }

    // ============================================================
    // TEACHER-STUDENT-JUDGE (Optional)
    // ============================================================
    let teacherStudentResult: any = null;
    if (this.config.enableTeacherStudent) {
      console.log('\n🎓 TEACHER-STUDENT-JUDGE');
      teacherStudentResult = await this.executeTeacherStudent(query, routingResult.domain);
      console.log(`   ✓ Teacher confidence: ${teacherStudentResult?.teacherResponse?.confidence?.toFixed(2) || 'N/A'}`);
    }

    // ============================================================
    // GENERATE INITIAL ANSWER
    // ============================================================
    const optimizedQuery = optimizationResult?.optimizedPrompt || query;
    let answer: string;

    if (teacherStudentResult?.teacherResponse?.answer) {
      answer = teacherStudentResult.teacherResponse.answer;
    } else {
      answer = await this.generateAnswer(optimizedQuery, routingResult.domain, learningResult, graphReasoningResult);
    }

    // ============================================================
    // DO-RAG REFINEMENT (if GAMP was activated)
    // ============================================================
    if (graphReasoningResult && this.config.enableGAMP) {
      console.log('\n🔄 DO-RAG REFINEMENT: Applying multi-stage refinement...');
      
      try {
        // Get knowledge graph and retrieved context for refinement
        const knowledgeGraph = await this.buildLightweightKnowledgeGraph(query, routingResult.domain);
        const retrievedContext = [
          ...(learningResult?.memoriesUsed ? ['Retrieved from ReasoningBank memories'] : []),
          ...(graphReasoningResult.topPath ? [
            `Problem: ${graphReasoningResult.topPath.problem}`,
            `Solution: ${graphReasoningResult.topPath.solution}`,
            `Effect: ${graphReasoningResult.topPath.effect}`,
          ] : []),
        ];
        
        const refinementResult = await doragRefinement.refine(
          answer,
          query,
          knowledgeGraph,
          retrievedContext
        );
        
        answer = refinementResult.condensedAnswer;
        
        console.log(`   ✓ Refinement complete: ${refinementResult.verified ? 'Verified' : 'Hallucinations detected'}`);
        console.log(`   ✓ Confidence: ${refinementResult.confidence.toFixed(3)}`);
        if (refinementResult.hallucinations.length > 0) {
          console.log(`   ⚠️  Detected ${refinementResult.hallucinations.length} potential hallucinations`);
        }
        if (refinementResult.citations.length > 0) {
          console.log(`   📚 Generated ${refinementResult.citations.length} citations`);
        }
      } catch (error) {
        console.warn('⚠️ DO-RAG refinement failed (non-fatal):', error);
        // Continue with original answer
      }
    }

    // ============================================================
    // LAYER 4: VERIFICATION
    // ============================================================
    let verificationResult: VerificationResult | undefined;

    if (this.config.enableVerification) {
      console.log('\n✅ LAYER 4: VERIFICATION');
      verificationResult = await this.executeVerification(query, answer);
      layersExecuted.push('verification');

      if (verificationResult.verified) {
        console.log(`   ✓ Verified with confidence: ${verificationResult.confidence.toFixed(2)}`);
        console.log(`   ✓ Iterations: ${verificationResult.iterations}`);
        answer = verificationResult.refinedAnswer;
      }
    }

    // ============================================================
    // POST-EXECUTION LEARNING
    // ============================================================
    if (this.config.enableLearning) {
      const qualityScore = this.calculateQualityScore(routingResult, optimizationResult, verificationResult, graphReasoningResult);
      this.storeMemories(query, answer, routingResult.domain, qualityScore, graphReasoningResult?.topPath ? [graphReasoningResult.topPath] : []).catch(console.error);
    }

    // ============================================================
    // FINAL RESULT
    // ============================================================
    const totalTime = Date.now() - startTime;
    const qualityScore = this.calculateQualityScore(routingResult, optimizationResult, verificationResult, graphReasoningResult);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PERMUTATION LITE + GAMP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Time: ${totalTime}ms`);
    console.log(`📊 Quality: ${qualityScore.toFixed(3)}`);
    console.log(`📍 Layers: ${layersExecuted.join(' → ')}`);
    console.log(`💰 Cost: $${totalCost.toFixed(4)}`);
    if (graphReasoningResult) {
      console.log(`🔬 GAMP: ${graphReasoningResult.pathsDiscovered} paths discovered`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      answer,
      metadata: {
        domain: routingResult.domain,
        difficulty: routingResult.difficulty,
        quality_score: qualityScore,
        layers_executed: layersExecuted,
        performance: {
          total_time_ms: totalTime,
          cost: totalCost,
        },
        routing: routingResult,
        optimization: optimizationResult,
        graphReasoning: graphReasoningResult,
        learning: learningResult,
        verification: verificationResult,
        toolsSynthesized: learningResult?.alitaG?.toolsSynthesized || 0,
        toolsRetrieved: learningResult?.alitaG?.toolsRetrieved || 0,
      },
    };
  }

  // ============================================================
  // GAMP ACTIVATION LOGIC
  // ============================================================

  private shouldActivateGAMP(routingResult: RoutingResult): boolean {
    const gampConfig = this.config.gampConfig;
    if (!gampConfig || !gampConfig.scientificDomains) return false;
    
    // Check if domain is scientific
    const isScientificDomain = gampConfig.scientificDomains.some(
      domain => routingResult.domain.toLowerCase().includes(domain.toLowerCase())
    );

    // Check if difficulty is high enough (use >= to include threshold value)
    const isHighDifficulty = routingResult.difficulty >= (gampConfig.irtThreshold ?? 0.7);

    return isScientificDomain && isHighDifficulty;
  }

  // ============================================================
  // LAYER EXECUTION METHODS
  // ============================================================

  private async executeRouting(
    query: string,
    domain?: string
  ): Promise<RoutingResult> {
    const domainResult = domain ? { domain } : detectDomain(query);
    const detectedDomain = typeof domainResult === 'string' ? domainResult : domainResult.domain;
    const difficulty = await calculateIRT(query, detectedDomain);
    const route: 'simple' | 'complex' = difficulty > this.config.difficultyThreshold ? 'complex' : 'simple';

    return {
      difficulty,
      domain: detectedDomain,
      confidence: 0.85,
      route,
    };
  }

  private async executeOptimization(
    query: string,
    routingResult: RoutingResult
  ): Promise<OptimizationResult> {
    const { GEPAAlgorithms } = await import('../gepa-algorithms');
    const gepaAlgorithms = new GEPAAlgorithms({
      fastMode: true,
      maxGenerations: 10,
      populationSize: 15
    });

    const gepaResult = await gepaAlgorithms.optimizePrompts(
      routingResult.domain,
      [query],
      ['quality', 'speed', 'cost'],
      5,
      []
    );

    const bestPrompt = gepaResult.best_individuals.quality_leader?.prompt ||
                      gepaResult.evolved_prompts[0]?.prompt ||
                      query;

    const quality = gepaResult.best_individuals.quality_leader?.fitness.quality || 0.85;

    return {
      optimizedPrompt: bestPrompt,
      quality: Math.min(quality, 0.95),
      cost: 0.001,
      generations: gepaResult.optimization_metrics.generations_evolved,
    };
  }

  // ============================================================
  // LAYER 2.5: GRAPH REASONING (GAMP)
  // ============================================================

  private async executeGraphReasoning(
    query: string,
    domain: string
  ): Promise<GraphReasoningResult> {
    const startTime = Date.now();

    try {
      // Check cache for graph construction result
      const cacheKey = `gamp:graph:${domain}:${query.substring(0, 100)}`;
      const cachedGraph = pipelineCache.get<KnowledgeGraph>(cacheKey);
      
      let knowledgeGraph: KnowledgeGraph;
      if (cachedGraph) {
        console.log('   💾 GAMP: Using cached knowledge graph');
        knowledgeGraph = cachedGraph;
      } else {
        // Build lightweight knowledge graph from ReasoningBank memories
        knowledgeGraph = await this.buildLightweightKnowledgeGraph(query, domain);
        // Cache graph for 1 hour (TTL: 3600000ms)
        pipelineCache.set(cacheKey, knowledgeGraph, 3600000);
      }

      console.log(`   🔬 GAMP: Built graph with ${knowledgeGraph.nodes.length} nodes, ${knowledgeGraph.edges.length} edges`);

      // Create source documents from graph for GAMP
      const sourceDocuments = knowledgeGraph.nodes.slice(0, 20).map((node, i) => ({
        id: `node-${node.id}`,
        content: node.label,
        metadata: {
          nodeType: node.type,
          domain,
        },
      }));

      // DO-RAG Hybrid Retrieval: Combine graph + vector with novelty scoring
      console.log('   🔍 DO-RAG: Performing hybrid retrieval with novelty scoring...');
      
      // Check cache for hybrid retrieval result
      const retrievalCacheKey = `gamp:retrieval:${domain}:${query.substring(0, 100)}`;
      let hybridRetrieval: any;
      
      const cachedRetrieval = pipelineCache.get<any>(retrievalCacheKey);
      if (cachedRetrieval) {
        console.log('   💾 DO-RAG: Using cached hybrid retrieval');
        hybridRetrieval = cachedRetrieval;
      } else {
        const vectorChunks = sourceDocuments.map(doc => ({
          content: doc.content,
          metadata: doc.metadata,
        }));
        
        hybridRetrieval = await doragHybridRetrieval.retrieve(
          query,
          knowledgeGraph,
          vectorChunks
        );
        // Cache retrieval for 30 minutes (TTL: 1800000ms)
        pipelineCache.set(retrievalCacheKey, hybridRetrieval, 1800000);
      }
      
      console.log(`   ✓ Hybrid retrieval: ${hybridRetrieval.fusedResults.length} fused results, avg novelty: ${hybridRetrieval.statistics.avgNovelty.toFixed(3)}`);
      
      // Enhance source documents with hybrid retrieval results
      const enhancedDocuments = hybridRetrieval.fusedResults.map((result: {
        content: string;
        source: 'graph' | 'vector' | 'hybrid';
        score: number;
        novelty?: number;
        metadata?: any;
      }, i: number) => ({
        id: `hybrid-${i}`,
        content: result.content,
        metadata: {
          ...result.metadata,
          source: result.source,
          novelty: result.novelty,
          score: result.score,
        },
      }));
      
      // Discover paths using GAMP multi-agent system (with DO-RAG enhanced retrieval)
      // Check cache for path discovery result
      const pathsCacheKey = `gamp:paths:${domain}:${query.substring(0, 100)}`;
      let paths: any[];
      
      const cachedPaths = pipelineCache.get<any[]>(pathsCacheKey);
      if (cachedPaths) {
        console.log('   💾 GAMP: Using cached paths');
        paths = cachedPaths;
      } else {
        paths = await gampAgentSystem.discoverPaths(
          query,
          knowledgeGraph,
          enhancedDocuments,
          domain
        );
        // Cache paths for 15 minutes (TTL: 900000ms) - shorter TTL as paths may change
        pipelineCache.set(pathsCacheKey, paths, 900000);
      }

      // Chain Association Activation: Self-supervised learning with gradient optimization
      console.log('   🔗 Chain Association Activation: Optimizing path activations...');
      
      // Convert GAMP paths to Path format for chain activation
      const pathObjects: Path[] = paths.map(p => {
        // Find nodes in knowledge graph that match path
        const pathNodes = p.nodes.map((nodeId: string) => 
          knowledgeGraph.nodes.find(n => n.id === nodeId || n.label.includes(nodeId))
        ).filter(Boolean) as GraphNode[];
        
        // Find edges connecting these nodes
        const pathEdges = knowledgeGraph.edges.filter(e => 
          pathNodes.some(n => n.id === e.from) && pathNodes.some(n => n.id === e.to)
        );
        
        return {
          nodes: pathNodes.length > 0 ? pathNodes : knowledgeGraph.nodes.slice(0, Math.min(5, knowledgeGraph.nodes.length)),
          edges: pathEdges,
          score: p.overallScore || 0.5,
          novelty: p.novelty,
          length: pathNodes.length,
        };
      });
      
      const chainAssociations = await chainAssociationActivation.activateChainAssociations(
        pathObjects,
        knowledgeGraph,
        query
      );

      // Enhance paths with activation information
      const enhancedPaths = paths.map((path, index) => {
        const association = chainAssociations[index];
        if (association) {
          return {
            ...path,
            activationScore: association.performance,
            convergence: association.convergence,
            transferFunction: association.transferFunction,
          };
        }
        return path;
      });

      // Re-rank paths by activation performance (lower convergence = better)
      const rankedPaths = enhancedPaths.sort((a, b) => {
        const scoreA = ((a as any).activationScore || a.overallScore || 0) * (1 - Math.min(((a as any).convergence || 1), 1));
        const scoreB = ((b as any).activationScore || b.overallScore || 0) * (1 - Math.min(((b as any).convergence || 1), 1));
        return scoreB - scoreA;
      });

      const executionTime = Date.now() - startTime;
      
      console.log(`   ✓ Chain Activation: Avg convergence ${chainAssociations.reduce((sum, c) => sum + c.convergence, 0) / chainAssociations.length}, optimized ${rankedPaths.length} paths`);

      // Extract top path (use ranked paths if available)
      const finalPaths = rankedPaths.length > 0 ? rankedPaths : paths;
      const topPath = finalPaths.length > 0 ? {
        problem: finalPaths[0].problem,
        solution: finalPaths[0].solution,
        effect: finalPaths[0].effect,
        novelty: finalPaths[0].novelty,
        scientificRationality: finalPaths[0].scientificRationality,
        factuality: finalPaths[0].factuality,
        overallScore: finalPaths[0].overallScore,
        activationScore: (finalPaths[0] as any).activationScore,
        convergence: (finalPaths[0] as any).convergence,
        transferFunction: (finalPaths[0] as any).transferFunction,
      } : null;

      // Count agent evaluations
      const agentEvaluations = paths.reduce((sum, path) => sum + (path.evaluations?.length || 0), 0);

      return {
        pathsDiscovered: paths.length,
        topPath,
        graphStats: {
          nodes: knowledgeGraph.nodes.length,
          edges: knowledgeGraph.edges.length,
          triplets: Math.floor(knowledgeGraph.nodes.length / 3), // Estimate
        },
        agentEvaluations,
        executionTime,
      };
    } catch (error) {
      console.error('❌ GAMP execution failed:', error);
      return {
        pathsDiscovered: 0,
        topPath: null,
        graphStats: { nodes: 0, edges: 0, triplets: 0 },
        agentEvaluations: 0,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Build lightweight knowledge graph from ReasoningBank memories
   * Uses DO-RAG multi-level extraction for enhanced graph construction
   * Extracts P-S-E triplets and builds graph with size limits
   */
  private async buildLightweightKnowledgeGraph(
    query: string,
    domain: string
  ): Promise<KnowledgeGraph> {
    // Retrieve relevant memories
    const memories = await this.reasoningBank.retrieveRelevantMemories(query, domain, 10);

    // DO-RAG Integration: Use multi-level extraction for enhanced graph building
    console.log('   🔬 DO-RAG: Applying multi-level extraction...');
    
    const chunks = memories.slice(0, 10).map(m => ({
      id: m.id,
      content: m.content,
      domain,
    }));
    
    // Extract multi-level entities and relations
    const multiLevelResult = await doragMultiLevelExtractor.extract(chunks, domain);
    
    // Extract P-S-E triplets from memories (legacy support)
    const triplets: ProblemSolutionEffect[] = [];

    for (const memory of memories.slice(0, 10)) { // Limit to 10 memories
      try {
        const triplet = await problemSolutionEffectExtractor.extractFromChunk(
          memory.content,
          memory.id,
          domain
        );
        if (triplet) {
          triplets.push(triplet);
        }
      } catch (error) {
        // Skip failed extractions
        continue;
      }
    }
    
    console.log(`   ✅ DO-RAG: Extracted ${multiLevelResult.entities.length} entities across ${Object.keys(multiLevelResult.statistics).length} levels`);

    // If no triplets extracted, create a simple graph from query
    if (triplets.length === 0) {
      console.log('   ⚠️ No P-S-E triplets extracted, creating simple graph from query');
      triplets.push({
        problem: `Understanding: ${query.substring(0, 100)}`,
        solution: 'Analyze relevant domain knowledge and research',
        effect: 'Provide comprehensive answer',
        confidence: 0.5,
        source: 'query',
        metadata: { domain, entities: [] }
      });
    }

    // Create enriched chunks
    const enrichedChunks: EnrichedChunkWithPSE[] = triplets.map((triplet, i) => ({
      id: `chunk-${i}`,
      content: `${triplet.problem} ${triplet.solution} ${triplet.effect}`,
      problemSolutionEffect: triplet,
      metadata: { domain },
    }));

    // Build graph (don't use stored triplets for lightweight graph)
    const graph = await knowledgeGraphBuilder.buildFromEnrichedChunks(enrichedChunks, false);

    // Apply size limits
    if (!this.config.gampConfig) return graph;
    const maxNodes = this.config.gampConfig.maxGraphNodes || 50;
    const maxEdges = this.config.gampConfig.maxGraphEdges || 100;

    if (graph.nodes.length > maxNodes) {
      graph.nodes = graph.nodes.slice(0, maxNodes);
    }
    if (graph.edges.length > maxEdges) {
      graph.edges = graph.edges.slice(0, maxEdges);
    }

    return graph;
  }

  private async executeLearning(
    query: string,
    domain: string
  ): Promise<LearningResult> {
    const memories = await this.reasoningBank.retrieveRelevantMemories(query, domain, 5);

    let alitaGResult: any = null;
    if (this.config.enableToolSynthesis) {
      try {
        const { createToolSynthesisEngine } = await import('../tool-synthesis-engine');
        const toolEngine = createToolSynthesisEngine(this.reasoningBank);
        const selectedTools = await toolEngine.selectTools(query, domain, 5);

        alitaGResult = {
          toolsRetrieved: selectedTools.length,
          toolNames: selectedTools.map((t: any) => t.name || t.id).slice(0, 5),
        };
      } catch (error) {
        console.warn('⚠️ Alita-G tool retrieval failed (non-fatal):', error);
      }
    }

    return {
      memoriesStored: 0,
      memoriesUsed: memories.length,
      successRate: 0.85,
      alitaG: alitaGResult,
    };
  }

  private async executeTeacherStudent(query: string, domain: string): Promise<any> {
    try {
      return await teacherStudentSystem.processQuery(query, domain);
    } catch (error) {
      console.error('❌ Teacher-Student failed:', error);
      return null;
    }
  }

  private async executeVerification(
    query: string,
    answer: string
  ): Promise<VerificationResult> {
    const rvs = new RVS({ max_iterations: this.config.maxVerificationIterations });
    const steps: any[] = [{
      step: 1,
      action: 'answer',
      tool: 'response',
      reasoning: answer,
      result: answer
    }];
    const result = await rvs.processQuery(query, steps);

    return {
      verified: result.verified,
      confidence: result.confidence,
      iterations: result.iterations,
      refinedAnswer: result.answer,
    };
  }

  private async generateAnswer(
    query: string,
    domain: string,
    learningResult?: LearningResult,
    graphResult?: GraphReasoningResult
  ): Promise<string> {
    // Build comprehensive context
    let context = `You are an expert in ${domain}. Provide a comprehensive answer to the following query.\n\n`;
    context += `Query: ${query}\n\n`;

    // Add GAMP insights
    if (graphResult?.topPath) {
      context += `## Research Insights from Graph Analysis:\n`;
      context += `Problem Identified: ${graphResult.topPath.problem}\n`;
      context += `Solution Approach: ${graphResult.topPath.solution}\n`;
      context += `Expected Effect: ${graphResult.topPath.effect}\n`;
      context += `Novelty Score: ${graphResult.topPath.novelty.toFixed(2)}\n`;
      context += `Scientific Rationality: ${graphResult.topPath.scientificRationality.toFixed(2)}\n`;
      context += `Factuality Score: ${graphResult.topPath.factuality.toFixed(2)}\n\n`;
    }

    // Add learning insights
    if (learningResult?.memoriesUsed && learningResult.memoriesUsed > 0) {
      context += `## Relevant Knowledge from Memory:\n`;
      context += `Using ${learningResult.memoriesUsed} relevant memories from past experiences.\n\n`;
    }

    context += `Please provide a detailed, accurate answer based on the above information.`;

    // Generate answer using Ollama
    try {
      const response = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:4b",
          messages: [
            {
              role: "system",
              content: `You are an expert ${domain} researcher and analyst. Provide comprehensive, accurate answers based on the provided context.`
            },
            {
              role: "user",
              content: context
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        })
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data.choices[0].message.content;
        return answer || `Answer based on ${domain} domain analysis: ${query.substring(0, 200)}...`;
      }
    } catch (error) {
      console.warn('⚠️ LLM answer generation failed, using fallback:', error);
    }

    // Fallback: Generate structured answer from context
    let fallbackAnswer = `Based on ${domain} domain analysis`;
    
    if (graphResult?.topPath) {
      fallbackAnswer += ` with graph reasoning insights:\n\n`;
      fallbackAnswer += `The research identifies the problem: ${graphResult.topPath.problem}\n\n`;
      fallbackAnswer += `A potential solution approach involves: ${graphResult.topPath.solution}\n\n`;
      fallbackAnswer += `This could lead to the following effects: ${graphResult.topPath.effect}\n\n`;
      fallbackAnswer += `The path shows ${(graphResult.topPath.novelty * 100).toFixed(0)}% novelty and ${(graphResult.topPath.scientificRationality * 100).toFixed(0)}% scientific rationality.\n\n`;
    }
    
    fallbackAnswer += `Regarding your query: ${query}\n\n`;
    fallbackAnswer += `This analysis combines domain expertise with graph-based reasoning to provide insights into the problem space.`;
    
    return fallbackAnswer;
  }

  private calculateQualityScore(
    routingResult: RoutingResult,
    optimizationResult?: OptimizationResult,
    verificationResult?: VerificationResult,
    graphResult?: GraphReasoningResult
  ): number {
    let score = 0.7; // Base score

    if (optimizationResult) {
      score = score * 0.3 + optimizationResult.quality * 0.7;
    }

    if (verificationResult) {
      score = score * 0.6 + verificationResult.confidence * 0.4;
    }

    if (graphResult?.topPath) {
      // Boost score with GAMP results
      const gampBoost = graphResult.topPath.overallScore * 0.1;
      score = Math.min(1.0, score + gampBoost);
    }

    return Math.min(score, 0.99);
  }

  private async storeMemories(
    query: string,
    answer: string,
    domain: string,
    qualityScore: number,
    paths: any[]
  ): Promise<void> {
    try {
      // ReasoningBank uses Experience-based storage, not direct storeMemory
      // Create a simple experience from the execution
      const experience: Experience = {
        taskId: `permutation-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        query,
        domain,
        steps: [
          {
            thought: `Query processing with quality score ${qualityScore.toFixed(3)}`,
            action: 'execute',
            observation: `Generated answer with ${paths.length} GAMP paths`,
            timestamp: new Date(),
          },
        ],
        success: qualityScore >= 0.7, // Consider it successful if quality is good
        finalResult: answer,
        irtAbility: qualityScore,
        irtConfidence: qualityScore,
      };
      
      // Extract and consolidate memories from experience
      const memories = await this.reasoningBank.extractMemoryFromExperience(experience);
      if (memories.length > 0) {
        await this.reasoningBank.consolidateMemories(memories);
      }
    } catch (error) {
      console.warn('⚠️ Memory storage failed (non-fatal):', error);
    }
  }
}

// Export singleton instance
export const permutationLiteGAMPPipeline = new PermutationLiteGAMPPipeline();
