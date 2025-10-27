/**
 * API Endpoint: Semiotic Analysis
 * 
 * Provides explicit Picca Semiotic Framework analysis of LLM outputs
 * Based on: arXiv:2505.17080v2 - "Not Minds, but Signs"
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  PiccaSemioticFramework,
  SemioticIntegration,
  type SemioticContext 
} from '@/lib/picca-semiotic-framework';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      output,
      context,
      analysisType = 'complete',
      enhancePrompt = false,
      desiredZone,
      desiredOpenness
    } = await req.json();

    // Validate required fields
    if (!prompt || !output) {
      return NextResponse.json(
        { error: 'Both prompt and output are required' },
        { status: 400 }
      );
    }

    const framework = new PiccaSemioticFramework();
    const integration = new SemioticIntegration();

    // Create default context if not provided
    const semioticContext: SemioticContext = context || {
      domain: 'general',
      semioticZone: 'vernacular',
      culturalFrame: 'contemporary',
      rhetoricalMode: 'formal',
      generationContext: {}
    };

    // Handle different analysis types
    switch (analysisType) {
      case 'complete':
        // Full Peircean + Eco + Lotman analysis
        const completeAnalysis = await framework.analyzeOutput(
          prompt,
          output,
          semioticContext
        );

        return NextResponse.json({
          success: true,
          analysisType: 'complete',
          ...completeAnalysis,
          interpretation: {
            peircean: 'Output analyzed as triadic sign (representamen-object-interpretant)',
            eco: 'Output treated as open work requiring interpretive cooperation',
            lotman: 'Output positioned within semiospheric navigation'
          },
          philosophy: {
            framework: 'Picca Semiotic Framework',
            paper: 'arXiv:2505.17080v2',
            keyInsight: 'LLMs are semiotic machines, not cognitive systems'
          }
        });

      case 'peircean':
        // Peircean triadic analysis only
        const peirceanAnalyzer = framework['peirceanAnalyzer'];
        const peirceanSign = await peirceanAnalyzer.analyzeAsSign(
          output,
          prompt,
          semioticContext
        );

        return NextResponse.json({
          success: true,
          analysisType: 'peircean',
          sign: peirceanSign,
          interpretation: {
            representamen: 'The sign itself (LLM output)',
            object: 'What it refers to (NULL for LLMs - no grounding)',
            interpretant: 'Multiple possible interpretations',
            keyInsight: 'LLMs produce representamens that elicit interpretants, but lack object'
          }
        });

      case 'openWork':
        // Eco's open work analysis only
        const openWorkAnalyzer = framework['openWorkAnalyzer'];
        const openWork = await openWorkAnalyzer.analyzeAsOpenWork(
          output,
          prompt,
          semioticContext.domain
        );

        return NextResponse.json({
          success: true,
          analysisType: 'openWork',
          openWork,
          interpretation: {
            concept: 'Output as field of interpretive possibilities',
            cooperation: 'Requires active reader engagement',
            polysemy: 'Multiple valid readings possible',
            keyInsight: 'Like Berio\'s Sequenza I - activated by interpretation, not fixed message'
          }
        });

      case 'semiosphere':
        // Lotman's semiosphere navigation only
        const navigator = framework['semiosphereNavigator'];
        const navigation = await navigator.analyzeNavigation(
          prompt,
          output,
          semioticContext,
          semioticContext
        );

        return NextResponse.json({
          success: true,
          analysisType: 'semiosphere',
          navigation,
          interpretation: {
            concept: 'Navigation through cultural ecology of signs',
            zones: 'Different domains/discourses within semiosphere',
            borders: 'Translation/transformation between zones',
            keyInsight: 'Meaning shaped by cultural environment (semiosphere)'
          }
        });

      case 'promptEvaluation':
        // Evaluate prompt as semiotic act
        const promptAnalysis = await framework.evaluatePromptAsSemioticAct(
          prompt,
          semioticContext
        );

        return NextResponse.json({
          success: true,
          analysisType: 'promptEvaluation',
          promptAnalysis,
          interpretation: {
            concept: 'Prompts are semiotic acts, not neutral commands',
            contract: 'Creates interpretive contract with LLM',
            framing: 'Establishes genre, register, ideological position',
            keyInsight: 'Prompting is semiotic negotiation, not information retrieval'
          }
        });

      case 'enhancement':
        // Enhance prompt semiotically
        if (!desiredZone || desiredOpenness === undefined) {
          return NextResponse.json(
            { error: 'For enhancement, provide desiredZone and desiredOpenness' },
            { status: 400 }
          );
        }

        const enhanced = await integration.enhancePromptSemiotically(
          prompt,
          desiredZone,
          desiredOpenness
        );

        return NextResponse.json({
          success: true,
          analysisType: 'enhancement',
          ...enhanced,
          interpretation: {
            concept: 'Semiotic-aware prompt engineering',
            guidance: 'Navigate to specific zones with desired openness',
            keyInsight: 'Prompts can be enhanced through explicit semiotic framing'
          }
        });

      default:
        return NextResponse.json(
          { error: `Unknown analysis type: ${analysisType}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Semiotic analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Semiotic analysis failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for framework info
export async function GET() {
  return NextResponse.json({
    framework: 'Picca Semiotic Framework',
    paper: {
      title: 'Not Minds, but Signs: Reframing LLMs through Semiotics',
      arxiv: 'arXiv:2505.17080v2',
      date: 'July 1, 2025',
      author: 'Davide Picca, University of Lausanne'
    },
    philosophy: {
      thesis: 'LLMs should be understood as semiotic machines, not cognitive systems',
      foundations: [
        'Peircean Semiotics: Triadic sign structure',
        'Eco\'s Open Work: Outputs as interpretive possibilities',
        'Lotman\'s Semiosphere: Operation within cultural ecology'
      ],
      keyPrinciples: [
        'LLMs manipulate signs, not meanings',
        'Prompts are semiotic acts creating interpretive contracts',
        'Outputs are polysemic representamens requiring interpretation',
        'Meaning emerges through situated, dialogic engagement',
        'No anthropomorphism: No "understanding" or "thinking"'
      ]
    },
    analysisTypes: {
      complete: 'Full Peircean + Eco + Lotman analysis',
      peircean: 'Triadic sign analysis only',
      openWork: 'Eco\'s open work analysis only',
      semiosphere: 'Lotman\'s semiospheric navigation only',
      promptEvaluation: 'Evaluate prompt as semiotic act',
      enhancement: 'Enhance prompt with semiotic guidance'
    },
    usage: {
      endpoint: '/api/semiotic-analysis',
      method: 'POST',
      requiredFields: ['prompt', 'output'],
      optionalFields: ['context', 'analysisType', 'desiredZone', 'desiredOpenness']
    }
  });
}

