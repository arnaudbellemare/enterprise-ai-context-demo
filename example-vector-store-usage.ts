/**
 * Vector Store Usage Examples
 *
 * Shows how to use the Supabase vector adapter in real scenarios.
 */

import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorAdapter } from './frontend/lib/rag/vector-store-adapter';

// ============================================================================
// Setup
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const vectorStore = new SupabaseVectorAdapter(supabase, 'documents');

// ============================================================================
// Example 1: Basic Semantic Search
// ============================================================================

async function example1_BasicSearch() {
  console.log('\n📝 Example 1: Basic Semantic Search\n');

  const query = "What was Q4 revenue?";
  const results = await vectorStore.similaritySearch(query, 5);

  console.log(`Query: "${query}"\n`);
  console.log('Top 5 Results:');

  results.forEach((doc, i) => {
    console.log(`\n[${i + 1}] Similarity: ${doc.similarity?.toFixed(3)}`);
    console.log(`    ${doc.content}`);
    console.log(`    Metadata: ${JSON.stringify(doc.metadata)}`);
  });
}

// ============================================================================
// Example 2: Filtered Search (Domain-Specific)
// ============================================================================

async function example2_FilteredSearch() {
  console.log('\n📝 Example 2: Domain-Filtered Search\n');

  const query = "recent performance metrics";

  // Search only in financial domain
  const financialResults = await vectorStore.similaritySearch(query, 3, {
    filters: { domain: 'financial' }
  });

  console.log(`Query: "${query}" (domain: financial)\n`);
  console.log('Results:');

  financialResults.forEach((doc, i) => {
    console.log(`\n[${i + 1}] ${doc.content}`);
  });
}

// ============================================================================
// Example 3: Hybrid Search (Best of Both Worlds)
// ============================================================================

async function example3_HybridSearch() {
  console.log('\n📝 Example 3: Hybrid Search (Semantic + Keyword)\n');

  const query = "revenue growth";

  // Semantic-only (alpha=1.0)
  console.log('Semantic-only (alpha=1.0):');
  const semantic = await vectorStore.hybridSearch(query, 3, 1.0);
  semantic.forEach((doc, i) => {
    console.log(`  [${i + 1}] ${doc.content.substring(0, 70)}...`);
  });

  // Hybrid (alpha=0.7)
  console.log('\nHybrid (alpha=0.7):');
  const hybrid = await vectorStore.hybridSearch(query, 3, 0.7);
  hybrid.forEach((doc, i) => {
    console.log(`  [${i + 1}] ${doc.content.substring(0, 70)}...`);
  });

  // Keyword-only (alpha=0.0)
  console.log('\nKeyword-only (alpha=0.0):');
  const keyword = await vectorStore.hybridSearch(query, 3, 0.0);
  keyword.forEach((doc, i) => {
    console.log(`  [${i + 1}] ${doc.content.substring(0, 70)}...`);
  });
}

// ============================================================================
// Example 4: Multi-Query Retrieval (for RAG)
// ============================================================================

async function example4_MultiQueryRetrieval() {
  console.log('\n📝 Example 4: Multi-Query Retrieval\n');

  const baseQuery = "What was Q4 performance?";

  // Generate diverse queries (would use inference sampling in production)
  const queries = [
    "What was Q4 2024 revenue and growth?",
    "How did Q4 margins compare to Q3?",
    "What products drove Q4 performance?"
  ];

  console.log(`Base Query: "${baseQuery}"\n`);
  console.log('Diverse Queries:');
  queries.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));

  // Retrieve for each query
  const allResults = await Promise.all(
    queries.map(q => vectorStore.similaritySearch(q, 3))
  );

  // Deduplicate
  const seen = new Set<string>();
  const deduplicated = allResults
    .flat()
    .filter(doc => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });

  console.log(`\nTotal Results: ${allResults.flat().length}`);
  console.log(`Deduplicated: ${deduplicated.length}`);

  console.log('\nCombined Results:');
  deduplicated.slice(0, 5).forEach((doc, i) => {
    console.log(`\n[${i + 1}] ${doc.content}`);
  });
}

// ============================================================================
// Example 5: Insert New Documents
// ============================================================================

async function example5_InsertDocuments() {
  console.log('\n📝 Example 5: Insert New Documents\n');

  const newDocuments = [
    {
      id: `doc-${Date.now()}-1`,
      content: 'Q1 2025 outlook: Expected revenue growth of 15-20% driven by new enterprise deals.',
      metadata: { domain: 'financial', year: 2025, quarter: 'Q1', type: 'forecast' }
    },
    {
      id: `doc-${Date.now()}-2`,
      content: 'New AI-powered feature released in beta with 500+ signups in first week.',
      metadata: { domain: 'product', year: 2025, type: 'launch' }
    }
  ];

  console.log(`Inserting ${newDocuments.length} documents...`);

  await vectorStore.insert(newDocuments);

  console.log('✅ Documents inserted\n');

  // Verify by searching
  const results = await vectorStore.similaritySearch('Q1 2025 outlook', 2);

  console.log('Verification (searching for "Q1 2025 outlook"):');
  results.forEach((doc, i) => {
    console.log(`\n[${i + 1}] ${doc.content}`);
  });

  // Cleanup
  await vectorStore.delete(newDocuments.map(d => d.id));
  console.log('\n✅ Cleanup complete');
}

// ============================================================================
// Example 6: GEPA RAG Integration
// ============================================================================

async function example6_GEPARagIntegration() {
  console.log('\n📝 Example 6: GEPA RAG Integration\n');

  const query = "What drove Q4 growth?";

  console.log(`Query: "${query}"\n`);

  // Stage 1: Query Reformulation (would use inference sampling)
  const reformulated = "What were the key drivers and metrics behind Q4 2024 revenue growth?";
  console.log(`Reformulated: "${reformulated}"\n`);

  // Stage 2: Multi-Query Expansion + Retrieval
  console.log('Stage 2: Multi-Query Retrieval');
  const diverseQueries = [
    reformulated,
    "Q4 2024 revenue growth factors",
    "Key performance metrics Q4 2024"
  ];

  const allDocs = await Promise.all(
    diverseQueries.map(q => vectorStore.hybridSearch(q, 5, 0.7))
  );

  // Deduplicate
  const seen = new Set<string>();
  const candidates = allDocs.flat().filter(doc => {
    if (seen.has(doc.id)) return false;
    seen.add(doc.id);
    return true;
  });

  console.log(`  Retrieved: ${candidates.length} unique documents`);

  // Stage 3: GEPA Reranking (would use existing gepa-enhanced-retrieval.ts)
  console.log('\nStage 3: GEPA Reranking');
  const topK = candidates.slice(0, 5);
  console.log(`  Selected top ${topK.length} for context synthesis`);

  // Display results
  console.log('\nFinal Documents for RAG:');
  topK.forEach((doc, i) => {
    console.log(`\n[${i + 1}] Similarity: ${doc.similarity?.toFixed(3)}`);
    console.log(`    ${doc.content}`);
  });
}

// ============================================================================
// Example 7: Collection Management
// ============================================================================

async function example7_CollectionManagement() {
  console.log('\n📝 Example 7: Collection Management\n');

  // Get collection info
  const info = await vectorStore.getCollectionInfo();

  console.log('Collection Information:');
  console.log(`  Name: ${info.name}`);
  console.log(`  Documents: ${info.count}`);
  console.log(`  Embedding Dimension: ${info.dimension}`);
  console.log(`  Metadata: ${JSON.stringify(info.metadata, null, 2)}`);
}

// ============================================================================
// Main Runner
// ============================================================================

async function runAllExamples() {
  console.log('🚀 Vector Store Usage Examples\n');
  console.log('=' .repeat(80));

  const examples = [
    { name: 'Basic Semantic Search', fn: example1_BasicSearch },
    { name: 'Domain-Filtered Search', fn: example2_FilteredSearch },
    { name: 'Hybrid Search', fn: example3_HybridSearch },
    { name: 'Multi-Query Retrieval', fn: example4_MultiQueryRetrieval },
    { name: 'Insert New Documents', fn: example5_InsertDocuments },
    { name: 'GEPA RAG Integration', fn: example6_GEPARagIntegration },
    { name: 'Collection Management', fn: example7_CollectionManagement }
  ];

  for (const example of examples) {
    try {
      await example.fn();
      console.log('\n' + '-'.repeat(80));
    } catch (error) {
      console.error(`\n❌ Example "${example.name}" failed:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ All examples complete!');
}

// Run examples
runAllExamples().catch(error => {
  console.error('💥 Examples failed:', error);
  process.exit(1);
});
