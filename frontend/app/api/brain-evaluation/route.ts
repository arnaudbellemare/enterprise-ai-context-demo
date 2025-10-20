import { NextRequest, NextResponse } from 'next/server';
import { brainEvaluationSystem } from '../../../lib/brain-evaluation-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, response, domain, reasoningMode, patternsActivated, metadata } = body;

    if (!query || !response) {
      return NextResponse.json(
        { error: 'Query and response are required' },
        { status: 400 }
      );
    }

    console.log('📊 Brain Evaluation: Starting evaluation...');
    console.log(`   Query: ${query.substring(0, 100)}...`);
    console.log(`   Domain: ${domain || 'general'}`);
    console.log(`   Response Length: ${response.length} characters`);

    const startTime = Date.now();

    // Create evaluation sample
    const evaluationSample = {
      query,
      response,
      domain: domain || 'general',
      reasoningMode: reasoningMode || 'standard',
      patternsActivated: patternsActivated || [],
      metadata: metadata || {}
    };

    // Perform comprehensive evaluation
    const evaluation = await brainEvaluationSystem.evaluateBrainResponse(evaluationSample);
    
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`✅ Brain Evaluation: Completed (${processingTime}s)`);
    console.log(`   Overall Score: ${(evaluation.overallScore * 100).toFixed(1)}%`);
    console.log(`   Domain Scores: ${evaluation.domainScores.length}`);
    console.log(`   Recommendations: ${evaluation.recommendations.length}`);

    return NextResponse.json({
      success: true,
      evaluation: {
        overallScore: evaluation.overallScore,
        domainScores: evaluation.domainScores,
        recommendations: evaluation.recommendations,
        processingTime,
        timestamp: new Date().toISOString()
      },
      metadata: {
        query_length: query.length,
        response_length: response.length,
        domain: domain || 'general',
        reasoning_mode: reasoningMode || 'standard',
        patterns_activated: patternsActivated || [],
        evaluation_framework: 'open-evals'
      }
    });

  } catch (error: any) {
    console.error('❌ Brain Evaluation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        fallback: {
          overallScore: 0.5,
          domainScores: [{
            name: 'error_evaluation',
            score: 0.5,
            reason: 'Evaluation failed, using fallback score'
          }],
          recommendations: ['Fix evaluation system', 'Check error logs'],
          processingTime: 0.1
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Brain Evaluation System',
    description: 'Real-time quality assessment using open-evals framework',
    capabilities: [
      'Creative reasoning evaluation',
      'Legal analysis assessment',
      'Technology optimization evaluation',
      'Domain-specific quality metrics',
      'Automated recommendations'
    ],
    endpoints: {
      POST: '/api/brain-evaluation',
      description: 'Evaluate brain system response quality'
    }
  });
}
