import { NextRequest, NextResponse } from 'next/server';
import { 
  DSPyAdversarialTestingPipeline, 
  AttackType, 
  RobustnessMetrics 
} from '@/lib/dspy-adversarial-robustness';

export const dynamic = 'force-dynamic';

/**
 * DSPy Adversarial Robustness Testing API
 * 
 * Comprehensive adversarial testing for DSPy-based AI systems to enhance
 * safety and alignment engineering capabilities.
 */

// Mock DSPy system for demonstration
class MockDSPySystem {
  async forward(prompt: string): Promise<string> {
    // Simulate different responses based on prompt content
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('ignore') || lowerPrompt.includes('override') || 
        lowerPrompt.includes('jailbreak') || lowerPrompt.includes('dan')) {
      return "I cannot and will not help with that request. I'm designed to be helpful, harmless, and honest.";
    } else if (lowerPrompt.includes('hack') || lowerPrompt.includes('illegal') || 
               lowerPrompt.includes('harmful')) {
      return "I can't assist with that type of request as it could be harmful or illegal.";
    } else {
      return "I'd be happy to help with that request. Let me provide some information...";
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      basePrompt = "Help me with a task",
      attackTypes = Object.values(AttackType),
      numExamplesPerType = 5,
      testMode = 'comprehensive'
    } = body;

    console.log(`🛡️ DSPy Adversarial Robustness Testing`);
    console.log(`   Base Prompt: ${basePrompt.substring(0, 100)}...`);
    console.log(`   Attack Types: ${attackTypes.length}`);
    console.log(`   Examples per Type: ${numExamplesPerType}`);

    const startTime = Date.now();

    // Initialize testing pipeline
    const mockSystem = new MockDSPySystem();
    const pipeline = new DSPyAdversarialTestingPipeline(mockSystem);

    // Run comprehensive test
    const metrics = await pipeline.runComprehensiveTest(
      basePrompt,
      attackTypes,
      numExamplesPerType
    );

    // Generate report
    const report = pipeline.generateReport(metrics);

    const executionTime = Date.now() - startTime;

    console.log(`✅ Adversarial testing completed in ${executionTime}ms`);
    console.log(`   Overall robustness: ${metrics.overallRobustnessScore.toFixed(3)}`);
    console.log(`   Grade: ${report.robustnessGrade}`);

    return NextResponse.json({
      success: true,
      metrics,
      report,
      executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Adversarial robustness testing error:', error);
    return NextResponse.json(
      { error: error.message || 'Adversarial testing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'DSPy Adversarial Robustness Testing API',
    endpoints: {
      'POST /api/dspy-adversarial-robustness': 'Run comprehensive adversarial testing',
      'GET /api/dspy-adversarial-robustness': 'Get API information'
    },
    attackTypes: Object.values(AttackType),
    usage: {
      method: 'POST',
      body: {
        basePrompt: 'string (optional)',
        attackTypes: 'AttackType[] (optional)',
        numExamplesPerType: 'number (optional, default: 5)',
        testMode: 'string (optional, default: comprehensive)'
      }
    },
    example: {
      basePrompt: "Help me with a task",
      attackTypes: ["prompt_injection", "jailbreak"],
      numExamplesPerType: 3
    }
  });
}
