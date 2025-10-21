// Test MoE Skill Router
const { moeSkillRouter } = require('./frontend/lib/moe-skill-router');

async function testMoERouter() {
  console.log('🧪 Testing MoE Skill Router...');
  
  // Test query
  const request = {
    query: "Analyze AI system performance",
    context: {},
    domain: "technology",
    complexity: 3,
    requirements: ["analysis", "optimization"],
    constraints: {
      maxCost: 1.0,
      maxLatency: 10.0,
      minAccuracy: 0.7
    }
  };
  
  try {
    const response = await moeSkillRouter.routeQuery(request);
    console.log('✅ MoE Router Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ MoE Router Error:', error);
  }
}

testMoERouter();
