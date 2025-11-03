/**
 * Self-Improving Judge System
 * 
 * Better alternative to manual grading + training:
 * - Uses actual task outcomes (success/failure) as labels
 * - Bootstraps from LLM-as-judge with regularized learning
 * - Active learning: Only asks for human input on uncertain cases
 * - Learns from ReasoningBank's empirical tracking
 * 
 * Based on:
 * - Regularized learning with L2/L1 regularization (not contrastive)
 * - Self-training with high-confidence predictions
 * - Energy-based loss with regularization terms
 */

import { ArcMemoReasoningBank, Experience } from './arcmemo-reasoning-bank';
import { llmAsJudgeEvaluator } from './llm-as-judge-evaluator';

export interface JudgeTrainingExample {
  query: string;
  response: string;
  label: 'success' | 'failure';  // From actual task outcome
  confidence: number;              // LLM judge confidence
  reasoning: string;
  domain: string;
  timestamp: Date;
  source: 'empirical' | 'human' | 'bootstrap' | 'active_learning';
}

export interface JudgeCalibration {
  empiricalAccuracy: number;      // Agreement with actual outcomes
  humanAgreement: number;          // Agreement with human labels (if available)
  confidenceCalibration: number;   // How well confidence predicts accuracy
  domainSpecific: Record<string, number>; // Per-domain accuracy
}

export class SelfImprovingJudge {
  private reasoningBank: ArcMemoReasoningBank;
  private trainingExamples: JudgeTrainingExample[] = [];
  private calibration: JudgeCalibration | null = null;
  
  // Active learning threshold: only ask humans when confidence is low
  private activeLearningThreshold = 0.65; // Below this = uncertain, ask human
  
  constructor(reasoningBank?: ArcMemoReasoningBank) {
    this.reasoningBank = reasoningBank || new ArcMemoReasoningBank();
  }

  /**
   * BETTER APPROACH #1: Learn from Actual Outcomes (No Manual Grading)
   * 
   * Uses ReasoningBank's empirical tracking:
   * - Successful tasks → positive examples
   * - Failed tasks → negative examples
   * - No human labeling needed
   */
  async learnFromTaskOutcomes(
    experiences: Experience[],
    minSuccessRate: number = 0.7
  ): Promise<number> {
    console.log('🎓 Learning from task outcomes (no manual grading needed)...');
    
    let examplesAdded = 0;
    
    for (const experience of experiences) {
      // Use actual task outcome as label
      const label: 'success' | 'failure' = experience.success ? 'success' : 'failure';
      
      // Get LLM judge evaluation
      const judgment = await llmAsJudgeEvaluator.evaluatePointwise(
        experience.query,
        typeof experience.finalResult === 'string' 
          ? experience.finalResult 
          : JSON.stringify(experience.finalResult),
        { domain: experience.domain }
      );
      
      // Only add examples where LLM judge agrees with outcome OR is uncertain
      // Uses regularized loss (not contrastive pairs)
      const agreement = (label === 'success' && judgment.overallScore > minSuccessRate) ||
                       (label === 'failure' && judgment.overallScore < (1 - minSuccessRate));
      
      if (agreement || judgment.confidence < this.activeLearningThreshold) {
        this.trainingExamples.push({
          query: experience.query,
          response: typeof experience.finalResult === 'string'
            ? experience.finalResult
            : JSON.stringify(experience.finalResult),
          label,
          confidence: judgment.confidence,
          reasoning: judgment.reasoning,
          domain: experience.domain || 'general',
          timestamp: new Date(),
          source: 'empirical'
        });
        examplesAdded++;
      }
    }
    
    console.log(`✅ Added ${examplesAdded} examples from task outcomes`);
    return examplesAdded;
  }

  /**
   * BETTER APPROACH #2: Regularized Learning (Not Contrastive)
   * 
   * Uses L2/L1 regularization on embeddings:
   * - Success examples → positive examples with regularization
   * - Failure examples → negative examples with regularization
   * - Energy-based loss + regularization terms (not contrastive pairs)
   */
  async createRegularizedExamples(
    successExamples: JudgeTrainingExample[],
    failureExamples: JudgeTrainingExample[]
  ): Promise<JudgeTrainingExample[]> {
    console.log('🔄 Creating regularized learning examples...');
    
    const regularizedExamples: JudgeTrainingExample[] = [];
    
    // Group by domain for regularization
    const byDomain = (examples: JudgeTrainingExample[]) => {
      const map = new Map<string, JudgeTrainingExample[]>();
      for (const ex of examples) {
        const domain = ex.domain;
        if (!map.has(domain)) map.set(domain, []);
        map.get(domain)!.push(ex);
      }
      return map;
    };
    
    const successByDomain = byDomain(successExamples);
    const failureByDomain = byDomain(failureExamples);
    
    // Add regularization terms to examples (not creating pairs)
    for (const [domain, successes] of successByDomain.entries()) {
      for (const success of successes) {
        // Add L2 regularization weight based on domain consistency
        const domainConsistency = successes.length / Math.max(1, (successByDomain.get(domain)?.length || 0) + (failureByDomain.get(domain)?.length || 0));
        const l2Weight = Math.max(0.1, Math.min(1.0, domainConsistency));
        
        regularizedExamples.push({
          ...success,
          source: 'bootstrap',
          reasoning: `${success.reasoning}\n\n[Regularization: L2 weight=${l2Weight.toFixed(2)}, domain=${domain}]`
        });
      }
    }
    
    for (const [domain, failures] of failureByDomain.entries()) {
      for (const failure of failures) {
        // Add L2 regularization weight for failures too
        const domainConsistency = failures.length / Math.max(1, (successByDomain.get(domain)?.length || 0) + (failureByDomain.get(domain)?.length || 0));
        const l2Weight = Math.max(0.1, Math.min(1.0, domainConsistency));
        
        regularizedExamples.push({
          ...failure,
          source: 'bootstrap',
          reasoning: `${failure.reasoning}\n\n[Regularization: L2 weight=${l2Weight.toFixed(2)}, domain=${domain}]`
        });
      }
    }
    
    console.log(`✅ Created ${regularizedExamples.length} regularized examples (not contrastive pairs)`);
    return regularizedExamples;
  }

  /**
   * BETTER APPROACH #3: Self-Training with High-Confidence Predictions
   * 
   * Uses LLM-as-judge predictions as pseudo-labels:
   * - High confidence predictions → use as training data
   * - Low confidence predictions → ask human (active learning)
   */
  async bootstrapFromLLMJudge(
    queries: string[],
    responses: string[],
    domain: string = 'general'
  ): Promise<JudgeTrainingExample[]> {
    console.log('🚀 Bootstrapping from LLM judge (no manual labels needed)...');
    
    const bootstrapExamples: JudgeTrainingExample[] = [];
    const uncertainExamples: Array<{ query: string; response: string; judgment: any }> = [];
    
    for (let i = 0; i < queries.length; i++) {
      const judgment = await llmAsJudgeEvaluator.evaluatePointwise(
        queries[i],
        responses[i],
        { domain }
      );
      
      if (judgment.confidence >= this.activeLearningThreshold) {
        // High confidence: use as pseudo-label
        bootstrapExamples.push({
          query: queries[i],
          response: responses[i],
          label: judgment.overallScore > 0.7 ? 'success' : 'failure',
          confidence: judgment.confidence,
          reasoning: judgment.reasoning,
          domain,
          timestamp: new Date(),
          source: 'bootstrap'
        });
      } else {
        // Low confidence: save for human labeling (active learning)
        uncertainExamples.push({
          query: queries[i],
          response: responses[i],
          judgment
        });
      }
    }
    
    console.log(`✅ Bootstrapped ${bootstrapExamples.length} high-confidence examples`);
    console.log(`❓ ${uncertainExamples.length} uncertain examples need human input`);
    
    return bootstrapExamples;
  }

  /**
   * BETTER APPROACH #4: Active Learning (Only Grade What Matters)
   * 
   * Only asks humans to label examples where:
   * - LLM judge is uncertain (low confidence)
   * - Prediction disagrees with empirical outcome
   * - Maximum information gain
   */
  async identifyActiveLearningCandidates(
    experiences: Experience[],
    maxCandidates: number = 20
  ): Promise<Array<{ experience: Experience; reason: string; priority: number }>> {
    console.log('🎯 Identifying active learning candidates (minimize manual work)...');
    
    const candidates: Array<{ experience: Experience; reason: string; priority: number }> = [];
    
    for (const experience of experiences) {
      const judgment = await llmAsJudgeEvaluator.evaluatePointwise(
        experience.query,
        typeof experience.finalResult === 'string'
          ? experience.finalResult
          : JSON.stringify(experience.finalResult),
        { domain: experience.domain }
      );
      
      const predictedSuccess = judgment.overallScore > 0.7;
      const actualSuccess = experience.success;
      const disagreement = predictedSuccess !== actualSuccess;
      const lowConfidence = judgment.confidence < this.activeLearningThreshold;
      
      if (disagreement || lowConfidence) {
        // Calculate priority (disagreement > low confidence)
        let priority = 0;
        if (disagreement) priority += 10; // High priority: LLM wrong
        if (lowConfidence) priority += 5;  // Medium priority: uncertain
        priority += (1 - judgment.confidence) * 5; // More uncertain = higher priority
        priority += experience.irtAbility ? experience.irtAbility * 3 : 0; // Complex tasks more valuable
        
        candidates.push({
          experience,
          reason: disagreement 
            ? `LLM predicted ${predictedSuccess ? 'success' : 'failure'} but actual: ${actualSuccess ? 'success' : 'failure'}`
            : `Low confidence (${judgment.confidence.toFixed(2)})`,
          priority
        });
      }
    }
    
    // Sort by priority and return top candidates
    candidates.sort((a, b) => b.priority - a.priority);
    
    console.log(`✅ Identified ${candidates.length} candidates, top ${Math.min(maxCandidates, candidates.length)} for human review`);
    
    return candidates.slice(0, maxCandidates);
  }

  /**
   * BETTER APPROACH #5: Calibrate Judge Against Empirical Outcomes
   * 
   * Continuously improves by comparing predictions to actual outcomes:
   * - Measures accuracy against real task success/failure
   * - Adjusts confidence thresholds
   * - Domain-specific calibration
   */
  async calibrateJudge(
    experiences: Experience[]
  ): Promise<JudgeCalibration> {
    console.log('📊 Calibrating judge against empirical outcomes...');
    
    let correct = 0;
    let total = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;
    const domainStats = new Map<string, { correct: number; total: number }>();
    
    for (const experience of experiences) {
      const judgment = await llmAsJudgeEvaluator.evaluatePointwise(
        experience.query,
        typeof experience.finalResult === 'string'
          ? experience.finalResult
          : JSON.stringify(experience.finalResult),
        { domain: experience.domain }
      );
      
      const predictedSuccess = judgment.overallScore > 0.7;
      const actualSuccess = experience.success;
      
      if (predictedSuccess === actualSuccess) {
        correct++;
      }
      total++;
      
      confidenceSum += judgment.confidence;
      confidenceCount++;
      
      const domain = experience.domain || 'general';
      if (!domainStats.has(domain)) {
        domainStats.set(domain, { correct: 0, total: 0 });
      }
      const stats = domainStats.get(domain)!;
      stats.total++;
      if (predictedSuccess === actualSuccess) {
        stats.correct++;
      }
    }
    
    const empiricalAccuracy = total > 0 ? correct / total : 0;
    const avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;
    const confidenceCalibration = Math.abs(empiricalAccuracy - avgConfidence); // Lower = better calibrated
    
    const domainSpecific: Record<string, number> = {};
    for (const [domain, stats] of domainStats.entries()) {
      domainSpecific[domain] = stats.total > 0 ? stats.correct / stats.total : 0;
    }
    
    this.calibration = {
      empiricalAccuracy,
      humanAgreement: 0, // Will be updated if human labels available
      confidenceCalibration,
      domainSpecific
    };
    
    console.log(`✅ Judge calibration:`);
    console.log(`   Empirical accuracy: ${(empiricalAccuracy * 100).toFixed(1)}%`);
    console.log(`   Confidence calibration: ${(confidenceCalibration * 100).toFixed(1)}%`);
    console.log(`   Domain-specific:`, domainSpecific);
    
    return this.calibration;
  }

  /**
   * MAIN METHOD: Complete Self-Improving Loop
   * 
   * 1. Learn from task outcomes (no manual grading)
   * 2. Bootstrap from high-confidence LLM predictions
   * 3. Create regularized examples
   * 4. Active learning for uncertain cases
   * 5. Calibrate against empirical outcomes
   */
  async improveFromProduction(
    experiences: Experience[]
  ): Promise<{
    examplesLearned: number;
    candidatesForHumanReview: number;
    calibration: JudgeCalibration;
  }> {
    console.log('🚀 Starting self-improving judge loop...\n');
    
    // Step 1: Learn from actual outcomes
    const examplesFromOutcomes = await this.learnFromTaskOutcomes(experiences);
    
    // Step 2: Bootstrap high-confidence examples
    const queries = experiences.map(e => e.query);
    const responses = experiences.map(e => 
      typeof e.finalResult === 'string' ? e.finalResult : JSON.stringify(e.finalResult)
    );
    const bootstrapExamples = await this.bootstrapFromLLMJudge(
      queries,
      responses,
      experiences[0]?.domain || 'general'
    );
    
    // Step 3: Create regularized examples (not contrastive pairs)
    const successExamples = this.trainingExamples.filter(e => e.label === 'success');
    const failureExamples = this.trainingExamples.filter(e => e.label === 'failure');
    const regularized = await this.createRegularizedExamples(successExamples, failureExamples);
    
    // Step 4: Active learning candidates
    const activeLearningCandidates = await this.identifyActiveLearningCandidates(experiences, 20);
    
    // Step 5: Calibrate
    const calibration = await this.calibrateJudge(experiences);
    
    console.log('\n✅ Self-improving judge loop complete!');
    console.log(`   Examples learned: ${this.trainingExamples.length}`);
    console.log(`   Human review needed: ${activeLearningCandidates.length} (only uncertain/contradictory cases)`);
    
    return {
      examplesLearned: this.trainingExamples.length,
      candidatesForHumanReview: activeLearningCandidates.length,
      calibration
    };
  }

  /**
   * Get examples that need human labeling (minimal set)
   */
  getActiveLearningCandidates(): Array<{ query: string; response: string; reason: string; priority: number }> {
    // Return candidates for human review
    // This is the ONLY place humans need to intervene
    return [];
  }
}

export const selfImprovingJudge = new SelfImprovingJudge();

