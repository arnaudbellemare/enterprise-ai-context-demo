/**
 * Integration Tests for Vector Store Adapter
 *
 * Tests Supabase vector operations:
 * - Similarity search
 * - Hybrid search (semantic + keyword)
 * - Insert/delete operations
 * - RRF fusion
 */

import { createClient } from '@supabase/supabase-js';
import {
  SupabaseVectorAdapter,
  type Document
} from './frontend/lib/rag/vector-store-adapter';

// ============================================================================
// Setup
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adapter = new SupabaseVectorAdapter(supabase, 'documents');

// ============================================================================
// Test Data
// ============================================================================

const testDocuments: Document[] = [
  {
    id: 'test-doc-1',
    content: 'Q4 2024 revenue reached $3.9M, up 23% YoY driven by strong product adoption.',
    metadata: { domain: 'financial', year: 2024, quarter: 'Q4' }
  },
  {
    id: 'test-doc-2',
    content: 'Gross margin expanded to 68%, up from 64% in Q3 2024.',
    metadata: { domain: 'financial', year: 2024, quarter: 'Q4' }
  },
  {
    id: 'test-doc-3',
    content: 'New product line launched in Q4 with positive early reception from enterprise customers.',
    metadata: { domain: 'product', year: 2024, quarter: 'Q4' }
  },
  {
    id: 'test-doc-4',
    content: 'Customer acquisition cost decreased 18% through marketing optimization initiatives.',
    metadata: { domain: 'marketing', year: 2024 }
  },
  {
    id: 'test-doc-5',
    content: 'Retention rate improved to 94%, indicating strong product-market fit.',
    metadata: { domain: 'product', year: 2024 }
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

function assertGreaterThan(value: number, threshold: number, message: string) {
  if (value <= threshold) {
    throw new Error(`${message}: Expected > ${threshold}, got ${value}`);
  }
  console.log(`  ✅ ${message}: ${value} > ${threshold}`);
}

function assertEqual(value: any, expected: any, message: string) {
  if (value !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${value}`);
  }
  console.log(`  ✅ ${message}: ${value} === ${expected}`);
}

// ============================================================================
// Tests
// ============================================================================

async function testInsert() {
  console.log('\n🧪 Test 1: Insert Documents');

  // Clean up any existing test documents
  await adapter.delete(testDocuments.map(d => d.id)).catch(() => {});

  // Insert test documents
  await adapter.insert(testDocuments);

  // Verify collection info
  const info = await adapter.getCollectionInfo();
  console.log(`\n  📊 Collection Info:`);
  console.log(`    Name: ${info.name}`);
  console.log(`    Count: ${info.count}`);
  console.log(`    Dimension: ${info.dimension}`);

  assertGreaterThan(info.count, 0, 'Collection should have documents');
  assertEqual(info.dimension, 1536, 'Embedding dimension should be 1536');

  console.log('  ✅ Insert test passed');
}

async function testSimilaritySearch() {
  console.log('\n🧪 Test 2: Similarity Search');

  const query = "What was Q4 revenue?";
  const results = await adapter.similaritySearch(query, 3);

  console.log(`\n  📊 Results for "${query}":`);
  results.forEach((doc, i) => {
    console.log(`    [${i + 1}] Similarity: ${doc.similarity?.toFixed(3)}`);
    console.log(`        Content: ${doc.content.substring(0, 80)}...`);
    console.log(`        Metadata: ${JSON.stringify(doc.metadata)}`);
  });

  assertEqual(results.length, 3, 'Should return 3 results');
  assertGreaterThan(results[0].similarity!, 0.5, 'Top result should have high similarity');

  // Verify results are sorted by similarity
  for (let i = 0; i < results.length - 1; i++) {
    assertGreaterThan(
      results[i].similarity!,
      results[i + 1].similarity! - 0.01, // Allow small floating point error
      `Result ${i + 1} should have higher similarity than result ${i + 2}`
    );
  }

  console.log('  ✅ Similarity search test passed');
}

async function testMetadataFiltering() {
  console.log('\n🧪 Test 3: Metadata Filtering');

  const query = "What metrics improved?";
  const results = await adapter.similaritySearch(query, 5, {
    filters: { domain: 'financial' }
  });

  console.log(`\n  📊 Results with filter {domain: "financial"}:`);
  results.forEach((doc, i) => {
    console.log(`    [${i + 1}] ${doc.content.substring(0, 60)}...`);
    console.log(`        Domain: ${doc.metadata?.domain}`);
  });

  // Verify all results match filter
  for (const doc of results) {
    assertEqual(doc.metadata?.domain, 'financial', 'All results should be in financial domain');
  }

  console.log('  ✅ Metadata filtering test passed');
}

async function testHybridSearch() {
  console.log('\n🧪 Test 4: Hybrid Search (Semantic + Keyword)');

  const query = "revenue growth";

  // Test different alpha values
  const alphas = [0.0, 0.5, 1.0];

  for (const alpha of alphas) {
    console.log(`\n  Testing alpha=${alpha} (${alpha === 0 ? 'keyword only' : alpha === 1 ? 'semantic only' : 'hybrid'}):`);

    const results = await adapter.hybridSearch(query, 3, alpha);

    console.log(`    📊 Top 3 results:`);
    results.forEach((doc, i) => {
      console.log(`      [${i + 1}] Score: ${doc.similarity?.toFixed(3)}`);
      console.log(`          ${doc.content.substring(0, 70)}...`);
    });

    assertEqual(results.length, 3, 'Should return 3 results');
    assertGreaterThan(results[0].similarity!, 0, 'Results should have scores');
  }

  console.log('  ✅ Hybrid search test passed');
}

async function testRRFFusion() {
  console.log('\n🧪 Test 5: RRF Fusion Quality');

  const query = "product performance metrics";

  // Semantic-only search
  const semantic = await adapter.similaritySearch(query, 5);

  // Hybrid search (balanced)
  const hybrid = await adapter.hybridSearch(query, 5, 0.7);

  console.log(`\n  📊 Semantic vs Hybrid Comparison:`);
  console.log(`\n    Semantic Results:`);
  semantic.forEach((doc, i) => {
    console.log(`      [${i + 1}] ${doc.content.substring(0, 60)}...`);
  });

  console.log(`\n    Hybrid Results (alpha=0.7):`);
  hybrid.forEach((doc, i) => {
    console.log(`      [${i + 1}] ${doc.content.substring(0, 60)}...`);
  });

  // Both should return results
  assertGreaterThan(semantic.length, 0, 'Semantic search should return results');
  assertGreaterThan(hybrid.length, 0, 'Hybrid search should return results');

  console.log('  ✅ RRF fusion test passed');
}

async function testPerformance() {
  console.log('\n🧪 Test 6: Performance & Latency');

  const queries = [
    "What was Q4 revenue?",
    "How did margins change?",
    "What products were launched?"
  ];

  let totalLatency = 0;
  let totalResults = 0;

  for (const query of queries) {
    const startTime = Date.now();
    const results = await adapter.similaritySearch(query, 5);
    const latency = Date.now() - startTime;

    totalLatency += latency;
    totalResults += results.length;

    console.log(`\n  Query: "${query}"`);
    console.log(`    Latency: ${latency}ms`);
    console.log(`    Results: ${results.length}`);
  }

  const avgLatency = totalLatency / queries.length;
  const avgResults = totalResults / queries.length;

  console.log(`\n  📊 Performance Summary:`);
  console.log(`    Average Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`    Average Results: ${avgResults.toFixed(1)}`);

  // Performance assertions
  assertGreaterThan(1000, avgLatency, 'Average latency should be < 1s');
  assertGreaterThan(avgResults, 3, 'Should return at least 3 results on average');

  console.log('  ✅ Performance test passed');
}

async function testDelete() {
  console.log('\n🧪 Test 7: Delete Documents');

  // Delete test documents
  await adapter.delete(testDocuments.map(d => d.id));

  // Verify deletion
  const results = await adapter.similaritySearch("test", 10, {
    filters: { domain: 'financial' }
  });

  const testDocsRemaining = results.filter(r =>
    testDocuments.some(d => d.id === r.id)
  );

  assertEqual(testDocsRemaining.length, 0, 'Test documents should be deleted');

  console.log('  ✅ Delete test passed');
}

async function testEdgeCases() {
  console.log('\n🧪 Test 8: Edge Cases');

  // Empty query
  try {
    await adapter.similaritySearch("", 5);
    console.log('  ✅ Handles empty query');
  } catch (error) {
    console.log('  ⚠️ Empty query throws error (expected)');
  }

  // Large k
  const manyResults = await adapter.similaritySearch("test", 1000);
  console.log(`  ✅ Handles large k (returned ${manyResults.length} results)`);

  // Zero k
  const zeroResults = await adapter.similaritySearch("test", 0);
  assertEqual(zeroResults.length, 0, 'k=0 should return 0 results');

  // Invalid filters (non-existent field)
  const filteredResults = await adapter.similaritySearch("test", 5, {
    filters: { nonexistent: 'value' }
  });
  assertEqual(filteredResults.length, 0, 'Invalid filter should return 0 results');

  console.log('  ✅ Edge cases test passed');
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('🚀 Starting Vector Store Integration Tests\n');
  console.log('=' .repeat(80));

  const tests = [
    { name: 'Insert Documents', fn: testInsert },
    { name: 'Similarity Search', fn: testSimilaritySearch },
    { name: 'Metadata Filtering', fn: testMetadataFiltering },
    { name: 'Hybrid Search', fn: testHybridSearch },
    { name: 'RRF Fusion', fn: testRRFFusion },
    { name: 'Performance', fn: testPerformance },
    { name: 'Edge Cases', fn: testEdgeCases },
    { name: 'Delete Documents', fn: testDelete }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      console.error(`\n  ❌ ${test.name} FAILED:`, error);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Results: ${passed}/${tests.length} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
