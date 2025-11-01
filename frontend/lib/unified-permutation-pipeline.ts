/**
 * UNIFIED PERMUTATION PIPELINE
 * 
 * Integrates ALL components into one cohesive execution pipeline:
 * 1. ACE (Agentic Context Engineering) - Generator, Reflector, Curator
 * 2. GEPA (Genetic-Pareto Evolution) - Prompt optimization
 * 3. IRT (Item Response Theory) - Difficulty routing
 * 4. RVS (Recursive Verification System) - Iterative refinement
 * 5. DSPy - Module compilation and optimization
 * 6. Semiotic Inference - Deduction, Induction, Abduction, Creative Imagination
 * 7. Teacher-Student - Perplexity + Local model learning
 * 
 * This is the COMPLETE integration that coordinates everything.
 */

import { ACEFramework } from './ace-framework';
import { gepaAlgorithms } from './gepa-algorithms';
import { calculateIRT } from './irt-calculator';
import { RVS, type RVSStep, type RVSResult } from './trm';
import { dspyGEPAOptimizer } from './dspy-gepa-optimizer';
import { dspyRegistry, type DSPyModule } from './dspy-signatures';
import { ComprehensiveSemioticSystem } from '../../lib/semiotic-inference-system';
import { teacherStudentSystem } from './teacher-student-system';
import { getTracer } from './dspy-observability';
import { decideSRL_EBM_Routing } from './srl-ebm-router';
import { EBMAnswerRefiner } from './ebm/answer-refiner-simple';
import { SWiRLSRLEnhancer } from './srl/swirl-srl-enhancer';
import { SWiRLDecompositionResult } from './swirl-decomposer';

export interface UnifiedPipelineConfig {
  enableACE: boolean;
  enableGEPA: boolean;
  enableIRT: boolean;
  enableRVS: boolean;
  enableDSPy: boolean;
  enableSemiotic: boolean;
  enableTeacherStudent: boolean;
  enableSWiRL?: boolean;     // Multi-step reasoning decomposition
  enableSRL?: boolean;        // SRL enhancement for SWiRL
  enableEBM?: boolean;        // Energy-based answer refinement
  optimizationMode: 'quality' | 'speed' | 'balanced';
}

export interface UnifiedPipelineResult {
  answer: string;
  reasoning: {
    deduction: any;      // Formal logic
    induction: any;      // Experience-based
    abduction: any;      // Creative hypothesis
    synthesis: any;      // Combined semiotic
  };
  metadata: {
    domain: string;
    irt_difficulty: number;
    quality_score: number;
    confidence: number;
    components_used: string[];
    performance: {
      total_time_ms: number;
      cost: number;
      teacher_calls: number;
      student_calls: number;
    };
    ebm_refined?: boolean;
    ebm_refinement_steps?: number;
    ebm_energy_improvement?: number;
  };
  trace: {
    steps: PipelineStep[];
    optimization_history: any[];
    semiotic_analysis: any;
    learning_session: any;
  };
}

export interface PipelineStep {
  component: string;
  phase: 'routing' | 'optimization' | 'inference' | 'verification' | 'learning';
  input: any;
  output: any;
  duration_ms: number;
  status: 'success' | 'failed' | 'skipped';
  metadata?: any;
}

/**
 * Unified Permutation Pipeline
 * The complete integration of all systems
 */
export class UnifiedPermutationPipeline {
  private config: UnifiedPipelineConfig;
  private aceFramework: ACEFramework;
  private irtCalculator: typeof calculateIRT;
  private rvs: RVS;
  private semioticSystem: ComprehensiveSemioticSystem;
  private tracer: any;
  
  // Performance tracking
  private executionCount = 0;
  private totalExecutionTime = 0;
  private averageQuality = 0;
  
  constructor(config?: Partial<UnifiedPipelineConfig>) {
    this.config = {
      enableACE: true,
      enableGEPA: true,
      enableIRT: true,
      enableRVS: true,
      enableDSPy: true,
      enableSemiotic: true,
      enableTeacherStudent: true,
      enableSWiRL: true,
      enableSRL: true,
      enableEBM: true,
      optimizationMode: 'balanced',
      ...config
    };

    // Initialize with null model - will be set when executing queries
    // Use optimized ACE framework if GEPA is enabled (lazy load in processQuery)
    this.aceFramework = new ACEFramework(null as any);
    this.irtCalculator = calculateIRT;
    this.rvs = new RVS();
    this.semioticSystem = new ComprehensiveSemioticSystem();
    this.tracer = getTracer();
    
    console.log('🚀 Unified Permutation Pipeline initialized');
    console.log('   Components:', this.getEnabledComponents());
  }
  
  /**
   * MAIN PIPELINE EXECUTION
   * Orchestrates all components in optimal order
   */
  async execute(query: string, domain?: string, context?: any): Promise<UnifiedPipelineResult> {
    const startTime = Date.now();
    const sessionId = this.tracer.startSession(`unified-pipeline-${Date.now()}`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 UNIFIED PERMUTATION PIPELINE EXECUTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Query: ${query.substring(0, 60)}...`);
    console.log(`🏢 Domain: ${domain || 'auto-detect'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const steps: PipelineStep[] = [];
    const optimizationHistory: any[] = [];
    let teacherCalls = 0;
    let studentCalls = 0;
    let totalCost = 0;
    
    try {
      // ============================================================
      // PHASE 1: ROUTING & DIFFICULTY ASSESSMENT (IRT)
      // ============================================================
      console.log('📊 PHASE 1: ROUTING & DIFFICULTY ASSESSMENT');
      const routingStart = Date.now();
      
      const detectedDomain = domain || await this.detectDomain(query);
      let irtDifficulty = 0.5;
      
      if (this.config.enableIRT) {
        irtDifficulty = await this.irtCalculator(query, detectedDomain);
        console.log(`   ✓ IRT Difficulty: ${irtDifficulty.toFixed(3)} (${this.getDifficultyLabel(irtDifficulty)})`);
        
        steps.push({
          component: 'IRT Calculator',
          phase: 'routing',
          input: { query, domain: detectedDomain },
          output: { difficulty: irtDifficulty, expectedAccuracy: 0.85 }, // PERMUTATION's ability
          duration_ms: Date.now() - routingStart,
          status: 'success'
        });
      }
      
      console.log(`   ⏱️  Phase 1 completed in ${Date.now() - routingStart}ms\n`);
      
      // ============================================================
      // PHASE 2: SEMIOTIC INFERENCE (Deduction + Induction + Abduction)
      // ============================================================
      console.log('🔮 PHASE 2: SEMIOTIC INFERENCE');
      const semioticStart = Date.now();
      
      let semioticAnalysis: any = null;
      let deduction: any = null;
      let induction: any = null;
      let abduction: any = null;
      let synthesis: any = null;
      
      if (this.config.enableSemiotic) {
        console.log('   → Performing comprehensive semiotic inference...');
        semioticAnalysis = await this.semioticSystem.executeSemioticAnalysis(query, context || {});
        
        deduction = semioticAnalysis.inference.deduction;
        induction = semioticAnalysis.inference.induction;
        abduction = semioticAnalysis.inference.abduction;
        synthesis = semioticAnalysis.inference.synthesis;
        
        console.log(`   ✓ Deduction (Formal Logic): ${deduction.confidence.toFixed(2)} confidence`);
        console.log(`   ✓ Induction (Experience): ${induction.confidence.toFixed(2)} confidence`);
        console.log(`   ✓ Abduction (Imagination): ${abduction.confidence.toFixed(2)} confidence`);
        console.log(`   ✓ Synthesis: ${synthesis.overallConfidence.toFixed(2)} overall confidence`);
        
        steps.push({
          component: 'Semiotic Inference System',
          phase: 'inference',
          input: { query, context },
          output: {
            deduction: { confidence: deduction.confidence, evidence: deduction.evidence.length },
            induction: { confidence: induction.confidence, patterns: induction.evidence.length },
            abduction: { confidence: abduction.confidence, hypotheses: abduction.evidence.length },
            synthesis: { confidence: synthesis.overallConfidence }
          },
          duration_ms: Date.now() - semioticStart,
          status: 'success',
          metadata: semioticAnalysis
        });
      } else {
        // Fallback to simple logical inference
        deduction = { type: 'deduction', confidence: 0.7, reasoning: 'Simple logical inference', evidence: [] };
        induction = { type: 'induction', confidence: 0.6, reasoning: 'Pattern-based inference', evidence: [] };
        abduction = { type: 'abduction', confidence: 0.5, reasoning: 'Hypothesis formation', evidence: [] };
        synthesis = { overallConfidence: 0.6 };
      }
      
      console.log(`   ⏱️  Phase 2 completed in ${Date.now() - semioticStart}ms\n`);
      
      // ============================================================
      // PHASE 3: ACE FRAMEWORK (for complex queries)
      // ============================================================
      console.log('🧠 PHASE 3: ACE FRAMEWORK');
      const aceStart = Date.now();
      
      let aceResult: any = null;
      
      if (this.config.enableACE && irtDifficulty > 0.7) {
        console.log('   → Running ACE (Generator → Reflector → Curator)...');
        
        // Use optimized ACE if GEPA is enabled
        if (this.config.enableGEPA) {
          const { OptimizedACEFramework } = await import('./ace-framework-optimized');
          const optimizedACE = new OptimizedACEFramework(null as any, undefined, {
            enableOptimization: true,
            minImprovement: 10,
            cacheOptimizations: true
          });
          aceResult = await optimizedACE.processQuery(query, detectedDomain);
          console.log(`   ✓ PromptMII+GEPA optimization: Applied`);
        } else {
          aceResult = await this.aceFramework.processQuery(query, detectedDomain);
        }
        
        console.log(`   ✓ Generator: ${aceResult.generator?.actions?.length || 0} actions`);
        console.log(`   ✓ Reflector: ${aceResult.reflector?.insights?.length || 0} insights`);
        console.log(`   ✓ Curator: ${aceResult.curator?.bullets?.length || 0} bullets curated`);
        
        steps.push({
          component: 'ACE Framework',
          phase: 'optimization',
          input: { query, domain: detectedDomain, difficulty: irtDifficulty },
          output: {
            ...aceResult,
            promptmii_gepa_applied: this.config.enableGEPA, // Mark optimization status
            optimization_note: this.config.enableGEPA ? 'Using OptimizedACEFramework with PromptMII+GEPA' : 'Standard ACE Framework'
          },
          duration_ms: Date.now() - aceStart,
          status: 'success'
        });
      } else {
        console.log(`   ⊘ Skipped (difficulty ${irtDifficulty.toFixed(2)} < 0.7 threshold)`);
      }
      
      console.log(`   ⏱️  Phase 3 completed in ${Date.now() - aceStart}ms\n`);
      
      // ============================================================
      // PHASE 4: DSPy MODULE OPTIMIZATION WITH GEPA
      // ============================================================
      console.log('🎯 PHASE 4: DSPy + GEPA OPTIMIZATION');
      const dspyStart = Date.now();
      
      let dspyResult: any = null;
      
      if (this.config.enableDSPy && this.config.enableGEPA) {
        console.log('   → Selecting and optimizing DSPy module...');
        
        // Select appropriate module for domain
        const moduleName = this.selectDSPyModule(detectedDomain);
        const module = dspyRegistry.getModule(moduleName);
        
        if (module) {
          console.log(`   → Optimizing ${moduleName} with GEPA...`);
          dspyResult = await dspyGEPAOptimizer.compile(module);
          
          optimizationHistory.push({
            component: 'DSPy-GEPA',
            improvement: dspyResult.improvement,
            timestamp: new Date()
          });
          
          console.log(`   ✓ Quality improvement: ${(dspyResult.improvement.quality_delta * 100).toFixed(1)}%`);
          console.log(`   ✓ Speed improvement: ${dspyResult.improvement.speed_delta.toFixed(0)}ms`);
          console.log(`   ✓ Cost reduction: $${dspyResult.improvement.cost_delta.toFixed(4)}`);
          
          steps.push({
            component: 'DSPy-GEPA Optimizer',
            phase: 'optimization',
            input: { module: moduleName, domain: detectedDomain },
            output: dspyResult,
            duration_ms: Date.now() - dspyStart,
            status: 'success'
          });
        }
      } else if (this.config.enableGEPA) {
        console.log('   → Running standalone GEPA optimization...');
        const gepaResult = await gepaAlgorithms.optimizePrompts(
          detectedDomain,
          [query],
          ['quality', 'speed', 'cost']
        );
        
        optimizationHistory.push({
          component: 'GEPA',
          generations: gepaResult.optimization_metrics.generations_evolved,
          timestamp: new Date()
        });
        
        console.log(`   ✓ GEPA: ${gepaResult.evolved_prompts.length} prompts evolved`);
        
        steps.push({
          component: 'GEPA Algorithms',
          phase: 'optimization',
          input: { basePrompts: [query], domain: detectedDomain },
          output: gepaResult,
          duration_ms: Date.now() - dspyStart,
          status: 'success'
        });
      } else {
        console.log(`   ⊘ Skipped`);
      }
      
      console.log(`   ⏱️  Phase 4 completed in ${Date.now() - dspyStart}ms\n`);
      
      // ============================================================
      // PHASE 5: TEACHER-STUDENT LEARNING
      // ============================================================
      console.log('🎓 PHASE 5: TEACHER-STUDENT LEARNING');
      const teacherStudentStart = Date.now();
      
      let learningSession: any = null;
      let teacherResponse: any = null;
      let studentResponse: any = null;
      
      if (this.config.enableTeacherStudent) {
        console.log('   → Teacher (Perplexity) processing with web search...');
        console.log('   → Student (Local Model) learning from Teacher...');
        
        try {
          const tsResult = await teacherStudentSystem.processQuery(query, detectedDomain);
          teacherResponse = tsResult.teacher_response;
          studentResponse = tsResult.student_response;
          learningSession = tsResult.learning_session;
          
          teacherCalls = 1;
          studentCalls = 1;
          totalCost += 0.01; // Estimate
          
          console.log(`   ✓ Teacher: ${teacherResponse.sources.length} sources, ${teacherResponse.confidence.toFixed(2)} confidence`);
          console.log(`   ✓ Student: ${studentResponse.confidence.toFixed(2)} confidence, learned: ${studentResponse.learned_from_teacher}`);
          console.log(`   ✓ Learning effectiveness: ${learningSession.learning_effectiveness.toFixed(2)}`);
          
          steps.push({
            component: 'Teacher-Student System',
            phase: 'learning',
            input: { query, domain: detectedDomain },
            output: {
              teacher: { confidence: teacherResponse.confidence, sources: teacherResponse.sources.length },
              student: { confidence: studentResponse.confidence, learned: studentResponse.learned_from_teacher },
              effectiveness: learningSession.learning_effectiveness
            },
            duration_ms: Date.now() - teacherStudentStart,
            status: 'success',
            metadata: learningSession
          });
        } catch (error) {
          console.log(`   ⚠️  Teacher-Student system unavailable: ${error}`);
        }
      } else {
        console.log(`   ⊘ Skipped`);
      }
      
      console.log(`   ⏱️  Phase 5 completed in ${Date.now() - teacherStudentStart}ms\n`);
      
      // ============================================================
      // PHASE 6: SWIRL + SRL MULTI-STEP REASONING (if enabled)
      // ============================================================
      console.log('📚 PHASE 6: SWiRL × SRL MULTI-STEP REASONING');
      const swirlStart = Date.now();
      
      let swirlResult: any[] | null = null;
      let srlReward = 0;
      
      if (this.config.enableSWiRL && irtDifficulty > 0.6) {
        console.log('   → Decomposing query into multi-step reasoning...');
        
        try {
          // Create OPTIMIZED SWiRL decomposition (with PromptMII+GEPA)
          const { createOptimizedSWiRLDecomposer } = await import('./swirl-optimized');
          const decomposer = createOptimizedSWiRLDecomposer({
            enableOptimization: true,
            minImprovement: 10,
            cacheOptimizations: true
          });
          const availableTools = ['web_search', 'calculator', 'sql'];
          
          if (this.config.enableSRL) {
            console.log('   → Applying SRL enhancement with expert trajectories...');
            const { loadExpertTrajectories } = await import('./srl/swirl-srl-enhancer');
            const expertTrajectories = await loadExpertTrajectories(detectedDomain);
            
            if (expertTrajectories.length > 0) {
              const srlEnhancer = new SWiRLSRLEnhancer({
                expertTrajectories,
                stepRewardWeight: 0.6,
                finalRewardWeight: 0.4,
                reasoningGeneration: true,
                similarityThreshold: 0.5
              });
              
              const decomposition = await decomposer.decompose(query, availableTools);
              const enhanced = await srlEnhancer.enhanceWithSRL(decomposition, query, detectedDomain);
              
              swirlResult = enhanced.trajectory.steps.map((s: any) => ({
                step: s.step_number,
                action: s.description,
                stepReward: s.stepReward || 0
              }));
              srlReward = enhanced.averageStepReward;
              
              console.log(`   ✓ SRL enhancement: ${swirlResult.length} steps, avg reward: ${srlReward.toFixed(3)}`);
            } else {
              const decomposition = await decomposer.decompose(query, availableTools);
              swirlResult = decomposition.trajectory.steps.map((s: any) => ({
                step: s.step_number,
                action: s.description
              }));
              console.log(`   ✓ SWiRL decomposition: ${swirlResult.length} steps (no expert trajectory match)`);
            }
          } else {
            const decomposition = await decomposer.decompose(query, availableTools);
            swirlResult = decomposition.trajectory.steps.map((s: any) => ({
              step: s.step_number,
              action: s.description
            }));
            console.log(`   ✓ SWiRL decomposition: ${swirlResult.length} steps`);
          }
          
          steps.push({
            component: 'SWiRL × SRL',
            phase: 'inference',
            input: { query, domain: detectedDomain },
            output: { 
              steps: swirlResult.length, 
              averageReward: srlReward,
              promptmii_gepa_applied: true, // Mark that PromptMII+GEPA was used
              optimization_note: 'Using OptimizedSWiRLDecomposer with PromptMII+GEPA'
            },
            duration_ms: Date.now() - swirlStart,
            status: 'success'
          });
        } catch (error) {
          console.log(`   ⚠️ SWiRL/SRL unavailable: ${error}`);
        }
      } else {
        console.log(`   ⊘ Skipped (difficulty ${irtDifficulty.toFixed(2)} < 0.6 threshold or SWiRL disabled)`);
      }
      
      console.log(`   ⏱️  Phase 6 completed in ${Date.now() - swirlStart}ms\n`);
      
      // ============================================================
      // PHASE 7: RECURSIVE VERIFICATION SYSTEM (RVS)
      // ============================================================
      console.log('🔄 PHASE 7: RECURSIVE VERIFICATION');
      const rvsStart = Date.now();
      
      let rvsResult: RVSResult | null = null;
      
      if (this.config.enableRVS && irtDifficulty > 0.6) {
        console.log('   → Running recursive verification with adaptive computation...');
        
        // Create verification steps from previous results
        const verificationSteps: RVSStep[] = this.createVerificationSteps(
          aceResult,
          semioticAnalysis,
          teacherResponse
        );
        
        rvsResult = await this.rvs.processQuery(query, verificationSteps);
        
        console.log(`   ✓ Iterations: ${rvsResult.iterations}`);
        console.log(`   ✓ Confidence: ${rvsResult.confidence.toFixed(2)}`);
        console.log(`   ✓ Verified: ${rvsResult.verified ? 'Yes' : 'No'}`);
        console.log(`   ✓ Refinement cycles: ${rvsResult.performance_metrics.refinement_cycles}`);
        
        steps.push({
          component: 'RVS (Recursive Verification System)',
          phase: 'verification',
          input: { query, steps: verificationSteps.length },
          output: {
            iterations: rvsResult.iterations,
            confidence: rvsResult.confidence,
            verified: rvsResult.verified,
            metrics: rvsResult.performance_metrics
          },
          duration_ms: Date.now() - rvsStart,
          status: 'success'
        });
      } else {
        console.log(`   ⊘ Skipped (difficulty ${irtDifficulty.toFixed(2)} < 0.6 threshold)`);
      }
      
      console.log(`   ⏱️  Phase 7 completed in ${Date.now() - rvsStart}ms\n`);
      
      // ============================================================
      // PHASE 8: SYNTHESIS & FINAL ANSWER
      // ============================================================
      console.log('🎨 PHASE 8: SYNTHESIS & FINAL ANSWER');
      const synthesisStart = Date.now();
      
      let finalAnswer = this.synthesizeFinalAnswer({
        query,
        semioticSynthesis: synthesis,
        aceResult,
        dspyResult,
        teacherResponse,
        studentResponse,
        rvsResult,
        domain: detectedDomain
      });
      
      let qualityScore = this.calculateQualityScore({
        semioticConfidence: synthesis?.overallConfidence || 0.5,
        teacherConfidence: teacherResponse?.confidence || 0.5,
        studentConfidence: studentResponse?.confidence || 0.5,
        rvsConfidence: rvsResult?.confidence || 0.5,
        verified: rvsResult?.verified || false
      });
      
      console.log(`   ✓ Final answer synthesized`);
      console.log(`   ✓ Quality score: ${qualityScore.toFixed(3)}`);
      
      // ============================================================
      // PHASE 7.5: EBM REFINEMENT (if needed) ⚡
      // ============================================================
      const ebmStart = Date.now();
      let ebmRefined = false;
      let ebmRefinementSteps = 0;
      let ebmEnergyImprovement = 0;
      let ebmRefinedAnswer = finalAnswer;
      
      const routingDecision = await decideSRL_EBM_Routing(query, detectedDomain, {
        initialAnswer: finalAnswer,
        answerQuality: qualityScore
      });
      
      if (routingDecision.useEBM) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`⚡ EBM: ENERGY-BASED REFINEMENT`);
        console.log(`${'─'.repeat(60)}\n`);
        console.log(`   Routing decision: ${routingDecision.reasoning}`);
        console.log(`   Confidence: ${(routingDecision.confidence * 100).toFixed(1)}%`);
        console.log(`   Initial quality: ${qualityScore.toFixed(3)}`);
        
        try {
          const refiner = new EBMAnswerRefiner({
            refinementSteps: 3,
            learningRate: 0.5,
            noiseScale: 0.01,
            temperature: 0.8,
            energyFunction: 'combined'
          });
          
          // Build context for EBM
          const ebmContext = [
            aceResult ? `ACE Strategies: ${JSON.stringify(aceResult.curator?.bullets?.slice(0, 3) || [])}` : '',
            semioticAnalysis ? `Semiotic: ${JSON.stringify(semioticAnalysis?.inference || {})}` : '',
            teacherResponse ? `Teacher: ${teacherResponse.response?.substring(0, 200) || ''}` : '',
            studentResponse ? `Student: ${studentResponse.response?.substring(0, 200) || ''}` : ''
          ].filter(Boolean).join('\n');
          
          const refinementResult = await refiner.refine(
            query,
            ebmContext || 'No additional context available',
            finalAnswer
          );
          
          ebmRefinedAnswer = refinementResult.refinedAnswer;
          ebmRefinementSteps = refinementResult.stepsCompleted;
          ebmEnergyImprovement = refinementResult.improvement; // Use improvement field
          ebmRefined = true;
          
          // Update quality score if refinement improved energy
          if (ebmEnergyImprovement > 0) {
            qualityScore = Math.min(1.0, qualityScore + (ebmEnergyImprovement * 0.1));
          }
          
          console.log(`   ✅ EBM refinement complete!`);
          console.log(`   - Steps: ${ebmRefinementSteps}`);
          console.log(`   - Energy improvement: ${ebmEnergyImprovement.toFixed(4)}`);
          console.log(`   - Final quality: ${qualityScore.toFixed(3)}`);
          
          steps.push({
            component: 'EBM Answer Refiner',
            phase: 'verification',
            input: { query, initialAnswer: finalAnswer.substring(0, 200) + '...' },
            output: {
              refinedAnswer: ebmRefinedAnswer.substring(0, 200) + '...',
              steps: ebmRefinementSteps,
              energyImprovement: ebmEnergyImprovement
            },
            duration_ms: Date.now() - ebmStart,
            status: 'success'
          });
        } catch (error) {
          console.error(`   ❌ EBM refinement failed:`, error);
          steps.push({
            component: 'EBM Answer Refiner',
            phase: 'verification',
            input: { query },
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
            duration_ms: Date.now() - ebmStart,
            status: 'failed'
          });
        }
      } else {
        console.log(`   ⊘ EBM skipped: ${routingDecision.reasoning}`);
      }
      
      // Use refined answer if available
      finalAnswer = ebmRefined ? ebmRefinedAnswer : finalAnswer;
      
      console.log(`   ⏱️  Phase 8 completed in ${Date.now() - synthesisStart}ms\n`);
      
      // ============================================================
      // FINAL METRICS & SUMMARY
      // ============================================================
      const totalTime = Date.now() - startTime;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ PIPELINE EXECUTION COMPLETE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`⏱️  Total Time: ${totalTime}ms`);
      console.log(`📊 Quality Score: ${qualityScore.toFixed(3)}`);
      console.log(`🎯 Components Used: ${steps.length}`);
      console.log(`💰 Estimated Cost: $${totalCost.toFixed(4)}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Update performance tracking
      this.executionCount++;
      this.totalExecutionTime += totalTime;
      this.averageQuality = (this.averageQuality * (this.executionCount - 1) + qualityScore) / this.executionCount;
      
      this.tracer.endSession(sessionId, {
        success: true,
        qualityScore,
        totalTime,
        componentsUsed: steps.length
      });
      
      return {
        answer: finalAnswer,
        reasoning: {
          deduction,
          induction,
          abduction,
          synthesis
        },
        metadata: {
          domain: detectedDomain,
          irt_difficulty: irtDifficulty,
          quality_score: qualityScore,
          confidence: synthesis?.overallConfidence || 0.5,
          components_used: steps.map(s => s.component),
          performance: {
            total_time_ms: totalTime,
            cost: totalCost,
            teacher_calls: teacherCalls,
            student_calls: studentCalls
          },
          ebm_refined: ebmRefined,
          ebm_refinement_steps: ebmRefinementSteps,
          ebm_energy_improvement: ebmEnergyImprovement
        },
        trace: {
          steps,
          optimization_history: optimizationHistory,
          semiotic_analysis: semioticAnalysis,
          learning_session: learningSession
        }
      };
      
    } catch (error) {
      console.error('❌ Pipeline execution failed:', error);
      this.tracer.endSession(sessionId, { success: false, error: String(error) });
      throw error;
    }
  }
  
  /**
   * Helper: Detect domain from query
   */
  private async detectDomain(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    if (/\b(art|artist|painting|sculpture|gallery)\b/i.test(lowerQuery)) return 'art';
    if (/\b(legal|law|contract|court|jurisdiction)\b/i.test(lowerQuery)) return 'legal';
    if (/\b(business|finance|market|trading|investment)\b/i.test(lowerQuery)) return 'business';
    if (/\b(science|research|study|experiment)\b/i.test(lowerQuery)) return 'science';
    if (/\b(philosophy|ethics|ontology|epistemology)\b/i.test(lowerQuery)) return 'philosophy';
    
    return 'general';
  }
  
  /**
   * Helper: Get difficulty label
   */
  private getDifficultyLabel(difficulty: number): string {
    if (difficulty < 0.3) return 'Very Easy';
    if (difficulty < 0.5) return 'Easy';
    if (difficulty < 0.7) return 'Medium';
    if (difficulty < 0.9) return 'Hard';
    return 'Very Hard';
  }
  
  /**
   * Helper: Select DSPy module for domain
   */
  private selectDSPyModule(domain: string): string {
    const moduleMap: Record<string, string> = {
      'art': 'financial_analysis', // Art valuation uses financial analysis
      'legal': 'legal_analysis',
      'business': 'financial_analysis',
      'science': 'optimization',
      'philosophy': 'optimization',
      'general': 'optimization'
    };
    
    return moduleMap[domain] || 'optimization';
  }
  
  /**
   * Helper: Create verification steps from previous results
   */
  private createVerificationSteps(aceResult: any, semioticAnalysis: any, teacherResponse: any): RVSStep[] {
    const steps: RVSStep[] = [];
    
    // Step from semiotic deduction
    if (semioticAnalysis?.inference?.deduction) {
      steps.push({
        step: 1,
        action: 'Verify deductive reasoning',
        tool: 'semiotic-deduction',
        reasoning: semioticAnalysis.inference.deduction.reasoning,
        confidence: semioticAnalysis.inference.deduction.confidence
      });
    }
    
    // Step from ACE if available
    if (aceResult?.generator) {
      steps.push({
        step: 2,
        action: 'Verify ACE generator output',
        tool: 'ace-generator',
        reasoning: 'ACE generated actions and strategies',
        confidence: 0.8
      });
    }
    
    // Step from teacher if available
    if (teacherResponse) {
      steps.push({
        step: 3,
        action: 'Verify teacher model response',
        tool: 'teacher-model',
        reasoning: teacherResponse.answer,
        confidence: teacherResponse.confidence
      });
    }
    
    // If no steps, create a default one
    if (steps.length === 0) {
      steps.push({
        step: 1,
        action: 'Verify query understanding',
        tool: 'default',
        reasoning: 'Basic query verification',
        confidence: 0.6
      });
    }
    
    return steps;
  }
  
  /**
   * Helper: Synthesize final answer from all components
   */
  private synthesizeFinalAnswer(components: any): string {
    const { query, semioticSynthesis, aceResult, teacherResponse, studentResponse, rvsResult, domain } = components;
    
    let answer = `# Comprehensive Analysis: ${query}\n\n`;
    
    // Add semiotic reasoning
    if (semioticSynthesis) {
      answer += `## Semiotic Analysis (Confidence: ${(semioticSynthesis.overallConfidence * 100).toFixed(0)}%)\n\n`;
      answer += `**Deductive Reasoning (Formal Logic):** ${semioticSynthesis.reasoning.deductive}\n\n`;
      answer += `**Inductive Reasoning (Experience-Based):** ${semioticSynthesis.reasoning.inductive}\n\n`;
      answer += `**Abductive Reasoning (Creative Imagination):** ${semioticSynthesis.reasoning.abductive}\n\n`;
    }
    
    // Add teacher insights
    if (teacherResponse) {
      answer += `## Expert Analysis (Web-Enhanced)\n\n`;
      answer += `${teacherResponse.answer}\n\n`;
      if (teacherResponse.sources.length > 0) {
        answer += `**Sources:** ${teacherResponse.sources.slice(0, 3).join(', ')}\n\n`;
      }
    }
    
    // Add student learning perspective
    if (studentResponse) {
      answer += `## Local Model Perspective\n\n`;
      answer += `${studentResponse.answer}\n\n`;
    }
    
    // Add RVS verification
    if (rvsResult && rvsResult.verified) {
      answer += `## Verification Status\n\n`;
      answer += `✅ **Verified** through ${rvsResult.iterations} iterative refinement cycles\n`;
      answer += `Confidence: ${(rvsResult.confidence * 100).toFixed(0)}%\n\n`;
    }
    
    // Add ACE insights
    if (aceResult) {
      answer += `## Strategic Insights\n\n`;
      answer += `ACE Framework applied with ${aceResult.curator?.bullets?.length || 0} curated strategies.\n\n`;
    }
    
    answer += `\n---\n*Generated by Unified Permutation Pipeline • Domain: ${domain}*`;
    
    return answer;
  }
  
  /**
   * Helper: Calculate overall quality score
   */
  private calculateQualityScore(components: any): number {
    const {
      semioticConfidence,
      teacherConfidence,
      studentConfidence,
      rvsConfidence,
      verified
    } = components;
    
    // Weighted average with bonus for verification
    let score = (
      semioticConfidence * 0.3 +
      teacherConfidence * 0.3 +
      studentConfidence * 0.2 +
      rvsConfidence * 0.2
    );
    
    // Bonus for verification
    if (verified) {
      score = Math.min(1.0, score + 0.1);
    }
    
    return score;
  }
  
  /**
   * Get enabled components list
   */
  private getEnabledComponents(): string[] {
    const components: string[] = [];
    
    if (this.config.enableACE) components.push('ACE');
    if (this.config.enableGEPA) components.push('GEPA');
    if (this.config.enableIRT) components.push('IRT');
    if (this.config.enableRVS) components.push('RVS');
    if (this.config.enableDSPy) components.push('DSPy');
    if (this.config.enableSemiotic) components.push('Semiotic');
    if (this.config.enableTeacherStudent) components.push('Teacher-Student');
    
    return components;
  }
  
  /**
   * Get pipeline performance metrics
   */
  getPerformanceMetrics(): any {
    return {
      executions: this.executionCount,
      avg_execution_time_ms: this.executionCount > 0 ? this.totalExecutionTime / this.executionCount : 0,
      avg_quality_score: this.averageQuality,
      enabled_components: this.getEnabledComponents(),
      optimization_mode: this.config.optimizationMode
    };
  }
  
  /**
   * Update pipeline configuration
   */
  updateConfig(newConfig: Partial<UnifiedPipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Pipeline configuration updated:', this.config);
  }
}

/**
 * Export singleton instance
 */
export const unifiedPipeline = new UnifiedPermutationPipeline();

/**
 * Convenience function to execute pipeline
 */
export async function executeUnifiedPipeline(
  query: string,
  domain?: string,
  context?: any,
  config?: Partial<UnifiedPipelineConfig>
): Promise<UnifiedPipelineResult> {
  const pipeline = config ? new UnifiedPermutationPipeline(config) : unifiedPipeline;
  return await pipeline.execute(query, domain, context);
}

