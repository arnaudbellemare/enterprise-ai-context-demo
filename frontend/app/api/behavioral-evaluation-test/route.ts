/**
 * Behavioral Evaluation Test API
 * 
 * Tests the behavioral evaluation system that focuses on how we want our product to behave
 * rather than just correctness. Measures behavioral alignment across multiple dimensions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { behavioralEvaluationSystem, BehavioralEvaluationSample } from '@/lib/behavioral-evaluation-system';

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      response, 
      context = {},
      testType = 'single'
    } = await req.json();

    if (!query || !response) {
      return NextResponse.json({
        error: 'Query and response are required'
      }, { status: 400 });
    }

    const sample: BehavioralEvaluationSample = {
      query,
      response,
      context: {
        userProfile: context.userProfile,
        brandGuidelines: context.brandGuidelines,
        safetyRequirements: context.safetyRequirements,
        culturalContext: context.culturalContext
      },
      expectedBehavior: {
        tone: context.expectedTone || 'professional',
        style: context.expectedStyle || 'detailed',
        focus: context.expectedFocus || 'problem-solving'
      }
    };

    if (testType === 'single') {
      // Single behavioral evaluation
      const evaluation = await behavioralEvaluationSystem.evaluateBehavioralAlignment(sample);
      
      return NextResponse.json({
        success: true,
        evaluation: {
          overallScore: evaluation.overallScore,
          dimensionScores: evaluation.dimensionScores,
          behavioralInsights: evaluation.behavioralInsights,
          improvementRecommendations: evaluation.improvementRecommendations
        },
        metadata: {
          behavioralEvaluationEnabled: true,
          dimensionsEvaluated: evaluation.dimensionScores.length,
          timestamp: new Date().toISOString()
        }
      });
    } else if (testType === 'comprehensive') {
      // Comprehensive behavioral evaluation with multiple samples
      const samples = [
        sample,
        {
          ...sample,
          query: "I'm having trouble with my React component not re-rendering",
          response: "This is a common React issue! Let me help you debug this step by step. First, check if your component is properly using state or props. Make sure you're using useState or useEffect hooks correctly. Also, verify that your component is receiving the right props and that the parent component is passing updated data. Would you like me to see your specific code to provide more targeted help?",
          context: {
            ...context,
            expectedTone: 'helpful',
            expectedStyle: 'conversational',
            expectedFocus: 'problem-solving'
          }
        },
        {
          ...sample,
          query: "What are the benefits of using TypeScript?",
          response: "TypeScript offers several key advantages: 1) Static type checking catches errors at compile time, 2) Better IDE support with autocomplete and refactoring, 3) Improved code maintainability through explicit interfaces, 4) Enhanced team collaboration with clear contracts, and 5) Better documentation through self-documenting code. It's particularly valuable for large-scale applications and team environments.",
          context: {
            ...context,
            expectedTone: 'authoritative',
            expectedStyle: 'technical',
            expectedFocus: 'education'
          }
        }
      ];

      const report = await behavioralEvaluationSystem.generateBehavioralReport(samples);
      
      return NextResponse.json({
        success: true,
        report: report,
        metadata: {
          totalSamples: samples.length,
          behavioralEvaluationEnabled: true,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        error: 'Invalid testType. Use "single" or "comprehensive"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Behavioral evaluation test failed:', error);
    return NextResponse.json({
      error: 'Behavioral evaluation test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Behavioral Evaluation Test API',
    description: 'Tests behavioral evaluation system focused on how we want our product to behave rather than just correctness',
    endpoints: {
      'POST /api/behavioral-evaluation-test': {
        description: 'Test behavioral evaluation system',
        parameters: {
          query: 'string (required) - The input query',
          response: 'string (required) - The AI response to evaluate',
          context: 'object (optional) - Context for evaluation',
          testType: 'string (optional) - Test type: "single" or "comprehensive" (default: single)'
        },
        examples: {
          single: {
            query: "How can I improve my code quality?",
            response: "Here are several ways to improve your code quality: 1) Write clear, descriptive variable names, 2) Add comprehensive comments and documentation, 3) Use consistent formatting and style, 4) Write unit tests for your functions, 5) Refactor complex code into smaller, reusable functions, and 6) Use version control effectively. Would you like me to elaborate on any of these points?",
            context: {
              expectedTone: 'professional',
              expectedStyle: 'detailed',
              expectedFocus: 'problem-solving'
            }
          },
          comprehensive: {
            testType: "comprehensive"
          }
        }
      }
    },
    behavioralDimensions: [
      {
        name: 'user_experience',
        description: 'How well the response serves the user experience',
        weight: 0.25,
        focus: 'Clarity, completeness, actionability, efficiency, engagement'
      },
      {
        name: 'brand_voice',
        description: 'How well the response aligns with brand voice',
        weight: 0.20,
        focus: 'Tone alignment, language style, value expression, professional standards'
      },
      {
        name: 'safety_trust',
        description: 'How safe and trustworthy the response is',
        weight: 0.20,
        focus: 'Harm prevention, accuracy, transparency, privacy, ethical standards'
      },
      {
        name: 'engagement_helpfulness',
        description: 'How engaging and helpful the response is',
        weight: 0.15,
        focus: 'Relevance, value addition, encouragement, supportiveness, memorability'
      },
      {
        name: 'professional_standards',
        description: 'How professional the response is',
        weight: 0.10,
        focus: 'Competence, reliability, communication, problem-solving, continuous improvement'
      },
      {
        name: 'cultural_sensitivity',
        description: 'How culturally sensitive the response is',
        weight: 0.10,
        focus: 'Inclusivity, cultural awareness, language sensitivity, accessibility, global perspective'
      }
    ],
    keyInsight: "evals are less about measuring 'correctness' and more about quantifying how you want your product to behave",
    features: [
      'Behavioral alignment evaluation across 6 dimensions',
      'Weighted scoring system for different behavioral aspects',
      'Comprehensive behavioral insights and recommendations',
      'Integration with product behavior requirements',
      'Cultural sensitivity and inclusivity assessment',
      'Brand voice consistency evaluation',
      'User experience quality measurement'
    ]
  });
}
