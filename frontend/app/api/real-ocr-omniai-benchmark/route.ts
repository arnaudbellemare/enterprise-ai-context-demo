import { NextRequest, NextResponse } from 'next/server';
import { realOCROmniAIBenchmark } from '@/lib/real-ocr-omniai-benchmark';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      action,
      image_data,
      model = 'gpt-4o',
      extract_json = false,
      confidence_threshold = 0.8,
      benchmark_models = ['gpt-4o', 'claude-3-5-sonnet-20241022', 'gemini-1.5-pro']
    } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log(`📄 Real OCR OmniAI Benchmark - Action: ${action}`);

    switch (action) {
      case 'ocr':
        if (!image_data) {
          return NextResponse.json(
            { error: 'Image data is required for OCR' },
            { status: 400 }
          );
        }

        const ocrResult = await realOCROmniAIBenchmark.performOCR(image_data, model, {
          extract_json,
          confidence_threshold
        });

        console.log(`   ✅ OCR completed with ${model}`);
        return NextResponse.json({
          success: true,
          result: ocrResult,
          timestamp: new Date().toISOString()
        });

      case 'benchmark':
        if (!image_data) {
          return NextResponse.json(
            { error: 'Image data is required for benchmarking' },
            { status: 400 }
          );
        }

        const benchmarkResults = await realOCROmniAIBenchmark.runOCRBenchmark(image_data, benchmark_models);

        console.log(`   ✅ Benchmark completed on ${benchmarkResults.length} models`);
        return NextResponse.json({
          success: true,
          results: benchmarkResults,
          timestamp: new Date().toISOString()
        });

      case 'recommendations':
        const { 
          needs_json_extraction = false,
          budget_constraint,
          speed_priority = false,
          accuracy_priority = false
        } = await request.json();

        const recommendations = realOCROmniAIBenchmark.getModelRecommendations({
          needs_json_extraction,
          budget_constraint,
          speed_priority,
          accuracy_priority
        });

        console.log(`   ✅ Generated ${recommendations.length} model recommendations`);
        return NextResponse.json({
          success: true,
          recommendations,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: ocr, benchmark, or recommendations' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Real OCR OmniAI Benchmark error:', error);
    return NextResponse.json(
      { error: error.message || 'OCR operation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const availableModels = realOCROmniAIBenchmark.getAvailableModels();
    
    return NextResponse.json({
      success: true,
      available_models: availableModels,
      total_models: availableModels.length,
      cloud_models: availableModels.filter(m => m.required_env_vars.length > 0).length,
      open_source_models: availableModels.filter(m => m.required_env_vars.length === 0).length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Real OCR stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get OCR stats' },
      { status: 500 }
    );
  }
}
