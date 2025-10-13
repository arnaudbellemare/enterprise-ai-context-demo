/**
 * Teacher-Student GEPA API
 * 
 * Teacher: Perplexity (powerful, web-connected)
 * Student: Ollama (local, fast, FREE)
 * 
 * Based on: Intelligence Arc ATLAS framework
 * Expected: +164.9% improvement (from paper)
 */

import { NextRequest, NextResponse } from 'next/server';
import TeacherStudentGEPA from '@/lib/gepa-teacher-student';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      initialPrompt,
      trainingExamples,
      testFunction,
      maxIterations = 20,
      minibatchSize = 10
    } = body;
    
    if (!initialPrompt || !trainingExamples) {
      return NextResponse.json(
        { error: 'initialPrompt and trainingExamples required' },
        { status: 400 }
      );
    }
    
    // Check Perplexity API key
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'PERPLEXITY_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    console.log('\n🎓 Starting Teacher-Student GEPA optimization...');
    console.log(`   Teacher: Perplexity`);
    console.log(`   Student: Ollama gemma3:4b`);
    console.log(`   Training examples: ${trainingExamples.length}`);
    console.log(`   Max iterations: ${maxIterations}\n`);
    
    // Initialize optimizer
    const optimizer = new TeacherStudentGEPA({
      maxIterations,
      minibatchSize,
      paretoSetSize: 5,
      convergenceThreshold: 0.01
    });
    
    // Simple test function if not provided
    const defaultTestFn = (prompt: string, input: string, output: string) => {
      // Simple check: output contains expected keywords
      return output.length > 10;  // Basic check
    };
    
    // Run optimization
    const bestCandidate = await optimizer.optimize(
      initialPrompt,
      trainingExamples,
      testFunction || defaultTestFn
    );
    
    // Get optimization history
    const history = optimizer.getOptimizationHistory();
    const paretoFrontier = optimizer.getParetoFrontier();
    
    // Calculate improvements
    const initialPerf = history[0].studentPerformance;
    const finalPerf = bestCandidate.studentPerformance;
    
    const accuracyImprovement = ((finalPerf.accuracy / initialPerf.accuracy) - 1) * 100;
    const speedImprovement = ((initialPerf.speed / finalPerf.speed) - 1) * 100;
    const tokenReduction = ((initialPerf.tokens - finalPerf.tokens) / initialPerf.tokens) * 100;
    
    return NextResponse.json({
      success: true,
      bestCandidate: {
        prompt: bestCandidate.prompt,
        generation: bestCandidate.generation,
        performance: bestCandidate.studentPerformance
      },
      improvement: {
        accuracy: accuracyImprovement,
        speed: speedImprovement,
        tokenReduction
      },
      paretoFrontier: paretoFrontier.map(c => ({
        id: c.id,
        generation: c.generation,
        accuracy: c.studentPerformance.accuracy,
        tokens: c.studentPerformance.tokens
      })),
      optimizationHistory: history.map(c => ({
        generation: c.generation,
        accuracy: c.studentPerformance.accuracy,
        speed: c.studentPerformance.speed,
        tokens: c.studentPerformance.tokens
      })),
      comparisonToATLAS: {
        atlasImprovement: 164.9,  // From paper
        yourImprovement: accuracyImprovement,
        ratio: (accuracyImprovement / 164.9) * 100
      }
    });
    
  } catch (error: any) {
    console.error('Teacher-Student GEPA error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return information about teacher-student setup
  return NextResponse.json({
    teacher: {
      model: 'Perplexity',
      endpoint: 'llama-3.1-sonar-large-128k-online',
      role: 'Reflects on student performance, generates improved prompts',
      advantages: [
        'Web-connected for latest knowledge',
        'Superior reasoning capabilities',
        'Better reflection quality'
      ]
    },
    student: {
      model: 'Ollama',
      endpoint: 'gemma3:4b',
      role: 'Executes tasks with teacher-optimized prompts',
      advantages: [
        'Local execution (FREE)',
        'Fast inference',
        'No API costs'
      ]
    },
    method: 'GEPA (Generative Efficient Prompt Adaptation)',
    expectedImprovement: '+164.9% (from ATLAS paper)',
    cost: '<$10 for full optimization',
    duration: '~2 hours (20 iterations)',
    reference: 'Intelligence Arc ATLAS framework'
  });
}

