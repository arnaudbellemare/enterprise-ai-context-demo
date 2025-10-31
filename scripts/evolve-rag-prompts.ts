/**
 * Offline GEPA Prompt Evolution for RAG Pipeline
 *
 * Usage:
 *   npx tsx scripts/evolve-rag-prompts.ts --domain financial --stage all
 *   npx tsx scripts/evolve-rag-prompts.ts --domain general --stage reranking
 *
 * This script:
 * 1. Uses GEPA Algorithms to evolve prompts for each RAG stage
 * 2. Optimizes for quality, cost, and speed (multi-objective)
 * 3. Stores evolved prompts for runtime use by RAG Pipeline
 * 4. Should run periodically (monthly or when performance degrades)
 */

import { GEPAAlgorithms } from '../frontend/lib/gepa-algorithms';
import {
  DEFAULT_RAG_PROMPTS,
  storeEvolvedPrompts,
  getEvolvedPrompts,
  type EvolvedRAGPrompts
} from '../frontend/lib/gepa-evolved-prompts';

// Test queries for each domain
const TEST_QUERIES: Record<string, string[]> = {
  general: [
    'What is machine learning?',
    'Explain quantum computing',
    'How does photosynthesis work?',
    'What caused the financial crisis of 2008?',
    'Compare Python and JavaScript'
  ],
  financial: [
    'What is the current P/E ratio for tech stocks?',
    'Explain quantitative easing',
    'How do interest rates affect bond prices?',
    'What is the difference between EBITDA and net income?',
    'Analyze Q3 revenue trends'
  ],
  technical: [
    'How does React useEffect work?',
    'Explain database indexing',
    'What is the difference between REST and GraphQL?',
    'How to optimize SQL queries?',
    'Describe microservices architecture'
  ],
  medical: [
    'What are the symptoms of diabetes?',
    'How does mRNA vaccine work?',
    'Explain the cardiovascular system',
    'What causes autoimmune diseases?',
    'Compare CT scan vs MRI'
  ]
};

interface EvolutionConfig {
  domain: string;
  stage: 'all' | 'reformulation' | 'reranking' | 'synthesis' | 'generation';
  generations: number;
  populationSize: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): EvolutionConfig {
  const args = process.argv.slice(2);
  const config: EvolutionConfig = {
    domain: 'general',
    stage: 'all',
    generations: 10,
    populationSize: 50
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) {
      config.domain = args[i + 1];
      i++;
    } else if (args[i] === '--stage' && args[i + 1]) {
      config.stage = args[i + 1] as any;
      i++;
    } else if (args[i] === '--generations' && args[i + 1]) {
      config.generations = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--population' && args[i + 1]) {
      config.populationSize = parseInt(args[i + 1]);
      i++;
    }
  }

  return config;
}

/**
 * Get base prompts for a stage
 */
function getBasePrompts(stage: string): string[] {
  const defaults = DEFAULT_RAG_PROMPTS;

  switch (stage) {
    case 'reformulation':
      return Object.values(defaults.reformulation);
    case 'reranking':
      return Object.values(defaults.reranking);
    case 'synthesis':
      return Object.values(defaults.synthesis);
    case 'generation':
      return Object.values(defaults.generation);
    default:
      return [
        defaults.reformulation.expansion,
        defaults.reranking.listwise,
        defaults.synthesis.delta_rule,
        defaults.generation.concise
      ];
  }
}

/**
 * Define optimization objectives for each stage
 */
function getObjectives(stage: string): string[] {
  const common = ['quality', 'cost', 'speed'];

  const stageSpecific: Record<string, string[]> = {
    reformulation: [...common, 'diversity'],
    reranking: [...common, 'precision'],
    synthesis: [...common, 'coherence'],
    generation: [...common, 'faithfulness']
  };

  return stageSpecific[stage] || common;
}

/**
 * Evolve prompts for a single stage
 */
async function evolveStagePrompts(
  stage: string,
  domain: string,
  config: EvolutionConfig
): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧬 GEPA Evolution: ${stage.toUpperCase()} Stage (${domain} domain)`);
  console.log(`${'='.repeat(80)}\n`);

  const gepa = new GEPAAlgorithms();
  const basePrompts = getBasePrompts(stage);
  const objectives = getObjectives(stage);

  console.log(`📊 Configuration:`);
  console.log(`   - Base prompts: ${basePrompts.length}`);
  console.log(`   - Objectives: ${objectives.join(', ')}`);
  console.log(`   - Generations: ${config.generations}`);
  console.log(`   - Population: ${config.populationSize}\n`);

  try {
    // Run GEPA optimization
    const result = await gepa.optimizePrompts(domain, basePrompts, objectives);

    console.log(`\n✅ Evolution Complete!`);
    console.log(`   - Generations evolved: ${result.optimization_metrics.generations_evolved}`);
    console.log(`   - Total individuals: ${result.optimization_metrics.total_individuals}`);
    console.log(`   - Diversity score: ${result.optimization_metrics.diversity_score.toFixed(3)}`);
    console.log(`   - Convergence rate: ${result.optimization_metrics.convergence_rate.toFixed(3)}`);

    console.log(`\n🏆 Best Individuals:`);
    console.log(`   - Quality leader: ${result.best_individuals.quality_leader.fitness.quality.toFixed(3)}`);
    console.log(`   - Speed leader: ${result.best_individuals.speed_leader.fitness.speed.toFixed(3)}`);
    console.log(`   - Cost leader: ${result.best_individuals.cost_leader.fitness.cost.toFixed(3)}`);
    console.log(`   - Pareto optimal count: ${result.best_individuals.pareto_optimal.length}`);

    // Store evolved prompts
    await storeEvolvedPrompts(
      domain,
      [
        result.best_individuals.quality_leader,
        result.best_individuals.cost_leader,
        result.best_individuals.speed_leader,
        ...result.best_individuals.pareto_optimal
      ],
      stage as any
    );

    console.log(`\n💾 Evolved prompts stored for ${domain}/${stage}`);

  } catch (error) {
    console.error(`\n❌ Evolution failed for ${stage}:`, error);
    throw error;
  }
}

/**
 * Main evolution orchestrator
 */
async function main() {
  const config = parseArgs();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 RAG PROMPT EVOLUTION WITH GEPA ALGORITHMS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`\nConfiguration:`);
  console.log(`   - Domain: ${config.domain}`);
  console.log(`   - Stage: ${config.stage}`);
  console.log(`   - Generations: ${config.generations}`);
  console.log(`   - Population: ${config.populationSize}`);

  const testQueries = TEST_QUERIES[config.domain] || TEST_QUERIES.general;
  console.log(`\n📝 Test queries for ${config.domain} domain: ${testQueries.length}`);
  testQueries.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

  const startTime = Date.now();

  try {
    if (config.stage === 'all') {
      // Evolve all stages sequentially
      const stages = ['reformulation', 'reranking', 'synthesis', 'generation'];

      for (const stage of stages) {
        await evolveStagePrompts(stage, config.domain, config);
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`✅ ALL STAGES EVOLVED SUCCESSFULLY`);
      console.log(`${'='.repeat(80)}`);

    } else {
      // Evolve single stage
      await evolveStagePrompts(config.stage, config.domain, config);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total evolution time: ${duration}s`);

    // Show stored prompts summary
    const evolvedPrompts = await getEvolvedPrompts(config.domain);
    console.log(`\n📊 Evolved Prompts Summary:`);
    console.log(`   - Version: ${evolvedPrompts.metadata.version}`);
    console.log(`   - Evolved at: ${evolvedPrompts.metadata.evolved_at}`);
    console.log(`   - Generations: ${evolvedPrompts.metadata.gepa_generations}`);
    console.log(`   - Domain: ${evolvedPrompts.metadata.domain}`);

    console.log(`\n✅ Evolution complete! RAG Pipeline will now use evolved prompts.`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Test RAG pipeline with evolved prompts`);
    console.log(`   2. Monitor performance improvements`);
    console.log(`   3. Re-run evolution monthly or when performance degrades\n`);

  } catch (error) {
    console.error(`\n❌ Evolution failed:`, error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as evolveRAGPrompts };
