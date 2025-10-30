import { LocalVectorAdapter } from './frontend/lib/rag/local-vector-adapter';
import { RAGPipeline } from './frontend/lib/rag/complete-rag-pipeline';

const MODEL = process.env.RAG_MODEL || 'perplexity/sonar-pro';

async function run() {
  const vectorStore = new LocalVectorAdapter('legal-insurance');

  await vectorStore.insert([
    {
      id: 'spp-1',
      content: 'Scheduled Personal Property coverage provides open-perils protection for high-value jewelry. Loss settlement is at the least of: cost to repair, cost to replace, or the scheduled amount. Agreed value endorsements may stipulate a fixed payout.',
      metadata: { domain: 'insurance', topic: 'scheduled_personal_property' },
    },
    {
      id: 'agreed-1',
      content: 'Fine Arts Agreed Value Endorsement: Insurer agrees to pay the agreed value shown for each item if total loss. Partial losses are settled at restoration cost to pre-loss condition.',
      metadata: { domain: 'insurance', topic: 'agreed_value' },
    },
    {
      id: 'exclusions-1',
      content: 'Exclusions include wear and tear, inherent vice, scratching, and damage during repair or restoration unless ensuing fire occurs. Mysterious disappearance requires specific inclusion.',
      metadata: { domain: 'insurance', topic: 'exclusions' },
    },
    {
      id: 'cartier-1',
      content: 'Cartier Art Deco bracelet, circa 1930s, platinum with natural diamonds. Provenance and maker elevate insurable interest and premium. Appraisal updates recommended for market volatility.',
      metadata: { domain: 'valuation', topic: 'art_deco_cartier', category: 'jewelry' },
    },
    {
      id: 'policy-1',
      content: 'Policy pays for direct physical loss to covered property caused by non-excluded perils. For scheduled items, the most payable is the schedule limit unless agreed value applies.',
      metadata: { domain: 'insurance', topic: 'policy_language' },
    },
    {
      id: 'appraisal-1',
      content: 'USPAP jewelry appraisals must document maker (Cartier), period (Art Deco), materials (platinum, natural diamonds), condition, provenance, and comparable sales for underwriting and claims.',
      metadata: { domain: 'valuation', topic: 'appraisal_standards' },
    },
  ]);

  const pipeline = new RAGPipeline(vectorStore as any, MODEL);

  const query = 'For a 1930s Art Deco Cartier platinum diamond bracelet, draft an insurance guidance memo: (1) decide between scheduled personal property vs agreed value endorsement, (2) outline key exclusions applicable, (3) list appraisal requirements for underwriting and claim settlement. Provide a concise, policy-grounded recommendation.';

  console.log('Running legal/insurance permutation test with model:', MODEL);

  const result = await pipeline.execute(query, {
    retrieval: { k: 10, hybridAlpha: 0.7, parallel: true },
    synthesis: { maxLength: 1200, useDeltaRule: true, gatingStrategy: 'data-dependent', beta: 0.8 },
    generation: { maxLength: 400, numCandidates: 5, beta: 1.5, verifyFaithfulness: true, confidenceThreshold: 0.6 },
    model: MODEL,
  });

  console.log('\nAnswer:\n', result.answer);
  console.log('\nMetrics:', result.metrics);
  console.log('Verification:', result.verification);
  console.log('Delta:', result.deltaState);
}

run().catch(err => {
  console.error('Legal permutation test failed:', err);
  process.exit(1);
});
