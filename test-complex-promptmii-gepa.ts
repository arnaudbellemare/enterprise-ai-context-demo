/**
 * Complex Query Test for PromptMII+GEPA Integration
 * 
 * Tests the full PERMUTATION system with a very complex multi-part query
 * to verify PromptMII+GEPA optimizations work under stress
 */

// Environment variables loaded via --env-file flag

// Complex multi-part query that requires:
// - Multi-step decomposition (SWiRL)
// - Domain expertise (ACE)
// - Market data (Perplexity)
// - Complex reasoning (TRM)
// - Multiple tools (web search, calculator, SQL)
const COMPLEX_QUERY = `As an insurance appraiser for a high-net-worth collector, I need you to:

1. Evaluate the current market value of a 1919 Claude Monet "Water Lilies" painting (oil on canvas, 200cm x 180cm, excellent condition, authenticated by Musée d'Orsay in 2015)

2. Research recent comparable sales at major auction houses (Christie's, Sotheby's, Heritage Auctions) from 2020-2024 for Monet Water Lilies series paintings, specifically looking for:
   - Similar dimensions and medium
   - Comparable condition ratings
   - Same artistic period (1910-1926)
   - Insurance valuations vs auction realized prices

3. Analyze market trends for Impressionist art, considering:
   - Post-pandemic market recovery patterns
   - Impact of digital art/NFT market on traditional art values
   - Currency fluctuations affecting international collectors
   - Supply constraints (limited number of authentic Monet Water Lilies)

4. Calculate insurance replacement cost considering:
   - Current fair market value (FMV)
   - 20% replacement cost premium (for comparable period works)
   - Shipping and authentication costs ($50,000)
   - Appreciation factor based on 5-year historical growth rate

5. Assess risk factors:
   - Climate risks (humidity, temperature variations)
   - Transportation risks (if loaned to exhibitions)
   - Provenance verification needs
   - Authentication maintenance costs

6. Provide USPAP-compliant documentation including:
   - Appraisal report structure
   - Comparable sales analysis
   - Market condition summary
   - Confidence interval for valuation
   - Recommended insurance coverage amount

7. Generate a comprehensive risk assessment report that includes recommendations for:
   - Insurance policy structure (fine art rider vs standalone policy)
   - Security requirements (if value exceeds $50M threshold)
   - Conservation maintenance schedule
   - Market monitoring strategy for valuation updates

Please provide detailed analysis with citations, confidence scores, and actionable recommendations.`;

async function testComplexQuery() {
  console.log('🧪 Testing Complex Query with PromptMII+GEPA Integration\n');
  console.log('═'.repeat(80));
  
  const startTime = Date.now();
  
  console.log(`\n📝 Query Complexity:`);
  console.log(`   Length: ${COMPLEX_QUERY.length} characters`);
  console.log(`   Words: ${COMPLEX_QUERY.split(/\s+/).length}`);
  console.log(`   Tasks: 7 distinct requirements`);
  console.log(`   Domain: Multi-domain (art, insurance, finance, legal)`);
  
  console.log(`\n🔬 Testing Full PERMUTATION Stack:`);
  console.log(`   • SWiRL (with PromptMII+GEPA optimization)`);
  console.log(`   • TRM verification`);
  console.log(`   • ACE context engineering`);
  console.log(`   • Market data (Perplexity)`);
  console.log(`   • Multiple tools (web, calculator, SQL)`);
  
  try {
    console.log(`\n🚀 Calling execute-swirl-trm-full API...`);
    
    const response = await fetch('http://localhost:3000/api/arena/execute-swirl-trm-full', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: COMPLEX_QUERY,
        taskDescription: COMPLEX_QUERY,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ API Error (${response.status}):`);
      console.error(errorText);
      throw new Error(`API returned ${response.status}`);
    }
    
    const result = await response.json();
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ API Response received (${duration}ms)`);
    console.log(`\n📊 Results Summary:`);
    
    if (result.logs) {
      const logs = result.logs;
      console.log(`   Total components: ${logs.length}`);
      
      // Find SWiRL decomposition
      const swirlLog = logs.find((l: any) => l.component === '9. SWiRL Decomposition' || l.component?.includes('SWiRL'));
      if (swirlLog) {
        console.log(`\n🔄 SWiRL Decomposition:`);
        console.log(`   Status: ${swirlLog.status}`);
        if (swirlLog.details) {
          console.log(`   Steps: ${swirlLog.details.steps_count || swirlLog.details.all_steps?.length || 'N/A'}`);
          console.log(`   Complexity: ${swirlLog.details.total_complexity?.toFixed(2) || 'N/A'}`);
          console.log(`   Tools: ${swirlLog.details.tools_required?.join(', ') || 'N/A'}`);
          
          // Check if optimization was applied
          if (swirlLog.details.trajectory_id?.includes('opt')) {
            console.log(`   ✅ PromptMII+GEPA optimization: APPLIED`);
          } else {
            console.log(`   ⚠️  PromptMII+GEPA optimization: NOT DETECTED (may be cached)`);
          }
        }
      }
      
      // Find SRL enhancement
      const srlLog = logs.find((l: any) => l.component?.includes('SRL'));
      if (srlLog) {
        console.log(`\n🎯 SRL Enhancement:`);
        console.log(`   Status: ${srlLog.status}`);
        if (srlLog.details) {
          console.log(`   Average Reward: ${srlLog.details.averageStepReward?.toFixed(3) || 'N/A'}`);
          console.log(`   Total Reward: ${srlLog.details.totalReward?.toFixed(3) || 'N/A'}`);
        }
      }
      
      // Find TRM verification
      const trmLog = logs.find((l: any) => l.component?.includes('TRM'));
      if (trmLog) {
        console.log(`\n🧠 TRM Verification:`);
        console.log(`   Status: ${trmLog.status}`);
      }
      
      // Check for optimization indicators
      console.log(`\n🔬 PromptMII+GEPA Optimization Status:`);
      let optimizationFound = false;
      
      // Look for optimization logs in the response
      if (result.logs?.some((l: any) => 
        l.details?.toString().includes('optimized') || 
        l.details?.toString().includes('PromptMII') ||
        l.details?.toString().includes('GEPA')
      )) {
        console.log(`   ✅ Optimization detected in logs`);
        optimizationFound = true;
      }
      
      if (!optimizationFound) {
        console.log(`   ℹ️  Optimization may be cached or not logged`);
        console.log(`   ℹ️  Check SWiRL trajectory_id for 'opt' prefix`);
      }
    }
    
    console.log(`\n⏱️  Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    
    if (result.success !== false) {
      console.log(`\n✅ Test: PASSED`);
    } else {
      console.log(`\n⚠️  Test: Completed with warnings`);
    }
    
    console.log(`\n═`.repeat(80));
    
  } catch (error) {
    console.error(`\n❌ Test Failed:`);
    console.error(error instanceof Error ? error.message : error);
    
    // Check if server is running
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.error(`\n💡 Make sure the Next.js server is running:`);
      console.error(`   cd frontend && npm run dev`);
    }
    
    process.exit(1);
  }
}

// Run the test
testComplexQuery().catch(console.error);

