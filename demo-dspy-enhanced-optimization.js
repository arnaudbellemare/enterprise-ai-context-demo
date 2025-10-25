/**
 * Demo: Enhanced DSPy Optimization with Hints and Custom Metrics
 * 
 * This demonstrates how to:
 * 1. Pass hints to focus DSPy output
 * 2. Use custom metrics for GEPA/SIMBA feedback
 * 3. Get real-time optimization feedback
 * 4. Optimize signatures for specific domains
 */

const API_BASE = 'http://localhost:3000/api';

async function runEnhancedDSPyOptimization() {
  console.log('🚀 Enhanced DSPy Optimization Demo');
  console.log('=====================================\n');

  try {
    // 1. Get examples first
    console.log('📋 Getting examples...');
    const examplesResponse = await fetch(`${API_BASE}/dspy-enhanced-optimization?action=examples`);
    const examples = await examplesResponse.json();
    
    if (examples.success) {
      console.log('✅ Examples loaded successfully');
      console.log('Example hints:', examples.data.exampleHints.length);
      console.log('Example metrics:', examples.data.exampleCustomMetrics.length);
    }

    // 2. Create optimization request with hints and custom metrics
    const optimizationRequest = {
      signature: {
        name: 'ArtValuationExpert',
        input: 'artwork_data, market_context, purpose',
        output: 'valuation, confidence, reasoning, recommendations',
        instructions: 'Analyze artwork and provide comprehensive valuation for insurance purposes',
        examples: [
          {
            input: { 
              artist: 'Pablo Picasso', 
              medium: 'Oil on Canvas', 
              year: '1937',
              condition: 'Excellent',
              purpose: 'insurance'
            },
            output: { 
              valuation: 5000000, 
              confidence: 0.95, 
              reasoning: 'Master artist, significant period, excellent condition',
              recommendations: 'Regular appraisal updates recommended'
            }
          }
        ]
      },
      trainingData: [
        {
          input: { artist: 'Van Gogh', medium: 'Oil on Canvas', year: '1889', condition: 'Good' },
          expected: { valuation: 80000000, confidence: 0.98, reasoning: 'Masterpiece, museum quality' }
        },
        {
          input: { artist: 'Andy Warhol', medium: 'Screen Print', year: '1962', condition: 'Excellent' },
          expected: { valuation: 15000000, confidence: 0.92, reasoning: 'Pop art icon, high demand' }
        }
      ],
      hints: [
        {
          id: 'focus_accuracy',
          type: 'focus',
          content: 'Focus on providing highly accurate valuations with detailed market analysis',
          weight: 0.9,
          domain: 'art'
        },
        {
          id: 'constraint_insurance',
          type: 'constraint',
          content: 'Output must include insurance-specific requirements and USPAP compliance',
          weight: 0.8,
          domain: 'insurance'
        },
        {
          id: 'preference_professional',
          type: 'preference',
          content: 'Use professional, technical language appropriate for insurance appraisals',
          weight: 0.7,
          domain: 'insurance'
        },
        {
          id: 'example_high_value',
          type: 'example',
          content: 'For high-value items (>$1M), include additional risk assessment and specialized expertise requirements',
          weight: 0.6,
          domain: 'insurance'
        }
      ],
      customMetrics: [
        {
          name: 'accuracy',
          description: 'How accurate are the valuations compared to market data',
          weight: 0.4,
          evaluator: (output, expected) => {
            // Simulate accuracy evaluation
            const valueDiff = Math.abs(output.valuation - expected.valuation) / expected.valuation;
            return Math.max(0, 1 - valueDiff);
          }
        },
        {
          name: 'completeness',
          description: 'How complete are the responses (all required fields present)',
          weight: 0.3,
          evaluator: (output, expected) => {
            const requiredFields = ['valuation', 'confidence', 'reasoning'];
            const presentFields = requiredFields.filter(field => output[field] !== undefined);
            return presentFields.length / requiredFields.length;
          }
        },
        {
          name: 'insurance_compliance',
          description: 'How well does the output meet insurance appraisal standards',
          weight: 0.3,
          evaluator: (output, expected) => {
            // Simulate insurance compliance evaluation
            let score = 0.5; // Base score
            
            if (output.valuation && output.valuation > 0) score += 0.2;
            if (output.confidence && output.confidence > 0.8) score += 0.2;
            if (output.reasoning && output.reasoning.length > 50) score += 0.1;
            
            return Math.min(1, score);
          }
        }
      ],
      optimizationConfig: {
        maxGenerations: 8,
        populationSize: 15,
        mutationRate: 0.15,
        feedbackFrequency: 2
      }
    };

    console.log('\n🔧 Running optimization with hints and custom metrics...');
    console.log(`- Hints: ${optimizationRequest.hints.length}`);
    console.log(`- Custom Metrics: ${optimizationRequest.customMetrics.length}`);
    console.log(`- Training Data: ${optimizationRequest.trainingData.length} examples`);
    console.log(`- Max Generations: ${optimizationRequest.optimizationConfig.maxGenerations}`);

    // 3. Run optimization
    const optimizationResponse = await fetch(`${API_BASE}/dspy-enhanced-optimization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(optimizationRequest)
    });

    const optimizationResult = await optimizationResponse.json();

    if (optimizationResult.success) {
      console.log('\n✅ Optimization completed successfully!');
      console.log('=====================================\n');

      // Display results
      console.log('📊 Optimization Results:');
      console.log(`- Best Score: ${optimizationResult.data.metrics.accuracy?.toFixed(3) || 'N/A'}`);
      console.log(`- Generations: ${optimizationResult.data.optimizationStats?.generation || 'N/A'}`);
      console.log(`- Population Size: ${optimizationResult.data.optimizationStats?.size || 'N/A'}`);
      console.log(`- Feedback Cycles: ${optimizationResult.data.feedback.length}`);

      console.log('\n🎯 Optimized Signature:');
      console.log(`- Name: ${optimizationResult.data.optimizedSignature.name}`);
      console.log(`- Input: ${optimizationResult.data.optimizedSignature.input}`);
      console.log(`- Output: ${optimizationResult.data.optimizedSignature.output}`);
      console.log(`- Instructions: ${optimizationResult.data.optimizedSignature.instructions.substring(0, 200)}...`);

      console.log('\n📈 Feedback History:');
      optimizationResult.data.feedback.forEach((feedback, index) => {
        console.log(`\nGeneration ${feedback.generation}:`);
        console.log(`- Score: ${feedback.score.toFixed(3)}`);
        console.log(`- Feedback: ${feedback.feedback}`);
        if (feedback.suggestions.length > 0) {
          console.log(`- Suggestions: ${feedback.suggestions.join(', ')}`);
        }
      });

      console.log('\n💡 Suggestions for Further Improvement:');
      optimizationResult.data.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`);
      });

      console.log('\n🔍 Custom Metrics Performance:');
      Object.entries(optimizationResult.data.metrics).forEach(([metric, score]) => {
        console.log(`- ${metric}: ${(score * 100).toFixed(1)}%`);
      });

    } else {
      console.log('❌ Optimization failed:', optimizationResult.error);
    }

    // 4. Get current stats
    console.log('\n📊 Getting current optimization stats...');
    const statsResponse = await fetch(`${API_BASE}/dspy-enhanced-optimization?action=stats`);
    const stats = await statsResponse.json();
    
    if (stats.success) {
      console.log('✅ Current Stats:');
      console.log(`- Population Size: ${stats.data.stats.size || 'N/A'}`);
      console.log(`- Current Generation: ${stats.data.stats.generation || 'N/A'}`);
      console.log(`- Best Fitness: ${stats.data.stats.bestFitness?.toFixed(3) || 'N/A'}`);
      console.log(`- Average Fitness: ${stats.data.stats.averageFitness?.toFixed(3) || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
runEnhancedDSPyOptimization().then(() => {
  console.log('\n🎉 Enhanced DSPy Optimization Demo Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('✅ Pass hints to focus DSPy output');
  console.log('✅ Custom metrics for GEPA/SIMBA feedback');
  console.log('✅ Real-time optimization feedback');
  console.log('✅ Domain-specific optimization');
  console.log('✅ Insurance compliance optimization');
}).catch(console.error);
