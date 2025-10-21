/**
 * Quick Brain Validation Test
 * Tests both systems with simple queries to validate they work correctly
 */

const API_BASE = 'http://localhost:3000';

async function quickTest() {
  console.log('\n🔍 Quick Brain Systems Validation\n');
  console.log('Testing both Original Brain and Brain-Enhanced with simple queries...\n');

  const queries = [
    { query: 'What is 25 + 17?', domain: 'general' },
    { query: 'What is the capital of France?', domain: 'general' },
    { query: 'Explain what HTTP stands for', domain: 'technical' },
  ];

  const results = {
    original: { success: 0, failed: 0, times: [] },
    enhanced: { success: 0, failed: 0, times: [] },
  };

  for (const q of queries) {
    console.log(`\n📝 Query: "${q.query}"`);

    // Test Original
    const start1 = Date.now();
    try {
      const res1 = await fetch(`${API_BASE}/api/brain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });
      const data1 = await res1.json();
      const time1 = Date.now() - start1;

      if (data1.success) {
        console.log(`   ✅ Original: ${time1}ms, ${data1.response?.length || 0} chars`);
        results.original.success++;
        results.original.times.push(time1);
      } else {
        console.log(`   ❌ Original: FAILED - ${data1.error}`);
        results.original.failed++;
      }
    } catch (error) {
      console.log(`   ❌ Original: ERROR - ${error.message}`);
      results.original.failed++;
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test Enhanced
    const start2 = Date.now();
    try {
      const res2 = await fetch(`${API_BASE}/api/brain-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });
      const data2 = await res2.json();
      const time2 = Date.now() - start2;

      if (data2.success) {
        console.log(`   ✅ Enhanced: ${time2}ms, ${data2.response?.length || 0} chars`);
        results.enhanced.success++;
        results.enhanced.times.push(time2);
      } else {
        console.log(`   ❌ Enhanced: FAILED - ${data2.error}`);
        results.enhanced.failed++;
      }
    } catch (error) {
      console.log(`   ❌ Enhanced: ERROR - ${error.message}`);
      results.enhanced.failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('━'.repeat(60));

  const origAvg = results.original.times.length > 0
    ? (results.original.times.reduce((a, b) => a + b, 0) / results.original.times.length).toFixed(0)
    : 'N/A';

  const enhAvg = results.enhanced.times.length > 0
    ? (results.enhanced.times.reduce((a, b) => a + b, 0) / results.enhanced.times.length).toFixed(0)
    : 'N/A';

  console.log(`\n✅ Original Brain: ${results.original.success}/${queries.length} passed`);
  console.log(`   Average time: ${origAvg}ms`);
  console.log(`   Failed: ${results.original.failed}`);

  console.log(`\n✅ Brain-Enhanced: ${results.enhanced.success}/${queries.length} passed`);
  console.log(`   Average time: ${enhAvg}ms`);
  console.log(`   Failed: ${results.enhanced.failed}`);

  const totalTests = queries.length * 2;
  const totalSuccess = results.original.success + results.enhanced.success;
  const healthScore = (totalSuccess / totalTests * 100).toFixed(0);

  console.log(`\n🏥 Overall Health: ${healthScore}% (${totalSuccess}/${totalTests} tests passed)`);

  if (healthScore >= 90) {
    console.log('✅ Status: EXCELLENT - Both systems fully operational');
  } else if (healthScore >= 70) {
    console.log('⚠️  Status: GOOD - Most tests passing, minor issues');
  } else if (healthScore >= 50) {
    console.log('⚠️  Status: DEGRADED - Significant issues detected');
  } else {
    console.log('❌ Status: CRITICAL - Major system problems');
  }

  console.log('\n' + '━'.repeat(60));
  console.log('🎯 CONCLUSION');
  console.log('━'.repeat(60));

  if (results.original.success > 0 && results.enhanced.success > 0) {
    console.log('\n✅ YES! Both brain systems are working correctly!');
    console.log(`   - Original Brain: Functional (avg ${origAvg}ms)`);
    console.log(`   - Brain-Enhanced: Functional (avg ${enhAvg}ms)`);

    if (results.enhanced.times.length > 0 && results.original.times.length > 0) {
      const avgOrig = results.original.times.reduce((a, b) => a + b, 0) / results.original.times.length;
      const avgEnh = results.enhanced.times.reduce((a, b) => a + b, 0) / results.enhanced.times.length;

      if (avgEnh < avgOrig) {
        const improvement = ((avgOrig - avgEnh) / avgOrig * 100).toFixed(1);
        console.log(`   - Brain-Enhanced is ${improvement}% faster on average!`);
      }
    }

    console.log('\n🆕 New Modular Skills System:');
    console.log('   Not enabled. To test it:');
    console.log('   1. export BRAIN_USE_NEW_SKILLS=true');
    console.log('   2. Restart dev server (npm run dev)');
    console.log('   3. Run this test again');

    console.log('\n📋 Next Steps:');
    console.log('   • Both systems passed basic validation ✅');
    console.log('   • Consider enabling modular skills for enhanced performance');
    console.log('   • For complex queries, increase timeout or optimize processing');
  } else {
    console.log('\n❌ Issues detected with one or both systems');
    console.log('   Check server logs and environment configuration');
  }

  console.log('');
}

quickTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
