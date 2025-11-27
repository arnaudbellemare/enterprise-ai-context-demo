/**
 * Test OODA Loop Integration with Market Insights
 */

import { generateMarketInsightsWithOODA } from './frontend/lib/market-insights/ooda-market-insights';
import type { MarketInsightsConfig } from './frontend/lib/market-insights/market-insights-service';

async function testOODAMarketInsights() {
  console.log('🧪 OODA Loop Market Insights Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Testing market insights generation using OODA loop:');
  console.log('  👁️  Observe: Market conditions');
  console.log('  🧭 Orient: Understand trends and context');
  console.log('  🎯 Decide: Choose insights to generate');
  console.log('  ⚡ Act: Generate market pulse report');
  console.log('');

  const config: MarketInsightsConfig = {
    category: 'watches',
    frequency: 'weekly',
    includeItems: true,
    includeIndex: true,
    includeOutlook: true,
    maxItems: 2,
    maxIndexAssets: 3
  };

  console.log(`📊 Configuration:`);
  console.log(`   Category: ${config.category}`);
  console.log(`   Frequency: ${config.frequency}`);
  console.log('');

  try {
    const startTime = Date.now();
    const result = await generateMarketInsightsWithOODA(config);
    const duration = Date.now() - startTime;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ OODA LOOP COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`⏱️  Total time: ${(duration / 1000).toFixed(1)}s`);
    console.log(`🔄 Cycles executed: ${result.oodaCycles.length}`);
    console.log('');

    // Display OODA cycle summary
    result.oodaCycles.forEach((cycle, idx) => {
      console.log(`Cycle ${idx + 1}:`);
      console.log(`  👁️  Observed: ${cycle.observation.sources.length} sources`);
      console.log(`  🧭 Oriented: ${cycle.orientation.patterns.length} patterns, ${cycle.orientation.threats.length} threats, ${cycle.orientation.opportunities.length} opportunities`);
      console.log(`  🎯 Decided: ${cycle.decision.selectedOption?.description}`);
      console.log(`  ⚡ Acted: ${cycle.action.executed ? '✅' : '❌'}`);
      console.log('');
    });

    // Display market insights
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📰 MARKET INSIGHTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`Title: ${result.insights.title}`);
    console.log('');
    console.log(`Market Overview:`);
    console.log(result.insights.marketOverview.substring(0, 500) + '...');
    console.log('');

    if (result.insights.specificItems && result.insights.specificItems.length > 0) {
      console.log(`Specific Items (${result.insights.specificItems.length}):`);
      result.insights.specificItems.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name}`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('   Unknown error:', error);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

testOODAMarketInsights();



