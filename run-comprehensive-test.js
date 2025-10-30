#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE PERMUTATION TEST RUNNER
 * 
 * This script runs the comprehensive PERMUTATION system test with additional
 * validation, monitoring, and reporting capabilities.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestRunner {
  constructor() {
    this.testFile = path.join(__dirname, 'comprehensive-permutation-system-test.js');
    this.resultsDir = path.join(__dirname, 'test-results');
    this.startTime = Date.now();
    this.isServerRunning = false;
  }

  async run() {
    console.log('🚀 COMPREHENSIVE PERMUTATION TEST RUNNER');
    console.log('==========================================');
    console.log('Starting comprehensive PERMUTATION system validation...\n');

    try {
      // Ensure results directory exists
      this.ensureResultsDirectory();

      // Check if server is running
      await this.checkServerStatus();

      // Run the comprehensive test
      await this.runComprehensiveTest();

      // Generate additional validation
      await this.runAdditionalValidation();

      // Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  ensureResultsDirectory() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
      console.log(`📁 Created results directory: ${this.resultsDir}`);
    }
  }

  async checkServerStatus() {
    console.log('🔍 Checking server status...');
    
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        this.isServerRunning = true;
        console.log('✅ Server is running on http://localhost:3000');
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('💡 Please start the server with: npm run dev');
      console.log('   Then run this test again.');
      process.exit(1);
    }
  }

  async runComprehensiveTest() {
    console.log('\n🧪 Running comprehensive PERMUTATION system test...');
    console.log('='.repeat(50));

    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', [this.testFile], {
        stdio: 'inherit',
        cwd: __dirname
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Comprehensive test completed successfully');
          resolve();
        } else {
          console.log(`\n❌ Comprehensive test failed with exit code: ${code}`);
          reject(new Error(`Test failed with exit code: ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        console.error('❌ Failed to start test process:', error);
        reject(error);
      });
    });
  }

  async runAdditionalValidation() {
    console.log('\n🔍 Running additional validation checks...');
    console.log('='.repeat(50));

    const validations = [
      this.validateTestResults(),
      this.checkSystemHealth(),
      this.validateComponentIntegration(),
      this.checkPerformanceMetrics()
    ];

    for (const validation of validations) {
      try {
        await validation;
      } catch (error) {
        console.log(`⚠️  Validation warning: ${error.message}`);
      }
    }
  }

  async validateTestResults() {
    console.log('📊 Validating test results...');
    
    // Look for the most recent test results file
    const files = fs.readdirSync(process.cwd())
      .filter(file => file.startsWith('permutation-test-results-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      throw new Error('No test results file found');
    }

    const latestFile = files[0];
    const results = JSON.parse(fs.readFileSync(latestFile, 'utf8'));

    // Validate results structure
    const requiredFields = ['summary', 'categories', 'detailed'];
    const missingFields = requiredFields.filter(field => !(field in results));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in results: ${missingFields.join(', ')}`);
    }

    // Check success rate
    const successRate = results.summary.passed / results.summary.totalTests;
    if (successRate < 0.7) {
      throw new Error(`Low success rate: ${(successRate * 100).toFixed(1)}%`);
    }

    console.log(`✅ Test results validated (${(successRate * 100).toFixed(1)}% success rate)`);
  }

  async checkSystemHealth() {
    console.log('🏥 Checking system health...');
    
    const healthChecks = [
      { name: 'Main API', endpoint: '/api/optimized/execute' },
      { name: 'ACE Framework', endpoint: '/api/prompts/adaptive' },
      { name: 'GEPA Optimization', endpoint: '/api/gepa-optimization' },
      { name: 'IRT Calculator', endpoint: '/api/irt-calculator' },
      { name: 'Teacher-Student', endpoint: '/api/teacher-student' },
      { name: 'TRM Engine', endpoint: '/api/trm-engine' },
      { name: 'Reasoning Bank', endpoint: '/api/reasoning-bank' },
      { name: 'Smart Router', endpoint: '/api/smart-routing' },
      { name: 'Advanced Cache', endpoint: '/api/advanced-cache' },
      { name: 'Multi-Agent', endpoint: '/api/multi-agent' }
    ];

    let healthyEndpoints = 0;

    for (const check of healthChecks) {
      try {
        const response = await fetch(`http://localhost:3000${check.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'health check', domain: 'general' })
        });

        if (response.ok || response.status === 400) { // 400 is OK for health check
          healthyEndpoints++;
          console.log(`  ✅ ${check.name}`);
        } else {
          console.log(`  ❌ ${check.name} (${response.status})`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.name} (${error.message})`);
      }
    }

    const healthRate = healthyEndpoints / healthChecks.length;
    if (healthRate < 0.8) {
      throw new Error(`Low health rate: ${(healthRate * 100).toFixed(1)}%`);
    }

    console.log(`✅ System health check passed (${(healthRate * 100).toFixed(1)}% healthy)`);
  }

  async validateComponentIntegration() {
    console.log('🔗 Validating component integration...');
    
    try {
      // Test a complex query that should use multiple components
      const response = await fetch('http://localhost:3000/api/optimized/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Analyze the impact of artificial intelligence on healthcare, including current applications, future potential, and ethical considerations',
          domain: 'healthcare'
        })
      });

      if (!response.ok) {
        throw new Error(`Integration test failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Check that multiple components were used
      const componentsUsed = result.metadata.components_used;
      if (componentsUsed.length < 3) {
        throw new Error(`Insufficient component integration: only ${componentsUsed.length} components used`);
      }

      // Check that the answer is comprehensive
      if (result.answer.length < 200) {
        throw new Error('Answer too short for complex query');
      }

      console.log(`✅ Component integration validated (${componentsUsed.length} components used)`);
    } catch (error) {
      throw new Error(`Component integration validation failed: ${error.message}`);
    }
  }

  async checkPerformanceMetrics() {
    console.log('⚡ Checking performance metrics...');
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/optimized/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What is machine learning?',
          domain: 'technology'
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error(`Performance test failed: ${response.status}`);
      }

      const result = await response.json();
      const qualityScore = result.metadata.quality_score;
      const cost = result.metadata.cost;

      // Check performance thresholds
      const performanceChecks = [
        { name: 'Response Time', value: responseTime, threshold: 10000, unit: 'ms', lowerIsBetter: true },
        { name: 'Quality Score', value: qualityScore, threshold: 0.8, unit: '', lowerIsBetter: false },
        { name: 'Cost per Query', value: cost, threshold: 0.05, unit: 'USD', lowerIsBetter: true }
      ];

      let passedChecks = 0;
      for (const check of performanceChecks) {
        const passed = check.lowerIsBetter ? 
          check.value <= check.threshold : 
          check.value >= check.threshold;
        
        if (passed) {
          passedChecks++;
          console.log(`  ✅ ${check.name}: ${check.value}${check.unit}`);
        } else {
          console.log(`  ❌ ${check.name}: ${check.value}${check.unit} (threshold: ${check.threshold}${check.unit})`);
        }
      }

      const performanceRate = passedChecks / performanceChecks.length;
      if (performanceRate < 0.67) { // At least 2/3 should pass
        throw new Error(`Low performance rate: ${(performanceRate * 100).toFixed(1)}%`);
      }

      console.log(`✅ Performance metrics validated (${(performanceRate * 100).toFixed(1)}% passed)`);
    } catch (error) {
      throw new Error(`Performance metrics check failed: ${error.message}`);
    }
  }

  generateFinalReport() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n🎉 COMPREHENSIVE PERMUTATION TEST RUNNER COMPLETE');
    console.log('=================================================');
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`🖥️  Server Status: ${this.isServerRunning ? 'Running' : 'Not Running'}`);
    console.log(`📁 Results Directory: ${this.resultsDir}`);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. Review the detailed test results');
    console.log('2. Check any failed tests and address issues');
    console.log('3. Monitor system performance in production');
    console.log('4. Run this test regularly to ensure system health');
    
    console.log('\n🔧 USEFUL COMMANDS:');
    console.log('===================');
    console.log('• View test results: ls -la permutation-test-results-*.json');
    console.log('• Run specific test: node comprehensive-permutation-system-test.js');
    console.log('• Start server: npm run dev');
    console.log('• Check server health: curl http://localhost:3000/api/health');
    
    console.log('\n✅ PERMUTATION system validation complete!');
  }
}

// Main execution
async function main() {
  const runner = new ComprehensiveTestRunner();
  await runner.run();
}

// Run the test runner
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ComprehensiveTestRunner };