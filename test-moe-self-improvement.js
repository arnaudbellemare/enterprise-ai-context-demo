#!/usr/bin/env node

// Test MoE self-improvement with multiple queries to build performance history
const testMoESelfImprovement = async () => {
  console.log('🧠 Testing MoE Self-Improvement System\n');
  
  const queries = [
    { query: "What is machine learning?", domain: "technology", complexity: 4 },
    { query: "How does neural networks work?", domain: "technology", complexity: 6 },
    { query: "Explain deep learning", domain: "technology", complexity: 7 },
    { query: "What are AI applications?", domain: "technology", complexity: 5 },
    { query: "How to implement computer vision?", domain: "technology", complexity: 8 }
  ];
  
  console.log('📊 Building performance history with 5 queries...\n');
  
  for (let i = 0; i < queries.length; i++) {
    const { query, domain, complexity } = queries[i];
    console.log(`${i + 1}️⃣ Query: "${query}"`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3001/api/brain-moe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: { domain, complexity }
        })
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (!response.ok) {
        console.log(`   ❌ HTTP Error: ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   📊 Skills: ${result.metadata?.skillsActivated?.length || 0}`);
      console.log(`   🎯 Quality: ${result.metadata?.averageQuality || 'N/A'}`);
      console.log(`   ⏱️  Time: ${duration}ms`);
      
      if (result.metadata?.skillScores) {
        console.log(`   📈 Skill Scores:`);
        Object.entries(result.metadata.skillScores).forEach(([skill, score]) => {
          console.log(`      ${skill}: ${(score * 100).toFixed(1)}%`);
        });
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🔍 Self-improvement test completed!');
  console.log('💡 Check server logs for:');
  console.log('   - "🧠 Self-Improvement: Starting evaluation"');
  console.log('   - "🧠 Self-Improvement: Tracking performance"');
  console.log('   - "🔄 Ax LLM: Low performance detected"');
  console.log('   - "✅ Ax LLM: Prompt evolved"');
};

testMoESelfImprovement().catch(console.error);
