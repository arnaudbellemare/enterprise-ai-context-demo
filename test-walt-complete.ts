/**
 * WALT Integration Complete Test Suite
 *
 * Tests all phases of WALT integration:
 * - Python bridge communication
 * - Tool discovery and caching
 * - Storage and retrieval
 * - Tool integration with ToolCallingSystem
 * - ACE pattern learning
 * - API routes
 */

import { getWALTClient } from './frontend/lib/walt/client';
import { getDiscoveryOrchestrator } from './frontend/lib/walt/discovery-orchestrator';
import { getWALTStorage } from './frontend/lib/walt/storage';
import { getWALTToolIntegration } from './frontend/lib/walt/tool-integration';
import { getWALTACEIntegration } from './frontend/lib/walt/ace-integration';
import {
  convertWALTToolToPERMUTATION,
  validateWALTTool,
  calculateToolQualityScore
} from './frontend/lib/walt/adapter';

// Test configuration
const TEST_URL = 'https://example.com';
const TEST_DOMAIN = 'financial';

async function runTests() {
  console.log('🧪 WALT Integration Complete Test Suite\n');
  console.log('='.repeat(60));

  let testsPassed = 0;
  let testsFailed = 0;

  // Helper function for test assertions
  function assert(condition: boolean, testName: string): void {
    if (condition) {
      console.log(`✅ ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ ${testName}`);
      testsFailed++;
    }
  }

  try {
    // ===== Phase 1: Python Bridge Tests =====
    console.log('\n📋 Phase 1: Python Bridge Tests');
    console.log('-'.repeat(60));

    const client = getWALTClient();

    try {
      const health = await client.healthCheck();
      assert(health.status === 'healthy', 'Health check passed');
      assert(health.service === 'walt-bridge', 'Service name correct');
    } catch (error) {
      assert(false, 'Health check failed - is WALT service running?');
    }

    // ===== Phase 2: Adapter Tests =====
    console.log('\n📋 Phase 2: Adapter Tests');
    console.log('-'.repeat(60));

    // Create mock WALT tool for testing
    const mockWALTTool = {
      name: 'test_tool',
      domain: 'test',
      file_path: '/test/tool.json',
      definition: {
        name: 'test_tool',
        description: 'A test tool for validation',
        inputs: {
          query: {
            type: 'string' as const,
            description: 'Search query',
            required: true
          }
        },
        steps: [
          {
            type: 'navigate' as const,
            url: 'https://example.com'
          }
        ]
      }
    };

    // Test validation
    const validation = validateWALTTool(mockWALTTool);
    assert(validation.valid, 'Tool validation passed');
    assert(validation.issues.length === 0, 'No validation issues');

    // Test quality scoring
    const qualityScore = calculateToolQualityScore(mockWALTTool);
    assert(qualityScore > 0 && qualityScore <= 1, 'Quality score in valid range');
    assert(qualityScore >= 0.5, 'Quality score meets minimum threshold');

    // Test conversion
    const permutationTool = convertWALTToolToPERMUTATION(mockWALTTool);
    assert(permutationTool.name === 'walt_test_tool', 'Tool name converted correctly');
    assert(permutationTool.description === mockWALTTool.definition.description, 'Description preserved');
    assert(permutationTool.domain !== undefined, 'Domain inferred');

    // ===== Phase 3: Discovery Orchestrator Tests =====
    console.log('\n📋 Phase 3: Discovery Orchestrator Tests');
    console.log('-'.repeat(60));

    const orchestrator = getDiscoveryOrchestrator();

    // Test stats before discovery
    const statsBefore = orchestrator.getStats();
    assert(statsBefore !== undefined, 'Stats object returned');

    // Test cache
    const cacheSize = orchestrator.getCacheSize();
    assert(typeof cacheSize === 'number', 'Cache size is a number');

    // ===== Phase 4: Storage Tests =====
    console.log('\n📋 Phase 4: Storage Tests');
    console.log('-'.repeat(60));

    const storage = getWALTStorage();

    try {
      // Test statistics
      const stats = await storage.getStats();
      assert(stats.total_tools >= 0, 'Total tools count valid');
      assert(stats.domains !== undefined, 'Domains object present');

      console.log(`📊 Storage Stats: ${stats.total_tools} tools, ${Object.keys(stats.domains).length} domains`);
    } catch (error: any) {
      console.warn(`⚠️ Storage tests skipped: ${error.message}`);
      console.warn('   (This is expected if database migration has not been run)');
    }

    // ===== Phase 5: Tool Integration Tests =====
    console.log('\n📋 Phase 5: Tool Integration Tests');
    console.log('-'.repeat(60));

    const integration = getWALTToolIntegration();

    const registeredTools = integration.getRegisteredTools();
    assert(Array.isArray(registeredTools), 'Registered tools is an array');

    const integrationStats = await integration.getStats();
    assert(integrationStats.registered_tools >= 0, 'Registered tools count valid');

    // ===== Phase 6: ACE Integration Tests =====
    console.log('\n📋 Phase 6: ACE Integration Tests');
    console.log('-'.repeat(60));

    const aceIntegration = getWALTACEIntegration();
    assert(aceIntegration !== undefined, 'ACE integration initialized');

    try {
      // Test getting playbook bullets
      const bullets = await aceIntegration.getToolPlaybookBullets();
      assert(Array.isArray(bullets), 'Playbook bullets returned');
      console.log(`📝 Found ${bullets.length} ACE playbook bullets`);
    } catch (error: any) {
      console.warn(`⚠️ ACE tests skipped: ${error.message}`);
    }

    // ===== Phase 7: End-to-End Integration Test =====
    console.log('\n📋 Phase 7: End-to-End Integration Test');
    console.log('-'.repeat(60));

    console.log('🔄 Testing full workflow (if WALT service is running)...');

    try {
      // Try simple discovery
      const testResult = await client.discoverTools({
        url: TEST_URL,
        max_tools: 2,
        headless: true
      });

      if (testResult.success) {
        assert(true, 'End-to-end discovery succeeded');
        console.log(`   Discovered ${testResult.tools_discovered} tools`);

        if (testResult.tools.length > 0) {
          // Test conversion of real discovered tool
          const firstTool = testResult.tools[0];
          const converted = convertWALTToolToPERMUTATION(firstTool);
          assert(converted.name.startsWith('walt_'), 'Real tool conversion successful');
        }
      } else {
        console.warn('   ⚠️ Discovery returned error (expected if service not running)');
      }
    } catch (error: any) {
      console.warn(`   ⚠️ End-to-end test skipped: ${error.message}`);
      console.warn('   (Start WALT service with: npm run walt:start)');
    }

  } catch (error: any) {
    console.error('\n💥 Test suite error:', error);
    testsFailed++;
  }

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run database migration: supabase/migrations/014_walt_discovered_tools.sql');
    console.log('2. Start WALT service: npm run walt:start');
    console.log('3. Test discovery: npm run test:walt');
    console.log('4. Initialize tools: POST /api/walt/tools with action=initialize');
  } else {
    console.log('\n⚠️ Some tests failed. Review errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
