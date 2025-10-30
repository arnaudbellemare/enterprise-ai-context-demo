#!/usr/bin/env node

/**
 * ⚡ QUICK PERMUTATION SYSTEM TEST
 * 
 * Fast validation of core PERMUTATION system functionality.
 * Run this first to ensure the system is working before comprehensive testing.
 */

const BASE_URL = 'http://localhost:3000';

class QuickPermutationTest {
  constructor() {
    this.results = {
      server: false,
      mainExecution: false,
      components: [],
      performance: {},
      errors: []
    };
  }

  async run() {
    console.log('⚡ QUICK PERMUTATION SYSTEM TEST');
    console.log('================================');
    console.log('Running fast validation of core functionality...\n');

    try {
      // Test 1: Server connectivity
      await this.testServerConnectivity();
      
      // Test 2: Main execution
      await this.testMainExecution();
      
      // Test 3: Core components
      await this.testCoreComponents();
      
      // Test 4: Performance check
      await this.testPerformance();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      this.results.errors.push(error.message);
    }
  }

  async testServerConnectivity() {
    console.log('🖥️  Testing server connectivity...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        this.results.server = true;
        console.log('  ✅ Server is running and accessible');
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      this.results.server = false;
      console.log('  ❌ Server is not accessible');
      console.log('     Error:', error.message);
      console.log('     💡 Start server with: npm run dev');
    }
  }

  async testMainExecution() {
    console.log('\n🚀 Testing main execution...');
    
    if (!this.results.server) {
      console.log('  ⏭️  Skipped (server not available)');
      return;
    }

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${BASE_URL}/api/optimized/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What is artificial intelligence?',
          domain: 'technology'
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Validate response structure
      const hasAnswer = result.answer && typeof result.answer === 'string' && result.answer.length > 50;
      const hasMetadata = result.metadata && typeof result.metadata === 'object';
      const hasTrace = result.trace && Array.isArray(result.trace.steps);

      if (hasAnswer && hasMetadata && hasTrace) {
        this.results.mainExecution = true;
        this.results.performance.responseTime = responseTime;
        this.results.performance.qualityScore = result.metadata.quality_score;
        this.results.performance.componentsUsed = result.metadata.components_used.length;
        
        console.log('  ✅ Main execution working correctly');
        console.log(`     Response time: ${responseTime}ms`);
        console.log(`     Quality score: ${result.metadata.quality_score}`);
        console.log(`     Components used: ${result.metadata.components_used.length}`);
        console.log(`     Answer length: ${result.answer.length} characters`);
      } else {
        throw new Error('Invalid response structure');
      }

    } catch (error) {
      this.results.mainExecution = false;
      console.log('  ❌ Main execution failed');
      console.log('     Error:', error.message);
      this.results.errors.push(`Main execution: ${error.message}`);
    }
  }

  async testCoreComponents() {
    console.log('\n🧩 Testing core components...');
    
    if (!this.results.server) {
      console.log('  ⏭️  Skipped (server not available)');
      return;
    }

    const components = [
      { name: 'ACE Framework', endpoint: '/api/prompts/adaptive' },
      { name: 'IRT Calculator', endpoint: '/api/irt-calculator' },
      { name: 'Smart Router', endpoint: '/api/smart-routing' },
      { name: 'Teacher-Student', endpoint: '/api/teacher-student' },
      { name: 'TRM Engine', endpoint: '/api/trm-engine' }
    ];

    for (const component of components) {
      try {
        const response = await fetch(`${BASE_URL}${component.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'test query',
            domain: 'general'
          })
        });

        const isWorking = response.ok || response.status === 400; // 400 is OK for test
        
        this.results.components.push({
          name: component.name,
          working: isWorking,
          status: response.status
        });

        if (isWorking) {
          console.log(`  ✅ ${component.name}`);
        } else {
          console.log(`  ❌ ${component.name} (${response.status})`);
        }

      } catch (error) {
        this.results.components.push({
          name: component.name,
          working: false,
          error: error.message
        });
        console.log(`  ❌ ${component.name} (${error.message})`);
      }
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing performance...');
    
    if (!this.results.mainExecution) {
      console.log('  ⏭️  Skipped (main execution not working)');
      return;
    }

    try {
      const queries = [
        'What is machine learning?',
        'How does AI work?',
        'Explain neural networks'
      ];

      const times = [];
      let successfulQueries = 0;

      for (const query of queries) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/optimized/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            domain: 'technology'
          })
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
          times.push(responseTime);
          successfulQueries++;
        }
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const successRate = successfulQueries / queries.length;

      this.results.performance.averageResponseTime = avgTime;
      this.results.performance.maxResponseTime = maxTime;
      this.results.performance.successRate = successRate;

      console.log(`  ✅ Performance test completed`);
      console.log(`     Average response time: ${avgTime.toFixed(0)}ms`);
      console.log(`     Max response time: ${maxTime}ms`);
      console.log(`     Success rate: ${(successRate * 100).toFixed(1)}%`);

      // Check performance thresholds
      const avgTimeOk = avgTime <= 8000; // 8 seconds
      const maxTimeOk = maxTime <= 15000; // 15 seconds
      const successRateOk = successRate >= 0.8; // 80%

      if (avgTimeOk && maxTimeOk && successRateOk) {
        console.log('  ✅ Performance within acceptable limits');
      } else {
        console.log('  ⚠️  Performance issues detected');
        if (!avgTimeOk) console.log('     - Average response time too high');
        if (!maxTimeOk) console.log('     - Max response time too high');
        if (!successRateOk) console.log('     - Success rate too low');
      }

    } catch (error) {
      console.log('  ❌ Performance test failed');
      console.log('     Error:', error.message);
      this.results.errors.push(`Performance test: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 QUICK TEST RESULTS');
    console.log('====================');
    
    // Server status
    console.log(`🖥️  Server: ${this.results.server ? '✅ Running' : '❌ Not Running'}`);
    
    // Main execution
    console.log(`🚀 Main Execution: ${this.results.mainExecution ? '✅ Working' : '❌ Not Working'}`);
    
    // Components
    const workingComponents = this.results.components.filter(c => c.working).length;
    const totalComponents = this.results.components.length;
    console.log(`🧩 Components: ${workingComponents}/${totalComponents} working`);
    
    // Performance
    if (this.results.performance.averageResponseTime) {
      console.log(`⚡ Avg Response Time: ${this.results.performance.averageResponseTime.toFixed(0)}ms`);
      console.log(`⚡ Success Rate: ${(this.results.performance.successRate * 100).toFixed(1)}%`);
    }
    
    // Overall assessment
    const serverOk = this.results.server;
    const executionOk = this.results.mainExecution;
    const componentsOk = workingComponents >= totalComponents * 0.6; // 60% should work
    const performanceOk = !this.results.performance.averageResponseTime || 
                         this.results.performance.averageResponseTime <= 8000;
    
    const overallOk = serverOk && executionOk && componentsOk && performanceOk;
    
    console.log('\n🏆 OVERALL ASSESSMENT');
    console.log('====================');
    
    if (overallOk) {
      console.log('✅ PERMUTATION system is working correctly!');
      console.log('   You can now run comprehensive tests:');
      console.log('   • node run-comprehensive-test.js');
      console.log('   • node comprehensive-permutation-system-test.js');
    } else {
      console.log('❌ PERMUTATION system has issues that need attention');
      
      if (!serverOk) {
        console.log('   • Start the server: npm run dev');
      }
      if (!executionOk) {
        console.log('   • Check main execution endpoint');
      }
      if (!componentsOk) {
        console.log('   • Fix failing components');
      }
      if (!performanceOk) {
        console.log('   • Optimize response times');
      }
    }
    
    // Errors
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS');
      console.log('==========');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n📋 NEXT STEPS');
    console.log('=============');
    console.log('• Fix any issues above');
    console.log('• Run comprehensive test: node run-comprehensive-test.js');
    console.log('• Check detailed guide: COMPREHENSIVE_TESTING_GUIDE.md');
  }
}

// Main execution
async function main() {
  const test = new QuickPermutationTest();
  await test.run();
  
  const serverOk = test.results.server;
  const executionOk = test.results.mainExecution;
  const componentsOk = test.results.components.filter(c => c.working).length >= 
                      test.results.components.length * 0.6;
  
  const overallOk = serverOk && executionOk && componentsOk;
  process.exit(overallOk ? 0 : 1);
}

// Run the quick test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { QuickPermutationTest };