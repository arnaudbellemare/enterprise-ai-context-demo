import { NextRequest, NextResponse } from 'next/server';
import { evaluateWithCreativePatterns, createCreativeJudge } from '../../../lib/creative-judge-prompts';

/**
 * Creative Judge API
 * 
 * Uses powerful prompting patterns that unlock creative, non-formulaic evaluation:
 * 1. "Let's think about this differently" - Breaks cookie-cutter responses
 * 2. "What am I not seeing here?" - Finds blind spots
 * 3. "Break this down for me" - Deep analysis
 * 4. "What would you do in my shoes?" - Opinionated advice
 * 5. "Here's what I'm really asking" - Clarifies intent
 * 6. "What else should I know?" - Additional context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      response,
      domain = 'general',
      context,
      config
    } = body;

    if (!prompt || !response) {
      return NextResponse.json(
        { error: 'Both prompt and response are required' },
        { status: 400 }
      );
    }

    console.log('🎨 Creative Judge API Request:', {
      prompt: prompt.substring(0, 60),
      responseLength: response.length,
      domain
    });

    // Evaluate with creative patterns
    const evaluation = await evaluateWithCreativePatterns(prompt, response, domain, context);

    console.log('✅ Creative Judge evaluation completed:', {
      overallScore: evaluation.overall_score.toFixed(3),
      blindSpots: evaluation.creative_insights.blind_spots.length,
      nonObviousIssues: evaluation.non_obvious_issues.length,
      unexpectedStrengths: evaluation.unexpected_strengths.length
    });

    return NextResponse.json({
      success: true,
      evaluation,
      summary: {
        overall_score: evaluation.overall_score,
        blind_spots_found: evaluation.creative_insights.blind_spots.length,
        non_obvious_issues: evaluation.non_obvious_issues.length,
        unexpected_strengths: evaluation.unexpected_strengths.length,
        confidence: evaluation.confidence
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Creative Judge API error:', error);

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
    message: 'Creative Judge Evaluation API',
    description: 'Uses powerful prompting patterns for non-formulaic, insightful evaluation',
    promptingPatterns: [
      {
        pattern: '"Let\'s think about this differently"',
        effect: 'Immediately stops cookie-cutter responses, gets creative',
        benefit: 'Finds unconventional angles and insights'
      },
      {
        pattern: '"What am I not seeing here?"',
        effect: 'Finds blind spots and hidden assumptions',
        benefit: 'Discovers issues you didn\'t know to look for'
      },
      {
        pattern: '"Break this down for me"',
        effect: 'Forces deep, granular analysis',
        benefit: 'Gets the science, technique, and mechanics'
      },
      {
        pattern: '"What would you do in my shoes?"',
        effect: 'Gets actual opinions, not neutral evaluation',
        benefit: 'Practical, actionable advice'
      },
      {
        pattern: '"Here\'s what I\'m really asking"',
        effect: 'Clarifies hidden intent behind questions',
        benefit: 'Addresses what you actually need, not just what you asked'
      },
      {
        pattern: '"What else should I know?"',
        effect: 'Surfaces unexpected context and warnings',
        benefit: 'The secret sauce - gets info you never thought to ask for'
      }
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/creative-judge',
      body: {
        prompt: 'string (required) - The original prompt being evaluated',
        response: 'string (required) - The AI response to evaluate',
        domain: 'string (optional) - Domain context (default: "general")',
        context: 'object (optional) - Additional context',
        config: {
          evaluation_type: '"classification" | "regression" | "reasoning_intensive"',
          strictness: '"lenient" | "moderate" | "strict"',
          focus_areas: 'string[] - Areas to focus on',
          edge_cases: 'string[] - Edge cases to check'
        }
      }
    },
    outputIncludes: {
      creative_insights: {
        different_perspective: 'Unconventional take on the response',
        blind_spots: 'Array of hidden assumptions and issues',
        deep_breakdown: 'Granular analysis of mechanics',
        opinionated_advice: 'Honest, practical recommendations',
        hidden_questions: 'What\'s really being asked',
        additional_context: 'Warnings and context you didn\'t know to ask for'
      },
      non_obvious_issues: 'Subtle problems formulaic eval would miss',
      unexpected_strengths: 'Clever approaches not immediately obvious',
      standard_metrics: 'Traditional dimensions + reasoning + edge cases'
    },
    exampleResponse: {
      overall_score: 0.78,
      blind_spots_found: 4,
      non_obvious_issues: 2,
      unexpected_strengths: 3,
      confidence: 0.85,
      creative_insights: {
        different_perspective: 'What if this is actually brilliant because...',
        blind_spots: [
          'Assumes linear progression, but real-world is iterative',
          'Missing consideration of resource constraints',
          'Implicit bias toward technical solutions'
        ],
        deep_breakdown: 'The response uses a three-layer structure...',
        opinionated_advice: 'Honestly, I\'d scrap the intro and jump straight to...',
        hidden_questions: [
          'Will this actually work in practice? (not just is it accurate)',
          'Does this solve the real problem? (not just answer the question)'
        ],
        additional_context: [
          'Warning: This advice is time-sensitive because...',
          'Important context: This relies on X which might not be available'
        ]
      }
    },
    comparisonToStandardJudge: {
      standard: 'Formulaic: accuracy, completeness, clarity scores',
      creative: 'Pattern-based: blind spots, non-obvious issues, opinionated advice',
      benefit: 'Gets insights that standard evaluation completely misses'
    },
    integration: {
      standalone: 'Use directly via this API',
      withUnifiedPipeline: 'Integrate as evaluation step in unified pipeline',
      withTeacherStudent: 'Use to evaluate teacher-student learning quality'
    }
  });
}

