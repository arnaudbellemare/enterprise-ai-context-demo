#!/usr/bin/env node

// Comprehensive test of the MoE self-improvement system
const testComprehensiveMoE = async () => {
  console.log('🧠 Comprehensive MoE Self-Improvement Test\n');
  
  const queries = [
    { query: "What is machine learning?", domain: "technology", complexity: 4 },
    { query: "How does neural networks work?", domain: "technology", complexity: 6 },
    { query: "Explain deep learning algorithms", domain: "technology", complexity: 7 },
    { query: "What are the applications of AI?", domain: "technology", complexity: 5 },
    { query: "How to implement computer vision?", domain: "technology", complexity: 8 }
  ];
  
  console.log(`📊 Testing ${queries.length} queries to build performance history...\n`);
  
  for (let i = 0; i < queries.length; i++) {
    const { query, domain, complexity } = queries[i];
    console.log(`${i + 1}️⃣ Testing: "${query}"`);
    
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   📊 Skills: ${result.metadata?.skillsActivated?.length || 0}`);
      console.log(`   🎯 Quality: ${result.metadata?.averageQuality || 'N/A'}`);
      console.log(`   ⏱️  Time: ${duration}ms`);
      console.log(`   🧠 MoE Optimized: ${result.metadata?.moeOptimized || false}`);
      
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
  
  console.log('🎉 Comprehensive test completed!');
  console.log('💡 Check server logs for "🧠 Self-Improvement" messages to see if evolution is triggered.');
  console.log('🔍 Look for "Ax LLM: Low performance detected" or "Ax LLM: Evolved prompt" messages.');
};

testComprehensiveMoE().catch(console.error);
