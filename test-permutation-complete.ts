/**
 * COMPLETE PERMUTATION SYSTEM TEST
 * Tests all 11 integrated components with REAL LLM calls
 */

import { PermutationEngine } from './frontend/lib/permutation-engine';
import { ACELLMClient } from './frontend/lib/ace-llm-client';

async function testPermutationSystem() {
  console.log('\n🚀 PERMUTATION SYSTEM - COMPLETE INTEGRATION TEST\n');
  console.log('═'.repeat(80));
  
  // Initialize the engine with ALL components enabled
  const engine = new PermutationEngine({
    enableTeacherModel: true,      // ✅ Perplexity
    enableStudentModel: true,       // ✅ Ollama
    enableMultiQuery: true,         // ✅ 60 variations
    enableReasoningBank: true,      // ✅ Memory retrieval
    enableLoRA: true,               // ✅ Domain fine-tuning
    enableIRT: true,                // ✅ Difficulty assessment
    enableDSPy: true,               // ✅ Prompt optimization
    enableACE: true,                // ✅ Context engineering
    enableSWiRL: true,              // ✅ Multi-step reasoning
    enableTRM: true,                // ✅ Recursive verification
    enableSQL: true                 // ✅ Structured data
  });
  
  // Test queries across different domains
  const testQueries = [
    {
      query: "What's the latest on Bitcoin prices and should I invest now?",
      domain: "crypto",
      expectedComponents: ['Teacher Model', 'LoRA', 'IRT', 'TRM', 'Multi-Query']
    },
    {
      query: "Calculate the ROI for a $10,000 S&P 500 investment over 5 years",
      domain: "financial",
      expectedComponents: ['IRT', 'LoRA', 'SQL Execution', 'DSPy']
    },
    {
      query: "What are the trending discussions on Hacker News today?",
      domain: "general",
      expectedComponents: ['Teacher Model', 'Multi-Query', 'ACE Framework']
    }
  ];
  
  const results: any[] = [];
  
  for (const test of testQueries) {
    console.log(`\n📝 Testing Query: "${test.query}"`);
    console.log(`📊 Expected Domain: ${test.domain}`);
    console.log('─'.repeat(80));
    
    try {
      const startTime = Date.now();
      const result = await engine.execute(test.query, test.domain);
      const duration = Date.now() - startTime;
      
      // Validate results
      const validation = {
        query: test.query,
        domain: test.domain,
        passed: true,
        issues: [] as string[],
        metrics: result.metadata
      };
      
      // Check if answer was generated
      if (!result.answer || result.answer.length < 10) {
        validation.passed = false;
        validation.issues.push('Answer too short or missing');
      }
      
      // Check if expected components were used
      for (const expectedComp of test.expectedComponents) {
        if (!result.metadata.components_used.includes(expectedComp)) {
          validation.passed = false;
          validation.issues.push(`Missing component: ${expectedComp}`);
        }
      }
      
      // Check if IRT was calculated
      if (result.metadata.irt_difficulty === 0) {
        validation.passed = false;
        validation.issues.push('IRT difficulty not calculated');
      }
      
      // Check if LoRA was applied
      if (!result.metadata.lora_applied) {
        validation.passed = false;
        validation.issues.push('LoRA not applied');
      }
      
      // Print results
      console.log(`\n✅ Execution Complete in ${duration}ms`);
      console.log(`\n📊 Components Used (${result.metadata.components_used.length}):`);
      result.metadata.components_used.forEach((comp: string) => {
        console.log(`   ✓ ${comp}`);
      });
      
      console.log(`\n📈 Metrics:`);
      console.log(`   Quality Score: ${result.metadata.quality_score.toFixed(2)}`);
      console.log(`   IRT Difficulty: ${result.metadata.irt_difficulty.toFixed(2)}`);
      console.log(`   Duration: ${result.metadata.duration_ms}ms`);
      console.log(`   Cost: $${result.metadata.cost.toFixed(4)}`);
      console.log(`   Teacher Calls: ${result.metadata.teacher_calls}`);
      console.log(`   Student Calls: ${result.metadata.student_calls}`);
      console.log(`   Playbook Bullets: ${result.metadata.playbook_bullets_used}`);
      console.log(`   Memories Retrieved: ${result.metadata.memories_retrieved}`);
      console.log(`   Queries Generated: ${result.metadata.queries_generated}`);
      console.log(`   SQL Executed: ${result.metadata.sql_executed ? 'Yes' : 'No'}`);
      console.log(`   LoRA Applied: ${result.metadata.lora_applied ? 'Yes' : 'No'}`);
      
      console.log(`\n📝 Answer Preview:`);
      console.log(`   ${result.answer.substring(0, 200)}...`);
      
      if (validation.passed) {
        console.log(`\n✅ VALIDATION PASSED`);
      } else {
        console.log(`\n❌ VALIDATION FAILED`);
        validation.issues.forEach(issue => {
          console.log(`   ❌ ${issue}`);
        });
      }
      
      results.push(validation);
      
    } catch (error: any) {
      console.log(`\n❌ ERROR: ${error.message}`);
      results.push({
        query: test.query,
        domain: test.domain,
        passed: false,
        issues: [error.message],
        metrics: {}
      });
    }
    
    console.log('─'.repeat(80));
  }
  
  // Print summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═'.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const successRate = (passed / results.length) * 100;
  
  console.log(`\nTests Run: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  
  // Component coverage
  const allComponents = new Set<string>();
  results.forEach(r => {
    if (r.metrics?.components_used) {
      r.metrics.components_used.forEach((comp: string) => allComponents.add(comp));
    }
  });
  
  console.log(`\n📦 Components Tested: ${allComponents.size}/11`);
  Array.from(allComponents).sort().forEach(comp => {
    console.log(`   ✓ ${comp}`);
  });
  
  // Performance metrics
  const avgDuration = results.reduce((sum, r) => sum + (r.metrics?.duration_ms || 0), 0) / results.length;
  const avgQuality = results.reduce((sum, r) => sum + (r.metrics?.quality_score || 0), 0) / results.length;
  const totalCost = results.reduce((sum, r) => sum + (r.metrics?.cost || 0), 0);
  
  console.log(`\n⚡ Performance:`);
  console.log(`   Avg Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`   Avg Quality: ${avgQuality.toFixed(2)}`);
  console.log(`   Total Cost: $${totalCost.toFixed(4)}`);
  
  console.log('\n═'.repeat(80));
  
  if (successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED! PERMUTATION SYSTEM FULLY OPERATIONAL! 🎉\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review issues above.\n');
  }
  
  return {
    passed,
    failed,
    successRate,
    components: allComponents.size,
    avgDuration,
    avgQuality,
    totalCost
  };
}

// Run the test
if (require.main === module) {
  testPermutationSystem()
    .then(result => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ TEST SUITE CRASHED:', error);
      process.exit(1);
    });
}

export { testPermutationSystem };

