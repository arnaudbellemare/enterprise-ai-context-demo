#!/usr/bin/env node

/**
 * 🔍 PERMUTATION SYSTEM VALIDATION
 * 
 * Quick validation script to check if the PERMUTATION system is ready
 * for comprehensive testing.
 */

const BASE_URL = 'http://localhost:3000';

class PermutationSystemValidator {
  constructor() {
    this.results = {
      serverStatus: false,
      endpoints: {},
      components: {},
      overall: false
    };
  }

  async validate() {
    console.log('🔍 PERMUTATION SYSTEM VALIDATION');
    console.log('=================================');
    console.log('Checking if PERMUTATION system is ready for comprehensive testing...\n');

    try {
      // Check server status
      await this.checkServerStatus();
      
      // Check critical endpoints
      await this.checkCriticalEndpoints();
      
      // Check component availability
      await this.checkComponentAvailability();
      
      // Generate validation report
      this.generateValidationReport();
      
      return this.results.overall;
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return false;
    }
  }

  async checkServerStatus() {
    console.log('🖥️  Checking server status...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        this.results.serverStatus = true;
        console.log('  ✅ Server is running and accessible');
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      this.results.serverStatus = false;
      console.log('  ❌ Server is not accessible');
      console.log('     Error:', error.message);
      console.log('     💡 Please start the server with: npm run dev');
    }
  }

  async checkCriticalEndpoints() {
    console.log('\n🔗 Checking critical endpoints...');
    
    const criticalEndpoints = [
      { name: 'Main Execution', path: '/api/optimized/execute', method: 'POST' },
      { name: 'ACE Framework', path: '/api/prompts/adaptive', method: 'POST' },
      { name: 'IRT Calculator', path: '/api/irt-calculator', method: 'POST' },
      { name: 'Smart Router', path: '/api/smart-routing', method: 'POST' }
    ];

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: 'test query', 
            domain: 'general' 
          })
        });

        this.results.endpoints[endpoint.name] = {
          available: response.ok || response.status === 400, // 400 is OK for test
          status: response.status,
          error: null
        };

        if (this.results.endpoints[endpoint.name].available) {
          console.log(`  ✅ ${endpoint.name} (${response.status})`);
        } else {
          console.log(`  ❌ ${endpoint.name} (${response.status})`);
        }
      } catch (error) {
        this.results.endpoints[endpoint.name] = {
          available: false,
          status: 0,
          error: error.message
        };
        console.log(`  ❌ ${endpoint.name} (${error.message})`);
      }
    }
  }

  async checkComponentAvailability() {
    console.log('\n🧩 Checking component availability...');
    
    // Test main execution endpoint with a simple query
    try {
      const response = await fetch(`${BASE_URL}/api/optimized/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What is artificial intelligence?',
          domain: 'technology'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check if response has expected structure
        const hasAnswer = result.answer && typeof result.answer === 'string';
        const hasMetadata = result.metadata && typeof result.metadata === 'object';
        const hasTrace = result.trace && Array.isArray(result.trace.steps);
        
        this.results.components = {
          mainExecution: true,
          responseStructure: hasAnswer && hasMetadata && hasTrace,
          answerLength: result.answer ? result.answer.length : 0,
          componentsUsed: result.metadata ? result.metadata.components_used : [],
          qualityScore: result.metadata ? result.metadata.quality_score : 0
        };

        if (this.results.components.responseStructure) {
          console.log('  ✅ Main execution working correctly');
          console.log(`     Answer length: ${this.results.components.answerLength} characters`);
          console.log(`     Components used: ${this.results.components.componentsUsed.length}`);
          console.log(`     Quality score: ${this.results.components.qualityScore}`);
        } else {
          console.log('  ⚠️  Main execution working but response structure incomplete');
        }
      } else {
        this.results.components = { mainExecution: false };
        console.log('  ❌ Main execution failed');
      }
    } catch (error) {
      this.results.components = { mainExecution: false, error: error.message };
      console.log('  ❌ Main execution error:', error.message);
    }
  }

  generateValidationReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('===================');
    
    // Server status
    console.log(`🖥️  Server Status: ${this.results.serverStatus ? '✅ Running' : '❌ Not Running'}`);
    
    // Endpoint status
    const availableEndpoints = Object.values(this.results.endpoints).filter(e => e.available).length;
    const totalEndpoints = Object.keys(this.results.endpoints).length;
    console.log(`🔗 Endpoints: ${availableEndpoints}/${totalEndpoints} available`);
    
    // Component status
    if (this.results.components.mainExecution) {
      console.log('🧩 Components: ✅ Main execution working');
    } else {
      console.log('🧩 Components: ❌ Main execution not working');
    }
    
    // Overall assessment
    const serverOk = this.results.serverStatus;
    const endpointsOk = availableEndpoints >= totalEndpoints * 0.75; // 75% should be available
    const componentsOk = this.results.components.mainExecution;
    
    this.results.overall = serverOk && endpointsOk && componentsOk;
    
    console.log('\n🏆 OVERALL ASSESSMENT');
    console.log('====================');
    
    if (this.results.overall) {
      console.log('✅ PERMUTATION system is ready for comprehensive testing!');
      console.log('   You can now run: node run-comprehensive-test.js');
    } else {
      console.log('❌ PERMUTATION system is not ready for comprehensive testing');
      console.log('   Please address the issues above before running the full test suite');
      
      if (!serverOk) {
        console.log('   • Start the server: npm run dev');
      }
      if (!endpointsOk) {
        console.log('   • Check endpoint implementations');
      }
      if (!componentsOk) {
        console.log('   • Verify component integration');
      }
    }
    
    console.log('\n📋 QUICK FIXES');
    console.log('==============');
    console.log('• Start server: npm run dev');
    console.log('• Check logs: tail -f logs/app.log');
    console.log('• Test single endpoint: curl -X POST http://localhost:3000/api/optimized/execute -H "Content-Type: application/json" -d \'{"query":"test","domain":"general"}\'');
    console.log('• Run comprehensive test: node run-comprehensive-test.js');
  }
}

// Main execution
async function main() {
  const validator = new PermutationSystemValidator();
  const isValid = await validator.validate();
  
  process.exit(isValid ? 0 : 1);
}

// Run the validator
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PermutationSystemValidator };