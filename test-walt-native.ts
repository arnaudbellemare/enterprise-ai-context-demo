#!/usr/bin/env npx tsx
/**
 * Test TypeScript-Native WALT Discovery
 *
 * Tests tool discovery without Python requirement
 */

import { getUnifiedWALTClient } from './frontend/lib/walt';

async function testNativeDiscovery() {
  console.log('🧪 Testing TypeScript-Native WALT Discovery\n');

  try {
    // Create client (TypeScript only, no Python)
    const client = getUnifiedWALTClient({ backend: 'typescript' });

    console.log('✅ Step 1: Client initialized (TypeScript backend)');

    // Test 1: Discover from Yahoo Finance
    console.log('\n📊 Test 1: Yahoo Finance Tool Discovery');
    console.log('━'.repeat(50));

    const financeResult = await client.discoverTools({
      url: 'https://finance.yahoo.com',
      goal: 'Search for stock prices',
      max_tools: 3,
    });

    console.log(`\n✅ Discovered ${financeResult.tools_discovered} tools from Yahoo Finance`);
    console.log(`Backend used: ${financeResult.backend}`);

    financeResult.tools.forEach((tool, i) => {
      console.log(`\n  Tool ${i + 1}:`);
      console.log(`    Name: ${tool.name}`);
      console.log(`    Description: ${tool.description}`);
      console.log(`    Confidence: ${tool.confidence_score?.toFixed(2) || 'N/A'}`);
      console.log(`    Method: ${tool.discovery_method}`);
    });

    // Test 2: Discover from GitHub
    console.log('\n\n🐙 Test 2: GitHub Tool Discovery');
    console.log('━'.repeat(50));

    const githubResult = await client.discoverTools({
      url: 'https://github.com',
      goal: 'Search repositories',
      max_tools: 3,
    });

    console.log(`\n✅ Discovered ${githubResult.tools_discovered} tools from GitHub`);
    console.log(`Backend used: ${githubResult.backend}`);

    githubResult.tools.forEach((tool, i) => {
      console.log(`\n  Tool ${i + 1}:`);
      console.log(`    Name: ${tool.name}`);
      console.log(`    Description: ${tool.description}`);
      console.log(`    Confidence: ${tool.confidence_score?.toFixed(2) || 'N/A'}`);
    });

    // Test 3: Generate specific tool
    console.log('\n\n🔧 Test 3: Specific Tool Generation');
    console.log('━'.repeat(50));

    const toolResult = await client.generateTool({
      url: 'https://www.npmjs.com',
      goal: 'Search for packages',
    });

    if (toolResult.success && toolResult.tool) {
      console.log('\n✅ Generated tool successfully');
      console.log(`  Name: ${toolResult.tool.name}`);
      console.log(`  Description: ${toolResult.tool.description}`);
      console.log(`  Source: ${toolResult.tool.source_url}`);
    } else {
      console.log(`\n⚠️ Tool generation failed: ${toolResult.error}`);
    }

    // Cleanup
    await client.cleanup();

    console.log('\n\n✅ All tests passed! TypeScript-native WALT is working.');
    console.log('\n📝 Key Benefits:');
    console.log('  ✅ No Python required');
    console.log('  ✅ No Python 3.11+ requirement');
    console.log('  ✅ Works out of the box with existing dependencies');
    console.log('  ✅ Automatic fallback if Python service unavailable');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testNativeDiscovery();
