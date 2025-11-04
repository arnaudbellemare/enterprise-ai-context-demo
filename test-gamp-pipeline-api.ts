/**
 * Test script for Permutation-Lite GAMP Pipeline API
 *
 * Demonstrates:
 * - Scientific query with GAMP activation
 * - Non-scientific query without GAMP
 * - Custom configuration options
 * - Performance comparison
 *
 * Usage:
 * npx tsx test-gamp-pipeline-api.ts
 */

interface GampApiResponse {
  success: boolean;
  result?: {
    query: string;
    domain: string;
    response: string;
    qualityScore: number;
    routing: any;
    optimization?: any;
    graphReasoning: {
      activated: boolean;
      pathsDiscovered?: number;
      topPath?: {
        problem: string;
        solution: string;
        effect: string;
        novelty: number;
        scientificRationality: number;
        factuality: number;
        overallScore: number;
      };
      graphStats?: {
        nodes: number;
        edges: number;
        triplets: number;
      };
      agentEvaluations?: number;
      executionTime?: number;
      reason?: string;
    };
    learning?: any;
    verification?: any;
    performance: {
      totalTime: number;
      layerTimes: Record<string, number | undefined>;
    };
  };
  error?: {
    message: string;
    type: string;
    timestamp: string;
  };
}

const API_URL = 'http://localhost:3000/api/permutation-lite-gamp';

/**
 * Make API request with timeout
 */
async function queryPipeline(
  query: string,
  domain: string,
  options: any = {}
): Promise<GampApiResponse> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 Testing: ${query.substring(0, 60)}...`);
  console.log(`🔬 Domain: ${domain}`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        domain,
        ...options,
      }),
    });

    const data: GampApiResponse = await response.json();
    const duration = Date.now() - startTime;

    if (data.success && data.result) {
      console.log('✅ Success!\n');

      console.log('📈 Quality Score:', data.result.qualityScore.toFixed(3));

      console.log('\n🧠 GAMP Status:');
      if (data.result.graphReasoning.activated) {
        console.log('  ✅ ACTIVATED');
        console.log(`  📊 Paths Discovered: ${data.result.graphReasoning.pathsDiscovered}`);
        console.log(
          `  👥 Agent Evaluations: ${data.result.graphReasoning.agentEvaluations}`
        );

        if (data.result.graphReasoning.topPath) {
          console.log('\n  🏆 Top Path:');
          console.log(`     Problem: ${data.result.graphReasoning.topPath.problem}`);
          console.log(`     Solution: ${data.result.graphReasoning.topPath.solution}`);
          console.log(`     Effect: ${data.result.graphReasoning.topPath.effect}`);
          console.log('\n  📊 Scores:');
          console.log(
            `     Novelty: ${data.result.graphReasoning.topPath.novelty.toFixed(2)}`
          );
          console.log(
            `     Scientific Rationality: ${data.result.graphReasoning.topPath.scientificRationality.toFixed(2)}`
          );
          console.log(
            `     Factuality: ${data.result.graphReasoning.topPath.factuality.toFixed(2)}`
          );
          console.log(
            `     Overall: ${data.result.graphReasoning.topPath.overallScore.toFixed(2)}`
          );
        }

        if (data.result.graphReasoning.graphStats) {
          console.log('\n  🗺️  Graph Stats:');
          console.log(`     Nodes: ${data.result.graphReasoning.graphStats.nodes}`);
          console.log(`     Edges: ${data.result.graphReasoning.graphStats.edges}`);
          console.log(
            `     P-S-E Triplets: ${data.result.graphReasoning.graphStats.triplets}`
          );
        }

        console.log(
          `\n  ⏱️  GAMP Execution Time: ${data.result.graphReasoning.executionTime}ms`
        );
      } else {
        console.log('  ❌ NOT ACTIVATED');
        console.log(`  💡 Reason: ${data.result.graphReasoning.reason}`);
      }

      console.log('\n⏱️  Performance:');
      console.log(`  Total Time: ${data.result.performance.totalTime}ms`);
      console.log('  Layer Breakdown:');
      Object.entries(data.result.performance.layerTimes).forEach(([layer, time]) => {
        if (time !== undefined) {
          console.log(`    ${layer}: ${time}ms`);
        }
      });

      console.log(`\n🌐 Network Round-Trip: ${duration}ms`);

      if (data.result.optimization) {
        console.log('\n🎯 Optimization:');
        console.log(`  Strategy: ${data.result.optimization.strategy}`);
        console.log(`  Quality: ${data.result.optimization.qualityScore.toFixed(3)}`);
        console.log(`  Cost: $${data.result.optimization.cost.toFixed(4)}`);
      }

      if (data.result.verification) {
        console.log('\n✅ Verification:');
        console.log(`  Verified: ${data.result.verification.verified}`);
        console.log(`  Score: ${data.result.verification.score.toFixed(3)}`);
        console.log(`  Refinements: ${data.result.verification.refinementCount}`);
        console.log(`  Depth: ${data.result.verification.depth}`);
      }

      if (data.result.learning) {
        console.log('\n🧠 Learning:');
        console.log(`  Memories Retrieved: ${data.result.learning.memoriesRetrieved}`);
        console.log(`  Patterns Applied: ${data.result.learning.patternsApplied}`);
        console.log(`  Stored: ${data.result.learning.stored}`);
      }

      console.log(
        `\n💬 Response: ${data.result.response.substring(0, 200)}${data.result.response.length > 200 ? '...' : ''}`
      );
    } else {
      console.log('❌ Failed!\n');
      console.log('Error:', data.error?.message);
      console.log('Type:', data.error?.type);
    }

    return data;
  } catch (error: any) {
    console.log('❌ Request Failed!\n');
    console.log('Error:', error.message);

    return {
      success: false,
      error: {
        message: error.message,
        type: 'NetworkError',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Run test suite
 */
async function runTests() {
  console.log('\n🚀 Permutation-Lite GAMP Pipeline API Test Suite');
  console.log('================================================\n');

  // Test 1: Scientific query (GAMP should activate)
  console.log('\n📋 Test 1: Scientific Query (Biology) - GAMP Should Activate');
  const result1 = await queryPipeline(
    'How can CRISPR-Cas9 gene editing technology be used to treat genetic diseases like sickle cell anemia?',
    'biology',
    {
      enableGAMP: true,
      enableOptimization: true,
      enableLearning: true,
      enableVerification: true,
    }
  );

  // Test 2: Simple scientific query (GAMP should NOT activate - too easy)
  console.log('\n📋 Test 2: Simple Query (Biology) - GAMP Should NOT Activate');
  const result2 = await queryPipeline(
    'What is DNA?',
    'biology',
    {
      enableGAMP: true,
    }
  );

  // Test 3: Non-scientific query (GAMP should NOT activate - wrong domain)
  console.log('\n📋 Test 3: Non-Scientific Query - GAMP Should NOT Activate');
  const result3 = await queryPipeline(
    'What are the best marketing strategies for a startup?',
    'business',
    {
      enableGAMP: true,
    }
  );

  // Test 4: Chemistry query (GAMP should activate)
  console.log('\n📋 Test 4: Chemistry Query - GAMP Should Activate');
  const result4 = await queryPipeline(
    'How can we design novel catalysts to improve the efficiency of carbon dioxide reduction reactions?',
    'chemistry',
    {
      enableGAMP: true,
      gampConfig: {
        maxGraphNodes: 30,
        maxGraphEdges: 60,
        maxPaths: 3,
      },
    }
  );

  // Test 5: Physics query (GAMP should activate)
  console.log('\n📋 Test 5: Physics Query - GAMP Should Activate');
  const result5 = await queryPipeline(
    'Explain the mechanisms of quantum entanglement and its potential applications in quantum computing.',
    'physics',
    {
      enableGAMP: true,
    }
  );

  // Test 6: GAMP disabled
  console.log('\n📋 Test 6: GAMP Disabled (Config Override)');
  const result6 = await queryPipeline(
    'How does photosynthesis work at the molecular level?',
    'biology',
    {
      enableGAMP: false,
    }
  );

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));

  const results = [result1, result2, result3, result4, result5, result6];
  const successful = results.filter((r) => r.success).length;
  const gampActivated = results.filter(
    (r) => r.success && r.result?.graphReasoning.activated
  ).length;

  console.log(`\n✅ Successful: ${successful}/${results.length}`);
  console.log(`🧠 GAMP Activated: ${gampActivated}/${results.length}`);

  if (result1.success && result1.result) {
    console.log('\n🎯 Performance Comparison:');

    const withGAMP = result1.result.performance.totalTime;
    const withoutGAMP =
      result6.success && result6.result
        ? result6.result.performance.totalTime
        : 0;

    if (withoutGAMP > 0) {
      console.log(`  With GAMP: ${withGAMP}ms`);
      console.log(`  Without GAMP: ${withoutGAMP}ms`);
      console.log(`  Overhead: +${withGAMP - withoutGAMP}ms`);
    }

    if (result1.result.graphReasoning.activated) {
      const gampTime = result1.result.graphReasoning.executionTime || 0;
      const totalTime = result1.result.performance.totalTime;
      const percentage = ((gampTime / totalTime) * 100).toFixed(1);

      console.log(`\n🧠 GAMP Impact:`);
      console.log(`  GAMP Time: ${gampTime}ms`);
      console.log(`  Total Time: ${totalTime}ms`);
      console.log(`  Percentage: ${percentage}%`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test Suite Complete!');
  console.log('='.repeat(80) + '\n');
}

/**
 * Check API health before running tests
 */
async function checkApiHealth() {
  console.log('🏥 Checking API health...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
    });

    const data = await response.json();

    if (data.status === 'healthy') {
      console.log('✅ API is healthy');
      console.log(`📦 Service: ${data.service}`);
      console.log(`🔖 Version: ${data.version}`);
      console.log('\n🔧 Features:');
      Object.entries(data.features).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value}`);
      });

      console.log('\n🎯 GAMP Activation Conditions:');
      data.gampActivation.conditions.forEach((condition: string) => {
        console.log(`  ✓ ${condition}`);
      });

      console.log('\n🔬 Scientific Domains:');
      console.log(`  ${data.gampActivation.scientificDomains.join(', ')}`);

      console.log('\n✅ Ready to run tests!\n');
      return true;
    } else {
      console.log('❌ API is not healthy');
      return false;
    }
  } catch (error: any) {
    console.log('❌ Failed to connect to API');
    console.log(`Error: ${error.message}`);
    console.log(
      '\n💡 Make sure the Next.js dev server is running: npm run dev\n'
    );
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.clear();

  const isHealthy = await checkApiHealth();

  if (!isHealthy) {
    console.log('❌ Exiting due to API health check failure\n');
    process.exit(1);
  }

  await runTests();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
