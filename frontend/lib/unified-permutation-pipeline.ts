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
import { validateQuery, sanitizeQuery, validateDomain, validateConfig } from './input-validation';
import { PipelineError, ValidationError } from './errors';
import { ReasoningHeuristicSelector } from './reasoning-heuristics';
import { createLogger } from './walt/logger';
import { pipelineCache } from './pipeline-cache';
import { circuitBreakerRegistry } from './circuit-breaker';
import { parallelExecutor } from './parallel-executor';
import { competenceTracker } from './competence-tracker';
import { detectDomain, detectDomainWithJudge, type Domain } from './domain-detector';

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
  enableToolSynthesis?: boolean; // Alita-G: Synthesize tools from trajectories
  toolSynthesisIterations?: number; // Alita-G: K iterations for multi-execution (default: 1, paper uses 3)
  enableSelfImprovingJudge?: boolean; // Self-improving judge (learns from outcomes)
  optimizationMode: 'quality' | 'speed' | 'balanced';
  // Threshold configuration for testing
  aceThreshold?: number;     // IRT threshold for ACE activation (default: 0.5, optimal from testing)
  swirlThreshold?: number;   // IRT threshold for SWiRL activation (default: 0.7, optimal from testing)
  rvsThreshold?: number;     // IRT threshold for RVS activation (default: 0.3, optimal from testing)
}

export interface UnifiedPipelineResult {
  answer: string;
  reasoning: {
    deduction: Record<string, unknown>;      // Formal logic
    induction: Record<string, unknown>;      // Experience-based
    abduction: Record<string, unknown>;      // Creative hypothesis
    synthesis: Record<string, unknown>;      // Combined semiotic
  };
  metadata: {
    domain: string;
    irt_difficulty: number;
    quality_score: number;
    confidence: number;
    components_used: string[];
    competence_metrics?: {
      formal: number;
      functional: number;
      brain_alignment: number;
      formal_saturated: boolean;
    };
    performance: {
      total_time_ms: number;
      cost: number;
      teacher_calls: number;
      student_calls: number;
    };
    ebm_refined?: boolean;
    ebm_refinement_steps?: number;
    ebm_energy_improvement?: number;
          reasoningbank_memories_extracted?: number;
          reasoningbank_memory_titles?: string[];
          reasoningbank_memories_used?: number;
          reasoningbank_memories_used_ids?: string[];
          // Alita-G tool synthesis
          tools_synthesized?: number;
          tool_names?: string[];
          // Self-improving judge
          judge_learned_from_outcome?: boolean;
          judge_calibration_accuracy?: number;
          judge_active_learning_candidates?: number;
        };
  trace: {
    steps: PipelineStep[];
    optimization_history: Array<Record<string, unknown>>;
    semiotic_analysis: Record<string, unknown> | null;
    learning_session: Record<string, unknown> | null;
  };
}

export interface PipelineStep {
  component: string;
  phase: 'routing' | 'optimization' | 'inference' | 'verification' | 'learning';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration_ms: number;
  status: 'success' | 'failed' | 'skipped';
  metadata?: Record<string, unknown>;
  reasoning_heuristic?: string;  // Which reasoning heuristic guided this step
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
  private logger = createLogger('UnifiedPermutationPipeline');
  private perplexityBreaker = circuitBreakerRegistry.getOrCreate('perplexity', {
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenMaxAttempts: 3,
    successThreshold: 2,
  });
  private ollamaBreaker = circuitBreakerRegistry.getOrCreate('ollama', {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenMaxAttempts: 3,
    successThreshold: 2,
  });
  
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
      enableToolSynthesis: true, // Alita-G: Enable tool synthesis by default
      enableSelfImprovingJudge: true, // Self-improving judge: Learn from outcomes by default
      optimizationMode: 'balanced',
      ...config
    };

    // Initialize with null model - will be set when executing queries
    // Use optimized ACE framework if GEPA is enabled (lazy load in processQuery)
    this.aceFramework = new ACEFramework(null as any); // Lazy initialization - model set at runtime
    this.irtCalculator = calculateIRT;
    this.rvs = new RVS();
    this.semioticSystem = new ComprehensiveSemioticSystem();
    this.tracer = getTracer();
    
    this.logger.info('Unified Permutation Pipeline initialized', { 
      components: this.getEnabledComponents() 
    });
  }
  
  /**
   * MAIN PIPELINE EXECUTION
   * Orchestrates all components in optimal order
   */
  async execute(
    query: string, 
    domain?: string, 
    context?: any, 
    configOverride?: Partial<UnifiedPipelineConfig>,
    streamWriter?: (event: { type: string; phase?: string; data?: any }) => void
  ): Promise<UnifiedPipelineResult> {
    // Validate inputs BEFORE sanitization to provide clear errors
    try {
      // First validate (checks length, etc.) - this throws if invalid
      const validatedQuery = validateQuery({ query, domain, context });
      
      // Auto-detect domain if not provided
      let detectedDomain = domain;
      if (!detectedDomain) {
        const detectionResult = this.config.enableTeacherStudent && teacherStudentSystem
          ? await detectDomainWithJudge(validatedQuery.query, JSON.stringify(validatedQuery.context), teacherStudentSystem)
          : detectDomain(validatedQuery.query, JSON.stringify(validatedQuery.context));
        
        detectedDomain = detectionResult.domain;
        this.logger.info(`Auto-detected domain: ${detectedDomain} (confidence: ${detectionResult.confidence.toFixed(2)})`, {
          reasoning: detectionResult.reasoning,
          keywords: detectionResult.keywords
        });
      }
      
      const validatedDomain = validateDomain(detectedDomain);
      
      // Then sanitize (only if validation passes)
      const sanitizedQuery = sanitizeQuery(validatedQuery.query);
      
      if (configOverride) {
        validateConfig(configOverride);
        // Merge with existing config
        this.config = { ...this.config, ...configOverride } as Required<UnifiedPipelineConfig>;
      }
      
      return this.executeInternal(sanitizedQuery, validatedDomain, validatedQuery.context, streamWriter);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new PipelineError(
        `Failed to execute pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'validation',
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  private async executeInternal(
    query: string, 
    domain: string | undefined, 
    context: Record<string, unknown> | undefined,
    streamWriter?: (event: { type: string; phase?: string; data?: any }) => void
  ): Promise<UnifiedPipelineResult> {
    const startTime = Date.now();
    const sessionId = this.tracer.startSession(`unified-pipeline-${Date.now()}`);
    
    this.logger.info('Pipeline execution started', { 
      query: query.substring(0, 60), 
      domain: domain || 'auto-detect',
      sessionId 
    });
    
    if (streamWriter) {
      streamWriter({ type: 'phase_start', phase: 'initialization' });
    }
    
    const steps: PipelineStep[] = [];
    const optimizationHistory: any[] = [];
    let teacherCalls = 0;
    let studentCalls = 0;
    let totalCost = 0;
    
    try {
      // ============================================================
      // PHASE 1 & 2: PARALLEL EXECUTION (IRT & Semiotic run together)
      // ============================================================
      this.logger.info('Starting Phase 1 & 2 (parallel execution)', { query: query.substring(0, 60) });
      const parallelStart = Date.now();
      
        const detectedDomain = domain || await this.detectDomain(query);
      
      // Select reasoning heuristics for this query/domain (to guide GEPA)
      let selectedHeuristics: string[] = [];
      try {
        selectedHeuristics = await ReasoningHeuristicSelector.select(query, detectedDomain, 3);
        this.logger.info('Reasoning heuristics selected', { 
          count: selectedHeuristics.length,
          heuristics: selectedHeuristics.map(h => h.substring(0, 50))
        });
      } catch (error) {
        this.logger.warn('Reasoning heuristic selection failed', { error });
      }
      
      // Execute IRT and Semiotic in parallel
      const [irtResult, semioticResult] = await parallelExecutor.executeParallel(
        async () => {
          const routingStart = Date.now();
          let irtDifficulty = 0.5;
          
          if (this.config.enableIRT) {
            const cachedDifficulty = pipelineCache.getIRTDifficulty(query, detectedDomain);
            if (cachedDifficulty !== null) {
              irtDifficulty = cachedDifficulty;
              this.logger.info('IRT Difficulty (cached)', { 
                difficulty: irtDifficulty, 
                label: this.getDifficultyLabel(irtDifficulty),
                duration: Date.now() - routingStart 
              });
            } else {
              irtDifficulty = await this.irtCalculator(query, detectedDomain);
              pipelineCache.setIRTDifficulty(query, detectedDomain, irtDifficulty);
              this.logger.info('IRT Difficulty calculated', { 
                difficulty: irtDifficulty, 
                label: this.getDifficultyLabel(irtDifficulty),
                duration: Date.now() - routingStart 
              });
            }
            
            steps.push({
              component: 'IRT Calculator',
              phase: 'routing',
              input: { query, domain: detectedDomain },
              output: { difficulty: irtDifficulty, expectedAccuracy: 0.85 },
              duration_ms: Date.now() - routingStart,
              status: 'success'
            });
          }
          
          return { irtDifficulty, duration: Date.now() - routingStart };
        },
        async () => {
          const semioticStart = Date.now();
          let semioticAnalysis: any = null;
          
          if (this.config.enableSemiotic) {
            const cachedSemiotic = pipelineCache.getSemioticAnalysis(query, detectedDomain);
            if (cachedSemiotic) {
              semioticAnalysis = cachedSemiotic;
              this.logger.info('Using cached semiotic inference');
            } else {
              this.logger.info('Performing comprehensive semiotic inference');
              semioticAnalysis = await this.semioticSystem.executeSemioticAnalysis(query, context || {});
              pipelineCache.setSemioticAnalysis(query, detectedDomain, semioticAnalysis);
            }
            
            const deduction = semioticAnalysis.inference.deduction;
            const induction = semioticAnalysis.inference.induction;
            const abduction = semioticAnalysis.inference.abduction;
            const synthesis = semioticAnalysis.inference.synthesis;
            
            this.logger.info('Semiotic inference complete', {
              deduction: deduction.confidence.toFixed(2),
              induction: induction.confidence.toFixed(2),
              abduction: abduction.confidence.toFixed(2),
              synthesis: synthesis.overallConfidence.toFixed(2),
              duration: Date.now() - semioticStart
            });
            
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
            
            return {
              semioticAnalysis,
              deduction,
              induction,
              abduction,
              synthesis,
              duration: Date.now() - semioticStart
            };
          } else {
            return {
              semioticAnalysis: null,
              deduction: { type: 'deduction', confidence: 0.7, reasoning: 'Simple logical inference', evidence: [] },
              induction: { type: 'induction', confidence: 0.6, reasoning: 'Pattern-based inference', evidence: [] },
              abduction: { type: 'abduction', confidence: 0.5, reasoning: 'Hypothesis formation', evidence: [] },
              synthesis: { overallConfidence: 0.6 },
              duration: Date.now() - semioticStart
            };
          }
        },
        'Phase 1 (IRT)',
        'Phase 2 (Semiotic)'
      );
      
      const irtDifficulty = irtResult.irtDifficulty;
      const { semioticAnalysis, deduction, induction, abduction, synthesis } = semioticResult;
      
      this.logger.info('Phase 1 & 2 completed (parallel)', { 
        totalDuration: Date.now() - parallelStart,
        irtDuration: irtResult.duration,
        semioticDuration: semioticResult.duration
      });
      
      // ============================================================
      // PHASE 3: ACE FRAMEWORK (for complex queries)
      // ============================================================
      this.logger.info('Starting Phase 3: ACE Framework', { irtDifficulty, threshold: this.config.aceThreshold });
      if (streamWriter) streamWriter({ type: 'phase_start', phase: 'ace_framework' });
      
      const aceStart = Date.now();
      let aceResult: any = null;
      
      const aceThreshold = this.config.aceThreshold ?? 0.5;
      if (this.config.enableACE && irtDifficulty > aceThreshold) {
        this.logger.info('Running ACE (Generator → Reflector → Curator)');
        
        // Use optimized ACE if GEPA is enabled
        if (this.config.enableGEPA) {
          const { OptimizedACEFramework } = await import('./ace-framework-optimized');
          const optimizedACE = new OptimizedACEFramework(null as any, undefined, {
            enableOptimization: true,
            minImprovement: 10,
            cacheOptimizations: true
          });
          aceResult = await optimizedACE.processQuery(query, detectedDomain);
          this.logger.info('PromptMII+GEPA optimization applied');
        } else {
          aceResult = await this.aceFramework.processQuery(query, detectedDomain);
        }
        
        this.logger.info('ACE Framework complete', {
          generatorActions: aceResult.generator?.actions?.length || 0,
          reflectorInsights: aceResult.reflector?.insights?.length || 0,
          curatorBullets: aceResult.curator?.bullets?.length || 0,
          duration: Date.now() - aceStart
        });
        
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
        
        if (streamWriter) {
          streamWriter({ 
            type: 'phase_complete', 
            phase: 'ace_framework',
            data: { duration: Date.now() - aceStart, result: aceResult }
          });
        }
      } else {
        this.logger.info('ACE Framework skipped', { 
          difficulty: irtDifficulty.toFixed(2), 
          threshold: aceThreshold.toFixed(1) 
        });
      }
      
      this.logger.info('Phase 3 completed', { duration: Date.now() - aceStart });
      
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
          
          // Get primary heuristic used (if available)
          const primaryHeuristic = selectedHeuristics.length > 0 
            ? ReasoningHeuristicSelector.getDescription(selectedHeuristics[0] as string)
            : undefined;
          
          steps.push({
            component: 'DSPy-GEPA Optimizer',
            phase: 'optimization',
            input: { module: moduleName, domain: detectedDomain },
            output: dspyResult,
            duration_ms: Date.now() - dspyStart,
            status: 'success',
            reasoning_heuristic: primaryHeuristic
          });
        } else {
          console.log(`   ⊘ DSPy module "${moduleName}" not found in registry`);
          const availableModules = dspyRegistry.listModules();
          if (availableModules.length > 0) {
            console.log(`   ℹ️  Available modules: ${availableModules.join(', ')}`);
            console.log(`   💡 Tip: Use one of the available modules or register "${moduleName}"`);
          }
        }
      } else if (this.config.enableGEPA) {
        console.log('   → Running standalone GEPA optimization...');
        const gepaResult = await gepaAlgorithms.optimizePrompts(
          detectedDomain,
          [query],
          ['quality', 'speed', 'cost'],
          24, // rollouts per step
          selectedHeuristics // Pass reasoning heuristics to guide mutation
        );
        
        optimizationHistory.push({
          component: 'GEPA',
          generations: gepaResult.optimization_metrics.generations_evolved,
          timestamp: new Date()
        });
        
        console.log(`   ✓ GEPA: ${gepaResult.evolved_prompts.length} prompts evolved`);
        
        const gepaHeuristic = selectedHeuristics.length > 0 
          ? ReasoningHeuristicSelector.getDescription(selectedHeuristics[0] as string)
          : undefined;
        
        steps.push({
          component: 'GEPA Algorithms',
          reasoning_heuristic: gepaHeuristic,
          phase: 'optimization',
          input: { basePrompts: [query], domain: detectedDomain },
          output: gepaResult as unknown as Record<string, unknown>, // Convert GEPAResult to Record
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
      
      const swirlThreshold = this.config.swirlThreshold ?? 0.7;
      if (this.config.enableSWiRL && irtDifficulty > swirlThreshold) {
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
        console.log(`   ⊘ Skipped (difficulty ${irtDifficulty.toFixed(2)} < ${swirlThreshold.toFixed(1)} threshold or SWiRL disabled)`);
      }
      
      console.log(`   ⏱️  Phase 6 completed in ${Date.now() - swirlStart}ms\n`);
      
      // ============================================================
      // PHASE 7: RECURSIVE VERIFICATION SYSTEM (RVS)
      // ============================================================
      console.log('🔄 PHASE 7: RECURSIVE VERIFICATION');
      const rvsStart = Date.now();
      
      let rvsResult: RVSResult | null = null;
      
      const rvsThreshold = this.config.rvsThreshold ?? 0.3;
      if (this.config.enableRVS && irtDifficulty > rvsThreshold) {
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
        console.log(`   ⊘ Skipped (difficulty ${irtDifficulty.toFixed(2)} < ${rvsThreshold.toFixed(1)} threshold)`);
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
      
      // Calculate quality score using LLM-as-judge (research-backed)
      let qualityScore = await this.calculateQualityScore(
        {
          semioticConfidence: synthesis?.overallConfidence || 0.5,
          teacherConfidence: teacherResponse?.confidence || 0.5,
          studentConfidence: studentResponse?.confidence || 0.5,
          rvsConfidence: rvsResult?.confidence || 0.5,
          verified: rvsResult?.verified || false,
          domain: detectedDomain
        },
        query,
        finalAnswer
      );
      
      // Track formal vs functional competence (brain alignment insights)
      // Safely access deduction/induction/abduction with fallbacks
      try {
        const formalCompetence = competenceTracker.calculateFormalCompetence({
          semiotic: { 
            deduction: { 
              confidence: (deduction as any)?.confidence ?? 0.7 
            } 
          },
          aceResult,
          irtDifficulty
        });
        
        const functionalCompetence = competenceTracker.calculateFunctionalCompetence({
          semiotic: {
            induction: { 
              confidence: (induction as any)?.confidence ?? 0.6 
            },
            abduction: { 
              confidence: (abduction as any)?.confidence ?? 0.5 
            }
          },
          teacherResponse,
          rvsResult: rvsResult || undefined,
          qualityScore
        });
        
        const competenceTracking = competenceTracker.trackCompetence(
          formalCompetence,
          functionalCompetence,
          this.executionCount
        );
        
        this.logger.info('Competence tracking', {
          formal: formalCompetence.overall.toFixed(3),
          functional: functionalCompetence.overall.toFixed(3),
          brainAlignment: competenceTracking.brainAlignmentScore.toFixed(3),
          formalSaturated: competenceTracking.formalSaturated
        });
        
        // Store for metadata
        (this as any).lastFormalCompetence = formalCompetence;
        (this as any).lastFunctionalCompetence = functionalCompetence;
        (this as any).lastCompetenceTracking = competenceTracking;
      } catch (competenceError) {
        this.logger.warn('Competence tracking failed', { error: competenceError });
        // Continue without competence tracking if it fails
        (this as any).lastFormalCompetence = null;
        (this as any).lastFunctionalCompetence = null;
        (this as any).lastCompetenceTracking = null;
      }
      
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
            energyFunction: 'combined',
            useLLMRefinement: true,  // Enable LLM-based refinement (actually improves answers)
            llmModel: 'ollama-gemma3:4b'  // Use local model for refinement
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
      
      const result: UnifiedPipelineResult = {
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
          competence_metrics: (this as any).lastCompetenceTracking ? {
            formal: (this as any).lastFormalCompetence.overall,
            functional: (this as any).lastFunctionalCompetence.overall,
            brain_alignment: (this as any).lastCompetenceTracking.brainAlignmentScore,
            formal_saturated: (this as any).lastCompetenceTracking.formalSaturated
          } : undefined,
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
      
      // ReasoningBank: Memory retrieval, usage tracking, and extraction
      // Alita-G Enhancement: Also synthesize tools from successful trajectories
      try {
        const reasoningBankModule = await import('./arcmemo-reasoning-bank');
        const { ArcMemoReasoningBank } = reasoningBankModule;
        const reasoningBank = new ArcMemoReasoningBank();
        
        // Step 1: Retrieve relevant memories BEFORE execution (for use during task)
        const retrievedMemories = await reasoningBank.retrieveRelevantMemories(query, detectedDomain, 5);
        const usedMemoryIds = retrievedMemories.map(m => m.id).filter(id => id && !isNaN(parseInt(id)));
        
        // Step 1.5: Alita-G Enhancement - Retrieve relevant tools (if enabled)
        let selectedTools: any[] = [];
        if (this.config.enableToolSynthesis !== false) {
          try {
            const { createToolSynthesisEngine } = await import('./tool-synthesis-engine');
            const toolEngine = createToolSynthesisEngine(reasoningBank);
            selectedTools = await toolEngine.selectTools(query, detectedDomain, 5);
            if (selectedTools.length > 0) {
              console.log(`🔧 Alita-G: Selected ${selectedTools.length} tools for execution`);
              // Tools are available but not yet injected into pipeline (future enhancement)
            }
          } catch (toolError) {
            console.warn('⚠️ Tool synthesis not available:', toolError);
          }
        }
        
        // Convert execution trace to Experience format
        const taskSucceeded = qualityScore > 0.7; // High quality = success
        const experience = {
          taskId: sessionId,
          query,
          domain: detectedDomain,
          steps: steps.map((step, idx) => ({
            thought: step.metadata?.reasoning || `Step ${idx + 1}: ${step.component} execution`,
            action: step.component,
            observation: JSON.stringify(step.output || { component: step.component, status: step.status }).substring(0, 200),
            timestamp: new Date()
          })),
          success: taskSucceeded,
          finalResult: result.answer || result,
          irtAbility: irtDifficulty ? (1 - irtDifficulty) : undefined,
          irtConfidence: synthesis?.overallConfidence
        };
        
        // Step 2: Update empirical success rates for memories used (if any)
        if (usedMemoryIds.length > 0) {
          await reasoningBank.updateMemoryUsageBatch(usedMemoryIds, taskSucceeded);
          console.log(`📊 ReasoningBank: Updated empirical success rates for ${usedMemoryIds.length} memories`);
          result.metadata.reasoningbank_memories_used = usedMemoryIds.length;
          result.metadata.reasoningbank_memories_used_ids = usedMemoryIds;
        }
        
        // Step 3: Extract and consolidate memories from this execution (closed-loop learning)
        const extractedMemories = await reasoningBank.extractMemoryFromExperience(experience as any);
        
        if (extractedMemories.length > 0) {
          await reasoningBank.consolidateMemories(extractedMemories);
          console.log(`✅ ReasoningBank: Extracted and consolidated ${extractedMemories.length} memory items`);
          
          result.metadata.reasoningbank_memories_extracted = extractedMemories.length;
          result.metadata.reasoningbank_memory_titles = extractedMemories.map(m => m.title);
        }
        
        // Step 4: Alita-G Enhancement - Synthesize tools from successful trajectory
        // Paper uses multi-execution (K iterations) - accumulate tools across multiple runs
        if (taskSucceeded && this.config.enableToolSynthesis !== false) {
          try {
            const { createToolSynthesisEngine } = await import('./tool-synthesis-engine');
            const toolEngine = createToolSynthesisEngine(reasoningBank);
            
            const k = this.config.toolSynthesisIterations || 1;
            let synthesizedTools: any[] = [];
            
            if (k > 1) {
              // Multi-execution (K iterations): Extract from current execution and consolidate with existing tools
              // Note: Full Alita-G would run query K times; here we accumulate tools from previous executions
              const currentTools = await toolEngine.extractToolsFromTrajectory(experience as any);
              
              // Get previously synthesized tools for this domain
              const repo = await toolEngine.getDomainToolRepository(detectedDomain);
              const existingTools = Array.from(repo.tools.values());
              
              // Use synthesizeToolsFromMultipleExecutions which handles consolidation (preserves diversity)
              // Create mock experiences from existing tools for consolidation
              const allExperiences = [
                experience as any,
                ...existingTools.map(tool => ({
                  success: true,
                  domain: detectedDomain,
                  steps: [{ action: tool.invocationPattern }] // Minimal structure for consolidation
                }))
              ];
              
              synthesizedTools = await toolEngine.synthesizeToolsFromMultipleExecutions(
                allExperiences,
                detectedDomain
              );
              
              console.log(`🔧 Alita-G: Multi-execution (K=${k}): Consolidated ${currentTools.length + existingTools.length} → ${synthesizedTools.length} tools`);
            } else {
              // Single execution - extract from this trajectory
              synthesizedTools = await toolEngine.extractToolsFromTrajectory(experience as any);
              console.log(`🔧 Alita-G: Single execution: Synthesized ${synthesizedTools.length} tools`);
            }
            
            if (synthesizedTools.length > 0) {
              await toolEngine.addToolsToRepository(detectedDomain, synthesizedTools);
              
              // Track in metadata
              result.metadata.tools_synthesized = synthesizedTools.length;
              result.metadata.tool_names = synthesizedTools.map(t => t.name);
              result.metadata.tool_synthesis_iterations = k;
            }
          } catch (toolError) {
            console.warn('⚠️ Tool synthesis failed (non-fatal):', toolError);
          }
        }
        
        // Step 5: Self-Improving Judge - Learn from this execution automatically
        if (this.config.enableSelfImprovingJudge !== false) {
          try {
            const { SelfImprovingJudge } = await import('./self-improving-judge');
            const judge = new SelfImprovingJudge(reasoningBank);
            
            // Learn from this single execution (no manual grading needed)
            const examplesLearned = await judge.learnFromTaskOutcomes([experience as any], 0.7);
            
            if (examplesLearned > 0) {
              console.log(`🎓 Self-improving judge: Learned from execution outcome (success: ${taskSucceeded})`);
              result.metadata.judge_learned_from_outcome = true;
            }
            
            // Periodic calibration (every 10 executions for performance)
            if (this.executionCount % 10 === 0) {
              try {
                // Load recent experiences from ReasoningBank for calibration
                const recentExperiences = await this.loadRecentExperiencesForCalibration(reasoningBank, 20);
                if (recentExperiences.length >= 5) {
                  const calibration = await judge.calibrateJudge(recentExperiences);
                  console.log(`📊 Self-improving judge calibration:`);
                  console.log(`   Empirical accuracy: ${(calibration.empiricalAccuracy * 100).toFixed(1)}%`);
                  console.log(`   Confidence calibration: ${(calibration.confidenceCalibration * 100).toFixed(1)}%`);
                  
                  result.metadata.judge_calibration_accuracy = calibration.empiricalAccuracy;
                  
                  // Identify active learning candidates (only when calibration runs)
                  const activeLearningCandidates = await judge.identifyActiveLearningCandidates(recentExperiences, 5);
                  if (activeLearningCandidates.length > 0) {
                    console.log(`❓ Active learning: ${activeLearningCandidates.length} candidates for human review`);
                    result.metadata.judge_active_learning_candidates = activeLearningCandidates.length;
                    
                    // Log candidates for human review (could be stored in database for UI)
                    activeLearningCandidates.slice(0, 3).forEach((candidate, idx) => {
                      console.log(`   ${idx + 1}. Priority ${candidate.priority.toFixed(1)}: ${candidate.reason}`);
                    });
                  }
                }
              } catch (calibrationError) {
                console.warn('⚠️ Judge calibration failed (non-fatal):', calibrationError);
              }
            }
          } catch (judgeError) {
            console.warn('⚠️ Self-improving judge failed (non-fatal):', judgeError);
          }
        }
      } catch (rbError) {
        // Don't fail the pipeline if ReasoningBank extraction fails
        console.warn('⚠️ ReasoningBank memory extraction failed (non-fatal):', rbError);
      }
      
      return result;
      
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
   * 
   * Uses LLM-as-judge evaluation (research-backed, ~90% human agreement)
   * Falls back to weighted component confidence if LLM evaluation fails
   */
  private async calculateQualityScore(
    components: any,
    query: string,
    finalAnswer: string
  ): Promise<number> {
    // Try LLM-as-judge evaluation first (research-backed primary method)
    try {
      const { llmAsJudgeEvaluator } = await import('./llm-as-judge-evaluator');
      const judgment = await llmAsJudgeEvaluator.evaluatePointwise(query, finalAnswer, {
        domain: components.domain || 'general'
      });
      
      // Use LLM judgment as primary score
      console.log(`   ✓ LLM-as-judge score: ${judgment.overallScore.toFixed(3)} (confidence: ${judgment.confidence.toFixed(2)})`);
      console.log(`     Criteria: R=${judgment.criteria.relevance.toFixed(2)} C=${judgment.criteria.completeness.toFixed(2)} A=${judgment.criteria.correctness.toFixed(2)} Cl=${judgment.criteria.clarity.toFixed(2)}`);
      
      // Combine with component confidence for robustness
      const {
        semioticConfidence,
        teacherConfidence,
        studentConfidence,
        rvsConfidence,
        verified
      } = components;
      
      const componentScore = (
        semioticConfidence * 0.3 +
        teacherConfidence * 0.3 +
        studentConfidence * 0.2 +
        rvsConfidence * 0.2
      ) + (verified ? 0.1 : 0);
      
      // Weighted combination: 70% LLM judgment, 30% component confidence
      const combinedScore = (
        judgment.overallScore * 0.7 +
        Math.min(1.0, componentScore) * 0.3
      );
      
      return Math.max(0, Math.min(1.0, combinedScore));
    } catch (error) {
      // Fallback to component confidence if LLM evaluation fails
      console.warn('⚠️ LLM-as-judge evaluation failed, using component confidence fallback:', error);
      
      const {
        semioticConfidence,
        teacherConfidence,
        studentConfidence,
        rvsConfidence,
        verified
      } = components;
      
      let score = (
        semioticConfidence * 0.3 +
        teacherConfidence * 0.3 +
        studentConfidence * 0.2 +
        rvsConfidence * 0.2
      );
      
      if (verified) {
        score = Math.min(1.0, score + 0.1);
      }
      
      return score;
    }
  }
  
  /**
   * Helper: Load recent experiences for judge calibration
   * Loads from Supabase reasoning_experiences table
   */
  private async loadRecentExperiencesForCalibration(
    reasoningBank: any,
    limit: number = 20
  ): Promise<any[]> {
    try {
      // Try to load from Supabase if available
      if (reasoningBank.supabase) {
        const { data, error } = await reasoningBank.supabase
          .from('reasoning_experiences')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (!error && data && data.length > 0) {
          // Convert Supabase records to Experience format
          return data.map((record: any) => ({
            taskId: record.task_id,
            query: record.query,
            domain: record.domain,
            steps: record.trajectory || [],
            success: record.success,
            finalResult: record.final_result,
            selfJudgment: record.self_judgment,
            irtAbility: record.irt_ability,
            irtConfidence: record.irt_confidence
          }));
        }
      }
      
      // Fallback: Return empty array (calibration will be skipped)
      return [];
    } catch (error) {
      console.warn('⚠️ Failed to load recent experiences for calibration:', error);
      return [];
    }
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
  config?: Partial<UnifiedPipelineConfig>,
  streamWriter?: (event: { type: string; phase?: string; data?: any }) => void
): Promise<UnifiedPipelineResult> {
  const pipeline = config ? new UnifiedPermutationPipeline(config) : unifiedPipeline;
  return await pipeline.execute(query, domain, context, config, streamWriter);
}

