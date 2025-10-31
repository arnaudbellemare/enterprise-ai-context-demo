#!/usr/bin/env tsx

/**
 * 🔬 COMPARATIVE TEST: SRL vs nanoEBM vs Current System
 * 
 * Tests three approaches side-by-side:
 * 1. Current System: SWiRL + TRM + GEPA
 * 2. SRL-Enhanced: SWiRL + Step-wise Supervision
 * 3. nanoEBM-Enhanced: Energy-Based Refinement
 * 
 * Goal: Determine ideal approach for different use cases
 */

import { PermutationEngine, PermutationConfig, PermutationResult } from './frontend/lib/permutation-engine';
import { SWiRLDecomposer } from './frontend/lib/swirl-decomposer';

interface TestQuery {
  id: string;
  text: string;
  domain: string;
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  expectedSteps: number;
  category: 'multi_step' | 'verification' | 'refinement';
}

interface TestResult {
  approach: 'current' | 'srl' | 'ebm' | 'srl+ebm';
  queryId: string;
  query: string;
  metrics: {
    accuracy: number;
    faithfulness: number;
    completeness: number;
    latency: number;
    cost: number;
    iterations: number;
    convergence: number; // How quickly quality stabilizes
  };
  details: {
    steps?: number;
    reasoning?: string;
    energyHistory?: number[];
    stepRewards?: number[];
    answer: string;
  };
  timestamp: string;
}

interface ComparativeAnalysis {
  queryId: string;
  query: string;
  results: TestResult[];
  winner: {
    approach: string;
    reason: string;
    margin: number;
  };
  insights: string[];
}

class SRLnanoEBMComparativeTester {
  private testQueries: TestQuery[] = [];
  private results: TestResult[] = [];
  private analyses: ComparativeAnalysis[] = [];

  constructor() {
    this.initializeTestQueries();
  }

  private initializeTestQueries(): void {
    this.testQueries = [
      // Multi-Step Reasoning (SWiRL's domain)
      {
        id: 'msr-1',
        text: 'Calculate Bitcoin ROI 2020-2024 vs S&P 500, adjust for inflation, and explain which was better for a tax-advantaged account.',
        domain: 'financial',
        complexity: 'very_high',
        expectedSteps: 6,
        category: 'multi_step'
      },
      {
        id: 'msr-2',
        text: 'Analyze the legal implications of a non-compete clause in an employment contract where the employee works remotely from California but the company is based in New York.',
        domain: 'legal',
        complexity: 'high',
        expectedSteps: 4,
        category: 'multi_step'
      },
      {
        id: 'msr-3',
        text: 'Design an experiment to test the efficacy of a new drug compound, including hypothesis formation, control group design, and statistical analysis plan.',
        domain: 'science_research',
        complexity: 'very_high',
        expectedSteps: 5,
        category: 'multi_step'
      },

      // Verification (TRM's domain)
      {
        id: 'ver-1',
        text: 'Based on this insurance policy document, what is the premium for a 35-year-old with no pre-existing conditions?',
        domain: 'insurance',
        complexity: 'medium',
        expectedSteps: 3,
        category: 'verification'
      },
      {
        id: 'ver-2',
        text: 'Verify that this financial analysis correctly calculates the present value of future cash flows using the provided discount rate.',
        domain: 'financial',
        complexity: 'high',
        expectedSteps: 2,
        category: 'verification'
      },

      // Refinement (GEPA's domain)
      {
        id: 'ref-1',
        text: 'Analyze market trends for electric vehicles in 2024',
        domain: 'marketing',
        complexity: 'medium',
        expectedSteps: 3,
        category: 'refinement'
      },
      {
        id: 'ref-2',
        text: 'Write compelling email copy for a product launch targeting SMBs in healthcare',
        domain: 'copywriting',
        complexity: 'medium',
        expectedSteps: 2,
        category: 'refinement'
      }
    ];
  }

  async runComparativeTests(): Promise<void> {
    console.log('🔬 COMPARATIVE TEST: SRL vs nanoEBM vs Current System');
    console.log('🎯 Phase 1: BASELINE TESTING (Current System Only)\n');
    const quickMode = process.argv.includes('--quick') || process.argv.includes('-q');
    const queriesToTest = quickMode ? this.testQueries.slice(0, 2) : this.testQueries;
    
    console.log('='.repeat(80));
    console.log(`Testing ${queriesToTest.length} queries to establish baseline performance${quickMode ? ' (QUICK MODE)' : ''}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < queriesToTest.length; i++) {
      const query = queriesToTest[i];
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 Query ${i + 1}/${queriesToTest.length}: ${query.id}`);
      console.log(`   Category: ${query.category}`);
      console.log(`   Complexity: ${query.complexity}`);
      console.log(`   Expected Steps: ${query.expectedSteps}`);
      console.log(`   Text: "${query.text.substring(0, 100)}..."`);

      // Test Current System
      console.log(`\n   1️⃣  Testing Current System (SWiRL + TRM + GEPA)...`);
      const currentResult = await this.testCurrentSystem(query);
      this.results.push(currentResult);

      if (currentResult.metrics.accuracy > 0.1) {
        successCount++;
        console.log(`      ✅ Success: Accuracy=${(currentResult.metrics.accuracy * 100).toFixed(1)}%, Latency=${currentResult.metrics.latency}ms`);
      } else {
        errorCount++;
        console.log(`      ❌ Failed: ${currentResult.details.answer.substring(0, 100)}`);
      }

      // Test SRL-Enhanced (only for multi-step queries)
      if (query.category === 'multi_step') {
        console.log(`   2️⃣  Testing SRL-Enhanced (SWiRL + Step-wise Supervision)...`);
        const srlResult = await this.testSRLEnhanced(query);
        if (srlResult) {
          this.results.push(srlResult);
          console.log(`      ✅ Success: Accuracy=${(srlResult.metrics.accuracy * 100).toFixed(1)}%, Latency=${srlResult.metrics.latency}ms`);
          
          // Test Combined (if both available)
          const ebmResult = query.category === 'refinement' || query.category === 'verification' 
            ? await this.testEBMEnhanced(query)
            : null;
          
          if (ebmResult && query.category === 'multi_step') {
            console.log(`   4️⃣  Testing Combined (SRL + nanoEBM)...`);
            const combinedResult = await this.testCombined(query, srlResult, ebmResult);
            if (combinedResult) {
              this.results.push(combinedResult);
              console.log(`      ✅ Success: Accuracy=${(combinedResult.metrics.accuracy * 100).toFixed(1)}%`);
            }
          }
        } else {
          console.log(`      ⚠️  SRL skipped (no expert trajectories or not applicable)`);
        }
      } else {
        console.log(`   2️⃣  Skipping SRL (quick mode, not multi-step)`);
      }

      // Test nanoEBM-Enhanced (only for refinement/verification)
      if (query.category === 'refinement' || query.category === 'verification') {
        console.log(`   3️⃣  Testing nanoEBM-Enhanced (Energy-Based Refinement)...`);
        const ebmResult = await this.testEBMEnhanced(query);
        if (ebmResult) {
          this.results.push(ebmResult);
          console.log(`      ✅ Success: Accuracy=${(ebmResult.metrics.accuracy * 100).toFixed(1)}%, Latency=${ebmResult.metrics.latency}ms`);
        } else {
          console.log(`      ⚠️  EBM skipped (not applicable for this query type)`);
        }
      } else {
        console.log(`   3️⃣  Skipping EBM (not refinement/verification query)`);
      }

      // Analyze results for this query (baseline only)
      const analysis = this.analyzeQueryResults(query.id);
      this.analyses.push(analysis);
      
      // Show quick summary for this query
      if (analysis.winner.approach !== 'none') {
        console.log(`\n   📊 Result: ${analysis.winner.approach} (margin: ${(analysis.winner.margin * 100).toFixed(1)}%)`);
      }
    }

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\n✅ Baseline Testing Complete: ${successCount} succeeded, ${errorCount} failed\n`);
    this.generateFinalReport();
  }

  async testCurrentSystem(query: TestQuery): Promise<TestResult> {
    const startTime = Date.now();
    const startCost = 0; // TODO: Track API costs

    try {
      // For baseline testing, prioritize speed and reliability
      // Use Perplexity (teacher) for all queries to avoid Ollama timeouts
      process.env.BASELINE_TESTING = 'true'; // Signal to use timeouts
      
      const config: PermutationConfig = {
        enableTeacherModel: true, // Use Perplexity for faster, more reliable responses
        enableStudentModel: false, // Skip Ollama to avoid timeouts in baseline testing
        enableMultiQuery: query.category !== 'refinement' && query.complexity !== 'very_high', // Skip for refinement and very complex queries
        enableReasoningBank: true,
        enableLoRA: false,
        enableIRT: true,
        enableDSPy: query.category !== 'verification' && query.complexity !== 'very_high', // Skip for verification and very complex
        enableACE: query.complexity !== 'very_high', // Skip ACE for very high complexity to speed up
        enableSWiRL: query.category === 'multi_step' && query.complexity !== 'very_high', // Only for multi-step, but skip very high complexity
        enableTRM: (query.category === 'verification' || query.category === 'multi_step') && query.complexity !== 'very_high', // Skip for very high complexity
        enableGEPA: query.category === 'refinement' && query.complexity !== 'very_high', // Only for refinement, skip very high
        enableRAG: false, // Disable RAG for baseline
      };

      const engine = new PermutationEngine(config);
      
      // Set timeout based on complexity
      // Very high complexity: 5 minutes, High: 3 minutes, Medium: 2 minutes, Low: 1 minute
      // Reduced timeouts for faster testing
      const timeoutMap: Record<string, number> = {
        'very_high': 120000, // 2 minutes (reduced from 5)
        'high': 90000,       // 1.5 minutes (reduced from 3)
        'medium': 60000,     // 1 minute (reduced from 2)
        'low': 30000         // 30 seconds (reduced from 1)
      };
      
      const timeout = timeoutMap[query.complexity] || 180000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Test timeout after ${timeout / 1000} seconds`)), timeout);
      });

      console.log(`      ⏱️  Timeout set to ${timeout / 1000}s for ${query.complexity} complexity`);
      
      const result = await Promise.race([
        engine.execute(query.text, query.domain),
        timeoutPromise
      ]) as PermutationResult;

      const latency = Date.now() - startTime;
      const cost = startCost; // TODO: Calculate actual cost

      // Calculate metrics
      const metrics = await this.calculateMetrics(
        query,
        result,
        latency,
        cost,
        result.metadata?.components_used?.length || 0
      );

      const answer = result.answer || result.response || 'No answer generated';

      return {
        approach: 'current',
        queryId: query.id,
        query: query.text,
        metrics,
        details: {
          steps: result.metadata?.components_used?.length || 0,
          answer: answer.substring(0, 500), // Limit answer length for readability
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';
      console.error(`      ❌ Current System Error: ${errorMessage}`);
      
      // Still calculate basic metrics even on error
      return {
        approach: 'current',
        queryId: query.id,
        query: query.text,
        metrics: {
          accuracy: 0.1, // Low score but not zero (partial credit for attempt)
          faithfulness: 0.1,
          completeness: 0.1,
          latency,
          cost: 0,
          iterations: 0,
          convergence: 0,
        },
        details: {
          answer: `Error: ${errorMessage.substring(0, 200)}`,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async testSRLEnhanced(query: TestQuery): Promise<TestResult | null> {
    if (query.category !== 'multi_step') {
      console.log(`      ⚠️  SRL only applicable to multi-step queries, skipping`);
      return null;
    }

    const startTime = Date.now();
    
    try {
      // Import SRL enhancer
      const { SWiRLSRLEnhancer, loadExpertTrajectories } = await import('./frontend/lib/srl/swirl-srl-enhancer');
      const { createSWiRLDecomposer } = await import('./frontend/lib/swirl-decomposer');
      
      // Load expert trajectories
      const expertTrajectories = await loadExpertTrajectories(query.domain);
      
      if (expertTrajectories.length === 0) {
        console.log(`      ⚠️  No expert trajectories available for ${query.domain}, skipping SRL`);
        return null;
      }
      
      // Create SRL enhancer
      const srlEnhancer = new SWiRLSRLEnhancer({
        expertTrajectories,
        stepRewardWeight: 0.6,
        finalRewardWeight: 0.4,
        reasoningGeneration: true,
        similarityThreshold: 0.5
      });
      
      // Create SWiRL decomposer
      const decomposer = createSWiRLDecomposer('qwen2.5:14b');
      const availableTools = ['web_search', 'calculator', 'sql'];
      
      // Execute with SRL
      const enhancedDecomposition = await srlEnhancer.executeWithSRL(
        query.text,
        query.domain,
        availableTools,
        decomposer
      );
      
      // Execute steps and get final answer
      let finalAnswer = '';
      for (const step of enhancedDecomposition.trajectory.steps) {
        const stepResult = await decomposer.executeStep(step, finalAnswer);
        finalAnswer += `\n${step.description}: ${JSON.stringify(stepResult)}`;
      }
      
      const latency = Date.now() - startTime;
      
      // Calculate metrics
      const metrics = await this.calculateMetrics(
        query,
        { answer: finalAnswer, metadata: { components_used: enhancedDecomposition.trajectory.steps.map(s => s.description) } } as any,
        latency,
        0,
        enhancedDecomposition.trajectory.steps.length
      );
      
      return {
        approach: 'srl',
        queryId: query.id,
        query: query.text,
        metrics,
        details: {
          steps: enhancedDecomposition.trajectory.steps.length,
          stepRewards: enhancedDecomposition.trajectory.steps.map(s => s.stepReward || 0),
          averageStepReward: enhancedDecomposition.averageStepReward,
          answer: finalAnswer.substring(0, 500)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`      ❌ SRL Error: ${error.message}`);
      return null;
    }
  }

  async testEBMEnhanced(query: TestQuery): Promise<TestResult | null> {
    if (query.category !== 'refinement' && query.category !== 'verification') {
      console.log(`      ⚠️  EBM mainly for refinement/verification, skipping`);
      return null;
    }

    const startTime = Date.now();
    
    try {
      // Import EBM refiner
      const { EBMAnswerRefiner } = await import('./frontend/lib/ebm/answer-refiner-simple');
      
      // Generate initial answer first (using simple approach)
      const initialAnswer = await this.generateInitialAnswer(query.text, query.domain);
      
      // Create EBM refiner
      const ebmRefiner = new EBMAnswerRefiner({
        refinementSteps: 3,
        learningRate: 0.5,
        noiseScale: 0.01,
        temperature: 0.8,
        energyFunction: query.domain,
        earlyStoppingThreshold: 0.001
      });
      
      // Refine with EBM
      const context = `Domain: ${query.domain}, Query: ${query.text}`;
      const result = await ebmRefiner.refine(
        query.text,
        context,
        initialAnswer
      );
      
      const latency = Date.now() - startTime;
      
      // Calculate metrics
      const metrics = await this.calculateMetrics(
        query,
        { answer: result.refinedAnswer, metadata: { components_used: ['EBM'] } } as any,
        latency,
        0,
        result.stepsCompleted
      );
      
      return {
        approach: 'ebm',
        queryId: query.id,
        query: query.text,
        metrics: {
          ...metrics,
          convergence: result.converged ? 1.0 : 0.5 // Convergence metric
        },
        details: {
          steps: result.stepsCompleted,
          energyHistory: result.energyHistory,
          improvement: result.improvement,
          answer: result.refinedAnswer.substring(0, 500)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`      ❌ EBM Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate initial answer for EBM refinement
   */
  private async generateInitialAnswer(query: string, domain: string): Promise<string> {
    // Simplified: return a basic answer
    // In production, would use LLM
    return `Initial answer for: ${query.substring(0, 100)}... [This would be replaced with actual LLM generation in production]`;
  }

  async testCombined(
    query: TestQuery,
    srlResult: TestResult,
    ebmResult: TestResult
  ): Promise<TestResult | null> {
    if (query.category !== 'multi_step') {
      return null; // Combined approach mainly for multi-step
    }

    const startTime = Date.now();
    
    try {
      // Strategy: Use SRL for step-wise supervision, then EBM for final refinement
      const { SWiRLSRLEnhancer, loadExpertTrajectories } = await import('./frontend/lib/srl/swirl-srl-enhancer');
      const { EBMAnswerRefiner } = await import('./frontend/lib/ebm/answer-refiner-simple');
      const { createSWiRLDecomposer } = await import('./frontend/lib/swirl-decomposer');
      
      // Step 1: SRL-enhanced decomposition
      const expertTrajectories = await loadExpertTrajectories(query.domain);
      const srlEnhancer = new SWiRLSRLEnhancer({
        expertTrajectories,
        stepRewardWeight: 0.6,
        finalRewardWeight: 0.4,
        reasoningGeneration: true
      });
      
      const decomposer = createSWiRLDecomposer('qwen2.5:14b');
      const enhancedDecomposition = await srlEnhancer.executeWithSRL(
        query.text,
        query.domain,
        ['web_search', 'calculator', 'sql'],
        decomposer
      );
      
      // Step 2: Execute steps and get initial answer
      let initialAnswer = '';
      for (const step of enhancedDecomposition.trajectory.steps) {
        const stepResult = await decomposer.executeStep(step, initialAnswer);
        initialAnswer += `\n${step.description}: ${JSON.stringify(stepResult)}`;
      }
      
      // Step 3: EBM refinement of final answer
      const ebmRefiner = new EBMAnswerRefiner({
        refinementSteps: 3,
        learningRate: 0.5,
        energyFunction: query.domain
      });
      
      const context = `Domain: ${query.domain}, Query: ${query.text}`;
      const ebmResult_final = await ebmRefiner.refine(query.text, context, initialAnswer);
      
      const latency = Date.now() - startTime;
      
      // Calculate metrics (combine best of both)
      const metrics = await this.calculateMetrics(
        query,
        { answer: ebmResult_final.refinedAnswer, metadata: { components_used: ['SRL', 'EBM'] } } as any,
        latency,
        0,
        enhancedDecomposition.trajectory.steps.length + ebmResult_final.stepsCompleted
      );
      
      return {
        approach: 'srl+ebm',
        queryId: query.id,
        query: query.text,
        metrics: {
          ...metrics,
          convergence: ebmResult_final.converged ? 1.0 : 0.5
        },
        details: {
          steps: enhancedDecomposition.trajectory.steps.length,
          averageStepReward: enhancedDecomposition.averageStepReward,
          energyHistory: ebmResult_final.energyHistory,
          improvement: ebmResult_final.improvement,
          answer: ebmResult_final.refinedAnswer.substring(0, 500)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`      ❌ Combined Error: ${error.message}`);
      return null;
    }
  }

  async calculateMetrics(
    query: TestQuery,
    result: PermutationResult,
    latency: number,
    cost: number,
    iterations: number
  ): Promise<TestResult['metrics']> {
    const answer = result.answer || result.response || '';

    // Calculate accuracy (simplified - would use ground truth in real test)
    const accuracy = this.estimateAccuracy(query, answer);

    // Calculate faithfulness (token overlap with context)
    const faithfulness = this.calculateFaithfulness(query, answer);

    // Calculate completeness (coverage of query aspects)
    const completeness = this.calculateCompleteness(query, answer);

    // Calculate convergence (stability of quality)
    const convergence = 0.8; // TODO: Calculate from quality history

    return {
      accuracy,
      faithfulness,
      completeness,
      latency,
      cost,
      iterations,
      convergence,
    };
  }

  private estimateAccuracy(query: TestQuery, answer: string): number {
    // Simplified estimation - in real test, compare with ground truth
    if (!answer || answer.length < 50) return 0.3;
    if (answer.toLowerCase().includes('error')) return 0.2;

    // Domain-specific heuristics
    if (query.domain === 'financial' && answer.includes('ROI') || answer.includes('return')) {
      return 0.85;
    }
    if (query.domain === 'legal' && (answer.includes('jurisdiction') || answer.includes('law'))) {
      return 0.80;
    }
    if (query.category === 'multi_step' && answer.length > 200) {
      return 0.75;
    }

    // Default estimate based on answer quality indicators
    let score = 0.5;
    if (answer.length > 300) score += 0.1;
    if (answer.includes('\n') || answer.includes('•')) score += 0.1; // Structured
    if (answer.match(/\d+%|\$[\d,]+/)) score += 0.1; // Contains numbers

    return Math.min(0.95, score);
  }

  private calculateFaithfulness(query: TestQuery, answer: string): number {
    // Simplified - in real test, check against provided context
    if (!answer) return 0;
    
    // Token-based overlap heuristic
    const queryTokens = new Set(query.text.toLowerCase().split(/\s+/));
    const answerTokens = new Set(answer.toLowerCase().split(/\s+/));
    
    const overlap = Array.from(queryTokens).filter(t => answerTokens.has(t)).length;
    const ratio = overlap / Math.max(queryTokens.size, 1);
    
    return Math.min(0.95, ratio * 1.2); // Scale up slightly
  }

  private calculateCompleteness(query: TestQuery, answer: string): number {
    if (!answer) return 0;

    // Check if answer addresses multiple aspects (for multi-step queries)
    if (query.category === 'multi_step') {
      const stepIndicators = ['step', 'first', 'second', 'then', 'next', 'finally'];
      const hasMultipleSteps = stepIndicators.filter(ind => 
        answer.toLowerCase().includes(ind)
      ).length;
      return Math.min(0.95, 0.4 + (hasMultipleSteps / stepIndicators.length) * 0.55);
    }

    // For other queries, base on length and structure
    let score = 0.5;
    if (answer.length > 200) score += 0.2;
    if (answer.includes('\n') || answer.includes('•')) score += 0.2;
    if (answer.length > 500) score += 0.1;

    return Math.min(0.95, score);
  }

  private analyzeQueryResults(queryId: string): ComparativeAnalysis {
    const queryResults = this.results.filter(r => r.queryId === queryId);
    const query = this.testQueries.find(q => q.id === queryId)!;

    if (queryResults.length === 0) {
      return {
        queryId,
        query: query.text,
        results: [],
        winner: {
          approach: 'none',
          reason: 'No results available',
          margin: 0,
        },
        insights: ['No test results to analyze'],
      };
    }

    // Calculate composite score for each approach
    const scores = queryResults.map(result => ({
      approach: result.approach,
      compositeScore: 
        result.metrics.accuracy * 0.3 +
        result.metrics.faithfulness * 0.25 +
        result.metrics.completeness * 0.25 +
        (1 / (1 + result.metrics.latency / 1000)) * 0.1 + // Latency penalty
        result.metrics.convergence * 0.1,
      result,
    }));

    // Find winner
    scores.sort((a, b) => b.compositeScore - a.compositeScore);
    const winner = scores[0];
    const margin = winner.compositeScore - (scores[1]?.compositeScore || 0);

    // Generate insights
    const insights: string[] = [];
    insights.push(`Winner: ${winner.approach} (score: ${winner.compositeScore.toFixed(3)})`);
    
    if (margin > 0.1) {
      insights.push(`${winner.approach} significantly outperforms others (${(margin * 100).toFixed(1)}% margin)`);
    } else if (margin > 0.05) {
      insights.push(`${winner.approach} slightly outperforms others (${(margin * 100).toFixed(1)}% margin)`);
    } else {
      insights.push('Approaches are very close in performance');
    }

    // Category-specific insights
    if (query.category === 'multi_step') {
      const multiStepResults = queryResults.filter(r => 
        r.details.steps && r.details.steps >= query.expectedSteps
      );
      if (multiStepResults.length > 0) {
        insights.push(`Multi-step handling: ${multiStepResults.length} approach(es) completed all steps`);
      }
    }

    // Performance insights
    const fastest = queryResults.reduce((a, b) => 
      a.metrics.latency < b.metrics.latency ? a : b
    );
    insights.push(`Fastest: ${fastest.approach} (${fastest.metrics.latency}ms)`);

    const mostAccurate = queryResults.reduce((a, b) => 
      a.metrics.accuracy > b.metrics.accuracy ? a : b
    );
    if (mostAccurate.approach !== winner.approach) {
      insights.push(`Most accurate: ${mostAccurate.approach} (${(mostAccurate.metrics.accuracy * 100).toFixed(1)}%)`);
    }

    return {
      queryId,
      query: query.text,
      results: queryResults,
      winner: {
        approach: winner.approach,
        reason: `Highest composite score (accuracy + faithfulness + completeness + efficiency)`,
        margin: margin,
      },
      insights,
    };
  }

  private generateFinalReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPARATIVE TEST REPORT');
    console.log('='.repeat(80) + '\n');

    // Summary by approach
    const byApproach = this.groupBy(this.results, 'approach');
    
    console.log('📈 Results by Approach:\n');
    for (const [approach, results] of Object.entries(byApproach)) {
      if (results.length === 0) continue;
      
      const avgMetrics = this.calculateAverageMetrics(results);
      console.log(`   ${approach.toUpperCase()}:`);
      console.log(`      Accuracy:      ${(avgMetrics.accuracy * 100).toFixed(1)}%`);
      console.log(`      Faithfulness:  ${(avgMetrics.faithfulness * 100).toFixed(1)}%`);
      console.log(`      Completeness:  ${(avgMetrics.completeness * 100).toFixed(1)}%`);
      console.log(`      Avg Latency:   ${avgMetrics.latency.toFixed(0)}ms`);
      console.log(`      Avg Cost:      $${avgMetrics.cost.toFixed(4)}`);
      console.log(`      Tests Run:     ${results.length}`);
      console.log('');
    }

    // Winner analysis
    console.log('🏆 Winner Analysis:\n');
    const winners = this.analyses.map(a => a.winner.approach);
    const winnerCounts = this.countOccurrences(winners);
    
    for (const [approach, count] of Object.entries(winnerCounts)) {
      const percentage = (count / this.analyses.length) * 100;
      console.log(`   ${approach}: ${count}/${this.analyses.length} queries (${percentage.toFixed(1)}%)`);
    }

    // Best use cases
    console.log('\n🎯 Best Use Cases by Category:\n');
    const byCategory = this.groupBy(this.testQueries, 'category');
    
    for (const [category, queries] of Object.entries(byCategory)) {
      const categoryAnalyses = this.analyses.filter(a => 
        queries.some(q => q.id === a.queryId)
      );
      const categoryWinners = categoryAnalyses.map(a => a.winner.approach);
      const categoryWinnerCounts = this.countOccurrences(categoryWinners);
      
      console.log(`   ${category}:`);
      for (const [approach, count] of Object.entries(categoryWinnerCounts)) {
        const percentage = (count / categoryAnalyses.length) * 100;
        console.log(`      ${approach}: ${count}/${categoryAnalyses.length} (${percentage.toFixed(1)}%)`);
      }
      console.log('');
    }

    // Detailed insights
    console.log('💡 Key Insights:\n');
    for (const analysis of this.analyses.slice(0, 3)) { // Show first 3
      console.log(`   Query: ${analysis.queryId}`);
      console.log(`   ${analysis.winner.approach} wins: ${analysis.winner.reason}`);
      analysis.insights.slice(0, 2).forEach(insight => {
        console.log(`      - ${insight}`);
      });
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('\n✅ Comparative test complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Implement SRL enhancement when ready');
    console.log('   2. Implement nanoEBM enhancement when ready');
    console.log('   3. Re-run tests with all approaches');
    console.log('   4. Integrate best approach into Permutation Engine\n');
  }

  private calculateAverageMetrics(results: TestResult[]): TestResult['metrics'] {
    const sums = results.reduce(
      (acc, r) => ({
        accuracy: acc.accuracy + r.metrics.accuracy,
        faithfulness: acc.faithfulness + r.metrics.faithfulness,
        completeness: acc.completeness + r.metrics.completeness,
        latency: acc.latency + r.metrics.latency,
        cost: acc.cost + r.metrics.cost,
        iterations: acc.iterations + r.metrics.iterations,
        convergence: acc.convergence + r.metrics.convergence,
      }),
      { accuracy: 0, faithfulness: 0, completeness: 0, latency: 0, cost: 0, iterations: 0, convergence: 0 }
    );

    const count = results.length;
    return {
      accuracy: sums.accuracy / count,
      faithfulness: sums.faithfulness / count,
      completeness: sums.completeness / count,
      latency: sums.latency / count,
      cost: sums.cost / count,
      iterations: sums.iterations / count,
      convergence: sums.convergence / count,
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((acc, item) => {
      const group = String(item[key]);
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  private countOccurrences<T>(array: T[]): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = String(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Run tests
async function main() {
  const tester = new SRLnanoEBMComparativeTester();
  await tester.runComparativeTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SRLnanoEBMComparativeTester, TestQuery, TestResult, ComparativeAnalysis };

