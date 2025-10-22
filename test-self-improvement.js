#!/usr/bin/env node

// Test script to verify self-improvement system
const testSelfImprovement = async () => {
  console.log('🧠 Testing Self-Improvement System...\n');
  
  // Test 1: Normal query
  console.log('1️⃣ Testing normal query...');
  const response1 = await fetch('http://localhost:3001/api/brain-moe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: "What is artificial intelligence?",
      context: { domain: "technology", complexity: 4 }
    })
  });
  
  const result1 = await response1.json();
  console.log(`✅ Response received: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`📊 Skills activated: ${result1.metadata?.skillsActivated?.length || 0}`);
  console.log(`🎯 Average quality: ${result1.metadata?.averageQuality || 'N/A'}`);
  
  // Test 2: Another query to build performance history
  console.log('\n2️⃣ Testing second query...');
  const response2 = await fetch('http://localhost:3001/api/brain-moe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: "How does machine learning work?",
      context: { domain: "technology", complexity: 5 }
    })
  });
  
  const result2 = await response2.json();
  console.log(`✅ Response received: ${result2.success ? 'SUCCESS' : 'FAILED'}`);
  
  // Test 3: Third query to potentially trigger evolution
  console.log('\n3️⃣ Testing third query...');
  const response3 = await fetch('http://localhost:3001/api/brain-moe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: "Explain quantum computing",
      context: { domain: "technology", complexity: 8 }
    })
  });
  
  const result3 = await response3.json();
  console.log(`✅ Response received: ${result3.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`📊 Skills activated: ${result3.metadata?.skillsActivated?.length || 0}`);
  console.log(`🎯 Average quality: ${result3.metadata?.averageQuality || 'N/A'}`);
  
  console.log('\n🔍 Self-improvement system test completed!');
  console.log('💡 Check server logs for "Ax LLM" messages to see if evolution is triggered.');
};

testSelfImprovement().catch(console.error);
