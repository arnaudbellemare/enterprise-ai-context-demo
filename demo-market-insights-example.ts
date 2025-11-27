/**
 * Demo: Full Market Insights Example
 * 
 * Generates a complete example Market Pulse report to show the output format
 */

import { marketInsightsService } from './frontend/lib/market-insights/market-insights-service';

async function generateExampleReport() {
  console.log('📊 Generating Full Market Pulse Report Example\n');
  console.log('='.repeat(80));
  console.log('ART COLLECTIBLES MARKET PULSE REPORT');
  console.log('Category: Sports Memorabilia');
  console.log('Frequency: Weekly');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    // Generate the full report
    const insights = await marketInsightsService.generateMarketInsights({
      category: 'sports',
      frequency: 'weekly',
      includeItems: true,
      includeIndex: true,
      includeOutlook: true,
      maxItems: 3,
      maxIndexAssets: 5,
    });

    // Display the full formatted report
    const markdown = marketInsightsService.formatAsMarkdown(insights);
    
    console.log('📄 FULL MARKET PULSE REPORT OUTPUT:');
    console.log('='.repeat(80));
    console.log(markdown);
    console.log('='.repeat(80));
    
    console.log('\n\n📊 STRUCTURED DATA:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(insights, null, 2));
    console.log('='.repeat(80));

    console.log('\n\n📈 METADATA:');
    console.log('='.repeat(80));
    console.log(`Title: ${insights.title}`);
    console.log(`Category: ${insights.metadata.category}`);
    console.log(`Frequency: ${insights.metadata.frequency}`);
    console.log(`Generated At: ${insights.metadata.generatedAt}`);
    console.log(`Confidence: ${(insights.metadata.confidence * 100).toFixed(0)}%`);
    console.log(`Data Sources: ${insights.metadata.dataSources.join(', ')}`);
    console.log(`Items Count: ${insights.specificItems?.length || 0}`);
    console.log(`Index Assets Count: ${insights.indexAssets?.length || 0}`);
    console.log(`Has Future Outlook: ${insights.futureOutlook ? 'Yes' : 'No'}`);
    console.log('='.repeat(80));

    if (insights.specificItems && insights.specificItems.length > 0) {
      console.log('\n\n🎯 SPECIFIC ITEMS DETAILS:');
      console.log('='.repeat(80));
      insights.specificItems.forEach((item, idx) => {
        console.log(`\nItem ${idx + 1}:`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Market Cap: ${item.marketCap ? '$' + item.marketCap.toLocaleString() : 'N/A'}`);
        console.log(`  Trend: ${item.trend || 'N/A'}`);
        console.log(`  Description: ${item.description.slice(0, 200)}...`);
      });
      console.log('='.repeat(80));
    }

    if (insights.indexAssets && insights.indexAssets.length > 0) {
      console.log('\n\n📊 INDEX ASSETS DETAILS:');
      console.log('='.repeat(80));
      insights.indexAssets.forEach((asset, idx) => {
        console.log(`\nAsset ${idx + 1}:`);
        console.log(`  Name: ${asset.name}`);
        console.log(`  Market Cap: $${asset.marketCap.toLocaleString()}`);
        console.log(`  Description: ${asset.description.slice(0, 200)}...`);
        console.log(`  Significance: ${asset.significance.slice(0, 200)}...`);
      });
      console.log('='.repeat(80));
    }

    console.log('\n\n✅ Example Report Generated Successfully!');
    console.log('\n💡 This demonstrates the complete Market Pulse format for art collectibles.');
    console.log('   The report includes:');
    console.log('   - Market overview with indices and percentages');
    console.log('   - Specific items with market caps');
    console.log('   - Index assets analysis');
    console.log('   - Future outlook on technology and demographics');

  } catch (error) {
    console.error('❌ Failed to generate example report:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run the demo
generateExampleReport().catch(console.error);







