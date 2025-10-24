/**
 * Advanced Teacher-Student-Judge API Route
 * 
 * Uses the full Permutation AI stack:
 * - ACE (Adaptive Context Enhancement)
 * - AX-LLM (Advanced Reasoning)
 * - GEPA (Genetic-Pareto Prompt Evolution)
 * - DSPy (Declarative Self-improving Python)
 * - PromptMii (Prompt Optimization)
 * - SWiRL (Self-Improving Workflow Reinforcement Learning)
 * - TRM (Tree of Reasoning Methods)
 * - GraphRAG (Graph Retrieval-Augmented Generation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { advancedTeacherStudentJudge, AdvancedTeacherStudentJudgeRequest } from '../../../../lib/teacher-student-judge-advanced';

export async function POST(request: NextRequest) {
  try {
    const body: AdvancedTeacherStudentJudgeRequest = await request.json();
    
    console.log('🚀 Advanced Teacher-Student-Judge starting...', {
      artist: body.artwork.artist,
      title: body.artwork.title
    });

    // Use the advanced Teacher-Student-Judge with full Permutation AI stack
    const result = await advancedTeacherStudentJudge.processValuation(body);
    
    console.log('✅ Advanced Teacher-Student-Judge completed', {
      success: result.success,
      teacherConfidence: result.data.teacher.confidence,
      studentLearning: result.data.student.learningScore,
      judgeAgreement: result.data.judge.agreementScore,
      selfTrainingEffectiveness: result.data.judge.selfTrainingEffectiveness
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Advanced Teacher-Student-Judge failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Advanced Teacher-Student-Judge processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
