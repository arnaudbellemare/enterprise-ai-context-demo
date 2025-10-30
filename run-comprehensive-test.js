#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE PERMUTATION TEST RUNNER
 * 
 * This script runs the comprehensive PERMUTATION system test with various configurations
 * and provides detailed reporting and analysis.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testConfigs = {
      quick: {
        name: 'Quick Test',
        description: 'Fast validation of core functionality',
        timeout: 60000, // 1 minute
        parallel: 2,
        domains: ['general', 'technology'],
        queryTypes: ['simple', 'complex']
      },
      standard: {
        name: 'Standard Test',
        description: 'Full system validation with all components',
        timeout: 300000, // 5 minutes
        parallel: 3,
        domains: ['general', 'technology', 'financial', 'healthcare'],
        queryTypes: ['simple', 'complex', 'realtime', 'multistep']
      },
      comprehensive: {
        name: 'Comprehensive Test',
        description: 'Complete validation of all capabilities and edge cases',
        timeout: 600000, // 10 minutes
        parallel: 5,
        domains: ['general', 'technology', 'financial', 'healthcare', 'crypto', 'legal', 'real_estate'],
        queryTypes: ['simple', 'complex', 'realtime', 'multistep', 'edgecases']
      },
      performance: {
        name: 'Performance Test',
        description: 'Focus on performance, scalability, and stress testing',
        timeout: 900000, // 15 minutes
        parallel: 10,
        domains: ['general'],
        queryTypes: ['simple', 'complex'],
        focus: 'performance'
      },
      integration: {
        name: 'Integration Test',
        description: 'Test component integration and data flow',
        timeout: 300000, // 5 minutes
        parallel: 2,
        domains: ['general', 'technology'],
        queryTypes: ['complex', 'multistep'],
        focus: 'integration'
      }
    };
  }

  async runTest(configName = 'standard') {
    const config = this.testConfigs[configName];
    
    if (!config) {
      console.error(`❌ Unknown test configuration: ${configName}`);
      console.log('Available configurations:', Object.keys(this.testConfigs).join(', '));
      process.exit(1);
    }

    console.log(`🚀 Running ${config.name}`);
    console.log(`📝 ${config.description}`);
    console.log(`⏱️ Timeout: ${config.timeout / 1000}s`);
    console.log(`🔄 Parallel: ${config.parallel}`);
    console.log(`🌐 Domains: ${config.domains.join(', ')}`);
    console.log(`📋 Query Types: ${config.queryTypes.join(', ')}`);
    console.log('');

    // Set environment variables for the test
    const env = {
      ...process.env,
      TEST_TIMEOUT: config.timeout.toString(),
      TEST_PARALLEL: config.parallel.toString(),
      TEST_DOMAINS: config.domains.join(','),
      TEST_QUERY_TYPES: config.queryTypes.join(','),
      TEST_FOCUS: config.focus || 'all'
    };

    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['comprehensive-permutation-system-test.js'], {
        env,
        stdio: 'inherit'
      });

      const timeout = setTimeout(() => {
        testProcess.kill('SIGTERM');
        reject(new Error(`Test timed out after ${config.timeout / 1000} seconds`));
      }, config.timeout);

      testProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve({ success: true, config: configName });
        } else {
          reject(new Error(`Test failed with exit code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async runAllTests() {
    console.log('🎯 RUNNING ALL PERMUTATION SYSTEM TESTS');
    console.log('=======================================');
    console.log('This will run multiple test configurations to thoroughly validate the system.\n');

    const results = {};
    const startTime = Date.now();

    for (const [configName, config] of Object.entries(this.testConfigs)) {
      console.log(`\n🔄 Starting ${config.name}...`);
      console.log('='.repeat(50));
      
      try {
        const result = await this.runTest(configName);
        results[configName] = { success: true, config };
        console.log(`✅ ${config.name} completed successfully`);
      } catch (error) {
        results[configName] = { success: false, error: error.message, config };
        console.log(`❌ ${config.name} failed: ${error.message}`);
      }
    }

    const totalTime = Date.now() - startTime;
    this.generateSummaryReport(results, totalTime);
  }

  generateSummaryReport(results, totalTime) {
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('==============================');
    
    const successful = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    const successRate = (successful / total) * 100;

    console.log(`📈 Overall Success Rate: ${successful}/${total} (${successRate.toFixed(1)}%)`);
    console.log(`⏱️ Total Execution Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log('');

    // Individual test results
    console.log('📋 Individual Test Results:');
    Object.entries(results).forEach(([configName, result]) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const error = result.error ? ` - ${result.error}` : '';
      console.log(`  ${configName}: ${status}${error}`);
    });

    // Performance analysis
    console.log('\n⚡ Performance Analysis:');
    this.analyzePerformance(results);

    // Recommendations
    console.log('\n💡 Recommendations:');
    this.generateRecommendations(results);

    // Save detailed report
    this.saveDetailedReport(results, totalTime);
  }

  analyzePerformance(results) {
    const performanceResults = results.performance;
    if (performanceResults && performanceResults.success) {
      console.log('  Performance test passed - system handles load well');
    } else {
      console.log('  Performance test failed - system may have scalability issues');
    }

    const integrationResults = results.integration;
    if (integrationResults && integrationResults.success) {
      console.log('  Integration test passed - components work well together');
    } else {
      console.log('  Integration test failed - component integration needs attention');
    }
  }

  generateRecommendations(results) {
    const failedTests = Object.entries(results).filter(([_, result]) => !result.success);
    
    if (failedTests.length === 0) {
      console.log('  🎉 All tests passed! System is ready for production.');
      return;
    }

    console.log('  Based on test results:');
    
    if (results.quick && !results.quick.success) {
      console.log('  - Fix core functionality issues before proceeding');
    }
    
    if (results.performance && !results.performance.success) {
      console.log('  - Address performance and scalability concerns');
    }
    
    if (results.integration && !results.integration.success) {
      console.log('  - Improve component integration and data flow');
    }
    
    if (results.comprehensive && !results.comprehensive.success) {
      console.log('  - Review edge cases and error handling');
    }
  }

  saveDetailedReport(results, totalTime) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalConfigurations: Object.keys(results).length,
        successfulConfigurations: Object.values(results).filter(r => r.success).length,
        successRate: (Object.values(results).filter(r => r.success).length / Object.keys(results).length) * 100,
        totalExecutionTime: totalTime
      },
      results: results,
      recommendations: this.generateDetailedRecommendations(results)
    };

    const filename = `comprehensive-test-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${filename}`);
  }

  generateDetailedRecommendations(results) {
    const recommendations = [];
    
    Object.entries(results).forEach(([configName, result]) => {
      if (!result.success) {
        recommendations.push({
          configuration: configName,
          issue: result.error || 'Test failed',
          priority: this.getPriority(configName),
          suggestedAction: this.getSuggestedAction(configName)
        });
      }
    });

    return recommendations;
  }

  getPriority(configName) {
    const priorities = {
      quick: 'HIGH',
      standard: 'HIGH',
      comprehensive: 'MEDIUM',
      performance: 'MEDIUM',
      integration: 'LOW'
    };
    return priorities[configName] || 'LOW';
  }

  getSuggestedAction(configName) {
    const actions = {
      quick: 'Fix core functionality issues immediately',
      standard: 'Address system-wide problems before deployment',
      comprehensive: 'Review edge cases and improve error handling',
      performance: 'Optimize system performance and scalability',
      integration: 'Improve component integration and data flow'
    };
    return actions[configName] || 'Review and fix issues';
  }

  showHelp() {
    console.log('🚀 PERMUTATION System Test Runner');
    console.log('==================================');
    console.log('');
    console.log('Usage:');
    console.log('  node run-comprehensive-test.js [config]');
    console.log('');
    console.log('Available configurations:');
    Object.entries(this.testConfigs).forEach(([name, config]) => {
      console.log(`  ${name.padEnd(15)} - ${config.description}`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  node run-comprehensive-test.js quick          # Quick validation');
    console.log('  node run-comprehensive-test.js standard       # Full system test');
    console.log('  node run-comprehensive-test.js comprehensive  # Complete validation');
    console.log('  node run-comprehensive-test.js performance    # Performance focus');
    console.log('  node run-comprehensive-test.js integration    # Integration focus');
    console.log('  node run-comprehensive-test.js all            # Run all configurations');
  }
}

// Main execution
async function main() {
  const runner = new TestRunner();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    runner.showHelp();
    return;
  }

  const config = args[0];
  
  if (config === 'all') {
    await runner.runAllTests();
  } else {
    try {
      await runner.runTest(config);
      console.log('\n🎉 Test completed successfully!');
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestRunner;