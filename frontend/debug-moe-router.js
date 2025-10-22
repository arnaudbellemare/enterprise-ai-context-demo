#!/usr/bin/env node

/**
 * Debug MoE Router
 * Test the MoE router directly to see why it's not selecting experts
 */

const BASE_URL = 'http://localhost:3001';

async function debugMoERouter() {
  console.log('🔍 Debugging MoE Router...');
  
  try {
    // Test the MoE router directly
    const response = await fetch(`${BASE_URL}/api/brain-moe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Test query for MoE router',
        context: { 
          domain: 'technology', 
          complexity: 7,
          requirements: ['optimization', 'reasoning']
        },
        priority: 'normal',
        budget: 0.05,
        requiredQuality: 0.8
      })
    });

    const data = await response.json();
    
    console.log('📊 MoE Router Response:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Skills Activated: ${data.metadata.skillsActivated.length}`);
    console.log(`   Skills: ${data.metadata.skillsActivated.join(', ')}`);
    console.log(`   Skill Scores: ${JSON.stringify(data.metadata.skillScores)}`);
    console.log(`   Implementations: ${JSON.stringify(data.metadata.implementations)}`);
    console.log(`   Total Cost: $${data.metadata.totalCost}`);
    console.log(`   Average Quality: ${data.metadata.averageQuality}`);
    console.log(`   MoE Optimized: ${data.metadata.moeOptimized}`);
    
    if (data.performance) {
      console.log('\n📈 Performance:');
      console.log(`   Selection Time: ${data.performance.selectionTime}ms`);
      console.log(`   Execution Time: ${data.performance.executionTime}ms`);
      console.log(`   Synthesis Time: ${data.performance.synthesisTime}ms`);
      console.log(`   Total Time: ${data.performance.totalTime}ms`);
    }
    
    console.log('\n📝 Response:');
    console.log(`   ${data.response.substring(0, 200)}...`);
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

// Run the debug
debugMoERouter().catch(console.error);
