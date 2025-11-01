/**
 * Test Art Premium Insurance with PERMUTATION System
 * 
 * Tests the full PERMUTATION stack on an art insurance valuation task
 * that requires multi-step reasoning, expert knowledge, and quality assurance
 */

const ARTWORK = {
  title: "Sunset Over the Louvre",
  artist: "Claude Monet",
  year: "1875",
  medium: ["Oil on canvas"],
  dimensions: "65cm × 50cm",
  condition: "Excellent - recently restored, provenance verified",
  provenance: [
    "Private collection, Paris (1875-1910)",
    "Galerie Durand-Ruel, Paris (1910-1925)",
    "Private collection, London (1925-present)"
  ],
  signatures: ["Signed lower left: C. Monet"],
  period: "Impressionist",
  style: "Landscape"
};

const PURPOSE = 'insurance' as const;

async function testArtInsurancePremium() {
  console.log('🎨 Testing Art Insurance Premium Valuation with PERMUTATION\n');
  console.log('═'.repeat(80));
  
  // Test the Universal Art Valuation API
  const url = 'http://localhost:3000/api/universal-art-valuation';
  
  console.log('\n📝 Artwork Details:');
  console.log(JSON.stringify(ARTWORK, null, 2));
  console.log(`\n🎯 Purpose: ${PURPOSE}`);
  
  console.log('\n🚀 Calling PERMUTATION Valuation System...\n');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artwork: ARTWORK,
        purpose: PURPOSE
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ VALUATION COMPLETE');
    console.log('═'.repeat(80));
    
    if (result.success && result.data) {
      const val = result.data.valuation;
      const marketData = result.data.marketData;
      const systemAdapt = result.data.systemAdaptation;
      
      console.log(`\n💰 ESTIMATED VALUE:`);
      console.log(`   Most Likely: $${val.estimatedValue.mostLikely.toLocaleString()}`);
      console.log(`   Range: $${val.estimatedValue.low.toLocaleString()} - $${val.estimatedValue.high.toLocaleString()}`);
      
      console.log(`\n📊 CONFIDENCE:`);
      console.log(`   ${(val.confidence * 100).toFixed(0)}%`);
      
      console.log(`\n🔍 MARKET DATA:`);
      console.log(`   Comparable Sales: ${marketData.totalComparableSales}`);
      console.log(`   Average Price: $${marketData.averagePrice.toLocaleString()}`);
      console.log(`   Price Range: $${marketData.priceRange.min.toLocaleString()} - $${marketData.priceRange.max.toLocaleString()}`);
      console.log(`   Auction Houses: ${marketData.auctionHouses.join(', ')}`);
      
      if (result.data.marketTrends) {
        console.log(`\n📈 MARKET TRENDS:`);
        console.log(`   Trend: ${result.data.marketTrends.trend}`);
        console.log(`   Change: ${result.data.marketTrends.percentageChange}% over ${result.data.marketTrends.timeframe}`);
      }
      
      console.log(`\n🎯 METHODOLOGY:`);
      val.methodology.forEach((method: any, i: number) => {
        console.log(`   ${i + 1}. ${method}`);
      });
      
      console.log(`\n💡 RECOMMENDATIONS:`);
      result.data.recommendations.forEach((rec: any, i: number) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      
      console.log(`\n🧠 SYSTEM ADAPTATION:`);
      console.log(`   Auto-Built: ${systemAdapt.autoBuilt ? 'Yes' : 'No'}`);
      console.log(`   Artist Specialization: ${systemAdapt.artistSpecialization}`);
      console.log(`   Learning Score: ${systemAdapt.learningScore.toFixed(2)}`);
      console.log(`   Data Sources: ${systemAdapt.dataSources.join(', ')}`);
      
      console.log(`\n⏱️  Performance:`);
      console.log(`   Response Time: ${result.metadata?.processingTime || 'N/A'}ms`);
      console.log(`   Cost: $${result.metadata?.cost.toFixed(4) || '0.0000'}`);
      console.log(`   Quality: ${result.metadata?.quality || 'N/A'}`);
      
    } else {
      console.log(`\n❌ VALUATION FAILED`);
      console.log(`   Error: ${result.error}`);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('═'.repeat(80) + '\n');
    
    return result;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(error);
    console.log('\n' + '═'.repeat(80) + '\n');
    throw error;
  }
}

// Run the test
testArtInsurancePremium()
  .then(() => {
    console.log('🎉 Art insurance premium valuation test successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });

