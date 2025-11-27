/**
 * Simple Demo: Show Raw Market Insights Output
 * 
 * Shows the raw output from PERMUTATION_LITE without complex parsing
 */

import { PermutationLiteGAMPPipeline } from './frontend/lib/permutation-lite/permutation-lite-gamp-pipeline';

async function showRawOutput() {
  console.log('📊 Generating Market Pulse Report for Sports Memorabilia\n');
  console.log('='.repeat(80));
  
  try {
    const pipeline = new PermutationLiteGAMPPipeline({
      enableOptimization: true,
      enableLearning: true,
      enableTeacherStudent: true,
      fastMode: false,
    });

    const query = `Generate a comprehensive Market Pulse report for the art collectibles market, specifically focusing on sports memorabilia and collectibles. This report should cover market activity from the past week and provide deep insights into the collectibles investment landscape.

The report must follow this EXACT professional Market Pulse format:

MARKET OVERVIEW SECTION:
Start with a headline in the exact format: "Market Pulse: Sports Memorabilia [Brief Market Status]"
For example: "Market Pulse: Fractional Sports Memorabilia Faces Headwinds"

The market overview should include:
- Specific market indices and their performance (e.g., "Pricing Culture Securitized Sports Memorabilia Index reflects broader market challenges")
- Exact percentage changes: weekly gain, monthly uptick, annual decline (e.g., "4.04% weekly gain and 2.48% monthly uptick offset by a 3.67% annual decline")
- Market projections with specific numbers (e.g., "from $33.6 billion in 2024 to $271.2 billion by 2034, representing an extraordinary 22.1% compound annual growth rate")
- Market challenges and headwinds (liquidity constraints, valuation disconnects, fractional platform pricing)
- Industry-wide trends and correlations with other asset classes (art, wine, luxury watches since 2022 peaks)
- High-net-worth allocation trends (e.g., "rising from 15% to 20% in 2025")
- Market resilience indicators and growth potential

SPECIFIC ITEMS SECTION:
Highlight 3 notable collectible items with detailed analysis:
- Item name as a subheading (e.g., "60 Mickey Mantle Game-Worn Jersey (Signed)")
- Market capitalization in exact dollar amounts (e.g., "$626,875 market cap")
- Detailed description of the item's significance and market position
- Current trend analysis (leading the index, market positioning)
- Comparative analysis with similar assets (e.g., "Jordan memorabilia continues to lag behind his sports cards, which have appreciated 8x to 10x")
- Authentication and provenance details if relevant

INDEX ASSETS SECTION:
Title: "Index Assets: Icons and Emerging Opportunities"
Analyze key index assets and market composition:
- Asset name as subheading with market cap (e.g., "96 Michael Jordan Playoff-Worn Air Jordan 11s 'Bred' leads with a $[amount] market capitalization")
- Detailed description of each asset's significance
- Market positioning and dominance patterns (e.g., "Michael Jordan memorabilia, with multiple Jordan-related assets commanding premium valuations")
- Authentication technology impact (e.g., "photomatching capabilities", "MEARS A10 authentication")
- Portfolio construction principles and diversity
- Emerging categories (e.g., "ticket stubs represent an emerging collectibles category with extraordinary scarcity potential")
- Cross-cultural appeal and collector demographics

FUTURE OUTLOOK SECTION:
Title: "Future Outlook: Transformation Through Technology and Demographics"
Provide forward-looking analysis covering:
- Market inflection points and transformation drivers
- Technological innovations (AI-driven authentication, blockchain verification, live commerce platforms)
- Demographic shifts (e.g., "Younger collectors, particularly Gen Z and millennials who represent 94% of emerging collectors")
- Generational preferences and cultural relevance
- Institutional validation (family offices, alternative asset platforms, capital allocation)
- Market maturation indicators (sophisticated pricing mechanisms, liquidity options, industry consolidation)
- Market bifurcation trends (premium authenticated assets vs. commodity-level collectibles)
- Record-breaking sales examples with exact amounts (e.g., "Babe Ruth's $24.1 million jersey", "Michael Jordan's $10.1 million game-worn uniform")
- Authentication services growth projections (e.g., "8.3% annual growth through 2033")
- Evolution from hobby-driven sector to legitimate alternative asset class
- Investment strategy implications and portfolio diversification objectives

CRITICAL REQUIREMENTS:
- Include specific numbers, percentages, dollar amounts, and market data throughout
- Cite market indices, sales records, auction house results (Sotheby's, Christie's, Heritage, Bonhams, Phillips)
- Reference specific collectible items with exact names and valuations
- Use professional, analytical tone suitable for investors, collectors, and financial professionals
- Match the detailed, data-rich style of the example Market Pulse report provided
- Include footnotes-style citations with numbered references (e.g., "1 2" for sources)
- Ensure the report reads like a professional financial market analysis for collectibles
- Focus on art collectibles market dynamics, investment trends, and market structure`;

    console.log('⏳ Generating report... This may take 30-60 seconds...\n');
    
    const result = await pipeline.execute(query, 'financial');
    
    console.log('\n' + '='.repeat(80));
    console.log('📄 FULL MARKET PULSE REPORT OUTPUT:');
    console.log('='.repeat(80));
    console.log('\n' + result.answer);
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Report generated successfully!');
    console.log(`\n📊 Report length: ${result.answer.length} characters`);
    console.log(`⏱️  Processing time: ${result.metadata.performance.total_time_ms}ms`);
    console.log(`💰 Cost: $${result.metadata.performance.cost.toFixed(4)}`);
    
  } catch (error) {
    console.error('\n❌ Error generating report:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run the demo
showRawOutput().catch(console.error);







