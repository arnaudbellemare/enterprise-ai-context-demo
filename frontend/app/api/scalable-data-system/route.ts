import { NextRequest, NextResponse } from 'next/server';
import ScalableDataSystem from '../../../../lib/scalable-data-system';

const scalableDataSystem = new ScalableDataSystem();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      operation, 
      domains, 
      targetSize, 
      config 
    } = body;

    console.log('🚀 Scalable Data System API:', { 
      operation, 
      domains: domains?.length || 0, 
      targetSize 
    });

    let result;

    switch (operation) {
      case 'end-to-end-pipeline':
        result = await scalableDataSystem.executeScalableDataPipeline(
          domains || ['art', 'legal', 'business'], 
          targetSize || 100
        );
        break;

      case 'generate-dataset':
        const generator = scalableDataSystem['dataGenerator'];
        result = await generator.generateScalableDataset(
          domains?.[0] || 'general', 
          targetSize || 50
        );
        break;

      case 'distill-data':
        const distillationEngine = scalableDataSystem['distillationEngine'];
        const samples = body.samples || [];
        result = await distillationEngine.distillDataset(samples, targetSize || Math.floor(samples.length * 0.7));
        break;

      case 'reasoning-chains':
        const reasoningArchitecture = scalableDataSystem['reasoningArchitecture'];
        result = await reasoningArchitecture.generateReasoningChain(
          body.problem || 'Sample problem', 
          body.domain || 'general'
        );
        break;

      case 'verify-quality':
        const verifiabilitySystem = scalableDataSystem['verifiabilitySystem'];
        result = await verifiabilitySystem.verifyQuality(body.samples || []);
        break;

      case 'automated-tests':
        const testSystem = scalableDataSystem['verifiabilitySystem'];
        result = await testSystem.runAutomatedTests(body.samples || []);
        break;

      case 'cross-validation':
        const validationSystem = scalableDataSystem['verifiabilitySystem'];
        result = await validationSystem.crossValidate(body.samples || []);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid operation. Supported operations: end-to-end-pipeline, generate-dataset, distill-data, reasoning-chains, verify-quality, automated-tests, cross-validation'
        }, { status: 400 });
    }

    console.log('✅ Scalable Data System operation completed:', { 
      operation, 
      resultKeys: Object.keys(result || {}) 
    });

    return NextResponse.json({
      success: true,
      operation,
      result,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: Date.now(),
        components: [
          'Scalable Data Generator',
          'Data Distillation Engine',
          'Reasoning Chain Architecture',
          'Verifiability System'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Scalable Data System API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Scalable Data System API',
    availableOperations: [
      {
        operation: 'end-to-end-pipeline',
        description: 'Complete scalable data pipeline from generation to verification',
        parameters: ['domains', 'targetSize']
      },
      {
        operation: 'generate-dataset',
        description: 'Generate scalable dataset without human bottlenecks',
        parameters: ['domains', 'targetSize']
      },
      {
        operation: 'distill-data',
        description: 'Distill data for efficiency and noise reduction',
        parameters: ['samples', 'targetSize']
      },
      {
        operation: 'reasoning-chains',
        description: 'Generate reasoning chain architectures',
        parameters: ['problem', 'domain']
      },
      {
        operation: 'verify-quality',
        description: 'Comprehensive quality verification',
        parameters: ['samples']
      },
      {
        operation: 'automated-tests',
        description: 'Run automated testing framework',
        parameters: ['samples']
      },
      {
        operation: 'cross-validation',
        description: 'Cross-validation across multiple dimensions',
        parameters: ['samples']
      }
    ],
    capabilities: [
      'Scalable Data Generation: Self-supervised without human bottlenecks',
      'Data Distillation: Efficiency and noise reduction',
      'Diverse Domain-Specific Corpora: Art, legal, business, general',
      'Reasoning Chain Architectures: Multi-step reasoning with verification',
      'Multimodal Integration: Text, image, audio, video processing',
      'Verifiability Systems: Comprehensive quality assurance',
      'Automated Testing: Continuous validation and improvement',
      'Cross-Validation: Multi-dimensional validation'
    ],
    challengesAddressed: [
      'Scalability: Generate high-quality datasets without human bottlenecks',
      'Verifiability: Comprehensive quality assurance and validation',
      'Efficiency: Data distillation for noise reduction and optimization',
      'Diversity: Domain-specific corpora curation',
      'Reasoning: Chain architectures for complex problem solving',
      'Integration: Multimodal processing capabilities'
    ]
  });
}
