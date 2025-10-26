import { NextRequest, NextResponse } from 'next/server';
import AdvancedLearningMethods from '../../../../lib/advanced-learning-methods';

const advancedLearningMethods = new AdvancedLearningMethods();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      analysisType, 
      data, 
      config 
    } = body;

    console.log('🧠 Advanced Learning Methods API:', { 
      analysisType, 
      dataSize: data ? Object.keys(data).length : 0 
    });

    let result;

    switch (analysisType) {
      case 'comprehensive':
        result = await advancedLearningMethods.executeComprehensiveAnalysis(data);
        break;

      case 'self-supervised':
        const selfSupervisedTask = {
          id: 'api_task',
          type: data.taskType || 'contrastive',
          data: data.samples || [],
          metadata: data.metadata || {}
        };
        
        if (data.taskType === 'generative') {
          result = await advancedLearningMethods.selfSupervisedLearning.generativeLearning(selfSupervisedTask);
        } else if (data.taskType === 'predictive') {
          result = await advancedLearningMethods.selfSupervisedLearning.predictiveLearning(selfSupervisedTask);
        } else {
          result = await advancedLearningMethods.selfSupervisedLearning.contrastiveLearning(selfSupervisedTask);
        }
        break;

      case 'survival':
        const survivalData = data.survivalData || [];
        const covariates = data.covariates || [];
        
        if (data.modelType === 'kaplan-meier') {
          result = await advancedLearningMethods.survivalAnalysis.kaplanMeierAnalysis(survivalData);
        } else if (data.modelType === 'parametric') {
          result = await advancedLearningMethods.survivalAnalysis.parametricSurvivalModel(survivalData, data.distribution || 'weibull');
        } else if (data.modelType === 'random-forest') {
          result = await advancedLearningMethods.survivalAnalysis.randomForestSurvival(survivalData, covariates);
        } else {
          result = await advancedLearningMethods.survivalAnalysis.fitCoxModel(survivalData, covariates);
        }
        break;

      case 'multi-modal':
        const multiModalData = data.multiModalData || [];
        
        if (data.fusionMethod === 'late') {
          result = await advancedLearningMethods.multiModalLearning.lateFusion(multiModalData);
        } else if (data.fusionMethod === 'cross-modal') {
          result = await advancedLearningMethods.multiModalLearning.crossModalAttention(multiModalData);
        } else if (data.fusionMethod === 'unimodal') {
          result = await advancedLearningMethods.multiModalLearning.unimodalLearning(multiModalData, data.modality || 'text');
        } else {
          result = await advancedLearningMethods.multiModalLearning.earlyFusion(multiModalData);
        }
        break;

      case 'causal':
        const causalData = data.causalData || [];
        
        if (data.method === 'instrumental-variable') {
          result = await advancedLearningMethods.causalInference.instrumentalVariableAnalysis(causalData, data.instrument || 'instrument');
        } else if (data.method === 'regression-discontinuity') {
          result = await advancedLearningMethods.causalInference.regressionDiscontinuity(causalData, data.runningVariable || 'running_var', data.cutoff || 0);
        } else if (data.method === 'difference-in-differences') {
          result = await advancedLearningMethods.causalInference.differenceInDifferences(causalData, data.timeVariable || 'time', data.groupVariable || 'group');
        } else if (data.method === 'causal-graph') {
          result = await advancedLearningMethods.causalInference.constructCausalGraph(causalData);
        } else {
          result = await advancedLearningMethods.causalInference.propensityScoreMatching(causalData);
        }
        break;

      case 'interpretability':
        const model = data.model || {};
        const samples = data.samples || [];
        
        if (data.method === 'lime') {
          result = await advancedLearningMethods.interpretability.computeLIMEExplanations(model, samples);
        } else if (data.method === 'gradient') {
          result = await advancedLearningMethods.interpretability.computeGradientExplanations(model, samples);
        } else if (data.method === 'attention') {
          result = await advancedLearningMethods.interpretability.computeAttentionExplanations(model, samples);
        } else if (data.method === 'counterfactual') {
          result = await advancedLearningMethods.interpretability.computeCounterfactualExplanations(model, samples);
        } else {
          result = await advancedLearningMethods.interpretability.computeSHAPExplanations(model, samples);
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid analysis type. Supported types: comprehensive, self-supervised, survival, multi-modal, causal, interpretability'
        }, { status: 400 });
    }

    console.log('✅ Advanced Learning Methods analysis completed:', { 
      analysisType, 
      resultKeys: Object.keys(result || {}) 
    });

    return NextResponse.json({
      success: true,
      analysisType,
      result,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: Date.now(),
        components: [
          'Self-Supervised Learning Framework',
          'Survival Analysis Engine', 
          'Multi-Modal Learning System',
          'Causal Inference Engine',
          'Interpretability Engine'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Advanced Learning Methods API error:', error);
    
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
    message: 'Advanced Learning Methods API',
    availableMethods: [
      {
        type: 'comprehensive',
        description: 'Execute all advanced learning methods',
        parameters: ['data']
      },
      {
        type: 'self-supervised',
        description: 'Self-supervised learning (contrastive, generative, predictive)',
        parameters: ['taskType', 'samples', 'metadata']
      },
      {
        type: 'survival',
        description: 'Survival analysis (Cox, Kaplan-Meier, parametric, random forest)',
        parameters: ['modelType', 'survivalData', 'covariates', 'distribution']
      },
      {
        type: 'multi-modal',
        description: 'Multi-modal learning (early/late fusion, cross-modal attention)',
        parameters: ['fusionMethod', 'multiModalData', 'modality']
      },
      {
        type: 'causal',
        description: 'Causal inference (propensity scores, IV, RD, DID)',
        parameters: ['method', 'causalData', 'instrument', 'runningVariable', 'cutoff']
      },
      {
        type: 'interpretability',
        description: 'Model interpretability (SHAP, LIME, gradients, attention)',
        parameters: ['method', 'model', 'samples']
      }
    ],
    capabilities: [
      'Self-Supervised Learning: Contrastive, generative, predictive methods',
      'Survival Analysis: Time-to-event modeling with hazard functions',
      'Multi-Modal Learning: Text, image, audio, video processing',
      'Causal Inference: Propensity scores, instrumental variables, regression discontinuity',
      'Interpretability: SHAP, LIME, gradient-based, attention-based explanations'
    ]
  });
}
