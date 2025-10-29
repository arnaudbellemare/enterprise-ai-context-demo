import { NextRequest, NextResponse } from 'next/server';
import { zodValidator } from '../../../lib/zod-enhanced-validation';
import { EnhancedLLMJudge, createEnhancedJudge, DEFAULT_JUDGE_CONFIGS } from '@/lib/enhanced-llm-judge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt,
      domain = 'general',
      maxIterations = 3,
      optimizationType = 'comprehensive',
      reasoningSteps = 3,
      predictionSteps = 1,
      convergenceThreshold = 0.01,
      earlyStopping = true
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate input with enhanced Zod validation
    const validation = zodValidator.validateGEPAInput({
      prompt,
      domain,
      maxIterations,
      optimizationType
    });

    if (!validation.success) {
      console.log(`❌ GEPA Optimization Validation Failed: ${validation.errors?.join(', ')}`);
      return NextResponse.json(
        { 
          error: 'GEPA Optimization input validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    console.log(`🧠 GEPA Optimization: Optimizing prompt for ${domain} domain with structured reasoning-prediction separation`);

    const startTime = Date.now();
    let currentPrompt = prompt;
    let bestPrompt = prompt;
    let bestScore = 0;
    const iterations = [];
    let reasoningStepsCompleted = 0;
    let predictionStepsCompleted = 0;
    let convergenceMetrics = {
      reasoning_convergence: false,
      prediction_convergence: false,
      total_improvement: 0,
      reasoning_steps: 0,
      prediction_steps: 0
    };

    // Initialize reasoning state
    let reasoningState = {
      marketAnalysis: null,
      provenance: null,
      compliance: null,
      confidence: 0.5,
      reasoningChain: ['Initial GEPA reasoning state'],
      metadata: { domain, method: 'gepa' }
    };

    // Initialize prediction state
    let predictionState = {
      valuation: 0,
      confidence: 0.5,
      justification: currentPrompt,
      metadata: { domain, method: 'gepa' }
    };

    // GEPA Structured Optimization Loop
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      console.log(`🔄 GEPA Iteration ${iteration + 1}/${maxIterations}`);

      // Phase 1: Reasoning refinement (z updates)
      console.log(`🧠 Phase 1: GEPA reasoning refinement (${reasoningSteps} steps)`);
      let previousReasoning = reasoningState;
      
      for (let i = 0; i < reasoningSteps; i++) {
        reasoningStepsCompleted++;
        
        console.log(`🔄 GEPA reasoning step ${i + 1}/${reasoningSteps}`);
        
        // Update reasoning state
        const improvedReasoning = await updateGEPAReasoning(currentPrompt, predictionState.justification, reasoningState, domain);
        
        // Check convergence
        const reasoningImprovement = Math.abs(improvedReasoning.confidence - reasoningState.confidence);
        const reasoning_converged = reasoningImprovement < convergenceThreshold;
        
        if (earlyStopping && reasoning_converged && i > 0) {
          console.log(`⏹️ GEPA early stopping: reasoning converged at step ${i + 1}`);
          break;
        }
        
        previousReasoning = reasoningState;
        reasoningState = improvedReasoning;
      }

      // Phase 2: Prediction update (y update)
      console.log(`🎯 Phase 2: GEPA prediction update (${predictionSteps} step)`);
      let previousPrediction = predictionState;
      
      for (let i = 0; i < predictionSteps; i++) {
        predictionStepsCompleted++;
        
        console.log(`🔄 GEPA prediction step ${i + 1}/${predictionSteps}`);
        
        // Update prediction state
        const improvedPrediction = await updateGEPAPrediction(predictionState.justification, reasoningState, domain);
        
        // Check convergence
        const predictionImprovement = Math.abs(improvedPrediction.confidence - predictionState.confidence);
        const prediction_converged = predictionImprovement < convergenceThreshold;
        
        if (earlyStopping && prediction_converged && i > 0) {
          console.log(`⏹️ GEPA early stopping: prediction converged at step ${i + 1}`);
          break;
        }
        
        previousPrediction = predictionState;
        predictionState = improvedPrediction;
      }

      // Update current prompt based on improved prediction
      currentPrompt = predictionState.justification;

      // Evaluate with enhanced judge
      const evaluation = await evaluatePrompt(currentPrompt, domain);
      
      const improvement = evaluation.score - bestScore;
      
      console.log(`📊 GEPA Score: ${evaluation.score.toFixed(3)} (${improvement > 0 ? '+' : ''}${improvement.toFixed(3)})`);
      
      iterations.push({
        iteration: iteration + 1,
        originalPrompt: prompt,
        improvedPrompt: currentPrompt,
        evaluation,
        improvement,
        reasoning_state: reasoningState,
        prediction_state: predictionState,
        convergence_metrics: {
          reasoning_convergence: Math.abs(reasoningState.confidence - previousReasoning.confidence) < convergenceThreshold,
          prediction_convergence: Math.abs(predictionState.confidence - previousPrediction.confidence) < convergenceThreshold,
          total_improvement: Math.abs(reasoningState.confidence - previousReasoning.confidence) + Math.abs(predictionState.confidence - previousPrediction.confidence),
          reasoning_steps: reasoningStepsCompleted,
          prediction_steps: predictionStepsCompleted
        }
      });
      
      // Update best prompt if improved
      if (evaluation.score > bestScore) {
        bestScore = evaluation.score;
        bestPrompt = currentPrompt;
        console.log(`✅ New best GEPA prompt found!`);
      }
      
      // Early stopping if no improvement
      if (earlyStopping && improvement < convergenceThreshold && iteration > 0) {
        console.log(`⏹️ GEPA early stopping - minimal improvement`);
        break;
      }
    }

    // Calculate final convergence metrics
    const finalReasoningImprovement = Math.abs(reasoningState.confidence - 0.5);
    const finalPredictionImprovement = Math.abs(predictionState.confidence - 0.5);
    
    convergenceMetrics = {
      reasoning_convergence: finalReasoningImprovement < convergenceThreshold,
      prediction_convergence: finalPredictionImprovement < convergenceThreshold,
      total_improvement: finalReasoningImprovement + finalPredictionImprovement,
      reasoning_steps: reasoningStepsCompleted,
      prediction_steps: predictionStepsCompleted
    };

    const duration = Date.now() - startTime;
    const totalImprovement = bestScore - (iterations[0]?.evaluation?.score || 0);

    console.log(`✅ GEPA Structured Optimization: ${maxIterations} iterations, ${totalImprovement.toFixed(3)} improvement, ${duration}ms`);

    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      optimizedPrompt: bestPrompt,
      domain,
      optimizationType,
      iterations,
      reasoning_state: reasoningState,
      prediction_state: predictionState,
      convergence_metrics: convergenceMetrics,
      metrics: {
        totalIterations: maxIterations,
        totalImprovement: totalImprovement,
        bestScore: bestScore,
        duration,
        improvementPercentage: ((totalImprovement / (iterations[0]?.evaluation?.score || 1)) * 100).toFixed(1),
        reasoningStepsCompleted,
        predictionStepsCompleted
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ GEPA Optimization Error:', error);
    return NextResponse.json(
      { 
        error: 'GEPA Optimization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions for GEPA structured optimization
async function updateGEPAReasoning(prompt: string, prediction: string, reasoningState: any, domain: string): Promise<any> {
  console.log(`🧠 GEPA: Updating reasoning state`);
  
  // Mock implementation - in production this would use actual LLM
  const improvedReasoning = {
    ...reasoningState,
    confidence: Math.min(0.95, reasoningState.confidence + 0.1),
    reasoningChain: [...reasoningState.reasoningChain, `GEPA reasoning update for ${domain}`],
    marketAnalysis: { domain, method: 'gepa', timestamp: Date.now() }
  };
  
  return improvedReasoning;
}

async function updateGEPAPrediction(prediction: string, reasoningState: any, domain: string): Promise<any> {
  console.log(`🎯 GEPA: Updating prediction state`);
  
  // Mock implementation - in production this would use actual LLM
  const improvedPrediction = {
    valuation: Math.random() * 100000,
    confidence: Math.min(0.95, reasoningState.confidence + 0.05),
    justification: `${prediction} [Enhanced with GEPA reasoning for ${domain}]`,
    metadata: { domain, method: 'gepa', timestamp: Date.now() }
  };
  
  return improvedPrediction;
}

// Loss-based evaluation function
async function evaluatePrompt(prompt: string, domain: string): Promise<{ score: number; details: any }> {
  console.log(`📊 GEPA: Evaluating prompt for ${domain}`);
  
  // Mock evaluation - in production this would use actual judge
  const baseScore = 0.5 + Math.random() * 0.4; // 0.5-0.9 range
  const domainBonus = domain === 'art_insurance' ? 0.1 : 0;
  const finalScore = Math.min(0.95, baseScore + domainBonus);
  
  return {
    score: finalScore,
    details: {
      baseScore,
      domainBonus,
      finalScore,
      timestamp: Date.now()
    }
  };
}
