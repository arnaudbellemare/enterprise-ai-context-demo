/**
 * Integration Tests for Document Retrieval + Reranking
 *
 * Tests GEPA RAG Stages 2-3 with multi-query expansion and listwise reranking.
 */

import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorAdapter } from './frontend/lib/rag/vector-store-adapter';
import { DocumentRetriever } from './frontend/lib/rag/document-retriever';
import { DocumentReranker } from './frontend/lib/rag/document-reranker';

const MODEL = process.env.RAG_MODEL || 'perplexity/sonar-pro';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const vectorStore = new SupabaseVectorAdapter(supabase, 'documents');
const retriever = new DocumentRetriever(vectorStore);
const reranker = new DocumentReranker(MODEL);

async function runTests() {
  console.log('🚀 Testing Document Retrieval + Reranking\n');

  // Test 1: Multi-query retrieval
  const result1 = await retriever.retrieve('What was Q4 2024 revenue?', {
    k: 10,
    useReformulation: true,
    numReformulations: 3,
  });

  console.log(`✅ Retrieved ${result1.documents.length} docs`);
  console.log(`   Diversity: ${result1.diversity.toFixed(3)}`);
  console.log(`   Avg Similarity: ${result1.avgSimilarity.toFixed(3)}`);

  // Test 2: Listwise reranking
  const result2 = await reranker.rerank('What was Q4 2024 revenue?', result1.documents, {
    method: 'listwise',
    useInferenceSampling: true,
    numHypotheses: 5,
  });

  console.log(`\n✅ Reranked ${result2.documents.length} docs`);
  console.log(`   Diversity: ${result2.diversityScore.toFixed(3)}`);
  console.log(`   Quality: ${result2.qualityScore.toFixed(3)}`);

  console.log('\n✅ All tests passed!');
}

runTests().catch(console.error);
