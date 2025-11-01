import { NextRequest, NextResponse } from 'next/server';
import { promptMIIGEPAOptimizer, CompoundOptimizationConfig } from '@/lib/promptmii-gepa-optimizer';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      domain = 'general',
      taskType = 'analysis',
      config
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log(`🔬 PromptMII+GEPA API: Optimizing prompt for ${domain}/${taskType}`);

    // Apply custom config if provided
    const customConfig: Partial<CompoundOptimizationConfig> = config || {};
    const optimizer = new (await import('@/lib/promptmii-gepa-optimizer')).PromptMIIGEPAOptimizer(
      {
        enablePromptMII: customConfig.enablePromptMII ?? true,
        promptMIITokenReductionTarget: customConfig.promptMIITokenReductionTarget ?? 0.65,
        enableGEPA: customConfig.enableGEPA ?? true,
        gepaObjectives: customConfig.gepaObjectives ?? ['quality', 'cost'],
        gepaMaxGenerations: customConfig.gepaMaxGenerations ?? 5,
        useRealMarketData: customConfig.useRealMarketData ?? true,
        enableCaching: customConfig.enableCaching ?? true,
        cacheTTL: customConfig.cacheTTL ?? 3600000
      }
    );

    const result = await optimizer.optimize(prompt, domain, taskType);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('PromptMII+GEPA optimization failed:', error);
    return NextResponse.json(
      {
        error: 'Optimization failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

