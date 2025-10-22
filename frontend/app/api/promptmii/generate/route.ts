/**
 * PromptMII API Endpoint - Generate Instructions
 * 
 * Automatically generates task-specific instructions using meta-learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPromptMII, InstructionGenerationRequest } from '@/lib/promptmii-integration';
import { logger } from '@/lib/logger';

/**
 * POST /api/promptmii/generate
 * Generate task-specific instruction
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json() as InstructionGenerationRequest;

    // Validate request
    if (!body.task || !body.domain || !body.examples || body.examples.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request. Required: task, domain, examples (min 1)'
      }, { status: 400 });
    }

    logger.info('Generating instruction with PromptMII', {
      operation: 'promptmii_api',
      metadata: {
        task: body.task,
        domain: body.domain,
        exampleCount: body.examples.length
      }
    });

    // Get PromptMII instance
    const promptmii = getPromptMII();

    // Generate instruction
    const result = await promptmii.generateInstruction(body);

    const totalTime = Date.now() - startTime;

    logger.info('Instruction generated successfully', {
      operation: 'promptmii_api',
      metadata: {
        task: body.task,
        confidence: result.confidence,
        tokenCount: result.metadata.tokenCount,
        totalTime
      }
    });

    return NextResponse.json({
      success: true,
      instruction: result.instruction,
      confidence: result.confidence,
      metadata: {
        ...result.metadata,
        totalTime
      },
      usage: {
        instructionTokens: result.metadata.tokenCount,
        comparedToICL: `${Math.round((1 - result.metadata.tokenCount / 1000) * 100)}% fewer tokens`,
        estimatedSavings: '3-13× token reduction'
      }
    });

  } catch (error: any) {
    logger.error('PromptMII generation failed', error, {
      operation: 'promptmii_api',
      metadata: {
        duration: Date.now() - startTime
      }
    });

    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: 'Instruction generation unavailable'
    }, { status: 500 });
  }
}

/**
 * GET /api/promptmii/generate
 * Get PromptMII statistics
 */
export async function GET(request: NextRequest) {
  try {
    const promptmii = getPromptMII();
    const stats = promptmii.getStats();
    const config = promptmii.getConfig();

    return NextResponse.json({
      success: true,
      stats,
      config: {
        instructionModel: config.instructionModel,
        evolutionEnabled: config.evolutionEnabled,
        performanceThreshold: config.performanceThreshold
      },
      info: {
        description: 'PromptMII: Meta-Learning Instruction Induction for LLMs',
        benefits: [
          '3-13× token reduction',
          'Task-specific instruction generation',
          'Automatic performance-based evolution',
          'Domain-aware optimization'
        ],
        repository: 'https://github.com/millix19/promptmii'
      }
    });

  } catch (error: any) {
    logger.error('PromptMII stats retrieval failed', error, {
      operation: 'promptmii_api_stats'
    });

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
