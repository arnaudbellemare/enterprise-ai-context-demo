/**
 * Unified GEPA Framework: Adaptive Development for Enterprise AI Context Engineering
 * 
 * Version 2.2 | Adapted from FM 6-22 Leadership Development
 * 
 * GEPA Cycle: Goals → Evidence → Performance → Actions
 * - G: Goals (Set Intent) - SMART objectives leveraging strengths
 * - E: Evidence (Gather/Process) - Multi-sensory data, SQRRR, ReasoningBank retrieval
 * - P: Performance (Assess/Reflect) - SOAR-balanced, AAR, capability evaluation
 * - A: Actions (Iterate/Experiment) - Dominance prioritize, LoRA/DSPy adapt, Table 4-2 methods
 * 
 * Core Philosophy: Use strengths (e.g., DSPy refinement) to address needs (e.g., ambiguity handling)
 * amid uncertainties (e.g., real-time data flux). Cycles: Query → GEPA execution → Reflective AAR → Iterate.
 */

import { PermutationLiteGAMPPipeline, PermutationLiteGAMPConfig } from './permutation-lite/permutation-lite-gamp-pipeline';
import { ArcMemoReasoningBank } from './arcmemo-reasoning-bank';
import { getMistakeLearningSystem } from './mistake-learning-system';
import { AdvancedContextSystem } from './advanced-context-system';

export interface GEPAGoals {
  smart: string[];              // SMART objectives
  leverage: string[];           // Strengths to leverage (e.g., "DSPy", "synthesis")
  domain: string;               // Target domain
  qualityTarget?: number;       // Target quality score (0-1)
  efficiencyTarget?: number;    // Target efficiency (quality per token)
}

export interface GEPAEvidence {
  sqrrr: {
    survey?: string;            // Survey content
    question?: string;          // Questions asked
    read?: string | any[];      // What was read (string summary or array of memories)
    recite?: string;            // What was recited/understood
    review?: string;            // Review summary
  };
  indicators: string[];         // Short-term indicators (e.g., "Drift hinders")
  reasoningBankRetrieval?: any; // Retrieved from ReasoningBank
  sqlQueries?: string[];        // SQL queries executed
  contextDeltas?: any[];        // Context changes observed
}

export interface GEPAPerformance {
  aar: {
    capability: string;          // What supports/hinders performance
    cause?: string;             // Root cause of hinders
    leverage?: string;           // What to leverage
  };
  qualityScore: number;         // Overall quality (0-1)
  strengths: string[];          // Identified strengths
  needs: string[];              // Identified needs
  supports: string[];           // What supports performance
  hinders: string[];            // What hinders performance
  soar: {
    situation: string;
    observation: string;
    assessment: string;
    recommendation: string;
  };
}

export interface GEAPActions {
  table42: {
    feedback?: string[];         // Feedback activities
    study?: string[];            // Study activities
    practice?: string[];         // Practice activities
  };
  dominance: {
    rank: string;                // Priority ranking
    impact: number;               // Expected impact (0-1)
    cost: number;                // Expected cost (0-1)
  };
  iteration: {
    method: string;              // Method to iterate (e.g., "LoRA", "DSPy", "prompt_evolution")
    prompt?: string;              // Updated prompt
    config?: any;                // Configuration changes
  };
  contingency?: string;          // Fallback plan
}

export interface GEPACycle {
  id: string;
  query: string;
  domain: string;
  timestamp: Date;
  goals: GEPAGoals;
  evidence: GEPAEvidence;
  performance: GEPAPerformance;
  actions: GEAPActions;
  nextCycle?: string;            // ID of next cycle (for chaining)
  metadata: {
    qualityImprovement?: number;
    efficiencyGain?: number;
    strengthsLeveraged?: string[];
    needsAddressed?: string[];
  };
}

export class UnifiedGEPAEngine {
  private pipeline: PermutationLiteGAMPPipeline;
  private reasoningBank: ArcMemoReasoningBank;
  private contextSystem: AdvancedContextSystem;
  private cycles: Map<string, GEPACycle> = new Map();

  constructor(config?: Partial<PermutationLiteGAMPConfig>) {
    // Initialize pipeline with GEPA-optimized config
    this.pipeline = new PermutationLiteGAMPPipeline({
      enableGAMP: true,
      enableOptimization: true,
      enableLearning: true,
      enableTeacherStudent: true,
      useGEPAArborWorkflow: true,
      enableREFRAG: true,
      fastMode: false,
      gampConfig: {
        maxGraphNodes: 50,
        maxGraphEdges: 100,
        scientificDomains: [],
        irtThreshold: 0.5,
        minNoveltyThreshold: 0.6,
      },
      ...config,
    });

    this.reasoningBank = new ArcMemoReasoningBank();
    this.contextSystem = new AdvancedContextSystem();
  }

  /**
   * Execute GEPA cycle: Query → Goals → Evidence → Performance → Actions
   */
  async execute(query: string, domain: string = 'general'): Promise<{
    answer: string;
    gepaCycle: GEPACycle;
    metadata: any;
  }> {
    const cycleId = `gepa-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // ============================================================
    // G: GOALS (Set Intent)
    // ============================================================
    console.log('\n🎯 GEPA G: GOALS - Setting SMART objectives...');
    const goals = await this.setGoals(query, domain);
    console.log(`   ✓ Goals: ${goals.smart.join(', ')}`);
    console.log(`   ✓ Leverage: ${goals.leverage.join(', ')}`);

    // ============================================================
    // E: EVIDENCE (Gather/Process)
    // ============================================================
    console.log('\n📊 GEPA E: EVIDENCE - Gathering multi-sensory data...');
    const evidence = await this.gatherEvidence(query, domain);
    console.log(`   ✓ Indicators: ${evidence.indicators.join(', ')}`);

    // ============================================================
    // Execute base pipeline (PERMUTATION flow)
    // ============================================================
    console.log('\n⚙️ GEPA: Executing PERMUTATION pipeline...');
    const baseResult = await this.pipeline.execute(query, domain);

    // ============================================================
    // P: PERFORMANCE (Assess/Reflect)
    // ============================================================
    console.log('\n📈 GEPA P: PERFORMANCE - Assessing with SOAR & AAR...');
    const performance = await this.assessPerformance(
      query,
      domain,
      baseResult,
      goals,
      evidence
    );
    console.log(`   ✓ Quality: ${performance.qualityScore.toFixed(3)}`);
    console.log(`   ✓ Strengths: ${performance.strengths.join(', ')}`);
    console.log(`   ✓ Needs: ${performance.needs.join(', ')}`);

    // ============================================================
    // A: ACTIONS (Iterate/Experiment)
    // ============================================================
    console.log('\n🚀 GEPA A: ACTIONS - Prioritizing and iterating...');
    const actions = await this.determineActions(
      query,
      domain,
      goals,
      evidence,
      performance
    );
    console.log(`   ✓ Dominance Rank: ${actions.dominance.rank}`);
    console.log(`   ✓ Iteration: ${actions.iteration.method}`);

    // ============================================================
    // Build GEPA Cycle
    // ============================================================
    const gepaCycle: GEPACycle = {
      id: cycleId,
      query,
      domain,
      timestamp: new Date(),
      goals,
      evidence,
      performance,
      actions,
      metadata: {
        qualityImprovement: performance.qualityScore - (baseResult.metadata?.quality_score || 0.5),
        strengthsLeveraged: performance.strengths,
        needsAddressed: performance.needs,
      },
    };

    // Store cycle
    this.cycles.set(cycleId, gepaCycle);

    // ============================================================
    // Apply actions for next iteration (if applicable)
    // ============================================================
    if (actions.iteration.method !== 'none') {
      console.log(`   🔄 Applying iteration: ${actions.iteration.method}`);
      // Actions are applied in next cycle or stored for learning
    }

    return {
      answer: baseResult.answer,
      gepaCycle,
      metadata: {
        ...baseResult.metadata,
        gepaCycle: {
          id: cycleId,
          goals: goals.smart,
          qualityScore: performance.qualityScore,
          strengths: performance.strengths,
          needs: performance.needs,
          actions: actions.iteration.method,
        },
      },
    };
  }

  /**
   * G: Set SMART Goals leveraging strengths
   */
  private async setGoals(query: string, domain: string): Promise<GEPAGoals> {
    // Retrieve past successes to identify strengths
    const pastMemories = await this.reasoningBank.retrieveRelevantMemories(query, domain, 5);
    const strengths = this.identifyStrengths(pastMemories, domain);

    // Determine quality target based on domain and query complexity
    const qualityTarget = this.calculateQualityTarget(query, domain);

    return {
      smart: [
        `Achieve ${(qualityTarget * 100).toFixed(0)}% quality score for ${domain} queries`,
        `Leverage ${strengths[0] || 'DSPy'} for optimal context engineering`,
        `Address ambiguity handling through ${strengths[1] || 'synthesis'} capability`,
      ],
      leverage: strengths,
      domain,
      qualityTarget,
      efficiencyTarget: 0.001, // Target 0.1% improvement per token
    };
  }

  /**
   * E: Gather Evidence using SQRRR and ReasoningBank
   */
  private async gatherEvidence(query: string, domain: string): Promise<GEPAEvidence> {
    // SQRRR: Survey, Question, Read, Recite, Review
    const memories = await this.reasoningBank.retrieveRelevantMemories(query, domain, 10);
    const memoryCount = memories.length;
    const sqrrr = {
      survey: `Query: ${query}\nDomain: ${domain}\nContext: Enterprise AI analysis`,
      question: `What evidence is needed to answer this query accurately?`,
      read: memoryCount > 0 ? `Retrieved ${memoryCount} relevant memories from ReasoningBank: ${memories.slice(0, 3).map(m => m.title || m.description?.substring(0, 50) || 'Memory').join('; ')}` : 'No relevant memories found',
      recite: `Key patterns from ReasoningBank: ${memoryCount} relevant memories retrieved`,
      review: `Evidence gathering complete: Retrieved ${memoryCount} memories from ReasoningBank`,
    };

    // Identify indicators (what helps/hinders)
    const indicators = await this.identifyIndicators(query, domain);

    return {
      sqrrr,
      indicators,
      reasoningBankRetrieval: await this.reasoningBank.retrieveRelevantMemories(query, domain, 10),
    };
  }

  /**
   * P: Assess Performance with SOAR and AAR
   */
  private async assessPerformance(
    query: string,
    domain: string,
    result: any,
    goals: GEPAGoals,
    evidence: GEPAEvidence
  ): Promise<GEPAPerformance> {
    const qualityScore = result.metadata?.quality_score || 0.5;

    // Identify what supports and hinders
    const { supports, hinders, causes } = await this.analyzeCapabilities(
      query,
      domain,
      result,
      goals
    );

    // Identify strengths and needs
    const strengths = this.identifyStrengthsFromResult(result, goals);
    const needs = this.identifyNeedsFromResult(result, goals, qualityScore);

    // SOAR: Situation, Observation, Assessment, Recommendation
    const soar = {
      situation: `Executing ${domain} query with GEPA cycle`,
      observation: `Quality: ${qualityScore.toFixed(3)}, Strengths: ${strengths.join(', ')}, Needs: ${needs.join(', ')}`,
      assessment: `Performance ${qualityScore >= goals.qualityTarget! ? 'meets' : 'below'} target. ${supports.join(', ')} support performance. ${hinders.join(', ')} hinder performance.`,
      recommendation: `Leverage ${strengths[0]} to address ${needs[0] || 'quality gaps'}`,
    };

    // AAR: After Action Review
    const aar = {
      capability: `Strengths (${strengths.join(', ')}) support performance. Needs (${needs.join(', ')}) hinder performance.`,
      cause: hinders.length > 0 ? causes[0] : undefined,
      leverage: strengths[0] || 'DSPy',
    };

    return {
      aar,
      qualityScore,
      strengths,
      needs,
      supports,
      hinders,
      soar,
    };
  }

  /**
   * A: Determine Actions using Dominance and Table 4-2 methods
   */
  private async determineActions(
    query: string,
    domain: string,
    goals: GEPAGoals,
    evidence: GEPAEvidence,
    performance: GEPAPerformance
  ): Promise<GEAPActions> {
    // Dominance Technique: Rank actions by impact/cost
    const actionCandidates = this.generateActionCandidates(performance);

    // Rank by dominance (impact - cost)
    actionCandidates.sort((a, b) => (b.impact - b.cost) - (a.impact - a.cost));
    const topAction = actionCandidates[0];

    // Table 4-2: Developmental Activities
    const table42 = {
      feedback: performance.needs.includes('quality') ? ['Request TRM evaluation', 'Consult ReasoningBank for past evals'] : [],
      study: performance.needs.includes('knowledge') ? ['Investigate DSPy refinements', 'Study semantic SQL queries'] : [],
      practice: performance.needs.includes('execution') ? ['Teach chain evolution via GEPA', 'Explore multi-domain variants'] : [],
    };

    // Determine iteration method
    let iterationMethod = 'none';
    let iterationPrompt = query;
    let iterationConfig = {};

    if (performance.qualityScore < goals.qualityTarget!) {
      if (performance.strengths.includes('DSPy')) {
        iterationMethod = 'DSPy';
        iterationConfig = { optimize: true, iterations: 5 };
      } else if (performance.strengths.includes('LoRA')) {
        iterationMethod = 'LoRA';
        iterationConfig = { adapt: true, domain };
      } else {
        iterationMethod = 'prompt_evolution';
        iterationPrompt = await this.evolvePrompt(query, performance);
      }
    }

    return {
      table42,
      dominance: {
        rank: topAction.name,
        impact: topAction.impact,
        cost: topAction.cost,
      },
      iteration: {
        method: iterationMethod,
        prompt: iterationPrompt,
        config: iterationConfig,
      },
      contingency: `Fallback: Use ${performance.strengths[0] || 'DSPy'} if ${iterationMethod} fails`,
    };
  }

  /**
   * Identify strengths from past memories
   */
  private identifyStrengths(memories: any[], domain: string): string[] {
    const strengths: string[] = [];
    
    // Analyze memory patterns
    const highQualityMemories = memories.filter(m => m.successRate > 0.8);
    if (highQualityMemories.length > 0) {
      strengths.push('DSPy'); // High-quality memories suggest good optimization
    }

    // Domain-specific strengths
    if (domain.includes('financial') || domain.includes('crypto')) {
      strengths.push('synthesis');
      strengths.push('analytical_reasoning');
    }

    // Default strengths
    if (strengths.length === 0) {
      strengths.push('DSPy', 'context_engineering');
    }

    return strengths.slice(0, 3); // Top 3 strengths
  }

  /**
   * Identify indicators (what helps/hinders)
   */
  private async identifyIndicators(query: string, domain: string): Promise<string[]> {
    const indicators: string[] = [];
    
    // Check for ambiguity
    if (query.length < 50 || query.split(' ').length < 5) {
      indicators.push('Ambiguity hinders');
    }

    // Check ReasoningBank availability
    const memories = await this.reasoningBank.retrieveRelevantMemories(query, domain, 5);
    if (memories.length > 0) {
      indicators.push('ReasoningBank supports');
    } else {
      indicators.push('ReasoningBank gaps hinder');
    }

    return indicators;
  }

  /**
   * Analyze capabilities (what supports/hinders)
   */
  private async analyzeCapabilities(
    query: string,
    domain: string,
    result: any,
    goals: GEPAGoals
  ): Promise<{ supports: string[]; hinders: string[]; causes: string[] }> {
    const supports: string[] = [];
    const hinders: string[] = [];
    const causes: string[] = [];

    // Check quality
    const quality = result.metadata?.quality_score || 0;
    if (quality >= goals.qualityTarget!) {
      supports.push('Quality meets target');
    } else {
      hinders.push('Quality below target');
      causes.push('Insufficient context or optimization');
    }

    // Check context engineering
    if (result.metadata?.contextEngineering?.contextsCount > 0) {
      supports.push('Context Engineering active');
    } else {
      hinders.push('Context Engineering gaps');
      causes.push('No enriched context available');
    }

    // Check GAMP
    if (result.metadata?.graphReasoning?.pathsDiscovered > 0) {
      supports.push('GAMP path discovery');
    }

    return { supports, hinders, causes };
  }

  /**
   * Identify strengths from result
   */
  private identifyStrengthsFromResult(result: any, goals: GEPAGoals): string[] {
    const strengths: string[] = [];

    if (result.metadata?.optimization?.quality > 0.8) {
      strengths.push('DSPy');
    }

    if (result.metadata?.contextEngineering?.quality?.relevance > 0.7) {
      strengths.push('context_engineering');
    }

    if (result.metadata?.graphReasoning?.topPath?.novelty > 0.7) {
      strengths.push('graph_reasoning');
    }

    // Add goal-based strengths
    strengths.push(...goals.leverage);

    return [...new Set(strengths)].slice(0, 3);
  }

  /**
   * Identify needs from result
   */
  private identifyNeedsFromResult(
    result: any,
    goals: GEPAGoals,
    qualityScore: number
  ): string[] {
    const needs: string[] = [];

    if (qualityScore < goals.qualityTarget!) {
      needs.push('quality');
    }

    if (!result.metadata?.contextEngineering) {
      needs.push('context');
    }

    if (!result.metadata?.graphReasoning) {
      needs.push('reasoning');
    }

    return needs;
  }

  /**
   * Generate action candidates for dominance ranking
   */
  private generateActionCandidates(performance: GEPAPerformance): Array<{
    name: string;
    impact: number;
    cost: number;
  }> {
    const candidates: Array<{ name: string; impact: number; cost: number }> = [];

    // Address each need
    for (const need of performance.needs) {
      if (need === 'quality') {
        candidates.push({
          name: 'DSPy optimization',
          impact: 0.8,
          cost: 0.3,
        });
      }
      if (need === 'context') {
        candidates.push({
          name: 'Context Engineering enhancement',
          impact: 0.7,
          cost: 0.2,
        });
      }
      if (need === 'reasoning') {
        candidates.push({
          name: 'GAMP activation',
          impact: 0.6,
          cost: 0.4,
        });
      }
    }

    // Leverage strengths
    for (const strength of performance.strengths) {
      candidates.push({
        name: `Leverage ${strength}`,
        impact: 0.5,
        cost: 0.1,
      });
    }

    return candidates;
  }

  /**
   * Calculate quality target based on query and domain
   */
  private calculateQualityTarget(query: string, domain: string): number {
    let target = 0.85; // Default target

    // Domain-specific targets
    if (domain === 'financial' || domain === 'crypto') {
      target = 0.92; // Higher target for financial
    }

    // Query complexity adjustment
    if (query.length > 200) {
      target -= 0.05; // Slightly lower for very long queries
    }

    return Math.max(0.7, Math.min(0.95, target));
  }

  /**
   * Evolve prompt based on performance
   */
  private async evolvePrompt(query: string, performance: GEPAPerformance): Promise<string> {
    // Enhance prompt with lessons learned
    let evolved = query;

    if (performance.needs.includes('quality')) {
      evolved = `[High-quality analysis requested] ${query}`;
    }

    if (performance.strengths.includes('synthesis')) {
      evolved = `${evolved} [Apply synthesis approach]`;
    }

    return evolved;
  }

  /**
   * Get GEPA cycle by ID
   */
  getCycle(cycleId: string): GEPACycle | undefined {
    return this.cycles.get(cycleId);
  }

  /**
   * Get all cycles
   */
  getAllCycles(): GEPACycle[] {
    return Array.from(this.cycles.values());
  }

  /**
   * Get cycles for a domain
   */
  getCyclesForDomain(domain: string): GEPACycle[] {
    return Array.from(this.cycles.values()).filter(cycle => cycle.domain === domain);
  }
}

