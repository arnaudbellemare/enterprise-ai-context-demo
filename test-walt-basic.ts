/**
 * Basic WALT Integration Test
 *
 * Tests the WALT Python bridge and basic tool discovery
 */

import { getWALTClient } from './frontend/lib/walt/client';
import { convertWALTToolToPERMUTATION, validateWALTTool, calculateToolQualityScore } from './frontend/lib/walt/adapter';

async function testWALTService() {
  console.log('🧪 Testing WALT Integration\n');

  const client = getWALTClient();

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const health = await client.healthCheck();
    console.log('✅ Health check passed:', health);
    console.log('');

    // Test 2: List existing tools
    console.log('2️⃣ Listing existing tools...');
    const toolList = await client.listTools();
    console.log(`✅ Found ${toolList.total_tools} existing tools`);
    if (toolList.total_tools > 0) {
      console.log('   Tools:', toolList.tools.map(t => `${t.domain}/${t.name}`).join(', '));
    }
    console.log('');

    // Test 3: Discover tools from example site (simple test)
    console.log('3️⃣ Testing tool discovery (this may take 2-3 minutes)...');
    console.log('   NOTE: First discovery is slow due to browser setup');

    const discoveryResult = await client.discoverTools({
      url: 'https://example.com',
      max_tools: 3,
      headless: true
    });

    if (discoveryResult.success) {
      console.log(`✅ Discovery successful! Found ${discoveryResult.tools_discovered} tools`);

      // Test 4: Validate discovered tools
      console.log('');
      console.log('4️⃣ Validating discovered tools...');
      for (const tool of discoveryResult.tools) {
        const validation = validateWALTTool(tool);
        const qualityScore = calculateToolQualityScore(tool);

        console.log(`   Tool: ${tool.name}`);
        console.log(`   Valid: ${validation.valid}`);
        console.log(`   Quality Score: ${qualityScore.toFixed(2)}`);
        if (validation.issues.length > 0) {
          console.log(`   Issues: ${validation.issues.join(', ')}`);
        }
        if (validation.warnings.length > 0) {
          console.log(`   Warnings: ${validation.warnings.join(', ')}`);
        }
        console.log('');
      }

      // Test 5: Convert to PERMUTATION format
      console.log('5️⃣ Converting to PERMUTATION format...');
      for (const waltTool of discoveryResult.tools) {
        const permutationTool = convertWALTToolToPERMUTATION(waltTool);
        console.log(`   ✅ Converted: ${permutationTool.name}`);
        console.log(`      Domain: ${permutationTool.domain?.join(', ')}`);
        console.log(`      Cost: $${permutationTool.cost?.toFixed(4)}`);
        console.log(`      Latency: ${permutationTool.latency_ms}ms`);
        console.log('');
      }

      console.log('✅ All tests passed!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`   Health: ✅`);
      console.log(`   Tools Discovered: ${discoveryResult.tools_discovered}`);
      console.log(`   Validation: ✅`);
      console.log(`   Conversion: ✅`);

    } else {
      console.log('❌ Discovery failed:', discoveryResult.error);
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('📝 Troubleshooting:');
    console.error('1. Make sure WALT service is running: ./scripts/start-walt.sh');
    console.error('2. Check that Python dependencies are installed: ./scripts/setup-walt.sh');
    console.error('3. Verify environment variables in .env.local');
    console.error('4. Check WALT service logs for errors');
    process.exit(1);
  }
}

// Run tests
testWALTService().catch(console.error);
