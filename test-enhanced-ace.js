#!/usr/bin/env node

/**
 * Test script for Enhanced ACE Framework
 * Tests the Generator-Reflector-Curator pattern
 */

const BASE_URL = 'http://localhost:3003';

async function testEnhancedACE() {
  console.log('🚀 Testing Enhanced ACE Framework...\n');

  const testQueries = [
    {
      query: "How can I optimize database performance for a high-traffic e-commerce site?",
      domain: "technology"
    },
    {
      query: "What are the best investment strategies for a 25-year-old with $10,000?",
      domain: "financial"
    },
    {
      query: "How do I structure a real estate investment portfolio?",
      domain: "real_estate"
    }
  ];

  for (const test of testQueries) {
    console.log(`\n📝 Testing: "${test.query}"`);
    console.log(`🏷️  Domain: ${test.domain}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/ace/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Success!');
      console.log(`📊 Insights Generated: ${result.result.metadata.insights_generated}`);
      console.log(`🎯 Bullets Curated: ${result.result.metadata.bullets_curated}`);
      console.log(`🔄 Duplicates Found: ${result.result.metadata.duplicates_found}`);
      console.log(`📚 Playbook Updated: ${result.result.metadata.playbook_updated}`);
      console.log(`⏱️  Duration: ${result.result.metadata.duration_ms}ms`);
      
      if (result.result.insights && result.result.insights.length > 0) {
        console.log('\n💡 Generated Insights:');
        result.result.insights.forEach((insight, i) => {
          console.log(`   ${i + 1}. [${insight.insight_type.toUpperCase()}] ${insight.insight_text}`);
        });
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  // Test getting insights
  console.log('\n\n🔍 Testing Insights Retrieval...');
  try {
    const response = await fetch(`${BASE_URL}/api/ace/enhanced?action=insights`);
    const result = await response.json();
    console.log(`✅ Retrieved ${result.insights.length} insights`);
  } catch (error) {
    console.error('❌ Error getting insights:', error.message);
  }

  // Test getting playbook stats
  console.log('\n📊 Testing Playbook Statistics...');
  try {
    const response = await fetch(`${BASE_URL}/api/ace/enhanced?action=stats`);
    const result = await response.json();
    console.log('✅ Playbook Stats:', result.data.playbook_stats);
  } catch (error) {
    console.error('❌ Error getting stats:', error.message);
  }

  // Test optimization status
  console.log('\n⚙️  Testing Optimization System Status...');
  try {
    const response = await fetch(`${BASE_URL}/api/optimization/status`);
    const result = await response.json();
    console.log('✅ Optimization System Status:');
    console.log(`   Smart Router: ${result.data.smartRouter.status}`);
    console.log(`   Advanced Cache: ${result.data.advancedCache.status}`);
    console.log(`   Parallel Engine: ${result.data.parallelEngine.status}`);
    console.log(`   Benchmark System: ${result.data.benchmarkSystem.status}`);
  } catch (error) {
    console.error('❌ Error getting optimization status:', error.message);
  }

  console.log('\n🎉 Enhanced ACE Framework testing complete!');
}

// Run the test
testEnhancedACE().catch(console.error);
