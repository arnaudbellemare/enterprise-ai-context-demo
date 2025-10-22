#!/usr/bin/env node

/**
 * Direct MoE Router Test
 * Test the MoE router directly to see if it's working
 */

const BASE_URL = 'http://localhost:3001';

async function testMoERouterDirect() {
  console.log('🔍 Testing MoE Router Directly...');
  
  try {
    // Test the brain route with MoE enabled
    const response = await fetch(`${BASE_URL}/api/brain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Test MoE router directly',
        domain: 'technology',
        useMoE: true
      })
    });

    const data = await response.json();
    
    console.log('📊 Brain Route Response:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Skills Activated: ${data.metadata.skillsActivated.length}`);
    console.log(`   Skills: ${data.metadata.skillsActivated.join(', ')}`);
    console.log(`   MoE Optimized: ${data.metadata.moeOptimized}`);
    console.log(`   Total Time: ${data.metadata.totalTime}ms`);
    
    if (data.metadata.skillsActivated.length === 0) {
      console.log('\n❌ No skills activated - MoE router issue');
      console.log('   This suggests the MoE router is not selecting experts');
    } else {
      console.log('\n✅ MoE router is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testMoERouterDirect().catch(console.error);
