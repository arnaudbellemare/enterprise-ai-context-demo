/**
 * Test Chat Reasoning with Unified Permutation Pipeline
 * Directly tests the pipeline function (no HTTP server needed)
 */

import { executeUnifiedPipeline } from './frontend/lib/unified-permutation-pipeline';

async function testChatReasoning() {
  console.log('🧪 Testing Chat Reasoning with Improved Reasoning Heuristics\n');
  console.log('='.repeat(80));

  const testQueries = [
    {
      query: 'How can I optimize my supply chain operations to reduce costs?',
      domain: 'business', // Maps to optimization domain for heuristics
      description: 'Optimization query (should use simplify/modify heuristics)'
    },
    {
      query: 'What is the mathematical formula for calculating compound interest?',
      domain: 'financial', // Maps to mathematical domain for heuristics
      description: 'Mathematical query (should use measure/calculate heuristics)'
    },
    {
      query: 'Design a creative marketing campaign for a new product launch',
      domain: 'business', // Maps to creative domain for heuristics
      description: 'Creative query (should use creative/innovative heuristics)'
    },
    {
      query: 'How to improve customer satisfaction in retail?',
      domain: 'general',
      description: 'General business query (should use semantic similarity)'
    }
  ];

  for (const test of testQueries) {
    console.log(`\n📝 Test: ${test.description}`);
    console.log(`   Query: "${test.query.substring(0, 60)}..."`);
    console.log(`   Domain: ${test.domain}`);
    console.log('-'.repeat(80));

    try {
      const startTime = Date.now();
      
      // Directly call the unified pipeline function
      const result = await executeUnifiedPipeline(
        test.query,
        test.domain,
        undefined,
        {
          enableACE: true,
          enableGEPA: true,
          enableIRT: true,
          enableRVS: false, // Skip RVS for faster test
          enableDSPy: true,
          enableSemiotic: true,
          enableTeacherStudent: false, // Skip for faster test
          enableSWiRL: false,
          enableSRL: false,
          enableEBM: true, // Enable EBM to test refinement
          optimizationMode: 'balanced'
        }
      );

      const duration = Date.now() - startTime;

      console.log(`   ✅ Success (${duration}ms)`);
      console.log(`   📊 Quality Score: ${(result.metadata?.quality_score * 100).toFixed(1)}%`);
      console.log(`   🎯 Components Used: ${result.metadata?.components_used?.length || 0}`);
      
      // Check for reasoning heuristics in steps
      const steps = result.trace?.steps || [];
      const stepsWithHeuristics = steps.filter((step: any) => step.reasoning_heuristic);
      
      if (stepsWithHeuristics.length > 0) {
        console.log(`   🧠 Reasoning Heuristics Found: ${stepsWithHeuristics.length}/${steps.length} steps`);
        stepsWithHeuristics.forEach((step: any, i: number) => {
          const heuristic = step.reasoning_heuristic?.substring(0, 50) || 'N/A';
          console.log(`      ${i + 1}. ${step.component}: "${heuristic}..."`);
        });
      } else {
        console.log(`   ⚠️  No reasoning heuristics found in steps`);
      }

      // Show answer preview
      const answer = result.final_answer || result.answer || '';
      if (answer) {
        console.log(`   📝 Answer Preview: ${answer.substring(0, 150)}...`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.substring(0, 200)}...`);
      }
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Chat Reasoning Tests Complete');
  console.log('='.repeat(80));
}

// Run test
if (require.main === module) {
  testChatReasoning()
    .then(() => {
      console.log('\n✅ All tests completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test execution error:', error);
      process.exit(1);
    });
}

export { testChatReasoning };

