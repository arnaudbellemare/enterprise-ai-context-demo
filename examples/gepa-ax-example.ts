/**
 * GEPA + Ax LLM Example
 *
 * Demonstrates how to use GEPA with Ax LLM for real prompt optimization
 */

import { GEPAEngine, type GEPAConfig, type Benchmark } from '../frontend/lib/gepa-ax-integration';

// ============================================================================
// Define Benchmarks
// ============================================================================

const benchmarks: Benchmark[] = [
  {
    name: 'math',
    domain: 'Mathematical Reasoning',
    testCases: [
      {
        input: 'What is 15% of 80?',
        expected: '12'
      },
      {
        input: 'If a train travels 120 miles in 2 hours, what is its average speed?',
        expected: '60 mph'
      },
      {
        input: 'Solve for x: 2x + 5 = 15',
        expected: 'x = 5'
      }
    ],
    evaluator: (response, expected) => {
      const normalized = response.toLowerCase().replace(/\s/g, '');
      const expectedNorm = expected.toLowerCase().replace(/\s/g, '');
      return normalized.includes(expectedNorm) ? 1.0 : 0.0;
    }
  },

  {
    name: 'code',
    domain: 'Code Generation',
    testCases: [
      {
        input: 'Write a Python function to reverse a string',
        expected: 'def reverse_string'
      },
      {
        input: 'Create a JavaScript function that checks if a number is prime',
        expected: 'function isPrime'
      }
    ],
    evaluator: (response, expected) => {
      const hasCode = response.includes('```') || response.includes('function') || response.includes('def');
      const hasExpected = response.includes(expected);
      return (hasCode && hasExpected) ? 1.0 : (hasCode || hasExpected) ? 0.5 : 0.0;
    }
  },

  {
    name: 'reasoning',
    domain: 'Logical Reasoning',
    testCases: [
      {
        input: 'All cats are mammals. Fluffy is a cat. Therefore, is Fluffy a mammal?',
        expected: 'yes'
      },
      {
        input: 'If it rains, the ground gets wet. The ground is wet. Can we conclude it rained?',
        expected: 'not necessarily'
      }
    ],
    evaluator: (response, expected) => {
      const normalized = response.toLowerCase();
      const expectedNorm = expected.toLowerCase();
      return normalized.includes(expectedNorm) ? 1.0 : 0.0;
    }
  }
];

// ============================================================================
// Run GEPA Optimization
// ============================================================================

async function runGEPAOptimization() {
  console.log('🧬 GEPA + Ax LLM Prompt Optimization\n');

  // Configuration
  const config: GEPAConfig = {
    populationSize: 10,
    maxGenerations: 5,
    mutationRate: 0.3,
    crossoverRate: 0.7,
    elitismCount: 2,

    llmConfig: {
      model: 'sonar-pro',  // Perplexity premium model (consistent with TRM teacher)
      apiKey: process.env.PERPLEXITY_API_KEY || process.env.OPENAI_API_KEY || '',
      temperature: 0.7,
      maxTokens: 2000
    },

    objectives: {
      maximize: ['quality', 'token_efficiency'],
      minimize: ['cost', 'latency']
    },

    evaluationBenchmarks: benchmarks
  };

  // Initial prompts to evolve from
  const initialPrompts = [
    'Answer the following question: {input}',

    'Let\'s solve this step by step:\n{input}\n\nThinking process:',

    'Question: {input}\n\nAnalysis:\n- Understanding:\n- Approach:\n- Solution:',

    '{input}\n\nI will think through this carefully and provide a clear, accurate answer.',

    'Task: {input}\n\nStep 1: Understand the problem\nStep 2: Apply relevant knowledge\nStep 3: Provide the answer'
  ];

  console.log('📋 Configuration:');
  console.log(`   Population: ${config.populationSize}`);
  console.log(`   Generations: ${config.maxGenerations}`);
  console.log(`   Benchmarks: ${benchmarks.length}`);
  console.log(`   Initial prompts: ${initialPrompts.length}\n`);

  // Create GEPA engine
  const gepa = new GEPAEngine(config);

  // Run optimization
  console.log('🚀 Starting optimization...\n');
  const startTime = Date.now();

  const result = await gepa.optimize(initialPrompts);

  const totalTime = (Date.now() - startTime) / 1000;

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION RESULTS');
  console.log('='.repeat(60) + '\n');

  console.log(`⏱️  Total time: ${totalTime.toFixed(1)}s`);
  console.log(`🔄 Generations: ${result.convergenceMetrics.generationsToConverge}`);
  console.log(`📈 Improvement: ${(result.convergenceMetrics.improvementRate * 100).toFixed(1)}%`);
  console.log(`🎯 Diversity: ${result.convergenceMetrics.finalDiversityScore.toFixed(3)}\n`);

  console.log('🏆 Best Prompts by Objective:\n');

  console.log('📈 Quality Leader:');
  console.log(`   Score: ${(result.bestByObjective.quality.fitness.quality * 100).toFixed(1)}%`);
  console.log(`   Prompt: "${result.bestByObjective.quality.prompt.substring(0, 80)}..."\n`);

  console.log('💰 Cost Leader:');
  console.log(`   Cost: $${result.bestByObjective.cost.fitness.cost.toFixed(4)}`);
  console.log(`   Quality: ${(result.bestByObjective.cost.fitness.quality * 100).toFixed(1)}%`);
  console.log(`   Prompt: "${result.bestByObjective.cost.prompt.substring(0, 80)}..."\n`);

  console.log('⚡ Latency Leader:');
  console.log(`   Latency: ${result.bestByObjective.latency.fitness.latency}ms`);
  console.log(`   Quality: ${(result.bestByObjective.latency.fitness.quality * 100).toFixed(1)}%`);
  console.log(`   Prompt: "${result.bestByObjective.latency.prompt.substring(0, 80)}..."\n`);

  console.log('🎯 Token Efficiency Leader:');
  console.log(`   Efficiency: ${result.bestByObjective.tokenEfficiency.fitness.token_efficiency.toFixed(6)}`);
  console.log(`   Prompt: "${result.bestByObjective.tokenEfficiency.prompt.substring(0, 80)}..."\n`);

  console.log(`🌟 Pareto Frontier: ${result.paretoFrontier.length} optimal prompts\n`);

  // Show Pareto frontier details
  console.log('Pareto-Optimal Prompts:');
  result.paretoFrontier.forEach((individual, idx) => {
    console.log(`\n${idx + 1}. ID: ${individual.id.substring(0, 12)}`);
    console.log(`   Quality: ${(individual.fitness.quality * 100).toFixed(1)}%`);
    console.log(`   Cost: $${individual.fitness.cost.toFixed(4)}`);
    console.log(`   Latency: ${individual.fitness.latency}ms`);
    console.log(`   Token Eff: ${individual.fitness.token_efficiency.toFixed(6)}`);
    console.log(`   Domain Scores:`);
    Object.entries(individual.domainScores).forEach(([domain, score]) => {
      console.log(`      ${domain}: ${(score * 100).toFixed(1)}%`);
    });
    console.log(`   Prompt: "${individual.prompt.substring(0, 100)}..."`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('💡 Recommendation:');
  console.log('='.repeat(60) + '\n');

  // Recommend best overall prompt
  const bestOverall = result.paretoFrontier.reduce((best, curr) => {
    const bestScore = best.fitness.quality * 0.6 + best.fitness.token_efficiency * 0.4;
    const currScore = curr.fitness.quality * 0.6 + curr.fitness.token_efficiency * 0.4;
    return currScore > bestScore ? curr : best;
  });

  console.log('Use this prompt for best overall performance:');
  console.log(`\n"${bestOverall.prompt}"\n`);
  console.log(`Quality: ${(bestOverall.fitness.quality * 100).toFixed(1)}%`);
  console.log(`Cost: $${bestOverall.fitness.cost.toFixed(4)}`);
  console.log(`Latency: ${bestOverall.fitness.latency}ms`);
  console.log(`Token Efficiency: ${bestOverall.fitness.token_efficiency.toFixed(6)}`);

  return result;
}

// ============================================================================
// Run Example
// ============================================================================

if (require.main === module) {
  if (!process.env.PERPLEXITY_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ Error: PERPLEXITY_API_KEY or OPENAI_API_KEY environment variable is required');
    console.error('   Set one with:');
    console.error('   export PERPLEXITY_API_KEY=pplx-... (recommended)');
    console.error('   OR');
    console.error('   export OPENAI_API_KEY=sk-...');
    process.exit(1);
  }

  runGEPAOptimization()
    .then(() => {
      console.log('\n✅ Optimization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Optimization failed:', error);
      process.exit(1);
    });
}

export { runGEPAOptimization };
