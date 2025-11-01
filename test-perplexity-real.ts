import { perplexityTeacher } from './lib/perplexity-teacher';

// Note: Perplexity API key should be set in environment variables or .env.local
if (!process.env.PERPLEXITY_API_KEY) {
  console.error('❌ PERPLEXITY_API_KEY not set in environment');
  process.exit(1);
}

async function testPerplexityReal() {
  console.log('🔍 Testing Perplexity with Real Monet Data\n');
  console.log('═'.repeat(80));
  
  const artist = 'Claude Monet';
  const medium = ['Oil on canvas'];
  const year = '1899';
  
  console.log(`\n📝 Query:`);
  console.log(`   Artist: ${artist}`);
  console.log(`   Medium: ${medium.join(', ')}`);
  console.log(`   Year: ${year}`);
  
  console.log(`\n🚀 Calling Perplexity API...\n`);
  
  try {
    const data = await perplexityTeacher.lookupMarketData(artist, medium, year);
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ PERPLEXITY RESPONSE');
    console.log('═'.repeat(80));
    
    console.log(`\n📊 Data Points: ${data.length}`);
    
    if (data.length > 0) {
      data.forEach((sale, i) => {
        console.log(`\n  Sale ${i + 1}:`);
        console.log(`    Title: ${sale.title}`);
        console.log(`    Price: $${sale.hammerPrice.toLocaleString()}`);
        console.log(`    Auction House: ${sale.auctionHouse}`);
        console.log(`    Date: ${sale.saleDate}`);
        console.log(`    Confidence: ${(sale.confidence * 100).toFixed(0)}%`);
        console.log(`    Quality: ${sale.dataQuality}`);
      });
      
      const prices = data.map(d => d.hammerPrice);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      
      console.log(`\n💰 SUMMARY:`);
      console.log(`   Average Price: $${avg.toLocaleString()}`);
      console.log(`   Price Range: $${min.toLocaleString()} - $${max.toLocaleString()}`);
    } else {
      console.log('\n⚠️  No data returned from Perplexity');
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

testPerplexityReal();
