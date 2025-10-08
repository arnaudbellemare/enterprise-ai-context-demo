/**
 * DSPy Workflow Execution API
 * 
 * Execute DSPy-powered workflows with automatic optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  MarketResearchAnalyzer,
  InvestmentReportGenerator,
  RealEstateAgent,
  FinancialAnalystAgent,
  CompetitiveAnalyzer,
  DataSynthesizer,
  EntityExtractor,
  LegalAnalystAgent,
  SelfOptimizingWorkflow,
} from '@/lib/dspy-workflows';

// Module registry
const MODULE_REGISTRY: Record<string, any> = {
  'market_research_analyzer': MarketResearchAnalyzer,
  'investment_report_generator': InvestmentReportGenerator,
  'real_estate_agent': RealEstateAgent,
  'financial_analyst': FinancialAnalystAgent,
  'competitive_analyzer': CompetitiveAnalyzer,
  'data_synthesizer': DataSynthesizer,
  'entity_extractor': EntityExtractor,
  'legal_analyst': LegalAnalystAgent,
};

export async function POST(req: NextRequest) {
  try {
    const { 
      moduleName, 
      inputs, 
      optimize = false,
      trainingData = null 
    } = await req.json();

    if (!moduleName) {
      return NextResponse.json(
        { error: 'moduleName is required' },
        { status: 400 }
      );
    }

    if (!inputs) {
      return NextResponse.json(
        { error: 'inputs are required' },
        { status: 400 }
      );
    }

    // Get module class
    const ModuleClass = MODULE_REGISTRY[moduleName];
    if (!ModuleClass) {
      return NextResponse.json(
        { 
          error: `Module "${moduleName}" not found`,
          availableModules: Object.keys(MODULE_REGISTRY)
        },
        { status: 404 }
      );
    }

    // Create module instance
    const module = new ModuleClass();

    // Execute module
    const startTime = Date.now();
    const outputs = await module.forward(inputs);
    const executionTime = Date.now() - startTime;

    // Get metrics
    const metrics = module.getMetrics();

    // Prepare response
    const response: any = {
      success: true,
      moduleName,
      outputs,
      executionTime,
      metrics,
      dspy: {
        optimized: optimize && trainingData,
        signature: module.signature,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('DSPy execution error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * GET: List available DSPy modules
 */
export async function GET() {
  const modules = Object.entries(MODULE_REGISTRY).map(([name, ModuleClass]) => {
    const instance = new ModuleClass();
    return {
      name,
      signature: instance.signature,
      description: instance.signature.instructions || 'No description available',
    };
  });

  return NextResponse.json({
    success: true,
    modules,
    count: modules.length,
  });
}

