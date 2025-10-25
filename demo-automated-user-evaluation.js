/**
 * Automated User Evaluation Demo
 * 
 * This demo shows how to construct automated evaluations per user
 * and optimize the entire system per user based on those evaluations.
 */

const API_BASE = 'http://localhost:3000/api';

async function demoAutomatedUserEvaluation() {
  console.log('🤖 Automated User Evaluation Demo');
  console.log('==================================\n');

  try {
    // 1. Register users with different profiles
    console.log('1. Registering users with different profiles...\n');
    
    const users = [
      {
        profile: {
          id: 'user_analyst',
          name: 'Sarah Chen',
          preferences: {
            communicationStyle: 'analytical and precise',
            decisionMaking: 'data-driven',
            riskTolerance: 'low',
            values: ['accuracy', 'evidence', 'methodology'],
            expertise: ['data_analysis', 'statistics', 'machine_learning']
          },
          evaluationCriteria: {
            accuracy: 0.9,
            efficiency: 0.8,
            clarity: 0.85,
            relevance: 0.9,
            creativity: 0.6
          },
          responsePatterns: {
            averageResponseTime: 2000,
            preferredFormats: ['structured', 'detailed'],
            keyPhrases: ['Based on the data', 'Statistical significance'],
            decisionFactors: ['data_quality', 'sample_size', 'confidence_intervals']
          },
          historicalData: {
            interactions: [],
            decisions: [],
            feedback: [],
            performance: []
          }
        }
      },
      {
        profile: {
          id: 'user_creative',
          name: 'Marcus Rodriguez',
          preferences: {
            communicationStyle: 'inspirational and visual',
            decisionMaking: 'intuitive',
            riskTolerance: 'high',
            values: ['innovation', 'creativity', 'user_experience'],
            expertise: ['design', 'branding', 'user_experience']
          },
          evaluationCriteria: {
            accuracy: 0.7,
            efficiency: 0.9,
            clarity: 0.8,
            relevance: 0.85,
            creativity: 0.95
          },
          responsePatterns: {
            averageResponseTime: 1500,
            preferredFormats: ['visual', 'conceptual'],
            keyPhrases: ['Think outside the box', 'User experience first'],
            decisionFactors: ['user_impact', 'creative_potential', 'brand_alignment']
          },
          historicalData: {
            interactions: [],
            decisions: [],
            feedback: [],
            performance: []
          }
        }
      }
    ];

    // Register each user
    for (const user of users) {
      const response = await fetch(`${API_BASE}/automated-user-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_user',
          ...user
        })
      });
      
      const result = await response.json();
      console.log(`✅ Registered ${result.data.name} (${result.data.userId})`);
    }

    console.log('\n2. Simulating user interactions and automated evaluations...\n');
    
    // 2. Simulate interactions and generate automated evaluations
    const interactions = [
      {
        userId: 'user_analyst',
        task: 'Analyze the performance metrics for our Q3 results',
        input: { metrics: ['revenue', 'growth', 'efficiency'], period: 'Q3' },
        output: {
          analysis: 'Q3 performance shows 15% revenue growth with improved efficiency metrics',
          recommendations: ['Continue current strategies', 'Monitor efficiency trends'],
          confidence: 0.92
        },
        userFeedback: { satisfaction: 0.9, accuracy: 0.95, helpfulness: 0.88 }
      },
      {
        userId: 'user_creative',
        task: 'Design a new user interface for our mobile app',
        input: { platform: 'mobile', target: 'young_adults', features: ['social', 'gaming'] },
        output: {
          design: 'Modern, vibrant interface with social gaming elements',
          recommendations: ['Bold color scheme', 'Intuitive navigation', 'Social features'],
          confidence: 0.87
        },
        userFeedback: { satisfaction: 0.85, creativity: 0.92, usability: 0.88 }
      },
      {
        userId: 'user_analyst',
        task: 'Evaluate the statistical significance of our A/B test results',
        input: { testType: 'conversion_rate', sampleSize: 10000, confidenceLevel: 0.95 },
        output: {
          analysis: 'Results show 12% improvement with p-value < 0.01, statistically significant',
          recommendations: ['Implement variant B', 'Monitor long-term effects'],
          confidence: 0.96
        },
        userFeedback: { satisfaction: 0.94, accuracy: 0.98, clarity: 0.91 }
      }
    ];

    // Generate automated evaluations for each interaction
    for (const interaction of interactions) {
      const response = await fetch(`${API_BASE}/automated-user-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_interaction',
          ...interaction
        })
      });
      
      const result = await response.json();
      console.log(`📊 Generated evaluation for ${interaction.userId}:`);
      console.log(`   Accuracy: ${result.data.metrics.accuracy.toFixed(2)}`);
      console.log(`   Efficiency: ${result.data.metrics.efficiency.toFixed(2)}`);
      console.log(`   User Satisfaction: ${result.data.metrics.userSatisfaction.toFixed(2)}`);
      console.log(`   Alignment: ${result.data.metrics.alignment.toFixed(2)}`);
      console.log(`   Improvement: ${result.data.metrics.improvement.toFixed(2)}`);
      console.log(`   Recommendations: ${result.data.recommendations.modelAdjustments.length} model adjustments`);
      console.log('');
    }

    console.log('3. Optimizing system for each user...\n');
    
    // 3. Optimize system for each user
    for (const user of users) {
      const response = await fetch(`${API_BASE}/automated-user-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_user',
          userId: user.profile.id
        })
      });
      
      const result = await response.json();
      console.log(`🔧 Generated optimization for ${user.profile.name}:`);
      console.log(`   Personalized Prompts: ${result.data.optimizations.personalizedPrompts.length}`);
      console.log(`   Model Parameters: ${Object.keys(result.data.optimizations.modelParameters).length} parameters`);
      console.log(`   Evaluation Criteria: ${Object.keys(result.data.optimizations.evaluationCriteria).length} criteria`);
      console.log(`   Response Patterns: ${Object.keys(result.data.optimizations.responsePatterns).length} patterns`);
      console.log(`   Performance Improvement: ${(result.data.performance.improvement * 100).toFixed(1)}%`);
      console.log('');
    }

    console.log('4. Getting personalized recommendations...\n');
    
    // 4. Get personalized recommendations for each user
    for (const user of users) {
      const response = await fetch(`${API_BASE}/automated-user-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_recommendations',
          userId: user.profile.id
        })
      });
      
      const result = await response.json();
      console.log(`💡 Recommendations for ${user.profile.name}:`);
      console.log(`   Performance:`);
      console.log(`     Average Accuracy: ${result.data.performance.averageAccuracy.toFixed(2)}`);
      console.log(`     Average Efficiency: ${result.data.performance.averageEfficiency.toFixed(2)}`);
      console.log(`     Average Satisfaction: ${result.data.performance.averageSatisfaction.toFixed(2)}`);
      console.log(`     Improvement Trend: ${result.data.performance.improvementTrend.toFixed(2)}`);
      console.log(`   Immediate Recommendations: ${result.data.recommendations.immediate.length} items`);
      console.log(`   Long-term Recommendations: ${result.data.recommendations.longTerm.length} items`);
      console.log(`   System Optimizations: ${result.data.recommendations.systemOptimizations.length} items`);
      console.log('');
    }

    console.log('5. Getting system-wide statistics...\n');
    
    // 5. Get system-wide statistics
    const statsResponse = await fetch(`${API_BASE}/automated-user-evaluation?action=system_stats`);
    const stats = await statsResponse.json();
    console.log('System Statistics:');
    console.log(`   Total Users: ${stats.data.totalUsers}`);
    console.log(`   Total Evaluations: ${stats.data.totalEvaluations}`);
    console.log(`   Total Optimizations: ${stats.data.totalOptimizations}`);
    console.log(`   Average Evaluations per User: ${stats.data.averageEvaluationsPerUser.toFixed(2)}`);
    console.log(`   Average Optimizations per User: ${stats.data.averageOptimizationsPerUser.toFixed(2)}`);

    console.log('\n6. Getting individual user statistics...\n');
    
    // 6. Get individual user statistics
    for (const user of users) {
      const response = await fetch(`${API_BASE}/automated-user-evaluation?action=user_stats&userId=${user.profile.id}`);
      const userStats = await response.json();
      console.log(`${user.profile.name} Statistics:`);
      console.log(`   Evaluations: ${userStats.data.evaluations.count}`);
      console.log(`   Average Accuracy: ${userStats.data.evaluations.averageAccuracy.toFixed(2)}`);
      console.log(`   Average Efficiency: ${userStats.data.evaluations.averageEfficiency.toFixed(2)}`);
      console.log(`   Average Satisfaction: ${userStats.data.evaluations.averageSatisfaction.toFixed(2)}`);
      console.log(`   Optimizations: ${userStats.data.optimizations.count}`);
      console.log('');
    }

    console.log('🎉 Automated User Evaluation Demo Complete!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Automated evaluation per user interaction');
    console.log('✅ User-specific optimization based on evaluations');
    console.log('✅ Personalized recommendations and improvements');
    console.log('✅ Performance tracking and trend analysis');
    console.log('✅ System-wide statistics and monitoring');
    console.log('✅ Individual user statistics and insights');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demoAutomatedUserEvaluation();
}

module.exports = { demoAutomatedUserEvaluation };
