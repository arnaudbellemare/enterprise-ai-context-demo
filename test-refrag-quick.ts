/**
 * Quick REFRAG Vector-Passing Test
 * Tests key functionality without requiring server
 */

import { VectorPassingLLM } from './frontend/lib/vector-passing-llm';
import { REFRAGBenchmark } from './frontend/lib/refrag-benchmark';
import { embeddingService } from './frontend/lib/embedding-service';

async function quickTest() {
  console.log('🧪 Quick REFRAG Vector-Passing Test\n');

  let passed = 0;
  let failed = 0;

  // Test 1: VectorPassingLLM with both providers
  console.log('1️⃣ Testing VectorPassingLLM instantiation...');
  try {
    const perplexityLLM = new VectorPassingLLM({
      provider: 'perplexity',
      model: 'sonar-pro'
    });
    console.log('   ✅ Perplexity LLM: sonar-pro');

    const ollamaLLM = new VectorPassingLLM({
      provider: 'ollama',
      model: 'gemma3:4b'
    });
    console.log('   ✅ Ollama LLM: gemma3:4b');
    passed++;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 2: REFRAGBenchmark
  console.log('\n2️⃣ Testing REFRAGBenchmark...');
  try {
    const benchmark = new REFRAGBenchmark();
    const tests = benchmark.getTests();
    console.log(`   ✅ Benchmark initialized with ${tests.length} tests`);
    passed++;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 3: Real embedding generation
  console.log('\n3️⃣ Testing real embedding generation...');
  try {
    const testText = 'Vector-passing in RAG systems';
    const result = await embeddingService.generate(testText);
    console.log(`   ✅ Generated embedding: ${result.embedding.length} dimensions`);
    console.log(`   ✅ Provider: ${result.provider}`);
    passed++;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Test 4: Benchmark with real embeddings
  console.log('\n4️⃣ Testing benchmark with real embeddings...');
  try {
    const benchmark = new REFRAGBenchmark();
    const tests = benchmark.getTests();
    const firstTest = tests[0];
    
    // This will generate real embeddings at runtime
    const testWithEmbeddings = await (benchmark as any).ensureEmbeddings(firstTest);
    
    console.log(`   ✅ Test has ${testWithEmbeddings.chunks.length} chunks`);
    const hasEmbeddings = testWithEmbeddings.chunks.every((c: any) => 
      c.embedding && c.embedding.length > 0
    );
    console.log(`   ✅ All chunks have embeddings: ${hasEmbeddings}`);
    if (hasEmbeddings) passed++;
    else failed++;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Test API: npx tsx test-refrag-vector-passing.ts');
    console.log('   3. Or manually: curl http://localhost:3000/api/refrag/vector-passing');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }
}

quickTest().catch(console.error);

