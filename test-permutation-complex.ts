import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorAdapter } from './frontend/lib/rag/vector-store-adapter';
import { RAGPipeline } from './frontend/lib/rag/complete-rag-pipeline';

const MODEL = process.env.RAG_MODEL || 'perplexity/sonar-pro';

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const vectorStore = new SupabaseVectorAdapter(supabase, 'documents');
  const pipeline = new RAGPipeline(vectorStore, MODEL);

  const query = 'Provide a multi-step analysis: summarize 2024 Q4 revenue drivers, compare to Q3, and explain how product launches influenced margins, citing context.';

  console.log('Running complex permutation RAG test with model:', MODEL);

  const result = await pipeline.execute(query, {
    reformulation: { enabled: true, numReformulations: 3, beta: 1.5 },
    retrieval: { k: 10, hybridAlpha: 0.7, parallel: true },
    reranking: { enabled: true, method: 'listwise', numHypotheses: 5, beta: 1.5 },
    synthesis: { maxLength: 2000, useDeltaRule: true, gatingStrategy: 'data-dependent', beta: 0.8 },
    generation: { maxLength: 500, numCandidates: 5, beta: 1.5, verifyFaithfulness: true, confidenceThreshold: 0.7 },
    model: MODEL,
  });

  console.log('\nAnswer:\n', result.answer);
  console.log('\nMetrics:', result.metrics);
  console.log('Verification:', result.verification);
  console.log('Delta:', result.deltaState);
}

run().catch(err => {
  console.error('Complex permutation test failed:', err);
  process.exit(1);
});
