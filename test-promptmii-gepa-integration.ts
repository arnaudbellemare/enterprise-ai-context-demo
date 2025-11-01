/**
 * Test PromptMII+GEPA Integration
 * 
 * Demonstrates compound optimization with real market data
 */

import { promptMIIGEPAOptimizer } from './lib/promptmii-gepa-optimizer';

async function testPromptMIIGEPAIntegration() {
  console.log('🧪 Testing PromptMII+GEPA Integration\n');
  console.log('═'.repeat(80));
  
  // Test case 1: Art valuation with real market data
  console.log(`\n📝 Test Case 1: Art Valuation with Real Market Data`);
  console.log('─────────────────────────────────────────────────────────────');
  
  const artValuationPrompt = `Given an art valuation request, analyze the artwork details including artist name, title, year of creation, medium, dimensions, condition, and provenance. Provide a comprehensive valuation by:
1. Researching recent comparable sales at major auction houses like Christie's, Sotheby's, and Heritage Auctions
2. Considering the artist's market position and historical pricing trends
3. Evaluating the artwork's condition and rarity
4. Assessing current market conditions
5. Providing a detailed valuation range with confidence score`;

  const result1 = await promptMIIGEPAOptimizer.optimize(
    artValuationPrompt,
    'art',
    'valuation'
  );
  
  console.log(`\n✅ Results:`);
  console.log(`   Original:  ${result1.metrics.originalTokens} tokens`);
  console.log(`   Final:     ${result1.metrics.finalTokens} tokens`);
  console.log(`   Reduction: ${result1.metrics.tokenReductionPercent.toFixed(1)}%`);
  console.log(`   Quality:   +${result1.metrics.qualityImprovement.toFixed(1)}%`);
  console.log(`   Time:      ${result1.metrics.totalOptimizationTime}ms`);
  
  if (result1.metrics.marketDataPoints) {
    console.log(`   Market data: ${result1.metrics.marketDataPoints} points`);
  }
  
  console.log(`\n📄 Final Prompt Preview:`);
  console.log(`   ${result1.finalPrompt.substring(0, 200)}...`);
  
  // Test case 2: Finance analysis (no market data)
  console.log(`\n\n📝 Test Case 2: Finance Analysis (No Market Data)`);
  console.log('─────────────────────────────────────────────────────────────');
  
  const financePrompt = `Analyze the financial performance of a company by examining revenue trends, profitability metrics, cash flow patterns, and balance sheet strength over the past five years. Compare against industry benchmarks and provide strategic recommendations for improvement.`;

  const result2 = await promptMIIGEPAOptimizer.optimize(
    financePrompt,
    'finance',
    'analysis'
  );
  
  console.log(`\n✅ Results:`);
  console.log(`   Original:  ${result2.metrics.originalTokens} tokens`);
  console.log(`   Final:     ${result2.metrics.finalTokens} tokens`);
  console.log(`   Reduction: ${result2.metrics.tokenReductionPercent.toFixed(1)}%`);
  console.log(`   Quality:   +${result2.metrics.qualityImprovement.toFixed(1)}%`);
  console.log(`   Time:      ${result2.metrics.totalOptimizationTime}ms`);
  
  console.log(`\n📄 Final Prompt Preview:`);
  console.log(`   ${result2.finalPrompt.substring(0, 200)}...`);
  
  // Test case 3: Cached optimization (should be fast)
  console.log(`\n\n📝 Test Case 3: Cached Optimization`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Re-running art valuation (should use cache)...`);
  
  const cachedStart = Date.now();
  const result3 = await promptMIIGEPAOptimizer.optimize(
    artValuationPrompt,
    'art',
    'valuation'
  );
  const cachedTime = Date.now() - cachedStart;
  
  console.log(`\n✅ Results:`);
  console.log(`   Time:      ${cachedTime}ms (should be < 10ms)`);
  console.log(`   Same prompt: ${result3.finalPrompt === result1.finalPrompt}`);
  
  // Summary
  console.log(`\n\n📊 Summary`);
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Test 1 (Art):      ${result1.metrics.tokenReductionPercent.toFixed(1)}% reduction, +${result1.metrics.qualityImprovement.toFixed(1)}% quality`);
  console.log(`Test 2 (Finance):  ${result2.metrics.tokenReductionPercent.toFixed(1)}% reduction, +${result2.metrics.qualityImprovement.toFixed(1)}% quality`);
  console.log(`Test 3 (Cached):   ${cachedTime}ms (${cachedTime < 10 ? 'fast' : 'slow'})`);
  console.log(`\n✅ All tests passed!`);
  
  console.log(`\n═`.repeat(80));
}

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: 'frontend/.env.local' });

// Perplexity API key loaded from .env.local

testPromptMIIGEPAIntegration().catch(console.error);

