/**
 * Test Market Insights Generation for Art Collectibles
 * 
 * Tests the market insights service using PERMUTATION_LITE
 * Focus: Art collectibles market (watches, cars, jewelry, sports, NFTs)
 */

import { marketInsightsService } from './frontend/lib/market-insights/market-insights-service';
import { marketInsightsScheduler } from './frontend/lib/market-insights/market-insights-scheduler';

async function testMarketInsights() {
  console.log('🧪 Testing Art Collectibles Market Insights Service\n');

  // Test 1: Generate weekly sports memorabilia insights (art collectibles)
  console.log('📊 Test 1: Weekly Sports Memorabilia Market Pulse');
  try {
    const sportsInsights = await marketInsightsService.generateMarketInsights({
      category: 'sports',
      frequency: 'weekly',
      includeItems: true,
      includeIndex: true,
      includeOutlook: true,
      maxItems: 3,
      maxIndexAssets: 5,
    });

    console.log('✅ Generated Market Pulse insights:', {
      title: sportsInsights.title,
      itemsCount: sportsInsights.specificItems?.length || 0,
      indexAssetsCount: sportsInsights.indexAssets?.length || 0,
      hasOutlook: !!sportsInsights.futureOutlook,
      category: sportsInsights.metadata.category,
    });

    // Format and display
    const markdown = marketInsightsService.formatAsMarkdown(sportsInsights);
    console.log('\n📄 Market Pulse Report (first 800 chars):');
    console.log(markdown.slice(0, 800) + '...\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Generate daily watches insights (art collectibles)
  console.log('📊 Test 2: Daily Luxury Watches Market Pulse');
  try {
    const watchesInsights = await marketInsightsService.generateMarketInsights({
      category: 'watches',
      frequency: 'daily',
      includeItems: true,
      includeIndex: true,
      maxItems: 2,
    });

    console.log('✅ Generated Market Pulse insights:', {
      title: watchesInsights.title,
      itemsCount: watchesInsights.specificItems?.length || 0,
      indexAssetsCount: watchesInsights.indexAssets?.length || 0,
      category: watchesInsights.metadata.category,
    });
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Test scheduler for all categories
  console.log('\n📅 Test 3: Market Insights Scheduler (All Categories)');
  try {
    marketInsightsScheduler.initializeDefaultSchedules('weekly');
    const schedules = marketInsightsScheduler.getAllSchedules();
    console.log('✅ Schedules initialized for all art collectibles categories:', schedules.length);
    console.log('Schedules:', schedules.map(s => ({ 
      id: s.id, 
      category: s.category, 
      frequency: s.frequency,
      enabled: s.enabled 
    })));
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test 4: Quick test for jewelry category
  console.log('\n📊 Test 4: Jewelry Market Pulse (Quick Test)');
  try {
    const jewelryInsights = await marketInsightsService.generateMarketInsights({
      category: 'jewelry',
      frequency: 'weekly',
      includeItems: true,
      maxItems: 2,
    });
    console.log('✅ Jewelry Market Pulse generated:', {
      title: jewelryInsights.title,
      category: jewelryInsights.metadata.category,
    });
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  console.log('\n✅ All art collectibles market insights tests completed');
  console.log('\n💡 To generate insights for all categories at once:');
  console.log('   POST /api/market-insights/batch');
  console.log('   { "frequency": "weekly", "categories": ["watches", "cars", "jewelry", "sports", "nfts"] }');
}

// Run tests
testMarketInsights().catch(console.error);

