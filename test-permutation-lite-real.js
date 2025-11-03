/**
 * REAL Test: PERMUTATION Lite with Art Insurance Query
 * 
 * Actually executes PERMUTATION Lite and shows real results
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function testPermutationLite(query, domain) {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 REAL TEST: PERMUTATION Lite');
  console.log('='.repeat(80));
  console.log(`Query: ${query}`);
  console.log(`Domain: ${domain || 'auto-detect'}`);
  console.log('='.repeat(80) + '\n');

  // Check if server is running (just verify it responds, ignore auth errors)
  try {
    const healthCheck = await fetch(`${API_BASE}/api/permutation-lite`, { method: 'GET' });
    // Server is running if we get ANY response (even 405 or 401)
    if (!healthCheck.ok && healthCheck.status !== 405 && healthCheck.status !== 401) {
      // Only fail on connection errors, not auth errors
      if (healthCheck.status >= 500 || healthCheck.status === 0) {
        throw new Error('Server not responding');
      }
    }
  } catch (error) {
    // If it's a network error (server not running), show help
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('❌ Server not running or not accessible!');
      console.error(`   Trying to reach: ${API_BASE}/api/permutation-lite`);
      console.error('\n💡 To run this test:');
      console.error('   1. Start the dev server: npm run dev');
      console.error('   2. Wait for server to be ready');
      console.error('   3. Run this test again\n');
      throw new Error('Server not running. Start with: npm run dev');
    }
    // Otherwise, server is running, just continue
  }

  try {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/permutation-lite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        domain,
        config: {
          enableTeacherStudent: true, // Enable Teacher-Student for this test
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    console.log('\n✅ PERMUTATION Lite Response:\n');
    console.log('─'.repeat(80));
    console.log('ANSWER:');
    console.log('─'.repeat(80));
    console.log(result.result?.answer || result.answer || 'No answer in response');
    console.log('\n' + '─'.repeat(80));
    console.log('METADATA:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(result.result?.metadata || result.metadata || {}, null, 2));
    console.log('\n' + '─'.repeat(80));
    console.log('PERFORMANCE:');
    console.log('─'.repeat(80));
    console.log(`Total Time: ${duration}ms`);
    console.log(`Quality Score: ${result.result?.metadata?.quality_score?.toFixed(3) || 'N/A'}`);
    console.log(`Layers Executed: ${result.result?.metadata?.layers_executed?.join(' → ') || 'N/A'}`);
    console.log(`Cost: $${result.result?.metadata?.performance?.cost?.toFixed(4) || '0.0000'}`);
    
    return result;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

async function main() {
  const query = process.argv[2] || "What should the insurance premium be for a 1925 Art Deco Cartier platinum bracelet valued at $85,000?";
  const domain = process.argv[3] || 'art';

  console.log('🚀 Starting REAL PERMUTATION Lite Test...\n');
  
  try {
    const result = await testPermutationLite(query, domain);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('\nFull response saved to: permutation-lite-test-result.json');
    
    // Save full result to file
    const fs = require('fs');
    fs.writeFileSync('permutation-lite-test-result.json', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testPermutationLite };

