/**
 * Adaptive Workflow Orchestrator
 * 
 * Dynamically builds specialized workflows based on query/business use case.
 * Only activates components needed for the specific domain.
 * 
 * Architecture:
 * 1. Query Analysis → Detect business use case + domain
 * 2. Workflow Template Selection → Choose optimal component combination
 * 3. Dynamic Workflow Assembly → Build specialized execution path
 * 4. Execution → Run only activated components
 */

import { PermutationConfig, PermutationEngine, PermutationResult } from './permutation-engine';
import { SmartRouter, TaskType, getSmartRouter } from './smart-router';

export type BusinessUseCase = 
  | 'insurance_premium'
  | 'legal_latam'
  | 'legal_us'
  | 'manufacturing'
  | 'healthcare'
  | 'financial'
  | 'real_estate'
  | 'crypto'
  | 'technology'
  | 'science_research'
  | 'marketing'
  | 'copywriting'
  | 'financial_research'
  | 'business_analysis'
  | 'consulting'
  | 'sales'
  | 'product_management'
  | 'general';

export interface WorkflowProfile {
  useCase: BusinessUseCase;
  domain: string;
  requiredComponents: string[];
  optionalComponents: string[];
  config: Partial<PermutationConfig>;
  priority: 'speed' | 'quality' | 'cost' | 'balanced';
  expectedLatency: number;
  expectedCost: number;
}

export interface QueryAnalysis {
  businessUseCase: BusinessUseCase;
  domain: string;
  complexity: number; // 0-1
  requiresVerification: boolean;
  requiresRetrieval: boolean;
  requiresOptimization: boolean;
  requiresRealTimeData: boolean;
  language?: string; // 'en', 'es', 'pt', etc.
  jurisdiction?: string; // 'US', 'LATAM', 'EU', etc.
  confidence: number; // 0-1
}

export interface WorkflowExecution {
  workflowProfile: WorkflowProfile;
  activatedComponents: string[];
  executionTime: number;
  cost: number;
  quality: number;
  trace: any[];
}

/**
 * Adaptive Workflow Orchestrator
 */
export class AdaptiveWorkflowOrchestrator {
  private workflowProfiles: Map<BusinessUseCase, WorkflowProfile> = new Map();
  private smartRouter: SmartRouter;
  
  constructor() {
    this.smartRouter = getSmartRouter();
    this.initializeWorkflowProfiles();
  }

  /**
   * Initialize domain-specific workflow profiles
   */
  private initializeWorkflowProfiles(): void {
    // Insurance Premium Workflow
    // Use case: High accuracy required, supervised data available, structured outputs
    this.workflowProfiles.set('insurance_premium', {
      useCase: 'insurance_premium',
      domain: 'insurance',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ Insurance domain adapter (supervised classification-like task)
        'DSPy',                 // ✅ Structured output (premium, coverage, exclusions)
        'TRM Verification',     // ✅ Critical accuracy verification
        'ACE Framework',        // ✅ Insurance playbooks (underwriting rules)
        'IRT Scoring'           // ✅ Difficulty-based routing (simple vs complex risks)
      ],
      optionalComponents: [
        'ReasoningBank',        // Past premium calculations
        'SQL Generation'        // Policy database queries
      ],
      config: {
        enableLoRA: true,      // ✅ Domain adapter for insurance terminology/patterns
        enableDSPy: true,       // ✅ Structured premium calculation output
        enableTRM: true,        // ✅ Verify accuracy of premium calculations
        enableACE: true,         // ✅ Insurance underwriting playbooks
        enableIRT: true,        // ✅ Route complex risks to Teacher model
        enableReasoningBank: true, // Past calculations
        enableSQL: false,       // Optional
        enableTeacherModel: true, // High accuracy needed
        enableStudentModel: false,
        enableSWiRL: false,      // Not needed (single-step calculation)
        enableMultiQuery: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'quality',
      expectedLatency: 2200,
      expectedCost: 0.06
    });

    // LATAM Legal Workflow
    // Use case: Multi-jurisdiction search, multi-step reasoning, structured legal analysis
    this.workflowProfiles.set('legal_latam', {
      useCase: 'legal_latam',
      domain: 'legal',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ Legal domain adapter (contract patterns, clause extraction)
        'DSPy',                 // ✅ Structured legal analysis (compliance checklist, risks, obligations)
        'SWiRL',                // ✅ Multi-step reasoning (identify law → find relevant cases → analyze compliance)
        'Multi-Query Expansion', // ✅ Comprehensive search across jurisdictions
        'ACE Framework',         // ✅ LATAM legal playbooks (country-specific laws)
        'TRM Verification',     // ✅ Legal accuracy verification
        'ReasoningBank'         // ✅ Past legal cases and strategies
      ],
      optionalComponents: [
        'Weaviate Retrieval',   // Legal document search
        'SQL Generation'        // Legal database queries
      ],
      config: {
        enableLoRA: true,       // ✅ Legal domain adapter
        enableDSPy: true,       // ✅ Structured compliance analysis
        enableSWiRL: true,      // ✅ Multi-step legal reasoning
        enableMultiQuery: true, // ✅ Broader search for LATAM jurisdictions
        enableACE: true,        // ✅ LATAM legal playbooks
        enableTRM: true,        // ✅ Verify legal accuracy
        enableReasoningBank: true, // Past cases
        enableIRT: true,
        enableTeacherModel: true,
        enableStudentModel: false,
        enableSQL: false,       // Optional
        enableWeaviateRetrieveDSPy: false // Optional
      },
      priority: 'quality',
      expectedLatency: 3500,
      expectedCost: 0.09
    });

    // US Legal Workflow
    // Use case: Case law search, structured legal analysis, multi-step reasoning
    this.workflowProfiles.set('legal_us', {
      useCase: 'legal_us',
      domain: 'legal',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ US legal domain adapter
        'DSPy',                 // ✅ Structured case analysis (precedent, reasoning, outcome)
        'SWiRL',                // ✅ Multi-step legal reasoning
        'Weaviate Retrieval',   // ✅ Case law semantic search
        'ACE Framework',        // ✅ US legal playbooks
        'TRM Verification',     // ✅ Legal accuracy
        'ReasoningBank'         // ✅ Past legal strategies
      ],
      optionalComponents: [
        'SQL Generation',
        'Multi-Query Expansion'
      ],
      config: {
        enableLoRA: true,       // ✅ US legal adapter
        enableDSPy: true,       // ✅ Structured case analysis
        enableSWiRL: true,      // ✅ Multi-step reasoning
        enableWeaviateRetrieveDSPy: true, // ✅ Case law search
        enableACE: true,
        enableTRM: true,
        enableReasoningBank: true,
        enableIRT: true,
        enableTeacherModel: true,
        enableStudentModel: false,
        enableMultiQuery: false, // Optional (Weaviate handles search)
        enableSQL: false
      },
      priority: 'quality',
      expectedLatency: 2800,
      expectedCost: 0.08
    });

    // Manufacturing Workflow
    // Use case: Structured data analysis, supervised patterns (quality control, production metrics)
    this.workflowProfiles.set('manufacturing', {
      useCase: 'manufacturing',
      domain: 'manufacturing',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ Manufacturing domain adapter (quality patterns, defect classification)
        'DSPy',                 // ✅ Structured production reports (metrics, anomalies, recommendations)
        'SQL Generation',       // ✅ Production data queries
        'ACE Framework',        // ✅ Manufacturing playbooks (best practices)
        'IRT Scoring'           // ✅ Complexity routing (simple reporting vs complex analysis)
      ],
      optionalComponents: [
        'ReasoningBank',        // Past production analysis
        'GEPA Optimization'     // Optimize prompts for recurring queries
      ],
      config: {
        enableLoRA: true,       // ✅ Manufacturing adapter for quality/defect patterns
        enableDSPy: true,       // ✅ Structured production reports
        enableSQL: true,        // ✅ Production database
        enableACE: true,         // ✅ Manufacturing playbooks
        enableIRT: true,        // ✅ Route complex analysis to Teacher
        enableReasoningBank: true, // Past analysis
        enableTeacherModel: false, // Cost-sensitive
        enableStudentModel: true,  // Use Ollama
        enableTRM: false,          // Not critical (data-driven)
        enableSWiRL: false,
        enableMultiQuery: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'cost',
      expectedLatency: 1200,
      expectedCost: 0.015
    });

    // Healthcare Workflow
    // Use case: Critical accuracy, structured diagnosis, supervised patterns, multi-step reasoning
    this.workflowProfiles.set('healthcare', {
      useCase: 'healthcare',
      domain: 'healthcare',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ Medical domain adapter (symptom-diagnosis patterns)
        'DSPy',                 // ✅ Structured diagnosis (symptoms → diagnosis → confidence → tests)
        'SWiRL',                // ✅ Multi-step diagnosis reasoning
        'TRM Verification',     // ✅ Critical accuracy verification
        'ACE Framework',        // ✅ Medical playbooks (diagnostic protocols)
        'IRT Scoring',          // ✅ Risk-based routing (simple vs complex cases)
        'ReasoningBank'         // ✅ Medical case history
      ],
      optionalComponents: [
        'SQL Generation',       // Patient data (HIPAA concerns)
        'Weaviate Retrieval'    // Medical literature search
      ],
      config: {
        enableLoRA: true,       // ✅ Medical adapter (supervised symptom-diagnosis patterns)
        enableDSPy: true,       // ✅ Structured diagnosis output
        enableSWiRL: true,      // ✅ Multi-step diagnostic reasoning
        enableTRM: true,        // ✅ Verify diagnosis accuracy
        enableACE: true,         // ✅ Medical playbooks
        enableIRT: true,        // ✅ Route complex cases to Teacher
        enableReasoningBank: true, // Case history
        enableTeacherModel: true, // High accuracy
        enableStudentModel: false,
        enableSQL: false,       // Optional (HIPAA)
        enableWeaviateRetrieveDSPy: false, // Optional (medical papers)
        enableMultiQuery: false
      },
      priority: 'quality',
      expectedLatency: 2800,
      expectedCost: 0.07
    });

    // Financial Workflow
    // Use case: Structured financial analysis, supervised patterns (balance sheets, metrics extraction)
    this.workflowProfiles.set('financial', {
      useCase: 'financial',
      domain: 'financial',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ Financial domain adapter (balance sheet → insights, supervised)
        'DSPy',                 // ✅ Structured financial reports (metrics, trends, recommendations)
        'ACE Framework',        // ✅ Financial playbooks (GAAP, analysis patterns)
        'IRT Scoring',          // ✅ Complexity routing (simple reporting vs complex analysis)
        'TRM Verification',     // ✅ Verify financial accuracy
        'ReasoningBank'         // ✅ Past financial analyses
      ],
      optionalComponents: [
        'SQL Generation',       // Financial database queries
        'Multi-Query Expansion'
      ],
      config: {
        enableLoRA: true,       // ✅ Financial adapter (supervised balance sheet analysis)
        enableDSPy: true,       // ✅ Structured financial output
        enableACE: true,
        enableIRT: true,
        enableTRM: true,
        enableReasoningBank: true,
        enableTeacherModel: true,
        enableStudentModel: false,
        enableSWiRL: true,      // Multi-step analysis
        enableSQL: false,
        enableMultiQuery: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'balanced',
      expectedLatency: 2200,
      expectedCost: 0.05
    });

    // Real Estate Workflow
    // Use case: Structured property analysis, supervised patterns (listings → valuation)
    this.workflowProfiles.set('real_estate', {
      useCase: 'real_estate',
      domain: 'real_estate',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ Real estate adapter (property → valuation, supervised)
        'DSPy',                 // ✅ Structured property reports (value, comparables, market trends)
        'SQL Generation',       // ✅ Property database queries
        'ACE Framework',        // ✅ Real estate playbooks (market analysis patterns)
        'ReasoningBank'         // ✅ Market analysis patterns
      ],
      optionalComponents: [
        'IRT Scoring',
        'TRM Verification'
      ],
      config: {
        enableLoRA: true,       // ✅ Real estate adapter (supervised valuation patterns)
        enableDSPy: true,       // ✅ Structured property analysis
        enableSQL: true,
        enableACE: true,
        enableReasoningBank: true,
        enableIRT: false,       // Optional
        enableTRM: false,       // Optional
        enableTeacherModel: false,
        enableStudentModel: true,
        enableSWiRL: false,
        enableMultiQuery: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'cost',
      expectedLatency: 1600,
      expectedCost: 0.025
    });

    // Technology Workflow
    // Use case: Multi-step reasoning, code/system architecture, reflective learning (RL-like)
    this.workflowProfiles.set('technology', {
      useCase: 'technology',
      domain: 'technology',
      requiredComponents: [
        'GEPA Optimization',    // ✅ RL-like problem (trial & error, reflective learning)
        'SWiRL',                // ✅ Multi-step technical reasoning (design → implement → test)
        'ACE Framework',        // ✅ Technical playbooks (architecture patterns)
        'DSPy',                 // ✅ Structured technical specs (architecture, APIs, data flow)
        'ReasoningBank'         // ✅ Past solutions (code patterns, architecture decisions)
      ],
      optionalComponents: [
        'Multi-Query Expansion', // Code/architecture variations
        'TRM Verification'      // Code correctness
      ],
      config: {
        // GEPA used via gepaAlgorithms (always available when needed)
        enableSWiRL: true,     // ✅ Multi-step reasoning (design → code → test)
        enableACE: true,        // ✅ Technical playbooks
        enableDSPy: true,       // ✅ Structured architecture specs
        enableReasoningBank: true, // Past solutions
        enableTeacherModel: false,
        enableStudentModel: true, // Cost-sensitive
        enableIRT: false,
        enableTRM: false,       // Optional (code verification)
        enableLoRA: false,
        enableSQL: false,
        enableMultiQuery: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'speed',
      expectedLatency: 1500,
      expectedCost: 0.02
    });

    // Science/Research Workflow
    // Use case: Multi-step reasoning, structured research reports, reflective learning (experimental design)
    this.workflowProfiles.set('science_research', {
      useCase: 'science_research',
      domain: 'science',
      requiredComponents: [
        'GEPA Optimization',    // ✅ RL-like (experimental design, trial & error, hypothesis refinement)
        'DSPy',                 // ✅ Structured research outputs (hypothesis, methodology, results, conclusions)
        'SWiRL',                // ✅ Multi-step research reasoning (hypothesis → experiment → analysis → conclusions)
        'ACE Framework',        // ✅ Research playbooks (methodology patterns)
        'Weaviate Retrieval',   // ✅ Literature search
        'ReasoningBank'         // ✅ Past research findings
      ],
      optionalComponents: [
        'TRM Verification',     // Verify research conclusions
        'Multi-Query Expansion' // Comprehensive literature search
      ],
      config: {
        // GEPA used via gepaAlgorithms (always available)
        enableDSPy: true,       // ✅ Structured research reports
        enableSWiRL: true,      // ✅ Multi-step research reasoning
        enableACE: true,
        enableWeaviateRetrieveDSPy: true, // ✅ Literature search
        enableReasoningBank: true,
        enableTRM: false,       // Optional
        enableMultiQuery: false, // Optional
        enableIRT: true,
        enableTeacherModel: true, // High accuracy needed
        enableStudentModel: false,
        enableLoRA: false,
        enableSQL: false
      },
      priority: 'quality',
      expectedLatency: 3000,
      expectedCost: 0.07
    });

    // Marketing Workflow
    // Use case: Creative generation, audience analysis, campaign optimization (RL-like iterative refinement)
    this.workflowProfiles.set('marketing', {
      useCase: 'marketing',
      domain: 'marketing',
      requiredComponents: [
        'GEPA Optimization',    // ✅ RL-like (campaign optimization, A/B testing concepts, iterative refinement)
        'DSPy',                 // ✅ Structured marketing plans (audience, channels, budget, KPIs)
        'ACE Framework',        // ✅ Marketing playbooks (campaign strategies)
        'Multi-Query Expansion', // ✅ Generate campaign variations
        'ReasoningBank'         // ✅ Past campaign performance
      ],
      optionalComponents: [
        'SWiRL',                // Multi-step campaign planning
        'IRT Scoring'
      ],
      config: {
        // GEPA used via gepaAlgorithms
        enableDSPy: true,       // ✅ Structured marketing plans
        enableACE: true,
        enableMultiQuery: true, // ✅ Campaign variations
        enableReasoningBank: true,
        enableSWiRL: false,     // Optional
        enableIRT: false,        // Optional
        enableTeacherModel: false,
        enableStudentModel: true, // Cost-sensitive
        enableTRM: false,
        enableLoRA: false,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'balanced',
      expectedLatency: 1800,
      expectedCost: 0.03
    });

    // Copywriting Workflow
    // Use case: Creative generation, multiple variations, iterative refinement (RL-like)
    this.workflowProfiles.set('copywriting', {
      useCase: 'copywriting',
      domain: 'copywriting',
      requiredComponents: [
        'GEPA Optimization',    // ✅ RL-like (iterative refinement, A/B testing variants, reflective learning)
        'DSPy',                 // ✅ Structured copy outputs (headline, body, CTA, tone)
        'ACE Framework',        // ✅ Copywriting playbooks (persuasion patterns, style guides)
        'Multi-Query Expansion', // ✅ Generate multiple copy variations
        'ReasoningBank'         // ✅ Past successful copy
      ],
      optionalComponents: [
        'SWiRL',                // Multi-step copy development
        'TRM Verification'      // Copy quality check
      ],
      config: {
        // GEPA used via gepaAlgorithms
        enableDSPy: true,       // ✅ Structured copy (headline, body, CTA)
        enableACE: true,
        enableMultiQuery: true, // ✅ Multiple variations
        enableReasoningBank: true,
        enableSWiRL: false,     // Optional
        enableTRM: false,       // Optional
        enableTeacherModel: false,
        enableStudentModel: true, // Cost-sensitive, iterative
        enableIRT: false,
        enableLoRA: false,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'speed',
      expectedLatency: 1400,
      expectedCost: 0.02
    });

    // Financial Research Workflow
    // Use case: Structured research reports, supervised patterns (financial data → analysis)
    this.workflowProfiles.set('financial_research', {
      useCase: 'financial_research',
      domain: 'financial',
      requiredComponents: [
        'LoRA Fine-tuning',     // ✅ Financial research adapter (financial data → insights, supervised)
        'DSPy',                 // ✅ Structured research reports (thesis, analysis, valuation, recommendation)
        'SWiRL',                // ✅ Multi-step research reasoning (data → analysis → valuation → recommendation)
        'ACE Framework',        // ✅ Financial research playbooks (valuation methods, analysis frameworks)
        'TRM Verification',     // ✅ Verify research accuracy
        'ReasoningBank'         // ✅ Past research reports
      ],
      optionalComponents: [
        'SQL Generation',       // Financial databases
        'Weaviate Retrieval',    // Market data search
        'Multi-Query Expansion'
      ],
      config: {
        enableLoRA: true,       // ✅ Financial research adapter
        enableDSPy: true,       // ✅ Structured research reports
        enableSWiRL: true,       // ✅ Multi-step reasoning
        enableACE: true,
        enableTRM: true,        // ✅ Verify accuracy
        enableReasoningBank: true,
        enableIRT: true,
        enableTeacherModel: true, // High accuracy
        enableStudentModel: false,
        enableSQL: false,       // Optional
        enableWeaviateRetrieveDSPy: false, // Optional
        enableMultiQuery: false
      },
      priority: 'quality',
      expectedLatency: 3000,
      expectedCost: 0.08
    });

    // Business Analysis Workflow
    // Use case: Structured business reports, multi-step strategic analysis
    this.workflowProfiles.set('business_analysis', {
      useCase: 'business_analysis',
      domain: 'business',
      requiredComponents: [
        'DSPy',                 // ✅ Structured business reports (SWOT, PESTEL, competitive analysis)
        'SWiRL',                // ✅ Multi-step strategic reasoning (analyze → compare → recommend)
        'ACE Framework',        // ✅ Business analysis playbooks (strategic frameworks)
        'ReasoningBank',        // ✅ Past strategic analyses
        'IRT Scoring'           // ✅ Complexity routing
      ],
      optionalComponents: [
        'GEPA Optimization',  // Optimize analysis prompts
        'TRM Verification',
        'Multi-Query Expansion'
      ],
      config: {
        enableDSPy: true,       // ✅ Structured business analysis
        enableSWiRL: true,      // ✅ Multi-step reasoning
        enableACE: true,
        enableReasoningBank: true,
        enableIRT: true,
        enableTeacherModel: false,
        enableStudentModel: true, // Cost-sensitive
        enableTRM: false,       // Optional
        enableMultiQuery: false, // Optional
        enableLoRA: false,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'balanced',
      expectedLatency: 2000,
      expectedCost: 0.035
    });

    // Consulting Workflow
    // Use case: Multi-step strategic reasoning, structured recommendations
    this.workflowProfiles.set('consulting', {
      useCase: 'consulting',
      domain: 'consulting',
      requiredComponents: [
        'GEPA Optimization',    // ✅ RL-like (strategic problem-solving, iterative refinement)
        'DSPy',                 // ✅ Structured consulting deliverables (situation, analysis, recommendations)
        'SWiRL',                // ✅ Multi-step consulting reasoning (problem → analysis → solution → implementation)
        'ACE Framework',        // ✅ Consulting playbooks (strategic frameworks, MECE)
        'ReasoningBank'         // ✅ Past consulting engagements
      ],
      optionalComponents: [
        'TRM Verification',
        'Multi-Query Expansion',
        'IRT Scoring'
      ],
      config: {
        // GEPA used via gepaAlgorithms
        enableDSPy: true,       // ✅ Structured consulting deliverables
        enableSWiRL: true,      // ✅ Multi-step reasoning
        enableACE: true,
        enableReasoningBank: true,
        enableTRM: false,       // Optional
        enableMultiQuery: false, // Optional
        enableIRT: false,       // Optional
        enableTeacherModel: false,
        enableStudentModel: true, // Cost-sensitive
        enableLoRA: false,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'balanced',
      expectedLatency: 2200,
      expectedCost: 0.04
    });

    // Sales Workflow
    // Use case: Persuasive content generation, structured proposals
    this.workflowProfiles.set('sales', {
      useCase: 'sales',
      domain: 'sales',
      requiredComponents: [
        'DSPy',                 // ✅ Structured sales deliverables (proposal, pricing, benefits)
        'ACE Framework',        // ✅ Sales playbooks (objection handling, closing techniques)
        'Multi-Query Expansion', // ✅ Generate proposal variations
        'ReasoningBank'         // ✅ Past successful deals
      ],
      optionalComponents: [
        'GEPA Optimization',    // Optimize sales messaging
        'SWiRL',                // Multi-step sales process
        'TRM Verification'
      ],
      config: {
        enableDSPy: true,       // ✅ Structured proposals
        enableACE: true,
        enableMultiQuery: true, // ✅ Proposal variations
        enableReasoningBank: true,
        enableSWiRL: false,     // Optional
        enableTRM: false,       // Optional
        enableTeacherModel: false,
        enableStudentModel: true, // Cost-sensitive
        enableIRT: false,
        enableLoRA: false,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'speed',
      expectedLatency: 1500,
      expectedCost: 0.025
    });

    // Product Management Workflow
    // Use case: Strategic planning, structured roadmaps, multi-step product reasoning
    this.workflowProfiles.set('product_management', {
      useCase: 'product_management',
      domain: 'product',
      requiredComponents: [
        'GEPA Optimization',    // ✅ RL-like (product strategy, iterative refinement, user feedback loops)
        'DSPy',                 // ✅ Structured product specs (features, user stories, roadmap)
        'SWiRL',                // ✅ Multi-step product reasoning (research → design → build → iterate)
        'ACE Framework',        // ✅ Product playbooks (agile, user research, prioritization)
        'ReasoningBank'         // ✅ Past product decisions
      ],
      optionalComponents: [
        'Multi-Query Expansion', // Feature variations
        'TRM Verification',
        'IRT Scoring'
      ],
      config: {
        // GEPA used via gepaAlgorithms
        enableDSPy: true,       // ✅ Structured product specs
        enableSWiRL: true,      // ✅ Multi-step product reasoning
        enableACE: true,
        enableReasoningBank: true,
        enableMultiQuery: false, // Optional
        enableTRM: false,       // Optional
        enableIRT: false,       // Optional
        enableTeacherModel: false,
        enableStudentModel: true, // Cost-sensitive
        enableLoRA: false,
        enableSQL: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'balanced',
      expectedLatency: 2000,
      expectedCost: 0.035
    });

    // General Workflow (fallback)
    this.workflowProfiles.set('general', {
      useCase: 'general',
      domain: 'general',
      requiredComponents: [
        'ACE Framework',
        'IRT Scoring'
      ],
      optionalComponents: [
        'ReasoningBank',
        'TRM Verification'
      ],
      config: {
        enableACE: true,
        enableIRT: true,
        enableReasoningBank: false,
        enableTRM: false,
        enableTeacherModel: false,
        enableStudentModel: true,
        enableSWiRL: false,
        enableDSPy: false,
        enableLoRA: false,
        enableSQL: false,
        enableMultiQuery: false,
        enableWeaviateRetrieveDSPy: false
      },
      priority: 'balanced',
      expectedLatency: 1000,
      expectedCost: 0.01
    });
  }

  /**
   * Analyze query to detect business use case
   */
  async analyzeQuery(query: string, metadata?: any): Promise<QueryAnalysis> {
    // Enhanced detection logic - Smart Router expects TaskType, so we detect directly
    // We'll use our own detection logic instead of Smart Router for use case detection
    const useCase = this.detectBusinessUseCase(query, {});
    const domain = metadata?.domain || 'general';
    
    // Analyze complexity and requirements
    const complexity = this.estimateComplexity(query, useCase);
    const requiresVerification = this.needsVerification(useCase);
    const requiresRetrieval = this.needsRetrieval(query, useCase);
    const requiresOptimization = complexity > 0.7;
    const requiresRealTimeData = this.needsRealTimeData(query, useCase);
    
    // Detect language and jurisdiction
    const language = this.detectLanguage(query);
    const jurisdiction = this.detectJurisdiction(query, useCase);
    
    return {
      businessUseCase: useCase,
      domain,
      complexity,
      requiresVerification,
      requiresRetrieval,
      requiresOptimization,
      requiresRealTimeData,
      language,
      jurisdiction,
      confidence: 0.85 // TODO: Implement confidence scoring
    };
  }

  /**
   * Detect business use case from query
   */
  private detectBusinessUseCase(query: string, routing: any): BusinessUseCase {
    const lowerQuery = query.toLowerCase();
    
    // Insurance Premium
    if (
      /insurance|premium|coverage|policy|underwriting|actuarial|risk assessment/i.test(query) ||
      routing.taskType === 'insurance_analysis'
    ) {
      return 'insurance_premium';
    }
    
    // LATAM Legal
    if (
      /latam|mexico|brazil|argentina|chile|colombia|peru|venezuela|panama/i.test(query) &&
      /legal|law|contract|compliance|regulation|litigation/i.test(query)
    ) {
      return 'legal_latam';
    }
    
    // US Legal
    if (
      /legal|law|contract|compliance|regulation|litigation|case law/i.test(query) &&
      !/latam|mexico|brazil|argentina|chile|colombia|peru/i.test(query)
    ) {
      return 'legal_us';
    }
    
    // Manufacturing
    if (
      /manufacturing|production|factory|assembly line|quality control|supply chain/i.test(query)
    ) {
      return 'manufacturing';
    }
    
    // Marketing (check before healthcare to avoid false positives)
    if (
      /marketing|campaign|brand|audience|engagement|conversion|advertising|social media|content strategy/i.test(query)
    ) {
      return 'marketing';
    }
    
    // Healthcare
    if (
      /healthcare|medical|diagnosis|treatment|patient|clinical|pharmaceutical/i.test(query) &&
      !/marketing|campaign|brand|advertising/i.test(query) // Don't match if it's marketing
    ) {
      return 'healthcare';
    }
    
    // Financial
    if (
      /financial|investment|portfolio|trading|market analysis|risk|valuation/i.test(query)
    ) {
      return 'financial';
    }
    
    // Real Estate
    if (
      /real estate|property|real estate|valuation|appraisal|market analysis/i.test(query)
    ) {
      return 'real_estate';
    }
    
    // Technology
    if (
      /technology|software|code|algorithm|system architecture|api|integration/i.test(query)
    ) {
      return 'technology';
    }
    
    // Science/Research
    if (
      /research|scientific|study|experiment|hypothesis|methodology|data analysis|publication|peer review/i.test(query)
    ) {
      return 'science_research';
    }
    
    // Copywriting (check before marketing - more specific)
    if (
      /copywriting|copy|content|writing|headlines|ad copy|email|blog post|article|editorial/i.test(query) &&
      !/marketing|campaign|strategy/i.test(query) // Don't match if it's marketing strategy
    ) {
      return 'copywriting';
    }
    
    // Financial Research
    if (
      /financial research|market research|equity research|analyst report|financial modeling|valuation model|investment thesis/i.test(query)
    ) {
      return 'financial_research';
    }
    
    // Business Analysis
    if (
      /business analysis|strategic analysis|competitive analysis|market analysis|business strategy|swot|pestel/i.test(query)
    ) {
      return 'business_analysis';
    }
    
    // Consulting
    if (
      /consulting|consultant|advisory|recommendation|strategic planning|business consulting/i.test(query)
    ) {
      return 'consulting';
    }
    
    // Sales
    if (
      /sales|pitch|proposal|deal|negotiation|customer acquisition|sales strategy|revenue/i.test(query)
    ) {
      return 'sales';
    }
    
    // Product Management
    if (
      /product management|product strategy|roadmap|feature|user story|sprint|backlog|product launch/i.test(query)
    ) {
      return 'product_management';
    }
    
    return 'general';
  }

  /**
   * Estimate query complexity (0-1)
   */
  private estimateComplexity(query: string, useCase: BusinessUseCase): number {
    let complexity = 0.5; // Base complexity
    
    // Query length factor
    if (query.length > 200) complexity += 0.2;
    if (query.length > 500) complexity += 0.1;
    
    // Use case complexity
    const highComplexityCases: BusinessUseCase[] = [
      'insurance_premium',
      'legal_latam',
      'legal_us',
      'healthcare',
      'financial_research',
      'science_research',
      'consulting'
    ];
    if (highComplexityCases.includes(useCase)) complexity += 0.2;
    
    // Multi-step reasoning indicators
    if (/analyze|compare|evaluate|explain|step|process/i.test(query)) complexity += 0.15;
    
    return Math.min(1, complexity);
  }

  /**
   * Determine if verification is needed
   */
  private needsVerification(useCase: BusinessUseCase): boolean {
    return [
      'insurance_premium',
      'legal_latam',
      'legal_us',
      'healthcare',
      'financial',
      'financial_research',
      'science_research'
    ].includes(useCase);
  }

  /**
   * Determine if retrieval is needed
   */
  private needsRetrieval(query: string, useCase: BusinessUseCase): boolean {
    // Legal and insurance always need retrieval
    if (['legal_latam', 'legal_us', 'insurance_premium'].includes(useCase)) {
      return true;
    }
    
    // Check for retrieval indicators
    return /find|search|retrieve|get|lookup|reference|case|example/i.test(query);
  }

  /**
   * Determine if real-time data is needed
   */
  private needsRealTimeData(query: string, useCase: BusinessUseCase): boolean {
    return /current|latest|now|today|recent|live|real-time|current price|market/i.test(query);
  }

  /**
   * Detect query language
   */
  private detectLanguage(query: string): string {
    // Simple heuristic - can be enhanced
    if (/español|méxico|argentina|chile|colombia/i.test(query)) return 'es';
    if (/português|brasil|brazil/i.test(query)) return 'pt';
    return 'en';
  }

  /**
   * Detect jurisdiction
   */
  private detectJurisdiction(query: string, useCase: BusinessUseCase): string | undefined {
    if (useCase === 'legal_latam') return 'LATAM';
    if (useCase === 'legal_us') return 'US';
    
    if (/united states|usa|us law|american/i.test(query)) return 'US';
    if (/latam|mexico|brazil|argentina|chile|colombia/i.test(query)) return 'LATAM';
    if (/europe|eu|european union/i.test(query)) return 'EU';
    
    return undefined;
  }

  /**
   * Select optimal workflow profile
   */
  async selectWorkflow(
    analysis: QueryAnalysis,
    constraints?: {
      maxLatency?: number;
      maxCost?: number;
      priority?: 'speed' | 'quality' | 'cost' | 'balanced';
    }
  ): Promise<WorkflowProfile> {
    const baseProfile = this.workflowProfiles.get(analysis.businessUseCase);
    if (!baseProfile) {
      return this.workflowProfiles.get('general')!;
    }

    // Apply constraints
    let profile = { ...baseProfile };
    
    if (constraints?.priority) {
      profile.priority = constraints.priority;
    }
    
    // Adjust for cost constraints
    if (constraints?.maxCost && profile.expectedCost > constraints.maxCost) {
      profile = this.createCostOptimizedProfile(profile);
    }
    
    // Adjust for latency constraints
    if (constraints?.maxLatency && profile.expectedLatency > constraints.maxLatency) {
      profile = this.createSpeedOptimizedProfile(profile);
    }
    
    // Fine-tune based on complexity
    if (analysis.complexity > 0.8) {
      profile.config.enableTRM = true;
      profile.config.enableTeacherModel = true;
      profile.requiredComponents.push('TRM Verification');
    }
    
    // Add jurisdiction-specific components for legal
    if (analysis.jurisdiction && profile.useCase.startsWith('legal_')) {
      profile = this.addJurisdictionComponents(profile, analysis.jurisdiction);
    }
    
    return profile;
  }

  /**
   * Create cost-optimized profile
   */
  private createCostOptimizedProfile(profile: WorkflowProfile): WorkflowProfile {
    const optimized = { ...profile };
    optimized.config.enableTeacherModel = false;
    optimized.config.enableStudentModel = true;
    optimized.config.enableTRM = false;
    optimized.config.enableSWiRL = false;
    optimized.priority = 'cost';
    optimized.expectedCost *= 0.3;
    optimized.expectedLatency *= 0.8;
    return optimized;
  }

  /**
   * Create speed-optimized profile
   */
  private createSpeedOptimizedProfile(profile: WorkflowProfile): WorkflowProfile {
    const optimized = { ...profile };
    optimized.config.enableTRM = false;
    optimized.config.enableSWiRL = false;
    optimized.config.enableReasoningBank = false;
    optimized.config.enableMultiQuery = false;
    optimized.priority = 'speed';
    optimized.expectedLatency *= 0.6;
    return optimized;
  }

  /**
   * Add jurisdiction-specific components
   */
  private addJurisdictionComponents(
    profile: WorkflowProfile,
    jurisdiction: string
  ): WorkflowProfile {
    const enhanced = { ...profile };
    
    if (jurisdiction === 'LATAM') {
      enhanced.requiredComponents.push('Multi-Query Expansion'); // Broader search
      enhanced.config.enableMultiQuery = true;
    } else if (jurisdiction === 'US') {
      enhanced.requiredComponents.push('Weaviate Retrieval'); // Case law search
      enhanced.config.enableWeaviateRetrieveDSPy = true;
    }
    
    return enhanced;
  }

  /**
   * Execute workflow
   */
  async execute(
    query: string,
    metadata?: any,
    constraints?: {
      maxLatency?: number;
      maxCost?: number;
      priority?: 'speed' | 'quality' | 'cost' | 'balanced';
    }
  ): Promise<WorkflowExecution> {
    const startTime = Date.now();
    
    // Step 1: Analyze query
    const analysis = await this.analyzeQuery(query, metadata);
    console.log(`🔍 Detected: ${analysis.businessUseCase} (${analysis.domain})`);
    console.log(`   Complexity: ${(analysis.complexity * 100).toFixed(0)}%`);
    console.log(`   Verification needed: ${analysis.requiresVerification}`);
    
    // Step 2: Select workflow profile
    const profile = await this.selectWorkflow(analysis, constraints);
    console.log(`📋 Selected workflow: ${profile.useCase}`);
    console.log(`   Components: ${profile.requiredComponents.join(', ')}`);
    console.log(`   Priority: ${profile.priority}`);
    
    // Step 3: Build permutation config
    const config: PermutationConfig = {
      enableTeacherModel: profile.config.enableTeacherModel ?? false,
      enableStudentModel: profile.config.enableStudentModel ?? false,
      enableMultiQuery: profile.config.enableMultiQuery ?? false,
      enableReasoningBank: profile.config.enableReasoningBank ?? false,
      enableLoRA: profile.config.enableLoRA ?? false,
      enableIRT: profile.config.enableIRT ?? false,
      enableDSPy: profile.config.enableDSPy ?? false,
      enableACE: profile.config.enableACE ?? false,
      enableSWiRL: profile.config.enableSWiRL ?? false,
      enableTRM: profile.config.enableTRM ?? false,
      enableSQL: profile.config.enableSQL ?? false,
      enableWeaviateRetrieveDSPy: profile.config.enableWeaviateRetrieveDSPy ?? false,
      enableRAG: profile.config.enableRAG ?? false,
    };
    
    // Step 4: Execute with specialized config
    const engine = new PermutationEngine(config);
    const result = await engine.execute(query, profile.domain);
    
    const executionTime = Date.now() - startTime;
    
    // Step 5: Build execution report
    const execution: WorkflowExecution = {
      workflowProfile: profile,
      activatedComponents: profile.requiredComponents,
      executionTime,
      cost: result.metadata.cost,
      quality: result.metadata.quality_score,
      trace: result.trace.steps
    };
    
    console.log(`✅ Workflow execution complete`);
    console.log(`   Time: ${executionTime}ms (expected: ${profile.expectedLatency}ms)`);
    console.log(`   Cost: $${execution.cost.toFixed(4)} (expected: $${profile.expectedCost.toFixed(4)})`);
    console.log(`   Quality: ${(execution.quality * 100).toFixed(0)}%`);
    
    return execution;
  }

  /**
   * Get available workflow profiles
   */
  getAvailableProfiles(): WorkflowProfile[] {
    return Array.from(this.workflowProfiles.values());
  }

  /**
   * Register custom workflow profile
   */
  registerProfile(profile: WorkflowProfile): void {
    this.workflowProfiles.set(profile.useCase, profile);
  }
}

// Singleton instance
let orchestratorInstance: AdaptiveWorkflowOrchestrator | undefined;

export function getAdaptiveWorkflowOrchestrator(): AdaptiveWorkflowOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AdaptiveWorkflowOrchestrator();
  }
  return orchestratorInstance;
}

