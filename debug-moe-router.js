#!/usr/bin/env node

// Debug script to test MoE router expert selection
const debugMoERouter = async () => {
  console.log('🔍 Debugging MoE Router Expert Selection\n');
  
  const testQueries = [
    { query: "How to implement computer vision?", domain: "technology", complexity: 8 },
    { query: "What is machine learning?", domain: "technology", complexity: 4 },
    { query: "Explain neural networks", domain: "technology", complexity: 6 }
  ];
  
  for (let i = 0; i < testQueries.length; i++) {
    const { query, domain, complexity } = testQueries[i];
    console.log(`${i + 1}️⃣ Testing: "${query}"`);
    console.log(`   Domain: ${domain}, Complexity: ${complexity}`);
    
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
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const result = await response.json();
      
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   📊 Skills Activated: ${result.metadata?.skillsActivated?.length || 0}`);
      console.log(`   🎯 Quality: ${result.metadata?.averageQuality || 'N/A'}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);
      console.log(`   🧠 MoE Optimized: ${result.metadata?.moeOptimized || false}`);
      
      if (result.metadata?.skillsActivated?.length === 0) {
        console.log(`   ⚠️  WARNING: No skills activated!`);
        console.log(`   📈 Skill Scores: ${JSON.stringify(result.metadata?.skillScores || {})}`);
        console.log(`   💰 Total Cost: ${result.metadata?.totalCost || 0}`);
        console.log(`   🧠 Implementations: ${JSON.stringify(result.metadata?.implementations || {})}`);
      } else {
        console.log(`   🎯 Skills: ${result.metadata?.skillsActivated?.join(', ')}`);
        if (result.metadata?.skillScores) {
          console.log(`   📈 Skill Scores:`);
          Object.entries(result.metadata.skillScores).forEach(([skill, score]) => {
            console.log(`      ${skill}: ${(score * 100).toFixed(1)}%`);
          });
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🔍 Debug completed!');
  console.log('💡 If computer vision query shows 0 skills, there might be an issue with:');
  console.log('   - MoE router expert registration');
  console.log('   - Relevance scoring algorithm');
  console.log('   - Skill selection logic');
  console.log('   - Domain/complexity matching');
};

debugMoERouter().catch(console.error);
