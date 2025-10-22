/**
 * OpenEvals Integration Test API
 * 
 * Tests the integration of OpenEvals with our MoE system
 * Provides comprehensive evaluation capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { openEvalsIntegration, OpenEvalsEvaluationSample } from '@/lib/openevals-integration';

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      response, 
      domain = 'general',
      testType = 'single'
    } = await req.json();

    if (!query || !response) {
      return NextResponse.json({
        error: 'Query and response are required'
      }, { status: 400 });
    }

    const sample: OpenEvalsEvaluationSample = {
      inputs: query,
      outputs: response,
      domain: domain,
      metadata: {
        timestamp: new Date().toISOString(),
        testType: testType,
        system: 'openevals-test'
      }
    };

    if (testType === 'single') {
      // Single evaluation
      const evaluation = await openEvalsIntegration.evaluateWithOpenEvals(sample);
      
      return NextResponse.json({
        success: true,
        evaluation: {
          combinedScore: evaluation.combinedScore,
          openEvalsResults: evaluation.openEvalsResults,
          brainEvaluationResults: evaluation.brainEvaluationResults,
          recommendations: evaluation.recommendations
        },
        metadata: {
          openEvalsEnabled: evaluation.openEvalsResults.length > 0,
          brainEvaluationEnabled: !!evaluation.brainEvaluationResults,
          timestamp: new Date().toISOString()
        }
      });
    } else if (testType === 'comprehensive') {
      // Comprehensive evaluation with multiple samples
      const samples = [
        sample,
        {
          ...sample,
          inputs: "What are the key considerations for data privacy in Mexico?",
          outputs: "Data privacy in Mexico is governed by the Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP). Key considerations include: 1) Consent requirements, 2) Data minimization principles, 3) Cross-border transfer restrictions, 4) Individual rights (access, rectification, cancellation, opposition), and 5) Penalties for non-compliance up to 320,000 UDIs.",
          domain: 'legal'
        },
        {
          ...sample,
          inputs: "How can I optimize my React application performance?",
          outputs: "React performance optimization strategies include: 1) Code splitting with React.lazy() and Suspense, 2) Memoization with React.memo, useMemo, and useCallback, 3) Virtual scrolling for large lists, 4) Bundle analysis and tree shaking, 5) Image optimization and lazy loading, 6) State management optimization, and 7) Server-side rendering (SSR) or static generation (SSG).",
          domain: 'technology'
        }
      ];

      const comprehensiveReport = await openEvalsIntegration.generateComprehensiveReport(samples);
      
      return NextResponse.json({
        success: true,
        report: comprehensiveReport,
        metadata: {
          totalSamples: samples.length,
          openEvalsEnabled: comprehensiveReport.summary.openEvalsEnabled,
          brainEvaluationEnabled: comprehensiveReport.summary.brainEvaluationEnabled,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        error: 'Invalid testType. Use "single" or "comprehensive"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('OpenEvals test failed:', error);
    return NextResponse.json({
      error: 'OpenEvals test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OpenEvals Integration Test API',
    endpoints: {
      'POST /api/openevals-test': {
        description: 'Test OpenEvals integration',
        parameters: {
          query: 'string (required) - The input query',
          response: 'string (required) - The AI response to evaluate',
          domain: 'string (optional) - Domain for evaluation (default: general)',
          testType: 'string (optional) - Test type: "single" or "comprehensive" (default: single)'
        },
        examples: {
          single: {
            query: "What are the benefits of using TypeScript?",
            response: "TypeScript provides static type checking, better IDE support, improved code maintainability, and helps catch errors at compile time.",
            domain: "technology"
          },
          comprehensive: {
            testType: "comprehensive"
          }
        }
      }
    },
    features: [
      'OpenEvals prebuilt evaluators (correctness, conciseness, helpfulness, harmfulness)',
      'Custom MoE quality evaluator',
      'Creative reasoning evaluation',
      'Brain evaluation system integration',
      'Comprehensive reporting',
      'Fallback mechanisms'
    ]
  });
}
