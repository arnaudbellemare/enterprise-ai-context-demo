/**
 * Quick Market Insights Test - Simplified
 * Tests market insights with simplified prompt for faster Ollama response
 */

import { marketInsightsService, type MarketInsightsConfig } from './frontend/lib/market-insights/market-insights-service';

async function testMarketInsights() {
  console.log('🧪 Testing Market Insights (Simplified Prompt)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const config: MarketInsightsConfig = {
    category: 'watches',
    frequency: 'weekly',
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2, // Reduced for faster generation
    maxIndexAssets: 3 // Reduced for faster generation
  };
  
  console.log(`📊 Configuration:`);
  console.log(`   Category: ${config.category}`);
  console.log(`   Frequency: ${config.frequency}`);
  console.log(`   Max Items: ${config.maxItems}`);
  console.log(`   Max Index Assets: ${config.maxIndexAssets}\n`);
  
  console.log(`🔄 Generating market insights...`);
  console.log(`   ⏳ Using simplified prompt for faster Ollama response\n`);
  
  const startTime = Date.now();
  
  try {
    // Add test-level timeout to prevent infinite hangs
    const insightsPromise = marketInsightsService.generateMarketInsights(config);
    const testTimeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Test timeout: Market insights generation exceeded 5 minutes')), 300000)
    );
    
    const insights = await Promise.race([insightsPromise, testTimeoutPromise]);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Market Insights Generated in ${(duration / 1000).toFixed(1)}s:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📰 TITLE:`);
    console.log(`   ${insights.title}\n`);
    
    console.log(`📊 MARKET OVERVIEW:`);
    console.log(`   ${insights.marketOverview}\n`);
    
    if (insights.specificItems && insights.specificItems.length > 0) {
      console.log(`💎 SPECIFIC ITEMS (${insights.specificItems.length}):`);
      insights.specificItems.forEach((item: any, idx: number) => {
        console.log(`   ${idx + 1}. ${item.name}`);
        if (item.description) console.log(`      ${item.description}`);
        if (item.marketCap) console.log(`      Market Cap: $${item.marketCap.toLocaleString()}`);
      });
      console.log('');
    }
    
    if (insights.indexAssets && insights.indexAssets.length > 0) {
      console.log(`📈 INDEX ASSETS (${insights.indexAssets.length}):`);
      insights.indexAssets.forEach((asset: any, idx: number) => {
        console.log(`   ${idx + 1}. ${asset.name}`);
        if (asset.marketCap) console.log(`      Market Cap: $${asset.marketCap.toLocaleString()}`);
      });
      console.log('');
    }
    
    if (insights.futureOutlook) {
      console.log(`🔮 FUTURE OUTLOOK:`);
      console.log(`   ${insights.futureOutlook}\n`);
    }
    
    console.log(`📊 METADATA:`);
    console.log(`   Confidence: ${(insights.metadata.confidence * 100).toFixed(0)}%`);
    console.log(`   Category: ${insights.metadata.category}`);
    console.log(`   Generated: ${insights.metadata.generatedAt}`);
    
    console.log(`\n✅ Test Complete!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Failed after ${(duration / 1000).toFixed(1)}s:`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.error('   Unknown error:', error);
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

testMarketInsights();



