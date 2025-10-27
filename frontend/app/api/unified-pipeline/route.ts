import { NextRequest, NextResponse } from 'next/server';
import { executeUnifiedPipeline } from '../../../lib/unified-permutation-pipeline';

/**
 * Unified Permutation Pipeline API
 * 
 * Integrates ALL systems:
 * - ACE (Agentic Context Engineering)
 * - GEPA (Genetic-Pareto Evolution)
 * - IRT (Item Response Theory)
 * - RVS (Recursive Verification System - formerly TRM)
 * - DSPy (Module compilation and optimization)
 * - Semiotic Inference (Deduction + Induction + Abduction + Imagination)
 * - Teacher-Student (Perplexity + Local Model)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      domain,
      context,
      config
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Unified Pipeline API Request:', {
      query: query.substring(0, 60),
      domain: domain || 'auto-detect',
      hasContext: !!context,
      hasConfig: !!config
    });

    // Execute the unified pipeline
    const result = await executeUnifiedPipeline(query, domain, context, config);

    console.log('✅ Unified Pipeline execution completed:', {
      qualityScore: result.metadata.quality_score.toFixed(3),
      componentsUsed: result.metadata.components_used.length,
      totalTime: result.metadata.performance.total_time_ms
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unified Pipeline API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint to show API documentation
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Unified Permutation Pipeline API',
    description: 'Complete integration of all PERMUTATION components',
    components: [
      {
        name: 'IRT (Item Response Theory)',
        description: 'Difficulty assessment and intelligent routing',
        phase: 'Phase 1: Routing'
      },
      {
        name: 'Semiotic Inference System',
        description: 'Deduction (logic) + Induction (experience) + Abduction (imagination)',
        phase: 'Phase 2: Inference',
        features: [
          'Deductive reasoning (formal logic)',
          'Inductive reasoning (experience-based patterns)',
          'Abductive reasoning (creative hypothesis formation)',
          'Imagination Engine (creative insights)',
          'Semiotic Processing (sign interpretation)'
        ]
      },
      {
        name: 'ACE Framework',
        description: 'Generator → Reflector → Curator pattern',
        phase: 'Phase 3: Optimization',
        threshold: 'IRT difficulty > 0.7'
      },
      {
        name: 'DSPy + GEPA',
        description: 'Module compilation with genetic algorithm optimization',
        phase: 'Phase 4: Optimization'
      },
      {
        name: 'Teacher-Student System',
        description: 'Perplexity (web search) + Local model (learning)',
        phase: 'Phase 5: Learning'
      },
      {
        name: 'RVS (Recursive Verification)',
        description: 'Iterative refinement with adaptive computation',
        phase: 'Phase 6: Verification',
        threshold: 'IRT difficulty > 0.6',
        note: 'Formerly called TRM, renamed to accurately reflect LLM-based approach'
      }
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/unified-pipeline',
      body: {
        query: 'string (required) - The question or task',
        domain: 'string (optional) - Domain hint (art, legal, business, etc.)',
        context: 'object (optional) - Additional context',
        config: {
          enableACE: 'boolean (default: true)',
          enableGEPA: 'boolean (default: true)',
          enableIRT: 'boolean (default: true)',
          enableRVS: 'boolean (default: true)',
          enableDSPy: 'boolean (default: true)',
          enableSemiotic: 'boolean (default: true)',
          enableTeacherStudent: 'boolean (default: true)',
          optimizationMode: '"quality" | "speed" | "balanced" (default: "balanced")'
        }
      }
    },
    philosophicalFoundation: {
      semioticTheory: 'C.S. Peirce\'s semiotic framework',
      beyondDescartes: 'Integrates experience and imagination, not just formal logic',
      inferenceTypes: {
        deduction: 'Formal logic (30% weight)',
        induction: 'Experience-based patterns (40% weight)',
        abduction: 'Creative imagination (30% weight)'
      },
      innovation: 'First AI system to integrate Peircean semiotics with modern ML'
    },
    accuracyNote: {
      TRM_renamed_to_RVS: 'Based on research verification, TRM renamed to RVS (Recursive Verification System)',
      reason: 'Original TRM paper uses 7M neural network, our implementation uses LLM-based recursive verification',
      status: 'Honest implementation - inspired by TRM concept but architecturally different'
    }
  });
}

