/**
 * Multi-Domain Example
 * 
 * Shows how to run queries across multiple domains and compare results.
 */

import { PermutationEngine } from '../frontend/lib/permutation-engine';

async function multiDomainExample() {
  const engine = new PermutationEngine();

  // Define query for each domain
  const queries = [
    { query: "What are the top investment opportunities?", domain: "financial" },
    { query: "What are the top investment opportunities?", domain: "crypto" },
    { query: "What are the top investment opportunities?", domain: "real_estate" },
  ];

  console.log('Running multi-domain analysis...\n');

  // Execute queries in parallel
  const results = await Promise.all(
    queries.map(({ query, domain }) => 
      engine.execute(query, domain)
    )
  );

  // Compare results
  console.log('=== COMPARISON ===\n');

  queries.forEach(({ domain }, i) => {
    const result = results[i];
    console.log(`${domain.toUpperCase()}:`);
    console.log(`  Quality: ${result.metadata.quality_score}`);
    console.log(`  Cost: $${result.metadata.cost}`);
    console.log(`  Duration: ${result.metadata.duration_ms}ms`);
    console.log(`  Answer: ${result.answer.substring(0, 100)}...`);
    console.log();
  });

  // Find best quality
  const bestQuality = results.reduce((best, current, idx) => 
    current.metadata.quality_score > best.score 
      ? { score: current.metadata.quality_score, domain: queries[idx].domain }
      : best,
    { score: 0, domain: '' }
  );

  console.log(`Highest quality: ${bestQuality.domain} (${bestQuality.score})`);

  // Calculate total cost
  const totalCost = results.reduce((sum, r) => sum + r.metadata.cost, 0);
  console.log(`Total cost: $${totalCost.toFixed(6)}`);
}

multiDomainExample().catch(console.error);

/**
 * Expected Output:
 * 
 * Running multi-domain analysis...
 * 
 * === COMPARISON ===
 * 
 * FINANCIAL:
 *   Quality: 0.93
 *   Cost: $0.004
 *   Duration: 2100ms
 *   Answer: Based on current market conditions, diversified index funds like S&P 500 ETFs offer...
 * 
 * CRYPTO:
 *   Quality: 0.91
 *   Cost: $0.007
 *   Duration: 2800ms
 *   Answer: The crypto market shows opportunities in established coins like Bitcoin and Ethereum...
 * 
 * REAL_ESTATE:
 *   Quality: 0.95
 *   Cost: $0.004
 *   Duration: 2200ms
 *   Answer: Real estate markets in growing tech hubs like Austin and Nashville present...
 * 
 * Highest quality: real_estate (0.95)
 * Total cost: $0.015000
 */

