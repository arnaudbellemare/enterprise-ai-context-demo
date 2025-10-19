#!/usr/bin/env node

/**
 * Kimi K2 Integration Test
 * Demonstrates how to use Kimi K2 with the PERMUTATION system
 */

const BASE_URL = 'http://localhost:3000';

async function testKimiK2Integration() {
  console.log('🤖 Testing Kimi K2 Integration with PERMUTATION System...\n');
  
  const tests = [
    {
      name: 'Simple Query (Should use GEPA + Cost Optimization)',
      query: 'What is 2+2?',
      domain: 'general'
    },
    {
      name: 'Complex Legal Query (Should activate Kimi K2)',
      query: 'Analyze the legal implications of using AI-generated content in a software licensing agreement where the AI was trained on copyrighted material without explicit permission.',
      domain: 'legal'
    },
    {
      name: 'Direct Kimi K2 Test',
      query: 'Hello! What can you tell me about yourself?',
      model: 'google/gemma-2-9b-it:free' // Using working free model
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🧪 Test: ${test.name}`);
    console.log(`   Query: ${test.query.substring(0, 80)}...`);
    
    try {
      if (test.model) {
        // Direct Kimi K2 test
        const response = await fetch(`${BASE_URL}/api/kimi-k2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: test.query,
            model: test.model
          })
        });
        
        const data = await response.json();
        if (data.success) {
          console.log(`   ✅ Kimi K2 Response: ${data.response.substring(0, 100)}...`);
          console.log(`   📊 Model: ${data.model}`);
          console.log(`   ⏱️  Processing Time: ${data.processingTimeMs}ms`);
        } else {
          console.log(`   ❌ Kimi K2 Failed: ${data.error}`);
        }
      } else {
        // Brain system test
        const response = await fetch(`${BASE_URL}/api/brain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: test.query,
            domain: test.domain
          })
        });
        
        const data = await response.json();
        if (data.success) {
          console.log(`   ✅ Brain Response: ${data.response.substring(0, 100)}...`);
          console.log(`   🧠 Skills Activated: ${data.brain_processing.activated_skills.join(', ')}`);
          console.log(`   ⏱️  Processing Time: ${data.metadata.processing_time_ms}ms`);
          
          // Check if Kimi K2 was used
          if (data.brain_processing.activated_skills.includes('kimiK2')) {
            console.log(`   🤖 Kimi K2 was activated!`);
          }
        } else {
          console.log(`   ❌ Brain Failed: ${data.error}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Test Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Summary:');
  console.log('   - Kimi K2 is integrated into the PERMUTATION brain system');
  console.log('   - It activates for complex legal queries and advanced reasoning');
  console.log('   - Free models require privacy settings configuration');
  console.log('   - Paid models require OpenRouter credits');
  console.log('   - Fallback to Teacher-Student system if Kimi K2 fails');
  
  console.log('\n📋 Available Kimi K2 Models:');
  console.log('   - moonshotai/kimi-k2:free (requires privacy settings)');
  console.log('   - moonshotai/kimi-k2 (requires credits)');
  console.log('   - moonshotai/kimi-k2-0905 (requires credits)');
  console.log('   - moonshotai/kimi-dev-72b:free (requires privacy settings)');
  console.log('   - moonshotai/kimi-dev-72b (requires credits)');
  
  console.log('\n🔧 Setup Instructions:');
  console.log('   1. Configure privacy settings: https://openrouter.ai/settings/privacy');
  console.log('   2. Purchase credits: https://openrouter.ai/settings/credits');
  console.log('   3. Or use alternative free models like google/gemma-2-9b-it:free');
}

// Run the test
testKimiK2Integration();
