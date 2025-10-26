/**
 * Advanced Teacher-Student-Judge API Route
 * 
 * This endpoint implements the full Permutation AI stack with:
 * - Teacher-Student-Judge: Complete self-training framework
 * - MoE: Mixture of Experts for specialized knowledge
 * - ACE: Adaptive Context Enhancement
 * - GEPA: Genetic-Pareto Prompt Evolution
 * - DSPy: Declarative Self-improving
 * - PromptMii: Prompt Optimization
 * - SWiRL: Self-Improving Workflow Reinforcement Learning
 * - TRM: Tiny Recursive Model
 * - GraphRAG: Graph Retrieval-Augmented Generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { advancedTeacherStudentJudge, AdvancedTeacherStudentJudgeRequest } from '../../../../lib/teacher-student-judge-advanced';

export async function POST(request: NextRequest) {
  try {
    const body: AdvancedTeacherStudentJudgeRequest = await request.json();
    
    console.log('🚀 Advanced Teacher-Student-Judge starting...', {
      artist: body.artwork?.artist || 'Unknown',
      title: body.artwork?.title || 'Unknown',
      query: body.query || 'Unknown'
    });

    // Use the REAL Permutation AI stack
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