import { NextRequest, NextResponse } from 'next/server';
import { getMoEBrainOrchestrator } from '../../../lib/brain-skills/moe-orchestrator';
import { moeSkillRouter, SkillExpert } from '../../../lib/moe-skill-router';

// Initialize MoE Skill Router with expert registration
const initializeMoERouter = () => {
  // Register all brain skills as experts in the MoE system
  const brainSkills = [
    {
      id: 'gepa_optimization',
      name: 'GEPA Optimization',
      description: 'Generative Prompt Evolution Agent for iterative optimization',
      domain: 'optimization',
      capabilities: ['prompt_optimization', 'iterative_improvement', 'performance_enhancement'],
      performance: { accuracy: 0.85, speed: 0.7, reliability: 0.9, cost: 0.3 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.85, avgResponseTime: 2.5 }
    },
    {
      id: 'ace_framework',
      name: 'ACE Framework',
      description: 'Agentic Context Engineering for comprehensive context management',
      domain: 'context',
      capabilities: ['context_management', 'playbook_generation', 'context_evolution'],
      performance: { accuracy: 0.9, speed: 0.8, reliability: 0.95, cost: 0.4 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.9, avgResponseTime: 3.2 }
    },
    {
      id: 'trm_engine',
      name: 'TRM Engine',
      description: 'Tiny Recursion Model for multi-phase reasoning',
      domain: 'reasoning',
      capabilities: ['recursive_reasoning', 'multi_phase_processing', 'verification_loops'],
      performance: { accuracy: 0.88, speed: 0.6, reliability: 0.92, cost: 0.5 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.88, avgResponseTime: 4.1 }
    },
    {
      id: 'teacher_student',
      name: 'Teacher-Student System',
      description: 'Cost-effective learning with Perplexity (teacher) and Ollama (student)',
      domain: 'learning',
      capabilities: ['knowledge_transfer', 'cost_optimization', 'quality_enhancement'],
      performance: { accuracy: 0.87, speed: 0.75, reliability: 0.88, cost: 0.2 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.87, avgResponseTime: 3.5 }
    },
    {
      id: 'advanced_rag',
      name: 'Advanced RAG Techniques',
      description: 'Contextual RAG, HyDE, Agentic RAG, and Multi-vector Search',
      domain: 'retrieval',
      capabilities: ['contextual_rag', 'hyde_embeddings', 'agentic_rag', 'multi_vector_search'],
      performance: { accuracy: 0.92, speed: 0.8, reliability: 0.94, cost: 0.15 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.92, avgResponseTime: 2.8 }
    },
    {
      id: 'advanced_reranking',
      name: 'Advanced Reranking Techniques',
      description: 'Linear Combination, Cross-encoder, Cohere, and ColBERT reranking',
      domain: 'ranking',
      capabilities: ['linear_combination', 'cross_encoder', 'cohere_reranking', 'colbert_reranking'],
      performance: { accuracy: 0.89, speed: 0.85, reliability: 0.91, cost: 0.1 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.89, avgResponseTime: 1.8 }
    },
    {
      id: 'multilingual_business',
      name: 'Multilingual Business Intelligence',
      description: 'Language detection, domain analysis, and RAG across languages',
      domain: 'multilingual',
      capabilities: ['language_detection', 'domain_analysis', 'constraint_analysis', 'multilingual_rag'],
      performance: { accuracy: 0.91, speed: 0.7, reliability: 0.93, cost: 0.25 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.91, avgResponseTime: 3.0 }
    },
    {
      id: 'quality_evaluation',
      name: 'Quality Evaluation System',
      description: 'Heuristic evaluation and quality assessment framework',
      domain: 'evaluation',
      capabilities: ['quality_assessment', 'performance_metrics', 'evaluation_framework'],
      performance: { accuracy: 0.94, speed: 0.7, reliability: 0.96, cost: 0.25 },
      metadata: { lastUsed: new Date(), usageCount: 0, successRate: 0.94, avgResponseTime: 1.5 }
    }
  ];

  // Register all experts
  brainSkills.forEach(skill => {
    moeSkillRouter.registerExpert(skill as SkillExpert);
  });

  console.log(`🧠 MoE Router: Initialized with ${brainSkills.length} expert skills`);
  console.log(`🧠 MoE Router: Total experts registered: ${moeSkillRouter['experts'].size}`);
};

// Initialize MoE router
initializeMoERouter();

/**
 * Complete MoE Brain API
 * POST /api/brain-moe
 * Uses all MoE optimization patterns for optimal performance
 */
export async function POST(request: NextRequest) {
  try {
    const { query, context = {}, sessionId, priority = 'normal', budget, maxLatency, requiredQuality } = await request.json();

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    console.log(`🧠 MoE Brain: Processing query "${query.substring(0, 50)}..."`);

    const orchestrator = getMoEBrainOrchestrator(moeSkillRouter);
    
    const moeRequest = {
      query,
      context: {
        ...context,
        sessionId: sessionId || 'default',
        timestamp: new Date().toISOString()
      },
      sessionId,
      priority,
      budget,
      maxLatency,
      requiredQuality
    };

    const startTime = Date.now();
    const response = await orchestrator.executeQuery(moeRequest);
    const totalTime = Date.now() - startTime;

    console.log(`✅ MoE Brain: Completed in ${totalTime}ms`);
    console.log(`   Skills: ${response.metadata.skillsActivated.join(', ')}`);
    console.log(`   Cost: $${response.metadata.totalCost.toFixed(4)}`);
    console.log(`   Quality: ${response.metadata.averageQuality.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      response: response.response,
      metadata: {
        ...response.metadata,
        totalTime,
        moeOptimized: true
      },
      performance: response.performance,
      sessionId: sessionId || 'default'
    });

  } catch (error: any) {
    console.error('❌ MoE Brain API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'MoE system unavailable, please try again'
    }, { status: 500 });
  }
}

/**
 * GET /api/brain-moe
 * System status and health check
 */
export async function GET(request: NextRequest) {
  try {
    const orchestrator = getMoEBrainOrchestrator(moeSkillRouter);
    const status = orchestrator.getSystemStatus();
    const health = await orchestrator.healthCheck();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: 'MoE Brain Orchestrator',
      status,
      health,
      features: {
        topKSelection: true,
        loadBalancing: true,
        queryBatching: true,
        resourceManagement: true,
        dynamicRouting: true,
        abTesting: true
      }
    });

  } catch (error: any) {
    console.error('❌ MoE Brain status error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
