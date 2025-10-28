import { NextRequest, NextResponse } from 'next/server';
import ComprehensiveSemioticSystem from '../../../../lib/semiotic-inference-system';

const semioticSystem = new ComprehensiveSemioticSystem();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      context,
      analysisType 
    } = body;

    console.log('🧠 Semiotic Inference System API:', { 
      query: query?.substring(0, 50), 
      analysisType 
    });

    let result;

    switch (analysisType) {
      case 'comprehensive':
        result = await semioticSystem.executeSemioticAnalysis(query || 'Sample query', context || {});
        break;

      case 'deduction-only':
        const deductionResult = await semioticSystem.semioticInferenceAccess.performComprehensiveInference(query || 'Sample query', context || {});
        result = {
          inference: { deduction: deductionResult.deduction },
          methodology: ['Deduction: Formal logical reasoning only'],
          philosophicalFramework: {
            foundation: 'Formal logic (Descartes\' approach)',
            limitation: 'Missing experience and imagination'
          }
        };
        break;

      case 'induction-only':
        const inductionResult = await semioticSystem.semioticInferenceAccess.performComprehensiveInference(query || 'Sample query', context || {});
        result = {
          inference: { induction: inductionResult.induction },
          methodology: ['Induction: Experience-based pattern recognition'],
          philosophicalFramework: {
            foundation: 'Empirical experience',
            limitation: 'Missing formal logic and creative imagination'
          }
        };
        break;

      case 'abduction-only':
        const abductionResult = await semioticSystem.semioticInferenceAccess.performComprehensiveInference(query || 'Sample query', context || {});
        result = {
          inference: { abduction: abductionResult.abduction },
          methodology: ['Abduction: Creative hypothesis formation with imagination'],
          philosophicalFramework: {
            foundation: 'Creative imagination and hypothesis formation',
            limitation: 'Missing formal logic and systematic experience'
          }
        };
        break;

      case 'semiotic-analysis':
        const semioticResult = await semioticSystem.executeSemioticAnalysis(query || 'Sample query', context || {});
        result = {
          semioticProcessing: semioticResult.semioticProcessing,
          methodology: ['Semiotic Analysis: Sign → Object → Interpretant'],
          philosophicalFramework: {
            foundation: 'C.S. Peirce\'s semiotic theory',
            approach: 'Beyond formal logic to include meaning and context'
          }
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid analysis type. Supported types: comprehensive, deduction-only, induction-only, abduction-only, semiotic-analysis'
        }, { status: 400 });
    }

    console.log('✅ Semiotic Inference analysis completed:', { 
      analysisType, 
      resultKeys: Object.keys(result || {}) 
    });

    return NextResponse.json({
      success: true,
      analysisType,
      result,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: Date.now(),
        components: [
          'Semiotic Inference System',
          'Imagination Engine',
          'Semiotic Processor',
          'Experiential Knowledge Base'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Semiotic Inference System API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Semiotic Inference System API - Beyond Formal Logic',
    philosophicalFoundation: {
      critique: 'Descartes\' bias of logic supremacy',
      alternative: 'C.S. Peirce\'s semiotic framework',
      integration: 'Deduction + Induction + Abduction',
      innovation: 'Experience and imagination as essential components'
    },
    availableAnalysisTypes: [
      {
        type: 'comprehensive',
        description: 'Complete semiotic analysis with all three inference types',
        parameters: ['query', 'context']
      },
      {
        type: 'deduction-only',
        description: 'Formal logical reasoning (current AI systems)',
        parameters: ['query', 'context']
      },
      {
        type: 'induction-only',
        description: 'Experience-based pattern recognition',
        parameters: ['query', 'context']
      },
      {
        type: 'abduction-only',
        description: 'Creative hypothesis formation with imagination',
        parameters: ['query', 'context']
      },
      {
        type: 'semiotic-analysis',
        description: 'Sign interpretation using Peirce\'s framework',
        parameters: ['query', 'context']
      }
    ],
    inferenceTypes: {
      deduction: {
        description: 'Formal logic: Rule-based reasoning from premises to conclusions',
        characteristics: ['High confidence', 'Rule-based', 'Deterministic'],
        limitations: ['Rigid', 'No creativity', 'No experience integration']
      },
      induction: {
        description: 'Experience-based: Learning from patterns and experiences',
        characteristics: ['Pattern recognition', 'Experience-driven', 'Probabilistic'],
        limitations: ['Limited by available data', 'No creative leaps', 'No formal validation']
      },
      abduction: {
        description: 'Creative hypothesis formation: Imagination and creative reasoning',
        characteristics: ['Creative', 'Imaginative', 'Hypothesis formation'],
        limitations: ['Lower confidence', 'Subjective', 'Hard to validate']
      }
    },
    capabilities: [
      'Semiotic Inference: Beyond formal logic supremacy',
      'Deduction: Formal logical reasoning (30% weight)',
      'Induction: Experience-based pattern recognition (40% weight)', 
      'Abduction: Creative hypothesis formation with imagination (30% weight)',
      'Semiotic Analysis: Sign → Object → Interpretant',
      'Creative Integration: Experience + Imagination + Logic',
      'Experiential Knowledge Base: Domain-specific patterns and insights',
      'Imagination Engine: Creative hypothesis formation',
      'Semiotic Processor: Sign interpretation and meaning generation'
    ],
    philosophicalInsights: [
      'Logic is a subset of semiotics (C.S. Peirce)',
      'Experience and imagination are essential for true inference',
      'Descartes\' logic supremacy bias limits AI capabilities',
      'Creative abduction is the most innovative form of reasoning',
      'Meaning depends on context, experience, and interpretation',
      'Semiotic signs connect representamen, object, and interpretant'
    ]
  });
}
