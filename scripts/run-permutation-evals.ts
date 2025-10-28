#!/usr/bin/env node

import { quickPermutationTest, PermutationTestSuite } from '../frontend/lib/permutation-test-suite';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'quick';

  console.log('🚀 PERMUTATION Evaluation System');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Using Ollama-based OpenEvals instead of OpenAI');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    if (command === 'quick') {
      console.log('Running quick test (3 test cases)...');
      await quickPermutationTest();
    } else if (command === 'full') {
      console.log('Running full test suite (8 test cases)...');
      const testSuite = new PermutationTestSuite();
      const results = await testSuite.runAllTests();
      
      console.log('\n📊 Generating detailed report...');
      const report = testSuite.generateReport(results);
      
      console.log(report);
      
      // Save report to file
      const fs = require('fs');
      const reportPath = `permutation-evaluation-report-${Date.now()}.md`;
      fs.writeFileSync(reportPath, report);
      console.log(`\n📄 Report saved to: ${reportPath}`);
      
    } else if (command === 'single') {
      const testName = args[1];
      if (!testName) {
        console.error('❌ Please specify a test name for single test mode');
        console.log('Available tests: microservices_architecture, ai_research_paper, code_optimization, semiotic_analysis, multi_step_reasoning, creative_synthesis, technical_documentation, error_handling');
        process.exit(1);
      }
      
      console.log(`Running single test: ${testName}`);
      const testSuite = new PermutationTestSuite();
      const testCases = testSuite.getTestCases();
      const testCase = testCases.find(tc => tc.name === testName);
      
      if (!testCase) {
        console.error(`❌ Test case '${testName}' not found`);
        process.exit(1);
      }
      
      const result = await testSuite.runTestCase(testCase);
      
      console.log('\n📊 Test Result:');
      console.log(`Score: ${(result.overallScore * 100).toFixed(1)}%`);
      console.log(`Status: ${result.passed ? 'PASS' : 'FAIL'}`);
      console.log(`Time: ${(result.executionTime / 1000).toFixed(1)}s`);
      
      console.log('\n📝 Evaluation Details:');
      Object.entries(result.evaluations).forEach(([evaluationName, evaluationResult]: [string, any]) => {
        const evaluationScore = typeof evaluationResult.score === 'boolean' ? 
          (evaluationResult.score ? '100%' : '0%') : 
          `${(evaluationResult.score * 100).toFixed(1)}%`;
        console.log(`${evaluationName}: ${evaluationScore}`);
        console.log(`  ${evaluationResult.comment.substring(0, 200)}...`);
      });
      
    } else {
      console.log('Usage:');
      console.log('  npm run eval:quick    - Run quick test (3 cases)');
      console.log('  npm run eval:full     - Run full test suite (8 cases)');
      console.log('  npm run eval:single <test_name> - Run single test');
      console.log('');
      console.log('Available test names:');
      console.log('  microservices_architecture');
      console.log('  ai_research_paper');
      console.log('  code_optimization');
      console.log('  semiotic_analysis');
      console.log('  multi_step_reasoning');
      console.log('  creative_synthesis');
      console.log('  technical_documentation');
      console.log('  error_handling');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
