#!/usr/bin/env node

// Simple test to verify MoE system is working
const testMoE = async () => {
  console.log('🧠 Testing MoE System...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/brain-moe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "What are the benefits of renewable energy?",
        context: { domain: "environment", complexity: 6 }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ MoE System Response:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
    console.log(`   Skill Scores: ${JSON.stringify(result.metadata?.skillScores || {})}`);
    console.log(`   Average Quality: ${result.metadata?.averageQuality || 'N/A'}`);
    console.log(`   Total Time: ${result.performance?.totalTime || 'N/A'}ms`);
    console.log(`   MoE Optimized: ${result.metadata?.moeOptimized || false}`);
    
    if (result.metadata?.skillsActivated?.length > 0) {
      console.log('\n🎯 Skills Activated:');
      result.metadata.skillsActivated.forEach(skill => {
        console.log(`   - ${skill}`);
      });
    }
    
    console.log('\n📝 Response Preview:');
    const preview = result.response?.substring(0, 200) + '...';
    console.log(`   ${preview}`);
    
  } catch (error) {
    console.error('❌ Error testing MoE system:', error.message);
  }
};

testMoE();
