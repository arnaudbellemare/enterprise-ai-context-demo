/**
 * Test REFRAG Vector-Passing Implementation
 * 
 * Tests the vector-passing API endpoints
 */

async function testVectorPassingAPI() {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing REFRAG Vector-Passing Implementation\n');
  console.log(`Base URL: ${baseUrl}\n`);

  // Test 1: Check if endpoints exist
  console.log('1️⃣ Testing GET /api/refrag/vector-passing (endpoint info)');
  try {
    const infoResponse = await fetch(`${baseUrl}/api/refrag/vector-passing`);
    const infoData = await infoResponse.json();
    console.log('✅ Endpoint info retrieved');
    console.log(`   - Perplexity available: ${infoData.providers?.perplexity?.available || false}`);
    console.log(`   - Description: ${infoData.description}\n`);
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Test 2: Test vector-passing with Perplexity (if available)
  console.log('2️⃣ Testing POST /api/refrag/vector-passing (Perplexity)');
  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/refrag/vector-passing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is vector-passing in RAG systems?',
        provider: 'perplexity'
      }),
    });
    
    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    if (data.success) {
      console.log('✅ Vector-passing request succeeded');
      console.log(`   - Provider: ${data.provider}`);
      console.log(`   - Method: ${data.metrics?.method || 'unknown'}`);
      console.log(`   - TTFT: ${data.metrics?.ttft_ms || 'N/A'}ms`);
      console.log(`   - Total time: ${data.metrics?.totalTime_ms || elapsed}ms`);
      console.log(`   - Throughput improvement: ${data.metrics?.throughput_improvement || 'N/A'}x`);
      console.log(`   - Response length: ${data.response?.length || 0} chars\n`);
    } else {
      console.log(`❌ Request failed: ${data.error || 'Unknown error'}\n`);
    }
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Test 3: Test benchmark endpoint info
  console.log('3️⃣ Testing GET /api/refrag/benchmark (test info)');
  try {
    const benchmarkInfoResponse = await fetch(`${baseUrl}/api/refrag/benchmark`);
    const benchmarkInfo = await benchmarkInfoResponse.json();
    console.log('✅ Benchmark info retrieved');
    console.log(`   - Test count: ${benchmarkInfo.tests?.length || 0}`);
    console.log(`   - Perplexity available: ${benchmarkInfo.available?.perplexity || false}\n`);
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Test 4: Test single benchmark (if Perplexity available)
  console.log('4️⃣ Testing POST /api/refrag/benchmark (single test)');
  try {
    const startTime = Date.now();
    const benchmarkResponse = await fetch(`${baseUrl}/api/refrag/benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'perplexity',
        testIndex: 0 // First test
      }),
    });
    
    const benchmarkData = await benchmarkResponse.json();
    const elapsed = Date.now() - startTime;
    
    if (benchmarkData.success) {
      console.log('✅ Benchmark completed');
      console.log(`   - Provider: ${benchmarkData.provider}`);
      console.log(`   - Test query: ${benchmarkData.results?.[0]?.query?.substring(0, 50) || 'N/A'}...`);
      if (benchmarkData.results?.[0]?.comparison) {
        const comp = benchmarkData.results[0].comparison;
        console.log(`   - TTFT speedup: ${comp.ttft_speedup || 'N/A'}`);
        console.log(`   - Throughput speedup: ${comp.throughput_speedup || 'N/A'}`);
      }
      console.log(`   - Total time: ${elapsed}ms\n`);
    } else {
      console.log(`❌ Benchmark failed: ${benchmarkData.error || 'Unknown error'}\n`);
    }
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  console.log('✅ All tests completed');
}

// Run tests
if (require.main === module) {
  testVectorPassingAPI().catch(console.error);
}

export { testVectorPassingAPI };

