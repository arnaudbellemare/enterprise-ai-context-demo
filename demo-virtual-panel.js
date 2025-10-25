/**
 * Virtual Panel System Demo
 * 
 * This demo shows how to create a virtual panel of AI personas
 * calibrated on real person responses, with one task model and one
 * judge model per persona, all optimized with GEPA.
 */

const API_BASE = 'http://localhost:3000/api';

async function demoVirtualPanel() {
  console.log('🎭 Virtual Panel System Demo');
  console.log('============================\n');

  try {
    // 1. Add personas to the panel
    console.log('1. Adding personas to the panel...\n');
    
    const personas = [
      {
        profile: {
          id: 'expert_analyst',
          name: 'Dr. Sarah Chen',
          role: 'Senior Data Analyst',
          expertise: ['data_analysis', 'statistics', 'machine_learning'],
          personality: {
            communicationStyle: 'analytical and precise',
            decisionMaking: 'data-driven',
            riskTolerance: 'low',
            values: ['accuracy', 'evidence', 'methodology']
          },
          responsePatterns: {
            averageResponseTime: 2000,
            preferredFormats: ['structured', 'detailed'],
            keyPhrases: ['Based on the data', 'Statistical significance', 'Evidence suggests'],
            decisionFactors: ['data_quality', 'sample_size', 'confidence_intervals']
          },
          calibrationData: {
            sampleResponses: [
              { accuracy: 0.95, efficiency: 0.88, consistency: 0.92 },
              { accuracy: 0.93, efficiency: 0.85, consistency: 0.89 }
            ],
            evaluationCriteria: ['accuracy', 'reliability', 'methodology'],
            successMetrics: ['precision', 'recall', 'f1_score']
          }
        },
        calibrationData: [
          { personaId: 'expert_analyst', accuracy: 0.95, efficiency: 0.88, consistency: 0.92, type: 'task' },
          { personaId: 'expert_analyst', accuracy: 0.93, efficiency: 0.85, consistency: 0.89, type: 'task' },
          { personaId: 'expert_analyst', agreement: 0.91, consistency: 0.88, fairness: 0.89, type: 'judgment' }
        ]
      },
      {
        profile: {
          id: 'creative_director',
          name: 'Marcus Rodriguez',
          role: 'Creative Director',
          expertise: ['design', 'branding', 'user_experience'],
          personality: {
            communicationStyle: 'inspirational and visual',
            decisionMaking: 'intuitive',
            riskTolerance: 'high',
            values: ['innovation', 'creativity', 'user_experience']
          },
          responsePatterns: {
            averageResponseTime: 1500,
            preferredFormats: ['visual', 'conceptual'],
            keyPhrases: ['Think outside the box', 'User experience first', 'Innovation drives success'],
            decisionFactors: ['user_impact', 'creative_potential', 'brand_alignment']
          },
          calibrationData: {
            sampleResponses: [
              { accuracy: 0.87, efficiency: 0.92, consistency: 0.85 },
              { accuracy: 0.89, efficiency: 0.88, consistency: 0.87 }
            ],
            evaluationCriteria: ['creativity', 'user_impact', 'innovation'],
            successMetrics: ['engagement', 'conversion', 'brand_recognition']
          }
        },
        calibrationData: [
          { personaId: 'creative_director', accuracy: 0.87, efficiency: 0.92, consistency: 0.85, type: 'task' },
          { personaId: 'creative_director', accuracy: 0.89, efficiency: 0.88, consistency: 0.87, type: 'task' },
          { personaId: 'creative_director', agreement: 0.88, consistency: 0.85, fairness: 0.91, type: 'judgment' }
        ]
      },
      {
        profile: {
          id: 'business_strategist',
          name: 'Jennifer Kim',
          role: 'Business Strategist',
          expertise: ['strategy', 'market_analysis', 'financial_modeling'],
          personality: {
            communicationStyle: 'strategic and results-oriented',
            decisionMaking: 'analytical',
            riskTolerance: 'medium',
            values: ['profitability', 'market_share', 'competitive_advantage']
          },
          responsePatterns: {
            averageResponseTime: 2500,
            preferredFormats: ['executive_summary', 'financial_models'],
            keyPhrases: ['Market opportunity', 'Competitive advantage', 'ROI analysis'],
            decisionFactors: ['market_size', 'competition', 'financial_impact']
          },
          calibrationData: {
            sampleResponses: [
              { accuracy: 0.91, efficiency: 0.86, consistency: 0.93 },
              { accuracy: 0.89, efficiency: 0.88, consistency: 0.91 }
            ],
            evaluationCriteria: ['market_potential', 'financial_viability', 'competitive_position'],
            successMetrics: ['revenue_growth', 'market_share', 'profit_margin']
          }
        },
        calibrationData: [
          { personaId: 'business_strategist', accuracy: 0.91, efficiency: 0.86, consistency: 0.93, type: 'task' },
          { personaId: 'business_strategist', accuracy: 0.89, efficiency: 0.88, consistency: 0.91, type: 'task' },
          { personaId: 'business_strategist', agreement: 0.89, consistency: 0.91, fairness: 0.87, type: 'judgment' }
        ]
      }
    ];

    // Add each persona
    for (const persona of personas) {
      const response = await fetch(`${API_BASE}/virtual-panel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_persona',
          ...persona
        })
      });
      
      const result = await response.json();
      console.log(`✅ Added ${result.data.name} (${result.data.role})`);
    }

    console.log('\n2. Getting panel statistics...\n');
    
    // Get panel stats
    const statsResponse = await fetch(`${API_BASE}/virtual-panel?action=stats`);
    const stats = await statsResponse.json();
    console.log('Panel Statistics:', JSON.stringify(stats.data, null, 2));

    console.log('\n3. Processing a business decision through the panel...\n');
    
    // Process a task through the panel
    const taskResponse = await fetch(`${API_BASE}/virtual-panel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'process_task',
        task: 'Should we invest in a new AI-powered customer service platform?',
        input: {
          budget: 500000,
          timeline: '6 months',
          expectedROI: 0.25,
          riskLevel: 'medium',
          marketSize: 'large'
        },
        options: {
          consensusThreshold: 0.7,
          enableJudgeEvaluation: true
        }
      })
    });
    
    const taskResult = await taskResponse.json();
    console.log('Task Processing Result:');
    console.log('======================');
    console.log(`Task: ${taskResult.data.task}`);
    console.log(`Input: ${JSON.stringify(taskResult.data.input, null, 2)}`);
    console.log(`\nPersona Decisions:`);
    
    taskResult.data.personaDecisions.forEach((decision, index) => {
      console.log(`\n${index + 1}. ${decision.personaId}:`);
      console.log(`   Decision: ${JSON.stringify(decision.decision, null, 2)}`);
      console.log(`   Confidence: ${decision.confidence.toFixed(2)}`);
      console.log(`   Reasoning: ${decision.reasoning}`);
      console.log(`   Judge Score: ${decision.judgeScore.toFixed(2)}`);
    });
    
    console.log(`\nConsensus:`);
    console.log(`Agreement: ${taskResult.data.consensus.agreement.toFixed(2)}`);
    console.log(`Final Decision: ${JSON.stringify(taskResult.data.consensus.finalDecision, null, 2)}`);
    console.log(`Confidence: ${taskResult.data.consensus.confidence.toFixed(2)}`);
    console.log(`Reasoning: ${taskResult.data.consensus.reasoning}`);
    
    console.log(`\nMetadata:`);
    console.log(`Processing Time: ${taskResult.data.metadata.processingTime}ms`);
    console.log(`Token Usage: ${taskResult.data.metadata.tokenUsage}`);
    console.log(`Persona Count: ${taskResult.data.metadata.personaCount}`);

    console.log('\n4. Getting individual persona performance...\n');
    
    // Get performance for each persona
    for (const persona of personas) {
      const perfResponse = await fetch(`${API_BASE}/virtual-panel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_persona_performance',
          personaId: persona.profile.id
        })
      });
      
      const perf = await perfResponse.json();
      console.log(`${persona.profile.name} Performance:`);
      console.log(`  Task Model: ${JSON.stringify(perf.data.taskModel, null, 2)}`);
      console.log(`  Judge Model: ${JSON.stringify(perf.data.judgeModel, null, 2)}`);
      console.log(`  Overall: ${JSON.stringify(perf.data.overall, null, 2)}\n`);
    }

    console.log('🎉 Virtual Panel System Demo Complete!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Persona calibration on real response data');
    console.log('✅ Individual task models per persona');
    console.log('✅ Individual judge models per persona');
    console.log('✅ GEPA optimization for persona-specific prompts');
    console.log('✅ Panel consensus calculation');
    console.log('✅ Performance tracking per persona');
    console.log('✅ Multi-persona task processing');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demoVirtualPanel();
}

module.exports = { demoVirtualPanel };
