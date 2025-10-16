import { NextRequest, NextResponse } from 'next/server';
import AxLLMDSPyTeacherStudent from '../../../../lib/ax-llm-dspy-teacher-student';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for complex optimization

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      domain = 'general',
      optimizationRounds = 2,
      useRealPerplexity = true
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🎓 AX LLM DSPy Teacher-Student Request:`);
    console.log(`   Query: ${query}`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Optimization Rounds: ${optimizationRounds}`);
    console.log(`   Real Perplexity: ${useRealPerplexity}`);

    const teacherStudent = new AxLLMDSPyTeacherStudent();

    if (!useRealPerplexity || !process.env.PERPLEXITY_API_KEY) {
      console.log('⚠️ Perplexity API key not available, using Ollama-only mode');
      
      // Fallback to Ollama-only mode
      const studentResult = await teacherStudent.callOllamaStudent(query, domain);
      
      return NextResponse.json({
        success: true,
        mode: 'ollama-only',
        query,
        domain,
        result: {
          student: {
            response: studentResult.response,
            structuredOutput: studentResult.structuredOutput,
            model: 'gemma3:4b',
            tokens: studentResult.tokens,
            duration: studentResult.duration
          },
          optimization: {
            promptImprovements: ['Using Ollama-only mode'],
            accuracyBoost: 0,
            optimizationRounds: 0,
            totalDuration: studentResult.duration
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Full Teacher-Student pipeline with real Perplexity
    const result = await teacherStudent.executeTeacherStudentPipeline(
      query,
      domain,
      optimizationRounds
    );

    return NextResponse.json({
      success: true,
      mode: 'teacher-student',
      query,
      domain,
      optimizationRounds,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AX LLM DSPy Teacher-Student Error:', error);
    return NextResponse.json(
      { 
        error: 'Teacher-Student pipeline failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AX LLM DSPy Teacher-Student System',
    description: 'Real Perplexity teacher + Ollama student with structured output optimization',
    features: [
      'Real Perplexity API calls with structured output',
      'Real Ollama student with optimization',
      'DSPy prompt optimization using teacher reflection',
      'Structured JSON output generation',
      'Multi-round optimization pipeline',
      'Accuracy boost measurement'
    ],
    capabilities: {
      teacher: {
        model: 'Perplexity sonar-pro',
        capabilities: ['Real-time web search', 'Structured output', 'High accuracy'],
        cost: '$0.005 per request'
      },
      student: {
        model: 'Ollama gemma3:4b',
        capabilities: ['Local processing', 'Fast response', 'Free'],
        cost: '$0.00 per request'
      },
      optimization: {
        method: 'DSPy reflective optimization',
        rounds: '1-5 optimization rounds',
        improvement: 'Measurable accuracy boost'
      }
    },
    usage: {
      endpoint: 'POST /api/ax-dspy/teacher-student',
      parameters: {
        query: 'Required: The question or task to analyze',
        domain: 'Optional: Domain context (default: general)',
        optimizationRounds: 'Optional: Number of optimization rounds (default: 2)',
        useRealPerplexity: 'Optional: Use real Perplexity API (default: true)'
      },
      example: {
        query: 'Analyze the current AI market trends',
        domain: 'technology',
        optimizationRounds: 3
      }
    },
    requirements: {
      perplexity: 'PERPLEXITY_API_KEY environment variable for teacher model',
      ollama: 'Ollama server running with gemma3:4b model'
    },
    timestamp: new Date().toISOString()
  });
}
